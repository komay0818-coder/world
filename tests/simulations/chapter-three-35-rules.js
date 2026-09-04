// Chapter 3-5 TEST V1 only.
const normals = [
  { id: 'skull-priest', name: '碎顱祭司', rank: 'normal', hp: 1080, attack: 92, defense: 64, speed: .82, evasion: 5, parry: 0, dr: 9, skillCooldown: 12, bloodSacrifice35: true },
  { id: 'skull-fanatic', name: '碎顱狂信者', rank: 'normal', hp: 1260, attack: 122, defense: 70, speed: .96, evasion: 5, parry: 5, dr: 10, skillMultiplier: 1.45, skillCooldown: 10, fanatic35: true },
  { id: 'ancient-stone-guard', name: '遠古石衛', rank: 'normal', hp: 1620, attack: 101, defense: 120, speed: .64, evasion: 0, parry: 12, dr: 23, skillMultiplier: 1.30, skillCooldown: 10, stoneShell35: true },
  { id: 'rune-guard', name: '符文守衛', rank: 'normal', hp: 1340, attack: 108, defense: 91, speed: .78, evasion: 3, parry: 12, dr: 16, skillMultiplier: 1.35, skillCooldown: 10, rune35: .06, runeDuration35: 4 }
];
const elite = { id: 'awakened-guard', name: '覺醒守衛', rank: 'elite', hp: 4300, attack: 156, defense: 136, speed: .78, evasion: 2, parry: 18, dr: 27, skillMultiplier: 1.60, skillCooldown: 10, awakening35: true };
const boss = { id: 'fallen-high-priest', name: '墮落大祭司', rank: 'boss', hp: 22500, attack: 187, defense: 154, speed: .80, evasion: 4, parry: 15, dr: 29, skillMultiplier: 1.65, skillCooldown: 10, rune35: .08, runeDuration35: 5, ritualBoss35: true };
function selfLoss(enemy, fraction) {
  const loss = Math.min(enemy.currentHp * fraction, Math.max(0, enemy.currentHp - 1));
  enemy.currentHp -= loss;
  enemy.selfDamage35 = (enemy.selfDamage35 || 0) + loss;
  return loss;
}
function sacrifice(caster, enemies, now) {
  if (caster.currentHp <= 0) return;
  selfLoss(caster, .08);
  caster.sacrificeCasts35 = (caster.sacrificeCasts35 || 0) + 1;
  for (const enemy of enemies) if (enemy !== caster && enemy.currentHp > 0) enemy.bloodDrUntil35 = now + 5;
}
function afterDamage(enemy, now) {
  if (enemy.currentHp <= 0) {
    if (enemy.ritualBoss35) enemy.onForbidden35?.(false);
    return;
  }
  if (enemy.fanatic35 && !enemy.fanaticTriggered35 && enemy.currentHp < enemy.maxHp * .30) {
    enemy.fanaticTriggered35 = true; enemy.fanaticAt35 = now; enemy.fanaticCount35 = 1;
    if (enemy.attackAt > now) enemy.attackAt = now + (enemy.attackAt - now) / 1.12;
  }
  if (enemy.awakening35 && enemy.awakeningAt35 === undefined && enemy.currentHp < enemy.maxHp * .5) {
    enemy.awakeningAt35 = now; enemy.awakeningUntil35 = now + 8; enemy.awakeningCount35 = 1;
  }
  if (!enemy.ritualBoss35) return;
  for (const [threshold, stage] of [[.70, 1], [.40, 2]]) {
    if (!enemy[`ritual${stage}35`] && enemy.currentHp / enemy.maxHp <= threshold) {
      const loss = selfLoss(enemy, .05);
      enemy[`ritual${stage}35`] = { at: now, selfLoss: loss, count: 1 };
      enemy.ritualStage35 = stage; enemy.ritualUntil35 = now + 10;
      if (stage === 2 && enemy.attackAt > now) enemy.attackAt = now + (enemy.attackAt - now) / 1.08;
    }
  }
  if (!enemy.forbidden35 && enemy.currentHp < enemy.maxHp * .20) {
    enemy.forbidden35 = true; enemy.forbiddenAt35 = now; enemy.forbiddenCount35 = 1;
    enemy.onForbidden35?.(true);
  }
}
function attackMultiplier(enemy, now) {
  return enemy.fanaticTriggered35 ? 1.12 : now < (enemy.awakeningUntil35 || 0) || now < (enemy.ritualUntil35 || 0) ? 1.08 : 1;
}
function speedMultiplier(enemy, now) {
  return enemy.fanaticTriggered35 ? 1.12 : enemy.ritualStage35 === 2 && now < enemy.ritualUntil35 ? 1.08 : 1;
}
function defenseMultiplier(enemy) { return enemy.forbidden35 ? .85 : enemy.fanaticTriggered35 ? .90 : 1; }
function extraDr(enemy, now) { return (now < (enemy.bloodDrUntil35 || 0) ? 6 : 0) + (now < (enemy.awakeningUntil35 || 0) ? 5 : 0); }
function shellMultiplier(enemy, successfulDamage) {
  if (!enemy.stoneShell35 || successfulDamage <= 0) return 1;
  enemy.shellHits35 = (enemy.shellHits35 || 0) + 1;
  if (enemy.shellHits35 === 6) { enemy.shellHits35 = 0; enemy.shellProcs35 = (enemy.shellProcs35 || 0) + 1; return .70; }
  return 1;
}
function onSkillHit(enemy, player, now) {
  if (!enemy.rune35) return;
  player.runeDebuff35 = enemy.rune35; player.runeUntil35 = now + enemy.runeDuration35;
}
function playerDamageMultiplier(player, now) { return (now < (player.runeUntil35 || 0) ? 1 - player.runeDebuff35 : 1) * (player.forbidden35 ? .92 : 1); }
module.exports = { normals, elite, boss, selfLoss, sacrifice, afterDamage, attackMultiplier, speedMultiplier, defenseMultiplier, extraDr, shellMultiplier, onSkillHit, playerDamageMultiplier };
