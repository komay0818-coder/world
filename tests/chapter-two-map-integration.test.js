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
assert.match(index, /VER\. 0\.2\.0/, 'second chapter foundation increments the minor version');
assert.match(index, /black-forest-structure-v124/, 'main script cache key identifies this update');
assert.match(script, /\.\.\.ChapterTwoMapPolicy\.MAPS/, 'chapter-two maps join the shared progression data');
assert.match(script, /previousMapId: 'plains-depths'/, 'chapter two connects from the first chapter finale');
assert.match(script, /function renderBlackForestRegions\(/, 'black forest has a chapter region view');
assert.match(blackForestRenderer, /ChapterTwoMapPolicy\.getDungeon\(region\.id\)/, 'the stronghold preview reads the dungeon foundation');
assert.match(blackForestRenderer, /<em>規劃中<\/em>/, 'unfinished maps are visibly marked as planned');
assert.doesNotMatch(blackForestRenderer, /data-select-map=/, 'planned chapter-two cards do not expose entry controls');
assert.match(script, /if \(regionHubButton\.dataset\.openMapRegion === 'black-forest'\) renderBlackForestRegions\(\)/,
  'the shared region action opens the second chapter view');

console.log('chapter-two-map-integration: assertions passed');
