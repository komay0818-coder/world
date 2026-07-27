(function attachGoblinCampPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GoblinCampPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createGoblinCampPolicy() {
  const STRENGTH_MULTIPLIER = 1.5;
  const SLINGER_STUN_CHANCE = .2;
  const SHAMAN_HEAL_CHANCE = .35;
  const HIGH_CHIEF_TOTEM_CHANCE = .25;
  const HIGH_CHIEF_SUMMON_CHANCE = .15;

  function scaleMonster(monster = {}, active = false) {
    if (!active) return monster;
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

  function resolveAction({ type, randomValue, hasWoundedAlly = false, canSummon = false }) {
    const roll = Math.min(1, Math.max(0, Number(randomValue) || 0));
    if (type === 'goblinShaman' && hasWoundedAlly && roll < SHAMAN_HEAL_CHANCE) return 'heal';
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
    HIGH_CHIEF_TOTEM_CHANCE,
    HIGH_CHIEF_SUMMON_CHANCE,
    scaleMonster,
    shouldStun,
    resolveAction
  };
}));
