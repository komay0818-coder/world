(function (root, factory) {
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./monster-defense.js') : root.MonsterDefense,
    node ? require('./party-policy.js') : root.PartyPolicy,
    node ? require('./chapter-one-level-policy.js') : root.ChapterOneLevelPolicy);
  if (node) module.exports = api;
  else root.OfflinePartyPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Defense, Party, Levels) {
  'use strict';
  const VERSION = 1, LIMIT_MS = 12 * 60 * 60 * 1000;
  function runtimeState(member) {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(member, (key, value) => {
      if (['progress', 'character', 'stats', 'equipment'].includes(key) || /Telemetry$/.test(key)) return undefined;
      if (value && typeof value === 'object') {
        if (seen.has(value)) return value.id ? { memberId: value.id } : undefined;
        seen.add(value);
      }
      return value;
    }));
  }
  // Explicit fields avoid telemetry owner references and preserve invitation equipment.
  function capture({ fighting, members = [], monsters = [], mapId, map, now, runId, combat = {}, chapterOneBase = false }) {
    const main = members.find(m => m.isMain);
    return JSON.parse(JSON.stringify({ version: VERSION, runId, startedAt: now, mapId,
      map: map ? {id:map.id,chapter:map.chapter,min:map.min,max:map.max} : undefined,
      chapterOneBase,
      consumables: { potions: Math.max(0, Number(main?.progress?.potions) || 0),
        manaPotions: Math.max(0, Number(main?.progress?.manaPotions) || 0),
        gold: Math.max(0, Number(main?.progress?.gold) || 0) },
      sacredGuardianInMs: Math.max(0,(Number(combat.sacredGuardianReadyAt)||0)-now),
      eligible: Boolean(fighting && members.length),
      members: members.slice(0, 3).map((m, position) => ({
        id: m.id, position, isMain: Boolean(m.isMain), character: m.character,
        progress: { level: m.level, equipment: m.progress?.equipment, skillLevels: m.progress?.skillLevels,
          advancedClass: m.progress?.advancedClass, warriorAdvancementState: m.progress?.warriorAdvancementState },
        job: m.job, level: m.level, stats: m.stats, maxHp: m.maxHp, currentHp: m.currentHp,
        alive: m.alive, shield: m.shield || 0, resourceType: m.resourceType,
        resourceCurrent: m.resourceCurrent, resourceMax: m.resourceMax,
        nextAttackInMs: Math.max(0, (m.nextAttackAt || now) - now),
        globalSkillInMs: Math.max(0, (m.globalSkillReadyAt || now) - now),
        cooldowns: Object.fromEntries(Object.entries(m.skillCooldowns || {}).map(([k, v]) => [k, Math.max(0, v - now)])),
        undeadRevived: Boolean(m.undeadRevived), runtime: runtimeState(m),
        reviveInMs: m.reviveAt == null ? null : Math.max(0, m.reviveAt - now)
      })),
      monsters: monsters.filter(m => !m.isFacility && !m.isElite && !m.isBoss)
    }));
  }
  function duration(snapshot, now) {
    return snapshot?.version === VERSION && snapshot.eligible
      ? Math.min(LIMIT_MS, Math.max(0, now - snapshot.startedAt)) : 0;
  }
  function simulate({ snapshot, now, durationMs = duration(snapshot, now), random = Math.random,
    outgoing, incoming, trace = false, skills = false, survival = false, traceLimit, onEvent, recordKills = false } = {}) {
    if (skills) {
      const engine = typeof module === 'object' && module.exports ? require('./offline-skill-events.js') : globalThis.OfflineSkillEvents;
      return engine.simulate({ snapshot, durationMs, random, trace, traceLimit, onEvent, survival, recordKills });
    }
    const party = JSON.parse(JSON.stringify(snapshot?.members || [])).slice(0, 3);
    party.sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.position - b.position);
    if (party.length && party.filter(m => m.isMain).length !== 1) throw new Error('Exactly one main member is required');
    const roster = (snapshot?.monsters || []).filter(m => !m.isFacility && !m.isElite && !m.isBoss && m.maxHp > 0);
    const end = snapshot?.eligible ? Math.min(LIMIT_MS, Math.max(0, Number(durationMs) || 0)) : 0;
    const main = party.find(m => m.isMain), events = [];
    let t = 0, defeated = 0, enemy = roster[0], enemyHp = enemy?.maxHp || 0;
    const interval = m => 1000 / Math.max(.01, Number(m.attackSpeed) || (m.attackInterval > 0 ? 1000 / m.attackInterval : 1));
    party.forEach(m => { m.alive = m.alive !== false && m.currentHp > 0; m.next = m.alive ? m.nextAttackInMs : Infinity; });
    let enemyNext = enemy ? interval(enemy) : Infinity;
    const result = () => ({ stage: 1, complete: false, died: Boolean(main && !main.alive), defeated,
      effectiveMs: t, deathAtMs: main && !main.alive ? t : null,
      members: party.map(({ next, ...m }) => m), enemyHp, events });
    if (!main || !roster.length || !end || !main.alive) return result();
    while (t < end && main.alive) {
      const at = Math.min(end, enemyNext, ...party.map(m => m.next));
      party.filter(m => m.alive).forEach(m => {
        m.currentHp = Math.min(m.maxHp, m.currentHp + Math.max(0, m.stats?.hpRegeneration || 0) * (at - t) / 1000);
      });
      t = at;
      // Stable tie order: main, party position, enemy. Killing cancels this enemy's attack.
      for (const m of party) {
        if (!m.alive || m.next > t) continue;
        const hit = random() < Levels.getPlayerHitChance(m.level, enemy.level, m.stats.accuracy, 0);
        const critical = random() < (m.stats.crit || 0);
        const damage = outgoing ? outgoing(m, enemy, random) : !hit ? 0 : Defense.resolveDamage({
          baseDamage: m.stats.attack * (critical ? m.stats.criticalDamageMultiplier || 1.5 : 1), monster: enemy, canEvade: true, canParry: true,
          damageType: ['mage', 'priest'].includes(m.job) ? 'magic' : 'physical',
          attackRange: ['mage', 'priest', 'hunter'].includes(m.job) ? 'ranged' : 'melee', random
        }).finalDamage;
        enemyHp = Math.max(0, enemyHp - damage);
        m.next = t + interval(m.stats);
        if (trace) events.push({ at: t, type: 'attack', memberId: m.id, damage });
        if (enemyHp <= 0) {
          defeated++;
          enemy = roster[defeated % roster.length]; enemyHp = enemy.maxHp;
          enemyNext = t + interval(enemy);
          if (trace) events.push({ at: t, type: 'kill', defeated });
        }
      }
      if (enemyNext <= t) {
        const target = Party.chooseRandomAliveMember(party, random);
        const hit = random() < Levels.getMonsterHitChance(enemy.level, target.level, target.stats.dodge);
        const parried = hit && random() < (target.stats.parry || 0);
        let damage = incoming ? incoming(target, enemy, random) : !hit ? 0 : Defense.resolvePlayerDamage({
          baseDamage: enemy.attack, defense: target.stats.defense, damageReduction: target.stats.damageReduction
        }).finalDamage;
        if (!incoming && parried && damage > 0) damage = Math.max(1, Math.ceil(damage * .5));
        const absorbed = Math.min(target.shield, damage); target.shield -= absorbed; damage -= absorbed;
        target.currentHp = Math.max(0, target.currentHp - damage);
        if (target.currentHp <= 0) { target.alive = false; target.next = Infinity; }
        if (trace) events.push({ at: t, type: 'enemy-attack', memberId: target.id, damage });
        enemyNext = t + interval(enemy);
      }
    }
    return result();
  }
  return Object.freeze({ VERSION, LIMIT_MS, capture, duration, simulate });
});
