(function(root,factory){'use strict';const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.PlayLeaseClient=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,DEVICE_KEY='lorn-play-device-id-v1';
function leaseError(code,message){const error=Error(message);error.code=code;return error;}
function create({controller,authUserId,storage=root.localStorage,cryptoApi=root.crypto,now=()=>Date.now(),schedule=root.setTimeout?.bind(root),cancel=root.clearTimeout?.bind(root)}){
 const userId=String(authUserId||'').toLowerCase();if(!UUID.test(userId)||!controller?.requestApi||!controller?.isCurrent||!storage||!cryptoApi?.randomUUID||typeof schedule!=='function'||typeof cancel!=='function')throw Error('遊玩租約缺少必要依賴');
 let deviceId=storage.getItem(DEVICE_KEY);if(!UUID.test(String(deviceId||''))){deviceId=cryptoApi.randomUUID();storage.setItem(DEVICE_KEY,deviceId);}
 const leaseKey='lorn-play-lease-v1:'+userId;let lease=null,timer=null,stopped=false,lost=false,onLost=()=>{},renewing=null;
 const verification=()=>{const value=controller.verification;if(!value||value.userId!==userId||!controller.isCurrent(value))throw leaseError('SESSION_INVALID','登入驗證已失效，遊玩權限已停止');return value;};
 async function request(path,body){const response=await controller.requestApi(verification(),path,{method:'POST',body});if(!response.ok){const code=response.body?.error?.code||'PLAY_LEASE_FAILED',messages={PLAY_LEASE_ACTIVE:'此帳號仍在另一個裝置遊玩。請先在原裝置安全登出並完成雲端同步。',PLAY_LEASE_RECOVERY_REQUIRED:'原裝置可能仍有未同步進度，已停止接管。請回到原裝置重新登入並安全登出。',PLAY_LEASE_UNSYNCED:'本機進度尚未確認同步完成，不能釋放遊玩權限。',PLAY_LEASE_EXPIRED:'遊玩權限已過期，已停止產生新進度。',PLAY_LEASE_LOST:'此裝置已失去遊玩權限。'};const error=leaseError(code,messages[code]||response.body?.error?.message||'遊玩權限驗證失敗');if(String(error.code).startsWith('PLAY_LEASE_')&&error.code!=='PLAY_LEASE_ACTIVE'&&error.code!=='PLAY_LEASE_RECOVERY_REQUIRED')invalidate(error);throw error;}return response.body;}
 function identity(){assertValid();return {leaseId:lease.leaseId,deviceId};}
 function assertValid(){verification();if(stopped||lost||!lease||lease.state!=='active')throw leaseError('PLAY_LEASE_LOST','此裝置沒有有效遊玩權限');if(now()>=Date.parse(lease.expiresAt)){const error=leaseError('PLAY_LEASE_EXPIRED','遊玩權限已過期，已停止產生新進度');invalidate(error);throw error;}return lease;}
 function invalidate(error=leaseError('PLAY_LEASE_LOST','遊玩權限已失效')){if(lost)return;lost=true;if(timer!==null){cancel(timer);timer=null;}Promise.resolve().then(()=>onLost(error)).catch(()=>{});}
 function arm(){if(stopped||lost||!lease||timer!==null)return;const remaining=Date.parse(lease.expiresAt)-now(),delay=Math.max(250,Math.min(10_000,remaining-1_000));timer=schedule(()=>{timer=null;renew().catch(error=>{if(now()>=Date.parse(lease?.expiresAt||0))invalidate(error);else arm();});},delay);}
 async function acquire(){if(stopped)throw leaseError('PLAY_LEASE_LOST','遊玩權限管理已停止');const resumeLeaseId=storage.getItem(leaseKey);const body=await request('/v1/play-lease/acquire',{deviceId,resumeLeaseId:UUID.test(String(resumeLeaseId||''))?resumeLeaseId:null});lease=body.lease;if(!lease||lease.deviceId!==deviceId||lease.state!=='active')throw leaseError('INVALID_PLAY_LEASE','後端回傳的遊玩權限不正確');storage.setItem(leaseKey,lease.leaseId);lost=false;arm();return body;}
 async function renew(){if(renewing)return renewing;assertValid();renewing=request('/v1/play-lease/renew',{leaseId:lease.leaseId,deviceId}).then(body=>{lease=body.lease;arm();return body;}).finally(()=>{renewing=null;});return renewing;}
 async function release(cloudRevision){assertValid();if(!Number.isInteger(cloudRevision)||cloudRevision<0)throw Error('有效雲端 revision 才能釋放遊玩權限');const body=await request('/v1/play-lease/release',{leaseId:lease.leaseId,deviceId,cloudRevision});lease=body.lease;storage.removeItem(leaseKey);stopped=true;if(timer!==null){cancel(timer);timer=null;}return body;}
 function start(listener){if(typeof listener==='function')onLost=listener;assertValid();arm();return api;}
 function stop(){stopped=true;if(timer!==null){cancel(timer);timer=null;}return {stopped:true,released:lease?.state==='released'};}
 const api=Object.freeze({acquire,renew,release,start,stop,identity,assertValid,invalidate,get active(){return !stopped&&!lost&&lease?.state==='active'&&now()<Date.parse(lease.expiresAt);},get current(){return lease?{...lease}:null;},get deviceId(){return deviceId;}});return api;
}
return {create,DEVICE_KEY};
});
