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
  const READY_AFFIX_RULE = Object.freeze({ fixedCount: 2, randomCount: 2, specialChance: 1 });
  const PLANNED_AFFIX_STRUCTURE = Object.freeze({ fixedCount: 2, randomCount: 2, specialAbilityCount: 1 });

  function ability(name, direction) {
    return Object.freeze({ name, direction, implementationStatus: 'pending', trigger: null, value: null, duration: null, cooldown: null });
  }
  function fixed(id, name, stat, value, unit = '%') {
    return Object.freeze({ id, name, stat, min: value, max: value, unit });
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
    vanguardStonebreakerArmor: template({ id: 'vanguard-stonebreaker-armor', name: '先鋒碎岩戰甲', slot: 'armor', series: '重甲', armorType: 'heavy', allowedJobs: ['warrior'], baseStats: Object.freeze({ defense: 45, hp: 90, parry: .05 }), baseStatsStatus: 'ready', affixContentStatus: 'ready', specialAbilityStatus: 'ready', implementationStatus: 'ready', fixedAffixIds: Object.freeze(['max_hp_percent', 'defense_percent']), specialAbilityIds: Object.freeze(['stonebreaker_bulwark']), affixRuleOverride: READY_AFFIX_RULE, specialAbilityDefinition: ability('碎岩壁壘', '單次重擊後短暫提高防禦。') }),
    greatChieftainWarscarLegguards: template({ id: 'great-chieftain-warscar-legguards', name: '大酋長戰痕腿鎧', slot: 'pants', series: '重甲', armorType: 'heavy', allowedJobs: ['warrior'], baseStats: Object.freeze({ defense: 33, hp: 70, hpRegeneration: 4 }), baseStatsStatus: 'ready', affixContentStatus: 'ready', specialAbilityStatus: 'ready', implementationStatus: 'ready', fixedAffixIds: Object.freeze(['max_hp_percent', 'hp_regeneration_flat']), specialAbilityIds: Object.freeze(['warscar_counter']), affixRuleOverride: READY_AFFIX_RULE, specialAbilityDefinition: ability('戰痕反擊', '格擋後強化下一次主手普通攻擊。') }),
    skullcrusherChampionWarbracers: template({ id: 'skullcrusher-champion-warbracers', name: '碎顱勇士戰腕', slot: 'gloves', series: '皮甲', armorType: 'leather', allowedJobs: ['hunter', 'assassin'], baseStats: Object.freeze({ defense: 16, hp: 30, attackSpeedBonus: .05 }), baseStatsStatus: 'ready', affixContentStatus: 'ready', specialAbilityStatus: 'ready', implementationStatus: 'ready', fixedAffixDefinitions: Object.freeze([fixed('champion-attack-speed', '攻擊速度', 'attackSpeedPercent', 10), fixed('champion-critical-chance', '暴擊率', 'criticalChance', 7)]), specialAbilityIds: Object.freeze(['hunting_frenzy']), affixRuleOverride: READY_AFFIX_RULE, specialAbilityDefinition: ability('獵殺狂熱', '持續攻擊同一目標時提高普攻傷害。') }),
    awakenedRunemarkHuntingGarb: template({ id: 'awakened-runemark-hunting-garb', name: '覺醒符紋獵衣', slot: 'armor', series: '皮甲', armorType: 'leather', allowedJobs: ['hunter', 'assassin'], baseStats: Object.freeze({ defense: 35, hp: 62, dodge: .05 }), baseStatsStatus: 'ready', affixContentStatus: 'ready', specialAbilityStatus: 'ready', implementationStatus: 'ready', fixedAffixDefinitions: Object.freeze([fixed('runemark-dodge', '閃避', 'dodgePercent', 10), fixed('runemark-attack-speed', '攻擊速度', 'attackSpeedPercent', 10)]), specialAbilityIds: Object.freeze(['runemark_afterimage']), affixRuleOverride: READY_AFFIX_RULE, specialAbilityDefinition: ability('符紋殘影', '閃避後使下一次主手普攻必定暴擊。') }),
    templeRuneRobe: template({ id: 'temple-rune-robe', name: '聖殿符文法袍', slot: 'armor', series: '布甲', armorType: 'cloth', allowedJobs: ['mage', 'priest'], baseStats: Object.freeze({ defense: 26, hp: 50, mana: 65 }), baseStatsStatus: 'ready', affixContentStatus: 'ready', specialAbilityStatus: 'ready', implementationStatus: 'ready', fixedAffixIds: Object.freeze(['skill_damage_percent', 'cooldown_speed_percent']), specialAbilityIds: Object.freeze(['mana_surge']), affixRuleOverride: READY_AFFIX_RULE, specialAbilityDefinition: ability('法力湧動', '施法後機率返還實際消耗的主要資源。') })
  });

  const DROP_SOURCES = Object.freeze({
    'skullcrusher-vanguard-commander': Object.freeze({ mapId: 'bloodwar-wastes', templateId: TEMPLATES.vanguardStonebreakerArmor.id, dropRate: BOSS_DROP_RATE }),
    'skullcrusher-great-chieftain': Object.freeze({ mapId: 'skullcrusher-war-camp', templateId: TEMPLATES.greatChieftainWarscarLegguards.id, dropRate: BOSS_DROP_RATE }),
    'skullcrusher-champion': Object.freeze({ mapId: 'skullcrusher-war-camp', templateId: TEMPLATES.skullcrusherChampionWarbracers.id, dropRate: ELITE_DROP_RATE }),
    'awakened-guard': Object.freeze({ mapId: 'ancient-altar', templateId: TEMPLATES.awakenedRunemarkHuntingGarb.id, dropRate: ELITE_DROP_RATE }),
    'temple-guardian': Object.freeze({ mapId: 'redrock-temple', templateId: TEMPLATES.templeRuneRobe.id, dropRate: ELITE_DROP_RATE })
  });
  const TEMPLATE_BY_ID = new Map(Object.values(TEMPLATES).map((entry) => [entry.id, entry]));
  const ABILITIES = Object.freeze({ bulwark: 'stonebreaker_bulwark', counter: 'warscar_counter', frenzy: 'hunting_frenzy', afterimage: 'runemark_afterimage', manaSurge: 'mana_surge' });
  const BULWARK = Object.freeze({ threshold: .15, defenseBonus: .25, durationMs: 6000, cooldownMs: 12000 });
  const COUNTER_DAMAGE_BONUS = .30;
  const FRENZY = Object.freeze({ perStack: .04, maxStacks: 5 });
  const MANA_SURGE = Object.freeze({ chance: .25, refundRatio: .50 });
  const clampRoll = (value) => Math.max(0, Math.min(.999999, Number(value) || 0));
  function getTemplate(templateId) { return TEMPLATE_BY_ID.get(templateId) || null; }
  function hasAbility(equipment, abilityId) { return Object.values(equipment || {}).some((item) => item?.specialAbility?.id === abilityId); }
  function clearCombatState(member) {
    if (!member) return member;
    member.stonebreakerBulwarkUntil = 0;
    member.stonebreakerBulwarkReadyAt = 0;
    member.warscarCounterPending = false;
    member.huntingFrenzyTarget = null;
    member.huntingFrenzyStacks = 0;
    member.runemarkGuaranteedCrit = false;
    return member;
  }
  function getDefenseMultiplier(member, now = Date.now()) {
    if (!hasAbility(member?.progress?.equipment, ABILITIES.bulwark)) {
      if (member) { member.stonebreakerBulwarkUntil = 0; member.stonebreakerBulwarkReadyAt = 0; }
      return 1;
    }
    return now < (member.stonebreakerBulwarkUntil || 0) ? 1 + BULWARK.defenseBonus : 1;
  }
  function resolveEnemyAttackOutcome(member, outcome = {}, now = Date.now()) {
    if (!member) return Object.freeze({ bulwarkTriggered: false, counterGranted: false, afterimageGranted: false });
    const equipment = member.progress?.equipment;
    const actualDamage = Math.max(0, Number(outcome.actualDamage) || 0);
    const maxHp = Math.max(0, Number(member.maxHp) || 0);
    let bulwarkTriggered = false;
    if (hasAbility(equipment, ABILITIES.bulwark) && maxHp > 0 && actualDamage / maxHp >= BULWARK.threshold && now >= (member.stonebreakerBulwarkReadyAt || 0)) {
      member.stonebreakerBulwarkUntil = now + BULWARK.durationMs;
      member.stonebreakerBulwarkReadyAt = now + BULWARK.cooldownMs;
      bulwarkTriggered = true;
    }
    const counterGranted = Boolean(outcome.parried && hasAbility(equipment, ABILITIES.counter));
    if (counterGranted) member.warscarCounterPending = true;
    const afterimageGranted = Boolean(outcome.dodged && hasAbility(equipment, ABILITIES.afterimage));
    if (afterimageGranted) member.runemarkGuaranteedCrit = true;
    return Object.freeze({ bulwarkTriggered, counterGranted, afterimageGranted });
  }
  function beginMainHandBasicAttack(member, targetKey) {
    const equipment = member?.progress?.equipment;
    if (!hasAbility(equipment, ABILITIES.counter) && member) member.warscarCounterPending = false;
    if (!hasAbility(equipment, ABILITIES.afterimage) && member) member.runemarkGuaranteedCrit = false;
    if (!hasAbility(equipment, ABILITIES.frenzy)) {
      if (member) { member.huntingFrenzyTarget = null; member.huntingFrenzyStacks = 0; }
    } else if (member.huntingFrenzyTarget !== targetKey) {
      member.huntingFrenzyTarget = targetKey;
      member.huntingFrenzyStacks = 0;
    }
    const counterPending = Boolean(hasAbility(equipment, ABILITIES.counter) && member?.warscarCounterPending);
    const guaranteedCritical = Boolean(hasAbility(equipment, ABILITIES.afterimage) && member?.runemarkGuaranteedCrit);
    const frenzyPercent = hasAbility(equipment, ABILITIES.frenzy) ? Math.min(FRENZY.maxStacks, Math.max(0, Number(member?.huntingFrenzyStacks) || 0)) * FRENZY.perStack : 0;
    return Object.freeze({ targetKey, counterPending, guaranteedCritical, damageMultiplier: 1 + (counterPending ? COUNTER_DAMAGE_BONUS : 0) + frenzyPercent });
  }
  function completeMainHandBasicAttack(member, execution, hit, targetAlive = true) {
    if (!member || !execution || !hit) return;
    if (execution.counterPending) member.warscarCounterPending = false;
    if (execution.guaranteedCritical) member.runemarkGuaranteedCrit = false;
    if (hasAbility(member.progress?.equipment, ABILITIES.frenzy)) {
      member.huntingFrenzyTarget = execution.targetKey;
      member.huntingFrenzyStacks = Math.min(FRENZY.maxStacks, (Number(member.huntingFrenzyStacks) || 0) + 1);
      if (!targetAlive) { member.huntingFrenzyTarget = null; member.huntingFrenzyStacks = 0; }
    }
  }
  function resolveManaSurge(member, actualSpent, random = Math.random) {
    const spent = Math.max(0, Number(actualSpent) || 0);
    if (!member || spent <= 0 || !hasAbility(member.progress?.equipment, ABILITIES.manaSurge) || clampRoll(random()) >= MANA_SURGE.chance) return Object.freeze({ triggered: false, restored: 0 });
    const maximum = Math.max(0, Number(member.resourceMax) || 0);
    const current = Math.min(maximum, Math.max(0, Number(member.resourceCurrent) || 0));
    const requested = Math.ceil(spent * MANA_SURGE.refundRatio);
    member.resourceCurrent = Math.min(maximum, current + requested);
    return Object.freeze({ triggered: true, requested, restored: member.resourceCurrent - current });
  }
  function getDropSource(monsterId) { return DROP_SOURCES[monsterId] || null; }
  function createSpecialEquipmentInstance(templateId, options = {}) {
    const template = getTemplate(templateId);
    if (!template || !EquipmentAffixPolicy) return null;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    return EquipmentAffixPolicy.createEquipmentInstance({ ...template, ...template.baseStats }, { quality: 'epic', chapter: 3, jobId: options.jobId, uniqueId: options.uniqueId, random });
  }
  function upgradeSpecialEquipmentInstance(item) {
    const templateId = item?.templateId || item?.baseItemId || String(item?.id || '').split(/-(?=[^-]+$)/)[0];
    const template = getTemplate(templateId);
    if (!item || !template || item.specialDropType !== 'chapter-three-special-epic') return item;
    const fresh = createSpecialEquipmentInstance(template.id, { uniqueId: 'migration', random: () => .5 });
    const fixedAffixes = Array.isArray(item.fixedAffixes) && item.fixedAffixes.length ? item.fixedAffixes : fresh.fixedAffixes;
    const randomAffixes = Array.isArray(item.randomAffixes) && item.randomAffixes.length ? item.randomAffixes : fresh.randomAffixes;
    return { ...fresh, ...item, ...template.baseStats, baseStats: { ...template.baseStats }, fixedAffixes, randomAffixes, affixes: [...fixedAffixes, ...randomAffixes], specialAbility: item.specialAbility || fresh.specialAbility, baseStatsStatus: 'ready', affixContentStatus: 'ready', specialAbilityStatus: 'ready', maxNaturalSockets: 2 };
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

  return Object.freeze({ BOSS_DROP_RATE, ELITE_DROP_RATE, PENDING_AFFIX_RULE, READY_AFFIX_RULE, PLANNED_AFFIX_STRUCTURE, ABILITIES, BULWARK, COUNTER_DAMAGE_BONUS, FRENZY, MANA_SURGE, TEMPLATES, DROP_SOURCES, getTemplate, getDropSource, hasAbility, clearCombatState, getDefenseMultiplier, resolveEnemyAttackOutcome, beginMainHandBasicAttack, completeMainHandBasicAttack, resolveManaSurge, createSpecialEquipmentInstance, upgradeSpecialEquipmentInstance, grantSpecialDrop });
}));
