const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(index, /monster-defense\.js[\s\S]*offline-combat-policy\.js[\s\S]*script\.js/, 'offline simulation loads after the shared defense formula and before the game');
assert.match(script, /OfflineCombatPolicy\.simulate\(\{[\s\S]*durationMs: offlineMs[\s\S]*getOfflineCombatMonsters\(activeMap, progress\.level\)/, 'offline rewards use map monsters and current player stats');
assert.doesNotMatch(script.match(/function claimOfflineRewards\(\)[\s\S]*?\n}/)?.[0] || '', /killsPerMinute/, 'fixed offline kill speed is no longer the settlement source');
assert.match(script, /const defeated = simulation\.defeated[\s\S]*for \(let kill = 0; kill < defeated;/, 'only kills completed before death grant rewards and map progress');
assert.match(script, /simulation\.died[\s\S]*requiresMapSelectionAfterDefeat = true[\s\S]*openVillage\('menu'\)/, 'offline death restores the character, returns to village, and requires a new map choice');
assert.match(script, /formatOfflineDuration\(simulation\.effectiveMs\)/, 'the report displays effective time truncated at death');
