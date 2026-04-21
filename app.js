// Age gate
const gate=document.getElementById('gate');
if(localStorage.getItem('v_in')){gate.style.opacity='0';gate.style.pointerEvents='none';setTimeout(()=>gate.classList.add('hidden'),10);}
document.getElementById('gateEnter').addEventListener('click',()=>{localStorage.setItem('v_in','1');gate.style.transition='opacity .35s';gate.style.opacity='0';setTimeout(()=>gate.classList.add('hidden'),380);});

// Onboarding
const onboard=document.getElementById('onboard');
function _dismissOnboard(){if(onboard){onboard.style.transition='opacity .35s';onboard.style.opacity='0';setTimeout(()=>onboard.classList.add('hidden'),380);}localStorage.setItem('v_onboarded','1');}
function skipOnboard(){_dismissOnboard();}
function obSelect(el){document.querySelectorAll('.ob-char').forEach(c=>c.classList.remove('selected'));el.classList.add('selected');const btn=document.getElementById('obPickBtn');if(btn){btn.disabled=false;btn.style.opacity='1';btn.style.cursor='pointer';}const id=el.dataset.thread;const n=el.querySelector('.ob-char-name');const imgEl=el.querySelector('img');const step3title=document.getElementById('obStep3Title');if(step3title&&n)step3title.textContent=n.textContent+' is waiting.';const avatar=document.getElementById('obAvatarImg');if(avatar&&imgEl)avatar.src=imgEl.src;const obGreeting=document.getElementById('obGreeting');if(obGreeting)obGreeting.textContent='"'+(apiCharGreetings[id]||'…')+'"';}
function finishOnboard(){const sel=document.querySelector('.ob-char.selected');if(sel){const t=sel.dataset.thread;if(t){const item=document.querySelector(`.drawer-item[data-thread="${t}"]`);if(item)item.click();}}_dismissOnboard();goTo('chat');}
function obNext(step){document.querySelectorAll('.ob-step').forEach((s,i)=>s.classList.toggle('active',i===step-1));}
if(localStorage.getItem('v_onboarded')){_dismissOnboard();}
// clear stale message limit lock
localStorage.removeItem('v_free_msgs');

// Nav
const sidebar=document.getElementById('sidebar'),menuBtn=document.getElementById('menuBtn'),sbg=document.getElementById('sidebarBg');
const views={home:document.getElementById('view-home'),discover:document.getElementById('view-discover'),inbox:document.getElementById('view-inbox'),chat:document.getElementById('view-chat'),gallery:document.getElementById('view-gallery'),profile:document.getElementById('view-profile')};
const chatNav=document.getElementById('chatNav'),drawer=document.getElementById('threadDrawer');
let chatOpen=false;

const characterDirectory={
hazel:{id:'hazel',name:'Hazel',status:'OBSERVANT',color:'#b83468',route:'After the pause',bio:'Warm but withholding. She notices everything. She gives you nothing for free — but when she does, it means something.',photo:'/profile_pictures/hazel.png',tags:['Observant','Late night']},
nina:{id:'nina',name:'Nina',status:'ONLINE',color:'#ca5f8a',route:'The return',bio:'Warm, easy, and quietly funny. You knew each other before.',photo:'/profile_pictures/nina.png',tags:['Familiar','Romantic']},
iris:{id:'iris',name:'Iris',status:'LISTENING',color:'#7982cc',route:'Low signal',bio:'Deeply attentive yet almost impossible to reach.',photo:'/profile_pictures/iris.png',tags:['Silent','Watcher']},
vale:{id:'vale',name:'Vale',status:'UNSTABLE',color:'#d83b72',route:'Brief window',bio:'Unpredictable and brief. Electric when present.',photo:'/profile_pictures/vale_profile.png',tags:['Volatile','Electric']}
};
const relationshipState={hazel:42,nina:56,iris:33,vale:61};
const messageState=JSON.parse(localStorage.getItem('v_message_state')||'{}');
const apiCharGreetings={};
const tierPerks={free:{name:'Free',daily:3,monthly:0,gallery:false},pulse:{name:'Pulse',daily:0,monthly:50,gallery:true},signal:{name:'Signal',daily:0,monthly:Infinity,gallery:true}};
const tierState={tier:localStorage.getItem('v_tier')||'free'};
const currency={sparks:parseInt(localStorage.getItem('v_sparks')||'120',10),pulses:parseInt(localStorage.getItem('v_pulses')||'0',10),save(){localStorage.setItem('v_sparks',this.sparks);localStorage.setItem('v_pulses',this.pulses);}};
function grantRequestedCurrency(){
const k='v_bonus_added_5000';
if(localStorage.getItem(k)==='1') return;
currency.sparks+=5000;
localStorage.setItem(k,'1');
}

function closeSb(){sidebar.classList.remove('open');document.body.classList.remove('sb-open');}
function toggleDrawer(f){chatOpen=f!==undefined?f:!chatOpen;drawer.classList.toggle('open',chatOpen);chatNav.classList.toggle('open',chatOpen);}

function goTo(name){
Object.entries(views).forEach(([k,v])=>v?.classList.toggle('active',k===name));
document.querySelectorAll('.nav-item').forEach(b=>{if(b!==chatNav)b.classList.toggle('active',b.dataset.to===name);});
document.querySelectorAll('.mob-tab').forEach(b=>b.classList.toggle('active',b.dataset.to===name));
if(name==='chat'){toggleDrawer(true);chatNav.classList.add('active');}else{chatNav.classList.remove('active');}
if(name==='inbox'){markInboxReadAll();}
closeSb();window.scrollTo({top:0,behavior:'smooth'});localStorage.setItem('v_view',name);
}

