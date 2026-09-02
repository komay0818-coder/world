(function attachDirectHitHealthRecoveryPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DirectHitHealthRecoveryPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createDirectHitHealthRecoveryPolicy() {
  const TRIGGER_CHANCE = .05;
  const ELIGIBLE_DAMAGE_KIND = 'enemy-direct';

  function resolveDirectHit(member, options = {}, random = Math.random) {
    const actualDamage = Math.max(0, Number(options.actualDamage) || 0);
    const maximum = Math.max(0, Number(member?.maxHp) || 0);
    const current = Math.min(maximum, Math.max(0, Number(member?.currentHp) || 0));
    const recoveryPercent = Math.max(0, Number(options.recoveryPercent) || 0);
    const eligible = options.damageKind === ELIGIBLE_DAMAGE_KIND
      && actualDamage > 0 && current > 0 && maximum > 0 && recoveryPercent > 0;
    if (!eligible || Math.max(0, Math.min(.999999, Number(random()) || 0)) >= TRIGGER_CHANCE) {
      return Object.freeze({ triggered: false, restored: 0, current, maximum });
    }
    const requested = Math.ceil(maximum * recoveryPercent);
    const next = Math.min(maximum, current + requested);
    if (member) member.currentHp = next;
    return Object.freeze({ triggered: true, requested, restored: next - current, current: next, maximum });
  }

  return Object.freeze({ TRIGGER_CHANCE, ELIGIBLE_DAMAGE_KIND, resolveDirectHit });
}));
