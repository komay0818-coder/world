'use strict';
const assert=require('node:assert/strict');
const Affixes=require('../equipment-affix-policy');
const Reforge=require('../equipment-reforge-policy');
const Policy=require('../permanent-party-policy');

function randomSource(seed){let value=seed>>>0;return()=>{value+=0x6D2B79F5;let result=value;result=Math.imul(result^result>>>15,result|1);result^=result+Math.imul(result^result>>>7,result|61);return((result^result>>>14)>>>0)/4294967296;};}
function sequence(...values){let index=0;return()=>values[Math.min(index++,values.length-1)];}
function equipment({chapter=1,quality='rare',uniqueId='test',allowedAffixIds,random=randomSource(20)}={}){
 const item=Affixes.createEquipmentInstance({id:'reforge-sword',kind:'equipment',slot:'weapon',allowedAffixIds,fixedAffixIds:[],affixRuleOverride:{fixedCount:0,randomCount:allowedAffixIds?.length===1?1:3}}, {chapter,quality,uniqueId,random});
 item.instanceId=item.id;return item;
}
function modelFor(item,{level=10,gold=10000,material=20}={}){
 let model=Policy.createEmptyModel();
 model=Policy.apply(model,{type:'create',id:'character-reforge',slotIndex:0,character:{id:'character-reforge',name:'重鑄測試者',job:'warrior'},progress:{level,xp:0,gold,equipment:{},skillLevels:{}}});
 model=Policy.apply(model,{type:'switch-main',characterId:'character-reforge'});
 model.accountResources.gold=gold;
 model.bag.items.push(item,{id:'green_essence_stone',kind:'material',quantity:material},{id:'blue_essence_stone',kind:'material',quantity:material});
 model.equipmentOwners[item.instanceId]={kind:'bag'};Policy.validate(model);return model;
}
function operation(item,type='type',slotKey='random-0'){return{type,instanceId:item.instanceId,slotKey,characterId:'character-reforge'};}

let checks=0;const check=(value,label)=>{assert(value,label);checks++;};
const sampleSize=100000,typeSamples={},valueSamples={};
for(const chapter of [1,2,3]){
 const candidates=Affixes.getAvailableAffixes({id:'sample',kind:'equipment',slot:'weapon',quality:'rare'},[],{chapter,quality:'rare'});
 const typeCounts={},typeRandom=randomSource(1000+chapter);
 for(let index=0;index<sampleSize;index++){const selected=Reforge.rollWeightedGrade(candidates,Reforge.TYPE_GRADE_WEIGHTS[chapter],typeRandom);typeCounts[Affixes.getAffixGrade(selected)]=(typeCounts[Affixes.getAffixGrade(selected)]||0)+1;}
 typeSamples[chapter]=Object.fromEntries(Object.entries(typeCounts).map(([grade,count])=>[grade,count/sampleSize]));
 for(const [grade,weight]of Object.entries(Reforge.TYPE_GRADE_WEIGHTS[chapter]))assert(Math.abs((typeCounts[grade]||0)/sampleSize-weight)<.01,`chapter ${chapter} type grade ${grade} probability`),checks++;
 const valueCounts={},valueRandom=randomSource(2000+chapter);
 for(let index=0;index<sampleSize;index++){const quality=Reforge.rollValueQuality(chapter,valueRandom);valueCounts[quality]=(valueCounts[quality]||0)+1;}
 valueSamples[chapter]=Object.fromEntries(Object.entries(valueCounts).map(([grade,count])=>[grade,count/sampleSize]));
 for(const [grade,weight]of Object.entries(Reforge.VALUE_QUALITY_WEIGHTS[chapter]))assert(Math.abs((valueCounts[grade]||0)/sampleSize-weight)<.01,`chapter ${chapter} value quality ${grade} probability`),checks++;
}

for(const [quality,[minimum,maximum]]of Object.entries(Reforge.VALUE_MULTIPLIERS)){
 assert.equal(Reforge.rollValueMultiplier(Number(quality),()=>0),minimum);checks++;
 check(Reforge.rollValueMultiplier(Number(quality),()=>.999999)>=maximum-.000001,`quality ${quality} reaches its upper boundary`);
}

const first=equipment({chapter:2,quality:'rare',uniqueId:'locking'}),firstModel=modelFor(first);
const initialOther=structuredClone(first.randomAffixes.slice(1));
const typeResult=Reforge.applyAccountReforge(firstModel,operation(first),Policy,{random:sequence(.99,.2)});
check(typeResult.model!==firstModel&&firstModel.reforgeState===undefined,'pure reforge does not mutate its source model');
assert.equal(typeResult.lockedTypeSlotKey,'random-0');checks++;
assert.equal(typeResult.affix.valueQuality,1);checks++;
assert.deepEqual(typeResult.model.bag.items.find(item=>item.instanceId===first.instanceId).randomAffixes.slice(1),initialOther);checks++;
assert.equal(typeResult.afterGold,typeResult.beforeGold-600);checks++;
assert.equal(typeResult.afterMaterial,typeResult.beforeMaterial-1);checks++;
assert.throws(()=>Reforge.applyAccountReforge(typeResult.model,operation(first,'type','random-1'),Policy,{random:()=>.1}),/permanently locked/);checks++;

