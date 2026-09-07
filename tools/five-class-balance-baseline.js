'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { runCombat, listSkills } = require('./formal-combat-entry.js');

const BRANCHES = {
  'weapon-master': { job: 'warrior' }, berserker: { job: 'warrior' },
  marksman: { job: 'hunter' }, beastmaster: { job: 'hunter' },
  assassination: { job: 'assassin' }, venom: { job: 'assassin' },
  elementalist: { job: 'mage' }, 'arcane-mage': { job: 'mage' },
  'holy-priest': { job: 'priest' }, 'battle-priest': { job: 'priest' }
};
const SEEDS = Array.from({ length: 100 }, (_, index) => (0x5eed0000 + index) >>> 0);
const ARMOR = { chest: { id: 'baseline-chest', slot: 'chest', defense: 12 } };

function equipment(job, advancedClass) {
  const commonWeapon = { id: 'baseline-weapon', slot: 'weapon', attack: 24, attackMin: 22, attackMax: 26, criticalChance: .10 };
  if (job === 'assassin') return { ...ARMOR, weapon: { ...commonWeapon, attack: 15, attackMin: 13, attackMax: 17, weaponType: 'one-handed-dagger', series: '匕首' }, offhand: { id: 'baseline-offhand-dagger', slot: 'offhand', attack: 18, attackMin: 16, attackMax: 20, weaponType: 'one-handed-dagger', series: '匕首' } };
  if (job === 'hunter') return { ...ARMOR, weapon: { ...commonWeapon, weaponType: 'two-handed-bow' } };
  if (job === 'warrior' && advancedClass === 'berserker') return { ...ARMOR, weapon: { ...commonWeapon, attack: 16, attackMin: 14, attackMax: 18, weaponType: 'two-handed-axe', series: '雙手斧' }, offhand: { id: 'baseline-offhand-axe', slot: 'offhand', attack: 16, attackMin: 14, attackMax: 18, weaponType: 'two-handed-axe', series: '雙手斧' } };
  if (job === 'warrior') return { ...ARMOR, weapon: { ...commonWeapon, weaponType: 'one-handed-sword', series: '劍' }, offhand: { id: 'baseline-shield', slot: 'offhand', series: '盾牌' } };
  return { ...ARMOR, weapon: { ...commonWeapon, weaponType: 'two-handed-staff', magicPower: 0 }, offhand: { id: 'baseline-focus', slot: 'offhand' } };
}

function combinations(job, advancedClass) {
  const skills = listSkills(job, advancedClass);
  const active = skills.filter((skill) => skill.type === 'active');
  const passive = skills.filter((skill) => skill.type === 'passive');
  return active.flatMap((a) => passive.map((p) => ({ activeLv6: a.id, passiveLv6: p.id })));
}

function mean(values) { return values.reduce((sum, value) => sum + value, 0) / values.length; }
function stats(values) { const average = mean(values); return { mean: average, sd: Math.sqrt(mean(values.map((value) => (value - average) ** 2))) }; }
function sumMaps(maps) { const out = {}; for (const map of maps) for (const [key, value] of Object.entries(map || {})) out[key] = (out[key] || 0) + value; return Object.fromEntries(Object.entries(out).map(([key, value]) => [key, value / maps.length])); }

function sample(result, mode) {
  const resource = result.resource || {};
  return {
    score: mode === 'boss' ? result.ttk : result.dps,
    dps: result.dps, ttk: result.ttk || 0, killsPerMinute: result.killsPerMinute || 0, totalDamage: result.totalDamage,
    basicShare: result.basicShare, activeSkillShare: result.activeSkillShare, aoeShare: result.aoeShare,
    dotShare: result.totalDamage ? result.dotDamage / result.totalDamage : 0,
    extraShare: result.totalDamage ? (result.extraShotDamage + result.offhandDamage + result.specialDamage) / result.totalDamage : 0,
    petShare: result.petShare, resourceMinimum: Number(resource.minimum || 0), resourceBlocked: Number(resource.blocked || 0),
    resourceZeroDuration: Number(resource.zeroDuration || 0), resourceLowDuration: Number(resource.lowDuration || 0),
    skillCasts: result.skillCasts, damageBySource: result.combat.damageBySource,
    healing: result.healing ? { effective: result.healing.effectiveHealing, overhealing: result.healing.overhealing } : { effective: 0, overhealing: 0 },
    faithAverage: result.faith?.average || 0
  };
}

function aggregate(runs, config, mode) {
  const fields = ['dps','ttk','killsPerMinute','totalDamage','basicShare','activeSkillShare','aoeShare','dotShare','extraShare','petShare','resourceMinimum','resourceBlocked','resourceZeroDuration','resourceLowDuration','faithAverage'];
  const summary = Object.fromEntries(fields.map((field) => [field, stats(runs.map((run) => run[field]))]));
  summary.skillCasts = sumMaps(runs.map((run) => run.skillCasts));
  summary.damageBySource = sumMaps(runs.map((run) => run.damageBySource));
  summary.effectiveHealing = stats(runs.map((run) => run.healing.effective));
  summary.overhealing = stats(runs.map((run) => run.healing.overhealing));
  return { config, mode, ...summary };
}

function runBranch(advancedClass) {
  const { job } = BRANCHES[advancedClass];
  if (!job) throw new Error(`Unknown branch: ${advancedClass}`);
  const combos = combinations(job, advancedClass);
  const enemyFive = { hp: 2500, defense: 20, attack: .1, attackSpeed: 1, level: 45, evasion: 0, parry: 0 };
  const enemyBoss = { hp: 12000, defense: 20, attack: .1, attackSpeed: 1, level: 45, evasion: 0, parry: 0 };
  const results = { job, advancedClass, combinationCount: combos.length, seeds: SEEDS.length, equipment: equipment(job, advancedClass), five: [], boss: [] };
  for (const config of combos) {
    const fiveRuns = SEEDS.map((seed) => sample(runCombat({ job, advancedClass, level: 45, mode: 'fixed-five', seconds: 120, seed, skills: config, equipment: results.equipment, enemy: enemyFive }), 'five'));
    results.five.push(aggregate(fiveRuns, config, 'five'));
    const bossRuns = SEEDS.map((seed) => sample(runCombat({ job, advancedClass, level: 45, mode: 'boss', maxSeconds: 900, seed, skills: config, equipment: results.equipment, enemy: enemyBoss }), 'boss'));
    results.boss.push(aggregate(bossRuns, config, 'boss'));
  }
  results.five.sort((a, b) => b.dps.mean - a.dps.mean);
  results.boss.sort((a, b) => a.ttk.mean - b.ttk.mean);
  return results;
}

const branchArg = process.argv.find((arg) => arg.startsWith('--branch='))?.split('=')[1];
const outputArg = process.argv.find((arg) => arg.startsWith('--output='))?.slice('--output='.length);
if (!branchArg || !outputArg) throw new Error('Usage: node tools/five-class-balance-baseline.js --branch=<id> --output=<file>');
const report = runBranch(branchArg);
fs.mkdirSync(path.dirname(outputArg), { recursive: true });
fs.writeFileSync(outputArg, JSON.stringify(report, null, 2));
console.log(`${branchArg}: ${report.combinationCount} combinations x ${report.seeds} seeds x 2 modes complete`);
