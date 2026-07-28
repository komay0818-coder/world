(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AssassinEnergyPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MAX_ENERGY = 100;
  const ENERGY_REGEN_PER_SECOND = 10;
  const SKILL_COSTS = Object.freeze({
    backstab: 35,
    'shadow-dance': 60,
    'poison-blade': 25
  });

  function isAssassin(job) {
    return job === 'assassin';
  }

  function clampEnergy(value) {
    return Math.max(0, Math.min(MAX_ENERGY, Number(value) || 0));
  }

  function getRegeneratedEnergy(currentEnergy, elapsedSeconds) {
    const safeElapsed = Math.max(0, Number(elapsedSeconds) || 0);
    return clampEnergy(currentEnergy + safeElapsed * ENERGY_REGEN_PER_SECOND);
  }

  function getElapsedSeconds(now, lastUpdatedAt) {
    const current = Number(now) || 0;
    const previous = Number(lastUpdatedAt) || current;
    return Math.max(0, (current - previous) / 1000);
  }

  function normalizeProgress(progress, now = Date.now()) {
    const target = progress || {};
    target.maxEnergy = MAX_ENERGY;
    if (!Number.isFinite(Number(target.energy))) target.energy = MAX_ENERGY;
    if (!Number.isFinite(Number(target.energyUpdatedAt))) target.energyUpdatedAt = now;
    target.energy = getRegeneratedEnergy(
      target.energy,
      getElapsedSeconds(now, target.energyUpdatedAt)
    );
    target.energyUpdatedAt = now;
    return target;
  }

  function getSkillCost(skillId) {
    return SKILL_COSTS[skillId] ?? null;
  }

  function canUseSkill(currentEnergy, skillId) {
    const cost = getSkillCost(skillId);
    return cost !== null && clampEnergy(currentEnergy) >= cost;
  }

  function spendEnergy(currentEnergy, skillId) {
    const cost = getSkillCost(skillId);
    if (cost === null || !canUseSkill(currentEnergy, skillId)) return null;
    return clampEnergy(currentEnergy - cost);
  }

  return {
    MAX_ENERGY,
    ENERGY_REGEN_PER_SECOND,
    SKILL_COSTS,
    isAssassin,
    clampEnergy,
    getRegeneratedEnergy,
    getElapsedSeconds,
    normalizeProgress,
    getSkillCost,
    canUseSkill,
    spendEnergy
  };
}));
