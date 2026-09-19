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

  function enemy(id, name, rank, traits, image = null) {
    return Object.freeze({ id, name, rank, traits: Object.freeze(traits), image });
  }

  const ENEMIES = Object.freeze({
    wastelandHyena: enemy('wasteland-hyena', '荒原鬣狗', 'normal', ['high-attack-speed', 'rend-bite'], 'assets/wasteland-hyena.png'),
    redrockLizard: enemy('redrock-lizard', '赤岩蜥蜴', 'normal', ['hardened-scales'], 'assets/redrock-lizard.png'),
    wastelandVulture: enemy('wasteland-vulture', '荒原禿鷹', 'normal', ['high-evasion', 'dive'], 'assets/wasteland-vulture.png'),
    skullcrusherScout: enemy('skullcrusher-scout', '碎顱斥候', 'normal', ['armor-breaking-throw'], 'assets/skullcrusher-scout.png'),
    redrockHornbeast: enemy('redrock-hornbeast', '赤岩角獸', 'elite', ['high-health', 'frenzied-charge', 'wounded-frenzy'], 'assets/redrock-hornbeast.png'),
    redrockGiantLizard: enemy('redrock-giant-lizard', '赤岩巨蜥', 'boss', ['giant-jaw-rend', 'rock-armor', 'wasteland-fury'], 'assets/redrock-giant-lizard.png'),
    skullcrusherSpearman: enemy('skullcrusher-spearman', '碎顱投矛手', 'normal', ['ranged-high-damage', 'armor-piercing-spear'], 'assets/skullcrusher-spearman.png'),
    skullcrusherWarrior: enemy('skullcrusher-warrior', '碎顱戰士', 'normal', ['high-health', 'high-defense', 'battle-cry'], 'assets/skullcrusher-warrior.png'),
    brokenrockBrute: enemy('brokenrock-brute', '斷岩蠻兵', 'elite', ['two-handed-weapon', 'brute-smash', 'bloodlust'], 'assets/brokenrock-brute.png'),
    canyonWarlord: enemy('canyon-warlord', '峽谷督軍', 'boss', ['warlord-slash', 'offensive-command', 'execution-command'], 'assets/canyon-warlord.png'),
    skullcrusherBerserker: enemy('skullcrusher-berserker', '碎顱狂戰士', 'normal', ['blood-rage'], 'assets/skullcrusher-berserker.png?v=20260919'),
    skullcrusherShieldguard: enemy('skullcrusher-shieldguard', '碎顱盾衛', 'normal', ['shield-wall'], 'assets/skullcrusher-shieldguard.png?v=20260919'),
    skullcrusherHunter: enemy('skullcrusher-hunter', '碎顱獵手', 'normal', ['hunting-mark'], 'assets/skullcrusher-hunter.png?v=20260919'),
    skullcrusherShaman: enemy('skullcrusher-shaman', '碎顱薩滿', 'normal', ['warblood-totem'], 'assets/skullcrusher-shaman.png?v=20260919'),
    skullcrusherCenturion: enemy('skullcrusher-centurion', '碎顱百夫長', 'elite', ['centurion-cleave', 'battle-formation-command'], 'assets/skullcrusher-centurion.png?v=20260919'),
    skullcrusherVanguard: enemy('skullcrusher-vanguard-commander', '碎顱先鋒統領', 'boss', ['vanguard-smash', 'full-army-charge', 'fight-to-the-end'], 'assets/skullcrusher-vanguard-commander.png?v=20260919'),
    skullcrusherHeavyGuard: enemy('skullcrusher-heavy-guard', '碎顱重甲衛士', 'normal', ['heavy-armor-line'], 'assets/skullcrusher-heavy-guard.png'),
    skullcrusherWolfRider: enemy('skullcrusher-wolf-rider', '碎顱戰狼騎兵', 'normal', ['warwolf-assault'], 'assets/skullcrusher-wolf-rider.png'),
    skullcrusherChampion: enemy('skullcrusher-champion', '碎顱勇士', 'elite', ['champion-slash', 'unyielding-will'], 'assets/skullcrusher-champion.png'),
    skullcrusherChieftain: enemy('skullcrusher-great-chieftain', '碎顱大酋長', 'boss', ['chieftain-earthsplitter', 'fallen-warrior-rage', 'skullcrusher-overlord'], 'assets/skullcrusher-great-chieftain.png'),
    skullcrusherPriest: enemy('skullcrusher-priest', '碎顱祭司', 'normal', ['fel-prayer'], 'assets/skullcrusher-priest.png'),
    skullcrusherFanatic: enemy('skullcrusher-fanatic', '碎顱狂信者', 'normal', ['death-sacrifice'], 'assets/skullcrusher-fanatic.png'),
    ancientStoneguard: enemy('ancient-stoneguard', '遠古石衛', 'normal', ['petrified-body'], 'assets/ancient-stoneguard.png'),
    runeGuard: enemy('rune-guard', '符文守衛', 'normal', ['rune-shield'], 'assets/rune-guard.png'),
    awakenedGuard: enemy('awakened-guard', '覺醒守衛', 'elite', ['awakened-smash', 'awakened-rune'], 'assets/awakened-guard.png'),
    fallenHighPriest: enemy('fallen-high-priest', '墮落大祭司', 'boss', ['fallen-flame', 'blood-sacrifice', 'forbidden-ritual'], 'assets/fallen-high-priest.png'),
    templeStoneguard: enemy('temple-stoneguard', '聖殿石衛', 'normal', ['temple-bulwark'], 'assets/temple-stoneguard.png'),
    runeGolem: enemy('rune-golem', '符文魔像', 'normal', ['rune-overload'], 'assets/rune-golem.png'),
    templeExecutioner: enemy('temple-executioner', '聖殿執行者', 'normal', ['execution'], 'assets/temple-executioner.png'),
    ancientPriest: enemy('ancient-priest', '遠古祭司', 'normal', ['rune-blessing'], 'assets/ancient-priest.png'),
    templeGuardian: enemy('temple-guardian', '聖殿守護者', 'elite', ['guardian-smash', 'guardian-rune', 'shield-shatter'], 'assets/temple-guardian.png'),
    redrockAncientGod: enemy('redrock-ancient-god', '赤岩古神（暫定）', 'boss', ['ancient-god-smash', 'ancient-rune', 'ancient-awakening', 'redrock-divine-wrath'], 'assets/redrock-ancient-god.png')
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
      implemented: true, contentStatus: 'combat-ready',
      min: 30, max: 30, recommendedLevel: 30,
      skillPolicyId: 'redrock-wastes', skillStatus: 'implemented',
      environment: Object.freeze(['乾裂紅土地', '巨型赤色岩柱', '枯木', '獸骨', '少量碎顱旗幟與營火']),
      normalEnemyIds: Object.freeze(['wasteland-hyena', 'redrock-lizard', 'wasteland-vulture', 'skullcrusher-scout']),
      eliteId: 'redrock-hornbeast', bossId: 'redrock-giant-lizard',
      story: Object.freeze({ previousMapId: 'black-forest-depths', nextMapId: 'brokenrock-canyon' })
    }),
    map('brokenrock-canyon', 2, '斷岩峽谷', 15, {
      skillPolicyId: 'brokenrock-canyon', skillStatus: 'implemented',
      environment: Object.freeze(['紅色峽谷', '狹窄山道', '木製吊橋', '哨塔', '路障', '碎顱旗幟', '簡易營地']),
      normalEnemyIds: Object.freeze(['wasteland-hyena', 'skullcrusher-scout', 'skullcrusher-spearman', 'skullcrusher-warrior']),
      eliteId: 'brokenrock-brute', bossId: 'canyon-warlord',
      story: Object.freeze({ previousMapId: 'redrock-wastes-entrance', nextMapId: 'bloodwar-wastes' })
    }),
    map('bloodwar-wastes', 3, '血戰荒原', 20, {
      skillPolicyId: 'bloodwar-wastes', skillStatus: 'implemented',
      environment: Object.freeze(['破碎攻城器', '燒毀戰車', '斷裂戰旗', '廢棄營帳', '巨獸骨骸', '拒馬', '武器殘骸', '燃燒痕跡']),
      normalEnemyIds: Object.freeze(['skullcrusher-berserker', 'skullcrusher-shieldguard', 'skullcrusher-hunter', 'skullcrusher-shaman']),
      eliteId: 'skullcrusher-centurion', bossId: 'skullcrusher-vanguard-commander',
      story: Object.freeze({ previousMapId: 'brokenrock-canyon', nextMapId: 'skullcrusher-war-camp' })
    }),
    map('skullcrusher-war-camp', 4, '碎顱戰爭營地', 25, {
      skillPolicyId: 'skullcrusher-war-camp', skillStatus: 'implemented',
      dungeon: true,
      environment: Object.freeze(['大型木製城牆', '瞭望塔', '尖刺拒馬', '戰鼓', '獸籠', '武器架', '鍛造區', '大型帳篷', '碎顱旗幟', '巨獸頭骨', '補給箱與戰車']),
      normalEnemyIds: Object.freeze(['skullcrusher-berserker', 'skullcrusher-shaman', 'skullcrusher-heavy-guard', 'skullcrusher-wolf-rider']),
      eliteId: 'skullcrusher-champion', bossId: 'skullcrusher-great-chieftain',
      story: Object.freeze({ previousMapId: 'bloodwar-wastes', nextMapId: 'ancient-altar', unlockClue: '碎顱部族正在挖掘遠古力量' })
    }),
    map('ancient-altar', 5, '遠古祭壇', 30, {
      skillPolicyId: 'ancient-altar', skillStatus: 'implemented',
      environment: Object.freeze(['半埋紅土的巨大石柱', '遠古祭壇', '破碎石像', '發光符文', '遠古石板', '挖掘營地', '被摧毀的碎顱營帳', '聖殿入口']),
      sceneIntent: '碎顱部族成功找到遠古祭壇，但遠古力量已逐漸失控。',
      normalEnemyIds: Object.freeze(['skullcrusher-priest', 'skullcrusher-fanatic', 'ancient-stoneguard', 'rune-guard']),
      eliteId: 'awakened-guard', bossId: 'fallen-high-priest',
      story: Object.freeze({ previousMapId: 'skullcrusher-war-camp', nextMapId: 'redrock-temple', completion: '祭壇已啟動，聖殿入口無法重新封閉' })
    }),
    map('redrock-temple', 6, '赤岩聖殿', 35, {
      skillPolicyId: 'redrock-temple', skillStatus: 'implemented',
      isFinalMap: true,
      environment: Object.freeze(['巨型石造長廊', '超大型守護者雕像', '發光符文牆壁', '巨型石門', '地下祭壇', '發光晶體', '遠古壁畫', '巨型核心裝置', '青藍與紫色符文光源']),
      normalEnemyIds: Object.freeze(['temple-stoneguard', 'rune-golem', 'temple-executioner', 'ancient-priest']),
      eliteId: 'temple-guardian', bossId: 'redrock-ancient-god',
      finalBossStatus: 'provisional-mechanics-implemented', awakeningCoreSource: null,
      story: Object.freeze({ previousMapId: 'ancient-altar', nextMapId: null, finalStoryStatus: 'pending' })
    })
  ]);

  function getMap(mapId) { return MAPS.find((entry) => entry.id === mapId) || null; }
  function getEnemy(enemyId) { return Object.values(ENEMIES).find((entry) => entry.id === enemyId) || null; }
  function isChapterUnlocked(progress = {}) {
    return Math.max(1, Number(progress.unlockedChapter) || 1) >= CHAPTER.chapter;
  }
  function normalizeChapterUnlock(progress = {}) {
    progress.unlockedChapter = Math.max(1, Number(progress.unlockedChapter) || 1);
    if (progress.chapterTwoProgress?.completed) progress.unlockedChapter = Math.max(CHAPTER.chapter, progress.unlockedChapter);
    return progress.unlockedChapter;
  }
  function getMapState(progress = {}, mapId) {
    const mapEntry = getMap(mapId);
    if (!mapEntry) return null;
    const chapterUnlocked = isChapterUnlocked(progress);
    const unlocked = chapterUnlocked && mapId === CHAPTER.firstMapId;
    return Object.freeze({ mapId, chapterUnlocked, unlocked, implemented: Boolean(mapEntry.implemented) });
  }
  function canEnter(progress = {}, mapId) {
    const state = getMapState(progress, mapId);
    return Boolean(state?.chapterUnlocked && state.unlocked && state.implemented);
  }

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

  return Object.freeze({ CHAPTER, FACILITY_TYPES, ENEMIES, MAPS, getMap, getEnemy, isChapterUnlocked, normalizeChapterUnlock, getMapState, canEnter, normalizeFacilityProgress, recordFacilityDestroyed, getFacilityStatus });
});
