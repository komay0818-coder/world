const { simulate, POOL, STAGES } = require('./chapter-three-31-v1-party-simulation');
const { createExperiment } = require('./mana-exhaustion-experiment');
function run(job, enabled, runs = 100, immortal = true) {
  const rows = Array.from({ length: runs }, (_, i) => {
    const seed = 310905 + i * 104729;
    const s = simulate([job], seed, 3, 'B', STAGES.none, 0, 1, .02, true, POOL, null,
      { chance: 0, randomOpening: true }, createExperiment(enabled, immortal));
    const p = s.party[0];
    return { seed, seconds: s.time, kills: s.kills, damage: p.totalDamage, skillCasts: p.testSkillCasts,
      heals: p.effectiveHealCount, healing: p.spellHealing, basics: p.testBasics, exhaustedSeconds: p.exhaustedSeconds,
      exhaustionEntries: p.exhaustionEntries, minimumResource: p.minimumResource, resourceMax: p.resourceMax,
      preventedDeaths: p.preventedDeaths, hp: p.hp, alive: p.alive };
  });
  const avg = key => rows.reduce((n, r) => n + r[key], 0) / runs;
  const deaths = rows.filter(r => !r.alive), seconds = avg('seconds');
  return { job, enabled, runs, immortal, survivalRate: 1 - deaths.length / runs,
    averageDeathSeconds: deaths.length ? deaths.reduce((n, r) => n + r.seconds, 0) / deaths.length : null,
    averageObservedSeconds: seconds, killsPerAttempt: avg('kills'), windowKillsPerMinute: avg('kills') / 10,
    dps: avg('damage') / seconds, killsPerMinute: avg('kills') / seconds * 60,
    skillsPerMinute: avg('skillCasts') / seconds * 60, healsPerMinute: avg('heals') / seconds * 60, basicsPerMinute: avg('basics') / seconds * 60,
    exhaustionPercent: avg('exhaustedSeconds') / seconds * 100, entries: avg('exhaustionEntries'),
    minimumResourcePercent: avg('minimumResource') / avg('resourceMax') * 100, rows };
}
if (require.main === module) {
  const job = process.argv[2];
  const immortal = !process.argv.includes('--mortal');
  console.log(JSON.stringify({ baseline: 'Lv30 human B1; skills Lv1; solo; no suppression/potions; 5 slots; 2s respawn; TEST V1 normals', immortal, cells: [run(job, true, 100, immortal), run(job, false, 100, immortal)] }));
}
module.exports = { run };
