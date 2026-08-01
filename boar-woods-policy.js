(function attachBoarWoodsPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BoarWoodsPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createBoarWoodsPolicy() {
  const BOAR_TYPES = Object.freeze(['boarPiglet', 'forestBoar', 'irritableBoar', 'boarKing']);
  const THICK_HIDE_DAMAGE_REDUCTION_BONUS = 5;
  const IRRITABLE_TYPES = Object.freeze(['irritableBoar', 'boarKing']);
  const IRRITABLE_HP_THRESHOLD = .40;
  const IRRITABLE_BONUS = .15;
  const BOSS_CHARGE_CHANCE = .30;
  const BOSS_CHARGE_STUN_MS = 2000;

  function applyBoarWoodsPassive(monster = {}, mapId = '') {
    if (mapId !== 'boar-woods' || !BOAR_TYPES.includes(monster.id)) return monster;
    return {
      ...monster,
      damageReduction: Math.min(95, Math.max(0, Number(monster.damageReduction) || 0) + THICK_HIDE_DAMAGE_REDUCTION_BONUS),
      passiveDamageReduction: true
    };
  }

  function isIrritableActive(monsterId, currentHp, maxHp) {
    const safeMaxHp = Math.max(0, Number(maxHp) || 0);
    if (!IRRITABLE_TYPES.includes(monsterId) || safeMaxHp === 0) return false;
    return Math.max(0, Number(currentHp) || 0) / safeMaxHp < IRRITABLE_HP_THRESHOLD;
  }

  function getIrritableMultiplier(monsterId, currentHp, maxHp) {
    return isIrritableActive(monsterId, currentHp, maxHp) ? 1 + IRRITABLE_BONUS : 1;
  }

  function shouldCharge(monsterId, randomValue) {
    return monsterId === 'boarKing' && Number(randomValue) < BOSS_CHARGE_CHANCE;
  }

  return {
    BOAR_TYPES,
    THICK_HIDE_DAMAGE_REDUCTION_BONUS,
    IRRITABLE_TYPES,
    IRRITABLE_HP_THRESHOLD,
    IRRITABLE_BONUS,
    BOSS_CHARGE_CHANCE,
    BOSS_CHARGE_STUN_MS,
    applyBoarWoodsPassive,
    isIrritableActive,
    getIrritableMultiplier,
    shouldCharge
  };
}));
