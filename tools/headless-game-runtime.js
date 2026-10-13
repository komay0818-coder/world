'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function element(){
  const classes=new Set(),attributes=new Map();
  const node=new Proxy({
    classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},toggle(n,force){const add=force===undefined?!classes.has(n):force;if(add)classes.add(n);else classes.delete(n);return add;},contains(n){return classes.has(n);}},
    style:{setProperty(){},removeProperty(){}},dataset:{},children:[],options:[],selectedIndex:0,parentNode:null,
    addEventListener(){},removeEventListener(){},
    append(...nodes){nodes.forEach(n=>this.appendChild(n));},
    appendChild(child){child.parentNode?.removeChild?.(child);this.children.push(child);child.parentNode=this;return child;},
    insertBefore(child,reference){child.parentNode?.removeChild?.(child);const index=this.children.indexOf(reference);this.children.splice(index<0?this.children.length:index,0,child);child.parentNode=this;return child;},
    removeChild(child){const index=this.children.indexOf(child);if(index>=0)this.children.splice(index,1);child.parentNode=null;return child;},
    remove(){this.parentNode?.removeChild?.(this);},
    setAttribute(k,v){attributes.set(k,String(v));},getAttribute(k){return attributes.get(k)??null;},
    closest(){return null;},contains(child){return child===this||this.children.some(n=>n.contains?.(child));},
    click(){},focus(){},querySelector(){return element();},querySelectorAll(){return[];},
    getBoundingClientRect(){return{x:0,y:0,width:100,height:100,left:0,top:0};},getContext(){return{};}
  },{get(o,k){if(k==='parentNode'&&o.parentNode===null){const parent=element();parent.children.push(node);o.parentNode=parent;}if(k in o)return o[k];if(k==='value'||k==='innerHTML'||k==='textContent')return'';return()=>{};},set(o,k,v){o[k]=v;return true;}});
  return node;
}
function createContext(){const storage=new Map(),session=new Map(),storageApi=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}),document={querySelector:()=>element(),querySelectorAll:()=>[],createElement:()=>element(),getElementById:()=>element(),addEventListener(){},body:element(),documentElement:element()},neutralEquipment={getAttacksPerSecond:(_w,s)=>s,getArmorCategory:()=>'',getEquipSlots:()=>[],getDefenseMultiplier:()=>1,getIncomingDamageReduction:()=>0,applyMagicDamageBonus:(d,b=0)=>d*(1+b),beginMainHandBasicAttack:()=>({damageMultiplier:1,guaranteedCritical:false}),completeMainHandBasicAttack(){},clearCombatState(){},rollWeaponAttack:()=>null,resolveEnemyAttackOutcome(){},resolveManaSurge:()=>({triggered:false,restored:0})};const context={console,document,EquipmentPolicy:new Proxy(neutralEquipment,{get:(o,k)=>o[k]||(()=>0)}),localStorage:storageApi(storage),sessionStorage:storageApi(session),location:{href:'http://localhost/',reload(){}},navigator:{serviceWorker:{register:async()=>({})}},fetch:async()=>({ok:false,json:async()=>({})}),Image:function(){return element();},Audio:function(){return element();},URLSearchParams,addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),requestAnimationFrame:fn=>fn(0),cancelAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math:Object.create(Math),performance:{now:()=>0}};context.window=context;context.globalThis=context;return vm.createContext(context);}
function loadGame(root=path.join(__dirname,'..')){const context=createContext(),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sources=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(x=>{const source=x[1].split('?')[0];if(!/^https?:/.test(source))return source;const localName=path.basename(new URL(source).pathname);return fs.existsSync(path.join(root,localName))?localName:null;}).filter(Boolean);for(const source of sources){const filename=path.join(root,source);if(fs.existsSync(filename))vm.runInContext(fs.readFileSync(filename,'utf8'),context,{filename});}return{context,evaluate:code=>vm.runInContext(code,context)};}
module.exports={createContext,loadGame};
