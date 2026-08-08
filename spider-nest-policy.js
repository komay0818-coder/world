(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SpiderNestPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP = Object.freeze({
    id: 'spider-nest',
    chapter: 2,
    order: 3,
    level: 19,
    name: '蜘蛛巢穴',
    background: 'assets/spider-nest-background.png',
    primaryFaction: 'blackstone-beasts',
    enemyPoolId: 'spider-nest-enemies',
    bossId: 'giant-spider',
    implemented: false,
    contentStatus: 'monster-foundation'
  });

  const STORY = Object.freeze({
    premise: '黑石勢力在森林深處建立蜘蛛培育巢穴，利用毒液、蛛絲與圈養蜘蛛擴張軍備。',
    discoveries: Object.freeze(['blackstone-spider-breeding', 'venom-weapon-production', 'spider-silk-harvesting']),
    previousMapId: 'black-forest-trail',
    nextMapId: 'blackstone-stronghold',
    completionObjectiveId: 'defeat-giant-spider'
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
      faction: 'blackstone-beasts',
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
    monster('spider-nest-blackstone-poison-spider', '黑石毒蜘蛛', 'normal', '近戰毒系怪物', { attackProfile: 'melee-poison', skillConcepts: Object.freeze(['poison-basic-attacks']) }),
    monster('venom-spitter-spider', '噴毒蜘蛛', 'normal', '遠程持續傷害怪物', { image: 'assets/venom-spitter-spider.png', attackProfile: 'ranged-poison', skillConcepts: Object.freeze(['venom-spit', 'poison-dot']) }),
    monster('web-weaver', '蛛網編織者', 'normal', '蛛絲控制型怪物', { image: 'assets/web-weaver.png', attackProfile: 'ranged-control', skillConcepts: Object.freeze(['web-attack-speed-slow']) }),
    monster('blackstone-venom-hunter', '黑石毒獵手', 'normal', '使用淬毒弓箭的哥布林遠程怪', { image: 'assets/blackstone-venom-hunter.png', faction: 'blackstone-goblins', race: 'goblin', attackProfile: 'ranged-poison', skillConcepts: Object.freeze(['poisoned-arrows']) }),
    monster('spider-nest-blackstone-beastmaster', '黑石訓獸師', 'elite', '操控並強化蜘蛛的毒液菁英', { faction: 'blackstone-bandits', attackProfile: 'beast-support-poison', skillConcepts: Object.freeze(['spider-command', 'venom-attack']) }),
    monster('blackstone-venomblade-assassin', '黑石毒刃刺客', 'elite', '雙持毒刃的高速爆發近戰菁英', { image: 'assets/blackstone-venomblade-assassin.png', faction: 'blackstone-bandits', race: 'orc', attackProfile: 'melee-burst-poison', skillConcepts: Object.freeze(['poisoned-blades', 'high-speed-dash']) }),
    monster('giant-spider', '巨大蜘蛛', 'boss', '以毒液與蜘蛛絲壓制戰場的巢穴最終 Boss', { image: 'assets/giant-spider.png', bodyProfile: 'giant-bloated-abdomen', attackProfile: 'boss-poison-web-control', skillConcepts: Object.freeze(['venom-assault', 'web-control']) })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));
  function getMonster(monsterId) { return MONSTER_BY_ID.get(monsterId) || null; }
  function getMonstersByRank(rank) { return MONSTERS.filter((entry) => entry.rank === rank); }

  return Object.freeze({ MAP, STORY, MONSTERS, getMonster, getMonstersByRank });
});
