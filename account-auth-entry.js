(function(root,factory){
'use strict';
const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.AccountAuthEntry=api;
if(!root.accountAuthPreviewEnabled||!root.document)return;
api.launch().catch(error=>root.accountAuthView?.announce(error.userMessage||error.message||'帳號服務無法啟動。','error'));
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const RENDER_API_BASE_URL='https://lorn-api-dev.onrender.com',LOCAL_API_BASE_URL='http://127.0.0.1:3000';
const PRODUCTION_FRONTEND_ORIGIN='https://komay0818-coder.github.io',PRODUCTION_FRONTEND_PATH='/world/';
function resolveApiBaseUrl(location=root.location){
 const current=new URL(String(location?.href||'http://127.0.0.1/')),mode=current.searchParams.get('accountApi');
 if(mode==='local'){
  if(!['127.0.0.1','localhost','[::1]'].includes(current.hostname))throw Error('本機 API 模式只允許從本機頁面啟用');
  return LOCAL_API_BASE_URL;
 }
 if(mode&&mode!=='render')throw Error('帳號 API 模式不受允許');
 return RENDER_API_BASE_URL;
}
function resolvePasswordResetRedirect(location=root.location){
 const current=new URL(String(location?.href||'http://127.0.0.1/'));
 if(current.protocol==='https:'&&current.origin===PRODUCTION_FRONTEND_ORIGIN&&(current.pathname==='/world'||current.pathname.startsWith(PRODUCTION_FRONTEND_PATH)))return PRODUCTION_FRONTEND_ORIGIN+PRODUCTION_FRONTEND_PATH+'?passwordReset=1';
 if(current.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(current.hostname))return current.origin+current.pathname+'?accountUi=1&passwordReset=1';
 throw Error('密碼重設網址不在允許清單');
}
function resolveEmailConfirmationRedirect(location=root.location){
 const current=new URL(String(location?.href||'http://127.0.0.1/'));
 if(current.protocol==='https:'&&current.origin===PRODUCTION_FRONTEND_ORIGIN&&(current.pathname==='/world'||current.pathname.startsWith(PRODUCTION_FRONTEND_PATH)))return PRODUCTION_FRONTEND_ORIGIN+PRODUCTION_FRONTEND_PATH;
 if(current.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(current.hostname))return current.origin+current.pathname+'?accountUi=1';
 throw Error('電子郵件驗證網址不在允許清單');
}
async function fetchPublicConfig(apiBaseUrl,{fetcher=root.fetch,onRetry=()=>{},timeoutSignal=milliseconds=>AbortSignal.timeout(milliseconds)}={}){
 const retryableStatuses=new Set([408,429,502,503,504]),timeouts=[15000,70000];let lastError;
 for(let attempt=0;attempt<timeouts.length;attempt++){
  try{
   const response=await fetcher(apiBaseUrl+'/v1/config/public',{redirect:'error',signal:timeoutSignal(timeouts[attempt])});
   if(response.ok||!retryableStatuses.has(response.status)||attempt===timeouts.length-1)return response;
   lastError=Error('帳號伺服器尚未就緒');
  }catch(error){lastError=error;if(attempt===timeouts.length-1)throw error;}
  onRetry();
 }
 throw lastError||Error('無法讀取 lorn-dev 公開設定');
}
function loadScript(src){return new Promise((resolve,reject)=>{const script=root.document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error('帳號模組載入失敗'));root.document.head.append(script);});}
function connectLifecycle({controller,bootstrap=root.PermanentEntryBootstrap,reload=()=>root.location.reload(),announce=(message,state)=>root.accountAuthView?.announce(message,state)}){
 if(!controller?.subscribeLifecycle||!bootstrap?.start||!bootstrap?.stop)throw Error('登入與永久角色啟動模組尚未就緒');
 let reloading=false,lastStart=null,migrationFlow=null,migrationUserId='',migrationVerification=null,migrationGeneration=0;
 const startGame=verification=>{
  const startup=bootstrap.start({sessionController:controller,verification});
  Promise.resolve(startup).then(()=>{if(controller.isCurrent(verification)&&bootstrap.state?.().active)announce('登入完成，角色系統已啟動。','success');}).catch(()=>{});
  return startup;
 };
 const offerFarmingRecovery=(verification)=>{
  const attempt=++migrationGeneration;migrationUserId=verification.userId;migrationVerification=verification;
  migrationFlow=bootstrap.prepareFarmingRecovery({sessionController:controller,verification}).then(prepared=>{
   if(attempt!==migrationGeneration)return prepared;if(!controller.isCurrent(migrationVerification)||migrationVerification.userId!==migrationUserId)throw Error('登入驗證已失效，掛機恢復已停止');
   root.accountAuthView?.showFarmingRecovery(prepared.preview,async()=>{
    const latest=migrationVerification;if(!latest||!controller.isCurrent(latest)||latest.userId!==migrationUserId)throw Error('登入驗證已失效，請重新登入');
    const completed=await bootstrap.confirmFarmingRecovery({sessionController:controller,verification:latest});
    if(completed.reloadRequired&&!reloading){reloading=true;reload();}return completed;
   });return prepared;
  }).catch(error=>{if(controller.isCurrent(verification))announce(error.userMessage||error.message||'掛機恢復準備失敗，原資料保持不變。','error');throw error;});
  migrationFlow.catch(()=>{});
 };
 const offerMigration=(verification,error)=>{
  if(error?.code!=='SHARED_GOLD_MIGRATION_REQUIRED'||!controller.isCurrent(verification)){announce(error.userMessage||error.message||'永久角色系統無法啟動。','error');return;}
  migrationUserId=verification.userId;migrationVerification=verification;const attempt=++migrationGeneration;
  migrationFlow=bootstrap.prepareSharedGoldMigration({sessionController:controller,verification}).then(prepared=>{
   if(attempt!==migrationGeneration)return prepared;
   const current=migrationVerification;if(!current||!controller.isCurrent(current)||current.userId!==migrationUserId)throw Error('登入驗證已失效，金幣轉換已停止');
   if(prepared.status==='ready'){lastStart=startGame(current);return lastStart;}
   root.accountAuthView?.showGoldMigration(prepared.preview,async()=>{
    const latest=migrationVerification;if(!latest||!controller.isCurrent(latest)||latest.userId!==migrationUserId)throw Error('登入驗證已失效，請重新登入');
    const completed=await bootstrap.confirmSharedGoldMigration({sessionController:controller,verification:latest});lastStart=Promise.resolve(completed.startup);lastStart.then(()=>{if(controller.isCurrent(latest)&&bootstrap.state?.().active)announce('登入完成，角色系統已啟動。','success');});return completed;
   });return prepared;
  }).catch(preparationError=>{if(/Stop active farming before shared gold migration|Settle pending offline income before shared gold migration/.test(String(preparationError?.message))){offerFarmingRecovery(verification);return;}if(controller.isCurrent(verification))announce(preparationError.userMessage||preparationError.message||'金幣轉換準備失敗，原資料保持不變。','error');throw preparationError;});
  migrationFlow.catch(()=>{});
 };
 const unsubscribe=controller.subscribeLifecycle(event=>{
  if(event.type==='authenticated'||event.type==='refreshed'){
   const verification=event.verification;
   if(event.type==='refreshed'&&migrationFlow&&migrationUserId===verification.userId){migrationVerification=verification;return;}
   lastStart=startGame(verification);
   lastStart.catch(error=>offerMigration(verification,error));
   return;
  }
  if(event.type==='invalidated'){
   migrationFlow=null;migrationUserId='';migrationVerification=null;migrationGeneration++;root.accountAuthView?.hideGoldMigration?.();root.accountAuthView?.hideFarmingRecovery?.();
   const before=bootstrap.state?.()||{};
   if(!before.starting&&!before.active&&!before.accountId)return;
   Promise.resolve(bootstrap.stop({reason:event.reason})).then(()=>{
    if(!reloading&&(before.starting||before.active)){reloading=true;reload();}
   }).catch(error=>announce(error.userMessage||error.message||'帳號登出清理未完成，請重新整理頁面。','error'));
  }
 },{replay:true});
 return {unsubscribe,get lastStart(){return lastStart;}};
}
function installLogoutHandler({controller,bootstrap=root.PermanentEntryBootstrap,document=root.document,confirmLogout=()=>root.confirm('確定要登出帳號嗎？'),announce=(message,state)=>root.accountAuthView?.announce(message,state)}){
 let loggingOut=false;
 const handler=event=>{const button=event.target?.closest?.('#profile-button');if(!button)return;event.preventDefault();event.stopImmediatePropagation();if(loggingOut||!controller.verification||!confirmLogout())return;loggingOut=true;button.disabled=true;button.setAttribute?.('aria-busy','true');const verification=controller.verification;Promise.resolve(bootstrap?.prepareLogout?.({sessionController:controller,verification})).then(()=>controller.logout()).catch(error=>{loggingOut=false;button.disabled=false;button.removeAttribute?.('aria-busy');announce(error.userMessage||error.message||'登出前的安全存檔未完成，尚未登出。','error');});};
 document.addEventListener('click',handler,true);return()=>document.removeEventListener('click',handler,true);
}
async function launch(){
 const view=root.accountAuthView;
 if(!root.AccountApiContract)throw Error('帳號 API 契約尚未載入');
 root.AccountApiContract.assertAllowed('/v1/config/public','GET');
 const requestedApiBaseUrl=resolveApiBaseUrl(),configResponse=await fetchPublicConfig(requestedApiBaseUrl,{onRetry:()=>view.announce('帳號伺服器正在啟動，請稍候…','info')});
 if(!configResponse.ok)throw Error('無法讀取 lorn-dev 公開設定');
 const publicConfig=await configResponse.json();root.AccountApiContract.validateServer(publicConfig);const config=root.AccountSessionController.validateConfig(publicConfig,{expectedApiBaseUrl:requestedApiBaseUrl});
 await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.76.1/dist/umd/supabase.min.js');
 if(typeof root.supabase?.createClient!=='function')throw Error('官方 Supabase Auth 模組無法使用');
 const client=root.supabase.createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const currentUrl=new URL(root.location.href),controller=root.AccountSessionController.create({supabaseClient:client,apiBaseUrl:config.apiBaseUrl,view,emailConfirmationRedirectTo:resolveEmailConfirmationRedirect(root.location),passwordResetRedirectTo:resolvePasswordResetRedirect(root.location),passwordRecoveryRequested:currentUrl.searchParams.get('passwordReset')==='1'});
 view.setHandlers({register:values=>controller.register(values),login:values=>controller.login(values),forgotPassword:values=>controller.forgotPassword(values),resetPassword:values=>controller.completePasswordReset(values),cancelPasswordReset:()=>controller.cancelPasswordReset()});
 root.LornAccountSession=controller;root.LornAccountGameLifecycle=connectLifecycle({controller});root.LornAccountLogoutCleanup=installLogoutHandler({controller});await controller.start();return controller;
}
return {connectLifecycle,installLogoutHandler,resolveApiBaseUrl,resolveEmailConfirmationRedirect,resolvePasswordResetRedirect,fetchPublicConfig,launch};
});
