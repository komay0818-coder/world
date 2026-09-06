const assert=require('node:assert/strict'),{run,output}=require('../tools/battle-priest-mp-v2-test.js');
const a=run('A','boss',45),b=run('B','boss',45),c=run('C','five',45),d=run('D','five',45);
assert.equal(a.mp.smite,0);assert.equal(a.mp.devotion,0);assert.ok(b.mp.smite>0);assert.equal(b.mp.devotion,0);assert.equal(c.mp.smite,0);assert.ok(c.mp.devotion>0);assert.ok(d.mp.smite>0&&d.mp.devotion>0);assert.equal(Object.keys(output.results).length,2);console.log('battle-priest-mp-v2: assertions passed');
