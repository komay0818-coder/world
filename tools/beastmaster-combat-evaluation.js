'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { runCombat, listSkills } = require('./formal-combat-entry.js');

const SEEDS = Array.from({ length: 100 }, (_, index) => (0xbea60000 + index) >>> 0);
const EQUIPMENT = { chest: { id: 'baseline-chest', slot: 'chest', defense: 12 }, weapon: { id: 'baseline-bow', slot: 'weapon', attack: 24, attackMin: 22, attackMax: 26, criticalChance: .10, weaponType: 'two-handed-bow' } };
const ENEMY_FIVE = { hp: 2500, defense: 20, attack: .1, attackSpeed: 1, level: 45, evasion: 0, parry: 0 };
const ENEMY_BOSS = { hp: 12000, defense: 20, attack: .1, attackSpeed: 1, level: 45, evasion: 0, parry: 0 };
const skills = listSkills('hunter', 'beastmaster');
const combinations = skills.filter((skill) => skill.type === 'active').flatMap((active) => skills.filter((skill) => skill.type === 'passive').map((passive) => ({ activeLv6: active.id, passiveLv6: passive.id })));
const focusedCombinations = [
  { activeLv6: 'power-shot', passiveLv6: 'hunting-instinct' },
  { activeLv6: 'power-shot', passiveLv6: 'pack-summoning' },
  { activeLv6: 'power-shot', passiveLv6: 'wild-bond' },
  { activeLv6: 'beast-fury', passiveLv6: 'pack-leader' }
];
const survivalPairCombinations = focusedCombinations.slice(0, 2);
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const stat = (values) => { const average = mean(values); return { mean: average, sd: Math.sqrt(mean(values.map((value) => (value - average) ** 2))) }; };

function survival(result) {
  const durationMs = result.duration * 1000;
  const pets = result.final.companions.map((pet) => pet.id);
  const state = Object.fromEntries(pets.map((id) => [id, { alive: true, changedAt: 0, aliveMs: 0, deaths: 0, revives: 0 }]));
  const events = result.combat.petEvents.filter((event) => ['pet-death', 'pet-revive'].includes(event.kind)).sort((a, b) => a.atMs - b.atMs);
  let groupChangedAt = 0;
  let aliveCount = pets.length;
  let groupAlivePetMs = 0;
  let zeroPetMs = 0;
  for (const event of events) {
    const at = Math.max(0, Math.min(durationMs, event.atMs));
    groupAlivePetMs += (at - groupChangedAt) * aliveCount;
    if (aliveCount === 0) zeroPetMs += at - groupChangedAt;
    groupChangedAt = at;
    const pet = state[event.petId];
    if (!pet) continue;
    pet.aliveMs += (at - pet.changedAt) * (pet.alive ? 1 : 0);
    pet.changedAt = at;
    if (event.kind === 'pet-death' && pet.alive) { pet.alive = false; pet.deaths += 1; aliveCount -= 1; }
    if (event.kind === 'pet-revive' && !pet.alive) { pet.alive = true; pet.revives += 1; aliveCount += 1; }
  }
  groupAlivePetMs += (durationMs - groupChangedAt) * aliveCount;
  if (aliveCount === 0) zeroPetMs += durationMs - groupChangedAt;
  Object.values(state).forEach((pet) => { pet.aliveMs += (durationMs - pet.changedAt) * (pet.alive ? 1 : 0); });
  return {
    petCount: pets.length,
    petAliveRate: pets.length && durationMs ? groupAlivePetMs / (durationMs * pets.length) : 0,
    averageAlivePets: durationMs ? groupAlivePetMs / durationMs : 0,
    anyPetAliveRate: durationMs ? 1 - zeroPetMs / durationMs : 0,
    zeroPetRate: durationMs ? zeroPetMs / durationMs : 0,
    deaths: Object.values(state).reduce((sum, pet) => sum + pet.deaths, 0),
    revives: Object.values(state).reduce((sum, pet) => sum + pet.revives, 0),
    guardTriggers: result.combat.petGuardTriggers || 0,
    guardAbsorbed: result.combat.petGuardAbsorbed || 0
  };
}

function sample(result) {
  const source = result.combat.damageBySource;
  const petDamage = (source['pet-basic'] || 0) + (source['pet-bite'] || 0) + (source['beast-slam'] || 0) + (source['pet-bleed'] || 0);
  const petSurvival = survival(result);
  return { dps: result.dps, ttk: result.ttk || 0, kpm: result.killsPerMinute || 0, totalDamage: result.totalDamage, petDamage, petDps: petDamage / result.duration, petShare: petDamage / result.totalDamage, basicDamage: result.basicDamage, activeSkillDamage: result.activeSkillTotal, ...petSurvival, petAliveSeconds: petSurvival.petAliveRate * result.duration, anyPetAliveSeconds: petSurvival.anyPetAliveRate * result.duration, zeroPetSeconds: petSurvival.zeroPetRate * result.duration };
}

function aggregate(runs, config) {
  const keys = ['petCount', 'dps', 'ttk', 'kpm', 'totalDamage', 'petDamage', 'petDps', 'petShare', 'basicDamage', 'activeSkillDamage', 'petAliveRate', 'petAliveSeconds', 'averageAlivePets', 'anyPetAliveRate', 'anyPetAliveSeconds', 'zeroPetRate', 'zeroPetSeconds', 'deaths', 'revives', 'guardTriggers', 'guardAbsorbed'];
  return { config, ...Object.fromEntries(keys.map((key) => [key, stat(runs.map((run) => run[key]))])) };
}

function evaluate(mode, configs) {
  const fixedFive = mode === 'five';
  return configs.map((config) => aggregate(SEEDS.map((seed) => sample(runCombat({
    job: 'hunter', advancedClass: 'beastmaster', level: 45,
    mode: fixedFive ? 'fixed-five' : 'boss', seconds: fixedFive ? 120 : undefined, maxSeconds: fixedFive ? undefined : 900,
    seed, equipment: EQUIPMENT, skills: config, enemy: fixedFive ? ENEMY_FIVE : ENEMY_BOSS
  }))), config)).sort((a, b) => fixedFive ? b.dps.mean - a.dps.mean : a.ttk.mean - b.ttk.mean);
}

const mode = process.argv.find((argument) => argument.startsWith('--mode='))?.split('=')[1];
const output = process.argv.find((argument) => argument.startsWith('--output='))?.slice(9);
const focused = process.argv.includes('--focused');
const survivalPairs = process.argv.includes('--survival-pairs');
if (!['five', 'boss'].includes(mode) || !output) throw new Error('Required --mode=five|boss --output=<file>');
const selectedCombinations = survivalPairs ? survivalPairCombinations : focused ? focusedCombinations : combinations;
const report = { mode, seeds: SEEDS.length, combinations: selectedCombinations.length, focused, survivalPairs, equipment: EQUIPMENT, enemy: mode === 'five' ? ENEMY_FIVE : ENEMY_BOSS, results: evaluate(mode, selectedCombinations) };
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(`${mode} complete`);
