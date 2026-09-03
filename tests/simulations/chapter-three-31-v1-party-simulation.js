const MonsterDefense = require('../../monster-defense.js');
const Skills = require('../../class-skill-policy.js');
const { warIntentMultiplier } = require('./chapter-three-32-boss-rules.js');

const RUNS = Number(process.argv[2]) || 100;
const DURATION = 600;
const DT = .05;
const POOL = [
  { id: 'hyena', name: '荒原鬣狗', hp: 748, attack: 94, defense: 40, evasion: 19, parry: 0, dr: 6, speed: 1.50, skillMultiplier: 1.20, skillCooldown: 7, bleedRatio: .06, bleedDuration: 5 },
  { id: 'lizard', name: '赤岩蜥蜴', hp: 1127, attack: 87, defense: 83, evasion: 3, parry: 8, dr: 18, speed: .78, skillMultiplier: 1.10, skillCooldown: 9, lowHpDefense: .25 },
  { id: 'vulture', name: '荒原禿鷹', hp: 874, attack: 83, defense: 51, evasion: 16, parry: 0, dr: 8, speed: 1.10, skillMultiplier: 1.35, skillCooldown: 8 },
  { id: 'scout', name: '碎顱斥候', hp: 943, attack: 101, defense: 55, evasion: 8, parry: 8, dr: 10, speed: .95, skillMultiplier: 1.15, skillCooldown: 8 }
];
const CHAPTER_32_POOL = [
  POOL[0],
  POOL[3],
  { id: 'skull-spear', name: '碎顱投矛手', hp: 990, attack: 109, defense: 58, evasion: 8, parry: 0, dr: 8, speed: .95, skillMultiplier: 1.30, skillCooldown: 9 },
  { id: 'skull-warrior', name: '碎顱戰士', hp: 1217, attack: 92, defense: 90, evasion: 3, parry: 10, dr: 18, speed: .72, skillMultiplier: 1.35, skillCooldown: 10 }
];
const CHAPTER_32_ELITE = { id: 'rift-brute', name: '斷岩蠻兵 TEST V1', hp: 3350, attack: 135, defense: 115, speed: .82, evasion: 3, parry: 20, dr: 24, skillMultiplier: 1.50, skillCooldown: 10 };
const CHAPTER_32_BOSS = { id: 'canyon-warlord', name: '峽谷督軍 TEST V1', hp: 15500, attack: 162, defense: 132, speed: .82, evasion: 3, parry: 18, dr: 26, skillMultiplier: 1.55, skillCooldown: 10, warIntent: true };
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
  full: { id: '0/10完整壓制', progress: 0, drain: 10, penalty: .10 },
  progress1: { id: '1/10', progress: 1, drain: 9, penalty: .09 },
  progress2: { id: '2/10', progress: 2, drain: 8, penalty: .08 },
  progress3: { id: '3/10', progress: 3, drain: 7, penalty: .07 },
  progress5: { id: '5/10', progress: 5, drain: 5, penalty: .05 },
  progress7: { id: '7/10', progress: 7, drain: 3, penalty: .03 },
  cleared: { id: '10/10', progress: 10, drain: 0, penalty: 0 }
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
function makePlayer(job, gearId = 'A', stageOrPenalty = 0, regenAffixCount = null, killHealAffixCount = null, killHealPerAffix = .03, applyKillHealOpportunityCost = false) {
  const b = BASE[job], a = ARMOR[job], gear = GEAR[gearId];
  const penalty = typeof stageOrPenalty === 'object' ? stageOrPenalty.penalty : stageOrPenalty;
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
  const affixRegen = regenAffixCount === null ? gear.hpRegen : Math.max(0, regenAffixCount) * 5;
  const killHeal = killHealAffixCount === null ? gear.killHeal : Math.max(0, killHealAffixCount) * killHealPerAffix;
  const replacementCount = applyKillHealOpportunityCost ? Math.max(0, killHealAffixCount || 0) : 0;
  const basicDamage = Math.max(0, gear.basicDamage - Math.min(2, replacementCount) * .08);
  const skillDamage = Math.max(0, gear.skillDamage - (replacementCount >= 3 ? .08 : 0));
  const suppressedDefense = normalDefense * (1 - penalty);
  return { job, gearId, weapon: w, maxHp: hp, hp, normalDefense, defense: typeof stageOrPenalty === 'object' && stageOrPenalty.preserveFraction ? suppressedDefense : Math.round(suppressedDefense), outgoing: 1 - penalty, attack, crit: b.crit + passive('crit') + gear.crit, dodge: Math.min(.45, b.dodge + (['assassin', 'hunter'].includes(job) ? .08 : 0) + passive('dodge') + gear.dodge + purpleDodge), parry: (job === 'warrior' ? .08 : 0) + passive('parry'), dr: job === 'warrior' ? .03 : 0, speed: w.speed * 1.08 * (1 + passive('attackSpeed')), resourceMax, resource: resourceMax, manaRegenFlat: (a.manaRegenFlat || 0) + (gearId === 'B' && ['mage', 'priest'].includes(job) ? 4 : 0), manaRegen: 1 + gear.manaRegen + (gearId === 'C' && ['mage', 'priest'].includes(job) ? .10 : 0), hpRegen: (a.hpRegen || 0) + affixRegen, skillDamage, basicDamage, damageBonus: purpleMagic, killHeal, killResource: gear.killResource, ironWall: gear.ironWall, cooldown: 1 + gear.cooldown, alive: true, basicAt: 0, globalAt: 0, skillAt: {}, totalDamage: 0, taken: 0, damageTakenByEnemy: {}, environment: 0, targeted: 0, healing: 0, regenerationHealing: 0, killHealing: 0, spellHealing: 0, shield: 0, hunterCount: 0, effectiveHealCount: 0, blinkAt: 0, manaShieldAt: 0, protectionAt: 0, graceUntil: 0, swiftUntil: 0, deathAt: null };
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
  if (wasAlive && e.currentHp <= 0) { const heal = Math.min(p.maxHp - p.hp, p.maxHp * p.killHeal); p.hp += heal; p.healing += heal; p.killHealing += heal; p.resource = Math.min(p.resourceMax, p.resource + p.resourceMax * p.killResource); }
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
    const intent = e.warIntent ? warIntentMultiplier(now - e.spawnedAt) : 1;
    raw *= intent;
    if (e.warIntent) {
      e.intentAttacks ||= {};
      e.intentAttacks[intent] = (e.intentAttacks[intent] || 0) + 1;
    }
    const usedSkill = now >= e.skillAt;
    if (usedSkill) { raw *= e.skillMultiplier; e.skillAt = now + e.skillCooldown; e.skillCasts = (e.skillCasts || 0) + 1; }
    if (random() >= Math.max(.45, Math.min(.99, .898 - p.dodge))) continue;
    if (p.job === 'mage' && now >= p.blinkAt && random() < Skills.getEffect('mage', 'blink', 1).chance) { p.blinkAt = now + 10; continue; }
    if (random() < .05) raw *= 1.5;
    let damage = MonsterDefense.resolvePlayerDamage({ baseDamage: raw, defense: p.defense, damageReduction: p.dr }).finalDamage;
    if (random() < p.parry) damage = Math.max(1, Math.ceil(damage * .5));
    if (p.ironWall && random() < .15) damage = Math.max(1, Math.ceil(damage * .80));
    if (p.gearId === 'C' && p.job === 'warrior' && p.hp / p.maxHp < .30) damage = Math.max(1, Math.ceil(damage * .85));
    const absorbed = Math.min(p.shield, damage); p.shield -= absorbed; damage -= absorbed; p.hp -= damage; p.taken += damage; p.damageTakenByEnemy[e.id] = (p.damageTakenByEnemy[e.id] || 0) + damage;
    if (usedSkill) { e.skillDamage = (e.skillDamage || 0) + damage; e.skillHits = (e.skillHits || 0) + 1; }
    if (e.warIntent) { e.intentDamage ||= {}; e.intentDamage[intent] = (e.intentDamage[intent] || 0) + damage; }
    if (e.bleedRatio) p.bleed = { damage: Math.ceil(damage * e.bleedRatio), ticks: e.bleedDuration, next: now + 1, sourceId: e.id };
    if (p.hp > 0 && p.hp / p.maxHp < .30 && p.job === 'mage' && now >= p.manaShieldAt) { const effect = Skills.getEffect('mage', 'mana-shield', 1), c = p.resourceMax * effect.manaCost; if (p.resource >= c) { p.resource -= c; p.shield += p.maxHp * effect.shield; p.manaShieldAt = now + effect.internalCooldown; } }
    if (p.hp > 0 && p.hp / p.maxHp < .30 && p.job === 'priest' && now >= p.protectionAt) { const effect = Skills.getEffect('priest', 'holy-protection', 1); p.shield += p.maxHp * effect.shield; p.protectionAt = now + effect.cooldown; }
    if (p.job === 'warrior') p.resource = Math.min(100, p.resource + 2.5);
    if (p.gearId === 'C' && ['assassin', 'hunter'].includes(p.job) && random() < .10) p.swiftUntil = now + 5;
    if (p.hp <= 0) { p.hp = 0; p.alive = false; p.deathAt = now; }
  }
}
function ticks(party, enemies, now) {
  enemies.forEach(e => { if (e.dot && e.currentHp > 0 && now + 1e-9 >= e.dot.next) { e.currentHp -= e.dot.damage; e.dot.owner.totalDamage += e.dot.damage; e.dot.ticks--; e.dot.next++; if (!e.dot.ticks) e.dot = null; } });
  alivePlayers(party).forEach(p => { if (p.bleed && now + 1e-9 >= p.bleed.next) { p.hp -= p.bleed.damage; p.taken += p.bleed.damage; p.damageTakenByEnemy[p.bleed.sourceId] = (p.damageTakenByEnemy[p.bleed.sourceId] || 0) + p.bleed.damage; p.bleed.ticks--; p.bleed.next++; if (!p.bleed.ticks) p.bleed = null; if (p.hp <= 0) { p.hp = 0; p.alive = false; p.deathAt = now; } } });
}
function simulate(jobs, seed, warriorWeight, gearId, stage, regenAffixCount = null, killHealAffixCount = null, killHealPerAffix = .03, applyKillHealOpportunityCost = false, monsterPool = POOL, encounter = null, eliteLoop = null) {
  const random = rng(seed), party = jobs.map(job => makePlayer(job, gearId, stage, regenAffixCount, killHealAffixCount, killHealPerAffix, applyKillHealOpportunityCost)); let serial = 5;
  // Separate spawn rolls preserve the original E0 combat RNG and do not consume extra combat draws.
  const eliteRandom = rng(seed ^ 0x32e117e);
  const loopStats = { spawns: 0, eliteSpawns: 0, eliteKills: 0, eliteKilledLifetime: 0, elitePresentSeconds: 0, maxConcurrentElites: 0 };
  const spawnTemplate = normal => {
    if (!eliteLoop) return normal;
    loopStats.spawns++;
    if (eliteRandom() < eliteLoop.chance) { loopStats.eliteSpawns++; return CHAPTER_32_ELITE; }
    return normal;
  };
  const templates = encounter ? encounter.templates : [...monsterPool, monsterPool[Math.floor(random() * monsterPool.length)]];
  let enemies = templates.map((t, i) => makeEnemy(spawnTemplate(t), 0, i, true)), kills = 0, initialKills = 0, firstClearAt = null;
  const duration = encounter?.duration || DURATION;
  for (let step = 0; step < duration / DT; step++) {
    const now = step * DT;
    if (eliteLoop) {
      const eliteCount = enemies.filter(e => e.currentHp > 0 && e.id === CHAPTER_32_ELITE.id).length;
      loopStats.maxConcurrentElites = Math.max(loopStats.maxConcurrentElites, eliteCount);
      if (eliteCount) loopStats.elitePresentSeconds += DT;
    }
    alivePlayers(party).forEach(p => { regen(p); if (p.hpRegen && p.hp < p.maxHp) { const h = Math.min(p.maxHp - p.hp, p.hpRegen * DT); p.hp += h; p.healing += h; p.regenerationHealing += h; } });
    alivePlayers(party).forEach(p => {
      const damage = Math.min(p.hp, stage.drain * DT); p.hp -= damage; p.environment += damage;
      if (p.hp <= 0) { p.hp = 0; p.alive = false; p.deathAt = now; }
    });
    ticks(party, enemies, now);
    for (const p of alivePlayers(party)) {
      if (encounter?.stopImmediately && !aliveEnemies(enemies).length) break;
      cast(p, party, enemies, now, random);
      if (encounter?.stopImmediately && !aliveEnemies(enemies).length) break;
      basic(p, enemies, now, random);
    }
    enemyActions(party, enemies, now, random, warriorWeight);
    enemies.forEach((e, i) => {
      if (e.currentHp <= 0 && e.respawnAt === null) {
        kills++; if (e.initial) initialKills++; e.respawnAt = now + 2;
        if (eliteLoop && e.id === CHAPTER_32_ELITE.id) { loopStats.eliteKills++; loopStats.eliteKilledLifetime += now - e.spawnedAt; }
      }
      if (!encounter && e.respawnAt !== null && e.respawnAt <= now) enemies[i] = makeEnemy(spawnTemplate(monsterPool[Math.floor(random() * monsterPool.length)]), now, serial++);
    });
    if (firstClearAt === null && initialKills === templates.length) firstClearAt = now;
    if (encounter && (initialKills === templates.length || !alivePlayers(party).length)) return { survived: alivePlayers(party).length > 0, time: now, kills, firstClearAt, party, enemies };
    if (!alivePlayers(party).length) return { survived: false, time: now, kills, firstClearAt, party, loopStats };
  }
  return { survived: true, time: duration, kills, firstClearAt, party, enemies, loopStats };
}
function summarize(name, jobs, warriorWeight, gearId, stage, regenAffixCount = null, killHealAffixCount = null, killHealPerAffix = .03, applyKillHealOpportunityCost = false, monsterPool = POOL) {
  const samples = Array.from({ length: RUNS }, (_, i) => simulate(jobs, 0x31c0de + i * 104729 + name.charCodeAt(0), warriorWeight, gearId, stage, regenAffixCount, killHealAffixCount, killHealPerAffix, applyKillHealOpportunityCost, monsterPool));
  const totalTime = samples.reduce((n, s) => n + s.time, 0), survivors = samples.filter(s => s.survived), clears = samples.filter(s => s.firstClearAt !== null);
  const fullPartySurvivors = samples.filter(s => s.party.every(member => member.alive));
  const partyDamageTaken = samples.reduce((sum, sample) => sum + sample.party.reduce((n, member) => n + member.taken, 0), 0);
  const partyTargetSelections = samples.reduce((sum, sample) => sum + sample.party.reduce((n, member) => n + member.targeted, 0), 0);
  const members = jobs.map((job, index) => {
    const all = samples.map(s => s.party[index]);
    const deaths = all.filter(p => p.deathAt !== null);
    const taken = all.reduce((n, p) => n + p.taken, 0);
    return { job, weapon: all[0].weapon.name, maxHp: all[0].maxHp, dps: all.reduce((n, p) => n + p.totalDamage, 0) / totalTime, targetSelectionShare: all.reduce((n, p) => n + p.targeted, 0) / partyTargetSelections, damageTakenPerMinute: taken / totalTime * 60, damageTakenShare: taken / partyDamageTaken, recoveryPerMinute: all.reduce((n, p) => n + p.healing, 0) / totalTime * 60, regenerationPerMinute: all.reduce((n, p) => n + p.regenerationHealing, 0) / totalTime * 60, killHealingPerMinute: all.reduce((n, p) => n + p.killHealing, 0) / totalTime * 60, priestHealingPerMinute: all.reduce((n, p) => n + p.spellHealing, 0) / totalTime * 60, deathRate: deaths.length / RUNS, averageDeathSeconds: deaths.reduce((n, p) => n + p.deathAt, 0) / Math.max(1, deaths.length), averageEndHp: all.reduce((n, p) => n + p.hp, 0) / RUNS, averageEndHpPercent: all.reduce((n, p) => n + p.hp / p.maxHp, 0) / RUNS };
  });
  const damageByEnemy = Object.fromEntries(monsterPool.map(enemy => { const damage = samples.reduce((sum, sample) => sum + sample.party.reduce((partySum, member) => partySum + (member.damageTakenByEnemy[enemy.id] || 0), 0), 0); return [enemy.id, { name: enemy.name, damage, share: damage / Math.max(1, partyDamageTaken) }]; }));
  return { party: name, jobs, runs: RUNS, gear: gearId, regenAffixCount, killHealAffixCount, killHealPerAffix, applyKillHealOpportunityCost, stage: stage.id, monsterPool: monsterPool.map(enemy => enemy.id), damageByEnemy, suppression: { progress: stage.progress, total: stage.total, completion: stage.completion, drain: stage.drain, damagePenalty: stage.penalty, defensePenalty: stage.penalty }, targetWeights: { warrior: warriorWeight, others: 1 }, theoreticalWarriorTargetRateWithFourAlive: warriorWeight / (warriorWeight + 3), fullPartySurvivalRate: fullPartySurvivors.length / RUNS, survivalRate: survivors.length / RUNS, averageWipeSeconds: samples.filter(s => !s.survived).reduce((n, s) => n + s.time, 0) / Math.max(1, RUNS - survivors.length), averagePartyHpPercent: samples.reduce((n, s) => n + s.party.reduce((sum, p) => sum + p.hp, 0) / s.party.reduce((sum, p) => sum + p.maxHp, 0), 0) / RUNS, survivorPartyHp: survivors.length ? survivors.reduce((n, s) => n + s.party.reduce((sum, p) => sum + p.hp, 0), 0) / survivors.length : 0, survivorPartyHpPercent: survivors.length ? survivors.reduce((n, s) => n + s.party.reduce((sum, p) => sum + p.hp, 0) / s.party.reduce((sum, p) => sum + p.maxHp, 0), 0) / survivors.length : 0, killsPerMinute: samples.reduce((n, s) => n + s.kills, 0) / totalTime * 60, teamDps: members.reduce((n, m) => n + m.dps, 0), fiveMonsterClearRate: clears.length / RUNS, averageFiveMonsterClearSeconds: clears.reduce((n, s) => n + s.firstClearAt, 0) / Math.max(1, clears.length), members };
}
function compactCell(cell) {
  return { party: cell.party, stage: cell.stage, suppression: cell.suppression, monsterPool: cell.monsterPool, damageByEnemy: cell.damageByEnemy, killHealAffixCount: cell.killHealAffixCount, killHealPerAffix: cell.killHealPerAffix, fullPartySurvivalRate: cell.fullPartySurvivalRate, survivalRate: cell.survivalRate, averageWipeSeconds: cell.averageWipeSeconds, survivorPartyHpPercent: cell.survivorPartyHpPercent, teamDps: cell.teamDps, killsPerMinute: cell.killsPerMinute, members: cell.members.map(member => ({ job: member.job, deathRate: member.deathRate, averageDeathSeconds: member.averageDeathSeconds, averageEndHpPercent: member.averageEndHpPercent, killHealingPerMinute: member.killHealingPerMinute, priestHealingPerMinute: member.priestHealingPerMinute, damageTakenPerMinute: member.damageTakenPerMinute })) };
}
function curveCell(cell) {
  return { party: cell.party, stage: cell.stage, killHealAffixCount: cell.killHealAffixCount, fullPartySurvivalRate: cell.fullPartySurvivalRate, survivalRate: cell.survivalRate, averageWipeSeconds: cell.averageWipeSeconds, survivorPartyHpPercent: cell.survivorPartyHpPercent, teamDps: cell.teamDps, killsPerMinute: cell.killsPerMinute, priestHealingPerMinute: cell.members.find(member => member.job === 'priest')?.priestHealingPerMinute || 0, teamKillHealingPerMinute: cell.members.reduce((sum, member) => sum + member.killHealingPerMinute, 0), deathRates: Object.fromEntries(cell.members.map(member => [member.job, member.deathRate])) };
}

