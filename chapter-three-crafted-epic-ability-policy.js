(function attachChapterThreeCraftedEpicAbilityPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterThreeCraftedEpicAbilityPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterThreeCraftedEpicAbilityPolicy() {
  const ABILITIES = Object.freeze({
    wastelandResilience: 'wasteland_resilience',
    surgingBattleWill: 'surging_battle_will',
    runeResonance: 'crafted_rune_resonance'
  });
  const WASTELAND = Object.freeze({ perStack: .03, maxStacks: 3, durationMs: 5000 });
  const BATTLE_WILL = Object.freeze({ perStack: .03, maxStacks: 3, durationMs: 6000 });
  const RUNE_RESONANCE = Object.freeze({ damageBonus: .15, durationMs: 6000 });
  const ELIGIBLE_OUTGOING_KINDS = Object.freeze(['basic', 'skill', 'counter']);

  function hasAbility(equipment, id) {
    return Object.values(equipment || {}).some((item) => item?.specialAbility?.id === id);
  }
  function expire(member, now) {
    if (!member) return member;
    if (now >= (member.wastelandResilienceUntil || 0)) {
      member.wastelandResilienceStacks = 0;
      member.wastelandResilienceUntil = 0;
    }
    if (now >= (member.surgingBattleWillUntil || 0)) {
      member.surgingBattleWillStacks = 0;
      member.surgingBattleWillUntil = 0;
    }
    if (now >= (member.craftedRuneResonanceUntil || 0)) member.craftedRuneResonanceUntil = 0;
    return member;
  }
  function clear(member) {
    if (!member) return member;
    member.wastelandResilienceStacks = 0;
    member.wastelandResilienceUntil = 0;
    member.surgingBattleWillStacks = 0;
    member.surgingBattleWillUntil = 0;
    member.craftedRuneResonanceUntil = 0;
    return member;
  }
  function getWastelandDamageReduction(member, now = Date.now()) {
    expire(member, now);
    if (!hasAbility(member?.progress?.equipment, ABILITIES.wastelandResilience)) {
      member && (member.wastelandResilienceStacks = 0);
      return 0;
    }
    return Math.min(WASTELAND.maxStacks, Math.max(0, Number(member?.wastelandResilienceStacks) || 0)) * WASTELAND.perStack;
  }
  function resolveEnemyDirectHit(member, actualDamage, now = Date.now()) {
    expire(member, now);
    if (!member || Number(actualDamage) <= 0 || !member.alive || !hasAbility(member.progress?.equipment, ABILITIES.wastelandResilience)) return 0;
    member.wastelandResilienceStacks = Math.min(WASTELAND.maxStacks, (Number(member.wastelandResilienceStacks) || 0) + 1);
    member.wastelandResilienceUntil = now + WASTELAND.durationMs;
    return member.wastelandResilienceStacks;
  }
  function beginSkillExecution(member, now = Date.now(), options = {}) {
    expire(member, now);
    if (options.eligible === false) return Object.freeze({ battleWillPercent: 0, runeResonancePercent: 0, consumeRuneResonance: false, eligible: false });
    const equipment = member?.progress?.equipment;
    const battleWillPercent = hasAbility(equipment, ABILITIES.surgingBattleWill)
      ? Math.min(BATTLE_WILL.maxStacks, Math.max(0, Number(member?.surgingBattleWillStacks) || 0)) * BATTLE_WILL.perStack
      : 0;
    const consumeRuneResonance = hasAbility(equipment, ABILITIES.runeResonance) && now < (member?.craftedRuneResonanceUntil || 0);
    if (consumeRuneResonance) member.craftedRuneResonanceUntil = 0;
    return Object.freeze({ battleWillPercent, runeResonancePercent: consumeRuneResonance ? RUNE_RESONANCE.damageBonus : 0, consumeRuneResonance, eligible: true });
  }
  function completeSkillExecution(member, execution, now = Date.now()) {
    if (!member || execution?.eligible === false) return;
    const equipment = member.progress?.equipment;
    if (hasAbility(equipment, ABILITIES.surgingBattleWill)) {
      member.surgingBattleWillStacks = Math.min(BATTLE_WILL.maxStacks, (Number(member.surgingBattleWillStacks) || 0) + 1);
      member.surgingBattleWillUntil = now + BATTLE_WILL.durationMs;
    }
    if (hasAbility(equipment, ABILITIES.runeResonance) && !execution?.consumeRuneResonance) {
      member.craftedRuneResonanceUntil = now + RUNE_RESONANCE.durationMs;
    }
  }
  function getOutgoingDamageMultiplier(member, attackKind, options = {}, now = Date.now()) {
    if (!ELIGIBLE_OUTGOING_KINDS.includes(attackKind)) return 1;
    expire(member, now);
    if (attackKind === 'skill' && options.execution) {
      return 1 + (Number(options.execution.battleWillPercent) || 0) + (Number(options.execution.runeResonancePercent) || 0);
    }
    if (!hasAbility(member?.progress?.equipment, ABILITIES.surgingBattleWill)) return 1;
    return 1 + Math.min(BATTLE_WILL.maxStacks, Math.max(0, Number(member?.surgingBattleWillStacks) || 0)) * BATTLE_WILL.perStack;
  }

  return Object.freeze({ ABILITIES, WASTELAND, BATTLE_WILL, RUNE_RESONANCE, ELIGIBLE_OUTGOING_KINDS, hasAbility, expire, clear, getWastelandDamageReduction, resolveEnemyDirectHit, beginSkillExecution, completeSkillExecution, getOutgoingDamageMultiplier });
}));
