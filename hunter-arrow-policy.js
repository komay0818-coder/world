(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HunterArrowPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STARTER_QUIVER = Object.freeze({
    id: 'starter-hunter-offhand-quiver',
    kind: 'equipment',
    series: '箭筒',
    name: '新手箭筒',
    slot: 'offhand',
    image: 'assets/hunter-quiver.png',
    maxArrows: 8,
    arrowRecoveryInterval: 1000,
    quality: '新兵',
    allowedJobs: Object.freeze(['hunter'])
  });
  const SKILL_COSTS = Object.freeze({
    'power-shot': 2,
    companion: 0,
    'multi-shot': 3
  });

  function isHunter(job) {
    return job === 'hunter';
  }

  function createStarterQuiver() {
    return { ...STARTER_QUIVER, allowedJobs: [...STARTER_QUIVER.allowedJobs] };
  }

  function getQuiver(equipment) {
    const offhand = equipment?.offhand;
    return offhand?.slot === 'offhand'
      && Number(offhand.maxArrows) > 0
      && Number(offhand.arrowRecoveryInterval) > 0
      ? offhand
      : null;
  }

  function ensureStarterQuiver(equipment) {
    const normalized = equipment && typeof equipment === 'object' ? equipment : {};
    if (!getQuiver(normalized)) normalized.offhand = createStarterQuiver();
    return normalized;
  }

  function getMaxArrows(equipment) {
    return Math.max(1, Math.floor(Number(getQuiver(equipment)?.maxArrows) || STARTER_QUIVER.maxArrows));
  }

  function getRecoveryInterval(equipment) {
    const quiver = getQuiver(equipment);
    const baseInterval = Number(quiver?.arrowRecoveryInterval) || STARTER_QUIVER.arrowRecoveryInterval;
    const recoverySpeedBonus = Math.max(0, Number(quiver?.arrowRecoverySpeedBonus) || 0);
    return Math.max(1, baseInterval / (1 + recoverySpeedBonus));
  }

  function clampArrows(value, equipment) {
    return Math.max(0, Math.min(getMaxArrows(equipment), Math.floor(Number(value) || 0)));
  }

  function recoverArrows(currentArrows, elapsedMilliseconds, equipment) {
    const interval = getRecoveryInterval(equipment);
    const elapsed = Math.max(0, Number(elapsedMilliseconds) || 0);
    const recovered = Math.floor(elapsed / interval);
    return {
      arrows: clampArrows(currentArrows + recovered, equipment),
      recovered,
      remainder: elapsed - recovered * interval
    };
  }

  function getSkillCost(skillId) {
    return SKILL_COSTS[skillId] ?? null;
  }

  function canUseSkill(currentArrows, skillId, equipment) {
    const cost = getSkillCost(skillId);
    return cost !== null && clampArrows(currentArrows, equipment) >= cost;
  }

  function spendArrows(currentArrows, skillId, equipment) {
    if (!canUseSkill(currentArrows, skillId, equipment)) return null;
    return clampArrows(currentArrows, equipment) - getSkillCost(skillId);
  }

  return {
    STARTER_QUIVER,
    SKILL_COSTS,
    isHunter,
    createStarterQuiver,
    getQuiver,
    ensureStarterQuiver,
    getMaxArrows,
    getRecoveryInterval,
    clampArrows,
    recoverArrows,
    getSkillCost,
    canUseSkill,
    spendArrows
  };
}));
