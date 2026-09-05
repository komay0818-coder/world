'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Defense = require('../../monster-defense.js');
const Temple = require('./chapter-three-36-rules.js');
const { simulate } = require('./hunter-lv45-redrock-temple-round1.js');

const RUNS = 1000;
const MAX_HP = 1800;
const DEFENSE = 95;
const DAMAGE_REDUCTION = .08;
const PET_DURABILITY = 10;
const PET_OUTPUT = [1, .8, .8];
const sum = values => values.reduce((total, value) => total + value, 0);
const mean = values => sum(values) / values.length;
const round = (value, digits = 3) => Number(value.toFixed(digits));
const percentile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * fraction)];
};
function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
function incomingSequence(seed) {
  const random = rng(seed);
  const events = [];
  let time = 0;
  while (events.length < 10000) {
    const enemy = Temple.normals[Math.floor(random() * Temple.normals.length)];
    time += 1 / enemy.speed;
    events.push({ time, damage: Defense.resolvePlayerDamage({ baseDamage: enemy.attack, defense: DEFENSE, damageReduction: DAMAGE_REDUCTION }).finalDamage });
  }
  return events;
}
function pureIncoming(events, beastmaster, seed) {
  const petRandom = rng(seed ^ 0xA5A5A5A5);
  const pets = Array.from({ length: 3 }, () => ({ alive: true, durability: PET_DURABILITY, reviveAt: Infinity }));
  let hp = MAX_HP, potentialDamage = 0, actualDamage = 0, attacks = 0;
  for (const event of events) {
    if (beastmaster) for (const pet of pets) if (!pet.alive && event.time >= pet.reviveAt) { pet.alive = true; pet.durability = PET_DURABILITY; pet.reviveAt = Infinity; }
    const living = beastmaster ? pets.filter(pet => pet.alive) : [];
    const damage = beastmaster && living.length ? event.damage * .7 : event.damage;
    potentialDamage += event.damage;
    actualDamage += damage;
    hp -= damage;
    attacks++;
    if (beastmaster && living.length) {
      const pet = living[Math.floor(petRandom() * living.length)];
      if (--pet.durability <= 0) { pet.alive = false; pet.reviveAt = event.time + 30; }
    }
    if (hp <= 0) return { deathSeconds: event.time, attacks, potentialDamage, actualDamage };
  }
  throw new Error('Incoming sequence was too short to produce a death.');
}
function distribution(rows) {
  return {
    averageDeathSeconds: round(mean(rows.map(row => row.deathSeconds))),
    medianDeathSeconds: round(percentile(rows.map(row => row.deathSeconds), .5)),
    shortestDeathSeconds: round(Math.min(...rows.map(row => row.deathSeconds))),
    longestDeathSeconds: round(Math.max(...rows.map(row => row.deathSeconds))),
    averageKillsBeforeDeath: round(mean(rows.map(row => row.kills))),
    medianKillsBeforeDeath: round(percentile(rows.map(row => row.kills), .5)),
    averageEnemyAttacks: round(mean(rows.map(row => row.attacks))),
    averagePotentialDamage: round(mean(rows.map(row => row.potentialDamage))),
    averageActualDamage: round(mean(rows.map(row => row.actualDamage))),
    averageDamagePerAttack: round(mean(rows.map(row => row.actualDamage / row.attacks))),
    reach100KillsPercent: round(rows.filter(row => row.kills >= 100).length / rows.length * 100),
    reach500KillsPercent: round(rows.filter(row => row.kills >= 500).length / rows.length * 100),
    reach1000KillsPercent: round(rows.filter(row => row.kills >= 1000).length / rows.length * 100)
  };
}
function fullRows(spec, disablePetStun = false) {
  return Array.from({ length: RUNS }, (_, index) => {
    const result = simulate(spec, 0x5A7000 + index * 7919, {
      killTarget: 1000,
      pool: Temple.normals,
      stopOnPlayerDeath: true,
      ...(spec === 'beastmaster' ? { petDurability: PET_DURABILITY, petOutputMultipliers: PET_OUTPUT, disablePetStun } : {})
    });
    return {
      raw: result,
      deathSeconds: result.duration,
      kills: result.killsAtPlayerDeath ?? 1000,
      attacks: result.counts.enemyDirectAttacks,
      potentialDamage: result.potentialDamage,
      actualDamage: result.damageTaken
    };
  });
}
function beastDetails(rows) {
  const elapsed = sum(rows.map(row => sum(row.raw.aliveGroupMs)));
  const group = count => round(sum(rows.map(row => row.raw.aliveGroupMs[count])) / elapsed * 100);
  return {
    petAliveTimePercent: { three: group(3), two: group(2), one: group(1), zero: group(0) },
    averageGuardEvents: round(mean(rows.map(row => sum(row.raw.petStats.map(pet => pet.guardEvents))))),
    averagePetDeaths: round(mean(rows.map(row => sum(row.raw.petStats.map(pet => pet.deaths))))),
    averagePetRevives: round(mean(rows.map(row => sum(row.raw.petStats.map(pet => pet.revives))))),
    averageGuardAvoidedDamage: round(mean(rows.map(row => row.raw.potentialDamage - row.raw.damageTaken))),
    averageZeroPetDamage: round(mean(rows.map(row => row.raw.zeroPetDamage))),
    averageStuns: round(mean(rows.map(row => row.raw.counts.stuns))),
    averageEnemyAttacksPreventedByStun: round(mean(rows.map(row => row.raw.counts.enemyAttacksPreventedByStun))),
    averageDamagePreventedByStun: round(mean(rows.map(row => row.raw.stunPreventedDamage))),
    averageDirectDamageReductionPercent: round(mean(rows.map(row => 1 - row.raw.damageTaken / row.raw.potentialDamage)) * 100)
  };
}

