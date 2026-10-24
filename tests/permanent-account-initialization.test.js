'use strict';
const assert=require('node:assert/strict'),Offline=require('../offline-settlement-store'),Store=require('../permanent-party-store'),Policy=require('../permanent-party-policy'),Runtime=require('../permanent-party-runtime');
const fs=require('node:fs'),path=require('node:path');
const clone=value=>value===undefined?undefined:structuredClone(value);

function memoryIndexedDB(){
 const databases=new Map();
 class Transaction{
  constructor(db,names,mode){this.db=db;this.names=names;this.mode=mode;this.ops=[];this.running=false;this.active=false;this.done=false;this.snapshot=null;}
  objectStore(name){if(!this.names.includes(name))throw Error('Store outside transaction');const tx=this;return {
   get(key){return tx.request(map=>clone(map.get(key)));},
   getAll(){return tx.request(map=>[...map.values()].map(clone));},
   add(value){return tx.request(map=>{const key=value.id;if(map.has(key)){const error=Error('ConstraintError');error.name='ConstraintError';throw error;}map.set(key,clone(value));return key;},true);},
   put(value){return tx.request(map=>{map.set(value.id,clone(value));return value.id;},true);},
   delete(key){return tx.request(map=>map.delete(key),true);}
  };}
  request(action,write=false){const request={result:undefined,error:null,onsuccess:null,onerror:null};this.ops.push({action,write,request,store:this.names[0]});this.drain();return request;}
  start(){if(this.done)return;this.active=true;this.snapshot=new Map([...this.db.stores].map(([name,map])=>[name,new Map([...map].map(([key,value])=>[key,clone(value)]))]));this.drain();}
  drain(){if(!this.active||this.running||this.done)return;if(!this.ops.length){this.running=true;queueMicrotask(()=>{this.running=false;if(this.ops.length)return this.drain();this.done=true;if(this.mode==='readwrite')this.db.stores=this.snapshot;this.oncomplete?.();this.db.finished(this);});return;}
   this.running=true;const operation=this.ops.shift();queueMicrotask(()=>{if(this.done)return;try{if(operation.write&&this.mode!=='readwrite')throw Error('Readonly transaction');const map=this.snapshot.get(operation.store);operation.request.result=operation.action(map);operation.request.onsuccess?.({target:operation.request});}catch(error){operation.request.error=error;operation.request.onerror?.({target:operation.request});this.abort(error);return;}this.running=false;this.drain();});
  }
  abort(error){if(this.done)return;this.done=true;this.error=error||Error('AbortError');queueMicrotask(()=>{this.onabort?.();this.db.finished(this);});}
 }
 class Database{
  constructor(version){this.version=version;this.stores=new Map();this.objectStoreNames={contains:name=>this.stores.has(name)};this.queue=[];this.current=null;this.closed=false;}
  createObjectStore(name){this.stores.set(name,new Map());}
  transaction(names,mode){if(this.closed)throw Error('Database is closed');const tx=new Transaction(this,Array.isArray(names)?names:[names],mode);this.queue.push(tx);this.next();return tx;}
  next(){if(this.current||!this.queue.length)return;this.current=this.queue.shift();queueMicrotask(()=>this.current.start());}
  finished(tx){if(this.current===tx)this.current=null;this.next();}
  close(){this.closed=true;}
 }
 return {open(name,version){const request={result:null,error:null,onupgradeneeded:null,onsuccess:null,onerror:null,onblocked:null};queueMicrotask(()=>{try{let data=databases.get(name);const fresh=!data;if(!data){data={db:new Database(version)};databases.set(name,data);}else if(data.db.closed){const reopened=new Database(version);reopened.stores=data.db.stores;data.db=reopened;}request.result=data.db;if(fresh)request.onupgradeneeded?.({target:request});request.onsuccess?.({target:request});}catch(error){request.error=error;request.onerror?.({target:request});}});return request;}};
}

