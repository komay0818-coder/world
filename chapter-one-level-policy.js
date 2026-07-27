(function attachChapterOneLevelPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterOneLevelPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterOneLevelPolicy() {
  const CHAPTER_MAP_IDS = Object.freeze(['plains-entrance', 'wolf-den', 'boar-woods', 'goblin-camp', 'plains-depths']);
  const GROWTH = Object.freeze({ hpPerLevel: .12, attackPerLevel: .08, defensePerLevel: .07, expPerLevel: .10 });
  const HIT = Object.freeze({
    playerPenaltyPerLevel: .075,
    playerBonusPerLevel: .015,
    playerMinimum: .25,
    playerMaximum: .99,
    monsterBase: .88,
    monsterBonusPerLevel: .018,
    monsterMinimum: .45,
    monsterMaximum: .99
  });

  function profile(mapId, monsterType, level, baseHp, baseAttack, baseDefense, baseExp, rank = 'normal') {
    return Object.freeze({
      level: Object.freeze(Array.isArray(level) ? [...level] : [level, level]),
      baseHp,
      baseAttack,
      baseDefense,
      baseExp,
      mapId,
      monsterType,
      isElite: rank === 'elite',
      isBoss: rank === 'boss'
    });
  }

  const MONSTER_PROFILES = Object.freeze({
    'plains-entrance': Object.freeze({
      plainsRabbit: profile('plains-entrance', 'plainsRabbit', [1, 2], 24, 5, 0, 4),
      plainsWolfPup: profile('plains-entrance', 'plainsWolfPup', [1, 3], 34, 7, 1, 4),
      plainsSlime: profile('plains-entrance', 'plainsSlime', [1, 2], 30, 6, 0, 4),
      plainsGoblinYoung: profile('plains-entrance', 'plainsGoblinYoung', [2, 3], 40, 8, 2, 4),
      lostGoblin: profile('plains-entrance', 'lostGoblin', 4, 62, 10, 4, 10, 'elite')
    }),
    'wolf-den': Object.freeze({
      plainsWolfPup: profile('wolf-den', 'plainsWolfPup', 3, 34, 7, 1, 6),
      denForestWolf: profile('wolf-den', 'denForestWolf', [4, 5], 58, 11, 3, 6),
      lostGoblin: profile('wolf-den', 'lostGoblin', 5, 62, 10, 4, 6, 'rare'),
      ragingWolf: profile('wolf-den', 'ragingWolf', 6, 125, 16, 6, 16, 'elite'),
      greatfangWolf: profile('wolf-den', 'greatfangWolf', 7, 480, 21, 12, 80, 'boss')
    }),
    'boar-woods': Object.freeze({
      boarPiglet: profile('boar-woods', 'boarPiglet', 6, 48, 9, 4, 8),
      forestBoar: profile('boar-woods', 'forestBoar', [7, 8], 78, 13, 8, 8),
      lostGoblin: profile('boar-woods', 'lostGoblin', 8, 62, 10, 4, 8, 'rare'),
      irritableBoar: profile('boar-woods', 'irritableBoar', 9, 165, 19, 13, 20, 'elite'),
      boarKing: profile('boar-woods', 'boarKing', 10, 620, 24, 20, 95, 'boss')
    }),
    'goblin-camp': Object.freeze({
      goblinScout: profile('goblin-camp', 'goblinScout', [8, 9], 48, 10, 2, 10),
      goblinWarrior: profile('goblin-camp', 'goblinWarrior', [8, 10], 82, 13, 7, 10),
      goblinSlinger: profile('goblin-camp', 'goblinSlinger', [9, 10], 58, 14, 3, 10),
      goblinTreasureChest: profile('goblin-camp', 'goblinTreasureChest', 10, 210, 1, 18, 10, 'rare'),
      goblinShaman: profile('goblin-camp', 'goblinShaman', 11, 175, 17, 8, 28, 'elite'),
      goblinGuard: profile('goblin-camp', 'goblinGuard', 11, 245, 16, 15, 28, 'elite'),
      goblinCaptain: profile('goblin-camp', 'goblinCaptain', 12, 720, 21, 19, 120, 'boss'),
      goblinHighChief: profile('goblin-camp', 'goblinHighChief', 12, 1180, 25, 25, 120, 'boss')
    }),
    'plains-depths': Object.freeze({
      highlandWolf: profile('plains-depths', 'highlandWolf', [12, 13], 90, 14, 6, 10),
      rockbackBoar: profile('plains-depths', 'rockbackBoar', [12, 14], 115, 16, 12, 10),
      blackstoneScout: profile('plains-depths', 'blackstoneScout', [13, 14], 95, 17, 8, 10),
      grasslandVulture: profile('plains-depths', 'grasslandVulture', [12, 14], 78, 18, 4, 10),
      blackstoneRaider: profile('plains-depths', 'blackstoneRaider', 15, 230, 23, 16, 26, 'elite'),
      wanderingBlackKnight: profile('plains-depths', 'wanderingBlackKnight', 15, 280, 25, 22, 26, 'elite'),
      blackstoneLeader: profile('plains-depths', 'blackstoneLeader', 15, 850, 29, 27, 110, 'boss')
    })
  });

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function getProfile(mapId, monsterType) {
    return MONSTER_PROFILES[mapId]?.[monsterType] || null;
  }

  function rollLevel(mapId, monsterType, randomValue = Math.random()) {
    const range = getProfile(mapId, monsterType)?.level;
    if (!range) return null;
    const [minimum, maximum] = range;
    const roll = clamp(randomValue, 0, .999999);
    return minimum + Math.floor(roll * (maximum - minimum + 1));
  }

  function getGrowthMultiplier(level, perLevel) {
    return 1 + Math.max(0, Math.floor(Number(level) || 1) - 1) * perLevel;
  }

  function scaleMonster(monster = {}, mapId, level) {
    const data = getProfile(mapId, monster.id);
    if (!data) return monster;
    const resolvedLevel = clamp(level || data.level[0], data.level[0], data.level[1]);
    return {
      ...monster,
      level: resolvedLevel,
      baseHp: data.baseHp,
      baseAttack: data.baseAttack,
      baseDefense: data.baseDefense,
      baseExp: data.baseExp,
      mapId: data.mapId,
      monsterType: data.monsterType,
      isElite: data.isElite,
      isBoss: data.isBoss,
      maxHp: Math.max(1, Math.round(data.baseHp * getGrowthMultiplier(resolvedLevel, GROWTH.hpPerLevel))),
      attack: Math.max(1, Math.round(data.baseAttack * getGrowthMultiplier(resolvedLevel, GROWTH.attackPerLevel))),
      defense: Math.max(0, Math.round(data.baseDefense * getGrowthMultiplier(resolvedLevel, GROWTH.defensePerLevel))),
      xp: Math.max(1, Math.round(data.baseExp * getGrowthMultiplier(resolvedLevel, GROWTH.expPerLevel)))
    };
  }

  function getPlayerHitChance(playerLevel, monsterLevel, accuracy = 1, monsterEvasion = 0) {
    const difference = Math.floor(Number(monsterLevel) || 1) - Math.floor(Number(playerLevel) || 1);
    const levelAdjustment = difference > 0 ? -difference * HIT.playerPenaltyPerLevel : -difference * HIT.playerBonusPerLevel;
    return clamp((Number(accuracy) || 1) - (Number(monsterEvasion) || 0) / 100 + levelAdjustment, HIT.playerMinimum, HIT.playerMaximum);
  }

  function getMonsterHitChance(monsterLevel, playerLevel, playerDodge = 0) {
    const difference = Math.floor(Number(monsterLevel) || 1) - Math.floor(Number(playerLevel) || 1);
    return clamp(HIT.monsterBase + difference * HIT.monsterBonusPerLevel - (Number(playerDodge) || 0), HIT.monsterMinimum, HIT.monsterMaximum);
  }

  function canEnterMap(mapId) {
    return CHAPTER_MAP_IDS.includes(mapId);
  }

  return {
    CHAPTER_MAP_IDS,
    GROWTH,
    HIT,
    MONSTER_PROFILES,
    getProfile,
    rollLevel,
    getGrowthMultiplier,
    scaleMonster,
    getPlayerHitChance,
    getMonsterHitChance,
    canEnterMap
  };
}));
