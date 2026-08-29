(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AssassinOffhandPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createAssassinOffhandPolicy() {
  const OFFHAND_ATTACK_CONTRIBUTION = .5;
  const OFFHAND_STRIKE_POWER = .5;

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Number(value) || 0));
  }

  function isDagger(item) {
    const weaponType = String(item?.weaponType || '').toLowerCase();
    return weaponType.includes('dagger') || weaponType === '匕首' || String(item?.series || '') === '匕首';
  }

  function getEquippedAttack(item, slot) {
    let attack = Number(item?.attack) || 0;
    if (slot === 'offhand' && isDagger(item) && Number.isFinite(Number(item?.attackMin)) && Number.isFinite(Number(item?.attackMax))) {
      attack = (Number(item.attackMin) + Number(item.attackMax)) / 2;
    }
    return slot === 'offhand' && isDagger(item) ? attack * OFFHAND_ATTACK_CONTRIBUTION : attack;
  }

  function calculateOffhandStrike(stats, mastery = {}, criticalRoll = Math.random()) {
    const criticalChance = clamp((Number(stats?.crit) || 0) + (Number(mastery?.offhandCrit) || 0), 0, .95);
    const critical = clamp(criticalRoll, 0, .999999) < criticalChance;
    const damageBonus = Math.max(0, Number(mastery?.offhandDamage) || 0);
    const criticalMultiplier = Math.max(1, Number(stats?.criticalDamageMultiplier) || 1.5);
    const damage = Math.max(0, Number(stats?.attack) || 0)
      * OFFHAND_STRIKE_POWER
      * (1 + damageBonus)
      * (critical ? criticalMultiplier : 1);
    return { damage, critical, criticalChance };
  }

  return Object.freeze({
    OFFHAND_ATTACK_CONTRIBUTION,
    OFFHAND_STRIKE_POWER,
    isDagger,
    getEquippedAttack,
    calculateOffhandStrike
  });
}));
