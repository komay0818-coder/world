const assert=require('node:assert/strict'); const fs=require('node:fs'); const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','script.js'),'utf8'); const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'); const base=fs.readFileSync(path.join(__dirname,'..','class-skill-policy.js'),'utf8');
assert.match(html,/mage-advancement-policy\.js[\s\S]*script\.js/);
assert.match(base,/elementalDamageTakenMultiplier: 2/);
assert.match(source,/job === 'mage'[\s\S]*MageAdvancementPolicy\.getSkills/);
assert.match(source,/\['fire', 'ice', 'lightning'\]\.includes\(profile\.element\)[\s\S]*\? 2 : 1/);
assert.match(source,/'arcane-missile': 'arcane'[\s\S]*'arcane-torrent': 'arcane'/);
assert.match(source,/MageAdvancementPolicy\.resolveKill/);
console.log('mage-advancement-integration: assertions passed');
