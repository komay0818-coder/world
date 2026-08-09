(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackForestDepthsPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULES = Object.freeze({
    mapId: 'black-forest-depths',
    chapter: 2,
    name: '黑森林深處',
    background: 'assets/black-forest-depths-background.png',
    enemyPoolId: 'black-forest-depths-enemies',
    bossId: 'heart-of-the-black-forest',
    implemented: false,
    contentStatus: 'monster-roster',
    denseFogAccuracyPenalty: .15,
    denseFogUnavoidable: true,
    bossAuraModifiers: null,
    visualDirection: Object.freeze({ primaryEnergy: 'purple-corruption', forestSpiritEnergy: 'green-nature' })
  });

  function monster(id, name, rank, visualEnergy, options = {}) {
    return Object.freeze({
      id, name, rank, chapter: RULES.chapter, mapId: RULES.mapId,
      visualEnergy, combatId: null, image: null, stats: null,
      dropTableId: null, skillIds: Object.freeze([]), aiProfileId: null, implemented: false,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('corrupted-forest-wolf', '腐化森林狼', 'normal', 'purple-corruption'),
    monster('corrupted-treant', '腐化樹妖', 'normal', 'purple-corruption'),
    monster('dark-spore-beast', '黑暗孢子獸', 'normal', 'purple-corruption'),
    monster('forest-spirit', '森林之魂', 'normal', 'green-nature'),
    monster('corrupted-blackstone-centurion', '腐化黑石百夫長', 'elite', 'purple-corruption'),
    monster('corrupted-fallen-druid', '腐化墮落德魯伊', 'elite', 'purple-corruption'),
    monster('heart-of-the-black-forest', '黑森林之心', 'boss', 'purple-corruption', { image: 'assets/heart-of-the-black-forest.png' })
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

  function applyDenseFogAccuracy(accuracy, mapId) {
    const normalized = Math.max(0, Number(accuracy) || 0);
    return mapId === RULES.mapId ? Math.max(0, normalized - RULES.denseFogAccuracyPenalty) : normalized;
  }

  function getBossAura(enemies) {
    const roster = Array.isArray(enemies) ? enemies : [];
    const bossAlive = roster.some((enemy) => enemy?.isBoss && enemy.currentHp > 0);
    return {
      active: bossAlive,
      affectedEnemyIds: bossAlive ? roster.filter((enemy) => !enemy?.isBoss && enemy?.currentHp > 0).map((enemy) => enemy.id) : [],
      modifiers: bossAlive ? RULES.bossAuraModifiers : null
    };
  }

  return Object.freeze({ RULES, MONSTERS, getMonster, getMonstersByRank, getMonsterPool, applyDenseFogAccuracy, getBossAura });
});
