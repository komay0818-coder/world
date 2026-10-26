'use strict';
const assert=require('node:assert/strict'),E=require('../party-experience-policy'),Exp=require('../map-exp-policy'),P=require('../permanent-party-policy'),O=require('../permanent-online-policy'),R=require('../permanent-party-runtime'),Fixture=require('../tools/permanent-party-fixture'),{loadGame}=require('../tools/headless-game-runtime');
let checks=0;const equal=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const map={chapter:3,recommendedMaxLevel:45},members=[{id:'a',level:45,alive:true,currentHp:100},{id:'b',level:48,alive:true,currentHp:100},{id:'c',level:51,alive:true,currentHp:100}];
equal(E.distribute(90,members,map).map(x=>x.actualExp),[30,21,12],'split before individual decay');
equal(E.distribute(90,[...members].reverse(),map),E.distribute(90,members,map),'party order independent');
equal(E.distribute(90,[members[0],{...members[1],alive:false,currentHp:0},members[2]],map).map(x=>x.actualExp),[45,18],'dead excluded from divisor');
equal(E.distribute(90,[members[0]],map)[0].actualExp,90,'solo full base');
equal(E.distribute(90,members.slice(0,2),map).map(x=>x.actualExp),[45,31.5],'two members');
equal(E.distribute(1,members.map(x=>({...x,level:45})),map).map(x=>x.actualExp),[.33,.33,.33],'round only final gain');
equal(E.distribute(90,members.map(x=>({...x,alive:false})),map),[],'no alive recipients');
equal(E.distribute(0,members,map).map(x=>x.actualExp),[0,0,0],'no invented experience');
assert.throws(()=>E.distribute(90,[members[0],members[0]],map));checks++;
function setup(sharedGold=false){const raw=Fixture.create();let model=O.compactModel(P.migrate(raw));if(sharedGold)model=P.migrateSharedGold(model).model;const ids=model.slotOrder;
 for(const id of ids){model.characters[id].progress.level=20;model.characters[id].progress.xp=Exp.requiredXp(20)-1;}
 const fourth='character-fourth-experience';const next=P.apply(model,{type:'create',id:fourth,slotIndex:3,character:{...raw.slots[0].character,id:fourth},progress:{...O.copy(model.characters[ids[0]].progress),equipment:{}}});
 let saved={id:'experience-test',revision:0,permanent:next},writes=0,fail=false;
 const store={read:async()=>O.copy(saved),commitOnline:async(id,revision,key,model)=>{if(fail)throw Error('Injected failure');if(revision!==saved.revision)throw Error('Concurrent save conflict');saved={...saved,revision:revision+1,permanent:O.copy(model)};writes++;return {account:O.copy(saved)};}};
 return {rt:R.create({store,account:O.copy(saved)}),store,ids,fourth,saved:()=>O.copy(saved),writes:()=>writes,fail:()=>fail=true};
}
function reward(a,session='battle',spawnedAt=100,overrides={}){const event={sessionId:session,index:0,spawnedAt,baseXp:90,map:{chapter:2,recommendedMaxLevel:30},members:a.ids.map(id=>({id,alive:true,currentHp:100})),...overrides};const p=a.rt.getProgress(),main=E.distribute(event.baseXp,event.members.map(x=>({...x,level:a.rt.model.characters[x.id].progress.level})),event.map).find(x=>x.id===a.rt.mainId);Object.assign(p,E.grow(p,main.actualExp));p.gold+=3;return a.rt.saveExperienceReward(p,event);}
(async()=>{
 const a=setup();a.rt.beginExperienceBattle('battle');await a.rt.flush();const before=a.saved(),count=a.writes(),fourth=O.copy(before.permanent.characters[a.fourth]);
 const result=reward(a);equal(result.awards.length,3,'three separate awards');await result.saved;equal(a.writes(),count+1,'all gains loot and receipt in one transaction');
 for(const id of a.ids){equal(a.saved().permanent.characters[id].progress.level,21,'independent level '+id);equal(a.saved().permanent.characters[id].progress.xp,29,'independent XP '+id);}
 equal(a.saved().permanent.characters[a.fourth],fourth,'fourth not in party unchanged');equal(a.rt.canRewardExperience('battle',0,100),false,'persistent receipt blocks repeat');equal(reward(a).duplicate,true,'repeat grants neither XP nor gold');equal(a.writes(),count+1,'repeat no write');
 const reopened=R.create({store:a.store,account:await a.store.read()});equal(reopened.canRewardExperience('battle',0,100),false,'reload duplicate blocked');
 for(const id of a.ids){equal(reopened.getProgress(id).level,21,'reload retains level '+id);equal(reopened.getProgress(id).xp,29,'reload retains XP '+id);}
 reopened.beginExperienceBattle('battle');await reopened.flush();equal(reopened.canRewardExperience('battle',0,100),false,'same session restart cannot erase receipt');
 a.rt.command({type:'leave',mainId:a.ids[0],characterId:a.ids[1]});await a.rt.flush();const retained=a.rt.getProgress(a.ids[1]);a.rt.command({type:'recruit',mainId:a.ids[0],characterId:a.ids[1]});await a.rt.flush();equal(a.rt.getProgress(a.ids[1]).xp,retained.xp,'recruit retains XP');equal(a.rt.getProgress(a.ids[1]).level,retained.level,'recruit retains level');
 await a.rt.switchMain(a.ids[1]);equal(a.rt.getProgress().xp,29,'switch keeps growth');await a.rt.switchMain(a.ids[0]);a.rt.beginExperienceBattle('next');await a.rt.flush();equal(a.rt.canRewardExperience('battle',0,200),false,'old callback after new battle rejected');
 const b=setup();b.rt.beginExperienceBattle('battle');await b.rt.flush();const dead=b.ids[1],state=O.copy(b.rt.model.characters[dead]);await reward(b,'battle',100,{members:b.ids.map(id=>({id,alive:id!==dead,currentHp:id===dead?0:100}))}).saved;equal(b.rt.model.characters[dead],state,'dead receives no growth');equal(b.rt.getProgress().xp,44,'survivors divide by two');
 const c=setup();c.rt.beginExperienceBattle('battle');await c.rt.flush();const original=c.saved();c.fail();const failed=reward(c);await assert.rejects(failed.saved,/Injected/);checks++;equal(c.saved(),original,'save failure leaves all characters bag and receipt unchanged');equal(c.rt.canRewardExperience('battle',0,100),true,'failed transaction does not claim durable receipt');
 const d=setup();d.rt.beginExperienceBattle('battle');await d.rt.flush();const stale=R.create({store:d.store,account:await d.store.read()});await reward(d).saved;await assert.rejects(reward({...d,rt:stale}).saved,/Concurrent/);checks++;equal(d.rt.getProgress().xp,29,'multitab one winner');
 const outsider=setup();outsider.rt.beginExperienceBattle('battle');await outsider.rt.flush();assert.throws(()=>outsider.rt.saveExperienceReward(outsider.rt.getProgress(),{sessionId:'battle',index:0,spawnedAt:100,baseXp:90,map,members:[{id:outsider.ids[0],alive:true,currentHp:10},{id:outsider.fourth,alive:true,currentHp:10}]}),/identity mismatch/);checks++;
 const game=loadGame();game.context.PermanentPartyRuntime={current:a.rt};game.context.liveProgress=a.rt.getProgress(a.ids[1]);game.context.liveCharacter=a.rt.model.characters[a.ids[1]].character;
 game.evaluate("battle.partyMembers=[createBattlePartyMember({character:liveCharacter,progress:liveProgress},1,'other',0)];battle.partyMembers[0].shield=17;battle.partyMembers[0].skillCooldowns={test:12345};battle.partyMembers[0].currentHp=40;syncMainBattleMemberProgression(liveCharacter,liveProgress,battle.partyMembers[0]);");
 equal(game.evaluate('battle.partyMembers[0].level'),21,'teammate live level updated');equal(game.evaluate('battle.partyMembers[0].shield'),17,'leveling preserves shield');equal(game.evaluate('battle.partyMembers[0].currentHp'),40,'leveling no free heal');equal(game.evaluate('battle.partyMembers[0].skillCooldowns.test'),12345,'leveling preserves cooldown');
 const live=setup(true),combat=loadGame(),goldBefore=live.rt.getSharedGold();combat.context.PermanentPartyRuntime={current:live.rt};live.rt.beginExperienceBattle('actual-kill');await live.rt.flush();
 combat.evaluate("fighting=true;battle={experienceSessionId:'actual-kill',sessionId:123,enemyTypes:['plainsRabbit'],enemyHps:[0],enemyLevels:[1],enemyAffixes:[[]],enemySpawnedAt:[100],partyMembers:buildBattlePartyMembers(0),roundLoot:{}};getEnemyDefinition=()=>({id:'plainsRabbit',name:'驗收怪物',mapId:'plains-entrance',xp:90,gold:10});");
 combat.evaluate('rewardVictory(0)');await live.rt.flush();
 for(const id of live.ids)equal(live.rt.getProgress(id).xp,.5,'real reward entry gives personal experience '+id);
 equal(live.rt.getSharedGold(),goldBefore+5,'real reward entry credits authoritative shared gold with loot and experience');
 const awarded=live.saved();combat.evaluate('battle.rewardedEnemyIndexes=new Set();rewardVictory(0)');await live.rt.flush();equal(live.saved(),awarded,'real callback replay blocked even if memory reward set lost');
 console.log('Party experience: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});

