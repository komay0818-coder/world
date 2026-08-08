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
    background: 'assets/black-forest-entrance-background.png',
    enemyPoolId: 'black-forest-entrance-enemies',
    bossId: 'forest-guardian',
    implemented: false,
    contentStatus: 'combat-ready'
  });

  const GROWTH = Object.freeze({ hpPerLevel: .14, attackPerLevel: .09, defensePerLevel: .08, expPerLevel: .11 });
  const BLEED = Object.freeze({ chance: .25, durationMs: 3000, tickMs: 1000, attackRatio: .08 });
  const POISON = Object.freeze({ chance: .30, durationMs: 5000, tickMs: 1000, attackRatio: .06 });
  const CONTROL = Object.freeze({ chargeChance: .20, chargeMultiplier: 1.4, chargeStunMs: 1000, rootChance: .20, rootDurationMs: 4000, rootAttackSpeedPenalty: .20 });
  const ENRAGE = Object.freeze({ hpThreshold: .40, attackBonus: .20, attackSpeedBonus: .15 });
  const HUNTER = Object.freeze({ bindChance: .25, bindMultiplier: 1.2, bindDurationMs: 3000, executeThreshold: .30, executeMultiplier: 1.6 });
  const GUARDIAN = Object.freeze({ phaseTwoThreshold: .70, phaseThreeThreshold: .35, rootStrikeChance: .25, rootStrikeMultiplier: 1.5, stormChance: .20, stormMultiplier: .60, phaseThreeAttackBonus: .20, phaseThreeAttackSpeedBonus: .15, phaseThreeDefensePenalty: .10 });

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
      dropTableId: 'black-forest-entrance-pending',
      skillIds: Object.freeze([]),
      aiProfileId: null,
      implemented: true,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('black-forest-wolf', '黑森林野狼', 'normal', '快速流血攻擊', { combatId: 'blackForestWolf', level: Object.freeze([15, 16]), image: 'assets/black-forest-wolf.png', stats: Object.freeze({ maxHp: 145, attack: 27, defense: 13, evasion: 12, parry: 0, damageReduction: 2, attackSpeed: 1.2, xp: 20, gold: 10 }), skillIds: Object.freeze(['shadow-bite']), aiProfileId: 'fast-bleeder' }),
    monster('corrupted-boar', '腐化野豬', 'normal', '高耐久衝撞怪物', { combatId: 'corruptedBoar', level: Object.freeze([15, 16]), image: 'assets/corrupted-boar.png', stats: Object.freeze({ maxHp: 220, attack: 26, defense: 20, evasion: 2, parry: 0, damageReduction: 8, attackSpeed: .8, xp: 23, gold: 12 }), skillIds: Object.freeze(['corrupted-hide', 'irritable', 'charge']), aiProfileId: 'durable-charger' }),
    monster('shadow-spider', '暗影蜘蛛', 'normal', '持續中毒攻擊', { combatId: 'shadowSpider', level: Object.freeze([16, 17]), image: 'assets/shadow-spider.png', stats: Object.freeze({ maxHp: 155, attack: 24, defense: 12, evasion: 10, parry: 0, damageReduction: 1, attackSpeed: 1.1, xp: 24, gold: 12 }), skillIds: Object.freeze(['venom-fang']), aiProfileId: 'poison-controller', tags: Object.freeze(['poison']) }),
    monster('withered-tree-walker', '枯木行者', 'normal', '高防禦控制怪物', { combatId: 'witheredTreeWalker', level: Object.freeze([16, 17]), image: 'assets/withered-tree-walker.png', stats: Object.freeze({ maxHp: 250, attack: 23, defense: 23, evasion: 0, parry: 0, damageReduction: 10, attackSpeed: .7, xp: 27, gold: 14 }), skillIds: Object.freeze(['bark-armor', 'entangling-roots']), aiProfileId: 'tank-controller' }),
    monster('black-forest-hunter', '黑森林獵人', 'elite', '束縛與處決低生命目標', { combatId: 'blackForestHunter', level: Object.freeze([17, 17]), image: 'assets/black-forest-hunter.png', stats: Object.freeze({ maxHp: 620, attack: 34, defense: 18, evasion: 13, parry: 8, damageReduction: 7, attackSpeed: 1.15, xp: 72, gold: 42 }), skillIds: Object.freeze(['binding-arrow', 'execution-arrow']), aiProfileId: 'lowest-health-executioner', visualStyle: 'night-elf' }),
    monster('forest-guardian', '森林守護者', 'boss', '三階段入口守關 Boss', { combatId: 'forestGuardianV2', level: Object.freeze([17, 17]), image: 'assets/forest-guardian.png', stats: Object.freeze({ maxHp: 2100, attack: 33, defense: 25, evasion: 4, parry: 6, damageReduction: 12, attackSpeed: .9, xp: 300, gold: 180 }), skillIds: Object.freeze(['root-strike', 'leaf-storm', 'forest-wrath']), aiProfileId: 'three-phase-guardian' })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));

  function getMonster(monsterId) {
    return MONSTER_BY_ID.get(monsterId) || null;
  }

  function getMonstersByRank(rank) {
    return MONSTERS.filter((entry) => entry.rank === rank);
  }

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value) || 0)); }
  function multiplier(level, rate) { return 1 + Math.max(0, Math.floor(Number(level) || 15) - 15) * rate; }
  function rollLevel(monsterId, randomValue = Math.random()) {
    const range = MONSTERS.find((entry) => entry.id === monsterId || entry.combatId === monsterId)?.level;
    if (!range) return null;
    return range[0] + Math.floor(clamp(randomValue, 0, .999999) * (range[1] - range[0] + 1));
  }
  function toCombatMonster(entry, level = null) {
    if (!entry?.stats) return null;
    const resolvedLevel = clamp(level || entry.level[0], entry.level[0], entry.level[1]);
    const stats = entry.stats;
    return {
      id: entry.combatId, policyId: entry.id, name: entry.name, level: resolvedLevel, mapId: MAP.id,
      maxHp: Math.round(stats.maxHp * multiplier(resolvedLevel, GROWTH.hpPerLevel)),
      attack: Math.round(stats.attack * multiplier(resolvedLevel, GROWTH.attackPerLevel)),
      defense: Math.round(stats.defense * multiplier(resolvedLevel, GROWTH.defensePerLevel)),
      xp: Math.round(stats.xp * multiplier(resolvedLevel, GROWTH.expPerLevel)),
      gold: stats.gold, evasion: stats.evasion, parry: stats.parry, damageReduction: stats.damageReduction,
      attackSpeed: stats.attackSpeed, isElite: entry.rank === 'elite', isBoss: entry.rank === 'boss',
      artClass: `monster-image-art ${entry.combatId}`, image: entry.image, skillIds: entry.skillIds
    };
  }
  function getCombatMonster(combatId, level = null) {
    return toCombatMonster(MONSTERS.find((entry) => entry.combatId === combatId), level);
  }
  function getCombatPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.combatId)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.combatId)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.combatId))
    });
  }
  function getPhase(monsterId, currentHp, maxHp) {
    if (monsterId !== 'forestGuardianV2' || !(Number(maxHp) > 0)) return 1;
    const ratio = Math.max(0, Number(currentHp) || 0) / Number(maxHp);
    return ratio <= GUARDIAN.phaseThreeThreshold ? 3 : ratio <= GUARDIAN.phaseTwoThreshold ? 2 : 1;
  }
  function getCombatMultipliers(monsterId, currentHp, maxHp) {
    const ratio = Number(maxHp) > 0 ? Math.max(0, Number(currentHp) || 0) / Number(maxHp) : 1;
    if (monsterId === 'corruptedBoar' && ratio < ENRAGE.hpThreshold) return { attack: 1 + ENRAGE.attackBonus, attackSpeed: 1 + ENRAGE.attackSpeedBonus, defense: 1 };
    if (getPhase(monsterId, currentHp, maxHp) === 3) return { attack: 1 + GUARDIAN.phaseThreeAttackBonus, attackSpeed: 1 + GUARDIAN.phaseThreeAttackSpeedBonus, defense: 1 - GUARDIAN.phaseThreeDefensePenalty };
    return { attack: 1, attackSpeed: 1, defense: 1 };
  }
  function resolveAction(monsterId, randomValue, targetHpRatio = 1, currentHp = 1, maxHp = 1) {
    const roll = clamp(randomValue, 0, .999999);
    if (monsterId === 'blackForestWolf') return roll < BLEED.chance ? 'shadow-bite' : 'attack';
    if (monsterId === 'corruptedBoar') return roll < CONTROL.chargeChance ? 'charge' : 'attack';
    if (monsterId === 'shadowSpider') return roll < POISON.chance ? 'venom-fang' : 'attack';
    if (monsterId === 'witheredTreeWalker') return roll < CONTROL.rootChance ? 'entangling-roots' : 'attack';
    if (monsterId === 'blackForestHunter') {
      if (targetHpRatio < HUNTER.executeThreshold) return 'execution-arrow';
      return roll < HUNTER.bindChance ? 'binding-arrow' : 'attack';
    }
    if (monsterId === 'forestGuardianV2') {
      const phase = getPhase(monsterId, currentHp, maxHp);
      if (phase >= 2 && roll < GUARDIAN.stormChance) return 'leaf-storm';
      if (roll < GUARDIAN.stormChance + GUARDIAN.rootStrikeChance) return 'root-strike';
    }
    return 'attack';
  }
  function getDamageMultiplier(action) {
    return ({ charge: CONTROL.chargeMultiplier, 'binding-arrow': HUNTER.bindMultiplier, 'execution-arrow': HUNTER.executeMultiplier, 'root-strike': GUARDIAN.rootStrikeMultiplier, 'leaf-storm': GUARDIAN.stormMultiplier })[action] || 1;
  }

  return Object.freeze({ MAP, GROWTH, BLEED, POISON, CONTROL, ENRAGE, HUNTER, GUARDIAN, MONSTERS, getMonster, getMonstersByRank, rollLevel, toCombatMonster, getCombatMonster, getCombatPool, getPhase, getCombatMultipliers, resolveAction, getDamageMultiplier });
});
