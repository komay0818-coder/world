const { simulate, POOL, STAGES } = require('./chapter-three-31-v1-party-simulation');
const { createExperiment } = require('./mana-exhaustion-experiment');
function run(job, enabled, runs = 100) {
  const rows = Array.from({ length: runs }, (_, i) => {
    const seed = 310905 + i * 104729;
    const s = simulate([job], seed, 3, 'B', STAGES.none, 0, 1, .02, true, POOL, null,
      { chance: 0, randomOpening: true }, createExperiment(enabled));
    const p = s.party[0];
    return { seed, seconds: s.time, kills: s.kills, damage: p.totalDamage, skillCasts: p.testSkillCasts,
      heals: p.effectiveHealCount, healing: p.spellHealing, basics: p.testBasics, exhaustedSeconds: p.exhaustedSeconds,
      exhaustionEntries: p.exhaustionEntries, minimumResource: p.minimumResource, resourceMax: p.resourceMax,
      preventedDeaths: p.preventedDeaths, hp: p.hp, alive: p.alive };
  });
  const avg = key => rows.reduce((n, r) => n + r[key], 0) / runs;
  return { job, enabled, runs, dps: avg('damage') / 600, killsPerMinute: avg('kills') / 10,
    skillsPerMinute: avg('skillCasts') / 10, healsPerMinute: avg('heals') / 10, basicsPerMinute: avg('basics') / 10,
    exhaustionPercent: avg('exhaustedSeconds') / 6, entries: avg('exhaustionEntries'),
    minimumResourcePercent: avg('minimumResource') / avg('resourceMax') * 100, rows };
}
if (require.main === module) {
  const job = process.argv[2];
  console.log(JSON.stringify({ baseline: 'Lv30 human B1; skills Lv1; solo; no suppression/potions; HP floor 1; 5 slots; 2s respawn; TEST V1 normals', cells: [run(job, true), run(job, false)] }));
}
module.exports = { run };
