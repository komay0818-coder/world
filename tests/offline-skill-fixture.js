const P = require('../offline-party-policy');
const Classes = require('../class-skill-policy');
const paths = {warrior:'warrior',assassin:'rogue',hunter:'hunter',mage:'mage',priest:'priest'};
function member(job, options = {}) {
  const { advancedClass, tier = 1, id = 'main', isMain = true, hp = 100000, currentHp = hp,
    resource, stats = {}, equipment = {} } = options;
  const max = job === 'hunter' ? 8 : ['mage','priest'].includes(job) ? 1000 : 100;
  const skills = [...Classes.getSkills(job), ...require(`../${paths[job]}-advancement-policy`).getSkills(advancedClass)];
  return { id, isMain, job, level: advancedClass ? 45 : 30, maxHp: hp, currentHp, alive: true,
    shield: 0, nextAttackAt: 1000, resourceCurrent: resource ?? (job === 'warrior' ? 0 : max), resourceMax: max,
    stats: { attack:100,defense:0,attackSpeed:1,mana:max,crit:0,parry:0,dodge:0, ...stats },
    character: { id,job,race:'human' }, progress: { advancedClass, equipment: {
      ...(job==='hunter' ? {offhand:require('../hunter-arrow-policy').createStarterQuiver()} : {}), ...equipment },
      skillLevels: Object.fromEntries(skills.map(s => [`${job}:${s.id}`,tier])) } };
}
function snapshot(members, monster = {}) {
  return P.capture({ now:1000, fighting:true, members,
    monsters:[{id:'test',level:30,maxHp:1000000,attack:0,attackSpeed:1,defense:0,mapId:'test',...monster}],mapId:'test' });
}
const run = (members, ms = 10000, options = {}, monster) => P.simulate({ snapshot:snapshot(members,monster),durationMs:ms,skills:true,random:()=>.5,...options });
module.exports={member,snapshot,run};
module.exports.isolate = function(job, skillId, options = {}) {
  const m=member(job,{resource:job==='hunter'?8:job==='warrior'||job==='assassin'?100:1000,...options});
  m.skillCooldowns=Object.fromEntries(Object.keys(m.progress.skillLevels).map(key=>[key.split(':')[1],100000000]));
  m.skillCooldowns[skillId]=1000;
  return m;
};
module.exports.activeMatrix = function(job) {
  const assert=require('node:assert/strict'), Advanced=require(`../${paths[job]}-advancement-policy`);
  let count=0;
  for(const skill of [...Classes.getSkills(job),...Advanced.SKILLS].filter(s=>s.type==='active')) {
    for(let tier=1;tier<=6;tier++) {
      const m=module.exports.isolate(job,skill.id,{tier,advancedClass:skill.advancedClass,currentHp:20000,
        equipment:job==='warrior'?{weapon:{weaponType:'one-handed-sword',series:'長劍'}}:{}});
      const r=run([m],100,{random:()=>0});
      assert.equal(r.members[0].combatTelemetry.skillCasts[skill.id],1,`${job}:${skill.id} Lv${tier} casts once`);
      assert.ok(r.members[0].resourceCurrent>=0 && r.members[0].resourceCurrent<=r.members[0].resourceMax);
      count++;
    }
  }
  return count;
};
