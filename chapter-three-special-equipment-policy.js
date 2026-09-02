(function attachChapterThreeSpecialEquipmentPolicy(root, factory) {
  const affixPolicy = typeof module === 'object' && module.exports ? require('./equipment-affix-policy.js') : root.EquipmentAffixPolicy;
  const runePolicy = typeof module === 'object' && module.exports ? require('./rune-policy.js') : root.RunePolicy;
  const api = factory(affixPolicy, runePolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterThreeSpecialEquipmentPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterThreeSpecialEquipmentPolicy(EquipmentAffixPolicy, RunePolicy) {
  'use strict';

  const BOSS_DROP_RATE = .03;
  const ELITE_DROP_RATE = .015;
  const PENDING_AFFIX_RULE = Object.freeze({ fixedCount: 0, randomCount: 0, specialChance: 0 });
  const PLANNED_AFFIX_STRUCTURE = Object.freeze({ fixedCount: 2, randomCount: 2, specialAbilityCount: 1 });

  function ability(name, direction) {
    return Object.freeze({ name, direction, implementationStatus: 'pending', trigger: null, value: null, duration: null, cooldown: null });
  }
  function template(definition) {
    return Object.freeze({
      kind: 'equipment', chapter: 3, affixChapter: 3, quality: 'epic', rarity: 'epic', directDrop: true,
      image: null, imageStatus: 'pending', implementationStatus: 'drop-ready-values-pending',
      baseStats: Object.freeze({}), baseStatsStatus: 'pending', affixContentStatus: 'pending', specialAbilityStatus: 'pending',
      affixRuleOverride: PENDING_AFFIX_RULE, plannedAffixStructure: PLANNED_AFFIX_STRUCTURE, maxNaturalSockets: 2,
      ...definition, allowedJobs: Object.freeze(definition.allowedJobs || []), specialAbilityDefinition: Object.freeze({ ...definition.specialAbilityDefinition })
    });
  }

  const TEMPLATES = Object.freeze({
    vanguardStonebreakerArmor: template({ id: 'vanguard-stonebreaker-armor', name: '先鋒碎岩戰甲', slot: 'armor', series: '重甲', armorType: 'heavy', allowedJobs: ['warrior'], specialAbilityDefinition: ability('碎岩壁壘', '受到足夠高或重型傷害後，暫時提高防禦。') }),
    greatChieftainWarscarLegguards: template({ id: 'great-chieftain-warscar-legguards', name: '大酋長戰痕腿鎧', slot: 'pants', series: '重甲', armorType: 'heavy', allowedJobs: ['warrior'], specialAbilityDefinition: ability('不屈戰意', '低生命時提高生存能力。') }),
    skullcrusherChampionWarbracers: template({ id: 'skullcrusher-champion-warbracers', name: '碎顱勇士戰腕', slot: 'gloves', series: '皮甲', armorType: 'leather', allowedJobs: ['hunter', 'assassin'], specialAbilityDefinition: ability('獵殺狂熱', '連續攻擊同一目標時累積進攻型增益。') }),
    awakenedRunemarkHuntingGarb: template({ id: 'awakened-runemark-hunting-garb', name: '覺醒符紋獵衣', slot: 'armor', series: '皮甲', armorType: 'leather', allowedJobs: ['hunter', 'assassin'], specialAbilityDefinition: ability('符紋殘影', '成功閃避後，短時間獲得進攻型增益。') }),
    templeRuneRobe: template({ id: 'temple-rune-robe', name: '聖殿符文法袍', slot: 'armor', series: '布甲', armorType: 'cloth', allowedJobs: ['mage', 'priest'], specialAbilityDefinition: ability('符文共鳴', '主動技能施放累積符文能量，達到門檻後暫時強化法術或技能效果。') })
  });

  const DROP_SOURCES = Object.freeze({
    'skullcrusher-vanguard-commander': Object.freeze({ mapId: 'bloodwar-wastes', templateId: TEMPLATES.vanguardStonebreakerArmor.id, dropRate: BOSS_DROP_RATE }),
    'skullcrusher-great-chieftain': Object.freeze({ mapId: 'skullcrusher-war-camp', templateId: TEMPLATES.greatChieftainWarscarLegguards.id, dropRate: BOSS_DROP_RATE }),
    'skullcrusher-champion': Object.freeze({ mapId: 'skullcrusher-war-camp', templateId: TEMPLATES.skullcrusherChampionWarbracers.id, dropRate: ELITE_DROP_RATE }),
    'awakened-guard': Object.freeze({ mapId: 'ancient-altar', templateId: TEMPLATES.awakenedRunemarkHuntingGarb.id, dropRate: ELITE_DROP_RATE }),
    'temple-guardian': Object.freeze({ mapId: 'redrock-temple', templateId: TEMPLATES.templeRuneRobe.id, dropRate: ELITE_DROP_RATE })
  });
  const TEMPLATE_BY_ID = new Map(Object.values(TEMPLATES).map((entry) => [entry.id, entry]));
  const clampRoll = (value) => Math.max(0, Math.min(.999999, Number(value) || 0));
  function getTemplate(templateId) { return TEMPLATE_BY_ID.get(templateId) || null; }
  function getDropSource(monsterId) { return DROP_SOURCES[monsterId] || null; }
  function createSpecialEquipmentInstance(templateId, options = {}) {
    const template = getTemplate(templateId);
    if (!template || !EquipmentAffixPolicy) return null;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    return EquipmentAffixPolicy.createEquipmentInstance({ ...template }, { quality: 'epic', chapter: 3, jobId: options.jobId, uniqueId: options.uniqueId, random });
  }
  function grantSpecialDrop(progress, enemy, mapId, options = {}) {
    const source = getDropSource(enemy?.id);
    if (!progress || !source || source.mapId !== mapId) return null;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    if (clampRoll(random()) >= source.dropRate) return null;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const obtainedAt = Number(options.obtainedAt) || Date.now();
    const proposedUniqueId = typeof options.uniqueIdFactory === 'function'
      ? options.uniqueIdFactory(source, obtainedAt)
      : `${obtainedAt.toString(36)}-${Math.floor(clampRoll(random()) * 2176782336).toString(36).padStart(6, '0')}`;
    const existingIds = new Set(progress.inventory.map((entry) => entry?.instanceId || entry?.id).filter(Boolean));
    let uniqueId = proposedUniqueId;
    let suffix = 1;
    while (existingIds.has(`${source.templateId}-${uniqueId}`)) uniqueId = `${proposedUniqueId}-${suffix++}`;
    const item = createSpecialEquipmentInstance(source.templateId, { uniqueId, jobId: options.jobId, random });
    if (!item) return null;
    item.instanceId = item.id;
    item.templateId = source.templateId;
    item.baseItemId = source.templateId;
    item.obtainedFrom = enemy.id;
    item.obtainedAt = obtainedAt;
    item.specialDropType = 'chapter-three-special-epic';
    item.sockets = RunePolicy?.rollNaturalSockets(item, 3, random) || 0;
    item.socketedRunes = [];
    progress.inventory.push(item);
    return item;
  }

  return Object.freeze({ BOSS_DROP_RATE, ELITE_DROP_RATE, PENDING_AFFIX_RULE, PLANNED_AFFIX_STRUCTURE, TEMPLATES, DROP_SOURCES, getTemplate, getDropSource, createSpecialEquipmentInstance, grantSpecialDrop });
}));
