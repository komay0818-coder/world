(function(root) {
  const shared = typeof module === 'object' && module.exports ? require('./offline-shared-runtime.generated.js') : root.OfflineSharedRuntime;
  function simulate({ snapshot, durationMs, random = Math.random, trace = false, traceLimit = 1000, onEvent } = {}) {
    const start = Number(snapshot?.startedAt) || 1;
    let now = start, defeated = 0, operations = 0, sequence = 0;
    const end = start + Math.min(43200000, Math.max(0, Number(durationMs) || 0));
    const deferred = [], events = [], skillChecks = new Map();
    const clone = value => JSON.parse(JSON.stringify(value));
    const roster = clone(snapshot?.monsters || []).filter(m => !m.isFacility && !m.isElite && !m.isBoss && m.maxHp > 0);
    const members = clone(snapshot?.members || []).slice(0, 3).sort((a,b) => Number(b.isMain)-Number(a.isMain) || a.position-b.position);
    if (members.length && members.filter(m => m.isMain).length !== 1) throw new Error('Exactly one main member is required');
    const main = members.find(m => m.isMain);
    let enemy = roster[0];
    const battle = { partyMembers: members, enemyTypes: [enemy?.id || 'ordinary'], enemyHps: [enemy?.maxHp || 0],
      enemySpawnedAt: [start], enemyDots: [[]], enemySkillStates: [], enemyNextAttackAt: [Infinity] };
    function emit(type, detail = {}) {
      const event = { at: now-start, type, ...detail };
      if (trace && events.length < traceLimit) events.push(event);
      if (onEvent) onEvent(event);
    }
    class SimulationDate extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
    const simulationMath = Object.create(Math); simulationMath.random = random;
    const neutral = () => ({ defense: 1, attackSpeed: 1, attack: 1, evasion: 0 });
    const no = () => {}, one = () => 1;
    const env = { module: undefined, globalThis: null, Date: SimulationDate, Math: simulationMath, battle, fighting: true,
      offlinePartyPreviewPausedAt: null,
      setTimeout(callback, delay) { deferred.push({ at: now + delay, sequence: sequence++, callback }); return sequence; },
      clearTimeout: no, document: { querySelector: () => null },
      preparePolicies(policies) {
        const core = policies.CombatCorePolicy;
        policies.CombatCorePolicy = { ...core, recordEvent(m, type, detail) {
          if (trace && core.telemetry(m)[type]?.length < traceLimit) core.recordEvent(m,type,detail);
          if (['skillEvents','dotEvents','petEvents','offhandEvents','resourceEvents'].includes(type))
            emit(type,{memberId:m.id,...detail,atMs:undefined});
        } };
      },
      getProgress: () => main?.progress || {}, getActiveCharacter: () => main?.character,
      getActiveMap: () => ({ id: '__offline_basic__', chapter: 0 }),
      getMainBattleMember: () => main, getCharacterStats: (_level, progress) => members.find(m => m.progress === progress)?.stats || main.stats,
      getEnemyDefinition: () => enemy,
      aliveEnemyIndexesByAge: () => battle.enemyHps[0] > 0 ? [0] : [],
      aliveMonsterIndexesByAge: () => battle.enemyHps[0] > 0 ? [0] : [],
      getOnlineFacilityEffects: () => ({ damage: 1, defense: 1, drain: 0 }),
      getLateChapterUnits: () => [], updateLateChapterThresholds: no,
      getBlackForestDepthsCombatContext: () => ({}),
      getRedrockEnemyState: () => null, getBrokenrockEnemyState: () => null, getBloodwarEnemyState: () => null,
      BlackForestEntrancePolicy: { isBound: (m,t) => t < (m.boundUntil || 0) },
      BlackForestTrailPolicy: { getCombatMultipliers: neutral, CAPTAIN: {}, RAIDER: {} },
      SpiderNestPolicy: { getCombatMultipliers: neutral, ASSASSIN: {} },
      BlackstoneStrongholdPolicy: { getCombatMultipliers: neutral },
      ForestAltarPolicy: { getCombatMultipliers: neutral }, BlackForestDepthsPolicy: { getCombatMultipliers: neutral },
      RedrockWastesPolicy: { getCombatMultipliers: neutral },
      BloodwarWastesPolicy: { getCenturionAuraDefenseMultiplier: one },
      ChapterThreeLateCombatPolicy: { isSupported: () => false, playerMultiplier: one },
      PlainsDepthsPolicy: {}, getMonsterAttackPower: m => m.attack,
      getPlaytestHpFloor: () => 0,
      effectiveEquipmentStat: (item, stat) => item?.[stat] || 0,
      logBattle: no, logPartyDebug: no, updateBattleUI: no, showEnemyDamage: no,
      captureBattleTargetAnchor: () => ({ x:0,y:0,width:1 }), captureBattleAttackerAnchor: () => ({ x:0,y:0,width:1 }),
      captureBattleAllyAnchor: () => null,
      playPartyMemberCombatAnimation: no, playBattleSkillEffect: no, playCompanionAttackAnimation: no,
      syncLegacyBattleStateFromMain: no, syncMainBattleMemberFromLegacy: no,
      // Shared consumables and village transitions are deliberately not connected until batch 3/4.
      useManaPotion: no, useSharedManaPotionForMember: no,
      defeatPartyMember(m) {
        if (m.currentHp > 0 || !m.alive) return false;
        m.currentHp = 0; m.alive = false; m.nextAttackAt = Infinity;
        if (m.isMain) env.fighting = false;
        emit('death', { memberId: m.id }); return true;
      }
    };
    env.globalThis = env;
    const runtime = shared.create(env);
    // Counters are always retained; long runs do not allocate unlimited per-hit logs.
    const defaults = { attack: 0, defense: 0, attackSpeed: 1, accuracy: 1.05, crit: 0, parry: 0, dodge: 0,
      damageReduction: 0, magicDamageBonus: 0, armorPenetrationPercent: 0, damageBonus: 0, hpRegeneration: 0,
      criticalDamageMultiplier: 1.5, dotMultiplier: 1, cooldownSpeed: 1, manaRegen: 1, manaRegenFlat: 0 };
    for (const m of members) {
      const frozen = { ...m }, saved = m.runtime || {};
      Object.assign(m, saved, frozen);
      m.stats = { ...defaults, ...frozen.stats };
      m.character = { job: m.job, ...m.character }; m.race = m.character.race;
      m.name = m.character.name || m.id; m.progress = { ...m.progress, equipment: m.progress?.equipment || {} };
      m.attackSpeed = m.stats.attackSpeed; m.alive = m.alive !== false && m.currentHp > 0;
      m.nextAttackAt = m.alive ? start + (m.nextAttackInMs || 0) : Infinity;
      m.globalSkillReadyAt = start + (m.globalSkillInMs || 0);
      m.skillCooldowns = Object.fromEntries(Object.entries(m.cooldowns || {}).map(([id, ms]) => [id, start + ms]));
      m.resourceType = m.resourceType || env.PartyPolicy.getResourceType(m.job);
      m.resourceMax = Number(m.resourceMax) || (m.resourceType === 'arrows' ? env.HunterArrowPolicy.getMaxArrows(m.progress.equipment) : m.stats.mana || 100);
      m.resourceCurrent = Number(m.resourceCurrent) || 0;
      // Capture owns all remaining buffs; do not re-apply static passives already present in stats.
      for (const key of ['lastManaRegenAt','lastResourceUpdatedAt','lastHpRegenerationAt']) m[key] = start;
      m.lastArrowRecoveryAt = Math.min(start, Number(saved.lastArrowRecoveryAt) || start);
      for (const key of ['stunnedUntil','boundUntil','hunterAttackCount']) m[key] = Number(m[key]) || 0;
      m.shield = Number(m.shield) || 0;
      if (m.job === 'hunter') runtime.ensureHunterCompanions(m, start);
      skillChecks.set(m.id, m.globalSkillReadyAt);
    }
    // Re-link ownership pointers serialized by the departure snapshot.
    function relink(value, seen = new WeakSet()) {
      if (!value || typeof value !== 'object' || seen.has(value)) return;
      seen.add(value);
      Object.keys(value).forEach(key => {
        const item = value[key];
        if (['owner','source'].includes(key) && item && typeof item === 'object') {
          const member = members.find(m => m.id === (item.memberId || item.id));
          if (member) value[key] = member;
        } else if (!['progress','stats','character'].includes(key)) relink(item, seen);
      });
    }
    members.forEach(m => relink(m));
    for (const m of members) for (const event of m.pendingClassHeals || []) {
      const target = members.find(ally => ally.id === event.targetId);
      if (target) runtime.queueClassHealAfterglow(m,target,event);
    }
    const enemyInterval = () => Math.max(250, enemy.attackInterval || 1000 / (enemy.attackSpeed || 1));
    if (enemy) battle.enemyNextAttackAt[0] = start + enemyInterval();
    const born = () => {
      if (battle.enemyHps[0] > 0) return false;
      defeated++; emit('kill', { defeated });
      enemy = roster[defeated % roster.length];
      battle.enemyTypes[0] = enemy.id || 'ordinary'; battle.enemyHps[0] = enemy.maxHp;
      battle.enemySpawnedAt[0] = now; battle.enemyDots[0] = []; battle.enemySkillStates[0] = null;
      battle.enemyNextAttackAt[0] = now + enemyInterval();
      return true;
    };
    function cooldownCheck(m) {
      if (!m.alive) return Infinity;
      const blockedUntil = Math.max(m.globalSkillReadyAt, m.stunnedUntil || 0);
      if (blockedUntil > now) return blockedUntil;
      const known = runtime.getKnownSkills(m.job, m.level, m.progress).filter(s => s.type === 'active' && s.level <= m.level);
      let next = Infinity;
      for (const skill of known) {
        if (skill.id === 'weapon-stance' && !env.WarriorAdvancementPolicy.weaponFamily(m.progress.equipment.weapon)) continue;
        const lowest = Math.min(...members.filter(a => a.alive).map(a => a.currentHp/a.maxHp));
        if (skill.id === 'heal' && lowest > .7 || skill.id === 'light-fountain' && lowest > .85 || skill.id === 'guardian-sanctuary' && lowest > .75) continue;
        let ready = Math.max(now, m.skillCooldowns[skill.id] || 0);
        const cost = runtime.getSkillResourceCost(m.job, skill);
        if (m.resourceCurrent < cost || m.manaExhausted) {
          if (m.resourceType === 'rage') continue;
          const required = m.manaExhausted ? m.resourceMax * .45 : cost;
          const rate = m.resourceType === 'energy' ? env.AssassinEnergyPolicy.ENERGY_REGEN_PER_SECOND
            : m.resourceType === 'mana' ? env.ManaRegenPolicy.calculateRegenAmount({ maxMana:m.resourceMax,
              regenMultiplier:m.stats.manaRegen*(1+env.MageAdvancementPolicy.getManaBonuses(m,now).regen),flatPerSecond:m.stats.manaRegenFlat,elapsedSeconds:1 }) : 0;
          if (rate > 0) ready = Math.max(ready, now + Math.max(1, (required-m.resourceCurrent)/rate*1000));
          else if (m.resourceType === 'arrows') {
            const quiver = env.HunterArrowPolicy.getQuiver(m.progress.equipment);
            if (!quiver) continue;
            ready = Math.max(ready, m.lastArrowRecoveryAt + quiver.arrowRecoveryInterval * Math.max(1, Math.ceil(required-m.resourceCurrent)));
          } else continue;
        }
        // Failed conditional casts cannot busy-loop at a single timestamp.
        next = Math.min(next, ready > now ? ready : now + 100);
      }
      return next;
    }
    function stateDeadline(m) {
      const values = [];
      for (const [key,value] of Object.entries(m)) if (typeof value === 'number' && /Until$/.test(key) && value > now) values.push(value);
      if (m.sanctuaryNextTickAt > now && m.sanctuaryNextTickAt <= m.sanctuaryUntil) values.push(m.sanctuaryNextTickAt);
      for (const grant of m.priestShieldGrants || []) if (grant.expiresAt > now) values.push(grant.expiresAt);
      for (const pet of m.companions || []) values.push(pet.alive === false ? pet.reviveAt : pet.nextAttackAt);
      return Math.min(Infinity, ...values.filter(v => v > now));
    }
    function compact() {
      for (const m of members) for (const key of Object.keys(m).filter(k => /Telemetry$/.test(k))) {
        for (const value of Object.values(m[key])) if (Array.isArray(value) && (!trace || value.length > traceLimit)) value.splice(0, value.length-(trace ? traceLimit : 0));
      }
    }
    function finish() {
      compact();
      return { stage: 2, complete: false, died: Boolean(main && !main.alive), defeated,
        effectiveMs: now-start, deathAtMs: main && !main.alive ? now-start : null,
        members: members.map(m => {
          const { runtime: ignored, ...rest } = m;
          // Return serializable diagnostics, never cycles or callbacks.
          return JSON.parse(JSON.stringify(rest, (key,value) => ['source','owner'].includes(key) && value?.id ? {memberId:value.id} : value));
        }), enemyHp: battle.enemyHps[0], events, operations, pendingEvents: deferred.length };
    }
    if (!snapshot?.eligible || !main || !main.alive || !roster.length || end <= start) return finish();
    while (now < end && env.fighting) {
      let at = Math.min(end, battle.enemyNextAttackAt[0], ...members.filter(m => m.alive).flatMap(m => [
        Math.max(now,m.nextAttackAt,m.stunnedUntil || 0,m.boundUntil || 0),
        Math.max(now,skillChecks.get(m.id)), stateDeadline(m), now + 5000
      ]), ...deferred.map(e => e.at));
      for (const dot of battle.enemyDots[0]) if (dot.remaining > 0 && dot.tickIntervalMs && dot.nextTickAt > now) at = Math.min(at, dot.nextTickAt);
      // Actual online battleTick runs every 100 ms; legacy DOTs have no explicit interval.
      // Preserve that behavior, rather than silently changing their balance to one second.
      const nextDot = start + (Math.floor((now-start)/100)+1)*100;
      if (battle.enemyDots[0].some(d => d.remaining > 0 && !d.tickIntervalMs)) at = Math.min(at, nextDot);
      if (!(at >= now) || !Number.isFinite(at)) throw new Error(`Invalid offline event deadline at ${now-start}: ${at-start}`);
      now = Math.min(end,start + Math.ceil((at-start)/100)*100); operations++;
      if (operations > 2000000) throw new Error('Offline event budget exceeded');
      members.filter(m => m.alive).forEach(m => { runtime.updatePartyMemberResource(m,now); runtime.updatePartyMemberHealthRegeneration(m,now); });
      deferred.sort((a,b) => a.at-b.at || a.sequence-b.sequence);
      while (deferred.length && deferred[0].at <= now && env.fighting) deferred.shift().callback();
      // Online checks resonance expiry before skill cooldown/resource gates.
      // An unavailable active skill must not postpone the passive release.
      for (const m of members) if (m.alive && m.job === 'mage') runtime.resolveFinishedMageResonance(m,now);
      born();
      // processEnemyDots decrements legacy DOTs once per call. Invoke only on its actual cadence.
      const due = battle.enemyDots[0].filter(d => d.tickIntervalMs ? d.nextTickAt <= now || d.expiresAt && now > d.expiresAt : now >= nextDot);
      if (due.length) {
        runtime.processEnemyDots();
        born();
      }
      for (const m of members) {
        if (!m.alive || !env.fighting) continue;
        if (skillChecks.get(m.id) <= now) { runtime.useAutoSkillForMember(m,now); born(); }
        // The shared handler iterates all members, so call it exactly once per timestamp below.
      }
      runtime.processPartyMemberAttacks(now); born();
      runtime.processHunterCompanionAttacks(now); born();
      if (env.fighting && battle.enemyNextAttackAt[0] <= now) {
        const state = runtime.getEnemySkillState(0);
        if (now < state.stunnedUntil || now < state.frozenUntil) battle.enemyNextAttackAt[0] = now + 250;
        else {
          const target = env.PartyPolicy.chooseRandomAliveMember(members,random);
          if (target) { const outcome = runtime.applyOfflineIncoming(target,enemy,now); emit('enemy-attack',{memberId:target.id,...outcome}); }
          battle.enemyNextAttackAt[0] = now + enemyInterval(); born();
        }
      }
      for (const m of members) skillChecks.set(m.id,cooldownCheck(m));
      if (operations % 1000 === 0) compact();
    }
    return finish();
  }
  const api = Object.freeze({ simulate });
  if (typeof module === 'object' && module.exports) module.exports = api; else root.OfflineSkillEvents = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
