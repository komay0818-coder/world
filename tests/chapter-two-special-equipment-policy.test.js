const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../chapter-two-special-equipment-policy.js');
const affixPolicy = require('../equipment-affix-policy.js');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.equal(Object.keys(policy.TEMPLATES).length, 4);
assert.deepEqual(Object.values(policy.TEMPLATES).map(({ name }) => name), ['黑石督軍戰盔', '腐化守護者皮靴', '幽森魔珠', '墮落荊棘魔杖']);
assert.ok(Object.values(policy.TEMPLATES).every((item) => item.quality === 'epic' && item.directDrop && item.imageStatus === 'ready' && item.implementationStatus === 'ready-values'));
Object.values(policy.TEMPLATES).forEach((item) => assert.ok(fs.existsSync(path.join(__dirname, '..', item.image)), `${item.name}圖片存在`));
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
assert.deepEqual(policy.THORN_CORROSION, { triggerRate: .15, durationSeconds: 5, tickIntervalMs: 1000, damageRatio: .20, tickCount: 5 });
assert.deepEqual(policy.rollThornCorrosion({ weapon: wand }, { attackKind: 'skill', finalDamage: 1, totalAttack: 100 }, () => .149), { durationSeconds: 5, tickIntervalMs: 1000, tickDamage: 20, tickCount: 5, totalDamage: 100 });
assert.deepEqual(policy.rollThornCorrosion({ weapon: wand }, { attackKind: 'basic', finalDamage: 1, totalAttack: 250 }, () => .149), { durationSeconds: 5, tickIntervalMs: 1000, tickDamage: 50, tickCount: 5, totalDamage: 250 });
assert.equal(policy.rollThornCorrosion({ weapon: wand }, { attackKind: 'skill', finalDamage: 1, totalAttack: 100 }, () => .15), null, '15% 邊界不觸發');
assert.equal(policy.rollThornCorrosion({ weapon: wand }, { attackKind: 'offhand', finalDamage: 1, totalAttack: 100 }, () => 0), null, '非普通攻擊或主動技能不觸發');
assert.equal(policy.rollThornCorrosion({ weapon: wand }, { attackKind: 'basic', finalDamage: 0, totalAttack: 100 }, () => 0), null, '未命中不觸發');

assert.equal(Object.keys(policy.DROP_SOURCES).length, 4);
assert.deepEqual(Object.values(policy.DROP_SOURCES).map((source) => source.dropRate), [.03, .03, .02, .02]);
assert.ok(Object.values(policy.DROP_SOURCES).every((source) => source.enabled === true), '四件特殊紫裝正式啟用掉落');
const dropCases = [
  ['blackstoneStrongholdWarlord', 'blackstone-stronghold', 'blackstone-warlord-warhelm'],
  ['corruptedAltarGuardian', 'forest-altar', 'corrupted-guardian-leather-boots'],
  ['heartOfTheBlackForest', 'black-forest-depths', 'deep-forest-magic-orb'],
  ['fallenDruid', 'forest-altar', 'fallen-thorn-wand']
];
dropCases.forEach(([monsterId, mapId, templateId], index) => {
  const progress = { inventory: [] };
  const item = policy.grantSpecialDrop(progress, { id: monsterId }, mapId, { dropRate: 1, random: () => 0, uniqueIdFactory: () => `test-${index}`, obtainedAt: 100 + index });
  assert.ok(item, `${monsterId} 測試機率 100% 時會掉落`);
  assert.equal(progress.inventory[0], item, '掉落實例直接加入背包');
  assert.equal(item.templateId, templateId);
  assert.equal(item.quality, 'epic');
  assert.equal(item.fixedAffixes.length, 2);
  assert.equal(item.randomAffixes.length, 2);
  assert.ok(item.specialAbility);
  assert.equal(item.obtainedFrom, monsterId);
  assert.equal(item.specialDropType, 'chapter-two-special-epic');
});
assert.equal(policy.grantSpecialDrop({ inventory: [] }, { id: 'fallenDruid' }, 'wrong-map', { dropRate: 1, random: () => 0 }), null, '指定來源也必須位於正確地圖');
assert.equal(policy.grantSpecialDrop({ inventory: [] }, { id: 'blackstoneStrongholdWarlord' }, 'blackstone-stronghold', { random: () => .03 }), null, '正式 3% 邊界不掉落');
assert.equal(policy.grantSpecialDrop({ inventory: [] }, { id: 'heartOfTheBlackForest' }, 'black-forest-depths', { random: () => .02 }), null, '正式 2% 邊界不掉落');
assert.match(script, /getIncomingDamageReduction\(progress\.equipment, battle\.playerHp \/ maxHp\)/, '主角色低生命減傷已接入');
assert.match(script, /getIncomingDamageReduction\(target\.progress\.equipment, target\.currentHp \/ target\.maxHp\)/, '隊伍成員低生命減傷已接入');
assert.match(script, /rollCorruptedSwiftness\(member\.progress\.equipment\)/, '腐化迅捷已接入攻擊流程');
assert.match(script, /rollDeepForestEcho\(member\.progress\.equipment\)/, '幽森回響已接入主動技能流程');
assert.match(script, /function tryApplyThornCorrosion[\s\S]*totalAttack: member\.stats\.attack/, '荊棘侵蝕鎖定觸發當下的角色總攻擊力');
assert.match(script, /applyDot\(targetIndex, 'thorn-corrosion'[\s\S]*refreshOnly: true[\s\S]*refreshDuration: true/, '荊棘侵蝕不可疊加且重複觸發只刷新五次跳傷');
assert.match(script, /existing\.damage = Math\.max\(existing\.damage, damage\)[\s\S]*existing\.remaining = options\.refreshDuration \? duration/, '刷新時保留原始快照傷害並重設持續時間');
assert.match(script, /tickIntervalMs[\s\S]*nextTickAt[\s\S]*Math\.floor\(\(now - dot\.nextTickAt\) \/ dot\.tickIntervalMs\)/, '荊棘侵蝕依真實一秒間隔跳傷');
assert.match(script, /hits\.forEach\(\(target\) => tryApplyThornCorrosion\(member, target\.index, 'skill'/, '每個技能命中目標獨立判定荊棘侵蝕');
assert.match(script, /tryApplyThornCorrosion\(member, targetIndex, 'basic', result\.finalDamage, now\)/, '普通攻擊命中也會判定荊棘侵蝕');
assert.match(script, /ChapterTwoSpecialEquipmentPolicy\.grantSpecialDrop\(progress, enemy, currentMap\.id/, '戰鬥獎勵結算會獨立判定第二章特殊紫裝');
assert.match(script, /specialEquipmentDrop[\s\S]*addRoundLoot[\s\S]*第二章特殊掉落/, '特殊紫裝會顯示在戰利品並寫入戰鬥紀錄');

console.log('chapter-two-special-equipment-policy: assertions passed');
