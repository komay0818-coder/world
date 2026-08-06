(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackForestEntrancePolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP = Object.freeze({
    id: 'black-forest-entrance',
    chapter: 2,
    order: 1,
    name: '黑森林入口',
    theme: 'corrupted-forest-creatures',
    enemyPoolId: 'black-forest-entrance-enemies',
    bossId: 'forest-guardian',
    implemented: false,
    contentStatus: 'monster-foundation'
  });

  function monster(id, name, rank, role, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      role,
      chapter: 2,
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
    monster('black-forest-wolf', '黑森林野狼', 'normal', '黑森林最基礎怪物', { image: 'assets/black-forest-wolf.png' }),
    monster('corrupted-boar', '腐化野豬', 'normal', '受到黑暗侵蝕的野豬'),
    monster('shadow-spider', '暗影蜘蛛', 'normal', '黑森林常見毒系怪物', { tags: Object.freeze(['poison']) }),
    monster('withered-tree-walker', '枯木行者', 'normal', '受到黑暗侵蝕而甦醒的古樹'),
    monster('black-forest-hunter', '黑森林獵人', 'elite', '黑森林中的菁英敵人', { visualStyle: 'night-elf' }),
    monster('forest-guardian', '森林守護者', 'boss', '黑森林入口 Boss')
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));

  function getMonster(monsterId) {
    return MONSTER_BY_ID.get(monsterId) || null;
  }

  function getMonstersByRank(rank) {
    return MONSTERS.filter((entry) => entry.rank === rank);
  }

  return Object.freeze({ MAP, MONSTERS, getMonster, getMonstersByRank });
});
