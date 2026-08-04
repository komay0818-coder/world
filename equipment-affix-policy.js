(function attachEquipmentAffixPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EquipmentAffixPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEquipmentAffixPolicy() {
  const SCHEMA_VERSION = 3;
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
    weapon: 'weapon', head: 'armor', shoulders: 'armor', armor: 'armor', wrist: 'armor', gloves: 'armor',
    pants: 'armor', boots: 'armor', cloak: 'armor', necklace: 'accessory', ring: 'accessory', ring1: 'accessory', ring2: 'accessory'
  });
  function affix(id, name, stat, value, unit, weight, allowedGroups, options = {}) {
    return Object.freeze({ id, name, stat, value, unit, weight, allowedGroups: Object.freeze(allowedGroups), enabled: options.enabled !== false, exclusionGroups: Object.freeze(options.exclusionGroups || []), disabledReason: options.disabledReason || '' });
  }
  const EQUIPMENT_AFFIXES = Object.freeze({
    attack_flat: affix('attack_flat', '攻擊', 'attackFlat', 4, '', 9, ['weapon', 'armor']),
    skill_damage_percent: affix('skill_damage_percent', '技能傷害', 'skillDamagePercent', 5, '%', 6, ['weapon', 'armor']),
    max_hp_flat: affix('max_hp_flat', '生命', 'maxHp', 20, '', 9, ['weapon', 'armor', 'accessory']),
    hp_regeneration_flat: affix('hp_regeneration_flat', '生命恢復', 'hpRegeneration', 3, '', 6, ['weapon', 'armor', 'accessory']),
    max_hp_percent: affix('max_hp_percent', '最大生命', 'maxHpPercent', 8, '%', 10, ['armor']),
    defense_percent: affix('defense_percent', '防禦', 'defensePercent', 8, '%', 10, ['armor']),
    accuracy_percent: affix('accuracy_percent', '命中', 'accuracyPercent', 5, '%', 8, ['weapon']),
    dodge_percent: affix('dodge_percent', '閃避', 'dodgePercent', 5, '%', 8, ['armor']),
    attack_speed_percent: affix('attack_speed_percent', '攻擊速度', 'attackSpeedPercent', 5, '%', 6, ['weapon'], { exclusionGroups: ['speed'] }),
    critical_chance: affix('critical_chance', '暴擊率', 'criticalChance', 3, '%', 5, ['weapon', 'accessory'], { exclusionGroups: ['critical'] }),
    critical_damage_percent: affix('critical_damage_percent', '暴擊傷害', 'criticalDamagePercent', 10, '%', 5, ['weapon'], { enabled: false, exclusionGroups: ['critical'], disabledReason: '目前暴擊倍率固定為 150%' }),
    cooldown_speed_percent: affix('cooldown_speed_percent', '冷卻速度', 'cooldownSpeedPercent', 5, '%', 5, ['armor', 'accessory'], { exclusionGroups: ['speed'] }),
    mana_regeneration_percent: affix('mana_regeneration_percent', '魔力恢復', 'manaRegenerationPercent', 10, '%', 6, ['armor', 'accessory']),
    experience_gain_percent: affix('experience_gain_percent', '經驗值獲得', 'experienceGainPercent', 5, '%', 3, ['accessory'], { enabled: false, disabledReason: '尚未接入獎勵結算' }),
    gold_gain_percent: affix('gold_gain_percent', '金幣獲得', 'goldGainPercent', 5, '%', 3, ['accessory'], { enabled: false, disabledReason: '尚未接入獎勵結算' }),
    item_find_percent: affix('item_find_percent', '掉寶率', 'itemFindPercent', 5, '%', 3, ['accessory'], { enabled: false, disabledReason: '尚未接入掉落機率計算' })
  });
  const SPECIAL_ABILITIES = Object.freeze({
    cooldown_reset_on_critical: Object.freeze({ id: 'cooldown_reset_on_critical', name: '星火回響', description: '暴擊時有 10% 機率重置技能冷卻。', enabled: false })
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
  function getEquipmentGroup(item) { return item?.kind === 'equipment' && item.slot !== 'offhand' ? SLOT_GROUPS[item.slot] || null : null; }
  function getRuleCount(value, random = Math.random) {
    if (!Array.isArray(value)) return Math.max(0, Number(value) || 0);
    const min = Math.max(0, Number(value[0]) || 0); const max = Math.max(min, Number(value[1]) || min);
    return min + Math.floor(clampRoll(random()) * (max - min + 1));
  }
  function materializeAffix(id, source = 'random') {
    const definition = EQUIPMENT_AFFIXES[id];
    return definition?.enabled ? { id, name: definition.name, stat: definition.stat, value: definition.value, unit: definition.unit, source } : null;
  }
  function normalizeAffix(raw, source = raw?.source || 'random') {
    const definition = EQUIPMENT_AFFIXES[raw?.id];
    if (!definition?.enabled) return null;
    return materializeAffix(definition.id, source);
  }
  function conflicts(candidate, selected) {
    if (selected.some((entry) => entry.id === candidate.id || entry.stat === candidate.stat)) return true;
    if (candidate.exclusionGroups.some((group) => selected.some((entry) => EQUIPMENT_AFFIXES[entry.id]?.exclusionGroups.includes(group)))) return true;
    return MUTUAL_EXCLUSIONS.some((pair) => pair.includes(candidate.id) && selected.some((entry) => pair.includes(entry.id)));
  }
  function getAvailableAffixes(item, selected = []) {
    const group = getEquipmentGroup(item);
    return Object.values(EQUIPMENT_AFFIXES).filter((entry) => entry.enabled && entry.allowedGroups.includes(group) && !conflicts(entry, selected));
  }
  function weightedPick(candidates, random) {
    const total = candidates.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0);
    let cursor = clampRoll(random()) * total;
    return candidates.find((entry) => ((cursor -= entry.weight) < 0)) || candidates[candidates.length - 1] || null;
  }
  function rollEquipmentAffixes(item, count, random = Math.random, _legacyMultiplier = 1, selected = []) {
    const result = [];
    while (result.length < count) {
      const candidate = weightedPick(getAvailableAffixes(item, [...selected, ...result]), random);
      if (!candidate) break;
      result.push(materializeAffix(candidate.id, 'random'));
    }
    return result;
  }
  function getFixedAffixes(template, count) {
    const group = getEquipmentGroup(template);
    const configured = Array.isArray(template?.fixedAffixIds) ? template.fixedAffixIds : DEFAULT_FIXED_AFFIXES[group] || [];
    return configured.map((id) => materializeAffix(id, 'fixed')).filter(Boolean).slice(0, count);
  }
  function rollSpecialAbility(template, quality, random, chance) {
    if (quality !== QUALITY.epic || random() >= chance) return null;
    const ids = Array.isArray(template.specialAbilityIds) ? template.specialAbilityIds : [];
    const candidates = ids.map((id) => SPECIAL_ABILITIES[id]).filter((entry) => entry?.enabled);
    return candidates[Math.floor(clampRoll(random()) * candidates.length)] || null;
  }
  function createEquipmentInstance(template, options = {}) {
    const quality = normalizeQuality(options.quality ?? template?.quality);
    const rule = QUALITY_AFFIX_RULES[quality]; const random = typeof options.random === 'function' ? options.random : Math.random;
    const fixedAffixes = getFixedAffixes(template, getRuleCount(rule.fixedCount, random));
    const randomAffixes = rollEquipmentAffixes(template, getRuleCount(rule.randomCount, random), random, 1, fixedAffixes);
    const item = { ...template, id: options.uniqueId === undefined ? template.id : `${template.id}-${options.uniqueId}`, baseItemId: template.baseItemId || template.id, affixSchemaVersion: SCHEMA_VERSION, quality, rarity: quality, fixedAffixes, randomAffixes, affixes: [...fixedAffixes, ...randomAffixes], specialAbility: rollSpecialAbility(template, quality, random, Number(options.specialChance ?? rule.specialChance) || 0) };
    if (quality === QUALITY.legendary) item.legendaryAbility = template.legendaryAbility ? { ...template.legendaryAbility } : null;
    return item;
  }
  function normalizeEquipment(item) {
    if (!item || item.kind !== 'equipment') return item;
    if (item.affixSchemaVersion === SCHEMA_VERSION) {
      const fixedAffixes = (item.fixedAffixes || []).map((entry) => normalizeAffix(entry, 'fixed')).filter(Boolean);
      const randomAffixes = (item.randomAffixes || []).map((entry) => normalizeAffix(entry, 'random')).filter((entry) => entry && !conflicts(EQUIPMENT_AFFIXES[entry.id], fixedAffixes)).filter(Boolean);
      return { ...item, quality: normalizeQuality(item.quality || item.rarity), rarity: normalizeQuality(item.rarity || item.quality), fixedAffixes, randomAffixes, affixes: [...fixedAffixes, ...randomAffixes] };
    }
    const legacyAffixes = (item.affixes || []).map((entry) => normalizeAffix(entry, entry.source || 'random')).filter(Boolean);
    return { ...item, quality: normalizeQuality(item.quality || item.rarity), rarity: normalizeQuality(item.rarity || item.quality), affixes: legacyAffixes };
  }
  function rollEquipmentAffix(item, randomValue = Math.random()) { return rollEquipmentAffixes(item, 1, () => randomValue)[0] || null; }
  function getAffixValue(item, stat) { return (item?.affixes || []).filter((entry) => entry.stat === stat && EQUIPMENT_AFFIXES[entry.id]?.enabled).reduce((sum, entry) => sum + EQUIPMENT_AFFIXES[entry.id].value, 0); }
  function getEquippedAffixStats(equipmentBySlot) { return Object.values(equipmentBySlot || {}).filter(Boolean).reduce((totals, item) => { (item.affixes || []).forEach((entry) => { const definition = EQUIPMENT_AFFIXES[entry.id]; if (definition?.enabled) totals[definition.stat] = (totals[definition.stat] || 0) + definition.value; }); return totals; }, {}); }
  function formatAffix(entry) { const definition = EQUIPMENT_AFFIXES[entry?.id]; return definition?.enabled ? `${definition.name} +${definition.value}${definition.unit || ''}` : ''; }
  return Object.freeze({ SCHEMA_VERSION, QUALITY, QUALITY_LABELS, QUALITY_AFFIX_RULES, SLOT_GROUPS, EQUIPMENT_AFFIXES, SPECIAL_ABILITIES, MUTUAL_EXCLUSIONS, DEFAULT_FIXED_AFFIXES, normalizeQuality, getQualityLabel, getEquipmentGroup, getRuleCount, normalizeAffix, normalizeEquipment, getAvailableAffixes, rollEquipmentAffix, rollEquipmentAffixes, createEquipmentInstance, getAffixValue, getEquippedAffixStats, formatAffix });
}));
