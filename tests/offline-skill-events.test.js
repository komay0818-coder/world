const assert = require('node:assert/strict');
const {member,run} = require('./offline-skill-fixture');
const routes = { warrior:['weapon-master','berserker'], assassin:['assassination','venom'],
  hunter:['marksman','beastmaster'], mage:['elementalist','arcane-mage'], priest:['holy-priest','battle-priest'] };
for (const [job,classes] of Object.entries(routes)) {
  for (const advancedClass of [undefined,...classes]) {
    const r = run([member(job,{advancedClass})]);
    assert.equal(r.stage,2); assert.equal(r.effectiveMs,10000);
    assert.ok(r.members[0].combatTelemetry.basicAttacks > 0);
    console.log(job,advancedClass||'base',JSON.stringify(r.members[0].combatTelemetry.skillCasts));
  }
}
console.log('offline-skill-events: assertions passed');
