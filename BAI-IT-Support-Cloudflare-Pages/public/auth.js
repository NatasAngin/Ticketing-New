let accounts=[],activeUser=null;
const authApi=async(path,options={})=>{const response=await fetch(path,{credentials:"same-origin",cache:"no-store",headers:{"content-type":"application/json",...(options.headers||{})},...options});let data;try{data=await response.json()}catch{throw Error("Respons server tidak valid.")}if(!response.ok||data.ok===false)throw Error(data.error||"Permintaan gagal.");return data};
function isAdmin(){return !!activeUser&&["administrator","superadmin"].includes(activeUser.role)}
function isSuperAdmin(){return !!activeUser&&activeUser.role==="superadmin"}
function canSeeTicket(t){return sessionEnabled()&&(isAdmin()||t.ownerId===activeUser.id)}
function authEscape(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function authError(id,error){const el=document.getElementById(id);if(el)el.textContent=error instanceof Error?error.message:String(error||"")}
function accountEnabled(a){return !!a&&a.active!==false}
function sessionEnabled(){return !!activeUser}
function roleLabel(role){return role==="superadmin"?"Super Admin":role==="administrator"?"Administrator":"User"}
async function loadAccounts(user=activeUser){if(!user||!["administrator","superadmin"].includes(user.role)){accounts=[];return}const data=await authApi("/api/accounts");accounts=Array.isArray(data.accounts)?data.accounts:[]}
function setLoggedIn(user){
 activeUser=user;document.documentElement.classList.remove("auth-locked");document.documentElement.classList.toggle("user-mode",!isAdmin());
 document.getElementById("session-name").textContent=user.name;document.getElementById("session-role").textContent=roleLabel(user.role);
 view=isAdmin()?"dashboard":"tickets";ticketGroup="active";
 const nav=document.querySelector('[data-view="'+view+'"]');if(nav)nav.click();render();renderAccounts();
}
async function bootAuth(){
 const form=document.getElementById("login-form"),button=document.getElementById("login-button");
 button.disabled=true;authError("login-error","");
 try{
  const me=await authApi("/api/auth/me");await loadAccounts(me.user);setLoggedIn(me.user);return;
 }catch{}
 try{
  const status=await authApi("/api/auth/status"),setup=!!status.setup_required;
  document.getElementById("auth-title").textContent=setup?"Buat Super Admin Pertama":"Login BAI IT Support";
  document.getElementById("auth-description").textContent=setup?"Buat akun Super Admin atas nama Trisnardi Boesyanto untuk mengelola seluruh akses.":"Masuk untuk mengakses layanan IT Support PT Borneo Alumina Indonesia.";
  document.getElementById("setup-name-field").classList.toggle("hidden",!setup);
  form.elements.fullName.required=setup;form.elements.password.minLength=setup?12:1;
  form.elements.password.autocomplete=setup?"new-password":"current-password";
  button.textContent=setup?"Buat Super Admin & masuk":"Masuk";
  document.getElementById("login-screen").classList.remove("hidden");
  document.documentElement.classList.add("auth-locked");
 }catch(error){authError("login-error","Layanan database belum siap. "+error.message);button.disabled=true;return}
 button.disabled=false;
}
document.getElementById("login-form").onsubmit=async e=>{
 e.preventDefault();const f=e.target,button=document.getElementById("login-button");button.disabled=true;authError("login-error","");
 try{
  const username=f.elements.username.value.trim().toLowerCase(),password=f.elements.password.value;
  if(!username||!password)throw Error("Username dan password wajib diisi.");
  const status=await authApi("/api/auth/status");
  let data;
  if(status.setup_required){
   const fullName=f.elements.fullName.value.trim();if(fullName.replace(/\s+/g," ").toLowerCase()!=="trisnardi boesyanto")throw Error("Super Admin pertama harus menggunakan nama Trisnardi Boesyanto.");
   if(password.length<12)throw Error("Password Super Admin minimal 12 karakter.");
   data=await authApi("/api/auth/setup",{method:"POST",body:JSON.stringify({fullName,username,password})});
  }else data=await authApi("/api/auth/login",{method:"POST",body:JSON.stringify({username,password})});
  await loadAccounts(data.user);f.reset();setLoggedIn(data.user);
 }catch(error){authError("login-error",error)}finally{button.disabled=false}
};
async function logout(){
 try{if(typeof closeDiscussion==="function")closeDiscussion();if(typeof clearDiscussionNotifications==="function")clearDiscussionNotifications();await authApi("/api/auth/logout",{method:"POST",body:"{}"})}catch{}
 activeUser=null;accounts=[];document.documentElement.classList.add("auth-locked");document.documentElement.classList.remove("user-mode");
 document.querySelectorAll("dialog[open]").forEach(d=>d.close());document.querySelectorAll("form").forEach(f=>f.reset());
 for(const id of ["rows","cards","kpirows","bars","legend","sla-alerts","pic-rows","category-rows","account-rows"])document.getElementById(id).innerHTML="";
 document.getElementById("toast").style.display="none";notifyStates=new Map();document.getElementById("login-screen").classList.remove("hidden");bootAuth();
}
document.getElementById("logout").onclick=logout;
document.getElementById("account-logout").onclick=logout;
function roleOptions(selected){return [["user","User"],["administrator","Administrator"],...(isSuperAdmin()||selected==="superadmin"?[["superadmin","Super Admin"]]:[])].map(([value,label])=>'<option value="'+value+'" '+(selected===value?"selected":"")+'>'+label+"</option>").join("")}
function configureRoleOptions(select,selected){select.innerHTML=roleOptions(selected);select.value=selected}
function assertAccountPermission(target,nextRole){
 if(!isAdmin())throw Error("Hanya Administrator atau Super Admin yang dapat mengelola akun.");
 if(target?.role==="superadmin"&&!isSuperAdmin())throw Error("Administrator tidak dapat mengubah akun Super Admin.");
 if(target?.role==="administrator"&&nextRole!=="administrator"&&!isSuperAdmin())throw Error("Hanya Super Admin yang dapat menurunkan role Administrator.");
 if(nextRole==="superadmin"&&!isSuperAdmin())throw Error("Hanya Super Admin yang dapat membuat akun Super Admin.");
 if(target?.role==="superadmin"&&nextRole!=="superadmin"&&accounts.filter(a=>a.role==="superadmin"&&accountEnabled(a)).length<=1)throw Error("Super Admin terakhir tidak dapat diturunkan atau dihapus.");
}
function renderAccounts(){
 if(!isAdmin()){document.getElementById("account-rows").innerHTML="";return}
 configureRoleOptions(document.getElementById("account-form").elements.role,"user");
 document.getElementById("account-rows").innerHTML=accounts.filter(accountEnabled).map(a=>{
  const protectedAccount=a.role==="superadmin"&&!isSuperAdmin(),roleLocked=a.id===activeUser.id||protectedAccount||a.role==="administrator"&&!isSuperAdmin();
  return "<tr><td><strong>"+authEscape(a.name)+"</strong><small>"+authEscape(a.username)+"</small></td><td><select aria-label='Role "+authEscape(a.username)+"' data-account-role='"+authEscape(a.id)+"' "+(roleLocked?"disabled":"")+">"+roleOptions(a.role)+"</select></td><td>"+(a.id===activeUser.id?"Akun Anda":protectedAccount?"Super Admin · dilindungi":"Aktif")+"</td><td><button type='button' class='edit' data-edit-account='"+authEscape(a.id)+"' "+(protectedAccount?"disabled":"")+">Edit Akun</button> <button type='button' data-toggle-account='"+authEscape(a.id)+"' "+(roleLocked?"disabled":"")+">Nonaktifkan</button> <button type='button' class='danger' data-delete-account='"+authEscape(a.id)+"' "+(roleLocked?"disabled":"")+">Hapus</button></td></tr>";
 }).join("")||"<tr><td colspan='4'>Belum ada akun.</td></tr>";
 document.querySelectorAll("[data-toggle-account]").forEach(b=>b.onclick=()=>accountAction(b.dataset.toggleAccount,"toggle"));
 document.querySelectorAll("[data-delete-account]").forEach(b=>b.onclick=()=>accountAction(b.dataset.deleteAccount,"delete"));
 document.querySelectorAll("[data-edit-account]").forEach(b=>b.onclick=()=>openAccountEdit(b.dataset.editAccount));
 document.querySelectorAll("[data-account-role]").forEach(s=>s.onchange=async()=>{try{const a=accounts.find(x=>x.id===s.dataset.accountRole);assertAccountPermission(a,s.value);await updateAccount(a.id,{name:a.name,username:a.username,role:s.value,password:""});await loadAccounts();renderAccounts();toast("Role akun diperbarui")}catch(error){authError("account-error",error);renderAccounts()}});
}
document.getElementById("account-form").onsubmit=async e=>{
 e.preventDefault();const f=e.target,b=f.querySelector("button[type='submit']");authError("account-error","");if(!isAdmin()){authError("account-error","Hanya administrator yang dapat menambahkan akun.");return}b.disabled=true;
 try{const name=f.elements.fullName.value.trim(),username=f.elements.username.value.trim().toLowerCase(),password=f.elements.password.value,role=f.elements.role.value;assertAccountPermission(null,role);if(!name||!username)throw Error("Nama dan username wajib diisi.");if(password.length<8)throw Error("Password minimal 8 karakter.");await authApi("/api/accounts",{method:"POST",body:JSON.stringify({fullName:name,username,password,role})});f.reset();await loadAccounts();renderAccounts();toast("Akun berhasil ditambahkan")}catch(error){authError("account-error",error)}finally{b.disabled=false}
};
function openAccountEdit(id){
 if(!isAdmin())return;const a=accounts.find(x=>x.id===id);if(!a)return;
 if(a.role==="superadmin"&&!isSuperAdmin()){authError("account-error","Akun Super Admin dilindungi.");return}
 const f=document.getElementById("account-edit-form");f.reset();configureRoleOptions(f.elements.role,a.role);f.elements.accountId.value=a.id;f.elements.fullName.value=a.name;f.elements.username.value=a.username;f.elements.role.value=a.role;f.elements.role.disabled=id===activeUser.id||a.role==="administrator"&&!isSuperAdmin();authError("account-edit-error","");document.getElementById("account-edit-modal").showModal();
}
function closeAccountEdit(){document.getElementById("account-edit-form").reset();document.getElementById("account-edit-modal").close()}
document.getElementById("account-edit-close").onclick=closeAccountEdit;document.getElementById("account-edit-cancel").onclick=closeAccountEdit;
async function updateAccount(id,values){
 if(!isAdmin())throw Error("Hanya administrator yang dapat mengedit akun.");
 const a=accounts.find(x=>x.id===id);if(!a)throw Error("Akun tidak ditemukan.");assertAccountPermission(a,values.role);
 if(id===activeUser.id&&values.role!==a.role)throw Error("Role akun yang sedang digunakan tidak dapat diturunkan.");
 await authApi("/api/accounts/"+encodeURIComponent(id),{method:"PUT",body:JSON.stringify({fullName:values.name,username:values.username,role:values.role,password:values.password||""})});
 if(id===activeUser.id){activeUser={...activeUser,name:values.name,username:values.username};document.getElementById("session-name").textContent=values.name}
}
document.getElementById("account-edit-form").onsubmit=async e=>{
 e.preventDefault();const f=e.target,b=f.querySelector("button[type='submit']");b.disabled=true;authError("account-edit-error","");
 try{await updateAccount(f.elements.accountId.value,{name:f.elements.fullName.value.trim(),username:f.elements.username.value.trim().toLowerCase(),role:f.elements.role.value,password:f.elements.password.value});await loadAccounts();closeAccountEdit();renderAccounts();toast("Akun berhasil diperbarui")}catch(error){authError("account-edit-error",error)}finally{b.disabled=false}
};
async function accountAction(id,action){
 const a=accounts.find(x=>x.id===id);if(!a)return;
 if(action==="delete"&&!confirm("Hapus/nonaktifkan akun "+a.name+"? Akun tidak dapat login lagi. Riwayat tiket tetap dipertahankan."))return;
 try{assertAccountPermission(a,a.role);if(a.id===activeUser.id)throw Error("Akun yang sedang dipakai tidak dapat dinonaktifkan.");if(a.role==="administrator"&&!isSuperAdmin())throw Error("Hanya Super Admin yang dapat mengelola akun Administrator.");
  if(action==="delete")await authApi("/api/accounts/"+encodeURIComponent(id),{method:"DELETE",body:"{}"});
  else await authApi("/api/accounts/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify({active:false})});
  await loadAccounts();renderAccounts();render();toast(action==="delete"?"Akun dinonaktifkan":"Status akun diperbarui");
 }catch(error){authError("account-error",error)}
}
async function changeAccountRole(id,role){const a=accounts.find(x=>x.id===id);if(!a)throw Error("Akun tidak ditemukan.");assertAccountPermission(a,role);await updateAccount(id,{name:a.name,username:a.username,role,password:""});await loadAccounts()}
async function setAccountAccess(id,action){return accountAction(id,action)}
