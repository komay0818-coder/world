const assert=require('node:assert/strict'),{sim,builds}=require('../tools/priest-formal-test-v1.js');
assert.deepEqual(Object.keys(builds),['base','holyFountain','holySanctuary','battleSmite','battleStorm']);
const battle=sim('battleSmite',{seconds:30,enemies:5,seed:45});assert.equal(battle.faith.coveragePercent.length,4);assert.ok(battle.damage.holySmite>0);assert.ok(battle.conversionHealing.smite>=0);assert.ok(battle.mana.average<=520);
const holy=sim('holyFountain',{seconds:90,enemies:5,pressure:1.5,seed:46,encounterSeconds:20});assert.ok(holy.healingSources['守護聖域'].total>=0);assert.equal(holy.guardian.crossEncounterMaintained,true);assert.ok(holy.shieldAbsorbed>=0);console.log('priest-formal-test-v1: assertions passed');
