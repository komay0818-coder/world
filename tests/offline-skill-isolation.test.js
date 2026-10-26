const assert = require('node:assert/strict');
const P = require('../offline-party-policy');
const {member,snapshot} = require('./offline-skill-fixture');
for (const size of [1,2,3]) {
  const party=[member('mage'),member('hunter',{id:'hunter',isMain:false}),member('priest',{id:'priest',isMain:false})].slice(0,size);
  const saved=snapshot(party), before=JSON.stringify(saved);
  const hostDate=Date.now,hostRandom=Math.random,hostTimer=global.setTimeout;
  global.setTimeout=()=>{throw new Error('Simulation must not use real timers');};
  let a,b;
  try {
    const options={snapshot:saved,durationMs:10000,skills:true,random:()=>.5,trace:true};
    a=P.simulate(options); b=P.simulate(options);
  } finally {global.setTimeout=hostTimer;}
  assert.deepEqual(a,b,'fresh runs must not retain skill state');
  assert.equal(JSON.stringify(saved),before,'departure snapshot remains frozen');
  assert.equal(Date.now,hostDate);assert.equal(Math.random,hostRandom);
  assert.equal(a.members.length,size);assert.equal(a.effectiveMs,10000);
  a.members.forEach((m,i)=>{
    assert.deepEqual(m.stats.attack,saved.members[i].stats.attack,'static passive attack is not applied twice');
    assert.ok(m.combatTelemetry.basicAttacks>0);
    assert.ok(m.resourceCurrent>=0 && m.resourceCurrent<=m.resourceMax);
  });
  const times=a.events.map(e=>e.at);
  assert.ok(times.every((t,i)=>i===0 || t>=times[i-1]),'events follow simulation time');
}
const priest=member('priest'),dead=member('warrior',{id:'dead',isMain:false,currentHp:0});
priest.pendingClassHeals=[{id:1,dueAt:2000,targetId:'dead',amount:100}];
const result=P.simulate({snapshot:snapshot([priest,dead]),durationMs:2000,skills:true,random:()=>.5});
assert.equal(result.members[1].currentHp,0,'afterglow cannot revive a dead teammate');
assert.equal(result.pendingEvents,0,'completed delayed event is consumed once');
console.log('offline-skill-isolation: assertions passed');