function updateCurrencyUI(flash=false){
const sparkCount=document.getElementById('sparkCount');
const sparkCounter=document.getElementById('sparkCounter');
const planBadge=document.getElementById('planBadge');
if(sparkCount)sparkCount.textContent=String(currency.sparks);
if(planBadge)planBadge.textContent=`Current plan: ${tierPerks[tierState.tier]?.name||'Free'}`;
if(flash&&sparkCounter){sparkCounter.classList.remove('flash-spend');void sparkCounter.offsetWidth;sparkCounter.classList.add('flash-spend');}
currency.save();
}
function gainSparks(amount,msg){
currency.sparks+=amount;updateCurrencyUI();
if(msg)showToast(msg);
}
function spendForScene(sparkCost,pulseCost){
if(currency.sparks>=sparkCost){currency.sparks-=sparkCost;updateCurrencyUI(true);return true;}
if(currency.pulses>=pulseCost){currency.pulses-=pulseCost;updateCurrencyUI(true);return true;}
showToast('Not enough sparks — earn more by chatting');
return false;
}
function todayKey(){return new Date().toISOString().slice(0,10);}
function yesterdayKey(){const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);}
function trackLoginBonuses(){
const today=todayKey();
const last=localStorage.getItem('v_last_login');
if(last!==today){gainSparks(10,'+10 sparks daily login bonus');localStorage.setItem('v_last_login',today);}
const streakLast=localStorage.getItem('v_streak_last');
let streak=Number(localStorage.getItem('v_streak_count')||'0');
if(streakLast===today){} else if(streakLast===yesterdayKey()){streak+=1;} else {streak=1;}
localStorage.setItem('v_streak_last',today);localStorage.setItem('v_streak_count',String(streak));
document.getElementById('streakBadge').textContent=`🔥 ${streak} day streak`;
const milestone={3:50,7:150,30:500}[streak];
if(milestone){gainSparks(milestone,`Streak bonus +${milestone} sparks`);}
}
function monthKey(){const d=new Date();return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;}
function sceneUsage(){return JSON.parse(localStorage.getItem('v_scene_usage')||'{}');}
function canGenerateScene(){
const tier=tierState.tier;
if(tier==='signal') return true;
const usage=sceneUsage();
if(tier==='free'){
  const k=todayKey();const n=usage[`d_${k}`]||0;if(n>=3){openPaywall(curThread);return false;}
}
if(tier==='pulse'){
  const mk=monthKey();const n=usage[`m_${mk}`]||0;if(n>=50){showToast('Pulse monthly limit reached');return false;}
}
return spendForScene(15,1);
}
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
function relative(ts){if(!ts)return '';const diff=Math.max(1,Math.floor((Date.now()-ts)/60000));if(diff<60)return `${diff}m`;const h=Math.floor(diff/60);if(h<24)return `${h}h`;return `${Math.floor(h/24)}d`;}
function markInboxReadAll(){Object.keys(characterDirectory).forEach(id=>localStorage.setItem(`v_read_${id}`,String(Date.now())));renderInboxes();}
function renderInboxes(){
const rows=Object.keys(characterDirectory).map(id=>{const entry=messageState[id]||{messages:[]};const last=entry.messages[entry.messages.length-1];return{id,last,lastAt:entry.lastAt||0};}).sort((a,b)=>b.lastAt-a.lastAt);
const markup=rows.filter(r=>r.last).map(r=>{const c=characterDirectory[r.id];const readTs=Number(localStorage.getItem(`v_read_${r.id}`)||'0');const unread=r.lastAt>readTs;const preview=(r.last?.text||'').slice(0,60);return `<div class="inbox-row" data-thread="${r.id}" data-to="chat"><img src="${c.photo}" class="inbox-av" alt="${c.name}"/><div class="inbox-body"><div class="inbox-name">${unread?'<span class="inbox-unread"></span>':''}${c.name}</div><div class="inbox-preview">${preview||'...'}</div></div><span class="inbox-meta">${relative(r.lastAt)}</span></div>`;}).join('');
const empty='<div style="padding:18px;color:var(--text-2)">No messages yet — start a conversation</div>';
const home=document.getElementById('homeInboxList');const inbox=document.getElementById('inboxList');
if(home)home.innerHTML=markup||empty;
if(inbox)inbox.innerHTML=markup||empty;
document.querySelectorAll('#homeInboxList .inbox-row,#inboxList .inbox-row').forEach(row=>row.addEventListener('click',()=>startChat(row.dataset.thread)));
}
function openDiscoverProfile(id){
const c=characterDirectory[id]; if(!c) return;
const grid=document.getElementById('discoverGrid'); const detail=document.getElementById('discoverProfile');
grid.style.display='none'; detail.style.display='block';
const rel=Math.max(0,Math.min(100,relationshipState[id]||0));
const unlocked=tierState.tier==='pulse'||tierState.tier==='signal';
detail.innerHTML=`<div class="discover-profile-wrap" id="profile-${id}" style="border-color:${c.color}">
  <div class="discover-profile-head"><button class="btn" id="discoverBack">← Back</button><button class="btn btn-primary" id="discoverChat">Start chatting</button></div>
  <div class="discover-profile-main"><img src="${c.photo}" alt="${c.name}"/><div>
    <h2>${c.name} ${id==='vale'?'<span style="display:inline-block;width:8px;height:8px;background:var(--accent);border-radius:50%;animation:glow 1.2s infinite"></span>':''}</h2>
    <div style="color:var(--text-2);margin-bottom:8px">${c.route}</div><p style="margin-bottom:10px">${c.bio}</p>
    <div style="margin-bottom:4px;font-size:.78rem;color:var(--text-2)">Relationship status</div><div class="rel-bar"><div class="rel-fill" style="width:${rel}%"></div></div>
    <div class="profile-gallery-grid" style="margin-top:14px">${Array.from({length:6}).map((_,i)=>`<div class="profile-gallery-tile unlocked"><img src="${c.photo}" alt="${c.name}"/>${i===0||unlocked?'':`<button class="tile-lock-btn" data-unlock="${id}">Unlock (50⚡ / 3💠)</button>`}</div>`).join('')}</div>
  </div></div></div>`;
document.getElementById('discoverBack').onclick=()=>{detail.style.display='none';grid.style.display='grid';};
document.getElementById('discoverChat').onclick=()=>startChat(id);
detail.querySelectorAll('[data-unlock]').forEach(btn=>btn.onclick=()=>{if(tierState.tier==='pulse'||tierState.tier==='signal'){btn.remove();return;} if(spendForScene(50,3)){btn.remove();}});
}

