(function attachEquipmentDropPolicy(root, factory) {
  const equipmentPolicy = typeof module === 'object' && module.exports ? require('./equipment-policy.js') : root.EquipmentPolicy;
  const affixPolicy = typeof module === 'object' && module.exports ? require('./equipment-affix-policy.js') : root.EquipmentAffixPolicy;
  const api = factory(equipmentPolicy, affixPolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EquipmentDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEquipmentDropPolicy(EquipmentPolicy, EquipmentAffixPolicy) {
  const EQUIPMENT_POOLS = Object.freeze({
    plains_common_weapons: Object.freeze([
      'short-iron-sword', 'logging-hatchet', 'hunter-shortbow', 'rusty-dagger', 'apprentice-staff'
    ]),
    plains_common_armor: Object.freeze([
      'starter-recruit-plate-armor', 'leather-vest', 'apprentice-robe',
      'starter-recruit-iron-helmet', 'leather-hood', 'apprentice-mage-hat',
      'starter-recruit-iron-gauntlets', 'rough-leather-gloves', 'apprentice-gloves',
      'starter-recruit-iron-boots', 'leather-short-boots', 'apprentice-cloth-shoes'
    ])
  });

  // Phase-one QA values. Replace this one table when production rates are decided.
  const TEST_LOOT_CONFIGS = Object.freeze({
    normal: Object.freeze({
      equipmentDropRate: .25,
      rarityWeights: Object.freeze({ common: 90, uncommon: 10 }),
      equipmentPools: Object.freeze(['plains_common_weapons', 'plains_common_armor'])
    }),
    elite: Object.freeze({
      equipmentDropRate: .40,
      rarityWeights: Object.freeze({ common: 50, uncommon: 50 }),
      equipmentPools: Object.freeze(['plains_common_weapons', 'plains_common_armor'])
    }),
    boss: Object.freeze({
      equipmentDropRate: 1,
      rarityWeights: Object.freeze({ common: 40, uncommon: 60 }),
      equipmentPools: Object.freeze(['plains_common_weapons', 'plains_common_armor'])
    })
  });

  const TEMPLATE_INDEX = new Map([
    ...Object.values(EquipmentPolicy?.WEAPON_CATALOG || {}),
    ...Object.values(EquipmentPolicy?.ARMOR_CATALOG || {})
  ].map((template) => [template.id, template]));

  const BASE_STAT_KEYS = Object.freeze([
    'attack', 'attackMin', 'attackMax', 'attackSpeed', 'defense', 'hp', 'mana',
    'strength', 'intelligence', 'accuracy', 'dodge', 'attackSpeedBonus',
    'cooldownSpeedBonus', 'manaRegenBonus', 'manaRegenFlat', 'magicDamageBonus',
    'parry', 'damageReduction', 'movementSpeedBonus'
  ]);

  let instanceSequence = 0;

  function warn(message, details, warningHandler = console.warn) {
    if (typeof warningHandler === 'function') warningHandler(`[EquipmentDrop] ${message}`, details || '');
  }

  function clampRoll(value) {
    return Math.min(.999999, Math.max(0, Number(value) || 0));
  }

  function weightedPick(entries, randomValue, warningHandler) {
    const valid = entries.filter((entry) => Number(entry.weight) > 0);
    const total = valid.reduce((sum, entry) => sum + Number(entry.weight), 0);
    if (total <= 0) {
      warn('抽取權重總和為 0，已略過本次裝備掉落。', entries, warningHandler);
      return null;
    }
    let cursor = clampRoll(randomValue) * total;
    return valid.find((entry) => ((cursor -= Number(entry.weight)) < 0))?.value || valid[valid.length - 1].value;
  }

  function rollRarity(rarityWeights, randomValue, warningHandler) {
    const weights = rarityWeights && typeof rarityWeights === 'object' ? rarityWeights : {};
    return weightedPick([
      { value: 'common', weight: weights.common },
      { value: 'uncommon', weight: weights.uncommon }
    ], randomValue, warningHandler);
  }

  function getTemplatesFromPools(poolIds, warningHandler) {
    if (!Array.isArray(poolIds) || !poolIds.length) {
      warn('怪物沒有設定 equipmentPools，已略過本次裝備掉落。', poolIds, warningHandler);
      return [];
    }
    const templates = [];
    poolIds.forEach((poolId) => {
      const templateIds = EQUIPMENT_POOLS[poolId];
      if (!templateIds) {
        warn(`裝備池不存在：${poolId}`, null, warningHandler);
        return;
      }
      if (!templateIds.length) {
        warn(`裝備池為空：${poolId}`, null, warningHandler);
        return;
      }
      templateIds.forEach((templateId) => {
        const template = TEMPLATE_INDEX.get(templateId);
        if (template) templates.push(template);
        else warn(`裝備模板不存在：${templateId}`, { poolId }, warningHandler);
      });
    });
    return templates;
  }

  function createInstanceId(now = Date.now(), randomValue = Math.random()) {
    instanceSequence = (instanceSequence + 1) % 1679616;
    const timePart = Math.max(0, Number(now) || Date.now()).toString(36);
    const randomPart = Math.floor(clampRoll(randomValue) * 2176782336).toString(36).padStart(6, '0');
    return `eq-${timePart}-${randomPart}-${instanceSequence.toString(36)}`;
  }

  function getBaseStats(template) {
    return Object.fromEntries(BASE_STAT_KEYS
      .filter((stat) => Number.isFinite(Number(template?.[stat])))
      .map((stat) => [stat, Number(template[stat])]));
  }

  function createEquipmentDropInstance(template, options = {}) {
    if (!template || template.kind !== 'equipment') {
      warn('無法建立掉落實例：裝備模板不存在或格式錯誤。', template, options.warningHandler);
      return null;
    }
    const rarity = EquipmentAffixPolicy.normalizeQuality(options.rarity);
    const instanceId = String(options.instanceId || createInstanceId(options.obtainedAt, options.instanceRandomValue));
    const generated = EquipmentAffixPolicy.createEquipmentInstance(template, {
      quality: rarity,
      uniqueId: instanceId,
      randomValue: options.affixRandomValue
    });
    const armorCategory = EquipmentPolicy.getArmorCategory(template);
    const allowedClasses = [...(template.allowedJobs?.length
      ? template.allowedJobs
      : EquipmentPolicy.ARMOR_CATEGORY_JOBS?.[armorCategory] || [])];
    return {
      ...generated,
      id: instanceId,
      instanceId,
      templateId: template.id,
      baseItemId: template.id,
      rarity: generated.quality,
      quality: generated.quality,
      slot: template.slot,
      equipmentType: template.weaponType || template.armorType || template.series || template.slot,
      allowedClasses,
      allowedJobs: [...allowedClasses],
      baseStats: getBaseStats(template),
      affixes: generated.affixes.map((entry) => ({ ...entry })),
      sockets: 0,
      obtainedFrom: String(options.obtainedFrom || ''),
      obtainedAt: Math.max(0, Number(options.obtainedAt) || Date.now())
    };
  }

  function createUniqueInstance(template, inventory, options) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const requestedId = typeof options.instanceIdFactory === 'function'
        ? options.instanceIdFactory(attempt)
        : createInstanceId(options.obtainedAt, options.random());
      if (inventory.some((item) => item?.instanceId === requestedId || item?.id === requestedId)) {
        warn(`偵測到重複 instanceId，正在重新產生：${requestedId}`, { attempt }, options.warningHandler);
        continue;
      }
      return createEquipmentDropInstance(template, {
        rarity: options.rarity,
        instanceId: requestedId,
        affixRandomValue: options.random(),
        obtainedFrom: options.obtainedFrom,
        obtainedAt: options.obtainedAt,
        warningHandler: options.warningHandler
      });
    }
    warn('連續產生重複 instanceId，已取消本次裝備掉落。', null, options.warningHandler);
    return null;
  }

  function grantEquipmentDrop(progress, enemy, options = {}) {
    const warningHandler = options.warningHandler || console.warn;
    if (!progress || typeof progress !== 'object') {
      warn('玩家進度資料不存在，無法加入裝備。', progress, warningHandler);
      return null;
    }
    if (!Array.isArray(progress.inventory)) {
      warn('背包資料未初始化，已自動建立空背包。', progress.inventory, warningHandler);
      progress.inventory = [];
    }
    const config = enemy?.lootConfig;
    if (!config || typeof config !== 'object') return null;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const dropRate = Math.min(1, Math.max(0, Number(config.equipmentDropRate) || 0));
    if (random() >= dropRate) return null;
    const rarity = rollRarity(config.rarityWeights, random(), warningHandler);
    if (!rarity) return null;
    const templates = getTemplatesFromPools(config.equipmentPools, warningHandler);
    if (!templates.length) {
      warn('指定的裝備池沒有任何合法模板，已略過本次掉落。', config.equipmentPools, warningHandler);
      return null;
    }
    const template = templates[Math.floor(clampRoll(random()) * templates.length)];
    const item = createUniqueInstance(template, progress.inventory, {
      rarity,
      random,
      instanceIdFactory: options.instanceIdFactory,
      obtainedFrom: enemy.id || enemy.name || 'unknown-monster',
      obtainedAt: options.obtainedAt || Date.now(),
      warningHandler
    });
    if (!item) return null;
    try {
      progress.inventory.push(item);
    } catch (error) {
      warn('背包無法寫入，已取消本次裝備掉落且戰鬥可繼續。', error, warningHandler);
      return null;
    }
    return item;
  }

  return {
    EQUIPMENT_POOLS,
    TEST_LOOT_CONFIGS,
    rollRarity,
    getTemplatesFromPools,
    createInstanceId,
    createEquipmentDropInstance,
    grantEquipmentDrop
  };
}));
