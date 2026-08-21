const fs = require('node:fs');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const calls = script.match(/MapExpPolicy\.calculate\(/g) || [];
require('node:assert/strict').equal(calls.length, 2, 'online combat and offline idle rewards both use map EXP decay');
require('node:assert/strict').match(index, /map-exp-policy\.js[^]*script\.js/, 'EXP policy loads before the game');
