const assert=require('node:assert/strict'); const path=require('node:path'); const {spawnSync}=require('node:child_process'); const Mage=require('../mage-advancement-policy.js');
const run=spawnSync(process.execPath,[path.join(__dirname,'..','tools','mage-advancement-balance.js'),'--summary'],{encoding:'utf8',env:{...process.env,MAGE_BALANCE_RUNS:'2'}});
assert.equal(run.status,0,run.stderr); const rows=run.stdout.trim().split(/\r?\n/).map(JSON.parse);
assert.equal(rows.length,12); assert.deepEqual([...new Set(rows.map(row=>row.scenario))],['normal','boss','three','five','long','burst']);
assert.ok(rows.every(row=>Number.isFinite(row.dps)&&row.dps>0));
assert.ok(rows.find(row=>row.class==='elementalist').resonance>0);
const arcaneRows=rows.filter(row=>row.class==='arcane-mage');
assert.ok(arcaneRows.length>0);
for(const row of arcaneRows){
  const effect=Mage.getEffect('arcane-charge',row.lv6==='arcane-charge'?6:5);
  const member={progress:{advancedClass:'arcane-mage',skillLevels:{'mage:arcane-charge':row.lv6==='arcane-charge'?6:5}}};
  assert.equal(row.arcaneConversion.cooldownMultiplier,1-effect.cooldownReduction,'balance simulation uses the policy cooldown reduction');
  assert.equal(row.arcaneConversion.arcaneDamageMultiplier,1+effect.arcaneDamage,'balance simulation uses the policy Arcane damage multiplier');
  assert.ok(Mage.BASE_ELEMENT_SKILLS.every(skillId=>Mage.suppressesBaseElementEffects(member,skillId)),'the policy suppresses every current base element effect');
  assert.deepEqual(row.baseElementEffects,{burn:0,slow:0,shock:0},'Arcane mages do not apply base fire, ice, or lightning effects');
  assert.equal('charge' in row,false,'legacy Arcane Charge averages are absent');
  assert.equal('full' in row,false,'legacy full-charge uptime is absent');
  assert.equal('zero' in row,false,'legacy no-cooldown releases are absent');
}
const positioning=spawnSync(process.execPath,[path.join(__dirname,'..','tools','mage-advancement-balance.js'),'--positioning'],{encoding:'utf8',env:{...process.env,MAGE_BALANCE_RUNS:'2'}});
assert.equal(positioning.status,0,positioning.stderr);const positionRows=positioning.stdout.trim().split(/\r?\n/).map(JSON.parse);
assert.equal(positionRows.length,24);assert.deepEqual([...new Set(positionRows.map(row=>row.profile))],['A','B','C']);
assert.deepEqual([...new Set(positionRows.map(row=>row.scenario))],['boss','three','five','burst']);
assert.ok(positionRows.filter(row=>row.class==='elementalist').every(row=>Number.isFinite(row.resonanceCoverage)&&Number.isFinite(row.resonanceElementDamage)));
console.log('mage-advancement-balance: assertions passed');
