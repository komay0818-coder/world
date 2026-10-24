(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
else{
 root.AccountAuthView=api;
 const enabled=api.isPreviewEnabled(root.location);
 root.accountAuthPreviewEnabled=enabled;
 if(root.document)root.accountAuthView=api.mount(root.document,enabled);
}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EMAIL_PATTERN=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPreviewEnabled(location){
 const local=['127.0.0.1','localhost'].includes(String(location?.hostname||'').toLowerCase());
 if(!local)return false;
 return new URLSearchParams(location?.search||'').get('accountUi')==='1';
}

function validateRegistration(values){
 const errors={};
 const email=String(values?.email||'').trim(),password=String(values?.password||''),confirmation=String(values?.passwordConfirm||'');
 if(!email)errors.email='請輸入電子郵件。';else if(!EMAIL_PATTERN.test(email))errors.email='電子郵件格式不正確。';
 if(!password)errors.password='請輸入密碼。';else if(password.length<8||!/[A-Za-z]/.test(password)||!/\d/.test(password))errors.password='密碼至少需要 8 個字元，並包含英文字母與數字。';
 if(!confirmation)errors.passwordConfirm='請再次輸入密碼。';else if(confirmation!==password)errors.passwordConfirm='兩次輸入的密碼不一致。';
 return errors;
}

function validateLogin(values){
 const errors={};
 const email=String(values?.email||'').trim(),password=String(values?.password||'');
 if(!email)errors.email='請輸入電子郵件。';else if(!EMAIL_PATTERN.test(email))errors.email='電子郵件格式不正確。';
 if(!password)errors.password='請輸入密碼。';
 return errors;
}

function setMode(shell,mode){
 const normalized=mode==='login'?'login':'register';
 shell.dataset.mode=normalized;
 const register=shell.querySelector('#account-register-form'),login=shell.querySelector('#account-login-form');
 if(register)register.hidden=normalized!=='register';
 if(login)login.hidden=normalized!=='login';
 return normalized;
}

function clearFormErrors(form){
 form.querySelectorAll('input').forEach(input=>{input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');});
 form.querySelectorAll('[data-error-for]').forEach(node=>{node.textContent='';});
}

function showFormErrors(form,errors,fieldIds){
 clearFormErrors(form);
 Object.entries(errors).forEach(([field,message])=>{
  const inputId=fieldIds[field],input=inputId?form.querySelector('#'+inputId):null,error=form.querySelector(`[data-error-for="${inputId}"]`);
  if(input){input.setAttribute('aria-invalid','true');if(error){error.id=inputId+'-error';input.setAttribute('aria-describedby',error.id);}}
  if(error)error.textContent=message;
 });
 const first=Object.keys(errors)[0],firstId=first?fieldIds[first]:null;
 if(firstId)form.querySelector('#'+firstId)?.focus();
}

function mount(document,enabled){
 const legacy=document.querySelector('#legacy-login-content'),shell=document.querySelector('#account-auth-shell');
 if(!legacy||!shell)return null;
 legacy.hidden=Boolean(enabled);shell.hidden=!enabled;
 document.body?.classList.toggle('account-auth-preview',Boolean(enabled));
 if(!enabled)return null;

 const message=shell.querySelector('#account-auth-message');
 const register=shell.querySelector('#account-register-form'),login=shell.querySelector('#account-login-form');
 const recovery=shell.querySelector('#farming-recovery-panel'),recoveryCharacters=shell.querySelector('#farming-recovery-characters'),recoveryConfirm=shell.querySelector('#farming-recovery-confirm');
 const migration=shell.querySelector('#shared-gold-migration-panel'),migrationCharacters=shell.querySelector('#shared-gold-migration-characters'),migrationTotal=shell.querySelector('#shared-gold-migration-total'),migrationConfirm=shell.querySelector('#shared-gold-migration-confirm');
 const announce=(text,state='info')=>{if(message){message.textContent=text;message.dataset.state=state;}};
 let handlers={},mode='register',migrationHandler=null,migrationBusy=false,recoveryHandler=null,recoveryBusy=false;
 const setBusy=busy=>shell.querySelectorAll('button,input').forEach(node=>{node.disabled=Boolean(busy);});
 const setAuthState=(state,options={})=>{
  const normalized=['checking','anonymous','authenticated'].includes(state)?state:'checking';
  shell.dataset.authState=normalized;
  if(normalized==='anonymous'){
   if(migration)migration.hidden=true;if(recovery)recovery.hidden=true;migrationHandler=null;migrationBusy=false;recoveryHandler=null;recoveryBusy=false;setBusy(false);setMode(shell,options.mode||mode);
  }else{
   if(register)register.hidden=true;
   if(login)login.hidden=true;
   setBusy(true);
  }
  if(options.message!==undefined)announce(options.message,options.messageState||'info');
  return normalized;
 };
 const showFarmingRecovery=(preview,onConfirm)=>{
  if(!recovery||!recoveryConfirm||typeof onConfirm!=='function')throw Error('掛機恢復確認介面尚未載入');
  register.hidden=true;login.hidden=true;if(migration)migration.hidden=true;recovery.hidden=false;shell.dataset.authState='authenticated';
  const characters=Array.isArray(preview?.characters)?preview.characters:[];
  recoveryCharacters.textContent=characters.map(entry=>{const report=entry.report||{},hours=Math.floor(Number(entry.durationMs||0)/3600000),minutes=Math.floor(Number(entry.durationMs||0)%3600000/60000),duration=`${hours} 小時 ${minutes} 分`;return `${entry.name}｜中斷掛機 ${duration}\n預估：${Number(report.defeated||0).toLocaleString('zh-TW')} 次擊敗、${Number(report.gainedXp||0).toLocaleString('zh-TW')} EXP、${Number(report.gainedGold||0).toLocaleString('zh-TW')} 金幣`;}).join('\n\n')||'沒有可恢復的掛機資料';
  recoveryHandler=onConfirm;recoveryBusy=false;recoveryConfirm.disabled=false;announce('請核對中斷掛機與預估收益後再確認恢復。','info');
 };
 const hideFarmingRecovery=()=>{if(recovery)recovery.hidden=true;recoveryHandler=null;recoveryBusy=false;};
 recoveryConfirm?.addEventListener('click',async()=>{
  if(recoveryBusy||typeof recoveryHandler!=='function')return;recoveryBusy=true;recoveryConfirm.disabled=true;announce('正在安全恢復並結算掛機收益，請勿關閉頁面…');
  try{await recoveryHandler();hideFarmingRecovery();}
  catch(error){recoveryBusy=false;recoveryConfirm.disabled=false;announce(error?.userMessage||error?.message||'掛機恢復未完成，原資料保持可恢復。','error');}
 });
 const showGoldMigration=(preview,onConfirm)=>{
  if(!migration||!migrationConfirm||typeof onConfirm!=='function')throw Error('金幣轉換確認介面尚未載入');
  register.hidden=true;login.hidden=true;migration.hidden=false;shell.dataset.authState='authenticated';
  const characters=Array.isArray(preview?.characters)?preview.characters:[];
  migrationCharacters.textContent=characters.map(entry=>`${entry.name}：${Number(entry.gold).toLocaleString('zh-TW')} 金幣`).join('\n')||'沒有角色金幣';
  migrationTotal.textContent=Number(preview?.total).toLocaleString('zh-TW');migrationHandler=onConfirm;migrationBusy=false;migrationConfirm.disabled=false;
  announce('請核對角色金幣後，由你確認一次性轉換。','info');
 };
 const hideGoldMigration=()=>{if(migration)migration.hidden=true;migrationHandler=null;migrationBusy=false;};
 migrationConfirm?.addEventListener('click',async()=>{
  if(migrationBusy||typeof migrationHandler!=='function')return;migrationBusy=true;migrationConfirm.disabled=true;announce('正在安全轉換金幣資料，請勿關閉頁面…');
  try{await migrationHandler();hideGoldMigration();}
  catch(error){migrationBusy=false;migrationConfirm.disabled=false;announce(error?.userMessage||error?.message||'金幣轉換未完成，原資料保持不變。','error');}
 });
 const invoke=async(name,values)=>{
  const handler=handlers[name];if(typeof handler!=='function'){announce('帳號服務正在初始化，請稍候。');return;}
  setBusy(true);announce('正在驗證帳號…');
  try{await handler(values);}catch(error){setAuthState(error?.code==='verification-unavailable'?'checking':'anonymous',{mode,message:error?.userMessage||'帳號操作未完成，請稍後再試。',messageState:'error'});}finally{if(shell.dataset.authState==='anonymous')setBusy(false);}
 };
 setAuthState('checking',{message:'正在檢查登入狀態…'});
 shell.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>{
  shell.querySelectorAll('.account-auth-form').forEach(clearFormErrors);announce('');mode=setMode(shell,button.dataset.authMode);
 }));
 shell.querySelectorAll('[data-password-toggle]').forEach(button=>button.addEventListener('click',()=>{
  const input=shell.querySelector('#'+button.dataset.passwordToggle);if(!input)return;
  const revealing=input.type==='password';input.type=revealing?'text':'password';button.textContent=revealing?'隱藏':'顯示';button.setAttribute('aria-pressed',String(revealing));button.setAttribute('aria-label',revealing?'隱藏密碼':'顯示密碼');
 }));

 register?.addEventListener('submit',event=>{
  event.preventDefault();
  const values={email:register.elements.email.value,password:register.elements.password.value,passwordConfirm:register.elements.passwordConfirm.value};
  const errors=validateRegistration(values);
  if(Object.keys(errors).length){showFormErrors(register,errors,{email:'register-email',password:'register-password',passwordConfirm:'register-password-confirm'});announce('請修正標示的欄位。','error');return;}
  clearFormErrors(register);void invoke('register',{email:values.email.trim(),password:values.password});
 });

 login?.addEventListener('submit',event=>{
  event.preventDefault();
  const values={email:login.elements.email.value,password:login.elements.password.value};
  const errors=validateLogin(values);
  if(Object.keys(errors).length){showFormErrors(login,errors,{email:'account-login-email',password:'account-login-password'});announce('請修正標示的欄位。','error');return;}
  clearFormErrors(login);void invoke('login',{email:values.email.trim(),password:values.password});
 });
 shell.querySelector('#account-forgot-password')?.addEventListener('click',()=>void invoke('forgotPassword',{email:String(login?.elements.email.value||'').trim()}));
 return {announce,setBusy,setAuthState,showFarmingRecovery,hideFarmingRecovery,showGoldMigration,hideGoldMigration,setHandlers(next){handlers={...next};},setMode(next){mode=setMode(shell,next);return mode;}};
}

return {isPreviewEnabled,validateRegistration,validateLogin,setMode,mount};
});