const valueItem=equipment({chapter:3,quality:'rare',uniqueId:'value',allowedAffixIds:['critical_chance']});
const valueResult=Reforge.applyAccountReforge(modelFor(valueItem),operation(valueItem,'value'),Policy,{random:sequence(.999,.999)});
assert.equal(valueResult.affix.id,'critical_chance');checks++;
assert.equal(valueResult.affix.affixGrade,valueItem.randomAffixes[0].affixGrade);checks++;
assert.equal(valueResult.affix.valueQuality,4);checks++;
assert.equal(valueResult.affix.value,9.8);checks++;
assert.equal(valueResult.affix.components[0].value,9.8);checks++;
assert.equal(valueResult.afterGold,valueResult.beforeGold-600);checks++;

const compositeItem=equipment({chapter:2,quality:'rare',uniqueId:'composite',allowedAffixIds:['chapter2_berserker']});
const compositeResult=Reforge.applyAccountReforge(modelFor(compositeItem),operation(compositeItem,'value'),Policy,{random:sequence(.999,.999)});
assert.equal(compositeResult.affix.valueQuality,4);checks++;
assert.deepEqual(compositeResult.affix.components.map(entry=>entry.value),[6,7]);checks++;
assert.doesNotThrow(()=>Affixes.normalizeEquipment(compositeResult.model.bag.items.find(item=>item.instanceId===compositeItem.instanceId)));checks++;

const legacy=equipment({chapter:1,quality:'uncommon',uniqueId:'legacy',allowedAffixIds:['max_hp_flat']});
legacy.affixSchemaVersion=4;delete legacy.reforgeState;legacy.randomAffixes=legacy.randomAffixes.map(({slotKey,affixGrade,valueQuality,...entry})=>entry);legacy.affixes=[...legacy.fixedAffixes,...legacy.randomAffixes];
const legacyBefore=structuredClone(legacy);
const legacyResult=Reforge.applyAccountReforge(modelFor(legacy),operation(legacy,'value'),Policy,{random:sequence(0,0)});
assert.equal(legacy.affixSchemaVersion,4);checks++;
assert.deepEqual(legacy,legacyBefore);checks++;
assert.equal(legacyResult.convertedLegacy,true);checks++;
assert.equal(legacyResult.model.bag.items.find(item=>item.instanceId===legacy.instanceId).affixSchemaVersion,5);checks++;

for(const flag of ['locked','isLocked','protected','isProtected','favorite','isFavorite']){
 const blocked=equipment({uniqueId:'blocked-'+flag});blocked[flag]=true;
 const source=modelFor(blocked),before=JSON.stringify(source);
 assert.throws(()=>Reforge.applyAccountReforge(source,operation(blocked),Policy),/Protected/);checks++;
 assert.equal(JSON.stringify(source),before);checks++;
}
const lowLevel=equipment({uniqueId:'low-level'}),lowLevelModel=modelFor(lowLevel,{level:7});
assert.throws(()=>Reforge.applyAccountReforge(lowLevelModel,operation(lowLevel),Policy),/level 8/);checks++;
assert.throws(()=>Reforge.applyAccountReforge(modelFor(lowLevel,{level:9}),operation(lowLevel,'value'),Policy),/level 10/);checks++;
const poor=equipment({uniqueId:'poor'}),poorModel=modelFor(poor,{gold:0,material:0}),poorBefore=JSON.stringify(poorModel);
assert.throws(()=>Reforge.applyAccountReforge(poorModel,operation(poor),Policy),/Insufficient shared gold/);checks++;
assert.equal(JSON.stringify(poorModel),poorBefore);checks++;
const noEssence=equipment({uniqueId:'no-essence'}),noEssenceModel=modelFor(noEssence,{gold:10000,material:0}),noEssenceBefore=JSON.stringify(noEssenceModel);
assert.throws(()=>Reforge.applyAccountReforge(noEssenceModel,operation(noEssence),Policy),/Insufficient essence/);checks++;
assert.equal(JSON.stringify(noEssenceModel),noEssenceBefore);checks++;
const worn=equipment({uniqueId:'equipped'}),wornModel=modelFor(worn),wornIndex=wornModel.bag.items.findIndex(entry=>entry.instanceId===worn.instanceId);
wornModel.bag.items.splice(wornIndex,1);wornModel.characters['character-reforge'].progress.equipment.weapon=worn;wornModel.equipmentOwners[worn.instanceId]={kind:'equipped',characterId:'character-reforge',slot:'weapon'};Policy.validate(wornModel);
assert.throws(()=>Reforge.applyAccountReforge(wornModel,operation(worn),Policy),/shared bag/);checks++;
const epic=equipment({uniqueId:'epic',quality:'epic'});assert.throws(()=>Reforge.applyAccountReforge(modelFor(epic),operation(epic),Policy),/not eligible/);checks++;
assert.throws(()=>Reforge.applyAccountReforge(modelFor(first),operation(first,'value','random-99'),Policy),/Unknown random affix slot/);checks++;

console.log('Equipment reforge policy: '+JSON.stringify({checks,sampleSize,typeSamples,valueSamples}));
