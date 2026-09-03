const MonsterDefense = require('../../monster-defense.js');
const Skills = require('../../class-skill-policy.js');

const DURATION = 600;
const RUNS = Number(process.argv[2]) || 200;
const DT = .05;

// TEST V1 only. These values are deliberately isolated from chapter-three-map-policy.js.
const REFERENCES = {
  wolf: { name: '腐化森林狼', hp: 650, attack: 82, defense: 35, evasion: 19, parry: 0, dr: 6, speed: 1.50 },
  treant: { name: '腐化樹妖', hp: 980, attack: 76, defense: 72, evasion: 3, parry: 8, dr: 18, speed: .78 },
  spirit: { name: '森林之魂', hp: 760, attack: 72, defense: 44, evasion: 16, parry: 0, dr: 8, speed: 1.10 },
  spore: { name: '黑暗孢子獸', hp: 820, attack: 88, defense: 48, evasion: 7, parry: 0, dr: 10, speed: .95 },
  centurion: { name: '腐化黑石百夫長', hp: 2700, attack: 110, defense: 92, evasion: 4, parry: 18, dr: 22, speed: .88 },
  heart: { name: '黑森林之心', hp: 12000, attack: 132, defense: 105, evasion: 5, parry: 12, dr: 24, speed: .92 }
};

function advance(id, name, ref, extra = {}) {
  return Object.freeze({
    id, name, reference: ref.name,
    hp: Math.round(ref.hp * 1.15), attack: Math.round(ref.attack * 1.15), defense: Math.round(ref.defense * 1.15),
    evasion: ref.evasion, parry: ref.parry, dr: ref.dr, speed: ref.speed,
    skillMultiplier: 1.25, skillCooldown: 8, rank: 'normal', ...extra
  });
}

const MONSTERS = Object.freeze({
  hyena: advance('wasteland-hyena', '荒原鬣狗', REFERENCES.wolf, { skillMultiplier: 1.20, skillCooldown: 7, bleedRatio: .06, bleedDuration: 5 }),
  lizard: advance('redrock-lizard', '赤岩蜥蜴', REFERENCES.treant, { skillMultiplier: 1.10, skillCooldown: 9, lowHpDefense: .25 }),
  vulture: advance('wasteland-vulture', '荒原禿鷹', REFERENCES.spirit, { skillMultiplier: 1.35, skillCooldown: 8 }),
  scout: advance('skullcrusher-scout', '碎顱斥候', REFERENCES.spore, { skillMultiplier: 1.15, skillCooldown: 8, parry: 8, evasion: 8 }),
  hornbeast: advance('redrock-hornbeast', '赤岩角獸', REFERENCES.centurion, { rank: 'elite', skillMultiplier: 1.50, skillCooldown: 10 }),
  giantLizard: advance('redrock-giant-lizard', '赤岩巨蜥', REFERENCES.heart, { rank: 'boss', skillMultiplier: 1.45, skillCooldown: 10, lowHpDefense: -.20, lowHpSpeed: .25 })
});

const WEAPONS = Object.freeze({
  warrior: { name: '斬木巨劍', min: 38, max: 50, speed: .78, range: 'melee', type: 'physical' },
  assassin: { name: '暗林短刃（單持）', min: 22, max: 29, speed: 1.55, range: 'melee', type: 'physical' },
  hunter: { name: '長枝獵弓', min: 24, max: 33, speed: 1.08, range: 'ranged', type: 'physical' },
  mage: { name: '古木魔杖', min: 23, max: 31, speed: 1.15, range: 'ranged', type: 'magic', mana: 20 },
  priest: { name: '古木魔杖', min: 23, max: 31, speed: 1.15, range: 'ranged', type: 'magic', mana: 20 }
});

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

const STAGES = Object.freeze([
  { id: '0/10', removed: 0, drain: 10, penalty: .10 },
  { id: '3/10', removed: 3, drain: 7, penalty: .07 },
  { id: '5/10', removed: 5, drain: 5, penalty: .05 },
  { id: '10/10', removed: 10, drain: 0, penalty: 0 },
  { id: '無壓制', removed: null, drain: 0, penalty: 0 }
]);

