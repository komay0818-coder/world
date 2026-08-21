const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(index, /chapter-one-progression-policy\.js[\s\S]*script\.js/, 'progression policy loads before the game');
assert.match(script, /ChapterOneProgressionPolicy\.recordNormalKill\(progress, activeMap\.id\)/, 'offline normal kills count for the active map');
assert.match(script, /ChapterOneProgressionPolicy\.recordBossKill\(progress, currentMap\.id, enemy\)/, 'online boss victories are recorded');
assert.match(script, /ChapterOneProgressionPolicy\.isUnlocked\(progress, map\.id\)/, 'map entry checks persisted unlock state');
assert.match(script, /區域壓制：[\s\S]*Boss（\$\{condition\.requirement\.bossName\}）：/, 'locked map UI shows kill and boss requirements');
