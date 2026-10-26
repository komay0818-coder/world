(function(root,factory){
'use strict';
const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.AccountSessionController=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const contract=root?.AccountApiContract||(typeof require==='function'?require('./account-api-contract.js'):null);if(!contract)throw Error('帳號 API 契約尚未載入');
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LORN_DEV_PROJECT_REF='iluizanzirwapoxiaxly';
const TRUSTED_API_ORIGINS=new Set(['https://lorn-api-dev.onrender.com','http://127.0.0.1:3000','http://localhost:3000']);
const issuedVerifications=new WeakMap();
function userError(message,code){const error=Error(message);error.userMessage=message;if(code)error.code=code;return error;}
function validateConfig(input,{expectedApiBaseUrl}={}){
 contract.validateServer(input);
 if(input?.environment!=='dev')throw Error('帳號功能只允許使用開發環境');
 const ref=String(input.expectedProjectRef||'').trim();if(ref!==LORN_DEV_PROJECT_REF)throw Error('lorn-dev 專案識別不正確');
 const supabaseUrl=new URL(String(input.supabaseUrl||''));if(supabaseUrl.protocol!=='https:'||supabaseUrl.hostname!==ref+'.supabase.co'||supabaseUrl.pathname!=='/'||supabaseUrl.username||supabaseUrl.password)throw Error('Supabase URL 與 lorn-dev 專案不一致');
 const publishableKey=String(input.publishableKey||'');if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)||/service[_-]?role/i.test(publishableKey))throw Error('前端 Publishable Key 設定不正確');
 const api=new URL(String(input.apiBaseUrl||''));if(!TRUSTED_API_ORIGINS.has(api.origin)||api.username||api.password||api.pathname!=='/'||api.search||api.hash)throw Error('開發 API 來源不在允許清單');
 if(expectedApiBaseUrl&&api.origin!==new URL(String(expectedApiBaseUrl)).origin)throw Error('公開設定回報的 API 來源不一致');
 return {environment:'dev',expectedProjectRef:ref,supabaseUrl:supabaseUrl.origin,publishableKey,apiBaseUrl:api.origin,apiContractVersion:input.apiContractVersion,apiCapabilities:[...input.apiCapabilities]};
}
async function responseJson(response,label){try{return await response.json();}catch{throw userError(label+'回傳格式不正確。');}}
function create(options){
 const auth=options.supabaseClient?.auth,fetcher=options.fetcher||fetch,view=options.view,schedule=options.schedule||((fn)=>setTimeout(fn,0));if(!auth||!view)throw Error('帳號 Session 控制器缺少必要依賴');let controllerApi;
 const apiBaseUrl=options.apiBaseUrl,emailConfirmationRedirectTo=options.emailConfirmationRedirectTo,passwordResetRedirectTo=options.passwordResetRedirectTo,passwordRecoveryRequested=Boolean(options.passwordRecoveryRequested),lifecycleListeners=new Set();let generation=0,inFlight=null,lastVerified=null,activeVerification=null,subscription=null,recoverySession=null;
 const setViewState=(state,message,messageState='info')=>{
  if(typeof view.setAuthState==='function')view.setAuthState(state,{message,messageState});
  else if(message!==undefined)view.announce(message,messageState);
 };
 const current=()=>generation;
 const ensureCurrent=value=>{if(value!==generation){const error=Error('STALE_AUTH_RESULT');error.stale=true;throw error;}};
 const emitLifecycle=(type,detail={})=>{const event=Object.freeze({type,generation,...detail});for(const listener of lifecycleListeners){try{listener(event);}catch(error){schedule(()=>{throw error;});}}return event;};
 const isCurrent=verification=>Boolean(verification&&activeVerification===verification&&verification.generation===generation&&verification.isCurrent());
 function subscribeLifecycle(listener,{replay=true}={}){if(typeof listener!=='function')throw Error('登入生命週期監聽器格式不正確');lifecycleListeners.add(listener);if(replay&&activeVerification?.isCurrent())listener(Object.freeze({type:'authenticated',generation,verification:activeVerification,replayed:true}));return ()=>lifecycleListeners.delete(listener);}
 async function accountRequest(path,method,token){
  contract.assertAllowed(path,method);
  let response;try{response=await fetcher(apiBaseUrl+path,{method,headers:{authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(15000)});}catch{throw userError('目前無法連接帳號伺服器，角色系統尚未啟動。','verification-unavailable');}
  if(!response.ok)throw userError(response.status===401?'登入狀態已失效，請重新登入。':'帳號伺服器驗證失敗，角色系統尚未啟動。',response.status===401?'invalid-session':'verification-unavailable');
  const body=await responseJson(response,'帳號伺服器');if(!UUID_PATTERN.test(String(body?.account?.authUserId||'')))throw userError('帳號伺服器回傳的身分不正確。');return {status:response.status,account:body.account};
 }
 async function requestApi(verification,path,{method='GET',body}={}){
  if(!isCurrent(verification)||lastVerified?.result!==verification||!lastVerified.token)throw userError('登入驗證已失效，雲端存檔操作已停止。','invalid-session');
  contract.assertAllowed(path,method);
  const attempt=generation,token=lastVerified.token;let response;
  try{response=await fetcher(apiBaseUrl+path,{method,headers:{authorization:'Bearer '+token,...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw userError('目前無法連接雲端存檔伺服器。','cloud-unavailable');}
  ensureCurrent(attempt);if(!isCurrent(verification))throw userError('登入驗證已失效，雲端存檔操作已停止。','invalid-session');
  const payload=await responseJson(response,'雲端存檔伺服器');ensureCurrent(attempt);return {status:response.status,ok:response.ok,body:payload};
 }
 function invalidate(reason='invalidated'){
  const previous=activeVerification;generation++;inFlight=null;lastVerified=null;activeVerification=null;
  if(previous)emitLifecycle('invalidated',{reason,verification:previous});
 }
 async function verifySession(session){
  const token=session?.access_token;if(!token)throw userError('尚未取得有效登入狀態。');
   if(lastVerified?.token===token&&isCurrent(lastVerified.result))return lastVerified.result;if(inFlight?.token===token)return inFlight.promise;
   const previous=activeVerification,attempt=++generation;
  const promise=(async()=>{
   const verified=await auth.getUser(token);ensureCurrent(attempt);if(verified.error||!UUID_PATTERN.test(String(verified.data?.user?.id||'')))throw userError('Supabase 登入驗證失敗，請重新登入。','invalid-session');
   const userId=verified.data.user.id.toLowerCase();
   const initialized=await accountRequest('/v1/account/initialize','POST',token);ensureCurrent(attempt);if(![200,201].includes(initialized.status))throw userError('帳號初始化失敗。');
   const found=await accountRequest('/v1/account','GET',token);ensureCurrent(attempt);
    if(initialized.account.authUserId.toLowerCase()!==userId||found.account.authUserId.toLowerCase()!==userId||initialized.account.id!==found.account.id)throw userError('後端帳號與 Supabase 登入身分不一致。');
    let result;result=Object.freeze({kind:'lorn-auth-verification-v1',generation:attempt,userId,account:Object.freeze({...found.account}),initializeStatus:initialized.status,isCurrent:()=>activeVerification===result&&generation===attempt});issuedVerifications.set(result,controllerApi);
    ensureCurrent(attempt);if(previous&&previous.userId!==userId)emitLifecycle('invalidated',{reason:'account-changed',verification:previous});
    activeVerification=result;lastVerified={token,result};setViewState('authenticated','帳號驗證成功，正在啟動角色系統…','success');emitLifecycle(previous?.userId===userId?'refreshed':'authenticated',{verification:result});return result;
  })();
   inFlight={token,promise};try{return await promise;}catch(error){if(!error?.stale&&generation===attempt)invalidate(error?.code||'verification-failed');throw error;}finally{if(inFlight?.promise===promise)inFlight=null;}
 }
 async function register({email,password}){
  invalidate('registration-started');if(!emailConfirmationRedirectTo)throw userError('電子郵件驗證網址尚未設定。');const result=await auth.signUp({email,password,options:{emailRedirectTo:emailConfirmationRedirectTo}});if(result.error)throw userError(result.error.message||'建立帳號失敗。');
  if(result.data?.session)return verifySession(result.data.session);view.announce('帳號已建立，請先完成電子郵件驗證後再登入。','success');return {confirmationRequired:true};
 }
 async function login({email,password}){invalidate('login-started');const result=await auth.signInWithPassword({email,password});if(result.error||!result.data?.session)throw userError('電子郵件或密碼不正確。');return verifySession(result.data.session);}
 async function logout(){
  if(typeof auth.signOut!=='function')throw userError('Supabase 登出功能無法使用。');
  setViewState('checking','正在安全登出…');const result=await auth.signOut();
  if(result?.error){setViewState(activeVerification?'authenticated':'anonymous','登出失敗，請稍後再試。','error');throw userError('登出失敗，請稍後再試。');}
  invalidate('signed-out');setViewState('anonymous','登入狀態已結束，請重新登入。');return {signedOut:true};
 }
 async function forgotPassword({email}){if(!email)throw userError('請先輸入電子郵件。');if(!passwordResetRedirectTo)throw userError('密碼重設網址尚未設定。');const result=await auth.resetPasswordForEmail(email,{redirectTo:passwordResetRedirectTo});if(result.error)throw userError('無法寄送密碼重設信，請稍後再試。');view.announce('密碼重設信已寄出，請檢查電子郵件。','success');}
 function enterPasswordRecovery(session){
  if(!session?.access_token){recoverySession=null;setViewState('anonymous','密碼重設連結已失效，請重新申請。','error');return null;}
  if(activeVerification||lastVerified)invalidate('password-recovery');recoverySession=session;view.showPasswordReset?.('身分已確認，請設定新的登入密碼。');return session;
 }
 async function completePasswordReset({password}){
  if(!recoverySession?.access_token)throw userError('密碼重設連結已失效，請重新申請。','invalid-session');
  const result=await auth.updateUser({password});if(result?.error)throw userError('密碼更新失敗，請重新開啟重設連結。');
  recoverySession=null;const signedOut=await auth.signOut();if(signedOut?.error)throw userError('密碼已更新，請關閉此頁後重新登入。');invalidate('password-reset-complete');setViewState('anonymous','密碼已更新，請使用新密碼登入。','success');return {updated:true};
 }
 async function cancelPasswordReset(){recoverySession=null;await auth.signOut();invalidate('password-reset-cancelled');setViewState('anonymous','已取消密碼重設，請重新登入。');return {cancelled:true};}
 function handleFailure(error){
  if(error?.stale)return;
   invalidate(error?.code||'verification-failed');
  if(error?.code==='verification-unavailable')setViewState('checking',error.userMessage||'帳號驗證暫時無法完成，請稍後重試。','error');
  else setViewState('anonymous',error?.userMessage||'登入驗證失敗，請重新登入。','error');
 }
 async function restore(){
  setViewState('checking','正在檢查登入狀態…');
  const result=await auth.getSession();if(result.error)throw userError('無法恢復登入狀態。','verification-unavailable');
   if(passwordRecoveryRequested){if(result.data?.session)return enterPasswordRecovery(result.data.session);setViewState('anonymous','密碼重設連結已失效，請重新申請。','error');return null;}
   if(!result.data?.session){invalidate('missing-session');setViewState('anonymous','請登入帳號。');return null;}
  return verifySession(result.data.session);
 }
 function start(){
  setViewState('checking','正在檢查登入狀態…');
  const listener=auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'){invalidate('signed-out');setViewState('anonymous','登入狀態已結束，請重新登入。','error');return;}
    if(event==='PASSWORD_RECOVERY'){enterPasswordRecovery(session);return;}
    if(passwordRecoveryRequested){if((event==='INITIAL_SESSION'||event==='SIGNED_IN')&&session)enterPasswordRecovery(session);else if(event==='TOKEN_REFRESHED'&&session)recoverySession=session;return;}
    if(event==='INITIAL_SESSION'&&!session){if(!inFlight&&!lastVerified){invalidate('missing-session');setViewState('anonymous','請登入帳號。');}return;}
   if((event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'||event==='SIGNED_IN')&&session)schedule(()=>verifySession(session).catch(handleFailure));
  });
  subscription=listener.data?.subscription||null;return restore().catch(error=>{handleFailure(error);return null;});
 }
 function stop(){invalidate('controller-stopped');subscription?.unsubscribe?.();subscription=null;lifecycleListeners.clear();}
 controllerApi={start,stop,register,login,logout,forgotPassword,completePasswordReset,cancelPasswordReset,restore,verifySession,current,isCurrent,subscribeLifecycle,requestApi,get verification(){return activeVerification?.isCurrent()?activeVerification:null;}};return controllerApi;
}
return {validateConfig,create,isIssuedVerification:(value,controller)=>Boolean(value&&typeof value==='object'&&issuedVerifications.has(value)&&(controller===undefined||issuedVerifications.get(value)===controller))};
});