function proportionalStage(cleared, total, baseDrain = 10, basePenalty = .10) {
  const completion = Math.max(0, Math.min(1, cleared / total));
  return { id: `${cleared}/${total}`, progress: cleared, total, completion, drain: baseDrain * (1 - completion), penalty: basePenalty * (1 - completion), preserveFraction: true };
}

function summarizeEliteLoop(name, jobs, chance, stage) {
  const samples = Array.from({ length: RUNS }, (_, i) => simulate(jobs, 0x31c0de + i * 104729 + name.charCodeAt(0), 3, 'B', stage, 0, 1, .02, true, CHAPTER_32_POOL, null, { chance }));
  const sum = fn => samples.reduce((n, s) => n + fn(s), 0);
  const partySum = (s, key) => s.party.reduce((n, p) => n + p[key], 0);
  const time = sum(s => s.time), kills = sum(s => s.kills);
  const survivors = samples.filter(s => s.survived), wipes = samples.filter(s => !s.survived);
  const enemyDamage = sum(s => partySum(s, 'taken'));
  const environment = sum(s => partySum(s, 'environment'));
  const eliteDamage = sum(s => s.party.reduce((n, p) => n + (p.damageTakenByEnemy[CHAPTER_32_ELITE.id] || 0), 0));
  const spawns = sum(s => s.loopStats.spawns), eliteSpawns = sum(s => s.loopStats.eliteSpawns);
  const eliteKills = sum(s => s.loopStats.eliteKills);
  return {
    party: name, frequency: `E${Math.round(chance * 100)}`, runs: RUNS,
    fullPartySurvivalRate: sum(s => Number(s.party.every(p => p.alive))) / RUNS,
    survivalRate: survivors.length / RUNS,
    averageWipeSeconds: wipes.length ? wipes.reduce((n, s) => n + s.time, 0) / wipes.length : null,
    averageRunSeconds: time / RUNS,
    survivorPartyHpPercent: survivors.length ? survivors.reduce((n, s) => n + partySum(s, 'hp') / partySum(s, 'maxHp'), 0) / survivors.length : null,
    deathRates: Object.fromEntries(jobs.map((job, index) => [job, sum(s => Number(!s.party[index].alive)) / RUNS])),
    teamDps: sum(s => partySum(s, 'totalDamage')) / time,
    killsPerMinute: kills / time * 60,
    priestHealingPerMinute: sum(s => partySum(s, 'spellHealing')) / time * 60,
    teamKillHealingPerMinute: sum(s => partySum(s, 'killHealing')) / time * 60,
    eliteSpawnsPerRun: eliteSpawns / RUNS,
    eliteSpawnsPerMinute: eliteSpawns / time * 60,
    eliteDirectDamagePerMinute: eliteDamage / time * 60,
    eliteDamageShare: eliteDamage / enemyDamage,
    enemyDamagePerMinute: enemyDamage / time * 60,
    environmentDamagePerRun: environment / RUNS,
    environmentDamagePerMinute: environment / time * 60,
    environmentDamagePerKill: environment / kills,
    elitePresenceTimeShare: sum(s => s.loopStats.elitePresentSeconds) / time,
    meanKilledEliteLifetimeSeconds: eliteKills ? sum(s => s.loopStats.eliteKilledLifetime) / eliteKills : null,
    observedEliteSpawnRate: eliteSpawns / spawns,
    totalSpawns: spawns, totalEliteSpawns: eliteSpawns,
    maxConcurrentElites: Math.max(...samples.map(s => s.loopStats.maxConcurrentElites))
  };
}

