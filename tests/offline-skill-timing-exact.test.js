const assert=require('node:assert/strict');
const {isolate,run}=require('./offline-skill-fixture');
// Golden values come from the currently wired online handlers, including their
// level-specific elemental passive interactions, rather than tooltip text.
const burnDamage=[130,145,172,191,294,210],bleedDamage=[36,36,36,46,36,36];
for(let tier=1;tier<=6;tier++){
  for(const [job,id,type,ticks,damage]of [
    ['mage','fireball','burn',tier===5?6:4,burnDamage[tier-1]],
    ['assassin','poison-blade','poison',3,60],
    ['assassin','backstab','bleed',2,bleedDamage[tier-1]]]){
    const m=isolate(job,id,{tier,stats:{cooldownSpeed:.01}});m.nextAttackAt=100000000;
    const r=run([m],8000,{random:()=>.5,trace:true}).members[0];
    assert.equal(r.combatTelemetry.skillCasts[id],1,`${id} Lv${tier}: no recast`);
    assert.equal(r.combatTelemetry.dotTicks,ticks,`${id} Lv${tier}: exact tick count`);
    assert.equal(r.combatTelemetry.damageBySource[type],damage,`${id} Lv${tier}: exact total DOT`);
    assert.equal(run([m],10000,{random:()=>.5}).members[0].combatTelemetry.damageBySource[type],damage,'no ticks after completion');
    if(type==='poison'||type==='bleed'){
      assert.equal(run([m],1900).members[0].combatTelemetry.dotTicks,0,'no tick before two seconds');
      assert.equal(run([m],2000).members[0].combatTelemetry.dotTicks,1,'tick exactly at two seconds');
    }
  }
  const holy=isolate('priest','guardian-sanctuary',{tier,advancedClass:'holy-priest',hp:1000,currentHp:100,stats:{cooldownSpeed:.01}});
  holy.nextAttackAt=100000000;
  const tick=[15,17,19,21,23,25][tier-1];
  assert.equal(run([holy],1900).members[0].priestTelemetry.sanctuaryHealing,0);
  assert.equal(run([holy],2000).members[0].priestTelemetry.sanctuaryHealing,tick);
  assert.equal(run([holy],8000).members[0].priestTelemetry.sanctuaryHealing,tick*3,'exactly three heals; none after expiry');
}
const fountain=isolate('priest','light-fountain',{tier:6,advancedClass:'holy-priest',hp:1000,currentHp:100,stats:{cooldownSpeed:.01}});
fountain.nextAttackAt=100000000;
const noEnemyAttack={attackInterval:100000000};
assert.equal(run([fountain],5900,{},noEnemyAttack).members[0].shield,80);
assert.equal(run([fountain],6000,{},noEnemyAttack).members[0].shield,0,'six-second shield expires exactly');
assert.equal(run([fountain],8000,{},noEnemyAttack).members[0].priestTelemetry.shieldExpired,80,'expiry settled once');
const faith=isolate('priest','heal');faith.skillCooldowns.heal=100000000;faith.nextAttackAt=100000000;
faith.faithStacks=3;faith.faithUntil=2000;
assert.equal(run([faith],900).members[0].faithStacks,3);
assert.equal(run([faith],1000).members[0].faithStacks,0,'faith expires on simulation clock');
console.log('offline exact timing: six-level DOT/healing boundaries, shield expiry and faith expiry passed');
