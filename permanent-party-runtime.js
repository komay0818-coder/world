(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./permanent-online-policy'):root.PermanentOnlinePolicy,node?require('./permanent-party-policy'):root.PermanentPartyPolicy,node?require('./party-experience-policy'):root.PartyExperiencePolicy);if(node)module.exports=api;else root.PermanentPartyRuntime=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Online,Policy,Experience){
'use strict';let active=null;
function create({store,account,onFailure=()=>{},onCommitted=()=>{},generate=()=>crypto.randomUUID(),legacyOffline=false}){
 if(!store||!account||typeof account.id!=='string'||!account.id||!account.permanent)throw Error('Complete permanent runtime account required');
 Policy.validate(account.permanent);
 let coordinator=null,state='active',deactivatePromise=null;
 let committed=Online.copy(account),draft=Online.compactModel(account.permanent),settings=Online.copy(account.settings||{}),pending=false,inFlight=false,error=null,scheduled=null,waiters=[],externalBusy=false,externalWaiters=[],reads=new Map(),readSequence=0,cleanupHooks=new Set(),goldListeners=new Set();
 function releaseExternal(failure){externalBusy=false;for(const w of externalWaiters.splice(0))failure?w.reject(failure):w.resolve(Online.copy(committed));}
 function acceptAccount(value){if(!value||value.id!==committed.id||!value.permanent)throw Error('Permanent runtime account identity mismatch');Policy.validate(value.permanent);return Online.copy(value);}
 const ensure=()=>{if(state!=='active')throw Error('Permanent runtime is stopping or stopped');if(error)throw error;};
 function drain(){if(error)return Promise.reject(error);if(externalBusy)return new Promise((resolve,reject)=>externalWaiters.push({resolve,reject}));if(scheduled||inFlight||pending)return new Promise((resolve,reject)=>waiters.push({resolve,reject}));return Promise.resolve(Online.copy(committed));}
 function fail(e){error=e;draft=Online.copy(committed.permanent);settings=Online.copy(committed.settings||{});pending=false;onFailure(e);for(const waiter of waiters.splice(0))waiter.reject(e);}
 function emitGoldChange(previous,next,transactionId){if(Policy.sharedGoldState(previous?.permanent).status!=='ready'||Policy.sharedGoldState(next?.permanent).status!=='ready')return;const before=Policy.getSharedGold(previous.permanent),balance=Policy.getSharedGold(next.permanent);if(before===balance)return;const event=Object.freeze({transactionId,type:balance>before?'credit':'debit',amount:Math.abs(balance-before),before,balance,duplicate:false});for(const callback of goldListeners)try{callback(event);}catch(e){onFailure(e);}}
 function schedule(){ensure();pending=true;if(scheduled)return;scheduled=Promise.resolve().then(async()=>{
   inFlight=true;const model=draft,preferences=Online.copy(settings);try{const previous=committed;let commandId=null;if(JSON.stringify(model)!==JSON.stringify(committed.permanent)){commandId='online-v2:'+committed.revision+':'+generate();const result=await store.commitOnline(committed.id,committed.revision,commandId,model,{},coordinator?{tokens:coordinator.tokens()}:undefined);committed={...acceptAccount(result.account),settings:Online.copy(committed.settings||{}),settingsRevision:committed.settingsRevision||0};}if(JSON.stringify(preferences)!==JSON.stringify(committed.settings||{})){const result=await store.saveSettings(committed.id,committed.settingsRevision||0,preferences);committed={...committed,...Online.copy(result)};}pending=false;inFlight=false;scheduled=null;const finished=waiters.splice(0);try{if(state==='active'){if(commandId)emitGoldChange(previous,committed,commandId);onCommitted(previous,committed);}}catch(e){for(const waiter of finished)waiter.reject(e);throw e;}if(pending)waiters.unshift(...finished);else for(const waiter of finished)waiter.resolve(committed);}catch(e){inFlight=false;scheduled=null;fail(e);}
 });}
 function change(transform){ensure();if(inFlight||externalBusy)throw Error('Save transaction in flight; await flush before retry');try{const next=transform(Online.copy(draft));Policy.validate(next);if(JSON.stringify(next)!==JSON.stringify(draft)){draft=next;schedule();}}catch(e){fail(e);throw e;}}
 function hasSharedGold(model){return Policy.sharedGoldState(model).status==='ready';}
 function projectSharedGold(model,value){if(hasSharedGold(model))value.gold=Policy.getSharedGold(model);return value;}
 function mirrorSharedGold(model,balance){for(const role of Object.values(model.characters))role.progress.gold=balance;}
 function read(id){const value=projectSharedGold(draft,Online.readProgress(draft,id)),token='read-'+(++readSequence);reads.set(token,{id,value:Online.copy(value)});if(reads.size>256)reads.delete(reads.keys().next().value);value.__permanentReadToken=token;return value;}
 function merge(model,id,value,{bag=true}={}){
  const origin=reads.get(value.__permanentReadToken);if(!origin||origin.id!==id)throw Error('Missing/stale progress identity; read the current owner before saving');
  const base=origin.value,current=Online.readProgress(model,id),result=Online.copy(current),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const apply=(key,desired,was,now)=>{if(equal(desired,was))return now;if(!equal(now,was)&&!equal(now,desired))throw Error('Stale progress field conflict: '+key);return desired;};
  const sharedGold=hasSharedGold(model);
  for(const key of new Set([...Object.keys(base),...Object.keys(value)]))if(!['inventory','party','potions','manaPotions','__permanentReadToken',...(sharedGold?['gold']:[])].includes(key))result[key]=apply(key,value[key],base[key],current[key]);
  if(sharedGold){
   const desired=Number(value.gold),was=Number(base.gold),now=Policy.getSharedGold(model);
   if(!Number.isSafeInteger(desired)||desired<0||!Number.isSafeInteger(was)||was<0)throw Error('Invalid shared gold projection');
   if(desired!==was){if(now!==was)throw Error('Stale shared gold conflict');const changed=Policy.adjustSharedGold(model,desired-was);model.accountResources=changed.accountResources;}
   const balance=Policy.getSharedGold(model);result.gold=balance;mirrorSharedGold(model,balance);
  }
  if(bag){result.inventory=apply('inventory',value.inventory,base.inventory,current.inventory);for(const [key,item]of [['potions','healing-potion'],['manaPotions','mana-potion']]){if(!equal(value[key],base[key])&&equal(value.inventory,base.inventory))throw Error('Potion counter changed without inventory');result[key]=Online.quantity(result.inventory,item);}}
  const ids=apply('party',value.party?.activeMemberIds||base.party.activeMemberIds,base.party.activeMemberIds,current.party.activeMemberIds);result.party={...current.party,activeMemberIds:ids};return result;
 }
 const readable=()=>{if(state==='stopped'||!committed||!draft)throw Error('Permanent runtime has been stopped');};
 const api={get active(){return state==='active';},get stopping(){return state==='stopping'||state==='quiescing';},get stopped(){return state==='stopped';},get busy(){return state!=='active'||pending||externalBusy||Boolean(coordinator?.busy);},get singleOfflineEnabled(){return state==='active'&&legacyOffline;},get failure(){return error;},get hasCharacters(){readable();return Object.keys(draft.characters).length>0;},get readyForGameplay(){return state==='active'&&Boolean(api.mainId);},get mainId(){if(state==='stopped'||!draft)return null;const id=coordinator?coordinator.mainId:draft.activeMainId;return id&&draft.characters[id]?id:null;},get model(){readable();return Online.copy(draft);},get revision(){readable();return committed.revision;},getCommitted(){readable();return Online.copy(committed);},
  getSlots(){ensure();return draft.slotOrder.map(id=>id?{character:Online.copy(draft.characters[id].character),progress:read(id)}:null);},getProgress(id){ensure();const owner=id||api.mainId;return owner?read(owner):null;},getParty(id){ensure();const owner=id||api.mainId;return owner?Online.party(draft,owner):null;},
  getSharedGold(){ensure();return Policy.getSharedGold(draft);},
  onSharedGoldChanged(callback){ensure();if(typeof callback!=='function')throw Error('Shared gold listener required');goldListeners.add(callback);return ()=>goldListeners.delete(callback);},
  async transactSharedGold(transactionId,operation,options){
   ensure();await api.flush();ensure();if(externalBusy)throw Error('Shared gold transaction busy');externalBusy=true;let failure;
   try{const before=Policy.getSharedGold(committed.permanent),result=await store.transactSharedGold(committed.id,committed.revision,transactionId,operation,options),loaded=acceptAccount(result.account);ensure();committed={...loaded,settings:Online.copy(loaded.settings||committed.settings||{}),settingsRevision:loaded.settingsRevision??committed.settingsRevision??0};draft=Online.compactModel(loaded.permanent);settings=Online.copy(committed.settings||{});reads.clear();const event=Object.freeze({transactionId,type:operation.type,amount:operation.amount,before,balance:result.balance,duplicate:result.duplicate});if(result.balance!==before)for(const callback of goldListeners)try{callback(event);}catch(e){onFailure(e);}return {...result,event};}catch(e){failure=e;throw e;}finally{releaseExternal(failure);}
  },
  creditSharedGold(transactionId,amount,options){return api.transactSharedGold(transactionId,{type:'credit',amount},options);},
  debitSharedGold(transactionId,amount,options){return api.transactSharedGold(transactionId,{type:'debit',amount},options);},
  async sellItems(transactionId,selections,options){
   ensure();await api.flush();ensure();if(externalBusy)throw Error('Item sale transaction busy');externalBusy=true;let failure;
   try{const previous=Online.copy(committed),before=Policy.getSharedGold(committed.permanent),result=await store.sellItems(committed.id,committed.revision,transactionId,selections,options),loaded=acceptAccount(result.account);ensure();committed={...loaded,settings:Online.copy(loaded.settings||committed.settings||{}),settingsRevision:loaded.settingsRevision??committed.settingsRevision??0};draft=Online.compactModel(loaded.permanent);settings=Online.copy(committed.settings||{});reads.clear();const event=Object.freeze({transactionId,type:'sale',amount:result.summary?.proceeds||0,before,balance:result.balance,duplicate:result.duplicate,summary:result.summary?Online.copy(result.summary):null});if(!result.duplicate){for(const callback of goldListeners)try{callback(event);}catch(e){onFailure(e);}onCommitted(previous,committed);}return {...result,event};}catch(e){failure=e;throw e;}finally{releaseExternal(failure);}
  },
  async discardStarterEquipment(transactionId,instanceId,options){
   ensure();await api.flush();ensure();if(externalBusy)throw Error('Equipment discard transaction busy');externalBusy=true;let failure;
   try{const previous=Online.copy(committed),result=await store.discardStarterEquipment(committed.id,committed.revision,transactionId,instanceId,options),loaded=acceptAccount(result.account);ensure();committed={...loaded,settings:Online.copy(loaded.settings||committed.settings||{}),settingsRevision:loaded.settingsRevision??committed.settingsRevision??0};draft=Online.compactModel(loaded.permanent);settings=Online.copy(committed.settings||{});reads.clear();if(!result.duplicate)onCommitted(previous,committed);return result;}catch(e){failure=e;throw e;}finally{releaseExternal(failure);}
  },
  view(id){ensure();return api.mainId?Policy.selectedCharacter(draft,{mainId:api.mainId,viewedId:id||api.mainId}):null;},
  saveProgress:(id,value)=>change(m=>Online.putProgress(m,id,merge(m,id,value),{generate})),
  beginExperienceBattle(sessionId){if(!sessionId)throw Error('Battle identity required');if(!api.mainId)throw Error('Active character required before battle');change(m=>{const progress=m.characters[api.mainId].progress;if(progress.partyExperienceBattle?.sessionId!==sessionId)progress.partyExperienceBattle={sessionId,slots:{}};return m;});},
  canRewardExperience(sessionId,index,spawnedAt){const ledger=draft.characters[api.mainId]?.progress.partyExperienceBattle;return ledger?.sessionId===sessionId&&Number.isInteger(index)&&index>=0&&Number.isFinite(spawnedAt)&&spawnedAt>(ledger.slots[index]??-Infinity);},
  saveExperienceReward(value,event){let awards=[];if(!api.canRewardExperience(event.sessionId,event.index,event.spawnedAt))return {duplicate:true,awards};
   change(m=>{const party=m.parties[api.mainId].memberIds;
    if(!Array.isArray(event.members)||event.members.length>3||new Set(event.members.map(x=>x.id)).size!==event.members.length||event.members.some(x=>!party.includes(x.id)||!m.characters[x.id]))throw Error('Experience participant identity mismatch');
    const main=event.members.find(x=>x.id===api.mainId);if(!main||main.alive===false||!(main.currentHp>0))throw Error('Main character cannot earn after defeat');
    const shares=Experience.distribute(event.baseXp,event.members.map(x=>({...x,level:m.characters[x.id].progress.level})),event.map);
    awards=shares.map(x=>({...x,...Experience.grow(m.characters[x.id].progress,x.actualExp)}));
    const merged=merge(m,api.mainId,value);const expected=awards.find(x=>x.id===api.mainId);
    if(merged.level!==expected.level||Math.abs(merged.xp-expected.xp)>.000001)throw Error('Main experience calculation mismatch');
    m=Online.putProgress(m,api.mainId,merged,{generate});
    for(const award of awards){m.characters[award.id].progress.level=award.level;m.characters[award.id].progress.xp=award.xp;}
    m.characters[api.mainId].progress.partyExperienceBattle.slots[event.index]=event.spawnedAt;return m;
   });const saved=api.flush();saved.catch(()=>{});return {duplicate:false,awards,saved};
  },
  get coordinator(){return coordinator;},bindCoordinator(value){ensure();if(coordinator)throw Error('Coordinator already bound');coordinator=value;},
  command:command=>{ensure();if(coordinator&&['recruit','leave','delete','switch-main','move-slot'].includes(command.type))throw Error('Use asynchronous farming coordinator');return change(m=>Policy.apply(m,command));},
  buildCharacter(m,character,value,slotIndex){ensure();
   const clean=Online.copy(value);clean.equipment={};delete clean.inventory;delete clean.party;delete clean.potions;delete clean.manaPotions;
   m=Policy.apply(m,{type:'create',id:character.id,character,progress:clean,slotIndex});
   const newItems=Online.copy(value.inventory||[]);
   for(const [counter,itemId,name]of [['potions','healing-potion','治癒藥水'],['manaPotions','mana-potion','魔法藥水']])if(value[counter]>0&&!newItems.some(i=>i.id===itemId)){const template=m.bag.items.find(i=>i.id===itemId);newItems.push({...Online.copy(template||{id:itemId,kind:'consumable',name}),quantity:value[counter]});}
   m.bag.items=m.bag.items.concat(newItems);m=Online.putProgress(m,character.id,value,{bag:false,generate});return Online.compactModel(m);
  },
  async createCharacter(character,value,slotIndex){ensure();const first=!api.hasCharacters;if(coordinator){await coordinator.create(character,value,slotIndex);ensure();if(first)await coordinator.transition({type:'switch-main',characterId:character.id});ensure();return api.getCommitted();}change(m=>{m=api.buildCharacter(m,character,value,slotIndex);return first?Policy.apply(m,{type:'switch-main',characterId:character.id}):m;});return api.flush();},
  flush(){ensure();if(externalBusy)return new Promise((resolve,reject)=>externalWaiters.push({resolve,reject}));if(!pending&&JSON.stringify(draft)===JSON.stringify(committed.permanent)&&JSON.stringify(settings)===JSON.stringify(committed.settings||{}))return Promise.resolve(Online.copy(committed));if(!pending)schedule();return new Promise((resolve,reject)=>waiters.push({resolve,reject}));},
  async login(name){ensure();if(inFlight||externalBusy)throw Error('Save busy');settings['stardust-player-name']=String(name);settings['stardust-session-active']='1';schedule();return api.flush();},
  async logout(){await api.flush();settings['stardust-session-active']='0';schedule();return api.flush();},
  async reset(){if(coordinator)return coordinator.reset();await api.flush();externalBusy=true;let failure;try{const result=await store.resetAccount(committed.id,committed.revision,'reset-v2:'+committed.revision+':'+generate());committed={...acceptAccount(result.account),settings,settingsRevision:committed.settingsRevision||0};draft=Online.copy(committed.permanent);reads.clear();}catch(e){failure=e;throw e;}finally{releaseExternal(failure);}return api.logout();},
  async claimSingleOffline(calculate,{now=Date.now(),seed,failAt,context={},characterId,purpose,episodeId,members}={}){
   if(!legacyOffline)throw Error('Single offline adapter disabled');await api.flush();const id=characterId||api.mainId,role=id?committed.permanent.characters[id]:null;if(!role)return null;if(externalBusy)throw Error('Offline settlement busy');externalBusy=true;let failure;
   try{const pendingJobs=await store.pendingForAccount(committed.id);if(pendingJobs.some(r=>r.job.kind!=='legacy-single'))throw Error('Recover original batch 4 A offline job before proceeding');
    if(pendingJobs.some(r=>r.job.characterId!==id))throw Error('Recover original owner before settling another character');
    if(!pendingJobs.length&&!purpose&&committed.farming&&!committed.farming.eligibility[id]?.eligible)return null;
    const income=purpose==='legacy-cutover'?committed.farming?.legacyDebts?.[id]:purpose==='team-legacy'?committed.farming?.teamOffline?.[id]:null;if(purpose&&!income&&!pendingJobs.length)throw Error('Preserved income ticket missing');if(purpose==='legacy-cutover'&&income)now=income.until;const from=Number(income?.from??role.progress.lastActiveAt??now);if(!pendingJobs.length&&now<=from)return null;
     if(seed===undefined)seed=globalThis.crypto?.getRandomValues?globalThis.crypto.getRandomValues(new Uint32Array(1))[0]:Math.floor(Math.random()*4294967296);
     const requested={id:committed.id+':'+(purpose||'single')+':'+id+':'+from,purpose,episodeId,members,kind:'legacy-single',accountId:committed.id,revision:committed.revision,characterId:id,from,now,seed,context:Online.copy(context),model:Online.copy(committed.permanent)};
    const record=pendingJobs[0]||await store.prepareSingleOffline(requested);let result;
    if(record.status==='committed')result={report:record.result.report,duplicate:true};else{const calculated=await calculate(Online.copy(record.job));result=await store.commitSingleOffline(record.job,calculated,{failAt});}
    const loaded=acceptAccount(await store.read(committed.id));committed=loaded;draft=Online.compactModel(loaded.permanent);settings=Online.copy(loaded.settings||{});reads.clear();return result;
   }catch(e){failure=e;throw e;}finally{releaseExternal(failure);}
  },
  async previewSingleOffline(calculate,{now=Date.now(),seed,context={},characterId,purpose,episodeId,members,allowIneligible=false}={}){
   ensure();await api.flush();ensure();if(typeof calculate!=='function')throw Error('Offline settlement calculator required');
   const id=characterId||api.mainId,role=id?committed.permanent.characters[id]:null;if(!role)throw Error('Unknown offline settlement character');
   const pendingJobs=await store.pendingForAccount(committed.id);if(pendingJobs.some(record=>record.job.kind!=='legacy-single'))throw Error('Recover original batch 4 A offline job before proceeding');
   if(pendingJobs.some(record=>record.job.characterId!==id))throw Error('Recover original owner before settling another character');
   if(!pendingJobs.length&&!purpose&&!allowIneligible&&committed.farming&&!committed.farming.eligibility[id]?.eligible)return null;
   const income=purpose==='legacy-cutover'?committed.farming?.legacyDebts?.[id]:purpose==='team-legacy'?committed.farming?.teamOffline?.[id]:null;
   if(purpose&&!income&&!pendingJobs.length)throw Error('Preserved income ticket missing');if(purpose==='legacy-cutover'&&income)now=income.until;
   const from=Number(pendingJobs[0]?.job?.from??income?.from??role.progress.lastActiveAt??now);if(!pendingJobs.length&&now<=from)return null;
   if(seed===undefined)seed=globalThis.crypto?.getRandomValues?globalThis.crypto.getRandomValues(new Uint32Array(1))[0]:Math.floor(Math.random()*4294967296);
   const job=pendingJobs[0]?.job||{id:committed.id+':'+(purpose||'single')+':'+id+':'+from,purpose,episodeId,members,kind:'legacy-single',accountId:committed.id,revision:committed.revision,characterId:id,from,now,seed,context:Online.copy(context),model:Online.copy(committed.permanent)};
   const calculated=await calculate(Online.copy(job));return {job:Online.copy(job),report:Online.copy(calculated?.report||{skipped:true}),pending:Boolean(pendingJobs.length)};
  },
  captureMember:Online.captureMember,restoreMember:Online.restoreMember,refreshMember:Online.refreshMember,
  async switchMain(id){ensure();if(coordinator)return coordinator.transition({type:'switch-main',characterId:id});await api.flush();api.command({type:'switch-main',characterId:id});return api.flush();},
  async refresh(){ensure();await api.flush();const current=acceptAccount(await store.read(committed.id));ensure();committed=current;draft=Online.compactModel(current.permanent);settings=Online.copy(current.settings||{});reads.clear();return api.model;},
  onDeactivate(callback){ensure();if(typeof callback!=='function')throw Error('Runtime cleanup callback required');cleanupHooks.add(callback);return ()=>cleanupHooks.delete(callback);},
  beginHandoff(){if(state==='stopped')throw Error('Permanent runtime has been stopped');if(state==='active')state='quiescing';return drain();},
  deactivate(){
   if(deactivatePromise)return deactivatePromise;
   state='stopping';
   const hookTasks=[];for(const callback of cleanupHooks){try{hookTasks.push(Promise.resolve(callback()));}catch(e){hookTasks.push(Promise.reject(e));}}
   deactivatePromise=(async()=>{let failure=null;try{await drain();}catch(e){failure=e;}
    try{if(coordinator?.dispose)await coordinator.dispose({account:committed?Online.copy(committed):null});}catch(e){failure||=e;}
    const settled=await Promise.allSettled(hookTasks);failure||=settled.find(result=>result.status==='rejected')?.reason||null;
    try{store.close?.();}catch(e){failure||=e;}
    reads.clear();cleanupHooks.clear();goldListeners.clear();waiters=[];externalWaiters=[];pending=false;inFlight=false;externalBusy=false;scheduled=null;settings={};draft=null;committed=null;coordinator=null;state='stopped';if(active===api)active=null;
    if(failure)throw failure;return {stopped:true};
   })();return deactivatePromise;
  }
 };
 const storage={getItem(key){ensure();if(key==='stardust-character-slots')return JSON.stringify(api.getSlots());if(key==='stardust-progress')return api.mainId?JSON.stringify(api.getProgress()):null;if(key==='stardust-character')return api.mainId?JSON.stringify(draft.characters[api.mainId].character):null;if(key==='stardust-active-character-slot')return api.mainId?String(draft.slotOrder.indexOf(api.mainId)):null;if(key==='stardust-account-resources')return JSON.stringify(draft.accountResources);if(key==='stardust-player-name'&&settings['stardust-session-active']==='0')return null;return settings[key]??null;},
 setItem(key,text){ensure();if(inFlight)throw Error('Save transaction in flight; await flush before retry');const value=String(text);
  if(key==='stardust-progress'){api.saveProgress(api.mainId,JSON.parse(value));return;}
  if(key==='stardust-character'){if(JSON.stringify(draft.characters[api.mainId]?.character)!==value)throw Error('Character identity alias is read-only');return;}
  if(key==='stardust-active-character-slot'){const id=draft.slotOrder[Number(value)];if(!id)throw Error('Unknown main slot');api.command({type:'switch-main',characterId:id});return;}
  if(key==='stardust-account-resources'){change(m=>{m.accountResources=JSON.parse(value);return m;});return;}
  if(key==='stardust-character-slots'){const incoming=JSON.parse(value);if(!Array.isArray(incoming)||incoming.length>4)throw Error('Unsupported character slots');change(m=>{
   if(incoming.some((s,i)=>(s?.character?.id||null)!==(m.slotOrder[i]||null)))throw Error('Use permanent create/delete/move commands');
   for(const s of incoming)if(s)m=Online.putProgress(m,s.character.id,merge(m,s.character.id,s.progress,{bag:false}),{bag:false,generate});return m;
  });return;}
  if(settings[key]!==value){settings[key]=value;schedule();}
 },removeItem(key){ensure();if(inFlight||externalBusy)throw Error('Save transaction in flight; await flush before retry');if(['stardust-character','stardust-progress','stardust-character-slots','stardust-active-character-slot'].includes(key))throw Error('Legacy reset cannot erase permanent authority');delete settings[key];schedule();},clear(){throw Error('Permanent storage cannot be cleared through legacy API');}};
 api.storage=storage;
 // A staged projection is never declared committed until its transaction succeeds.
 return api;
}
return {create,get current(){return active;},activate(runtime){if(active)throw Error('Permanent runtime already active');if(!runtime?.active)throw Error('Active permanent runtime required');active=runtime;return runtime;},deactivate(){return active?active.deactivate():Promise.resolve({stopped:true,alreadyStopped:true});}};
});
