const assert = require('node:assert/strict');
const AlchemyPolicy = require('../alchemy-policy.js');
const CraftingPolicy = require('../crafting-policy.js');

function seeded(seed = 1) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 0x100000000);
}
function green(id, slot = 'wrist', extra = {}) {
  return {
    id, instanceId: id, templateId: `template-${slot}`, baseItemId: `template-${slot}`,
    kind: 'equipment', name: `綠色${slot}`, slot, quality: 'uncommon', rarity: 'uncommon',
    primaryStat: { stat: 'attackFlat', label: '攻擊力', value: 5, unit: '' },
    affixes: [{ id: 'crafted-criticalChance', stat: 'criticalChance', label: '爆擊率', value: 3, unit: '%' }],
    sockets: 2, ...extra
  };
}
function progress(items, equipment = {}) { return { inventory: items, equipment }; }
function begin(items, level = 1, seed = 1) {
  return AlchemyPolicy.beginAlchemy(progress(items), [items[0].id, items[1].id], {
    buildingLevel: level, random: seeded(seed), createdAt: 1234,
    instanceIdFactory: (index) => `candidate-${level}-${seed}-${index}`
  });
}

const twoWrists = [green('wrist-a'), green('wrist-b')];
const levelOne = begin(twoWrists, 1, 10);
assert.equal(levelOne.ok, true, 'two green wrists can begin alchemy');
assert.equal(levelOne.session.candidates.length, 1, 'level 1 creates one candidate');
assert.equal(levelOne.session.candidates[0].slot, 'wrist');
assert.equal(levelOne.session.candidates[0].quality, 'uncommon');
assert.equal(levelOne.session.candidates[0].sockets, 0, 'sockets are not inherited');
assert.equal(levelOne.session.candidates[0].affixSchemaVersion, 3);
assert.equal(levelOne.session.candidates[0].primaryStat, undefined, 'alchemy migrates crafted results to V3');
assert.equal(levelOne.session.candidates[0].fixedAffixes.length, 1);
assert.equal(levelOne.session.candidates[0].randomAffixes.length, 2, 'green crafted equipment rerolls two V3 random affixes');

const standardInputs = [green('standard-a', 'armor', { primaryStat: undefined, baseStats: { defense: 4 }, armorType: 'cloth' }), green('standard-b', 'armor', { primaryStat: undefined, baseStats: { defense: 4 }, armorType: 'cloth' })];
const standardResult = begin(standardInputs, 1, 22);
assert.equal(standardResult.ok, true);
assert.equal(standardResult.session.candidates[0].affixes.length, 3, 'ordinary green equipment uses the V3 generator');
assert.equal(standardResult.session.candidates[0].defense, 4, 'ordinary equipment keeps only its base stats');

assert.equal(begin([green('wrist-a'), green('cloak-b', 'cloak')]).code, 'slot-mismatch', 'different slots are rejected');
assert.equal(begin([green('green-a'), green('blue-b', 'wrist', { quality: 'rare', rarity: 'rare' })]).code, 'invalid-quality', 'green and blue are rejected');
assert.equal(begin([green('green-a'), green('white-b', 'wrist', { quality: 'common', rarity: 'common' })]).code, 'invalid-quality', 'white equipment is rejected');
assert.equal(AlchemyPolicy.beginAlchemy(progress([green('same')]), ['same', 'same']).code, 'duplicate-input', 'the same item cannot fill both slots');

const equipped = green('equipped');
assert.equal(AlchemyPolicy.beginAlchemy(progress([equipped, green('other')], { wrist: equipped }), ['equipped', 'other']).code, 'equipped', 'equipped items are rejected');
for (const protection of ['locked', 'isLocked', 'protected', 'isProtected', 'favorite', 'isFavorite']) {
  assert.equal(begin([green(`protected-${protection}`, 'wrist', { [protection]: true }), green('other')]).code, 'protected', `${protection} is respected`);
}

for (const level of [1, 2, 3, 8]) {
  const items = [green(`a-${level}`), green(`b-${level}`)];
  const result = begin(items, level, 30 + level);
  assert.equal(result.ok, true);
  assert.equal(result.session.candidates.length, Math.min(3, level), `level ${level} candidate count`);
  assert.equal(new Set(result.session.candidates.map((item) => item.instanceId)).size, result.session.candidates.length, 'candidate instances are independent');
}

const confirmProgress = progress([green('consume-a'), green('consume-b'), { id: 'keep', kind: 'material', quantity: 1 }]);
const started = AlchemyPolicy.beginAlchemy(confirmProgress, ['consume-a', 'consume-b'], {
  buildingLevel: 3, random: seeded(77), createdAt: 999,
  instanceIdFactory: (index) => `confirmed-${index}`
});
const beforeConfirm = JSON.stringify(confirmProgress);
assert.equal(started.ok, true);
assert.equal(JSON.stringify(confirmProgress), beforeConfirm, 'starting alchemy consumes nothing');
const selected = started.session.candidates[1];
const confirmed = AlchemyPolicy.confirmAlchemy(confirmProgress, started.session, selected.instanceId);
assert.equal(confirmed.ok, true);
assert.equal(confirmProgress.inventory.some((item) => item.id === 'consume-a' || item.id === 'consume-b'), false, 'both inputs are consumed');
assert.equal(confirmProgress.inventory.filter((item) => item.kind === 'equipment').length, 1, 'only one selected result enters inventory');
assert.equal(confirmProgress.inventory.some((item) => item.instanceId === selected.instanceId), true);
assert.deepEqual(JSON.parse(JSON.stringify(confirmProgress)), confirmProgress, 'selected result survives save/load unchanged');
const afterFirstConfirm = JSON.stringify(confirmProgress);
assert.equal(AlchemyPolicy.confirmAlchemy(confirmProgress, started.session, selected.instanceId).code, 'missing-item', 'a repeated confirmation cannot grant twice');
assert.equal(JSON.stringify(confirmProgress), afterFirstConfirm, 'repeated confirmation changes nothing');

const vanishedProgress = progress([green('vanish-a'), green('vanish-b')]);
const vanished = AlchemyPolicy.beginAlchemy(vanishedProgress, ['vanish-a', 'vanish-b'], { buildingLevel: 1 });
vanishedProgress.inventory.pop();
const vanishedSnapshot = JSON.stringify(vanishedProgress);
assert.equal(AlchemyPolicy.confirmAlchemy(vanishedProgress, vanished.session, vanished.session.candidates[0].instanceId).code, 'missing-item');
assert.equal(JSON.stringify(vanishedProgress), vanishedSnapshot, 'missing input failure consumes nothing');

const fullItems = [green('full-a'), green('full-b')];
while (fullItems.length < CraftingPolicy.INVENTORY_CAPACITY + 2) fullItems.push({ id: `filler-${fullItems.length}`, kind: 'material', quantity: 1 });
const fullProgress = progress(fullItems);
const fullSnapshot = JSON.stringify(fullProgress);
assert.equal(AlchemyPolicy.beginAlchemy(fullProgress, ['full-a', 'full-b']).code, 'inventory-full');
assert.equal(JSON.stringify(fullProgress), fullSnapshot, 'inventory-full failure consumes nothing');

console.log('alchemy-policy: assertions passed');
