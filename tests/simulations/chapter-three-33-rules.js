// All templates and rules in this file are TEST V1 only.
const normals = [
  { id: 'skull-berserker', name: '碎顱狂戰士', rank: 'normal', hp: 1180, attack: 111, defense: 68, speed: .92, evasion: 4, parry: 8, dr: 10, skillMultiplier: 1.40, skillCooldown: 10, lowHpSpeed: true },
  { id: 'skull-guard', name: '碎顱盾衛', rank: 'normal', hp: 1340, attack: 91, defense: 101, speed: .68, evasion: 2, parry: 18, dr: 20, skillMultiplier: 1.20, skillCooldown: 9 },
  { id: 'skull-hunter', name: '碎顱獵手', rank: 'normal', hp: 1040, attack: 105, defense: 61, speed: 1.15, evasion: 10, parry: 0, dr: 8, skillMultiplier: 1.30, skillCooldown: 9, focusedBasics: true },
  { id: 'skull-shaman', name: '碎顱薩滿', rank: 'normal', hp: 960, attack: 87, defense: 58, speed: .88, evasion: 5, parry: 0, dr: 8, skillCooldown: 12, warDrum: true }
];
const elite = { id: 'skull-centurion', name: '碎顱百夫長', rank: 'elite', hp: 3650, attack: 142, defense: 122, speed: .80, evasion: 3, parry: 20, dr: 25, skillMultiplier: 1.55, skillCooldown: 10, frontline: true };
const boss = { id: 'skull-vanguard', name: '碎顱先鋒統領', rank: 'boss', hp: 17500, attack: 170, defense: 140, speed: .80, evasion: 3, parry: 18, dr: 27, skillMultiplier: 1.60, skillCooldown: 10, allOut: true };
function updateAllOut(enemy, now) {
  if (enemy.allOut && !enemy.allOutTriggered && enemy.currentHp > 0 && enemy.currentHp < enemy.maxHp * .5) {
    enemy.allOutTriggered = true;
    enemy.allOutAt = now;
    enemy.allOutTriggerCount = (enemy.allOutTriggerCount || 0) + 1;
  }
}
function speedMultiplier(enemy) {
  return (enemy.lowHpSpeed && enemy.currentHp < enemy.maxHp * .35 ? 1.15 : 1) * (enemy.allOutTriggered ? 1.10 : 1);
}
function attackMultiplier(enemy, now) {
  return (now < (enemy.warDrumUntil || 0) ? 1.08 : 1) * (enemy.allOutTriggered ? 1.12 : 1);
}
function defenseMultiplier(enemy) { return enemy.allOutTriggered ? .90 : 1; }
function frontlineMultiplier(enemy, enemies) {
  return enemy.rank === 'normal' && enemies.some(other => other.currentHp > 0 && other.frontline) ? 1.06 : 1;
}
function castWarDrum(enemies, now) {
  for (const enemy of enemies) if (enemy.currentHp > 0) enemy.warDrumUntil = now + 5;
}
function hunterBasicBonus(enemy, target, usedSkill) {
  if (!enemy.focusedBasics) return 1;
  if (enemy.focusTarget !== target || !enemy.focusTarget?.alive) { enemy.focusTarget = target; enemy.focusHits = 0; }
  return !usedSkill && enemy.focusHits === 3 ? 1.20 : 1;
}
function recordHunterHit(enemy, target, usedSkill) {
  if (!enemy.focusedBasics) return;
  if (!usedSkill) enemy.focusHits = enemy.focusHits === 3 ? 0 : (enemy.focusHits || 0) + 1;
  if (target.hp <= 0) { enemy.focusTarget = null; enemy.focusHits = 0; }
}
module.exports = { normals, elite, boss, updateAllOut, speedMultiplier, attackMultiplier, defenseMultiplier, frontlineMultiplier, castWarDrum, hunterBasicBonus, recordHunterHit };
