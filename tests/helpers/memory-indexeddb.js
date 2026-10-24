'use strict';
const clone=value=>value===undefined?undefined:structuredClone(value);
module.exports=function memoryIndexedDB(){
 const databases=new Map();
 class Transaction{
  constructor(db,names,mode){this.db=db;this.names=names;this.mode=mode;this.ops=[];this.running=false;this.active=false;this.done=false;this.snapshot=null;}
  objectStore(name){if(!this.names.includes(name))throw Error('Store outside transaction');const tx=this;return {get:key=>tx.request(map=>clone(map.get(key)),false,name),getAll:()=>tx.request(map=>[...map.values()].map(clone),false,name),add:value=>tx.request(map=>{if(map.has(value.id))throw Error('ConstraintError');map.set(value.id,clone(value));return value.id;},true,name),put:value=>tx.request(map=>{map.set(value.id,clone(value));return value.id;},true,name),delete:key=>tx.request(map=>map.delete(key),true,name)};}
  request(action,write,store){const request={result:undefined,error:null,onsuccess:null,onerror:null};this.ops.push({action,write,request,store});this.drain();return request;}
  start(){if(this.done)return;this.active=true;this.snapshot=new Map([...this.db.stores].map(([name,map])=>[name,new Map([...map].map(([key,value])=>[key,clone(value)]))]));this.drain();}
  drain(){if(!this.active||this.running||this.done)return;if(!this.ops.length){this.running=true;queueMicrotask(()=>{this.running=false;if(this.ops.length)return this.drain();this.done=true;if(this.mode==='readwrite')this.db.stores=this.snapshot;this.oncomplete?.();this.db.finished(this);});return;}this.running=true;const operation=this.ops.shift();queueMicrotask(()=>{if(this.done)return;try{if(operation.write&&this.mode!=='readwrite')throw Error('Readonly transaction');operation.request.result=operation.action(this.snapshot.get(operation.store));operation.request.onsuccess?.();}catch(error){operation.request.error=error;operation.request.onerror?.();this.abort(error);return;}this.running=false;this.drain();});}
  abort(error){if(this.done)return;this.done=true;this.error=error||Error('AbortError');queueMicrotask(()=>{this.onabort?.();this.db.finished(this);});}
 }
 class Database{
  constructor(version){this.version=version;this.stores=new Map();this.objectStoreNames={contains:name=>this.stores.has(name)};this.queue=[];this.current=null;this.closed=false;}
  createObjectStore(name){this.stores.set(name,new Map());}
  transaction(names,mode){if(this.closed)throw Error('Database is closed');const tx=new Transaction(this,Array.isArray(names)?names:[names],mode);this.queue.push(tx);this.next();return tx;}
  next(){if(this.current||!this.queue.length)return;this.current=this.queue.shift();queueMicrotask(()=>this.current.start());}
  finished(tx){if(this.current===tx)this.current=null;this.next();}
  close(){this.closed=true;}
 }
 return {open(name,version){const request={result:null,error:null,onupgradeneeded:null,onsuccess:null,onerror:null,onblocked:null};queueMicrotask(()=>{try{let data=databases.get(name);const fresh=!data;if(!data){data={db:new Database(version)};databases.set(name,data);}else if(data.db.closed){const reopened=new Database(version);reopened.stores=data.db.stores;data.db=reopened;}request.result=data.db;if(fresh)request.onupgradeneeded?.();request.onsuccess?.();}catch(error){request.error=error;request.onerror?.();}});return request;}};
};

