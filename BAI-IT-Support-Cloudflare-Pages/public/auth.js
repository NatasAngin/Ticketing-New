const ACCOUNT_KEY='bai-support-accounts-v1';let accounts=[],activeUser=null;
try{const data=JSON.parse(localStorage.getItem(ACCOUNT_KEY)||'[]');if(!Array.isArray(data))throw Error('Invalid accounts');accounts=data}catch{document.documentElement.dataset.accountError='true'}
function isAdmin(){return !!activeUser&&accounts.some(a=>accountEnabled(a)&&a.id===activeUser.id&&['administrator','superadmin'].includes(a.role))}
function isSuperAdmin(){return !!activeUser&&accounts.some(a=>accountEnabled(a)&&a.id===activeUser.id&&a.role==='superadmin')}
initializeDesignatedSuperAdmin();
function canSeeTicket(t){return sessionEnabled()&&(isAdmin()||t.ownerId===activeUser.id)}
function authEscape(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function saveAccounts(next){localStorage.setItem(ACCOUNT_KEY,JSON.stringify(next));accounts=next}
async function passwordRecord(password,salt){const bytes=salt?Uint8Array.from(salt.match(/.{2}/g),s=>parseInt(s,16)):crypto.getRandomValues(new Uint8Array(16));const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:bytes,iterations:210000,hash:'SHA-256'},key,256);const hex=a=>Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');return{salt:hex(bytes),hash:hex(new Uint8Array(bits))}}
function authError(id,error){document.getElementById(id).textContent=error instanceof Error?error.message:error}
function bootAuth(){
 const setup=accounts.length===0,blocked=document.documentElement.dataset.accountError==='true';
 document.getElementById('auth-title').textContent=setup?'Buat Super Admin Pertama':'Login BAI IT Support';
 document.getElementById('auth-description').textContent=setup?'Buat akun Super Admin atas nama Trisnardi Boesyanto untuk mengelola seluruh akses.':'Masuk untuk mengakses layanan IT Support PT Borneo Alumina Indonesia.';
 document.getElementById('setup-name-field').classList.toggle('hidden',!setup);document.getElementById('login-form').elements.fullName.required=setup;
 document.getElementById('login-button').textContent=setup?'Buat Super Admin & masuk':'Masuk';
 if(blocked){authError('login-error','Data akun tidak dapat dibaca. Hubungi administrator; data tiket tidak dihapus.');document.getElementById('login-button').disabled=true}
 if(!globalThis.crypto?.subtle){authError('login-error','Browser ini belum mendukung login lokal. Buka dashboard dengan Edge atau Chrome terbaru.');document.getElementById('login-button').disabled=true}
}
document.getElementById('login-form').onsubmit=async e=>{
 e.preventDefault();const f=e.target,button=document.getElementById('login-button');button.disabled=true;authError('login-error','');
 try{
  if(document.documentElement.dataset.accountError==='true')throw Error('Data akun tidak dapat dibaca.');
  const username=f.elements.username.value.trim().toLowerCase(),password=f.elements.password.value;
  if(!username)throw Error('Username wajib diisi.');
  let account;
  if(accounts.length===0){
   const name=f.elements.fullName.value.trim();if(normalizeSuperName(name)!=='trisnardi boesyanto')throw Error('Super Admin pertama harus menggunakan nama Trisnardi Boesyanto.');if(!name||password.length<8)throw Error('Nama wajib diisi dan password minimal 8 karakter.');
   const secret=await passwordRecord(password);if(accounts.length)throw Error('Administrator sudah dibuat. Silakan login.');
   account={id:crypto.randomUUID(),name,username,role:'superadmin',...secret,createdAt:new Date().toISOString()};saveAccounts([account]);localStorage.setItem('bai-superadmin-binding-v1',account.id);
  }else{
   account=accounts.find(a=>a.username===username);const secret=await passwordRecord(password,account?.salt);if(!account||secret.hash!==account.hash)throw Error('Username atau password salah.');if(!accountEnabled(account))throw Error('Akun nonaktif atau telah dihapus. Hubungi administrator.');
  }
  activeUser={id:account.id,name:account.name,username:account.username};f.reset();document.documentElement.classList.remove('auth-locked');document.documentElement.classList.toggle('user-mode',!isAdmin());
  document.getElementById('session-name').textContent=account.name;document.getElementById('session-role').textContent=isSuperAdmin()?'Super Admin':isAdmin()?'Administrator':'User';
  view=isAdmin()?'dashboard':'tickets';ticketGroup='active';document.querySelector('[data-view="'+view+'"]').click();render();renderAccounts();
 }catch(error){authError('login-error',error)}finally{button.disabled=false}
};
function logout(){
 if(typeof closeDiscussion==='function')closeDiscussion();if(typeof clearDiscussionNotifications==='function')clearDiscussionNotifications();activeUser=null;document.documentElement.classList.add('auth-locked');document.documentElement.classList.remove('user-mode');
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.querySelectorAll('form').forEach(f=>f.reset());
 for(const id of ['rows','cards','kpirows','bars','legend','sla-alerts','pic-rows','category-rows','account-rows'])document.getElementById(id).innerHTML='';
 document.getElementById('toast').style.display='none';notifyStates=new Map();bootAuth();
}
document.getElementById('logout').onclick=logout;
function renderAccounts(){
 if(!isAdmin()){document.getElementById('account-rows').innerHTML='';return}
 configureRoleOptions(document.getElementById('account-form').elements.role,'user');
 document.getElementById('account-rows').innerHTML=accounts.filter(a=>!a.deletedAt).map(a=>{const protectedAccount=a.role==='superadmin'&&!isSuperAdmin();return '<tr><td><strong>'+authEscape(a.name)+'</strong><small>'+authEscape(a.username)+'</small></td><td><select aria-label="Role '+authEscape(a.username)+'" data-account-role="'+authEscape(a.id)+'" '+(a.id===activeUser.id||protectedAccount||a.role==='administrator'&&!isSuperAdmin()?'disabled':'')+'>'+roleOptions(a.role)+'</select></td><td>'+(a.active===false?'Nonaktif':protectedAccount?'Super Admin · dilindungi':a.id===activeUser.id?'Akun Anda':'Aktif')+'</td><td><button type="button" class="edit" data-edit-account="'+authEscape(a.id)+'" '+(protectedAccount?'disabled':'')+'>Edit Akun</button> <button type="button" data-toggle-account="'+authEscape(a.id)+'" '+(protectedAccount||a.role==='administrator'&&!isSuperAdmin()||a.id===activeUser.id?'disabled':'')+'>'+(a.active===false?'Aktifkan':'Nonaktifkan')+'</button> <button type="button" class="danger" data-delete-account="'+authEscape(a.id)+'" '+(protectedAccount||a.role==='administrator'&&!isSuperAdmin()||a.id===activeUser.id?'disabled':'')+'>Hapus</button></td></tr>'}).join('');
 document.querySelectorAll('[data-toggle-account]').forEach(button=>button.onclick=()=>accountAction(button.dataset.toggleAccount,'toggle'));document.querySelectorAll('[data-delete-account]').forEach(button=>button.onclick=()=>accountAction(button.dataset.deleteAccount,'delete'));
 document.querySelectorAll('[data-edit-account]').forEach(button=>button.onclick=()=>openAccountEdit(button.dataset.editAccount));
 document.querySelectorAll('[data-account-role]').forEach(select=>select.onchange=()=>{try{changeAccountRole(select.dataset.accountRole,select.value);renderAccounts();toast('Role akun diperbarui')}catch(error){authError('account-error',error);renderAccounts()}});
}
function changeAccountRole(id,role){
 if(!isAdmin())throw Error('Hanya administrator yang dapat mengubah role.');if(!['user','administrator','superadmin'].includes(role))throw Error('Role tidak valid.');
 assertAccountPermission(accounts.find(a=>a.id===id),role);if(id===activeUser.id)throw Error('Role akun yang sedang digunakan tidak dapat diubah.');
 if(!accounts.some(a=>a.id===id))throw Error('Akun tidak ditemukan.');saveAccounts(accounts.map(a=>a.id===id?{...a,role}:a));
}
document.getElementById('account-form').onsubmit=async e=>{
 e.preventDefault();const f=e.target,button=f.querySelector('button[type="submit"]');authError('account-error','');if(!isAdmin()){authError('account-error','Hanya administrator yang dapat menambahkan akun.');return}button.disabled=true;
 try{const name=f.elements.fullName.value.trim(),username=f.elements.username.value.trim().toLowerCase(),password=f.elements.password.value,role=f.elements.role.value;
  assertAccountPermission(null,role);if(!name||!username)throw Error('Nama dan username wajib diisi.');if(password.length<8)throw Error('Password minimal 8 karakter.');if(!['user','administrator','superadmin'].includes(role))throw Error('Role tidak valid.');if(accounts.some(a=>a.username===username))throw Error('Username sudah digunakan.');
  const secret=await passwordRecord(password);if(!isAdmin())throw Error('Sesi administrator sudah berakhir.');assertAccountPermission(null,role);if(accounts.some(a=>a.username===username))throw Error('Username sudah digunakan.');
  saveAccounts([...accounts,{id:crypto.randomUUID(),name,username,role,...secret,createdAt:new Date().toISOString()}]);f.reset();renderAccounts();toast('Akun berhasil ditambahkan');
 }catch(error){authError('account-error',error)}finally{button.disabled=false}
};
window.addEventListener('storage',e=>{if(e.key===ACCOUNT_KEY)location.reload()});

