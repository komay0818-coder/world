(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackForestDepthsPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULES = Object.freeze({
    mapId: 'black-forest-depths',
    chapter: 2,
    level: 25,
    name: '黑森林深處',
    background: 'assets/black-forest-depths-background.png',
    enemyPoolId: 'black-forest-depths-enemies',
    bossId: 'heart-of-the-black-forest',
    implemented: false,
    contentStatus: 'combat-foundation',
    denseFogAccuracyPenalty: .15,
    denseFogUnavoidable: true,
    bossAuraModifiers: null,
    visualDirection: Object.freeze({ primaryEnergy: 'purple-corruption', forestSpiritEnergy: 'green-nature' })
  });

  function monster(id, name, rank, visualEnergy, options = {}) {
    return Object.freeze({
      id, name, rank, chapter: RULES.chapter, mapId: RULES.mapId, level: RULES.level,
      visualEnergy, role: null, faction: 'deep-forest-corruption', combatId: null, image: null, stats: null,
      dropTableId: null, skillIds: Object.freeze([]), aiProfileId: null, implemented: false,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('corrupted-forest-wolf', '腐化森林狼', 'normal', 'purple-corruption', { combatId: 'depthsCorruptedForestWolf', role: '高速追擊', image: 'assets/corrupted-forest-wolf.png', stats: Object.freeze({ maxHp: 650, attack: 82, defense: 35, evasion: 19, parry: 0, damageReduction: 6, attackSpeed: 1.50, xp: 82, gold: 41 }) }),
    monster('corrupted-treant', '腐化樹妖', 'normal', 'purple-corruption', { combatId: 'corruptedTreant', role: '控制型前排', image: 'assets/corrupted-treant.png', stats: Object.freeze({ maxHp: 980, attack: 76, defense: 72, evasion: 3, parry: 8, damageReduction: 18, attackSpeed: .78, xp: 88, gold: 45 }) }),
    monster('dark-spore-beast', '黑暗孢子獸', 'normal', 'purple-corruption', { combatId: 'darkSporeBeast', role: '持續傷害', image: 'assets/dark-spore-beast.png', stats: Object.freeze({ maxHp: 820, attack: 88, defense: 48, evasion: 7, parry: 0, damageReduction: 10, attackSpeed: .95, xp: 92, gold: 48 }) }),
    monster('forest-spirit', '森林之魂', 'normal', 'green-nature', { combatId: 'forestSpirit', role: '自然輔助', faction: 'forest-nature', image: 'assets/forest-spirit.png', stats: Object.freeze({ maxHp: 760, attack: 72, defense: 44, evasion: 16, parry: 0, damageReduction: 8, attackSpeed: 1.10, xp: 90, gold: 50 }) }),
    monster('corrupted-blackstone-centurion', '腐化黑石百夫長', 'elite', 'purple-corruption', { combatId: 'corruptedBlackstoneCenturion', role: '重裝輸出菁英', faction: 'corrupted-blackstone', image: 'assets/corrupted-blackstone-centurion.png', stats: Object.freeze({ maxHp: 2700, attack: 110, defense: 92, evasion: 4, parry: 18, damageReduction: 22, attackSpeed: .88, xp: 340, gold: 210 }) }),
    monster('corrupted-fallen-druid', '腐化墮落德魯伊', 'elite', 'purple-corruption', { combatId: 'corruptedFallenDruid', role: '控制法術菁英', image: 'assets/corrupted-fallen-druid.png', stats: Object.freeze({ maxHp: 2350, attack: 116, defense: 65, evasion: 10, parry: 6, damageReduction: 14, attackSpeed: 1, xp: 360, gold: 225 }) }),
    monster('heart-of-the-black-forest', '黑森林之心', 'boss', 'purple-corruption', { combatId: 'heartOfTheBlackForest', role: '三階段最終 Boss', image: 'assets/heart-of-the-black-forest.png', stats: Object.freeze({ maxHp: 12000, attack: 132, defense: 105, evasion: 5, parry: 12, damageReduction: 24, attackSpeed: .92, xp: 1500, gold: 900 }) })
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
  function getCombatPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.combatId)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.combatId)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.combatId))
    });
  }
  function rollLevel(monsterId) {
    return MONSTERS.some((entry) => entry.id === monsterId || entry.combatId === monsterId) ? RULES.level : null;
  }
  function toCombatMonster(entry) {
    if (!entry?.stats || !entry.combatId) return null;
    return Object.freeze({ id: entry.combatId, policyId: entry.id, name: entry.name, role: entry.role, level: RULES.level, mapId: RULES.mapId,
      ...entry.stats, isElite: entry.rank === 'elite', isBoss: entry.rank === 'boss', faction: entry.faction,
      artClass: `monster-image-art ${entry.combatId}`, image: entry.image, skillIds: entry.skillIds });
  }
  function getCombatMonster(monsterId) {
    return toCombatMonster(MONSTERS.find((entry) => entry.id === monsterId || entry.combatId === monsterId));
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

  return Object.freeze({ RULES, MONSTERS, getMonster, getMonstersByRank, getMonsterPool, getCombatPool, rollLevel, toCombatMonster, getCombatMonster, applyDenseFogAccuracy, getBossAura });
});