chatNav.addEventListener('click',()=>{if(!views.chat.classList.contains('active'))goTo('chat');else toggleDrawer();});
document.querySelectorAll('[data-to]').forEach(b=>{if(b===chatNav)return;b.addEventListener('click',()=>goTo(b.dataset.to));});
menuBtn.addEventListener('click',()=>{sidebar.classList.contains('open')?closeSb():(sidebar.classList.add('open'),document.body.classList.add('sb-open'));});
sbg.addEventListener('click',closeSb);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSb();});
const sv=localStorage.getItem('v_view');if(sv&&views[sv])goTo(sv);else toggleDrawer(false);

// Discover filters
document.querySelectorAll('.fpill').forEach(p=>{p.addEventListener('click',()=>{document.querySelectorAll('.fpill').forEach(x=>x.classList.remove('active'));p.classList.add('active');const f=p.dataset.f;document.querySelectorAll('.discover-card').forEach(c=>c.classList.toggle('hidden',f!=='all'&&!(c.dataset.tags||'').includes(f)));});});

// Chat
const chatMsgs=document.getElementById('chatMsgs'),chatInput=document.getElementById('chatInput'),sendBtn=document.querySelector('.send-btn');
const charData={
hazel:{photo:'/profile_pictures/hazel.png',bio:'Warm but withholding. She notices everything. She gives you nothing for free — but when she does, it means something.',status:'ONLINE NOW',stats:[{l:'Mood',v:'Observant'},{l:'Style',v:'Slow burn'},{l:'Speaks',v:'English'},{l:'Route',v:'After the pause'}]},
nina:{photo:'/profile_pictures/nina.png',bio:'Warm, easy, and quietly funny. You knew each other before — years of silence, but the closeness never fully left.',status:'ONLINE NOW',stats:[{l:'Mood',v:'Familiar'},{l:'Style',v:'Warm'},{l:'Speaks',v:'English'},{l:'Route',v:'The return'}]},
iris:{photo:'/profile_pictures/iris.png',bio:'Deeply attentive yet almost impossible to reach. When she does say something real, it lands with unexpected weight.',status:'LISTENING',stats:[{l:'Mood',v:'Distant'},{l:'Style',v:'Minimal'},{l:'Speaks',v:'English'},{l:'Route',v:'Low signal'}]},
vale:{photo:'/profile_pictures/vale_profile.png',bio:'Unpredictable and brief. Electric when present. She connects fast and hard, then closes just as fast. No explanation.',status:'UNSTABLE',stats:[{l:'Mood',v:'Volatile'},{l:'Style',v:'Intense'},{l:'Speaks',v:'English'},{l:'Route',v:'Brief window'}]}
};

function updateCharPanel(thread){
const d=charData[thread];if(!d)return;
document.getElementById('cpPhoto').src=d.photo;
document.getElementById('cpName').innerHTML=`${thread.charAt(0).toUpperCase()+thread.slice(1)} <span style="color:var(--accent);font-size:.9rem">♥</span>`;
document.getElementById('cpStatus').textContent=`● ${d.status}`;
document.getElementById('cpBio').textContent=d.bio;
const stats=document.getElementById('cpStats');
stats.innerHTML=d.stats.map(s=>`<div class="cp-stat"><div class="cp-stat-label">${s.l}</div><div class="cp-stat-value">${s.v}</div></div>`).join('');
}
const chatAv=document.getElementById('chatAv'),chatName=document.getElementById('chatName'),chatStatus=document.getElementById('chatStatus');

let curPersona='',curAvSrc='/profile_pictures/hazel.png';
let curThread='hazel';
const CHAR_ACCENT={hazel:'#b83468',nina:'#9f67ff',iris:'#a855f7',vale:'#22d3ee'};
function applyCharAccent(thread){
const color=CHAR_ACCENT[thread]||'#b83468';
document.getElementById('view-chat')?.style.setProperty('--chat-accent',color);
}
const greetings={
hazel:'I noticed you were gone for a while. I didn\'t say anything.',
nina:'It\'s strange — it feels like we never stopped talking.',
iris:'…',
vale:'You\'re here. Good. I have maybe five minutes.'
};

function ts(){const n=new Date();return`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;}

function addMsg(side,text,avSrc,extraEl){
const row=document.createElement('div');row.className='msg'+(side==='mine'?' mine':'');
if(side!=='mine'){const a=document.createElement('img');a.src=avSrc;a.className='msg-av';a.alt='';row.appendChild(a);}
const w=document.createElement('div'),b=document.createElement('div'),t=document.createElement('div');
const isMedia=!text&&extraEl&&extraEl.tagName==='IMG';
b.className='bubble '+(isMedia?'media':(side==='mine'?'mine':'theirs'));if(text)b.textContent=text;
if(extraEl)b.appendChild(extraEl);
t.className='msg-time';t.textContent=ts();if(side==='mine')t.style.textAlign='right';
w.appendChild(b);w.appendChild(t);row.appendChild(w);chatMsgs.appendChild(row);chatMsgs.scrollTop=chatMsgs.scrollHeight;
}

function addTyping(avSrc){
const row=document.createElement('div');row.className='msg';row.id='trow';
const a=document.createElement('img');a.src=avSrc;a.className='msg-av';a.alt='';row.appendChild(a);
const tw=document.createElement('div');tw.className='typing-wrap';
for(let i=0;i<3;i++){const d=document.createElement('div');d.className='tdot';tw.appendChild(d);}
row.appendChild(tw);chatMsgs.appendChild(row);chatMsgs.scrollTop=chatMsgs.scrollHeight;return row;
}

document.querySelectorAll('.drawer-item').forEach(item=>{item.addEventListener('click',()=>{
document.querySelectorAll('.drawer-item').forEach(x=>x.classList.toggle('active',x===item));
const thread=item.dataset.thread;
const imgSrc=item.querySelector('img')?.src||'';
chatAv.src=imgSrc;chatName.textContent=item.dataset.name;chatStatus.textContent=item.dataset.status;
curPersona=item.dataset.p;curAvSrc=imgSrc;curThread=thread;
applyCharAccent(thread);
chatMsgs.innerHTML='';updateCharPanel(thread);
goTo('chat');
function _showGreeting(){
  const tr=addTyping(curAvSrc);
  fetch(`/api/characters/${curThread}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'__greeting__'})})
    .then(r=>r.json()).then(d=>{tr.remove();const reply=(d.reply||greetings[curThread]||'…').trim();addMsg('theirs',reply,curAvSrc);rememberMessage(curThread,reply,'assistant');})
    .catch(()=>{tr.remove();const fallback=(greetings[curThread]||'…');addMsg('theirs',fallback,curAvSrc);rememberMessage(curThread,fallback,'assistant');});
}
fetch(`/api/characters/${thread}/history`)
  .then(r=>r.json()).then(d=>{
    if(d.ok&&d.messages&&d.messages.length){
      d.messages.forEach(m=>{addMsg(m.role==='user'?'mine':'theirs',String(m.content||''),m.role==='user'?'':curAvSrc);});
      if(!(messageState[thread]?.lastAt)){
        const last=d.messages[d.messages.length-1];
        if(last){const slot={messages:[{text:String(last.content||''),role:last.role,ts:Date.now()}],lastAt:Date.now()};messageState[thread]=slot;localStorage.setItem('v_message_state',JSON.stringify(messageState));renderInboxes();}
      }
    }
  }).catch(()=>{}).finally(()=>{_showGreeting();});
});});

