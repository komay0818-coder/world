const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /chapter-three-epic-weapon-policy\.js[\s\S]*pre-job-trial-policy\.js[\s\S]*script\.js/, 'trial policy loads after weapon cores and before integration');
assert.match(source, /function grantCraftingMaterialDrops[\s\S]*PreJobTrialPolicy\.grantMarkDrop\(progress, map\.id, enemy, options\)/, 'online and offline shared material rewards use the same mark drop policy');
assert.match(source, /function renderMapSelector[\s\S]*data-open-pre-job-trial[\s\S]*function renderPreJobTrialPanel/, 'the standalone trial has a visible map-selection entry and status panel');
assert.match(source, /function exchangePreJobTrialCores[\s\S]*PreJobTrialPolicy\.exchangeCores/, 'the player-selected five-for-one core exchange is wired to the shared policy');

console.log('pre-job-trial-integration: assertions passed');
