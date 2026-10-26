'use strict';
const assert=require('node:assert/strict'),Offline=require('../offline-settlement-store'),Store=require('../permanent-party-store'),memoryIndexedDB=require('./helpers/memory-indexeddb');
const accountId='supabase:11111111-1111-4111-8111-111111111111',userId=accountId.slice(9),otherId='supabase:22222222-2222-4222-8222-222222222222';
(async()=>{
 let checks=0;const check=(value,message)=>{assert(value,message);checks++;};
 async function open(indexedDB,name){return Store.wrap(await Offline.open({indexedDB,name,version:2}));}
 const deviceA=await open(memoryIndexedDB(),'cloud-a');let created=await deviceA.initializeSupabaseAccount(accountId,{now:1000});
 created=await deviceA.execute(accountId,created.account.revision,'cloud-create-character',{type:'create',id:'character-cloud',slotIndex:0,character:{id:'character-cloud',name:'雲端測試角色',job:'warrior'},progress:{level:7,xp:45.25,gold:0,equipment:{},skillLevels:{}}},{coordinated:true,now:1100});
 const changed=structuredClone(created.account.permanent);changed.bag.items.push({id:'wolf-fur',kind:'material',quantity:9});changed.characters['character-cloud'].progress.xp=88.5;
 const committed=await deviceA.commitOnline(accountId,created.account.revision,'online-v2:'+created.account.revision+':cloud-bag',changed,{}, {coordinated:true});
 const exported=await deviceA.exportCloudSnapshot(accountId,userId);check(exported.snapshot.permanent.characters['character-cloud'].progress.xp===88.5&&exported.snapshot.permanent.bag.items[0].quantity===9,'complete character and bag data exports');
 check(exported.snapshot.owner.accountId===accountId&&exported.snapshot.offlineRuns.length===0,'snapshot binds the verified account and offline records');

 const deviceB=await open(memoryIndexedDB(),'cloud-b');await deviceB.initializeSupabaseAccount(accountId,{now:1200});
 const restored=await deviceB.restoreCloudSnapshot(accountId,userId,exported.snapshot,{revision:1,contentHash:'a'.repeat(64),updatedAt:'2026-10-21T00:00:00.000Z'});
 check(restored.account.permanent.characters['character-cloud'].character.name==='雲端測試角色','empty second device restores the same character');
 check((await deviceB.read(accountId)).permanent.bag.items[0].quantity===9,'second device restores the complete shared bag');
 check((await deviceB.cloudSyncState(accountId)).cloudRevision===1,'cloud checkpoint is written with the restored data');

 const protectedStore=await open(memoryIndexedDB(),'cloud-protected');let protectedAccount=await protectedStore.initializeSupabaseAccount(accountId,{now:1300});protectedAccount=await protectedStore.execute(accountId,0,'local-character',{type:'create',id:'character-local-only',slotIndex:0,character:{id:'character-local-only',name:'本機角色',job:'warrior'},progress:{level:1,xp:0,gold:0,equipment:{},skillLevels:{}}},{coordinated:true,now:1400});
 await assert.rejects(()=>protectedStore.restoreCloudSnapshot(accountId,userId,exported.snapshot,{revision:1,contentHash:'a'.repeat(64),updatedAt:'2026-10-21T00:00:00.000Z'}),/not safe to replace/);checks++;
 check((await protectedStore.read(accountId)).permanent.characters['character-local-only'].character.name==='本機角色','download refusal preserves local characters');

 const rollbackStore=await open(memoryIndexedDB(),'cloud-rollback');await rollbackStore.initializeSupabaseAccount(accountId,{now:1500});
 await assert.rejects(()=>rollbackStore.restoreCloudSnapshot(accountId,userId,exported.snapshot,{revision:1,contentHash:'b'.repeat(64),updatedAt:'2026-10-21T00:00:00.000Z'},{failAt:'after-account'}),/Injected/);checks++;
 check(Object.keys((await rollbackStore.read(accountId)).permanent.characters).length===0&&!await rollbackStore.cloudSyncState(accountId),'failed restore rolls back account and checkpoint');

 await deviceB.initializeSupabaseAccount(otherId,{now:1600});await assert.rejects(()=>deviceB.restoreCloudSnapshot(otherId,otherId.slice(9),exported.snapshot,{revision:1,contentHash:'a'.repeat(64),updatedAt:'2026-10-21T00:00:00.000Z'}),/ownership/);checks++;
 check(Object.keys((await deviceB.read(otherId)).permanent.characters).length===0,'another account remains isolated');
 deviceA.close();deviceB.close();protectedStore.close();rollbackStore.close();console.log('Cloud save Store: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});

