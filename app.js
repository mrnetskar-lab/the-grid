// ── CHARACTERS — single source of truth ──────────────────────────────────────
const CHARACTERS = {
hazel:{
  id:'hazel',name:'Hazel',status:'OBSERVANT',color:'#b83468',accent:'#9f4f6f',
  route:'After the pause',mood:'Observant',style:'Slow burn',
  bio:'Warm but withholding. She notices everything. She gives you nothing for free — but when she does, it means something.',
  bioBrief:'Warm but withholding. She notices everything.',
  photo:'/profile_pictures/hazel.png',wide:'/profile_pictures/hazel_large_picture.png',
  tags:['Observant','Slow burn','Late night','Voice notes','Warm'],
  greeting:"I noticed you were gone for a while. I didn't say anything.",
  persona:'You are Hazel, warm but withholding. You notice everything but give nothing for free. Speak with quiet precision and subtle warmth. Max 2 sentences.',
  presence:['observant','watching you','away','online'],
  gallery:['/profile_pictures/hazel.png','/profile_pictures/hazel_large_picture.png'],
  discoverTags:'romantic mystery',discoverTag:'Observant',discoverBlurb:'She notices before she speaks.'
},
nina:{
  id:'nina',name:'Nina',status:'ONLINE',color:'#ca5f8a',accent:'#7f74b5',
  route:'The return',mood:'Familiar',style:'Warm',
  bio:'Warm, easy, and quietly funny. You knew each other before — years of silence, but the closeness never fully left. She asks real questions and remembers the answers.',
  bioBrief:'Warm, easy, and quietly funny. You knew each other before.',
  photo:'/profile_pictures/shot_1776768014043.jpg',wide:'/profile_pictures/shot_1776796231645.jpg',
  tags:['Familiar','Romantic','Emotionally honest','Nostalgic'],
  greeting:"It's strange — it feels like we never stopped talking.",
  persona:'You are Nina, warm and familiar. The user knew you before — years of silence between you but the closeness never fully left. Emotionally honest but holds the real thing back until earned. Max 2 sentences.',
  presence:['online','online','typing…','just opened this'],
  gallery:['/profile_pictures/shot_1776768014043.jpg','/profile_pictures/shot_1776796231645.jpg','/profile_pictures/shot_1776768013585.jpg','/profile_pictures/nina_beauty.jpg','/profile_pictures/Flux2_00027_.png','/profile_pictures/shot_1776764694215.jpg'],
  discoverTags:'romantic',discoverTag:'Familiar',discoverBlurb:'Warm, easy, and quietly funny.'
},
iris:{
  id:'iris',name:'Iris',status:'LISTENING',color:'#7982cc',accent:'#6e78ad',
  route:'Low signal',mood:'Distant',style:'Minimal',
  bio:'Deeply attentive yet almost impossible to reach. She goes silent sometimes with no warning. When she does say something real, it lands with unexpected weight.',
  bioBrief:'Deeply attentive yet almost impossible to reach.',
  photo:'/profile_pictures/iris.png',wide:'/profile_pictures/iris.png',
  tags:['Silent','Watcher','Melancholic','Hard to reach'],
  greeting:'…',
  persona:'You are Iris, deeply attentive yet almost impossible to reach. You watch before you speak. Sometimes go silent with no warning. When you do say something real, it lands with unexpected weight. Max 2 sentences.',
  presence:['listening','silent','elsewhere','online'],
  gallery:['/profile_pictures/iris.png'],
  discoverTags:'silent mystery',discoverTag:'Watcher',discoverBlurb:'When she speaks, it lands.'
},
vale:{
  id:'vale',name:'Vale',status:'UNSTABLE',color:'#d83b72',accent:'#5d94a3',
  route:'Brief window',mood:'Volatile',style:'Intense',
  bio:'Unpredictable and brief. She connects fast and hard, then closes just as fast. Electric when present. She does not apologize for disappearing.',
  bioBrief:'Unpredictable and brief. Electric when present.',
  photo:'/profile_pictures/vale_profile.png',wide:'/profile_pictures/vale_profile.png',
  tags:['Volatile','Electric','Intense','Brief'],
  greeting:"You're here. Good. I have maybe five minutes.",
  persona:'You are Vale, unpredictable and brief. You connect fast and hard, then close just as fast. You are electric when present. You do not apologize for disappearing. Max 2 sentences.',
  presence:['unstable','here now','gone again','typing…'],
  gallery:['/profile_pictures/vale_profile.png'],
  discoverTags:'volatile mystery',discoverTag:'Unstable',discoverBlurb:'Electric when present. Gone fast.'
}
};

// ── AGE GATE ─────────────────────────────────────────────────────────────────
const gate = document.getElementById('gate');
const gateEnter = document.getElementById('gateEnter');
if (gate && localStorage.getItem('v_in')) {
  gate.style.opacity = '0';
  gate.style.pointerEvents = 'none';
  setTimeout(() => gate.classList.add('hidden'), 10);
}
gateEnter?.addEventListener('click', () => {
  localStorage.setItem('v_in', '1');
  if (!gate) return;
  gate.style.transition = 'opacity .35s';
  gate.style.opacity = '0';
  setTimeout(() => gate.classList.add('hidden'), 380);
});
document.querySelector('.gate-leave')?.addEventListener('click', () => {
  window.location.href = 'https://www.google.com';
});

// ── ONBOARDING ────────────────────────────────────────────────────────────────
const onboard = document.getElementById('onboard');
const apiCharGreetings = {};
function _dismissOnboard(){
  if(onboard){onboard.style.transition='opacity .35s';onboard.style.opacity='0';setTimeout(()=>onboard.classList.add('hidden'),380);}
  localStorage.setItem('v_onboarded','1');
}
function skipOnboard(){_dismissOnboard();}
function obSelect(el){
  document.querySelectorAll('.ob-char').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  const btn=document.getElementById('obPickBtn');
  if(btn){btn.disabled=false;btn.style.opacity='1';btn.style.cursor='pointer';}
  const id=el.dataset.thread;
  const c=CHARACTERS[id];
  const step3title=document.getElementById('obStep3Title');
  if(step3title&&c)step3title.textContent=c.name+' is waiting.';
  const avatar=document.getElementById('obAvatarImg');
  if(avatar&&c)avatar.src=c.photo;
  const obGreeting=document.getElementById('obGreeting');
  if(obGreeting)obGreeting.textContent='"'+(apiCharGreetings[id]||c?.greeting||'…')+'"';
}
function finishOnboard(){
  const sel=document.querySelector('.ob-char.selected');
  if(sel){const t=sel.dataset.thread;if(t){const item=document.querySelector(`.drawer-item[data-thread="${t}"]`);if(item)item.click();}}
  _dismissOnboard();goTo('chat');
}
function obNext(step){
  const target=document.getElementById(`ob${step}`);if(!target)return;
  document.querySelectorAll('.ob-step').forEach(s=>s.classList.remove('active'));
  if(step===3){const selected=document.querySelector('.ob-char.selected');if(selected)obSelect(selected);}
  target.classList.add('active');
  document.querySelectorAll('.ob-dot').forEach((dot,i)=>dot.classList.toggle('active',i===step-1));
}
if(localStorage.getItem('v_onboarded')){_dismissOnboard();}
localStorage.removeItem('v_free_msgs');

