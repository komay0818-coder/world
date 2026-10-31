(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(()=>node?require('./equipment-affix-policy'):root.EquipmentAffixPolicy);
  if(node)module.exports=api;else root.SkullcrusherAccessoryPolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(getAffixPolicy){
  'use strict';
  const jobs=Object.freeze(['warrior','assassin','hunter','mage','priest']);
  const fixed=(id,name,stat,value,unit='%')=>Object.freeze({id:'skullcrusher-jewel-fixed-'+id,name,stat,min:value,max:value,unit});
  const AFFIXES=Object.freeze([
    ['hp','生命','maxHp',60,''],['regen','生命恢復','hpRegeneration',10,'／秒'],
    ['attack','攻擊力','attackFlat',10,''],['crit','暴擊率','criticalChance',8,'%'],
    ['crit-damage','暴擊傷害','criticalDamagePercent',12,'%'],['cooldown','技能冷卻恢復速度','cooldownSpeedPercent',12,'%'],
    ['skill','技能傷害','skillDamagePercent',10,'%'],['boss','對Boss傷害','bossDamagePercent',15,'%'],
    ['elite','對菁英怪物傷害','eliteDamagePercent',15,'%'],['kill-heal','擊殺回復生命','killHealthRecoveryPercent',4,'%']
  ].map(([id,name,stat,value,unit])=>Object.freeze({id:'skullcrusher-jewel-'+id,name,stat,value,unit})));
  function template(id,name,slot,baseStats,allowedJobs,fixedAffixDefinitions){return Object.freeze({
    id,name,kind:'equipment',slot,quality:'rare',rarity:'rare',chapter:3,affixChapter:3,
    ...baseStats,baseStats:Object.freeze(baseStats),allowedJobs:Object.freeze(allowedJobs),
    fixedAffixDefinitions:Object.freeze(fixedAffixDefinitions),allowedAffixIds:Object.freeze(AFFIXES.map(a=>a.id)),
    dropEnabled:false,reforgeAllowed:false,icon:slot==='ring'?'💍':'📿'
  });}
  const TEMPLATES=Object.freeze({
    warSoulRing:template('skullcrusher-war-soul-ring','赤岩戰魂戒指','ring',{attack:15},jobs,[fixed('war-crit','暴擊率','criticalChance',5),fixed('war-crit-damage','暴擊傷害','criticalDamagePercent',10)]),
    furyRing:template('skullcrusher-fury-ring','碎顱狂怒戒指','ring',{attack:15},jobs,[fixed('fury-skill','技能傷害','skillDamagePercent',8),fixed('fury-boss','對Boss傷害','bossDamagePercent',10)]),
    guardianNecklace:template('skullcrusher-guardian-necklace','遠古守護項鍊','necklace',{hp:100},['warrior','hunter','assassin'],[fixed('guardian-defense','防禦','defenseFlat',15,''),fixed('guardian-reduction','受到傷害降低','damageReductionPercent',3)]),
    arcaneNecklace:template('skullcrusher-arcane-necklace','赤岩秘法項鍊','necklace',{mana:80},['mage','priest'],[fixed('arcane-regen','魔力恢復','manaRegenerationPercent',20),fixed('arcane-cooldown','技能冷卻恢復速度','cooldownSpeedPercent',8)])
  });
  const byId=new Map(Object.values(TEMPLATES).map(item=>[item.id,item]));
  function getTemplate(value){return byId.get(typeof value==='string'?value:value?.baseItemId||value?.id)||null;}
  function createEquipment(id,options={}){
    const template=getTemplate(id);if(!template)throw Error('Unknown dungeon accessory');
    const item=getAffixPolicy().createEquipmentInstance(template,{...options,quality:'rare',chapter:3,uniqueId:options.uniqueId??globalThis.crypto.randomUUID()});
    item.instanceId=item.id;return item;
  }
  return Object.freeze({TEMPLATES,AFFIXES,getTemplate,createEquipment});
});
