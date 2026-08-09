(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ForestAltarPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP = Object.freeze({
    id: 'forest-altar',
    chapter: 2,
    order: 5,
    name: '森林祭壇',
    enemyPoolId: 'forest-altar-enemies',
    bossId: 'corrupted-altar-guardian',
    implemented: false,
    contentStatus: 'monster-roster'
  });

  function monster(id, name, rank, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      chapter: MAP.chapter,
      mapId: MAP.id,
      image: null,
      stats: null,
      dropTableId: null,
      skillIds: Object.freeze([]),
      aiProfileId: null,
      implemented: false,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('corrupted-forest-wolf', '腐化森林狼', 'normal', { image: 'assets/corrupted-forest-wolf.png' }),
    monster('thorn-demon-vine', '荊棘魔藤', 'normal', { image: 'assets/thorn-demon-vine.png' }),
    monster('corrupted-blackstone-soldier', '腐化黑石士兵', 'normal', { image: 'assets/corrupted-blackstone-soldier.png' }),
    monster('altar-guard', '祭壇守衛', 'elite'),
    monster('corrupted-blackstone-priest', '腐化黑石祭司', 'elite'),
    monster('fallen-druid', '墮落德魯伊', 'elite'),
    monster('corrupted-altar-guardian', '腐化祭壇守護者', 'boss')
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));
  function getMonster(monsterId) { return MONSTER_BY_ID.get(monsterId) || null; }
  function getMonstersByRank(rank) { return MONSTERS.filter((entry) => entry.rank === rank); }
  function getMonsterPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.id)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.id)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.id))
    });
  }

  return Object.freeze({ MAP, MONSTERS, getMonster, getMonstersByRank, getMonsterPool });
});
