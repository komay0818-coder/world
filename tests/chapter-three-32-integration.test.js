'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const maps = require('../chapter-three-map-policy.js');
const combat = require('../brokenrock-canyon-policy.js');

assert.equal(maps.getMap('brokenrock-canyon').implemented, true);
assert.equal(maps.getMap('bloodwar-wastes').implemented, false);
assert.deepEqual(combat.getCombatPool(), {
  normal: ['wasteland-hyena', 'skullcrusher-scout', 'skullcrusher-spearman', 'skullcrusher-warrior'],
  elite: ['brokenrock-brute'], boss: ['canyon-warlord']
});
assert.ok([...combat.getCombatPool().normal, ...combat.getCombatPool().elite, ...combat.getCombatPool().boss]
  .every((id) => combat.getCombatMonster(id)?.mapId === 'brokenrock-canyon'));
assert.match(script, /mapId === 'brokenrock-canyon'\) return mapMonsterPools\.brokenrockCanyon/);
assert.match(script, /mapId === 'brokenrock-canyon'\) return BrokenrockCanyonPolicy\.getCombatMonster/);
assert.match(script, /BrokenrockCanyonPolicy\.resolveScheduledActions/);
assert.match(script, /BrokenrockCanyonPolicy\.updateThresholds/);
assert.match(script, /brokenrockAction\?\.damageMultiplier/);
assert.match(script, /brokenrockAction\?\.defenseIgnore/);
assert.match(script, /savedChapterThreePlaytestProgress\?\.requiresMapSelectionAfterDefeat[\s\S]*sessionStorage\.removeItem\(chapterThreePlaytestProgressKey\)/, 'a defeated isolated playtest session resets before auto-entry');
assert.match(script, /getRequestedMapId\(\) === 'brokenrock-canyon' \? '3-2' : '3-1'/, 'the playtest identity matches the requested chapter-three map');
console.log('chapter-three-32-integration: assertions passed');
