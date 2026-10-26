'use strict';
const assert=require('node:assert/strict');
const Offline=require('../offline-settlement-store');
const Store=require('../permanent-party-store');
const Policy=require('../permanent-party-policy');
const memoryIndexedDB=require('./helpers/memory-indexeddb');

const accountId='supabase:77777777-7777-4777-8777-777777777777',userId=accountId.slice(9),LIMIT=2*1024*1024;
const clone=value=>structuredClone(value),bytes=value=>new TextEncoder().encode(JSON.stringify(value)).length;
async function open(indexedDB,name){const low=await Offline.open({indexedDB,name,version:2});return {low,store:Store.wrap(low)};}

(async()=>{
 let checks=0;const check=(value,label)=>{assert(value,label);checks++;};
 const sourceDb=memoryIndexedDB(),source=await open(sourceDb,'cloud-offline-history-source');
 let current=await source.store.initializeSupabaseAccount(accountId,{now:1000});
 current=await source.store.execute(accountId,current.account.revision,'create-history-character',{type:'create',id:'character-history',slotIndex:0,character:{id:'character-history',name:'離線歷史測試',job:'warrior'},progress:{level:7,xp:0,gold:0,equipment:{},skillLevels:{},lastActiveAt:1000}},{coordinated:true,now:1000});
 let model=clone(current.account.permanent),equipment={id:'history-equipment',instanceId:'history-equipment',kind:'equipment',slot:'weapon',quality:'common'};
 model.accountResources.gold=321;model.bag.items.push(equipment,{id:'wolf-fur',kind:'material',quantity:7});model.equipmentOwners[equipment.instanceId]={kind:'bag'};Policy.validate(model);
 current=await source.store.commitOnline(accountId,current.account.revision,'online-v2:'+current.account.revision+':history-seed',model,{}, {coordinated:true});
 const baselineExport=await source.store.exportCloudSnapshot(accountId,userId),baselineBytes=bytes(baselineExport.snapshot);

 for(let index=0;index<43;index++){
  const account=await source.store.read(accountId),job={id:'committed-history-'+index,kind:'legacy-single',accountId,revision:account.revision,model:clone(account.permanent),characterId:'character-history',from:2000+index,now:3000+index,diagnosticPadding:'x'.repeat(50000)};
  await source.low.prepareSingleOffline(job,{clientVersion:2,guard:()=>{}});
  const settled=clone(job.model);settled.characters['character-history'].progress.xp+=1;settled.characters['character-history'].progress.lastActiveAt=job.now;settled.accountResources.gold+=2;Policy.validate(settled);
  await source.low.commitSingleOffline(job,{model:settled,report:{gainedGold:2,gainedXp:1}},{clientVersion:2,finish:()=>{}});
 }
 const afterCommitted=await source.store.exportCloudSnapshot(accountId,userId);
 check(afterCommitted.snapshot.offlineRuns.length===0&&bytes(afterCommitted.snapshot)-baselineBytes<1024,'completed settlement growth does not accumulate in the cloud snapshot');
 const beforePending=await source.store.read(accountId),pendingJob={id:'prepared-history-current',kind:'legacy-single',accountId,revision:beforePending.revision,model:clone(beforePending.permanent),characterId:'character-history',from:9000,now:10000};
 await source.low.prepareSingleOffline(pendingJob,{clientVersion:2,guard:()=>{}});

 const bundle=await source.low.exportCloudBundle(accountId),legacySnapshot={...clone(bundle.account),cloudEnvelopeVersion:1,owner:{kind:'supabase-user',accountId,authUserId:userId},preferences:clone(bundle.preferences),offlineRuns:clone(bundle.runs)};
 const exported=await source.store.exportCloudSnapshot(accountId,userId);
 check(bytes(legacySnapshot)>LIMIT,'unfiltered completed history reproduces the 2 MiB failure');
 check(bytes(exported.snapshot)<LIMIT,'filtered cloud snapshot remains below the 2 MiB limit');
 check(exported.snapshot.offlineRuns.length===1&&exported.snapshot.offlineRuns[0].id===pendingJob.id&&exported.snapshot.offlineRuns[0].status==='prepared','only unfinished offline recovery work is exported');
 check(exported.snapshot.permanent.accountResources.gold===407&&exported.snapshot.permanent.characters['character-history'].progress.xp===43,'settled gold and experience remain in authoritative character data');
 check(exported.snapshot.permanent.bag.items.length===2&&exported.snapshot.permanent.equipmentOwners['history-equipment'].kind==='bag','bag materials and equipment remain in the snapshot');

 const targetDb=memoryIndexedDB(),target=await open(targetDb,'cloud-offline-history-target');
 await target.store.initializeSupabaseAccount(accountId,{now:11000});
 await target.store.restoreCloudSnapshot(accountId,userId,exported.snapshot,{revision:1,contentHash:'c'.repeat(64),updatedAt:'2026-10-26T00:00:00.000Z'});
 let restored=await target.store.read(accountId),pending=await target.store.pendingForAccount(accountId);
 check(restored.permanent.accountResources.gold===407&&restored.permanent.characters['character-history'].progress.xp===43&&restored.permanent.bag.items.length===2,'cross-browser restore preserves all settled rewards and inventory');
 check(pending.length===1&&pending[0].id===pendingJob.id,'cross-browser restore preserves unfinished offline work');

 const pendingResult=clone(pendingJob.model);pendingResult.characters['character-history'].progress.xp+=5;pendingResult.characters['character-history'].progress.lastActiveAt=pendingJob.now;pendingResult.accountResources.gold+=3;Policy.validate(pendingResult);
 const first=await target.low.commitSingleOffline(pendingJob,{model:pendingResult,report:{gainedGold:3,gainedXp:5}},{clientVersion:2,finish:()=>{}}),second=await target.low.commitSingleOffline(pendingJob,{model:pendingResult,report:{gainedGold:3,gainedXp:5}},{clientVersion:2,finish:()=>{}});
 restored=await target.store.read(accountId);check(!first.duplicate&&second.duplicate&&restored.permanent.accountResources.gold===410&&restored.permanent.characters['character-history'].progress.xp===48,'unfinished work settles once and retry cannot duplicate rewards');
 target.store.close();const reopened=await open(targetDb,'cloud-offline-history-target'),afterF5=await reopened.store.read(accountId);
 check(afterF5.permanent.accountResources.gold===410&&afterF5.permanent.characters['character-history'].progress.xp===48&&afterF5.permanent.bag.items.length===2,'F5 keeps the single settlement and complete inventory');

 source.store.close();reopened.store.close();
 console.log('Cloud offline history compaction: '+checks+' checks passed; '+bytes(legacySnapshot)+' -> '+bytes(exported.snapshot)+' bytes');
})().catch(error=>{console.error(error);process.exitCode=1;});
