(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ChapterThreeProgressionPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP_ORDER = Object.freeze([
    'redrock-wastes-entrance', 'brokenrock-canyon', 'bloodwar-wastes',
    'skullcrusher-war-camp', 'ancient-altar', 'redrock-temple'
  ]);
  const BOSS_IDS = Object.freeze({
    'redrock-wastes-entrance': 'redrock-giant-lizard',
    'brokenrock-canyon': 'canyon-warlord'
  });
  const NEXT_MAP = Object.freeze({
    'redrock-wastes-entrance': 'brokenrock-canyon',
    'brokenrock-canyon': 'bloodwar-wastes'
  });

  function createDefaultState() {
    return {
      unlocked: Object.fromEntries(MAP_ORDER.map((mapId) => [mapId, false])),
      cleared: Object.fromEntries(MAP_ORDER.map((mapId) => [mapId, false])),
      bossFirstKills: Object.fromEntries(MAP_ORDER.map((mapId) => [mapId, false]))
    };
  }

  function normalize(progress = {}) {
    const defaults = createDefaultState();
    const source = progress.chapterThreeProgress && typeof progress.chapterThreeProgress === 'object'
      ? progress.chapterThreeProgress : {};
    const state = {
      unlocked: { ...defaults.unlocked, ...(source.unlocked || {}) },
      cleared: { ...defaults.cleared, ...(source.cleared || {}) },
      bossFirstKills: { ...defaults.bossFirstKills, ...(source.bossFirstKills || {}) }
    };
    MAP_ORDER.forEach((mapId) => {
      state.unlocked[mapId] = Boolean(state.unlocked[mapId]);
      state.cleared[mapId] = Boolean(state.cleared[mapId]);
      state.bossFirstKills[mapId] = Boolean(state.bossFirstKills[mapId] || state.cleared[mapId]);
      if (state.cleared[mapId]) state.unlocked[mapId] = true;
    });
    if (Number(progress.unlockedChapter) >= 3 || progress.chapterTwoProgress?.completed) {
      state.unlocked['redrock-wastes-entrance'] = true;
    }
    if (state.cleared['redrock-wastes-entrance']) state.unlocked['brokenrock-canyon'] = true;
    if (state.cleared['brokenrock-canyon']) state.unlocked['bloodwar-wastes'] = true;
    progress.chapterThreeProgress = state;
    return state;
  }

  function getMapState(progress, mapId, implemented = false) {
    const state = normalize(progress);
    return Object.freeze({
      mapId,
      implemented: Boolean(implemented),
      unlocked: Boolean(state.unlocked[mapId]),
      cleared: Boolean(state.cleared[mapId]),
      bossFirstKilled: Boolean(state.bossFirstKills[mapId])
    });
  }

  function canEnter(progress, mapId, implemented = false) {
    const state = getMapState(progress, mapId, implemented);
    return state.implemented && state.unlocked;
  }

  function recordBossKill(progress, mapId, enemy = {}) {
    const state = normalize(progress);
    if (enemy.id !== BOSS_IDS[mapId] || state.bossFirstKills[mapId]) {
      return Object.freeze({ firstClear: false, mapId, nextMapId: null });
    }
    state.unlocked[mapId] = true;
    state.bossFirstKills[mapId] = true;
    state.cleared[mapId] = true;
    const nextMapId = NEXT_MAP[mapId] || null;
    if (nextMapId) state.unlocked[nextMapId] = true;
    return Object.freeze({ firstClear: true, mapId, nextMapId });
  }

  return Object.freeze({ MAP_ORDER, BOSS_IDS, NEXT_MAP, createDefaultState, normalize, getMapState, canEnter, recordBossKill });
});
