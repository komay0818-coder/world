document.querySelector('#verify').onclick=async()=>{
 const output=document.querySelector('#result');let store;
 try{
  const jobs=['warrior','mage','priest'];
  const party=jobs.map((job,i)=>({id:'fixture-'+i,isMain:!i,character:{id:'fixture-'+i,job,race:'human'},job,level:30,currentHp:20,maxHp:100,alive:true,
   resourceType:job==='warrior'?'rage':'mana',resourceCurrent:job==='warrior'?0:1000,resourceMax:job==='warrior'?100:1000,shield:0,nextAttackAt:1000,
   stats:{hp:100,attack:100,defense:0,attackSpeed:1,mana:1000,crit:0,parry:0,dodge:0},progress:{potions:3,manaPotions:3,gold:10,equipment:{},skillLevels:{}}}));
  const snapshot=OfflinePartyPolicy.capture({members:party,now:1000,fighting:true,monsters:[{id:'plainsGoblinYoung',level:30,maxHp:100,attack:0,attackSpeed:1,defense:0,lootConfig:EquipmentDropPolicy.TEST_LOOT_CONFIGS.normal}],mapId:'plains-entrance'});
  const slots=party.map(m=>({character:m.character,progress:{level:30,xp:0,gold:10,potions:3,manaPotions:3,inventory:[{id:'healing-potion',kind:'consumable',quantity:3}],lastActiveAt:1000}}));
  const job=OfflineSettlementPolicy.createJob({accountId:'integrated',characterId:'fixture-0',revision:0,slots,snapshot,map:{id:'plains-entrance',chapter:1,min:1,max:5,normalXp:10},now:61000,seed:12345});
  const expected=OfflineSettlementPolicy.calculate(job);
  store=await OfflineSettlementStore.open({name:'offline-4a-integrated-'+Date.now()});await store.initialize(job.accountId,job.slots);
  const committed=await OfflineSettlementStore.settle({store,job,calculate:OfflineSettlementPolicy.calculate});
  const account=await store.read(job.accountId);
  if(JSON.stringify(account.slots)!==JSON.stringify(expected.slots))throw Error('Stored save differs from deterministic simulation');
  if(!committed.report.claimed||account.revision!==1||committed.report.potionsUsed!==3||account.slots[0].progress.potions!==0)throw Error('Reward/potion transaction mismatch');
  const retry=await OfflineSettlementStore.settle({store,job,calculate:()=>{throw Error('duplicate should never simulate');}});
  if(!retry.duplicate)throw Error('repeat claim');
  output.textContent=JSON.stringify({passed:1,failed:0,...committed.report,party:account.slots.map(s=>s.progress.partyMemberState),revision:account.revision,repeatBlocked:retry.duplicate},null,2);
 }catch(e){output.textContent='FAIL '+e.stack;}finally{store?.close();}
};
