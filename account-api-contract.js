(function(root,factory){
'use strict';
const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AccountApiContract=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='20261022-account-api-v2';
const ROUTES=Object.freeze({
 publicConfig:Object.freeze({method:'GET',path:'/v1/config/public',auth:false}),
 accountRead:Object.freeze({method:'GET',path:'/v1/account',auth:true}),
 accountInitialize:Object.freeze({method:'POST',path:'/v1/account/initialize',auth:true}),
 saveRead:Object.freeze({method:'GET',path:'/v1/save',auth:true}),
 saveCommit:Object.freeze({method:'POST',path:'/v1/save/commit',auth:true}),
 leaseAcquire:Object.freeze({method:'POST',path:'/v1/play-lease/acquire',auth:true}),
 leaseRenew:Object.freeze({method:'POST',path:'/v1/play-lease/renew',auth:true}),
 leaseRelease:Object.freeze({method:'POST',path:'/v1/play-lease/release',auth:true})
});
const capabilities=Object.freeze(Object.values(ROUTES).map(route=>route.method+' '+route.path));
const allowed=new Set(capabilities);
const key=(path,method='GET')=>String(method).toUpperCase()+' '+String(path);
function allows(path,method='GET'){return allowed.has(key(path,method));}
function assertAllowed(path,method='GET'){if(!allows(path,method))throw Error('不允許的帳號 API 請求');}
function validateServer(input){
 if(input?.apiContractVersion!==VERSION)throw Error('前後端帳號 API 版本不相容，遊戲已停止啟動');
 const server=new Set(Array.isArray(input?.apiCapabilities)?input.apiCapabilities:[]),missing=capabilities.filter(value=>!server.has(value));
 if(missing.length)throw Error('後端缺少必要帳號 API：'+missing.join('、'));
 return true;
}
return Object.freeze({VERSION,ROUTES,capabilities,allows,assertAllowed,validateServer});
});
