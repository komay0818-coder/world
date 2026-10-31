'use strict';
const assert=require('node:assert/strict');
const Offline=require('../offline-settlement-store');
const Store=require('../permanent-party-store');
const Runtime=require('../permanent-party-runtime');
const Policy=require('../permanent-party-policy');
const Affixes=require('../equipment-affix-policy');
const memoryIndexedDB=require('./helpers/memory-indexeddb');

const ids={
 main:'supabase:10101010-1010-4010-8010-101010101010',
 rollback:'supabase:20202020-2020-4020-8020-202020202020',
 concurrent:'supabase:30303030-3030-4030-8030-303030303030',
 other:'supabase:40404040-4040-4040-8040-404040404040',
 runtime:'supabase:50505050-5050-4050-8050-505050505050'
};
const randomSource=seed=>{let value=seed>>>0;return()=>{value+=0x6D2B79F5;let result=value;result=Math.imul(result^result>>>15,result|1);result^=result+Math.imul(result^result>>>7,result|61);return((result^result>>>14)>>>0)/4294967296;};};
function item(instanceId,{chapter=2,quality='rare',legacy=false,seed=1}={}){
 const result=Affixes.createEquipmentInstance({id:'transaction-sword',kind:'equipment',slot:'weapon',fixedAffixIds:[],affixRuleOverride:{fixedCount:0,randomCount:3}}, {chapter,quality,uniqueId:instanceId,random:randomSource(seed)});
 result.id=instanceId;result.instanceId=instanceId;
 if(legacy){result.affixSchemaVersion=4;delete result.reforgeState;result.randomAffixes=result.randomAffixes.map(({slotKey,affixGrade,valueQuality,...entry})=>entry);result.affixes=[...result.fixedAffixes,...result.randomAffixes];}
 return result;
}
function operation(instanceId,type='type',slotKey='random-0'){return{type,instanceId,slotKey,characterId:'character-reforge'};}
async function open(indexedDB,name){return Store.wrap(await Offline.open({indexedDB,name,version:2}));}
async function seed(store,accountId,items,{level=10,gold=20000,essence=20}={}){
 const initialized=await store.initializeSupabaseAccount(accountId,{now:1000});
 let account=(await store.execute(accountId,initialized.account.revision,'create-reforge:'+accountId.slice(-4),{type:'create',id:'character-reforge',slotIndex:0,character:{id:'character-reforge',name:'交易測試者',job:'warrior'},progress:{level,xp:0,gold,equipment:{},skillLevels:{}}},{coordinated:true,now:1100})).account;
 account=(await store.execute(accountId,account.revision,'switch-reforge:'+accountId.slice(-4),{type:'switch-main',characterId:'character-reforge'},{coordinated:true,now:1200})).account;
 const model=structuredClone(account.permanent);model.accountResources.gold=gold;
 for(const equipment of items){model.bag.items.push(equipment);model.equipmentOwners[equipment.instanceId]={kind:'bag'};}
 model.bag.items.push({id:'green_essence_stone',kind:'material',quantity:essence},{id:'blue_essence_stone',kind:'material',quantity:essence});Policy.validate(model);
 return (await store.commitOnline(accountId,account.revision,'online-v2:seed:'+accountId.slice(-4),model,{}, {coordinated:true})).account;
}
function material(model,id){return model.bag.items.filter(entry=>entry?.kind!=='equipment'&&entry?.id===id).reduce((sum,entry)=>sum+entry.quantity,0);}

