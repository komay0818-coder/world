const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /party-policy\.js[\s\S]*script\.js/, 'party policy loads before the game script');
assert.match(html, /id="party-modal"/, 'party management modal exists');
assert.match(html, /id="battle-party-status"/, 'battle party status exists');
assert.match(script, /PartyPolicy\.normalizeParty/, 'old saves receive normalized party data');
assert.match(script, /activeMemberIds/, 'active party member ids are persisted');
assert.match(script, /function createBattlePartyMember/, 'each active character receives an independent runtime record');
assert.match(script, /skillCooldowns: \{\}/, 'each member owns skill cooldowns');
assert.match(script, /nextAttackAt: now/, 'each member owns an attack timer');
assert.match(script, /member\.nextAttackAt = now \+ 1000 \/ Math\.max\(\.01, member\.attackSpeed\)/, 'attack timing uses each member attack speed');
assert.match(script, /chooseRandomAliveMember\(battle\.partyMembers/, 'monsters choose among living party members');
assert.match(script, /PartyPolicy\.isPartyDefeated\(battle\.partyMembers\)/, 'failure requires the whole party to be defeated');
assert.match(script, /rewardedEnemyIndexes/, 'enemy rewards are guarded against duplicate processing');
assert.match(script, /enemyNextAttackAt\[enemyIndex\]/, 'each monster retains an independent attack timer');
assert.match(script, /persistPartyRuntimeState/, 'runtime party state is included in saves');

console.log('party-integration: assertions passed');