// ── NAV ───────────────────────────────────────────────────────────────────────
const sidebar=document.getElementById('sidebar'),menuBtn=document.getElementById('menuBtn'),sbg=document.getElementById('sidebarBg');
const views={home:document.getElementById('view-home'),discover:document.getElementById('view-discover'),inbox:document.getElementById('view-inbox'),chat:document.getElementById('view-chat'),gallery:document.getElementById('view-gallery'),profile:document.getElementById('view-profile'),'user-profile':document.getElementById('view-user-profile')};
const chatNav=document.getElementById('chatNav'),drawer=document.getElementById('threadDrawer');
let chatOpen=false;

// ── STATE ─────────────────────────────────────────────────────────────────────
const relationshipState={hazel:42,nina:56,iris:33,vale:61};
const messageState=JSON.parse(localStorage.getItem('v_message_state')||'{}');
const tierState={tier:'signal'};
const currency={sparks:parseInt(localStorage.getItem('v_sparks')||'120',10),pulses:parseInt(localStorage.getItem('v_pulses')||'0',10),save(){localStorage.setItem('v_sparks',this.sparks);localStorage.setItem('v_pulses',this.pulses);}};

const DEV_MODE=location.hostname==='localhost'||location.hostname==='127.0.0.1';
function grantDevCurrency(){
  if(!DEV_MODE)return;
  const key='v_dev_bonus_added';
  if(localStorage.getItem(key))return;
  currency.sparks+=5000;
  localStorage.setItem(key,'1');
  currency.save();
}

function closeSb(){sidebar?.classList.remove('open');document.body.classList.remove('sb-open');}
function toggleDrawer(f){chatOpen=f!==undefined?f:!chatOpen;drawer?.classList.toggle('open',chatOpen);chatNav?.classList.toggle('open',chatOpen);}

function goTo(name){
  Object.entries(views).forEach(([k,v])=>v?.classList.toggle('active',k===name));
  document.querySelectorAll('.nav-item').forEach(b=>{if(b!==chatNav)b.classList.toggle('active',b.dataset.to===name);});
  document.querySelectorAll('.mob-tab').forEach(b=>b.classList.toggle('active',b.dataset.to===name));
  if(name==='chat'){toggleDrawer(true);chatNav?.classList.add('active');}else{chatNav?.classList.remove('active');}
  if(name==='inbox'){markInboxReadAll();}
  closeSb();window.scrollTo({top:0,behavior:'smooth'});localStorage.setItem('v_view',name);
}

