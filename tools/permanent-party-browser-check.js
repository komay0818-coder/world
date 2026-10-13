const out=document.querySelector('#result'),query=new URLSearchParams(location.search);const assert=(v,m)=>{if(!v)throw Error(m);};
function raw(){return {slots:[{character:{id:'one',job:'warrior'},progress:{level:20,xp:0,gold:10,potions:2,inventory:[{id:'healing-potion',kind:'consumable',quantity:2},{id:'sword',instanceId:'sword',kind:'equipment',slot:'weapon',allowedJobs:['warrior']}],equipment:{weapon:null},party:{activeMemberIds:['one']},lastActiveAt:1000}}]};}
document.querySelector('#verify').onclick=async()=>{let n=0;const check=(v,m)=>{assert(v,m);n++;};const name='permanent-isolated-'+crypto.randomUUID();let legacy=await OfflineSettlementStore.open({name}),s=PermanentPartyStore.wrap(legacy);
try{
 const r=raw();await legacy.initialize('a',r.slots);
 try{await s.migrate('a',r,{failAt:'after-account'});throw Error('expected rollback');}catch(e){check(e.message.includes('Injected'),'failure injection');}
 let a=await s.read('a');check(!a.permanent&&a.revision===0,'rollback leaves legacy authoritative');check(JSON.stringify(a.migrationBackup.source)===JSON.stringify(r),'durable backup before migration');
 s.close();legacy=await OfflineSettlementStore.open({name});s=PermanentPartyStore.wrap(legacy);a=(await s.migrate('a',r)).account;check(a.permanent&&!('slots'in a),'single authority');check((await s.migrate('a',r)).duplicate,'migration retry no reimport');
 let first=await s.execute('a',a.revision,'equip',{type:'equip',characterId:'one',slot:'weapon',instanceId:'sword'});check(first.account.permanent.characters.one.progress.equipment.weapon.instanceId==='sword','equipment transaction');
 check((await s.execute('a',a.revision,'equip',{type:'equip',characterId:'one',slot:'weapon',instanceId:'sword'})).duplicate,'retry idempotent');
 try{await s.execute('a',a.revision,'stale',{type:'unequip',characterId:'one',slot:'weapon'});}catch(e){check(e.message.includes('Concurrent'),'stale version rejected');}
 try{await legacy.update('a',first.account.revision,r.slots);}catch(e){check(e.message.includes('Concurrent'),'legacy write cannot overwrite permanent authority');}
 try{await s.execute('a',first.account.revision,'unequip',{type:'unequip',characterId:'one',slot:'weapon'},{failAt:'after-account'});}catch(e){check(e.message.includes('Injected'),'equipment rollback');}
 check((await s.read('a')).permanent.equipmentOwners.sword.kind==='equipped','ownership rollback complete');
 const conflict=raw();conflict.slots[0].progress.potions=8;try{await s.migrate('bad',conflict);}catch(e){check(e.name==='MigrationConflict','conflict blocks migration');}
 const bad=await s.read('bad');check(!bad.permanent&&bad.slots[0].progress.potions===8&&bad.migrationBackup.issues[0].code==='potion-counter-conflict','conflict source and audit preserved');
 const pending=raw();await legacy.initialize('pending',pending.slots);const job={id:'pending-run',accountId:'pending',revision:0,slots:pending.slots,characterId:'one',now:61000,seed:7};await legacy.prepare(job);
 try{await s.migrate('pending',pending);}catch(e){check(e.message.includes('Recover prepared'),'pending recovery gate');}
 check((await s.read('pending')).revision===0,'backup preserves pending source revision');
 const resumed=await s.recover('pending-run');check(resumed.job.seed===7&&resumed.status==='prepared','old seed and snapshot preserved');
 const result=structuredClone(pending.slots);result[0].progress.gold=25;result[0].progress.lastActiveAt=61000;
 await legacy.commit(job,{slots:result,report:{runId:job.id,claimed:false}});const migrated=(await s.migrate('pending',{slots:result})).account;
 check(migrated.permanent.characters.one.progress.gold===25,'original policy recovery then migration');check(migrated.backupHistory.length===1,'prior backup retained');
 out.textContent=JSON.stringify({passed:n,failed:0,database:name});
}catch(e){out.textContent=JSON.stringify({passed:n,failed:1,error:e.message,stack:e.stack});}finally{s.close();}};
document.querySelector('#race').onclick=async()=>{const name='permanent-race-'+query.get('run'),s=await PermanentPartyStore.open({name});try{
 const a=(await s.migrate('race',raw())).account;await new Promise(r=>setTimeout(r,1500));
 const result=await s.execute('race',a.revision,'equip-'+query.get('role'),{type:'equip',characterId:'one',slot:'weapon',instanceId:'sword'});
 out.textContent=JSON.stringify({status:'committed',revision:result.account.revision});
}catch(e){out.textContent=JSON.stringify({status:'rejected',reason:e.message});}finally{s.close();}};
