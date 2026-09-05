'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Defense = require('../../monster-defense.js');
const Temple = require('./chapter-three-36-rules.js');

const RUNS = 1000, MAX_KILLS = 5000;
const sum = values => values.reduce((total, value) => total + value, 0);
const mean = values => values.length ? sum(values) / values.length : null;
const round = (value, digits = 3) => value == null ? null : Number(value.toFixed(digits));
const pct = (a, b) => b ? round(a / b * 100) : 0;
function rng(seed) { let state = seed >>> 0; return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; }; }

const MEMBER_TEMPLATES = {
  warrior: { job: 'warrior', maxHp: 1965, defense: 305, dr: .03, attack: 119, crit: .10, dodge: .27, parry: .13, hpRegen: 17, dps: 145, skills: '既有Lv45成長面板；傷害以分析用聚合DPS表示' },
  hunter: { job: 'hunter', maxHp: 1800, defense: 95, dr: .08, attack: 200, crit: .30, dodge: .07, parry: 0, hpRegen: 0, dps: 0, skills: '基礎與轉職技能Lv6' },
  mage: { job: 'mage', maxHp: 1579, defense: 191, dr: 0, attack: 103, crit: .12, dodge: .29, parry: 0, hpRegen: 15, dps: 150, skills: '既有Lv45成長面板；傷害以分析用聚合DPS表示' },
  priest: { job: 'priest', maxHp: 1632, defense: 196, dr: 0, attack: 97, crit: .10, dodge: .28, parry: 0, hpRegen: 15, dps: 100, skills: '生存模型模擬治癒術、餘暉、神恩；其他技能僅由聚合DPS表示' }
};
const HUNTER_DPS = { marksman: 302.5, beastmasterBody: 152.493, pets: [59.1, 41.37, 41.37] };
const PET_ATTACK_INTERVAL = .8, HEAL_THRESHOLD = .70, HEAL_COOLDOWN = 8, HEAL_COST = 28;
const PRIEST_RESOURCE_MAX = 442, PRIEST_REGEN = (Math.max(.625, PRIEST_RESOURCE_MAX * .01) * 1.3 + 8);
const HEAL_RAW = Math.ceil(97 * 2.2 * 1.15);

