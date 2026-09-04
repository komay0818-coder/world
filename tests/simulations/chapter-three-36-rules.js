// Mechanism validation only; this is NOT a chapter 3-6 balance baseline.
const normals = [
  { id: 'temple-stone-guard', name: '聖殿石衛', hp: 1780, attack: 108, defense: 128, speed: .62, evasion: 0, parry: 14, dr: 24, skillMultiplier: 1.35, skillCooldown: 10, shell36: true },
  { id: 'rune-golem', name: '符文魔像', hp: 1620, attack: 116, defense: 105, speed: .70, evasion: 0, parry: 10, dr: 19, skillMultiplier: 1.30, skillCooldown: 11, defenseRune36: true },
  { id: 'temple-executor', name: '聖殿執行者', hp: 1430, attack: 132, defense: 82, speed: .90, evasion: 5, parry: 8, dr: 12, skillMultiplier: 1.50, skillCooldown: 10, executor36: true },
  { id: 'ancient-priest', name: '遠古祭司', hp: 1150, attack: 94, defense: 68, speed: .80, evasion: 5, parry: 0, dr: 10, skillCooldown: 12, healer36: true }
].map(e => ({ rank: 'normal', ...e }));
const elite = { id: 'temple-guardian', name: '聖殿守護者', rank: 'elite', hp: 4750, attack: 164, defense: 145, speed: .76, evasion: 2, parry: 20, dr: 29, skillMultiplier: 1.65, skillCooldown: 10, barrier36: true };
const boss = { id: 'temple-deity', name: '赤岩聖殿守護神', rank: 'boss', hp: 26000, attack: 198, defense: 165, speed: .78, evasion: 2, parry: 18, dr: 31, skillMultiplier: 1.70, skillCooldown: 10, templeBoss36: true };
function afterDamage(e, now) {
  if (e.currentHp <= 0) return;
  const ratio = e.currentHp / e.maxHp;
  if (e.barrierRecheckPending36 && ratio <= .5) { e.barrierRecheckPending36 = false; e.barrierRecrossings36 = (e.barrierRecrossings36 || 0) + 1; }
  if (e.barrier36 && e.barrierAt36 === undefined && ratio <= .5) { e.barrierAt36 = now; e.barrierUntil36 = now + 6; e.barrierCount36 = 1; }
  if (!e.templeBoss36) return;
  if (e.defenseAt36 === undefined && ratio < .70) { e.defenseAt36 = now; e.defenseUntil36 = now + 10; e.defenseCount36 = 1; }
  if (e.rampageAt36 === undefined && ratio < .40) { e.rampageAt36 = now; e.rampageUntil36 = now + 10; e.rampageCount36 = 1; }
  if (e.coreAt36 === undefined && ratio < .20) { e.coreAt36 = now; e.coreCount36 = 1; }
}
function attackMultiplier(e, now) { return e.coreAt36 !== undefined ? 1.12 : now < (e.rampageUntil36 || 0) ? 1.10 : 1; }
function speedMultiplier(e, now) { return attackMultiplier(e, now); }
function defenseMultiplier(e, now) { return e.coreAt36 !== undefined ? .80 : now < (e.defenseUntil36 || 0) ? 1.10 : 1; }
function extraDr(e, now) { return (e.coreAt36 !== undefined ? -5 : now < (e.defenseUntil36 || 0) ? 5 : 0) + (now < (e.barrierUntil36 || 0) ? 8 : 0); }
function shellMultiplier(e, damage) {
  if (!e.shell36 || damage <= 0) return 1;
  e.shellHits36 = (e.shellHits36 || 0) + 1;
  if (e.shellHits36 === 5) { e.shellHits36 = 0; e.shellProcs36 = (e.shellProcs36 || 0) + 1; return .70; }
  return 1;
}
function onSkillHit(e, target, now) { if (e.defenseRune36) target.defenseRuneUntil36 = now + 5; }
function playerDefense(target, now) { return target.defense * (now < (target.defenseRuneUntil36 || 0) ? .92 : 1); }
function skillMultiplier(e, target) { return e.executor36 && target.hp / target.maxHp < .35 ? 1.70 : e.skillMultiplier; }
function pulseTargets(party) { return party.filter(p => p.alive).slice(0, 4); }
function heal(caster, enemies) {
  const target = enemies.filter(e => e !== caster && e.currentHp > 0 && e.currentHp < e.maxHp).sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp || a.serial - b.serial)[0];
  if (!target) { caster.healSkips36 = (caster.healSkips36 || 0) + 1; return null; }
  const actual = Math.min(target.maxHp - target.currentHp, target.maxHp * .06);
  caster.selfHeals36 = (caster.selfHeals36 || 0) + Number(target === caster);
  caster.resurrections36 = (caster.resurrections36 || 0) + Number(target.currentHp <= 0);
  target.currentHp += actual;
  caster.healCasts36 = (caster.healCasts36 || 0) + 1;
  caster.healing36 = (caster.healing36 || 0) + actual;
  caster.healTargets36 ||= {};
  caster.healTargets36[target.id] = (caster.healTargets36[target.id] || 0) + 1;
  if (target.barrierAt36 !== undefined && target.currentHp > target.maxHp * .5) { target.healedAboveHalf36 = (target.healedAboveHalf36 || 0) + 1; target.barrierRecheckPending36 = true; }
  return { target, actual };
}
module.exports = { normals, elite, boss, afterDamage, attackMultiplier, speedMultiplier, defenseMultiplier, extraDr, shellMultiplier, onSkillHit, playerDefense, skillMultiplier, pulseTargets, heal };
