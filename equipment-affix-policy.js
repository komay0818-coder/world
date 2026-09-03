(function attachEquipmentAffixPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EquipmentAffixPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEquipmentAffixPolicy() {
  const SCHEMA_VERSION = 4;
  const GENERAL_AFFIX_TIER_MULTIPLIERS = Object.freeze({ 1: 1, 2: 1.5 });
  const QUALITY = Object.freeze({ common: 'common', uncommon: 'uncommon', rare: 'rare', epic: 'epic', legendary: 'legendary' });
  const QUALITY_LABELS = Object.freeze({ common: '白色', uncommon: '綠色', rare: '藍色', epic: '紫色', legendary: '傳奇' });
  const QUALITY_AFFIX_RULES = Object.freeze({
    common: Object.freeze({ fixedCount: 0, randomCount: 0, specialChance: 0 }),
    uncommon: Object.freeze({ fixedCount: 1, randomCount: 2, specialChance: 0 }),
    rare: Object.freeze({ fixedCount: 2, randomCount: 3, specialChance: 0 }),
    epic: Object.freeze({ fixedCount: 2, randomCount: 4, specialChance: .15 }),
    legendary: Object.freeze({ fixedCount: Object.freeze([2, 3]), randomCount: Object.freeze([1, 2]), specialChance: 0, requiresLegendaryAbility: true })
  });
  const SLOT_GROUPS = Object.freeze({
    weapon: 'weapon', offhand: 'accessory', head: 'armor', shoulders: 'armor', armor: 'armor', wrist: 'armor', gloves: 'armor',
    pants: 'armor', boots: 'armor', cloak: 'armor', necklace: 'accessory', ring: 'accessory', ring1: 'accessory', ring2: 'accessory'
  });
  const AFFIX_TYPES = Object.freeze({ STAT: 'stat', COMPOSITE: 'composite', SKILL: 'skill' });
  const ROLLABLE_QUALITIES = Object.freeze(['uncommon', 'rare', 'epic', 'legendary']);
  function affix(id, name, stat, value, unit, weight, allowedGroups, options = {}) {
    const valuesByChapter = Object.freeze({ ...(options.valuesByChapter || {}) });
    const components = options.components || (stat ? [{ stat, value, unit, valuesByChapter }] : []);
    return Object.freeze({
      id, name, type: options.type || AFFIX_TYPES.STAT, stat, value, unit, weight,
      unlockChapter: Math.max(1, Number(options.unlockChapter) || 1),
      maxChapter: Number.isFinite(Number(options.maxChapter)) ? Math.max(1, Number(options.maxChapter)) : null,
      valuesByChapter,
      qualities: Object.freeze(options.qualities || ROLLABLE_QUALITIES),
      allowedGroups: Object.freeze(allowedGroups), allowedSlots: Object.freeze(options.allowedSlots || []),
      components: Object.freeze(components.map((entry) => Object.freeze({ ...entry, valuesByChapter: Object.freeze({ ...(entry.valuesByChapter || {}) }) }))),
      isComposite: Boolean(options.isComposite || components.length > 1), isSpecialAbility: false,
      jobId: options.jobId || null, skillId: options.skillId || null,
      isSpecialSkillEffect: Boolean(options.isSpecialSkillEffect),
      enabled: options.enabled !== false, exclusionGroups: Object.freeze(options.exclusionGroups || []),
      rollable: options.rollable !== false, combatStatus: options.combatStatus || 'ready', trigger: Object.freeze({ ...(options.trigger || {}) }),
      description: options.description || '',
      mutuallyExclusiveWith: Object.freeze(options.mutuallyExclusiveWith || []), disabledReason: options.disabledReason || ''
    });
  }
  const BASE_EQUIPMENT_AFFIXES = Object.freeze({
    attack_flat: affix('attack_flat', '攻擊', 'attackFlat', 4, '', 9, ['weapon', 'armor'], { valuesByChapter: { 1: 4, 2: 6, 3: 9 } }),
    skill_damage_percent: affix('skill_damage_percent', '技能傷害', 'skillDamagePercent', 5, '%', 6, ['weapon', 'armor']),
    max_hp_flat: affix('max_hp_flat', '生命', 'maxHp', 20, '', 9, ['weapon', 'armor', 'accessory'], { valuesByChapter: { 1: 20, 2: 30, 3: 45 } }),
    hp_regeneration_flat: affix('hp_regeneration_flat', '生命恢復', 'hpRegeneration', 3, '', 6, ['weapon', 'armor', 'accessory'], { valuesByChapter: { 1: 3, 2: 5, 3: 7 } }),
    max_hp_percent: affix('max_hp_percent', '最大生命', 'maxHpPercent', 8, '%', 10, ['armor'], { valuesByChapter: { 1: 8, 2: 12, 3: 15 } }),
    defense_percent: affix('defense_percent', '防禦', 'defensePercent', 8, '%', 10, ['armor'], { valuesByChapter: { 1: 8, 2: 12, 3: 15 } }),
    accuracy_percent: affix('accuracy_percent', '命中', 'accuracyPercent', 5, '%', 8, ['weapon'], { valuesByChapter: { 1: 5, 2: 8, 3: 10 } }),
    dodge_percent: affix('dodge_percent', '閃避', 'dodgePercent', 5, '%', 8, ['armor'], { valuesByChapter: { 1: 5, 2: 8, 3: 10 } }),
    attack_speed_percent: affix('attack_speed_percent', '攻擊速度', 'attackSpeedPercent', 5, '%', 6, ['weapon'], { valuesByChapter: { 1: 5, 2: 8, 3: 10 }, exclusionGroups: ['speed'] }),
    critical_chance: affix('critical_chance', '暴擊率', 'criticalChance', 3, '%', 5, ['weapon', 'accessory'], { valuesByChapter: { 1: 3, 2: 5, 3: 7 }, exclusionGroups: ['critical'] }),
    critical_damage_percent: affix('critical_damage_percent', '暴擊傷害', 'criticalDamagePercent', 10, '%', 5, ['weapon'], { unlockChapter: 2, valuesByChapter: { 2: 10, 3: 15 }, exclusionGroups: ['critical'] }),
    cooldown_speed_percent: affix('cooldown_speed_percent', '冷卻速度', 'cooldownSpeedPercent', 5, '%', 5, ['armor', 'accessory'], { exclusionGroups: ['speed'] }),
    mana_regeneration_percent: affix('mana_regeneration_percent', '魔力恢復', 'manaRegenerationPercent', 10, '%', 6, ['armor', 'accessory'], { valuesByChapter: { 1: 10, 2: 15, 3: 20 } }),
    experience_gain_percent: affix('experience_gain_percent', '經驗值獲得', 'experienceGainPercent', 5, '%', 3, ['accessory'], { enabled: false, disabledReason: '尚未接入獎勵結算' }),
    gold_gain_percent: affix('gold_gain_percent', '金幣獲得', 'goldGainPercent', 5, '%', 3, ['accessory'], { enabled: false, disabledReason: '尚未接入獎勵結算' }),
    item_find_percent: affix('item_find_percent', '掉寶率', 'itemFindPercent', 5, '%', 3, ['accessory'], { enabled: false, disabledReason: '尚未接入掉落機率計算' }),
    chapter2_berserker: affix('chapter2_berserker', '狂戰', null, null, '', 4, ['weapon'], { type: AFFIX_TYPES.COMPOSITE, unlockChapter: 2, qualities: ['rare', 'epic', 'legendary'], isComposite: true, components: [{ stat: 'attackFlat', value: 4, unit: '', valuesByChapter: { 2: 4, 3: 6 } }, { stat: 'attackSpeedPercent', value: 5, unit: '%', valuesByChapter: { 2: 5, 3: 7 } }], mutuallyExclusiveWith: ['attack_flat', 'attack_speed_percent'] }),
    chapter3_berserker_master: affix('chapter3_berserker_master', '狂戰大師', null, null, '', 2, ['weapon'], { type: AFFIX_TYPES.COMPOSITE, unlockChapter: 3, qualities: ['epic', 'legendary'], isComposite: true, components: [{ stat: 'attackFlat', value: 4, unit: '' }, { stat: 'attackSpeedPercent', value: 5, unit: '%' }, { stat: 'criticalChance', value: 3, unit: '%' }], rollable: false, combatStatus: 'reserved', disabledReason: '不在第三章正式一般詞綴池', mutuallyExclusiveWith: ['chapter2_berserker', 'attack_flat', 'attack_speed_percent', 'critical_chance'] }),
    mage_fireball_damage: affix('mage_fireball_damage', '技能強化', 'skillDamagePercent', 5, '%', 3, ['weapon', 'accessory'], { type: AFFIX_TYPES.SKILL, unlockChapter: 2, qualities: ['uncommon', 'rare', 'epic'], valuesByChapter: { 2: 5, 3: 7 } })
  });
  const CHAPTER_TWO_AFFIXES = Object.freeze({
    skill_damage_percent: affix('skill_damage_percent', '技能傷害', 'skillDamagePercent', 8, '%', 6, ['weapon', 'armor'], { unlockChapter: 2, valuesByChapter: { 2: 8, 3: 10 } }),
    cooldown_speed_percent: affix('cooldown_speed_percent', '技能冷卻恢復速度', 'cooldownSpeedPercent', 8, '%', 5, ['armor', 'accessory'], { unlockChapter: 2, valuesByChapter: { 2: 8, 3: 10 }, exclusionGroups: ['speed'] }),
    elite_damage_percent: affix('elite_damage_percent', '對菁英怪物傷害', 'eliteDamagePercent', 8, '%', 6, ['weapon', 'accessory'], { unlockChapter: 2, valuesByChapter: { 2: 8, 3: 10 } }),
    boss_damage_percent: affix('boss_damage_percent', '對 Boss 傷害', 'bossDamagePercent', 8, '%', 5, ['weapon', 'accessory'], { unlockChapter: 2, valuesByChapter: { 2: 8, 3: 10 } }),
    basic_attack_damage_percent: affix('basic_attack_damage_percent', '普攻傷害', 'basicAttackDamagePercent', 8, '%', 6, ['weapon', 'armor'], { unlockChapter: 2, valuesByChapter: { 2: 8, 3: 10 } }),
    kill_health_recovery_percent: affix('kill_health_recovery_percent', '擊殺回復生命', 'killHealthRecoveryPercent', 3, '%', 5, ['armor', 'accessory'], { unlockChapter: 2, valuesByChapter: { 2: 3, 3: 4 } }),
    kill_resource_recovery_percent: affix('kill_resource_recovery_percent', '擊殺回復主要資源', 'killResourceRecoveryPercent', 5, '%', 5, ['weapon', 'accessory'], { unlockChapter: 2, valuesByChapter: { 2: 5, 3: 7 } }),
    poison_resistance_percent: affix('poison_resistance_percent', '中毒抗性', 'poisonResistancePercent', 15, '%', 6, ['armor', 'accessory'], { unlockChapter: 2, maxChapter: 2, valuesByChapter: { 2: 15 } })
  });
  const CHAPTER_THREE_PENDING_AFFIXES = Object.freeze({
    armor_penetration_percent: affix('armor_penetration_percent', '護甲穿透', 'armorPenetrationPercent', 8, '%', 6, ['weapon', 'accessory'], { unlockChapter: 3, valuesByChapter: { 3: 8 } }),
    last_stand_damage_percent: affix('last_stand_damage_percent', '背水', 'lowHealthDamagePercent', 12, '%', 5, ['weapon', 'accessory'], { unlockChapter: 3, valuesByChapter: { 3: 12 }, trigger: { hpBelow: .30 }, description: 'HP低於30%時，造成傷害 +{value}%' }),
    first_strike_damage_percent: affix('first_strike_damage_percent', '先制', 'highHealthDamagePercent', 8, '%', 5, ['weapon', 'accessory'], { unlockChapter: 3, valuesByChapter: { 3: 8 }, trigger: { hpAbove: .80 }, description: 'HP高於80%時，造成傷害 +{value}%' }),
    critical_resource_recovery_percent: affix('critical_resource_recovery_percent', '暴擊回復', 'criticalResourceRecoveryPercent', 2, '%', 5, ['weapon', 'accessory'], { unlockChapter: 3, valuesByChapter: { 3: 2 }, trigger: { event: 'critical', maxTriggersPerAttack: 1 }, description: '暴擊時恢復 {value}% 最大主要資源' }),
    control_resistance_percent: affix('control_resistance_percent', '控制抗性', 'controlResistancePercent', 15, '%', 6, ['armor', 'accessory'], { unlockChapter: 3, valuesByChapter: { 3: 15 }, description: '控制效果持續時間 -{value}%' }),
    direct_hit_health_recovery_percent: affix('direct_hit_health_recovery_percent', '受擊恢復', 'directHitHealthRecoveryPercent', 2, '%', 5, ['armor', 'accessory'], { unlockChapter: 3, valuesByChapter: { 3: 2 }, trigger: { event: 'enemy-direct-hit', chance: .05 }, description: '受到敵人直接命中時，5%機率恢復{value}%最大生命' })
  });
  const EQUIPMENT_AFFIXES = Object.freeze({ ...BASE_EQUIPMENT_AFFIXES, ...CHAPTER_TWO_AFFIXES, ...CHAPTER_THREE_PENDING_AFFIXES });
  function specialAbility(id, name, description, options = {}) {
    return Object.freeze({ id, name, description, type: options.type || 'special', value: options.value ?? null, unlockChapter: Math.max(1, Number(options.unlockChapter) || 1), qualities: Object.freeze(options.qualities || ['epic', 'legendary']), allowedGroups: Object.freeze(options.allowedGroups || ['weapon', 'armor', 'accessory']), allowedSlots: Object.freeze(options.allowedSlots || []), weight: Math.max(0, Number(options.weight) || 1), isComposite: false, isSpecialAbility: true, jobId: options.jobId || null, skillId: options.skillId || null, isSpecialSkillEffect: Boolean(options.isSpecialSkillEffect), mutuallyExclusiveWith: Object.freeze(options.mutuallyExclusiveWith || []), enabled: options.enabled !== false });
  }
  const SPECIAL_ABILITIES = Object.freeze({
    wasteland_resilience: specialAbility('wasteland_resilience', '荒原韌性', '受到敵人直接傷害後獲得一層荒原韌性：每層傷害減免 +3%，持續 5 秒，最多 3 層；再次觸發刷新持續時間。', { unlockChapter: 3, allowedGroups: ['armor'], allowedSlots: ['cloak'] }),
    surging_battle_will: specialAbility('surging_battle_will', '戰意沸騰', '成功施放主動技能後獲得 1 層戰意：每層造成傷害 +3%，持續 6 秒，最多 3 層；再次取得刷新持續時間。', { unlockChapter: 3, allowedGroups: ['armor'], allowedSlots: ['shoulders'] }),
    crafted_rune_resonance: specialAbility('crafted_rune_resonance', '符文共鳴', '成功施放主動技能後獲得符文共鳴，持續 6 秒；下次主動技能消耗共鳴並使該次技能傷害 +15%。', { unlockChapter: 3, allowedGroups: ['armor'], allowedSlots: ['wrist'] }),
    stonebreaker_bulwark: specialAbility('stonebreaker_bulwark', '碎岩壁壘', '單次敵人直接傷害造成至少 15% 最大生命的實際 HP 損失時，防禦 +25%，持續 6 秒，冷卻 12 秒。', { unlockChapter: 3, allowedGroups: ['armor'], allowedSlots: ['armor'] }),
    warscar_counter: specialAbility('warscar_counter', '戰痕反擊', '成功格擋敵人直接攻擊後，使下一次命中的主手普通攻擊傷害 +30%。', { unlockChapter: 3, allowedGroups: ['armor'], allowedSlots: ['pants'] }),
    hunting_frenzy: specialAbility('hunting_frenzy', '獵殺狂熱', '主手普通攻擊命中同一敵人後疊加獵殺狂熱；每層使普通攻擊傷害 +4%，最多 5 層，更換目標時清除。', { unlockChapter: 3, allowedGroups: ['armor'], allowedSlots: ['gloves'] }),
    runemark_afterimage: specialAbility('runemark_afterimage', '符紋殘影', '成功閃避敵人直接攻擊後，使下一次命中的主手普通攻擊必定暴擊。', { unlockChapter: 3, allowedGroups: ['armor'], allowedSlots: ['armor'] }),
    mana_surge: specialAbility('mana_surge', '法力湧動', '成功施放並實際消耗主要資源的主動技能後，有 25% 機率返還該次實際消耗量的 50%。', { unlockChapter: 3, allowedGroups: ['armor'], allowedSlots: ['armor'] }),
    cooldown_reset_on_critical: specialAbility('cooldown_reset_on_critical', '星火回響', '暴擊時有 10% 機率重置技能冷卻。', { unlockChapter: 3 }),
    mage_fireball_burn: specialAbility('mage_fireball_burn', '燃燒火球', '火球命中時附加燃燒。', { type: 'special-skill', unlockChapter: 2, jobId: 'mage', skillId: 'fireball', isSpecialSkillEffect: true, allowedGroups: ['weapon', 'accessory'] }),
    warlord_unyielding: specialAbility('warlord_unyielding', '督軍不屈', '生命低於 30% 時，受到傷害降低 15%。', { unlockChapter: 2, allowedGroups: ['armor'], allowedSlots: ['head'] }),
    corrupted_swiftness: specialAbility('corrupted_swiftness', '腐化迅捷', '攻擊時有 10% 機率使攻擊速度提高 15%，持續 5 秒。', { unlockChapter: 2, allowedGroups: ['armor'], allowedSlots: ['boots'] }),
    deep_forest_echo: specialAbility('deep_forest_echo', '幽森回響', '施放主動技能時有 15% 機率恢復 6% 最大魔力。', { unlockChapter: 2, allowedGroups: ['accessory'], allowedSlots: ['offhand'] }),
    thorn_corrosion: specialAbility('thorn_corrosion', '荊棘侵蝕', '攻擊命中時有 15% 機率附加 5 秒持續傷害，每秒造成觸發時總攻擊力 20% 傷害；不可疊加，重複觸發刷新持續時間。', { unlockChapter: 2, allowedGroups: ['weapon'], allowedSlots: ['weapon'] })
  });
  const MUTUAL_EXCLUSIONS = Object.freeze([
    Object.freeze(['critical_chance', 'critical_damage_percent']),
    Object.freeze(['attack_flat', 'skill_damage_percent'])
  ]);
  const DEFAULT_FIXED_AFFIXES = Object.freeze({
    weapon: Object.freeze(['accuracy_percent', 'attack_speed_percent', 'critical_chance']),
    armor: Object.freeze(['max_hp_percent', 'defense_percent', 'dodge_percent']),
    accessory: Object.freeze(['critical_chance', 'cooldown_speed_percent', 'mana_regeneration_percent'])
  });
  const clampRoll = (value) => Math.min(.999999, Math.max(0, Number(value) || 0));
  function normalizeQuality(value) {
    const quality = String(value || '').toLowerCase();
    if (quality === 'legendary' || value === '傳奇') return QUALITY.legendary;
    if (quality === 'epic' || value === '紫色') return QUALITY.epic;
    if (quality === 'rare' || value === '藍色' || value === '稀有') return QUALITY.rare;
    if (quality === 'uncommon' || value === '綠色' || value === '優良') return QUALITY.uncommon;
    return QUALITY.common;
  }
  function getQualityLabel(itemOrQuality) { return QUALITY_LABELS[normalizeQuality(typeof itemOrQuality === 'object' ? itemOrQuality?.quality || itemOrQuality?.rarity : itemOrQuality)]; }
  function getEquipmentGroup(item) { return item?.kind === 'equipment' ? SLOT_GROUPS[item.slot] || null : null; }
  function getRuleCount(value, random = Math.random) {
    if (!Array.isArray(value)) return Math.max(0, Number(value) || 0);
    const min = Math.max(0, Number(value[0]) || 0); const max = Math.max(min, Number(value[1]) || min);
    return min + Math.floor(clampRoll(random()) * (max - min + 1));
  }
  function normalizeChapter(value) { return Math.max(1, Math.floor(Number(value) || 1)); }
  function getItemJobs(item) { return [...new Set([...(item?.allowedJobs || []), ...(item?.allowedClasses || [])])]; }
  function isJobCompatible(definition, item, context = {}) {
    if (!definition.jobId) return true;
    const jobs = getItemJobs(item);
    return jobs.includes(definition.jobId) && (!context.jobId || context.jobId === definition.jobId);
  }
  function isDefinitionUnlocked(definition, item, context = {}) {
    const quality = normalizeQuality(context.quality || item?.quality || item?.rarity || QUALITY.uncommon);
    const chapter = normalizeChapter(context.chapter || item?.affixChapter);
    const group = getEquipmentGroup(item);
    return Boolean(definition?.enabled
      && definition.unlockChapter <= chapter
      && (definition.maxChapter == null || chapter <= definition.maxChapter)
      && definition.qualities.includes(quality)
      && definition.allowedGroups.includes(group)
      && (!definition.allowedSlots.length || definition.allowedSlots.includes(item?.slot))
      && isJobCompatible(definition, item, context));
  }
  function getGeneralAffixTierMultiplier(chapter) {
    const tier = Math.min(2, normalizeChapter(chapter));
    return GENERAL_AFFIX_TIER_MULTIPLIERS[tier] || 1;
  }
  function getChapterValue(valuesByChapter, chapter, fallback) {
    const entries = Object.entries(valuesByChapter || {}).map(([key, value]) => [Number(key), Number(value)]).filter(([key, value]) => Number.isFinite(key) && Number.isFinite(value) && key <= chapter).sort((a, b) => b[0] - a[0]);
    return entries.length ? entries[0][1] : fallback;
  }
  function materializeAffix(id, source = 'random', chapter = 1) {
    const definition = EQUIPMENT_AFFIXES[id];
    if (!definition?.enabled) return null;
    const normalizedChapter = normalizeChapter(chapter);
    const valueTier = normalizedChapter;
    const multiplier = definition.unlockChapter === 1 && !Object.keys(definition.valuesByChapter).length ? getGeneralAffixTierMultiplier(normalizedChapter) : 1;
    const components = definition.components.map((entry) => ({ ...entry, value: Object.keys(entry.valuesByChapter || {}).length ? getChapterValue(entry.valuesByChapter, normalizedChapter, Number(entry.value) || 0) : Math.round((Number(entry.value) || 0) * multiplier) }));
    return { id, name: definition.name, type: definition.type, stat: definition.stat, value: components.length === 1 ? components[0].value : definition.value, unit: definition.unit, components, isComposite: definition.isComposite, jobId: definition.jobId, skillId: definition.skillId, source, valueTier };
  }
  function normalizeAffix(raw, source = raw?.source || 'random', chapter = 1) {
    const definition = EQUIPMENT_AFFIXES[raw?.id];
    if (!definition?.enabled) return Array.isArray(raw?.components) && raw?.customFixed
      ? { ...raw, source, components: raw.components.map((entry) => ({ ...entry })) }
      : null;
    return materializeAffix(definition.id, source, chapter);
  }
  function conflicts(candidate, selected) {
    const candidateStats = candidate.components.map((entry) => entry.stat);
    if (selected.some((entry) => entry.id === candidate.id || (entry.components || EQUIPMENT_AFFIXES[entry.id]?.components || []).some((component) => candidateStats.includes(component.stat)))) return true;
    if (candidate.exclusionGroups.some((group) => selected.some((entry) => EQUIPMENT_AFFIXES[entry.id]?.exclusionGroups.includes(group)))) return true;
    if (candidate.mutuallyExclusiveWith.some((id) => selected.some((entry) => entry.id === id))) return true;
    if (selected.some((entry) => EQUIPMENT_AFFIXES[entry.id]?.mutuallyExclusiveWith.includes(candidate.id))) return true;
    return MUTUAL_EXCLUSIONS.some((pair) => pair.includes(candidate.id) && selected.some((entry) => pair.includes(entry.id)));
  }
  function getAvailableAffixes(item, selected = [], context = {}) {
    return Object.values(EQUIPMENT_AFFIXES).filter((entry) => entry.rollable && isDefinitionUnlocked(entry, item, context) && !conflicts(entry, selected));
  }
  function weightedPick(candidates, random) {
    const total = candidates.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0);
    let cursor = clampRoll(random()) * total;
    return candidates.find((entry) => ((cursor -= entry.weight) < 0)) || candidates[candidates.length - 1] || null;
  }
  function rollEquipmentAffixes(item, count, random = Math.random, _legacyMultiplier = 1, selected = [], context = {}) {
    const result = [];
    while (result.length < count) {
      const candidate = weightedPick(getAvailableAffixes(item, [...selected, ...result], context), random);
      if (!candidate) break;
      result.push(materializeAffix(candidate.id, 'random', context.chapter));
    }
    return result;
  }
  function rollRange(min, max, random) {
    const lower = Number(min) || 0; const upper = Math.max(lower, Number(max) || lower);
    return lower + Math.floor(clampRoll(random()) * (upper - lower + 1));
  }
  function getFixedAffixes(template, count, context = {}, random = Math.random) {
    if (Array.isArray(template?.fixedAffixDefinitions)) return template.fixedAffixDefinitions.slice(0, count).map((entry) => {
      const value = rollRange(entry.min, entry.max, random);
      return { id: entry.id, name: entry.name, type: 'stat', stat: entry.stat, value, unit: entry.unit || '', components: [{ stat: entry.stat, value, unit: entry.unit || '' }], source: 'fixed', customFixed: true };
    });
    const group = getEquipmentGroup(template);
    const configured = Array.isArray(template?.fixedAffixIds) ? template.fixedAffixIds : DEFAULT_FIXED_AFFIXES[group] || [];
    return configured.filter((id) => isDefinitionUnlocked(EQUIPMENT_AFFIXES[id], template, context)).map((id) => materializeAffix(id, 'fixed', context.chapter)).filter(Boolean).slice(0, count);
  }
  function rollSpecialAbility(template, quality, random, chance, context = {}) {
    if (!['epic', 'legendary'].includes(quality) || random() >= chance) return null;
    const ids = Array.isArray(template.specialAbilityIds) ? template.specialAbilityIds : [];
    const candidates = ids.map((id) => SPECIAL_ABILITIES[id]).filter((entry) => isDefinitionUnlocked(entry, template, { ...context, quality }));
    const selected = weightedPick(candidates, random);
    return selected ? { ...selected, qualities: [...selected.qualities], allowedGroups: [...selected.allowedGroups], allowedSlots: [...selected.allowedSlots], mutuallyExclusiveWith: [...selected.mutuallyExclusiveWith] } : null;
  }
  function createEquipmentInstance(template, options = {}) {
    const quality = normalizeQuality(options.quality ?? template?.quality);
    const baseRule = QUALITY_AFFIX_RULES[quality]; const rule = { ...baseRule, ...(template?.affixRuleOverride || {}) }; const random = typeof options.random === 'function' ? options.random : Math.random;
    const context = { chapter: normalizeChapter(options.chapter || template.affixChapter), quality, jobId: options.jobId || null };
    const fixedAffixes = getFixedAffixes(template, getRuleCount(rule.fixedCount, random), context, random);
    const randomAffixes = rollEquipmentAffixes(template, getRuleCount(rule.randomCount, random), random, 1, fixedAffixes, context);
    const item = { ...template, id: options.uniqueId === undefined ? template.id : `${template.id}-${options.uniqueId}`, baseItemId: template.baseItemId || template.id, affixSchemaVersion: SCHEMA_VERSION, affixChapter: context.chapter, quality, rarity: quality, fixedAffixes, randomAffixes, affixes: [...fixedAffixes, ...randomAffixes], specialAbility: rollSpecialAbility(template, quality, random, Number(options.specialChance ?? rule.specialChance) || 0, context) };
    if (quality === QUALITY.legendary) item.legendaryAbility = template.legendaryAbility ? { ...template.legendaryAbility } : null;
    return item;
  }
  function normalizeEquipment(item) {
    if (!item || item.kind !== 'equipment') return item;
    if (Array.isArray(item.fixedAffixes) || Array.isArray(item.randomAffixes)) {
      const chapter = normalizeChapter(item.affixChapter);
      const fixedAffixes = (item.fixedAffixes || []).map((entry) => normalizeAffix(entry, 'fixed', chapter)).filter(Boolean);
      const randomAffixes = (item.randomAffixes || []).map((entry) => normalizeAffix(entry, 'random', chapter)).filter((entry) => entry && !conflicts(EQUIPMENT_AFFIXES[entry.id], fixedAffixes)).filter(Boolean);
      return { ...item, quality: normalizeQuality(item.quality || item.rarity), rarity: normalizeQuality(item.rarity || item.quality), fixedAffixes, randomAffixes, affixes: [...fixedAffixes, ...randomAffixes] };
    }
    const legacyAffixes = (item.affixes || []).map((entry) => normalizeAffix(entry, entry.source || 'random')).filter(Boolean);
    return { ...item, quality: normalizeQuality(item.quality || item.rarity), rarity: normalizeQuality(item.rarity || item.quality), affixes: legacyAffixes };
  }
  function rollEquipmentAffix(item, randomValue = Math.random(), context = {}) { return rollEquipmentAffixes(item, 1, () => randomValue, 1, [], context)[0] || null; }
  function getDefinitionComponents(entry) { return Array.isArray(entry?.components) ? entry.components : EQUIPMENT_AFFIXES[entry?.id]?.components || []; }
  function getAffixValue(item, stat) { return (item?.affixes || []).reduce((sum, entry) => sum + getDefinitionComponents(entry).filter((component) => component.stat === stat).reduce((subtotal, component) => subtotal + (Number(component.value) || 0), 0), 0); }
  function getEquippedAffixStats(equipmentBySlot) { return Object.values(equipmentBySlot || {}).filter(Boolean).reduce((totals, item) => { (item.affixes || []).forEach((entry) => getDefinitionComponents(entry).forEach((component) => { totals[component.stat] = (totals[component.stat] || 0) + (Number(component.value) || 0); })); return totals; }, {}); }
  function formatAffix(entry) { const definition = EQUIPMENT_AFFIXES[entry?.id]; if (!definition?.enabled) return entry?.customFixed ? `${entry.name} +${entry.value}${entry.unit || ''}` : ''; const storedComponents = Array.isArray(entry?.components) && entry.components.length ? entry.components : null; const components = storedComponents || (definition.components.length === 1 && Number.isFinite(Number(entry?.value)) ? [{ ...definition.components[0], value: Number(entry.value), unit: entry.unit ?? definition.components[0].unit }] : definition.components); const name = definition.name; if (definition.description && components.length === 1) return `${name}｜${definition.description.replace('{value}', components[0].value)}`; if (components.length === 1) return `${name} +${components[0].value}${components[0].unit || ''}`; return `${name}（${components.map((component) => `${component.stat} +${component.value}${component.unit || ''}`).join('、')}）`; }
  return Object.freeze({ SCHEMA_VERSION, QUALITY, QUALITY_LABELS, QUALITY_AFFIX_RULES, SLOT_GROUPS, AFFIX_TYPES, ROLLABLE_QUALITIES, EQUIPMENT_AFFIXES, SPECIAL_ABILITIES, MUTUAL_EXCLUSIONS, DEFAULT_FIXED_AFFIXES, normalizeQuality, normalizeChapter, getQualityLabel, getEquipmentGroup, getRuleCount, isJobCompatible, isDefinitionUnlocked, normalizeAffix, normalizeEquipment, getAvailableAffixes, rollEquipmentAffix, rollEquipmentAffixes, rollSpecialAbility, createEquipmentInstance, getAffixValue, getEquippedAffixStats, formatAffix });
}));