function makeMember(template) {
  return { ...template, hp: template.maxHp, alive: true, shield: 0, firstDeathAt: null, damageTaken: 0, potentialDamage: 0, targeted: 0, heals: 0, rawHealing: 0, effectiveHealing: 0, overheal: 0, shieldReceived: 0, minimumHp: template.maxHp };
}
function simulate(kind, seed, { healing = true, stun = true } = {}) {
  const random = rng(seed), party = Object.values(MEMBER_TEMPLATES).map(makeMember), hunter = party[1], priest = party[3];
  const beast = kind === 'beastmaster';
  const pets = beast ? [0, 1, 2].map((slot, index) => ({ slot, multiplier: [1, .7, .7][index], alive: true, durability: 10, reviveAt: Infinity, nextAttackAt: PET_ATTACK_INTERVAL, deaths: 0, revives: 0, firstDeathAt: null })) : [];
  let now = 0, last = 0, kills = 0, enemy = null, enemyHp = 0, enemyAttackAt = Infinity, enemyStunnedUntil = 0, enemyStunReadyAt = 0;
  let priestResource = PRIEST_RESOURCE_MAX, healReadyAt = 0, healCount = 0, afterglows = [];
  let hunterFirstDeathKills = null, firstPartyDeathAt = null, firstPartyDeathJob = null, wipeAt = null, wipeKills = null;
  const aliveGroupSeconds = [0, 0, 0, 0], hunterMilestones = {}, stats = { enemyAttacks: 0, attacksPreventedByStun: 0, damagePreventedByStun: 0, petBasics: 0, stunRolls: 0, stunSuccess: 0, stunIcdBlocks: 0, guardEvents: 0, guardAvoided: 0, zeroPetHunterAttacks: 0, zeroPetHunterDamage: 0 };
  function living() { return party.filter(member => member.alive); }
  function livingPets() { return pets.filter(pet => pet.alive); }
  function currentDps() {
    let value = party.filter(member => member.alive && member.job !== 'hunter').reduce((total, member) => total + member.dps, 0);
    if (hunter.alive) value += beast ? HUNTER_DPS.beastmasterBody + livingPets().reduce((total, pet) => total + HUNTER_DPS.pets[pet.slot], 0) : HUNTER_DPS.marksman;
    return Math.max(1, value);
  }
  function spawn() {
    enemy = Temple.normals[Math.floor(random() * Temple.normals.length)];
    enemyHp = enemy.hp;
    enemyAttackAt = now + 1 / enemy.speed;
    enemyStunnedUntil = 0;
    enemyStunReadyAt = 0;
  }
  function advance(to) {
    const elapsed = Math.max(0, to - last), petCount = livingPets().length;
    aliveGroupSeconds[petCount] += elapsed;
    for (const member of party) if (member.alive && member.hpRegen) member.hp = Math.min(member.maxHp, member.hp + member.hpRegen * elapsed);
    priestResource = Math.min(PRIEST_RESOURCE_MAX, priestResource + PRIEST_REGEN * elapsed);
    if (enemy) enemyHp -= currentDps() * elapsed;
    now = to; last = to;
  }
  function recordDeath(member) {
    member.hp = 0; member.alive = false;
    if (member.firstDeathAt == null) member.firstDeathAt = now;
    if (firstPartyDeathAt == null) { firstPartyDeathAt = now; firstPartyDeathJob = member.job; }
    if (member === hunter && hunterFirstDeathKills == null) { hunterFirstDeathKills = kills; for (const mark of [100, 500, 1000, 5000]) hunterMilestones[mark] = kills >= mark; for (const pet of pets) pet.alive = false; }
    if (!living().length) { wipeAt = now; wipeKills = kills; }
  }
  function applyHealing(target, raw, source) {
    if (!target.alive) return;
    const missing = target.maxHp - target.hp, effective = Math.min(missing, raw), overflow = Math.max(0, raw - effective);
    target.hp += effective; target.heals++; target.rawHealing += raw; target.effectiveHealing += effective; target.overheal += overflow;
    if (source === 'heal' && overflow) { const shield = overflow * .6; target.shield += shield; target.shieldReceived += shield; }
  }
  function tryHeal() {
    if (!healing || !priest.alive || now < healReadyAt || priestResource < HEAL_COST) return;
    const target = living().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (!target || target.hp / target.maxHp > HEAL_THRESHOLD) return;
    healCount++; const grace = healCount % 4 === 0, raw = Math.ceil(HEAL_RAW * (grace ? 1.35 : 1));
    priestResource -= HEAL_COST; healReadyAt = now + HEAL_COOLDOWN;
    applyHealing(target, raw, 'heal'); afterglows.push({ at: now + 3, target, amount: Math.floor(Math.min(raw, target.maxHp) * .2) });
    if (grace) for (const ally of living().filter(member => member !== target).slice(0, 3)) applyHealing(ally, Math.ceil(raw * .15), 'grace');
  }
  function dealEnemyAttack() {
    if (now < enemyStunnedUntil) { stats.attacksPreventedByStun++; const estimate = living().length ? mean(living().map(member => Defense.resolvePlayerDamage({ baseDamage: enemy.attack, defense: member.defense, damageReduction: member.dr }).finalDamage)) : 0; stats.damagePreventedByStun += estimate; enemyAttackAt = now + 1 / enemy.speed; return; }
    stats.enemyAttacks++;
    const targets = living(); if (!targets.length) return;
    const target = targets[Math.floor(random() * targets.length)]; target.targeted++;
    if (random() < target.dodge) { enemyAttackAt = now + 1 / enemy.speed; return; }
    let damage = Defense.resolvePlayerDamage({ baseDamage: enemy.attack, defense: target.defense, damageReduction: target.dr }).finalDamage;
    if (target.parry && random() < target.parry) damage = Math.max(1, Math.ceil(damage * .5));
    target.potentialDamage += damage;
    if (beast && target === hunter) {
      const live = livingPets();
      if (live.length) { const original = damage; damage *= .7; stats.guardEvents++; stats.guardAvoided += original - damage; const pet = live[Math.floor(random() * live.length)]; if (--pet.durability <= 0) { pet.alive = false; pet.deaths++; pet.reviveAt = now + 30; if (pet.firstDeathAt == null) pet.firstDeathAt = now; } }
      else { stats.zeroPetHunterAttacks++; stats.zeroPetHunterDamage += damage; }
    }
    const absorbed = Math.min(target.shield, damage); target.shield -= absorbed; damage -= absorbed;
    target.hp -= damage; target.damageTaken += damage; target.minimumHp = Math.min(target.minimumHp, Math.max(0, target.hp));
    if (target.hp <= 0) recordDeath(target);
    enemyAttackAt = now + 1 / enemy.speed;
  }
  spawn();
  while (kills < MAX_KILLS && !wipeAt) {
    const deathAt = now + Math.max(0, enemyHp) / currentDps();
    const nextPetAttack = beast && hunter.alive ? Math.min(...livingPets().map(pet => pet.nextAttackAt), Infinity) : Infinity;
    const nextRevive = beast && hunter.alive ? Math.min(...pets.filter(pet => !pet.alive).map(pet => pet.reviveAt), Infinity) : Infinity;
    const nextAfterglow = afterglows.length ? Math.min(...afterglows.map(event => event.at)) : Infinity;
    const next = Math.min(deathAt, enemyAttackAt, nextPetAttack, nextRevive, nextAfterglow);
    if (!Number.isFinite(next) || next > 20000) break;
    advance(next);
    for (const pet of pets) if (!pet.alive && pet.reviveAt <= now && hunter.alive) { pet.alive = true; pet.durability = 10; pet.reviveAt = Infinity; pet.nextAttackAt = now + PET_ATTACK_INTERVAL; pet.revives++; }
    const dueAfterglows = afterglows.filter(event => event.at <= now); afterglows = afterglows.filter(event => event.at > now); for (const event of dueAfterglows) applyHealing(event.target, event.amount, 'afterglow');
    if (enemyHp <= 1e-9) { kills++; if (hunter.alive) for (const mark of [100, 500, 1000, 5000]) if (kills === mark) hunterMilestones[mark] = true; spawn(); tryHeal(); continue; }
    if (nextPetAttack <= now) for (const pet of livingPets().filter(candidate => candidate.nextAttackAt <= now)) { stats.petBasics++; stats.stunRolls++; if (random() < .10 && stun) { if (now < enemyStunReadyAt) stats.stunIcdBlocks++; else { stats.stunSuccess++; enemyStunReadyAt = now + 5; enemyStunnedUntil = Math.max(enemyStunnedUntil, now + 1); } } pet.nextAttackAt = now + PET_ATTACK_INTERVAL; }
    if (enemyAttackAt <= now) dealEnemyAttack();
    tryHeal();
  }
  if (hunterFirstDeathKills == null) for (const mark of [100, 500, 1000, 5000]) hunterMilestones[mark] = kills >= mark;
  return { time: now, kills, hunterFirstDeathAt: hunter.firstDeathAt, hunterFirstDeathKills, firstPartyDeathAt, firstPartyDeathJob, wipeAt, wipeKills, party, pets, aliveGroupSeconds, hunterMilestones, stats };
}

