const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'map-travel-panel.css'), 'utf8');

assert.match(html, /id="adventure-region-select"[\s\S]*id="adventure-map-select"[\s\S]*id="battle-title"[\s\S]*id="map-travel-button"/, 'the left rail exposes area, map, current location, and travel controls in order');
assert.match(html, /script\.js\?v=20261029-chapter-one-offhand-drops-v1/, 'the interactive map controls load current combat fixes with a fresh cache key');
assert.match(html, /map-travel-panel\.css\?v=20261011-map-list-visibility-v1/, 'the custom map selector styles use a fresh cache key');
assert.match(source, /adventureAreaDefinitions[\s\S]*name: '平原'[\s\S]*name: '黑森林'[\s\S]*name: '赤岩荒原'/, 'the three requested adventure areas are available');
assert.match(source, /function getAdventureAreaMaps[\s\S]*mapProgression\.filter/, 'the second selector derives its maps from the existing map progression data');
assert.match(source, /id: 'goblin-camp',[^\n]*regionOf: 'beginner-plains'[^\n]*name: '哥布林營地'/, 'the plains map list includes Goblin Camp');
assert.match(source, /function getAdventureMapAvailability[\s\S]*ChapterOneProgressionPolicy\.isUnlocked[\s\S]*ChapterTwoProgressionPolicy\.canEnter[\s\S]*ChapterThreeProgressionPolicy\.canEnter/, 'existing unlock policies remain authoritative');
assert.match(source, /function isMapTravelPlaytestMode\(\)[\s\S]*has\('playtest'\)/, 'unrestricted travel is explicitly scoped to playtest URLs');
assert.doesNotMatch(source, /function updateBattleUI\(\) \{[\s\S]{0,400}if \(mapSelectInteractionActive\) return;/, 'an open map listbox cannot freeze monster rendering while combat and rewards continue');
assert.match(source, /initializeAdventureCustomSelect/, 'map selectors use the responsive in-page listbox control');
assert.doesNotMatch(source, /function beginMapSelectInteraction[\s\S]{0,300}clearInterval\(/, 'map interaction never pauses combat timers');
assert.match(source, /function endMapSelectInteraction[\s\S]*if \(fighting\) updateBattleUI\(\)/, 'the battlefield refreshes after map interaction without creating duplicate timers');
assert.match(source, /function getAdventureMapAvailability[\s\S]*isMapTravelPlaytestMode\(\)[\s\S]*return \{ unlocked: true/, 'playtest exposes every implemented map in both selectors');
assert.match(source, /function selectAdventureMap[\s\S]*unrestrictedPlaytestTravel[\s\S]*!unrestrictedPlaytestTravel && map\.chapter === 1[\s\S]*!unrestrictedPlaytestTravel && map\.chapter === 2[\s\S]*!unrestrictedPlaytestTravel && map\.chapter === 3/, 'formal unlock guards remain active outside playtest');
assert.match(source, /if \(!unrestrictedPlaytestTravel\) progress\.unlockedChapter = Math\.max/, 'playtest travel does not write formal chapter unlock progress');
assert.match(source, /async function selectAdventureMap[\s\S]*mapTravelInProgress = true[\s\S]*clearInterval\(battleTimer\)[\s\S]*await runtime\.flush\(\)[\s\S]*await Promise\.resolve\(persistPartyRuntimeState\(\)\)[\s\S]*await Promise\.resolve\(saveProgress\(progress\)\)[\s\S]*openBattle\(\)/, 'travel stops combat, waits for the current transaction, persists battle state, and only opens the new map after its save succeeds');
assert.match(source, /catch \(error\)[\s\S]*無法前往地圖[\s\S]*if \(wasFighting && isPermanentGameplayReady\(\)\) openBattle\(\)/, 'a failed travel save reports the error and resumes the previous battle');
assert.match(source, /function persistPartyRuntimeState\(\)[\s\S]*return saveProgress\(mainProgress\)/, 'battle-state persistence exposes its save promise to callers');
assert.match(source, /selectingCurrentMapAfterDefeat[\s\S]*progress\.requiresMapSelectionAfterDefeat[\s\S]*!selectingCurrentMapAfterDefeat[\s\S]*return/, 'the current location cannot be restarted through ordinary travel but can be re-entered after defeat');
assert.match(source, /mapTravelInProgress = true[\s\S]*window\.setTimeout\(\(\) => \{[\s\S]*mapTravelInProgress = false/, 'rapid travel clicks are guarded during reinitialization');
assert.match(css, /\.map-travel-panel[\s\S]*border:\s*1px solid rgba\(202, 161, 74, \.5\)[\s\S]*background:\s*rgba\(4, 20, 29, \.88\)/, 'the selector uses the requested dark blue-black and restrained gold treatment');
assert.match(css, /\.map-travel-panel\s*\{[\s\S]*?width:\s*100%/, 'the map panel stays within the existing left-column width');
assert.match(css, /\.map-select-options button:hover[\s\S]*background:\s*rgba\(202, 161, 74, \.3\)/, 'custom options use immediate CSS-only hover highlighting');
assert.match(css, /#battle-screen \.map-select-control\.is-open \.map-select-options\s*\{[\s\S]*?display:\s*grid/, 'the open-state selector outranks the default hidden state');
assert.match(css, /\.map-select-options\s*\{[\s\S]*?max-height:[^;]+;[\s\S]*?overflow-y:\s*auto/, 'long map lists remain vertically scrollable');
assert.match(css, /\.battle-header:has\(\.map-select-control\.is-open\)[\s\S]*?z-index:\s*90[^;]*;[\s\S]*?overflow:\s*visible/, 'an open map list stays above the suppression panel');

console.log('map-travel-panel: assertions passed');
