(function(root,factory){
'use strict';
const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.AccountAuthEntry=api;
if(!root.accountAuthPreviewEnabled||!root.document)return;
api.launch().catch(error=>root.accountAuthView?.announce(error.userMessage||error.message||'帳號服務無法啟動。','error'));
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
function loadScript(src){return new Promise((resolve,reject)=>{const script=root.document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error('帳號模組載入失敗'));root.document.head.append(script);});}
function connectLifecycle({controller,bootstrap=root.PermanentEntryBootstrap,reload=()=>root.location.reload(),announce=(message,state)=>root.accountAuthView?.announce(message,state)}){
 if(!controller?.subscribeLifecycle||!bootstrap?.start||!bootstrap?.stop)throw Error('登入與永久角色啟動模組尚未就緒');
 let reloading=false,lastStart=null,migrationFlow=null,migrationUserId='',migrationVerification=null,migrationGeneration=0;
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
   if(prepared.status==='ready'){lastStart=bootstrap.start({sessionController:controller,verification:current});return lastStart;}
   root.accountAuthView?.showGoldMigration(prepared.preview,async()=>{
    const latest=migrationVerification;if(!latest||!controller.isCurrent(latest)||latest.userId!==migrationUserId)throw Error('登入驗證已失效，請重新登入');
    const completed=await bootstrap.confirmSharedGoldMigration({sessionController:controller,verification:latest});lastStart=Promise.resolve(completed.startup);return completed;
   });return prepared;
  }).catch(preparationError=>{if(/Stop active farming before shared gold migration|Settle pending offline income before shared gold migration/.test(String(preparationError?.message))){offerFarmingRecovery(verification);return;}if(controller.isCurrent(verification))announce(preparationError.userMessage||preparationError.message||'金幣轉換準備失敗，原資料保持不變。','error');throw preparationError;});
  migrationFlow.catch(()=>{});
 };
 const unsubscribe=controller.subscribeLifecycle(event=>{
  if(event.type==='authenticated'||event.type==='refreshed'){
   const verification=event.verification;
   if(event.type==='refreshed'&&migrationFlow&&migrationUserId===verification.userId){migrationVerification=verification;return;}
   lastStart=bootstrap.start({sessionController:controller,verification});
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
 const configResponse=await root.fetch('http://127.0.0.1:3000/v1/config/public',{redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!configResponse.ok)throw Error('無法讀取 lorn-dev 公開設定');
 const publicConfig=await configResponse.json();root.AccountApiContract.validateServer(publicConfig);const config=root.AccountSessionController.validateConfig(publicConfig);
 await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.76.1/dist/umd/supabase.min.js');
 if(typeof root.supabase?.createClient!=='function')throw Error('官方 Supabase Auth 模組無法使用');
 const client=root.supabase.createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const controller=root.AccountSessionController.create({supabaseClient:client,apiBaseUrl:config.apiBaseUrl,view});
 view.setHandlers({register:values=>controller.register(values),login:values=>controller.login(values),forgotPassword:values=>controller.forgotPassword(values)});
 root.LornAccountSession=controller;root.LornAccountGameLifecycle=connectLifecycle({controller});root.LornAccountLogoutCleanup=installLogoutHandler({controller});await controller.start();return controller;
}
return {connectLifecycle,installLogoutHandler,launch};
});