// Image attach
const imgAttachInput=document.getElementById('imgAttachInput');
const imgAttachPreview=document.getElementById('imgAttachPreview');
const imgAttachThumb=document.getElementById('imgAttachThumb');
let pendingImg=null;
document.getElementById('imgAttachBtn').addEventListener('click',()=>imgAttachInput.click());
document.getElementById('imgAttachClear').addEventListener('click',()=>{pendingImg=null;imgAttachInput.value='';imgAttachPreview.style.display='none';});
imgAttachInput.addEventListener('change',()=>{
const f=imgAttachInput.files[0];if(!f)return;
const reader=new FileReader();
reader.onload=ev=>{pendingImg=ev.target.result;imgAttachThumb.src=pendingImg;imgAttachPreview.style.display='block';};
reader.readAsDataURL(f);
});

const IMG_REACTIONS=['…I see you.','That's a good look.','Sent me something. Noted.','*looks at it longer than expected*','Okay. That one stays with me.','You really sent that.','*saves it without saying why*'];

document.getElementById('chatForm').addEventListener('submit',async e=>{
e.preventDefault();
const txt=chatInput.value.trim();
const hasImg=!!pendingImg;
if(!txt&&!hasImg)return;
gainSparks(2,'+2 sparks for chatting');
if(!localStorage.getItem(`v_first_chat_${curThread}`)){localStorage.setItem(`v_first_chat_${curThread}`,'1');gainSparks(25,`+25 sparks first chat with ${profileData[curThread]?.name||curThread}`);}
chatInput.value='';sendBtn.disabled=true;
if(hasImg){
  const imgEl=document.createElement('img');imgEl.src=pendingImg;imgEl.alt='';
  addMsg('mine',null,null,imgEl);
  pendingImg=null;imgAttachInput.value='';imgAttachPreview.style.display='none';
}
if(txt){addMsg('mine',txt);rememberMessage(curThread,txt,'user');}
const tr=addTyping(curAvSrc);
try{
  let reply;
  if(hasImg&&!txt){
    await new Promise(r=>setTimeout(r,900+Math.random()*600));
    reply=IMG_REACTIONS[Math.floor(Math.random()*IMG_REACTIONS.length)];
  } else {
    const msgText=hasImg?`[sent an image] ${txt}`:txt;
    const res=await fetch(`/api/characters/${curThread||'hazel'}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:msgText})});
    const data=await res.json();
    reply=(data.reply||data.result||'…').trim();
  }
  tr.remove();addMsg('theirs',reply,curAvSrc);rememberMessage(curThread,reply,'assistant');
}catch{tr.remove();addMsg('theirs','One moment…',curAvSrc);rememberMessage(curThread,'One moment…','assistant');}
sendBtn.disabled=false;chatInput.focus();
});

document.getElementById('cpViewProfile').addEventListener('click',()=>{
const thread=document.querySelector('.drawer-item.active')?.dataset.thread;
if(thread){window._profileFrom='chat';openProfile(thread);}
});

// Profile page
const profileData={
hazel:{photo:'/profile_pictures/hazel.png',wide:'/profile_pictures/hazel_large_picture.png',name:'Hazel',status:'● ONLINE NOW',bio:'Warm but withholding. She notices everything. She gives you nothing for free — but when she does, it means something.',tags:['Observant','Slow burn','Late night','Voice notes','Warm'],stats:[{l:'Mood',v:'Observant'},{l:'Style',v:'Slow burn'},{l:'Speaks',v:'English'},{l:'Route',v:'After the pause'}],thread:'hazel'},
nina:{photo:'/profile_pictures/nina.png',wide:'/profile_pictures/nina.png',name:'Nina',status:'● ONLINE NOW',bio:'Warm, easy, and quietly funny. You knew each other before — years of silence, but the closeness never fully left. She asks real questions and remembers the answers.',tags:['Familiar','Romantic','Emotionally honest','Nostalgic'],stats:[{l:'Mood',v:'Familiar'},{l:'Style',v:'Warm'},{l:'Speaks',v:'English'},{l:'Route',v:'The return'}],thread:'nina'},
iris:{photo:'/profile_pictures/iris.png',wide:'/profile_pictures/iris.png',name:'Iris',status:'● LISTENING',bio:'Deeply attentive yet almost impossible to reach. She goes silent sometimes with no warning. When she does say something real, it lands with unexpected weight.',tags:['Silent','Watcher','Melancholic','Hard to reach'],stats:[{l:'Mood',v:'Distant'},{l:'Style',v:'Minimal'},{l:'Speaks',v:'English'},{l:'Route',v:'Low signal'}],thread:'iris'},
vale:{photo:'/profile_pictures/vale_profile.png',wide:'/profile_pictures/vale_profile.png',name:'Vale',status:'● UNSTABLE',bio:'Unpredictable and brief. She connects fast and hard, then closes just as fast. Electric when present. She does not apologize for disappearing.',tags:['Volatile','Electric','Intense','Brief'],stats:[{l:'Mood',v:'Volatile'},{l:'Style',v:'Intense'},{l:'Speaks',v:'English'},{l:'Route',v:'Brief window'}],thread:'vale'}
};

function openProfile(id){
const d=profileData[id];if(!d)return;
document.getElementById('profileImg').src=d.photo;
document.getElementById('profileName').textContent=d.name;
document.getElementById('profileStatus').textContent=d.status;
document.getElementById('profileBio').textContent=d.bio;
// tags
const tagsEl=document.getElementById('profileTags');
tagsEl.innerHTML=d.tags.map((t,i)=>`<span class="profile-tag${i<2?' accent':''}">${t}</span>`).join('');
// stats
document.getElementById('profileStats').innerHTML=d.stats.map(s=>`<div class="profile-stat"><div class="profile-stat-label">${s.l}</div><div class="profile-stat-value">${s.v}</div></div>`).join('');
// gallery tiles — use same photo as placeholder
[0,1,2,3,4].forEach(i=>{const el=document.getElementById('pgTile'+i);if(el)el.src=d.photo;});
// wire chat button
document.getElementById('profileChatBtn').onclick=()=>startChat(d.thread);
// navigate
goTo('profile');
window._profileFrom='discover';
}

function startChat(thread){
const item=document.querySelector(`.drawer-item[data-thread="${thread}"]`);
localStorage.setItem(`v_read_${thread}`,String(Date.now()));
if(item) item.click(); else goTo('chat');
renderInboxes();
}

document.getElementById('profileBack').addEventListener('click',()=>goTo(window._profileFrom||'discover'));

// Wire discover cards to open profile
document.querySelectorAll('.discover-card').forEach(card=>{
card.addEventListener('click',e=>{
  if(e.target.closest('.d-btn'))return; // let chat button through
  const thread=card.dataset.thread;
  if(thread) openDiscoverProfile(thread);
});
});


// Persona-aware routing from cards/buttons
function getPersonaFromEl(el){
const card=el.closest('.discover-card,.char-card,.inbox-row,.av-item,.profile-card');
if(card?.dataset.thread)return card.dataset.thread;
const nameEl=card?.querySelector('h3,.char-name,.inbox-name,.av-name,#profileName');
return (nameEl?.textContent||'').trim().toLowerCase();
}
document.addEventListener('click',e=>{
const btn=e.target.closest('[data-to="chat"]');
if(!btn||btn===chatNav)return;
const persona=getPersonaFromEl(btn);
if(persona){e.stopImmediatePropagation();startChat(persona);}
},true);

// Camera — chat header
document.getElementById('camBtn')?.addEventListener('click',async()=>{
const btn=document.getElementById('camBtn');
const statusEl=document.getElementById('camStatus');
const character=curThread||'hazel';
btn.disabled=true;btn.textContent='⏳';
statusEl.style.display='block';statusEl.textContent='Generating… (~20s)';
try{
  const res=await fetch('/api/camera/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,mood:'warm'})});
  const data=await res.json();
  if(!data.ok) throw new Error(data.error||'Generation failed');
  if(data.shot?.path){
    const img=document.createElement('img');
    img.src=data.shot.path;img.alt=character;img.loading='lazy';
    addMsg('theirs','',curAvSrc,img);
  }
  statusEl.textContent='';statusEl.style.display='none';
}catch(err){statusEl.textContent='Error: '+err.message;}
btn.disabled=false;btn.textContent='📷';
});

// ── DEV MODE ──────────────────────────────────────────────────────────────────
const DEV_CODE='dev:1337';
let devUnlocked=localStorage.getItem('v_dev')==='1';

function openDevPanel(){
const panel=document.getElementById('devPanel');
if(!panel)return;
panel.style.display='block';
loadDevLooks();
goTo('gallery');
const status=document.getElementById('devNewStatus');
if(status) status.textContent=`Dev status — v_sparks:${currency.sparks}, v_pulses:${currency.pulses}, tier:${tierState.tier}`;
showToast('Dev mode active');
}

function loadDevLooks(){
fetch('/api/camera/prompts').then(r=>r.json()).then(data=>{
  if(!data.ok)return;
  const list=document.getElementById('devLooksList');
  list.innerHTML='';
  Object.entries(data.looks).forEach(([id,val])=>{
    const row=document.createElement('div');row.className='dev-look-row';
    row.innerHTML=`<div class="dev-look-id">${id}</div>
      <textarea class="dev-look-input" id="devLook_${id}" rows="2">${val}</textarea>
      <button class="dev-look-save" data-id="${id}">Save</button>`;
    list.appendChild(row);
  });
  list.querySelectorAll('.dev-look-save').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const id=btn.dataset.id;
      const value=document.getElementById(`devLook_${id}`)?.value.trim();
      if(!value)return;
      btn.textContent='Saving…';
      const res=await fetch('/api/camera/prompts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,value,devKey:DEV_CODE})});
      const d=await res.json();
      btn.textContent=d.ok?'Saved ✓':'Error';
      setTimeout(()=>btn.textContent='Save',1500);
    });
  });
}).catch(()=>showToast('Could not load prompts'));
}

document.getElementById('devClose')?.addEventListener('click',()=>{
document.getElementById('devPanel').style.display='none';
});

document.getElementById('devNewGenerate')?.addEventListener('click',async()=>{
const btn=document.getElementById('devNewGenerate');
const status=document.getElementById('devNewStatus');
const id=document.getElementById('devNewId')?.value.trim().toLowerCase().replace(/\s+/g,'_');
const look=document.getElementById('devNewLook')?.value.trim();
const mood=document.getElementById('devNewMood')?.value||'warm';
if(!id){status.textContent='Enter a character ID';return;}
if(!look){status.textContent='Describe her appearance';return;}
btn.disabled=true;btn.textContent='Saving…';
await fetch('/api/camera/prompts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,value:look,devKey:DEV_CODE})});
btn.textContent='Generating…';status.textContent='Generating preview (~20s)…';
try{
  const res=await fetch('/api/camera/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character:id,mood})});
  const data=await res.json();
  if(!data.ok)throw new Error(data.error||'Failed');
  const grid=document.querySelector('.gallery-grid');
  const tile=document.createElement('article');
  tile.className='g-tile';
  tile.innerHTML=`<img src="${data.shot.path}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" loading="lazy" alt="${id}"><div class="g-overlay"></div><div class="g-caption"><div class="g-name">${id.charAt(0).toUpperCase()+id.slice(1)}</div><div class="g-mood">New · ${mood}</div></div>`;
  grid.prepend(tile);
  status.textContent='Done! Reloading prompts…';
  loadDevLooks();
  document.getElementById('devNewId').value='';
  document.getElementById('devNewLook').value='';
}catch(err){status.textContent='Error: '+err.message;}
btn.disabled=false;btn.textContent='Generate & Add';
});

// Dev unlock via chat input
const _origSubmit=document.getElementById('chatForm').onsubmit;
document.getElementById('chatInput').addEventListener('keydown',e=>{
if(e.key==='Enter'&&chatInput.value.trim()===DEV_CODE){
  e.preventDefault();chatInput.value='';
  localStorage.setItem('v_dev','1');devUnlocked=true;
  openDevPanel();
}
});
if(devUnlocked)openDevPanel();

// ── SCREENSHOT + ANNOTATE ────────────────────────────────────────────────────
(function(){
const btn = document.getElementById('devScreenshot');
const status = document.getElementById('devSsStatus');
if(!btn) return;

function loadHtml2Canvas(){
  return new Promise((resolve,reject)=>{
    if(window.html2canvas){resolve(window.html2canvas);return;}
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload=()=>resolve(window.html2canvas);
    s.onerror=()=>reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(s);
  });
}

function buildCropOverlay(imgDataUrl, onCropped){
  document.getElementById('ssOverlay')?.remove();
  const overlay=document.createElement('div');
  overlay.id='ssOverlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.75);display:flex;flex-direction:column;';
  const hint=document.createElement('div');
  hint.style.cssText='text-align:center;color:#aaa;font-size:12px;padding:8px;flex-shrink:0;';
  hint.textContent='Drag to select a region to snip — or click Use Full to keep the whole screenshot';
  const wrap=document.createElement('div');
  wrap.style.cssText='flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;position:relative;';
  const img=document.createElement('img');
  img.src=imgDataUrl;
  img.style.cssText='max-width:100%;max-height:100%;display:block;user-select:none;';
  const sel=document.createElement('div');
  sel.style.cssText='position:absolute;border:2px dashed #ff3366;pointer-events:none;display:none;box-sizing:border-box;';
  wrap.appendChild(img);wrap.appendChild(sel);
  const bar=document.createElement('div');
  bar.style.cssText='display:flex;gap:8px;padding:8px 14px;background:#111;border-top:1px solid #333;flex-shrink:0;justify-content:flex-end;';
  bar.innerHTML='<button class="btn btn-primary btn-sm" id="ssCropConfirm" style="padding:4px 12px;font-size:12px;">Crop & Annotate</button><button class="btn btn-sm" id="ssCropFull" style="padding:4px 10px;font-size:12px;background:#333;">Use Full</button><button class="btn btn-sm" id="ssCropDiscard" style="padding:4px 10px;font-size:12px;background:#222;">Discard</button>';
  overlay.appendChild(hint);overlay.appendChild(wrap);overlay.appendChild(bar);
  document.body.appendChild(overlay);

  let sx=0,sy=0,ex=0,ey=0,dragging=false;
  function toImgCoords(e){
    const r=img.getBoundingClientRect();
    return {x:Math.max(0,Math.min(e.clientX-r.left,r.width)),y:Math.max(0,Math.min(e.clientY-r.top,r.height))};
  }
  wrap.addEventListener('mousedown',e=>{const p=toImgCoords(e);sx=p.x;sy=p.y;ex=p.x;ey=p.y;dragging=true;sel.style.display='block';});
  wrap.addEventListener('mousemove',e=>{
    if(!dragging)return;
    const p=toImgCoords(e);ex=p.x;ey=p.y;
    const r=img.getBoundingClientRect(),wr=wrap.getBoundingClientRect();
    const l=Math.min(sx,ex)+r.left-wr.left,t=Math.min(sy,ey)+r.top-wr.top;
    sel.style.left=l+'px';sel.style.top=t+'px';sel.style.width=Math.abs(ex-sx)+'px';sel.style.height=Math.abs(ey-sy)+'px';
  });
  wrap.addEventListener('mouseup',()=>{dragging=false;});

  function cropToDataUrl(){
    const r=img.getBoundingClientRect();
    const scaleX=img.naturalWidth/r.width,scaleY=img.naturalHeight/r.height;
    const x=Math.round(Math.min(sx,ex)*scaleX),y=Math.round(Math.min(sy,ey)*scaleY);
    const w=Math.round(Math.abs(ex-sx)*scaleX),h=Math.round(Math.abs(ey-sy)*scaleY);
    if(w<10||h<10)return null;
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d');
    const src=new Image();src.src=imgDataUrl;
    ctx.drawImage(src,x,y,w,h,0,0,w,h);
    return c.toDataURL('image/png');
  }

  document.getElementById('ssCropConfirm').addEventListener('click',()=>{
    const cropped=cropToDataUrl();
    overlay.remove();
    onCropped(cropped||imgDataUrl);
  });
  document.getElementById('ssCropFull').addEventListener('click',()=>{overlay.remove();onCropped(imgDataUrl);});
  document.getElementById('ssCropDiscard').addEventListener('click',()=>overlay.remove());
}

function buildAnnotateOverlay(imgDataUrl){
  document.getElementById('ssOverlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id='ssOverlay';
  overlay.className='ss-overlay';

  overlay.innerHTML=`
    <div class="ss-toolbar">
      <label>Color</label><input type="color" id="ssPenColor" value="#ff3366">
      <label>Size</label><input type="range" id="ssPenSize" min="1" max="20" value="3">
      <button class="btn btn-sm" id="ssUndo" style="padding:4px 10px;font-size:12px;">Undo</button>
      <button class="btn btn-sm" id="ssClear" style="padding:4px 10px;font-size:12px;">Clear</button>
      <span style="flex:1"></span>
      <button class="btn btn-primary btn-sm" id="ssSend" style="padding:4px 12px;font-size:12px;">Send to Notes</button>
      <button class="btn btn-sm" id="ssDiscard" style="padding:4px 10px;font-size:12px;background:#333;">Discard</button>
    </div>
    <div class="ss-canvas-wrap"><canvas id="ssCanvas"></canvas></div>
    <div class="ss-note">
      <input type="text" id="ssNoteText" placeholder="Add a note (optional)…">
    </div>`;

  document.body.appendChild(overlay);

  const canvas = document.getElementById('ssCanvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = ()=>{
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img,0,0);
  };
  img.src = imgDataUrl;

  let drawing=false, strokes=[], curStroke=[];
  const penColor=()=>document.getElementById('ssPenColor').value;
  const penSize=()=>parseInt(document.getElementById('ssPenSize').value)||3;

  function redraw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0);
    strokes.forEach(stroke=>{
      if(!stroke.length) return;
      ctx.beginPath();ctx.strokeStyle=stroke[0].color;ctx.lineWidth=stroke[0].size;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.moveTo(stroke[0].x,stroke[0].y);stroke.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();
    });
  }

  function getPos(e){
    const r=canvas.getBoundingClientRect();
    const scaleX=canvas.width/r.width,scaleY=canvas.height/r.height;
    const src=e.touches?e.touches[0]:e;
    return {x:(src.clientX-r.left)*scaleX,y:(src.clientY-r.top)*scaleY};
  }

  canvas.addEventListener('mousedown',e=>{drawing=true;curStroke=[];curStroke.push({...getPos(e),color:penColor(),size:penSize()});});
  canvas.addEventListener('mousemove',e=>{
    if(!drawing)return;
    const p={...getPos(e),color:penColor(),size:penSize()};curStroke.push(p);
    ctx.beginPath();ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.lineCap='round';ctx.lineJoin='round';
    const prev=curStroke[curStroke.length-2]||p;ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();
  });
  canvas.addEventListener('mouseup',()=>{if(drawing&&curStroke.length){strokes.push(curStroke);curStroke=[];}drawing=false;});
  canvas.addEventListener('mouseleave',()=>{if(drawing&&curStroke.length){strokes.push(curStroke);curStroke=[];}drawing=false;});

  document.getElementById('ssUndo').addEventListener('click',()=>{strokes.pop();redraw();});
  document.getElementById('ssClear').addEventListener('click',()=>{strokes=[];redraw();});
  document.getElementById('ssDiscard').addEventListener('click',()=>overlay.remove());

  document.getElementById('ssSend').addEventListener('click',async()=>{
    const noteText=document.getElementById('ssNoteText').value.trim()||'Screenshot annotation';
    document.getElementById('ssSend').disabled=true;
    document.getElementById('ssSend').textContent='Sending…';
    try{
      const blob=await new Promise(res=>canvas.toBlob(res,'image/png'));
      const fd=new FormData();
      const ts=new Date().toISOString().replace(/[:.]/g,'-');
      fd.append('image',blob,`screenshot-${ts}.png`);
      fd.append('note',noteText);
      const r=await fetch('/api/admin/notes',{method:'POST',headers:{'x-admin-key':'velora-admin-2025'},body:fd});
      const data=await r.json();
      if(data.ok){overlay.remove();status.textContent='Saved ✓';setTimeout(()=>status.textContent='',3000);}
      else{document.getElementById('ssSend').textContent='Retry';document.getElementById('ssSend').disabled=false;status.textContent='Error: '+(data.error||'unknown');}
    }catch(err){document.getElementById('ssSend').textContent='Retry';document.getElementById('ssSend').disabled=false;status.textContent='Error: '+err.message;}
  });
}

btn.addEventListener('click', async()=>{
  btn.disabled=true;
  status.textContent='Capturing…';
  const devPanel=document.getElementById('devPanel');
  const wasVisible=devPanel&&devPanel.style.display!=='none';
  if(wasVisible) devPanel.style.display='none';
  try{
    const h2c=await loadHtml2Canvas();
    const canvas=await h2c(document.body,{useCORS:true,allowTaint:true,scale:1,logging:false});
    if(wasVisible) devPanel.style.display='';
    buildCropOverlay(canvas.toDataURL('image/png'), buildAnnotateOverlay);
    status.textContent='';
  }catch(err){
    if(wasVisible) devPanel.style.display='';
    status.textContent='Error: '+err.message;
  }
  btn.disabled=false;
});
})();
// ── DEV MODE END ──────────────────────────────────────────────────────────────

// Toast helper
function showToast(msg,ms=2400){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),ms);}

// Paywall
function openPaywall(thread){
const id=thread||curThread||'hazel';
const d=profileData[id];
const pw=document.getElementById('paywall');
const img=document.getElementById('paywallImg');
const name=document.getElementById('paywallName');
if(img&&d)img.src=d.photo;
if(name&&d)name.textContent=d.name;
const active=tierState.tier;
document.querySelectorAll('.tier-card').forEach(card=>card.classList.toggle('active',card.dataset.tier===active));
const cta=document.getElementById('paywallChoose');
if(cta)cta.textContent=active==='free'?'Start free trial':`Switch to ${active}`;
pw?.classList.add('open');
}
document.querySelectorAll('.tier-card').forEach(card=>card.addEventListener('click',()=>{
tierState.tier=card.dataset.tier||'free';
localStorage.setItem('v_tier',tierState.tier);
document.querySelectorAll('.tier-card').forEach(c=>c.classList.toggle('active',c===card));
updateCurrencyUI();
}));
document.getElementById('paywallChoose')?.addEventListener('click',()=>{
showToast(`Plan updated: ${tierPerks[tierState.tier].name}`);
document.getElementById('paywall')?.classList.remove('open');
});
document.getElementById('paywallClose')?.addEventListener('click',()=>document.getElementById('paywall')?.classList.remove('open'));
document.getElementById('paywall')?.addEventListener('click',e=>{if(e.target===document.getElementById('paywall'))document.getElementById('paywall').classList.remove('open');});

// ☆ favourite toggle
document.querySelector('.chat-btn:not(#camBtn)')?.addEventListener('click',function(){
const starred=this.textContent.trim()==='★';
this.textContent=starred?'☆':'★';
this.style.color=starred?'':'#b83468';
showToast(starred?'Removed from favourites':'Added to favourites');
});

// ⋯ clear history
document.querySelectorAll('.chat-btn')[2]?.addEventListener('click',()=>{
if(!confirm('Clear chat history with '+((profileData[curThread]?.name)||curThread)+'?'))return;
fetch(`/api/characters/${curThread}/history`,{method:'DELETE'});
chatMsgs.innerHTML='';
showToast('Chat history cleared');
});

// Image pill → camera generate
document.querySelectorAll('.chat-action-pill')[0]?.addEventListener('click',async()=>{
const btn=document.querySelectorAll('.chat-action-pill')[0];
const statusEl=document.getElementById('camStatus');
const character=curThread||'hazel';
btn.disabled=true;
statusEl.style.display='block';statusEl.textContent='Generating… (~20s)';
try{
  const res=await fetch('/api/camera/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,mood:'warm'})});
  const data=await res.json();
  if(!data.ok)throw new Error(data.error||'Failed');
  const img=document.createElement('img');
  img.src=data.shot.path;img.alt=character;img.loading='lazy';
  addMsg('theirs','',curAvSrc,img);
  statusEl.textContent='';statusEl.style.display='none';
}catch(err){statusEl.textContent='Error: '+err.message;}
btn.disabled=false;
});

// Video pill → coming soon
document.querySelectorAll('.chat-action-pill')[1]?.addEventListener('click',()=>showToast('Video is coming soon'));

// Scene pill → open scene builder
document.querySelectorAll('.chat-action-pill')[2]?.addEventListener('click',()=>document.getElementById('sceneSheet')?.classList.add('open'));
document.getElementById('sceneClose')?.addEventListener('click',()=>document.getElementById('sceneSheet')?.classList.remove('open'));
document.getElementById('sceneBackdrop')?.addEventListener('click',()=>document.getElementById('sceneSheet')?.classList.remove('open'));

// Scene pill selection
document.querySelectorAll('.scene-pills').forEach(group=>{
group.querySelectorAll('.scene-pill').forEach(pill=>{
  pill.addEventListener('click',()=>{
    group.querySelectorAll('.scene-pill').forEach(p=>p.classList.remove('active'));
    pill.classList.add('active');
  });
});
});

// Scene generate
document.getElementById('sceneGenerate')?.addEventListener('click',async()=>{
const btn=document.getElementById('sceneGenerate');
const status=document.getElementById('sceneStatus');
const mood=document.querySelector('#sceneMood .scene-pill.active')?.dataset.val||'intimate';
const setting=document.querySelector('#sceneSetting .scene-pill.active')?.dataset.val||'bedroom';
const style=document.querySelector('#sceneStyle .scene-pill.active')?.dataset.val||'cinematic';
const detail=document.getElementById('sceneDetail')?.value.trim()||'';
const character=curThread||'hazel';
const charName=(profileData[character]?.name)||character;
const prompt=`${style} portrait photo, ${mood} mood, ${setting} setting${detail?', '+detail:''}, ${charName} character, cinematic lighting, photorealistic, 4k, shallow depth of field`;
if(!canGenerateScene()) return;
btn.disabled=true;btn.textContent='Generating…';status.textContent='This may take 20–40 seconds…';
try{
  const res=await fetch('/api/camera/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,mood,customPrompt:prompt})});
  const data=await res.json();
  if(!data.ok)throw new Error(data.error||'Failed');
  const img=document.createElement('img');
  img.src=data.shot.path;img.alt=character;img.loading='lazy';
  document.getElementById('sceneSheet')?.classList.remove('open');
  addMsg('theirs','',curAvSrc,img);
  markSceneUsed();
  status.textContent='';
}catch(err){status.textContent='Error: '+err.message;}
btn.disabled=false;btn.textContent='Generate scene';
});

// Camera — gallery generate card
document.getElementById('genBtn')?.addEventListener('click',async()=>{
const btn=document.getElementById('genBtn');
const status=document.getElementById('genStatus');
const character=document.getElementById('genCharSelect').value;
const mood=document.getElementById('genMoodSelect').value;
if(!canGenerateScene()) return;
btn.disabled=true;btn.textContent='Generating…';status.textContent='This may take 10–30 seconds…';
try{
  const res=await fetch('/api/camera/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,mood})});
  const data=await res.json();
  if(!data.ok) throw new Error(data.error||'Generation failed');
  const grid=document.querySelector('.gallery-grid');
  const tile=document.createElement('article');
  tile.className='g-tile';
  tile.innerHTML=`<img src="${data.shot.path}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" loading="lazy"><div class="g-overlay"></div><div class="g-caption"><div class="g-name">${character.charAt(0).toUpperCase()+character.slice(1)}</div><div class="g-mood">AI Generated · ${mood}</div></div>`;
  grid.prepend(tile);
  markSceneUsed();
  status.textContent='Done!';btn.textContent='Generate photo';
}catch(err){status.textContent='Error: '+err.message;btn.textContent='Generate photo';}
btn.disabled=false;
});

// ── PRESENCE POOLS ──
const PRESENCE_POOLS={nina:['online','online','typing…','just opened this'],hazel:['observant','watching you','away','online'],iris:['listening','silent','elsewhere','online'],vale:['unstable','here now','gone again','typing…']};
function setPresence(id,text){const el=document.getElementById('pres-'+id);if(el)el.textContent=text;}
function randPresence(id){const p=PRESENCE_POOLS[id]||['online'];return p[Math.floor(Math.random()*p.length)];}
Object.keys(PRESENCE_POOLS).forEach(id=>{setPresence(id,randPresence(id));function sched(){setTimeout(()=>{setPresence(id,randPresence(id));sched();},45000+Math.random()*45000);}sched();});

grantRequestedCurrency();
updateCurrencyUI();
trackLoginBonuses();
renderInboxes();
fetch('/api/characters').then(r=>r.json()).then(d=>{if(d.ok&&d.characters)d.characters.forEach(c=>{if(c.greeting)apiCharGreetings[c.id]=c.greeting;});}).catch(()=>{});

