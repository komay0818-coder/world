const R = require('./chapter-three-36-rules.js');
module.exports = function run({ simulate, proportionalStage, PARTIES, RUNS }) {
  const selected = process.argv.find(value => value.startsWith('--cell='))?.split('=')[1];
  const cells = [];
  for (const [name, jobs] of Object.entries(PARTIES)) for (const mode of ['loop', 'boss']) for (const cleared of mode === 'loop' ? [14, 21] : [21]) {
    const id = `${mode}-${name}-${cleared}`;
    if (selected && selected !== id) continue;
    const stage = proportionalStage(cleared, 35, 20, .20);
    const samples = Array.from({ length: RUNS }, (_, i) => simulate(jobs, 0x31c0de + i * 104729 + name.charCodeAt(0), 3, 'B', stage, 0, 1, .02, true, R.normals,
      mode === 'boss' ? { templates: [R.boss], duration: 120, stopImmediately: true } : null,
      mode === 'loop' ? { chance: .05, elite: R.elite, randomOpening: true, chapter36: true } : null));
    const sum = fn => samples.reduce((n, s) => n + fn(s), 0);
    const avg = (list, fn) => list.length ? list.reduce((n, s) => n + fn(s), 0) / list.length : null;
    const ps = (s, key) => s.party.reduce((n, p) => n + (p[key] || 0), 0);
    const time = sum(s => s.time), survivors = samples.filter(s => s.survived), wipes = samples.filter(s => !s.survived), wins = samples.filter(s => s.firstClearAt !== null);
    const hp = s => ps(s, 'hp') / ps(s, 'maxHp');
    const summary = { id, mode, party: name, stage: stage.id, runs: RUNS,
      fullPartySurvivalRate: sum(s => Number(s.party.every(p => p.alive))) / RUNS, survivalRate: survivors.length / RUNS,
      averageWipeSeconds: avg(wipes, s => s.time), survivorHpPercent: avg(survivors, hp),
      dps: sum(s => ps(s, 'totalDamage')) / time, killsPerMinute: sum(s => s.kills) / time * 60,
      deathRates: Object.fromEntries(jobs.map((job, i) => [job, sum(s => Number(!s.party[i].alive)) / RUNS])) };
    const rawRows = samples.map((s, i) => {
      const data = { seed: 0x31c0de + i * 104729 + name.charCodeAt(0), time: s.time, kills: s.kills, clearAt: s.firstClearAt,
        players: s.party.map(p => [p.hp, p.maxHp, p.deathAt, p.totalDamage, p.taken, p.environment, p.spellHealing, p.killHealing, p.pulseDamage36 || 0]) };
      if (mode === 'loop') {
        const es = key => s.archive35.reduce((n, e) => n + (e[key] || 0), 0);
        data.mechanics = { shellProcs: es('shellProcs36'), defenseRuneSeconds: s.loopStats.defenseRuneSeconds36 || 0,
          executionHits: ['normal', 'execute'].map(k => s.archive35.reduce((n, e) => n + (e.executionHits36?.[k] || 0), 0)),
          executionDamage: ['normal', 'execute'].map(k => s.archive35.reduce((n, e) => n + (e.executionDamage36?.[k] || 0), 0)),
          healCasts: es('healCasts36'), healing: es('healing36'), healSkips: es('healSkips36'), selfHeals: es('selfHeals36'), resurrections: es('resurrections36'),
          healTargets: Object.fromEntries([...R.normals, R.elite].map(t => [t.id, s.archive35.reduce((n, e) => n + (e.healTargets36?.[t.id] || 0), 0)])),
          eliteSpawns: s.loopStats.eliteSpawns, elitePresenceSeconds: s.loopStats.elitePresentSeconds,
          eliteDamage: s.party.reduce((n, p) => n + (p.damageTakenByEnemy[R.elite.id] || 0), 0),
          barriers: s.archive35.filter(e => e.barrier36).map(e => [e.spawnedAt, e.barrierAt36 ?? null, e.barrierCount36 || 0,
            e.barrierAt36 === undefined ? 0 : Math.max(0, Math.min(e.barrierUntil36, e.respawnAt === null ? s.time : e.respawnAt - 2) - e.barrierAt36), e.healedAboveHalf36 || 0, e.barrierRecrossings36 || 0]) };
      } else {
        const e = s.enemies[0];
        data.mechanics = { heavyHits: e.skillHits || 0, heavyDamage: e.skillDamage || 0, pulseCasts: e.pulseCasts36 || 0, pulseMaxTargets: e.pulseMaxTargets36 || 0,
          defenseAt: e.defenseAt36 ?? null, defenseCount: e.defenseCount36 || 0, defenseDuration: e.defenseAt36 === undefined ? 0 : Math.min(s.time, e.defenseUntil36, e.coreAt36 ?? Infinity) - e.defenseAt36,
          rampageAt: e.rampageAt36 ?? null, rampageCount: e.rampageCount36 || 0, rampageDuration: e.rampageAt36 === undefined ? 0 : Math.min(s.time, e.rampageUntil36, e.coreAt36 ?? Infinity) - e.rampageAt36,
          coreAt: e.coreAt36 ?? null, coreCount: e.coreCount36 || 0, coreDuration: e.coreAt36 === undefined ? 0 : s.time - e.coreAt36 };
      }
      return data;
    });
    const rawSum = fn => rawRows.reduce((n, row) => n + fn(row.mechanics), 0);
    if (mode === 'loop') {
      const barriers = rawRows.flatMap(row => row.mechanics.barriers), triggered = barriers.filter(b => b[1] !== null);
      const normalHits = rawSum(m => m.executionHits[0]), executeHits = rawSum(m => m.executionHits[1]);
      Object.assign(summary, { shellProcsPerMinute: rawSum(m => m.shellProcs) / time * 60, defenseRuneCoverage: rawSum(m => m.defenseRuneSeconds) / time,
        normalExecutionHits: normalHits, boostedExecutionHits: executeHits, boostedExecutionRate: executeHits / Math.max(1, normalHits + executeHits),
        normalExecutionDamagePerHit: rawSum(m => m.executionDamage[0]) / Math.max(1, normalHits), boostedExecutionDamagePerHit: rawSum(m => m.executionDamage[1]) / Math.max(1, executeHits),
        healCastsPerMinute: rawSum(m => m.healCasts) / time * 60, enemyHealingPerMinute: rawSum(m => m.healing) / time * 60,
        healTargetCounts: Object.fromEntries([...R.normals, R.elite].map(t => [t.id, rawSum(m => m.healTargets[t.id])])),
        noTargetSkips: rawSum(m => m.healSkips), selfHeals: rawSum(m => m.selfHeals), resurrections: rawSum(m => m.resurrections),
        elitesPerMinute: rawSum(m => m.eliteSpawns) / time * 60, elitePresence: rawSum(m => m.elitePresenceSeconds) / time,
        eliteDamageShare: rawSum(m => m.eliteDamage) / sum(s => ps(s, 'taken')),
        barrierTriggerRate: triggered.length / Math.max(1, barriers.length), barrierDuration: avg(triggered, b => b[3]),
        guardianHealedAboveHalfCount: barriers.reduce((n, b) => n + b[4], 0), guardianRecrossings: barriers.reduce((n, b) => n + b[5], 0), maxBarrierTriggers: Math.max(0, ...barriers.map(b => b[2])) });
    } else {
      const phase = key => {
        const entered = rawRows.filter(row => row.mechanics[`${key}At`] !== null);
        return { rate: entered.length / RUNS, at: avg(entered, row => row.mechanics[`${key}At`]), duration: avg(entered, row => row.mechanics[`${key}Duration`]), maxTriggers: Math.max(...rawRows.map(row => row.mechanics[`${key}Count`])) };
      };
      Object.assign(summary, { killRate: wins.length / RUNS, fullPartyKillRate: wins.filter(s => s.party.every(p => p.alive)).length / RUNS,
        averageKillSeconds: avg(wins, s => s.time), wipeRate: wipes.length / RUNS, timeoutRate: samples.filter(s => s.firstClearAt === null && s.survived).length / RUNS,
        hpAtKill: avg(wins, hp), hpAtTimeout: avg(samples.filter(s => s.firstClearAt === null && s.survived), hp),
        bossDamagePerRun: sum(s => ps(s, 'taken')) / RUNS, priestHealingPerRun: sum(s => ps(s, 'spellHealing')) / RUNS,
        heavyHitsPerRun: rawSum(m => m.heavyHits) / RUNS, heavyDamagePerHit: rawSum(m => m.heavyDamage) / Math.max(1, rawSum(m => m.heavyHits)),
        pulseCastsPerRun: rawSum(m => m.pulseCasts) / RUNS, pulseMaxTargets: Math.max(...rawRows.map(row => row.mechanics.pulseMaxTargets)),
        pulseDamagePerJob: Object.fromEntries(jobs.map((job, i) => [job, sum(s => s.party[i].pulseDamage36 || 0) / RUNS])),
        defensePhase: phase('defense'), rampagePhase: phase('rampage'), corePhase: phase('core') });
    }
    cells.push({ summary, rawRows });
  }
  process.stdout.write(JSON.stringify({ test: 'Chapter 3-6 TEST V1 mechanics only; old B1 Lv1-skill baseline, not balance evidence', runsPerCell: RUNS, suppression: 'S20 / 35', eliteChance: .05,
    templates: { normals: R.normals, elite: R.elite, boss: R.boss },
    playerColumns: ['hp', 'maxHp', 'deathAt', 'damage', 'enemyTaken', 'environmentTaken', 'priestHealing', 'killHealing', 'pulseTaken'],
    barrierColumns: ['spawnAt', 'triggerAt', 'triggerCount', 'actualDuration', 'healedAboveHalfCount', 'recrossings'], cells }));
};
