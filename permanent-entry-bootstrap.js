(function(root,factory){
'use strict';
const node=typeof module==='object'&&module.exports;
const api=factory(root,node?{
 Policy:require('./permanent-party-policy'),Cutover:require('./permanent-cutover-policy'),Session:require('./account-session-controller'),Cloud:require('./cloud-save-sync'),Lease:require('./play-lease-client')
}:{
 Policy:root.PermanentPartyPolicy,Cutover:root.PermanentCutoverPolicy,Session:root.AccountSessionController,Cloud:root.CloudSaveSync,Lease:root.PlayLeaseClient
});
if(node)module.exports=api;else root.PermanentEntryBootstrap=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root,deps){
'use strict';
const AUTHORITY_KEYS=new Set(['stardust-character-slots','stardust-character','stardust-progress','stardust-active-character-slot','stardust-account-resources']);
const MARKER_PREFIX='stardust-permanent-cutover-v2';
const PRODUCTION_ACCOUNT='stardust-local-account-v2';
const PRODUCTION_DATABASE='stardust-permanent-production-v2';
const AUTHENTICATED_ACCOUNT_PREFIX='supabase:';
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const copy=value=>JSON.parse(JSON.stringify(value));
let preparedAccountId=null,preparingAccountId=null,preparationPromise=null,preparationAuthorization=null;
let startupAccountId=null,startupPromise=null,startupAuthorization=null,startupEpoch=0;
let runtimeStore=null,activeRuntime=null,activeCloudSync=null,automaticCloudSave=null,activePlayLease=null,stopPromise=null,characterChangePromise=null;
let goldPreparation=null,goldPreparationPromise=null,goldConfirmationPromise=null,goldAuthorization=null;
let farmingRecoveryPreparation=null,farmingRecoveryPromise=null,farmingRecoveryConfirmationPromise=null,farmingRecoveryAuthorization=null;
function parse(storage,key,fallback){const text=storage.getItem(key);if(text===null)return copy(fallback);try{return JSON.parse(text);}catch(error){throw Error('舊存檔格式無法讀取：'+key);}}
function readSettings(storage){const result={};for(let index=0;index<storage.length;index++){const key=storage.key(index);if(!key||AUTHORITY_KEYS.has(key)||key.startsWith(MARKER_PREFIX))continue;const value=storage.getItem(key);if(typeof value==='string')result[key]=value;}return result;}
function readLegacy(storage){
 let slots=parse(storage,'stardust-character-slots',[]);if(!Array.isArray(slots))throw Error('舊角色欄位格式不正確');
 const character=parse(storage,'stardust-character',null),progress=parse(storage,'stardust-progress',{});
 if(!slots.length&&character)slots=[{character,progress}];
 if(slots.length>4)throw new deps.Policy.MigrationConflict([{code:'invalid-slots'}]);
 const requested=Number(storage.getItem('stardust-active-character-slot')||0),active=slots[requested]||slots.find(Boolean)||null;
 return {slots:copy(slots),activeMainId:active?.character?.id||null,accountResources:parse(storage,'stardust-account-resources',{}),settings:readSettings(storage)};
}
function authorize(options={}){
 const verification=options.verification,controller=options.sessionController;
 if(!deps.Session?.isIssuedVerification?.(verification,controller)||typeof controller?.isCurrent!=='function'||!controller.isCurrent(verification)||verification?.isCurrent?.()!==true)throw Error('尚未取得目前登入 Session 核准的驗證結果');
 const authUserId=String(verification.userId||'').trim().toLowerCase(),backendUserId=String(verification.account?.authUserId||'').trim().toLowerCase();
 if(!UUID_PATTERN.test(authUserId)||backendUserId!==authUserId)throw Error('登入帳號識別格式或後端核對結果不正確');
 const authorization={accountId:AUTHENTICATED_ACCOUNT_PREFIX+authUserId,authUserId,database:PRODUCTION_DATABASE,testing:false,controller,verification};
 authorization.ensureCurrent=()=>{if(!deps.Session.isIssuedVerification(verification,controller)||!controller.isCurrent(verification)||verification.isCurrent()!==true)throw Error('登入驗證已失效，永久角色系統已停止啟動');return authorization;};
 return authorization;
}
function identity(options={}){const authorization=authorize(options);return {accountId:authorization.accountId,authUserId:authorization.authUserId,database:authorization.database,testing:false};}
function markerKey(accountId){return accountId===PRODUCTION_ACCOUNT?MARKER_PREFIX:MARKER_PREFIX+':'+accountId;}
function statusNode(document){let node=document.getElementById('permanent-entry-status');if(!node){node=document.createElement('output');node.id='permanent-entry-status';node.setAttribute('aria-live','polite');node.style.cssText='position:fixed;left:12px;bottom:12px;z-index:1000000;max-width:min(620px,calc(100vw - 24px));padding:9px 12px;border:1px solid #53798b;border-radius:8px;background:#102431;color:#eaf9ff;font:13px/1.45 sans-serif;box-shadow:0 4px 18px #0008';document.body.append(node);}return node;}
async function loadScript(document,src,guard=()=>{},fetcher=root.fetch?.bind(root)){
 if(typeof fetcher!=='function')throw Error('瀏覽器無法安全載入正式程式：'+src);
 guard();
 const base=document.baseURI||root.location?.href;
 const response=await fetcher(base?new URL(src,base).href:src,{credentials:'same-origin',cache:'no-store'});
 if(!response?.ok)throw Error('無法載入正式程式：'+src);
 const source=await response.text();guard();
 const script=document.createElement('script');script.dataset.permanentEntrySource=src;script.textContent=source+'\n//# sourceURL='+src;
 document.body.append(script);guard();return script;
}
async function verifiedAccount(store,accountId,guard=()=>{}){
 guard();
 let account=await store.read(accountId);
 guard();
 if(!account?.permanent)throw Error('此登入帳號尚未建立永久角色存檔');
 const goldState=deps.Policy.sharedGoldState(account.permanent);
 if(goldState.status!=='ready'){
  const error=Error(goldState.status==='legacy'?'金幣資料需要轉換，遊戲尚未啟動':'共用金幣資料異常，遊戲已安全停止');
  error.code=goldState.status==='legacy'?'SHARED_GOLD_MIGRATION_REQUIRED':'SHARED_GOLD_INVALID';
  error.sharedGoldState=goldState.status;
  throw error;
 }
 const bundle=await store.recoveryReport(accountId),report=bundle.report;
 guard();
 if(!report.valid)throw Error('永久存檔需要人工檢查：'+report.issues.map(issue=>issue.code).join(', '));
 account=await store.read(accountId);guard();deps.Policy.validate(account.permanent);
 if(account.cutover?.status!=='active')throw Error('永久存檔切換尚未完成');
 const again=await store.read(accountId);guard();if(JSON.stringify(account.permanent)!==JSON.stringify(again.permanent)||account.revision!==again.revision)throw Error('永久存檔讀回驗證失敗');
 return again;
}
function assertPageAccount(accountId){
 let runtimeAccountId=null;try{runtimeAccountId=root.PermanentPartyRuntime?.current?.getCommitted?.().id||null;}catch{}
 if(runtimeAccountId&&runtimeAccountId!==accountId)throw Error('另一個登入帳號的永久角色系統已在此頁啟用，請重新載入頁面');
 const owned=startupAccountId||preparedAccountId||preparingAccountId;
 if(owned&&owned!==accountId)throw Error('此頁已綁定另一個登入帳號，請重新載入頁面');
}
function beginInitialization(options,authorization){
 const ids=authorization,navigator=options.navigator||root.navigator,storeFactory=options.storeFactory||root.PermanentPartyStore;
 if(!navigator?.locks?.request||!storeFactory?.open)throw Error('瀏覽器不支援安全永久存檔，已停止初始化');
 authorization.ensureCurrent();
 assertPageAccount(ids.accountId);
 if(preparationPromise){if(preparingAccountId!==ids.accountId)throw Error('此頁正在初始化另一個登入帳號');preparationAuthorization=authorization;return preparationPromise;}
 preparingAccountId=ids.accountId;preparationAuthorization=authorization;
 const ensureCurrent=()=>{if(preparingAccountId!==ids.accountId||preparationAuthorization?.accountId!==ids.accountId)throw Error('登入帳號已切換，永久存檔初始化已停止');return preparationAuthorization.ensureCurrent();};
 const task=Promise.resolve().then(()=>navigator.locks.request('stardust-permanent-cutover:'+ids.accountId,{mode:'exclusive'},async()=>{
  ensureCurrent();const store=await storeFactory.open({name:ids.database});try{
   ensureCurrent();
   if(typeof store.initializeSupabaseAccount!=='function')throw Error('永久存檔初始化介面尚未載入');
   const initialized=await store.initializeSupabaseAccount(ids.accountId);ensureCurrent();
   const account=await verifiedAccount(store,ids.accountId,ensureCurrent);ensureCurrent();
   if(account.id!==ids.accountId)throw Error('永久存檔帳號識別不一致');
   preparedAccountId=ids.accountId;
   return {account,accountId:ids.accountId,authUserId:ids.authUserId,created:initialized.created===true,duplicate:initialized.duplicate===true};
  }finally{store.close();}
 }));
 preparationPromise=task;
 task.finally(()=>{if(preparationPromise===task){preparationPromise=null;preparingAccountId=null;preparationAuthorization=null;}}).catch(()=>{});
 return task;
}
function initializeAccount(options={}){try{return beginInitialization(options,authorize(options));}catch(error){return Promise.reject(error);}}
function availableLock(locks,name,callback){return locks.request(name,{mode:'exclusive',ifAvailable:true},lock=>{if(!lock)throw Error('另一個分頁正在處理此帳號，請稍後重試');return callback();});}
function recoveryPreview(plan){return {revision:plan.revision,preparedAt:plan.preparedAt,characters:plan.entries.map(entry=>({characterId:entry.characterId,name:entry.name,status:entry.status,from:entry.from,until:entry.now,durationMs:Math.max(0,entry.now-entry.from),report:copy(entry.report)}))};}
async function prepareFarmingRecovery(options={}){
 let authorization;try{authorization=authorize(options);authorization.ensureCurrent();assertPageAccount(authorization.accountId);}catch(error){return Promise.reject(error);}
 if(farmingRecoveryPromise){if(farmingRecoveryAuthorization?.accountId!==authorization.accountId)return Promise.reject(Error('此頁正在準備另一個帳號的掛機恢復'));farmingRecoveryAuthorization=authorization;return farmingRecoveryPromise;}
 const navigator=options.navigator||root.navigator,storeFactory=options.storeFactory||root.PermanentPartyStore,document=options.document||root.document;
 const scriptLoader=options.scriptLoader||((doc,src,guard)=>loadScript(doc,src,guard,options.fetcher||root.fetch?.bind(root)));
 const Runtime=options.runtimeModule||root.PermanentPartyRuntime,Coordinator=options.coordinatorModule||root.PermanentFarmingCoordinator;
 if(!navigator?.locks?.request||!storeFactory?.open||!Runtime?.create||!Runtime?.activate||!Coordinator?.create)return Promise.reject(Error('安全掛機恢復元件尚未載入'));
 farmingRecoveryAuthorization=authorization;
 const ensureCurrent=()=>{if(farmingRecoveryAuthorization?.accountId!==authorization.accountId)throw Error('登入帳號已切換，掛機恢復已停止');return farmingRecoveryAuthorization.ensureCurrent();};
 const task=Promise.resolve().then(()=>availableLock(navigator.locks,'stardust-permanent-cutover:'+authorization.accountId,async()=>{
  ensureCurrent();if(activeRuntime||Runtime.current)throw Error('永久角色 Runtime 已啟動，不能進入維護恢復模式');
  runtimeStore=await storeFactory.open({name:authorization.database});let keep=false,createdRuntime=false;
  try{
   const account=await runtimeStore.read(authorization.accountId);ensureCurrent();if(!account?.permanent)throw Error('此登入帳號尚未建立永久角色存檔');
   const gold=deps.Policy.sharedGoldState(account.permanent);if(gold.status!=='legacy')throw Error(gold.status==='ready'?'金幣資料已完成轉換':'共用金幣資料異常，需要人工檢查');
   root.permanentEntryMaintenance=true;root.permanentFarmingBooting=true;
   const runtime=Runtime.activate(Runtime.create({store:runtimeStore,account,legacyOffline:true,onFailure:error=>{root.permanentEntryFailure=error;}}));activeRuntime=runtime;createdRuntime=true;installSchedulingGuards(runtime);ensureCurrent();
   if(typeof root.calculatePermanentSingleJob!=='function')await scriptLoader(document,'script.js?v=20261101-character-switch-v1',ensureCurrent);ensureCurrent();
   if(typeof root.calculatePermanentSingleJob!=='function')throw Error('既有單人離線結算政策尚未載入');
   const coordinator=Coordinator.create({runtime,store:runtimeStore,calculate:job=>root.calculatePermanentSingleJob(job),context:(now,id)=>{const progress=runtime.getProgress(id||runtime.mainId),member={...(progress?.partyMemberState?.runtime||{}),progress};return {defenseMultiplier:root.ChapterThreeSpecialEquipmentPolicy?.getDefenseMultiplier?.(member,now)??1};},pause:async()=>{await runtime.flush();}});
   root.permanentFarmingCoordinator=coordinator;runtime.bindCoordinator(coordinator);await coordinator.initialize();ensureCurrent();
   const plan=await coordinator.previewRecovery({now:Date.now()});ensureCurrent();if(!plan.entries.length)throw Error('找不到可安全恢復的單人掛機收益');
   farmingRecoveryPreparation={accountId:authorization.accountId,plan,coordinator,runtime};keep=true;
   return {status:'recovery-required',accountId:authorization.accountId,preview:recoveryPreview(plan)};
  }finally{if(!keep){if(createdRuntime){try{await cleanupRuntime();}catch{}}else{try{runtimeStore?.close?.();}catch{}runtimeStore=null;}root.permanentEntryMaintenance=false;}}
 }));
 farmingRecoveryPromise=task;task.finally(()=>{if(farmingRecoveryPromise===task)farmingRecoveryPromise=null;}).catch(()=>{});return task;
}
function confirmFarmingRecovery(options={}){
 let authorization;try{authorization=authorize(options);authorization.ensureCurrent();assertPageAccount(authorization.accountId);}catch(error){return Promise.reject(error);}
 if(farmingRecoveryConfirmationPromise)return farmingRecoveryConfirmationPromise;
 const navigator=options.navigator||root.navigator;if(!navigator?.locks?.request)return Promise.reject(Error('瀏覽器不支援安全掛機恢復'));
 farmingRecoveryAuthorization=authorization;
 const ensureCurrent=()=>{if(farmingRecoveryAuthorization?.accountId!==authorization.accountId)throw Error('登入帳號已切換，掛機恢復已停止');return farmingRecoveryAuthorization.ensureCurrent();};
 const task=Promise.resolve().then(()=>availableLock(navigator.locks,'stardust-permanent-cutover:'+authorization.accountId,async()=>{
  ensureCurrent();const prepared=farmingRecoveryPreparation;if(!prepared||prepared.accountId!==authorization.accountId||!prepared.coordinator?.active)throw Error('請先重新檢查掛機恢復資料');
  let result;try{
   result=await prepared.coordinator.recoverPrepared(prepared.plan);ensureCurrent();
   const account=await runtimeStore.read(authorization.accountId),pending=await runtimeStore.pendingForAccount(authorization.accountId);ensureCurrent();
   const farming=account.farming||{},online=Object.values(farming.sessions||{}).some(session=>session?.status==='online');
   if(Object.keys(farming.owners||{}).length||online||Object.keys(farming.legacyDebts||{}).length||Object.keys(farming.teamOffline||{}).length||pending.some(record=>record.status==='prepared'))throw Error('掛機收益尚未完整結算，金幣轉換仍保持停用');
   if(deps.Policy.sharedGoldState(account.permanent).status!=='legacy')throw Error('恢復後金幣狀態不符合轉換條件');
   return {status:'recovered',accountId:authorization.accountId,revision:account.revision,settlements:copy(result.settlements),reloadRequired:true};
  }finally{
   farmingRecoveryPreparation=null;farmingRecoveryAuthorization=null;try{await cleanupRuntime();}finally{root.permanentEntryMaintenance=false;}
  }
 }));
 farmingRecoveryConfirmationPromise=task;task.finally(()=>{if(farmingRecoveryConfirmationPromise===task)farmingRecoveryConfirmationPromise=null;}).catch(()=>{});return task;
}
function prepareSharedGoldMigration(options={}){
 let authorization;try{authorization=authorize(options);authorization.ensureCurrent();assertPageAccount(authorization.accountId);}catch(error){return Promise.reject(error);}
 if(goldPreparationPromise){if(goldAuthorization?.accountId!==authorization.accountId)return Promise.reject(Error('此頁正在準備另一個帳號的金幣轉換'));goldAuthorization=authorization;return goldPreparationPromise;}
 const navigator=options.navigator||root.navigator,storeFactory=options.storeFactory||root.PermanentPartyStore;if(!navigator?.locks?.request||!storeFactory?.open)return Promise.reject(Error('瀏覽器不支援安全金幣轉換'));
 goldAuthorization=authorization;
 const ensureCurrent=()=>{if(goldAuthorization?.accountId!==authorization.accountId)throw Error('登入帳號已切換，金幣轉換準備已停止');return goldAuthorization.ensureCurrent();};
 const task=Promise.resolve().then(()=>navigator.locks.request('stardust-permanent-cutover:'+authorization.accountId,{mode:'exclusive'},async()=>{
  ensureCurrent();const store=await storeFactory.open({name:authorization.database});try{
   ensureCurrent();const account=await store.read(authorization.accountId);ensureCurrent();if(!account?.permanent)throw Error('此登入帳號尚未建立永久角色存檔');
   const state=deps.Policy.sharedGoldState(account.permanent);if(state.status==='invalid'){const error=Error('共用金幣資料異常，需要人工檢查');error.code='SHARED_GOLD_INVALID';throw error;}
   if(state.status==='ready')return {status:'ready',accountId:authorization.accountId,preview:null};
   if(typeof store.prepareSharedGoldMigration!=='function')throw Error('共用金幣備份介面尚未載入');
   const prepared=await store.prepareSharedGoldMigration(authorization.accountId,account.revision,{guard:ensureCurrent});ensureCurrent();
   if(prepared.status!=='legacy'||!prepared.backup?.fingerprint||!Number.isSafeInteger(prepared.preview?.total))throw Error('共用金幣轉換預覽驗證失敗');
   goldPreparation={accountId:authorization.accountId,sourceRevision:prepared.preview.sourceRevision,backupFingerprint:prepared.backup.fingerprint,expectedTotal:prepared.preview.total,preview:copy(prepared.preview)};
   return {status:'legacy',accountId:authorization.accountId,preview:copy(prepared.preview),backup:{status:prepared.backup.status,sourceRevision:prepared.backup.sourceRevision,createdAt:prepared.backup.createdAt}};
  }finally{store.close();}
 }));
 goldPreparationPromise=task;task.finally(()=>{if(goldPreparationPromise===task)goldPreparationPromise=null;}).catch(()=>{});return task;
}
function confirmSharedGoldMigration(options={}){
 let authorization;try{authorization=authorize(options);authorization.ensureCurrent();assertPageAccount(authorization.accountId);}catch(error){return Promise.reject(error);}
 if(goldConfirmationPromise)return goldConfirmationPromise;
 const navigator=options.navigator||root.navigator,storeFactory=options.storeFactory||root.PermanentPartyStore;if(!navigator?.locks?.request||!storeFactory?.open)return Promise.reject(Error('瀏覽器不支援安全金幣轉換'));
 goldAuthorization=authorization;
 const ensureCurrent=()=>{if(goldAuthorization?.accountId!==authorization.accountId)throw Error('登入帳號已切換，金幣轉換已停止');return goldAuthorization.ensureCurrent();};
 const task=Promise.resolve().then(async()=>{
  const prepared=goldPreparation||await prepareSharedGoldMigration(options).then(()=>goldPreparation);ensureCurrent();
  const migrated=await navigator.locks.request('stardust-permanent-cutover:'+authorization.accountId,{mode:'exclusive'},async()=>{
   ensureCurrent();const store=await storeFactory.open({name:authorization.database});try{
    const current=await store.read(authorization.accountId);ensureCurrent();const state=deps.Policy.sharedGoldState(current.permanent);
    if(state.status==='invalid'){const error=Error('共用金幣資料異常，需要人工檢查');error.code='SHARED_GOLD_INVALID';throw error;}
    if(state.status==='ready')return {account:current,migrated:false,duplicate:true,audit:copy(current.permanent.accountResources.goldMigrationAudit||null)};
    if(!prepared||prepared.accountId!==authorization.accountId||!prepared.backupFingerprint)throw Error('請先完成並驗證金幣轉換備份');
    const result=await store.migrateSharedGold(authorization.accountId,current.revision,{backupFingerprint:prepared.backupFingerprint,guard:ensureCurrent});ensureCurrent();return result;
   }finally{store.close();}
  });
  ensureCurrent();const state=deps.Policy.sharedGoldState(migrated.account.permanent),expected=prepared?.expectedTotal??migrated.audit?.after?.accountGold;
  if(state.status!=='ready'||state.gold!==expected||migrated.audit?.after?.accountGold!==state.gold)throw Error('共用金幣轉換後核對失敗，遊戲未啟動');
  goldPreparation=null;goldPreparationPromise=null;root.permanentEntryFailure=null;
  const startup=await start(options);ensureCurrent();return {migration:{migrated:migrated.migrated,duplicate:migrated.duplicate,total:state.gold,audit:copy(migrated.audit)},startup};
 });
 goldConfirmationPromise=task;task.finally(()=>{if(goldConfirmationPromise===task)goldConfirmationPromise=null;}).catch(()=>{});return task;
}
function installSchedulingGuards(runtime){
 const nativeInterval=root.setInterval.bind(root),nativeClearInterval=root.clearInterval.bind(root),nativeTimeout=root.setTimeout.bind(root),nativeClearTimeout=root.clearTimeout.bind(root),nativeFrame=root.requestAnimationFrame?.bind(root),nativeCancelFrame=root.cancelAnimationFrame?.bind(root);
 const intervals=new Set(),timeouts=new Set(),frames=new Set();root.permanentFarmingNativeTimeout=nativeTimeout;
 const guardedInterval=(callback,ms,...args)=>{const handle=nativeInterval(()=>{if(!root.permanentEntryMaintenance&&runtime.active&&!runtime.busy&&!runtime.failure&&(!runtime.singleOfflineEnabled||root.document.visibilityState!=='hidden'))callback(...args);},ms);intervals.add(handle);return handle;};
 const guardedTimeout=(callback,ms,...args)=>{const identity=root.permanentFarmingEventIdentity?.();let handle;const run=()=>{timeouts.delete(handle);if(!runtime.active)return;if(root.permanentEntryMaintenance){handle=nativeTimeout(run,20);timeouts.add(handle);return;}const current=root.permanentFarmingEventIdentity?.();if(identity&&(identity.mainId!==current?.mainId||identity.battle!==current?.battle))return;if(runtime.busy||root.document.visibilityState==='hidden'){handle=nativeTimeout(run,20);timeouts.add(handle);return;}if(!runtime.failure)callback(...args);};handle=nativeTimeout(run,ms);timeouts.add(handle);return handle;};
 const guardedFrame=nativeFrame?(callback=>{const identity=root.permanentFarmingEventIdentity?.(),combatFrame=callback===root.autoSkillTick;let handle;const run=timestamp=>{frames.delete(handle);if(!runtime.active||root.permanentEntryMaintenance)return;const current=root.permanentFarmingEventIdentity?.();if(identity&&(identity.mainId!==current?.mainId||(combatFrame&&identity.battle!==current?.battle)))return;if(runtime.busy){handle=nativeFrame(run);frames.add(handle);return;}if(!runtime.failure)callback(timestamp);};handle=nativeFrame(run);frames.add(handle);return handle;}):null;
 const unload=event=>{if(runtime.busy){event.preventDefault();event.returnValue='';}};
 root.setInterval=guardedInterval;root.setTimeout=guardedTimeout;if(guardedFrame)root.requestAnimationFrame=guardedFrame;root.addEventListener('beforeunload',unload);
 runtime.onDeactivate(()=>{
  for(const handle of intervals)nativeClearInterval(handle);for(const handle of timeouts)nativeClearTimeout(handle);if(nativeCancelFrame)for(const handle of frames)nativeCancelFrame(handle);
  intervals.clear();timeouts.clear();frames.clear();root.removeEventListener('beforeunload',unload);
  if(root.setInterval===guardedInterval)root.setInterval=nativeInterval;if(root.setTimeout===guardedTimeout)root.setTimeout=nativeTimeout;if(guardedFrame&&root.requestAnimationFrame===guardedFrame)root.requestAnimationFrame=nativeFrame;
  if(root.permanentFarmingNativeTimeout===nativeTimeout)delete root.permanentFarmingNativeTimeout;
 });
}
async function finishRuntime({store,account,document,accountId,guard,scriptLoader,runtimeModule,coordinatorModule,cloudSync,playLease}){
 guard();root.permanentFarmingBooting=true;root.permanentCharacterInventoryEnabled=true;
 const Runtime=runtimeModule||root.PermanentPartyRuntime,Coordinator=coordinatorModule||root.PermanentFarmingCoordinator;
 if(!Runtime?.create||!Runtime?.activate||!Coordinator?.create)throw Error('永久角色 Runtime 依賴尚未載入');
 if(account.skullcrusherDungeon?.activeRunId){
  const runId=account.skullcrusherDungeon.activeRunId;
  const recovered=await store.skullcrusherAction(accountId,account.revision,{type:'end',runId,status:'aborted',reason:'page-reload',now:Date.now()});
  account=recovered.account;guard();
 }
 const notifyCloud=()=>automaticCloudSave?.notify();
 const runtime=Runtime.activate(Runtime.create({store,account,legacyOffline:true,onFailure:error=>{const node=statusNode(document);node.textContent='永久存檔已停止寫入，請重新整理：'+error.message;node.dataset.state='error';},onCommitted:(before,after)=>{notifyCloud();if(typeof root.rebuildBattlePartyMembers!=='function'||!root.fighting)return;const fields=['level','equipment','skillLevels','advancedClass'];if(JSON.stringify(before.permanent.slotOrder)!==JSON.stringify(after.permanent.slotOrder)||JSON.stringify(before.permanent.parties)!==JSON.stringify(after.permanent.parties)||Object.keys(after.permanent.characters).some(id=>fields.some(key=>JSON.stringify(before.permanent.characters[id]?.progress[key])!==JSON.stringify(after.permanent.characters[id]?.progress[key]))))root.rebuildBattlePartyMembers();}}));
 activeRuntime=runtime;installSchedulingGuards(runtime);guard();
 if(!cloudSync?.startAutomatic)throw Error('自動雲端存檔模組尚未載入');
 automaticCloudSave=cloudSync.startAutomatic({initialDelay:1500,maxWait:5000,onState:event=>{
  if(event.type==='lease-lost'){const node=statusNode(document);node.textContent='此裝置已失去遊玩權限，遊戲已停止產生新進度。請重新整理後再試。';node.dataset.state='error';Promise.resolve(stop({reason:'lease-lost'})).catch(()=>{});return;}
  if(event.type!=='conflict')return;const node=statusNode(document);node.textContent='雲端存檔版本衝突；本機進度已保留，請停止在其他裝置遊玩後重新登入。';node.dataset.state='error';
 }});runtime.onDeactivate(()=>automaticCloudSave?.stop());
 playLease.start(error=>{const node=statusNode(document);node.textContent='此裝置的遊玩權限已失效，遊戲已安全停止：'+(error?.message||'請重新整理後再試');node.dataset.state='error';Promise.resolve(stop({reason:'lease-lost'})).catch(()=>{});});
 await scriptLoader(document,'script.js?v=20261101-character-switch-v1',guard);guard();
 const coordinator=Coordinator.create({runtime,store,calculate:job=>root.calculatePermanentSingleJob(job),context:(now,id)=>{const progress=runtime.getProgress(id||runtime.mainId),member={...(progress.partyMemberState?.runtime||{}),progress};return {defenseMultiplier:root.ChapterThreeSpecialEquipmentPolicy.getDefenseMultiplier(member,now)};},pause:async()=>{if(root.fighting&&root.battle?.partyMembers?.length)root.persistPartyRuntimeState();root.fighting=false;root.clearInterval(root.battleTimer);root.clearInterval(root.skillTimer);root.clearInterval(root.enemyAttackTimer);await runtime.flush();},changed:async()=>notifyCloud()});
 root.permanentFarmingCoordinator=coordinator;runtime.bindCoordinator(coordinator);await coordinator.initialize();guard();await coordinator.recover();guard();
 await scriptLoader(document,'permanent-farming-bridge.js?v=20261101-character-switch-v1',guard);guard();
 await root.claimPermanentSingleOffline();guard();
 await scriptLoader(document,'party-inventory-view.js?v=20261027-copy-v1',guard);guard();
 await scriptLoader(document,'monster-audit.js?v=20261014-permanent-entry-v1',guard);guard();
 root.permanentFarmingBooting=false;root.permanentEntryReady=true;root.permanentEntryFailure=null;
 const node=statusNode(document);node.textContent='永久角色存檔已啟用';node.dataset.state='ready';
 root.dispatchEvent(new root.CustomEvent('permanent-entry-ready',{detail:{accountId,revision:runtime.revision}}));return runtime;
}
function reportStartupFailure(error){root.permanentEntryBooting=false;root.permanentEntryReady=false;root.permanentEntryFailure=error;if(root.document){const node=statusNode(root.document);node.dataset.state='error';node.textContent='永久角色系統未啟用；原存檔保持不變。'+error.message;}}
async function cleanupRuntime(){
 const runtime=activeRuntime||root.PermanentPartyRuntime?.current;activeRuntime=null;
 if(runtime?.deactivate)await runtime.deactivate();else if(runtimeStore)runtimeStore.close?.();
 if(automaticCloudSave){try{await automaticCloudSave.stop();}catch{}automaticCloudSave=null;}activeCloudSync=null;
 if(activePlayLease){try{activePlayLease.stop();}catch{}activePlayLease=null;}runtimeStore=null;if(root.permanentFarmingCoordinator?.active===false)root.permanentFarmingCoordinator=null;
 root.permanentFarmingBooting=false;root.permanentEntryReady=false;root.permanentCharacterInventoryEnabled=false;
}
function start(options={}){
 let authorization;try{authorization=authorize(options);authorization.ensureCurrent();assertPageAccount(authorization.accountId);}catch(error){reportStartupFailure(error);return Promise.reject(error);}
 if(stopPromise)return Promise.reject(Error('永久角色系統正在停止，請重新載入頁面'));
 if(startupPromise){
  if(startupAccountId!==authorization.accountId)return Promise.reject(Error('另一個登入帳號的永久角色系統已在此頁準備，請重新載入頁面'));
  startupAuthorization=authorization;
  if(preparationPromise&&preparingAccountId===authorization.accountId)preparationAuthorization=authorization;
  return startupPromise;
 }
 startupAccountId=authorization.accountId;startupAuthorization=authorization;root.permanentEntryBooting=true;
 const epoch=++startupEpoch;
 const ensureCurrent=()=>{if(epoch!==startupEpoch||startupAccountId!==authorization.accountId||startupAuthorization?.accountId!==authorization.accountId)throw Error('登入帳號已切換，永久角色系統已停止啟動');return startupAuthorization.ensureCurrent();};
 const storeFactory=options.storeFactory||root.PermanentPartyStore,document=options.document||root.document;
 const scriptLoader=options.scriptLoader||((doc,src,guard)=>loadScript(doc,src,guard,options.fetcher||root.fetch?.bind(root)));
 const task=Promise.resolve().then(async()=>{
  ensureCurrent();
  const leaseFactory=options.playLeaseFactory||deps.Lease?.create;if(typeof leaseFactory!=='function')throw Error('伺服器遊玩權限模組尚未載入');
  activePlayLease=leaseFactory({controller:authorization.controller,authUserId:authorization.authUserId,storage:options.storage||root.localStorage});
  if(!activePlayLease?.acquire||!activePlayLease?.assertValid)throw Error('伺服器遊玩權限介面不完整');
  await activePlayLease.acquire();ensureCurrent();activePlayLease.assertValid();
  const initialized=await beginInitialization(options,startupAuthorization);
  ensureCurrent();activePlayLease.assertValid();
  runtimeStore=await storeFactory.open({name:authorization.database});ensureCurrent();
  const cloudFactory=options.cloudSyncFactory||deps.Cloud?.create;if(typeof cloudFactory!=='function')throw Error('自動雲端存檔模組尚未載入');
  activeCloudSync=cloudFactory({controller:authorization.controller,store:runtimeStore,authUserId:authorization.authUserId,lease:activePlayLease});
  if(!activeCloudSync?.reconcile)throw Error('雲端存檔啟動檢查尚未載入');
  await activeCloudSync.reconcile();ensureCurrent();activePlayLease.assertValid();
  const account=await verifiedAccount(runtimeStore,authorization.accountId,ensureCurrent);ensureCurrent();activePlayLease.assertValid();
  const runtime=await finishRuntime({store:runtimeStore,account,document,accountId:authorization.accountId,guard:ensureCurrent,scriptLoader,runtimeModule:options.runtimeModule,coordinatorModule:options.coordinatorModule,cloudSync:activeCloudSync,playLease:activePlayLease});ensureCurrent();activePlayLease.assertValid();
  return Object.freeze({account:runtime.getCommitted(),accountId:initialized.accountId,authUserId:initialized.authUserId,created:initialized.created,duplicate:initialized.duplicate,readyForRuntime:true,runtimeStarted:true,runtime,isCurrent:()=>{try{return ensureCurrent().accountId===initialized.accountId&&runtime.active;}catch{return false;}}});
 });
 let guarded;guarded=task.then(result=>{ensureCurrent();root.permanentEntryBooting=false;root.permanentEntryFailure=null;return result;},async error=>{try{await cleanupRuntime();}catch(cleanupError){error.cleanupError=cleanupError;}if(startupPromise===guarded)startupPromise=null;reportStartupFailure(error);throw error;});
 startupPromise=guarded;return startupPromise;
}
function prepareLogout(options={}){
 let authorization;try{authorization=authorize(options);authorization.ensureCurrent();}catch(error){return Promise.reject(error);}
 if(!activeRuntime||!activeCloudSync||!activePlayLease)return Promise.resolve({prepared:true,active:false});
 if(startupAccountId!==authorization.accountId)return Promise.reject(Error('目前遊戲帳號與登入帳號不一致，已停止登出'));
 return Promise.resolve().then(async()=>{
  authorization.ensureCurrent();activePlayLease.assertValid();root.permanentEntryMaintenance=true;
  if(automaticCloudSave){await automaticCloudSave.stop();automaticCloudSave=null;}
  await activeRuntime.beginHandoff();authorization.ensureCurrent();activePlayLease.assertValid();
  if(activeRuntime.coordinator?.dispose)await activeRuntime.coordinator.dispose();
  authorization.ensureCurrent();activePlayLease.assertValid();
  const uploaded=await activeCloudSync.upload({skipEmpty:true});authorization.ensureCurrent();activePlayLease.assertValid();
  const remote=uploaded?.save||await activeCloudSync.getRemote();
  const cloudRevision=remote?.revision||0;
  await activePlayLease.release(cloudRevision);
  await cleanupRuntime();
  return {prepared:true,active:true,cloudRevision};
 }).catch(error=>{root.permanentEntryMaintenance=true;const node=root.document&&statusNode(root.document);if(node){node.textContent='登出前存檔同步未完成，遊戲已停止操作；請保持此頁並安全重試：'+error.message;node.dataset.state='error';}throw error;});
}
function characterChangeAuthorization(options){const authorization=authorize(options);authorization.ensureCurrent();if(!activeRuntime?.active||!activeCloudSync||!activePlayLease?.active)throw Error('永久角色系統尚未準備完成');if(startupAccountId!==authorization.accountId)throw Error('目前遊戲帳號與登入帳號不一致，已停止變更角色');activePlayLease.assertValid();return authorization;}
function prepareCharacterChange(options={}){
 let authorization;try{authorization=characterChangeAuthorization(options);}catch(error){return Promise.reject(error);}
 if(characterChangePromise)return characterChangePromise;
 const task=Promise.resolve().then(async()=>{authorization.ensureCurrent();activePlayLease.assertValid();if(typeof root.preparePermanentCharacterChange!=='function')throw Error('角色掛機切換介面尚未準備完成');const farming=await root.preparePermanentCharacterChange();authorization.ensureCurrent();activePlayLease.assertValid();const uploaded=await activeCloudSync.upload({skipEmpty:true});authorization.ensureCurrent();activePlayLease.assertValid();return {prepared:true,accountId:authorization.accountId,farming,cloudRevision:uploaded?.save?.revision||0};});
 characterChangePromise=task.finally(()=>{characterChangePromise=null;});return characterChangePromise;
}
function completeCharacterChange(options={}){
 let authorization;try{authorization=characterChangeAuthorization(options);}catch(error){return Promise.reject(error);}
 return Promise.resolve().then(async()=>{authorization.ensureCurrent();activePlayLease.assertValid();await activeRuntime.flush();const uploaded=await activeCloudSync.upload({skipEmpty:true});authorization.ensureCurrent();activePlayLease.assertValid();root.completePermanentCharacterChange?.();return {completed:true,accountId:authorization.accountId,cloudRevision:uploaded?.save?.revision||0};});
}
function stop(options={}){
 if(stopPromise)return stopPromise;
 const hadStarted=Boolean(startupPromise||activeRuntime||root.PermanentPartyRuntime?.current||root.permanentEntryBooting);
 ++startupEpoch;startupAuthorization=null;characterChangePromise=null;preparationAuthorization=null;goldAuthorization=null;goldPreparation=null;goldPreparationPromise=null;farmingRecoveryAuthorization=null;farmingRecoveryPreparation=null;root.permanentEntryBooting=false;root.permanentEntryReady=false;root.permanentEntryMaintenance=false;
 stopPromise=(async()=>{let failure=null;try{await cleanupRuntime();}catch(error){failure=error;}if(startupPromise){try{await startupPromise;}catch{}}
  try{await cleanupRuntime();}catch(error){failure||=error;}if(failure)throw failure;return {stopped:true,hadStarted,reason:options.reason||'invalidated'};
 })();return stopPromise;
}
function state(){return Object.freeze({accountId:startupAccountId||farmingRecoveryPreparation?.accountId||farmingRecoveryAuthorization?.accountId||null,starting:Boolean((startupPromise&&!root.permanentEntryReady)||farmingRecoveryPromise||farmingRecoveryPreparation),active:Boolean(root.permanentEntryReady&&activeRuntime?.active),cloudSyncActive:Boolean(automaticCloudSave&&!automaticCloudSave.paused),leaseActive:Boolean(activePlayLease?.active),maintenance:Boolean(root.permanentEntryMaintenance&&activeRuntime?.active),stopping:Boolean(stopPromise),preparedAccountId});}
const boot=start;
return {readLegacy,readSettings,identity,markerKey,verifiedAccount,initializeAccount,prepareFarmingRecovery,confirmFarmingRecovery,prepareSharedGoldMigration,confirmSharedGoldMigration,prepareCharacterChange,completeCharacterChange,prepareLogout,boot,start,stop,state,AUTHORITY_KEYS,MARKER_PREFIX,PRODUCTION_ACCOUNT,PRODUCTION_DATABASE,AUTHENTICATED_ACCOUNT_PREFIX};
});
