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
    implemented: true,
    contentStatus: 'combat-ready'
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
      dropTableId: 'black-forest-trail-pending',
      skillIds: Object.freeze([]),
      aiProfileId: null,
      implemented: true,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('blackstone-trail-scout', '黑石斥候', 'normal', '巡邏與偵察', { combatId: 'blackstoneTrailScout', level: Object.freeze([17, 17]), stats: Object.freeze({ maxHp: 230, attack: 35, defense: 16, evasion: 14, parry: 4, damageReduction: 3, attackSpeed: 1.3, xp: 28, gold: 14 }), skillIds: Object.freeze(['scouting-mark']), aiProfileId: 'fast-marker' }),
    monster('blackstone-trail-raider', '黑石掠奪者', 'normal', '近戰攔截與物資護送', { combatId: 'blackstoneTrailRaider', level: Object.freeze([17, 17]), stats: Object.freeze({ maxHp: 320, attack: 37, defense: 25, evasion: 4, parry: 8, damageReduction: 8, attackSpeed: .9, xp: 32, gold: 17 }), skillIds: Object.freeze(['armor-break', 'intercept']), aiProfileId: 'armored-disruptor' }),
    monster('blackstone-archer', '黑石弓箭手', 'normal', '遠程火力', { combatId: 'blackstoneArcher', level: Object.freeze([17, 17]), image: 'assets/blackstone-archer.png', stats: Object.freeze({ maxHp: 210, attack: 39, defense: 16, evasion: 11, parry: 3, damageReduction: 2, attackSpeed: 1.05, xp: 30, gold: 16 }), skillIds: Object.freeze(['piercing-arrow', 'aimed-shot']), aiProfileId: 'ranged-burst' }),
    monster('blackstone-poison-spider', '黑石毒蜘蛛', 'normal', '黑石圈養的毒系怪物', { combatId: 'blackstonePoisonSpider', level: Object.freeze([17, 17]), image: 'assets/blackstone-poison-spider.png', stats: Object.freeze({ maxHp: 250, attack: 34, defense: 18, evasion: 10, parry: 0, damageReduction: 3, attackSpeed: 1.15, xp: 31, gold: 15 }), skillIds: Object.freeze(['venom-fang', 'webbed-strike']), aiProfileId: 'poison-controller', faction: 'blackstone-beasts', ownerFaction: 'blackstone-bandits', tags: Object.freeze(['beast', 'poison', 'spider']) }),
    monster('blackstone-beastmaster', '黑石訓獸師', 'elite', '指揮與強化圈養蜘蛛', { combatId: 'blackstoneBeastmaster', level: Object.freeze([17, 17]), image: 'assets/blackstone-beastmaster.png', stats: Object.freeze({ maxHp: 720, attack: 50, defense: 36, evasion: 9, parry: 7, damageReduction: 7, attackSpeed: 1, xp: 90, gold: 52 }), skillIds: Object.freeze(['venom-flask', 'beast-command', 'release-spider']), aiProfileId: 'poison-beast-handler' }),
    monster('blackstone-captain', '黑石隊長', 'elite', '巡邏隊與補給線指揮官', { combatId: 'blackstoneCaptain', level: Object.freeze([17, 17]), image: 'assets/blackstone-captain.png', stats: Object.freeze({ maxHp: 880, attack: 54, defense: 40, evasion: 5, parry: 14, damageReduction: 10, attackSpeed: .9, xp: 105, gold: 65 }), skillIds: Object.freeze(['captain-command', 'shield-counter', 'captain-execution']), aiProfileId: 'low-health-executioner' }),
    monster('blackstone-centurion', '黑石百夫長', 'boss', '守衛補給路線並持有蛛巢線索', { combatId: 'blackstoneCenturion', level: Object.freeze([17, 17]), image: 'assets/blackstone-centurion.png', stats: Object.freeze({ maxHp: 2800, attack: 64, defense: 53, evasion: 3, parry: 12, damageReduction: 14, attackSpeed: .85, xp: 380, gold: 230 }), skillIds: Object.freeze(['centurion-cleave', 'centurion-command', 'execution-axe', 'blackstone-fury']), aiProfileId: 'three-phase-centurion' })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));

  function getMonster(monsterId) {
    return MONSTER_BY_ID.get(monsterId) || null;
  }

  function getMonstersByRank(rank) {
    return MONSTERS.filter((entry) => entry.rank === rank);
  }

  const MARK = Object.freeze({ durationMs: 5000, blackstoneHumanDamageBonus: .12, archerDamageBonus: .20 });
  const SCOUT = Object.freeze({ retreatThreshold: .30, evasionBonus: 15, attackSpeedBonus: .25 });
  const RAIDER = Object.freeze({ armorBreakDurationMs: 5000, armorBreakPenalty: .15, interceptDurationMs: 3000, interceptAttackSpeedPenalty: .20 });
  const ARCHER = Object.freeze({ piercingDefenseIgnore: .30 });
  const POISON = Object.freeze({ durationMs: 5000, tickMs: 1000, attackRatio: .07, maxStacks: 3 });
  const CONTROL = Object.freeze({ webDurationMs: 4000, webAttackSpeedPenalty: .20 });
  const BEASTMASTER = Object.freeze({ commandDurationMs: 6000, spiderAttackBonus: .20, spiderAttackSpeedBonus: .20 });
  const CAPTAIN = Object.freeze({ commandDurationMs: 6000, commandAttackBonus: .15, shieldDurationMs: 5000, shieldParryBonus: 25, counterDamageMultiplier: .60 });
  const CENTURION = Object.freeze({ phaseTwoThreshold: .70, phaseThreeThreshold: .35, phaseTwoAttackBonus: .10, phaseTwoAttackSpeedBonus: .05, phaseThreeAttackBonus: .20, phaseThreeAttackSpeedBonus: .15, phaseThreeDefensePenalty: .15 });

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value) || 0)); }
  function rollLevel(monsterId) { return getMonster(monsterId) || MONSTERS.find((entry) => entry.combatId === monsterId) ? 17 : null; }
  function toCombatMonster(entry) {
    if (!entry?.stats) return null;
    return {
      id: entry.combatId, policyId: entry.id, name: entry.name, level: 17, mapId: MAP.id,
      ...entry.stats, isElite: entry.rank === 'elite', isBoss: entry.rank === 'boss',
      faction: entry.faction, ownerFaction: entry.ownerFaction || null,
      artClass: `monster-image-art ${entry.combatId}`, image: entry.image, skillIds: entry.skillIds
    };
  }
  function getCombatMonster(combatId) { return toCombatMonster(MONSTERS.find((entry) => entry.combatId === combatId || entry.id === combatId)); }
  function getCombatPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.combatId)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.combatId)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.combatId))
    });
  }
  function getPhase(monsterId, currentHp, maxHp) {
    if (monsterId !== 'blackstoneCenturion' || !(Number(maxHp) > 0)) return 1;
    const ratio = Math.max(0, Number(currentHp) || 0) / Number(maxHp);
    return ratio <= CENTURION.phaseThreeThreshold ? 3 : ratio <= CENTURION.phaseTwoThreshold ? 2 : 1;
  }
  function getCombatMultipliers(monsterId, currentHp, maxHp) {
    const ratio = Number(maxHp) > 0 ? Math.max(0, Number(currentHp) || 0) / Number(maxHp) : 1;
    if (monsterId === 'blackstoneTrailScout' && ratio < SCOUT.retreatThreshold) return { attack: 1, attackSpeed: 1 + SCOUT.attackSpeedBonus, defense: 1, evasion: SCOUT.evasionBonus };
    const phase = getPhase(monsterId, currentHp, maxHp);
    if (phase === 3) return { attack: 1 + CENTURION.phaseThreeAttackBonus, attackSpeed: 1 + CENTURION.phaseThreeAttackSpeedBonus, defense: 1 - CENTURION.phaseThreeDefensePenalty, evasion: 0 };
    if (phase === 2) return { attack: 1 + CENTURION.phaseTwoAttackBonus, attackSpeed: 1 + CENTURION.phaseTwoAttackSpeedBonus, defense: 1, evasion: 0 };
    return { attack: 1, attackSpeed: 1, defense: 1, evasion: 0 };
  }
  function resolveAction(monsterId, randomValue, targetHpRatio = 1, currentHp = 1, maxHp = 1) {
    const roll = clamp(randomValue, 0, .999999);
    if (monsterId === 'blackstoneTrailScout') return roll < .30 ? 'scouting-mark' : 'attack';
    if (monsterId === 'blackstoneTrailRaider') return roll < .25 ? 'armor-break' : roll < .35 ? 'intercept' : 'attack';
    if (monsterId === 'blackstoneArcher') return roll < .10 ? 'aimed-shot' : roll < .35 ? 'piercing-arrow' : 'attack';
    if (monsterId === 'blackstonePoisonSpider') return roll < .30 ? 'venom-fang' : roll < .40 ? 'webbed-strike' : 'attack';
    if (monsterId === 'blackstoneBeastmaster') return roll < .25 ? 'venom-flask' : roll < .45 ? 'beast-command' : roll < .55 ? 'release-spider' : 'attack';
    if (monsterId === 'blackstoneCaptain') {
      if (roll < .20) return 'captain-command';
      if (roll < .40) return 'shield-counter';
      if (targetHpRatio < .35 && roll < .50) return 'captain-execution';
      return 'attack';
    }
    if (monsterId === 'blackstoneCenturion') {
      const phase = getPhase(monsterId, currentHp, maxHp);
      if (phase === 3 && targetHpRatio < .35 && roll < .15) return 'execution-axe';
      if (phase >= 2 && roll < .30) return 'centurion-command';
      if (roll < .50) return 'centurion-cleave';
    }
    return 'attack';
  }
  function getDamageMultiplier(action) {
    return ({ 'armor-break': 1.2, 'aimed-shot': 1.7, 'venom-flask': 1.15, 'captain-execution': 1.8, 'centurion-cleave': 1.4, 'centurion-command': 1.3, 'execution-axe': 2.1 })[action] || 1;
  }

  function getDefenseIgnore(action) { return action === 'piercing-arrow' ? ARCHER.piercingDefenseIgnore : 0; }

  return Object.freeze({ MAP, STORY, MARK, SCOUT, RAIDER, ARCHER, POISON, CONTROL, BEASTMASTER, CAPTAIN, CENTURION, MONSTERS, getMonster, getMonstersByRank, rollLevel, toCombatMonster, getCombatMonster, getCombatPool, getPhase, getCombatMultipliers, resolveAction, getDamageMultiplier, getDefenseIgnore });
});
