(function (root, factory) {
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./skullcrusher-war-camp-policy.js') : root.SkullcrusherWarCampPolicy,
    node ? require('./ancient-altar-policy.js') : root.AncientAltarPolicy,
    node ? require('./redrock-temple-policy.js') : root.RedrockTemplePolicy,
    node ? require('./bloodwar-wastes-policy.js') : root.BloodwarWastesPolicy);
  if (node) module.exports = api;
  if (root) root.ChapterThreeLateCombatPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Camp, Altar, Temple, Bloodwar) {
  'use strict';
  const POLICIES = { 'skullcrusher-war-camp': Camp, 'ancient-altar': Altar, 'redrock-temple': Temple };
  // Base values copied from TEST V1; skills come exclusively from the formal policies.
  // 3-6 values are a player-approved first-playtest reference, not a balance baseline.
  const BASES = Object.freeze({
    'skullcrusher-berserker': [1180,111,68,.92,4,8,10],
    'skullcrusher-shaman': [960,87,58,.88,5,0,8],
    'skullcrusher-heavy-guard': [1520,96,112,.66,1,20,22],
    'skullcrusher-wolf-rider': [1230,116,72,1.05,8,5,10],
    'skullcrusher-champion': [3950,150,128,.84,4,18,26],
    'skullcrusher-great-chieftain': [20000,180,148,.82,3,20,28],
    'skullcrusher-priest': [1080,92,64,.82,5,0,9],
    'skullcrusher-fanatic': [1260,122,70,.96,5,5,10],
    'ancient-stoneguard': [1620,101,120,.64,0,12,23],
    'rune-guard': [1340,108,91,.78,3,12,16],
    'awakened-guard': [4300,156,136,.78,2,18,27],
    'fallen-high-priest': [22500,187,154,.80,4,15,29],
    'temple-stoneguard': [1780,108,128,.62,0,14,24],
    'rune-golem': [1620,116,105,.70,0,10,19],
    'temple-executioner': [1430,132,82,.90,5,8,12],
    'ancient-priest': [1150,94,68,.80,5,0,10],
    'temple-guardian': [4750,164,145,.76,2,20,29],
    'redrock-ancient-god': [26000,198,165,.78,2,18,31]
  });
  function isSupported(mapId) { return Boolean(POLICIES[mapId]); }
  function getMonster(mapId, definition) {
    if (!isSupported(mapId) || !definition || !POLICIES[mapId].getEnemySkills(definition.id).length) return null;
    const values = BASES[definition.id];
    if (!values) return null;
    const [maxHp, attack, defense, attackSpeed, evasion, parry, damageReduction] = values;
    return { ...definition, maxHp, attack, defense, attackSpeed, evasion, parry, damageReduction,
      mapId, chapter: 3, level: 30, xp: 0, gold: 0,
      faction: mapId === Camp.MAP_ID ? 'skullcrusher-tribe' : 'ancient-guardians',
      isBoss: definition.rank === 'boss', isElite: definition.rank === 'elite',
      artClass: `monster-image-art ${definition.id}`, skillIds: POLICIES[mapId].getEnemySkills(definition.id) };
  }
  function createState(mapId, now) {
    const state = POLICIES[mapId].createState(now);
    state.shields = state.shields || {};
    for (const key of ['shieldGenerated', 'shieldAbsorbed', 'shieldExpired', 'shieldBrokenAt']) state.telemetry[key] = state.telemetry[key] || {};
    if (mapId === Camp.MAP_ID) state.inherited = Bloodwar.createState(now);
    state.pendingActions = [];
    state.deathHandled = false;
    return state;
  }
  function living(units) { return units.filter(unit => unit.currentHp > 0); }
  function shield(unit, skill, now, source = skill.shieldSource) {
    Altar.applySourceShield(unit.state, source, unit.maxHp * skill.shieldMaxHpRatio, now, skill.durationMs);
  }
  function thresholds(mapId, unit, now, emit = () => {}) {
    if (unit.currentHp <= 0) return;
    const policy = POLICIES[mapId];
    for (const skill of policy.updateThresholds(unit.id, unit.state, unit.currentHp, unit.maxHp, now)) {
      if (skill.shieldMaxHpRatio) shield(unit, skill, now);
      emit(unit, skill);
    }
    if (mapId === Camp.MAP_ID && unit.id === 'skullcrusher-berserker') {
      for (const skill of Bloodwar.updateThresholds(unit.id, unit.state.inherited, unit.currentHp, unit.maxHp, now)) emit(unit, skill);
    }
  }
  function death(mapId, unit, units, now, emit = () => {}) {
    if (unit.state.deathHandled) return;
    unit.state.deathHandled = true;
    const others = living(units).filter(other => other.key !== unit.key);
    if (mapId === Camp.MAP_ID && !unit.isBoss) for (const boss of others.filter(other => other.id === 'skullcrusher-great-chieftain')) {
      if (Camp.recordOtherEnemyDeath(boss.state, { enemyId: unit.key, bossAlive: true, atMs: now })) emit(boss, Camp.SKILLS['fallen-warrior-rage']);
    }
    if (mapId === Altar.MAP_ID && unit.id === 'skullcrusher-fanatic'
      && Altar.resolveFanaticDeath(unit.state, unit.key, others.length)) {
      const skill = Altar.SKILLS['death-sacrifice'];
      others.forEach(other => { other.state.deathSacrificeUntil = now + skill.buff.durationMs; });
      emit(unit, skill);
    }
  }
  function tick(mapId, units, players, now, emit = () => {}, random = Math.random) {
    const policy = POLICIES[mapId];
    if (!policy) return;
    units.forEach(unit => {
      if (unit.currentHp <= 0) { death(mapId, unit, units, now, emit); return; }
      Altar.expireShields(unit.state, now);
      thresholds(mapId, unit, now, emit);
      const totem = unit.state.warbloodBuff;
      if (totem && totem.ticks > 0 && now >= totem.nextTickAt) {
        const ticks = Math.min(totem.ticks, Math.floor((now - totem.nextTickAt) / totem.tickMs) + 1);
        unit.currentHp = Math.min(unit.maxHp, unit.currentHp + unit.maxHp * totem.healRatio * ticks);
        totem.ticks -= ticks; totem.nextTickAt += ticks * totem.tickMs;
      }
      if (unit.controlled) return;
      let actions = policy.resolveScheduledActions(unit.id, unit.state, now, { otherAliveEnemies: living(units).length - 1 });
      if (mapId === Camp.MAP_ID && unit.id === 'skullcrusher-shaman') {
        actions = Bloodwar.resolveScheduledActions(unit.id, unit.state.inherited, now);
      }
      for (const skill of actions) {
        emit(unit, skill);
        if (skill.damageMultiplier) { unit.state.pendingActions.push(skill); continue; }
        if (skill.id === 'fel-prayer') {
          const target = Altar.chooseLowestHpRatio(living(units));
          if (target) {
            const heal = Math.min(target.maxHp - target.currentHp, target.maxHp * skill.healMaxHpRatio);
            target.currentHp += heal;
            Altar.recordFelPrayer(unit.state, target.maxHp * skill.healMaxHpRatio, heal);
          }
        } else if (skill.id === 'warblood-totem') {
          living(units).forEach(target => { target.state.warbloodBuff = { ...skill.buff, until: now + skill.buff.durationMs, nextTickAt: now + skill.buff.tickMs }; });
        } else if (skill.id === 'blood-sacrifice') {
          const target = Altar.chooseLowestHpRatio(living(units), unit.id);
          if (target) {
            const cost = Altar.resolveBloodSacrifice(target.currentHp);
            target.currentHp = cost.remaining;
            shield(unit, skill, now);
            Altar.recordBloodSacrifice(unit.state, target.key, cost.spent, now);
          }
        } else if (skill.id === 'rune-shield') shield(unit, skill, now);
        else if (skill.id === 'rune-blessing') {
          const target = Temple.chooseLowestHpRatio(living(units));
          if (target) shield(target, skill, now, Temple.getRuneBlessingSource(unit.key));
        } else if (skill.id === 'rune-overload') Temple.activateRuneOverload(unit.state, now);
        else if (skill.id === 'ancient-rune') {
          const rune = Temple.activateAncientRune(unit.state, random(), now);
          if (rune.type === 'guardian') shield(unit, { ...skill, shieldMaxHpRatio: skill.guardianShieldMaxHpRatio }, now, skill.guardianShieldSource);
        }
      }
    });
  }
  function modifiers(mapId, unit, units, now) {
    const policy = POLICIES[mapId];
    if (!policy) return { attack: 1, defense: 1, attackSpeed: 1, damage: 1, damageReduction: 0, dotDamage: 1 };
    const values = { attack: 1, defense: 1, attackSpeed: 1, damage: 1, damageReduction: 0, dotDamage: 1,
      ...policy.getCombatMultipliers(unit.id, unit.state, now) };
    if (mapId === Camp.MAP_ID && unit.id === 'skullcrusher-berserker') {
      const inherited = Bloodwar.getCombatMultipliers(unit.id, unit.state.inherited);
      values.attack *= inherited.attack; values.attackSpeed *= inherited.attackSpeed;
    }
    if (mapId === Camp.MAP_ID && now < (unit.state.warbloodBuff?.until || 0)) values.attack *= 1 + Bloodwar.SKILLS['warblood-totem'].buff.attackBonus;
    if (now < unit.state.deathSacrificeUntil) values.attack *= 1 + Altar.SKILLS['death-sacrifice'].buff.attackBonus;
    if (mapId === Temple.MAP_ID) values.damageReduction += Temple.getBulwarkDamageReduction(living(units).filter(other => other.id === 'temple-stoneguard').length, unit.id === 'temple-stoneguard');
    return values;
  }
  function absorb(mapId, unit, damage, now) {
    let remaining = Math.max(0, damage);
    for (const source of Object.keys(unit.state.shields || {})) {
      const result = Altar.absorbSourceShield(unit.state, source, remaining, now);
      remaining = result.remainingDamage;
      if (source.startsWith(Temple.SHIELD_SOURCES.runeBlessing)) Temple.recordRuneBlessingAbsorption(unit.state, result.absorbed);
      if (mapId === Temple.MAP_ID && result.broken) {
        const shatter = Temple.resolveGuardianShieldBreak(unit.state, source, unit.maxHp, now);
        if (shatter) unit.currentHp = Math.max(0, unit.currentHp - shatter);
        Temple.resolveDivineWrathBreak(unit.state, source, now);
      }
    }
    return remaining;
  }
  function selectTarget(mapId, unit, skill, players, primary, random = Math.random) {
    const alive = players.filter(player => player.alive && player.currentHp > 0);
    if (!skill) return primary;
    if (skill.id === 'warwolf-assault') return Camp.chooseWarwolfTarget(alive, primary, random(), player => player.job === 'warrior');
    if (skill.target === 'lowest-hp-ratio-alive-player') return Temple.chooseLowestHpRatio(alive);
    if (skill.target === 'random-alive-player') return alive[Math.min(alive.length - 1, Math.floor(random() * alive.length))] || primary;
    return primary;
  }
  function applyDebuff(player, definition, now) {
    player.chapterThreeDebuffs = player.chapterThreeDebuffs || {};
    player.chapterThreeDebuffs[definition.type] = { value: definition.value, until: now + definition.durationMs };
  }
  function playerMultiplier(player, type, now) {
    const debuff = player?.chapterThreeDebuffs?.[type];
    return debuff && now < debuff.until ? 1 - debuff.value : 1;
  }
  function playerAttackMultiplier(mapId, player, units, now) {
    const weakened = mapId === Temple.MAP_ID ? Math.min(1, ...living(units).filter(unit => unit.id === Temple.FINAL_BOSS_ID).map(unit => Temple.getPlayerAttackMultiplier(unit.state, now))) : 1;
    return weakened * playerMultiplier(player, 'attack-down', now);
  }
  function hit(mapId, unit, skill, target, units, now) {
    if (!skill) return;
    for (const debuff of [...(skill.debuffs || []), ...(skill.debuff ? [skill.debuff] : [])]) applyDebuff(target, debuff, now);
    if (skill.dot) {
      const dot = skill.dot;
      target.chapterThreeBurn = { sourceKey: unit.key, damage: unit.attack * dot.attackRatio, nextTickAt: now + dot.tickMs,
        ticks: dot.ticks, tickMs: dot.tickMs, expiresAt: now + dot.durationMs };
      Altar.recordFallenBurn(unit.state, 'application');
    }
    if (skill.id === 'ancient-god-smash') Temple.applyAncientMark(unit.state, target.id, now);
    if (skill.id === 'warwolf-assault') Camp.recordWarwolfTarget(unit.state, target, player => player.job === 'warrior');
  }
  return Object.freeze({ BASES, isSupported, getMonster, createState, thresholds, death, tick, modifiers, absorb,
    selectTarget, hit, playerMultiplier, playerAttackMultiplier });
});
