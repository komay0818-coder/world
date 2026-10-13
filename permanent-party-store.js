(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./permanent-party-policy'):root.PermanentPartyPolicy,node?require('./offline-settlement-store'):root.OfflineSettlementStore,node?require('./permanent-farming-policy'):root.PermanentFarmingPolicy,node?require('./permanent-cutover-policy'):root.PermanentCutoverPolicy);if(node)module.exports=api;else root.PermanentPartyStore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Policy,Legacy,Farming,Cutover){
'use strict';const copy=x=>JSON.parse(JSON.stringify(x));
async function open(options){const store=await Legacy.open({...options,version:2});return wrap(store);}
function wrap(store){
 if(store.schemaVersion!==2)throw Error('Permanent authority requires schema 2');
 const transact=(...args)=>{args[5]={...args[5],clientVersion:2};return store.transactAccount(...args);};
 return {
 close:()=>store.close(),async read(id){const a=await store.read(id);if(!a)return a;const prefs=await store.readPreferences(id);return {...a,settings:prefs?.values||a.settings||{},settingsRevision:prefs?.revision||0};},recover:id=>store.recover(id),compactHistory:(id,options)=>store.compactHistory(id,options),storageStats:id=>store.storageStats(id),
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
 async commitSingleOffline(job,result,options){try{Policy.validate(result.model);return await store.commitSingleOffline(job,result,{...options,clientVersion:2,finish:(a,j)=>{if(a.farming)Farming.finishOffline(a,j);}});}catch(error){await store.recordFailure(job.accountId,'offline:'+job.id,{revision:job.revision,runId:job.id},error);throw error;}},
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
