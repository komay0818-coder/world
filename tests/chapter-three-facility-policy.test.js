'use strict';const assert=require('node:assert/strict'),F=require('../chapter-three-facility-policy');
for(const [map,c] of Object.entries(F.CONFIG)){const p={};F.normalize(p);assert.deepEqual(F.effects(p,map),{drain:c.drain,damage:1-c.penalty,defense:1-c.penalty});
for(const id of F.TYPES){const d=F.definition('facility:'+id,map);assert.equal(d.maxHp,c.hp);assert.equal(d.defense,c.defense);assert.equal(d.attack,0);assert.equal(d.evasion+d.parry+d.damageReduction,0);}
p.chapterThreeFacilities[map]={...p.chapterThreeFacilities[map],'supply-station':c.required};assert.equal(F.effects(p,map).drain,0);assert.equal(F.effects(p,map).damage,1-c.penalty);assert.deepEqual(F.pool(p,map),['armory','shaman-altar']);
p.chapterThreeFacilities[map]={...p.chapterThreeFacilities[map],armory:c.required+3,'shaman-altar':c.required};assert.deepEqual(F.effects(p,map),{drain:0,damage:1,defense:1});assert.deepEqual(F.pool(p,map),F.TYPES);
const gold=p.gold||0;const r=F.destroy(p,map,'armory',{recipeRandom:()=>0,fragmentRandom:()=>0});assert.equal(p.gold,gold+c.gold);assert.equal(r.recipeDrops.length,1);assert.equal(r.fragmentDrops.length,1);assert.equal(p.chapterThreeFacilities[map].armory,c.required+4);assert.deepEqual(F.effects(p,map),{drain:0,damage:1,defense:1});}
const map='skullcrusher-war-camp',resolve=id=>({isBoss:id==='boss',isElite:id==='elite'});let state=F.wave(),p={};
let randomCalls=0;const random=()=>{randomCalls++;return 0;};
assert.equal(F.replacement('boss',p,map,state,false,resolve,random),'boss');assert.equal(F.replacement('elite',p,map,state,false,resolve,random),'elite');assert.equal(F.replacement('normal',p,map,state,false,resolve,random),'facility:supply-station');assert.equal(F.replacement('normal',p,map,state,true,resolve,random),'normal');assert.equal(state.position,0);assert.equal(randomCalls,2,'one chance roll and one type roll per successful logical wave');
state=F.wave();for(let i=0;i<4;i++)assert.equal(F.replacement('normal',p,map,state,true,resolve,()=>0),'normal');
state=F.wave();for(let i=0;i<4;i++)assert.equal(F.replacement('normal',p,map,state,false,resolve,()=>.1),'normal');
assert.equal(F.opening(['boss','normal','elite','normal'],p,map,resolve,()=>0).filter(F.facilityId).length,1);
assert.equal(F.effects({},'plains-entrance').damage,1);assert.equal(F.facilityId('armory'),null);
console.log('chapter-three-facility-policy: assertions passed');
