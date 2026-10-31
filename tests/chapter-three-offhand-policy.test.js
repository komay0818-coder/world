const assert = require('node:assert/strict');
const policy = require('../chapter-three-offhand-policy.js');
const affixPolicy = require('../equipment-affix-policy.js');
const assassinPolicy = require('../assassin-offhand-policy.js');

const templates = Object.values(policy.TEMPLATES);
assert.equal(templates.length, 6);
assert.deepEqual(templates.map((entry) => entry.name), [
  '赤岩守衛盾', '赤岩軍團重盾', '荒原獵手箭筒', '赤羽追獵箭筒', '薩滿秘法書', '赤岩秘法典籍'
]);

assert.deepEqual(policy.TEMPLATES.redrockGuardShield.baseStats, { defense: 15, parry: .05 });
assert.deepEqual(policy.TEMPLATES.redrockLegionHeavyShield.baseStats, { defense: 20, parry: .06 });
assert.equal(policy.TEMPLATES.wastelandHunterQuiver.baseStats.maxArrows, 12);
assert.equal(policy.TEMPLATES.wastelandHunterQuiver.baseStats.arrowRecoveryInterval, 1000 / 1.2);
assert.equal(policy.TEMPLATES.redfeatherPursuitQuiver.baseStats.maxArrows, 12);
assert.equal(policy.TEMPLATES.redfeatherPursuitQuiver.baseStats.arrowRecoveryInterval, 1000 / 1.2);
assert.deepEqual(policy.TEMPLATES.shamanArcaneBook.baseStats, { mana: 70, manaRegenFlat: 3 });
assert.deepEqual(policy.TEMPLATES.redrockArcaneTome.baseStats, { mana: 90, manaRegenFlat: 4 });

