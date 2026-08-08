(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackForestTrailPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP = Object.freeze({
    id: 'black-forest-trail',
    chapter: 2,
    order: 2,
    level: 17,
    name: '黑森林小徑',
    background: 'assets/black-forest-trail-background.png',
    primaryFaction: 'blackstone-bandits',
    enemyPoolId: 'black-forest-trail-enemies',
    bossId: 'blackstone-centurion',
    implemented: false,
    contentStatus: 'monster-foundation'
  });

  const STORY = Object.freeze({
    premise: '黑石山賊已深入黑森林，建立巡邏路線與臨時據點，持續將物資運送至森林深處。',
    discoveries: Object.freeze(['blackstone-invasion', 'patrol-and-supply-route', 'poison-spider-husbandry']),
    previousMapId: 'black-forest-entrance',
    nextMapId: 'spider-nest',
    completionObjectiveId: 'defeat-blackstone-centurion',
    completionClueId: 'spider-nest-route-clue'
  });

  function monster(id, name, rank, role, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      role,
      chapter: 2,
      mapId: MAP.id,
      level: MAP.level,
      faction: 'blackstone-bandits',
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
    monster('blackstone-trail-scout', '黑石斥候', 'normal', '巡邏與偵察'),
    monster('blackstone-trail-raider', '黑石掠奪者', 'normal', '近戰攔截與物資護送'),
    monster('blackstone-archer', '黑石弓箭手', 'normal', '遠程火力', { image: 'assets/blackstone-archer.png' }),
    monster('blackstone-poison-spider', '黑石毒蜘蛛', 'normal', '黑石圈養的毒系怪物', { image: 'assets/blackstone-poison-spider.png', faction: 'blackstone-beasts', ownerFaction: 'blackstone-bandits', tags: Object.freeze(['beast', 'poison', 'spider']) }),
    monster('blackstone-beastmaster', '黑石訓獸師', 'elite', '指揮與強化圈養蜘蛛'),
    monster('blackstone-captain', '黑石隊長', 'elite', '巡邏隊與補給線指揮官'),
    monster('blackstone-centurion', '黑石百夫長', 'boss', '守衛補給路線並持有蛛巢線索')
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));

  function getMonster(monsterId) {
    return MONSTER_BY_ID.get(monsterId) || null;
  }

  function getMonstersByRank(rank) {
    return MONSTERS.filter((entry) => entry.rank === rank);
  }

  return Object.freeze({ MAP, STORY, MONSTERS, getMonster, getMonstersByRank });
});
