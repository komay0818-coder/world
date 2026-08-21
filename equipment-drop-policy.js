(function attachEquipmentDropPolicy(root, factory) {
  const equipmentPolicy = typeof module === 'object' && module.exports ? require('./equipment-policy.js') : root.EquipmentPolicy;
  const affixPolicy = typeof module === 'object' && module.exports ? require('./equipment-affix-policy.js') : root.EquipmentAffixPolicy;
  const api = factory(equipmentPolicy, affixPolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EquipmentDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEquipmentDropPolicy(EquipmentPolicy, EquipmentAffixPolicy) {
  function chapterTwoTemplate(id, name, slot, stats, options = {}) {
    return Object.freeze({ id, name, kind: 'equipment', slot, chapter: 2, affixChapter: 2, series: options.series || 'black-forest', image: null, imageStatus: 'pending', allowedJobs: Object.freeze(options.allowedJobs || []), ...stats, ...options });
  }
  const CHAPTER_TWO_TEMPLATES = Object.freeze([
    chapterTwoTemplate('forest-guard-longsword', '林衛長劍', 'weapon', { attackMin: 22, attackMax: 29, attackSpeed: 1.35 }, { weaponType: 'one-handed-sword', image: 'assets/forest-guard-longsword.png', imageStatus: 'ready', allowedJobs: ['warrior', 'assassin'] }),
    chapterTwoTemplate('mercenary-broadsword', '傭兵闊劍', 'weapon', { attackMin: 25, attackMax: 33, attackSpeed: 1.15 }, { weaponType: 'one-handed-sword', image: 'assets/mercenary-broadsword.png', imageStatus: 'ready', allowedJobs: ['warrior', 'assassin'] }),
    chapterTwoTemplate('woodcutter-greatsword', '斬木巨劍', 'weapon', { attackMin: 38, attackMax: 50, attackSpeed: .78 }, { weaponType: 'two-handed-sword', image: 'assets/woodcutter-greatsword.png', imageStatus: 'ready', allowedJobs: ['warrior'] }),
    chapterTwoTemplate('black-iron-greatsword', '黑鐵重劍', 'weapon', { attackMin: 43, attackMax: 57, attackSpeed: .65 }, { weaponType: 'two-handed-sword', image: 'assets/black-iron-greatsword.png', imageStatus: 'ready', allowedJobs: ['warrior'] }),
    chapterTwoTemplate('forest-felling-axe', '伐林戰斧', 'weapon', { attackMin: 24, attackMax: 32, attackSpeed: 1.05 }, { weaponType: 'one-handed-axe', image: 'assets/forest-felling-axe.png', imageStatus: 'ready', allowedJobs: ['warrior', 'assassin'] }),
    chapterTwoTemplate('bonebreaker-hatchet', '裂骨手斧', 'weapon', { attackMin: 27, attackMax: 36, attackSpeed: .90 }, { weaponType: 'one-handed-axe', image: 'assets/bonebreaker-hatchet.png', imageStatus: 'ready', allowedJobs: ['warrior', 'assassin'] }),
    chapterTwoTemplate('greatwood-battleaxe', '巨木戰斧', 'weapon', { attackMin: 41, attackMax: 54, attackSpeed: .68 }, { weaponType: 'two-handed-axe', image: 'assets/greatwood-battleaxe.png', imageStatus: 'ready', allowedJobs: ['warrior'] }),
    chapterTwoTemplate('armorbreaker-greataxe', '破甲重斧', 'weapon', { attackMin: 46, attackMax: 61, attackSpeed: .55 }, { weaponType: 'two-handed-axe', image: 'assets/armorbreaker-greataxe.png', imageStatus: 'ready', allowedJobs: ['warrior'] }),
    chapterTwoTemplate('venomfang-dagger', '毒牙匕首', 'weapon', { attackMin: 19, attackMax: 26, attackSpeed: 1.75 }, { weaponType: 'one-handed-dagger', image: 'assets/venomfang-dagger.png', imageStatus: 'ready', allowedJobs: ['assassin'] }),
    chapterTwoTemplate('darkwood-shortblade', '暗林短刃', 'weapon', { attackMin: 22, attackMax: 29, attackSpeed: 1.55 }, { weaponType: 'one-handed-dagger', image: 'assets/darkwood-shortblade.png', imageStatus: 'ready', allowedJobs: ['assassin'] }),
    chapterTwoTemplate('longbranch-hunting-bow', '長枝獵弓', 'weapon', { attackMin: 24, attackMax: 33, attackSpeed: 1.08 }, { weaponType: 'bow', image: 'assets/longbranch-hunting-bow.png', imageStatus: 'ready', allowedJobs: ['hunter'] }),
    chapterTwoTemplate('forest-piercing-longbow', '穿林長弓', 'weapon', { attackMin: 28, attackMax: 38, attackSpeed: .88 }, { weaponType: 'bow', image: 'assets/forest-piercing-longbow.png', imageStatus: 'ready', allowedJobs: ['hunter'] }),
    chapterTwoTemplate('ancient-wood-wand', '古木魔杖', 'weapon', { attackMin: 23, attackMax: 31, attackSpeed: 1.15, mana: 20 }, { weaponType: 'one-handed-wand', image: 'assets/ancient-wood-wand.png', imageStatus: 'ready', allowedJobs: ['mage', 'priest'] }),
    chapterTwoTemplate('spore-wand', '孢子魔杖', 'weapon', { attackMin: 26, attackMax: 35, attackSpeed: 1.00, mana: 26 }, { weaponType: 'one-handed-wand', image: 'assets/spore-wand.png', imageStatus: 'ready', allowedJobs: ['mage', 'priest'] }),
    chapterTwoTemplate('blackstone-corrupted-plate', '黑石腐晶戰甲', 'armor', { defense: 30, hp: 58 }, { armorType: 'heavy', allowedJobs: ['warrior'] }),
    chapterTwoTemplate('blackstone-corrupted-helm', '黑石腐晶戰盔', 'head', { defense: 18, hp: 32 }, { armorType: 'heavy', allowedJobs: ['warrior'] }),
    chapterTwoTemplate('deepwood-hunter-vest', '深林獵裝', 'armor', { defense: 23, hp: 38, dodge: 3 }, { armorType: 'light', allowedJobs: ['hunter', 'assassin'] }),
    chapterTwoTemplate('deepwood-hunter-hood', '深林兜帽', 'head', { defense: 14, hp: 24, dodge: 2 }, { armorType: 'light', allowedJobs: ['hunter', 'assassin'] }),
    chapterTwoTemplate('spiritweave-robe', '靈森法袍', 'armor', { defense: 17, hp: 30, mana: 38 }, { armorType: 'cloth', allowedJobs: ['mage'] }),
    chapterTwoTemplate('spiritweave-crown', '靈森冠帽', 'head', { defense: 10, hp: 18, mana: 24 }, { armorType: 'cloth', allowedJobs: ['mage'] })
  ]);
  const EQUIPMENT_POOLS = Object.freeze({
    plains_common_weapons: Object.freeze([
      'short-iron-sword', 'logging-hatchet', 'hunter-shortbow', 'rusty-dagger', 'apprentice-staff'
    ]),
    plains_common_armor: Object.freeze([
      'starter-recruit-plate-armor', 'leather-vest', 'apprentice-robe',
      'starter-recruit-iron-legguards', 'guard-legguards', 'leather-pants',
      'hunting-legguards', 'apprentice-cloth-pants', 'novice-priest-pants',
      'starter-recruit-iron-helmet', 'leather-hood', 'apprentice-mage-hat',
      'starter-recruit-iron-gauntlets', 'rough-leather-gloves', 'apprentice-gloves',
      'starter-recruit-iron-boots', 'leather-short-boots', 'apprentice-cloth-shoes'
    ]),
    black_forest_weapons: Object.freeze(CHAPTER_TWO_TEMPLATES.filter((item) => item.slot === 'weapon').map((item) => item.id)),
    black_forest_armor: Object.freeze(CHAPTER_TWO_TEMPLATES.filter((item) => item.slot !== 'weapon').map((item) => item.id))
  });

  // Phase-one QA values. Replace this one table when production rates are decided.
  const TEST_LOOT_CONFIGS = Object.freeze({
    normal: Object.freeze({
      equipmentDropRate: .25,
      rarityWeights: Object.freeze({ common: 60, uncommon: 40 }),
      equipmentPools: Object.freeze(['plains_common_weapons', 'plains_common_armor'])
    }),
    elite: Object.freeze({
      equipmentDropRate: .40,
      rarityWeights: Object.freeze({ common: 25, uncommon: 75 }),
      equipmentPools: Object.freeze(['plains_common_weapons', 'plains_common_armor'])
    }),
    boss: Object.freeze({
      equipmentDropRate: 1,
      rarityWeights: Object.freeze({ common: 20, uncommon: 80 }),
      equipmentPools: Object.freeze(['plains_common_weapons', 'plains_common_armor'])
    })
  });
  const CHAPTER_TWO_LOOT_CONFIGS = Object.freeze({
    normal: Object.freeze({ chapter: 2, equipmentDropRate: .25, rarityWeights: Object.freeze({ uncommon: 25, rare: 75 }), equipmentPools: Object.freeze(['black_forest_weapons', 'black_forest_armor']) }),
    elite: Object.freeze({ chapter: 2, equipmentDropRate: .40, rarityWeights: Object.freeze({ uncommon: 10, rare: 90 }), equipmentPools: Object.freeze(['black_forest_weapons', 'black_forest_armor']) }),
    boss: Object.freeze({ chapter: 2, equipmentDropRate: 1, rarityWeights: Object.freeze({ rare: 98, epic: 2 }), equipmentPools: Object.freeze(['black_forest_weapons', 'black_forest_armor']) }),
    specialDungeon: Object.freeze({ chapter: 2, specialDungeon: true, equipmentDropRate: .50, rarityWeights: Object.freeze({ rare: 99, epic: 1 }), equipmentPools: Object.freeze(['black_forest_weapons', 'black_forest_armor']) })
  });

  const TEMPLATE_INDEX = new Map([
    ...Object.values(EquipmentPolicy?.WEAPON_CATALOG || {}),
    ...Object.values(EquipmentPolicy?.ARMOR_CATALOG || {}),
    ...CHAPTER_TWO_TEMPLATES
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
      { value: 'uncommon', weight: weights.uncommon },
      { value: 'rare', weight: weights.rare },
      { value: 'epic', weight: weights.epic },
      { value: 'legendary', weight: weights.legendary }
    ], randomValue, warningHandler);
  }

  function getEnemyChapter(enemy) {
    if (Number(enemy?.chapter) >= 2 || Number(enemy?.lootConfig?.chapter) >= 2) return 2;
    const mapId = String(enemy?.mapId || '');
    return ['black-forest', 'blackstone', 'forest-altar', 'spider-nest'].some((token) => mapId.includes(token)) ? 2 : 1;
  }

  function rollChapterRarity(chapter, rarityWeights, randomValue, allowEpic, warningHandler) {
    if (chapter < 2) return rollRarity(rarityWeights, randomValue, warningHandler);
    const weights = { ...(rarityWeights || {}), common: 0, legendary: 0 };
    if (!allowEpic) weights.epic = 0;
    return rollRarity(weights, randomValue, warningHandler);
  }

  function getDefaultLootConfig(enemy) {
    if (getEnemyChapter(enemy) >= 2) {
      if (enemy?.isBoss) return CHAPTER_TWO_LOOT_CONFIGS.boss;
      if (enemy?.isElite) return CHAPTER_TWO_LOOT_CONFIGS.elite;
      return CHAPTER_TWO_LOOT_CONFIGS.normal;
    }
    if (enemy?.isBoss) return TEST_LOOT_CONFIGS.boss;
    if (enemy?.isElite) return TEST_LOOT_CONFIGS.elite;
    return TEST_LOOT_CONFIGS.normal;
  }

  function applyDefaultLootConfigs(monsterTypes) {
    return Object.fromEntries(Object.entries(monsterTypes || {}).map(([id, enemy]) => [id, {
      ...enemy,
      lootConfig: enemy?.lootConfig || getDefaultLootConfig(enemy)
    }]));
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
      randomValue: options.affixRandomValue,
      random: options.affixRandom,
      chapter: options.chapter,
      jobId: options.jobId
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
        affixRandom: options.random,
        chapter: options.chapter,
        jobId: options.jobId,
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
    const dropRateMultiplier = Math.max(1, Number(options.dropRateMultiplier) || 1);
    const dropRate = Math.min(1, Math.max(0, Number(config.equipmentDropRate) || 0) * dropRateMultiplier);
    if (random() >= dropRate) return null;
    const chapter = Math.max(1, Number(options.chapter || enemy.chapter || config.chapter) || 1);
    const rarity = rollChapterRarity(chapter, config.rarityWeights, random(), Boolean(enemy?.isBoss || config.specialDungeon), warningHandler);
    if (!rarity) return null;
    const templates = getTemplatesFromPools(config.equipmentPools, warningHandler).filter((template) => chapter < 2 || Number(template.chapter) === chapter);
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
      chapter,
      jobId: options.jobId,
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
    CHAPTER_TWO_TEMPLATES,
    EQUIPMENT_POOLS,
    TEST_LOOT_CONFIGS,
    CHAPTER_TWO_LOOT_CONFIGS,
    getDefaultLootConfig,
    applyDefaultLootConfigs,
    rollRarity,
    rollChapterRarity,
    getTemplatesFromPools,
    createInstanceId,
    createEquipmentDropInstance,
    grantEquipmentDrop
  };
}));
