(function(root,factory){
'use strict';
const node=typeof module==='object'&&module.exports;
const api=factory(root,node?{
 Policy:require('./permanent-party-policy'),Cutover:require('./permanent-cutover-policy')
}:{
 Policy:root.PermanentPartyPolicy,Cutover:root.PermanentCutoverPolicy
});
if(node)module.exports=api;else{root.PermanentEntryBootstrap=api;api.start().catch(()=>{});}
})(typeof globalThis!=='undefined'?globalThis:this,function(root,deps){
'use strict';
const AUTHORITY_KEYS=new Set(['stardust-character-slots','stardust-character','stardust-progress','stardust-active-character-slot','stardust-account-resources']);
const MARKER_PREFIX='stardust-permanent-cutover-v2';
const PRODUCTION_ACCOUNT='stardust-local-account-v2';
const PRODUCTION_DATABASE='stardust-permanent-production-v2';
const copy=value=>JSON.parse(JSON.stringify(value));
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
function identity(location=root.location){const query=new URLSearchParams(location?.search||''),local=['127.0.0.1','localhost'].includes(location?.hostname);const requested=local?query.get('permanentTestAccount'):null;if(requested&&!/^[a-zA-Z0-9_-]{1,80}$/.test(requested))throw Error('測試帳號識別不正確');return {accountId:requested||PRODUCTION_ACCOUNT,database:requested?PRODUCTION_DATABASE+'-test':PRODUCTION_DATABASE,testing:Boolean(requested)};}
function markerKey(accountId){return accountId===PRODUCTION_ACCOUNT?MARKER_PREFIX:MARKER_PREFIX+':'+accountId;}
function statusNode(document){let node=document.getElementById('permanent-entry-status');if(!node){node=document.createElement('output');node.id='permanent-entry-status';node.setAttribute('aria-live','polite');node.style.cssText='position:fixed;left:12px;bottom:12px;z-index:1000000;max-width:min(620px,calc(100vw - 24px));padding:9px 12px;border:1px solid #53798b;border-radius:8px;background:#102431;color:#eaf9ff;font:13px/1.45 sans-serif;box-shadow:0 4px 18px #0008';document.body.append(node);}return node;}
function loadScript(document,src){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=()=>resolve(script);script.onerror=()=>reject(Error('無法載入正式程式：'+src));document.body.append(script);});}
async function verifiedAccount(store,accountId,legacy){
 let account=await store.read(accountId);
 if(!account?.permanent)account=(await store.migrate(accountId,legacy,{prepareModel:root.PermanentOnlinePolicy?.compactModel||((model)=>model)})).account;
 const bundle=await store.recoveryReport(accountId),report=bundle.report;
 if(!report.valid)throw Error('永久存檔需要人工檢查：'+report.issues.map(issue=>issue.code).join(', '));
 account=await store.read(accountId);deps.Policy.validate(account.permanent);
 if(account.cutover?.status!=='active')throw Error('永久存檔切換尚未完成');
 const again=await store.read(accountId);if(JSON.stringify(account.permanent)!==JSON.stringify(again.permanent)||account.revision!==again.revision)throw Error('永久存檔讀回驗證失敗');
 return again;
}
function installSchedulingGuards(runtime){
 const nativeInterval=root.setInterval.bind(root),nativeTimeout=root.setTimeout.bind(root),nativeFrame=root.requestAnimationFrame?.bind(root);root.permanentFarmingNativeTimeout=nativeTimeout;
 root.setInterval=(callback,ms,...args)=>nativeInterval(()=>{if(!runtime.busy&&!runtime.failure&&(!runtime.singleOfflineEnabled||root.document.visibilityState!=='hidden'))callback(...args);},ms);
 root.setTimeout=(callback,ms,...args)=>{const identity=root.permanentFarmingEventIdentity?.();return nativeTimeout(function run(){const current=root.permanentFarmingEventIdentity?.();if(identity&&(identity.mainId!==current?.mainId||identity.battle!==current?.battle))return;if(runtime.busy||root.document.visibilityState==='hidden'){nativeTimeout(run,20);return;}if(!runtime.failure)callback(...args);},ms);};
 if(nativeFrame)root.requestAnimationFrame=callback=>{const identity=root.permanentFarmingEventIdentity?.(),combatFrame=callback===root.autoSkillTick;return nativeFrame(function run(timestamp){const current=root.permanentFarmingEventIdentity?.();if(identity&&(identity.mainId!==current?.mainId||(combatFrame&&identity.battle!==current?.battle)))return;if(runtime.busy){nativeFrame(run);return;}if(!runtime.failure)callback(timestamp);});};
 root.addEventListener('beforeunload',event=>{if(runtime.busy){event.preventDefault();event.returnValue='';}});
}
async function finishRuntime({store,account,document,storage,accountId}){
 root.permanentFarmingBooting=true;root.permanentCharacterInventoryEnabled=true;
 const runtime=root.PermanentPartyRuntime.activate(root.PermanentPartyRuntime.create({store,account,legacyOffline:true,onFailure:error=>{const node=statusNode(document);node.textContent='永久存檔已停止寫入，請重新整理：'+error.message;node.dataset.state='error';},onCommitted:(before,after)=>{if(typeof rebuildBattlePartyMembers!=='function'||typeof fighting==='undefined'||!fighting)return;const fields=['level','equipment','skillLevels','advancedClass'];if(JSON.stringify(before.permanent.slotOrder)!==JSON.stringify(after.permanent.slotOrder)||JSON.stringify(before.permanent.parties)!==JSON.stringify(after.permanent.parties)||Object.keys(after.permanent.characters).some(id=>fields.some(key=>JSON.stringify(before.permanent.characters[id]?.progress[key])!==JSON.stringify(after.permanent.characters[id]?.progress[key]))))rebuildBattlePartyMembers();}}));
 installSchedulingGuards(runtime);
 await loadScript(document,'script.js?v=20261014-permanent-entry-v1');
 const coordinator=root.PermanentFarmingCoordinator.create({runtime,store,calculate:job=>root.calculatePermanentSingleJob(job),context:(now,id)=>{const progress=runtime.getProgress(id||runtime.mainId),member={...(progress.partyMemberState?.runtime||{}),progress};return {defenseMultiplier:root.ChapterThreeSpecialEquipmentPolicy.getDefenseMultiplier(member,now)};},pause:async()=>{if(fighting&&battle.partyMembers?.length)persistPartyRuntimeState();fighting=false;clearInterval(battleTimer);clearInterval(skillTimer);clearInterval(enemyAttackTimer);await runtime.flush();}});
 root.permanentFarmingCoordinator=coordinator;await coordinator.initialize();runtime.bindCoordinator(coordinator);await coordinator.recover();
 await loadScript(document,'permanent-farming-bridge.js?v=20261014-permanent-entry-v1');
 await root.claimPermanentSingleOffline();
 if(root.matchMedia('(min-width:1200px)').matches)await loadScript(document,'party-inventory-view.js?v=20261014-permanent-entry-v1');
 await loadScript(document,'monster-audit.js?v=20261014-permanent-entry-v1');
 root.permanentFarmingBooting=false;root.permanentEntryReady=true;
 const node=statusNode(document);node.textContent='永久角色存檔已啟用';node.dataset.state='ready';
 root.dispatchEvent(new CustomEvent('permanent-entry-ready',{detail:{accountId,revision:runtime.revision}}));return runtime;
}
async function boot(options={}){
 const document=options.document||root.document,storage=options.storage||root.localStorage,navigator=options.navigator||root.navigator,ids=options.identity||identity(root.location),storeFactory=options.storeFactory||root.PermanentPartyStore;
 if(!document||!storage||!navigator?.locks?.request||!storeFactory?.open)throw Error('瀏覽器不支援安全永久存檔，已停止啟用');
 const node=statusNode(document);node.textContent='正在檢查並保護角色存檔…';root.permanentEntryBooting=true;
 return navigator.locks.request('stardust-permanent-cutover:'+ids.accountId,{mode:'exclusive'},async()=>{
  const store=await storeFactory.open({name:ids.database});try{
   const legacy=readLegacy(storage),account=await verifiedAccount(store,ids.accountId,legacy),marker={version:2,accountId:ids.accountId,revision:account.revision,cutover:account.cutover?.sourceDigest||null};
   storage.setItem(markerKey(ids.accountId),JSON.stringify(marker));
   const runtime=await finishRuntime({store,account,document,storage,accountId:ids.accountId});root.permanentEntryBooting=false;return {runtime,accountId:ids.accountId,testing:ids.testing};
  }catch(error){store.close();throw error;}
 });
}
async function start(){try{return await boot();}catch(error){root.permanentEntryBooting=false;root.permanentEntryFailure=error;const node=statusNode(root.document);node.dataset.state='error';node.textContent='永久角色系統未啟用；原存檔保持不變。'+error.message;throw error;}}
return {readLegacy,readSettings,identity,markerKey,verifiedAccount,boot,start,AUTHORITY_KEYS,MARKER_PREFIX,PRODUCTION_ACCOUNT,PRODUCTION_DATABASE};
});
