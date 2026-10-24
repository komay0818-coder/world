const fs=require('fs'),path=require('path');
const AccountAuthView=require('../account-auth-view.js');
function check(value,message){if(!value)throw Error(message);}
function equal(actual,expected,message){if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error(message+`\nexpected ${JSON.stringify(expected)}\nactual ${JSON.stringify(actual)}`);}

(async()=>{
check(AccountAuthView.isPreviewEnabled({hostname:'127.0.0.1',search:'?accountUi=1'}),'local preview flag should enable account UI');
check(AccountAuthView.isPreviewEnabled({hostname:'localhost',search:'?accountUi=1'}),'localhost preview flag should enable account UI');
check(!AccountAuthView.isPreviewEnabled({hostname:'komay0818-coder.github.io',search:'?accountUi=1'}),'production hostname must retain legacy entry');
check(!AccountAuthView.isPreviewEnabled({hostname:'127.0.0.1',search:''}),'local entry without flag must retain legacy entry');

equal(AccountAuthView.validateRegistration({email:'player@example.com',password:'Sword1234',passwordConfirm:'Sword1234'}),{},'valid registration should pass');
check(AccountAuthView.validateRegistration({email:'bad',password:'short',passwordConfirm:'other'}).email,'invalid email should be reported');
check(AccountAuthView.validateRegistration({email:'player@example.com',password:'abcdefgh',passwordConfirm:'abcdefgh'}).password,'password without a number should be rejected');
check(AccountAuthView.validateRegistration({email:'player@example.com',password:'Sword1234',passwordConfirm:'Sword1235'}).passwordConfirm,'password mismatch should be reported');
equal(AccountAuthView.validateLogin({email:'player@example.com',password:'anything'}),{},'valid login fields should pass');
check(AccountAuthView.validateLogin({email:'',password:''}).email,'missing login email should be reported');

function element(){return {hidden:false,disabled:false,dataset:{},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},removeAttribute(){},setAttribute(){},focus(){}};}
const register=element(),login=element(),shell={dataset:{},querySelector(selector){return selector==='#account-register-form'?register:selector==='#account-login-form'?login:null;}};
equal(AccountAuthView.setMode(shell,'login'),'login','mode switch should select login');
check(register.hidden&&!login.hidden,'login mode should hide registration and show login');
equal(AccountAuthView.setMode(shell,'register'),'register','mode switch should select registration');
check(!register.hidden&&login.hidden,'registration mode should hide login and show registration');

const mountedRegister=element(),mountedLogin=element(),message=element(),recovery=element(),recoveryCharacters=element(),recoveryConfirm=element(),migration=element(),migrationCharacters=element(),migrationTotal=element(),migrationConfirm=element(),controls=[element(),element(),recoveryConfirm,migrationConfirm];
let migrationClick=null;migrationConfirm.addEventListener=(type,handler)=>{if(type==='click')migrationClick=handler;};
let recoveryClick=null;recoveryConfirm.addEventListener=(type,handler)=>{if(type==='click')recoveryClick=handler;};
const mountedShell={dataset:{},hidden:true,querySelector(selector){if(selector==='#account-register-form')return mountedRegister;if(selector==='#account-login-form')return mountedLogin;if(selector==='#account-auth-message')return message;if(selector==='#farming-recovery-panel')return recovery;if(selector==='#farming-recovery-characters')return recoveryCharacters;if(selector==='#farming-recovery-confirm')return recoveryConfirm;if(selector==='#shared-gold-migration-panel')return migration;if(selector==='#shared-gold-migration-characters')return migrationCharacters;if(selector==='#shared-gold-migration-total')return migrationTotal;if(selector==='#shared-gold-migration-confirm')return migrationConfirm;return null;},querySelectorAll(selector){if(selector==='button,input')return controls;if(selector==='.account-auth-form')return [mountedRegister,mountedLogin];return [];}};
const legacy=element(),document={body:{classList:{toggle(){}}},querySelector(selector){if(selector==='#legacy-login-content')return legacy;if(selector==='#account-auth-shell')return mountedShell;return null;}};
const mounted=AccountAuthView.mount(document,true);
check(mountedShell.dataset.authState==='checking','account UI should begin in checking state');
check(mountedRegister.hidden&&mountedLogin.hidden,'checking state should hide both account forms');
mounted.setAuthState('anonymous',{message:'請登入帳號。'});
check(!mountedRegister.hidden&&mountedLogin.hidden,'anonymous state should expose the selected account form');
mounted.setAuthState('authenticated',{message:'驗證成功',messageState:'success'});
check(mountedRegister.hidden&&mountedLogin.hidden&&message.textContent==='驗證成功','authenticated state should hide forms and show verified status');
let recovered=0,releaseRecovery;mounted.showFarmingRecovery({characters:[{name:'角色甲',durationMs:7200000,report:{defeated:12,gainedXp:34,gainedGold:24}}]},async()=>{recovered++;await new Promise(resolve=>releaseRecovery=resolve);});check(!recovery.hidden&&recoveryCharacters.textContent.includes('角色甲')&&recoveryCharacters.textContent.includes('24 金幣'),'stale solo recovery shows the role and estimated existing-policy rewards');const firstRecovery=recoveryClick(),duplicateRecovery=recoveryClick();check(recovered===1&&recoveryConfirm.disabled,'rapid recovery confirmation only submits once');releaseRecovery();await Promise.all([firstRecovery,duplicateRecovery]);check(recovered===1&&recovery.hidden,'successful recovery closes its confirmation panel');
let confirmed=0,releaseConfirmation;mounted.showGoldMigration({characters:[{name:'角色甲',gold:1200},{name:'角色乙',gold:30}],total:1230},async()=>{confirmed++;await new Promise(resolve=>releaseConfirmation=resolve);});check(!migration.hidden&&!migrationConfirm.disabled&&migrationCharacters.textContent.includes('角色甲')&&migrationTotal.textContent==='1,230','legacy gold preview shows each role and the verified total');const firstConfirmation=migrationClick(),duplicateConfirmation=migrationClick();check(confirmed===1&&migrationConfirm.disabled,'rapid confirmation clicks invoke migration only once');releaseConfirmation();await Promise.all([firstConfirmation,duplicateConfirmation]);check(confirmed===1&&migration.hidden,'successful explicit confirmation closes the prompt');

const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'styles/account-auth.css'),'utf8'),script=fs.readFileSync(path.join(root,'script.js'),'utf8');
for(const id of ['legacy-login-content','account-auth-shell','account-register-form','register-email','register-password','register-password-confirm','account-login-form','account-login-email','account-login-password','account-forgot-password','farming-recovery-panel','farming-recovery-confirm','shared-gold-migration-panel','shared-gold-migration-confirm'])check(html.includes(`id="${id}"`),`missing account UI element ${id}`);
check(html.includes('assets/main-menu-background.png')||css.includes("../assets/main-menu-background.png"),'account UI should use confirmed camp background');
check(css.includes('@media(max-width:700px)'),'account UI should include portrait mobile layout');
check(html.includes('id="login-form"')&&html.includes('id="player-name"'),'legacy entry markup must remain available');
check(script.includes('!window.accountAuthPreviewEnabled && (activePlaytestName || savedName)'),'saved local profile must not bypass isolated preview');
check(!fs.readFileSync(path.join(root,'account-auth-view.js'),'utf8').includes('supabase.co/auth'),'phase one must not call Supabase Auth');
check(html.includes('account-session-controller.js')&&html.includes('account-auth-entry.js'),'account UI loads the isolated Auth controller without changing the form layout');

console.log('Account auth interface tests passed: 23');
})().catch(error=>{console.error(error);process.exitCode=1;});