document.getElementById('account-logout').onclick=logout;
function openAccountEdit(id){if(!isAdmin())return;const account=accounts.find(a=>a.id===id);if(!account)return;if(account.role==='superadmin'&&!isSuperAdmin()){authError('account-error','Akun Super Admin dilindungi.');return}const f=document.getElementById('account-edit-form');f.reset();configureRoleOptions(f.elements.role,account.role);f.elements.accountId.value=account.id;f.elements.fullName.value=account.name;f.elements.username.value=account.username;f.elements.role.value=account.role;f.elements.role.disabled=id===activeUser.id||account.role==='administrator'&&!isSuperAdmin();authError('account-edit-error','');document.getElementById('account-edit-modal').showModal()}
function closeAccountEdit(){document.getElementById('account-edit-form').reset();document.getElementById('account-edit-modal').close()}
document.getElementById('account-edit-close').onclick=closeAccountEdit;document.getElementById('account-edit-cancel').onclick=closeAccountEdit;
async function updateAccount(id,values){
 if(!isAdmin())throw Error('Hanya administrator yang dapat mengedit akun.');
 const account=accounts.find(a=>a.id===id);if(!account||account.deletedAt)throw Error('Akun tidak ditemukan.');const snapshot=JSON.stringify(account),actorId=activeUser.id;
 const name=values.name.trim(),username=values.username.trim().toLowerCase(),role=values.role,password=values.password||'';
 if(!name||!username)throw Error('Nama dan username wajib diisi.');if(!['user','administrator','superadmin'].includes(role))throw Error('Role tidak valid.');
 assertAccountPermission(account,role);if(id===actorId&&role!==account.role)throw Error('Role akun yang sedang digunakan tidak dapat diturunkan.');
 if(accounts.some(a=>a.id!==id&&a.username===username))throw Error('Username sudah digunakan.');
 if(password&&password.length<8)throw Error('Password baru minimal 8 karakter.');const secret=password?await passwordRecord(password):{};
 if(!isAdmin()||activeUser.id!==actorId)throw Error('Sesi administrator telah berubah. Silakan login kembali.');
 assertAccountPermission(accounts.find(a=>a.id===id),role);if(JSON.stringify(accounts.find(a=>a.id===id))!==snapshot)throw Error('Data akun berubah. Buka kembali Edit Akun.');
 if(accounts.some(a=>a.id!==id&&a.username===username))throw Error('Username sudah digunakan.');
 const updated={...account,name,username,role,...secret,updatedAt:new Date().toISOString()};saveAccounts(accounts.map(a=>a.id===id?updated:a));
 if(id===actorId){activeUser={id,name,username};document.getElementById('session-name').textContent=name}
 return updated;
}
document.getElementById('account-edit-form').onsubmit=async e=>{
 e.preventDefault();const f=e.target,button=f.querySelector('button[type="submit"]');button.disabled=true;authError('account-edit-error','');
 try{await updateAccount(f.elements.accountId.value,{name:f.elements.fullName.value,username:f.elements.username.value,role:f.elements.role.value,password:f.elements.password.value});closeAccountEdit();renderAccounts();toast('Akun berhasil diperbarui')}catch(error){authError('account-edit-error',error)}finally{button.disabled=false}
};

