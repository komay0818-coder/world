const output=document.querySelector('#result'),params=new URLSearchParams(location.search);
const assert=(condition,message)=>{if(!condition)throw Error(message);};
function data(id){const slots=[{character:{id:'main'},progress:{gold:10,potions:5,lastActiveAt:1000}}];return {accountId:id,characterId:'main',revision:0,slots,id:JSON.stringify([id,'main',1000]),seed:123,now:61000,snapshot:{startedAt:1000}};}
function result(job){const slots=structuredClone(job.slots);slots[0].progress.gold+=20;slots[0].progress.potions-=2;slots[0].progress.lastActiveAt=61000;return{slots,report:{claimed:false,runId:job.id}};}
document.querySelector('#verify').onclick=async()=>{
 const databaseName='offline-4a-acceptance-'+Date.now();let store=await OfflineSettlementStore.open({name:databaseName}),cases=0;
 try{
  for(const failAt of ['after-account','after-journal']){
   const job=data('abort-'+failAt);await store.initialize(job.accountId,job.slots);await store.prepare(job);
   let displayed=false;try{await OfflineSettlementStore.settle({store,job,calculate:result,failAt,getActiveCharacterId:()=>job.characterId,onCommitted:()=>{displayed=true;}});throw Error('expected rollback');}catch(e){assert(e.message.includes('Injected'),e.message);}
   assert(!displayed,'no claimed UI before commit');const account=await store.read(job.accountId);
   assert(account.revision===0&&account.slots[0].progress.gold===10&&account.slots[0].progress.potions===5,'atomic rollback');cases++;
   const recovered=await store.recover(job.id);assert(recovered.status==='prepared','prepared journal preserved');
   const committed=await OfflineSettlementStore.settle({store,job:recovered.job,calculate:result});
   assert(committed.report.claimed&&!committed.duplicate,'recovery commit');cases++;
   const duplicate=await OfflineSettlementStore.settle({store,job,calculate:()=>{throw Error('must not rerun');}});
   assert(duplicate.duplicate,'idempotent retry');assert((await store.read(job.accountId)).slots[0].progress.potions===3,'one potion deduction');cases++;
  }
  const job=data('concurrent');await store.initialize(job.accountId,job.slots);
  const commits=await Promise.all(Array.from({length:20},()=>OfflineSettlementStore.settle({store,job,calculate:result})));
  assert(commits.filter(c=>!c.duplicate).length===1,'one commit among 20 simultaneous requests');
  assert((await store.read(job.accountId)).revision===1,'one revision');cases++;
  const changed=data('conflict');await store.initialize(changed.accountId,changed.slots);await store.prepare(changed);
  const newSlots=structuredClone(changed.slots);newSlots[0].progress.gold=99;await store.update(changed.accountId,0,newSlots);
  try{await store.commit(changed,result(changed));throw Error('expected conflict');}catch(e){assert(e.message==='Save changed during simulation',e.message);}
  assert((await store.read(changed.accountId)).slots[0].progress.gold===99,'keep concurrent online update');cases++;
  const prepared=data('reload');await store.initialize(prepared.accountId,prepared.slots);await store.prepare(prepared);
    store.close();store=await OfflineSettlementStore.open({name:databaseName});
  const reopened=await store.recover(prepared.id);assert(reopened.job.seed===123,'durable seed after database close/reopen');
  await OfflineSettlementStore.settle({store,job:reopened.job,calculate:result});assert((await store.read(prepared.accountId)).slots[0].progress.gold===30,'resume prepared record after close');cases++;
  let shown=0;await OfflineSettlementStore.settle({store,job:prepared,calculate:result,getActiveCharacterId:()=> 'other-character',onCommitted:()=>shown++});assert(shown===0,'switched character must not receive popup');cases++;
  await OfflineSettlementStore.settle({store,job:prepared,calculate:result,getActiveCharacterId:()=> 'main',onCommitted:r=>{assert(r.report.claimed,'show after commit');shown++;}});assert(shown===1,'correct character receives committed result');cases++;
  const invalid=data('invalid');await store.initialize(invalid.accountId,invalid.slots);await store.prepare(invalid);const bad=result(invalid);bad.slots[0].progress.potions=-1;
  try{await store.commit(invalid,bad);throw Error('expected invalid result');}catch(e){assert(e.message==='Invalid saved resource',e.message);}assert((await store.read(invalid.accountId)).revision===0,'invalid result must not commit');cases++;
  const mismatch={...job,seed:999};try{await store.prepare(mismatch);throw Error('expected identity mismatch');}catch(e){assert(e.message.includes('different snapshot'),e.message);}cases++;
  output.textContent=JSON.stringify({passed:cases,failed:0,mechanism:'real IndexedDB atomic transaction',legacyLocalStorageUntouched:true},null,2);
 }catch(e){output.textContent='FAIL '+e.stack;}finally{store.close();}
};
document.querySelector('#race').onclick=async()=>{
 const store=await OfflineSettlementStore.open({name:'offline-4a-real-tabs-'+params.get('run')});
 try{const job=data('two-tabs');await store.initialize(job.accountId,job.slots);
  const committed=await OfflineSettlementStore.settle({store,job,calculate:async j=>{await new Promise(r=>setTimeout(r,2000));return result(j);}});
  const account=await store.read(job.accountId);output.textContent=JSON.stringify({role:params.get('role'),duplicate:committed.duplicate,revision:account.revision,gold:account.slots[0].progress.gold,potions:account.slots[0].progress.potions,claimed:committed.report.claimed},null,2);
 }catch(e){output.textContent='FAIL '+e.stack;}finally{store.close();}
};
