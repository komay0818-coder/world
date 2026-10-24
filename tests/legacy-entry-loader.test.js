const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'legacy-entry-loader.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function run(enabled){
 let inserted=null;
 const deferred={src:'https://example.test/script.js?v=current',after(node){inserted=node;}};
 const document={querySelector(selector){assert.equal(selector,'script[data-loaded-by="permanent-entry-bootstrap"]');return deferred;},createElement(tag){return {tag,dataset:{}};}};
 const context={document,accountAuthPreviewEnabled:enabled};
 vm.runInNewContext(source,context);
 return inserted;
}

assert.match(html,/legacy-entry-loader\.js\?v=20261025-production-entry-v1/);
assert.equal(run(true),null,'authenticated preview keeps the permanent bootstrap as the only script loader');
const legacy=run(false);
assert.equal(legacy.tag,'script');
assert.equal(legacy.src,'https://example.test/script.js?v=current');
assert.equal(legacy.dataset.legacyEntrySource,legacy.src);
console.log('legacy-entry-loader: assertions passed');