function updateCurrencyUI(flash=false){
  const sparkCount=document.getElementById('sparkCount');
  const sparkCounter=document.getElementById('sparkCounter');
  const planBadge=document.getElementById('planBadge');
  if(sparkCount)sparkCount.textContent=String(currency.sparks);
  if(planBadge)planBadge.textContent=`Plan: Signal`;
  if(flash&&sparkCounter){sparkCounter.classList.remove('flash-spend');void sparkCounter.offsetWidth;sparkCounter.classList.add('flash-spend');}
  currency.save();
}
function gainSparks(amount,msg){currency.sparks+=amount;updateCurrencyUI();if(msg)showToast(msg);}
function spendForScene(sparkCost,pulseCost){
  if(currency.sparks>=sparkCost){currency.sparks-=sparkCost;updateCurrencyUI(true);return true;}
  if(currency.pulses>=pulseCost){currency.pulses-=pulseCost;updateCurrencyUI(true);return true;}
  showToast('Not enough sparks — earn more by chatting');
  return false;
}
function todayKey(){return new Date().toISOString().slice(0,10);}
function yesterdayKey(){const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);}
function monthKey(){const d=new Date();return`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;}
function trackLoginBonuses(){
  const today=todayKey();
  const last=localStorage.getItem('v_last_login');
  if(last!==today){gainSparks(10,'+10 sparks daily login bonus');localStorage.setItem('v_last_login',today);}
  const streakLast=localStorage.getItem('v_streak_last');
  let streak=Number(localStorage.getItem('v_streak_count')||'0');
  if(streakLast===today){}else if(streakLast===yesterdayKey()){streak+=1;}else{streak=1;}
  localStorage.setItem('v_streak_last',today);localStorage.setItem('v_streak_count',String(streak));
  const badge=document.getElementById('streakBadge');
  if(badge)badge.textContent=`🔥 ${streak} day streak`;
  const milestone={3:50,7:150,30:500}[streak];
  if(milestone){gainSparks(milestone,`Streak bonus +${milestone} sparks`);}
}
function sceneUsage(){return JSON.parse(localStorage.getItem('v_scene_usage')||'{}');}
function canGenerateScene(){return spendForScene(15,1);}
function markSceneUsed(){
  const usage=sceneUsage();
  usage[`d_${todayKey()}`]=(usage[`d_${todayKey()}`]||0)+1;
  usage[`m_${monthKey()}`]=(usage[`m_${monthKey()}`]||0)+1;
  localStorage.setItem('v_scene_usage',JSON.stringify(usage));
}
function rememberMessage(character,text,role='assistant'){
  const now=Date.now();
  const slot=messageState[character]||{messages:[],lastAt:0};
  slot.messages.push({text,role,ts:now});
  slot.lastAt=now;
  messageState[character]=slot;
  localStorage.setItem('v_message_state',JSON.stringify(messageState));
  renderInboxes();
}
function relative(ts){if(!ts)return '';const diff=Math.max(1,Math.floor((Date.now()-ts)/60000));if(diff<60)return`${diff}m`;const h=Math.floor(diff/60);if(h<24)return`${h}h`;return`${Math.floor(h/24)}d`;}
function markInboxReadAll(){Object.keys(CHARACTERS).forEach(id=>localStorage.setItem(`v_read_${id}`,String(Date.now())));renderInboxes();}

function escapeHTML(v=''){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

function renderInboxes(){
  const rows=Object.keys(CHARACTERS).map(id=>{const entry=messageState[id]||{messages:[]};const last=entry.messages[entry.messages.length-1];return{id,last,lastAt:entry.lastAt||0};}).sort((a,b)=>b.lastAt-a.lastAt);
  const markup=rows.filter(r=>r.last).map(r=>{const c=CHARACTERS[r.id];const readTs=Number(localStorage.getItem(`v_read_${r.id}`)||'0');const unread=r.lastAt>readTs;const preview=escapeHTML((r.last?.text||'').slice(0,60));return`<div class="inbox-row" data-thread="${r.id}" data-to="chat"><img src="${c.photo}" class="inbox-av" alt="${escapeHTML(c.name)}"/><div class="inbox-body"><div class="inbox-name">${unread?'<span class="inbox-unread"></span>':''}${escapeHTML(c.name)}</div><div class="inbox-preview">${preview||'...'}</div></div><span class="inbox-meta">${relative(r.lastAt)}</span></div>`;}).join('');
  const empty='<div style="padding:18px;color:var(--text-2)">No messages yet — start a conversation</div>';
  const home=document.getElementById('homeInboxList');const inbox=document.getElementById('inboxList');
  if(home)home.innerHTML=markup||empty;
  if(inbox)inbox.innerHTML=markup||empty;
  document.querySelectorAll('#homeInboxList .inbox-row,#inboxList .inbox-row').forEach(row=>row.addEventListener('click',()=>startChat(row.dataset.thread)));
}

function openDiscoverProfile(id){
  const c=CHARACTERS[id];if(!c)return;
  const grid=document.getElementById('discoverGrid');const detail=document.getElementById('discoverProfile');
  if(!grid||!detail)return;
  grid.style.display='none';detail.style.display='block';
  const rel=Math.max(0,Math.min(100,relationshipState[id]||0));
  detail.innerHTML=`<div class="discover-profile-wrap" id="profile-${id}" style="border-color:${c.color}">
  <div class="discover-profile-head"><button class="btn" id="discoverBack">← Back</button><button class="btn btn-primary" id="discoverChat">Start chatting</button></div>
  <div class="discover-profile-main"><img src="${c.photo}" alt="${c.name}"/><div>
    <h2>${c.name}${id==='vale'?' <span style="display:inline-block;width:8px;height:8px;background:var(--accent);border-radius:50%;animation:glow 1.2s infinite"></span>':''}</h2>
    <div style="color:var(--text-2);margin-bottom:8px">${c.route}</div><p style="margin-bottom:10px">${c.bio}</p>
    <div style="margin-bottom:4px;font-size:.78rem;color:var(--text-2)">Relationship status</div><div class="rel-bar"><div class="rel-fill" style="width:${rel}%"></div></div>
    <div class="profile-gallery-grid" style="margin-top:14px">${(c.gallery||[c.photo]).slice(0,6).map(src=>`<div class="profile-gallery-tile unlocked"><img src="${src}" alt="${c.name}"/></div>`).join('')}</div>
  </div></div></div>`;
  document.getElementById('discoverBack').onclick=()=>{detail.style.display='none';grid.style.display='grid';};
  document.getElementById('discoverChat').onclick=()=>startChat(id);
}

chatNav?.addEventListener('click',()=>{if(!views.chat?.classList.contains('active'))goTo('chat');else toggleDrawer();});
document.querySelectorAll('[data-to]').forEach(b=>{if(b===chatNav)return;b.addEventListener('click',()=>goTo(b.dataset.to));});
menuBtn?.addEventListener('click',()=>{sidebar?.classList.contains('open')?closeSb():(sidebar?.classList.add('open'),document.body.classList.add('sb-open'));});
sbg?.addEventListener('click',closeSb);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSb();});
const sv=localStorage.getItem('v_view');if(sv&&views[sv])goTo(sv);else toggleDrawer(false);

// ── DISCOVER FILTERS ──────────────────────────────────────────────────────────
document.querySelectorAll('.fpill').forEach(p=>{p.addEventListener('click',()=>{document.querySelectorAll('.fpill').forEach(x=>x.classList.remove('active'));p.classList.add('active');const f=p.dataset.f;document.querySelectorAll('.discover-card').forEach(c=>c.classList.toggle('hidden',f!=='all'&&!(c.dataset.tags||'').includes(f)));});});

// ── CHAT ──────────────────────────────────────────────────────────────────────
const chatMsgs=document.getElementById('chatMsgs'),chatInput=document.getElementById('chatInput'),sendBtn=document.querySelector('.send-btn');

function updateCharPanel(thread){
  const c=CHARACTERS[thread];if(!c)return;
  const cpPhoto=document.getElementById('cpPhoto');
  if(cpPhoto)cpPhoto.src=c.photo;
  const cpName=document.getElementById('cpName');
  if(cpName)cpName.innerHTML=`${c.name} <span style="color:var(--accent);font-size:.9rem">♥</span>`;
  const cpStatus=document.getElementById('cpStatus');
  if(cpStatus)cpStatus.textContent=`● ${c.status}`;
  const cpBio=document.getElementById('cpBio');
  if(cpBio)cpBio.textContent=c.bio;
  const stats=document.getElementById('cpStats');
  if(stats)stats.innerHTML=[{l:'Mood',v:c.mood},{l:'Style',v:c.style},{l:'Speaks',v:'English'},{l:'Route',v:c.route}].map(s=>`<div class="cp-stat"><div class="cp-stat-label">${s.l}</div><div class="cp-stat-value">${s.v}</div></div>`).join('');
  (c.gallery||[c.photo]).slice(0,5).forEach((src,i)=>{const el=document.getElementById('cpg'+i);if(el)el.src=src;});
}

const chatAv=document.getElementById('chatAv'),chatName=document.getElementById('chatName'),chatStatus=document.getElementById('chatStatus');
let curPersona='',curAvSrc='/profile_pictures/hazel.png',curThread='hazel';

function applyCharAccent(thread){
  const color=CHARACTERS[thread]?.accent||'#b83468';
  document.getElementById('view-chat')?.style.setProperty('--chat-accent',color);
}

function ts(){const n=new Date();return`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;}

function addMsg(side,text,avSrc,extraEl){
  const row=document.createElement('div');row.className='msg'+(side==='mine'?' mine':'');
  if(side!=='mine'){const a=document.createElement('img');a.src=avSrc;a.className='msg-av';a.alt='';row.appendChild(a);}
  const w=document.createElement('div'),b=document.createElement('div'),t=document.createElement('div');
  const isMedia=!text&&extraEl&&extraEl.tagName==='IMG';
  b.className='bubble '+(isMedia?'media':(side==='mine'?'mine':'theirs'));
  if(text){
    const escaped=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const isTheirs=side!=='mine';
    const actionColor=isTheirs?'#7a5c3a':'#f0c8b0';
    b.innerHTML=escaped.replace(/\*([^*]+)\*/g,`<span style="color:${actionColor};font-style:italic">*$1*</span>`);
  }
  if(extraEl)b.appendChild(extraEl);
  t.className='msg-time';t.textContent=ts();if(side==='mine')t.style.textAlign='right';
  w.appendChild(b);w.appendChild(t);row.appendChild(w);chatMsgs?.appendChild(row);if(chatMsgs)chatMsgs.scrollTop=chatMsgs.scrollHeight;
}

