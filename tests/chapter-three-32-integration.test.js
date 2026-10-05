'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const maps = require('../chapter-three-map-policy.js');
const combat = require('../brokenrock-canyon-policy.js');

assert.equal(maps.getMap('brokenrock-canyon').implemented, true);
assert.equal(maps.getMap('bloodwar-wastes').implemented, true);
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
assert.match(script, /savedVisualPlaytestProgress\?\.requiresMapSelectionAfterDefeat[\s\S]*sessionStorage\.removeItem\(visualPlaytestProgressKey\)/, 'a defeated isolated playtest session resets before auto-entry');
assert.match(script, /getRequestedMapId\(\) === 'bloodwar-wastes' \? '3-3'/, 'the playtest identity includes the requested 3-3 map');
const vm = require('node:vm');
const resetBlock = script.match(/if \(ChapterTwoBalancePlaytestPolicy\?\.isChapterThreeActive\(\) \|\| ChapterTwoBalancePlaytestPolicy\?\.isChapterOne11Active\(\) \|\| ChapterTwoBalancePlaytestPolicy\?\.isChapterOne12Active\(\)\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(resetBlock, 'shared playtest reset block exists');
for (const defeated of [true, false]) {
  const key = 'isolated-chapter-three-32';
  const storage = new Map([[key, JSON.stringify({ requiresMapSelectionAfterDefeat: defeated })], ['other-session', 'keep']]);
  vm.runInNewContext(resetBlock, {
    ChapterTwoBalancePlaytestPolicy: { isChapterThreeActive: () => true, isChapterOne11Active: () => false, isChapterOne12Active: () => false, getProgressKey: () => key },
    sessionStorage: { getItem: id => storage.get(id) || null, removeItem: id => storage.delete(id) }
  });
  assert.equal(storage.has(key), !defeated, 'only a defeated active playtest save is reset');
  assert.equal(storage.get('other-session'), 'keep', 'other sessions survive reset');
}
console.log('chapter-three-32-integration: assertions passed');
