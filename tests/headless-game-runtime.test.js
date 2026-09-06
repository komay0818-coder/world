const assert=require('node:assert/strict');
const {loadGame}=require('../tools/headless-game-runtime.js');
const game=loadGame();
assert.equal(game.evaluate('typeof battleTick'),'function');
assert.equal(game.evaluate('typeof useAutoSkillForMember'),'function');
assert.equal(game.evaluate('typeof CombatCorePolicy.runPlayerTick'),'function');
console.log('headless-game-runtime: assertions passed');
