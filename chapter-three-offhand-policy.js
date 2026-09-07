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
      affixContentStatus: PENDING_STATUS,
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
      allowedJobs: ['warrior'], baseStats: { defense: 16, parry: .05 }
    }),
    redrockLegionHeavyShield: template({
      id: 'redrock-legion-heavy-shield', name: '赤岩軍團重盾', quality: 'rare', series: '盾牌', offhandType: 'shield',
      allowedJobs: ['warrior'], baseStats: { defense: 21, parry: .06 }
    }),
    wastelandHunterQuiver: template({
      id: 'wasteland-hunter-quiver', name: '荒原獵手箭筒', quality: 'uncommon', series: '箭筒', offhandType: 'quiver',
      allowedJobs: ['hunter'], baseStats: { maxArrows: 12, arrowRecoveryInterval: 1000 / 1.4 }
    }),
    redfeatherPursuitQuiver: template({
      id: 'redfeather-pursuit-quiver', name: '赤羽追獵箭筒', quality: 'rare', series: '箭筒', offhandType: 'quiver',
      allowedJobs: ['hunter'], baseStats: { maxArrows: 13, arrowRecoveryInterval: 1000 / 1.6 }
    }),
    shamanArcaneBook: template({
      id: 'shaman-arcane-book', name: '薩滿秘法書', quality: 'uncommon', series: '魔導書', offhandType: 'spellbook',
      allowedJobs: ['mage', 'priest'], baseStats: { mana: 70, manaRegenFlat: 2.5 }
    }),
    redrockArcaneTome: template({
      id: 'redrock-arcane-tome', name: '赤岩秘法典籍', quality: 'rare', series: '魔導書', offhandType: 'spellbook',
      allowedJobs: ['mage', 'priest'], baseStats: { mana: 90, manaRegenFlat: 3 }
    })
  });

  const TEMPLATE_BY_ID = new Map(Object.values(TEMPLATES).map((entry) => [entry.id, entry]));

  function getTemplate(templateId) {
    return TEMPLATE_BY_ID.get(templateId) || null;
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
      && entry.fixedAffixIds?.length === structure.fixedCount
      && entry.allowedAffixIds?.length > 0
      && entry.dropEnabled
      && entry.dropSource
      && Number(entry.dropRate) > 0
    );
  }

  return Object.freeze({ TEMPLATE_STATUS, PENDING_STATUS, QUALITY_STRUCTURE, TEMPLATES, getTemplate, getTemplatesByQuality, isReadyForDrop });
}));
