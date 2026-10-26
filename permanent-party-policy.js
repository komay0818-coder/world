(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./equipment-policy'):root.EquipmentPolicy,node?require('./warrior-advancement-policy'):root.WarriorAdvancementPolicy,node?require('./party-policy'):root.PartyPolicy);if(node)module.exports=api;else root.PermanentPartyPolicy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Equipment,Warrior,Party){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const SHARED_GOLD_VERSION=1;
class MigrationConflict extends Error{constructor(issues){super('Legacy migration requires review');this.name='MigrationConflict';this.issues=issues;}}
function uuid(){if(!globalThis.crypto?.randomUUID)throw Error('Secure UUID required');return globalThis.crypto.randomUUID();}
function identity(prefix,used,generate=uuid){for(let i=0;i<10;i++){const id=prefix+generate();if(!used.has(id)){used.add(id);return id;}}throw Error('Unique identity generation failed');}
function isSafeGold(value){return Number.isSafeInteger(value)&&value>=0;}
function sharedGoldState(model){
 const resources=model?.accountResources;
 if(!resources||typeof resources!=='object'||Array.isArray(resources))return {status:'invalid',version:null};
 const hasVersion=Object.prototype.hasOwnProperty.call(resources,'goldVersion'),hasGold=Object.prototype.hasOwnProperty.call(resources,'gold');
 if(!hasVersion)return {status:'legacy',version:0,hasAccountGold:hasGold,hasCharacterGold:Object.values(model?.characters||{}).some(c=>Object.prototype.hasOwnProperty.call(c?.progress||{},'gold'))};
 if(resources.goldVersion!==SHARED_GOLD_VERSION||!hasGold||!isSafeGold(resources.gold))return {status:'invalid',version:resources.goldVersion};
 return {status:'ready',version:SHARED_GOLD_VERSION,gold:resources.gold};
}
function validateGoldMigrationAudit(resources){
 const audit=resources?.goldMigrationAudit;if(audit===undefined)return true;
 if(!audit||audit.version!==SHARED_GOLD_VERSION||audit.source!=='character-progress'||!Array.isArray(audit.characterIds)||new Set(audit.characterIds).size!==audit.characterIds.length||!audit.before||audit.before.accountGold!==null||!audit.before.characterGold||typeof audit.before.characterGold!=='object'||Array.isArray(audit.before.characterGold)||!audit.after||!isSafeGold(audit.after.accountGold))throw Error('Invalid shared gold migration audit');
 let total=0;for(const id of audit.characterIds){const value=audit.before.characterGold[id];if(!isSafeGold(value))throw Error('Invalid shared gold migration audit');total+=value;if(!isSafeGold(total))throw Error('Invalid shared gold migration audit');}
 if(Object.keys(audit.before.characterGold).length!==audit.characterIds.length||total!==audit.after.accountGold)throw Error('Invalid shared gold migration audit');return true;
}
function getSharedGold(model){const state=sharedGoldState(model);if(state.status!=='ready')throw Error(state.status==='legacy'?'Shared gold migration required':'Invalid shared gold');return state.gold;}
function setSharedGold(model,value){if(!isSafeGold(value))throw Error('Invalid shared gold');const state=sharedGoldState(model);if(state.status!=='ready')throw Error(state.status==='legacy'?'Shared gold migration required':'Invalid shared gold');const next=clone(model);next.accountResources.gold=value;validate(next);return next;}
function adjustSharedGold(model,delta){if(!Number.isSafeInteger(delta))throw Error('Invalid shared gold delta');const current=getSharedGold(model),next=current+delta;if(!isSafeGold(next))throw Error('Invalid shared gold');return setSharedGold(model,next);}
function validateSharedGoldOperation(operation){const type=operation?.type,amount=operation?.amount;if(!['credit','debit'].includes(type)||!Number.isSafeInteger(amount)||amount<=0)throw Error('Invalid shared gold transaction');return {type,amount};}
function applySharedGoldTransaction(model,operation){
 const {type,amount}=validateSharedGoldOperation(operation);
 const before=getSharedGold(model);if(type==='debit'&&before<amount)throw Error('Insufficient shared gold');
 const after=type==='credit'?before+amount:before-amount;if(!isSafeGold(after))throw Error('Invalid shared gold');
 return {model:setSharedGold(model,after),type,amount,before,after};
}
function reconcileProgressGold(model,sourceModel,characterId){
 const next=clone(model),source=clone(sourceModel);validate(next);validate(source);
 const sourceState=sharedGoldState(source),nextState=sharedGoldState(next);
 if(sourceState.status==='legacy'&&nextState.status==='legacy')return {model:next,delta:0,before:null,after:null,legacy:true};
 if(sourceState.status!=='ready'||nextState.status!=='ready')throw Error('Shared gold authority changed during transaction');
 if(!source.characters[characterId]||!next.characters[characterId])throw Error('Unknown shared gold progress owner');
 const sourceGold=source.characters[characterId].progress.gold,nextGold=next.characters[characterId].progress.gold;
 if(!isSafeGold(sourceGold)||!isSafeGold(nextGold))throw Error('Invalid shared gold progress projection');
 for(const id of Object.keys(source.characters))if(id!==characterId&&next.characters[id]&&next.characters[id].progress.gold!==source.characters[id].progress.gold)throw Error('Unexpected secondary character gold change');
 const before=getSharedGold(source);if(getSharedGold(next)!==before)throw Error('Shared gold must be reconciled exactly once');
 const delta=nextGold-sourceGold,changed=delta?adjustSharedGold(next,delta):next,after=getSharedGold(changed);
 for(const role of Object.values(changed.characters))role.progress.gold=after;
 validate(changed);return {model:changed,delta,before,after,legacy:false};
}
function migrateSharedGold(model){
 const next=clone(model);validate(next);const state=sharedGoldState(next);
 if(state.status==='ready')return {model:next,migrated:false,audit:clone(next.accountResources.goldMigrationAudit||null)};
 if(state.status!=='legacy'||state.hasAccountGold)throw Error('Ambiguous legacy account gold requires review');
 const characterIds=Object.keys(next.characters).sort(),characterGold={};let total=0;
 for(const id of characterIds){
  const progress=next.characters[id]?.progress;
  if(!progress||!Object.prototype.hasOwnProperty.call(progress,'gold')||!isSafeGold(progress.gold))throw Error('Invalid legacy character gold');
  characterGold[id]=progress.gold;total+=progress.gold;if(!isSafeGold(total))throw Error('Legacy character gold total exceeds safe range');
 }
 const audit={version:SHARED_GOLD_VERSION,source:'character-progress',characterIds, before:{accountGold:null,characterGold},after:{accountGold:total}};
 next.accountResources.gold=total;next.accountResources.goldVersion=SHARED_GOLD_VERSION;next.accountResources.goldMigrationAudit=clone(audit);
 validate(next);return {model:next,migrated:true,audit};
}
function createEmptyModel(){
 const model={version:1,activeMainId:null,accountResources:{gold:0,goldVersion:SHARED_GOLD_VERSION},characters:{},slotOrder:[null,null,null,null],parties:{},bag:{items:[]},retiredIds:[],deletedCharacters:{},equipmentOwners:{}};
 validate(model);return model;
}
function migrate(raw,{generate=uuid}={}){
 const source=clone(raw),issues=[],slots=Array.isArray(source.slots)?source.slots:source.character?[{character:source.character,progress:source.progress||{}}]:null;
 if(!slots||slots.length>4)throw new MigrationConflict([{code:'invalid-slots'}]);
 const model={version:1,activeMainId:null,accountResources:clone(source.accountResources||{}),characters:{},slotOrder:[],parties:{},bag:{items:[]},retiredIds:[],deletedCharacters:{},equipmentOwners:{},migration:{version:1,backup:source}};
 const ids=new Set(),equipmentIds=new Set(),reservedEquipmentIds=new Set(),oldIdMap=new Map();
 for(const s of slots)for(const item of [...(Array.isArray(s?.progress?.inventory)?s.progress.inventory:[]),...Object.values(s?.progress?.equipment||{})])if(item?.instanceId)reservedEquipmentIds.add(item.instanceId);
 // Pre-reserve identifiers to prevent generated IDs colliding with later legacy data.
 for(const s of slots)if(s?.character?.id){if(ids.has(s.character.id))issues.push({code:'duplicate-character-id',id:s.character.id});ids.add(s.character.id);}
 function equipment(item,where){
   const value=clone(item);let id=value.instanceId;
   // An explicit instanceId is authoritative. A bare legacy id may be a template ID.
   if(id){if(equipmentIds.has(id)){issues.push({code:'equipment-owner-conflict',id,where});return value;}equipmentIds.add(id);}
   else{id=identity('equipment-',reservedEquipmentIds,generate);equipmentIds.add(id);value.legacyItemId=value.id;}
   value.instanceId=id;value.id=id;model.equipmentOwners[id]=where;return value;
 }
 for(let index=0;index<slots.length;index++){
  const slot=slots[index];if(!slot){model.slotOrder.push(null);continue;}
  if(!slot.character||typeof slot.character!=='object'){issues.push({code:'invalid-character',index});continue;}
  const id=slot.character.id||identity('character-',ids,generate);oldIdMap.set(slot.character.id||'character-slot-'+(index+1),id);
  const progress=clone(slot.progress||{}),inventory=progress.inventory===undefined?[]:progress.inventory;
  if(!Array.isArray(inventory)){issues.push({code:'invalid-inventory',id});continue;}
  for(const [counter,itemId] of [['potions','healing-potion'],['manaPotions','mana-potion']]){
   const entries=inventory.filter(i=>i?.id===itemId),quantity=entries.reduce((sum,i)=>sum+(Number(i.quantity)||0),0);
   if(progress[counter]!==undefined&&(!Number.isSafeInteger(progress[counter])||progress[counter]<0))issues.push({code:'invalid-potion-counter',id,counter});
   else if(entries.length&&progress[counter]!==undefined&&quantity!==progress[counter])issues.push({code:'potion-counter-conflict',id,counter,quantity,counterValue:progress[counter]});
   else if(!entries.length&&progress[counter]>0)inventory.push({id:itemId,kind:'consumable',quantity:progress[counter]});
   delete progress[counter];
  }
  for(const item of inventory){if(!item||typeof item!=='object'){issues.push({code:'invalid-item',id});continue;}
   if(item.kind==='equipment')model.bag.items.push(equipment(item,{kind:'bag'}));
   else{if(item.quantity!==undefined&&(!Number.isSafeInteger(item.quantity)||item.quantity<0)){issues.push({code:'invalid-quantity',id,itemId:item.id});continue;}model.bag.items.push(clone(item));}
  }
  const equipped=progress.equipment||{};if(typeof equipped!=='object'||Array.isArray(equipped))issues.push({code:'invalid-equipment',id});
  progress.equipment={};for(const [key,item]of Object.entries(equipped))progress.equipment[key]=item?equipment(item,{kind:'equipped',characterId:id,slot:key}):null;
  delete progress.inventory;delete progress.party;
  model.characters[id]={character:{...clone(slot.character),id},progress};model.slotOrder.push(id);
 }
 // Bare legacy IDs matching between different locations are ambiguous, never guessed.
 const locations=new Map();for(const [i,s]of slots.entries())if(s){for(const [where,item]of [...(Array.isArray(s.progress?.inventory)?s.progress.inventory:[]).map((x,n)=>['bag:'+i+':'+n,x]),...Object.entries(s.progress?.equipment||{}).map(([k,x])=>['equip:'+i+':'+k,x])])if(item?.kind==='equipment'&&(item.instanceId||item.id)){const key=item.instanceId||item.id,prev=locations.get(key);if(prev)issues.push({code:'ambiguous-legacy-equipment-id',id:key,locations:[prev,where]});else locations.set(key,where);}}
 for(let i=0;i<slots.length;i++)if(slots[i]?.character){const id=model.slotOrder[i],party=slots[i].progress?.party;
  const requested=party?.activeMemberIds||[id];
  if(!Array.isArray(requested)){issues.push({code:'invalid-party',id});continue;}
  const mapped=requested.map(old=>oldIdMap.get(old)||old);
  for(const member of mapped)if(!model.characters[member])issues.push({code:'missing-party-character',id,member});
  if(new Set(mapped).size!==mapped.length||mapped.length>3)issues.push({code:'invalid-party-members',id});
  model.parties[id]={mainId:id,memberIds:[id,...new Set(mapped.filter(m=>m!==id))]};
 }
 if(source.activeMainId!==undefined){model.activeMainId=oldIdMap.get(source.activeMainId)||source.activeMainId;if(model.activeMainId&&!model.characters[model.activeMainId])issues.push({code:'invalid-active-main'});}
 if(issues.length)throw new MigrationConflict(issues);
 validate(model);return model;
}
function validate(model){
 if(model.version!==1||!Array.isArray(model.bag?.items)||!Array.isArray(model.retiredIds)||!Array.isArray(model.slotOrder))throw Error('Invalid permanent account');
 const goldState=sharedGoldState(model);if(goldState.status==='invalid')throw Error('Invalid shared gold');
 if(goldState.status==='legacy'&&Object.prototype.hasOwnProperty.call(model.accountResources,'gold')&&!isSafeGold(model.accountResources.gold))throw Error('Invalid unversioned gold');
 if(goldState.status==='ready')validateGoldMigrationAudit(model.accountResources);
 const ids=Object.keys(model.characters),seen=new Set();
 if(ids.length>4||model.slotOrder.length>4)throw Error('Permanent character limit exceeded');
 if(model.activeMainId&&!model.characters[model.activeMainId])throw Error('Invalid active main');
 for(const id of ids){const c=model.characters[id];if(!c.progress||!Number.isInteger(c.progress.level)||c.progress.level<1||!Number.isFinite(c.progress.xp)||c.progress.xp<0)throw Error('Invalid character growth');if(c.character.id!==id||model.retiredIds.includes(id)||'inventory'in c.progress||'party'in c.progress||'potions'in c.progress||'manaPotions'in c.progress)throw Error('Duplicate growth authority');}
 if(new Set(model.slotOrder.filter(Boolean)).size!==model.slotOrder.filter(Boolean).length||model.slotOrder.some(id=>id&&!model.characters[id]))throw Error('Invalid character slots');
 const owners={};function track(item,owner){if(!item||typeof item!=='object')throw Error('Invalid item');if(item.kind!=='equipment')return;if(!item.instanceId||item.id!==item.instanceId||seen.has(item.instanceId))throw Error('Duplicate equipment ownership');seen.add(item.instanceId);owners[item.instanceId]=owner;}
 model.bag.items.forEach(item=>{if(item.quantity!==undefined&&(!Number.isSafeInteger(item.quantity)||item.quantity<0))throw Error('Invalid bag quantity');track(item,{kind:'bag'});});
 for(const id of ids)for(const [slot,item]of Object.entries(model.characters[id].progress.equipment||{}))if(item)track(item,{kind:'equipped',characterId:id,slot});
 const storedOwners=model.equipmentOwners||{},sameOwner=(expected,actual)=>{if(!actual||typeof actual!=='object'||Array.isArray(actual))return false;const expectedKeys=Object.keys(expected).sort(),actualKeys=Object.keys(actual).sort();return expectedKeys.length===actualKeys.length&&expectedKeys.every((key,index)=>key===actualKeys[index]&&expected[key]===actual[key]);};
 if(Object.keys(owners).length!==Object.keys(storedOwners).length||Object.keys(owners).some(id=>!sameOwner(owners[id],storedOwners[id])))throw Error('Ownership index mismatch');
 if(ids.length!==model.slotOrder.filter(Boolean).length)throw Error('Character missing from slot order');
 for(const [id,party]of Object.entries(model.parties))if(!model.characters[id]||party.mainId!==id||party.memberIds[0]!==id||party.memberIds.length>3||new Set(party.memberIds).size!==party.memberIds.length||party.memberIds.some(member=>!model.characters[member]))throw Error('Invalid party references');
 return true;
}
function assertEquip(item,c,slot){
 const allowed=Equipment.getEquipSlots(item,c.character.job);if(Warrior.canEquipTwoHandedOffhand(item,c.character,c.progress))allowed.push('offhand');
 if(!allowed.includes(slot)||Number(item.requiredLevel||0)>Number(c.progress.level)||item.durability!==undefined&&Number(item.durability)<=0)throw Error('Equipment restriction');
}
function apply(model,command){const next=clone(model),c=next.characters[command.characterId];
 if(command.type==='switch-main'){
  if(!c)throw Error('Unknown main character');next.activeMainId=command.characterId;
 }else if(command.type==='create'){
  const id=command.id;if(!id||next.characters[id]||next.retiredIds.includes(id)||!id.startsWith('character-'))throw Error('Character identity reused');
  if(!Number.isInteger(command.slotIndex)||command.slotIndex<0||command.slotIndex>3||next.slotOrder[command.slotIndex])throw Error('Character slot occupied');
  next.characters[id]={character:{...clone(command.character),id},progress:clone(command.progress||{level:1,xp:0,equipment:{},skillLevels:{}})};
  while(next.slotOrder.length<=command.slotIndex)next.slotOrder.push(null);next.slotOrder[command.slotIndex]=id;next.parties[id]={mainId:id,memberIds:[id]};
 }else if(command.type==='delete'){
  if(!c)throw Error('Unknown character');if(Object.values(c.progress.equipment||{}).some(Boolean))throw Error('Unequip before character deletion');
  if(next.activeMainId===command.characterId)next.activeMainId=null;next.deletedCharacters[command.characterId]=clone(c);next.retiredIds.push(command.characterId);delete next.characters[command.characterId];delete next.parties[command.characterId];next.slotOrder=next.slotOrder.map(id=>id===command.characterId?null:id);
  for(const p of Object.values(next.parties))p.memberIds=p.memberIds.filter(id=>id!==command.characterId);
 }else if(command.type==='move-slot'){
  if(!c||!Number.isInteger(command.slotIndex)||command.slotIndex<0||command.slotIndex>3||next.slotOrder[command.slotIndex])throw Error('Invalid character slot move');
  next.slotOrder=next.slotOrder.map(id=>id===command.characterId?null:id);while(next.slotOrder.length<=command.slotIndex)next.slotOrder.push(null);next.slotOrder[command.slotIndex]=command.characterId;
 }else if(command.type==='recruit'||command.type==='leave'){
  const p=next.parties[command.mainId];if(!p||!c||command.mainId===command.characterId)throw Error('Invalid party operation');
  if(command.type==='recruit'){if(p.memberIds.includes(command.characterId))throw Error('Already recruited');if(p.memberIds.length>=Party.getUnlockedPartySlots(next.characters[command.mainId].progress.level))throw Error('Party full');p.memberIds.push(command.characterId);}
  else {if(!p.memberIds.includes(command.characterId))throw Error('Character already left team');p.memberIds=p.memberIds.filter(id=>id!==command.characterId);}
 }else if(command.type==='exchange'){
  const a=c,b=next.characters[command.otherCharacterId];if(!a||!b||a===b)throw Error('Invalid equipment exchange');
  const first=a.progress.equipment[command.slot],second=b.progress.equipment[command.otherSlot];
  if(!first||!second)throw Error('Exchange requires two equipped items');
  assertEquip(second,a,command.slot);assertEquip(first,b,command.otherSlot);
  a.progress.equipment[command.slot]=second;b.progress.equipment[command.otherSlot]=first;
  next.equipmentOwners[second.instanceId]={kind:'equipped',characterId:command.characterId,slot:command.slot};
  next.equipmentOwners[first.instanceId]={kind:'equipped',characterId:command.otherCharacterId,slot:command.otherSlot};
 }else if(command.type==='equip'||command.type==='unequip'){
  if(!c)throw Error('Unknown character');const equipped=c.progress.equipment;
  if(command.type==='unequip'){const item=equipped[command.slot];if(!item)throw Error('Empty equipment slot');next.bag.items.push(item);equipped[command.slot]=null;next.equipmentOwners[item.instanceId]={kind:'bag'};}
  else{
   const index=next.bag.items.findIndex(i=>i.instanceId===command.instanceId&&i.kind==='equipment');if(index<0)throw Error('Item not in bag');const item=next.bag.items[index];
   assertEquip(item,c,command.slot);
   next.bag.items.splice(index,1);const previous=equipped[command.slot];if(previous){next.bag.items.push(previous);next.equipmentOwners[previous.instanceId]={kind:'bag'};}
   equipped[command.slot]=item;next.equipmentOwners[item.instanceId]={kind:'equipped',characterId:command.characterId,slot:command.slot};
  }
 }else throw Error('Unsupported phase-one command');
 validate(next);return next;
}
function battleSnapshot(model,mainId){const p=model.parties[mainId];if(!p)throw Error('Unknown party');return p.memberIds.map(id=>clone(model.characters[id]));}
function selectedCharacter(model,{mainId,viewedId=mainId}){if(!model.parties[mainId]?.memberIds.includes(viewedId))throw Error('Character not in viewed party');return clone(model.characters[viewedId]);}
return{SHARED_GOLD_VERSION,createEmptyModel,migrate,migrateSharedGold,validate,apply,battleSnapshot,selectedCharacter,sharedGoldState,getSharedGold,setSharedGold,adjustSharedGold,validateSharedGoldOperation,applySharedGoldTransaction,reconcileProgressGold,MigrationConflict,createCharacterId:()=> 'character-'+uuid()};
});
