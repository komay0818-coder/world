(function attachConditionalDamagePolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ConditionalDamagePolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createConditionalDamagePolicy() {
  'use strict';
  const LOW_HEALTH_THRESHOLD = .30;
  const HIGH_HEALTH_THRESHOLD = .80;
  const ELIGIBLE_ATTACK_KINDS = Object.freeze(['basic', 'skill', 'counter']);

  function getHpRatio(currentHp, maxHp) {
    const maximum = Math.max(0, Number(maxHp) || 0);
    if (maximum <= 0) return 0;
    return Math.max(0, Math.min(1, (Number(currentHp) || 0) / maximum));
  }

  function getDamageBonus({ currentHp = 0, maxHp = 0, lowHealthDamagePercent = 0, highHealthDamagePercent = 0, attackKind } = {}) {
    if (!ELIGIBLE_ATTACK_KINDS.includes(attackKind)) return 0;
    const ratio = getHpRatio(currentHp, maxHp);
    const lowHealthBonus = ratio < LOW_HEALTH_THRESHOLD ? Math.max(0, Number(lowHealthDamagePercent) || 0) : 0;
    const highHealthBonus = ratio > HIGH_HEALTH_THRESHOLD ? Math.max(0, Number(highHealthDamagePercent) || 0) : 0;
    return lowHealthBonus + highHealthBonus;
  }

  function getDamageMultiplier(options = {}) {
    return 1 + getDamageBonus(options);
  }

  return Object.freeze({ LOW_HEALTH_THRESHOLD, HIGH_HEALTH_THRESHOLD, ELIGIBLE_ATTACK_KINDS, getHpRatio, getDamageBonus, getDamageMultiplier });
}));
