const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'monster-slots.css'), 'utf8');

assert.match(html, /id="player-battle-stage"/, 'party players render on the battlefield');
assert.match(html, /id="battle-player-art" class="battle-player-art hidden"/, 'main player has a dedicated portrait node');
assert.match(script, /return battleCharacterArt\[`\$\{character\.race\}:\$\{character\.job\}`\] \|\| '';/, 'battle uses stable front character artwork');
assert.doesNotMatch(script, /assets\/character-actions/, 'legacy idle and attack action sheets are removed');
assert.doesNotMatch(script, /character-attack-effect|--attack-travel-x|--basic-lunge-x/, 'shared attack effects are removed');

assert.match(css, /--player-portrait-size: clamp\(64px, 7\.2vw, 92px\)/, 'desktop portraits use one compact size');
assert.match(css, /overflow: hidden !important;[\s\S]*?border: 3px solid #d9a93f !important;[\s\S]*?border-radius: 50% !important;/, 'player artwork is clipped inside a gold circle');
assert.match(css, /@keyframes playerBasicShake/, 'basic attacks shake the portrait');
assert.match(script, /const actionClass = kind === 'basic' \? 'is-attacking' : area \? 'is-area-skill' : 'is-target-skill'/, 'attack movement types are separate');
assert.match(script, /const target = document\.querySelector\(`#enemy-\$\{targetIndexes\[0\]\}`\)/, 'single-target movement follows the actual target');
assert.match(script, /targetRect \? targetRect\.left \+ targetRect\.width \* \.5/, 'single-target destination uses target position');
assert.match(script, /fieldRect\.left \+ fieldRect\.width \* \.5/, 'area skills use the battlefield center');
assert.match(script, /area: Number\(skillEffect\.targets \|\| skill\.targets \|\| 1\) > 1/, 'target count selects area movement');
assert.match(css, /@keyframes playerSkillTravel[\s\S]*?--skill-move-x[\s\S]*?--skill-move-y/, 'skills travel out and return');

assert.match(script, /class="enemy-unit monster-battle-slot visual-size-\$\{visualSize\}/, 'monsters keep full-body image slots');
assert.match(css, /monster-battle-slot\.elite,[\s\S]*?monster-battle-slot\.boss \{[\s\S]*?--unit-rank-scale: 1;/, 'elite and boss monsters are not enlarged');
assert.match(css, /monster-battle-slot\.elite \{[\s\S]*?174, 116, 255[\s\S]*?monster-battle-slot\.boss \{[\s\S]*?255, 194, 73/, 'rank auras remain distinct');
assert.match(css, /prefers-reduced-motion: reduce/, 'combat movement respects reduced-motion settings');

console.log('battlefield UI integration: assertions passed');
