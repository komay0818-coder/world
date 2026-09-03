const MonsterDefense = require('../../monster-defense.js');
const Skills = require('../../class-skill-policy.js');

const RUNS = Number(process.argv[2]) || 100;
const DURATION = 600;
const DT = .05;
const POOL = [
  { id: 'hyena', name: '荒原鬣狗', hp: 748, attack: 94, defense: 40, evasion: 19, parry: 0, dr: 6, speed: 1.50, skillMultiplier: 1.20, skillCooldown: 7, bleedRatio: .06, bleedDuration: 5 },
  { id: 'lizard', name: '赤岩蜥蜴', hp: 1127, attack: 87, defense: 83, evasion: 3, parry: 8, dr: 18, speed: .78, skillMultiplier: 1.10, skillCooldown: 9, lowHpDefense: .25 },
  { id: 'vulture', name: '荒原禿鷹', hp: 874, attack: 83, defense: 51, evasion: 16, parry: 0, dr: 8, speed: 1.10, skillMultiplier: 1.35, skillCooldown: 8 },
  { id: 'scout', name: '碎顱斥候', hp: 943, attack: 101, defense: 55, evasion: 8, parry: 8, dr: 10, speed: .95, skillMultiplier: 1.15, skillCooldown: 8 }
];
const WEAPONS = {
  warrior: { name: '斬木巨劍', min: 38, max: 50, speed: .78, range: 'melee', type: 'physical' },
  assassin: { name: '暗林短刃（單持）', min: 22, max: 29, speed: 1.55, range: 'melee', type: 'physical' },
  hunter: { name: '長枝獵弓', min: 24, max: 33, speed: 1.08, range: 'ranged', type: 'physical' },
  mage: { name: '古木魔杖', min: 23, max: 31, speed: 1.15, range: 'ranged', type: 'magic', mana: 20 },
  priest: { name: '古木魔杖', min: 23, max: 31, speed: 1.15, range: 'ranged', type: 'magic', mana: 20 }
};
const BASE = {
  warrior: { hp: 150, mana: 0, attack: 12, defense: 9, crit: .05, dodge: .03 },
  assassin: { hp: 95, mana: 80, attack: 14, defense: 3, crit: .15, dodge: .12 },
  hunter: { hp: 110, mana: 90, attack: 13, defense: 4, crit: .10, dodge: .07 },
  mage: { hp: 80, mana: 140, attack: 18, defense: 2, crit: .07, dodge: .05 },
  priest: { hp: 105, mana: 130, attack: 12, defense: 4, crit: .05, dodge: .04 }
};
const ARMOR = {
  warrior: { hp: 193, defense: 104, hpRegen: 2, mana: 0 },
  assassin: { hp: 136, defense: 79, hpRegen: 0, mana: 0 },
  hunter: { hp: 136, defense: 79, hpRegen: 0, mana: 0 },
  mage: { hp: 102, defense: 56, hpRegen: 0, mana: 62, manaRegenFlat: 4 },
  priest: { hp: 102, defense: 56, hpRegen: 0, mana: 62, manaRegenFlat: 4 }
};
const PARTIES = { A: ['warrior', 'assassin', 'hunter', 'priest'], B: ['warrior', 'assassin', 'mage', 'priest'] };
const STAGES = {
  none: { id: '無壓制', drain: 0, penalty: 0 },
  full: { id: '0/10完整壓制', drain: 10, penalty: .10 }
};
// Aggregate values below are assembled only from currently implemented chapter-two items/affixes/runes.
// Jewellery slots exist in the UI but currently have no obtainable chapter-two templates, so none are invented here.
const GEAR = {
  A: { id: 'A', name: '最低保底', extraHp: 0, extraDefense: 0, hpFlat: 0, hpPercent: 0, defensePercent: 0, attackFlat: 0, attackPercent: 0, crit: 0, dodge: 0, hpRegen: 0, skillDamage: 0, basicDamage: 0, killHeal: 0, killResource: 0, cooldown: 0, manaRegen: 0, resourcePercent: 0, ironWall: false },
  B: { id: 'B', name: '合理強化', extraHp: 127, extraDefense: 29, hpFlat: 90, hpPercent: .40, defensePercent: .36, attackFlat: 24, attackPercent: 0, crit: .05, dodge: .24, hpRegen: 15, skillDamage: .08, basicDamage: .16, killHeal: .06, killResource: .05, cooldown: .24, manaRegen: .30, resourcePercent: 0, ironWall: false },
  C: { id: 'C', name: '第二章高配', extraHp: 127, extraDefense: 29, hpFlat: 150, hpPercent: .48, defensePercent: .42, attackFlat: 30, attackPercent: .03, crit: .09, dodge: .32, hpRegen: 25, skillDamage: .24, basicDamage: .24, killHeal: .09, killResource: .05, cooldown: .32, manaRegen: .40, resourcePercent: .05, ironWall: true }
};
const GEAR_WEAPON_UPGRADE = { warrior: { min: 43, max: 57, speed: .65, name: '黑鐵重劍' }, assassin: null, hunter: { min: 28, max: 38, speed: .88, name: '穿林長弓' }, mage: { min: 26, max: 35, speed: 1, name: '孢子魔杖' }, priest: { min: 26, max: 35, speed: 1, name: '孢子魔杖' } };

