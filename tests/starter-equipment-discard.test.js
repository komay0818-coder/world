'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Offline=require('../offline-settlement-store');
const Store=require('../permanent-party-store');
const Runtime=require('../permanent-party-runtime');
const Policy=require('../permanent-party-policy');
const Sales=require('../inventory-sale-policy');
const Cloud=require('../cloud-save-sync');
const memoryIndexedDB=require('./helpers/memory-indexeddb');

const userA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const accountA='supabase:'+userA;
const userB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const accountB='supabase:'+userB;
const lease=()=>({assertValid(){},identity(){return {leaseId:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',deviceId:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'};},invalidate(){}});
const starter=(instanceId,legacyItemId,slot,extra={})=>({
 id:instanceId,instanceId,legacyItemId,kind:'equipment',slot,quality:'starter',name:'初始裝備',...extra
});

function backend(){
 const saves=new Map(),receipts=new Map();
 return {saves,controller(userId){
  let active=true;const verification={userId,isCurrent:()=>active};
  const controller={verification,isCurrent:value=>active&&value===verification,async requestApi(value,route,options={}){
   if(!controller.isCurrent(value))throw Error('invalid session');
   if(route==='/v1/save'&&options.method==='GET'){
    const save=saves.get(userId);return save?{status:200,ok:true,body:{save:structuredClone(save)}}:{status:404,ok:false,body:{error:{code:'SAVE_NOT_FOUND'}}};
   }
   if(route==='/v1/save/commit'&&options.method==='POST'){
    const input=options.body,key=userId+':'+input.commandId,old=receipts.get(key);
    if(old)return {status:200,ok:true,body:{duplicate:true,save:structuredClone(old)}};
    const current=saves.get(userId),revision=current?.revision||0;
    if(revision!==input.baseRevision)return {status:409,ok:false,body:{error:{code:'REVISION_CONFLICT'}}};
    const save={schemaVersion:input.schemaVersion,revision:revision+1,snapshot:structuredClone(input.snapshot),contentHash:input.contentHash,updatedAt:'2026-10-22T00:00:00.000Z'};
    saves.set(userId,save);receipts.set(key,save);return {status:201,ok:true,body:{duplicate:false,save:structuredClone(save)}};
   }
   throw Error('unexpected API request');
  }};
  return {controller,invalidate(){active=false;}};
 }};
}

async function open(indexedDB,name){return Store.wrap(await Offline.open({indexedDB,name,version:2}));}
async function seed(store,accountId){
 let result=await store.initializeSupabaseAccount(accountId,{now:1000});
 const model=structuredClone(result.account.permanent);
 const weapon=starter('equipment-starter-weapon','starter-warrior-weapon-0','weapon');
 const armor=starter('equipment-starter-armor','starter-warrior-armor-1','armor');
 const ordinary={id:'equipment-ordinary',instanceId:'equipment-ordinary',legacyItemId:'drop-plains-sword',kind:'equipment',slot:'weapon',quality:'common',name:'普通短劍'};
 model.bag.items.push(weapon,armor,ordinary,{id:'wolf-fur',kind:'material',quantity:12});
 for(const item of [weapon,armor,ordinary])model.equipmentOwners[item.instanceId]={kind:'bag'};
 Policy.validate(model);
 return (await store.commitOnline(accountId,result.account.revision,'online-v2:0:seed-discard',model,{}, {coordinated:true})).account;
}

