const assert=require('node:assert/strict'); const path=require('node:path'); const {spawnSync}=require('node:child_process');
const run=spawnSync(process.execPath,[path.join(__dirname,'..','tools','mage-advancement-balance.js'),'--summary'],{encoding:'utf8',env:{...process.env,MAGE_BALANCE_RUNS:'2'}});
assert.equal(run.status,0,run.stderr); const rows=run.stdout.trim().split(/\r?\n/).map(JSON.parse);
assert.equal(rows.length,12); assert.deepEqual([...new Set(rows.map(row=>row.scenario))],['normal','boss','three','five','long','burst']);
assert.ok(rows.every(row=>Number.isFinite(row.dps)&&row.dps>0));
assert.ok(rows.find(row=>row.class==='elementalist').resonance>0);
assert.ok(rows.find(row=>row.class==='arcane-mage').charge>0);
console.log('mage-advancement-balance: assertions passed');
