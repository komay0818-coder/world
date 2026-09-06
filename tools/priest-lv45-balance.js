const P=require('../priest-advancement-policy.js');
const duration=600,dt=.1,attack=300,partyMaxHp=5000,incomingDps=28;
function simulate(spec,enemies=5){
  const priest={job:'priest',attack,stats:{attack},progress:{advancedClass:spec,skillLevels:{'priest:holy-faith':6,'priest:light-fountain':6,'priest:guardian-sanctuary':6,'priest:prayer-of-life':6,'priest:light-echo':6,'priest:holy-smite':6,'priest:holy-storm':6,'priest:fanatical-faith':6,'priest:light-devotion':6}}};
  const party=Array.from({length:4},(_,i)=>({id:i,alive:true,currentHp:partyMaxHp,maxHp:partyMaxHp}));
  let mana=100000,nextHeal=0,nextFountain=0,nextSanctuary=0,nextSmite=0,nextStorm=0,sanctuaryUntil=0,nextTick=0,damage=0,casts=0,faithFull=.0,stormHealing=0,smiteHealing=0,devotionHealing=0;
  for(let step=0;step<duration/dt;step++){
    const t=step*dt,now=t*1000;party.forEach((ally,i)=>{if(!ally.alive)return;const dr=t<sanctuaryUntil?.15:0;ally.currentHp-=incomingDps*dt*(1-dr)*(i===0?1.2:1);if(ally.currentHp<=0){ally.currentHp=0;ally.alive=false;}});
    const lowest=party.filter(a=>a.alive).sort((a,b)=>a.currentHp/a.maxHp-b.currentHp/b.maxHp)[0];
    if(lowest&&t>=nextHeal&&lowest.currentHp/lowest.maxHp<.7){P.heal(priest,lowest,attack*2.2*1.15*(1+P.getFaithBonuses(priest,now).healing));P.resolveLightEcho(priest,party);nextHeal=t+8;casts++;mana-=28;}
    if(spec==='holy-priest'){
      if(t>=nextFountain&&party.some(a=>a.alive&&a.currentHp/a.maxHp<.60)){const e=P.getEffect('light-fountain',6);party.filter(a=>a.alive).forEach(a=>{const r=a.currentHp/a.maxHp,b=r<.4?e.lowHpBonus:r<=.7?e.midHpBonus:0;P.heal(priest,a,attack*e.healPower*(1+.15+b+P.getFaithBonuses(priest,now).healing+P.getLifePrayerBonus(priest,a)));if(r<.4)a.shield=(a.shield||0)+a.maxHp*e.lowHpShield;});P.resolveLightEcho(priest,party);nextFountain=t+e.cooldown;casts++;mana-=34;}
      if(t>=nextSanctuary&&party.some(a=>a.alive&&a.currentHp/a.maxHp<.75)){const e=P.getEffect('guardian-sanctuary',6);sanctuaryUntil=t+6;nextTick=t+2;nextSanctuary=t+18;casts++;mana-=40;}
      if(t<sanctuaryUntil&&t+dt>=nextTick){party.filter(a=>a.alive).forEach(a=>P.heal(priest,a,attack*.25,'sanctuaryHealing'));P.resolveLightEcho(priest,party);nextTick+=2;}
    }else{
      if(t>=nextSmite){P.addFaith(priest,now);const e=P.getEffect('holy-smite',6),hit=attack*e.power*(1+.15+P.getFaithBonuses(priest,now).magicDamage);damage+=hit;const target=party.filter(a=>a.alive).sort((a,b)=>a.currentHp/a.maxHp-b.currentHp/b.maxHp)[0];smiteHealing+=P.heal(priest,target,hit*e.damageHealing,'smiteHealing');const d=P.getEffect('light-devotion',6);devotionHealing+=P.heal(priest,target,hit*d.directDamageHealing,'devotionHealing');nextSmite=t+5/(1+P.getFaithBonuses(priest,now).cooldownSpeed);casts++;mana-=24;}
      if(t>=nextStorm){P.addFaith(priest,now);const e=P.getEffect('holy-storm',6),hit=attack*e.power*enemies*(1+.15+P.getFaithBonuses(priest,now).magicDamage);damage+=hit;const amount=attack*e.partyHealPerHit*enemies;party.filter(a=>a.alive).forEach(a=>{stormHealing+=P.heal(priest,a,amount,'stormHealing');});const d=P.getEffect('light-devotion',6),target=party.filter(a=>a.alive).sort((a,b)=>a.currentHp/a.maxHp-b.currentHp/b.maxHp)[0];devotionHealing+=P.heal(priest,target,hit*d.directDamageHealing,'devotionHealing');nextStorm=t+8/(1+P.getFaithBonuses(priest,now).cooldownSpeed);casts++;mana-=32;}
      if(P.getFaithBonuses(priest,now).stacks===3)faithFull+=dt;
    }
  }
  const stats=P.telemetry(priest);return{spec,enemies,durationSeconds:duration,survivors:party.filter(a=>a.alive).length,dps:+(damage/duration).toFixed(1),effectiveHps:+(stats.effectiveHealing/duration).toFixed(1),casts,faithThreeStackUptime:+(faithFull/duration).toFixed(3),lightEchoHealing:+stats.echoHealing.toFixed(1),sanctuaryHealing:+stats.sanctuaryHealing.toFixed(1),smiteHealing:+smiteHealing.toFixed(1),devotionHealing:+devotionHealing.toFixed(1),stormHealing:+stormHealing.toFixed(1),manaSpent:100000-mana};
}
const result={model:'first-pass deterministic 10-minute continuous-combat harness; values are comparative, not final balance',holyPriest:simulate('holy-priest',5),battlePriest:[1,3,5].map(n=>simulate('battle-priest',n))};
console.log(JSON.stringify(result,null,2));
