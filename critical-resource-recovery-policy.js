(function attachCriticalResourceRecoveryPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CriticalResourceRecoveryPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCriticalResourceRecoveryPolicy() {
  const ELIGIBLE_ATTACK_KINDS = Object.freeze(['basic', 'skill']);

  function normalizePercent(value) {
    return Math.max(0, Number(value) || 0);
  }

  function restorePrimaryResource(member, percent) {
    const maximum = Math.max(0, Number(member?.resourceMax) || 0);
    const current = Math.min(maximum, Math.max(0, Number(member?.resourceCurrent) || 0));
    const requested = maximum > 0 ? Math.ceil(maximum * normalizePercent(percent)) : 0;
    const next = Math.min(maximum, current + requested);
    if (member) member.resourceCurrent = next;
    return Object.freeze({ triggered: requested > 0, requested, restored: next - current, current: next, maximum });
  }

  function resolveExecution(member, options = {}) {
    const attackKind = String(options.attackKind || '');
    const eligible = ELIGIBLE_ATTACK_KINDS.includes(attackKind);
    const triggered = eligible && options.critical === true && options.hadDirectHit === true;
    if (!triggered) {
      return Object.freeze({ triggered: false, requested: 0, restored: 0, current: Number(member?.resourceCurrent) || 0, maximum: Math.max(0, Number(member?.resourceMax) || 0) });
    }
    return restorePrimaryResource(member, options.recoveryPercent);
  }

  return Object.freeze({ ELIGIBLE_ATTACK_KINDS, restorePrimaryResource, resolveExecution });
}));