function normalizeSuperName(name){return String(name||'').trim().replace(/\s+/g,' ').toLowerCase()}
function initializeDesignatedSuperAdmin(){
 if(document.documentElement.dataset.accountError==='true'||localStorage.getItem('bai-superadmin-binding-v1'))return;
 const candidates=accounts.filter(a=>normalizeSuperName(a.name)==='trisnardi boesyanto');
 if(candidates.length===1){const target=candidates[0];try{saveAccounts(accounts.map(a=>a.id===target.id?{...a,role:'superadmin'}:a));localStorage.setItem('bai-superadmin-binding-v1',target.id)}catch{document.documentElement.dataset.accountError='true'}}
}
function roleOptions(selected){return [['user','User'],['administrator','Administrator'],...(isSuperAdmin()||selected==='superadmin'?[['superadmin','Super Admin']]:[])].map(([value,label])=>'<option value="'+value+'" '+(selected===value?'selected':'')+'>'+label+'</option>').join('')}
function configureRoleOptions(select,selected){select.innerHTML=roleOptions(selected);select.value=selected}
function assertAccountPermission(target,nextRole){
 if(target?.role==='administrator'&&nextRole!=='administrator'&&!isSuperAdmin())throw Error('Hanya Super Admin yang dapat menurunkan role akun Administrator.');
 if(!isAdmin())throw Error('Hanya Administrator atau Super Admin yang dapat mengelola akun.');
 if(target?.role==='superadmin'&&!isSuperAdmin())throw Error('Administrator tidak dapat mengubah atau menghapus akun Super Admin.');
 if(nextRole==='superadmin'&&!isSuperAdmin())throw Error('Hanya Super Admin yang dapat membuat akun Super Admin atau menaikkan role menjadi Super Admin.');
 if(target?.role==='superadmin'&&nextRole!=='superadmin'&&accounts.filter(a=>a.role==='superadmin'&&accountEnabled(a)).length<=1)throw Error('Super Admin terakhir tidak dapat diturunkan atau dihapus.');
}

