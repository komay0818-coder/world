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
    contentStatus: 'combat-ready',
    denseFogAccuracyPenalty: .15,
    denseFogUnavoidable: true,
    bossAuraModifiers: Object.freeze({ attackBonus: .10, defenseBonus: .10 }),
    visualDirection: Object.freeze({ primaryEnergy: 'purple-corruption', forestSpiritEnergy: 'green-nature' })
  });

  const SKILLS = Object.freeze({
    depthsCorruptedForestWolf: Object.freeze({ active: 'depths-shadow-bite', passive: 'depths-corrupted-hunt', chance: .25, damage: 1.25, threshold: .40 }),
    corruptedTreant: Object.freeze({ active: 'corrupted-root-entangle', passive: 'corrupted-bark', chance: .24, damage: 1.10, slow: .20, durationMs: 4000, threshold: .50 }),
    darkSporeBeast: Object.freeze({ active: 'spore-eruption', passive: 'spore-proliferation', chance: .28, damage: 1.12, threshold: .50 }),
    forestSpirit: Object.freeze({ active: 'nature-echo', passive: 'pure-spirit', chance: .28, healRatio: .18 }),
    corruptedBlackstoneCenturion: Object.freeze({ active: 'corrupted-heavy-axe', passive: 'blackstone-command', chance: .24, damage: 1.40, armorBreak: .15, durationMs: 5000 }),
    corruptedFallenDruid: Object.freeze({ active: 'withering-storm', passive: 'deep-forest-corruption', chance: .26, damage: 1.25, slow: .20, durationMs: 4000, threshold: .50 }),
    heartOfTheBlackForest: Object.freeze({ active: 'corruption-pulse', passive: 'black-forest-core', chance: .28, damage: 1.35 })
  });
  const BOSS = Object.freeze({
    phaseTwoThreshold: .70,
    phaseThreeThreshold: .35,
    phaseTwoAttackBonus: .15,
    phaseThreeAttackBonus: .30,
    phaseThreeAttackSpeedBonus: .25,
    phaseThreeDefensePenalty: .15,
    rootSummonHpRatio: .55,
    rootSummonAttackRatio: .70,
    rootSummonLimit: 2,
    weakenedAuraBonus: .05
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
    monster('corrupted-forest-wolf', '腐化森林狼', 'normal', 'purple-corruption', { combatId: 'depthsCorruptedForestWolf', role: '高速追擊', skillIds: Object.freeze(['depths-shadow-bite', 'depths-corrupted-hunt']), aiProfileId: 'depths-wolf', image: 'assets/corrupted-forest-wolf.png', stats: Object.freeze({ maxHp: 650, attack: 82, defense: 35, evasion: 19, parry: 0, damageReduction: 6, attackSpeed: 1.50, xp: 82, gold: 41 }) }),
    monster('corrupted-treant', '腐化樹妖', 'normal', 'purple-corruption', { combatId: 'corruptedTreant', role: '控制型前排', skillIds: Object.freeze(['corrupted-root-entangle', 'corrupted-bark']), aiProfileId: 'depths-treant', image: 'assets/corrupted-treant.png', stats: Object.freeze({ maxHp: 980, attack: 76, defense: 72, evasion: 3, parry: 8, damageReduction: 18, attackSpeed: .78, xp: 88, gold: 45 }) }),
    monster('dark-spore-beast', '黑暗孢子獸', 'normal', 'purple-corruption', { combatId: 'darkSporeBeast', role: '持續傷害', skillIds: Object.freeze(['spore-eruption', 'spore-proliferation']), aiProfileId: 'depths-spore-beast', image: 'assets/dark-spore-beast.png', stats: Object.freeze({ maxHp: 820, attack: 88, defense: 48, evasion: 7, parry: 0, damageReduction: 10, attackSpeed: .95, xp: 92, gold: 48 }) }),
    monster('forest-spirit', '森林之魂', 'normal', 'green-nature', { combatId: 'forestSpirit', role: '自然輔助', faction: 'forest-nature', skillIds: Object.freeze(['nature-echo', 'pure-spirit']), aiProfileId: 'depths-forest-spirit', image: 'assets/forest-spirit.png', stats: Object.freeze({ maxHp: 760, attack: 72, defense: 44, evasion: 16, parry: 0, damageReduction: 8, attackSpeed: 1.10, xp: 90, gold: 50 }) }),
    monster('corrupted-blackstone-centurion', '腐化黑石百夫長', 'elite', 'purple-corruption', { combatId: 'corruptedBlackstoneCenturion', role: '重裝輸出菁英', faction: 'corrupted-blackstone', skillIds: Object.freeze(['corrupted-heavy-axe', 'blackstone-command']), aiProfileId: 'depths-centurion', image: 'assets/corrupted-blackstone-centurion.png', stats: Object.freeze({ maxHp: 2700, attack: 110, defense: 92, evasion: 4, parry: 18, damageReduction: 22, attackSpeed: .88, xp: 340, gold: 210 }) }),
    monster('corrupted-fallen-druid', '腐化墮落德魯伊', 'elite', 'purple-corruption', { combatId: 'corruptedFallenDruid', role: '控制法術菁英', skillIds: Object.freeze(['withering-storm', 'deep-forest-corruption']), aiProfileId: 'depths-druid', image: 'assets/corrupted-fallen-druid.png', stats: Object.freeze({ maxHp: 2350, attack: 116, defense: 65, evasion: 10, parry: 6, damageReduction: 14, attackSpeed: 1, xp: 360, gold: 225 }) }),
    monster('heart-of-the-black-forest', '黑森林之心', 'boss', 'purple-corruption', { combatId: 'heartOfTheBlackForest', role: '三階段最終 Boss', skillIds: Object.freeze(['corruption-pulse', 'black-forest-core']), aiProfileId: 'depths-heart', image: 'assets/heart-of-the-black-forest.png', stats: Object.freeze({ maxHp: 12000, attack: 132, defense: 105, evasion: 5, parry: 12, damageReduction: 24, attackSpeed: .92, xp: 1500, gold: 900 }) })
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
  function getBossPhase(monsterId, currentHp, maxHp) {
    if (!['heart-of-the-black-forest', 'heartOfTheBlackForest'].includes(monsterId) || !(Number(maxHp) > 0)) return 1;
    const ratio = Math.max(0, Number(currentHp) || 0) / Number(maxHp);
    return ratio <= BOSS.phaseThreeThreshold ? 3 : ratio <= BOSS.phaseTwoThreshold ? 2 : 1;
  }
  function getCombatMultipliers(monsterId, currentHp, maxHp, context = {}) {
    const ratio = Number(maxHp) > 0 ? Math.max(0, Number(currentHp) || 0) / Number(maxHp) : 1;
    let attack = 1, attackSpeed = 1, defense = 1, evasion = 0;
    if (monsterId === 'depthsCorruptedForestWolf' && ratio <= .40) { attack *= 1.15; attackSpeed *= 1.20; }
    if (monsterId === 'corruptedTreant' && ratio <= .50) defense *= 1.25;
    if (monsterId === 'darkSporeBeast' && ratio <= .50) attack *= 1.15;
    if (monsterId === 'forestSpirit') evasion += .08;
    if (monsterId === 'corruptedBlackstoneCenturion') attack *= 1 + Math.min(4, Math.max(0, Number(context.aliveAllies) || 0)) * .04;
    if (monsterId === 'corruptedFallenDruid' && ratio <= .50) attack *= 1.20;
    const phase = getBossPhase(monsterId, currentHp, maxHp);
    if (phase === 3) { attack *= 1 + BOSS.phaseThreeAttackBonus; attackSpeed *= 1 + BOSS.phaseThreeAttackSpeedBonus; defense *= 1 - BOSS.phaseThreeDefensePenalty; }
    else if (phase === 2) attack *= 1 + BOSS.phaseTwoAttackBonus;
    if (context.bossAuraActive && monsterId !== 'heartOfTheBlackForest') {
      const auraBonus = context.forestSpiritAlive ? BOSS.weakenedAuraBonus : RULES.bossAuraModifiers.attackBonus;
      attack *= 1 + auraBonus;
      defense *= 1 + auraBonus;
    }
    return { attack, attackSpeed, defense, evasion };
  }
  function resolveAction(monsterId, randomValue, hasWoundedAlly = false) {
    const skill = SKILLS[monsterId];
    const roll = Math.max(0, Math.min(.999999, Number(randomValue) || 0));
    if (monsterId === 'forestSpirit') return hasWoundedAlly && roll < skill.chance ? skill.active : 'attack';
    return skill && roll < skill.chance ? skill.active : 'attack';
  }
  function getDamageMultiplier(action) {
    const skill = Object.values(SKILLS).find((entry) => entry.active === action);
    return skill?.damage || 1;
  }
  function getControlEffect(action) {
    const skill = Object.values(SKILLS).find((entry) => entry.active === action);
    return skill?.slow ? Object.freeze({ attackSpeedPenalty: skill.slow, durationMs: skill.durationMs }) : null;
  }

  function applyDenseFogAccuracy(accuracy, mapId) {
    const normalized = Math.max(0, Number(accuracy) || 0);
    return mapId === RULES.mapId ? Math.max(0, normalized - RULES.denseFogAccuracyPenalty) : normalized;
  }

  function getBossAura(enemies) {
    const roster = Array.isArray(enemies) ? enemies : [];
    const bossAlive = roster.some((enemy) => enemy?.isBoss && enemy.currentHp > 0);
    const forestSpiritAlive = roster.some((enemy) => ['forest-spirit', 'forestSpirit'].includes(enemy?.id) && enemy.currentHp > 0);
    const auraBonus = forestSpiritAlive ? BOSS.weakenedAuraBonus : RULES.bossAuraModifiers.attackBonus;
    return {
      active: bossAlive,
      affectedEnemyIds: bossAlive ? roster.filter((enemy) => !enemy?.isBoss && enemy?.currentHp > 0).map((enemy) => enemy.id) : [],
      weakenedByForestSpirit: bossAlive && forestSpiritAlive,
      modifiers: bossAlive ? Object.freeze({ attackBonus: auraBonus, defenseBonus: auraBonus }) : null
    };
  }

  return Object.freeze({ RULES, SKILLS, BOSS, MONSTERS, getMonster, getMonstersByRank, getMonsterPool, getCombatPool, rollLevel, toCombatMonster, getCombatMonster, getBossPhase, getCombatMultipliers, resolveAction, getDamageMultiplier, getControlEffect, applyDenseFogAccuracy, getBossAura });
});
