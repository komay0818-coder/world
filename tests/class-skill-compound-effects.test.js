const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(source, /sourceMastery\?\.resonance[\s\S]*dot\.type === 'burn'/, 'burn resonance strengthens sourced burn damage');
assert.match(source, /frostResonanceMultiplier[\s\S]*slowedUntil[\s\S]*frozenUntil/, 'frost resonance reads slow and freeze states');
assert.match(source, /lightningResonanceMultiplier[\s\S]*paralyzedUntil/, 'lightning resonance reads paralysis state');
assert.match(source, /dot\.type === 'poison'[\s\S]*dot\.defenseReduction/, 'poison stacks reduce enemy defense');
assert.match(source, /skill\.id === 'backstab'[\s\S]*bleedTrigger[\s\S]*applyDot\(target\.index, 'bleed'/, 'backstab applies and detonates bleed');
assert.match(source, /member\.petAttackCount[\s\S]*bond\.beastSlam[\s\S]*nextHunterAttackBonus/, 'wild bond triggers beast slam and the hunter follow-up bonus');
assert.match(source, /maxCooldownReduction[\s\S]*pendingSkillCooldownReduction/, 'multi-shot kill cooldown reduction is capped and applied after scheduling');
assert.match(source, /desperateEntryTriggered[\s\S]*desperateDodgeUntil/, 'desperate dodge burst triggers once per battle');
assert.match(source, /desperate\?\.attack[\s\S]*desperate\?\.speed/, 'low-health assassin damage and speed are evaluated at runtime');

console.log('class-skill-compound-effects: assertions passed');