templates.forEach((entry) => {
  const formalRule = affixPolicy.QUALITY_AFFIX_RULES[entry.quality];
  assert.equal(entry.chapter, 3);
  assert.equal(entry.slot, 'offhand');
  assert.equal(entry.rarity, entry.quality);
  assert.equal(entry.affixRule.fixedCount, formalRule.fixedCount);
  assert.equal(entry.affixRule.randomCount, formalRule.randomCount);
  assert.deepEqual(entry.fixedAffixIds, []);
  assert.deepEqual(entry.allowedAffixIds, []);
  assert.equal(entry.affixContentStatus, 'ready');
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

// Exercise the real game aggregation and tooltip functions without starting the UI.
const vm = require('node:vm');
const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../script.js'), 'utf8');
function extract(name) {
  const start = source.indexOf('function ' + name + '(');
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end);
}
const sandbox = {
  EquipmentAffixPolicy: affixPolicy,
  EquipmentPolicy: require('../equipment-policy.js'),
  AssassinOffhandPolicy: assassinPolicy,
  WarriorAdvancementPolicy: { getTitanAttackContribution: () => null },
  RunePolicy: require('../rune-policy.js'),
  effectiveEquipmentStat: (item, key) => Number(item[key]) || 0,
};
vm.createContext(sandbox);
vm.runInContext(extract('getEquipmentStats') + '\n' + extract('itemStatsText'), sandbox);
const keys = ['attack', 'criticalChance', 'criticalDamageBonus'];
for (const [id, values] of [['wasteland-hunter-quiver', [10, .03, .08]], ['redfeather-pursuit-quiver', [15, .05, .12]]]) {
  for (let i = 0; i < 3; i++) {
    const item = policy.createEquipment(id, { random: () => (i + .5) / 3 });
    assert.equal(keys.filter(key => item[key] !== undefined).length, 1);
    assert.equal(item[keys[i]], values[i]);
    assert.equal(item.baseStats[keys[i]], values[i]);
    assert.equal(item.fixedAffixes.length, item.quality === 'rare' ? 2 : 1);
    assert.equal(item.randomAffixes.length, 0);
    const restored = affixPolicy.normalizeEquipment(JSON.parse(JSON.stringify(item)));
    assert.deepEqual(restored.randomBaseStat, item.randomBaseStat);
    assert.equal(restored[keys[i]], values[i]);
    const stats = sandbox.getEquipmentStats({ equipment: { offhand: restored } }, { job: 'hunter' });
    assert.equal(stats[['attack', 'criticalChanceBase', 'criticalDamageBase'][i]], values[i]);
    const empty = sandbox.getEquipmentStats({ equipment: {} }, { job: 'hunter' });
    assert.equal(empty[['attack', 'criticalChanceBase', 'criticalDamageBase'][i]], 0);
    const text = sandbox.itemStatsText(restored);
    assert.ok(text.includes(['攻擊 +', '暴擊率 +', '暴擊傷害 +'][i]));
    assert.notEqual(policy.createEquipment(id).id, item.id);
    assert.equal(item.dropEnabled, false);
  }
}
for (const entry of templates.filter(entry => entry.offhandType !== 'quiver')) {
  const item = policy.createEquipment(entry.id, { random: () => .5 });
  assert.equal(item.randomBaseStat, undefined);
  for (const [key, value] of Object.entries(entry.baseStats)) assert.equal(item[key], value);
}
assert.equal(policy.createEquipment('unknown'), null);
console.log('chapter-three-offhand generation, persistence, equipment stats and tooltip: passed');

const expected = [
  [['maxHp', 40]],
  [['maxHp', 50], ['damageReductionPercent', 3]],
  [['criticalChance', 6]],
  [['criticalChance', 8], ['bossDamagePercent', 10]],
  [['manaRegenerationPercent', 20]],
  [['manaRegenerationPercent', 25], ['cooldownSpeedPercent', 8]]
];
Object.assign(sandbox, {
  classBaseStats: { warrior: { hp: 100, mana: 100, attack: 20, defense: 0, crit: 0, dodge: 0, attackSpeed: 1 } },
  raceAdjustments: { human: { hp: 0, mana: 0, attack: 0, defense: 0, crit: 0, dodge: 0 } },
  getUnlockedPassiveEffects: () => [],
  MageAdvancementPolicy: { getMaxManaBonus: () => 0 },
  ArmorPenetrationPolicy: require('../armor-penetration-policy.js'),
  ControlEffectPolicy: require('../control-effect-policy.js'),
  getActiveMap: () => ({ chapter: 3, id: 'redrock-wastes-entrance' }),
  BlackForestCorruptionPolicy: { applyCombatStats: stats => stats },
  BlackForestDepthsPolicy: { applyDenseFogAccuracy: value => value }
});
sandbox.WarriorAdvancementPolicy.getPassiveStats = () => ({ crit: 0, attackSpeed: 0, armorPenetration: 0 });
vm.runInContext(extract('getCharacterStats'), sandbox);
const character = { job: 'hunter', race: 'orc' };
const statsFor = equipment => sandbox.getCharacterStats(30, { equipment, currentHpRatio: 1 }, character);
for (let index = 0; index < templates.length; index++) {
  const item = policy.createEquipment(templates[index].id, { random: () => .5 });
  assert.deepEqual(item.fixedAffixes.map(a => [a.stat, a.value]), expected[index]);
  assert.equal(item.fixedAffixes.length, item.quality === 'rare' ? 2 : 1);
  assert.equal(item.randomAffixes.length, 0);
  assert.equal(item.randomAffixPoolStatus, 'pending');
  let restored = item;
  for (let n = 0; n < 3; n++) restored = affixPolicy.normalizeEquipment(JSON.parse(JSON.stringify(restored)));
  assert.deepEqual(restored.fixedAffixes, item.fixedAffixes);
  assert.deepEqual(restored.randomBaseStat, item.randomBaseStat);
  assert.deepEqual(statsFor({ offhand: restored }), statsFor({ offhand: item }));
  assert.deepEqual(statsFor({ offhand: null }), statsFor({}));
  for (const a of item.fixedAffixes) assert.ok(sandbox.itemStatsText(restored).includes(affixPolicy.formatAffix(a)));
  // Probe existing conflict handling without assigning a new production random pool.
  const probe = { ...item, allowedAffixIds: Object.keys(affixPolicy.EQUIPMENT_AFFIXES) };
  const candidates = affixPolicy.getAvailableAffixes(probe, item.fixedAffixes, { chapter: 3, quality: item.quality });
  const fixedStats = item.fixedAffixes.flatMap(a => a.components.map(c => c.stat));
  assert.ok(candidates.every(a => a.components.every(c => !fixedStats.includes(c.stat))));
}
const shield = policy.createEquipment('redrock-legion-heavy-shield');
const defense = require('../monster-defense.js');
assert.equal(statsFor({ offhand: shield }).damageReduction, .03);
assert.equal(statsFor({ offhand: shield, armor: { damageReduction: .1 } }).damageReduction, .13);
assert.equal(statsFor({ offhand: shield, armor: { damageReduction: .49 } }).damageReduction, .5);
assert.equal(statsFor({ armor: { damageReduction: .1 } }).damageReduction, .1);
assert.equal(defense.resolvePlayerDamage({ baseDamage: 1000, defense: 0, damageReduction: statsFor({ offhand: shield }).damageReduction }).finalDamage, 970);
assert.equal(defense.resolvePlayerDamage({ baseDamage: 1000, defense: 0, damageReduction: statsFor({ offhand: shield, armor: { damageReduction: .49 } }).damageReduction }).finalDamage, 500);
const quiver = policy.createEquipment('redfeather-pursuit-quiver', { random: () => .5 });
assert.equal(statsFor({ offhand: quiver }).crit, .13); // base 5% plus fixed 8% exactly once
assert.equal(statsFor({ offhand: quiver }).bossDamagePercent, .1);
assert.match(source, /enemy.isBoss \? 1 \+ \(attackerStats.bossDamagePercent/);
const book = policy.createEquipment('redrock-arcane-tome');
assert.equal(statsFor({ offhand: book }).manaRegen, 1.25);
assert.equal(statsFor({ offhand: book }).cooldownSpeed, 1.08);
const regen = require('../mana-regen-policy.js');
assert.equal(regen.calculateRegenAmount({ maxMana: 100, regenMultiplier: statsFor({ offhand: book }).manaRegen, flatPerSecond: book.manaRegenFlat, elapsedSeconds: 1 }), 5.25);
console.log('chapter-three-offhand fixed affixes, combat reduction cap, stacking, persistence and conflicts: passed');