function rng(seed) {
  let value = seed >>> 0;
  return () => ((value = Math.imul(value ^ value >>> 15, 1 | value), value ^= value + Math.imul(value ^ value >>> 7, 61 | value), ((value ^ value >>> 14) >>> 0) / 4294967296));
}

function player(job, penalty = 0) {
  const base = BASE[job], armor = ARMOR[job], weapon = WEAPONS[job];
  const robust = job === 'warrior' ? .05 : 0;
  const hp = Math.round((base.hp + 5 + 29 * 12 + armor.hp) * (1 + .60 + robust) * 1.05);
  const normalDefense = Math.round((base.defense + 1 + 5 + armor.defense) * 1.60 * 1.05);
  const passives = Skills.getSkills(job).filter((skill) => skill.type === 'passive' && skill.level <= 30).map((skill) => Skills.getEffect(job, skill.id, 1));
  const passive = (key) => passives.reduce((sum, effect) => sum + (Number(effect?.[key]) || 0), 0);
  const weaponAverage = (weapon.min + weapon.max) / 2;
  const attack = Math.round((base.attack + 29 + weaponAverage) * 1.05 * (1 + passive('weaponDamage')));
  const maxMana = ['warrior', 'assassin'].includes(job) ? (job === 'assassin' ? 100 : 100) : Math.round((base.mana + 5 + 29 * 6 + armor.mana + (weapon.mana || 0)) * 1.05);
  return {
    job, weapon, maxHp: hp, hp, normalDefense, defense: Math.round(normalDefense * (1 - penalty)),
    attack, crit: base.crit + passive('crit'),
    dodge: Math.max(0, base.dodge + (['assassin', 'hunter'].includes(job) ? .08 : 0) + passive('dodge')),
    parry: Math.max(0, (job === 'warrior' ? .08 : 0) + passive('parry')),
    speed: weapon.speed * 1.08 * (1 + passive('attackSpeed')), damageReduction: job === 'warrior' ? .03 : 0,
    maxMana, resource: maxMana, manaRegenFlat: armor.manaRegenFlat || 0, hpRegen: armor.hpRegen,
    basicAt: 0, globalAt: 0, skillAt: {}, hunterCount: 0, petCount: 0, totalDamage: 0, healing: 0, shield: 0,
    blinkReadyAt: 0, manaShieldReadyAt: 0, holyProtectionReadyAt: 0,
    enemyDamage: 0, environmentDamage: 0
  };
}

function createEnemy(template, now = 0) {
  return { ...template, maxHp: template.hp, currentHp: template.hp, attackAt: now + 1 / template.speed, skillAt: now + template.skillCooldown, respawnAt: null };
}

function monsterForDefense(enemy) {
  const ratio = enemy.currentHp / enemy.maxHp;
  const defenseMultiplier = enemy.lowHpDefense && ratio <= .5 ? 1 + enemy.lowHpDefense : 1;
  return { defense: enemy.defense * defenseMultiplier, evasion: enemy.evasion, parry: enemy.parry, damageReduction: enemy.dr };
}

function deal(p, enemy, raw, random, { skill = false, canParry = true } = {}) {
  // Lv30 player versus TEST V1 Lv31 monsters: current level/accuracy formula caps this at 99%.
  if (random() >= .99) return 0;
  const result = MonsterDefense.resolveDamage({ baseDamage: raw, monster: monsterForDefense(enemy), damageType: p.weapon.type, attackRange: p.weapon.range, canParry, random });
  const damage = Math.max(0, Math.ceil(result.finalDamage * p.outgoing));
  enemy.currentHp -= damage;
  p.totalDamage += damage;
  return damage;
}

function alive(enemies) { return enemies.filter((enemy) => enemy.currentHp > 0); }

