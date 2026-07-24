(function initializeMonsterDefense(globalScope) {
  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function getStats(monster = {}) {
    return {
      defense: Math.max(0, Number(monster.defense) || 0),
      evasion: clamp(monster.evasion, 0, 100),
      parry: clamp(monster.parry, 0, 100),
      damageReduction: clamp(monster.damageReduction, 0, 95)
    };
  }

  function resolveDamage({
    baseDamage,
    monster,
    damageType = 'physical',
    attackRange = 'ranged',
    canEvade = true,
    canParry = true,
    random = Math.random
  }) {
    const stats = getStats(monster);
    const rawDamage = Math.max(0, Number(baseDamage) || 0);
    const evaded = canEvade && random() < stats.evasion / 100;
    if (evaded || rawDamage === 0) {
      return { finalDamage: 0, evaded, parried: false, stats, afterParry: 0, afterDefense: 0 };
    }

    const isPhysical = damageType === 'physical';
    const isMeleePhysical = isPhysical && attackRange === 'melee';
    const parried = canParry && isMeleePhysical && random() < stats.parry / 100;
    const afterParry = parried ? rawDamage * 0.5 : rawDamage;
    const afterDefense = isPhysical ? afterParry * (100 / (100 + stats.defense)) : afterParry;
    const afterReduction = afterDefense * (1 - stats.damageReduction / 100);
    const finalDamage = rawDamage > 0 ? Math.max(1, Math.ceil(afterReduction)) : 0;

    return { finalDamage, evaded: false, parried, stats, afterParry, afterDefense };
  }

  const api = { getStats, resolveDamage };
  globalScope.MonsterDefense = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : window));