function accountEnabled(account){return !!account&&!account.deletedAt&&account.active!==false}
function sessionEnabled(){return !!activeUser&&accounts.some(a=>a.id===activeUser.id&&accountEnabled(a))}
function setAccountAccess(id,action){
 if(!['toggle','delete'].includes(action))throw Error('Tindakan tidak valid.');
 const account=accounts.find(a=>a.id===id&&!a.deletedAt);if(!account)throw Error('Akun tidak ditemukan.');assertAccountPermission(account,account.role);
 if(id===activeUser.id)throw Error('Akun yang sedang dipakai tidak dapat dinonaktifkan atau dihapus.');
 if(account.role==='administrator'&&!isSuperAdmin())throw Error('Hanya Super Admin yang dapat menonaktifkan, mengaktifkan, atau menghapus akun Administrator.');
 const removing=action==='delete'||account.active!==false;
 if(removing&&account.role==='superadmin'&&accountEnabled(account)&&accounts.filter(a=>a.role==='superadmin'&&accountEnabled(a)).length<=1)throw Error('Super Admin aktif terakhir tidak dapat dinonaktifkan atau dihapus.');
 const stamp=new Date().toISOString(),changes=action==='delete'?{active:false,deletedAt:stamp,deletedBy:activeUser.id}:{active:account.active===false,updatedAt:stamp};
 // Retain stable identity for ticket ownership and discussion history; deleted accounts cannot log in.
 saveAccounts(accounts.map(a=>a.id===id?{...a,...changes}:a));return changes;
}
function accountAction(id,action){
 const account=accounts.find(a=>a.id===id);if(!account)return;
 if(action==='delete'&&!confirm('Hapus akun '+account.name+'? Akun tidak dapat login lagi. Riwayat tiket dan diskusi tetap disimpan.'))return;
 try{setAccountAccess(id,action);renderAccounts();render();toast(action==='delete'?'Akun dihapus':'Status aktif akun diperbarui')}catch(error){authError('account-error',error)}
}