function aggregate(rows) {
  const hunterRows = rows.map(row => row.party[1]), hunterDeaths = rows.filter(row => row.hunterFirstDeathAt != null), wipes = rows.filter(row => row.wipeAt != null), elapsed = sum(rows.map(row => sum(row.aliveGroupSeconds)));
  const memberStats = Object.fromEntries(['warrior', 'hunter', 'mage', 'priest'].map((job, index) => { const members = rows.map(row => row.party[index]); return [job, { maxHp: members[0].maxHp, defense: members[0].defense, damageReduction: members[0].dr, attack: members[0].attack, averageTargeted: round(mean(members.map(member => member.targeted))), averageDamageTaken: round(mean(members.map(member => member.damageTaken))), averageEffectiveHealing: round(mean(members.map(member => member.effectiveHealing))), averageOverheal: round(mean(members.map(member => member.overheal))), averageShieldReceived: round(mean(members.map(member => member.shieldReceived))), averageHealCount: round(mean(members.map(member => member.heals))) }]; }));
  const firstDeaths = {}; for (const row of rows) firstDeaths[row.firstPartyDeathJob || 'none'] = (firstDeaths[row.firstPartyDeathJob || 'none'] || 0) + 1;
  return {
    runs: rows.length, hunterDeathRatePercent: pct(hunterDeaths.length, rows.length), averageHunterFirstDeathSeconds: round(mean(hunterDeaths.map(row => row.hunterFirstDeathAt))), medianHunterFirstDeathSeconds: round(hunterDeaths.length ? hunterDeaths.map(row => row.hunterFirstDeathAt).sort((a, b) => a - b)[Math.floor((hunterDeaths.length - 1) / 2)] : null), averageKillsBeforeHunterDeath: round(mean(hunterDeaths.map(row => row.hunterFirstDeathKills))),
    hunterSurvivalRateByKills: Object.fromEntries([100, 500, 1000, 5000].map(mark => [mark, pct(rows.filter(row => row.hunterMilestones[mark]).length, rows.length)])), averageEndHunterHpPercent: round(mean(hunterRows.map(member => member.hp / member.maxHp)) * 100), averageHunterMinimumHpPercent: round(mean(hunterRows.map(member => member.minimumHp / member.maxHp)) * 100),
    averageHunterTargeted: round(mean(hunterRows.map(member => member.targeted))), averageHunterPotentialDamage: round(mean(hunterRows.map(member => member.potentialDamage))), averageHunterDamageTaken: round(mean(hunterRows.map(member => member.damageTaken))), averageHunterEffectiveHealing: round(mean(hunterRows.map(member => member.effectiveHealing))), averageHunterOverheal: round(mean(hunterRows.map(member => member.overheal))), averageHunterShieldReceived: round(mean(hunterRows.map(member => member.shieldReceived))), averagePriestHealsOnHunter: round(mean(hunterRows.map(member => member.heals))),
    firstPartyDeathDistributionPercent: Object.fromEntries(Object.entries(firstDeaths).map(([job, count]) => [job, pct(count, rows.length)])), averageFirstPartyDeathSeconds: round(mean(rows.filter(row => row.firstPartyDeathAt != null).map(row => row.firstPartyDeathAt))), wipeRatePercent: pct(wipes.length, rows.length), averageWipeSeconds: round(mean(wipes.map(row => row.wipeAt))), averageKillsBeforeWipe: round(mean(wipes.map(row => row.wipeKills))), averageRunSeconds: round(mean(rows.map(row => row.time))), averageKills: round(mean(rows.map(row => row.kills))), members: memberStats,
    beastmaster: rows[0].pets.length ? { petAliveTimePercent: { three: pct(sum(rows.map(row => row.aliveGroupSeconds[3])), elapsed), two: pct(sum(rows.map(row => row.aliveGroupSeconds[2])), elapsed), one: pct(sum(rows.map(row => row.aliveGroupSeconds[1])), elapsed), zero: pct(sum(rows.map(row => row.aliveGroupSeconds[0])), elapsed) }, petDeaths: rows[0].pets.map((_, index) => round(mean(rows.map(row => row.pets[index].deaths)))), petRevives: rows[0].pets.map((_, index) => round(mean(rows.map(row => row.pets[index].revives)))), firstPetDeathSeconds: round(mean(rows.flatMap(row => row.pets.map(pet => pet.firstDeathAt).filter(value => value != null)))), averageGuardEvents: round(mean(rows.map(row => row.stats.guardEvents))), averageGuardAvoidedDamage: round(mean(rows.map(row => row.stats.guardAvoided))), averageGuardAvoidedPerEvent: round(mean(rows.map(row => row.stats.guardAvoided / Math.max(1, row.stats.guardEvents)))), averageZeroPetHunterAttacks: round(mean(rows.map(row => row.stats.zeroPetHunterAttacks))), averageZeroPetHunterDamage: round(mean(rows.map(row => row.stats.zeroPetHunterDamage))), hunterDirectDamageReductionPercent: round(mean(rows.map(row => 1 - row.party[1].damageTaken / Math.max(1, row.party[1].potentialDamage))) * 100), averagePetBasics: round(mean(rows.map(row => row.stats.petBasics))), averageStunRolls: round(mean(rows.map(row => row.stats.stunRolls))), averageStuns: round(mean(rows.map(row => row.stats.stunSuccess))), averageStunIcdBlocks: round(mean(rows.map(row => row.stats.stunIcdBlocks))), averageAttacksPreventedByStun: round(mean(rows.map(row => row.stats.attacksPreventedByStun))), averageDamagePreventedByStun: round(mean(rows.map(row => row.stats.damagePreventedByStun))) } : null
  };
}
function run(kind, options) { return Array.from({ length: RUNS }, (_, index) => simulate(kind, 0x4F0000 + index * 7919, options)); }

