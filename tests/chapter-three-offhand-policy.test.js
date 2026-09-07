const assert = require('node:assert/strict');
const policy = require('../chapter-three-offhand-policy.js');
const affixPolicy = require('../equipment-affix-policy.js');
const assassinPolicy = require('../assassin-offhand-policy.js');

const templates = Object.values(policy.TEMPLATES);
assert.equal(templates.length, 6);
assert.deepEqual(templates.map((entry) => entry.name), [
  '赤岩守衛盾', '赤岩軍團重盾', '荒原獵手箭筒', '赤羽追獵箭筒', '薩滿秘法書', '赤岩秘法典籍'
]);

assert.deepEqual(policy.TEMPLATES.redrockGuardShield.baseStats, { defense: 16, parry: .05 });
assert.deepEqual(policy.TEMPLATES.redrockLegionHeavyShield.baseStats, { defense: 21, parry: .06 });
assert.equal(policy.TEMPLATES.wastelandHunterQuiver.baseStats.maxArrows, 12);
assert.equal(policy.TEMPLATES.wastelandHunterQuiver.baseStats.arrowRecoveryInterval, 1000 / 1.4);
assert.equal(policy.TEMPLATES.redfeatherPursuitQuiver.baseStats.maxArrows, 13);
assert.equal(policy.TEMPLATES.redfeatherPursuitQuiver.baseStats.arrowRecoveryInterval, 1000 / 1.6);
assert.deepEqual(policy.TEMPLATES.shamanArcaneBook.baseStats, { mana: 70, manaRegenFlat: 2.5 });
assert.deepEqual(policy.TEMPLATES.redrockArcaneTome.baseStats, { mana: 90, manaRegenFlat: 3 });

templates.forEach((entry) => {
  const formalRule = affixPolicy.QUALITY_AFFIX_RULES[entry.quality];
  assert.equal(entry.chapter, 3);
  assert.equal(entry.slot, 'offhand');
  assert.equal(entry.rarity, entry.quality);
  assert.equal(entry.affixRule.fixedCount, formalRule.fixedCount);
  assert.equal(entry.affixRule.randomCount, formalRule.randomCount);
  assert.deepEqual(entry.fixedAffixIds, []);
  assert.deepEqual(entry.allowedAffixIds, []);
  assert.equal(entry.affixContentStatus, 'pending');
  assert.equal(entry.dropEnabled, false);
  assert.equal(entry.dropSource, null);
  assert.equal(entry.dropRate, null);
  assert.equal(policy.isReadyForDrop(entry), false);
  assert.equal(entry.allowedJobs.includes('assassin'), false);
});

assert.equal(policy.getTemplatesByQuality('uncommon').length, 3);
assert.equal(policy.getTemplatesByQuality('rare').length, 3);
assert.equal(policy.getTemplatesByQuality('common').length, 0);
assert.deepEqual(policy.TEMPLATES.redrockGuardShield.allowedJobs, ['warrior']);
assert.deepEqual(policy.TEMPLATES.wastelandHunterQuiver.allowedJobs, ['hunter']);
assert.deepEqual(policy.TEMPLATES.shamanArcaneBook.allowedJobs, ['mage', 'priest']);
assert.equal(assassinPolicy.OFFHAND_ATTACK_CONTRIBUTION, .5);
assert.equal(assassinPolicy.isDagger({ weaponType: 'dagger' }), true);

console.log('chapter-three-offhand-policy: assertions passed');
