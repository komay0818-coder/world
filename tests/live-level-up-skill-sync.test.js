const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(source, /function syncMainBattleMemberProgression\(character, progress\)[\s\S]*?main\.level = progress\.level;/, 'live battle member level is refreshed after leveling');
assert.match(source, /syncMainBattleMemberProgression[\s\S]*?main\.stats = stats;[\s\S]*?main\.resourceMax = maxResource;/, 'live battle stats and resource cap are refreshed with the new level');
assert.match(source, /const levelBeforeRewards = progress\.level;[\s\S]*?if \(progress\.level !== levelBeforeRewards\) syncMainBattleMemberProgression\(getActiveCharacter\(\), progress\);/, 'reward level-ups immediately synchronize the active battle member');

console.log('live-level-up-skill-sync: assertions passed');
