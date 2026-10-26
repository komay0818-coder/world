// Explicit performance matrix: excluded from normal regression.
const fs=require('fs'),P=require('../offline-settlement-policy'),F=require('../tests/offline-skill-fixture');
const rows=[];
for(const hours of [1,6,12]){
 const party=[F.member('assassin',{advancedClass:'venom',tier:6}),F.member('hunter',{id:'hunter',isMain:false,advancedClass:'beastmaster',tier:6}),F.member('priest',{id:'priest',isMain:false,advancedClass:'holy-priest',tier:6,currentHp:20000})];
 party[0].progress.potions=100000;party[0].progress.manaPotions=100000;
 const snapshot=F.snapshot(party,{maxHp:10000,attack:1,lootConfig:require('../equipment-drop-policy').TEST_LOOT_CONFIGS.normal});
 snapshot.mapId='plains-entrance';snapshot.map={id:'plains-entrance',chapter:1,min:1,max:5};
 const slots=party.map(m=>({character:m.character,progress:{level:m.level,xp:0,gold:0,potions:100000,manaPotions:100000,inventory:[],lastActiveAt:1000}}));
 const job=P.createJob({accountId:'performance',characterId:'main',revision:0,slots,snapshot,map:{id:'plains-entrance',chapter:1,min:1,max:5,normalXp:10},now:1000+hours*3600000,seed:12345});
 const start=performance.now(),r=P.calculate(job),elapsed=performance.now()-start;
 const row={hours,ms:Math.round(elapsed),events:r.report.operations,kills:r.report.defeated,gear:r.report.equipmentFound,resultBytes:Buffer.byteLength(JSON.stringify(r)),heapEndMB:Math.round(process.memoryUsage().heapUsed/1048576)};
 if(r.report.effectiveMs!==hours*3600000||r.report.died)throw Error('Incomplete benchmark');rows.push(row);console.log(JSON.stringify(row));
}
fs.writeFileSync('tmp/offline-batch-4a-performance.json',JSON.stringify(rows,null,2));
