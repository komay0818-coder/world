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
    level: 23,
    name: '森林祭壇',
    background: 'assets/forest-altar-background.png',
    enemyPoolId: 'forest-altar-enemies',
    bossId: 'corrupted-altar-guardian',
    implemented: false,
    contentStatus: 'monster-foundation'
  });

  function monster(id, name, rank, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      chapter: MAP.chapter,
      mapId: MAP.id,
      level: MAP.level,
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
    monster('corrupted-forest-wolf', '腐化森林狼', 'normal', { image: 'assets/corrupted-forest-wolf.png', stats: Object.freeze({ maxHp: 480, attack: 68, defense: 30, evasion: 17, parry: 0, damageReduction: 5, attackSpeed: 1.40, xp: 65, gold: 32 }) }),
    monster('thorn-demon-vine', '荊棘魔藤', 'normal', { image: 'assets/thorn-demon-vine.png', stats: Object.freeze({ maxHp: 650, attack: 59, defense: 52, evasion: 2, parry: 0, damageReduction: 12, attackSpeed: .75, xp: 68, gold: 34 }) }),
    monster('corrupted-blackstone-soldier', '腐化黑石士兵', 'normal', { image: 'assets/corrupted-blackstone-soldier.png', stats: Object.freeze({ maxHp: 720, attack: 65, defense: 60, evasion: 3, parry: 15, damageReduction: 15, attackSpeed: .82, xp: 72, gold: 37 }) }),
    monster('altar-guard', '祭壇守衛', 'elite', { image: 'assets/altar-guard.png', stats: Object.freeze({ maxHp: 1900, attack: 88, defense: 76, evasion: 3, parry: 10, damageReduction: 18, attackSpeed: .78, xp: 240, gold: 135 }) }),
    monster('corrupted-blackstone-priest', '腐化黑石祭司', 'elite', { image: 'assets/corrupted-blackstone-priest.png', stats: Object.freeze({ maxHp: 1450, attack: 96, defense: 48, evasion: 10, parry: 5, damageReduction: 9, attackSpeed: 1, xp: 225, gold: 145 }) }),
    monster('fallen-druid', '墮落德魯伊', 'elite', { image: 'assets/fallen-druid.png', stats: Object.freeze({ maxHp: 1700, attack: 91, defense: 57, evasion: 8, parry: 7, damageReduction: 12, attackSpeed: .92, xp: 260, gold: 155 }) }),
    monster('corrupted-altar-guardian', '腐化祭壇守護者', 'boss', { image: 'assets/corrupted-altar-guardian.png', stats: Object.freeze({ maxHp: 8000, attack: 108, defense: 86, evasion: 4, parry: 12, damageReduction: 20, attackSpeed: .88, xp: 950, gold: 560 }) })
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
