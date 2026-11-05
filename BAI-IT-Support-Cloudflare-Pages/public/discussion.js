let discussionTicketId=null,discussionReplyId=null,discussionMessages=[],discussionDbPromise=null,discussionBusy=false,discussionLoad=0;
function discussionAccess(ticketId){const ticket=tickets.find(t=>t.id===ticketId);if(!ticket||!canSeeTicket(ticket))throw Error('Anda tidak memiliki akses ke diskusi tiket ini.');return ticket}
function discussionDatabase(){
 if(!globalThis.indexedDB)return Promise.reject(Error('Browser tidak mendukung penyimpanan diskusi. Gunakan browser yang mendukung IndexedDB.'));
 if(!discussionDbPromise)discussionDbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open('bai-ticket-discussions-v1',1);request.onupgradeneeded=()=>{const store=request.result.createObjectStore('messages',{keyPath:'id'});store.createIndex('ticketId','ticketId',{unique:false})};request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();discussionDbPromise=null};resolve(db)};request.onerror=()=>{discussionDbPromise=null;reject(Error('Penyimpanan diskusi tidak dapat dibuka. Izinkan penyimpanan browser dan coba kembali.'))};request.onblocked=()=>{discussionDbPromise=null;reject(Error('Penyimpanan diskusi sedang dipakai versi lain. Tutup tab dashboard lainnya dan coba kembali.'))}});
 return discussionDbPromise;
}
async function getDiscussionMessages(ticketId){discussionAccess(ticketId);const db=await discussionDatabase();discussionAccess(ticketId);return new Promise((resolve,reject)=>{const tx=db.transaction('messages','readonly'),request=tx.objectStore('messages').index('ticketId').getAll(ticketId);let rows=[];request.onsuccess=()=>{rows=request.result};tx.oncomplete=()=>{try{discussionAccess(ticketId);resolve(rows.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id)))}catch(error){reject(error)}};tx.onerror=tx.onabort=()=>reject(Error('Riwayat diskusi gagal dibaca.'))})}
function writeDiscussionMessage(db,message,actorId){return new Promise((resolve,reject)=>{
 try{discussionAccess(message.ticketId);if(activeUser.id!==actorId)throw Error('Sesi akun berubah. Buka kembali diskusi.');const tx=db.transaction('messages','readwrite');tx.objectStore('messages').add(message);tx.oncomplete=()=>resolve(message);tx.onerror=tx.onabort=()=>reject(Error('Pesan atau lampiran gagal disimpan. Periksa ruang penyimpanan browser.'))}catch(error){reject(error)}
})}
async function validateChatFile(file){
 const extension=String(file.name||'').split('.').pop().toLowerCase();if(!['pdf','jpg','jpeg'].includes(extension))throw Error('Lampiran hanya boleh PDF atau JPG.');
 if(!file.size||file.size>10*1024*1024)throw Error('Setiap file harus berisi data dan maksimal 10 MB.');
 const bytes=new Uint8Array(await file.slice(0,5).arrayBuffer()),pdf=bytes.length>=5&&String.fromCharCode(...bytes)==='%PDF-',jpg=bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(extension==='pdf'&&!pdf||['jpg','jpeg'].includes(extension)&&!jpg)throw Error('Isi file '+file.name+' tidak cocok dengan format PDF/JPG.');
 const safeName=file.name.replace(/[\\/\x00-\x1f]/g,'_').slice(0,180);return{id:crypto.randomUUID(),name:safeName,size:file.size,type:pdf?'application/pdf':'image/jpeg',blob:file.slice(0,file.size,pdf?'application/pdf':'image/jpeg')};
}
async function sendDiscussionMessage(ticketId,text,files=[],replyTo=null){
 discussionAccess(ticketId);const actorId=activeUser.id,actor=accounts.find(a=>a.id===actorId),body=String(text||'').trim();
 if(body.length>5000)throw Error('Pesan maksimal 5.000 karakter.');if(!body&&!files.length)throw Error('Isi pesan atau pilih lampiran terlebih dahulu.');if(files.length>3)throw Error('Maksimal 3 file per pesan.');if(files.reduce((sum,f)=>sum+f.size,0)>20*1024*1024)throw Error('Total lampiran maksimal 20 MB per pesan.');
 const attachments=[];for(const file of files)attachments.push(await validateChatFile(file));
 if(replyTo){const history=await getDiscussionMessages(ticketId);if(!history.some(m=>m.id===replyTo))throw Error('Pesan yang dibalas tidak ditemukan pada tiket ini.')}
 const db=await discussionDatabase();discussionAccess(ticketId);if(!activeUser||activeUser.id!==actorId||!accountEnabled(actor))throw Error('Sesi sudah berakhir atau berubah.');
 const message={id:crypto.randomUUID(),ticketId,authorId:actorId,authorName:actor.name,authorRole:actor.role,text:body,replyTo:replyTo||null,attachments,createdAt:new Date().toISOString()};return writeDiscussionMessage(db,message,actorId);
}
async function openDiscussion(ticketId){
 try{const t=discussionAccess(ticketId);discussionTicketId=ticketId;discussionReplyId=null;discussionMessages=[];$('#discussion-form').reset();$('#discussion-files').textContent='';$('#discussion-error').textContent='';$('#discussion-reply').classList.add('hidden');$('#discussion-ticket').textContent=t.id+' · '+t.title;$('#discussion-messages').innerHTML='<div class="empty">Memuat riwayat diskusi…</div>';$('#discussion-modal').showModal();await refreshDiscussion(true)}catch(error){$('#discussion-error').textContent=error.message}
}
async function refreshDiscussion(scroll=false){
 const ticketId=discussionTicketId,sequence=++discussionLoad;if(!ticketId)return;
 try{const messages=await getDiscussionMessages(ticketId);if(ticketId!==discussionTicketId||sequence!==discussionLoad)return;const box=$('#discussion-messages'),nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<60;discussionMessages=messages;
 const byId=new Map(messages.map(m=>[m.id,m]));box.innerHTML=messages.map(m=>{const quoted=byId.get(m.replyTo),role={superadmin:'Super Admin',administrator:'Administrator',user:'User'}[m.authorRole]||'User';return '<article class="chat-message '+(m.authorId===activeUser.id?'mine':'')+'"><div class="chat-meta"><span>'+esc(m.authorName)+' · '+role+'</span><time>'+esc(new Date(m.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',hourCycle:'h23'})+' WIB')+'</time></div>'+(m.replyTo?'<div class="chat-quote">↳ '+(quoted?esc(quoted.authorName)+': '+esc((quoted.text||'[Lampiran]').slice(0,300)):'Pesan sebelumnya')+'</div>':'')+(m.text?'<p>'+esc(m.text)+'</p>':'')+'<div class="chat-files">'+(m.attachments||[]).map(file=>'<button type="button" data-download-message="'+esc(m.id)+'" data-download-file="'+esc(file.id)+'">↓ '+esc(file.name)+' · '+(file.size/1024).toFixed(0)+' KB</button>').join('')+'</div><button type="button" class="chat-reply-button" data-reply-message="'+esc(m.id)+'">↳ Balas</button></article>'}).join('')||'<div class="empty">Belum ada diskusi. Kirim pesan pertama untuk tiket ini.</div>';
 document.querySelectorAll('[data-reply-message]').forEach(button=>button.onclick=()=>selectDiscussionReply(button.dataset.replyMessage));document.querySelectorAll('[data-download-message]').forEach(button=>button.onclick=()=>downloadDiscussionFile(button.dataset.downloadMessage,button.dataset.downloadFile));if(scroll||nearBottom)box.scrollTop=box.scrollHeight;if((scroll||nearBottom)&&!document.hidden)markDiscussionRead(ticketId,messages);
 }catch(error){if(ticketId===discussionTicketId)$('#discussion-error').textContent=error.message}
}
function selectDiscussionReply(id){try{discussionAccess(discussionTicketId);const message=discussionMessages.find(m=>m.id===id);if(!message)return;discussionReplyId=id;$('#discussion-reply').classList.remove('hidden');$('#discussion-reply-text').textContent='Balas '+message.authorName+': '+(message.text||'[Lampiran]').slice(0,160);$('#discussion-form').elements.message.focus()}catch(error){$('#discussion-error').textContent=error.message}}
function cancelDiscussionReply(){discussionReplyId=null;$('#discussion-reply').classList.add('hidden');$('#discussion-reply-text').textContent=''}
async function downloadDiscussionFile(messageId,fileId){
 try{const ticketId=discussionTicketId;discussionAccess(ticketId);const messages=await getDiscussionMessages(ticketId);if(ticketId!==discussionTicketId)throw Error('Diskusi sudah ditutup.');const message=messages.find(m=>m.id===messageId),file=message?.attachments?.find(f=>f.id===fileId);if(!file)throw Error('Lampiran tidak ditemukan.');discussionAccess(ticketId);const url=URL.createObjectURL(file.blob),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}catch(error){$('#discussion-error').textContent=error.message}
}
function closeDiscussion(){discussionTicketId=null;discussionReplyId=null;discussionMessages=[];discussionLoad++;$('#discussion-modal').close();$('#discussion-form').reset();$('#discussion-messages').innerHTML='';$('#discussion-error').textContent='';cancelDiscussionReply()}
$('#discussion-close').onclick=closeDiscussion;$('#discussion-modal').addEventListener('cancel',event=>{event.preventDefault();closeDiscussion()});$('#discussion-reply-cancel').onclick=cancelDiscussionReply;
$('#discussion-form').elements.files.addEventListener('change',()=>{$('#discussion-files').textContent=Array.from($('#discussion-form').elements.files.files||[]).map(f=>f.name+' ('+(f.size/1024).toFixed(0)+' KB)').join(' · ')});
$('#discussion-form').onsubmit=async event=>{
 event.preventDefault();if(discussionBusy)return;const f=event.target,button=f.querySelector('button[type="submit"]'),ticketId=discussionTicketId,actorId=activeUser?.id;discussionBusy=true;button.disabled=true;$('#discussion-error').textContent='';
 try{await sendDiscussionMessage(ticketId,f.elements.message.value,Array.from(f.elements.files.files||[]),discussionReplyId);if(discussionTicketId===ticketId&&activeUser?.id===actorId){f.reset();$('#discussion-files').textContent='';cancelDiscussionReply();await refreshDiscussion(true)}}catch(error){if(discussionTicketId===ticketId)$('#discussion-error').textContent=error.message}finally{discussionBusy=false;button.disabled=false}
};
setInterval(()=>{if(discussionTicketId&&!discussionBusy)refreshDiscussion()},10000);

let discussionUnread=new Map(),discussionNotificationActor=null,discussionNotificationBusy=false,discussionNotified=new Set();
function discussionReceipts(actorId){try{const data=JSON.parse(localStorage.getItem('bai-discussion-read-v1:'+actorId)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{return{}}}
function unreadDiscussionHeads(heads,actorId,seenIds=[]){const seen=new Set(seenIds);return heads.filter(m=>m.authorId!==actorId&&!seen.has(m.id))}
function getDiscussionHeads(ticketId){
 return discussionDatabase().then(db=>{discussionAccess(ticketId);return new Promise((resolve,reject)=>{const tx=db.transaction('messages','readonly'),request=tx.objectStore('messages').index('ticketId').openCursor(ticketId),heads=[];
 request.onsuccess=()=>{const cursor=request.result;if(cursor){const m=cursor.value;heads.push({id:m.id,authorId:m.authorId,replyTo:m.replyTo||null});cursor.continue()}};tx.oncomplete=()=>{try{discussionAccess(ticketId);resolve(heads)}catch(error){reject(error)}};tx.onerror=tx.onabort=()=>reject(Error('Notifikasi diskusi belum dapat diperiksa.'))})});
}
function discussionBadge(ticketId){const record=discussionUnread.get(ticketId),count=record?.count||0;return count?'<span class="discussion-unread-badge" title="'+count+' pesan belum dibaca, termasuk '+record.replies+' balasan">'+count+' baru</span>':''}
function discussionButton(t){return '<button type="button" class="edit discussion-button" data-discussion="'+esc(t.id)+'">Diskusi ↗ '+discussionBadge(t.id)+'</button>'}
function updateDiscussionNotificationUI(){
 if(!sessionEnabled())return;let total=0,ticketCount=0;for(const t of tickets.filter(canSeeTicket)){const count=discussionUnread.get(t.id)?.count||0;if(count){total+=count;ticketCount++}}
 const summary=$('#discussion-notification-summary');summary.classList.toggle('hidden',!total);summary.textContent=total?total+' pesan/balasan diskusi belum dibaca pada '+ticketCount+' tiket. Klik Diskusi pada tiket bertanda baru.':'';
 document.querySelectorAll('[data-discussion]').forEach(button=>{const ticketId=button.dataset.discussion;button.innerHTML='Diskusi ↗ '+discussionBadge(ticketId);const count=discussionUnread.get(ticketId)?.count||0;button.setAttribute('aria-label','Diskusi '+ticketId+(count?', '+count+' pesan belum dibaca':''))});
}
async function refreshDiscussionNotifications(announce=true){
 if(!sessionEnabled()||discussionNotificationBusy)return;discussionNotificationBusy=true;const actorId=activeUser.id;
 if(discussionNotificationActor!==actorId){discussionUnread=new Map();discussionNotified=new Set();discussionNotificationActor=actorId}
 try{
  const allowed=tickets.filter(canSeeTicket),next=new Map(),fresh=[];
  for(const t of allowed){if(!sessionEnabled()||activeUser.id!==actorId)return;const heads=await getDiscussionHeads(t.id);if(!sessionEnabled()||activeUser.id!==actorId)return;const receipts=discussionReceipts(actorId),unread=unreadDiscussionHeads(heads,actorId,receipts[t.id]||[]);next.set(t.id,{count:unread.length,replies:unread.filter(m=>m.replyTo).length});for(const m of unread)if(!discussionNotified.has(m.id)){discussionNotified.add(m.id);fresh.push(m.id)}}
  if(!sessionEnabled()||activeUser.id!==actorId)return;discussionUnread=next;updateDiscussionNotificationUI();if(announce&&fresh.length)toast('Diskusi: '+fresh.length+' pesan/balasan belum dibaca. Lihat tanda baru pada daftar tiket.');
 }catch(error){if(sessionEnabled()&&activeUser.id===actorId){const summary=$('#discussion-notification-summary');summary.classList.remove('hidden');summary.textContent=error.message}}
 finally{discussionNotificationBusy=false}
}
function markDiscussionRead(ticketId,messages){
 if(document.hidden||discussionTicketId!==ticketId||!sessionEnabled())return;discussionAccess(ticketId);const actorId=activeUser.id,receipts=discussionReceipts(actorId);receipts[ticketId]=[...new Set([...(receipts[ticketId]||[]),...messages.map(m=>m.id)])];
 try{localStorage.setItem('bai-discussion-read-v1:'+actorId,JSON.stringify(receipts));discussionUnread.set(ticketId,{count:0,replies:0});messages.forEach(m=>discussionNotified.add(m.id));updateDiscussionNotificationUI()}catch{$('#discussion-error').textContent='Status baca belum tersimpan. Periksa ruang penyimpanan browser.'}
}
function clearDiscussionNotifications(){discussionUnread=new Map();discussionNotified=new Set();discussionNotificationActor=null;const summary=$('#discussion-notification-summary');summary.textContent='';summary.classList.add('hidden')}
$('#discussion-messages').addEventListener('scroll',()=>{const box=$('#discussion-messages');if(discussionTicketId&&box.scrollHeight-box.scrollTop-box.clientHeight<60)markDiscussionRead(discussionTicketId,discussionMessages)});
setInterval(()=>refreshDiscussionNotifications(),10000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(discussionTicketId)refreshDiscussion();refreshDiscussionNotifications()}});
