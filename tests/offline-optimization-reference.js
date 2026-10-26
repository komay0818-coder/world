// Build a test-only unoptimized shared runtime from the same online policies.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=path.join(__dirname,'..');
function loadReference(){
  const original=require(path.join(root,'tmp/offline-shared-runtime-before.js'));
  const filename=path.join(__dirname,'offline-skill-events-reference.fixture.js');
  const engine=new Module(filename,module);
  engine.filename=filename;engine.paths=module.paths;
  engine.require=request=>request==='./offline-shared-runtime.generated.js'?original:require(request);
  engine._compile(fs.readFileSync(filename,'utf8'),filename);
  return engine.exports;
}
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
module.exports={loadReference,seeded};
