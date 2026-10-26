// Explicit benchmark, excluded from the .test.js regression suite.
const {member,snapshot}=require('./offline-skill-fixture');
const {loadReference,seeded}=require('./offline-optimization-reference');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'../tools/build-offline-shared-runtime.js'),'--reference']);
const original=loadReference(),optimized=require('../offline-skill-events'),report=[];
for(const durationMs of [3600000,21600000,43200000]) {
  const party=[member('assassin',{advancedClass:'venom',tier:6}),
    member('hunter',{id:'hunter',isMain:false,advancedClass:'beastmaster',tier:6}),
    member('priest',{id:'priest',isMain:false,advancedClass:'holy-priest',tier:6,currentHp:20000})];
  const departure=snapshot(party,{maxHp:10000,attack:1}),options={snapshot:departure,durationMs};
  const started=performance.now(),before=original.simulate({...options,random:seeded(12345)}),mid=performance.now();
  const result=optimized.simulate({...options,random:seeded(12345)}),ended=performance.now();
  assert.deepEqual(result,before,'same snapshot/seed must preserve the entire result');
  const row={durationHours:durationMs/3600000,beforeMs:Math.round(mid-started),afterMs:Math.round(ended-mid),
    operations:result.operations,effectiveMs:result.effectiveMs,died:result.died,defeated:result.defeated,
    heapMB:Math.round(process.memoryUsage().heapUsed/1048576),resultBytes:Buffer.byteLength(JSON.stringify(result)),equal:true};
  report.push(row);console.log(JSON.stringify(row));
  if(result.effectiveMs!==durationMs || result.died) throw new Error('Benchmark did not run the complete interval');
}
fs.writeFileSync(path.join(__dirname,'../tmp/offline-optimization-comparison.json'),JSON.stringify(report,null,2));
