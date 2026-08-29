const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../chapter-two-special-equipment-policy.js');
const affixPolicy = require('../equipment-affix-policy.js');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.equal(Object.keys(policy.TEMPLATES).length, 4);
assert.deepEqual(Object.values(policy.TEMPLATES).map(({ name }) => name), ['黑石督軍戰盔', '腐化守護者皮靴', '幽森魔珠', '墮落荊棘魔杖']);
assert.ok(Object.values(policy.TEMPLATES).every((item) => item.quality === 'epic' && item.directDrop && item.image === null && item.implementationStatus === 'ready-values'));
assert.ok(Object.values(policy.TEMPLATES).every((item) => item.affixRuleOverride.fixedCount === 2 && item.affixRuleOverride.randomCount === 2 && item.affixRuleOverride.specialChance === 1));
assert.deepEqual(policy.MAGIC_ORB_BASE_TEMPLATE, {}, '魔珠沿用目前沒有額外基礎屬性的法系副手模板');
assert.deepEqual(policy.WAND_BASE_TEMPLATE, { attackMin: 26, attackMax: 35, attackSpeed: 1 }, '魔杖只保留既有攻擊與攻速模板');

const minimum = policy.createSpecialEquipmentInstance('blackstone-warlord-warhelm', { uniqueId: 'min', random: () => 0 });
assert.equal(minimum.defense, 32);
assert.deepEqual(minimum.fixedAffixes.map((entry) => [entry.stat, entry.value]), [['maxHp', 100], ['defensePercent', 6]]);
assert.equal(minimum.randomAffixes.length, 2);
assert.equal(minimum.specialAbility.id, 'warlord_unyielding');
assert.equal(minimum.affixes.length, 4, '兩條固定與兩條隨機詞綴，特殊能力獨立保存');

const maximumRoll = () => .999999;
const boots = policy.createSpecialEquipmentInstance('corrupted-guardian-leather-boots', { uniqueId: 'max', random: maximumRoll });
assert.equal(boots.defense, 25);
assert.deepEqual(boots.fixedAffixes.map((entry) => [entry.stat, entry.value]), [['dodgePercent', 7], ['maxHp', 90]]);
assert.equal(boots.randomAffixes.length, 2);
assert.equal(boots.specialAbility.id, 'corrupted_swiftness');

const orb = policy.createSpecialEquipmentInstance('deep-forest-magic-orb', { uniqueId: 'orb', jobId: 'mage', random: () => 0 });
assert.equal(orb.attackMin, undefined);
assert.equal(orb.mana, undefined);
assert.deepEqual(orb.fixedAffixes.map((entry) => entry.stat), ['magicDamageBonus', 'manaRegenerationPercent']);
assert.equal(orb.randomAffixes.length, 2);
assert.equal(orb.specialAbility.id, 'deep_forest_echo');

const wand = policy.createSpecialEquipmentInstance('fallen-thorn-wand', { uniqueId: 'wand', jobId: 'priest', random: () => 0 });
assert.deepEqual([wand.attackMin, wand.attackMax, wand.attackSpeed], [26, 35, 1]);
assert.equal(wand.mana, undefined, '最大魔力不是魔杖基本數值');
assert.deepEqual(wand.fixedAffixes.map((entry) => entry.stat), ['magicDamageBonus', 'mana']);
assert.equal(wand.randomAffixes.length, 2);
assert.equal(wand.specialAbility.id, 'thorn_corrosion');
const restoredWand = affixPolicy.normalizeEquipment(JSON.parse(JSON.stringify(wand)));
assert.deepEqual(restoredWand.fixedAffixes.map((entry) => entry.value), [6, 50], '特殊固定詞綴通過存檔正規化後仍保留原始擲值');
assert.deepEqual(affixPolicy.getEquippedAffixStats({ weapon: restoredWand }), { magicDamageBonus: 6, mana: 50, attackFlat: 6, maxHp: 30 }, '特殊固定與隨機詞綴都進入裝備能力統計');

assert.equal(policy.getIncomingDamageReduction({ head: minimum }, .29), .15);
assert.equal(policy.getIncomingDamageReduction({ head: minimum }, .30), 0);
assert.deepEqual(policy.rollCorruptedSwiftness({ boots }, () => .09), { attackSpeedBonus: .15, durationMs: 5000 });
assert.equal(policy.rollCorruptedSwiftness({ boots }, () => .10), null);
assert.equal(policy.rollDeepForestEcho({ offhand: orb }, () => .14), .06);
assert.equal(policy.rollDeepForestEcho({ offhand: orb }, () => .15), 0);
assert.deepEqual(policy.rollThornCorrosion({ weapon: wand }, { attackKind: 'skill', damageType: 'magic', finalDamage: 1 }, () => .14), { pendingBalance: true, durationMs: null, damage: null });
assert.equal(policy.rollThornCorrosion({ weapon: wand }, { attackKind: 'basic', damageType: 'magic', finalDamage: 1 }, () => 0), null);

assert.equal(Object.keys(policy.DROP_SOURCES).length, 4);
assert.ok(Object.values(policy.DROP_SOURCES).every((source) => source.dropRate === null && source.enabled === false), '未擅自設定掉落率');
assert.equal(policy.grantSpecialDrop({}, { id: 'blackstoneStrongholdWarlord' }), null, '掉落率未指定前不自動加入背包');
assert.match(script, /getIncomingDamageReduction\(progress\.equipment, battle\.playerHp \/ maxHp\)/, '主角色低生命減傷已接入');
assert.match(script, /getIncomingDamageReduction\(target\.progress\.equipment, target\.currentHp \/ target\.maxHp\)/, '隊伍成員低生命減傷已接入');
assert.match(script, /rollCorruptedSwiftness\(member\.progress\.equipment\)/, '腐化迅捷已接入攻擊流程');
assert.match(script, /rollDeepForestEcho\(member\.progress\.equipment\)/, '幽森回響已接入主動技能流程');
assert.match(script, /thornCorrosionPendingBalance = true/, '荊棘侵蝕只建立待平衡觸發狀態');

console.log('chapter-two-special-equipment-policy: assertions passed');