const normalMarksman = run('marksman', { healing: true, stun: true });
const normalBeast = run('beastmaster', { healing: true, stun: true });
const noStunBeast = run('beastmaster', { healing: true, stun: false });
const noHealMarksman = run('marksman', { healing: false, stun: true });
const noHealBeast = run('beastmaster', { healing: false, stun: true });
const cells = { normalMarksman: aggregate(normalMarksman), normalBeastmaster: aggregate(normalBeast), normalBeastmasterNoStun: aggregate(noStunBeast), noHealingMarksman: aggregate(noHealMarksman), noHealingBeastmaster: aggregate(noHealBeast) };
function advantage(beastCell, marksmanCell, key) { return beastCell[key] == null || marksmanCell[key] == null ? null : round((beastCell[key] / marksmanCell[key] - 1) * 100); }
const result = {
  metadata: { generatedAt: new Date().toISOString(), runs: RUNS, maxKills: MAX_KILLS, level: 45, map: '3-6 赤岩聖殿普通怪', targeting: '測試用：從存活四名角色等機率隨機選擇', healingAi: '測試用：治癒術優先最低HP比例且HP<=70%的存活角色；模擬餘暉與神恩，未模擬完整正式牧師施法輪轉', enemySkills: '只含普通怪直接普通攻擊；沒有AoE、DOT或完整技能輪轉', teamGear: '隊友沿用既有第二章合理強化B配置；獵人使用指定Lv45面板；各職傷害為分析用聚合DPS', hunterDpsCalibration: { marksman: HUNTER_DPS.marksman, beastmaster100_70_70: HUNTER_DPS.beastmasterBody + sum(HUNTER_DPS.pets), differencePercent: round(((HUNTER_DPS.beastmasterBody + sum(HUNTER_DPS.pets)) / HUNTER_DPS.marksman - 1) * 100) }, noFormalPolicyChanges: true },
  statSheets: MEMBER_TEMPLATES, cells,
  comparisons: { normalHunterSurvivalAdvantagePercent: advantage(cells.normalBeastmaster, cells.normalMarksman, 'averageHunterFirstDeathSeconds'), noHealingHunterSurvivalAdvantagePercent: advantage(cells.noHealingBeastmaster, cells.noHealingMarksman, 'averageHunterFirstDeathSeconds'), guardOnlySurvivalAdvantagePercent: advantage(cells.normalBeastmasterNoStun, cells.normalMarksman, 'averageHunterFirstDeathSeconds'), stunAdditionalSurvivalPercent: advantage(cells.normalBeastmaster, cells.normalBeastmasterNoStun, 'averageHunterFirstDeathSeconds'), normalWipeTimeAdvantagePercent: advantage(cells.normalBeastmaster, cells.normalMarksman, 'averageWipeSeconds') }
};
const output = path.join(__dirname, 'results', 'hunter-lv45-four-member-survival.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output, comparisons: result.comparisons, normal: { marksman: cells.normalMarksman, beastmaster: cells.normalBeastmaster, beastmasterNoStun: cells.normalBeastmasterNoStun }, noHealing: { marksman: cells.noHealingMarksman, beastmaster: cells.noHealingBeastmaster } }, null, 2));