(async()=>{
 let checks=0;const check=(value,label)=>{assert(value,label);checks++;};
 const indexedDB=memoryIndexedDB(),name='equipment-reforge-transaction',store=await open(indexedDB,name);
 const legacy=item('legacy-transaction',{chapter:1,quality:'uncommon',legacy:true,seed:4});let account=await seed(store,ids.main,[legacy]);
 const before=structuredClone(account.permanent),first=await store.reforgeEquipment(ids.main,account.revision,'reforge-type-transaction-0001',operation(legacy.instanceId),{random:()=>.2});
 check(!first.duplicate&&first.summary.convertedLegacy,'first successful transaction converts only the selected legacy item');
 check(first.balance===before.accountResources.gold-100,'gold is debited in the same account transaction');
 check(material(first.account.permanent,'green_essence_stone')===19,'one matching essence is debited');
 const upgraded=first.account.permanent.bag.items.find(entry=>entry.instanceId===legacy.instanceId);
 check(upgraded.affixSchemaVersion===5&&upgraded.reforgeState.lockedTypeSlotKey==='random-0','V4 conversion and permanent type slot lock commit together');
 const duplicate=await store.reforgeEquipment(ids.main,first.account.revision,'reforge-type-transaction-0001',operation(legacy.instanceId),{random:()=>.9});
 check(duplicate.duplicate&&duplicate.balance===first.balance&&material(duplicate.account.permanent,'green_essence_stone')===19,'same commandId is idempotent and does not reroll or charge again');
 await assert.rejects(()=>store.reforgeEquipment(ids.main,duplicate.account.revision,'reforge-type-transaction-0001',operation(legacy.instanceId,'value')),/identity reused/i);checks++;
 check((await store.read(ids.main)).permanent.accountResources.gold===first.balance,'command identity cannot be reused for different content');
 const beforeStale=await store.read(ids.main);
 await assert.rejects(()=>store.reforgeEquipment(ids.main,account.revision,'reforge-stale-revision-0001',operation(legacy.instanceId,'value'),{maxAttempts:1}),/Concurrent save conflict/);checks++;
 check(JSON.stringify((await store.read(ids.main)).permanent)===JSON.stringify(beforeStale.permanent),'an unretried stale revision cannot alter equipment or resources');

 const runtimeStore=await open(memoryIndexedDB(),'equipment-reforge-runtime'),runtimeItem=item('runtime-item',{chapter:1,quality:'uncommon',seed:6}),runtimeAccount=await seed(runtimeStore,ids.runtime,[runtimeItem]),runtime=Runtime.create({store:runtimeStore,account:runtimeAccount}),events=[];runtime.onSharedGoldChanged(event=>events.push(event));
 const value=await runtime.reforgeEquipment('reforge-value-runtime-0001',operation(runtimeItem.instanceId,'value'),{random:()=>.1});
 check(!value.duplicate&&runtime.getSharedGold()===runtimeAccount.permanent.accountResources.gold-50&&events.length===1,'Runtime waits for the atomic value reforge and publishes the committed balance');
 const runtimeDuplicate=await runtime.reforgeEquipment('reforge-value-runtime-0001',operation(runtimeItem.instanceId,'value'),{random:()=>.8});
 check(runtimeDuplicate.duplicate&&events.length===1,'Runtime duplicate retry emits no second gold event');
 await runtime.deactivate();

 const rollbackItem=item('rollback-item',{seed:7}),rollbackSeed=await seed(store,ids.rollback,[rollbackItem]),rollbackBefore=JSON.stringify(rollbackSeed.permanent);
 await assert.rejects(()=>store.reforgeEquipment(ids.rollback,rollbackSeed.revision,'reforge-failure-rollback-0001',operation(rollbackItem.instanceId),{failAt:'after-account'}),/Injected/);checks++;
 const rollbackAfter=await store.read(ids.rollback);check(JSON.stringify(rollbackAfter.permanent)===rollbackBefore,'IndexedDB commit failure rolls back equipment, gold, essence, and lock state');

 const firstConcurrent=item('concurrent-one',{seed:10}),secondConcurrent=item('concurrent-two',{seed:11}),concurrentSeed=await seed(store,ids.concurrent,[firstConcurrent,secondConcurrent]);
 const parallel=await Promise.all([
  store.reforgeEquipment(ids.concurrent,concurrentSeed.revision,'reforge-concurrent-command-01',operation(firstConcurrent.instanceId)),
  store.reforgeEquipment(ids.concurrent,concurrentSeed.revision,'reforge-concurrent-command-02',operation(secondConcurrent.instanceId))
 ]);
 const concurrentAfter=await store.read(ids.concurrent);
 check(parallel.every(result=>!result.duplicate)&&concurrentAfter.revision===concurrentSeed.revision+2,'revision retry preserves both concurrent device transactions');
 check(concurrentAfter.permanent.accountResources.gold===concurrentSeed.permanent.accountResources.gold-1200&&material(concurrentAfter.permanent,'blue_essence_stone')===18,'concurrent reforges lose neither debit nor equipment update');

 const otherItem=item('other-account-item',{seed:14}),otherSeed=await seed(store,ids.other,[otherItem]);
 await assert.rejects(()=>store.reforgeEquipment(ids.other,otherSeed.revision,'reforge-cross-account-0001',operation(firstConcurrent.instanceId)),/shared bag|ownership mismatch/i);checks++;
 check((await store.read(ids.other)).permanent.accountResources.gold===otherSeed.permanent.accountResources.gold,'one account cannot reforge another account instance');

 const exported=await store.exportCloudSnapshot(ids.concurrent,ids.concurrent.slice('supabase:'.length)),roundTrip=JSON.parse(JSON.stringify(exported.snapshot));
 const cloudItems=roundTrip.permanent.bag.items.filter(entry=>entry?.kind==='equipment');
 check(cloudItems.every(entry=>entry.affixSchemaVersion===5&&entry.reforgeState.lockedTypeSlotKey==='random-0'),'cloud snapshot preserves V5 affixes and permanent type locks');
 check(cloudItems.every(entry=>Affixes.normalizeEquipment(entry)),'cloud snapshot equipment remains strictly valid after JSON round trip');
 store.close();
 const reopened=await open(indexedDB,name),f5=await reopened.read(ids.concurrent);
 check(f5.permanent.accountResources.gold===concurrentAfter.permanent.accountResources.gold&&f5.permanent.bag.items.every(entry=>entry.kind!=='equipment'||Affixes.normalizeEquipment(entry)),'F5-style reopen preserves resources and reforged equipment');
 reopened.close();
 console.log('Equipment reforge transaction: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
