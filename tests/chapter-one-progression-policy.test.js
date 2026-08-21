const assert = require('node:assert/strict');
const policy = require('../chapter-one-progression-policy.js');

assert.deepEqual(policy.MAP_ORDER, ['plains-entrance', 'wolf-den', 'boar-woods', 'goblin-camp', 'plains-depths']);
assert.deepEqual(Object.values(policy.REQUIREMENTS).map(({ level, normalKills }) => [level, normalKills]), [[5, 100], [8, 150], [11, 200], [13, 250], [15, 300]]);

const progress = policy.normalize({ level: 1 });
assert.equal(policy.isUnlocked(progress, 'plains-entrance'), true, 'the first map is always available');
assert.equal(policy.isUnlocked(progress, 'wolf-den'), false, 'later maps start locked');

policy.recordNormalKill(progress, 'plains-entrance', 100);
policy.recordBossKill(progress, 'plains-entrance', { id: 'lostGoblin' });
assert.equal(policy.isUnlocked(progress, 'wolf-den'), false, 'all three conditions are required');
progress.level = 5;
policy.evaluateUnlocks(progress);
assert.equal(policy.isUnlocked(progress, 'wolf-den'), true, 'meeting level, kills, and boss unlocks the next map');

policy.recordNormalKill(progress, 'wolf-den', 30);
assert.equal(progress.mapKillProgress['plains-entrance'], 100, 'previous map progress is retained');
assert.equal(progress.mapKillProgress['wolf-den'], 30, 'kills are scoped to the active map');
assert.equal(progress.mapKillProgress['boar-woods'], 0, 'future maps do not inherit kills');

progress.level = 99;
policy.recordNormalKill(progress, 'wolf-den', 120);
policy.recordBossKill(progress, 'wolf-den', { id: 'boarKing' });
assert.equal(policy.isUnlocked(progress, 'boar-woods'), false, 'a boss from another map cannot clear this map');
policy.recordBossKill(progress, 'wolf-den', { id: 'greatfangWolf' });
assert.equal(policy.isUnlocked(progress, 'boar-woods'), true, 'the designated boss unlocks the next map');

progress.mapKillProgress['plains-entrance'] = 0;
progress.mapBossCleared['plains-entrance'] = false;
policy.normalize(progress);
assert.equal(policy.isUnlocked(progress, 'wolf-den'), true, 'an unlocked map stays permanently unlocked');

const finalProgress = policy.normalize({ level: 15, mapUnlocked: { 'plains-depths': true }, mapKillProgress: { 'plains-depths': 300 }, mapBossCleared: { 'plains-depths': true } });
assert.equal(policy.isUnlocked(finalProgress, 'black-forest'), true, 'finishing the final map unlocks chapter two');
