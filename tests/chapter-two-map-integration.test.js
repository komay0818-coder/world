const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const rendererStart = script.indexOf('function renderBlackForestRegions()');
const rendererEnd = script.indexOf('function selectAllCommonEquipment', rendererStart);
const blackForestRenderer = rendererStart >= 0 && rendererEnd > rendererStart ? script.slice(rendererStart, rendererEnd) : '';

assert.match(index, /chapter-two-map-policy\.js[\s\S]*script\.js/, 'chapter-two data loads before the game');
assert.match(index, /black-forest-corruption-policy\.js[\s\S]*blackstone-stronghold-policy\.js[\s\S]*black-forest-depths-policy\.js[\s\S]*chapter-two-map-policy\.js/);
assert.match(index, /black-forest-entrance-policy\.js[\s\S]*chapter-two-map-policy\.js/);
assert.match(index, /VER\. 0\.4\.8/);
assert.match(index, /VER\. \d+\.\d+\.\d+/, 'the game exposes a semantic version');
assert.match(script, /\.\.\.ChapterTwoMapPolicy\.MAPS/, 'chapter-two maps join the shared progression data');
assert.match(script, /blackForestCorruption: BlackForestCorruptionPolicy\.normalizeState\(saved\.blackForestCorruption\)/);
assert.match(script, /if \(map\.chapter === 2\) BlackForestCorruptionPolicy\.enterChapter\(progress\)/);
assert.match(script, /BlackForestCorruptionPolicy\.applyCombatStats\(stats, progress\.blackForestCorruption, activeMap\.chapter === 2\)/);
assert.match(script, /BlackForestDepthsPolicy\.applyDenseFogAccuracy\(corruptedStats\.accuracy, activeMap\.id\)/);
assert.match(script, /function processBlackForestCorruption\(now = Date\.now\(\)\)[\s\S]*BlackForestCorruptionPolicy\.getHpLoss/);
assert.match(script, /processBlackForestCorruption\(now\)/);
assert.match(script, /previousMapId: 'plains-depths'/, 'chapter two connects from the first chapter finale');
assert.match(script, /function renderBlackForestRegions\(/, 'black forest has a chapter region view');
assert.match(blackForestRenderer, /ChapterTwoMapPolicy\.getDungeon\(region\.id\)/, 'the stronghold preview reads the dungeon foundation');
assert.match(blackForestRenderer, /<em>規劃中<\/em>/, 'unfinished maps are visibly marked as planned');
assert.doesNotMatch(blackForestRenderer, /data-select-map=/, 'planned chapter-two cards do not expose entry controls');
assert.match(script, /if \(regionHubButton\.dataset\.openMapRegion === 'black-forest'\) renderBlackForestRegions\(\)/,
  'the shared region action opens the second chapter view');

console.log('chapter-two-map-integration: assertions passed');
