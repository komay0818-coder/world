// Chapter 3-4 TEST V1 only; chapter 3-3 templates are reused without mutation.
const Chapter33 = require('./chapter-three-33-rules.js');
const normals = [
  { ...Chapter33.normals[0] }, { ...Chapter33.normals[3] },
  { id: 'skull-heavy-guard', name: '碎顱重甲衛士', rank: 'normal', hp: 1520, attack: 96, defense: 112, speed: .66, evasion: 1, parry: 20, dr: 22, skillMultiplier: 1.25, skillCooldown: 10, heavyArmor34: true },
  { id: 'skull-wolf-rider', name: '碎顱戰狼騎兵', rank: 'normal', hp: 1230, attack: 116, defense: 72, speed: 1.05, evasion: 8, parry: 5, dr: 10, skillMultiplier: 1.45, skillCooldown: 10, charge34: true }
];
const elite = { id: 'skull-champion', name: '碎顱勇士', rank: 'elite', hp: 3950, attack: 150, defense: 128, speed: .84, evasion: 4, parry: 18, dr: 26, skillMultiplier: 1.60, skillCooldown: 10, fervor34: true };
const boss = { id: 'skull-chief', name: '碎顱大酋長', rank: 'boss', hp: 20000, attack: 180, defense: 148, speed: .82, evasion: 3, parry: 20, dr: 28, skillMultiplier: 1.65, skillCooldown: 10, chief34: true };
function effectiveDr(enemy) { return enemy.dr + (enemy.heavyArmor34 && enemy.currentHp > enemy.maxHp * .5 ? 5 : 0); }
function attackMultiplier(enemy) { return enemy.rage34 ? 1.10 : enemy.fervor34Triggered ? 1.08 : 1; }
function speedMultiplier(enemy, now) { return attackMultiplier(enemy) * (now < (enemy.charge34Until || 0) ? 1.10 : 1); }
function defenseMultiplier(enemy) { return enemy.rage34 ? .90 : 1; }
function acceleratePending(enemy, now, ratio) {
  if (enemy.attackAt > now) enemy.attackAt = now + (enemy.attackAt - now) / ratio;
}
function onSkillHit(enemy, now) {
  if (!enemy.charge34) return;
  if (!(now < (enemy.charge34Until || 0))) acceleratePending(enemy, now, 1.10);
  enemy.charge34Until = now + 4;
}
function killHealAmount(player, enemy) {
  return enemy.noKillHeal ? 0 : Math.min(player.maxHp - player.hp, player.maxHp * player.killHeal);
}
function afterDamage(enemy, now) {
  if (enemy.currentHp <= 0) {
    if (enemy.chief34 && enemy.dismissSummons) enemy.dismissSummons(now);
    return;
  }
  if (enemy.fervor34 && !enemy.fervor34Triggered && enemy.currentHp < enemy.maxHp * .5) {
    enemy.fervor34Triggered = true; enemy.fervor34At = now;
    enemy.fervor34Count = (enemy.fervor34Count || 0) + 1;
    acceleratePending(enemy, now, 1.08);
  }
  if (!enemy.chief34) return;
  if (!enemy.summon70 && enemy.currentHp <= enemy.maxHp * .70) {
    enemy.summon70 = { at: now, count: 1 };
    enemy.spawnSummon?.({ ...normals[0], noKillHeal: true, summoned34: true, summonStage: 70 }, now);
  }
  if (!enemy.summon40 && enemy.currentHp <= enemy.maxHp * .40) {
    enemy.summon40 = { at: now, count: 1 };
    enemy.spawnSummon?.({ ...normals[3], noKillHeal: true, summoned34: true, summonStage: 40 }, now);
  }
  if (!enemy.rage34 && enemy.currentHp <= enemy.maxHp * .25) {
    enemy.rage34 = true; enemy.rage34At = now;
    enemy.rage34Count = (enemy.rage34Count || 0) + 1;
    acceleratePending(enemy, now, 1.10);
  }
}
module.exports = { normals, elite, boss, effectiveDr, attackMultiplier, speedMultiplier, defenseMultiplier, onSkillHit, killHealAmount, afterDamage };
