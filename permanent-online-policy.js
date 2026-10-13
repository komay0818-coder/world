(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./permanent-party-policy'):root.PermanentPartyPolicy,node?require('./party-policy'):root.PartyPolicy);if(node)module.exports=api;else root.PermanentOnlinePolicy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(P,Party){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
const quantity=(items,id)=>items.filter(i=>i.id===id&&i.kind!=='equipment').reduce((n,i)=>n+Number(i.quantity||0),0);
function compact(items){const result=[],groups=new Map();for(const original of items){const item=copy(original);if(item.kind==='equipment'||item.quantity===undefined){result.push(item);continue;}const key=item.kind+':'+item.id,signature={...item};delete signature.quantity;
 if(groups.has(key)){const previous=groups.get(key),old={...previous};delete old.quantity;if(JSON.stringify(old)!==JSON.stringify(signature))throw Error('Inventory stack metadata conflict: '+item.id);previous.quantity+=item.quantity;}else{groups.set(key,item);result.push(item);}}
 return result;
}
function owners(model){const result={};const track=(item,owner)=>{if(!item||item.kind!=='equipment')return;if(!item.instanceId||result[item.instanceId])throw Error('Duplicate/missing equipment instance');result[item.instanceId]=owner;};model.bag.items.forEach(i=>track(i,{kind:'bag'}));for(const [id,c]of Object.entries(model.characters))for(const [slot,item]of Object.entries(c.progress.equipment))track(item,{kind:'equipped',characterId:id,slot});return result;}
function progress(model,id){const c=model.characters[id];if(!c)throw Error('Unknown permanent character');const value=copy(c.progress);value.inventory=copy(model.bag.items);value.potions=quantity(value.inventory,'healing-potion');value.manaPotions=quantity(value.inventory,'mana-potion');return value;}
function slots(model){return model.slotOrder.map(id=>id?{character:copy(model.characters[id].character),progress:progress(model,id)}:null);}
function party(model,id){const projected=slots(model),index=model.slotOrder.indexOf(id),value=Party.normalizeParty({activeMemberIds:model.parties[id].memberIds}, {slots:projected,mainSlotIndex:index,mainCharacter:model.characters[id].character,mainProgress:progress(model,id)});return value;}
function readProgress(model,id){const value=progress(model,id);value.party=party(model,id);return value;}
function strip(value){const result=copy(value);delete result.inventory;delete result.party;delete result.potions;delete result.manaPotions;delete result.__permanentReadToken;return result;}
function identify(item,model,generate){if(!item||item.kind!=='equipment')return copy(item);const value=copy(item);if(!value.instanceId){const existing=Object.values(model.characters).flatMap(c=>Object.values(c.progress.equipment)).concat(model.bag.items).find(i=>i?.kind==='equipment'&&i.id===value.id);if(existing?.instanceId)value.instanceId=existing.instanceId;else{value.legacyItemId=value.id;value.instanceId='equipment-'+generate();}}
 value.id=value.instanceId;return value;}
function putProgress(model,id,value,{bag=true,generate=()=>crypto.randomUUID()}={}){const next=copy(model);if(!next.characters[id])throw Error('Unknown progress owner');
 if(bag){if(!Array.isArray(value.inventory))throw Error('Inventory required');const items=compact(value.inventory);for(const [counter,itemId]of [['potions','healing-potion'],['manaPotions','mana-potion']])if(value[counter]!==undefined&&value[counter]!==quantity(items,itemId))throw Error('Potion counter conflict');next.bag.items=items.map(i=>identify(i,next,generate));}
 next.characters[id].progress=strip(value);next.characters[id].progress.equipment=Object.fromEntries(Object.entries(value.equipment||{}).map(([slot,item])=>[slot,item?identify(item,next,generate):null]));
 if(value.party){const ids=value.party.activeMemberIds;if(!Array.isArray(ids)||ids[0]!==id||ids.length>Party.getUnlockedPartySlots(value.level)||new Set(ids).size!==ids.length||ids.some(i=>!next.characters[i]))throw Error('Invalid permanent party references');next.parties[id]={mainId:id,memberIds:copy(ids)};}
 next.equipmentOwners=owners(next);P.validate(next);return next;
}
function compactModel(model){const next=copy(model);next.bag.items=compact(next.bag.items);next.equipmentOwners=owners(next);P.validate(next);return next;}
const growthKeys=new Set(['id','slotIndex','isMain','character','progress','name','race','job','level','stats','equipment','attack','defense','attackSpeed','maxHp','resourceMax','resourceType']);
function captureMember(member){const runtime={};for(const [key,value]of Object.entries(member))if(!growthKeys.has(key)&&value!==undefined&&typeof value!=='function')runtime[key]=copy(value);return {currentHp:member.currentHp,maxHp:member.maxHp,resource:{type:member.resourceType,current:member.resourceCurrent,max:member.resourceMax},runtime};}
function restoreMember(member,state){if(!state)return member;if(state.runtime){for(const [key,value]of Object.entries(state.runtime))if(!growthKeys.has(key))member[key]=copy(value);}
 if(Number.isFinite(state.currentHp))member.currentHp=Math.max(0,Math.min(member.maxHp,state.currentHp));if(Number.isFinite(state.resource?.current))member.resourceCurrent=Math.max(0,Math.min(member.resourceMax,state.resource.current));member.alive=state.runtime?.alive===false?false:member.currentHp>0;return member;}
function refreshMember(previous,fresh){if(!previous)return fresh;const hp=previous.currentHp,resource=previous.resourceCurrent;for(const key of growthKeys)if(key!=='id')previous[key]=fresh[key];previous.currentHp=Math.min(hp,previous.maxHp);previous.resourceCurrent=Math.min(resource,previous.resourceMax);return previous;}
return {compactModel,readProgress,slots,party,putProgress,owners,captureMember,restoreMember,refreshMember,copy,quantity};
});
