const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

const defeatFlow = script.match(/function endBattleAfterPlayerDefeat\([\s\S]*?\n}\n\nfunction defeatPartyMember/)?.[0] || '';
assert.match(defeatFlow, /battle\.defeatHandled/, 'defeat handling is idempotent');
assert.match(defeatFlow, /fighting = false;[\s\S]*clearInterval\(battleTimer\)[\s\S]*clearInterval\(skillTimer\)[\s\S]*clearInterval\(enemyAttackTimer\)/, 'all online combat loops stop immediately');
assert.match(defeatFlow, /battle\.sessionId = \+\+battleSessionSequence/, 'delayed wave and dungeon callbacks are invalidated');
assert.match(defeatFlow, /requiresMapSelectionAfterDefeat = true/, 'defeat requires an explicit map selection before the next battle');
assert.match(defeatFlow, /persistPartyRuntimeState\(\)[\s\S]*saveProgress\(progress\)/, 'earned progress is preserved while restored combat state is saved');
assert.match(defeatFlow, /openVillage\('menu'\)[\s\S]*角色已戰敗，本次掛機已結束。/, 'the player returns to the village with the defeat notice');

assert.match(script, /if \(!member\.isMain && member\.character\.race === 'undead'/, 'the main character cannot auto-revive after reaching zero HP');
assert.match(script, /if \(member\.isMain\) endBattleAfterPlayerDefeat\(now\)/, 'main-character death enters the shared defeat flow');
assert.match(script, /adventure-button[\s\S]*requiresMapSelectionAfterDefeat[\s\S]*renderMapSelector\(\)/, 'adventure opens map selection after a defeat');
assert.match(script, /progress\.requiresMapSelectionAfterDefeat = false;[\s\S]*saveProgress\(progress\)/, 'choosing a map clears the defeat gate');
