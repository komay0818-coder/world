(function attachEquipmentAffixPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EquipmentAffixPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEquipmentAffixPolicy() {
  const QUALITY = Object.freeze({ common: 'common', uncommon: 'uncommon' });
  const QUALITY_LABELS = Object.freeze({ common: '白色', uncommon: '綠色' });
  const SLOT_GROUPS = Object.freeze({
    weapon: 'weapon',
    head: 'armor', shoulders: 'armor', armor: 'armor', wrist: 'armor', gloves: 'armor',
    pants: 'armor', boots: 'armor', cloak: 'armor',
    necklace: 'accessory', ring: 'accessory', ring1: 'accessory', ring2: 'accessory'
  });

  function affix(id, name, stat, value, weight, allowedGroups, enabled = true, disabledReason = '') {
    return Object.freeze({ id, name, stat, value, weight, allowedGroups: Object.freeze(allowedGroups), enabled, disabledReason });
  }

  const EQUIPMENT_AFFIXES = Object.freeze({
    // The game has no primary-attribute model yet. Keep these definitions ready, but do not roll inert UI-only stats.
    strength_percent: affix('strength_percent', '力量', 'strengthPercent', 5, 12, ['weapon', 'armor'], false, '尚未建立角色力量百分比計算'),
    agility_percent: affix('agility_percent', '敏捷', 'agilityPercent', 5, 12, ['weapon', 'armor'], false, '尚未建立角色敏捷屬性'),
    intelligence_percent: affix('intelligence_percent', '智慧', 'intelligencePercent', 5, 12, ['weapon', 'armor'], false, '尚未建立角色智慧百分比計算'),
    max_hp_percent: affix('max_hp_percent', '最大生命', 'maxHpPercent', 8, 10, ['armor']),
    defense_percent: affix('defense_percent', '防禦', 'defensePercent', 8, 10, ['armor']),
    accuracy_percent: affix('accuracy_percent', '命中', 'accuracyPercent', 5, 8, ['weapon']),
    dodge_percent: affix('dodge_percent', '閃避', 'dodgePercent', 5, 8, ['armor']),
    attack_speed_percent: affix('attack_speed_percent', '攻擊速度', 'attackSpeedPercent', 5, 6, ['weapon']),
    critical_chance: affix('critical_chance', '暴擊率', 'criticalChance', 3, 5, ['weapon', 'accessory']),
    critical_damage_percent: affix('critical_damage_percent', '暴擊傷害', 'criticalDamagePercent', 10, 5, ['weapon'], false, '目前暴擊倍率固定為 150%'),
    cooldown_speed_percent: affix('cooldown_speed_percent', '冷卻速度', 'cooldownSpeedPercent', 5, 5, ['armor', 'accessory']),
    mana_regeneration_percent: affix('mana_regeneration_percent', '魔力恢復', 'manaRegenerationPercent', 10, 6, ['armor', 'accessory']),
    experience_gain_percent: affix('experience_gain_percent', '經驗值獲得', 'experienceGainPercent', 5, 3, ['accessory'], false, '尚未接入獎勵結算'),
    gold_gain_percent: affix('gold_gain_percent', '金幣獲得', 'goldGainPercent', 5, 3, ['accessory'], false, '尚未接入獎勵結算'),
    item_find_percent: affix('item_find_percent', '掉寶率', 'itemFindPercent', 5, 3, ['accessory'], false, '尚未接入掉落機率計算')
  });

  function getEquipmentGroup(equipment) {
    if (!equipment || equipment.kind !== 'equipment') return null;
    // Existing shields, quivers and spellbooks retain their dedicated offhand affix rules.
    if (equipment.slot === 'offhand') return null;
    return SLOT_GROUPS[equipment.slot] || null;
  }

  function normalizeQuality(quality) {
    if (quality === QUALITY.uncommon || quality === '優良' || quality === '綠色') return QUALITY.uncommon;
    return QUALITY.common;
  }

  function getQualityLabel(itemOrQuality) {
    const quality = typeof itemOrQuality === 'object' ? normalizeQuality(itemOrQuality?.quality) : normalizeQuality(itemOrQuality);
    return QUALITY_LABELS[quality];
  }

  function normalizeAffix(rawAffix) {
    const definition = EQUIPMENT_AFFIXES[rawAffix?.id];
    if (!definition || !definition.enabled) return null;
    const value = Number(rawAffix.value);
    return {
      id: definition.id,
      name: definition.name,
      stat: definition.stat,
      value: Number.isFinite(value) ? value : definition.value
    };
  }

  function normalizeEquipment(equipment) {
    if (!equipment || equipment.kind !== 'equipment') return equipment;
    const requestedQuality = getEquipmentGroup(equipment) ? normalizeQuality(equipment.quality) : QUALITY.common;
    const affixes = (Array.isArray(equipment.affixes) ? equipment.affixes : [])
      .map(normalizeAffix)
      .filter(Boolean)
      .slice(0, requestedQuality === QUALITY.uncommon ? 1 : 0);
    const quality = requestedQuality === QUALITY.uncommon && affixes.length === 1 ? QUALITY.uncommon : QUALITY.common;
    return { ...equipment, quality, affixes };
  }

  function getAvailableAffixes(equipment) {
    const group = getEquipmentGroup(equipment);
    if (!group) return [];
    return Object.values(EQUIPMENT_AFFIXES).filter((entry) => entry.enabled && entry.allowedGroups.includes(group));
  }

  function rollEquipmentAffix(equipment, randomValue = Math.random()) {
    const candidates = getAvailableAffixes(equipment);
    if (!candidates.length) return null;
    const totalWeight = candidates.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = Math.min(.999999, Math.max(0, Number(randomValue) || 0)) * totalWeight;
    const selected = candidates.find((entry) => ((cursor -= entry.weight) < 0)) || candidates[candidates.length - 1];
    return { id: selected.id, name: selected.name, stat: selected.stat, value: selected.value };
  }

  function createEquipmentInstance(template, options = {}) {
    const quality = normalizeQuality(options.quality ?? template?.quality);
    const item = {
      ...template,
      id: options.uniqueId === undefined ? template.id : `${template.id}-${options.uniqueId}`,
      baseItemId: template.baseItemId || template.id,
      quality,
      affixes: []
    };
    if (quality === QUALITY.uncommon) {
      const rolled = rollEquipmentAffix(item, options.randomValue);
      if (rolled) item.affixes = [rolled];
      else item.quality = QUALITY.common;
    }
    return item;
  }

  function getAffixValue(equipment, stat) {
    return (Array.isArray(equipment?.affixes) ? equipment.affixes : [])
      .filter((entry) => entry?.stat === stat && EQUIPMENT_AFFIXES[entry.id]?.enabled)
      .reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
  }

  function getEquippedAffixStats(equipmentBySlot) {
    return Object.values(equipmentBySlot || {}).filter(Boolean).reduce((totals, item) => {
      (Array.isArray(item.affixes) ? item.affixes : []).forEach((entry) => {
        if (!EQUIPMENT_AFFIXES[entry?.id]?.enabled) return;
        totals[entry.stat] = (totals[entry.stat] || 0) + (Number(entry.value) || 0);
      });
      return totals;
    }, {});
  }

  function formatAffix(entry) {
    const definition = EQUIPMENT_AFFIXES[entry?.id];
    if (!definition || !definition.enabled) return '';
    return `${definition.name} +${Number(entry.value) || definition.value}%`;
  }

  return {
    QUALITY, QUALITY_LABELS, EQUIPMENT_AFFIXES,
    getEquipmentGroup, normalizeQuality, getQualityLabel, normalizeEquipment,
    getAvailableAffixes, rollEquipmentAffix, createEquipmentInstance,
    getAffixValue, getEquippedAffixStats, formatAffix
  };
}));
