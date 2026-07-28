(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ManaRegenPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function getElapsedSeconds(now, lastRegenAt, maximumSeconds = 5) {
    const current = Number(now) || 0;
    const previous = Number(lastRegenAt) || current;
    return Math.max(0, Math.min(maximumSeconds, (current - previous) / 1000));
  }

  function calculateRegenAmount({
    maxMana,
    regenMultiplier = 1,
    flatPerSecond = 0,
    elapsedSeconds = 0
  }) {
    const safeMaxMana = Math.max(0, Number(maxMana) || 0);
    const safeMultiplier = Math.max(0, Number(regenMultiplier) || 0);
    const safeFlatRegen = Math.max(0, Number(flatPerSecond) || 0);
    const safeElapsedSeconds = Math.max(0, Number(elapsedSeconds) || 0);
    const basePerSecond = Math.max(.625, safeMaxMana * .01);
    return (basePerSecond * safeMultiplier + safeFlatRegen) * safeElapsedSeconds;
  }

  return { getElapsedSeconds, calculateRegenAmount };
}));