if (process.argv.includes('--chapter-33-s14')) {
  const stagePoints = [0, 4, 8, 12];
  const partyArg = process.argv.find(value => value.startsWith('--party='));
  const parties = Object.entries(PARTIES).filter(([name]) => !partyArg || name === partyArg.split('=')[1]);
  const cells = parties.flatMap(([name, jobs]) => stagePoints.map(cleared => {
    const stage = proportionalStage(cleared, 20, 14, .14);
    const cell = summarize(name, jobs, 3, 'B', stage, 0, 1, .02, true, CHAPTER_32_POOL);
    return { ...curveCell(cell), suppression: cell.suppression, averageWipeSeconds: cell.survivalRate === 1 ? null : cell.averageWipeSeconds, survivorPartyHpPercent: cell.survivalRate === 0 ? null : cell.survivorPartyHpPercent };
  }));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-3 S14 suppression TEST V1', runs: RUNS, durationSeconds: DURATION, totalSuppression: 14, totalFacilities: 20, stagePoints, gear: 'B1-R0; one 2% kill-heal affix with opportunity cost', targetWeights: { warrior: 3, others: 1 }, monsterPool: CHAPTER_32_POOL, respawnSeconds: 2, eliteChance: 0, boss: false, cells }, null, 2)}\n`);
} else if (process.argv.includes('--chapter-32-boss-v1')) {
  const stage = proportionalStage(6, 15, 12, .12);
  const cells = Object.entries(PARTIES).map(([name, jobs]) => {
    const samples = Array.from({ length: RUNS }, (_, i) => simulate(jobs, 0x31c0de + i * 104729 + name.charCodeAt(0), 3, 'B', stage, 0, 1, .02, true, CHAPTER_32_POOL, { templates: [CHAPTER_32_BOSS], duration: 120, stopImmediately: true }));
    const wins = samples.filter(s => s.firstClearAt !== null), wipes = samples.filter(s => !s.survived);
    const avg = (list, fn) => list.length ? list.reduce((n, s) => n + fn(s), 0) / list.length : null;
    const total = fn => samples.reduce((n, s) => n + fn(s), 0);
    const partySum = (s, key) => s.party.reduce((n, p) => n + p[key], 0);
    const skillHits = total(s => s.enemies[0].skillHits || 0), skillCasts = total(s => s.enemies[0].skillCasts || 0), skillDamage = total(s => s.enemies[0].skillDamage || 0);
    const bounds = [0, 20, 40, 60, 90, 120];
    const distribution = Object.fromEntries(bounds.slice(0, -1).map((low, i) => [`${low}-${bounds[i + 1]}`, wins.filter(s => s.time >= low && (i === 4 ? s.time <= 120 : s.time < bounds[i + 1])).length]));
    distribution.notKilled = RUNS - wins.length;
    return {
      party: name, runs: RUNS, killRate: wins.length / RUNS,
      fullPartyKillRate: wins.filter(s => s.party.every(p => p.alive)).length / RUNS,
      averageKillSeconds: avg(wins, s => s.time), wipeRate: wipes.length / RUNS,
      averageWipeSeconds: avg(wipes, s => s.time), timeoutRate: samples.filter(s => s.firstClearAt === null && s.survived).length / RUNS,
      hpPercentAtBossDeath: avg(wins, s => partySum(s, 'hp') / partySum(s, 'maxHp')),
      deathRates: Object.fromEntries(jobs.map((job, i) => [job, total(s => Number(!s.party[i].alive)) / RUNS])),
      averageDeathSeconds: Object.fromEntries(jobs.map((job, i) => [job, avg(samples.filter(s => !s.party[i].alive), s => s.party[i].deathAt)])),
      priestHealingPerRun: avg(samples, s => partySum(s, 'spellHealing')),
      bossDamagePerRun: avg(samples, s => partySum(s, 'taken')),
      environmentDamagePerRun: avg(samples, s => partySum(s, 'environment')),
      warriorBossDamagePerRun: avg(samples, s => s.party[0].taken),
      heavySlashDamagePerHit: skillHits ? skillDamage / skillHits : null,
      heavySlashDamagePerCast: skillCasts ? skillDamage / skillCasts : null,
      heavySlashHitsPerRun: skillHits / RUNS, heavySlashCastsPerRun: skillCasts / RUNS,
      killTimeDistribution: distribution,
      warIntentIEntryRate: total(s => Number(s.time >= 20)) / RUNS,
      warIntentIIEntryRate: total(s => Number(s.time >= 40)) / RUNS,
      warIntentAttacksPerRun: Object.fromEntries([1, 1.08, 1.16].map(mult => [mult, avg(samples, s => s.enemies[0].intentAttacks?.[mult] || 0)])),
      warIntentDamagePerRun: Object.fromEntries([1, 1.08, 1.16].map(mult => [mult, avg(samples, s => s.enemies[0].intentDamage?.[mult] || 0)])),
      maxKills: Math.max(...samples.map(s => s.kills)), maxEnemyCount: Math.max(...samples.map(s => s.enemies.length)),
      longestRunSeconds: Math.max(...samples.map(s => s.time)),
      killHealingPerRun: avg(samples, s => partySum(s, 'killHealing'))
    };
  });
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-2 canyon warlord TEST V1', boss: CHAPTER_32_BOSS, runs: RUNS, stage, gear: 'B1-R0; one 2% kill-heal affix with opportunity cost', targetWeights: { warrior: 3, others: 1 }, durationSeconds: 120, respawn: false, cells }, null, 2)}\n`);
} else if (process.argv.includes('--chapter-32-elite-loop')) {
  const stage = proportionalStage(6, 15, 12, .12);
  const partyArg = process.argv.find(value => value.startsWith('--party='));
  const parties = Object.entries(PARTIES).filter(([name]) => !partyArg || name === partyArg.split('=')[1]);
  const cells = parties.flatMap(([name, jobs]) => {
    const results = [0, .05, .10, .15].map(chance => summarizeEliteLoop(name, jobs, chance, stage));
    const base = results[0];
    return results.map(cell => ({ ...cell,
      environmentDamagePerRunDeltaVsE0: cell.environmentDamagePerRun - base.environmentDamagePerRun,
      environmentDamagePerKillDeltaVsE0: cell.environmentDamagePerKill - base.environmentDamagePerKill
    }));
  });
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-2 elite frequency loop TEST', runs: RUNS, durationSeconds: DURATION, stage, elite: CHAPTER_32_ELITE, respawnSeconds: 2, initialSlots: 5, probabilitiesApplyToInitialSpawns: true, normalOpening: 'existing four normal types plus one uniform roll; each slot independently eligible for elite replacement', spawnRandom: 'separate paired-seed stream; E0 preserves previous combat RNG', rateDenominator: 'pooled observed run time until wipe or 600 seconds', environmentNote: 'Fixed 7.2 HP/s per living character; raw total delta is not a causal elite delay estimate. Per-kill delta describes exposure cost, not additional damage per second.', cells }, null, 2)}\n`);
} else if (process.argv.includes('--chapter-32-elite-encounter')) {
  const stage = proportionalStage(6, 15, 12, .12);
  const cells = Object.entries(PARTIES).flatMap(([name, jobs]) => ['Normal', 'Elite'].map(mode => {
    const samples = Array.from({ length: RUNS }, (_, i) => {
      const seed = 0x31c0de + i * 104729 + name.charCodeAt(0);
      const compositionRandom = rng(seed ^ 0x32e117e);
      const templates = Array.from({ length: 5 }, () => CHAPTER_32_POOL[Math.floor(compositionRandom() * CHAPTER_32_POOL.length)]);
      // Pair identical four normal enemies; rotate the replaced slot to avoid always front/back targeting the elite.
      if (mode === 'Elite') templates[i % 5] = CHAPTER_32_ELITE;
      return simulate(jobs, seed, 3, 'B', stage, 0, 1, .02, true, CHAPTER_32_POOL, { templates });
    });
    const avg = fn => samples.reduce((sum, s) => sum + fn(s), 0) / RUNS;
    const sumParty = (s, key) => s.party.reduce((sum, p) => sum + (p[key] || 0), 0);
    const eliteStat = (s, key) => s.enemies.reduce((sum, e) => sum + (e.id === CHAPTER_32_ELITE.id ? e[key] || 0 : 0), 0);
    const enemyDamage = avg(s => sumParty(s, 'taken'));
    const eliteDamage = avg(s => s.party.reduce((sum, p) => sum + (p.damageTakenByEnemy[CHAPTER_32_ELITE.id] || 0), 0));
    const skillCasts = avg(s => eliteStat(s, 'skillCasts')), skillHits = avg(s => eliteStat(s, 'skillHits')), skillDamage = avg(s => eliteStat(s, 'skillDamage'));
    return { party: name, mode, runs: RUNS, clearRate: avg(s => Number(s.firstClearAt !== null)), fullPartySurvival: avg(s => Number(s.party.every(p => p.alive))), anySurvival: avg(s => Number(s.survived)), averageClearSeconds: samples.filter(s => s.firstClearAt !== null).reduce((n, s) => n + s.firstClearAt, 0) / Math.max(1, samples.filter(s => s.firstClearAt !== null).length), endHpPercent: avg(s => sumParty(s, 'hp') / sumParty(s, 'maxHp')) * 100, priestHealing: avg(s => sumParty(s, 'spellHealing')), enemyDamage, environmentDamage: avg(s => sumParty(s, 'environment')), killHealing: avg(s => sumParty(s, 'killHealing')), eliteDamage, eliteDamageShare: eliteDamage / enemyDamage, skillCasts, skillHits, skillDamage, skillDamagePerCast: skillDamage / (skillCasts || 1), skillDamagePerHit: skillDamage / (skillHits || 1), deaths: Object.fromEntries(jobs.map((job, index) => [job, avg(s => Number(!s.party[index].alive))])), minKills: Math.min(...samples.map(s => s.kills)), maxKills: Math.max(...samples.map(s => s.kills)) };
  }));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-2 single encounter TEST V1', stage, elite: CHAPTER_32_ELITE, pairedSeeds: true, respawn: false, replacementSlot: 'run index modulo 5', cells }, null, 2)}\n`);
} else if (process.argv.includes('--chapter-32-suppression-curve')) {
  const stagesArg = process.argv.find(value => value.startsWith('--stages='));
  const clearedStages = stagesArg ? stagesArg.split('=')[1].split(',').map(Number) : [0, 2, 3, 5, 8, 12, 15];
  const stages = clearedStages.map(cleared => ({ ...proportionalStage(cleared, 15, 12, .12), id: `${cleared}/15` }));
  const gearArg = process.argv.find(value => value.startsWith('--gear='));
  const gearCounts = gearArg ? [Number(gearArg.split('=')[1])] : [1, 2];
  const partyArg = process.argv.find(value => value.startsWith('--party='));
  const parties = partyArg ? Object.entries(PARTIES).filter(([name]) => name === partyArg.split('=')[1]) : Object.entries(PARTIES);
  const cells = gearCounts.flatMap(killHealAffixCount => stages.flatMap(stage => parties.map(([name, jobs]) => summarize(name, jobs, 3, 'B', stage, 0, killHealAffixCount, .02, true, CHAPTER_32_POOL))));
  const outputCells = process.argv.includes('--curve-summary') ? cells.map(curveCell) : process.argv.includes('--compact') ? cells.map(compactCell) : cells;
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-2 TEST V1 suppression curve', runs: RUNS, totalSuppression: 12, totalFacilities: 15, monsterPool: CHAPTER_32_POOL, fixedGear: gearCounts.map(count => `B${count}-R0`), cells: outputCells }, null, 2)}\n`);
} else if (process.argv.includes('--chapter-32-monsters-v1')) {
  const stage = { ...proportionalStage(0, 15, 12, .12), id: 'S12 0/15' };
  const cells = [1, 2].flatMap(killHealAffixCount => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', stage, 0, killHealAffixCount, .02, true, CHAPTER_32_POOL)));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-2 normal monsters TEST V1', runs: RUNS, stage, monsterPool: CHAPTER_32_POOL, baselines: { spear: { source: '碎顱斥候', hpIncrease: .05, attackIncrease: .08, defenseIncrease: .05 }, warrior: { source: '赤岩蜥蜴', hpIncrease: .08, attackIncrease: .06, defenseIncrease: .08 } }, cells: process.argv.includes('--compact') ? cells.map(compactCell) : cells }, null, 2)}\n`);
} else if (process.argv.includes('--chapter-32-suppression-candidates')) {
  const candidates = [10, 12, 15, 18];
  const b1 = candidates.flatMap(base => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', { ...proportionalStage(0, 15, base, base / 100), id: `S${base} 0/15` }, 0, 1, .02, true)));
  const b2 = candidates.filter(base => base !== 10).flatMap(base => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', { ...proportionalStage(0, 15, base, base / 100), id: `S${base} 0/15` }, 0, 2, .02, true)));
  const cells = [...b1, ...b2];
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-2 total suppression candidates', runs: RUNS, monsters: 'unchanged Chapter 3-1 TEST V1', totalFacilities: 15, fixedGear: ['B1-R0', 'B2-R0'], targetWeights: { warrior: 3, others: 1 }, cells: process.argv.includes('--compact') ? cells.map(compactCell) : cells }, null, 2)}\n`);
} else if (process.argv.includes('--proportional-suppression-comparison')) {
  const points = [{ cleared: 0, total: 10 }, { cleared: 2, total: 10 }, { cleared: 8, total: 10 }, { cleared: 10, total: 10 }];
  const cells = points.flatMap(point => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', proportionalStage(point.cleared, point.total), 0, 1, .02, true)));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3 exact proportional suppression comparison', runs: RUNS, fixedGear: 'B1-R0', cells: process.argv.includes('--compact') ? cells.map(compactCell) : cells }, null, 2)}\n`);
} else if (process.argv.includes('--proportional-suppression')) {
  const cells = [0, 1, 3, 5, 8, 10, 12, 15].flatMap(cleared => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', proportionalStage(cleared, 15), 0, 1, .02, true)));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3 facility proportional suppression', formula: 'baseSuppression * (1 - cleared / total)', runs: RUNS, fixedGear: 'B1-R0', targetWeights: { warrior: 3, others: 1 }, cells: process.argv.includes('--compact') ? cells.map(compactCell) : cells }, null, 2)}\n`);
} else if (process.argv.includes('--suppression-entry-curve')) {
  const stages = [STAGES.full, STAGES.progress1, STAGES.progress2, STAGES.progress3];
  const cells = stages.flatMap(stage => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', stage, 0, 1, .02, true)));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-1 TEST V1 suppression entry curve', runs: RUNS, fixedGear: 'B1-R0', targetWeights: { warrior: 3, others: 1 }, killHealPerAffix: .02, opportunityCost: ['one affix replaces basic attack damage +8%'], cells: process.argv.includes('--compact') ? cells.map(compactCell) : cells }, null, 2)}\n`);
} else if (process.argv.includes('--suppression-curve')) {
  const stages = [STAGES.full, STAGES.progress3, STAGES.progress5, STAGES.progress7, STAGES.cleared];
  const cells = [1, 2].flatMap(killHealAffixCount => stages.flatMap(stage => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', stage, 0, killHealAffixCount, .02, true))));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-1 TEST V1 suppression curve', runs: RUNS, fixedGear: 'B-R0', targetWeights: { warrior: 3, others: 1 }, killHealPerAffix: .02, opportunityCost: ['first affix replaces basic attack damage +8%', 'second affix replaces basic attack damage +8%'], cells: process.argv.includes('--compact') ? cells.map(compactCell) : cells }, null, 2)}\n`);
} else if (process.argv.includes('--kill-heal-value')) {
  const values = [0, .01, .015, .02, .025, .03];
  const cells = values.flatMap(killHealPerAffix => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', STAGES.full, 0, killHealPerAffix ? 1 : 0, killHealPerAffix, true)));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-1 single kill-healing affix value', runs: RUNS, fixedGear: 'B-R0', opportunityCost: ['first affix replaces basic attack damage +8%'], cells: process.argv.includes('--compact') ? cells.map(compactCell) : cells }, null, 2)}\n`);
} else if (process.argv.includes('--kill-heal-stack')) {
  const arg = process.argv.find(value => value.startsWith('--per-affix='));
  const killHealPerAffix = arg ? Number(arg.split('=')[1]) / 100 : .02;
  const cells = [0, 1, 2, 3].flatMap(killHealAffixCount => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', STAGES.full, 0, killHealAffixCount, killHealPerAffix, true)));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-1 stacked kill-healing affixes', runs: RUNS, fixedGear: 'B-R0', killHealPerAffix, opportunityCost: ['first affix replaces basic attack damage +8%', 'second affix replaces basic attack damage +8%', 'third affix replaces skill damage +8%'], cells: process.argv.includes('--compact') ? cells.map(compactCell) : cells }, null, 2)}\n`);
} else if (process.argv.includes('--kill-heal-sensitivity')) {
  const cells = [0, 1, 2, 3].flatMap(killHealAffixCount => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', STAGES.full, 0, killHealAffixCount)));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-1 kill-healing affix sensitivity', runs: RUNS, fixedGear: 'B-R0', replacementForRemovedAffixes: 'empty or neutral non-combat affix; no replacement stats', stage: STAGES.full, cells }, null, 2)}\n`);
} else if (process.argv.includes('--regen-sensitivity')) {
  const cells = [0, 1, 2, 3].flatMap(regenAffixCount => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, 'B', STAGES.full, regenAffixCount)));
  process.stdout.write(`${JSON.stringify({ test: 'Chapter 3-1 life-regeneration affix sensitivity', runs: RUNS, fixedGear: 'B', replacementForRemovedAffixes: 'empty or neutral non-combat affix; no replacement stats', stage: STAGES.full, cells }, null, 2)}\n`);
} else {
  const statSheets = Object.fromEntries(Object.keys(GEAR).map(gearId => [gearId, Object.fromEntries(Object.keys(WEAPONS).map(job => { const p = makePlayer(job, gearId, 0); return [job, { hp: p.maxHp, defense: p.normalDefense, attack: p.attack, crit: p.crit, dodge: p.dodge, attackSpeed: p.speed, hpRegen: p.hpRegen, resource: p.resourceMax, weapon: p.weapon.name }]; }))]));
  const cells = Object.entries(GEAR).flatMap(([gearId]) => Object.values(STAGES).flatMap(stage => Object.entries(PARTIES).map(([name, jobs]) => summarize(name, jobs, 3, gearId, stage))));
  const result = { test: 'Chapter 3-1 TEST V1 equipment threshold', mode: 'unchanged TEST V1 monsters / warrior target weight 3 / no potions / unchanged priest AI', targeting: { players: 'oldest living front enemy', monsters: 'weighted random living party member', warriorWeight: 3, formalSystemModified: false }, gear: GEAR, statSheets, cells };
  const compact = process.argv.includes('--summary') ? { runs: RUNS, statSheets, cells: cells.map(cell => ({ party: cell.party, gear: cell.gear, stage: cell.stage, survivalRate: cell.survivalRate, averageWipeSeconds: cell.averageWipeSeconds, survivorPartyHp: cell.survivorPartyHp, survivorPartyHpPercent: cell.survivorPartyHpPercent, killsPerMinute: cell.killsPerMinute, teamDps: cell.teamDps, members: cell.members.map(member => ({ job: member.job, dps: member.dps, damageTakenPerMinute: member.damageTakenPerMinute, damageTakenShare: member.damageTakenShare, recoveryPerMinute: member.recoveryPerMinute, priestHealingPerMinute: member.priestHealingPerMinute, deathRate: member.deathRate, averageDeathSeconds: member.averageDeathSeconds, averageEndHp: member.averageEndHp })) })) } : result;
  process.stdout.write(`${JSON.stringify(compact, null, 2)}\n`);
}