function rng(seed) { let x = seed >>> 0; return () => ((x = Math.imul(x ^ x >>> 15, 1 | x), x ^= x + Math.imul(x ^ x >>> 7, 61 | x), ((x ^ x >>> 14) >>> 0) / 4294967296)); }
function makePlayer(job, gearId = 'A', penalty = 0) {
  const b = BASE[job], a = ARMOR[job], gear = GEAR[gearId];
  const upgrade = gearId === 'C' ? GEAR_WEAPON_UPGRADE[job] : null;
  const w = upgrade ? { ...WEAPONS[job], ...upgrade } : WEAPONS[job];
  const passives = Skills.getSkills(job).filter(s => s.type === 'passive' && s.level <= 30).map(s => Skills.getEffect(job, s.id, 1));
  const passive = key => passives.reduce((n, e) => n + (Number(e?.[key]) || 0), 0);
  let purpleHp = 0, purpleDefense = 0, purpleHpPercent = 0, purpleDefensePercent = 0, purpleDodge = 0;
  if (gearId === 'C' && job === 'warrior') { purpleHp = 88; purpleDefense = 17; purpleHpPercent = -.12; purpleDefensePercent = -.04; }
  if (gearId === 'C' && ['assassin', 'hunter'].includes(job)) { purpleHp = 49; purpleDefense = 8; purpleHpPercent = -.12; purpleDefensePercent = -.12; purpleDodge = .03; }
  const hp = Math.round((b.hp + 5 + 29 * 12 + a.hp + gear.extraHp + gear.hpFlat + purpleHp) * (1.60 + (job === 'warrior' ? .05 : 0) + gear.hpPercent + purpleHpPercent) * 1.05);
  const normalDefense = Math.round((b.defense + 1 + 5 + a.defense + gear.extraDefense + purpleDefense) * (1.60 + gear.defensePercent + purpleDefensePercent) * 1.05);
  let offhandAttack = 0;
  if (gearId !== 'A' && job === 'assassin') offhandAttack = (22 + 29) / 4; // Formal dagger offhand contributes 50% of its midpoint.
  const attack = Math.round((b.attack + 29 + (w.min + w.max) / 2 + offhandAttack + gear.attackFlat) * 1.05 * (1 + passive('weaponDamage') + gear.attackPercent));
  const spellbookMana = gearId === 'B' && ['mage', 'priest'].includes(job) ? 30 : 0;
  const resourceMaxBase = job === 'warrior' || job === 'assassin' ? 100 : job === 'hunter' ? (gearId === 'A' ? 8 : 10) : Math.round((b.mana + 5 + 29 * 6 + a.mana + (w.mana || 0) + spellbookMana) * 1.05);
  const resourceMax = Math.round(resourceMaxBase * (1 + gear.resourcePercent));
  const purpleMagic = gearId === 'C' && ['mage', 'priest'].includes(job) ? .075 : 0;
  return { job, gearId, weapon: w, maxHp: hp, hp, normalDefense, defense: Math.round(normalDefense * (1 - penalty)), outgoing: 1 - penalty, attack, crit: b.crit + passive('crit') + gear.crit, dodge: Math.min(.45, b.dodge + (['assassin', 'hunter'].includes(job) ? .08 : 0) + passive('dodge') + gear.dodge + purpleDodge), parry: (job === 'warrior' ? .08 : 0) + passive('parry'), dr: job === 'warrior' ? .03 : 0, speed: w.speed * 1.08 * (1 + passive('attackSpeed')), resourceMax, resource: resourceMax, manaRegenFlat: (a.manaRegenFlat || 0) + (gearId === 'B' && ['mage', 'priest'].includes(job) ? 4 : 0), manaRegen: 1 + gear.manaRegen + (gearId === 'C' && ['mage', 'priest'].includes(job) ? .10 : 0), hpRegen: (a.hpRegen || 0) + gear.hpRegen, skillDamage: gear.skillDamage, basicDamage: gear.basicDamage, damageBonus: purpleMagic, killHeal: gear.killHeal, killResource: gear.killResource, ironWall: gear.ironWall, cooldown: 1 + gear.cooldown, alive: true, basicAt: 0, globalAt: 0, skillAt: {}, totalDamage: 0, taken: 0, environment: 0, targeted: 0, healing: 0, spellHealing: 0, shield: 0, hunterCount: 0, effectiveHealCount: 0, blinkAt: 0, manaShieldAt: 0, protectionAt: 0, graceUntil: 0, swiftUntil: 0, deathAt: null };
}
function makeEnemy(t, now, serial, initial = false) { return { ...t, maxHp: t.hp, currentHp: t.hp, attackAt: now + 1 / t.speed, skillAt: now + t.skillCooldown, spawnedAt: now, serial, initial, respawnAt: null, stunnedUntil: 0, slowUntil: 0, slow: 0, attackDownUntil: 0, attackDown: 0 }; }
function alivePlayers(ps) { return ps.filter(p => p.alive); }
function aliveEnemies(es) { return es.filter(e => e.currentHp > 0).sort((a, b) => a.spawnedAt - b.spawnedAt || a.serial - b.serial); }
function cost(job, id, targets) { if (job === 'assassin') return ({ backstab: 35, 'shadow-dance': 60, 'poison-blade': 25 })[id] || 0; if (job === 'hunter') return ({ 'power-shot': 1, 'multi-shot': 3, 'piercing-shot': 2 })[id] || 0; if (id === 'heal') return 28; return targets > 1 ? 26 : 18; }
function regen(p) { const s = DT; if (p.job === 'assassin') p.resource = Math.min(p.resourceMax, p.resource + 10 * s); else if (p.job === 'hunter') p.resource = Math.min(p.resourceMax, p.resource + s); else if (p.job !== 'warrior') p.resource = Math.min(p.resourceMax, p.resource + (Math.max(.625, p.resourceMax * .01) * p.manaRegen + p.manaRegenFlat) * s); }
function hit(p, e, raw, random, canParry = true) {
  if (random() >= .99) return 0;
  const defense = e.defense * (e.lowHpDefense && e.currentHp / e.maxHp <= .5 ? 1 + e.lowHpDefense : 1);
  const r = MonsterDefense.resolveDamage({ baseDamage: raw, monster: { defense, evasion: e.evasion, parry: e.parry, damageReduction: e.dr }, damageType: p.weapon.type, attackRange: p.weapon.range, canParry, random });
  const wasAlive = e.currentHp > 0;
  const damage = Math.ceil(r.finalDamage * (1 + p.damageBonus) * p.outgoing);
  e.currentHp -= damage; p.totalDamage += damage;
  if (wasAlive && e.currentHp <= 0) { const heal = Math.min(p.maxHp - p.hp, p.maxHp * p.killHeal); p.hp += heal; p.healing += heal; p.resource = Math.min(p.resourceMax, p.resource + p.resourceMax * p.killResource); }
  return damage;
}
function tryHeal(priest, party, now) {
  const target = alivePlayers(party).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const skill = Skills.getSkill('priest', 'heal');
  if (!target || target.hp / target.maxHp > .70 || now < (priest.skillAt.heal || 0) || priest.resource < 28) return false;
  const effect = Skills.getEffect('priest', 'heal', 1), grace = Skills.getEffect('priest', 'divine-grace', 1);
  priest.effectiveHealCount++; const graceTriggered = priest.effectiveHealCount % grace.count === 0;
  const raw = Math.ceil(priest.attack * effect.healPower * (graceTriggered ? 1 + grace.bonus : 1)), actual = Math.min(target.maxHp - target.hp, raw);
  target.hp += actual; priest.spellHealing += actual; priest.resource -= 28; priest.skillAt.heal = now + (effect.cooldown || skill.cooldown) / priest.cooldown; priest.globalAt = now + 1;
  target.graceUntil = now + Skills.getEffect('priest', 'light-grace', 1).duration;
  return true;
}
function cast(p, party, enemies, now, random) {
  if (now < p.globalAt) return false;
  for (const skill of Skills.getSkills(p.job).filter(s => s.type === 'active' && s.id !== 'heal' && s.level <= 30)) {
    if (now < (p.skillAt[skill.id] || 0)) continue;
    const effect = Skills.getEffect(p.job, skill.id, 1), targets = aliveEnemies(enemies).slice(0, effect.targets || skill.targets || 1), c = cost(p.job, skill.id, targets.length);
    if (!targets.length || p.resource < c) continue;
    let power = effect.power || 1;
    if (skill.id === 'whirlwind') power *= 1 + Math.min(effect.maxTargetBonus || 0, Math.max(0, targets.length - 1) * (effect.perExtraTargetBonus || 0));
    const critical = random() < p.crit, raw = Math.ceil(p.attack * power * (1 + p.skillDamage) * (critical ? 1.5 : 1));
    targets.forEach((e, i) => {
      const dealt = hit(p, e, raw * (skill.id === 'chain-lightning' ? 1 + i * (effect.bounceBonus || 0) : 1), random);
      if (dealt && skill.id === 'fireball') e.dot = { damage: Math.ceil(dealt * .18), ticks: 4, next: now + 1, owner: p };
      if (dealt && skill.id === 'backstab') e.dot = { damage: Math.ceil(dealt * .12), ticks: 5, next: now + 1, owner: p };
      if (dealt && effect.stun) e.stunnedUntil = Math.max(e.stunnedUntil, now + effect.stun);
      if (dealt && effect.slow) { e.slow = effect.slow; e.slowUntil = Math.max(e.slowUntil, now + (effect.duration || 3)); }
      if (dealt && effect.attackDown) { e.attackDown = effect.attackDown; e.attackDownUntil = Math.max(e.attackDownUntil, now + effect.duration); }
    });
    if (skill.id === 'holy-nova' && targets.length) { const amount = Math.min(p.maxHp - p.hp, p.maxHp * (effect.selfHealPerTarget || 0) * targets.length); p.hp += amount; p.healing += amount; }
    p.resource -= c;
    if (p.gearId === 'C' && ['mage', 'priest'].includes(p.job) && random() < .15) p.resource = Math.min(p.resourceMax, p.resource + p.resourceMax * .06);
    p.skillAt[skill.id] = now + (effect.cooldown || skill.cooldown) / p.cooldown; p.globalAt = now + 1; return true;
  }
  // Formal auto-cast evaluates all ready attack skills before considering Heal.
  if (p.job === 'priest' && tryHeal(p, party, now)) return true;
  return false;
}
function basic(p, enemies, now, random) {
  if (now < p.basicAt || now < p.globalAt) return;
  const target = aliveEnemies(enemies)[0]; if (!target) return;
  const roll = p.weapon.min + Math.floor(random() * (p.weapon.max - p.weapon.min + 1)); let mult = random() < p.crit ? 1.5 : 1;
  if (p.job === 'hunter' && ++p.hunterCount % 6 === 0) mult *= Skills.getEffect('hunter', 'hunting-instinct', 1).power;
  hit(p, target, Math.ceil((p.attack + roll - (p.weapon.min + p.weapon.max) / 2) * mult * (1 + p.basicDamage)), random);
  if (p.job === 'hunter' && target.currentHp > 0) hit(p, target, p.attack * Skills.getEffect('hunter', 'wild-bond', 1).companionAttack, random, false);
  if (p.job === 'warrior') p.resource = Math.min(100, p.resource + 4);
  const graceSpeed = now < p.graceUntil ? 1 + Skills.getEffect('priest', 'light-grace', 1).attackSpeed : 1;
  const purpleSpeed = now < p.swiftUntil ? 1.15 : 1;
  p.basicAt = now + 1 / (p.speed * graceSpeed * purpleSpeed);
}
function chooseWeightedTarget(party, random, warriorWeight) {
  const targets = alivePlayers(party);
  const total = targets.reduce((sum, target) => sum + (target.job === 'warrior' ? warriorWeight : 1), 0);
  let roll = random() * total;
  for (const target of targets) {
    roll -= target.job === 'warrior' ? warriorWeight : 1;
    if (roll < 0) return target;
  }
  return targets[targets.length - 1];
}
function enemyActions(party, enemies, now, random, warriorWeight) {
  for (const e of aliveEnemies(enemies)) {
    if (now + 1e-9 < e.attackAt) continue;
    if (now < e.stunnedUntil) { e.attackAt = now + .25; continue; }
    const slowMultiplier = now < e.slowUntil ? 1 - e.slow : 1;
    e.attackAt = now + 1 / (e.speed * slowMultiplier); if (!alivePlayers(party).length) return;
    // TEST-only weighted random selection. warriorWeight=1 reproduces the formal equal-weight path.
    const p = chooseWeightedTarget(party, random, warriorWeight); p.targeted++; let raw = e.attack * (now < e.attackDownUntil ? 1 - e.attackDown : 1);
    if (now >= e.skillAt) { raw *= e.skillMultiplier; e.skillAt = now + e.skillCooldown; }
    if (random() >= Math.max(.45, Math.min(.99, .898 - p.dodge))) continue;
    if (p.job === 'mage' && now >= p.blinkAt && random() < Skills.getEffect('mage', 'blink', 1).chance) { p.blinkAt = now + 10; continue; }
    if (random() < .05) raw *= 1.5;
    let damage = MonsterDefense.resolvePlayerDamage({ baseDamage: raw, defense: p.defense, damageReduction: p.dr }).finalDamage;
    if (random() < p.parry) damage = Math.max(1, Math.ceil(damage * .5));
    if (p.ironWall && random() < .15) damage = Math.max(1, Math.ceil(damage * .80));
    if (p.gearId === 'C' && p.job === 'warrior' && p.hp / p.maxHp < .30) damage = Math.max(1, Math.ceil(damage * .85));
    const absorbed = Math.min(p.shield, damage); p.shield -= absorbed; damage -= absorbed; p.hp -= damage; p.taken += damage;
    if (e.bleedRatio) p.bleed = { damage: Math.ceil(damage * e.bleedRatio), ticks: e.bleedDuration, next: now + 1 };
    if (p.hp > 0 && p.hp / p.maxHp < .30 && p.job === 'mage' && now >= p.manaShieldAt) { const effect = Skills.getEffect('mage', 'mana-shield', 1), c = p.resourceMax * effect.manaCost; if (p.resource >= c) { p.resource -= c; p.shield += p.maxHp * effect.shield; p.manaShieldAt = now + effect.internalCooldown; } }
    if (p.hp > 0 && p.hp / p.maxHp < .30 && p.job === 'priest' && now >= p.protectionAt) { const effect = Skills.getEffect('priest', 'holy-protection', 1); p.shield += p.maxHp * effect.shield; p.protectionAt = now + effect.cooldown; }
    if (p.job === 'warrior') p.resource = Math.min(100, p.resource + 2.5);
    if (p.gearId === 'C' && ['assassin', 'hunter'].includes(p.job) && random() < .10) p.swiftUntil = now + 5;
    if (p.hp <= 0) { p.hp = 0; p.alive = false; p.deathAt = now; }
  }
}
function ticks(party, enemies, now) {
  enemies.forEach(e => { if (e.dot && e.currentHp > 0 && now + 1e-9 >= e.dot.next) { e.currentHp -= e.dot.damage; e.dot.owner.totalDamage += e.dot.damage; e.dot.ticks--; e.dot.next++; if (!e.dot.ticks) e.dot = null; } });
  alivePlayers(party).forEach(p => { if (p.bleed && now + 1e-9 >= p.bleed.next) { p.hp -= p.bleed.damage; p.taken += p.bleed.damage; p.bleed.ticks--; p.bleed.next++; if (!p.bleed.ticks) p.bleed = null; if (p.hp <= 0) { p.hp = 0; p.alive = false; p.deathAt = now; } } });
}
function simulate(jobs, seed, warriorWeight, gearId, stage) {
  const random = rng(seed), party = jobs.map(job => makePlayer(job, gearId, stage.penalty)); let serial = 5;
  const templates = [...POOL, POOL[Math.floor(random() * 4)]];
  let enemies = templates.map((t, i) => makeEnemy(t, 0, i, true)), kills = 0, initialKills = 0, firstClearAt = null;
  for (let step = 0; step < DURATION / DT; step++) {
    const now = step * DT;
    alivePlayers(party).forEach(p => { regen(p); if (p.hpRegen && p.hp < p.maxHp) { const h = Math.min(p.maxHp - p.hp, p.hpRegen * DT); p.hp += h; p.healing += h; } });
    alivePlayers(party).forEach(p => {
      const damage = Math.min(p.hp, stage.drain * DT); p.hp -= damage; p.environment += damage;
      if (p.hp <= 0) { p.hp = 0; p.alive = false; p.deathAt = now; }
    });
    ticks(party, enemies, now);
    alivePlayers(party).forEach(p => { cast(p, party, enemies, now, random); basic(p, enemies, now, random); });
    enemyActions(party, enemies, now, random, warriorWeight);
    enemies.forEach((e, i) => {
      if (e.currentHp <= 0 && e.respawnAt === null) { kills++; if (e.initial) initialKills++; e.respawnAt = now + 2; }
      if (e.respawnAt !== null && e.respawnAt <= now) enemies[i] = makeEnemy(POOL[Math.floor(random() * 4)], now, serial++);
    });
    if (firstClearAt === null && initialKills === 5) firstClearAt = now;
    if (!alivePlayers(party).length) return { survived: false, time: now, kills, firstClearAt, party };
  }
  return { survived: true, time: DURATION, kills, firstClearAt, party };
}
function summarize(name, jobs, warriorWeight, gearId, stage) {
  const samples = Array.from({ length: RUNS }, (_, i) => simulate(jobs, 0x31c0de + i * 104729 + name.charCodeAt(0), warriorWeight, gearId, stage));
  const totalTime = samples.reduce((n, s) => n + s.time, 0), survivors = samples.filter(s => s.survived), clears = samples.filter(s => s.firstClearAt !== null);
  const partyDamageTaken = samples.reduce((sum, sample) => sum + sample.party.reduce((n, member) => n + member.taken, 0), 0);
  const partyTargetSelections = samples.reduce((sum, sample) => sum + sample.party.reduce((n, member) => n + member.targeted, 0), 0);
  const members = jobs.map((job, index) => {
    const all = samples.map(s => s.party[index]);
    const deaths = all.filter(p => p.deathAt !== null);
    const taken = all.reduce((n, p) => n + p.taken, 0);
    return { job, weapon: all[0].weapon.name, dps: all.reduce((n, p) => n + p.totalDamage, 0) / totalTime, targetSelectionShare: all.reduce((n, p) => n + p.targeted, 0) / partyTargetSelections, damageTakenPerMinute: taken / totalTime * 60, damageTakenShare: taken / partyDamageTaken, recoveryPerMinute: all.reduce((n, p) => n + p.healing, 0) / totalTime * 60, priestHealingPerMinute: all.reduce((n, p) => n + p.spellHealing, 0) / totalTime * 60, deathRate: deaths.length / RUNS, averageDeathSeconds: deaths.reduce((n, p) => n + p.deathAt, 0) / Math.max(1, deaths.length), averageEndHp: all.reduce((n, p) => n + p.hp, 0) / RUNS };
  });
  return { party: name, jobs, runs: RUNS, gear: gearId, stage: stage.id, targetWeights: { warrior: warriorWeight, others: 1 }, theoreticalWarriorTargetRateWithFourAlive: warriorWeight / (warriorWeight + 3), survivalRate: survivors.length / RUNS, averageWipeSeconds: samples.filter(s => !s.survived).reduce((n, s) => n + s.time, 0) / Math.max(1, RUNS - survivors.length), survivorPartyHp: survivors.length ? survivors.reduce((n, s) => n + s.party.reduce((sum, p) => sum + p.hp, 0), 0) / survivors.length : 0, survivorPartyHpPercent: survivors.length ? survivors.reduce((n, s) => n + s.party.reduce((sum, p) => sum + p.hp, 0) / s.party.reduce((sum, p) => sum + p.maxHp, 0), 0) / survivors.length : 0, killsPerMinute: samples.reduce((n, s) => n + s.kills, 0) / totalTime * 60, teamDps: members.reduce((n, m) => n + m.dps, 0), fiveMonsterClearRate: clears.length / RUNS, averageFiveMonsterClearSeconds: clears.reduce((n, s) => n + s.firstClearAt, 0) / Math.max(1, clears.length), members };
}

