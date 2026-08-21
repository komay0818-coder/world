(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MapExpPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHAPTER_LEVEL_RANGES = Object.freeze({
    1: Object.freeze([1, 15]),
    2: Object.freeze([15, 30]),
    3: Object.freeze([30, 45])
  });

  const DECAY_BANDS = Object.freeze([
    Object.freeze({ maxLevelsOver: 0, multiplier: 1 }),
    Object.freeze({ maxLevelsOver: 3, multiplier: .70 }),
    Object.freeze({ maxLevelsOver: 6, multiplier: .40 }),
    Object.freeze({ maxLevelsOver: 9, multiplier: .20 }),
    Object.freeze({ maxLevelsOver: Infinity, multiplier: .05 })
  ]);

  function getRecommendedMaxLevel(map = {}) {
    const level = Number(map.recommendedMaxLevel ?? map.monsterMax ?? map.max);
    return Number.isFinite(level) ? level : null;
  }

  function getMultiplier(playerLevel, recommendedMaxLevel) {
    const level = Number(playerLevel);
    if (recommendedMaxLevel === null || recommendedMaxLevel === undefined) return 1;
    const maximum = Number(recommendedMaxLevel);
    if (!Number.isFinite(level) || !Number.isFinite(maximum)) return 1;
    const levelsOver = Math.max(0, level - maximum);
    return DECAY_BANDS.find((band) => levelsOver <= band.maxLevelsOver).multiplier;
  }

  function calculate(baseExp, playerLevel, map = {}) {
    const base = Math.max(0, Number(baseExp) || 0);
    const recommendedMaxLevel = getRecommendedMaxLevel(map);
    const multiplier = getMultiplier(playerLevel, recommendedMaxLevel);
    return Object.freeze({
      baseExp: base,
      actualExp: Math.round(base * multiplier * 100) / 100,
      multiplier,
      recommendedMaxLevel,
      levelsOver: recommendedMaxLevel === null ? 0 : Math.max(0, Number(playerLevel) - recommendedMaxLevel)
    });
  }

  return Object.freeze({ CHAPTER_LEVEL_RANGES, DECAY_BANDS, getRecommendedMaxLevel, getMultiplier, calculate });
});
