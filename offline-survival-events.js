(function(root){
  const generated=typeof module==='object'&&module.exports?require('./offline-enemy-runtime.generated.js'):root.OfflineEnemyRuntime;
  function connect({env,runtime,members,main,battle,now,emit}){
    const no=()=>{};
    // Simulation-owned counters only. Formal inventory/rewards remain disconnected.
    const inventory=env.snapshot.consumables||{};
    Object.assign(main.progress,{potions:Math.max(0,Math.floor(Number(inventory.potions)||0)),
      manaPotions:Math.max(0,Math.floor(Number(inventory.manaPotions)||0)),gold:Math.max(0,Number(inventory.gold)||0)});
    const ledger={hpUsed:0,mpUsed:0,reviveUsed:0,purchased:0,goldSpent:0};
    function hp(m){
      if(!env.fighting||!m?.alive||m.currentHp<=0||m.currentHp>=m.maxHp)return false;
      // Legacy offline combat never auto-bought potions. Preserve that policy;
      // the online main-character shop action is not invoked by this simulator.
      if(main.progress.potions<=0)return false;
      main.progress.potions--;ledger.hpUsed++;
      const multiplier=m.isMain?1:env.ChapterThreeLateCombatPolicy.playerMultiplier(m,'healing-received-down',now());
      m.currentHp=Math.min(m.maxHp,m.currentHp+Math.ceil(m.maxHp*.30*multiplier));
      emit('hp-potion',{memberId:m.id,hp:m.currentHp});return true;
    }
    function mp(m){
      if(!env.fighting||!m?.alive||!runtime.usesManaResource(m.job)||m.resourceCurrent>=m.resourceMax||main.progress.manaPotions<=0)return false;
      main.progress.manaPotions--;ledger.mpUsed++;
      m.resourceCurrent=Math.min(m.resourceMax,m.resourceCurrent+Math.ceil(m.resourceMax*.20));
      if(m.isMain&&m.resourceCurrent/m.resourceMax>=.45)m.manaExhausted=false;
      emit('mp-potion',{memberId:m.id,mp:m.resourceCurrent});return true;
    }
    Object.assign(env,runtime,{usePotion:()=>hp(main),useSharedHealingPotionForMember:hp,
      useManaPotion:()=>mp(main),useSharedManaPotionForMember:mp,
      removePotionItem:()=>{ledger.reviveUsed++;},saveProgress:no,
      playMonsterAttackAnimation:no,playPartyMemberHitAnimation:no,
      logBattle:(message,category,detail={})=>emit('monster-log',{message,category,...detail}),
      logPartyDebug:(message,detail)=>{if(message==='死亡事件')emit('death',{memberId:detail.memberId});},
      endBattleAfterPlayerDefeat:()=>{env.fighting=false;emit('main-defeat',{memberId:main.id});
        const stop=new Error('Main character defeated');stop.offlineDefeat=true;throw stop;},
      resetPartyAfterDefeat:()=>false,rebuildBattlePartyMembers:no,
      isTimedChapterThreeVisualShowcase:()=>false,isMonsterRotationPreview:()=>false,
      battleScreen:{classList:{contains:()=>false}},ChapterTwoBalancePlaytestPolicy:{isChapterThreeActive:()=>false},
      emitLateChapterSkill:(unit,skill)=>emit('monster-skill',{enemyId:unit.id,skillId:skill.id}),
      isPlayerBleeding:()=>!!(main.alive&&main.bleed&&now()<main.bleed.expiresAt),
      getWoundedEnemyIndexes:()=>battle.enemyHps.flatMap((hp,i)=>hp>0&&hp<env.getEnemyDefinition(i).maxHp?[i]:[]),
      getBlackForestDepthsCombatContext:()=>({aliveAllies:Math.max(0,battle.enemyHps.filter(h=>h>0).length-1),bossAuraActive:false,
        forestSpiritAlive:battle.enemyTypes.some((id,i)=>id==='forestSpirit'&&battle.enemyHps[i]>0)})});
    for(const key of ['enemyLevels','enemyRespawns','enemyDamages','enemyBoarEnraged','enemyTrailSummoned','enemySummonProfiles',
      'enemyCaptainShieldUntil','enemyAssassinDashUntil','enemySpiderNestPhase','enemyDepthsPhase'])
      battle[key]=battle.enemyTypes.map(()=>key==='enemyDamages'?[]:key==='enemyLevels'?30:key==='enemySpiderNestPhase'||key==='enemyDepthsPhase'?1:0);
    battle.sessionId='offline';battle.lastStrongholdRegenAt=now();
    battle.dungeonId=env.snapshot.mapId==='goblin-camp'?'goblin-camp':null;
    battle.sacredGuardianReadyAt=now()+(env.snapshot.sacredGuardianInMs||0);
    const originalPolicies=Object.fromEntries(['BlackForestEntrancePolicy','BlackForestTrailPolicy','SpiderNestPolicy',
      'BlackstoneStrongholdPolicy','ForestAltarPolicy','BlackForestDepthsPolicy','RedrockWastesPolicy','BloodwarWastesPolicy',
      'ChapterThreeLateCombatPolicy','PlainsDepthsPolicy','SkullcrusherWarCampPolicy'].map(k=>[k,env[k]]));
    const enemyRuntime=generated.create(env);
    // Shared player handlers keep their captured policy objects; fill them with the
    // original map policies instead of inventing offline damage multipliers.
    for(const [key,value]of Object.entries(originalPolicies)){
      Object.assign(value,env[key]);env[key]=value;
    }
    function defeat(m,t=now()){
      const previouslyRevived=m.undeadRevived,result=enemyRuntime.defeatPartyMember(m,t);
      if(!previouslyRevived&&m.undeadRevived)emit('undead-revive',{memberId:m.id});
      return result;
    }
    function revive(member){
      // The online function owns revival math/clearing. Limit its view to the
      // current position so a same-time potion tie follows party order.
      const original=battle.partyMembers;battle.partyMembers=[member];
      try{const revived=enemyRuntime.reviveDefeatedTeammates(now());
        if(revived)emit('revive',{memberId:member.id,hp:member.currentHp});return revived;
      }finally{battle.partyMembers=original;}
    }
    return {enemyRuntime,defeat,hp,mp,revive,ledger,
      finish:()=>({...ledger,potions:main.progress.potions,manaPotions:main.progress.manaPotions,gold:main.progress.gold})};
  }
  const api={connect};if(typeof module==='object'&&module.exports)module.exports=api;else root.OfflineSurvivalEvents=api;
})(typeof globalThis!=='undefined'?globalThis:this);