const ids={
 a:'supabase:11111111-1111-4111-8111-111111111111',
 b:'supabase:22222222-2222-4222-8222-222222222222',
 c:'supabase:33333333-3333-4333-8333-333333333333',
 d:'supabase:44444444-4444-4444-8444-444444444444',
 e:'supabase:55555555-5555-4555-8555-555555555555',
 f:'supabase:66666666-6666-4666-8666-666666666666',
 g:'supabase:88888888-8888-4888-8888-888888888888',
 sale:'supabase:eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
};

(async()=>{
 let checks=0;const check=(condition,message)=>{assert(condition,message);checks++;};
 const indexedDB=memoryIndexedDB(),low=await Offline.open({indexedDB,name:'new-account-store-test',version:2}),store=Store.wrap(low);
 const first=await store.initializeSupabaseAccount(ids.a,{now:1000});
 check(first.created&&!first.duplicate,'new account is created once');check(first.account.id===ids.a&&first.account.revision===0,'account identity and revision initialized');
 check(Policy.validate(first.account.permanent),'empty permanent model validates');check(first.account.permanent.slotOrder.every(id=>id===null)&&first.account.permanent.slotOrder.length===4,'four character slots vacant');
 check(first.account.cutover.status==='active'&&first.account.cutover.source==='supabase-new-account','new-account activation source recorded');
 check(first.account.farming.version===1&&!Object.keys(first.account.farming.owners).length&&!Object.keys(first.account.farming.sessions).length,'farming initialized empty');
 check(first.account.settingsRevision===0&&Object.keys(first.account.settings).length===0,'account preferences initialized empty');
 check(!first.account.migrationBackup&&!first.account.permanent.migration&&!('slots'in first.account),'no legacy authority or migration backup created');

 await store.execute(ids.a,0,'create-kept',{type:'create',id:'character-kept',slotIndex:0,character:{job:'warrior'}},{coordinated:true,now:2000});
 const again=await store.initializeSupabaseAccount(ids.a,{now:3000});
 check(!again.created&&again.duplicate,'repeat initialization returns existing account');check(again.account.permanent.characters['character-kept'],'repeat initialization preserves character progress');check(again.account.revision===1,'repeat initialization does not reset revision');

 const second=await store.initializeSupabaseAccount(ids.b,{now:1000});
 check(second.created&&Object.keys(second.account.permanent.characters).length===0,'second account starts independently empty');check((await store.read(ids.a)).permanent.characters['character-kept']&&!(await store.read(ids.b)).permanent.characters['character-kept'],'accounts remain isolated');
 await assert.rejects(()=>store.initializeSupabaseAccount('stardust-local-account-v2'),/Supabase account identity/);checks++;
 await assert.rejects(()=>store.initializeSupabaseAccount('supabase:not-a-uuid'),/Supabase account identity/);checks++;

 await low.initialize(ids.c,[]);await assert.rejects(()=>store.initializeSupabaseAccount(ids.c),/preferences missing|incomplete/i);checks++;
 check('slots'in await low.read(ids.c)&&!(await low.read(ids.c)).permanent,'incomplete existing data is not overwritten');

 await assert.rejects(()=>store.initializeSupabaseAccount(ids.d,{failAt:'after-account'}),/Injected/);checks++;
 check(await low.read(ids.d)===undefined&&await low.readPreferences(ids.d)===undefined,'failed initialization rolls back account and preferences');
 await assert.rejects(()=>store.initializeSupabaseAccount(ids.g,{failAt:'after-preferences'}),/Injected/);checks++;
 check(await low.read(ids.g)===undefined&&await low.readPreferences(ids.g)===undefined,'failure after both writes still rolls back the complete transaction');

 const parallel=await Promise.all([store.initializeSupabaseAccount(ids.e,{now:1000}),store.initializeSupabaseAccount(ids.e,{now:1000})]);
 check(parallel.filter(result=>result.created).length===1&&parallel.filter(result=>result.duplicate).length===1,'parallel initialization creates one authoritative account');
 check((await low.read(ids.e)).id===ids.e,'parallel initialization leaves one readable account');

 const localSlots=[{character:{id:'legacy'},progress:{level:1,xp:0}}];await low.initialize('stardust-local-account-v2',localSlots);
 const originalMigrate=Policy.migrate;Policy.migrate=()=>{throw Error('migration must not run');};try{await store.initializeSupabaseAccount(ids.f,{now:1000});}finally{Policy.migrate=originalMigrate;}
 check(JSON.stringify((await low.read('stardust-local-account-v2')).slots)===JSON.stringify(localSlots),'fixed local account remains untouched');
 check(!fs.readFileSync(path.join(__dirname,'..','permanent-party-store.js'),'utf8').includes('readLegacy'),'new account Store contains no legacy localStorage reader');

 const legacyId='supabase:99999999-9999-4999-8999-999999999999';
 function legacyModel(golds=[10,20]){let model=Policy.createEmptyModel();delete model.accountResources.gold;delete model.accountResources.goldVersion;for(let index=0;index<golds.length;index++)model=Policy.apply(model,{type:'create',id:'character-gold-'+index,slotIndex:index,character:{id:'character-gold-'+index,job:'warrior'},progress:{level:1,xp:0,gold:golds[index],equipment:{},skillLevels:{}}});return model;}
 async function seedLegacy(id,golds=[10,20],farming={version:1,epoch:0,owners:{},sessions:{},eligibility:{},legacyDebts:{},teamOffline:{}}){const account={id,revision:0,permanent:legacyModel(golds),cutover:{version:1,minimumClientVersion:2,status:'active',source:'test'},commands:{},receiptFloorRevision:0,receiptVersion:2,farming};const preferences={id:'preferences:'+id,kind:'preferences',ownerId:id,revision:0,values:{}};await low.initializePermanentAccount(account,preferences);return account;}
 await seedLegacy(legacyId);await assert.rejects(()=>store.migrateSharedGold(legacyId,0),/Verified shared gold backup required/);checks++;const preparedGold=await store.prepareSharedGoldMigration(legacyId,0,{now:4000});check(preparedGold.status==='legacy'&&preparedGold.preview.total===30&&preparedGold.backup.status==='verified','legacy gold preview creates and verifies a backup before confirmation');check(preparedGold.preview.characters.length===2&&preparedGold.account.sharedGoldMigrationBackup.source.permanent===undefined,'preview lists each role without exposing a second account shape');const migrated=await store.migrateSharedGold(legacyId,0,{backupFingerprint:preparedGold.backup.fingerprint});check(migrated.migrated&&!migrated.duplicate&&migrated.account.permanent.accountResources.gold===30,'legacy role gold is atomically converted to shared gold');check(migrated.audit.before.characterGold['character-gold-0']===10&&migrated.audit.after.accountGold===30,'migration returns before and after audit');check(migrated.account.permanent.characters['character-gold-1'].progress.gold===20,'legacy role gold remains as a compatibility mirror');
 const repeated=await store.migrateSharedGold(legacyId,migrated.account.revision);check(!repeated.migrated&&repeated.duplicate&&repeated.account.permanent.accountResources.gold===30,'repeat migration never aggregates gold twice');
 let gold=await store.transactSharedGold(legacyId,repeated.account.revision,'credit-test-0001',{type:'credit',amount:12});check(gold.balance===42&&!gold.duplicate,'shared gold credit commits once');
 gold=await store.transactSharedGold(legacyId,gold.account.revision,'credit-test-0001',{type:'credit',amount:12});check(gold.balance===42&&gold.duplicate,'same transaction identity does not credit twice');
 await assert.rejects(()=>store.transactSharedGold(legacyId,gold.account.revision,'credit-test-0001',{type:'credit',amount:13}),/identity reused/);checks++;check((await store.read(legacyId)).permanent.accountResources.gold===42,'transaction identity cannot be reused for a different amount');
 await assert.rejects(()=>store.transactSharedGold(legacyId,gold.account.revision,'debit-too-large',{type:'debit',amount:43}),/Insufficient/);checks++;check((await store.read(legacyId)).permanent.accountResources.gold===42,'insufficient debit leaves balance unchanged');
 const beforeFailedGold=await store.read(legacyId);await assert.rejects(()=>store.transactSharedGold(legacyId,beforeFailedGold.revision,'credit-fail-0001',{type:'credit',amount:5},{failAt:'after-account'}),/Injected/);checks++;check((await store.read(legacyId)).permanent.accountResources.gold===42,'failed gold transaction rolls back account balance');
 const concurrentRevision=(await store.read(legacyId)).revision,concurrent=await Promise.all([store.transactSharedGold(legacyId,concurrentRevision,'credit-concurrent-a',{type:'credit',amount:3}),store.transactSharedGold(legacyId,concurrentRevision,'credit-concurrent-b',{type:'credit',amount:4})]);check(concurrent.every(result=>!result.duplicate)&&(await store.read(legacyId)).permanent.accountResources.gold===49,'concurrent tabs preserve both gold updates');

 const runtimeAccount=await store.read(legacyId),notifications=[];const runtime=Runtime.create({store,account:runtimeAccount});runtime.onSharedGoldChanged(event=>notifications.push(event));check(runtime.getSharedGold()===49,'runtime reads authoritative shared balance');const runtimeCredit=await runtime.creditSharedGold('runtime-credit-01',6);check(runtimeCredit.balance===55&&runtime.getSharedGold()===55&&notifications.length===1&&notifications[0].balance===55,'runtime refreshes balance and notifies after commit');const runtimeDebit=await runtime.debitSharedGold('runtime-debit-001',5);check(runtimeDebit.balance===50&&runtime.getSharedGold()===50&&notifications.length===2,'runtime debit uses the same atomic entry point');
 const duplicateRuntime=await runtime.creditSharedGold('runtime-credit-01',6);check(duplicateRuntime.duplicate&&runtime.getSharedGold()===50&&notifications.length===2,'runtime duplicate request neither changes balance nor emits another notification');

 const offlineSource=await store.read(legacyId),offlineCharacter=offlineSource.permanent.activeMainId||Object.keys(offlineSource.permanent.characters)[0],offlineJob={id:'shared-gold-offline-0001',kind:'legacy-single',accountId:legacyId,revision:offlineSource.revision,model:clone(offlineSource.permanent),characterId:offlineCharacter,from:1,now:2};await low.prepareSingleOffline(offlineJob,{clientVersion:2});const offlineModel=clone(offlineJob.model);offlineModel.characters[offlineCharacter].progress.gold+=9;offlineModel.characters[offlineCharacter].progress.lastActiveAt=offlineJob.now;offlineModel.bag.items.push({id:'offline-gold-proof',kind:'material',quantity:1});const offlineResult={model:offlineModel,report:{gainedGold:9}};const offlineCommitted=await store.commitSingleOffline(offlineJob,offlineResult);check(!offlineCommitted.duplicate,'shared-gold offline settlement commits once');const afterOffline=await store.read(legacyId);check(afterOffline.permanent.accountResources.gold===59&&afterOffline.permanent.bag.items.some(item=>item.id==='offline-gold-proof'),'offline gold and loot share the settlement journal transaction');const offlineDuplicate=await store.commitSingleOffline(offlineJob,offlineResult);check(offlineDuplicate.duplicate&&(await store.read(legacyId)).permanent.accountResources.gold===59,'offline settlement replay cannot credit shared gold twice');

 const parallelId='supabase:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';await seedLegacy(parallelId,[7,8]);const parallelPrepared=await Promise.all([store.prepareSharedGoldMigration(parallelId,0),store.prepareSharedGoldMigration(parallelId,0)]),parallelFingerprint=parallelPrepared[0].backup.fingerprint;const parallelGold=await Promise.all([store.migrateSharedGold(parallelId,0,{backupFingerprint:parallelFingerprint}),store.migrateSharedGold(parallelId,0,{backupFingerprint:parallelFingerprint})]);check(parallelGold.filter(x=>x.migrated).length===1&&parallelGold.every(x=>x.account.permanent.accountResources.gold===15),'parallel migration produces one shared total');
 const failedId='supabase:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';const failedSource=await seedLegacy(failedId,[3,4]),failedPrepared=await store.prepareSharedGoldMigration(failedId,0);await assert.rejects(()=>store.migrateSharedGold(failedId,0,{backupFingerprint:failedPrepared.backup.fingerprint,failAt:'after-account'}),/Injected/);checks++;check(JSON.stringify((await low.read(failedId)).permanent)===JSON.stringify(failedSource.permanent),'failed migration rolls back the complete permanent model');
 await assert.rejects(()=>store.transactSharedGold(failedId,0,'legacy-credit-01',{type:'credit',amount:1}),/migration required/);checks++;check(Policy.sharedGoldState((await low.read(failedId)).permanent).status==='legacy','legacy account cannot use shared gold transaction entry point');
 const legacySaleModel=clone((await store.read(failedId)).permanent);legacySaleModel.bag.items.push({id:'wolf-fur',kind:'material',quantity:2});const legacySaleSeed=await store.commitOnline(failedId,0,'online-v2:0:legacy-sale-seed',legacySaleModel);await assert.rejects(()=>store.sellItems(failedId,legacySaleSeed.account.revision,'legacy-sale-reject',[{kind:'material',itemId:'wolf-fur',quantity:1}]),/migration required/i);checks++;check((await store.read(failedId)).permanent.bag.items.find(item=>item.id==='wolf-fur').quantity===2,'legacy account sale rejection preserves inventory');
 const debtId='supabase:cccccccc-cccc-4ccc-8ccc-cccccccccccc';await seedLegacy(debtId,[5],{version:1,epoch:0,owners:{},sessions:{},eligibility:{},legacyDebts:{'character-gold-0':{from:1,until:2}},teamOffline:{}});await assert.rejects(()=>store.prepareSharedGoldMigration(debtId,0),/offline income/);checks++;check(Policy.sharedGoldState((await low.read(debtId)).permanent).status==='legacy','preserved offline income leaves legacy gold untouched');
 const pendingId='supabase:dddddddd-dddd-4ddd-8ddd-dddddddddddd';const pendingAccount=await seedLegacy(pendingId,[6]);await low.prepareSingleOffline({id:'pending-gold-job',kind:'legacy-single',accountId:pendingId,revision:0,model:clone(pendingAccount.permanent),characterId:'character-gold-0',from:1,now:2},{clientVersion:2});await assert.rejects(()=>store.prepareSharedGoldMigration(pendingId,0),/pending offline|prepared offline/i);checks++;check(Policy.sharedGoldState((await low.read(pendingId)).permanent).status==='legacy','prepared offline settlement blocks migration without mutation');
 const saleCreated=await store.initializeSupabaseAccount(ids.sale,{now:1000}),saleModel=clone(saleCreated.account.permanent);
 for(const item of [{id:'equipment-sale-white',instanceId:'equipment-sale-white',kind:'equipment',quality:'common'},{id:'equipment-sale-blue',instanceId:'equipment-sale-blue',kind:'equipment',quality:'rare'},{id:'equipment-sale-purple',instanceId:'equipment-sale-purple',kind:'equipment',quality:'epic'},{id:'wolf-fur',kind:'material',quantity:10},{id:'iron-ore',kind:'material',quantity:4},{id:'healing-potion',kind:'consumable',quantity:3}])saleModel.bag.items.push(item);
 for(const id of ['equipment-sale-white','equipment-sale-blue','equipment-sale-purple'])saleModel.equipmentOwners[id]={kind:'bag'};
 Policy.validate(saleModel);let seededSale=await store.commitOnline(ids.sale,0,'online-v2:0:sale-seed',saleModel);
 let sold=await store.sellItems(ids.sale,seededSale.account.revision,'sale-transaction-0001',[{kind:'equipment',instanceId:'equipment-sale-white'},{kind:'material',itemId:'wolf-fur',quantity:3}]);
 check(sold.balance===16&&sold.summary.proceeds===16&&sold.summary.equipmentCount===1&&sold.summary.materialQuantity===3,'equipment and partial material stack sell atomically');
 check(sold.account.permanent.bag.items.find(item=>item.id==='wolf-fur').quantity===7&&!sold.account.permanent.bag.items.some(item=>item.instanceId==='equipment-sale-white'),'sale removes only selected quantities and instance');
 const saleDuplicate=await store.sellItems(ids.sale,sold.account.revision,'sale-transaction-0001',[{kind:'equipment',instanceId:'equipment-sale-white'},{kind:'material',itemId:'wolf-fur',quantity:3}]);
 check(saleDuplicate.duplicate&&saleDuplicate.balance===16,'sale transaction replay neither removes items nor credits gold twice');
 await assert.rejects(()=>store.sellItems(ids.sale,saleDuplicate.account.revision,'sale-transaction-0001',[{kind:'material',itemId:'wolf-fur',quantity:1}]),/identity reused/);checks++;
 const beforeRejected=await store.read(ids.sale);await assert.rejects(()=>store.sellItems(ids.sale,beforeRejected.revision,'sale-potion-reject',[{kind:'material',itemId:'healing-potion',quantity:1}]),/not eligible/);checks++;check(JSON.stringify((await store.read(ids.sale)).permanent)===JSON.stringify(beforeRejected.permanent),'forbidden potion sale leaves account unchanged');
 await assert.rejects(()=>store.sellItems(ids.sale,beforeRejected.revision,'sale-failure-rollback',[{kind:'material',itemId:'wolf-fur',quantity:2}],{failAt:'after-account'}),/Injected/);checks++;check(JSON.stringify((await store.read(ids.sale)).permanent)===JSON.stringify(beforeRejected.permanent),'failed sale rolls back both inventory and gold');
 const sameItemRevision=(await store.read(ids.sale)).revision,sameItem=await Promise.allSettled([store.sellItems(ids.sale,sameItemRevision,'sale-race-same-0001',[{kind:'equipment',instanceId:'equipment-sale-blue'}]),store.sellItems(ids.sale,sameItemRevision,'sale-race-same-0002',[{kind:'equipment',instanceId:'equipment-sale-blue'}])]);
 check(sameItem.filter(result=>result.status==='fulfilled').length===1&&sameItem.filter(result=>result.status==='rejected').length===1,'two tabs cannot sell the same equipment twice');check((await store.read(ids.sale)).permanent.accountResources.gold===76,'same-item race credits blue equipment once');
 const differentRevision=(await store.read(ids.sale)).revision,different=await Promise.all([store.sellItems(ids.sale,differentRevision,'sale-race-diff-0001',[{kind:'equipment',instanceId:'equipment-sale-purple'}]),store.sellItems(ids.sale,differentRevision,'sale-race-diff-0002',[{kind:'material',itemId:'iron-ore',quantity:4}])]);
 check(different.every(result=>!result.duplicate)&&(await store.read(ids.sale)).permanent.accountResources.gold===234,'concurrent sales of different items preserve both updates');
 const runtimeSaleAccount=await store.read(ids.sale),saleEvents=[],saleCommits=[];const saleRuntime=Runtime.create({store,account:runtimeSaleAccount,onCommitted:(before,after)=>saleCommits.push([before.revision,after.revision])});saleRuntime.onSharedGoldChanged(event=>saleEvents.push(event));
 const runtimeSale=await saleRuntime.sellItems('sale-runtime-0001',[{kind:'material',itemId:'wolf-fur',quantity:7}]);check(runtimeSale.balance===248&&saleRuntime.getSharedGold()===248,'runtime sale refreshes authoritative balance');check(saleEvents.length===1&&saleEvents[0].type==='sale'&&saleCommits.length===1,'runtime notifies gold and model listeners after sale');check((await store.read(ids.b)).permanent.accountResources.gold===0,'gold transactions never modify another account');await saleRuntime.deactivate();

 store.close();
 const closedId='supabase:77777777-7777-4777-8777-777777777777';await assert.rejects(()=>store.initializeSupabaseAccount(closedId),/closed/i);checks++;
 const reopenedLow=await Offline.open({indexedDB,name:'new-account-store-test',version:2}),reopened=Store.wrap(reopenedLow);
 check(await reopenedLow.read(closedId)===undefined,'closed database failure creates no partial account');check((await reopened.read(legacyId)).permanent.accountResources.gold===59,'reopening the database preserves shared gold balance');check((await reopened.read(ids.sale)).permanent.accountResources.gold===248,'reopening preserves sale inventory and balance');
 reopened.close();console.log('Permanent Supabase account initialization: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