(async()=>{
 let checks=0;const check=(value,label)=>{assert(value,label);checks++;};
 check(Sales.isStarterGiftEquipment(starter('equipment-a','starter-warrior-weapon-0','weapon')),'starter weapon is recognized from preserved legacy identity');
 check(Sales.isStarterGiftEquipment(starter('equipment-b','starter-priest-armor-1','armor')),'starter armor is recognized from preserved legacy identity');
 check(!Sales.isStarterGiftEquipment(starter('equipment-c','starter-hunter-offhand-2','offhand')),'hunter starter offhand is outside the two gifted items');
 check(!Sales.isStarterGiftEquipment(starter('equipment-d','starter-recruit-warrior-weapon-0','weapon')),'recruit equipment is not mistaken for a starter gift');
 check(!Sales.isStarterGiftEquipment({...starter('equipment-e','drop-plains-sword','weapon'),name:'初始短劍'}),'name cannot authorize discard');

 const pure=Policy.createEmptyModel(),pureWeapon=starter('equipment-pure','starter-mage-weapon-0','weapon');
 pure.bag.items.push(pureWeapon);pure.equipmentOwners[pureWeapon.instanceId]={kind:'bag'};Policy.validate(pure);
 const discarded=Sales.applyStarterGiftDiscard(pure,pureWeapon.instanceId,Policy);
 check(pure.bag.items.length===1&&discarded.model.bag.items.length===0,'discard policy is pure and removes only the selected instance');
 check(discarded.model.accountResources.gold===0,'discard grants no gold');
 for(const flag of ['locked','isLocked','protected','isProtected','favorite','isFavorite']){
  const blocked=structuredClone(pure);blocked.bag.items[0][flag]=true;
  assert.throws(()=>Sales.applyStarterGiftDiscard(blocked,pureWeapon.instanceId,Policy),/Protected/);checks++;
 }
 const equipped=Policy.createEmptyModel(),worn=starter('equipment-worn','starter-warrior-weapon-0','weapon');
 equipped.characters['character-owner']={character:{id:'character-owner',name:'測試者',job:'warrior'},progress:{level:1,xp:0,gold:0,equipment:{weapon:worn},skillLevels:{}}};
 equipped.slotOrder[0]='character-owner';equipped.activeMainId='character-owner';equipped.parties['character-owner']={mainId:'character-owner',memberIds:['character-owner']};equipped.equipmentOwners[worn.instanceId]={kind:'equipped',characterId:'character-owner',slot:'weapon'};Policy.validate(equipped);
 assert.throws(()=>Sales.applyStarterGiftDiscard(equipped,worn.instanceId,Policy),/unequipped/);checks++;

 const indexedDB=memoryIndexedDB(),store=await open(indexedDB,'starter-discard');
 const seeded=await seed(store,accountA),server=backend(),session=server.controller(userA),sync=Cloud.create({controller:session.controller,store,authUserId:userA,lease:lease()});
 await sync.upload();
 const scheduled=[],automatic=sync.startAutomatic({initialDelay:1,interval:10000,schedule:fn=>{scheduled.push(fn);return fn;},cancel:fn=>{const index=scheduled.indexOf(fn);if(index>=0)scheduled.splice(index,1);}});
 scheduled.splice(0);
 let commitEvents=0;
 const runtime=Runtime.create({store,account:seeded,onCommitted(){commitEvents++;automatic.notify();}});
 const beforeGold=runtime.getSharedGold();
 const first=await runtime.discardStarterEquipment('discard-transaction-0001','equipment-starter-weapon');
 check(!first.duplicate&&!runtime.model.bag.items.some(item=>item.instanceId==='equipment-starter-weapon'),'runtime permanently removes the eligible bag item');
 check(runtime.getSharedGold()===beforeGold&&runtime.model.bag.items.find(item=>item.id==='wolf-fur').quantity===12,'discard grants no rewards and leaves materials unchanged');
 check(runtime.model.bag.items.some(item=>item.instanceId==='equipment-ordinary'),'ordinary sale equipment is unchanged');
 check(commitEvents===1&&scheduled.length===1,'committed discard notifies the existing automatic cloud sync');
 await automatic.runNow();
 check(!server.saves.get(userA).snapshot.permanent.bag.items.some(item=>item.instanceId==='equipment-starter-weapon'),'automatic cloud upload preserves the discard');
 const retry=await runtime.discardStarterEquipment('discard-transaction-0001','equipment-starter-weapon');
 check(retry.duplicate&&commitEvents===1,'same transaction retry cannot discard twice or emit a second sync event');
 await automatic.stop();await runtime.deactivate();
 const reopened=await open(indexedDB,'starter-discard'),afterReload=await reopened.read(accountA);
 check(!afterReload.permanent.bag.items.some(item=>item.instanceId==='equipment-starter-weapon'),'F5-style reopen keeps the equipment discarded');

 const accountBSeed=await seed(reopened,accountB);
 await assert.rejects(()=>reopened.discardStarterEquipment(accountB,accountBSeed.revision,'discard-transaction-0002','equipment-starter-armor',{failAt:'after-account'}),/Injected/);checks++;
 const afterFailure=await reopened.read(accountB);
 check(afterFailure.permanent.bag.items.some(item=>item.instanceId==='equipment-starter-armor'),'failed IndexedDB transaction rolls back the discard');
 check((await reopened.read(accountA)).permanent.bag.items.some(item=>item.instanceId==='equipment-starter-armor'),'account B failure cannot change account A');
 assert.throws(()=>Sales.applyStarterGiftDiscard(afterFailure.permanent,'equipment-ordinary',Policy),/Only initial/);checks++;

 const view=fs.readFileSync(path.join(__dirname,'..','party-inventory-view.js'),'utf8'),discardSource=view.slice(view.indexOf('function discardStarter'),view.indexOf('function left'));
 check(discardSource.includes('window.confirm(`確定要永久丟棄'),'UI requires explicit confirmation before discard');
 check(discardSource.indexOf('window.confirm(')<discardSource.indexOf('service.discardStarterEquipment('),'cancel decision happens before the persistent transaction');
 check(view.includes("data-party-discard"),'eligible starter equipment exposes a discard action');
 check(view.includes('if(discardBusy)return')&&view.includes('discardBusy=true'),'repeated discard clicks are guarded');
 let persistentCalls=0;
 const cancelItem=starter('equipment-cancel','starter-warrior-armor-1','armor'),cancelContext={discardBusy:false,queueOperation:action=>action(),runtime:()=>({flush:async()=>{},discardStarterEquipment:async()=>{persistentCalls++;}}),inventorySnapshot:()=>({items:[cancelItem],equipmentOwners:{[cancelItem.instanceId]:{kind:'bag'}}}),discardEligibility:()=>({ok:true}),window:{confirm:()=>false},crypto:{randomUUID:()=>{throw Error('cancelled discard must not allocate a transaction');}},hideInventoryTooltip(){},showToast(){},active:()=>false,renderInventory(){},cancelResult:null};
 vm.createContext(cancelContext);await vm.runInContext(discardSource+';discardStarter("equipment-cancel").then(value=>cancelResult=value)',cancelContext);await new Promise(resolve=>setImmediate(resolve));
 check(cancelContext.cancelResult?.cancelled===true&&persistentCalls===0,'cancelling the confirmation performs no persistent transaction');

 reopened.close();
 console.log('Starter equipment discard: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
