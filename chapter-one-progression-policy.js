(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ChapterOneProgressionPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP_ORDER = Object.freeze(['plains-entrance', 'wolf-den', 'boar-woods', 'goblin-camp', 'plains-depths']);
  const NEXT_MAP = Object.freeze({
    'plains-entrance': 'wolf-den',
    'wolf-den': 'boar-woods',
    'boar-woods': 'goblin-camp',
    'goblin-camp': 'plains-depths',
    'plains-depths': 'black-forest'
  });
  const REQUIREMENTS = Object.freeze({
    'plains-entrance': Object.freeze({ mapId: 'plains-entrance', mapName: '平原入口', level: 5, normalKills: 100, bossId: 'lostGoblin', bossName: '迷路的哥布林' }),
    'wolf-den': Object.freeze({ mapId: 'wolf-den', mapName: '狼穴', level: 8, normalKills: 150, bossId: 'greatfangWolf', bossName: '巨牙狼' }),
    'boar-woods': Object.freeze({ mapId: 'boar-woods', mapName: '野豬林', level: 11, normalKills: 200, bossId: 'boarKing', bossName: '巨牙野豬' }),
    'goblin-camp': Object.freeze({ mapId: 'goblin-camp', mapName: '哥布林營地', level: 13, normalKills: 250, bossId: 'goblinHighChief', bossName: '哥布林大酋長' }),
    'plains-depths': Object.freeze({ mapId: 'plains-depths', mapName: '平原深處', level: 15, normalKills: 300, bossId: 'blackstoneLeader', bossName: '黑石首領' })
  });

  function normalize(progress = {}) {
    progress.mapKillProgress = progress.mapKillProgress && typeof progress.mapKillProgress === 'object' ? { ...progress.mapKillProgress } : {};
    progress.mapBossCleared = progress.mapBossCleared && typeof progress.mapBossCleared === 'object' ? { ...progress.mapBossCleared } : {};
    progress.mapUnlocked = progress.mapUnlocked && typeof progress.mapUnlocked === 'object' ? { ...progress.mapUnlocked } : {};
    progress.mapUnlocked['plains-entrance'] = true;
    MAP_ORDER.forEach((mapId) => {
      progress.mapKillProgress[mapId] = Math.max(0, Math.floor(Number(progress.mapKillProgress[mapId]) || 0));
      progress.mapBossCleared[mapId] = Boolean(progress.mapBossCleared[mapId]);
      progress.mapUnlocked[mapId] = Boolean(progress.mapUnlocked[mapId]);
    });
    progress.mapUnlocked['plains-entrance'] = true;
    evaluateUnlocks(progress);
    return progress;
  }

  function getSourceMapIdForUnlock(targetMapId) {
    return Object.keys(NEXT_MAP).find((mapId) => NEXT_MAP[mapId] === targetMapId) || null;
  }

  function getCompletion(progress, mapId) {
    const requirement = REQUIREMENTS[mapId];
    if (!requirement) return null;
    return {
      requirement,
      level: Math.max(1, Math.floor(Number(progress.level) || 1)),
      normalKills: Math.max(0, Math.floor(Number(progress.mapKillProgress?.[mapId]) || 0)),
      bossCleared: Boolean(progress.mapBossCleared?.[mapId]),
      levelMet: Number(progress.level) >= requirement.level,
      killsMet: Number(progress.mapKillProgress?.[mapId]) >= requirement.normalKills,
      bossMet: Boolean(progress.mapBossCleared?.[mapId])
    };
  }

  function isComplete(progress, mapId) {
    const status = getCompletion(progress, mapId);
    return Boolean(status && status.levelMet && status.killsMet && status.bossMet);
  }

  function evaluateUnlocks(progress) {
    progress.mapUnlocked = progress.mapUnlocked && typeof progress.mapUnlocked === 'object' ? progress.mapUnlocked : {};
    progress.mapUnlocked['plains-entrance'] = true;
    MAP_ORDER.forEach((mapId) => {
      if (progress.mapUnlocked[mapId] && isComplete(progress, mapId)) progress.mapUnlocked[NEXT_MAP[mapId]] = true;
    });
    return progress.mapUnlocked;
  }

  function isUnlocked(progress, mapId) {
    if (mapId === 'beginner-plains') return true;
    return Boolean(progress.mapUnlocked?.[mapId]);
  }

  function getUnlockStatus(progress, targetMapId) {
    const sourceMapId = getSourceMapIdForUnlock(targetMapId);
    if (!sourceMapId) return { unlocked: isUnlocked(progress, targetMapId), sourceMapId: null, completion: null };
    return { unlocked: isUnlocked(progress, targetMapId), sourceMapId, completion: getCompletion(progress, sourceMapId) };
  }

  function recordNormalKill(progress, mapId, amount = 1) {
    normalize(progress);
    if (!REQUIREMENTS[mapId]) return [];
    progress.mapKillProgress[mapId] += Math.max(0, Math.floor(Number(amount) || 0));
    return collectNewUnlocks(progress);
  }

  function recordBossKill(progress, mapId, enemy = {}) {
    normalize(progress);
    if (enemy.id !== REQUIREMENTS[mapId]?.bossId) return [];
    progress.mapBossCleared[mapId] = true;
    return collectNewUnlocks(progress);
  }

  function collectNewUnlocks(progress) {
    const before = { ...progress.mapUnlocked };
    evaluateUnlocks(progress);
    return Object.keys(progress.mapUnlocked).filter((mapId) => progress.mapUnlocked[mapId] && !before[mapId]);
  }

  return Object.freeze({ MAP_ORDER, NEXT_MAP, REQUIREMENTS, normalize, getCompletion, isComplete, evaluateUnlocks, isUnlocked, getUnlockStatus, recordNormalKill, recordBossKill });
});
