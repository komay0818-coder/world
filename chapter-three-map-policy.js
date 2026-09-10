(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ChapterThreeMapPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHAPTER = Object.freeze({
    id: 'redrock-wastes',
    chapter: 3,
    name: '赤岩荒原',
    previousMapId: 'black-forest-depths',
    firstMapId: 'redrock-wastes-entrance',
    finalMapId: 'redrock-temple',
    primaryFaction: 'skullcrusher-tribe',
    secondaryFaction: 'ancient-guardians',
    firstJobChangeLevel: 45,
    recommendedLevelRange: null,
    implemented: false,
    contentStatus: 'planned',
    summary: '穿越赤岩荒原與碎顱部族戰區，追查失控的遠古力量並深入赤岩聖殿。',
    progression: Object.freeze([
      '荒原探索', '發現碎顱部族', '進入敵軍控制區', '正面戰爭',
      '攻破碎顱大本營', '發現遠古遺跡', '進入赤岩聖殿'
    ])
  });

  const FACILITY_TYPES = Object.freeze({
    supplyStation: Object.freeze({ id: 'supply-station', name: '補給站', pressure: 'hp-drain-per-second', value: null }),
    armory: Object.freeze({ id: 'armory', name: '軍械庫', pressure: 'player-damage-reduction', value: null }),
    shamanAltar: Object.freeze({ id: 'shaman-altar', name: '薩滿祭壇', pressure: 'player-defense-reduction', value: null })
  });

  function enemy(id, name, rank, traits) {
    return Object.freeze({ id, name, rank, traits: Object.freeze(traits) });
  }

  const ENEMIES = Object.freeze({
    wastelandHyena: enemy('wasteland-hyena', '荒原鬣狗', 'normal', ['high-attack-speed', 'rend-bite']),
    redrockLizard: enemy('redrock-lizard', '赤岩蜥蜴', 'normal', ['hardened-scales']),
    wastelandVulture: enemy('wasteland-vulture', '荒原禿鷹', 'normal', ['high-evasion', 'dive']),
    skullcrusherScout: enemy('skullcrusher-scout', '碎顱斥候', 'normal', ['armor-breaking-throw']),
    redrockHornbeast: enemy('redrock-hornbeast', '赤岩角獸', 'elite', ['high-health', 'frenzied-charge', 'wounded-frenzy']),
    redrockGiantLizard: enemy('redrock-giant-lizard', '赤岩巨蜥', 'boss', ['giant-jaw-rend', 'rock-armor', 'wasteland-fury']),
    skullcrusherSpearman: enemy('skullcrusher-spearman', '碎顱投矛手', 'normal', ['ranged-high-damage']),
    skullcrusherWarrior: enemy('skullcrusher-warrior', '碎顱戰士', 'normal', ['high-health', 'high-defense']),
    brokenrockBrute: enemy('brokenrock-brute', '斷岩蠻兵', 'elite', ['two-handed-weapon', 'high-health', 'high-single-hit-damage', 'rockbreaker-smash', 'temporary-defense-reduction']),
    canyonWarlord: enemy('canyon-warlord', '峽谷督軍', 'boss', ['progressive-combat-power']),
    skullcrusherBerserker: enemy('skullcrusher-berserker', '碎顱狂戰士', 'normal', ['high-attack', 'low-defense', 'low-hp-speed-up']),
    skullcrusherShieldguard: enemy('skullcrusher-shieldguard', '碎顱盾衛', 'normal', ['high-health', 'high-defense', 'shield-block']),
    skullcrusherHunter: enemy('skullcrusher-hunter', '碎顱獵手', 'normal', ['ranged', 'high-attack-speed', 'aimed-shot']),
    skullcrusherShaman: enemy('skullcrusher-shaman', '碎顱薩滿', 'normal', ['magic-support', 'weakening-curse', 'temporary-defense-reduction']),
    skullcrusherCenturion: enemy('skullcrusher-centurion', '碎顱百夫長', 'elite', ['balanced', 'progressive-attack']),
    skullcrusherVanguard: enemy('skullcrusher-vanguard-commander', '碎顱先鋒統領', 'boss', ['phase-up-75-50-25', 'armorbreaker-smash']),
    skullcrusherHeavyGuard: enemy('skullcrusher-heavy-guard', '碎顱重甲衛士', 'normal', ['extreme-defense', 'flat-physical-damage-reduction']),
    skullcrusherWolfRider: enemy('skullcrusher-wolf-rider', '碎顱戰狼騎兵', 'normal', ['high-speed-burst', 'opening-charge', 'empowered-first-hit']),
    skullcrusherChampion: enemy('skullcrusher-champion', '碎顱勇士', 'elite', ['high-health', 'high-attack', 'armor-shattering-strike', 'low-hp-damage-up']),
    skullcrusherChieftain: enemy('skullcrusher-great-chieftain', '碎顱大酋長', 'boss', ['phase-up-75-50-25', 'skullcrusher-smash']),
    skullcrusherPriest: enemy('skullcrusher-priest', '碎顱祭司', 'normal', ['magic-damage', 'ancient-curse']),
    skullcrusherFanatic: enemy('skullcrusher-fanatic', '碎顱狂信者', 'normal', ['high-attack', 'low-defense', 'missing-hp-damage-up']),
    ancientStoneguard: enemy('ancient-stoneguard', '遠古石衛', 'normal', ['high-defense', 'stone-body', 'physical-damage-reduction']),
    runeGuard: enemy('rune-guard', '符文守衛', 'normal', ['magic-damage', 'periodic-rune-shock']),
    awakenedGuard: enemy('awakened-guard', '覺醒守衛', 'elite', ['rune-awakening-below-50', 'attack-and-speed-up']),
    fallenHighPriest: enemy('fallen-high-priest', '墮落大祭司', 'boss', ['ancient-curse', 'rune-rampage', 'magic-output-up-below-50']),
    templeStoneguard: enemy('temple-stoneguard', '聖殿石衛', 'normal', ['high-defense']),
    runeGolem: enemy('rune-golem', '符文魔像', 'normal', ['magic-damage']),
    templeExecutioner: enemy('temple-executioner', '聖殿執行者', 'normal', ['slow', 'extreme-single-hit-physical-damage', 'execution-smash']),
    ancientPriest: enemy('ancient-priest', '遠古祭司', 'normal', ['magic-debuff', 'player-damage-down']),
    templeGuardian: enemy('temple-guardian', '聖殿守護者', 'elite', ['high-defense', 'attack-up-below-50'])
  });

  function map(id, order, name, facilityRequirement, options) {
    return Object.freeze({
      id, order, name, chapter: 3, regionOf: CHAPTER.id,
      min: null, max: null, recommendedLevel: null,
      implemented: false, contentStatus: 'planned',
      facilityRequirement,
      facilityPresentationStatus: order >= 5 ? 'name-and-appearance-pending' : 'skullcrusher-themed',
      suppressionValues: null,
      ...options
    });
  }

  const MAPS = Object.freeze([
    map('redrock-wastes-entrance', 1, '赤岩荒原', 10, {
      skillPolicyId: 'redrock-wastes', skillStatus: 'implemented',
      environment: Object.freeze(['乾裂紅土地', '巨型赤色岩柱', '枯木', '獸骨', '少量碎顱旗幟與營火']),
      normalEnemyIds: Object.freeze(['wasteland-hyena', 'redrock-lizard', 'wasteland-vulture', 'skullcrusher-scout']),
      eliteId: 'redrock-hornbeast', bossId: 'redrock-giant-lizard',
      story: Object.freeze({ previousMapId: 'black-forest-depths', nextMapId: 'brokenrock-canyon' })
    }),
    map('brokenrock-canyon', 2, '斷岩峽谷', 15, {
      environment: Object.freeze(['紅色峽谷', '狹窄山道', '木製吊橋', '哨塔', '路障', '碎顱旗幟', '簡易營地']),
      normalEnemyIds: Object.freeze(['wasteland-hyena', 'skullcrusher-scout', 'skullcrusher-spearman', 'skullcrusher-warrior']),
      eliteId: 'brokenrock-brute', bossId: 'canyon-warlord',
      story: Object.freeze({ previousMapId: 'redrock-wastes-entrance', nextMapId: 'bloodwar-wastes' })
    }),
    map('bloodwar-wastes', 3, '血戰荒原', 20, {
      environment: Object.freeze(['破碎攻城器', '燒毀戰車', '斷裂戰旗', '廢棄營帳', '巨獸骨骸', '拒馬', '武器殘骸', '燃燒痕跡']),
      normalEnemyIds: Object.freeze(['skullcrusher-berserker', 'skullcrusher-shieldguard', 'skullcrusher-hunter', 'skullcrusher-shaman']),
      eliteId: 'skullcrusher-centurion', bossId: 'skullcrusher-vanguard-commander',
      story: Object.freeze({ previousMapId: 'brokenrock-canyon', nextMapId: 'skullcrusher-war-camp' })
    }),
    map('skullcrusher-war-camp', 4, '碎顱戰爭營地', 25, {
      dungeon: true,
      environment: Object.freeze(['大型木製城牆', '瞭望塔', '尖刺拒馬', '戰鼓', '獸籠', '武器架', '鍛造區', '大型帳篷', '碎顱旗幟', '巨獸頭骨', '補給箱與戰車']),
      normalEnemyIds: Object.freeze(['skullcrusher-berserker', 'skullcrusher-shaman', 'skullcrusher-heavy-guard', 'skullcrusher-wolf-rider']),
      eliteId: 'skullcrusher-champion', bossId: 'skullcrusher-great-chieftain',
      story: Object.freeze({ previousMapId: 'bloodwar-wastes', nextMapId: 'ancient-altar', unlockClue: '碎顱部族正在挖掘遠古力量' })
    }),
    map('ancient-altar', 5, '遠古祭壇', 30, {
      environment: Object.freeze(['半埋紅土的巨大石柱', '遠古祭壇', '破碎石像', '發光符文', '遠古石板', '挖掘營地', '被摧毀的碎顱營帳', '聖殿入口']),
      sceneIntent: '碎顱部族成功找到遠古祭壇，但遠古力量已逐漸失控。',
      normalEnemyIds: Object.freeze(['skullcrusher-priest', 'skullcrusher-fanatic', 'ancient-stoneguard', 'rune-guard']),
      eliteId: 'awakened-guard', bossId: 'fallen-high-priest',
      story: Object.freeze({ previousMapId: 'skullcrusher-war-camp', nextMapId: 'redrock-temple', completion: '祭壇已啟動，聖殿入口無法重新封閉' })
    }),
    map('redrock-temple', 6, '赤岩聖殿', 35, {
      isFinalMap: true,
      environment: Object.freeze(['巨型石造長廊', '超大型守護者雕像', '發光符文牆壁', '巨型石門', '地下祭壇', '發光晶體', '遠古壁畫', '巨型核心裝置', '青藍與紫色符文光源']),
      normalEnemyIds: Object.freeze(['temple-stoneguard', 'rune-golem', 'temple-executioner', 'ancient-priest']),
      eliteId: 'temple-guardian', bossId: null,
      finalBossStatus: 'reserved', awakeningCoreSource: null,
      story: Object.freeze({ previousMapId: 'ancient-altar', nextMapId: null, finalStoryStatus: 'pending' })
    })
  ]);

  function getMap(mapId) { return MAPS.find((entry) => entry.id === mapId) || null; }
  function getEnemy(enemyId) { return Object.values(ENEMIES).find((entry) => entry.id === enemyId) || null; }
  function canEnter() { return false; }

  function normalizeFacilityProgress(saved) {
    const source = saved && typeof saved === 'object' ? saved : {};
    return Object.fromEntries(MAPS.map((entry) => {
      const mapState = source[entry.id] && typeof source[entry.id] === 'object' ? source[entry.id] : {};
      return [entry.id, Object.freeze(Object.fromEntries(Object.values(FACILITY_TYPES).map((facility) => [
        facility.id, Math.max(0, Math.floor(Number(mapState[facility.id]) || 0))
      ])))];
    }));
  }

  function recordFacilityDestroyed(saved, mapId, facilityId, amount = 1) {
    const mapEntry = getMap(mapId);
    if (!mapEntry || !Object.values(FACILITY_TYPES).some((entry) => entry.id === facilityId)) return normalizeFacilityProgress(saved);
    const progress = normalizeFacilityProgress(saved);
    progress[mapId] = { ...progress[mapId], [facilityId]: progress[mapId][facilityId] + Math.max(0, Math.floor(Number(amount) || 0)) };
    return progress;
  }

  function getFacilityStatus(saved, mapId, facilityId) {
    const mapEntry = getMap(mapId);
    if (!mapEntry) return null;
    const count = normalizeFacilityProgress(saved)[mapId]?.[facilityId];
    if (count === undefined) return null;
    return Object.freeze({ count, required: mapEntry.facilityRequirement, complete: count >= mapEntry.facilityRequirement });
  }

  return Object.freeze({ CHAPTER, FACILITY_TYPES, ENEMIES, MAPS, getMap, getEnemy, canEnter, normalizeFacilityProgress, recordFacilityDestroyed, getFacilityStatus });
});
