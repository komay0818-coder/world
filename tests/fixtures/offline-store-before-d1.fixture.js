(function(root){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  // This separate database is not yet authoritative for legacy localStorage saves.
  // No localStorage reward projection is made in Batch 4 A.
  function open({indexedDB=root.indexedDB,name='stardust-offline-stage-a-4a'}={}){
    if(!indexedDB)return Promise.reject(new Error('IndexedDB required; no unsafe fallback'));
    return new Promise((resolve,reject)=>{const request=indexedDB.open(name,1);
      request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('accounts',{keyPath:'id'});db.createObjectStore('runs',{keyPath:'id'});};
      request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Database upgrade blocked'));
      request.onsuccess=()=>resolve(create(request.result));
    });
  }
  function create(db){
    function transaction(work){return new Promise((resolve,reject)=>{
      const tx=db.transaction(['accounts','runs'],'readwrite'),accounts=tx.objectStore('accounts'),runs=tx.objectStore('runs');let result,failure;
      const abort=error=>{failure=error;tx.abort();};
      tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure||tx.error||new Error('Settlement transaction aborted'));tx.onerror=()=>{};
      try{work({accounts,runs,set:value=>{result=value;},abort});}catch(error){abort(error);}
    });}
    return {
      close:()=>db.close(),
      // Phase 1 uses the same stores and transaction boundary, never a second DB.
      transactAccount(accountId,revision,commandId,payload,transform,{failAt,allowPrepared=false,metadataOnly=false}={}){
        if(!commandId)return Promise.reject(new Error('Command identity required'));
        return transaction(({accounts,runs,set,abort})=>{
          const req=accounts.get(accountId);req.onsuccess=()=>{
            try{
              const account=req.result;if(!account)throw Error('Unknown account');
              const previous=Object.hasOwn(account.commands||{},commandId)?account.commands[commandId]:null;
              if(previous){if(previous.payload!==JSON.stringify(payload))throw Error('Command identity reused');set({account,duplicate:true});return;}
              if(account.revision!==revision)throw Error('Concurrent save conflict');
              const pending=runs.getAll();pending.onsuccess=()=>{try{
                if(!allowPrepared&&pending.result.some(r=>r.status==='prepared'&&r.job.accountId===accountId))throw Error('Recover prepared offline settlement before migration or mutation');
                const next=transform(copy(account));
                if(!next||next.id!==accountId)throw Error('Invalid account transaction');
                if(next.permanent&&('slots'in next))throw Error('Duplicate save authority');
                if(metadataOnly&&(JSON.stringify(next.slots)!==JSON.stringify(account.slots)||JSON.stringify(next.permanent)!==JSON.stringify(account.permanent)))throw Error('Metadata transaction changed authoritative state');
                next.revision=account.revision+(metadataOnly?0:1);
                next.commands={...account.commands,[commandId]:{payload:JSON.stringify(payload),revision:next.revision}};
                accounts.put(next);
                if(failAt==='after-account')throw Error('Injected after account write');
                set({account:next,duplicate:false});
              }catch(e){abort(e);}};
            }catch(e){abort(e);}
          };
        });
      },
      initialize(accountId,slots){return transaction(({accounts,set,abort})=>{const req=accounts.get(accountId);req.onsuccess=()=>{
        if(req.result){set(req.result);return;}
        try{const account={id:accountId,revision:0,slots:copy(slots)};accounts.add(account);set(account);}catch(e){abort(e);}
      };});},
      read(accountId){return transaction(({accounts,set})=>{const req=accounts.get(accountId);req.onsuccess=()=>set(req.result);});},
      prepare(job){return transaction(({accounts,runs,set,abort})=>{
        const run=runs.get(job.id);run.onsuccess=()=>{
          if(run.result){if(JSON.stringify(run.result.job)!==JSON.stringify(job)){abort(new Error('Run identity reused with different snapshot'));return;}set(run.result);return;}
          const req=accounts.get(job.accountId);req.onsuccess=()=>{
            const account=req.result;
            if(!account||account.permanent||account.revision!==job.revision||JSON.stringify(account.slots)!==JSON.stringify(job.slots)){abort(new Error('Stale character save'));return;}
            const record={id:job.id,status:'prepared',job:copy(job)};runs.add(record);set(record);
          };
        };
      });},
      // Deliberate injection points exercise atomic rollback, never partial live writes.
      commit(job,result,{failAt}={}){return transaction(({accounts,runs,set,abort})=>{
        const req=runs.get(job.id);req.onsuccess=()=>{
          const record=req.result;
          if(!record||JSON.stringify(record.job)!==JSON.stringify(job)){abort(new Error('Missing/mismatched prepared run'));return;}
          if(record.status==='committed'){set({...record.result,duplicate:true});return;}
          const get=accounts.get(job.accountId);get.onsuccess=()=>{
            try{
              const account=get.result;
              if(!account||account.revision!==job.revision||JSON.stringify(account.slots)!==JSON.stringify(job.slots))throw new Error('Save changed during simulation');
              if(!result || !Array.isArray(result.slots) || result.slots.length!==job.slots.length || result.report?.runId!==job.id || result.report.claimed)throw new Error('Invalid settlement result');
              for(let i=0;i<job.slots.length;i++){
                if(result.slots[i]?.character?.id!==job.slots[i]?.character?.id)throw new Error('Result character mismatch');
                const p=result.slots[i]?.progress;
                if(p&&['gold','potions','manaPotions'].some(key=>p[key]!=null&&(!Number.isFinite(p[key])||p[key]<0)))throw new Error('Invalid saved resource');
              }
              const main=result.slots.find(slot=>slot?.character?.id===job.characterId);
              if(!main||main.progress.lastActiveAt!==job.now)throw new Error('Invalid settlement boundary');
              const committed=copy(result);committed.report.claimed=true;
              accounts.put({...account,revision:account.revision+1,slots:committed.slots});
              if(failAt==='after-account')throw new Error('Injected after account write');
              runs.put({...record,status:'committed',result:committed});
              if(failAt==='after-journal')throw new Error('Injected after journal write');
              set({...committed,duplicate:false});
            }catch(e){abort(e);}
          };
        };
      });},
      recover(runId){return transaction(({runs,set})=>{const req=runs.get(runId);req.onsuccess=()=>set(req.result);});},
      // Future online writes MUST use this same versioned transaction boundary.
      update(accountId,revision,slots){return transaction(({accounts,set,abort})=>{
        const req=accounts.get(accountId);req.onsuccess=()=>{const account=req.result;
          if(!account||account.permanent||account.revision!==revision){abort(new Error('Concurrent save conflict'));return;}
          const next={...account,revision:revision+1,slots:copy(slots)};accounts.put(next);set(next);
        };
      });}
    };
  }
  async function settle({store,job,calculate,onCommitted,failAt,getActiveCharacterId}){
    // No presentation callback is called before the transaction has completed.
    const present=result=>{if(onCommitted&&getActiveCharacterId?.()===job.characterId)onCommitted(result);};
    const prepared=await store.prepare(job);
    if(prepared.status==='committed'){const result={...prepared.result,duplicate:true};present(result);return result;}
    const result=await calculate(prepared.job); // Promise seam for a future Worker.
    const committed=await store.commit(prepared.job,result,{failAt});
    present(committed);return committed;
  }
  const api={open,settle};if(typeof module==='object'&&module.exports)module.exports=api;else root.OfflineSettlementStore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
