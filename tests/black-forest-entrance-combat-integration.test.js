const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../black-forest-entrance-policy.js');
const progression = require('../chapter-two-progression-policy.js');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const basicStart = script.indexOf('function processPartyMemberAttacks');
const basicEnd = script.indexOf('function processHunterCompanionAttacks', basicStart);
const basicFlow = script.slice(basicStart, basicEnd);
const skillStart = script.indexOf('function useAutoSkillForMember');
const skillEnd = script.indexOf('function autoSkillTick', skillStart);
const skillFlow = script.slice(skillStart, skillEnd);
const stormStart = script.indexOf('function resolveBlackForestLeafStorm');
const stormEnd = script.indexOf('function enemyAttackTick', stormStart);
const stormFlow = script.slice(stormStart, stormEnd);

policy.MONSTERS.forEach((monster) => {
  const combatMonster = policy.getCombatMonster(monster.combatId);
  assert.ok(combatMonster && combatMonster.maxHp > 0 && combatMonster.attack > 0, monster.name + ' can enter formal combat');
});
assert.equal(policy.resolveAction('blackForestWolf', 0), 'shadow-bite');
assert.equal(policy.resolveAction('corruptedBoar', 0), 'charge');
assert.equal(policy.resolveAction('shadowSpider', 0), 'venom-fang');
assert.equal(policy.resolveAction('witheredTreeWalker', 0), 'entangling-roots');
assert.equal(policy.resolveAction('blackForestHunter', 0, 1), 'binding-arrow');
assert.equal(policy.resolveAction('forestGuardianV2', 0, 1, 1400, 2100), 'leaf-storm');

assert.equal(policy.BINDING_ARROW.durationMs, 2000);
const member = { alive: true, currentHp: 100, boundUntil: 0 };
assert.equal(policy.applyBindingArrow(member, 1000), true);
assert.equal(member.boundUntil, 3000);
assert.equal(policy.isBound(member, 2999), true);
assert.equal(policy.isBound(member, 3000), false);
policy.applyBindingArrow(member, 2000);
assert.equal(member.boundUntil, 4000, 'a repeated hit refreshes instead of stacking the prior duration');
policy.clearBinding(member);
assert.equal(member.boundUntil, 0);
assert.match(basicFlow, /BlackForestEntrancePolicy\.isBound\(member, now\)\) continue/, 'binding blocks basic attacks');
assert.doesNotMatch(skillFlow, /isBound|boundUntil/, 'binding does not block active or passive skill processing');
assert.ok((script.match(/BlackForestEntrancePolicy\.clearBinding\(member\)/g) || []).length >= 4, 'death, defeat, revive, and reset paths clear binding');

assert.match(script, /blackForestAction === 'leaf-storm'[\s\S]*resolveBlackForestLeafStorm\(enemy, enemyCurrentHp, now\)[\s\S]*continue;/);
assert.match(stormFlow, /filter\(\(member\) => member\.alive && member\.currentHp > 0\)/, 'leaf storm selects every living party member');
assert.match(stormFlow, /stormMultiplier/, 'leaf storm retains the fixed 60% multiplier');
assert.match(stormFlow, /MonsterDefense\.resolvePlayerDamage/, 'each target uses normal defense and reduction calculation');
assert.match(stormFlow, /for \(const target of targets\)/, 'each living target is resolved independently');
assert.doesNotMatch(stormFlow, /applyDot|inflict|Debuff/, 'leaf storm adds no damage over time or debuff');

const progress = { unlockedChapter: 2, chapterTwoProgress: progression.createDefaultState() };
progression.normalize(progress);
progress.chapterTwoProgress.unlocked['black-forest-entrance'] = true;
const entranceClear = progression.recordBossKill(progress, 'black-forest-entrance', { id: 'forestGuardianV2', isBoss: true });
assert.equal(entranceClear.firstClear, true);
assert.equal(entranceClear.nextMapId, 'blackstone-stronghold');
assert.equal(progress.chapterTwoProgress.cleared['black-forest-entrance'], true);
assert.equal(progress.chapterTwoProgress.unlocked['blackstone-stronghold'], true);
assert.equal(progression.recordBossKill(progress, 'black-forest-entrance', { id: 'forestGuardianV2', isBoss: true }).firstClear, false);

console.log('black-forest-entrance-combat-integration: assertions passed');