function skillCost(job, id, targets) {
  if (job === 'assassin') return { backstab: 35, 'shadow-dance': 60, 'poison-blade': 25 }[id] || 0;
  if (job === 'hunter') return { 'power-shot': 1, 'multi-shot': 3, 'piercing-shot': 2 }[id] || 0;
  if (id === 'heal') return 28;
  return targets > 1 ? 26 : 18;
}

function regenResource(p, seconds) {
  if (p.job === 'assassin') p.resource = Math.min(100, p.resource + 10 * seconds);
  else if (p.job === 'hunter') p.resource = Math.min(8, p.resource + seconds);
  else if (!['warrior'].includes(p.job)) p.resource = Math.min(p.maxMana, p.resource + (Math.max(.625, p.maxMana * .01) + p.manaRegenFlat) * seconds);
}

function castSkill(p, enemies, now, random) {
  if (now < p.globalAt) return false;
  const skills = Skills.getSkills(p.job).filter((skill) => skill.type === 'active' && skill.id !== 'heal' && skill.level <= 30);
  for (const skill of skills) {
    if (now < (p.skillAt[skill.id] || 0)) continue;
    const effect = Skills.getEffect(p.job, skill.id, 1);
    const targets = alive(enemies).slice(0, effect.targets || skill.targets || 1);
    if (!targets.length) continue;
    const cost = skillCost(p.job, skill.id, targets.length);
    if (p.job === 'warrior') { if (p.resource < cost) continue; }
    else if (p.resource < cost) continue;
    const critical = random() < p.crit;
    const raw = Math.ceil(p.attack * (effect.power || 1) * (critical ? 1.5 : 1));
    targets.forEach((enemy) => {
      const hit = deal(p, enemy, raw, random, { skill: true });
      if (skill.id === 'fireball' && hit > 0) enemy.dot = { damage: Math.ceil(hit * .18), ticks: 4, next: now + 1 };
      if (skill.id === 'backstab' && hit > 0) enemy.dot = { damage: Math.ceil(hit * .12), ticks: 5, next: now + 1 };
    });
    p.resource = Math.max(0, p.resource - cost);
    p.skillAt[skill.id] = now + (effect.cooldown || skill.cooldown);
    p.globalAt = now + 1;
    return true;
  }
  if (p.job === 'priest' && p.hp / p.maxHp <= .70) {
    const skill = Skills.getSkill('priest', 'heal');
    if (now >= (p.skillAt.heal || 0) && p.resource >= 28) {
      const effect = Skills.getEffect('priest', 'heal', 1);
      const amount = Math.min(p.maxHp - p.hp, Math.ceil(p.attack * effect.healPower));
      p.hp += amount; p.healing += amount; p.resource -= 28; p.skillAt.heal = now + skill.cooldown; p.globalAt = now + 1;
      return true;
    }
  }
  return false;
}

function basicAttack(p, enemies, now, random) {
  if (now < p.basicAt || now < p.globalAt) return;
  const target = alive(enemies)[0];
  if (!target) return;
  const weaponRoll = p.weapon.min + Math.floor(random() * (p.weapon.max - p.weapon.min + 1));
  const attack = p.attack + weaponRoll - (p.weapon.min + p.weapon.max) / 2;
  const critical = random() < p.crit;
  let multiplier = 1;
  if (p.job === 'hunter') {
    p.hunterCount += 1;
    if (p.hunterCount % 6 === 0) multiplier *= Skills.getEffect('hunter', 'hunting-instinct', 1).power;
  }
  deal(p, target, Math.ceil(attack * multiplier * (critical ? 1.5 : 1)), random);
  if (p.job === 'hunter' && target.currentHp > 0) {
    const bond = Skills.getEffect('hunter', 'wild-bond', 1);
    deal(p, target, p.attack * bond.companionAttack, random, { canParry: false });
  }
  if (p.job === 'warrior') p.resource = Math.min(100, p.resource + 4);
  p.basicAt = now + 1 / p.speed;
}