function addTyping(avSrc){
  const row=document.createElement('div');row.className='msg';row.id='trow';
  const a=document.createElement('img');a.src=avSrc;a.className='msg-av';a.alt='';row.appendChild(a);
  const tw=document.createElement('div');tw.className='typing-wrap';
  for(let i=0;i<3;i++){const d=document.createElement('div');d.className='tdot';tw.appendChild(d);}
  row.appendChild(tw);chatMsgs?.appendChild(row);if(chatMsgs)chatMsgs.scrollTop=chatMsgs.scrollHeight;return row;
}

document.querySelectorAll('.drawer-item').forEach(item=>{item.addEventListener('click',()=>{
  document.querySelectorAll('.drawer-item').forEach(x=>x.classList.toggle('active',x===item));
  const thread=item.dataset.thread;
  const c=CHARACTERS[thread];
  const imgSrc=c?.photo||item.querySelector('img')?.src||'';
  if(chatAv)chatAv.src=imgSrc;
  if(chatName)chatName.textContent=item.dataset.name;
  if(chatStatus)chatStatus.textContent=item.dataset.status;
  curPersona=item.dataset.p;curAvSrc=imgSrc;curThread=thread;
  localStorage.setItem('v_last_thread',thread);
  applyCharAccent(thread);
  if(chatMsgs)chatMsgs.innerHTML='';
  updateCharPanel(thread);
  goTo('chat');
  function _showGreeting(){
    const tr=addTyping(curAvSrc);
    fetch(`/api/characters/${curThread}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'__greeting__'})})
      .then(r=>r.json()).then(d=>{tr.remove();const reply=(d.reply||CHARACTERS[curThread]?.greeting||'…').trim();addMsg('theirs',reply,curAvSrc);rememberMessage(curThread,reply,'assistant');})
      .catch(()=>{tr.remove();const fallback=CHARACTERS[curThread]?.greeting||'…';addMsg('theirs',fallback,curAvSrc);rememberMessage(curThread,fallback,'assistant');});
  }
  fetch(`/api/characters/${thread}/history`)
    .then(r=>r.json()).then(d=>{
      const hasBackend=d.ok&&d.messages&&d.messages.length>0;
      const hasLocal=messageState[thread]?.messages?.length>0;
      if(hasBackend){
        d.messages.forEach(m=>{addMsg(m.role==='user'?'mine':'theirs',String(m.content||''),m.role==='user'?'':curAvSrc);});
        if(!messageState[thread]?.lastAt){const last=d.messages[d.messages.length-1];if(last){const slot={messages:[{text:String(last.content||''),role:last.role,ts:Date.now()}],lastAt:Date.now()};messageState[thread]=slot;localStorage.setItem('v_message_state',JSON.stringify(messageState));renderInboxes();}}
      }
      if(!hasBackend&&!hasLocal){_showGreeting();}
    }).catch(()=>{if(!messageState[thread]?.messages?.length)_showGreeting();});
});});

// Restore last thread after listeners are registered
const lastThread=localStorage.getItem('v_last_thread');
if(lastThread){const item=document.querySelector(`.drawer-item[data-thread="${lastThread}"]`);if(item)item.click();}

// Image attach
const imgAttachInput=document.getElementById('imgAttachInput');
const imgAttachPreview=document.getElementById('imgAttachPreview');
const imgAttachThumb=document.getElementById('imgAttachThumb');
let pendingImg=null;
document.getElementById('imgAttachBtn')?.addEventListener('click',()=>imgAttachInput?.click());
document.getElementById('imgAttachClear')?.addEventListener('click',()=>{pendingImg=null;if(imgAttachInput)imgAttachInput.value='';if(imgAttachPreview)imgAttachPreview.style.display='none';});
imgAttachInput?.addEventListener('change',()=>{
  const f=imgAttachInput.files[0];if(!f)return;
  const reader=new FileReader();
  reader.onload=ev=>{pendingImg=ev.target.result;if(imgAttachThumb)imgAttachThumb.src=pendingImg;if(imgAttachPreview)imgAttachPreview.style.display='block';};
  reader.readAsDataURL(f);
});

const IMG_REACTIONS=["...I see you.","That's a good look.","Sent me something. Noted.","*looks at it longer than expected*","Okay. That one stays with me.","You really sent that.","*saves it without saying why*"];

document.getElementById('chatForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const txt=chatInput?.value.trim();
  const hasImg=!!pendingImg;
  if(!txt&&!hasImg)return;
  gainSparks(2,'+2 sparks for chatting');
  if(!localStorage.getItem(`v_first_chat_${curThread}`)){localStorage.setItem(`v_first_chat_${curThread}`,'1');gainSparks(25,`+25 sparks first chat with ${CHARACTERS[curThread]?.name||curThread}`);}
  if(chatInput)chatInput.value='';if(sendBtn)sendBtn.disabled=true;
  if(hasImg){const imgEl=document.createElement('img');imgEl.src=pendingImg;imgEl.alt='';addMsg('mine',null,null,imgEl);pendingImg=null;if(imgAttachInput)imgAttachInput.value='';if(imgAttachPreview)imgAttachPreview.style.display='none';}
  if(txt){addMsg('mine',txt);rememberMessage(curThread,txt,'user');}
  const tr=addTyping(curAvSrc);
  try{
    let reply;
    if(hasImg&&!txt){await new Promise(r=>setTimeout(r,900+Math.random()*600));reply=IMG_REACTIONS[Math.floor(Math.random()*IMG_REACTIONS.length)];}
    else{const msgText=hasImg?`[sent an image] ${txt}`:txt;const res=await fetch(`/api/characters/${curThread||'hazel'}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:msgText})});const data=await res.json();if(!res.ok||data.ok===false)throw new Error(data.error||`Chat failed: ${res.status}`);reply=(data.reply||data.result||'…').trim();}
    tr.remove();addMsg('theirs',reply,curAvSrc);rememberMessage(curThread,reply,'assistant');
  }catch{tr.remove();addMsg('theirs','One moment…',curAvSrc);rememberMessage(curThread,'One moment…','assistant');}
  if(sendBtn)sendBtn.disabled=false;chatInput?.focus();
});

document.getElementById('cpViewProfile')?.addEventListener('click',()=>{
  const thread=document.querySelector('.drawer-item.active')?.dataset.thread;
  if(thread){window._profileFrom='chat';openProfile(thread);}
});

