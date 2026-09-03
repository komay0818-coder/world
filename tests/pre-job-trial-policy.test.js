const assert = require('node:assert/strict');
const policy = require('../pre-job-trial-policy.js');
const epic = require('../chapter-three-epic-weapon-policy.js');

assert.equal(policy.DURATION_MS, 60000);
assert.equal(policy.ENTRY.standalone, true);
assert.deepEqual(policy.THRESHOLDS, [null, null, null]);
assert.equal(policy.BOSS_V1.basicAttack, null);
assert.equal(policy.CHESTS[1].gold, null);
assert.deepEqual(policy.MARK_DROP_RATES, { normal: .03, elite: .08, boss: .15 });

assert.equal(policy.rollMarkDrop('redrock-wastes-entrance', { rank: 'normal' }, () => .029).id, 'wasteland-trial-mark');
assert.equal(policy.rollMarkDrop('brokenrock-canyon', { rank: 'elite' }, () => .079).id, 'wasteland-trial-mark');
assert.equal(policy.rollMarkDrop('bloodwar-wastes', { rank: 'boss' }, () => .149).id, 'war-trial-mark');
assert.equal(policy.rollMarkDrop('ancient-altar', { rank: 'normal' }, () => .03), null);
assert.equal(policy.rollMarkDrop('redrock-temple', { rank: 'elite' }, () => .079).id, 'temple-trial-mark');
assert.equal(policy.rollMarkDrop('black-forest', { rank: 'boss' }, () => 0), null);

const dropProgress = { inventory: [] };
policy.grantMarkDrop(dropProgress, 'bloodwar-wastes', { isBoss: true }, { random: () => 0 });
policy.grantMarkDrop(dropProgress, 'bloodwar-wastes', { isBoss: true }, { random: () => 0 });
assert.equal(dropProgress.inventory[0].quantity, 2, 'marks stack without an ownership cap');

assert.equal(policy.isCalibrated(), false);
assert.equal(policy.startTrial({ inventory: [{ id: 'wasteland-trial-mark', quantity: 1 }] }, 'wasteland-trial-mark').code, 'balance-tbd');
const calibrated = { thresholds: [100, 200, 300], boss: { ...policy.BOSS_V1, basicAttack: 50, defense: 100, maxHp: 1000000 } };
const startProgress = { inventory: [{ id: 'wasteland-trial-mark', quantity: 1 }] };
const started = policy.startTrial(startProgress, 'wasteland-trial-mark', 1000, calibrated);
assert.equal(started.ok, true);
assert.equal(startProgress.inventory.length, 0, 'mark is consumed when the challenge starts');
policy.recordDamage(started.state, 250, calibrated.thresholds);
assert.equal(started.state.tier, 2);
policy.recordDamage(started.state, 50, calibrated.thresholds);
assert.equal(started.state.finished, true, 'tier three immediately completes the challenge');

const rewardProgress = { inventory: [], preJobTrial: {} };
let reward = policy.finishTrial(rewardProgress, { tier: 3, damage: 300 });
assert.deepEqual(reward.proofs.map((entry) => entry.tier), [1, 2, 3]);
assert.equal(rewardProgress.inventory.filter((entry) => entry.id.startsWith('hero-proof-')).length, 3);
assert.equal(reward.chest.id, 'trial-chest-3', 'only the highest-tier chest is awarded');
reward = policy.finishTrial(rewardProgress, { tier: 3, damage: 400 });
assert.equal(reward.proofs.length, 0, 'proofs are one-time progression rewards');

assert.equal(policy.openChest(rewardProgress, 3).code, 'gold-tbd', 'a chest cannot be consumed before its gold reward is calibrated');
const coreIds = Object.values(epic.WEAPON_CORES).map((core) => core.id);
const exchangeProgress = { inventory: [{ ...epic.WEAPON_CORES.sword1h, quantity: 3 }, { ...epic.WEAPON_CORES.scepter, quantity: 2 }] };
assert.equal(policy.exchangeCores(exchangeProgress, epic.WEAPON_CORES.bow.id, { [epic.WEAPON_CORES.sword1h.id]: 3, [epic.WEAPON_CORES.scepter.id]: 2 }).ok, true);
assert.equal(exchangeProgress.inventory.find((entry) => entry.id === epic.WEAPON_CORES.bow.id).quantity, 1);
assert.equal(policy.exchangeCores(exchangeProgress, epic.WEAPON_CORES.bow.id, { [epic.WEAPON_CORES.bow.id]: 5 }).code, 'target-core-as-material');
assert.equal(coreIds.length, 8);

console.log('pre-job-trial-policy: assertions passed');
