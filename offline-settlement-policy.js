(function(root, factory) {
  const node=typeof module==='object'&&module.exports;
  const names=['OfflinePartyPolicy','MapExpPolicy','ChapterOneProgressionPolicy','ChapterOneMaterialDropPolicy','ChapterTwoMaterialDropPolicy','ChapterThreeMaterialDropPolicy','VillageUpgradePolicy','PreJobTrialPolicy','EquipmentDropPolicy','ChapterThreeSpecialEquipmentPolicy','ChapterOneRecipeDropPolicy','ChapterTwoRecipeDropPolicy','ChapterThreeRecipeDropPolicy','ChapterTwoRuneDropPolicy','SkillUpgradePolicy','BlackForestCorruptionPolicy','EquipmentPolicy','ChapterTwoSpecialEquipmentPolicy','PartyPolicy'];
  const files=['offline-party-policy','map-exp-policy','chapter-one-progression-policy','chapter-one-material-drop-policy','chapter-two-material-drop-policy','chapter-three-material-drop-policy','village-upgrade-policy','pre-job-trial-policy','equipment-drop-policy','chapter-three-special-equipment-policy','chapter-one-recipe-drop-policy','chapter-two-recipe-drop-policy','chapter-three-recipe-drop-policy','chapter-two-rune-drop-policy','skill-upgrade-policy','black-forest-corruption-policy','equipment-policy','chapter-two-special-equipment-policy','party-policy'];
  const api=factory(Object.fromEntries(names.map((name,i)=>[name,node?require('./'+files[i]+'.js'):root[name]])));
  if(node)module.exports=api;else root.OfflineSettlementPolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(P){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const LIMIT=43200000, MINIMUM=60000;
  function random(seed){let state=seed>>>0;return()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function count(value,name){if(!Number.isSafeInteger(value)||value<0)throw new Error('Invalid '+name);return value;}
  function migrateLegacy({slots,character,progress}){
    const parse=value=>typeof value==='string'?JSON.parse(value):value;
    let result=clone(parse(slots)||[]);
    if(!Array.isArray(result))throw new Error('Invalid legacy character slots');
    const legacyCharacter=parse(character);
    if(!result.length&&legacyCharacter)result=[{character:clone(legacyCharacter),progress:clone(parse(progress)||{})}];
    P.PartyPolicy.ensureUniqueCharacterIds(result);
    for(const slot of result)if(slot?.character){slot.progress=slot.progress||{};slot.progress.inventory=Array.isArray(slot.progress.inventory)?slot.progress.inventory:[];}
    return result;
  }
  function captureDeparture({slots,members,map,monsters,fighting,now,characterId,combat={},chapterOneBase=false}){
    const saved=clone(slots),main=saved.find(s=>s?.character?.id===characterId);
    if(!main||members.find(m=>m.isMain)?.id!==characterId)throw new Error('Departure character mismatch');
    main.progress.lastActiveAt=now;
    const snapshot=P.OfflinePartyPolicy.capture({fighting,members,map,monsters,mapId:map.id,now,combat,chapterOneBase});
    snapshot.consumables={potions:Number(main.progress.potions)||0,manaPotions:Number(main.progress.manaPotions)||0,gold:Number(main.progress.gold)||0};
    return{slots:saved,snapshot}; // Caller persists this boundary before yielding online ownership.
  }
  function createJob({accountId,characterId,revision,slots,snapshot,map,now,seed}){
    if(!accountId||!characterId||!Number.isFinite(now)||!Number.isInteger(seed))throw new Error('Invalid settlement identity/time/seed');
    const copied=clone(slots),main=copied.find(s=>s?.character?.id===characterId);
    if(!main||snapshot.members.filter(m=>m.isMain).length!==1||snapshot.members.find(m=>m.isMain).id!==characterId)throw new Error('Character snapshot mismatch');
    if(!Number.isSafeInteger(revision)||revision<0)throw new Error('Invalid save revision');
    if(snapshot.mapId!==map.id||now<snapshot.startedAt)throw new Error('Map/time mismatch');
    if(snapshot.members.find(m=>m.isMain).level!==main.progress.level)throw new Error('Main level snapshot mismatch');
    if(main.progress.lastActiveAt!==snapshot.startedAt)throw new Error('Offline boundary mismatch');
    for(const m of snapshot.members)if(!copied.some(s=>s?.character?.id===m.id))throw new Error('Missing party character');
    const durationMs=snapshot.eligible?Math.min(LIMIT,now-snapshot.startedAt):0;
    return clone({version:1,id:JSON.stringify([accountId,characterId,snapshot.startedAt]),accountId,characterId,revision,
      slots:copied,snapshot,map,now,seed,durationMs,skip:durationMs<MINIMUM});
  }
  function consume(progress,id,used){
    // Legacy saves can carry potion counters without matching inventory rows.
    let left=used;
    progress.inventory=(progress.inventory||[]).flatMap(item=>{
      if(item.id!==id||item.kind!=='consumable')return[item];
      const available=Math.max(0,Number(item.quantity)||0),taken=Math.min(left,available);left-=taken;
      return available>taken?[{...item,quantity:available-taken}]:[];
    });
  }
  function calculate(job,{simulate=P.OfflinePartyPolicy.simulate,statsAfterLevel}={}){
    const slots=clone(job.slots),main=slots.find(s=>s?.character?.id===job.characterId),progress=main.progress;
    const report={runId:job.id,accountId:job.accountId,characterId:job.characterId,claimed:false,skipped:job.skip,defeated:0,gainedXp:0,gainedGold:0,levelsGained:0,equipmentFound:0,materials:[],potionsUsed:0,manaPotionsUsed:0,died:false,capped:job.now-job.snapshot.startedAt>LIMIT};
    if(job.skip){progress.lastActiveAt=job.now;return{slots,report};}
    const combat=simulate({snapshot:clone(job.snapshot),durationMs:job.durationMs,skills:true,survival:true,recordKills:true,random:random(job.seed)});
    validateCombat(job,combat);
    const ledger=combat.consumables,initial=job.snapshot.consumables;
    count(ledger.hpUsed,'HP use');count(ledger.reviveUsed,'revival use');count(ledger.mpUsed,'MP use');
    const hpUsed=ledger.hpUsed+ledger.reviveUsed,mpUsed=ledger.mpUsed;
    if(ledger.purchased||ledger.goldSpent||hpUsed>initial.potions||mpUsed>initial.manaPotions
      ||ledger.potions!==initial.potions-hpUsed||ledger.manaPotions!==initial.manaPotions-mpUsed
      ||Number(progress.potions||0)!==initial.potions||Number(progress.manaPotions||0)!==initial.manaPotions)throw new Error('Potion ledger mismatch');
    progress.potions=initial.potions-hpUsed;progress.manaPotions=initial.manaPotions-mpUsed;
    consume(progress,'healing-potion',hpUsed);consume(progress,'mana-potion',mpUsed);
    const rng=random(job.seed^0x52455744);
    for(const kill of combat.kills){
      const enemy=kill.enemy,options={random:rng,obtainedAt:job.snapshot.startedAt+kill.atMs,jobId:main.character.job,
        uniqueId:job.id+':'+kill.sequence,uniqueIdFactory:()=>job.id+':'+kill.sequence,instanceIdFactory:attempt=>job.id+':'+kill.sequence+':'+attempt};
      const xp=P.MapExpPolicy.calculate(job.map.normalXp,progress.level,job.map).actualExp;
      progress.xp=(Number(progress.xp)||0)+xp;report.gainedXp+=xp;
      // Preserve the existing offline level ceiling, without lowering an already advanced character.
      while(progress.level<30&&progress.xp>=P.MapExpPolicy.requiredXp(progress.level)){progress.xp-=P.MapExpPolicy.requiredXp(progress.level);progress.level++;report.levelsGained++;}
      if(progress.level===30)progress.xp=Math.min(progress.xp,P.MapExpPolicy.requiredXp(30));
      P.ChapterOneProgressionPolicy.recordNormalKill(progress,job.map.id);
      for(const policy of [P.ChapterOneMaterialDropPolicy,P.ChapterTwoMaterialDropPolicy,P.ChapterThreeMaterialDropPolicy])report.materials.push(...policy.grantMaterialDrops(progress,job.map.id,enemy,options));
      report.materials.push(...P.VillageUpgradePolicy.grantMapDrops(progress,job.map.id,options));
      const mark=P.PreJobTrialPolicy.grantMarkDrop(progress,job.map.id,enemy,options);if(mark)report.materials.push(mark);
      // Normal equipment uses the same published lootConfig and creation policy as online combat.
      for(const policy of [P.ChapterOneRecipeDropPolicy,P.ChapterTwoRecipeDropPolicy,P.ChapterThreeRecipeDropPolicy])policy.grantRecipeDrops(progress,enemy,job.map.id,options);
      P.ChapterTwoRuneDropPolicy.grantRuneDrop(progress,job.map.id,enemy,options);
      P.SkillUpgradePolicy.grantChapterDrops(progress,job.map.chapter,enemy,options);
      P.BlackForestCorruptionPolicy.grantMapDrop(progress,job.map.id,enemy,options);
      if(job.map.chapter===1&&rng()<P.EquipmentPolicy.getChapterOneOffhandDropRate(enemy)){progress.inventory.push(P.EquipmentDropPolicy.createChapterOneOffhandDrop({...options,rarity:P.EquipmentPolicy.getChapterOneOffhandRarity(job.map.id),instanceId:job.id+':'+kill.sequence+':offhand',obtainedFrom:enemy.id}));report.equipmentFound++;}
      if(P.ChapterTwoSpecialEquipmentPolicy.grantSpecialDrop(progress,enemy,job.map.id,options))report.equipmentFound++;
      if(P.EquipmentDropPolicy.grantEquipmentDrop(progress,enemy,{...options,chapter:job.map.chapter,mapId:job.map.id}))report.equipmentFound++;
      if(P.ChapterThreeSpecialEquipmentPolicy.grantSpecialDrop(progress,enemy,job.map.id,options))report.equipmentFound++;
    }
    if(report.levelsGained&&!statsAfterLevel)throw new Error('Level-up requires existing character stats calculator');
    report.defeated=combat.kills.length;report.gainedGold=report.defeated*2;
    progress.gold=(Number(progress.gold)||0)+report.gainedGold;
    report.potionsUsed=hpUsed;report.manaPotionsUsed=mpUsed;report.died=combat.died;report.effectiveMs=combat.effectiveMs;report.operations=combat.operations;
    for(const m of combat.members){
      const slot=slots.find(s=>s?.character?.id===m.id);
      const resourceCurrent=Number(m.resourceCurrent),resourceMax=Number(m.resourceMax);
      if(!Number.isFinite(resourceCurrent)||resourceCurrent<0||resourceCurrent>resourceMax)throw new Error('Invalid final resource');
      const afterStats=statsAfterLevel?statsAfterLevel(slot.progress,slot.character):null;
      const state={currentHp:Math.min(m.currentHp,afterStats?.hp||m.maxHp),maxHp:afterStats?.hp||m.maxHp,alive:m.alive,resource:{type:m.resourceType,current:resourceCurrent,max:resourceMax},
        shield:m.shield||0,undeadRevived:m.undeadRevived,reviveInMs:m.reviveAt==null?null:Math.max(0,m.reviveAt-(job.snapshot.startedAt+combat.effectiveMs))};
      slot.progress.partyMemberState=state;
      // Relative deadlines and complete dynamic state are retained for the later resume adapter.
      slot.progress.offlinePartyRuntime={version:1,runId:job.id,resumeAllowed:!combat.died,at:job.snapshot.startedAt+combat.effectiveMs,member:clone(m),sacredGuardianReadyAt:combat.sacredGuardianReadyAt};
    }
    if(combat.died){
      const finalStats=statsAfterLevel?statsAfterLevel(progress,main.character):{hp:combat.members.find(m=>m.isMain).maxHp};
      progress.partyMemberState.currentHp=finalStats.hp;progress.partyMemberState.maxHp=finalStats.hp;progress.partyMemberState.alive=true;
      if(job.map.dungeon){progress.selectedMapId=progress.dungeonReturnMapId||(job.map.id==='black-forest-altar'?'black-forest':'plains-entrance');progress.dungeonAdmission=false;}
      progress.requiresMapSelectionAfterDefeat=true;
    }
    progress.lastActiveAt=job.now;
    return{slots,report};
  }
  function restoreRuntime({slots,characterId,now,statsForMember}){
    const main=slots.find(s=>s?.character?.id===characterId);
    const record=main?.progress?.offlinePartyRuntime;
    if(!record||!record.member.isMain||record.member.id!==characterId)throw new Error('Missing/mismatched runtime owner');
    if(!record.resumeAllowed)return null; // Village defeat diagnostics must never revive the old combat.
    if(!Number.isFinite(now)||now<record.at)throw new Error('Invalid resume time');
    const shift=(value,gap,parent='')=>{
      if(!value||typeof value!=='object')return;
      for(const key of Object.keys(value)){
        if(['progress','character','stats','equipment'].includes(key)||/Telemetry$/.test(key))continue;
        const item=value[key];
        if(typeof item==='number'&&Number.isFinite(item)&&item>0&&(/(At|Until)$/.test(key)||parent==='skillCooldowns'))value[key]+=gap;
        else shift(item,gap,key);
      }
    };
    return slots.flatMap(slot=>{
      const r=slot?.progress?.offlinePartyRuntime;
      if(!r||!r.resumeAllowed||r.runId!==record.runId)return[];
      const member=clone(r.member);
      if(member.isMain&&member.level!==slot.progress.level){
        if(!statsForMember)throw new Error('Level-up resume requires existing character stats calculator');
        member.level=slot.progress.level;member.stats=statsForMember(slot.progress,slot.character);member.progress.level=slot.progress.level;
      }
      member.currentHp=slot.progress.partyMemberState.currentHp;member.maxHp=slot.progress.partyMemberState.maxHp;
      shift(member,now-r.at);return[member];
    }).sort((a,b)=>Number(b.isMain)-Number(a.isMain)||a.position-b.position);
  }
  function validateCombat(job,c){
    if(!c||!Array.isArray(c.kills)||c.kills.length!==c.defeated||!Number.isFinite(c.effectiveMs)||c.effectiveMs<0||c.effectiveMs>job.durationMs)throw new Error('Invalid kill ledger/time');
    if(c.members.length!==job.snapshot.members.length||new Set(c.members.map(m=>m.id)).size!==c.members.length)throw new Error('Invalid party result');
    const main=c.members.find(m=>m.id===job.characterId);
    if(!main||!main.isMain||c.died!==(!main.alive)||c.died&&c.deathAtMs!==c.effectiveMs)throw new Error('Invalid main death');
    let previous=0;
    c.kills.forEach((k,i)=>{if(k.hp!==0||k.sequence!==i+1||k.atMs<previous||k.atMs>c.effectiveMs||k.enemy.isFacility||k.enemy.isElite||k.enemy.isBoss||!job.snapshot.monsters.some(e=>e.id===k.enemy.id))throw new Error('Invalid confirmed kill');previous=k.atMs;});
    for(const m of c.members)if(!job.snapshot.members.some(s=>s.id===m.id)||!Number.isFinite(m.currentHp)||m.currentHp<0||m.currentHp>m.maxHp||m.alive!==(m.currentHp>0))throw new Error('Invalid final HP');
  }
  return Object.freeze({createJob,captureDeparture,calculate,validateCombat,migrateLegacy,restoreRuntime,random,LIMIT,MINIMUM});
});