function enemyAttacks(p, enemies, now, random) {
  for (const enemy of alive(enemies)) {
    const lowSpeed = enemy.lowHpSpeed && enemy.currentHp / enemy.maxHp <= .5 ? 1 + enemy.lowHpSpeed : 1;
    if (now + 1e-9 < enemy.attackAt) continue;
    let raw = enemy.attack;
    if (now >= enemy.skillAt) { raw *= enemy.skillMultiplier; enemy.skillAt = now + enemy.skillCooldown; }
    enemy.attackAt = now + 1 / (enemy.speed * lowSpeed);
    const monsterHitChance = Math.max(.45, Math.min(.99, .88 + .018 - p.dodge));
    if (random() >= monsterHitChance) continue;
    if (p.job === 'mage' && now >= p.blinkReadyAt && random() < Skills.getEffect('mage', 'blink', 1).chance) {
      p.blinkReadyAt = now + 10;
      continue;
    }
    const criticalChance = enemy.rank === 'boss' ? .15 : enemy.rank === 'elite' ? .10 : .05;
    if (random() < criticalChance) raw *= 1.5;
    let damage = MonsterDefense.resolvePlayerDamage({ baseDamage: raw, defense: p.defense, damageReduction: p.damageReduction }).finalDamage;
    if (random() < p.parry) damage = Math.max(1, Math.ceil(damage * .5));
    const absorbed = Math.min(p.shield, damage); p.shield -= absorbed; damage -= absorbed;
    p.hp -= damage; p.enemyDamage += damage;
    if (p.hp > 0 && p.hp / p.maxHp < .30 && p.job === 'mage' && now >= p.manaShieldReadyAt) {
      const effect = Skills.getEffect('mage', 'mana-shield', 1), manaCost = p.maxMana * effect.manaCost;
      if (p.resource >= manaCost) { p.resource -= manaCost; p.shield += p.maxHp * effect.shield; p.manaShieldReadyAt = now + effect.internalCooldown; }
    }
    if (p.hp > 0 && p.hp / p.maxHp < .30 && p.job === 'priest' && now >= p.holyProtectionReadyAt) {
      const effect = Skills.getEffect('priest', 'holy-protection', 1); p.shield += p.maxHp * effect.shield; p.holyProtectionReadyAt = now + effect.cooldown;
    }
    if (p.job === 'warrior') p.resource = Math.min(100, p.resource + 2.5);
    if (enemy.bleedRatio) p.bleed = { damage: Math.ceil(damage * enemy.bleedRatio), ticks: enemy.bleedDuration, next: now + 1 };
  }
}

function dots(p, enemies, now) {
  enemies.forEach((enemy) => {
    if (!enemy.dot || now + 1e-9 < enemy.dot.next || enemy.currentHp <= 0) return;
    enemy.currentHp -= enemy.dot.damage; p.totalDamage += enemy.dot.damage; enemy.dot.ticks -= 1; enemy.dot.next += 1;
    if (enemy.dot.ticks <= 0) enemy.dot = null;
  });
  if (p.bleed && now + 1e-9 >= p.bleed.next) {
    p.hp -= p.bleed.damage; p.enemyDamage += p.bleed.damage; p.bleed.ticks -= 1; p.bleed.next += 1;
    if (p.bleed.ticks <= 0) p.bleed = null;
  }
}