const pureMarksman = [], pureBeastmaster = [];
for (let index = 0; index < RUNS; index++) {
  const seed = 0x517000 + index * 7919;
  const events = incomingSequence(seed);
  pureMarksman.push({ ...pureIncoming(events, false, seed), kills: 0 });
  pureBeastmaster.push({ ...pureIncoming(events, true, seed), kills: 0 });
}
const marksmanRows = fullRows('marksman');
const beastmasterRows = fullRows('beastmaster');
const beastmasterNoStunRows = fullRows('beastmaster', true);
const marksman = distribution(marksmanRows), beastmaster = distribution(beastmasterRows), beastmasterNoStun = distribution(beastmasterNoStunRows);
const result = {
  metadata: {
    generatedAt: new Date().toISOString(),
    level: 45,
    map: '3-6 赤岩聖殿',
    runs: RUNS,
    player: { maxHp: MAX_HP, defense: DEFENSE, damageReduction: DAMAGE_REDUCTION, attack: 200 },
    marksmanPet: '無HP／耐久／死亡；無護主',
    beastmaster: { output: '100/80/80', durability: 10, reviveSeconds: 30, guardHunterDamageMultiplier: .7 },
    enemyScope: '3-6普通怪直接普通攻擊；未包含完整AoE／技能輪轉',
    noFormalPolicyChanges: true
  },
  pureIncoming: {
    marksman: distribution(pureMarksman),
    beastmaster: distribution(pureBeastmaster),
    survivalTimeIncreasePercent: round(mean(pureBeastmaster.map(row => row.deathSeconds)) / mean(pureMarksman.map(row => row.deathSeconds)) - 1, 4) * 100,
    attackCountIncreasePercent: round(mean(pureBeastmaster.map(row => row.attacks)) / mean(pureMarksman.map(row => row.attacks)) - 1, 4) * 100
  },
  fullCombat: {
    marksman,
    beastmaster,
    beastmasterNoStun,
    beastmasterDetails: beastDetails(beastmasterRows),
    survivalTimeIncreasePercent: round((beastmaster.averageDeathSeconds / marksman.averageDeathSeconds - 1) * 100),
    killsBeforeDeathIncreasePercent: round((beastmaster.averageKillsBeforeDeath / marksman.averageKillsBeforeDeath - 1) * 100),
    stunSurvivalTimeContributionPercent: round((beastmaster.averageDeathSeconds / beastmasterNoStun.averageDeathSeconds - 1) * 100),
    stunKillsContributionPercent: round((beastmaster.averageKillsBeforeDeath / beastmasterNoStun.averageKillsBeforeDeath - 1) * 100)
  }
};

const output = path.join(__dirname, 'results', 'hunter-survival-marksman-vs-beastmaster.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output, pureIncoming: result.pureIncoming, fullCombat: result.fullCombat }, null, 2));

