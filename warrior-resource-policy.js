(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WarriorResourcePolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MAX_RAGE = 100;
  const RAGE_PER_ATTACK = 8;
  const RAGE_PER_HIT_TAKEN = 5;

  function isWarrior(job) {
    return job === 'warrior';
  }

  function clampRage(value) {
    return Math.max(0, Math.min(MAX_RAGE, Number(value) || 0));
  }

  function gainFromAttack(currentRage) {
    return clampRage(currentRage + RAGE_PER_ATTACK);
  }

  function gainFromHitTaken(currentRage) {
    return clampRage(currentRage + RAGE_PER_HIT_TAKEN);
  }

  return {
    MAX_RAGE,
    RAGE_PER_ATTACK,
    RAGE_PER_HIT_TAKEN,
    isWarrior,
    clampRage,
    gainFromAttack,
    gainFromHitTaken
  };
}));
