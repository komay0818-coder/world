(async function(){
 'use strict';let releaseBoot;const status=message=>{let node=document.getElementById('permanent-save-status');if(!node){node=document.createElement('output');node.id='permanent-save-status';node.style.cssText='position:fixed;bottom:0;left:0;z-index:999999;background:#222;color:#fff;padding:6px;font-size:12px';document.body.append(node);}node.textContent=message;};
 try{
  if(!['127.0.0.1','localhost'].includes(location.hostname)||!location.pathname.endsWith('/tools/permanent-party-playtest.html'))throw Error('Permanent runtime is restricted to isolated localhost entry');
  const query=new URLSearchParams(location.search),accountId=query.get('account')||'manual-test';if(!/^[a-zA-Z0-9_-]{1,80}$/.test(accountId))throw Error('Invalid isolated account');
  if(query.get('d3')==='1'){if(!navigator.locks?.request)throw Error('Web Locks required for D-3');const hold=new Promise(resolve=>releaseBoot=resolve);await new Promise((resolve,reject)=>navigator.locks.request('permanent-farming-bootstrap:'+accountId,async()=>{resolve();await hold;}).catch(reject));}
  window.permanentAcceptanceRunning=query.get('check')==='1';window.permanentFarmingBooting=query.get('d3')==='1';if(window.permanentFarmingBooting)window.permanentAcceptanceRunning=true;
  const store=await PermanentPartyStore.open({name:'stardust-permanent-stage-b-isolated'});
  const existing=await store.read(accountId),source=existing?.permanent?null:existing?.migrationBackup?.source|| (existing?.slots?{slots:existing.slots,activeMainId:existing.slots.find(Boolean)?.character.id}:PermanentPartyFixture.create());
  const account=existing?.permanent?existing:(await store.migrate(accountId,source,{prepareModel:PermanentOnlinePolicy.compactModel})).account;
  if(account.cutover&&account.cutover.status!=='active'){store.close();throw Error('帳號尚在安全回復中，請完成隔離回復核對後再開啟戰鬥');}
  const runtime=PermanentPartyRuntime.activate(PermanentPartyRuntime.create({store,account,legacyOffline:query.get('legacyOffline')==='1'||query.get('d3')==='1',onFailure:error=>status('儲存已停止，請重新整理：'+error.message),onCommitted:(before,after)=>{if(typeof rebuildBattlePartyMembers!=='function'||typeof fighting==='undefined'||!fighting)return;const fields=['level','equipment','skillLevels','advancedClass'];if(JSON.stringify(before.permanent.slotOrder)!==JSON.stringify(after.permanent.slotOrder)||JSON.stringify(before.permanent.parties)!==JSON.stringify(after.permanent.parties)||Object.keys(after.permanent.characters).some(id=>fields.some(key=>JSON.stringify(before.permanent.characters[id]?.progress[key])!==JSON.stringify(after.permanent.characters[id]?.progress[key]))))rebuildBattlePartyMembers();}}));
  window.permanentIsolatedStore=store;
  // Shadow storage only inside this isolated document. No original storage read/write.
  // Gameplay uses getGameStorage(); native localStorage remains untouched for source-copy verification.
  const session=new Map();Object.defineProperty(window,'sessionStorage',{value:{getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,String(v)),removeItem:k=>session.delete(k)},configurable:true});
  if(!account.settings?.['stardust-player-name'])runtime.storage.setItem('stardust-player-name','永久角色隔離測試');await runtime.flush();
  const canInspectWhileSaving=event=>{
   if(event.type!=='click')return false;
   const target=event.target?.closest?event.target:event.target?.parentElement;
   const button=target?.closest('button');
   if(button)return ['裝備','背包'].includes(button.dataset.menuAction)||button.id==='inventory-close';
   return Boolean(target?.closest('[data-inventory-item-id]'));
  };
  for(const name of ['click','submit','keydown'])document.addEventListener(name,event=>{if(window.permanentFarmingBooting||runtime.failure||(runtime.busy&&!canInspectWhileSaving(event))){event.preventDefault();event.stopImmediatePropagation();}},true);
  const nativeInterval=window.setInterval.bind(window);window.setInterval=(callback,ms,...args)=>nativeInterval(()=>{if(!runtime.busy&&!runtime.failure&&!window.permanentAcceptanceRunning&&(!runtime.singleOfflineEnabled||document.visibilityState!=='hidden'))callback(...args);},ms);
  if(runtime.singleOfflineEnabled){const nativeTimeout=window.setTimeout.bind(window);if(query.get('d3')==='1')window.permanentFarmingNativeTimeout=nativeTimeout;window.setTimeout=(callback,ms,...args)=>{const identity=query.get('d3')==='1'?window.permanentFarmingEventIdentity?.():null;return nativeTimeout(function run(){const current=window.permanentFarmingEventIdentity?.();if(identity&&identity.mainId!==current?.mainId)return;if(runtime.busy||document.visibilityState==='hidden'){nativeTimeout(run,20);return;}if(!runtime.failure)callback(...args);},ms);};}
  if(query.get('d3')==='1'){const nativeFrame=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>{const identity=window.permanentFarmingEventIdentity?.(),combatFrame=callback===window.autoSkillTick;return nativeFrame(function run(timestamp){const current=window.permanentFarmingEventIdentity?.();if(identity&&(identity.mainId!==current?.mainId||(combatFrame&&identity.battle!==current?.battle)))return;if(runtime.busy){nativeFrame(run);return;}if(!runtime.failure)callback(timestamp);});};}
  window.addEventListener('beforeunload',event=>{if(runtime.busy){event.preventDefault();event.returnValue='';}});
  const main=document.createElement('script');main.src='../script.js?v=20261014-party-experience';await new Promise((resolve,reject)=>{main.onload=resolve;main.onerror=reject;document.body.append(main);});
  if(query.get('d3')==='1'){
   const loadScript=src=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=reject;document.body.append(el);});
   await loadScript('../permanent-farming-policy.js?v=20261013-d3-final-9');await loadScript('../permanent-farming-coordinator.js?v=20261013-d3-final-9');
   // Store factory captures dependencies, so farming policy must exist before re-opening the adapter.
   await loadScript('../permanent-party-store.js?v=20261014-d4-complete');
   await runtime.flush();await new Promise(resolve=>setTimeout(resolve,50));await runtime.flush();
   const pending=await store.pendingForAccount(accountId);if(pending.length){if(pending[0].job.kind!=='legacy-single')throw Error('Recover original batch 4 A work before D-3');await runtime.claimSingleOffline(calculatePermanentSingleJob,{characterId:pending[0].job.characterId});}
   if(!runtime.getCommitted().farming)await runtime.claimSingleOffline(calculatePermanentSingleJob,{context:getLegacyOfflineContext()});
   const farmingStore=PermanentPartyStore.wrap(window.permanentIsolatedStoreBase||await OfflineSettlementStore.open({name:'stardust-permanent-stage-b-isolated'}));
   window.permanentFarmingStore=farmingStore;
   window.permanentFarmingCoordinator=PermanentFarmingCoordinator.create({runtime,store:farmingStore,calculate:job=>calculatePermanentSingleJob(job),context:(now,id)=>{const progress=runtime.getProgress(id||runtime.mainId),member={...(progress.partyMemberState?.runtime||{}),progress};return {defenseMultiplier:ChapterThreeSpecialEquipmentPolicy.getDefenseMultiplier(member,now)};},pause:async()=>{if(fighting&&battle.partyMembers?.length)persistPartyRuntimeState();fighting=false;clearInterval(battleTimer);clearInterval(skillTimer);clearInterval(enemyAttackTimer);await runtime.flush();}});
   await window.permanentFarmingCoordinator.initialize();runtime.bindCoordinator(window.permanentFarmingCoordinator);await window.permanentFarmingCoordinator.recover();
   await loadScript('tools/permanent-farming-playtest-bridge.js?v=20261013-d3-final-9');await claimPermanentSingleOffline();window.permanentAcceptanceRunning=query.get('check')==='1';window.permanentFarmingBooting=false;
   window.runD3OnlineAcceptance=async mate=>{await openBattle();await runtime.flush();const original=battle.partyMembers.find(m=>!m.isMain);if(!original)throw Error('Teammate required');original.currentHp=0;original.alive=false;original.shield=17;original.skillCooldowns={probe:Date.now()+60000};original.reviveAt=Date.now()+10000;const state={id:original.id,cooldown:original.skillCooldowns.probe,reviveAt:original.reviveAt};persistPartyRuntimeState();await runtime.flush();await addPartyMember(mate);await runtime.flush();const after=battle.partyMembers.find(m=>m.id===state.id);const result={three:battle.partyMembers.length===3,dead:after?.alive===false&&after.currentHp===0,shield:after?.shield===17,cooldown:after?.skillCooldowns.probe===state.cooldown,reviveAt:after?.reviveAt===state.reviveAt};await window.permanentFarmingCoordinator.stop();const saved=runtime.getProgress();saved.partyMemberState.currentHp=2;runtime.saveProgress(runtime.mainId,saved);await runtime.flush();const enemies=JSON.stringify(battle.enemyHps);restorePermanentFarmingPlayers();result.restoredHp=getMainBattleMember().currentHp===2;result.enemyUnchanged=JSON.stringify(battle.enemyHps)===enemies;return result;};
   window.runD3DelayedAcceptance=async nextId=>{let invoked=false;const gold=runtime.getProgress(nextId).gold;setTimeout(()=>{invoked=true;const p=getProgress();p.gold+=500;saveProgress(p);},150);await runtime.switchMain(nextId);await new Promise(resolve=>setTimeout(resolve,250));await runtime.flush();return {discarded:!invoked,goldUnchanged:runtime.getProgress(nextId).gold===gold};};
   window.runD3CheckpointAcceptance=async()=>{await openBattle();await runtime.flush();const main=getMainBattleMember(),target=Math.floor(main.maxHp*.8);main.currentHp=target;syncLegacyBattleStateFromMain();window.permanentAcceptanceRunning=false;queuePermanentFarmingCheckpoint();window.permanentAcceptanceRunning=true;await new Promise(resolve=>permanentFarmingNativeTimeout(resolve,30));await runtime.flush();const matched=runtime.getProgress().partyMemberState.currentHp===target;await window.permanentFarmingCoordinator.stop();return matched;};
  }
  status('隔離永久存檔已啟用；正式存檔未遷移');
  window.runPermanentRuntimeAcceptance=async()=>{
   window.permanentAcceptanceRunning=true;let passed=0;const assert=(value,label)=>{if(!value)throw Error(label);passed++;};const current=()=>runtime.model;const leader=runtime.mainId,partner=current().slotOrder[1];
   await runtime.flush();const equippedBefore=getProgress().equipment.weapon?.instanceId;
   runtime.storage.setItem('inspection-test',String(Date.now()));assert(runtime.busy,'inspection tested during pending transaction');
   document.querySelector('[data-menu-action="裝備"]').click();assert(!document.querySelector('#inventory-modal').classList.contains('hidden'),'equipment opens immediately while saving');
   document.querySelector('[data-unequip-slot="weapon"]').click();assert(getProgress().equipment.weapon?.instanceId===equippedBefore,'equipment mutation remains blocked while saving');
   document.querySelector('#inventory-close').click();assert(document.querySelector('#inventory-modal').classList.contains('hidden'),'inspection closes immediately while saving');await runtime.flush();
   await runtime.flush();const start=runtime.getCommitted();
   assert(getCharacterSlots().length===3,'three permanent roles');assert(getProgress().inventory.filter(i=>i.id==='black-ore').reduce((n,i)=>n+i.quantity,0)===9,'shared inventory conservation');
   removePartyMember(partner);await runtime.flush();assert(!current().parties[leader].memberIds.includes(partner),'leave refs');
   addPartyMember(partner);await runtime.flush();assert(current().parties[leader].memberIds.includes(partner),'recruit refs');assert(current().characters[partner].progress.xp===12.75,'growth retained');
   const beforeView=runtime.mainId;runtime.view(partner);assert(runtime.mainId===beforeView,'view no main switch');
   const p=getProgress();p.gold+=7;saveProgress(p);await runtime.flush();assert(current().characters[leader].progress.gold===start.permanent.characters[leader].progress.gold+7,'main save');assert(current().characters[partner].progress.gold===start.permanent.characters[partner].progress.gold,'other currency unchanged');
   equipItem('fixture-bag-0','weapon');await runtime.flush();assert(current().equipmentOwners['fixture-bag-0'].kind==='equipped','actual equip handler');assert(current().equipmentOwners['fixture-equipped-0'].kind==='bag','previous gear returned');
   unequipItem('weapon');await runtime.flush();assert(current().equipmentOwners['fixture-bag-0'].kind==='bag','actual unequip handler');
   runtime.command({type:'equip',characterId:leader,slot:'weapon',instanceId:'fixture-equipped-0'});await runtime.flush();
   openBattle();await runtime.flush();
   assert(battle.partyMembers.length===3,'online reads actual three roles');
   fighting=false;clearInterval(battleTimer);clearInterval(skillTimer);clearInterval(enemyAttackTimer);
   fighting=true;battle.sacredGuardianReadyAt=Date.now()+120000;const sharedCooldown=battle.sacredGuardianReadyAt;const member=battle.partyMembers.find(m=>m.id===partner);member.currentHp=0;member.alive=false;member.resourceCurrent=3;member.skillCooldowns={probe:Date.now()+60000};member.reviveAt=Date.now()+10000;member.shield=17;const cooldown=member.skillCooldowns.probe,revive=member.reviveAt;
   rebuildBattlePartyMembers();await runtime.flush();const restored=battle.partyMembers.find(m=>m.id===partner);
   assert(restored.currentHp===0&&!restored.alive,'rebuild no free resurrection');assert(restored.resourceCurrent===3,'MP preserved');assert(restored.skillCooldowns.probe===cooldown&&restored.reviveAt===revive&&restored.shield===17,'cooldown/shield/revive retained');
   runtime.command({type:'equip',characterId:partner,slot:'weapon',instanceId:'fixture-bag-1'});await runtime.flush();
   const geared=battle.partyMembers.find(m=>m.id===partner);assert(geared.progress.equipment.weapon.instanceId==='fixture-bag-1','committed teammate equipment refresh');assert(geared.currentHp===0&&geared.skillCooldowns.probe===cooldown,'gear update no resurrection or cooldown reset');
   const grown=runtime.getProgress(partner);grown.level+=1;runtime.saveProgress(partner,grown);await runtime.flush();const leveled=battle.partyMembers.find(m=>m.id===partner);assert(leveled.level===grown.level&&leveled.stats.attack===getCharacterStats(grown.level,grown,leveled.character).attack,'committed growth refresh uses existing stats');assert(leveled.currentHp===0&&leveled.resourceCurrent===3&&leveled.shield===17,'growth refresh no free HP MP shield reset');
   removePartyMember(partner);await runtime.flush();addPartyMember(partner);await runtime.flush();const rejoined=battle.partyMembers.find(m=>m.id===partner);assert(!rejoined.alive&&rejoined.skillCooldowns.probe===cooldown,'rejoin no reset');
   fighting=false;await activateCharacterSlot(1);assert(runtime.mainId===partner,'actual switch main');assert(getProgress().selectedMapId===current().characters[partner].progress.selectedMapId,'map belongs selected role');assert(claimOfflineRewards()===null,'no offline activation');
   await activateCharacterSlot(0);await runtime.flush();
   const persisted=await store.read(accountId);assert(JSON.stringify(persisted.permanent)===JSON.stringify(runtime.model),'one persisted authority');assert(!('slots'in persisted),'no legacy authority');assert(persisted.permanent.characters[leader].progress.partyMemberState.partySharedCooldowns.sacredGuardianReadyAt===sharedCooldown,'shared guardian cooldown saved by participating role');openBattle();await runtime.flush();fighting=false;clearInterval(battleTimer);clearInterval(skillTimer);clearInterval(enemyAttackTimer);assert(battle.sacredGuardianReadyAt===sharedCooldown,'new online battle cannot reset shared guardian cooldown');
   return {passed,failed:0,revision:persisted.revision,accountId};
  };
  window.runPermanentRuntimeRace=async(kind='gold')=>{window.permanentAcceptanceRunning=true;await runtime.flush();await runtime.refresh();if(kind==='experience'){
 const ids=runtime.model.parties[runtime.mainId].memberIds,p=runtime.getProgress(),event={sessionId:p.partyExperienceBattle.sessionId,index:0,spawnedAt:200,baseXp:1,map:{chapter:3,recommendedMaxLevel:45},members:ids.map(id=>({id,alive:true,currentHp:40}))};
 const gain=PartyExperiencePolicy.distribute(1,ids.map(id=>({id,level:runtime.getProgress(id).level,alive:true,currentHp:40})),event.map).find(x=>x.id===runtime.mainId),growth=PartyExperiencePolicy.grow(p,gain.actualExp);p.level=growth.level;p.xp=growth.xp;
 const channel=new BroadcastChannel('experience-race:'+accountId);await new Promise(resolve=>{channel.onmessage=e=>{if(e.data==='ready'){channel.postMessage('ack');resolve();}if(e.data==='ack')resolve();};channel.postMessage('ready');});channel.close();
 try{await runtime.saveExperienceReward(p,event).saved;return {status:'committed',kind,revision:runtime.revision,xp:ids.map(id=>runtime.getProgress(id).xp)};}catch(error){return {status:'rejected',kind,reason:error.message};}
 }const p=getProgress();p.gold+=1;await new Promise(resolve=>setTimeout(resolve,1500));try{if(kind==='gear')equipItem('fixture-bag-0','weapon');else saveProgress(p);await runtime.flush();const model=runtime.model;return {status:'committed',kind,revision:runtime.revision,equipmentInstances:Object.keys(model.equipmentOwners).length,equippedId:model.characters[runtime.mainId].progress.equipment.weapon?.instanceId};}catch(error){return {status:'rejected',reason:error.message};}};
  window.runD2ActualReward=async()=>{openBattle();await runtime.flush();const before=getProgress().gold;battle.enemyHps[0]=0;rewardVictory(0);await runtime.flush();const first=runtime.model;rewardVictory(0);await runtime.flush();const result={earned:getProgress().gold-before,duplicateBlocked:JSON.stringify(first)===JSON.stringify(runtime.model),cutoff:getProgress().lastActiveAt};fighting=false;clearInterval(battleTimer);clearInterval(skillTimer);clearInterval(enemyAttackTimer);return result;};
  window.runPartyExperienceAcceptance=async()=>{
   let passed=0;const assert=(v,m)=>{if(!v)throw Error(m);passed++;},equal=(a,b,m)=>assert(JSON.stringify(a)===JSON.stringify(b),m+" actual="+JSON.stringify(a)+" expected="+JSON.stringify(b));
   const r=runtime,ids=r.model.parties[r.mainId].memberIds,originalMap=getActiveMap,originalEnemy=getEnemyDefinition;
   const fourth='character-'+crypto.randomUUID();fighting=false;window.permanentAcceptanceRunning=true;
   await r.createCharacter({...r.model.characters[r.mainId].character,id:fourth,name:'未入隊驗收'}, {level:20,xp:0,equipment:{},inventory:[],potions:0,manaPotions:0},3);
   const fourthBefore=JSON.stringify(r.model.characters[fourth]);
   getActiveMap=()=>ChapterThreeMapPolicy.MAPS.find(m=>m.id==='redrock-temple');
   getEnemyDefinition=index=>({...originalEnemy(index),mapId:'redrock-temple',xp:90});
   const trial=async(levels,dead=[],nearLevel=false)=>{
    fighting=false;for(let i=0;i<ids.length;i++){const p=r.getProgress(ids[i]);p.level=levels[i];p.xp=nearLevel?requiredXp(levels[i])-1:0;r.saveProgress(ids[i],p);}await r.flush();
    openBattle();await r.flush();for(const member of battle.partyMembers){member.alive=!dead.includes(member.id);member.currentHp=member.alive?40:0;member.shield=17;member.skillCooldowns.probe=Date.now()+60000;}
    const states=battle.partyMembers.map(m=>({id:m.id,hp:m.currentHp,alive:m.alive,shield:m.shield,cooldown:m.skillCooldowns.probe}));
    battle.enemyHps[0]=0;rewardVictory(0);await r.flush();return states;
   };
   try{
    await trial([30,33,36]);equal(ids.map(id=>r.getProgress(id).xp),[30,21,12],'three divide before personal decay');
    await trial([30,33,36],[ids[1]]);equal(ids.map(id=>r.getProgress(id).xp),[45,0,18],'two alive divide by two');
    await trial([30,33,36],[ids[1],ids[2]]);equal(ids.map(id=>r.getProgress(id).xp),[90,0,0],'sole survivor receives base');
    equal(JSON.stringify(r.model.characters[fourth]),fourthBefore,'fourth never earns');
    const states=await trial([20,20,20],[],true);
    for(const state of states){const p=r.getProgress(state.id),member=battle.partyMembers.find(m=>m.id===state.id);assert(p.level===21&&p.xp===29,'independent level and XP');assert(member.level===21,'live level');assert(member.currentHp===state.hp&&member.alive===state.alive,'no healing/revival');assert(member.shield===17&&member.skillCooldowns.probe===state.cooldown,'shield/cooldown preserved');}
    const snapshot=JSON.stringify(r.model);battle.rewardedEnemyIndexes=new Set();rewardVictory(0);await r.flush();equal(JSON.stringify(r.model),snapshot,'duplicate callback even without memory receipt');
    fighting=false;const before=r.getProgress(ids[1]);removePartyMember(ids[1]);await r.flush();addPartyMember(ids[1]);await r.flush();equal([r.getProgress(ids[1]).level,r.getProgress(ids[1]).xp],[before.level,before.xp],'leave rejoin');
    await activateCharacterSlot(1);equal([getProgress().level,getProgress().xp],[21,29],'main switch');await activateCharacterSlot(0);
    const account=await store.read(accountId),peer=PermanentPartyRuntime.create({store,account});peer.beginExperienceBattle('browser-race');await peer.flush();await r.refresh();
    const commit=(rt,spawn)=>{const event={sessionId:'browser-race',index:0,spawnedAt:spawn,baseXp:1,map:{chapter:3,recommendedMaxLevel:45},members:ids.map(id=>({id,alive:true,currentHp:40}))},p=rt.getProgress();const grow=PartyExperiencePolicy.grow(p,PartyExperiencePolicy.distribute(1,ids.map(id=>({id,level:rt.getProgress(id).level,alive:true,currentHp:40})),event.map).find(a=>a.id===rt.mainId).actualExp);p.level=grow.level;p.xp=grow.xp;return rt.saveExperienceReward(p,event).saved;};
    const race=await Promise.allSettled([commit(r,100),commit(peer,100)]);assert(race.filter(v=>v.status==='fulfilled').length===1&&race.filter(v=>v.status==='rejected').length===1,'two writers one CAS winner');
    const latest=await store.read(accountId),safe=PermanentPartyRuntime.create({store,account:latest});assert(!safe.canRewardExperience('browser-race',0,100),'database receipt survives race');
    for(const id of ids)assert(safe.getProgress(id).xp===29.33,'two-decimal gain once');
    const originalCommit=store.commitOnline;store.commitOnline=(...args)=>{args[5]={...args[5],failAt:'after-account'};return originalCommit(...args);};
    try{await commit(safe,101);throw Error('Expected storage abort');}catch(error){assert(error.message.includes('Injected after account'),'real IndexedDB abort');}finally{store.commitOnline=originalCommit;}
    equal((await store.read(accountId)).permanent,latest.permanent,'failure leaves all roles bag receipt atomic');
    return {passed,failed:0,accountId,expected:ids.map(id=>({id,level:latest.permanent.characters[id].progress.level,xp:latest.permanent.characters[id].progress.xp})),session:'browser-race'};
   }finally{fighting=false;clearInterval(battleTimer);clearInterval(skillTimer);clearInterval(enemyAttackTimer);getActiveMap=originalMap;getEnemyDefinition=originalEnemy;}
  };
  window.permanentRuntimeReady=true;releaseBoot?.();
 }catch(error){releaseBoot?.();status('隔離接線未啟用：'+error.message);window.permanentRuntimeBootFailure=error.message||'Script loading failed';}
})();



