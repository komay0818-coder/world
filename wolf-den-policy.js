(function attachWolfDenPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WolfDenPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createWolfDenPolicy() {
  const WOLF_TYPES = Object.freeze(['plainsWolfPup', 'denForestWolf', 'ragingWolf', 'greatfangWolf']);
  const EVASION_BONUS = 10;
  const BOSS_BLEED_CHANCE = .30;
  const BOSS_BLOOD_FRENZY_BONUS = .20;
  const BLEED_DURATION_MS = 5000;
  const BLEED_TICK_MS = 1000;

  function applyWolfDenPassive(monster = {}, mapId = '') {
    if (mapId !== 'wolf-den' || !WOLF_TYPES.includes(monster.id)) return monster;
    return { ...monster, evasion: Math.min(100, (Number(monster.evasion) || 0) + EVASION_BONUS), passiveEvasion: true };
  }

  function shouldInflictBleed(monsterId, randomValue) {
    return monsterId === 'greatfangWolf' && Number(randomValue) < BOSS_BLEED_CHANCE;
  }

  function getBloodFrenzyMultiplier(monsterId, targetIsBleeding) {
    return monsterId === 'greatfangWolf' && targetIsBleeding ? 1 + BOSS_BLOOD_FRENZY_BONUS : 1;
  }

  return {
    WOLF_TYPES,
    EVASION_BONUS,
    BOSS_BLEED_CHANCE,
    BOSS_BLOOD_FRENZY_BONUS,
    BLEED_DURATION_MS,
    BLEED_TICK_MS,
    applyWolfDenPassive,
    shouldInflictBleed,
    getBloodFrenzyMultiplier
  };
}));