const statSheets = Object.fromEntries(Object.keys(GEAR).map(gearId => [gearId, Object.fromEntries(Object.keys(WEAPONS).map(job => { const p = makePlayer(job, gearId, 0); return [job, { hp: p.maxHp, defense: p.normalDefense, attack: p.attack, crit: p.crit, dodge: p.dodge, attackSpeed: p.speed, hpRegen: p.hpRegen, resource: p.resourceMax, weapon: p.weapon.name }]; }))]));
const cells = Object.entries(GEAR).flatMap(([gearId]) => Object.values(STAGES).flatMap(stage => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, gearId, stage))));
const result = { test: 'Chapter 3-1 TEST V1 equipment threshold', mode: 'unchanged TEST V1 monsters / warrior target weight 3 / no potions / unchanged priest AI', targeting: { players: 'oldest living front enemy', monsters: 'weighted random living party member', warriorWeight: 3, formalSystemModified: false }, gear: GEAR, statSheets, cells };
const compact = process.argv.includes('--summary') ? { runs: RUNS, statSheets, cells: cells.map(cell => ({ party: cell.party, gear: cell.gear, stage: cell.stage, survivalRate: cell.survivalRate, averageWipeSeconds: cell.averageWipeSeconds, survivorPartyHp: cell.survivorPartyHp, survivorPartyHpPercent: cell.survivorPartyHpPercent, killsPerMinute: cell.killsPerMinute, teamDps: cell.teamDps, members: cell.members.map(member => ({ job: member.job, dps: member.dps, damageTakenPerMinute: member.damageTakenPerMinute, damageTakenShare: member.damageTakenShare, recoveryPerMinute: member.recoveryPerMinute, priestHealingPerMinute: member.priestHealingPerMinute, deathRate: member.deathRate, averageDeathSeconds: member.averageDeathSeconds, averageEndHp: member.averageEndHp })) })) } : result;
process.stdout.write(`${JSON.stringify(compact, null, 2)}\n`);