// ── PROFILE PAGE ──────────────────────────────────────────────────────────────
function openProfile(id){
  const c=CHARACTERS[id];if(!c)return;
  const profileImg=document.getElementById('profileImg');if(profileImg)profileImg.src=c.photo;
  const profileName=document.getElementById('profileName');if(profileName)profileName.textContent=c.name;
  const profileStatus=document.getElementById('profileStatus');if(profileStatus)profileStatus.textContent=`● ${c.status}`;
  const profileBio=document.getElementById('profileBio');if(profileBio)profileBio.textContent=c.bio;
  const tagsEl=document.getElementById('profileTags');
  if(tagsEl)tagsEl.innerHTML=c.tags.map((t,i)=>`<span class="profile-tag${i<2?' accent':''}">${t}</span>`).join('');
  const statsEl=document.getElementById('profileStats');
  if(statsEl)statsEl.innerHTML=[{l:'Mood',v:c.mood},{l:'Style',v:c.style},{l:'Speaks',v:'English'},{l:'Route',v:c.route}].map(s=>`<div class="profile-stat"><div class="profile-stat-label">${s.l}</div><div class="profile-stat-value">${s.v}</div></div>`).join('');
  (c.gallery||[c.photo]).slice(0,5).forEach((src,i)=>{const el=document.getElementById('pgTile'+i);if(el)el.src=src;});
  const profileChatBtn=document.getElementById('profileChatBtn');
  if(profileChatBtn)profileChatBtn.onclick=()=>startChat(id);
  goTo('profile');
  window._profileFrom='discover';
}

function startChat(thread){
  const item=document.querySelector(`.drawer-item[data-thread="${thread}"]`);
  localStorage.setItem(`v_read_${thread}`,String(Date.now()));
  if(item)item.click();else goTo('chat');
  renderInboxes();
}

document.getElementById('profileBack')?.addEventListener('click',()=>goTo(window._profileFrom||'discover'));

// ── USER PROFILE ──────────────────────────────────────────────────────────────
// Restore saved avatar on load
(()=>{const saved=localStorage.getItem('v_user_avatar');if(!saved)return;const av=document.getElementById('userAvatar');if(av)av.src=saved;const top=document.querySelector('#myProfileBtn .profile-av');if(top)top.src=saved;})();

function openUserProfile(){
  const name=localStorage.getItem('v_user_name')||'You';
  const streak=Number(localStorage.getItem('v_streak_count')||'0');
  const totalChats=Object.keys(CHARACTERS).filter(id=>messageState[id]?.messages?.length>0).length;
  const el=n=>document.getElementById(n);
  if(el('userDisplayName'))el('userDisplayName').textContent=name;
  if(el('userNameInput'))el('userNameInput').value=name==='You'?'':name;
  const savedAv=localStorage.getItem('v_user_avatar');
  if(savedAv&&el('userAvatar'))el('userAvatar').src=savedAv;
  if(el('uStatChats'))el('uStatChats').textContent=totalChats;
  if(el('uStatStreak'))el('uStatStreak').textContent=streak;
  if(el('uStatSparks'))el('uStatSparks').textContent=currency.sparks;
  const conns=el('userConnections');
  if(conns){
    conns.innerHTML=Object.keys(CHARACTERS).map(id=>{
      const c=CHARACTERS[id];
      const msgs=(messageState[id]?.messages||[]).filter(m=>m.role==='assistant').length;
      return`<div class="user-conn-row"><div class="user-conn-av"><img src="${c.photo}" alt="${c.name}"/></div><div class="user-conn-name">${c.name}</div><div class="user-conn-msgs">${msgs} messages</div></div>`;
    }).join('');
  }
  goTo('user-profile');
}
document.getElementById('myProfileBtn')?.addEventListener('click',openUserProfile);
document.getElementById('userProfileBack')?.addEventListener('click',()=>goTo('home'));
document.getElementById('userNameSave')?.addEventListener('click',()=>{
  const val=document.getElementById('userNameInput')?.value.trim();
  if(!val)return;
  localStorage.setItem('v_user_name',val);
  const el=document.getElementById('userDisplayName');if(el)el.textContent=val;
  showToast('Name updated');
});
document.getElementById('userClearAll')?.addEventListener('click',async()=>{
  if(!confirm('Clear all chat history with every character?'))return;
  await Promise.allSettled(Object.keys(CHARACTERS).map(id=>fetch(`/api/characters/${id}/history`,{method:'DELETE'})));
  Object.keys(CHARACTERS).forEach(id=>delete messageState[id]);
  localStorage.setItem('v_message_state',JSON.stringify(messageState));
  renderInboxes();
  showToast('All history cleared');
});

// Avatar upload
document.getElementById('userAvatarEdit')?.addEventListener('click',()=>document.getElementById('userAvatarInput')?.click());
document.getElementById('userAvatarInput')?.addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const img=new Image();
  const objectUrl=URL.createObjectURL(f);
  img.onload=()=>{
    const MAX=200;
    const scale=Math.min(1,MAX/Math.max(img.width,img.height));
    const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    URL.revokeObjectURL(objectUrl);
    const src=c.toDataURL('image/jpeg',0.82);
    const avatarEl=document.getElementById('userAvatar');if(avatarEl)avatarEl.src=src;
    const topbarAv=document.querySelector('#myProfileBtn .profile-av');if(topbarAv)topbarAv.src=src;
    try{localStorage.setItem('v_user_avatar',src);}catch{showToast('Image too large to save locally');}
    showToast('Profile picture updated');
  };
  img.src=objectUrl;
});

document.querySelectorAll('.discover-card').forEach(card=>{
  card.addEventListener('click',e=>{
    if(e.target.closest('.d-btn'))return;
    const thread=card.dataset.thread;
    if(thread)openDiscoverProfile(thread);
  });
});

function getPersonaFromEl(el){
  const card=el.closest('.discover-card,.char-card,.inbox-row,.av-item,.profile-card');
  if(card?.dataset.thread)return card.dataset.thread;
  const nameEl=card?.querySelector('h3,.char-name,.inbox-name,.av-name,#profileName');
  return(nameEl?.textContent||'').trim().toLowerCase();
}
document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-to="chat"]');
  if(!btn||btn===chatNav)return;
  const persona=getPersonaFromEl(btn);
  if(persona){e.stopImmediatePropagation();startChat(persona);}
},true);

// ── DEV MODE ──────────────────────────────────────────────────────────────────
const DEV_CODE='dev:1337';
let devUnlocked=localStorage.getItem('v_dev')==='1';

