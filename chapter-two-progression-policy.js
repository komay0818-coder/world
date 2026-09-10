(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ChapterTwoProgressionPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP_ORDER = Object.freeze(['black-forest-trail', 'spider-nest', 'black-forest-entrance', 'blackstone-stronghold', 'forest-altar', 'black-forest-depths']);
  const BOSS_IDS = Object.freeze({
    'black-forest-trail': 'blackstoneCenturion',
    'spider-nest': 'giantSpider',
    'black-forest-entrance': 'forestGuardianV2',
    'blackstone-stronghold': 'blackstoneStrongholdWarlord',
    'forest-altar': 'corruptedAltarGuardian',
    'black-forest-depths': 'heartOfTheBlackForest'
  });
  const NEXT_MAP = Object.freeze(Object.fromEntries(MAP_ORDER.slice(0, -1).map((mapId, index) => [mapId, MAP_ORDER[index + 1]])));

  function createDefaultState() {
    return {
      unlocked: Object.fromEntries(MAP_ORDER.map((mapId) => [mapId, false])),
      cleared: Object.fromEntries(MAP_ORDER.map((mapId) => [mapId, false])),
      bossFirstKills: Object.fromEntries(MAP_ORDER.map((mapId) => [mapId, false])),
      normalKills: Object.fromEntries(MAP_ORDER.map((mapId) => [mapId, 0])),
      completed: false
    };
  }

  function isChapterUnlocked(progress = {}) {
    return Number(progress.unlockedChapter) >= 2 || Boolean(progress.mapUnlocked?.['black-forest']);
  }

  function normalize(progress = {}) {
    const defaults = createDefaultState();
    const source = progress.chapterTwoProgress && typeof progress.chapterTwoProgress === 'object' ? progress.chapterTwoProgress : {};
    const state = {
      unlocked: { ...defaults.unlocked, ...(source.unlocked || {}) },
      cleared: { ...defaults.cleared, ...(source.cleared || {}) },
      bossFirstKills: { ...defaults.bossFirstKills, ...(source.bossFirstKills || {}) },
      normalKills: { ...defaults.normalKills, ...(source.normalKills || {}) },
      completed: Boolean(source.completed)
    };
    MAP_ORDER.forEach((mapId) => {
      state.unlocked[mapId] = Boolean(state.unlocked[mapId]);
      state.cleared[mapId] = Boolean(state.cleared[mapId]);
      state.bossFirstKills[mapId] = Boolean(state.bossFirstKills[mapId] || state.cleared[mapId]);
      state.normalKills[mapId] = Math.max(0, Math.floor(Number(state.normalKills[mapId]) || 0));
      if (state.cleared[mapId]) state.unlocked[mapId] = true;
    });
    if (isChapterUnlocked(progress)) state.unlocked[MAP_ORDER[0]] = true;
    const selectedIndex = MAP_ORDER.indexOf(progress.selectedMapId);
    if (selectedIndex >= 0) {
      for (let index = 0; index <= selectedIndex; index += 1) state.unlocked[MAP_ORDER[index]] = true;
    }
    MAP_ORDER.forEach((mapId) => {
      if (state.cleared[mapId] && NEXT_MAP[mapId]) state.unlocked[NEXT_MAP[mapId]] = true;
    });
    state.completed = Boolean(state.completed || state.cleared[MAP_ORDER[MAP_ORDER.length - 1]]);
    progress.chapterTwoProgress = state;
    return state;
  }

  function getMapState(progress, mapId, implemented = false) {
    const state = normalize(progress);
    return Object.freeze({ mapId, implemented: Boolean(implemented), unlocked: Boolean(state.unlocked[mapId]), cleared: Boolean(state.cleared[mapId]), bossFirstKilled: Boolean(state.bossFirstKills[mapId]), normalKills: Math.max(0, Number(state.normalKills[mapId]) || 0) });
  }

  function canEnter(progress, mapId, implemented = false) {
    const status = getMapState(progress, mapId, implemented);
    return status.implemented && status.unlocked;
  }

  function recordNormalKill(progress, mapId, amount = 1) {
    const state = normalize(progress);
    if (MAP_ORDER.includes(mapId)) state.normalKills[mapId] += Math.max(0, Math.floor(Number(amount) || 0));
    return state;
  }

  function recordBossKill(progress, mapId, enemy = {}) {
    const state = normalize(progress);
    if (!MAP_ORDER.includes(mapId) || enemy.id !== BOSS_IDS[mapId] || state.bossFirstKills[mapId]) return Object.freeze({ firstClear: false, mapId, nextMapId: null, chapterCompleted: state.completed });
    state.unlocked[mapId] = true;
    state.bossFirstKills[mapId] = true;
    state.cleared[mapId] = true;
    const nextMapId = NEXT_MAP[mapId] || null;
    if (nextMapId) state.unlocked[nextMapId] = true;
    else state.completed = true;
    return Object.freeze({ firstClear: true, mapId, nextMapId, chapterCompleted: state.completed });
  }

  return Object.freeze({ MAP_ORDER, BOSS_IDS, NEXT_MAP, createDefaultState, isChapterUnlocked, normalize, getMapState, canEnter, recordNormalKill, recordBossKill });
});
