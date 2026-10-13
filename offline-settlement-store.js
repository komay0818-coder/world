(function(root){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function guardAuthority(account,clientVersion=1,{maintenance=false}={}){
    if(!account.cutover)return;
    if(account.cutover.version!==1||clientVersion<(account.cutover.minimumClientVersion||2))throw Error('Outdated save client; reload before writing');
    if(account.cutover.status!=='active'&&!maintenance)throw Error('Account recovery in progress; writes suspended');
  }
  const RECEIPT_LIMIT=32;
  async function hashSerialized(payload){
    if(!root.crypto?.subtle)throw Error('Secure transaction fingerprint unavailable');
    const bytes=new TextEncoder().encode(payload);
    const digest=await root.crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  }
  const fingerprint=payload=>hashSerialized(JSON.stringify(payload));
  const pinned=id=>id==='permanent-migration-v1'||id.startsWith('backup:')||id.startsWith('migration-review:');
  function compactReceipts(commands,floor=0){
    const next={...commands},completed=Object.entries(next).filter(([id,r])=>!pinned(id)&&(!r.metadataOnly||id.startsWith('recovery-'))).sort((a,b)=>a[1].revision-b[1].revision);
    for(const [id,r]of completed.slice(0,Math.max(0,completed.length-RECEIPT_LIMIT))){floor=Math.max(floor,r.revision);delete next[id];}
    return {commands:next,receiptFloorRevision:floor,receiptVersion:2};
  }
  function accountSizes(account){
    const bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length,active=copy(account);
    const backups={migrationBackup:active.migrationBackup,backupHistory:active.backupHistory,originalSource:active.permanent?.migration?.backup};
    delete active.commands;delete active.migrationBackup;delete active.backupHistory;
    if(active.permanent?.migration)delete active.permanent.migration.backup;
    return {accountBytes:bytes(account),activeBytes:bytes(active),backupBytes:bytes(backups),commandHistoryBytes:bytes(account.commands||{}),receiptCount:Object.keys(account.commands||{}).length,receiptLimit:RECEIPT_LIMIT};
  }
  // This separate database is not yet authoritative for legacy localStorage saves.
  // No localStorage reward projection is made in Batch 4 A.
  function open({indexedDB=root.indexedDB,name='stardust-offline-stage-a-4a',version=2}={}){
    if(!indexedDB)return Promise.reject(new Error('IndexedDB required; no unsafe fallback'));
    return new Promise((resolve,reject)=>{const request=indexedDB.open(name,version);let blocked=false;
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('accounts'))db.createObjectStore('accounts',{keyPath:'id'});if(!db.objectStoreNames.contains('runs'))db.createObjectStore('runs',{keyPath:'id'});};
      request.onerror=()=>reject(request.error);request.onblocked=()=>{blocked=true;reject(new Error('Database upgrade blocked; close old tabs and retry'));};
      request.onsuccess=()=>{if(blocked){request.result.close();return;}request.result.onversionchange=()=>request.result.close();resolve(create(request.result));};
    });
  }
  function create(db){
    function transaction(work,mode='readwrite'){return new Promise((resolve,reject)=>{
      const tx=db.transaction(['accounts','runs'],mode),accounts=tx.objectStore('accounts'),runs=tx.objectStore('runs');let result,failure;
      const abort=error=>{failure=error;tx.abort();};
      tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure||tx.error||new Error('Settlement transaction aborted'));tx.onerror=()=>{};
      try{work({accounts,runs,set:value=>{result=value;},abort});}catch(error){abort(error);}
    });}
    async function compactHistory(accountId,{source,failAt}={}){
      source=source||await transaction(({accounts,set})=>{const req=accounts.get(accountId);req.onsuccess=()=>set(req.result);},'readonly');
      if(!source||source.id!==accountId)throw Error('Unknown account');
      const original=JSON.stringify(source.commands||{}),candidates=compactReceipts(source.commands||{},source.receiptFloorRevision),commands={};
      for(const [id,old]of Object.entries(candidates.commands)){
        const receipt={...old};
        if('payload'in receipt){receipt.digest=await hashSerialized(receipt.payload);delete receipt.payload;receipt.metadataOnly=pinned(id);receipt.sourceRevision=receipt.revision-(receipt.metadataOnly?0:1);}
        commands[id]=receipt;
      }
      const compact={...candidates,commands};
      return transaction(({accounts,set,abort})=>{const req=accounts.get(accountId);req.onsuccess=()=>{try{
        const current=req.result;
        if(!current||current.revision!==source.revision||(current.receiptFloorRevision||0)!==(source.receiptFloorRevision||0)||JSON.stringify(current.commands||{})!==original)throw Error('Concurrent history cleanup conflict');
        const changed=JSON.stringify(current.commands||{})!==JSON.stringify(compact.commands)||current.receiptVersion!==2||current.receiptFloorRevision!==compact.receiptFloorRevision;
        if(changed){Object.assign(current,compact);accounts.put(current);if(failAt==='after-account')throw Error('Injected after history cleanup write');}
        set({account:current,changed});
      }catch(e){abort(e);}};});
    }
    async function recordFailure(accountId,commandId,payload,error){
      try{
        const message=error?.message||String(error),digest=await fingerprint({accountId,commandId,payload,message}),id='failure:'+digest;
        await transaction(({accounts,runs,abort})=>{const req=accounts.get(accountId);req.onsuccess=()=>{try{
          const a=req.result;if(!a?.cutover&&!a?.permanent)return;
          runs.put({id,status:'failed',job:{kind:'transaction-failure',accountId,commandId,sourceRevision:payload?.revision},digest,message,observedRevision:a.revision,failedAt:Date.now()});
          const own=runs.getAll();own.onsuccess=()=>{try{const failures=own.result.filter(r=>r.status==='failed'&&r.job?.kind==='transaction-failure'&&r.job.accountId===accountId).sort((x,y)=>y.failedAt-x.failedAt||y.id.localeCompare(x.id));for(const r of failures.slice(32))runs.delete(r.id);}catch(e){abort(e);}};
        }catch(e){abort(e);}};});
      }catch(recordError){if(error&&typeof error==='object')error.failureRecordError=recordError.message;}
    }
    return {
      close:()=>db.close(),
      schemaVersion:db.version,
      recordFailure,
      // Phase 1 uses the same stores and transaction boundary, never a second DB.
      async transactAccount(accountId,revision,commandId,payload,transform,{failAt,allowPrepared=false,metadataOnly=false,preferencesSnapshot,clientVersion=1,maintenance=false,validateRuns=()=>{}}={}){
        if(!commandId)return Promise.reject(new Error('Command identity required'));
        const digest=await fingerprint(payload);
        const apply=()=>transaction(({accounts,runs,set,abort})=>{
          const req=accounts.get(accountId);req.onsuccess=()=>{
            try{
              const account=req.result;if(!account)throw Error('Unknown account');
              guardAuthority(account,clientVersion,{maintenance});
              if(Object.values(account.commands||{}).some(r=>'payload'in r)){
                const upgrade=new Error('Receipt upgrade required');upgrade.receiptSource=account;throw upgrade;
              }
              const previous=Object.hasOwn(account.commands||{},commandId)?account.commands[commandId]:null;
              if(previous){if(previous.digest!==digest)throw Error('Command identity reused');set({account,duplicate:true});return;}
              const bound=commandId.match(/^online-v2:(\d+):/);if(bound&&Number(bound[1])!==revision)throw Error('Command source revision mismatch');
              if(revision<(account.receiptFloorRevision||0))throw Error('Expired command receipt; reload authoritative save');
              if(account.revision!==revision)throw Error('Concurrent save conflict');
              const pending=runs.getAll();pending.onsuccess=()=>{try{
                if(!allowPrepared&&pending.result.some(r=>r.status==='prepared'&&r.job.accountId===accountId))throw Error('Recover prepared offline settlement before migration or mutation');
                validateRuns(account,pending.result.filter(r=>r.job?.accountId===accountId));
                // IndexedDB already gives this transaction an isolated structured clone.
                const oldRevision=account.revision,oldSlots=metadataOnly?JSON.stringify(account.slots):null,oldPermanent=metadataOnly?JSON.stringify(account.permanent):null;
                const next=transform(account);
                if(!next||next.id!==accountId)throw Error('Invalid account transaction');
                if(next.permanent&&('slots'in next))throw Error('Duplicate save authority');
                if(metadataOnly&&(JSON.stringify(next.slots)!==oldSlots||JSON.stringify(next.permanent)!==oldPermanent))throw Error('Metadata transaction changed authoritative state');
                next.revision=oldRevision+(metadataOnly?0:1);
                Object.assign(next,compactReceipts({...next.commands,[commandId]:{digest,revision:next.revision,sourceRevision:revision,metadataOnly}},next.receiptFloorRevision));
                accounts.put(next);
                if(preferencesSnapshot!==undefined){const pref=accounts.get('preferences:'+accountId);pref.onsuccess=()=>{try{if(!pref.result)accounts.add({id:'preferences:'+accountId,kind:'preferences',ownerId:accountId,revision:0,values:copy(preferencesSnapshot)});else if(pref.result.kind!=='preferences'||pref.result.ownerId!==accountId)throw Error('Preferences ownership conflict');}catch(e){abort(e);}};}
                if(failAt==='after-account')throw Error('Injected after account write');
                set({account:next,duplicate:false});
              }catch(e){abort(e);}};
            }catch(e){abort(e);}
          };
        });
        try{return await apply();}catch(error){
          if(!error.receiptSource){await recordFailure(accountId,commandId,{revision,digest},error);throw error;}
          await compactHistory(accountId,{source:error.receiptSource});return apply();
        }
      },
      compactHistory,
      async storageStats(accountId){
        return transaction(({accounts,runs,set})=>{const req=accounts.get(accountId);req.onsuccess=()=>{if(!req.result){set(null);return;}const sizes=accountSizes(req.result),jobs=runs.getAll();jobs.onsuccess=()=>{
          const own=jobs.result.filter(r=>r.job.accountId===accountId),bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length;
          set({...sizes,pendingRunBytes:bytes(own.filter(r=>r.status==='prepared')),completedRunBytes:bytes(own.filter(r=>r.status==='committed')),failedAttemptBytes:bytes(own.filter(r=>r.status==='failed'))});
        };};},'readonly');
      },
      initialize(accountId,slots){return transaction(({accounts,set,abort})=>{const req=accounts.get(accountId);req.onsuccess=()=>{
        if(req.result){set(req.result);return;}
        try{const account={id:accountId,revision:0,slots:copy(slots)};accounts.add(account);set(account);}catch(e){abort(e);}
      };});},
      read(accountId){return transaction(({accounts,set})=>{const req=accounts.get(accountId);req.onsuccess=()=>set(req.result);},'readonly');},
      async readPreferences(accountId){
        return transaction(({accounts,set})=>{const req=accounts.get('preferences:'+accountId);req.onsuccess=()=>set(req.result);},'readonly');
      },
      async savePreferences(accountId,revision,values,options){
        const id='preferences:'+accountId;await this.initialize(id,[]);const snapshot=copy(values);
        return this.transactAccount(id,revision,'preferences-v2:'+revision+':'+root.crypto.randomUUID(),{values:snapshot},a=>{delete a.slots;a.kind='preferences';a.ownerId=accountId;a.values=snapshot;return a;},options);
      },
      recoveryBundle(accountId){return transaction(({accounts,runs,set})=>{const a=accounts.get(accountId);a.onsuccess=()=>{const r=runs.getAll();r.onsuccess=()=>set({account:a.result,runs:r.result.filter(x=>x.job?.accountId===accountId)});};},'readonly');},
      prepareSingleOffline(job,{guard=()=>{},clientVersion=1}={}){return transaction(({accounts,runs,set,abort})=>{
        const saved=runs.get(job.id);saved.onsuccess=()=>{if(saved.result){const old=saved.result.job;if(old.kind!=='legacy-single'||old.accountId!==job.accountId||old.characterId!==job.characterId||old.from!==job.from){abort(Error('Offline identity mismatch'));return;}set(saved.result);return;}
        const req=accounts.get(job.accountId);req.onsuccess=()=>{const a=req.result;if(!a?.permanent||a.revision!==job.revision||JSON.stringify(a.permanent)!==JSON.stringify(job.model)){abort(Error('Concurrent offline snapshot conflict'));return;}try{guardAuthority(a,clientVersion);guard(a);}catch(e){abort(e);return;}
          const pending=runs.getAll();pending.onsuccess=()=>{if(pending.result.some(r=>r.status==='prepared'&&r.job.accountId===job.accountId)){abort(Error('Recover prepared offline settlement first'));return;}const record={id:job.id,status:'prepared',job:copy(job)};runs.add(record);set(record);};
        };
      };});},
      commitSingleOffline(job,result,{failAt,finish=()=>{},clientVersion=1,recoveryToken}={}){return transaction(({accounts,runs,set,abort})=>{
        const saved=runs.get(job.id);saved.onsuccess=()=>{const record=saved.result;if(!record||JSON.stringify(record.job)!==JSON.stringify(job)){abort(Error('Offline snapshot mismatch'));return;}
          if(record.status==='committed'){set({report:record.result.report,duplicate:true});return;}
          const req=accounts.get(job.accountId);req.onsuccess=()=>{try{const a=req.result;if(a?.revision!==job.revision||JSON.stringify(a.permanent)!==JSON.stringify(job.model))throw Error('Concurrent offline commit conflict');
            const maintenance=!!recoveryToken&&a.cutover?.recovery?.token===recoveryToken;
            guardAuthority(a,clientVersion,{maintenance});
            if(!result.model||result.model.characters[job.characterId]?.progress.lastActiveAt!==job.now)throw Error('Offline boundary mismatch');
            a.permanent=copy(result.model);finish(a,job);a.revision++;accounts.put(a);if(failAt==='after-account')throw Error('Injected offline account failure');
            const committed={report:{...copy(result.report),claimed:true}};runs.put({...record,status:'committed',result:committed});if(failAt==='after-journal')throw Error('Injected offline journal failure');set({...committed,duplicate:false});
          }catch(e){abort(e);}};
        };
      });},
      pendingForAccount(accountId){return transaction(({runs,set})=>{const req=runs.getAll();req.onsuccess=()=>set(req.result.filter(r=>r.status==='prepared'&&r.job.accountId===accountId));},'readonly');},
      prepare(job){return transaction(({accounts,runs,set,abort})=>{
        const run=runs.get(job.id);run.onsuccess=()=>{
          if(run.result){if(JSON.stringify(run.result.job)!==JSON.stringify(job)){abort(new Error('Run identity reused with different snapshot'));return;}set(run.result);return;}
          const req=accounts.get(job.accountId);req.onsuccess=()=>{
            const account=req.result;
            try{if(account)guardAuthority(account);}catch(e){abort(e);return;}
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
              if(account)guardAuthority(account);
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
      recover(runId){return transaction(({runs,set})=>{const req=runs.get(runId);req.onsuccess=()=>set(req.result);},'readonly');},
      // Future online writes MUST use this same versioned transaction boundary.
      update(accountId,revision,slots){return transaction(({accounts,set,abort})=>{
        const req=accounts.get(accountId);req.onsuccess=()=>{const account=req.result;
          if(!account||account.permanent||account.revision!==revision){abort(new Error('Concurrent save conflict'));return;}
          try{guardAuthority(account);}catch(e){abort(e);return;}
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
  const api={open,settle,receiptPolicy:{limit:RECEIPT_LIMIT,fingerprint,compactReceipts,accountSizes}};if(typeof module==='object'&&module.exports)module.exports=api;else root.OfflineSettlementStore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