function simulate(job, stage, seed, encounter = 'normal') {
  const random = rng(seed);
  const p = player(job, stage.penalty); p.outgoing = 1 - stage.penalty;
  let enemies = encounter === 'normal'
    ? [MONSTERS.hyena, MONSTERS.lizard, MONSTERS.vulture, MONSTERS.scout, [MONSTERS.hyena, MONSTERS.lizard, MONSTERS.vulture, MONSTERS.scout][Math.floor(random() * 4)]].map(createEnemy)
    : [createEnemy(MONSTERS[encounter])];
  let kills = 0, killTimeTotal = 0, lastKillAt = 0;
  for (let step = 0; step < DURATION / DT; step += 1) {
    const now = step * DT;
    regenResource(p, DT);
    if (p.hp < p.maxHp && p.hpRegen) { const heal = Math.min(p.maxHp - p.hp, p.hpRegen * DT); p.hp += heal; p.healing += heal; }
    const environment = Math.min(p.hp, stage.drain * DT); p.hp -= environment; p.environmentDamage += environment;
    dots(p, enemies, now);
    castSkill(p, enemies, now, random);
    basicAttack(p, enemies, now, random);
    enemyAttacks(p, enemies, now, random);
    enemies.forEach((enemy, index) => {
      if (enemy.currentHp <= 0 && enemy.respawnAt === null) {
        kills += 1; killTimeTotal += now - lastKillAt; lastKillAt = now;
        enemy.respawnAt = encounter === 'normal' ? now + 2 : Infinity;
      }
      if (enemy.respawnAt !== null && enemy.respawnAt <= now) {
        const pool = [MONSTERS.hyena, MONSTERS.lizard, MONSTERS.vulture, MONSTERS.scout];
        enemies[index] = createEnemy(pool[Math.floor(random() * pool.length)], now);
      }
    });
    if (p.hp <= 0) return { survived: false, time: now, hp: 0, kills, damage: p.totalDamage, enemyDamage: p.enemyDamage, environmentDamage: p.environmentDamage, healing: p.healing, killTimeTotal };
    if (encounter !== 'normal' && kills) return { survived: true, time: now, hp: p.hp, kills, damage: p.totalDamage, enemyDamage: p.enemyDamage, environmentDamage: p.environmentDamage, healing: p.healing, killTimeTotal };
  }
  return { survived: true, time: DURATION, hp: p.hp, kills, damage: p.totalDamage, enemyDamage: p.enemyDamage, environmentDamage: p.environmentDamage, healing: p.healing, killTimeTotal };
}

function average(job, stage, encounter = 'normal') {
  const samples = Array.from({ length: RUNS }, (_, index) => simulate(job, stage, 0x31c0de + index * 97 + job.length * 7919, encounter));
  const sum = (key) => samples.reduce((total, sample) => total + sample[key], 0);
  const totalTime = sum('time');
  const survivors = samples.filter((sample) => sample.survived);
  const totalKills = sum('kills');
  return {
    job, stage: stage.id, hp: player(job, stage.penalty).maxHp, defense: player(job, stage.penalty).defense, weapon: WEAPONS[job].name,
    dps: sum('damage') / totalTime, killSeconds: totalKills ? sum('killTimeTotal') / totalKills : null,
    killsPerMinute: totalKills / totalTime * 60, enemyDamagePerMinute: sum('enemyDamage') / totalTime * 60,
    environmentPerMinute: sum('environmentDamage') / totalTime * 60, healingPerMinute: sum('healing') / totalTime * 60,
    survivalSeconds: totalTime / RUNS, survivalRate: survivors.length / RUNS,
    survivorHp: survivors.length ? survivors.reduce((total, sample) => total + sample.hp, 0) / survivors.length : 0
  };
}

const jobs = ['warrior', 'assassin', 'hunter', 'mage', 'priest'];
const result = {
  test: 'Chapter 3-1 suppression TEST V1', runsPerCell: RUNS, durationSeconds: DURATION,
  references: Object.values(MONSTERS).map((monster) => ({ name: monster.name, reference: monster.reference, hp: monster.hp, attack: monster.attack, defense: monster.defense, speed: monster.speed, evasion: monster.evasion, parry: monster.parry, damageReduction: monster.dr, skillMultiplier: monster.skillMultiplier, skillCooldown: monster.skillCooldown })),
  weapons: WEAPONS,
  normal: jobs.flatMap((job) => STAGES.map((stage) => average(job, stage))),
  elite: jobs.flatMap((job) => STAGES.slice(0, 4).map((stage) => average(job, stage, 'hornbeast'))),
  boss: jobs.flatMap((job) => STAGES.slice(0, 4).map((stage) => average(job, stage, 'giantLizard')))
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