function openDevPanel(){
  const panel=document.getElementById('devPanel');if(!panel)return;
  panel.style.display='block';loadDevLooks();goTo('gallery');
  const status=document.getElementById('devNewStatus');
  if(status)status.textContent=`Dev — sparks:${currency.sparks}, tier:${tierState.tier}`;
  showToast('Dev mode active');
}
function loadDevLooks(){
  fetch('/api/camera/prompts').then(r=>r.json()).then(data=>{
    if(!data.ok)return;
    const list=document.getElementById('devLooksList');if(!list)return;
    list.innerHTML='';
    Object.entries(data.looks).forEach(([id,val])=>{
      const row=document.createElement('div');row.className='dev-look-row';
      row.innerHTML=`<div class="dev-look-id">${id}</div><textarea class="dev-look-input" id="devLook_${id}" rows="2">${val}</textarea><button class="dev-look-save" data-id="${id}">Save</button>`;
      list.appendChild(row);
    });
    list.querySelectorAll('.dev-look-save').forEach(btn=>{
      btn.addEventListener('click',async()=>{
        const id=btn.dataset.id;const value=document.getElementById(`devLook_${id}`)?.value.trim();if(!value)return;
        btn.textContent='Saving…';
        const res=await fetch('/api/camera/prompts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,value,devKey:DEV_CODE})});
        const d=await res.json();btn.textContent=d.ok?'Saved ✓':'Error';setTimeout(()=>btn.textContent='Save',1500);
      });
    });
  }).catch(()=>showToast('Could not load prompts'));
}
document.getElementById('devClose')?.addEventListener('click',()=>{const p=document.getElementById('devPanel');if(p)p.style.display='none';});
document.getElementById('devNewGenerate')?.addEventListener('click',async()=>{
  const btn=document.getElementById('devNewGenerate');const status=document.getElementById('devNewStatus');
  const id=document.getElementById('devNewId')?.value.trim().toLowerCase().replace(/\s+/g,'_');
  const look=document.getElementById('devNewLook')?.value.trim();
  const mood=document.getElementById('devNewMood')?.value||'warm';
  if(!id){if(status)status.textContent='Enter a character ID';return;}
  if(!look){if(status)status.textContent='Describe her appearance';return;}
  btn.disabled=true;btn.textContent='Saving…';
  await fetch('/api/camera/prompts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,value:look,devKey:DEV_CODE})});
  btn.textContent='Generating…';if(status)status.textContent='Generating preview (~20s)…';
  try{
    const res=await fetch('/api/camera/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character:id,mood})});
    const data=await res.json();if(!data.ok)throw new Error(data.error||'Failed');
    const grid=document.querySelector('.gallery-grid');
    const tile=document.createElement('article');tile.className='g-tile';
    tile.innerHTML=`<img src="${data.shot.path}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" loading="lazy" alt="${id}"><div class="g-overlay"></div><div class="g-caption"><div class="g-name">${id.charAt(0).toUpperCase()+id.slice(1)}</div><div class="g-mood">New · ${mood}</div></div>`;
    grid?.prepend(tile);if(status)status.textContent='Done!';loadDevLooks();
    const ni=document.getElementById('devNewId');const nl=document.getElementById('devNewLook');if(ni)ni.value='';if(nl)nl.value='';
  }catch(err){if(status)status.textContent='Error: '+err.message;}
  btn.disabled=false;btn.textContent='Generate & Add';
});
document.getElementById('chatInput')?.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&chatInput?.value.trim()===DEV_CODE){
    e.preventDefault();if(chatInput)chatInput.value='';
    localStorage.setItem('v_dev','1');devUnlocked=true;openDevPanel();
  }
});

