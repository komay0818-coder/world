(function attachControlEffectPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ControlEffectPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createControlEffectPolicy() {
  const CONTROL_RESISTANCE_CAP = .75;
  const ATTACK_SPEED_SLOW_CAP = .45;
  const TYPES = Object.freeze({ STUN: 'stun', ATTACK_SPEED_SLOW: 'attack-speed-slow' });

  function clampResistance(value) {
    return Math.min(CONTROL_RESISTANCE_CAP, Math.max(0, Number(value) || 0));
  }

  function getFinalControlDuration(baseDurationMs, controlResistancePercent = 0) {
    return Math.max(0, Number(baseDurationMs) || 0) * (1 - clampResistance(controlResistancePercent));
  }

  function applyControlEffectToPlayer(player, options = {}) {
    const now = Number(options.now) || 0;
    const durationMs = getFinalControlDuration(options.baseDurationMs, options.controlResistancePercent);
    const until = now + durationMs;
    if (!player || durationMs <= 0) return Object.freeze({ applied: false, type: options.type, durationMs: 0, until: now });
    if (options.type === TYPES.STUN) {
      player.stunnedUntil = Math.max(Number(player.stunnedUntil) || 0, until);
      return Object.freeze({ applied: true, type: options.type, durationMs, until: player.stunnedUntil });
    }
    if (options.type === TYPES.ATTACK_SPEED_SLOW) {
      const activePenalty = now < (Number(player.blackstoneAttackSpeedPenaltyUntil) || 0)
        ? Number(player.blackstoneAttackSpeedPenalty) || 0 : 0;
      const penalty = Math.min(ATTACK_SPEED_SLOW_CAP, Math.max(0, Number(options.magnitude) || 0));
      player.blackstoneAttackSpeedPenalty = Math.max(activePenalty, penalty);
      player.blackstoneAttackSpeedPenaltyUntil = Math.max(Number(player.blackstoneAttackSpeedPenaltyUntil) || 0, until);
      return Object.freeze({ applied: true, type: options.type, durationMs, until: player.blackstoneAttackSpeedPenaltyUntil, magnitude: player.blackstoneAttackSpeedPenalty });
    }
    return Object.freeze({ applied: false, type: options.type, durationMs: 0, until: now });
  }

  return Object.freeze({ CONTROL_RESISTANCE_CAP, ATTACK_SPEED_SLOW_CAP, TYPES, clampResistance, getFinalControlDuration, applyControlEffectToPlayer });
}));
