'use strict';
const assert=require('node:assert/strict'),{loadGame}=require('../tools/headless-game-runtime');
for(let area=31;area<=36;area++){
 const g=loadGame();g.evaluate(`requestAnimationFrame=()=>0;window.location={hostname:'localhost',pathname:'/',search:'?playtest=chapter-three-${area}&facility=armory&immortal=1',href:'http://localhost/'};Math.random=()=>.5;openBattle();var member=getMainBattleMember();member.currentHp=0;defeatPartyMember(member);`);
 assert.equal(g.evaluate('member.alive'),true);assert.equal(g.evaluate('member.currentHp'),1);assert.equal(g.evaluate('fighting'),true);
 assert.equal(g.evaluate('battle.enemyTypes.filter(ChapterThreeFacilityPolicy.facilityId).length'),1);
 assert.ok(g.evaluate(`var index=battle.enemyTypes.findIndex(ChapterThreeFacilityPolicy.facilityId);applyDamageToMonster(index,200,{damageType:'physical',attackRange:'ranged'},{attacker:member,canEvade:false,canParry:false}).finalDamage`)>0);
 g.evaluate(`window.location.hostname='example.com';member.currentHp=0;openVillage=()=>{};defeatPartyMember(member);`);assert.equal(g.evaluate('fighting'),false,'immortality must not apply outside dev preview');
}
console.log('chapter-three-facility-immortal-preview: assertions passed');