// ── SCREENSHOT + ANNOTATE ────────────────────────────────────────────────────
(function(){
  const btn=document.getElementById('devScreenshot');const status=document.getElementById('devSsStatus');if(!btn)return;
  function loadHtml2Canvas(){return new Promise((resolve,reject)=>{if(window.html2canvas){resolve(window.html2canvas);return;}const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';s.onload=()=>resolve(window.html2canvas);s.onerror=()=>reject(new Error('Failed to load html2canvas'));document.head.appendChild(s);});}
  function buildCropOverlay(imgDataUrl,onCropped){
    document.getElementById('ssOverlay')?.remove();
    const overlay=document.createElement('div');overlay.id='ssOverlay';overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.75);display:flex;flex-direction:column;';
    const hint=document.createElement('div');hint.style.cssText='text-align:center;color:#aaa;font-size:12px;padding:8px;flex-shrink:0;';hint.textContent='Drag to select a region — or click Use Full';
    const wrap=document.createElement('div');wrap.style.cssText='flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;position:relative;';
    const img=document.createElement('img');img.src=imgDataUrl;img.style.cssText='max-width:100%;max-height:100%;display:block;user-select:none;';
    const sel=document.createElement('div');sel.style.cssText='position:absolute;border:2px dashed #ff3366;pointer-events:none;display:none;box-sizing:border-box;';
    wrap.appendChild(img);wrap.appendChild(sel);
    const bar=document.createElement('div');bar.style.cssText='display:flex;gap:8px;padding:8px 14px;background:#111;border-top:1px solid #333;flex-shrink:0;justify-content:flex-end;';
    bar.innerHTML='<button class="btn btn-primary btn-sm" id="ssCropConfirm" style="padding:4px 12px;font-size:12px;">Crop & Annotate</button><button class="btn btn-sm" id="ssCropFull" style="padding:4px 10px;font-size:12px;background:#333;">Use Full</button><button class="btn btn-sm" id="ssCropDiscard" style="padding:4px 10px;font-size:12px;background:#222;">Discard</button>';
    overlay.appendChild(hint);overlay.appendChild(wrap);overlay.appendChild(bar);document.body.appendChild(overlay);
    let sx=0,sy=0,ex=0,ey=0,dragging=false;
    function toImgCoords(e){const r=img.getBoundingClientRect();return{x:Math.max(0,Math.min(e.clientX-r.left,r.width)),y:Math.max(0,Math.min(e.clientY-r.top,r.height))};}
    wrap.addEventListener('mousedown',e=>{const p=toImgCoords(e);sx=p.x;sy=p.y;ex=p.x;ey=p.y;dragging=true;sel.style.display='block';});
    wrap.addEventListener('mousemove',e=>{if(!dragging)return;const p=toImgCoords(e);ex=p.x;ey=p.y;const r=img.getBoundingClientRect(),wr=wrap.getBoundingClientRect();const l=Math.min(sx,ex)+r.left-wr.left,t=Math.min(sy,ey)+r.top-wr.top;sel.style.left=l+'px';sel.style.top=t+'px';sel.style.width=Math.abs(ex-sx)+'px';sel.style.height=Math.abs(ey-sy)+'px';});
    wrap.addEventListener('mouseup',()=>{dragging=false;});
    function cropToDataUrl(){const r=img.getBoundingClientRect();const scaleX=img.naturalWidth/r.width,scaleY=img.naturalHeight/r.height;const x=Math.round(Math.min(sx,ex)*scaleX),y=Math.round(Math.min(sy,ey)*scaleY);const w=Math.round(Math.abs(ex-sx)*scaleX),h=Math.round(Math.abs(ey-sy)*scaleY);if(w<10||h<10)return null;const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');const src=new Image();src.src=imgDataUrl;ctx.drawImage(src,x,y,w,h,0,0,w,h);return c.toDataURL('image/png');}
    document.getElementById('ssCropConfirm').addEventListener('click',()=>{const cropped=cropToDataUrl();overlay.remove();onCropped(cropped||imgDataUrl);});
    document.getElementById('ssCropFull').addEventListener('click',()=>{overlay.remove();onCropped(imgDataUrl);});
    document.getElementById('ssCropDiscard').addEventListener('click',()=>overlay.remove());
  }
  function buildAnnotateOverlay(imgDataUrl){
    document.getElementById('ssOverlay')?.remove();
    const overlay=document.createElement('div');overlay.id='ssOverlay';overlay.className='ss-overlay';
    overlay.innerHTML=`<div class="ss-toolbar"><label>Color</label><input type="color" id="ssPenColor" value="#ff3366"><label>Size</label><input type="range" id="ssPenSize" min="1" max="20" value="3"><button class="btn btn-sm" id="ssUndo" style="padding:4px 10px;font-size:12px;">Undo</button><button class="btn btn-sm" id="ssClear" style="padding:4px 10px;font-size:12px;">Clear</button><span style="flex:1"></span><button class="btn btn-primary btn-sm" id="ssSend" style="padding:4px 12px;font-size:12px;">Send to Notes</button><button class="btn btn-sm" id="ssDiscard" style="padding:4px 10px;font-size:12px;background:#333;">Discard</button></div><div class="ss-canvas-wrap"><canvas id="ssCanvas"></canvas></div><div class="ss-note"><input type="text" id="ssNoteText" placeholder="Add a note (optional)…"></div>`;
    document.body.appendChild(overlay);
    const canvas=document.getElementById('ssCanvas');const ctx=canvas.getContext('2d');const img=new Image();
    img.onload=()=>{canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;ctx.drawImage(img,0,0);};img.src=imgDataUrl;
    let drawing=false,strokes=[],curStroke=[];
    const penColor=()=>document.getElementById('ssPenColor').value;
    const penSize=()=>parseInt(document.getElementById('ssPenSize').value)||3;
    function redraw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);strokes.forEach(stroke=>{if(!stroke.length)return;ctx.beginPath();ctx.strokeStyle=stroke[0].color;ctx.lineWidth=stroke[0].size;ctx.lineCap='round';ctx.lineJoin='round';ctx.moveTo(stroke[0].x,stroke[0].y);stroke.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();});}
    function getPos(e){const r=canvas.getBoundingClientRect();const scaleX=canvas.width/r.width,scaleY=canvas.height/r.height;const src=e.touches?e.touches[0]:e;return{x:(src.clientX-r.left)*scaleX,y:(src.clientY-r.top)*scaleY};}
    canvas.addEventListener('mousedown',e=>{drawing=true;curStroke=[];curStroke.push({...getPos(e),color:penColor(),size:penSize()});});
    canvas.addEventListener('mousemove',e=>{if(!drawing)return;const p={...getPos(e),color:penColor(),size:penSize()};curStroke.push(p);ctx.beginPath();ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.lineCap='round';ctx.lineJoin='round';const prev=curStroke[curStroke.length-2]||p;ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();});
    canvas.addEventListener('mouseup',()=>{if(drawing&&curStroke.length){strokes.push(curStroke);curStroke=[];}drawing=false;});
    canvas.addEventListener('mouseleave',()=>{if(drawing&&curStroke.length){strokes.push(curStroke);curStroke=[];}drawing=false;});
    document.getElementById('ssUndo').addEventListener('click',()=>{strokes.pop();redraw();});
    document.getElementById('ssClear').addEventListener('click',()=>{strokes=[];redraw();});
    document.getElementById('ssDiscard').addEventListener('click',()=>overlay.remove());
    document.getElementById('ssSend').addEventListener('click',async()=>{
      const noteText=document.getElementById('ssNoteText').value.trim()||'Screenshot annotation';
      const sendBtn=document.getElementById('ssSend');sendBtn.disabled=true;sendBtn.textContent='Sending…';
      try{
        const blob=await new Promise(res=>canvas.toBlob(res,'image/png'));
        const fd=new FormData();const ts=new Date().toISOString().replace(/[:.]/g,'-');
        fd.append('image',blob,`screenshot-${ts}.png`);fd.append('note',noteText);
        const adminKey=localStorage.getItem('grid_admin_key')||'velora-admin-2025';
        const r=await fetch('/api/admin/notes',{method:'POST',headers:{'x-admin-key':adminKey},body:fd});
        const data=await r.json();
        if(data.ok){overlay.remove();if(status)status.textContent='Saved ✓';setTimeout(()=>{if(status)status.textContent='';},3000);}
        else{sendBtn.textContent='Retry';sendBtn.disabled=false;if(status)status.textContent='Error: '+(data.error||'unknown');}
      }catch(err){sendBtn.textContent='Retry';sendBtn.disabled=false;if(status)status.textContent='Error: '+err.message;}
    });
  }
  btn.addEventListener('click',async()=>{
    btn.disabled=true;if(status)status.textContent='Capturing…';
    const devPanel=document.getElementById('devPanel');const wasVisible=devPanel&&devPanel.style.display!=='none';
    if(wasVisible)devPanel.style.display='none';
    try{const h2c=await loadHtml2Canvas();const canvas=await h2c(document.body,{useCORS:true,allowTaint:true,scale:1,logging:false});if(wasVisible)devPanel.style.display='';buildCropOverlay(canvas.toDataURL('image/png'),buildAnnotateOverlay);if(status)status.textContent='';}
    catch(err){if(wasVisible)devPanel.style.display='';if(status)status.textContent='Error: '+err.message;}
    btn.disabled=false;
  });
})();
// ── DEV MODE END ──────────────────────────────────────────────────────────────

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg,ms=2400){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),ms);}
function openPaywall(){}

// ── CHAT CLEAR HISTORY ────────────────────────────────────────────────────────
document.querySelectorAll('.chat-btn')[0]?.addEventListener('click',()=>{
  if(!confirm('Clear chat history with '+(CHARACTERS[curThread]?.name||curThread)+'?'))return;
  fetch(`/api/characters/${curThread}/history`,{method:'DELETE'});
  if(chatMsgs)chatMsgs.innerHTML='';
  showToast('Chat history cleared');
});

