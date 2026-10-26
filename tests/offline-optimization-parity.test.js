const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),path=require('node:path');
execFileSync(process.execPath,[path.join(__dirname,'../tools/build-offline-shared-runtime.js'),'--reference']);
const {loadReference,seeded}=require('./offline-optimization-reference');
const original=loadReference(),optimized=require('../offline-skill-events'),{member,snapshot}=require('./offline-skill-fixture');
const routes={warrior:['weapon-master','berserker'],assassin:['assassination','venom'],hunter:['marksman','beastmaster'],mage:['elementalist','arcane-mage'],priest:['holy-priest','battle-priest']};
let cases=0;
for(const seed of [1,12345,0xdeadbeef])for(const [job,classes]of Object.entries(routes))for(const advancedClass of [undefined,...classes]){
  const party=[member(job,{advancedClass,tier:6,hp:3000}),member('priest',{id:'p',isMain:false,currentHp:20000})];
  const departure=snapshot(party,{attack:80,maxHp:3000});
  for(const durationMs of [10000,60000]){
    const options={snapshot:departure,durationMs,trace:true};
    const hashes=[require('node:crypto').createHash('sha256'),require('node:crypto').createHash('sha256')];
    const a=original.simulate({...options,random:seeded(seed),onEvent:event=>hashes[0].update(JSON.stringify(event))});
    const b=optimized.simulate({...options,random:seeded(seed),onEvent:event=>hashes[1].update(JSON.stringify(event))});
    assert.equal(JSON.stringify(b),JSON.stringify(a),`${job}/${advancedClass}/${seed}/${durationMs}`);
    assert.equal(hashes[1].digest('hex'),hashes[0].digest('hex'),'entire event history matches beyond the trace limit');
    cases++;
  }
}
const lethal=snapshot([member('warrior',{hp:100,currentHp:100})],{attack:10000});
const options={snapshot:lethal,durationMs:60000,trace:true};
const a=original.simulate({...options,random:seeded(12345)}),b=optimized.simulate({...options,random:seeded(12345)});
assert.equal(a.died,true);assert.deepEqual(b,a);
console.log(`offline optimization: ${cases} class/route/seed/time full-result comparisons plus lethal death passed`);
