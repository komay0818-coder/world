(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./map-exp-policy'):root.MapExpPolicy);if(typeof module==='object'&&module.exports)module.exports=api;else root.PartyExperiencePolicy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Exp){
'use strict';
function distribute(baseXp,members,map){
 if(!Array.isArray(members)||members.length>3||new Set(members.map(m=>m.id)).size!==members.length)throw Error('Invalid experience participants');
 const alive=members.filter(m=>m.alive!==false&&m.currentHp>0).sort((a,b)=>a.id.localeCompare(b.id));
 // Divide the unrounded base first. Only the existing decay policy rounds the final gain.
 return alive.map(m=>({id:m.id,...Exp.calculate(Math.max(0,Number(baseXp)||0)/alive.length,m.level,map)}));
}
function grow(progress,gain){
 let level=progress.level,xp=Math.round((Number(progress.xp||0)+gain)*100)/100;const levels=[];
 while(xp>=Exp.requiredXp(level)){xp=Math.round((xp-Exp.requiredXp(level))*100)/100;level++;levels.push(level);}
 return {level,xp,levels};
}
return {distribute,grow};
});