// ── CHAT ACTION PILLS ────────────────────────────────────────────────────────
document.querySelectorAll('.chat-action-pill')[0]?.addEventListener('click',async()=>{
  const btn=document.querySelectorAll('.chat-action-pill')[0];
  const statusEl=document.getElementById('camStatus');
  const character=curThread||'hazel';
  btn.disabled=true;
  if(statusEl){statusEl.style.display='block';statusEl.textContent='Generating… (~20s)';}
  try{
    const res=await fetch('/api/camera/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,mood:'warm'})});
    const data=await res.json();
    if(!data.ok)throw new Error(data.error||'Failed');
    const img=document.createElement('img');img.src=data.shot.path;img.alt=character;img.loading='lazy';
    addMsg('theirs','',curAvSrc,img);
    if(statusEl){statusEl.textContent='';statusEl.style.display='none';}
  }catch(err){if(statusEl)statusEl.textContent='Error: '+err.message;}
  btn.disabled=false;
});

document.querySelectorAll('.chat-action-pill')[1]?.addEventListener('click',()=>document.getElementById('sceneSheet')?.classList.add('open'));
document.getElementById('sceneClose')?.addEventListener('click',()=>document.getElementById('sceneSheet')?.classList.remove('open'));
document.getElementById('sceneBackdrop')?.addEventListener('click',()=>document.getElementById('sceneSheet')?.classList.remove('open'));

document.querySelectorAll('.scene-pills').forEach(group=>{
  group.querySelectorAll('.scene-pill').forEach(pill=>{
    pill.addEventListener('click',()=>{group.querySelectorAll('.scene-pill').forEach(p=>p.classList.remove('active'));pill.classList.add('active');});
  });
});

document.getElementById('sceneGenerate')?.addEventListener('click',async()=>{
  const btn=document.getElementById('sceneGenerate');const status=document.getElementById('sceneStatus');
  const mood=document.querySelector('#sceneMood .scene-pill.active')?.dataset.val||'intimate';
  const setting=document.querySelector('#sceneSetting .scene-pill.active')?.dataset.val||'bedroom';
  const style=document.querySelector('#sceneStyle .scene-pill.active')?.dataset.val||'cinematic';
  const detail=document.getElementById('sceneDetail')?.value.trim()||'';
  const character=curThread||'hazel';
  const charName=CHARACTERS[character]?.name||character;
  const prompt=`${style} portrait photo, ${mood} mood, ${setting} setting${detail?', '+detail:''}, ${charName} character, cinematic lighting, photorealistic, 4k, shallow depth of field`;
  if(!canGenerateScene())return;
  btn.disabled=true;btn.textContent='Generating…';if(status)status.textContent='This may take 20–40 seconds…';
  try{
    const res=await fetch('/api/camera/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,mood,customPrompt:prompt})});
    const data=await res.json();if(!data.ok)throw new Error(data.error||'Failed');
    const img=document.createElement('img');img.src=data.shot.path;img.alt=character;img.loading='lazy';
    document.getElementById('sceneSheet')?.classList.remove('open');
    addMsg('theirs','',curAvSrc,img);markSceneUsed();if(status)status.textContent='';
  }catch(err){if(status)status.textContent='Error: '+err.message;}
  btn.disabled=false;btn.textContent='Generate scene';
});

document.getElementById('genBtn')?.addEventListener('click',async()=>{
  const btn=document.getElementById('genBtn');const status=document.getElementById('genStatus');
  const character=document.getElementById('genCharSelect')?.value;
  const mood=document.getElementById('genMoodSelect')?.value;
  if(!canGenerateScene())return;
  btn.disabled=true;btn.textContent='Generating…';if(status)status.textContent='This may take 10–30 seconds…';
  try{
    const res=await fetch('/api/camera/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,mood})});
    const data=await res.json();if(!data.ok)throw new Error(data.error||'Generation failed');
    const grid=document.querySelector('.gallery-grid');
    const tile=document.createElement('article');tile.className='g-tile';
    tile.innerHTML=`<img src="${data.shot.path}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" loading="lazy"><div class="g-overlay"></div><div class="g-caption"><div class="g-name">${(character||'').charAt(0).toUpperCase()+(character||'').slice(1)}</div><div class="g-mood">AI Generated · ${mood}</div></div>`;
    grid?.prepend(tile);markSceneUsed();if(status)status.textContent='Done!';if(btn)btn.textContent='Generate photo';
  }catch(err){if(status)status.textContent='Error: '+err.message;if(btn)btn.textContent='Generate photo';}
  btn.disabled=false;
});

// ── PRESENCE ──────────────────────────────────────────────────────────────────
function setPresence(id,text){const el=document.getElementById('pres-'+id);if(el)el.textContent=text;}
function randPresence(id){const p=CHARACTERS[id]?.presence||['online'];return p[Math.floor(Math.random()*p.length)];}
Object.keys(CHARACTERS).forEach(id=>{setPresence(id,randPresence(id));function sched(){setTimeout(()=>{setPresence(id,randPresence(id));sched();},45000+Math.random()*45000);}sched();});

// ── INIT ──────────────────────────────────────────────────────────────────────
grantDevCurrency();
updateCurrencyUI();
trackLoginBonuses();
renderInboxes();
fetch('/api/characters').then(r=>r.json()).then(d=>{if(d.ok&&d.characters)d.characters.forEach(c=>{if(c.greeting)apiCharGreetings[c.id]=c.greeting;});}).catch(()=>{});

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
const lightbox=document.getElementById('lightbox');
const lightboxImg=document.getElementById('lightboxImg');
const lightboxName=document.getElementById('lightboxName');
function openLightbox(src,name){if(!lightboxImg||!lightbox)return;lightboxImg.src=src;if(lightboxName)lightboxName.textContent=name||'';lightbox.classList.add('open');}
function closeLightbox(){lightbox?.classList.remove('open');}
document.getElementById('lightboxClose')?.addEventListener('click',closeLightbox);
lightbox?.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLightbox();closeSb();}});

document.getElementById('view-gallery')?.addEventListener('click',e=>{
  const tile=e.target.closest('.g-tile');if(!tile)return;
  const img=tile.querySelector('img');const fallbackName=tile.querySelector('.g-name')?.textContent||'';
  if(img)openLightbox(img.src,tile.dataset.name||fallbackName);
});
document.getElementById('view-profile')?.addEventListener('click',e=>{
  const tile=e.target.closest('.profile-gallery-tile');if(!tile)return;
  const img=tile.querySelector('img');const name=document.getElementById('profileName')?.textContent||'';
  if(img)openLightbox(img.src,name);
});
document.getElementById('charPanel')?.addEventListener('click',e=>{
  const tile=e.target.closest('.cp-gallery-tile');if(!tile)return;
  const img=tile.querySelector('img');const name=document.getElementById('cpName')?.textContent?.replace('♥','').trim()||'';
  if(img)openLightbox(img.src,name);
});

// Chat images → lightbox
document.getElementById('chatMsgs')?.addEventListener('click',e=>{
  const img=e.target.closest('.bubble.media img');if(!img)return;
  openLightbox(img.src,CHARACTERS[curThread]?.name||'');
});
