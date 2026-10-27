(function(root,factory){
'use strict';const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.CloudSaveSync=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const MAX_BYTES=2*1024*1024,UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function syncError(code,message,details){const error=Error(message);error.code=code;if(details!==undefined)error.details=details;return error;}
function canonical(value){if(value===null||typeof value!=='object')return JSON.stringify(value)??'null';if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';}
async function hashSnapshot(snapshot,cryptoApi=root.crypto){if(!cryptoApi?.subtle)throw syncError('CRYPTO_UNAVAILABLE','安全雜湊功能無法使用');const serialized=canonical(snapshot),bytes=new TextEncoder().encode(serialized);const digest=await cryptoApi.subtle.digest('SHA-256',bytes);return {hash:Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join(''),bytes:bytes.length};}
function emptySnapshot(snapshot){const model=snapshot?.permanent,farming=snapshot?.farming,preferences=snapshot?.preferences;if(!model||snapshot.revision!==0||preferences?.revision!==0)return false;return Object.keys(model.characters||{}).length===0&&(model.slotOrder||[]).every(id=>id===null)&&!model.activeMainId&&Object.keys(model.parties||{}).length===0&&(model.bag?.items||[]).length===0&&Object.keys(model.equipmentOwners||{}).length===0&&Object.keys(snapshot.commands||{}).length===0&&Object.keys(farming?.owners||{}).length===0&&Object.keys(farming?.sessions||{}).length===0&&Object.keys(farming?.legacyDebts||{}).length===0&&Object.keys(farming?.teamOffline||{}).length===0&&(snapshot.offlineRuns||[]).length===0&&Object.keys(preferences?.values||{}).length===0;}
function create({controller,store,authUserId,lease,cryptoApi=root.crypto}){
 const userId=String(authUserId||'').toLowerCase();if(!UUID.test(userId)||!controller?.requestApi||!controller?.isCurrent||!store?.exportCloudSnapshot||!store?.restoreCloudSnapshot||!lease?.assertValid||!lease?.identity)throw Error('雲端存檔同步缺少必要依賴');
 const accountId='supabase:'+userId;let operation=null;
 function currentVerification(){lease.assertValid();const verification=controller.verification;if(!verification||verification.userId!==userId||!controller.isCurrent(verification))throw syncError('SESSION_INVALID','登入驗證已失效，雲端存檔操作已停止');return verification;}
 async function request(path,options){const response=await controller.requestApi(currentVerification(),path,options);if(response.status===409){const error=syncError(response.body?.error?.code||'CLOUD_CONFLICT',response.body?.error?.message||'雲端版本發生衝突',response.body);if(String(error.code).startsWith('PLAY_LEASE_'))lease.invalidate?.(error);throw error;}return response;}
 async function remoteSave(){const response=await request('/v1/save',{method:'GET'});if(response.status===404&&response.body?.error?.code==='SAVE_NOT_FOUND')return null;if(!response.ok)throw syncError(response.body?.error?.code||'CLOUD_READ_FAILED',response.body?.error?.message||'無法讀取雲端存檔');const save=response.body?.save;if(!save||!Number.isInteger(save.revision)||save.revision<1||!Number.isInteger(save.schemaVersion)||save.schemaVersion<1||typeof save.contentHash!=='string')throw syncError('INVALID_CLOUD_SAVE','雲端存檔格式不正確');return save;}
 function once(work){if(operation)return operation;operation=Promise.resolve().then(work).finally(()=>{operation=null;});return operation;}
 async function upload({skipEmpty=false}={}){return once(async()=>{
  currentVerification();const exported=await store.exportCloudSnapshot(accountId,userId);currentVerification();const measured=await hashSnapshot(exported.snapshot,cryptoApi);if(measured.bytes>MAX_BYTES)throw syncError('SAVE_TOO_LARGE','本機完整存檔超過 2 MiB，未執行上傳');
  const remote=await remoteSave(),state=await store.cloudSyncState(accountId);currentVerification();
  if(state?.pending){const pending=state.pending;
   if(remote&&remote.revision===pending.baseRevision+1&&remote.contentHash===pending.snapshotHash){
    await store.completeCloudUpload(accountId,{commandId:pending.commandId,localRevision:pending.localRevision,localPreferencesRevision:pending.localPreferencesRevision??0,snapshotHash:pending.snapshotHash,cloudRevision:remote.revision,cloudContentHash:remote.contentHash,updatedAt:remote.updatedAt});
    if(exported.localRevision!==pending.localRevision||exported.localPreferencesRevision!==(pending.localPreferencesRevision??0)||measured.hash!==pending.snapshotHash)throw syncError('LOCAL_CHANGED','雲端已確認先前版本，本機較新進度仍待同步');
    return {status:'uploaded',duplicate:true,save:remote};
   }
   const sameBase=(!remote&&pending.baseRevision===0)||(remote&&remote.revision===pending.baseRevision&&remote.contentHash===pending.cloudContentHash);
   if(!sameBase||pending.snapshotHash!==measured.hash||pending.localRevision!==exported.localRevision)throw syncError('CLOUD_CONFLICT','待確認的上傳與目前本機或雲端版本不一致');
  }
  if(skipEmpty&&!remote&&emptySnapshot(exported.snapshot))return {status:'empty',duplicate:true,save:null};
  if(remote){
   if(state&&!state.pending&&(state.cloudRevision!==remote.revision||state.cloudContentHash!==remote.contentHash))throw syncError('CLOUD_CONFLICT','雲端版本已由其他裝置更新，停止上傳');
   if(!state&&remote.contentHash!==measured.hash)throw syncError('CLOUD_CONFLICT','雲端已有存檔，本機尚未建立同步關聯，請先安全下載');
   if(remote.contentHash===measured.hash){await store.acknowledgeCloudSnapshot(accountId,{localRevision:exported.localRevision,localPreferencesRevision:exported.localPreferencesRevision,snapshotHash:measured.hash,cloudRevision:remote.revision,cloudContentHash:remote.contentHash,updatedAt:remote.updatedAt});return {status:'unchanged',duplicate:true,save:remote};}
  }else if(state?.cloudRevision)throw syncError('CLOUD_CONFLICT','雲端存檔已不存在，停止覆蓋');
  const baseRevision=remote?.revision||0,cloudContentHash=remote?.contentHash||null,commandId=state?.pending?.commandId||cryptoApi.randomUUID();
  await store.prepareCloudUpload(accountId,{localRevision:exported.localRevision,localPreferencesRevision:exported.localPreferencesRevision,snapshotHash:measured.hash,baseRevision,cloudContentHash,commandId});currentVerification();
  const response=await request('/v1/save/commit',{method:'POST',body:{...lease.identity(),commandId,baseRevision,schemaVersion:1,snapshot:exported.snapshot,contentHash:measured.hash}});if(!response.ok||![200,201].includes(response.status))throw syncError(response.body?.error?.code||'CLOUD_WRITE_FAILED',response.body?.error?.message||'雲端存檔提交失敗');
  const save=response.body?.save;if(!save||save.contentHash!==measured.hash||save.revision!==baseRevision+1)throw syncError('INVALID_CLOUD_RECEIPT','雲端存檔提交結果不正確');currentVerification();
  await store.completeCloudUpload(accountId,{commandId,localRevision:exported.localRevision,localPreferencesRevision:exported.localPreferencesRevision,snapshotHash:measured.hash,cloudRevision:save.revision,cloudContentHash:save.contentHash,updatedAt:save.updatedAt});return {status:'uploaded',duplicate:!!response.body.duplicate,save};
 });}
 async function download(options={}){return once(async()=>{
  currentVerification();const remote=await remoteSave();if(!remote)throw syncError('SAVE_NOT_FOUND','此帳號沒有雲端存檔');const measured=await hashSnapshot(remote.snapshot,cryptoApi);if(measured.bytes>MAX_BYTES||measured.hash!==remote.contentHash)throw syncError('INVALID_CLOUD_SAVE','雲端存檔完整性驗證失敗');
  if(remote.snapshot?.owner?.accountId!==accountId||remote.snapshot?.owner?.authUserId!==userId||remote.snapshot?.id!==accountId)throw syncError('OWNER_MISMATCH','雲端存檔不屬於目前登入帳號');
  const state=await store.cloudSyncState(accountId);if(state?.pending)throw syncError('CLOUD_CONFLICT','本機仍有待確認上傳，不允許下載覆蓋');
  let local=null;try{local=await store.exportCloudSnapshot(accountId,userId);}catch(error){if(!/Unknown account/.test(String(error?.message)))throw error;}
  if(local){const localHash=await hashSnapshot(local.snapshot,cryptoApi);if(localHash.hash===remote.contentHash){await store.acknowledgeCloudSnapshot(accountId,{localRevision:local.localRevision,localPreferencesRevision:local.localPreferencesRevision,snapshotHash:localHash.hash,cloudRevision:remote.revision,cloudContentHash:remote.contentHash,updatedAt:remote.updatedAt});return {status:'unchanged',reloadRequired:false,save:remote};}}
  currentVerification();await store.restoreCloudSnapshot(accountId,userId,remote.snapshot,{revision:remote.revision,contentHash:remote.contentHash,updatedAt:remote.updatedAt},options);return {status:'downloaded',reloadRequired:true,save:remote};
 });}
 async function reconcile(){
  currentVerification();let exported=await store.exportCloudSnapshot(accountId,userId),measured=await hashSnapshot(exported.snapshot,cryptoApi),remote=await remoteSave(),state=await store.cloudSyncState(accountId);currentVerification();
  if(state?.pending){try{await upload();}catch(error){if(error?.code!=='LOCAL_CHANGED'&&error?.code!=='ACTIVE_FARMING')throw error;}exported=await store.exportCloudSnapshot(accountId,userId);measured=await hashSnapshot(exported.snapshot,cryptoApi);remote=await remoteSave();state=await store.cloudSyncState(accountId);}
  if(!remote){if(state?.cloudRevision)throw syncError('CLOUD_CONFLICT','雲端存檔已不存在，停止自動同步');return {status:'local-only',needsUpload:!emptySnapshot(exported.snapshot)};}
  if(remote.contentHash===measured.hash){await store.acknowledgeCloudSnapshot(accountId,{localRevision:exported.localRevision,localPreferencesRevision:exported.localPreferencesRevision,snapshotHash:measured.hash,cloudRevision:remote.revision,cloudContentHash:remote.contentHash,updatedAt:remote.updatedAt});return {status:'synced',needsUpload:false};}
  if(!state){if(!emptySnapshot(exported.snapshot))throw syncError('CLOUD_CONFLICT','本機與雲端都有未建立關聯的存檔，停止自動覆蓋');const result=await download();return {status:result.status,needsUpload:false,reloadRequired:result.reloadRequired};}
  const checkpointMatches=state.cloudRevision===remote.revision&&state.cloudContentHash===remote.contentHash;
  const localMatchesCheckpoint=state.snapshotHash&&state.snapshotHash===measured.hash&&state.localRevision===exported.localRevision&&state.localPreferencesRevision===exported.localPreferencesRevision;
  if(checkpointMatches)return {status:'local-ahead',needsUpload:true};
  if(localMatchesCheckpoint){const result=await download({expectedLocal:{localRevision:state.localRevision,localPreferencesRevision:state.localPreferencesRevision,cloudRevision:state.cloudRevision,cloudContentHash:state.cloudContentHash,snapshotHash:state.snapshotHash}});return {status:result.status,needsUpload:false,reloadRequired:result.reloadRequired};}
  throw syncError('CLOUD_CONFLICT','本機與雲端都已有新進度，已停止自動覆蓋');
 }
 function startAutomatic({initialDelay=500,interval=10000,retryDelay=3000,maxWait=5000,onState=()=>{},schedule=root.setTimeout?.bind(root),cancel=root.clearTimeout?.bind(root),now=()=>Date.now()}={}){
  if(typeof schedule!=='function'||typeof cancel!=='function'||typeof now!=='function')throw Error('Automatic cloud save scheduler unavailable');if(!Number.isFinite(maxWait)||maxWait<initialDelay)throw Error('Automatic cloud save maximum wait is invalid');
  let timer=null,stopped=false,running=null,paused=false,dirtySince=now(),generation=1;
  const clearTimer=()=>{if(timer!==null){cancel(timer);timer=null;}};
  const arm=delay=>{if(stopped||paused||running)return;clearTimer();timer=schedule(()=>{timer=null;return run();},Math.max(0,delay));};
  const armDirty=()=>arm(Math.min(initialDelay,Math.max(0,maxWait-Math.max(0,now()-dirtySince))));
  const run=()=>{if(stopped||paused)return Promise.resolve(null);if(running)return running;clearTimer();const startedAt=now(),startedGeneration=generation;dirtySince=null;
   running=upload({skipEmpty:true}).then(result=>{onState({type:result?.status==='empty'?'waiting':'synced',result});return result;}).catch(error=>{if(['CLOUD_CONFLICT','REVISION_CONFLICT','COMMAND_ID_REUSED','OWNER_MISMATCH','INVALID_CLOUD_SAVE','SAVE_TOO_LARGE','PLAY_LEASE_LOST','PLAY_LEASE_EXPIRED','LEASE_REVISION_MISMATCH'].includes(error?.code)){paused=true;onState({type:String(error?.code).startsWith('PLAY_LEASE_')||error?.code==='LEASE_REVISION_MISMATCH'?'lease-lost':'conflict',error});return null;}if(dirtySince===null)dirtySince=startedAt;onState({type:'retrying',error});return null;}).finally(()=>{running=null;if(stopped||paused)return;if(generation!==startedGeneration){armDirty();return;}if(dirtySince!==null){arm(retryDelay);return;}arm(interval);});return running;};
  const online=()=>{if(!paused){if(dirtySince===null)dirtySince=now();generation++;arm(0);}};root.addEventListener?.('online',online);armDirty();
  return Object.freeze({notify(){if(stopped||paused)return;generation++;if(dirtySince===null)dirtySince=now();if(!running)armDirty();},runNow:run,get paused(){return paused;},get busy(){return !!running;},async stop(){stopped=true;clearTimer();root.removeEventListener?.('online',online);if(running)await running;return {stopped:true};}});
 }
 return Object.freeze({accountId,upload,download,reconcile,startAutomatic,getRemote:()=>once(remoteSave),get busy(){return !!operation;}});
}
return {create,hashSnapshot,emptySnapshot,MAX_BYTES};
});
