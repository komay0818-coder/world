const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const renderer = script.slice(script.indexOf('function renderBlackForestRegions()'), script.indexOf('function selectAllCommonEquipment'));

assert.match(index, /chapter-two-progression-policy\.js[\s\S]*script\.js/);
assert.match(script, /chapterTwoProgress: ChapterTwoProgressionPolicy\.createDefaultState\(\)/);
assert.match(script, /ChapterTwoProgressionPolicy\.normalize\(normalizedProgress\)/);
assert.match(script, /ChapterTwoProgressionPolicy\.recordBossKill\(progress, currentMap\.id, enemy\)/);
assert.match(script, /ChapterTwoProgressionPolicy\.canEnter\(progress, map\.id, map\.implemented\)/);
assert.match(renderer, /ChapterTwoProgressionPolicy\.MAP_ORDER/);
assert.match(renderer, /String\(index \+ 1\)\.padStart\(2, '0'\)/, 'the corrected progression order supplies the 2-1 through 2-6 UI numbering');
assert.match(renderer, /data-select-map=/);
assert.match(renderer, /尚未解鎖/);
assert.match(renderer, /規劃中／尚未開放/);
assert.doesNotMatch(renderer, /map-region-card pending locked \$\{region\.dungeon/);
console.log('chapter-two-progression-integration: assertions passed');
