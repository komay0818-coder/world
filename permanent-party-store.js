(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./permanent-party-policy'):root.PermanentPartyPolicy,node?require('./offline-settlement-store'):root.OfflineSettlementStore,node?require('./permanent-farming-policy'):root.PermanentFarmingPolicy,node?require('./permanent-cutover-policy'):root.PermanentCutoverPolicy,node?require('./inventory-sale-policy'):root.InventorySalePolicy);if(node)module.exports=api;else root.PermanentPartyStore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Policy,Legacy,Farming,Cutover,Sales){
'use strict';const copy=x=>JSON.parse(JSON.stringify(x));
const SUPABASE_ACCOUNT=/^supabase:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function assertSupabaseAccountId(id){if(typeof id!=='string'||!SUPABASE_ACCOUNT.test(id))throw Error('Valid Supabase account identity required');return id;}
function assertGoldTransactionId(id){if(typeof id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9:_-]{7,127}$/.test(id))throw Error('Valid unique gold transaction identity required');return id;}
function assertDiscardTransactionId(id){if(typeof id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9:_-]{7,127}$/.test(id))throw Error('Valid unique discard transaction identity required');return id;}
function assertCloudOwner(accountId,authUserId){assertSupabaseAccountId(accountId);const expected=accountId.slice('supabase:'.length);if(typeof authUserId!=='string'||authUserId.toLowerCase()!==expected)throw Error('Cloud save identity mismatch');return expected;}
function emptySupabaseAccount(account,preferences,runs=[]){
 const model=account?.permanent,farming=account?.farming;if(!model||account.revision!==0)return false;
 return preferences?.revision===0&&Object.keys(preferences?.values||{}).length===0&&Object.keys(model.characters||{}).length===0&&model.slotOrder?.every(id=>id===null)&&!model.activeMainId&&Object.keys(model.parties||{}).length===0&&(model.bag?.items||[]).length===0&&Object.keys(model.equipmentOwners||{}).length===0&&Object.keys(account.commands||{}).length===0&&Object.keys(farming?.owners||{}).length===0&&Object.keys(farming?.sessions||{}).length===0&&Object.keys(farming?.legacyDebts||{}).length===0&&Object.keys(farming?.teamOffline||{}).length===0&&runs.length===0;
}
function validateInitializedAccount(account,preferences,id){
 if(!account||account.id!==id||!Number.isInteger(account.revision)||account.revision<0||'slots'in account)throw Error('Incomplete permanent account requires review');
 Policy.validate(account.permanent);
 if(account.cutover?.version!==1||account.cutover?.status!=='active'||Number(account.cutover.minimumClientVersion||0)<2)throw Error('Incomplete permanent account requires review');
 if(!account.farming||account.farming.version!==1||!account.farming.owners||!account.farming.sessions||!account.farming.eligibility||!account.farming.legacyDebts||!account.farming.teamOffline)throw Error('Incomplete permanent account requires review');
 Farming.validateTeams(account.permanent);
 if(!preferences||preferences.id!=='preferences:'+id||preferences.kind!=='preferences'||preferences.ownerId!==id||!Number.isInteger(preferences.revision)||preferences.revision<0||!preferences.values||typeof preferences.values!=='object'||Array.isArray(preferences.values))throw Error('Incomplete permanent account preferences require review');
 return true;
}
function assertSharedGoldMigrationPreconditions(account,runs=[]){
 if(!account?.permanent)throw Error('Permanent authority required');Policy.validate(account.permanent);
 const state=Policy.sharedGoldState(account.permanent);if(state.status==='invalid')throw Error('Invalid shared gold requires review');
 if(state.status==='ready')return {state,projection:null};
 const farming=account.farming||{},online=Object.values(farming.sessions||{}).some(session=>session?.status==='online');
 if(Object.keys(farming.owners||{}).length||online)throw Error('Stop active farming before shared gold migration');
 if(Object.keys(farming.legacyDebts||{}).length||Object.keys(farming.teamOffline||{}).length)throw Error('Settle preserved offline income before shared gold migration');
 if(runs.some(run=>run.status==='prepared'))throw Error('Settle pending offline income before shared gold migration');
 return {state,projection:Policy.migrateSharedGold(account.permanent)};
}
async function open(options){const store=await Legacy.open({...options,version:2});return wrap(store);}
function wrap(store){
 if(store.schemaVersion!==2)throw Error('Permanent authority requires schema 2');
 const transact=(...args)=>{args[5]={...args[5],clientVersion:2};return store.transactAccount(...args);};
 return {
 close:()=>store.close(),async read(id){const a=await store.read(id);if(!a)return a;const prefs=await store.readPreferences(id);return {...a,settings:prefs?.values||a.settings||{},settingsRevision:prefs?.revision||0};},recover:id=>store.recover(id),compactHistory:(id,options)=>store.compactHistory(id,options),storageStats:id=>store.storageStats(id),
 async exportCloudSnapshot(accountId,authUserId){
  const owner=assertCloudOwner(accountId,authUserId),bundle=await store.exportCloudBundle(accountId);validateInitializedAccount(bundle.account,bundle.preferences,accountId);for(const run of bundle.runs)if(run.job?.accountId!==accountId)throw Error('Cloud offline work ownership mismatch');
  const snapshot={...copy(bundle.account),cloudEnvelopeVersion:1,owner:{kind:'supabase-user',accountId,authUserId:owner},preferences:copy(bundle.preferences),offlineRuns:copy(bundle.runs)};return {snapshot,localRevision:bundle.account.revision,localPreferencesRevision:bundle.preferences.revision};
 },
 cloudSyncState:accountId=>{assertSupabaseAccountId(accountId);return store.readCloudSyncState(accountId);},
 prepareCloudUpload(accountId,details){assertSupabaseAccountId(accountId);return store.prepareCloudUpload(accountId,details);},
 completeCloudUpload(accountId,details){assertSupabaseAccountId(accountId);return store.completeCloudUpload(accountId,details);},
 acknowledgeCloudSnapshot(accountId,details){assertSupabaseAccountId(accountId);return store.acknowledgeCloudSnapshot(accountId,details);},
 async restoreCloudSnapshot(accountId,authUserId,snapshot,cloud,{failAt,expectedLocal}={}){
  const owner=assertCloudOwner(accountId,authUserId);if(!snapshot||snapshot.cloudEnvelopeVersion!==1||snapshot.owner?.kind!=='supabase-user'||snapshot.owner.accountId!==accountId||snapshot.owner.authUserId!==owner||snapshot.id!==accountId)throw Error('Cloud save ownership mismatch');
  const {cloudEnvelopeVersion,owner:ignoredOwner,preferences,offlineRuns,...account}=copy(snapshot);void cloudEnvelopeVersion;void ignoredOwner;
  if(!preferences||preferences.id!=='preferences:'+accountId||preferences.ownerId!==accountId||!Array.isArray(offlineRuns))throw Error('Cloud save bundle is incomplete');
  validateInitializedAccount(account,preferences,accountId);for(const run of offlineRuns)if(run.job?.accountId!==accountId)throw Error('Cloud offline work ownership mismatch');
  if(!Number.isInteger(cloud?.revision)||cloud.revision<1||typeof cloud.contentHash!=='string'||!/^[0-9a-f]{64}$/.test(cloud.contentHash))throw Error('Cloud save checkpoint is invalid');
  const checkpoint={id:'cloud-sync:'+accountId,kind:'cloud-sync',ownerId:accountId,cloudRevision:cloud.revision,cloudContentHash:cloud.contentHash,localRevision:account.revision,localPreferencesRevision:preferences.revision,snapshotHash:cloud.contentHash,updatedAt:cloud.updatedAt,pending:null};
  return store.restoreCloudBundle(accountId,{account,preferences,runs:offlineRuns},checkpoint,{failAt,canReplace:(existing,existingPreferences,runs,state)=>{
   if(state?.cloudRevision===cloud.revision&&state.cloudContentHash===cloud.contentHash&&existing?.revision===account.revision)return true;
   if(expectedLocal&&existing?.revision===expectedLocal.localRevision&&existingPreferences?.revision===expectedLocal.localPreferencesRevision&&!state?.pending&&state?.cloudRevision===expectedLocal.cloudRevision&&state?.cloudContentHash===expectedLocal.cloudContentHash&&state?.snapshotHash===expectedLocal.snapshotHash)return true;
   if(existing&&!existingPreferences)return false;return !existing||emptySupabaseAccount(existing,existingPreferences,runs);
  }});
 },
 async initializeSupabaseAccount(accountId,{failAt,now=Date.now()}={}){
  assertSupabaseAccountId(accountId);if(!Number.isFinite(now))throw Error('Invalid initialization time');
  const permanent=Policy.createEmptyModel();Policy.validate(permanent);
  const account={id:accountId,revision:0,permanent,cutover:{version:1,minimumClientVersion:2,status:'active',source:'supabase-new-account'},commands:{},receiptFloorRevision:0,receiptVersion:2};
  Farming.initialize(account,now);
  const preferences={id:'preferences:'+accountId,kind:'preferences',ownerId:accountId,revision:0,values:{}};
  const result=await store.initializePermanentAccount(account,preferences,{failAt});
  validateInitializedAccount(result.account,result.preferences,accountId);
  return {account:{...copy(result.account),settings:copy(result.preferences.values),settingsRevision:result.preferences.revision},created:result.created,duplicate:!result.created};
 },
 async prepareSharedGoldMigration(accountId,revision,{failAt,now=Date.now(),guard=()=>{}}={}){
  assertSupabaseAccountId(accountId);if(!Number.isInteger(revision)||revision<0)throw Error('Valid source revision required');if(!Number.isFinite(now))throw Error('Invalid backup time');guard();
  const current=await this.read(accountId);guard();if(!current||current.revision!==revision)throw Error('Concurrent save conflict');
  const runs=await store.pendingForAccount(accountId);guard();const checked=assertSharedGoldMigrationPreconditions(current,runs);
  if(checked.state.status==='ready')return {account:current,status:'ready',duplicate:true,preview:null,backup:null};
  const source={accountId,revision,permanent:copy(current.permanent)},fingerprint=await Legacy.receiptPolicy.fingerprint(source);guard();
  const preview={characters:Object.entries(checked.projection.audit.before.characterGold).map(([characterId,gold])=>({characterId,name:String(current.permanent.characters[characterId]?.character?.name||'未命名角色'),gold})),total:checked.projection.audit.after.accountGold,sourceRevision:revision};
  const commandId='shared-gold-backup-v1:'+fingerprint;
  const result=await transact(accountId,revision,commandId,{fingerprint,sourceRevision:revision},a=>{
   guard();const valid=assertSharedGoldMigrationPreconditions(a,runs);if(valid.state.status!=='legacy')throw Error('Shared gold source changed before backup');
   a.sharedGoldMigrationBackup={version:1,status:'verified',accountId,sourceRevision:revision,fingerprint,createdAt:now,source:copy(a.permanent),audit:copy(valid.projection.audit)};return a;
  },{failAt,metadataOnly:true,maintenance:true,allowPrepared:false,validateRuns:(a,currentRuns)=>assertSharedGoldMigrationPreconditions(a,currentRuns)});
  guard();const account=await this.read(accountId),backup=account?.sharedGoldMigrationBackup;if(!backup||backup.status!=='verified'||backup.fingerprint!==fingerprint||backup.sourceRevision!==revision)throw Error('Shared gold backup verification failed');
  const verifiedFingerprint=await Legacy.receiptPolicy.fingerprint({accountId,revision,permanent:backup.source});if(verifiedFingerprint!==fingerprint)throw Error('Shared gold backup fingerprint mismatch');guard();
  return {account,status:'legacy',duplicate:result.duplicate,preview,backup:{version:backup.version,status:backup.status,sourceRevision:backup.sourceRevision,fingerprint:backup.fingerprint,createdAt:backup.createdAt}};
 },
 async migrateSharedGold(accountId,revision,{failAt,backupFingerprint,guard=()=>{}}={}){
  assertSupabaseAccountId(accountId);if(!Number.isInteger(revision)||revision<0)throw Error('Valid source revision required');
  guard();const current=await this.read(accountId);guard();if(!current)throw Error('Unknown account');Policy.validate(current.permanent);
  const currentState=Policy.sharedGoldState(current.permanent);
  if(currentState.status==='ready')return {account:current,migrated:false,duplicate:true,audit:copy(current.permanent.accountResources.goldMigrationAudit||null)};
  const backup=current.sharedGoldMigrationBackup;
  if(!backupFingerprint||!backup||backup.status!=='verified'||backup.accountId!==accountId||backup.sourceRevision!==revision||backup.fingerprint!==backupFingerprint)throw Error('Verified shared gold backup required');
  const fingerprint=await Legacy.receiptPolicy.fingerprint({accountId,revision,permanent:backup.source});if(fingerprint!==backupFingerprint||JSON.stringify(backup.source)!==JSON.stringify(current.permanent))throw Error('Shared gold source no longer matches verified backup');guard();
  const result=await transact(accountId,revision,'shared-gold-migration-v1',{goldVersion:Policy.SHARED_GOLD_VERSION},a=>{
   guard();const checked=assertSharedGoldMigrationPreconditions(a);if(checked.state.status!=='legacy')throw Error('Shared gold migration already completed');
   if(JSON.stringify(a.permanent)!==JSON.stringify(backup.source))throw Error('Shared gold source changed after backup');
   a.permanent=checked.projection.model;a.sharedGoldMigrationBackup={...a.sharedGoldMigrationBackup,status:'committed',committedRevision:a.revision+1};return a;
  },{failAt,validateRuns:(a,runs)=>assertSharedGoldMigrationPreconditions(a,runs)});
  guard();const account=await this.read(accountId),state=Policy.sharedGoldState(account.permanent),audit=copy(account.permanent.accountResources.goldMigrationAudit||null);if(state.status!=='ready'||account.permanent.accountResources.goldVersion!==Policy.SHARED_GOLD_VERSION||audit?.after?.accountGold!==state.gold)throw Error('Shared gold migration verification failed');
  return {account,migrated:!result.duplicate,duplicate:result.duplicate,audit};
 },
 async transactSharedGold(accountId,revision,transactionId,operation,{failAt,maxAttempts=4}={}){
  assertSupabaseAccountId(accountId);assertGoldTransactionId(transactionId);if(!Number.isInteger(revision)||revision<0)throw Error('Valid source revision required');
  if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>8)throw Error('Invalid gold transaction retry limit');
  const payload=Policy.validateSharedGoldOperation(operation);
  let sourceRevision=revision,lastConflict=null;
  for(let attempt=0;attempt<maxAttempts;attempt++){
   try{
    const result=await transact(accountId,sourceRevision,'shared-gold:'+transactionId,payload,a=>{
     if(!a.permanent)throw Error('Permanent authority required');const changed=Policy.applySharedGoldTransaction(a.permanent,payload);a.permanent=changed.model;return a;
    },{failAt});
    const account=await this.read(accountId),balance=Policy.getSharedGold(account.permanent);return {account,balance,duplicate:result.duplicate,transactionId};
   }catch(error){
    if(!/Concurrent save conflict/.test(String(error?.message))||attempt+1>=maxAttempts)throw error;
    lastConflict=error;const current=await this.read(accountId);if(!current)throw Error('Unknown account');Policy.getSharedGold(current.permanent);sourceRevision=current.revision;
   }
  }
  throw lastConflict||Error('Shared gold transaction conflict');
 },
 async sellItems(accountId,revision,transactionId,selections,{failAt,maxAttempts=4}={}){
  assertSupabaseAccountId(accountId);assertGoldTransactionId(transactionId);if(!Number.isInteger(revision)||revision<0)throw Error('Valid source revision required');
  if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>8)throw Error('Invalid sale transaction retry limit');
  const payload={selections:Sales.normalizeSaleSelections(selections)};
  let sourceRevision=revision,lastConflict=null,summary=null;
  for(let attempt=0;attempt<maxAttempts;attempt++){
   try{
    const result=await transact(accountId,sourceRevision,'sell-items:'+transactionId,payload,a=>{
     if(!a.permanent)throw Error('Permanent authority required');const changed=Sales.applyAccountSale(a.permanent,payload.selections,Policy);a.permanent=changed.model;summary=copy({...changed,model:undefined});delete summary.model;return a;
    },{failAt});
    const account=await this.read(accountId),balance=Policy.getSharedGold(account.permanent);
    return {account,balance,duplicate:result.duplicate,transactionId,summary:result.duplicate?null:summary};
   }catch(error){
    if(!/Concurrent save conflict/.test(String(error?.message))||attempt+1>=maxAttempts)throw error;
    lastConflict=error;const current=await this.read(accountId);if(!current)throw Error('Unknown account');Policy.getSharedGold(current.permanent);sourceRevision=current.revision;
   }
  }
  throw lastConflict||Error('Sale transaction conflict');
 },
  async discardStarterEquipment(accountId,revision,transactionId,instanceId,{failAt,maxAttempts=4}={}){
   assertSupabaseAccountId(accountId);assertDiscardTransactionId(transactionId);if(!Number.isInteger(revision)||revision<0)throw Error('Valid source revision required');
   if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>8)throw Error('Invalid discard transaction retry limit');
   const payload={instanceId:Sales.normalizeDiscardInstanceId(instanceId)};
   let sourceRevision=revision,lastConflict=null,summary=null;
   for(let attempt=0;attempt<maxAttempts;attempt++){
    try{
     const result=await transact(accountId,sourceRevision,'discard-starter:'+transactionId,payload,a=>{
      if(!a.permanent)throw Error('Permanent authority required');const changed=Sales.applyStarterGiftDiscard(a.permanent,payload.instanceId,Policy);a.permanent=changed.model;summary=copy(changed.discarded);return a;
     },{failAt});
     const account=await this.read(accountId);return {account,duplicate:result.duplicate,transactionId,summary:result.duplicate?null:summary};
    }catch(error){
     if(!/Concurrent save conflict/.test(String(error?.message))||attempt+1>=maxAttempts)throw error;
     lastConflict=error;const current=await this.read(accountId);if(!current)throw Error('Unknown account');sourceRevision=current.revision;
    }
   }
   throw lastConflict||Error('Discard transaction conflict');
  },
 auditLegacy:raw=>Cutover.legacyAudit(raw),
 async recoveryReport(id){const bundle=await store.recoveryBundle(id);return {report:Cutover.inspect(bundle),bundle};},
 async beginRecovery(id,revision,token,{failAt}={}){
  if(!token||typeof token!=='string')throw Error('Recovery identity required');
  return transact(id,revision,'recovery-begin:'+token,{token},a=>{
   if(!a.permanent)throw Error('Permanent authority required');
   if(a.cutover?.recovery?.token&&a.cutover.recovery.token!==token)throw Error('Another recovery owns the account');
   // Maintenance metadata does not advance a prepared settlement's source revision.
   a.cutover=a.cutover||{version:1,minimumClientVersion:2};
   a.cutover.status='recovering';a.cutover.recovery={token,sourceRevision:revision};return a;
  },{metadataOnly:true,allowPrepared:true,maintenance:true,failAt});
 },
 async finishRecovery(id,revision,token,{failAt}={}){
  // An atomic transaction repeats validation against the latest authority. No old snapshot is restored.
  return transact(id,revision,'recovery-finish:'+token,{token},a=>{
   if(a.cutover?.recovery?.token!==token||a.cutover.status!=='recovering')throw Error('Recovery identity mismatch');
   Policy.validate(a.permanent);if(a.farming)Farming.validateTeams(a.permanent);
   a.cutover.status='active';a.cutover.lastRecovery={token,verifiedRevision:revision};delete a.cutover.recovery;return a;
  },{metadataOnly:true,maintenance:true,failAt,validateRuns:(a,runs)=>{const report=Cutover.inspect({account:a,runs});if(!report.valid)throw Error('Recovery requires review: '+JSON.stringify(report.issues));}});
 },
 async resumeRecoverySettlement(id,token,runId,calculate,options){
  const {report,bundle}=await this.recoveryReport(id),a=bundle.account;
  if(!report.valid||a.cutover?.status!=='recovering'||a.cutover.recovery?.token!==token)throw Error('Unsafe recovery settlement; inspect current authority');
  const record=bundle.runs.find(r=>r.id===runId);if(!record)throw Error('Unknown recovery settlement');
  if(record.status==='committed')return {report:copy(record.result.report),duplicate:true};
  if(record.job.kind!=='legacy-single')throw Error('Resume original pre-cutover settlement policy first');
  // Reuse the immutable original job, including time, seed, role and growth snapshot.
  // The injected calculator is the existing policy; this service contains no reward formula.
  const result=await calculate(copy(record.job));
  return this.commitSingleOffline(record.job,result,{...options,recoveryToken:token});
 },
 async saveSettings(id,revision,values,options){const r=await store.savePreferences(id,revision,values,options);return {settings:r.account.values,settingsRevision:r.account.revision};},
 prepareSingleOffline:job=>{Policy.validate(job.model);return store.prepareSingleOffline(job,{clientVersion:2,guard:a=>{if(a.farming)Farming.guardOffline(a,job);}});},pendingForAccount:id=>store.pendingForAccount(id),
 async commitSingleOffline(job,result,options){try{const reconciled=Policy.reconcileProgressGold(result.model,job.model,job.characterId);result={...copy(result),model:reconciled.model};Policy.validate(result.model);return await store.commitSingleOffline(job,result,{...options,clientVersion:2,finish:(a,j)=>{if(a.farming)Farming.finishOffline(a,j);}});}catch(error){await store.recordFailure(job.accountId,'offline:'+job.id,{revision:job.revision,runId:job.id},error);throw error;}},
 // Import is explicitly called by the migration coordinator, never on page load.
 async migrate(accountId,raw,{generate,failAt,prepareModel=model=>model}={}){
  if(!raw||!Array.isArray(raw.slots))throw new Policy.MigrationConflict([{code:'invalid-slots'}]);
  if(raw.settings&&Object.values(raw.settings).some(v=>typeof v!=='string'))throw Error('Legacy settings must preserve serialized strings');
  let account=await store.initialize(accountId,raw.slots);
  if(account.permanent)return {account:await this.read(accountId),duplicate:true};
  if(JSON.stringify(account.slots)!==JSON.stringify(raw.slots))throw Error('Legacy source changed; recover/read latest source before retry');
  const fingerprint=JSON.stringify(raw);
  const sourceDigest=await Legacy.receiptPolicy.fingerprint(raw);
  if(account.migrationBackup?.fingerprint!==fingerprint){
   const backed=await transact(accountId,account.revision,'backup:'+account.revision+':'+sourceDigest,{fingerprint},a=>{
    if(a.migrationBackup?.fingerprint===fingerprint)return a;
    if(a.cutover)throw Error('Cannot change frozen cutover source');
    a.backupHistory=[...(a.backupHistory||[]),...(a.migrationBackup?[a.migrationBackup]:[])];
    a.migrationBackup={version:1,fingerprint,source:copy(raw),status:'backed-up'};return a;
   },{allowPrepared:true,metadataOnly:true,maintenance:true});account=backed.account;
  }
  // Creating a backup must not advance a prepared run's source revision.
  // Pending jobs are rejected below and recover using their original revision.
  let model;
  try{const audit=Cutover.legacyAudit(raw);if(!audit.canMigrate){const e=new Policy.MigrationConflict(audit.issues);e.audit=audit;throw e;}model=prepareModel(Policy.migrate(raw,{generate}));Policy.validate(model);}catch(error){
   const issues=error.issues||[{code:'invalid-source',message:error.message}],issuesDigest=await Legacy.receiptPolicy.fingerprint(issues);
   await transact(accountId,account.revision,'migration-review:'+account.revision+':'+sourceDigest+':'+issuesDigest,{issues},a=>{
    a.migrationBackup.audit=error.audit||Cutover.legacyAudit(raw);a.migrationBackup.status='requires-review';a.migrationBackup.issues=error.issues||[{code:'invalid-source',message:error.message}];return a;
   },{allowPrepared:true,metadataOnly:true});throw error;
  }
  const prepared=await transact(accountId,account.revision,'cutover-prepare-v1',{sourceDigest},a=>{
   if(a.permanent||JSON.stringify(a.slots)!==JSON.stringify(raw.slots))throw Error('Cutover source changed');
   a.cutover={version:1,minimumClientVersion:2,status:'preparing',sourceDigest,sourceRevision:a.revision,backupVersion:a.migrationBackup.version};return a;
  },{metadataOnly:true,maintenance:true});account=prepared.account;
  if(account.permanent)return {account:await this.read(accountId),duplicate:true};
  if(account.cutover.status!=='preparing'||account.cutover.sourceDigest!==sourceDigest)throw Error('Cutover identity mismatch');
  if(failAt==='after-prepare')throw Error('Injected after cutover prepare');
  const result=await transact(accountId,account.revision,'permanent-migration-v1',{fingerprint},a=>{
   if(a.cutover?.status!=='preparing'||a.cutover.sourceDigest!==sourceDigest)throw Error('Cutover identity mismatch');
   a.permanent=model;delete a.slots;a.migrationBackup.status='committed';a.cutover={...a.cutover,status:'active',activatedRevision:a.revision+1};return a;
  },{failAt,preferencesSnapshot:raw.settings,maintenance:true});
  return {...result,account:await this.read(accountId)};
 },
 async commitOnline(accountId,revision,commandId,model,settings={},options){
  model=copy(model);settings=copy(settings);
  Policy.validate(model);
  return transact(accountId,revision,commandId,{model,settings},a=>{
   if(!a.permanent)throw Error('Permanent migration required');
   if(a.farming){if(options?.creation)a=Farming.transition(a,options.creation,Policy.apply,options);Farming.guardSave(a,model,options?.tokens);}
   if(a.permanent.retiredIds.some(id=>!model.retiredIds.includes(id)))throw Error('Retired identity ledger changed');
   for(const id of Object.keys(a.permanent.characters))if(!model.characters[id]&&(!model.retiredIds.includes(id)||!model.deletedCharacters[id]))throw Error('Character deleted without permanent archive');
   // The complete account candidate is committed once; legacy projections are never persisted.
   a.permanent=model;return a;
  },options);
 },
 async execute(accountId,revision,commandId,command,options){
  command=copy(command);
  return transact(accountId,revision,commandId,command,a=>{
   if(!a.permanent)throw Error('Permanent migration required');if(a.farming){if(!options?.coordinated)throw Error('Coordinated transition required');return Farming.transition(a,command,Policy.apply,options);}a.permanent=Policy.apply(a.permanent,command);return a;
  },options);
 },
 async initializeFarming(id,revision){return transact(id,revision,'farming-init:'+revision,{farmingVersion:1},a=>Farming.initialize(a));},
 async farmingAction(id,revision,commandId,action,options){return transact(id,revision,commandId,action,a=>{if(action.type==='start')return Farming.start(a,action);if(action.type==='stop')return Farming.stop(a,action);throw Error('Unknown farming action');},options);},
 async resetAccount(accountId,revision,commandId,options){
  return transact(accountId,revision,commandId,{reset:true},a=>{if(!a.permanent)throw Error('Permanent authority required');const m=a.permanent;
   if(a.farming&&Object.keys(a.farming.owners).length)throw Error('Stop farming before reset');
   if(a.farming&&(Object.keys(a.farming.legacyDebts||{}).length||Object.keys(a.farming.teamOffline||{}).length))throw Error('Settle preserved income before reset');
   a.resetArchives=[...(a.resetArchives||[]),{revision:a.revision,permanent:copy(m)}];
   m.retiredIds=[...new Set([...m.retiredIds,...Object.keys(m.characters)])];m.characters={};m.slotOrder=[];m.parties={};m.bag={items:[]};m.equipmentOwners={};m.activeMainId=null;if(a.farming)a.farming.eligibility={};Policy.validate(m);return a;
  },options);
 }
};}
return {open,wrap};
});
