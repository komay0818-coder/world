(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./permanent-party-policy'):root.PermanentPartyPolicy);if(node)module.exports=api;else root.PermanentCutoverPolicy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(P){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
// Stable serialization compares values, not insertion order. Equipment payloads retain runes and affixes.
function stable(x){if(Array.isArray(x))return '['+x.map(stable).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';return JSON.stringify(x);}
function legacyAudit(raw){
 const records=[],issues=[],roles=[];
 for(const [slot,s]of (Array.isArray(raw?.slots)?raw.slots:[]).entries())if(s){
  const role={slot,characterId:s.character?.id||null,name:s.character?.name||null};roles.push(role);
  const entries=[...(Array.isArray(s.progress?.inventory)?s.progress.inventory:[]).map((item,index)=>({item,location:'inventory:'+index})),...Object.entries(s.progress?.equipment||{}).filter(([,item])=>item).map(([key,item])=>({item,location:'equipment:'+key}))];
  for(const {item,location}of entries){if(!item||typeof item!=='object')continue;const equipment=item.kind==='equipment'||location.startsWith('equipment:');
   records.push({...role,location,equipment,templateId:item.baseItemId||item.templateId||null,instanceId:item.instanceId||null,legacyId:item.id||null,quantity:equipment?1:(item.quantity??null),payload:copy(item)});
   if(!equipment&&['material','consumable','recipe','rune'].includes(item.kind)&&item.quantity===undefined)issues.push({code:'unknown-item-quantity',role,location,itemId:item.id});
   if(equipment&&item.kind!=='equipment')issues.push({code:'equipment-kind-conflict',role,location,kind:item.kind||null});
   if(equipment&&'instanceId'in item&&(typeof item.instanceId!=='string'||!item.instanceId))issues.push({code:'invalid-instance-identity',role,location,instanceId:item.instanceId});
   if(equipment&&item.baseItemId&&item.templateId&&item.baseItemId!==item.templateId)issues.push({code:'template-identity-conflict',role,location});
   if(equipment&&item.quantity!==undefined&&item.quantity!==1)issues.push({code:'equipment-quantity-conflict',role,location,quantity:item.quantity});
  }
 }
 const explicit=new Map(),bare=new Map();for(const r of records.filter(r=>r.equipment)){const map=r.instanceId?explicit:bare,key=r.instanceId||r.legacyId;if(key){if(!map.has(key))map.set(key,[]);map.get(key).push(r);}}
 for(const [id,locations]of explicit)if(locations.length>1)issues.push({code:'duplicate-instance',id,locations:copy(locations)});
 for(const [id,locations]of bare){const overlap=explicit.get(id)||[];if(locations.length+overlap.length>1)issues.push({code:'ambiguous-legacy-id',id,locations:copy([...locations,...overlap])});}
 const stacks=new Map();for(const r of records.filter(r=>!r.equipment&&r.payload.quantity!==undefined)){const key=r.payload.kind+':'+r.legacyId;if(!stacks.has(key))stacks.set(key,[]);stacks.get(key).push(r);}for(const [id,locations]of stacks){const signature=r=>{const p=copy(r.payload);delete p.quantity;return stable(p);};if(locations.some(r=>signature(r)!==signature(locations[0])))issues.push({code:'stack-metadata-conflict',id,locations:copy(locations)});if(!Number.isSafeInteger(locations.reduce((n,r)=>n+r.quantity,0)))issues.push({code:'stack-quantity-overflow',id,locations:copy(locations)});}
 // The existing migration policy also checks potion mirrors, counts, identities and party references.
 try{let i=0;P.migrate(raw,{generate:()=> 'audit-'+(++i)});}catch(e){issues.push(...(e.issues||[{code:'invalid-source',message:e.message}]));}
 return {version:1,roles,records,issues,canMigrate:issues.length===0,manualSteps:issues.length?['Compare every listed location with the untouched backup and original item history.','Confirm template ID versus actual instance ID and the intended owner; do not infer ownership from item names.','Provide a separately reviewed corrected source copy; rerun the complete audit. No automatic delete, duplicate or reassignment is performed.']:[]};
}
function manifest(model){P.validate(model);const gear=[],stacks=[];for(const item of model.bag.items){if(item.kind==='equipment')gear.push({owner:{kind:'bag'},payload:copy(item)});else stacks.push(copy(item));}for(const [id,c]of Object.entries(model.characters))for(const [slot,item]of Object.entries(c.progress.equipment||{}))if(item)gear.push({owner:{kind:'equipped',characterId:id,slot},payload:copy(item)});gear.sort((a,b)=>a.payload.instanceId.localeCompare(b.payload.instanceId));stacks.sort((a,b)=>stable(a).localeCompare(stable(b)));return {roles:copy(model.characters),slots:copy(model.slotOrder),parties:copy(model.parties),gear,stacks,retiredIds:copy(model.retiredIds),deletedCharacters:copy(model.deletedCharacters),accountResources:copy(model.accountResources)};}
function inspect(bundle){const a=bundle.account,issues=[];if(!a)throw Error('Unknown account');let valid=false;try{manifest(a.permanent);valid=true;}catch(e){issues.push({code:'invalid-current-authority',message:e.message});}if(a.permanent&&'slots'in a)issues.push({code:'duplicate-authority'});if(a.cutover&&a.cutover.version!==1)issues.push({code:'unknown-cutover-version'});
 if(a.farming){for(const [id,token]of Object.entries(a.farming.owners||{})){const session=a.farming.sessions?.[token];if(!a.permanent?.characters[id]||!session||session.status!=='online'||!session.members.includes(id))issues.push({code:'farming-owner-conflict',characterId:id,token});}for(const [token,s]of Object.entries(a.farming.sessions||{}))if(s.status==='online'&&s.members.some(id=>a.farming.owners?.[id]!==token))issues.push({code:'farming-session-conflict',token});}
 const runs=(bundle.runs||[]).map(r=>({id:r.id,status:r.status,kind:r.job?.kind||'stage-4a',characterId:r.job?.characterId,revision:r.job?.revision??r.job?.sourceRevision}));for(const r of runs)if(!['prepared','committed'].includes(r.status)&&!(r.status==='failed'&&r.kind==='transaction-failure'))issues.push({code:'unknown-settlement-status',runId:r.id});
 for(const r of bundle.runs||[])if(r.status==='prepared'&&(r.job.revision!==a.revision||stable(r.job.model)!==stable(a.permanent)))issues.push({code:'prepared-source-conflict',runId:r.id});
 const failedAttempts=(bundle.runs||[]).filter(r=>r.status==='failed'&&r.job?.kind==='transaction-failure').map(r=>({id:r.id,commandId:r.job.commandId,sourceRevision:r.job.sourceRevision,observedRevision:r.observedRevision,message:r.message}));
 return {version:1,revision:a.revision,authority:'current-indexeddb',valid:valid&&issues.length===0,issues,runs,completedReceipts:Object.keys(a.commands||{}),receiptFloorRevision:a.receiptFloorRevision||0,backupStatus:a.migrationBackup?.status||null,cutover:copy(a.cutover||null),failedAttempts,failedAttemptLimit:32,action:issues.length?'stop-and-export':runs.some(r=>r.status==='prepared')?'resume-original-settlement':'verify-current-and-release'};
}
return {legacyAudit,manifest,inspect,stable,CLIENT_VERSION:2};
});
