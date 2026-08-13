(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MagicTowerPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CONFIG = Object.freeze({
    fragmentCost: 10,
    successChance: .4,
    rewardAmount: 1
  });

  function normalizeAmount(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  function getState(progress) {
    return {
      magicFragments: normalizeAmount(progress?.magicFragments),
      magicCrystals: normalizeAmount(progress?.magicCrystals)
    };
  }

  function canSynthesize(progress) {
    const state = getState(progress);
    return {
      ok: state.magicFragments >= CONFIG.fragmentCost,
      ...state,
      required: CONFIG.fragmentCost,
      missing: Math.max(0, CONFIG.fragmentCost - state.magicFragments)
    };
  }

  function synthesize(progress, random = Math.random) {
    if (!progress || typeof progress !== 'object') return { ok: false, reason: 'invalid-progress' };
    const validation = canSynthesize(progress);
    if (!validation.ok) return { ok: false, reason: 'insufficient-fragments', ...validation };
    progress.magicFragments = validation.magicFragments - CONFIG.fragmentCost;
    progress.magicCrystals = validation.magicCrystals;
    const success = Number(random()) < CONFIG.successChance;
    if (success) progress.magicCrystals += CONFIG.rewardAmount;
    return {
      ok: true,
      success,
      consumed: CONFIG.fragmentCost,
      rewarded: success ? CONFIG.rewardAmount : 0,
      ...getState(progress)
    };
  }

  return Object.freeze({ CONFIG, getState, canSynthesize, synthesize });
});
