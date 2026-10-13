(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./permanent-online-policy'):root.PermanentOnlinePolicy,node?require('./permanent-party-policy'):root.PermanentPartyPolicy);if(node)module.exports=api;else root.PermanentPartyRuntime=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Online,Policy){
'use strict';let active=null;
function create({store,account,onFailure=()=>{},onCommitted=()=>{},generate=()=>crypto.randomUUID(),legacyOffline=false}){
 let coordinator=null;
 let committed=Online.copy(account),draft=Online.compactModel(account.permanent),settings=Online.copy(account.settings||{}),pending=false,inFlight=false,error=null,scheduled=null,waiters=[],externalBusy=false,externalWaiters=[],reads=new Map(),readSequence=0;
 function releaseExternal(failure){externalBusy=false;for(const w of externalWaiters.splice(0))failure?w.reject(failure):w.resolve(Online.copy(committed));}
 const ensure=()=>{if(error)throw error;};
 function fail(e){error=e;draft=Online.copy(committed.permanent);settings=Online.copy(committed.settings||{});pending=false;onFailure(e);for(const waiter of waiters.splice(0))waiter.reject(e);}
 function schedule(){ensure();pending=true;if(scheduled)return;scheduled=Promise.resolve().then(async()=>{
   inFlight=true;const model=draft,preferences=Online.copy(settings);try{const previous=committed;if(JSON.stringify(model)!==JSON.stringify(committed.permanent)){const result=await store.commitOnline(committed.id,committed.revision,'online-v2:'+committed.revision+':'+generate(),model,{},coordinator?{tokens:coordinator.tokens()}:undefined);committed={...Online.copy(result.account),settings:Online.copy(committed.settings||{}),settingsRevision:committed.settingsRevision||0};}if(JSON.stringify(preferences)!==JSON.stringify(committed.settings||{})){const result=await store.saveSettings(committed.id,committed.settingsRevision||0,preferences);committed={...committed,...Online.copy(result)};}pending=false;inFlight=false;scheduled=null;const finished=waiters.splice(0);try{onCommitted(previous,committed);}catch(e){for(const waiter of finished)waiter.reject(e);throw e;}if(pending)waiters.unshift(...finished);else for(const waiter of finished)waiter.resolve(committed);}catch(e){inFlight=false;scheduled=null;fail(e);}
 });}
 function change(transform){ensure();if(inFlight||externalBusy)throw Error('Save transaction in flight; await flush before retry');try{const next=transform(Online.copy(draft));Policy.validate(next);if(JSON.stringify(next)!==JSON.stringify(draft)){draft=next;schedule();}}catch(e){fail(e);throw e;}}
 function read(id){const value=Online.readProgress(draft,id),token='read-'+(++readSequence);reads.set(token,{id,value:Online.copy(value)});if(reads.size>256)reads.delete(reads.keys().next().value);value.__permanentReadToken=token;return value;}
 function merge(model,id,value,{bag=true}={}){
  const origin=reads.get(value.__permanentReadToken);if(!origin||origin.id!==id)throw Error('Missing/stale progress identity; read the current owner before saving');
  const base=origin.value,current=Online.readProgress(model,id),result=Online.copy(current),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const apply=(key,desired,was,now)=>{if(equal(desired,was))return now;if(!equal(now,was)&&!equal(now,desired))throw Error('Stale progress field conflict: '+key);return desired;};
  for(const key of new Set([...Object.keys(base),...Object.keys(value)]))if(!['inventory','party','potions','manaPotions','__permanentReadToken'].includes(key))result[key]=apply(key,value[key],base[key],current[key]);
  if(bag){result.inventory=apply('inventory',value.inventory,base.inventory,current.inventory);for(const [key,item]of [['potions','healing-potion'],['manaPotions','mana-potion']]){if(!equal(value[key],base[key])&&equal(value.inventory,base.inventory))throw Error('Potion counter changed without inventory');result[key]=Online.quantity(result.inventory,item);}}
  const ids=apply('party',value.party?.activeMemberIds||base.party.activeMemberIds,base.party.activeMemberIds,current.party.activeMemberIds);result.party={...current.party,activeMemberIds:ids};return result;
 }
 const api={get active(){return true;},get busy(){return pending||externalBusy||Boolean(coordinator?.busy);},get singleOfflineEnabled(){return legacyOffline;},get failure(){return error;},get mainId(){const id=coordinator?coordinator.mainId:draft.activeMainId;return id&&draft.characters[id]?id:null;},get model(){return Online.copy(draft);},get revision(){return committed.revision;},getCommitted:()=>Online.copy(committed),
  getSlots:()=>draft.slotOrder.map(id=>id?{character:Online.copy(draft.characters[id].character),progress:read(id)}:null),getProgress:id=>read(id||api.mainId),getParty:id=>Online.party(draft,id||api.mainId),
  view:id=>Policy.selectedCharacter(draft,{mainId:api.mainId,viewedId:id}),
  saveProgress:(id,value)=>change(m=>Online.putProgress(m,id,merge(m,id,value),{generate})),
  get coordinator(){return coordinator;},bindCoordinator(value){if(coordinator)throw Error('Coordinator already bound');coordinator=value;},
  command:command=>{if(coordinator&&['recruit','leave','delete','switch-main','move-slot'].includes(command.type))throw Error('Use asynchronous farming coordinator');return change(m=>Policy.apply(m,command));},
  buildCharacter(m,character,value,slotIndex){
   const clean=Online.copy(value);clean.equipment={};delete clean.inventory;delete clean.party;delete clean.potions;delete clean.manaPotions;
   m=Policy.apply(m,{type:'create',id:character.id,character,progress:clean,slotIndex});
   const newItems=Online.copy(value.inventory||[]);
   for(const [counter,itemId]of [['potions','healing-potion'],['manaPotions','mana-potion']])if(value[counter]>0&&!newItems.some(i=>i.id===itemId)){const template=m.bag.items.find(i=>i.id===itemId);newItems.push({...Online.copy(template||{id:itemId,kind:'consumable'}),quantity:value[counter]});}
   m.bag.items=m.bag.items.concat(newItems);m=Online.putProgress(m,character.id,value,{bag:false,generate});return Online.compactModel(m);
  },
  createCharacter(character,value,slotIndex){if(coordinator)return coordinator.create(character,value,slotIndex);change(m=>api.buildCharacter(m,character,value,slotIndex));const saved=api.flush();saved.catch(()=>{});return saved;},
  flush(){if(error)return Promise.reject(error);if(externalBusy)return new Promise((resolve,reject)=>externalWaiters.push({resolve,reject}));if(!pending&&JSON.stringify(draft)===JSON.stringify(committed.permanent)&&JSON.stringify(settings)===JSON.stringify(committed.settings||{}))return Promise.resolve(Online.copy(committed));if(!pending)schedule();return new Promise((resolve,reject)=>waiters.push({resolve,reject}));},
  async login(name){ensure();if(inFlight||externalBusy)throw Error('Save busy');settings['stardust-player-name']=String(name);settings['stardust-session-active']='1';schedule();return api.flush();},
  async logout(){await api.flush();settings['stardust-session-active']='0';schedule();return api.flush();},
  async reset(){if(coordinator)return coordinator.reset();await api.flush();externalBusy=true;let failure;try{const result=await store.resetAccount(committed.id,committed.revision,'reset-v2:'+committed.revision+':'+generate());committed={...Online.copy(result.account),settings,settingsRevision:committed.settingsRevision||0};draft=Online.copy(committed.permanent);reads.clear();}catch(e){failure=e;throw e;}finally{releaseExternal(failure);}return api.logout();},
  async claimSingleOffline(calculate,{now=Date.now(),seed,failAt,context={},characterId,purpose,episodeId,members}={}){
   if(!legacyOffline)throw Error('Single offline adapter disabled');await api.flush();if(externalBusy)throw Error('Offline settlement busy');externalBusy=true;let failure;
   try{const pendingJobs=await store.pendingForAccount(committed.id);if(pendingJobs.some(r=>r.job.kind!=='legacy-single'))throw Error('Recover original batch 4 A offline job before proceeding');
    const id=characterId||api.mainId,role=committed.permanent.characters[id];if(!role)return null;
    if(pendingJobs.some(r=>r.job.characterId!==id))throw Error('Recover original owner before settling another character');
    if(!pendingJobs.length&&!purpose&&committed.farming&&!committed.farming.eligibility[id]?.eligible)return null;
    const income=purpose==='legacy-cutover'?committed.farming?.legacyDebts?.[id]:purpose==='team-legacy'?committed.farming?.teamOffline?.[id]:null;if(purpose&&!income&&!pendingJobs.length)throw Error('Preserved income ticket missing');if(purpose==='legacy-cutover'&&income)now=income.until;const from=Number(income?.from??role.progress.lastActiveAt??now);if(!pendingJobs.length&&now<=from)return null;
     if(seed===undefined)seed=globalThis.crypto?.getRandomValues?globalThis.crypto.getRandomValues(new Uint32Array(1))[0]:Math.floor(Math.random()*4294967296);
     const requested={id:committed.id+':'+(purpose||'single')+':'+id+':'+from,purpose,episodeId,members,kind:'legacy-single',accountId:committed.id,revision:committed.revision,characterId:id,from,now,seed,context:Online.copy(context),model:Online.copy(committed.permanent)};
    const record=pendingJobs[0]||await store.prepareSingleOffline(requested);let result;
    if(record.status==='committed')result={report:record.result.report,duplicate:true};else{const calculated=await calculate(Online.copy(record.job));result=await store.commitSingleOffline(record.job,calculated,{failAt});}
    const loaded=await store.read(committed.id);committed=Online.copy(loaded);draft=Online.compactModel(loaded.permanent);settings=Online.copy(loaded.settings||{});reads.clear();return result;
   }catch(e){failure=e;throw e;}finally{releaseExternal(failure);}
  },
  captureMember:Online.captureMember,restoreMember:Online.restoreMember,refreshMember:Online.refreshMember,
  async switchMain(id){if(coordinator)return coordinator.transition({type:'switch-main',characterId:id});await api.flush();api.command({type:'switch-main',characterId:id});return api.flush();},
   async refresh(){await api.flush();const current=await store.read(committed.id);if(!current?.permanent)throw Error('Missing permanent authority');committed=Online.copy(current);draft=Online.compactModel(current.permanent);settings=Online.copy(current.settings||{});reads.clear();return api.model;}
 };
 const storage={getItem(key){if(key==='stardust-character-slots')return JSON.stringify(api.getSlots());if(key==='stardust-progress')return api.mainId?JSON.stringify(api.getProgress()):null;if(key==='stardust-character')return api.mainId?JSON.stringify(draft.characters[api.mainId].character):null;if(key==='stardust-active-character-slot')return String(draft.slotOrder.indexOf(api.mainId));if(key==='stardust-account-resources')return JSON.stringify(draft.accountResources);if(key==='stardust-player-name'&&settings['stardust-session-active']==='0')return null;return settings[key]??null;},
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
return {create,get current(){return active;},activate(runtime){if(active)throw Error('Permanent runtime already active');active=runtime;return runtime;}};
});
