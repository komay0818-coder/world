(function attachChapterTwoSpecialEquipmentPolicy(root, factory) {
  const affixPolicy = typeof module === 'object' && module.exports ? require('./equipment-affix-policy.js') : root.EquipmentAffixPolicy;
  const runePolicy = typeof module === 'object' && module.exports ? require('./rune-policy.js') : root.RunePolicy;
  const api = factory(affixPolicy, runePolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterTwoSpecialEquipmentPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterTwoSpecialEquipmentPolicy(EquipmentAffixPolicy, RunePolicy) {
  'use strict';
  const SPECIAL_AFFIX_RULE = Object.freeze({ fixedCount: 2, randomCount: 2, specialChance: 1 });
  const THORN_CORROSION = Object.freeze({ triggerRate: .15, durationSeconds: 5, tickIntervalMs: 1000, damageRatio: .20, tickCount: 5 });
  const WAND_BASE_TEMPLATE = Object.freeze({ attackMin: 26, attackMax: 35, attackSpeed: 1.00 });
  const MAGIC_ORB_BASE_TEMPLATE = Object.freeze({});
  function fixed(id, name, stat, min, max, unit = '') { return Object.freeze({ id, name, stat, min, max, unit }); }
  function template(definition) {
    return Object.freeze({
      kind: 'equipment', chapter: 2, affixChapter: 2, quality: 'epic', rarity: 'epic', image: null,
      imageStatus: 'pending', directDrop: true, implementationStatus: 'ready-values', affixRuleOverride: SPECIAL_AFFIX_RULE, ...definition,
      allowedJobs: Object.freeze(definition.allowedJobs || []), baseStatRanges: Object.freeze({ ...(definition.baseStatRanges || {}) }),
      fixedAffixDefinitions: Object.freeze((definition.fixedAffixDefinitions || []).map((entry) => Object.freeze({ ...entry }))),
      specialAbilityIds: Object.freeze(definition.specialAbilityIds || [])
    });
  }
  const TEMPLATES = Object.freeze({
    blackstoneWarlordHelm: template({ id: 'blackstone-warlord-warhelm', name: '黑石督軍戰盔', slot: 'head', series: '鎧甲', armorType: 'heavy', image: 'assets/blackstone-warlord-warhelm.png', imageStatus: 'ready', allowedJobs: ['warrior'], baseStatRanges: { defense: Object.freeze([32, 38]) }, fixedAffixDefinitions: [fixed('warlord-max-hp', '最大生命', 'maxHp', 100, 140), fixed('warlord-defense-percent', '防禦', 'defensePercent', 6, 10, '%')], specialAbilityIds: ['warlord_unyielding'] }),
    corruptedGuardianLeatherBoots: template({ id: 'corrupted-guardian-leather-boots', name: '腐化守護者皮靴', slot: 'boots', series: '皮甲', armorType: 'leather', image: 'assets/corrupted-guardian-leather-boots.png', imageStatus: 'ready', allowedJobs: ['hunter', 'assassin'], baseStatRanges: { defense: Object.freeze([20, 25]) }, fixedAffixDefinitions: [fixed('guardian-dodge-percent', '閃避', 'dodgePercent', 4, 7, '%'), fixed('guardian-max-hp', '最大生命', 'maxHp', 60, 90)], specialAbilityIds: ['corrupted_swiftness'] }),
    deepForestMagicOrb: template({ ...MAGIC_ORB_BASE_TEMPLATE, id: 'deep-forest-magic-orb', name: '幽森魔珠', slot: 'offhand', series: '魔珠', offhandType: 'magic-orb', image: 'assets/deep-forest-magic-orb.png', imageStatus: 'ready', allowedJobs: ['mage', 'priest'], fixedAffixDefinitions: [fixed('echo-spell-damage', '法術傷害', 'magicDamageBonus', 6, 9, '%'), fixed('echo-mana-regeneration', '魔力恢復', 'manaRegenerationPercent', 8, 12, '%')], specialAbilityIds: ['deep_forest_echo'] }),
    fallenThornWand: template({ ...WAND_BASE_TEMPLATE, id: 'fallen-thorn-wand', name: '墮落荊棘魔杖', slot: 'weapon', series: '魔杖', weaponType: 'one-handed-wand', image: 'assets/fallen-thorn-wand.png', imageStatus: 'ready', allowedJobs: ['mage', 'priest'], fixedAffixDefinitions: [fixed('thorn-spell-damage', '法術傷害', 'magicDamageBonus', 6, 9, '%'), fixed('thorn-max-mana', '最大魔力', 'mana', 50, 80)], specialAbilityIds: ['thorn_corrosion'] })
  });
  const DROP_SOURCES = Object.freeze({
    blackstoneStrongholdWarlord: Object.freeze({ mapId: 'blackstone-stronghold', monsterId: 'blackstoneStrongholdWarlord', templateId: TEMPLATES.blackstoneWarlordHelm.id, dropRate: .03, enabled: true }),
    corruptedAltarGuardian: Object.freeze({ mapId: 'forest-altar', monsterId: 'corruptedAltarGuardian', templateId: TEMPLATES.corruptedGuardianLeatherBoots.id, dropRate: .03, enabled: true }),
    heartOfTheBlackForest: Object.freeze({ mapId: 'black-forest-depths', monsterId: 'heartOfTheBlackForest', templateId: TEMPLATES.deepForestMagicOrb.id, dropRate: .02, enabled: true }),
    fallenDruid: Object.freeze({ mapId: 'forest-altar', monsterId: 'fallenDruid', templateId: TEMPLATES.fallenThornWand.id, dropRate: .02, enabled: true })
  });
  const TEMPLATE_BY_ID = new Map(Object.values(TEMPLATES).map((entry) => [entry.id, entry]));
  const clampRoll = (value) => Math.max(0, Math.min(.999999, Number(value) || 0));
  function rollRange(range, random) { return Array.isArray(range) ? range[0] + Math.floor(clampRoll(random()) * (range[1] - range[0] + 1)) : Number(range) || 0; }
  function getTemplate(templateId) { return TEMPLATE_BY_ID.get(templateId) || null; }
  function getDropSource(monsterId) { return DROP_SOURCES[monsterId] || null; }
  function hasAbility(equipment, abilityId) { return Object.values(equipment || {}).some((item) => item?.specialAbility?.id === abilityId); }
  function createSpecialEquipmentInstance(templateId, options = {}) {
    const template = getTemplate(templateId); if (!template || !EquipmentAffixPolicy) return null;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const baseStats = Object.fromEntries(Object.entries(template.baseStatRanges).map(([stat, range]) => [stat, rollRange(range, random)]));
    return EquipmentAffixPolicy.createEquipmentInstance({ ...template, ...baseStats }, { quality: 'epic', chapter: 2, jobId: options.jobId, uniqueId: options.uniqueId, random });
  }
  function getIncomingDamageReduction(equipment, hpRatio) { return hasAbility(equipment, 'warlord_unyielding') && Number(hpRatio) < .30 ? .15 : 0; }
  function rollCorruptedSwiftness(equipment, random = Math.random) { return hasAbility(equipment, 'corrupted_swiftness') && clampRoll(random()) < .10 ? { attackSpeedBonus: .15, durationMs: 5000 } : null; }
  function rollDeepForestEcho(equipment, random = Math.random) { return hasAbility(equipment, 'deep_forest_echo') && clampRoll(random()) < .15 ? .06 : 0; }
  function rollThornCorrosion(equipment, context = {}, random = Math.random) {
    const eligible = ['basic', 'skill'].includes(context.attackKind) && Number(context.finalDamage) > 0 && Number(context.totalAttack) > 0;
    if (!hasAbility(equipment, 'thorn_corrosion') || !eligible || clampRoll(random()) >= THORN_CORROSION.triggerRate) return null;
    const tickDamage = Number(context.totalAttack) * THORN_CORROSION.damageRatio;
    return { durationSeconds: THORN_CORROSION.durationSeconds, tickIntervalMs: THORN_CORROSION.tickIntervalMs, tickDamage, tickCount: THORN_CORROSION.tickCount, totalDamage: tickDamage * THORN_CORROSION.tickCount };
  }
  function grantSpecialDrop(progress, enemy, mapId, options = {}) {
    const source = getDropSource(enemy?.id);
    if (!progress || !source?.enabled || source.mapId !== mapId) return null;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const dropRate = Math.max(0, Math.min(1, Number(options.dropRate ?? source.dropRate) || 0));
    if (random() >= dropRate) return null;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const obtainedAt = Number(options.obtainedAt) || Date.now();
    const uniqueId = typeof options.uniqueIdFactory === 'function'
      ? options.uniqueIdFactory(source, obtainedAt)
      : `${obtainedAt.toString(36)}-${Math.floor(clampRoll(random()) * 2176782336).toString(36).padStart(6, '0')}`;
    const item = createSpecialEquipmentInstance(source.templateId, { uniqueId, jobId: options.jobId, random });
    if (!item) return null;
    item.instanceId = item.id;
    item.templateId = source.templateId;
    item.baseItemId = source.templateId;
    item.obtainedFrom = enemy.id;
    item.obtainedAt = obtainedAt;
    item.specialDropType = 'chapter-two-special-epic';
    item.sockets = RunePolicy?.rollNaturalSockets(item, 2, random) || 0;
    item.socketedRunes = [];
    progress.inventory.push(item);
    return item;
  }
  return Object.freeze({ SPECIAL_AFFIX_RULE, THORN_CORROSION, WAND_BASE_TEMPLATE, MAGIC_ORB_BASE_TEMPLATE, TEMPLATES, DROP_SOURCES, getTemplate, getDropSource, hasAbility, createSpecialEquipmentInstance, getIncomingDamageReduction, rollCorruptedSwiftness, rollDeepForestEcho, rollThornCorrosion, grantSpecialDrop });
}));
