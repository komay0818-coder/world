(function attachGoblinCampPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GoblinCampPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createGoblinCampPolicy() {
  const STRENGTH_MULTIPLIER = 1.5;
  const SLINGER_STUN_CHANCE = .2;
  const SHAMAN_HEAL_CHANCE = .20;
  const SHAMAN_HEAL_RATIO = .15;
  const SHAMAN_HEAL_COOLDOWN_MS = 10000;
  const HIGH_CHIEF_TOTEM_CHANCE = .25;
  const HIGH_CHIEF_SUMMON_CHANCE = .15;

  // These are the final combat values used inside Goblin Camp. They are
  // applied after chapter level scaling, so they must not be multiplied by
  // STRENGTH_MULTIPLIER again.
  const FINAL_COMBAT_STATS = Object.freeze({
    goblinScout: Object.freeze({
      8: Object.freeze({ maxHp: 48, attack: 9, defense: 2 }),
      9: Object.freeze({ maxHp: 52, attack: 9, defense: 2 })
    }),
    goblinWarrior: Object.freeze({
      8: Object.freeze({ maxHp: 80, attack: 11, defense: 6 }),
      9: Object.freeze({ maxHp: 85, attack: 12, defense: 6 }),
      10: Object.freeze({ maxHp: 90, attack: 12, defense: 6 })
    }),
    goblinSlinger: Object.freeze({
      9: Object.freeze({ maxHp: 60, attack: 13, defense: 3 }),
      10: Object.freeze({ maxHp: 64, attack: 13, defense: 3 })
    }),
    goblinGuard: Object.freeze({
      11: Object.freeze({ maxHp: 300, attack: 18, defense: 16 })
    }),
    goblinCaptain: Object.freeze({
      12: Object.freeze({ maxHp: 950, attack: 24, defense: 20 })
    }),
    goblinShaman: Object.freeze({
      11: Object.freeze({ maxHp: 220, attack: 18, defense: 8 })
    }),
    goblinHighChief: Object.freeze({
      12: Object.freeze({ maxHp: 1050, attack: 20, defense: 18 })
    })
  });

  function getFinalCombatStats(monster = {}) {
    const byLevel = FINAL_COMBAT_STATS[monster.id];
    if (!byLevel) return null;
    return byLevel[Math.round(Number(monster.level) || 0)] || null;
  }

  function scaleMonster(monster = {}, active = false) {
    if (!active) return monster;
    const finalStats = getFinalCombatStats(monster);
    if (finalStats) return { ...monster, ...finalStats };
    return {
      ...monster,
      maxHp: Math.max(1, Math.round((Number(monster.maxHp) || 1) * STRENGTH_MULTIPLIER)),
      attack: Math.max(1, Math.round((Number(monster.attack) || 1) * STRENGTH_MULTIPLIER)),
      defense: Math.max(0, Math.round((Number(monster.defense) || 0) * STRENGTH_MULTIPLIER))
    };
  }

  function shouldStun(type, randomValue) {
    return type === 'goblinSlinger' && Number(randomValue) < SLINGER_STUN_CHANCE;
  }

  function resolveAction({ type, randomValue, hasWoundedAlly = false, canHeal = true, canSummon = false }) {
    const roll = Math.min(1, Math.max(0, Number(randomValue) || 0));
    if (type === 'goblinShaman' && hasWoundedAlly && canHeal && roll < SHAMAN_HEAL_CHANCE) return 'heal';
    if (type !== 'goblinHighChief') return 'attack';
    if (hasWoundedAlly && roll < HIGH_CHIEF_TOTEM_CHANCE) return 'healing-totem';
    const summonThreshold = (hasWoundedAlly ? HIGH_CHIEF_TOTEM_CHANCE : 0) + HIGH_CHIEF_SUMMON_CHANCE;
    if (canSummon && roll < summonThreshold) return 'summon-scout';
    return 'attack';
  }

  return {
    STRENGTH_MULTIPLIER,
    SLINGER_STUN_CHANCE,
    SHAMAN_HEAL_CHANCE,
    SHAMAN_HEAL_RATIO,
    SHAMAN_HEAL_COOLDOWN_MS,
    HIGH_CHIEF_TOTEM_CHANCE,
    HIGH_CHIEF_SUMMON_CHANCE,
    FINAL_COMBAT_STATS,
    getFinalCombatStats,
    scaleMonster,
    shouldStun,
    resolveAction
  };
}));
