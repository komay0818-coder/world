(function(root){
'use strict';
if(!root.document||root.accountAuthPreviewEnabled)return;
const deferred=root.document.querySelector('script[data-loaded-by="permanent-entry-bootstrap"]');
if(!deferred?.src)return;
const script=root.document.createElement('script');
script.src=deferred.src;
script.dataset.legacyEntrySource=deferred.src;
deferred.after(script);
})(typeof globalThis!=='undefined'?globalThis:this);
