(function attachChapterThreeOffhandPolicy(root, factory) {
  const affixPolicy = typeof module === 'object' && module.exports
    ? require('./equipment-affix-policy.js')
    : root.EquipmentAffixPolicy;
  const api = factory(affixPolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterThreeOffhandPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterThreeOffhandPolicy(EquipmentAffixPolicy) {
  'use strict';

  const TEMPLATE_STATUS = 'template-only';
  const PENDING_STATUS = 'pending';
  const QUALITY_STRUCTURE = Object.freeze({
    uncommon: Object.freeze({ fixedCount: 1, randomCount: 2 }),
    rare: Object.freeze({ fixedCount: 2, randomCount: 3 })
  });

  function fixed(id, name, stat, value, unit = '%') {
    return Object.freeze({ id: 'chapter3-offhand-' + id, name, stat, min: value, max: value, unit });
  }

  function template(definition) {
    const structure = QUALITY_STRUCTURE[definition.quality];
    return Object.freeze({
      kind: 'equipment',
      chapter: 3,
      affixChapter: 3,
      slot: 'offhand',
      rarity: definition.quality,
      image: null,
      imageStatus: PENDING_STATUS,
      implementationStatus: TEMPLATE_STATUS,
      baseStatsStatus: 'ready',
      affixContentStatus: 'ready',
      randomAffixPoolStatus: PENDING_STATUS,
      dropEnabled: false,
      dropSource: null,
      dropRate: null,
      fixedAffixIds: Object.freeze([]),
      allowedAffixIds: Object.freeze([]),
      affixRule: structure,
      ...definition,
      allowedJobs: Object.freeze(definition.allowedJobs || []),
      baseStats: Object.freeze({ ...definition.baseStats })
    });
  }

  const TEMPLATES = Object.freeze({
    redrockGuardShield: template({
      id: 'redrock-guard-shield', name: '赤岩守衛盾', quality: 'uncommon', series: '盾牌', offhandType: 'shield',
      allowedJobs: ['warrior'], baseStats: { defense: 15, parry: .05 },
      fixedAffixDefinitions: Object.freeze([fixed('guard-hp', '生命', 'maxHp', 40, '')])
    }),
    redrockLegionHeavyShield: template({
      id: 'redrock-legion-heavy-shield', name: '赤岩軍團重盾', quality: 'rare', series: '盾牌', offhandType: 'shield',
      allowedJobs: ['warrior'], baseStats: { defense: 20, parry: .06 },
      fixedAffixDefinitions: Object.freeze([fixed('legion-hp', '生命', 'maxHp', 50, ''), fixed('legion-reduction', '受到傷害降低', 'damageReductionPercent', 3)])
    }),
    wastelandHunterQuiver: template({
      id: 'wasteland-hunter-quiver', name: '荒原獵手箭筒', quality: 'uncommon', series: '箭筒', offhandType: 'quiver',
      allowedJobs: ['hunter'], baseStats: { maxArrows: 12, arrowRecoveryInterval: 1000 / 1.2 },
      fixedAffixDefinitions: Object.freeze([fixed('hunter-crit', '暴擊率', 'criticalChance', 6)])
    }),
    redfeatherPursuitQuiver: template({
      id: 'redfeather-pursuit-quiver', name: '赤羽追獵箭筒', quality: 'rare', series: '箭筒', offhandType: 'quiver',
      allowedJobs: ['hunter'], baseStats: { maxArrows: 12, arrowRecoveryInterval: 1000 / 1.2 },
      fixedAffixDefinitions: Object.freeze([fixed('pursuit-crit', '暴擊率', 'criticalChance', 8), fixed('pursuit-boss', '對 Boss 傷害', 'bossDamagePercent', 10)])
    }),
    shamanArcaneBook: template({
      id: 'shaman-arcane-book', name: '薩滿秘法書', quality: 'uncommon', series: '魔導書', offhandType: 'spellbook',
      allowedJobs: ['mage', 'priest'], baseStats: { mana: 70, manaRegenFlat: 3 },
      fixedAffixDefinitions: Object.freeze([fixed('shaman-regen', '魔力恢復', 'manaRegenerationPercent', 20)])
    }),
    redrockArcaneTome: template({
      id: 'redrock-arcane-tome', name: '赤岩秘法典籍', quality: 'rare', series: '魔導書', offhandType: 'spellbook',
      allowedJobs: ['mage', 'priest'], baseStats: { mana: 90, manaRegenFlat: 4 },
      fixedAffixDefinitions: Object.freeze([fixed('tome-regen', '魔力恢復', 'manaRegenerationPercent', 25), fixed('tome-cooldown', '技能冷卻恢復速度', 'cooldownSpeedPercent', 8)])
    })
  });

  const TEMPLATE_BY_ID = new Map(Object.values(TEMPLATES).map((entry) => [entry.id, entry]));

  function getTemplate(templateId) {
    return TEMPLATE_BY_ID.get(templateId) || null;
  }

  // Generation support only; the random affix pool and drop gates remain pending.
  function createEquipment(templateId, options = {}) {
    const entry = getTemplate(templateId);
    if (!entry) return null;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const baseStats = { ...entry.baseStats };
    let randomBaseStat = null;
    if (entry.offhandType === 'quiver') {
      const stats = ['attack', 'criticalChance', 'criticalDamageBonus'];
      const values = entry.quality === 'rare' ? [15, .05, .12] : [10, .03, .08];
      const index = Math.floor(Math.min(.999999999, Math.max(0, Number(random()) || 0)) * 3);
      randomBaseStat = { stat: stats[index], value: values[index] };
      baseStats[randomBaseStat.stat] = randomBaseStat.value;
    }
    const item = EquipmentAffixPolicy.createEquipmentInstance(
      { ...entry, ...baseStats, baseStats, ...(randomBaseStat ? { randomBaseStat } : {}) },
      { ...options, random, quality: entry.quality, chapter: 3,
        uniqueId: options.uniqueId ?? globalThis.crypto.randomUUID() }
    );
    item.instanceId = item.id;
    return item;
  }

  function getTemplatesByQuality(quality) {
    return Object.freeze(Object.values(TEMPLATES).filter((entry) => entry.quality === quality));
  }

  function isReadyForDrop(entry) {
    const structure = QUALITY_STRUCTURE[entry?.quality];
    const formalRule = EquipmentAffixPolicy?.QUALITY_AFFIX_RULES?.[entry?.quality];
    return Boolean(
      entry
      && structure
      && formalRule
      && formalRule.fixedCount === structure.fixedCount
      && formalRule.randomCount === structure.randomCount
      && entry.affixContentStatus === 'ready'
      && entry.randomAffixPoolStatus === 'ready'
      && (entry.fixedAffixDefinitions || entry.fixedAffixIds)?.length === structure.fixedCount
      && entry.allowedAffixIds?.length > 0
      && entry.dropEnabled
      && entry.dropSource
      && Number(entry.dropRate) > 0
    );
  }

  return Object.freeze({ TEMPLATE_STATUS, PENDING_STATUS, QUALITY_STRUCTURE, TEMPLATES, getTemplate, createEquipment, getTemplatesByQuality, isReadyForDrop });
}));
