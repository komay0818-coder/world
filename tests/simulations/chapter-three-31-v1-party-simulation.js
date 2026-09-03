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

function rng(seed) { let x = seed >>> 0; return () => ((x = Math.imul(x ^ x >>> 15, 1 | x), x ^= x + Math.imul(x ^ x >>> 7, 61 | x), ((x ^ x >>> 14) >>> 0) / 4294967296)); }
function makePlayer(job) {
  const b = BASE[job], a = ARMOR[job], w = WEAPONS[job];
  const passives = Skills.getSkills(job).filter(s => s.type === 'passive' && s.level <= 30).map(s => Skills.getEffect(job, s.id, 1));
  const passive = key => passives.reduce((n, e) => n + (Number(e?.[key]) || 0), 0);
  const hp = Math.round((b.hp + 5 + 29 * 12 + a.hp) * (1.60 + (job === 'warrior' ? .05 : 0)) * 1.05);
  const defense = Math.round((b.defense + 1 + 5 + a.defense) * 1.60 * 1.05);
  const attack = Math.round((b.attack + 29 + (w.min + w.max) / 2) * 1.05 * (1 + passive('weaponDamage')));
  const resourceMax = job === 'warrior' || job === 'assassin' ? 100 : job === 'hunter' ? 8 : Math.round((b.mana + 5 + 29 * 6 + a.mana + (w.mana || 0)) * 1.05);
  return { job, weapon: w, maxHp: hp, hp, defense, attack, crit: b.crit + passive('crit'), dodge: b.dodge + (['assassin', 'hunter'].includes(job) ? .08 : 0) + passive('dodge'), parry: (job === 'warrior' ? .08 : 0) + passive('parry'), dr: job === 'warrior' ? .03 : 0, speed: w.speed * 1.08 * (1 + passive('attackSpeed')), resourceMax, resource: resourceMax, manaRegenFlat: a.manaRegenFlat || 0, hpRegen: a.hpRegen || 0, alive: true, basicAt: 0, globalAt: 0, skillAt: {}, totalDamage: 0, taken: 0, healing: 0, shield: 0, hunterCount: 0, effectiveHealCount: 0, blinkAt: 0, manaShieldAt: 0, protectionAt: 0, graceUntil: 0, deathAt: null };
}
function makeEnemy(t, now, serial, initial = false) { return { ...t, maxHp: t.hp, currentHp: t.hp, attackAt: now + 1 / t.speed, skillAt: now + t.skillCooldown, spawnedAt: now, serial, initial, respawnAt: null, stunnedUntil: 0, slowUntil: 0, slow: 0, attackDownUntil: 0, attackDown: 0 }; }
function alivePlayers(ps) { return ps.filter(p => p.alive); }
function aliveEnemies(es) { return es.filter(e => e.currentHp > 0).sort((a, b) => a.spawnedAt - b.spawnedAt || a.serial - b.serial); }
function cost(job, id, targets) { if (job === 'assassin') return ({ backstab: 35, 'shadow-dance': 60, 'poison-blade': 25 })[id] || 0; if (job === 'hunter') return ({ 'power-shot': 1, 'multi-shot': 3, 'piercing-shot': 2 })[id] || 0; if (id === 'heal') return 28; return targets > 1 ? 26 : 18; }
function regen(p) { const s = DT; if (p.job === 'assassin') p.resource = Math.min(100, p.resource + 10 * s); else if (p.job === 'hunter') p.resource = Math.min(8, p.resource + s); else if (p.job !== 'warrior') p.resource = Math.min(p.resourceMax, p.resource + (Math.max(.625, p.resourceMax * .01) + p.manaRegenFlat) * s); }
function hit(p, e, raw, random, canParry = true) {
  if (random() >= .99) return 0;
  const defense = e.defense * (e.lowHpDefense && e.currentHp / e.maxHp <= .5 ? 1 + e.lowHpDefense : 1);
  const r = MonsterDefense.resolveDamage({ baseDamage: raw, monster: { defense, evasion: e.evasion, parry: e.parry, damageReduction: e.dr }, damageType: p.weapon.type, attackRange: p.weapon.range, canParry, random });
  e.currentHp -= r.finalDamage; p.totalDamage += r.finalDamage; return r.finalDamage;
}
function tryHeal(priest, party, now) {
  const target = alivePlayers(party).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const skill = Skills.getSkill('priest', 'heal');
  if (!target || target.hp / target.maxHp > .70 || now < (priest.skillAt.heal || 0) || priest.resource < 28) return false;
  const effect = Skills.getEffect('priest', 'heal', 1), grace = Skills.getEffect('priest', 'divine-grace', 1);
  priest.effectiveHealCount++; const graceTriggered = priest.effectiveHealCount % grace.count === 0;
  const raw = Math.ceil(priest.attack * effect.healPower * (graceTriggered ? 1 + grace.bonus : 1)), actual = Math.min(target.maxHp - target.hp, raw);
  target.hp += actual; priest.healing += actual; priest.resource -= 28; priest.skillAt.heal = now + (effect.cooldown || skill.cooldown); priest.globalAt = now + 1;
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
    const critical = random() < p.crit, raw = Math.ceil(p.attack * power * (critical ? 1.5 : 1));
    targets.forEach((e, i) => {
      const dealt = hit(p, e, raw * (skill.id === 'chain-lightning' ? 1 + i * (effect.bounceBonus || 0) : 1), random);
      if (dealt && skill.id === 'fireball') e.dot = { damage: Math.ceil(dealt * .18), ticks: 4, next: now + 1, owner: p };
      if (dealt && skill.id === 'backstab') e.dot = { damage: Math.ceil(dealt * .12), ticks: 5, next: now + 1, owner: p };
      if (dealt && effect.stun) e.stunnedUntil = Math.max(e.stunnedUntil, now + effect.stun);
      if (dealt && effect.slow) { e.slow = effect.slow; e.slowUntil = Math.max(e.slowUntil, now + (effect.duration || 3)); }
      if (dealt && effect.attackDown) { e.attackDown = effect.attackDown; e.attackDownUntil = Math.max(e.attackDownUntil, now + effect.duration); }
    });
    if (skill.id === 'holy-nova' && targets.length) { const amount = Math.min(p.maxHp - p.hp, p.maxHp * (effect.selfHealPerTarget || 0) * targets.length); p.hp += amount; p.healing += amount; }
    p.resource -= c; p.skillAt[skill.id] = now + (effect.cooldown || skill.cooldown); p.globalAt = now + 1; return true;
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
  hit(p, target, Math.ceil((p.attack + roll - (p.weapon.min + p.weapon.max) / 2) * mult), random);
  if (p.job === 'hunter' && target.currentHp > 0) hit(p, target, p.attack * Skills.getEffect('hunter', 'wild-bond', 1).companionAttack, random, false);
  if (p.job === 'warrior') p.resource = Math.min(100, p.resource + 4);
  const graceSpeed = now < p.graceUntil ? 1 + Skills.getEffect('priest', 'light-grace', 1).attackSpeed : 1;
  p.basicAt = now + 1 / (p.speed * graceSpeed);
}
function enemyActions(party, enemies, now, random) {
  for (const e of aliveEnemies(enemies)) {
    if (now + 1e-9 < e.attackAt) continue;
    if (now < e.stunnedUntil) { e.attackAt = now + .25; continue; }
    const slowMultiplier = now < e.slowUntil ? 1 - e.slow : 1;
    e.attackAt = now + 1 / (e.speed * slowMultiplier); const targets = alivePlayers(party); if (!targets.length) return;
    // Formal generic targeting: every living party member has equal probability; there is no tank threat table.
    const p = targets[Math.floor(random() * targets.length)]; let raw = e.attack * (now < e.attackDownUntil ? 1 - e.attackDown : 1);
    if (now >= e.skillAt) { raw *= e.skillMultiplier; e.skillAt = now + e.skillCooldown; }
    if (random() >= Math.max(.45, Math.min(.99, .898 - p.dodge))) continue;
    if (p.job === 'mage' && now >= p.blinkAt && random() < Skills.getEffect('mage', 'blink', 1).chance) { p.blinkAt = now + 10; continue; }
    if (random() < .05) raw *= 1.5;
    let damage = MonsterDefense.resolvePlayerDamage({ baseDamage: raw, defense: p.defense, damageReduction: p.dr }).finalDamage;
    if (random() < p.parry) damage = Math.max(1, Math.ceil(damage * .5));
    const absorbed = Math.min(p.shield, damage); p.shield -= absorbed; damage -= absorbed; p.hp -= damage; p.taken += damage;
    if (e.bleedRatio) p.bleed = { damage: Math.ceil(damage * e.bleedRatio), ticks: e.bleedDuration, next: now + 1 };
    if (p.hp > 0 && p.hp / p.maxHp < .30 && p.job === 'mage' && now >= p.manaShieldAt) { const effect = Skills.getEffect('mage', 'mana-shield', 1), c = p.resourceMax * effect.manaCost; if (p.resource >= c) { p.resource -= c; p.shield += p.maxHp * effect.shield; p.manaShieldAt = now + effect.internalCooldown; } }
    if (p.hp > 0 && p.hp / p.maxHp < .30 && p.job === 'priest' && now >= p.protectionAt) { const effect = Skills.getEffect('priest', 'holy-protection', 1); p.shield += p.maxHp * effect.shield; p.protectionAt = now + effect.cooldown; }
    if (p.job === 'warrior') p.resource = Math.min(100, p.resource + 2.5);
    if (p.hp <= 0) { p.hp = 0; p.alive = false; p.deathAt = now; }
  }
}
function ticks(party, enemies, now) {
  enemies.forEach(e => { if (e.dot && e.currentHp > 0 && now + 1e-9 >= e.dot.next) { e.currentHp -= e.dot.damage; e.dot.owner.totalDamage += e.dot.damage; e.dot.ticks--; e.dot.next++; if (!e.dot.ticks) e.dot = null; } });
  alivePlayers(party).forEach(p => { if (p.bleed && now + 1e-9 >= p.bleed.next) { p.hp -= p.bleed.damage; p.taken += p.bleed.damage; p.bleed.ticks--; p.bleed.next++; if (!p.bleed.ticks) p.bleed = null; if (p.hp <= 0) { p.hp = 0; p.alive = false; p.deathAt = now; } } });
}
function simulate(jobs, seed) {
  const random = rng(seed), party = jobs.map(makePlayer); let serial = 5;
  const templates = [...POOL, POOL[Math.floor(random() * 4)]];
  let enemies = templates.map((t, i) => makeEnemy(t, 0, i, true)), kills = 0, initialKills = 0, firstClearAt = null;
  for (let step = 0; step < DURATION / DT; step++) {
    const now = step * DT;
    alivePlayers(party).forEach(p => { regen(p); if (p.hpRegen && p.hp < p.maxHp) { const h = Math.min(p.maxHp - p.hp, p.hpRegen * DT); p.hp += h; p.healing += h; } });
    ticks(party, enemies, now);
    alivePlayers(party).forEach(p => { cast(p, party, enemies, now, random); basic(p, enemies, now, random); });
    enemyActions(party, enemies, now, random);
    enemies.forEach((e, i) => {
      if (e.currentHp <= 0 && e.respawnAt === null) { kills++; if (e.initial) initialKills++; e.respawnAt = now + 2; }
      if (e.respawnAt !== null && e.respawnAt <= now) enemies[i] = makeEnemy(POOL[Math.floor(random() * 4)], now, serial++);
    });
    if (firstClearAt === null && initialKills === 5) firstClearAt = now;
    if (!alivePlayers(party).length) return { survived: false, time: now, kills, firstClearAt, party };
  }
  return { survived: true, time: DURATION, kills, firstClearAt, party };
}
function summarize(name, jobs) {
  const samples = Array.from({ length: RUNS }, (_, i) => simulate(jobs, 0x31c0de + i * 104729 + name.charCodeAt(0)));
  const totalTime = samples.reduce((n, s) => n + s.time, 0), survivors = samples.filter(s => s.survived), clears = samples.filter(s => s.firstClearAt !== null);
  const members = jobs.map((job, index) => {
    const all = samples.map(s => s.party[index]);
    return { job, weapon: WEAPONS[job].name, dps: all.reduce((n, p) => n + p.totalDamage, 0) / totalTime, damageTakenPerMinute: all.reduce((n, p) => n + p.taken, 0) / totalTime * 60, healingPerMinute: all.reduce((n, p) => n + p.healing, 0) / totalTime * 60, deathRate: all.filter(p => !p.alive).length / RUNS, averageEndHp: all.reduce((n, p) => n + p.hp, 0) / RUNS };
  });
  return { party: name, jobs, runs: RUNS, survivalRate: survivors.length / RUNS, averageWipeSeconds: samples.filter(s => !s.survived).reduce((n, s) => n + s.time, 0) / Math.max(1, RUNS - survivors.length), killsPerMinute: samples.reduce((n, s) => n + s.kills, 0) / totalTime * 60, teamDps: members.reduce((n, m) => n + m.dps, 0), fiveMonsterClearRate: clears.length / RUNS, averageFiveMonsterClearSeconds: clears.reduce((n, s) => n + s.firstClearAt, 0) / Math.max(1, clears.length), members };
}

process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-1 TEST V1 party round 2', mode: 'normal monsters / no suppression / no potions', targeting: { players: 'oldest living front enemy', monsters: 'uniform random living party member', specialLowestHpTargeting: false }, parties: Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs)) }, null, 2)}\n`);
