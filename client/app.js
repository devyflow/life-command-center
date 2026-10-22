const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const DAY = 86400000;
const STANDALONE_MODE = window.matchMedia('(display-mode: standalone)').matches || Boolean(navigator.standalone);
const LIGHTWEIGHT_MODE = STANDALONE_MODE || window.matchMedia('(max-width: 760px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches;
document.body.classList.toggle('app-standalone', STANDALONE_MODE);
document.body.classList.toggle('performance-mode', LIGHTWEIGHT_MODE);
const ACCENTS = new Set(['lime','blue','coral','violet','amber']);
let accentPreference = 'lime';
try { accentPreference=localStorage.getItem('life-command-accent')||'lime'; } catch {}
if(!ACCENTS.has(accentPreference))accentPreference='lime';
function updateAccentControl(){$$('[data-accent]').forEach(button=>{const active=button.dataset.accent===accentPreference;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});}
function applyAccent(value,{announce=false}={}){accentPreference=ACCENTS.has(value)?value:'lime';document.documentElement.dataset.accent=accentPreference;try{localStorage.setItem('life-command-accent',accentPreference);}catch{}updateAccentControl();document.dispatchEvent(new Event('life-accent-change'));if(announce)toast('Accent updated','The interface colour changed on this device.');}
applyAccent(accentPreference);
const iso = (date = new Date()) => {
  const d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const addDays = (n, date = new Date()) => new Date(new Date(date).getTime() + n * DAY);
const uid = () => Date.now() + Math.floor(Math.random() * 9999);
const esc = (value = '') => { const d = document.createElement('div'); d.textContent = value; return d.innerHTML; };
const safeUrl = value => { try { const url=new URL(String(value||''));return ['http:','https:'].includes(url.protocol)?url.href:''; } catch { return ''; } };
const mins = time => { const [h, m] = String(time || '00:00').split(':').map(Number); return h * 60 + m; };
const clock = total => { const h = Math.floor(total / 60), m = total % 60; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
const duration = n => n >= 60 ? `${Math.floor(n / 60)}h${n % 60 ? ` ${n % 60}m` : ''}` : `${n}m`;
const dateLabel = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const dayLong = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const DEFAULT_TAXONOMY = [
  { name:'Career', color:'#ff7962', categories:['College','DSA','Meetings','Projects'] },
  { name:'Personal', color:'#75a6ff', categories:['Health','Home','Relationships','Paper capture'] },
  { name:'Growth', color:'#9cbe52', categories:['Learning','Reading','Skills'] }
];
const color = area => state?.taxonomy?.find(item=>item.name===area)?.color || DEFAULT_TAXONOMY.find(item=>item.name===area)?.color || '#9cbe52';

const seed = {
  tasks: [
    { id: 101, title: 'Finish portfolio case study', area: 'Career', category: 'Projects', duration: 90, energy: 'high', date: iso(), start: '08:30', plan: 'fixed', progress: 40, next: 'Write the results section', timer: true, publish: false, calendar: true, postponed: 0 },
    { id: 102, title: 'Solve two graph problems', area: 'Career', category: 'DSA', duration: 60, energy: 'high', date: iso(), start: '11:00', plan: 'fixed', progress: 20, next: 'Open the shortest-path problem', timer: true, publish: false, calendar: false, postponed: 0 },
    { id: 103, title: 'College assignment review', area: 'Career', category: 'College', duration: 45, energy: 'medium', date: iso(), start: '14:00', plan: 'fixed', progress: 65, next: 'Check question 4 calculations', timer: true, publish: true, publicTitle: 'Focused work', calendar: true, postponed: 0 },
    { id: 104, title: 'Evening workout', area: 'Personal', category: 'Health', duration: 60, energy: 'medium', date: iso(), start: '17:30', plan: 'fixed', progress: 0, next: 'Change into training clothes', timer: false, publish: false, calendar: true, postponed: 0 },
    { id: 105, title: 'Update portfolio website', area: 'Career', category: 'Projects', duration: 120, energy: 'high', date: iso(), start: null, plan: 'today', progress: 10, next: '', timer: true, publish: false, calendar: false, postponed: 4, stale: 9 },
    { id: 106, title: 'Take the mock test', area: 'Career', category: 'College', duration: 120, energy: 'high', date: iso(addDays(1)), start: null, windowStart: '10:00', windowEnd: '22:00', decideBy: iso(), plan: 'window', progress: 0, next: 'Prepare calculator and rough sheets', timer: true, publish: false, calendar: true, postponed: 0 },
    { id: 107, title: 'Request college transcript', area: 'Career', category: 'College', duration: 20, energy: 'low', date: null, start: null, plan: 'inbox', progress: 0, next: '', timer: false, publish: false, calendar: false, postponed: 0 },
    { id: 108, title: 'Buy groceries for the week', area: 'Personal', category: 'Home', duration: 40, energy: 'low', date: null, start: null, plan: 'inbox', progress: 0, next: '', timer: false, publish: false, calendar: false, postponed: 0 },
    { id: 109, title: 'Read systems design chapter', area: 'Growth', category: 'Learning', duration: 45, energy: 'medium', date: null, start: null, plan: 'inbox', progress: 0, next: 'Open chapter 6', timer: true, publish: false, calendar: false, postponed: 0 }
  ],
  availability: [
    { id: 301, date: iso(), start: '16:00', end: '17:00', label: 'Open for a focused conversation', max: 45 },
    { id: 302, date: iso(addDays(1)), start: '13:00', end: '15:00', label: 'Available for planning or feedback', max: 60 }
  ],
  requests: [
    { id: 201, name: 'Aarav Mehta', initials: 'AM', date: iso(), start: '16:15', duration: 45, purpose: 'Review project architecture', outcome: 'Leave with a final database and deployment decision.', urgency: 'This week', flexibility: 'Can move ±2 hours', note: 'I have prepared two options and will send them before the call.', status: 'pending', impact: 'This consumes the transition before your workout and leaves only 15 minutes of buffer.', safe: false },
    { id: 202, name: 'Priya Shah', initials: 'PS', date: iso(addDays(1)), start: '13:30', duration: 30, purpose: 'College event coordination', outcome: 'Assign owners and confirm the submission date.', urgency: 'Before Monday', flexibility: 'Any time 1–3 PM', note: 'We should need no more than 30 minutes.', status: 'pending', impact: 'Fits inside published free time and does not displace planned work.', safe: true }
  ],
  profile: { xp: 340, streak: 5, bestStreak: 5, sessions: 8, accuratePlans: 6, lastProductive: iso(addDays(-1)) },
  share: { token: 'focus-7K3P', oneTime: true, expires: true, approval: true, questions: true, privacy: true },
  taxonomy: DEFAULT_TAXONOMY
};

const STORE = 'life-command-v3';
const clone = obj => JSON.parse(JSON.stringify(obj));
let state = (() => { try { return { ...clone(seed), ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return clone(seed); } })();
let ui = { view: 'today', space: null, category: null, planningDate: iso(), rescueId: null, timer: null, taskFilter: 'open', requestFilter: 'pending', plannerSelected: null, boardId: 'workstation', boardNoteId: null, boardMenuId: null, libraryId: null, libraryFilter: 'active', libraryQuery: '' };
const CANVAS_VIEW_STORE='life-command-canvas-view-v1';
let canvasView={paper:{locked:true,zoom:LIGHTWEIGHT_MODE?'fit':1},board:{locked:true,zoom:LIGHTWEIGHT_MODE?'fit':1}};
try{const saved=JSON.parse(localStorage.getItem(CANVAS_VIEW_STORE)||'{}');['paper','board'].forEach(kind=>{if(saved[kind]?.zoom==='fit'||Number.isFinite(Number(saved[kind]?.zoom)))canvasView[kind].zoom=saved[kind].zoom==='fit'?'fit':Math.max(.25,Math.min(1.4,Number(saved[kind].zoom)));});}catch{}
function saveCanvasView(){try{localStorage.setItem(CANVAS_VIEW_STORE,JSON.stringify({paper:{zoom:canvasView.paper.zoom},board:{zoom:canvasView.board.zoom}}));}catch{}}
function canvasNodes(kind){return{wrap:$(`#${kind==='paper'?'paperBoardWrap':'bulletinWrap'}`),stage:$(`#${kind==='paper'?'paperStage':'bulletinStage'}`),board:$(`#${kind==='paper'?'paperBoard':'bulletinBoard'}`),label:$(`[data-canvas-zoom-label="${kind}"]`)}};
function canvasResolvedZoom(kind){const {wrap}=canvasNodes(kind),preferred=canvasView[kind].zoom;if(preferred!=='fit')return Math.max(.25,Math.min(1.4,Number(preferred)||1));return Math.max(.25,Math.min(1,(Math.max(280,wrap?.clientWidth||1180)-4)/1180));}
function applyCanvasView(kind,{preserveCenter=false}={}){const {wrap,stage,board,label}=canvasNodes(kind);if(!wrap||!stage||!board)return;const previous=Number(wrap.dataset.zoom)||canvasResolvedZoom(kind),centerX=(wrap.scrollLeft+wrap.clientWidth/2)/previous,centerY=(wrap.scrollTop+wrap.clientHeight/2)/previous,zoom=canvasResolvedZoom(kind);board.style.transform=`scale(${zoom})`;stage.style.width=`${Math.ceil(1180*zoom)}px`;stage.style.height=`${Math.ceil(board.offsetHeight*zoom)}px`;wrap.dataset.zoom=String(zoom);wrap.classList.toggle('canvas-surface-locked',canvasView[kind].locked);wrap.classList.toggle('canvas-surface-editing',!canvasView[kind].locked);if(label)label.textContent=`${Math.round(zoom*100)}%`;if(preserveCenter){wrap.scrollLeft=Math.max(0,centerX*zoom-wrap.clientWidth/2);wrap.scrollTop=Math.max(0,centerY*zoom-wrap.clientHeight/2);}}
function setCanvasZoom(kind,action){if(!canvasView[kind])return;const current=canvasResolvedZoom(kind);canvasView[kind].zoom=action==='fit'?'fit':Math.max(.25,Math.min(1.4,current+(action==='in'?0.1:-0.1)));saveCanvasView();applyCanvasView(kind,{preserveCenter:true});}
function setCanvasLock(kind){if(!canvasView[kind])return;const unlocking=canvasView[kind].locked;if(unlocking){canvasView.paper.locked=true;canvasView.board.locked=true;}canvasView[kind].locked=!unlocking;paperRuntime.drag=null;bulletinRuntime.drag=null;render();toast(canvasView[kind].locked?`${kind==='paper'?'Paper':'Board'} locked`:`${kind==='paper'?'Paper':'Board'} editing on`,canvasView[kind].locked?'Scroll and zoom safely. Nothing can move by accident.':'Drag and layout controls are active until you leave this space or lock it again.');}
function requireCanvasEditing(kind){if(!canvasView[kind]?.locked)return true;toast(`${kind==='paper'?'Paper':'Board'} is locked`,'Tap the Locked control before changing its layout.');return false;}
let timerHandle = null;
let sync = { ready: false, revision: 0, dirty: false, saving: false, timer: null, user: null };
let taxonomyDraft = null;
let installPrompt = null;
let toastTimer = null;
let toastAction = null;
let modalReturnFocus = null;
let updateAvailable = false;
function normalizeStateShape() {
  state.paper ||= { title: 'Everything on my mind', strokes: [], shapes: [], texts: [{ id: 9001, x: 7.5, y: 11.5, text: 'Do what matters. Leave room to breathe.', type: 'note' }], layout: {}, sequence: [] };
  state.paper.strokes ||= []; state.paper.shapes ||= []; state.paper.texts ||= []; state.paper.layout ||= {}; state.paper.sequence ||= []; state.paper.imports ||= [];
  state.paper.texts.forEach(note=>{note.mode ||= 'placed';note.z=Math.max(1,Number(note.z)||5);note.width=Math.max(140,Math.min(360,Number(note.width)||240));note.rotation=Number(note.rotation)||0;});
  Object.entries(state.paper.layout).forEach(([id,layout])=>{if(!layout||typeof layout!=='object')delete state.paper.layout[id];else{layout.mode||='placed';layout.z=Math.max(1,Number(layout.z)||5);layout.rotation=Number(layout.rotation)||0;}});
  state.boards = Array.isArray(state.boards)&&state.boards.length?state.boards:[{id:'workstation',name:'My workstation',theme:'cork',createdAt:new Date().toISOString()}];
  state.boardNotes = Array.isArray(state.boardNotes)?state.boardNotes:[];
  state.boardNotes.forEach((note,index)=>{const x=Number(note.x),y=Number(note.y),w=Number(note.w),h=Number(note.h);note.boardId ||= state.boards[0].id;note.type ||= 'thought';note.color ||= 'yellow';note.x=Math.max(12,Number.isFinite(x)?x:45+(index%3)*245);note.y=Math.max(35,Number.isFinite(y)?y:70+Math.floor(index/3)*220);note.w=Math.max(170,Math.min(310,Number.isFinite(w)?w:210));note.h=Math.max(145,Math.min(300,Number.isFinite(h)?h:175));note.rotation=Number(note.rotation)||0;note.z=Math.max(1,Number(note.z)||index+1);note.showGlance=note.showGlance!==false;note.archived=Boolean(note.archived);});
  state.library = Array.isArray(state.library)?state.library:[];
  state.library.forEach(item=>{item.type||='reference';item.status||='inbox';item.tags=Array.isArray(item.tags)?item.tags:[];item.minutes=Math.max(5,Number(item.minutes)||30);});
  state.preferences ||= { reminders: false, reminderLead: 10, notified: {} };
  state.preferences.notified ||= {};state.preferences.reminderLead=Math.max(1,Number(state.preferences.reminderLead)||10);state.preferences.reminders=Boolean(state.preferences.reminders);
  state.tasks ||= [];
  state.requests ||= [];
  state.profile ||= clone(seed.profile);
  state.profile.xp = Math.max(0, Number(state.profile.xp) || 0);
  state.profile.streak = Math.max(0, Number(state.profile.streak) || 0);
  state.profile.bestStreak = Math.max(state.profile.streak, Number(state.profile.bestStreak) || 0);
  state.profile.sessions = Math.max(0, Number(state.profile.sessions) || 0);
  state.profile.accuratePlans = Math.max(0, Number(state.profile.accuratePlans) || 0);
  state.requests.forEach(request => { request.status ||= 'pending'; });
  state.profile.boundaries = Math.max(Number(state.profile.boundaries) || 0, state.requests.filter(request => request.status === 'declined').length);
  state.taxonomy = Array.isArray(state.taxonomy) && state.taxonomy.length ? state.taxonomy : clone(DEFAULT_TAXONOMY);
  state.taxonomy = state.taxonomy.map((area,index)=>({ name:String(area.name||`Area ${index+1}`).trim(), color:/^#[0-9a-f]{6}$/i.test(area.color||'')?area.color:DEFAULT_TAXONOMY[index%DEFAULT_TAXONOMY.length].color, categories:[...new Set((area.categories||[]).map(String).map(x=>x.trim()).filter(Boolean))] }));
  state.tasks.forEach(task=>{
    let area=state.taxonomy.find(item=>item.name===task.area);
    if(!area){area={name:task.area||'Unsorted',color:'#9cbe52',categories:[]};state.taxonomy.push(area);}
    if(task.category&&!area.categories.includes(task.category))area.categories.push(task.category);
  });
  state.tasks.forEach(task => { task.paperMarks ||= { circle: task.paperEmphasis === 'circle', tick: false, box: task.paperEmphasis === 'box', star: task.paperEmphasis === 'star' }; task.repeat ||= 'none'; task.rewardProgress = Math.max(Number(task.rewardProgress) || 0, Number(task.progress) || 0); });
  const taskIds=new Set(state.tasks.map(task=>task.id)),libraryIds=new Set(state.library.map(item=>item.id));
  state.library.forEach(item=>{if(item.taskId&&!taskIds.has(item.taskId))delete item.taskId;});
  state.tasks.forEach(task=>{if(task.sourceLibraryId&&!libraryIds.has(task.sourceLibraryId))delete task.sourceLibraryId;if(Array.isArray(task.sourceLibraryIds))task.sourceLibraryIds=task.sourceLibraryIds.filter(id=>libraryIds.has(id));});
}
normalizeStateShape();
function setSyncStatus(text, mode = '') {
  const el = $('#syncStatus'); if (el) { el.textContent = text; el.dataset.mode = mode; }
  const bar=$('#connectionBar');if(!bar)return;
  if(mode==='offline'){$('#connectionTitle').textContent='Working offline';$('#connectionText').textContent='Changes remain safe in this browser and will retry.';bar.hidden=false;}
  else if(mode==='saving'&&navigator.onLine===false){bar.hidden=false;}
  else bar.hidden=true;
}
function saveLocal() { localStorage.setItem(STORE, JSON.stringify(state)); }
function save() {
  state.meta = { ...(state.meta || {}), updatedAt: new Date().toISOString() };
  saveLocal();
  if (!sync.ready) return;
  sync.dirty = true; setSyncStatus('Saving changes…', 'saving');
  clearTimeout(sync.timer); sync.timer = setTimeout(pushCloudState, 550);
}
async function pushCloudState(force = false) {
  if (!sync.ready || sync.saving || !sync.dirty) return;
  sync.saving = true;
  try {
    const response = await fetch('/api/state', { method:'PUT', headers:{'content-type':'application/json'}, body:JSON.stringify({ state, baseRevision:sync.revision, force }) });
    const result = await response.json();
    if (response.status === 409) {
      const localTime = Date.parse(state.meta?.updatedAt || 0), remoteTime = Date.parse(result.state?.meta?.updatedAt || 0);
      if (remoteTime > localTime) { state = result.state; normalizeStateShape(); sync.revision = result.revision; sync.dirty = false; saveLocal(); render(); toast('Newer cloud changes loaded','This browser is now up to date.'); }
      else { sync.revision = result.revision; sync.saving = false; return pushCloudState(true); }
    } else if (!response.ok) throw new Error(result.error || 'Cloud save failed');
    else { sync.revision = result.revision; sync.dirty = false; setSyncStatus('Cloud synced', 'synced'); }
  } catch { setSyncStatus('Offline · saved in browser', 'offline'); }
  finally { sync.saving = false; }
}
async function pullCloudState() {
  if (!sync.ready || sync.dirty || document.hidden) return;
  try {
    const response = await fetch('/api/state', { cache:'no-store' }); if (!response.ok) return;
    const result = await response.json();
    if (result.state && result.revision > sync.revision) { state = result.state; normalizeStateShape(); sync.revision = result.revision; saveLocal(); render(); setSyncStatus('Updated from cloud','synced'); }
  } catch {}
}
async function initializeCloud() {
  try {
    const [sessionResponse,stateResponse] = await Promise.all([fetch('/api/session',{cache:'no-store'}),fetch('/api/state',{cache:'no-store'})]);
    if (!sessionResponse.ok || !stateResponse.ok) throw new Error('Authentication unavailable');
    const session = await sessionResponse.json(), remote = await stateResponse.json();
    sync.user = session.user; sync.revision = remote.revision || 0;
    $('#accountName').textContent = session.user.name || session.user.email || 'Your command center';
    $('#accountAvatar').textContent = (session.user.name || session.user.email || 'A').trim().charAt(0).toUpperCase();
    if (remote.state) { state = remote.state; normalizeStateShape(); saveLocal(); render(); updateReminderUI(); }
    sync.ready = true; setSyncStatus('Cloud synced','synced');
    if (!remote.state) { sync.dirty = true; await pushCloudState(); }
    setInterval(pullCloudState, 15000);
  } catch { setSyncStatus('Browser storage · reconnecting','offline'); setTimeout(initializeCloud, 12000); }
}
function updateReminderUI() {
  const on = Boolean(state.preferences?.reminders && 'Notification' in window && Notification.permission === 'granted');
  $('#reminderState').textContent = on ? 'On' : 'Off'; $('#reminderBtn').classList.toggle('active', on);
}
async function toggleReminders() {
  if (!('Notification' in window)) { toast('Reminders unavailable','This browser does not support notifications.'); return; }
  if (state.preferences.reminders) { state.preferences.reminders=false; save(); updateReminderUI();try{const registration=await navigator.serviceWorker?.ready;await registration?.periodicSync?.unregister('life-command-reminders');}catch{}toast('Browser reminders paused'); return; }
  const permission = await Notification.requestPermission();
  state.preferences.reminders = permission === 'granted'; save(); updateReminderUI();
  if(state.preferences.reminders)registerBackgroundReminders();
  toast(state.preferences.reminders?'Browser reminders enabled':'Permission was not granted',state.preferences.reminders?'Alerts work while open; supported installed browsers can also check in the background.':'You can change notification permission in your browser settings.');
}
async function registerBackgroundReminders(){try{const registration=await navigator.serviceWorker?.ready;if(registration?.periodicSync)await registration.periodicSync.register('life-command-reminders',{minInterval:15*60*1000});}catch{}}
async function deliverNotification(title,options){
  try{if(navigator.serviceWorker?.ready){const registration=await navigator.serviceWorker.ready;await registration.showNotification(title,options);return;}new Notification(title,options);}catch{}
}
function scanReminders() {
  const now = new Date(), lead = Number(state.preferences.reminderLead || 10),browserOn=Boolean(state.preferences?.reminders&&'Notification' in window&&Notification.permission==='granted');
  if(browserOn)state.tasks.filter(t=>t.progress<100&&t.date&&t.start).forEach(task=>{
    const due = new Date(`${task.date}T${task.start}:00`), minutes=(due-now)/60000, key=`task:${task.id}:${task.date}:${task.start}`;
    if(minutes<=lead&&minutes>=-5&&!state.preferences.notified[key]){deliverNotification(task.title,{body:`${minutes<=0?'Scheduled now':`Starts in ${Math.ceil(minutes)} minutes`} · ${task.next||'Open Life Command Center'}`,tag:key,data:{url:'/'}});state.preferences.notified[key]=new Date().toISOString();save();}
  });
  state.boardNotes.filter(note=>!note.archived&&note.notifyAt).forEach(note=>{const minutes=(new Date(note.notifyAt)-now)/60000,key=`board:${note.id}:${note.notifyAt}`;if(minutes<=lead&&minutes>=-10&&!state.preferences.notified[key]){if(note.popup)showGlancePopup(note);if(browserOn)deliverNotification('A note from your board',{body:note.text,tag:key,data:{url:'/#board'}});state.preferences.notified[key]=new Date().toISOString();save();}});
}

function renderLifeTree() {
  const root=$('.space-tree');if(!root)return;
  root.innerHTML=`<p class="eyebrow">MY LIFE</p>${state.taxonomy.map(area=>`<button class="space-row" data-space="${esc(area.name)}"><span class="space-dot" style="background:${area.color}"></span><b>${esc(area.name)}</b><i>${state.tasks.filter(t=>t.area===area.name&&t.progress<100).length}</i></button><div class="tree-children">${area.categories.map(category=>`<button class="${ui.category===category&&ui.space===area.name?'active':''}" data-category="${esc(category)}" data-category-area="${esc(area.name)}">${esc(category)}</button>`).join('')}</div>`).join('')}`;
}
function populateAreaSelect(select, selected='') {
  if(!select)return;const choice=selected||state.taxonomy[0]?.name||'Unsorted';
  select.innerHTML=state.taxonomy.map(area=>`<option value="${esc(area.name)}" ${area.name===choice?'selected':''}>${esc(area.name)}</option>`).join('');
  if(!state.taxonomy.some(area=>area.name===choice))select.insertAdjacentHTML('afterbegin',`<option selected>${esc(choice)}</option>`);
}
function taxonomyDraftFromState(){return state.taxonomy.map(area=>({name:area.name,color:area.color,originalName:area.name,categories:area.categories.map(name=>({name,originalName:name}))}));}
function renderTaxonomyEditor(){
  const root=$('#taxonomyEditor');if(!root||!taxonomyDraft)return;
  root.innerHTML=taxonomyDraft.map((area,areaIndex)=>`<article class="taxonomy-area"><div class="taxonomy-area-head"><input type="color" value="${area.color}" data-tax-area-color="${areaIndex}" aria-label="${esc(area.name)} color"><input type="text" value="${esc(area.name)}" data-tax-area-name="${areaIndex}" maxlength="32" aria-label="Area name"><button class="taxonomy-remove" type="button" data-tax-remove-area="${areaIndex}" title="Remove area">×</button></div><div class="taxonomy-categories">${area.categories.map((category,categoryIndex)=>`<label class="taxonomy-category"><input type="text" value="${esc(category.name)}" data-tax-category-name="${areaIndex}:${categoryIndex}" maxlength="40" aria-label="Category name"><button class="taxonomy-remove" type="button" data-tax-remove-category="${areaIndex}:${categoryIndex}" title="Remove category">×</button></label>`).join('')}</div><button class="taxonomy-add" type="button" data-tax-add-category="${areaIndex}">+ Add category</button></article>`).join('');
}
function openSettings(){
  taxonomyDraft=taxonomyDraftFromState();renderTaxonomyEditor();
  $('#settingsSync').textContent=$('#syncStatus').textContent||'Cloud status unavailable';
  $('#settingsUpdated').textContent=state.meta?.updatedAt?new Date(state.meta.updatedAt).toLocaleString():'No changes yet';
  $('#reminderLead').value=String(state.preferences.reminderLead||10);updateAccentControl();updateCompletedHistoryControl();updateMotivationControl();openModal('settingsModal');
}
function saveTaxonomy(){
  const clean=taxonomyDraft.map(area=>({name:area.name.trim(),color:area.color,categories:area.categories.map(c=>c.name.trim()).filter(Boolean)}));
  if(clean.some(area=>!area.name||!area.categories.length)){toast('Each area needs a name and category','Add at least one category before saving.');return;}
  if(new Set(clean.map(area=>area.name.toLowerCase())).size!==clean.length){toast('Area names must be unique');return;}
  for(const area of taxonomyDraft){
    if(!area.originalName)continue;
    state.tasks.filter(task=>task.area===area.originalName).forEach(task=>{
      task.area=area.name.trim();
      const category=area.categories.find(item=>item.originalName===task.category);if(category)task.category=category.name.trim();
    });
  }
  state.taxonomy=clean;normalizeStateShape();save();populateAreaSelect($('#taskArea'));populateAreaSelect($('#scanArea'));render();closeModal('settingsModal');toast('Organization saved','Tasks, Paper and navigation now use the same structure.');
}
function exportBackup(){
  const payload={format:'life-command-center',version:1,exportedAt:new Date().toISOString(),state};
  const href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=href;link.download=`life-command-backup-${iso()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);toast('Backup downloaded','Keep it somewhere private.');
}
function updateCompletedHistoryControl(){
  const count=state.tasks.filter(task=>task.progress>=100).length,button=$('#clearCompletedHistory'),label=$('#completedHistoryCount'),panel=button?.closest('.history-clear-panel');
  if(label)label.textContent=count?`${count} completed task${count===1?'':'s'} will be removed.`:state.meta?.completedHistoryClearedAt?`Last cleared ${new Date(state.meta.completedHistoryClearedAt).toLocaleString()}.`:'No completed tasks to clear.';
  if(button){button.disabled=!count;button.textContent=count?`Clear ${count} completed`:'Clear history';}
  panel?.classList.toggle('is-ready',Boolean(count));
}
function clearCompletedHistory(){
  const completed=state.tasks.filter(task=>task.progress>=100);if(!completed.length){toast('History is already clear','There are no completed tasks to remove.');return;}
  const removed=clone(completed),sequence=[...state.paper.sequence],layouts=Object.fromEntries(completed.map(task=>[task.id,clone(state.paper.layout[task.id]||null)])),previousMeta=clone(state.meta||{});
  const ids=new Set(completed.map(task=>task.id));
  const libraryLinks=state.library.filter(item=>ids.has(item.taskId)).map(item=>({id:item.id,taskId:item.taskId,status:item.status}));
  libraryLinks.forEach(link=>{const item=state.library.find(entry=>entry.id===link.id);delete item.taskId;if(item.status==='using')item.status='ready';});
  state.tasks=state.tasks.filter(task=>!ids.has(task.id));
  state.paper.sequence=state.paper.sequence.filter(id=>!ids.has(id));
  ids.forEach(id=>delete state.paper.layout[id]);
  if(state.preferences?.notified)Object.keys(state.preferences.notified).forEach(key=>{if(ids.has(Number(key.split(':')[0])))delete state.preferences.notified[key];});
  if(ui.plannerSelected&&ids.has(ui.plannerSelected))ui.plannerSelected=null;
  if(ui.timer&&ids.has(ui.timer.taskId))closeTimer();
  state.meta={...(state.meta||{}),completedHistoryClearedAt:new Date().toISOString(),completedHistoryClearedCount:completed.length};
  save();render();updateCompletedHistoryControl();toast('Completed history cleared',`${completed.length} completed task${completed.length===1?' was':'s were'} removed everywhere. Your XP and streak were kept.`,{label:'Undo',run:()=>{const present=new Set(state.tasks.map(task=>task.id));state.tasks.push(...removed.filter(task=>!present.has(task.id)));state.paper.sequence=sequence;Object.entries(layouts).forEach(([id,layout])=>{if(layout)state.paper.layout[id]=layout;});libraryLinks.forEach(link=>{const item=state.library.find(entry=>entry.id===link.id);if(item){item.taskId=link.taskId;item.status=link.status;}});state.meta=previousMeta;save();render();updateCompletedHistoryControl();toast('Completed history restored','The cleared tasks and their Knowledge links are visible again.');}});
}
function resetMomentum(){
  state.profile.xp=0;
  state.meta={...(state.meta||{}),momentumResetAt:new Date().toISOString()};
  save();render();updateMotivationControl();toast('Momentum reset','Tasks, productive days and completed work remain safe. Your next milestone starts from zero.');
}
function resetRhythm(){
  state.profile.streak=0;state.profile.lastProductive=null;
  state.meta={...(state.meta||{}),rhythmResetAt:new Date().toISOString()};
  save();render();updateMotivationControl();toast('Productive days reset','Your tasks and momentum XP were not changed. You can begin again today.');
}
async function importBackupFile(file){
  try{
    const parsed=JSON.parse(await file.text()),incoming=parsed?.format==='life-command-center'?parsed.state:parsed;
    if(!incoming||!Array.isArray(incoming.tasks)||typeof incoming!=='object')throw new Error('This is not a Life Command Center backup.');
    state=clone(incoming);normalizeStateShape();saveLocal();sync.dirty=true;await pushCloudState(true);populateAreaSelect($('#taskArea'));populateAreaSelect($('#scanArea'));render();updateReminderUI();closeModal('settingsModal');toast('Backup restored',`${state.tasks.length} tasks are available on this device and cloud.`);
  }catch(error){toast('Backup could not be restored',error.message||'Choose a valid JSON backup.');}
}
const isInstalledApp=()=>window.matchMedia('(display-mode: standalone)').matches||Boolean(navigator.standalone);
const isIosDevice=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
function hideInstallNudge(remember=false){
  const nudge=$('#installNudge');nudge?.classList.remove('show');nudge?.setAttribute('aria-hidden','true');
  if(remember){try{sessionStorage.setItem('life-command-install-dismissed','1');}catch{}}
}
function showInstallNudge(){
  if(isInstalledApp())return;
  try{if(sessionStorage.getItem('life-command-install-dismissed'))return;}catch{}
  const nudge=$('#installNudge'),title=$('#installNudgeTitle'),text=$('#installNudgeText'),action=$('#installNudgeAction');if(!nudge)return;
  $('#installApp').hidden=false;
  title.textContent='Install Life Command Center';
  text.textContent=isIosDevice()?'Add it to your iPhone home screen for faster access.':'Open it like an app from your desktop or home screen.';
  action.textContent=isIosDevice()?'Show iPhone steps →':'Install app →';action.hidden=false;action.dataset.instructions='';
  nudge.setAttribute('aria-hidden','false');nudge.classList.add('show');
}
async function installWebsite(){
  if(isInstalledApp()){hideInstallNudge(true);toast('Already installed','Life Command Center is running as an app.');return;}
  if(installPrompt){
    installPrompt.prompt();const choice=await installPrompt.userChoice;if(choice.outcome==='accepted'){hideInstallNudge(true);toast('Installing Life Command Center','It will appear in your app list or on your home screen.');}else hideInstallNudge(true);installPrompt=null;document.body.classList.remove('install-ready');return;
  }
  const title=$('#installNudgeTitle'),text=$('#installNudgeText'),action=$('#installNudgeAction');
  if(action?.dataset.instructions==='shown'){hideInstallNudge(true);return;}
  if(title)title.textContent=isIosDevice()?'Add to your Home Screen':'Install from your browser';
  if(text)text.textContent=isIosDevice()?'In Safari, tap the Share button, then choose “Add to Home Screen”.':'Open the browser menu and choose “Install app” or “Add to Home Screen”.';
  if(action){action.textContent='Got it';action.dataset.instructions='shown';}
}

const hasMark = (task, mark) => Boolean(task.paperMarks?.[mark]);
function matchesTaskFilter(task) {
  const filter = ui.taskFilter || 'open';
  if (filter === 'open') return task.progress < 100;
  if (filter === 'circle') return hasMark(task, 'circle');
  if (filter === 'tick') return hasMark(task, 'tick');
  if (filter === 'not-circle') return !hasMark(task, 'circle');
  if (filter === 'not-tick') return !hasMark(task, 'tick');
  if (filter === 'completed') return task.progress >= 100;
  if (filter === 'under-5') return task.progress < 5;
  return true;
}
function taskFilterBar() {
  const filters = [['open','Open'],['all','Everything'],['circle','◯ Important'],['tick','✓ Ready'],['not-circle','Not circled'],['not-tick','Not ticked'],['completed','Completed'],['under-5','Under 5%']];
  return `<div class="task-filter-bar" aria-label="Task filters">${filters.map(([key,label])=>`<button class="filter-chip ${ui.taskFilter===key?'active':''}" data-task-filter="${key}">${label}</button>`).join('')}</div>`;
}
function taskMarkButtons(task, paper = false) {
  const marks = [['circle','◯','Important'],['tick','✓','Ready to act'],['box','□','Protected time'],['star','★','Today focus']];
  return `<div class="${paper?'paper-marks':'task-marks'}">${marks.map(([key,icon,label])=>`<button class="${hasMark(task,key)?'active':''}" data-task-mark="${key}" data-task-mark-id="${task.id}" title="${label}" aria-label="${label}" aria-pressed="${hasMark(task,key)}">${icon}</button>`).join('')}</div>`;
}

const MOMENTUM_MILESTONES = [
  { xp:0, name:'Fresh start', symbol:'·', meaning:'One clear action is enough to begin.' },
  { xp:100, name:'Getting moving', symbol:'↗', meaning:'You are turning intentions into visible action.' },
  { xp:250, name:'Steady builder', symbol:'◇', meaning:'Small follow-through is becoming a reliable pattern.' },
  { xp:500, name:'Focused finisher', symbol:'✦', meaning:'You finish meaningful work without chasing perfection.' },
  { xp:1000, name:'Reliable rhythm', symbol:'◈', meaning:'Your system supports you across busy and quiet days.' },
  { xp:2000, name:'Deep work craft', symbol:'⌁', meaning:'You protect attention and recover deliberately.' }
];
function momentumStatus() {
  const xp = state.profile.xp;
  const current = [...MOMENTUM_MILESTONES].reverse().find(item => xp >= item.xp) || MOMENTUM_MILESTONES[0];
  const next = MOMENTUM_MILESTONES.find(item => item.xp > xp) || null;
  const span = next ? Math.max(1, next.xp - current.xp) : 1;
  const progress = next ? Math.min(100, Math.round((xp - current.xp) / span * 100)) : 100;
  return { current, next, progress };
}
function updateMotivationControl() {
  const status = momentumStatus(), days = state.profile.streak;
  if ($('#momentumBadge')) $('#momentumBadge').textContent = `${status.current.symbol} ${status.current.name}`;
  if ($('#momentumMeaning')) $('#momentumMeaning').textContent = status.current.meaning;
  if ($('#momentumXp')) $('#momentumXp').textContent = `${state.profile.xp} XP`;
  if ($('#rhythmDays')) $('#rhythmDays').textContent = `${days} productive day${days===1?'':'s'}`;
  if ($('#momentumProgress')) $('#momentumProgress').style.width = `${status.progress}%`;
  if ($('#momentumNext')) $('#momentumNext').textContent = status.next ? `${status.next.xp-state.profile.xp} XP to “${status.next.name}.” Rest days never remove progress.` : 'Highest milestone reached. Rest days never remove progress.';
}
function earnedBadges() {
  return [
    { name:'First Focus', symbol:'◈', meaning:'Finish a focus session.', earned:state.profile.sessions >= 1 },
    { name:'Five-Day Rhythm', symbol:'✦', meaning:'Make progress on five days. They need not be consecutive.', earned:state.profile.bestStreak >= 5 },
    { name:'Honest Planner', symbol:'⌁', meaning:'Rework a task so its next step fits your real day.', earned:state.profile.accuratePlans >= 1 },
    { name:'Boundary Keeper', symbol:'◇', meaning:'Decline a time request to protect your priorities.', earned:state.profile.boundaries >= 1 }
  ];
}
function reward(points, text) {
  state.profile.xp += points; save();
  $('#xpBurstValue').textContent = `+${points} XP`; $('#xpBurstText').textContent = text;
  $('#xpBurst').classList.add('show'); setTimeout(() => $('#xpBurst').classList.remove('show'), 1900);
}
function toast(title, text = 'Your change is ready.', action = null) {
  clearTimeout(toastTimer);toastAction=action;
  $('#toastTitle').textContent = title; $('#toastText').textContent = text;
  const button=$('#toastAction');button.hidden=!action;button.textContent=action?.label||'Undo';
  $('#toast').classList.add('show'); toastTimer=setTimeout(() => { $('#toast').classList.remove('show');toastAction=null;button.hidden=true; }, action?8000:3000);
}
function setFocusMode(enabled,{announce=true}={}) {
  document.body.classList.toggle('focus-mode',enabled);
  $('#focusBtn')?.setAttribute('aria-pressed',String(enabled));
  $('#focusBtn')?.setAttribute('title',enabled?'Exit focus mode':'Enter focus mode');
  const topLabel=$('#focusBtn span');if(topLabel)topLabel.textContent=enabled?'Exit':'Focus';
  $('#focusSidebar')?.classList.toggle('active',enabled);$('#focusSidebar')?.setAttribute('aria-pressed',String(enabled));
  if($('#focusSidebarState'))$('#focusSidebarState').textContent=enabled?'On':'Off';
  $('#focusExit')?.setAttribute('aria-hidden',String(!enabled));
  $('#sidebar').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');$('#mobileMore')?.setAttribute('aria-expanded','false');
  if(announce)toast(enabled?'Focus view ready':'Full workspace restored',enabled?'Only the current work and an always-visible exit remain.':'Navigation and planning controls are visible again.');
}
function toggleFocusMode(){setFocusMode(!document.body.classList.contains('focus-mode'));}
function openModal(id) {
  modalReturnFocus=document.activeElement;
  $$('.modal-layer.open').forEach(layer=>{layer.classList.remove('open');layer.setAttribute('aria-hidden','true');});
  $('#sidebar').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');$('#mobileMore')?.setAttribute('aria-expanded','false');
  const layer=$(`#${id}`);layer.classList.add('open');layer.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
  requestAnimationFrame(()=>{const focusable=layer.querySelector('[autofocus],input:not([type="hidden"]),textarea,select,button,[href]');focusable?.focus({preventScroll:true});});
  document.dispatchEvent(new Event('life-modal-change'));
}
function closeModal(id, restoreFocus=true) {
  const layer=$(`#${id}`);if(!layer)return;layer.classList.remove('open');layer.setAttribute('aria-hidden','true');
  if(!$('.modal-layer.open'))document.body.classList.remove('modal-open');
  if(restoreFocus&&modalReturnFocus?.isConnected)modalReturnFocus.focus({preventScroll:true});
  modalReturnFocus=null;document.dispatchEvent(new Event('life-modal-change'));
}
function setProductive() {
  if (state.profile.lastProductive === iso()) return;
  state.profile.streak += 1;
  state.profile.bestStreak = Math.max(state.profile.bestStreak || 0, state.profile.streak);
  state.profile.lastProductive = iso();
}

function taskCard(task) {
  const done = task.progress >= 100;
  const order = state.paper.sequence.indexOf(task.id);
  const marked = Object.values(task.paperMarks || {}).some(Boolean);
  return `<article class="task-row ${done ? 'done' : ''} ${marked ? 'paper-important' : ''}" data-task="${task.id}">
    <button class="task-check" data-action="complete" aria-label="${done ? 'Mark incomplete' : 'Complete task'}">${done ? '✓' : ''}</button>
    <div><div class="task-title">${esc(task.title)}</div><div class="task-meta"><span class="mini-dot" style="background:${color(task.area)}"></span>${esc(task.area)} / ${esc(task.category)} · ${duration(task.duration)} <span class="energy">${task.energy}</span>${task.start ? ` · ${clock(mins(task.start))}` : ''}${task.repeat&&task.repeat!=='none'?` · repeats ${task.repeat}`:''}${order>=0?` <span class="paper-order">Paper #${order+1}</span>`:''}</div>${taskMarkButtons(task)}</div>
    <div class="task-side"><button class="icon-action" data-action="edit" title="Edit task" aria-label="Edit ${esc(task.title)}">✎</button><button class="icon-action" data-action="timer" title="Start timer" aria-label="Start focus timer for ${esc(task.title)}">◷</button><button class="icon-action" data-action="calendar" title="Export calendar event" aria-label="Export ${esc(task.title)} to calendar">▣</button><button class="icon-action" data-action="publish" title="${task.publish ? 'Remove from shared calendar' : 'Show on shared calendar'}" aria-label="${task.publish ? 'Remove from shared calendar' : 'Show on shared calendar'}">${task.publish ? '●' : '○'}</button></div>
    <label class="progress-line"><input type="range" min="0" max="100" step="5" value="${task.progress}" data-progress><span>${task.progress}%</span></label>
    ${task.next ? `<div class="next-step">Next: ${esc(task.next)}</div>` : ''}
  </article>`;
}

function pageHead(kicker, title, actions = '') {
  return `<header class="page-head"><div><p class="page-kicker">${kicker}</p><h1>${title}</h1></div>${actions ? `<div class="head-actions">${actions}</div>` : ''}</header>`;
}

function attentionRail() {
  const unscheduled = state.tasks.filter(t => t.date === iso() && !t.start && t.plan !== 'inbox' && t.progress < 100).length;
  const decisions = state.tasks.filter(t => t.plan === 'window' && !t.start && t.decideBy <= iso() && t.progress < 100).length;
  const requests = state.requests.filter(r => r.status === 'pending').length;
  const total = unscheduled + decisions + requests;
  return `<aside class="attention-rail"><div class="attention-copy"><i class="attention-pulse"></i><div><b>${total} item${total===1?'':'s'} need your attention</b><span>${unscheduled} unscheduled today · ${decisions} decision due · ${requests} time requests</span></div></div><button data-attention-open>Review everything →</button></aside>`;
}
function compactTask(task, mode = 'normal') {
  const meta = task.start ? `${clock(mins(task.start))} · ${duration(task.duration)}` : `${duration(task.duration)} · no time chosen`;
  const action = mode === 'risk' ? `<button data-rescue-open="${task.id}">Resolve</button>` : mode === 'flex' ? `<button data-place-task="${task.id}">Place it</button>` : `<button data-start-now="${task.id}">Start</button>`;
  return `<div class="compact-task"><i class="state-edge ${mode}"></i><div><b>${esc(task.title)}</b><small>${meta} · ${esc(task.area)} / ${esc(task.category)}</small></div>${action}</div>`;
}
function todayView() {
  const tasks = state.tasks.filter(t => t.date === iso() && t.plan !== 'inbox' && t.progress < 100);
  const scheduled = tasks.filter(t => t.start).sort((a,b)=>mins(a.start)-mins(b.start));
  const unscheduled = tasks.filter(t => !t.start);
  const decisionDue = state.tasks.filter(t => t.plan === 'window' && !t.start && t.decideBy <= iso() && t.progress < 100);
  const risk = [...new Map([...tasks.filter(t=>t.postponed>=2), ...decisionDue].map(t=>[t.id,t])).values()];
  const nowTask = scheduled.find(t=>t.progress<100) || unscheduled[0];
  const next = scheduled.filter(t=>t.id!==nowTask?.id).slice(0,3);
  const remaining = Math.round(tasks.reduce((n,t)=>n+t.duration*(1-t.progress/100),0));
  const momentum = momentumStatus();
  return `${pageHead(new Date().toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'}).toUpperCase(), `Today, clearly.<br><em>Nothing out of sight.</em>`, `<button class="secondary" data-view="all">All open tasks</button><button class="primary" data-open="taskModal">+ Capture</button>`)}
    <section class="metric-row"><article class="metric"><small>OPEN TODAY</small><strong>${tasks.length}</strong><span>${unscheduled.length} still need a time</span></article><article class="metric"><small>REMAINING LOAD</small><strong>${duration(remaining)}</strong><span>${remaining>300?'Protect your focus blocks':'Achievable with breathing room'}</span></article><article class="metric"><small>PRODUCTIVE RHYTHM</small><strong>${state.profile.streak} days</strong><span>Rest never resets this</span></article><article class="metric accent"><small>MOMENTUM</small><strong>${state.profile.xp} XP</strong><span>${momentum.current.symbol} ${momentum.current.name}</span></article></section>
    <div class="today-flow">
      ${nowTask ? `<article class="now-card"><div><p class="eyebrow">NOW · RECOMMENDED NEXT ACTION</p><h2>${esc(nowTask.title)}</h2><p>${duration(Math.round(nowTask.duration*(1-nowTask.progress/100)))} remaining · ${nowTask.energy} energy · ${nowTask.progress}% complete</p><p class="next-action">Next: ${esc(nowTask.next||'Define the first physical action')}</p></div><div class="now-actions"><button class="defer" data-rescue-open="${nowTask.id}">Not now</button><button class="start-now" data-start-now="${nowTask.id}">▶ Start focus</button></div></article>` : `<div class="empty"><b>Nothing is demanding your attention.</b>Enjoy the open space or capture what matters.</div>`}
      <div class="today-columns"><section class="attention-section"><div class="section-title"><div><h2>Next</h2><p>The next visible commitments, in order.</p></div><button class="ghost-btn" data-view="planner">Timeline →</button></div>${next.length?next.map(t=>compactTask(t)).join(''):'<div class="empty"><b>No next commitment.</b>Your schedule has room.</div>'}<div class="mini-timeline">${[8,11,14,17,20,22].map(h=>`<div class="mini-hour"><span>${h>12?h-12:h}${h>=12?'p':'a'}</span><i class="${scheduled.some(t=>mins(t.start)>=h*60&&mins(t.start)<(h+3)*60)?'busy':'open'}"></i></div>`).join('')}</div></section>
      <section class="attention-section danger"><div class="section-title"><div><h2>At risk</h2><p>These can be missed unless you decide.</p></div></div>${risk.length?risk.map(t=>compactTask(t,'risk')).join(''):'<div class="empty"><b>Nothing at risk.</b>Your commitments are covered.</div>'}</section></div>
      <section class="attention-section flexible"><div class="section-title"><div><h2>Unscheduled today</h2><p>Belongs today, but has no hour. These never disappear into a list.</p></div><button class="ghost-btn" data-view="planner">Place on timeline →</button></div>${unscheduled.length?unscheduled.map(t=>compactTask(t,'flex')).join(''):'<div class="empty"><b>Every task has a home.</b>No floating commitments today.</div>'}</section>
    </div>`;
}

function hourRows() { return Array.from({ length: 17 }, (_, i) => { const h = i + 6,time=`${String(h).padStart(2,'0')}:00`; return `<div class="hour-row"><time>${clock(h * 60)}</time><div class="hour-line" data-planner-time="${time}" title="Drop a task at ${clock(h*60)}"></div></div>`; }).join(''); }
function positionedBlock(item, type = 'task') {
  const start = mins(item.start), dayStart = 360, top = Math.max(0, (start - dayStart) / 60 * 64), height = Math.max(28, ((item.duration || (mins(item.end) - start)) / 60) * 64 - 3);
  const klass = type === 'free' ? 'free' : type === 'pending' ? 'pending' : (item.area || 'Career').toLowerCase();
  const title = type === 'free' ? item.label : type === 'pending' ? `Pending · ${item.purpose}` : item.title;
  const drag=type==='task'?`draggable="true" data-planner-task="${item.id}"`:'';
  return `<div class="time-block ${klass} ${ui.plannerSelected===item.id?'planner-selected':''}" ${drag} style="top:${top}px;height:${height}px;${type==='task'?`border-color:${color(item.area)}`:''}" title="${type==='task'?'Select, then choose another hour':''}"><b>${esc(title)}</b><small>${clock(start)} · ${duration(item.duration || mins(item.end) - start)}</small></div>`;
}
function fitSlots(task) {
  const start = mins(task.windowStart || '09:00'), end = mins(task.windowEnd || '18:00'), d = task.duration;
  return [start, Math.round(((start + end - d) / 2) / 30) * 30, end - d].filter((n, i, a) => n >= start && n + d <= end && a.indexOf(n) === i);
}
function plannerView() {
  const date = ui.planningDate;
  const scheduled = state.tasks.filter(t => t.date === date && t.start && t.progress < 100);
  const flexible = state.tasks.filter(t => t.date === date && !t.start && t.plan !== 'inbox' && t.progress < 100);
  const windows = state.availability.filter(a => a.date === date);
  const pending = state.requests.filter(r => r.date === date && r.status === 'pending');
  const blocks = [...scheduled.map(t => positionedBlock(t)), ...windows.map(a => positionedBlock(a, 'free')), ...pending.map(r => positionedBlock({ ...r, purpose: r.purpose }, 'pending'))].join('');
  const decisions = flexible.filter(t => t.plan === 'window');
  return `${pageHead('AN HOUR-BY-HOUR VIEW', `Plan the day.<br><em>Keep room for life.</em>`, `<button class="secondary" data-date-shift="-1">← Previous</button><button class="secondary" data-date-today>Today</button><button class="secondary" data-date-shift="1">Next →</button><button class="primary" data-open="freeModal">+ Mark free time</button>`)}
    <div class="planner-layout">
      <section class="calendar-board"><div class="calendar-head"><span>${date === iso() ? 'TODAY' : 'DAY'}</span><div><strong>${dayLong(date)}</strong><span>${scheduled.length} commitments · ${duration(scheduled.reduce((n,t)=>n+t.duration,0))}</span><small class="planner-drag-hint">Drag any task block to a new hour</small></div></div><div class="timeline">${hourRows()}${blocks}</div></section>
      <aside class="planner-side">
        ${decisions.map(t => `<article class="decision-card"><p class="eyebrow">DECIDE BY ${dateLabel(t.decideBy || iso()).toUpperCase()}</p><h3>${esc(t.title)}</h3><p>${duration(t.duration)} needed between ${clock(mins(t.windowStart))} and ${clock(mins(t.windowEnd))}. Choose when your energy fits.</p><div class="slot-picks">${fitSlots(t).map((s,i)=>`<button data-schedule="${t.id}" data-time="${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}"><b>${clock(s)}–${clock(s+t.duration)}</b>${i===1?'Best balance with your current plan':i===0?'Finish it early':'Keep the daytime flexible'}</button>`).join('')}</div></article>`).join('')}
        <article class="unscheduled-card"><p class="eyebrow">STILL FLEXIBLE</p><h3>Tasks waiting for a home</h3><p>Drag one onto an hour, or select it and tap an hour.</p>${flexible.filter(t=>t.plan!=='window').map(t=>`<div class="unscheduled-item ${ui.plannerSelected===t.id?'planner-selected':''}" draggable="true" data-planner-task="${t.id}"><b>${esc(t.title)}</b><span>${duration(t.duration)} · ${t.energy} energy</span><div class="slot-picks"><button data-schedule="${t.id}" data-time="15:00">Place at 3:00 PM</button></div></div>`).join('') || '<div class="empty"><b>Everything has a place.</b>No loose work on this day.</div>'}</article>
      </aside>
    </div>`;
}

function inboxView() {
  let tasks = state.tasks.filter(t => t.plan === 'inbox' && t.progress < 100);
  if (ui.space) tasks = tasks.filter(t => t.area === ui.space);
  if (ui.category) tasks = state.tasks.filter(t => t.category === ui.category && (!ui.space||t.area===ui.space) && t.progress < 100);
  const title = ui.category || ui.space || 'Your inbox';
  return `${pageHead('CAPTURE FIRST, DECIDE SECOND', `${esc(title)}.<br><em>Nothing gets lost.</em>`, `<button class="primary" data-open="taskModal">+ Capture something</button>`)}
    <div class="filter-bar"><button class="filter-chip ${!ui.space&&!ui.category?'active':''}" data-filter="all">All captures</button>${state.taxonomy.map(area=>`<button class="filter-chip ${ui.space===area.name?'active':''}" data-filter="${esc(area.name)}">${esc(area.name)}</button>`).join('')}</div>
    <div class="inbox-layout"><section class="section-card"><div class="section-title"><div><h2>${tasks.length} things need a decision</h2><p>Keep categories useful without putting everything in one crowded list.</p></div></div><div class="task-list">${tasks.length ? tasks.map(taskCard).join('') : '<div class="empty"><b>Inbox zero.</b>Everything has been clarified.</div>'}</div></section>
    <aside class="triage-card"><p class="eyebrow">60-SECOND TRIAGE</p><h3>Ask only what matters.</h3><p>Every capture should become a clear action, a scheduled commitment, a waiting item or something you consciously release.</p><div class="triage-steps"><span><b>01</b> What does “done” mean?</span><span><b>02</b> What is the smallest next action?</span><span><b>03</b> Does it need time or only a deadline?</span><span><b>04</b> Which part of your life owns it?</span></div></aside></div>`;
}

function allView() {
  const query = (ui.allQuery || '').toLowerCase();
  const open = state.tasks.filter(matchesTaskFilter).filter(t => !query || [t.title,t.area,t.category,t.next].some(v=>String(v||'').toLowerCase().includes(query)));
  const groups = state.taxonomy.map(area=>area.name);
  return `${pageHead('THE GUARANTEED ESCAPE HATCH', `Every task.<br><em>No hidden corners.</em>`, `<button class="primary" data-open="taskModal">+ Capture</button>`)}
    <div class="all-toolbar"><input id="allSearch" value="${esc(ui.allQuery||'')}" placeholder="Filter every task by title, area, category or next action…"><span class="all-summary">${open.length} visible · ${state.tasks.filter(t=>t.progress>=100).length} completed</span></div>
    ${taskFilterBar()}
    <div class="status-legend"><span><i style="background:var(--coral)"></i>At risk</span><span><i style="background:var(--violet)"></i>Flexible or undecided</span><span><i style="background:var(--lime)"></i>Ready to act</span><span><i style="background:#a4a8a4"></i>Inbox</span></div>
    ${groups.map(area=>{const items=open.filter(t=>t.area===area);return `<section class="all-group"><div class="all-group-head"><h2><span class="mini-dot" style="background:${color(area)}"></span> ${area}</h2><span>${items.length} visible</span></div><div class="task-list">${items.length?items.map(taskCard).join(''):'<div class="empty"><b>No matching tasks.</b>This area is clear.</div>'}</div></section>`}).join('')}`;
}

function paperStoredPosition(layout) {
  if(!layout)return null;
  if(layout.unit==='px')return {x:Number(layout.x)||0,y:Number(layout.y)||0};
  return {x:(Number(layout.x)||0)*11.8,y:(Number(layout.y)||0)*9.8};
}
function paperPlan(tasks) {
  const order=[...tasks].sort((a,b)=>{const ai=state.paper.sequence.indexOf(a.id),bi=state.paper.sequence.indexOf(b.id);if(ai>=0||bi>=0)return(ai<0?99999:ai)-(bi<0?99999:bi);return a.id-b.id;});
  const positions=new Map(),headings=[];
  const columns=[142,142,142],columnX=[72,441,810];
  state.taxonomy.forEach(area=>{
    const peers=order.filter(task=>task.area===area.name);if(!peers.length)return;
    const column=columns.indexOf(Math.min(...columns)),x=columnX[column];let y=columns[column];
    headings.push({kind:'area',x,y,text:area.name,count:peers.length,color:area.color});y+=42;
    [...new Set(peers.map(task=>task.category))].forEach(category=>{
      headings.push({kind:'category',x,y,text:category});y+=28;
      peers.filter(task=>task.category===category).forEach(task=>{positions.set(task.id,{x,y,mode:'auto',z:4,rotation:0});y+=92;});
      y+=14;
    });
    columns[column]=y+28;
  });
  let height=Math.max(980,...columns),occupied=[];
  tasks.forEach(task=>{const stored=state.paper.layout[task.id];if(!stored)return;const p=paperStoredPosition(stored,height);positions.set(task.id,{...p,mode:stored.mode||'placed',z:Number(stored.z)||5,rotation:Number(stored.rotation)||0,locked:Boolean(stored.locked)});height=Math.max(height,p.y+125);});
  positions.forEach((p,id)=>occupied.push({key:`task:${id}`,x:p.x,y:p.y,w:300,h:76}));headings.forEach((item,index)=>occupied.push({key:`heading:${index}`,x:item.x,y:item.y,w:330,h:item.kind==='area'?32:18}));
  const textPositions=new Map();state.paper.texts.forEach((note,index)=>{let p=paperStoredPosition(note,height)||{x:80,y:120},w=note.width||240,h=note.type==='heading'?62:88;if(note.mode!=='float'){p={x:Math.max(12,Math.min(1168-w,Math.round(p.x/12)*12)),y:Math.max(96,Math.round(p.y/12)*12)};for(let attempt=0;attempt<180&&paperIsOverlap(`text:${note.id}`,{...p,w,h},occupied);attempt++){p.y+=108;if(p.y+h>height){height=p.y+h+40;}}}textPositions.set(note.id,{...p,mode:note.mode||'placed',z:note.z||5,rotation:note.rotation||0});occupied.push({key:`text:${note.id}`,x:p.x,y:p.y,w,h});height=Math.max(height,p.y+h+40);});
  return {positions,textPositions,headings,height:Math.ceil(height/120)*120};
}
function paperPosition(task, index, tasks = state.tasks.filter(t => t.progress < 100)) { return paperPlan(tasks).positions.get(task.id)||{x:72,y:142+index*92,mode:'auto',z:4,rotation:0}; }
function paperHeadings(plan) {
  return plan.headings.map(item=>`<div class="paper-${item.kind}-heading" style="left:${item.x}px;top:${item.y}px;${item.color?`border-color:${item.color}`:''}">${esc(item.text)}${item.kind==='area'?` <span>${item.count}</span>`:''}</div>`).join('');
}
function paperTextPosition(note, plan) { return plan.textPositions.get(note.id)||paperStoredPosition(note,plan.height)||{x:80,y:120}; }
function paperIsOverlap(key, rect, objects) { return objects.some(item=>item.key!==key&&rect.x<item.x+item.w&&rect.x+rect.w>item.x&&rect.y<item.y+item.h&&rect.y+rect.h>item.y); }
function paperView() {
  const tasks = state.tasks.filter(matchesTaskFilter);
  const locked=canvasView.paper.locked;
  const ordered = [...tasks].sort((a,b) => {
    const ai=state.paper.sequence.indexOf(a.id), bi=state.paper.sequence.indexOf(b.id);
    if(ai>=0||bi>=0) return (ai<0?999:ai)-(bi<0?999:bi);
    return a.id-b.id;
  });
  const plan=paperPlan(tasks),objects=[];
  ordered.forEach(task=>{const p=plan.positions.get(task.id);objects.push({key:`task:${task.id}`,x:p.x,y:p.y,w:300,h:76});});
  state.paper.texts.forEach(note=>{const p=paperTextPosition(note,plan);objects.push({key:`text:${note.id}`,x:p.x,y:p.y,w:note.width||240,h:note.type==='heading'?62:88});});
  return `${pageHead('WHEN STRUCTURE FAILS, USE THE PAGE', `Your paper page.<br><em>See everything at once.</em>`, `<span class="paper-page-count">${tasks.length} visible tasks on one page</span><button class="primary" data-open-scan>▧ Scan a page</button>`)}
    <section class="paper-shell">
      ${taskFilterBar()}
      <div class="paper-toolbar" role="toolbar" aria-label="Paper tools">
        <div class="canvas-view-controls"><button class="canvas-lock ${locked?'active':''}" data-canvas-lock="paper" aria-pressed="${locked}" title="${locked?'Unlock Paper editing':'Lock Paper'}"><span>${locked?'🔒':'✣'}</span><b>${locked?'Locked':'Editing'}</b></button><button data-canvas-zoom="paper:out" aria-label="Zoom Paper out">−</button><button class="canvas-zoom-readout" data-canvas-zoom="paper:fit" title="Fit the whole page to this screen"><b data-canvas-zoom-label="paper">Fit</b><small>FIT</small></button><button data-canvas-zoom="paper:in" aria-label="Zoom Paper in">+</button></div>
        <div class="paper-tool-strip">${[['select','↖','Move'],['pen','✎','Pen'],['text','T','Text'],['heading','H','Heading'],['circle','◯','Circle'],['box','□','Box'],['tick','✓','Tick'],['eraser','⌫','Eraser']].map(([tool,icon,label])=>`<button class="paper-tool ${tool==='select'?'active':''}" data-paper-tool="${tool}" title="${locked?'Unlock Paper to use tools':label}" ${locked?'disabled':''}><span>${icon}</span><b>${label}</b></button>`).join('')}</div>
        <form class="paper-quick" id="paperQuickForm"><input id="paperQuickInput" placeholder="Write a task straight onto the page…"><button>Add task</button></form>
        <div class="paper-toolbar-actions"><button class="paper-save paper-scan-shortcut" data-open-scan>▧ Scan</button><button class="paper-save" data-paper-arrange ${locked?'disabled':''}>Arrange safely</button><button class="paper-save" data-paper-order ${locked?'disabled':''}>Use page order</button><button class="paper-save" data-clear-ink ${locked?'disabled':''}>Clear ink</button></div>
      </div>
      <div class="paper-mode-help ${locked?'is-locked':''}"><b>${locked?'Page locked — scroll and zoom safely.':'Editing is on — objects can move.'}</b><span>${locked?'Tap Locked when you intentionally want to draw or rearrange.':'Lock the page again when you finish. Guided placement still prevents accidental overlap.'}</span></div>
      <div class="paper-board-wrap" id="paperBoardWrap" tabindex="0" aria-label="Paper canvas. Locked by default; use zoom controls and scroll to explore."><div class="canvas-stage" id="paperStage"><div class="paper-board" id="paperBoard" data-tool="select" style="height:${plan.height}px">
        <canvas id="paperCanvas" width="1180" height="${plan.height}"></canvas>
        <div class="paper-title" id="paperTitle" contenteditable="${!locked}" spellcheck="false">${esc(state.paper.title)}</div>
        <span class="paper-hint">DRAG · WRITE · CIRCLE · CHECK · REORDER</span>
        ${paperHeadings(plan)}
        ${ordered.map(task=>{const p=plan.positions.get(task.id),layout=state.paper.layout[task.id]||{},order=state.paper.sequence.indexOf(task.id),classes=['circle','tick','box','star'].filter(mark=>hasMark(task,mark)).map(mark=>`mark-${mark}`).join(' '),floating=p.mode==='float',overlap=floating&&paperIsOverlap(`task:${task.id}`,{x:p.x,y:p.y,w:300,h:76},objects);return `<article class="paper-task paper-object ${task.progress>=100?'is-done':''} ${classes} ${floating?'is-floating':''} ${overlap?'is-overlapping':''} ${layout.locked?'is-locked':''}" data-paper-kind="task" data-paper-task="${task.id}" style="left:${p.x}px;top:${p.y}px;z-index:${p.z};transform:rotate(${p.rotation}deg)"><button class="paper-check" data-paper-complete="${task.id}" aria-label="Toggle completion">${task.progress>=100?'✓':''}</button><button class="paper-mode" data-paper-mode="task:${task.id}" ${locked?'disabled':''} title="${floating?'Return to guided placement':'Allow deliberate overlap'}">${floating?'Guided':'Float'}</button><button class="paper-edit" data-paper-edit="${task.id}" aria-label="Edit ${esc(task.title)}" title="Edit task">✎</button><b>${esc(task.title)}</b><small>${esc(task.category)} · ${task.progress}%${overlap?' · deliberate overlap':''}</small>${order>=0?`<span class="paper-seq">#${order+1}</span>`:''}${taskMarkButtons(task,true)}</article>`}).join('')}
        ${state.paper.texts.map(note=>{const p=paperTextPosition(note,plan),floating=note.mode==='float',overlap=floating&&paperIsOverlap(`text:${note.id}`,{x:p.x,y:p.y,w:note.width||240,h:note.type==='heading'?62:88},objects);return `<article class="paper-text paper-object ${note.type==='heading'?'heading':''} ${floating?'is-floating':''} ${overlap?'is-overlapping':''} ${note.locked?'is-locked':''}" data-paper-kind="text" data-paper-text="${note.id}" style="left:${p.x}px;top:${p.y}px;width:${note.width}px;z-index:${note.z};transform:rotate(${note.rotation}deg)"><div class="paper-text-controls"><button data-paper-drag-handle title="Move">⠿</button><button data-paper-mode="text:${note.id}" title="${floating?'Return to guided placement':'Allow deliberate overlap'}">${floating?'Guided':'Float'}</button><button data-paper-layer="${note.id}" title="Bring forward">↑</button><button data-paper-rotate="${note.id}" title="Rotate">↻</button><button data-paper-delete-text="${note.id}" title="Delete">×</button></div><div class="paper-text-content" contenteditable="${!locked}" spellcheck="false">${esc(note.text)}</div>${overlap?'<small class="paper-overlap-label">FLOATING OVER ANOTHER ITEM</small>':''}</article>`}).join('')}
      </div></div></div>
      <div class="paper-key"><span><b>◯ Important</b><b>✓ Ready to act</b><b>□ Protected time</b><b>★ Today focus</b></span><span>Guided items avoid collisions. Floating items may overlap by choice. Task marks and progress stay synchronized.</span></div>
    </section>`;
}

function deleteRequest(id) {
  const request=state.requests.find(item=>item.id===id);if(!request)return;
  state.requests=state.requests.filter(item=>item.id!==id);
  save();render();toast('Request deleted','Tasks created from an approval remain in your plan.');
}
function clearRequestHistory() {
  const count=state.requests.filter(request=>request.status!=='pending').length;
  state.requests=state.requests.filter(request=>request.status==='pending');
  save();render();toast('Request history cleared',`${count} resolved request${count===1?' was':'s were'} removed. Pending requests and approved tasks were kept.`);
}
function requestCard(r) {
  const pending = r.status === 'pending';
  const actions = pending
    ? `<button class="accept" data-request-action="accept">Approve + create plan</button><button data-request-action="shorten">Offer 30 minutes</button><button data-request-action="reject">Decline</button><button class="request-delete" data-request-action="delete">Delete</button>`
    : `<span class="resolved-note">Saved in history${r.resolvedAt?` · ${new Date(r.resolvedAt).toLocaleDateString()}`:''}</span><button class="request-delete" data-request-action="delete">Delete from history</button>`;
  return `<article class="request-card ${pending ? '' : 'resolved'}" data-request="${r.id}"><div class="request-head"><div class="request-person"><span class="person-avatar">${esc(r.initials||String(r.name||'?').slice(0,2).toUpperCase())}</span><div><h3>${esc(r.name)}</h3><p>${dateLabel(r.date)} · ${clock(mins(r.start))} · ${duration(r.duration)}</p></div></div><span class="pending-pill">${esc(r.status.toUpperCase())}</span></div><div class="request-purpose">${esc(r.purpose)}</div><p class="request-note">${esc(r.note)}</p><div class="request-facts"><div><small>EXPECTED RESULT</small><b>${esc(r.outcome)}</b></div><div><small>URGENCY</small><b>${esc(r.urgency)}</b></div><div><small>FLEXIBILITY</small><b>${esc(r.flexibility)}</b></div><div><small>TIME ASKED</small><b>${duration(r.duration)}</b></div></div><div class="impact-box ${r.safe ? 'safe' : ''}"><b>${r.safe ? '✓ Fits your plan: ' : '⚠ Scheduling impact: '}</b>${esc(r.impact)}</div><div class="request-actions">${actions}</div></article>`;
}
function requestsView() {
  const pending = state.requests.filter(r => r.status === 'pending'), history = state.requests.filter(r => r.status !== 'pending');
  const visible = ui.requestFilter === 'history' ? history : ui.requestFilter === 'all' ? state.requests : pending;
  const heading = ui.requestFilter === 'pending' ? `${pending.length} pending request${pending.length===1?'':'s'}` : ui.requestFilter === 'history' ? `${history.length} resolved request${history.length===1?'':'s'}` : `${state.requests.length} total request${state.requests.length===1?'':'s'}`;
  const empty = ui.requestFilter === 'pending' ? 'No request is waiting for you.' : 'No resolved request is stored.';
  return `${pageHead('CONTROL WHO GETS YOUR TIME', `Requests wait.<br><em>You choose the tradeoff.</em>`, `<button class="secondary" data-view="share">Manage share link</button>`)}<section class="section-card"><div class="request-toolbar"><div><h2>${heading}</h2><p>History is shown only when you choose it. Accepted tasks remain in your plan even if their request record is deleted.</p></div><div class="request-filter-bar"><button class="filter-chip ${ui.requestFilter==='pending'?'active':''}" data-request-filter="pending">Pending <b>${pending.length}</b></button><button class="filter-chip ${ui.requestFilter==='history'?'active':''}" data-request-filter="history">History <b>${history.length}</b></button><button class="filter-chip ${ui.requestFilter==='all'?'active':''}" data-request-filter="all">All</button>${ui.requestFilter==='history'&&history.length?'<button class="clear-request-history" data-clear-request-history>Clear resolved history</button>':''}</div></div><div class="request-list">${visible.length?visible.map(requestCard).join(''):`<div class="empty"><b>${empty}</b>${ui.requestFilter==='pending'?'Your time remains protected.':'Approved and declined requests will appear here.'}</div>`}</div></section>`;
}

function shareView() {
  const base = location.href.split('#')[0].split('?')[0];
  const link = `${base}#invite=${state.share.token}`;
  const published = state.tasks.filter(t => t.publish && t.date && t.progress < 100);
  return `${pageHead('A PRIVATE DOOR TO YOUR TIME', `Share availability.<br><em>Keep your life private.</em>`, `<button class="secondary" data-preview-share>Preview as visitor</button><button class="primary" data-open="freeModal">+ Add free window</button>`)}
    <div class="share-grid"><section class="share-settings"><h2>Access rules</h2><p>Visitors see only the windows and public labels you choose. Private task names never leave your command center.</p><div class="setting-list">
      ${settingRow('oneTime','One-time access','Link closes after the first submitted request')}${settingRow('expires','Automatic expiry','Access expires in 48 hours')}${settingRow('approval','Require your approval','Nothing reaches your calendar automatically')}${settingRow('questions','Require time justification','Ask purpose, outcome, urgency and flexibility')}${settingRow('privacy','Hide private event titles','Only show available or unavailable')}
    </div><div class="share-link"><input id="shareLink" readonly value="${esc(link)}"><button data-copy-link>Copy link</button></div><div class="link-meta"><span>Created for one recipient</span><span>Expires in 47h 18m</span></div></section>
    <aside class="public-card"><p class="eyebrow">PUBLISHED WINDOWS</p><h2>What is visible</h2><p>Selected commitments use their public title. Everything else remains private.</p><div class="public-mini-calendar">${state.availability.map(a=>`<div class="public-mini-row"><b>${dateLabel(a.date)} · ${clock(mins(a.start))}–${clock(mins(a.end))}</b><span>AVAILABLE</span></div>`).join('')}${published.map(t=>`<div class="public-mini-row"><b>${dateLabel(t.date)} · ${esc(t.publicTitle || 'Unavailable')}</b><span>BUSY</span></div>`).join('')}</div><button class="secondary" data-preview-share>Open visitor preview →</button></aside></div>
    <section class="section-card" style="margin-top:18px"><div class="section-title"><div><h2>Free-time windows</h2><p>Each window can limit how much time a visitor requests.</p></div></div><div class="window-list">${state.availability.map(a=>`<div class="window-item"><div><b>${dateLabel(a.date)} · ${clock(mins(a.start))}–${clock(mins(a.end))}</b><small>${esc(a.label)} · maximum ${duration(a.max)}</small></div><button data-remove-window="${a.id}">×</button></div>`).join('')}</div></section>`;
}

const boardColors={yellow:'#f6dd78',blue:'#a8c9ee',pink:'#f3a69a',green:'#bddd91',paper:'#f6f1df'};
function activeBoard(){return state.boards.find(board=>board.id===ui.boardId)||state.boards[0];}
function glanceRail(){
  const notes=state.boardNotes.filter(note=>note.showGlance&&!note.archived&&(!note.snoozedUntil||Date.parse(note.snoozedUntil)<=Date.now())).sort((a,b)=>(Number(b.z)||0)-(Number(a.z)||0)).slice(0,3);
  if(!notes.length)return '';
  return `<section class="glance-rail"><div class="glance-intro"><span class="eyebrow">FROM YOUR BOARD</span><b>Things worth keeping in sight.</b></div><div class="glance-items">${notes.map(note=>`<article style="--note:${boardColors[note.color]||boardColors.yellow}"><small>${esc(note.type)}</small><b>${esc(note.text)}</b><div><button data-glance-snooze="${note.id}">Snooze</button><button data-glance-hide="${note.id}">Hide here</button></div></article>`).join('')}</div><button class="glance-open" data-view="board">Open board →</button></section>`;
}
function boardView(){
  const board=activeBoard(),notes=state.boardNotes.filter(note=>note.boardId===board.id&&!note.archived),height=Math.max(760,...notes.map(note=>Number(note.y||0)+Number(note.h||175)+70)),locked=canvasView.board.locked;
  return `${pageHead('YOUR VISIBLE INNER WALL', `Pin what matters.<br><em>Let it stay present.</em>`, `<button class="secondary" data-open="boardModal">+ New board</button><button class="primary" data-board-note-new>+ Pin a note</button>`)}
    <div class="board-tabs" role="tablist">${state.boards.map(item=>`<button class="${item.id===board.id?'active':''}" data-board-select="${esc(item.id)}">${esc(item.name)} <span>${state.boardNotes.filter(note=>note.boardId===item.id&&!note.archived).length}</span></button>`).join('')}</div>
    <section class="bulletin-shell"><div class="bulletin-toolbar"><span><b>${esc(board.name)}</b><small>${locked?'Board locked — swipe to explore without moving notes.':'Editing is on. Drag by the pin; guided notes avoid collisions.'}</small></span><div class="canvas-view-controls"><button class="canvas-lock ${locked?'active':''}" data-canvas-lock="board" aria-pressed="${locked}" title="${locked?'Unlock Board editing':'Lock Board'}"><span>${locked?'🔒':'✣'}</span><b>${locked?'Locked':'Editing'}</b></button><button data-canvas-zoom="board:out" aria-label="Zoom Board out">−</button><button class="canvas-zoom-readout" data-canvas-zoom="board:fit" title="Fit the whole board to this screen"><b data-canvas-zoom-label="board">Fit</b><small>FIT</small></button><button data-canvas-zoom="board:in" aria-label="Zoom Board in">+</button></div><div class="bulletin-actions"><button data-board-arrange ${locked?'disabled':''}>Arrange safely</button><button data-board-note-new>+ Sticky</button></div></div>
    <div class="bulletin-wrap" id="bulletinWrap" tabindex="0" aria-label="Bulletin canvas. Locked by default; use zoom controls and scroll to explore."><div class="canvas-stage" id="bulletinStage"><div class="bulletin-board theme-${esc(board.theme)}" id="bulletinBoard" style="height:${height}px">${notes.length?notes.map(note=>`<article class="bulletin-note color-${esc(note.color)} ${note.float?'is-floating':''} ${note.locked?'is-locked':''} ${ui.boardMenuId===note.id?'menu-open':''}" data-board-note="${note.id}" style="left:${note.x}px;top:${note.y}px;width:${note.w}px;min-height:${note.h}px;z-index:${note.z};transform:rotate(${note.rotation}deg)"><button class="board-note-menu" data-board-note-menu="${note.id}" aria-label="Note options" aria-expanded="${ui.boardMenuId===note.id}">•••</button><button class="board-pin" data-board-drag-handle aria-label="Move note" title="${locked?'Unlock the board to move notes':'Move note'}"><i></i></button><div class="board-note-actions"><button data-board-note-float="${note.id}" ${locked?'disabled':''} title="${note.float?'Use collision-safe placement':'Allow deliberate overlap'}">${note.float?'Guided':'Float'}</button><button data-board-note-size="${note.id}" ${locked?'disabled':''} title="Change size">↔</button><button data-board-note-rotate="${note.id}" ${locked?'disabled':''} title="Rotate">↻</button><button data-board-note-lock="${note.id}" ${locked?'disabled':''} title="${note.locked?'Unlock':'Lock position'}">${note.locked?'●':'○'}</button><button data-board-note-front="${note.id}" ${locked?'disabled':''} title="Bring forward">↑</button><button data-board-note-edit="${note.id}" title="Edit">✎</button></div><small>${esc(note.type)}</small><p>${esc(note.text)}</p>${note.source?`<cite>— ${esc(note.source)}</cite>`:''}<footer><button class="${note.showGlance?'active':''}" data-board-note-glance="${note.id}">${note.showGlance?'Visible around app':'Show around app'}</button>${note.notifyAt?`<span>◷ ${new Date(note.notifyAt).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</span>`:''}</footer></article>`).join(''):`<div class="bulletin-empty"><span>●</span><h3>Your board is ready.</h3><p>Pin a quote, thought, decision or reminder you want to encounter again.</p><button class="primary" data-board-note-new>Pin the first note →</button></div>`}</div></div></div></section>`;
}
const KNOWLEDGE_STOP=new Set(['the','and','for','with','this','that','from','into','your','you','are','was','were','have','has','will','about','task','work','using','use']);
function knowledgeWords(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g,' ').split(/[\s-]+/).map(word=>word.length>5&&word.endsWith('ing')?word.slice(0,-3):word.length>4&&word.endsWith('ed')?word.slice(0,-2):word.length>4&&word.endsWith('s')?word.slice(0,-1):word).filter(word=>word.length>2&&!KNOWLEDGE_STOP.has(word));}
function knowledgeScore(task,item){
  const taskCore=new Set(knowledgeWords([task.title,task.next,task.category].join(' '))),taskArea=new Set(knowledgeWords(task.area)),itemCore=new Set(knowledgeWords([item.title,item.context,(item.tags||[]).join(' ')].join(' '))),itemDetail=new Set(knowledgeWords([item.why,item.note,item.type].join(' ')));
  const strong=[...taskCore].filter(word=>itemCore.has(word)),support=[...taskCore].filter(word=>itemDetail.has(word)),area=[...taskArea].filter(word=>itemCore.has(word));const score=strong.length*3+support.length+area.length;
  return {score,reason:strong.length?`Matches ${strong.slice(0,2).join(' + ')}`:area.length?`Fits ${task.area}`:support.length?`Related to ${support[0]}`:''};
}
function knowledgeSuggestions(task,limit=2){return state.library.filter(item=>!['done','archived'].includes(item.status)).map(item=>({item,...knowledgeScore(task,item)})).filter(match=>match.score>=3).sort((a,b)=>b.score-a.score||String(a.item.title).localeCompare(String(b.item.title))).slice(0,limit);}
function knowledgeTaskMatches(){return state.tasks.filter(task=>task.progress<100).map(task=>({task,matches:knowledgeSuggestions(task,1)})).filter(group=>group.matches.length).sort((a,b)=>b.matches[0].score-a.matches[0].score).slice(0,5);}
function libraryMatches(item){
  const filter=ui.libraryFilter||'active',q=(ui.libraryQuery||'').trim().toLowerCase(),hay=[item.title,item.type,item.why,item.context,item.note,...(item.tags||[])].join(' ').toLowerCase();
  if(q&&!hay.includes(q))return false;
  if(filter==='all')return true;if(filter==='active')return !['done','archived'].includes(item.status);return item.status===filter;
}
function libraryView(){
  const items=state.library.filter(libraryMatches),inbox=state.library.filter(item=>item.status==='inbox').length,ready=state.library.filter(item=>item.status==='ready').length,suggestions=knowledgeTaskMatches();
  return `${pageHead('SAVE LESS. USE MORE.', `Your useful library.<br><em>Find it when it matters.</em>`, `<button class="primary" data-library-new>+ Save something</button>`)}
    <section class="library-pulse"><div><span class="eyebrow">ACTIVATION, NOT COLLECTION</span><b>${inbox} need review · ${ready} ready to use</b><p>Every saved thing needs a reason and a next action. Attach it to the work where it can become useful.</p></div>${state.library.find(item=>item.status==='ready')?`<button data-library-use="${state.library.find(item=>item.status==='ready').id}">Use one saved thing now →</button>`:'<button data-library-new>Save the first useful thing →</button>'}</section>
    ${suggestions.length?`<section class="knowledge-suggestions"><header><div><span class="eyebrow">QUIET CONTEXTUAL SUGGESTIONS</span><h2>Useful for work you already chose.</h2><p>These appear only here and inside the relevant task. No feed, popup or notification.</p></div><span>${suggestions.length} strong match${suggestions.length===1?'':'es'}</span></header><div>${suggestions.map(({task,matches:[match]})=>`<article><div><small>FOR TASK</small><b>${esc(task.title)}</b></div><span>←</span><div><small>${esc(match.reason)}</small><b>${esc(match.item.title)}</b></div><button data-knowledge-attach="${match.item.id}:${task.id}">${match.item.taskId===task.id?'Attached':'Attach'}</button><button data-knowledge-open="${match.item.id}">Open</button></article>`).join('')}</div></section>`:''}
    <div class="library-toolbar"><label><span>⌕</span><input id="librarySearch" value="${esc(ui.libraryQuery||'')}" placeholder="Search by use, topic, title or tag…"></label><div>${[['active','Active'],['inbox','Needs review'],['ready','Ready'],['using','Using'],['done','Tried'],['all','Everything']].map(([key,label])=>`<button class="${ui.libraryFilter===key?'active':''}" data-library-filter="${key}">${label}</button>`).join('')}</div></div>
    <div class="library-grid">${items.length?items.map(item=>`<article class="library-card status-${item.status}" data-library-item="${item.id}"><header><span>${esc(item.type)}</span><em>${esc(item.status.replaceAll('-',' '))}</em></header><h3>${esc(item.title)}</h3>${item.why?`<p>${esc(item.why)}</p>`:''}<dl><div><dt>USE IT FOR</dt><dd>${esc(item.context||'Not decided yet')}</dd></div><div><dt>NEXT</dt><dd>${esc(item.action||'review')} · ${duration(item.minutes)}</dd></div></dl>${item.tags?.length?`<div class="library-tags">${item.tags.map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>`:''}<footer>${safeUrl(item.url)?`<a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener">Open source ↗</a>`:'<span></span>'}<div><button data-library-task="${item.id}" title="Turn into task">+ Task</button><button data-library-edit="${item.id}" title="Edit">✎</button><button data-library-status="${item.id}" title="Mark tried">✓</button></div></footer></article>`).join(''):'<div class="library-empty"><span>⌘</span><h3>Nothing is lost here.</h3><p>Save a tool, book, post, trick or website together with why it matters.</p><button class="primary" data-library-new>Save something useful →</button></div>'}</div>`;
}

let bulletinRuntime={drag:null};
function initBulletinBoard(){
  const board=$('#bulletinBoard');if(!board)return;applyCanvasView('board');
  board.addEventListener('pointerdown',event=>{const handle=event.target.closest('[data-board-drag-handle]'),el=handle?.closest('[data-board-note]');if(!el||canvasView.board.locked||el.classList.contains('is-locked'))return;const note=state.boardNotes.find(item=>item.id===Number(el.dataset.boardNote));if(!note)return;const rect=board.getBoundingClientRect(),scale=1180/rect.width;bulletinRuntime.drag={el,note,dx:(event.clientX-rect.left)*scale-note.x,dy:(event.clientY-rect.top)*scale-note.y,w:el.offsetWidth*scale,h:el.offsetHeight*scale};el.setPointerCapture?.(event.pointerId);el.classList.add('is-dragging');event.preventDefault();});
  board.addEventListener('pointermove',event=>{const drag=bulletinRuntime.drag;if(!drag)return;const rect=board.getBoundingClientRect(),scale=1180/rect.width;drag.x=Math.max(16,Math.min(1164-drag.w,(event.clientX-rect.left)*scale-drag.dx));drag.y=Math.max(36,(event.clientY-rect.top)*scale-drag.dy);drag.el.style.left=`${drag.x}px`;drag.el.style.top=`${drag.y}px`;});
  const end=()=>{const drag=bulletinRuntime.drag;if(!drag)return;let x=Math.round((drag.x??drag.note.x)/12)*12,y=Math.round((drag.y??drag.note.y)/12)*12;if(!drag.note.float){const occupied=$$('[data-board-note]',board).filter(el=>el!==drag.el).map(el=>({x:parseFloat(el.style.left),y:parseFloat(el.style.top),w:el.offsetWidth,h:el.offsetHeight}));for(let attempt=0;attempt<100&&paperIsOverlap('candidate',{x,y,w:drag.w,h:drag.h},occupied.map((item,index)=>({key:String(index),...item})));attempt++){x+=24;if(x+drag.w>1160){x=24;y+=210;}}}Object.assign(drag.note,{x,y});drag.el.classList.remove('is-dragging');bulletinRuntime.drag=null;save();render();};
  board.addEventListener('pointerup',end);board.addEventListener('pointercancel',end);
}
function settingRow(key,title,copy) { return `<div class="setting-row"><div><b>${title}</b><small>${copy}</small></div><button class="switch ${state.share[key]?'on':''}" data-setting="${key}" aria-label="Toggle ${title}"><i></i></button></div>`; }

function insightsView() {
  const open = state.tasks.filter(task => task.progress < 100), remaining = Math.round(open.reduce((total,task)=>total+task.duration*(1-task.progress/100),0));
  const unclear = open.filter(task => !task.next?.trim()).length, unscheduled = open.filter(task => !task.start).length;
  return `${pageHead('LEARN FROM YOUR REAL BEHAVIOR', `Your patterns.<br><em>Without judgment.</em>`)}<div class="insight-grid">
    <article class="insight-card"><p class="eyebrow">YOUR RECORDED PROGRESS</p><h3>Every return counts.</h3><div class="pattern-list"><div><b>${state.profile.streak}</b> productive days in your current rhythm</div><div><b>${state.profile.sessions}</b> focus sessions finished</div><div><b>${state.profile.accuratePlans}</b> deliberate replans recorded</div></div><p>A new increase in task progress counts once per day, even before a task is finished. Rest days never remove XP or productive days.</p></article>
    <article class="insight-card"><p class="eyebrow">YOUR CURRENT TASKS</p><h3>Make the next step easier.</h3><div class="pattern-list"><div><b>${open.length}</b> open tasks · ${duration(remaining)} remaining</div><div><b>${unclear}</b> tasks need a clear first action</div><div><b>${unscheduled}</b> tasks have no chosen time</div></div><p>These counts come from the tasks currently in your workspace.</p><button class="secondary" data-view="all">Review tasks →</button></article>
    <article class="insight-card large"><p class="eyebrow">BADGES THAT REWARD HEALTHY WORK</p><h3>Credit for showing up, planning honestly and protecting your time.</h3><div class="reward-showcase">${earnedBadges().map(badge=>`<div class="reward-badge ${badge.earned?'earned':'upcoming'}"><span>${badge.symbol}</span><b>${badge.name}</b><small>${badge.meaning}</small><em>${badge.earned?'Earned':'To discover'}</em></div>`).join('')}</div><p>Earned badges stay with you after a rest day, a momentum reset or clearing request history. Each new 25% task milestone earns 10 XP, with 20 extra for first completion; repeating the same progress does not add more XP.</p></article>
  </div>`;
}

function render() {
  const renderers = { today: todayView, planner: plannerView, inbox: inboxView, paper: paperView, board: boardView, library: libraryView, all: allView, requests: requestsView, share: shareView, insights: insightsView };
  $('#app').innerHTML = attentionRail() + glanceRail() + (renderers[ui.view] || todayView)();
  renderLifeTree();
  $$('.nav-item,.mobile-nav button[data-view]').forEach(b => { const active=b.dataset.view===ui.view;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current'); });
  const todayOpen = state.tasks.filter(t => t.date === iso() && t.progress < 100).length;
  $('#todayCount').textContent = todayOpen; $('#plannerCount').textContent = state.tasks.filter(t => t.date === ui.planningDate && t.progress < 100).length;
  $('#inboxCount').textContent = state.tasks.filter(t => t.plan === 'inbox' && t.progress < 100).length;
  $('#allCount').textContent = state.tasks.filter(t => t.progress < 100).length;
  $('#paperCount').textContent = state.tasks.filter(t => t.progress < 100).length;
  $('#boardCount').textContent = state.boardNotes.filter(note=>!note.archived).length;
  $('#libraryCount').textContent = state.library.filter(item=>!['done','archived'].includes(item.status)).length;
  $('#requestCount').textContent = state.requests.filter(r => r.status === 'pending').length;
  const attentionCount=state.tasks.filter(t=>(t.date===iso()&&!t.start&&t.plan!=='inbox'&&t.progress<100)||(t.plan==='window'&&!t.start&&t.decideBy<=iso()&&t.progress<100)).length+state.requests.filter(r=>r.status==='pending').length;
  const mobileToday=$('#mobileTodayCount'),mobileAttention=$('#mobileAttentionCount');
  if(mobileToday){mobileToday.textContent=todayOpen||'';mobileToday.hidden=!todayOpen;}
  if(mobileAttention){mobileAttention.textContent=attentionCount||'';mobileAttention.hidden=!attentionCount;}
  if (ui.view === 'paper') requestAnimationFrame(initPaperBoard);
  if (ui.view === 'board') requestAnimationFrame(initBulletinBoard);
}

const APP_VIEWS=new Set(['today','planner','inbox','paper','board','library','all','requests','share','insights']);
function setView(view,{history=true}={}) { if(!APP_VIEWS.has(view))view='today';if(['paper','board'].includes(ui.view)&&view!==ui.view)canvasView[ui.view].locked=true;if(view==='requests' && ui.view!=='requests')ui.requestFilter='pending'; ui.view = view; if (view !== 'inbox') { ui.space = null; ui.category = null; } render(); $('#sidebar').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');$('#mobileMore')?.setAttribute('aria-expanded','false');if(history&&location.hash!==`#${view}`)window.history.pushState({view},'',`#${view}`);window.scrollTo({ top: 0, behavior: 'instant' }); }
function nextRecurringDate(task) {
  const base = new Date(`${task.date || iso()}T12:00:00`);
  if (task.repeat === 'daily') base.setDate(base.getDate() + 1);
  if (task.repeat === 'weekly') base.setDate(base.getDate() + 7);
  if (task.repeat === 'monthly') base.setMonth(base.getMonth() + 1);
  return iso(base);
}
function spawnRecurringTask(task) {
  if (!task.repeat || task.repeat === 'none' || task.recurrenceSpawned) return;
  task.recurrenceSpawned = true;
  const next = { ...clone(task), id:uid(), date:nextRecurringDate(task), progress:0, rewardProgress:0, replanRewarded:false, recurrenceSpawned:false, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  state.tasks.push(next);
  toast('Next recurring task created', `${next.title} is scheduled for ${dateLabel(next.date)}.`);
}
function updateProgress(id, value) {
  const task = state.tasks.find(t => t.id === id); if (!task) return;
  const old = Number(task.progress)||0, previousBest = Math.max(Number(task.rewardProgress)||0,old);
  task.progress = Math.max(0,Math.min(100,Number(value)||0));
  const crossed = Math.floor(task.progress / 25) - Math.floor(previousBest / 25);
  task.rewardProgress = Math.max(previousBest,task.progress);
  if (task.progress > previousBest) setProductive();
  if (crossed > 0) reward(crossed * 10 + (task.progress === 100 ? 20 : 0), task.progress === 100 ? 'Completion with context preserved' : 'Honest progress counts');
  if (task.progress === 100 && old < 100) { spawnRecurringTask(task); if(!task.repeat||task.repeat==='none')toast('Task complete', 'Your remaining workload has been recalculated.'); }
  save(); render();
}
function startTimer(task) {
  if (timerHandle) clearInterval(timerHandle);
  ui.timer = { taskId: task.id, remaining: Math.max(60, Math.round(task.duration * 60 * (1 - task.progress / 100))), running: true };
  $('#timerTask').textContent = task.title; $('#timerDock').classList.add('show'); $('#timerToggle').textContent = 'Ⅱ'; tick(); timerHandle = setInterval(tick, 1000);
}
function tick() {
  if (!ui.timer) return; const m = Math.floor(ui.timer.remaining / 60), s = ui.timer.remaining % 60;
  $('#timerTime').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  if (ui.timer.running && ui.timer.remaining > 0) ui.timer.remaining--;
  if (ui.timer.remaining <= 0) finishTimer();
}
function finishTimer() {
  if (!ui.timer) return; const task = state.tasks.find(t => t.id === ui.timer.taskId);
  if (task) { state.profile.sessions++; setProductive(); updateProgress(task.id, Math.min(100, task.progress + 25)); reward(20, 'Focused session completed'); render(); }
  closeTimer();
}
function closeTimer() { if (timerHandle) clearInterval(timerHandle); timerHandle = null; ui.timer = null; $('#timerDock').classList.remove('show'); }
function exportICS(task) {
  if (!task.date || !task.start) { toast('Schedule it first', 'Calendar events need a chosen date and time.'); return; }
  const end = mins(task.start) + task.duration, endTime = `${String(Math.floor(end/60)).padStart(2,'0')}${String(end%60).padStart(2,'0')}00`;
  const startTime = task.start.replace(':','') + '00', day = task.date.replaceAll('-','');
  const body = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Life Command//EN\r\nBEGIN:VEVENT\r\nUID:${task.id}@lifecommand\r\nDTSTART:${day}T${startTime}\r\nDTEND:${day}T${endTime}\r\nSUMMARY:${task.title.replaceAll('\n',' ')}\r\nDESCRIPTION:Next action: ${(task.next||'Open Life Command Center').replaceAll('\n',' ')}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = `${task.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.ics`; a.click(); URL.revokeObjectURL(a.href); toast('Calendar file created', 'Open it to add this event to your public or private calendar.');
}
function visitorPreview() {
  $('#visitorPreview').innerHTML = `<div class="visitor-shell"><div class="visitor-brand"><b>Life Command · A</b><span>PRIVATE ONE-TIME LINK</span></div><h3>Request focused time</h3><p>Choose an available window. Your request stays pending until A reviews its purpose and impact.</p>${state.availability.map(a=>`<div class="visitor-slot"><div><b>${dateLabel(a.date)} · ${clock(mins(a.start))}–${clock(mins(a.end))}</b><small> Up to ${duration(a.max)}</small></div><button data-visitor-pick>Choose</button></div>`).join('')}<div class="visitor-form"><input placeholder="Your name"><input placeholder="What do you need this time for?"><textarea rows="2" placeholder="What result should this time produce?"></textarea><input placeholder="How urgent and flexible is it?"><button class="primary" data-submit-demo-request>Submit for approval →</button></div></div>`;
  openModal('shareModal');
}

function renderSearchResults(query = '') {
  const q = query.trim().toLowerCase();
  const tasks = state.tasks.filter(t => !q || [t.title,t.area,t.category,t.next].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,6);
  const notes=state.boardNotes.filter(note=>!note.archived&&(!q||[note.text,note.type,note.source].some(value=>String(value||'').toLowerCase().includes(q)))).slice(0,4);
  const library=state.library.filter(item=>!q||[item.title,item.type,item.why,item.context,item.note,...(item.tags||[])].some(value=>String(value||'').toLowerCase().includes(q))).slice(0,5);
  const html=[...tasks.map(t=>`<button class="search-result" data-search-task="${t.id}"><i class="state-edge ${t.postponed>=2?'risk':t.plan==='window'?'flex':''}"></i><div><b>${esc(t.title)}</b><small>TASK · ${esc(t.area)} / ${esc(t.category)} · ${t.progress}% complete</small></div><span>→</span></button>`),...notes.map(note=>`<button class="search-result" data-search-board="${note.id}"><i class="state-edge board-edge"></i><div><b>${esc(note.text)}</b><small>BOARD · ${esc(note.type)}${note.source?` · ${esc(note.source)}`:''}</small></div><span>→</span></button>`),...library.map(item=>`<button class="search-result" data-search-library="${item.id}"><i class="state-edge library-edge"></i><div><b>${esc(item.title)}</b><small>LIBRARY · ${esc(item.type)} · ${esc(item.status)}</small></div><span>→</span></button>`)];
  $('#searchResults').innerHTML = html.length?html.join(''):'<div class="empty"><b>No matching task, board note or useful item.</b>Try a topic, use case, source or different phrase.</div>';
}
function openSearch() { openModal('searchModal'); $('#globalSearch').value=''; renderSearchResults(); setTimeout(()=>$('#globalSearch').focus(),80); }

function setTaskCategories(area, selected = '') {
  const options=[...(state.taxonomy.find(item=>item.name===area)?.categories||[])];if(selected&&!options.includes(selected))options.unshift(selected);
  $('#taskCategory').innerHTML = options.map(x=>`<option ${x===selected?'selected':''}>${esc(x)}</option>`).join('');
}
function updateTaskPlanFields() {
  const plan=$('#taskPlan').value;
  $$('[data-task-plan-show="scheduled"]').forEach(el=>el.hidden=plan==='inbox');
  $$('[data-task-plan-show="timed"]').forEach(el=>el.hidden=!['fixed','window'].includes(plan));
  $$('[data-task-plan-show="window"]').forEach(el=>el.hidden=plan!=='window');
  $('#taskStartLabel').textContent=plan==='window'?'Earliest time':'Start time';
  const hints={inbox:'Keep it safely in your Inbox until you decide.',today:'Choose the day now and place an hour later.',fixed:'Reserve an exact start time on the hourly planner.',window:'Set a range now; the app will keep the final time decision visible.'};
  $('#taskPlanHint').textContent=hints[plan]||hints.inbox;
}
function openTaskEditor(task = null) {
  ui.editTaskId = task?.id || null;
  const form = $('#taskForm'); form.reset();
  $('#taskModalTitle').textContent = task ? 'Edit the commitment.' : 'Give it a place.';
  $('#taskSubmit').textContent = task ? 'Save changes →' : 'Capture task →';
  $('#taskDelete').hidden = !task;
  $('#taskTitle').value = task?.title || '';
  const area=task?.area||state.taxonomy[0]?.name||'Unsorted';populateAreaSelect($('#taskArea'),area);setTaskCategories(area,task?.category||state.taxonomy.find(item=>item.name===area)?.categories[0]||'General');
  $('#taskDuration').value = String(task?.duration || 60); $('#taskEnergy').value = task?.energy || 'medium';
  $('#taskPlan').value = task?.plan || 'inbox'; $('#taskDate').min = task?.date && task.date < iso() ? task.date : iso(); $('#taskDate').value = task?.date || iso();
  $('#taskRepeat').value = task?.repeat || 'none'; $('#taskStart').value = task?.start || task?.windowStart || '10:00';
  $('#taskEnd').value = task?.windowEnd || '18:00'; $('#decideBy').value = task?.decideBy || iso(); $('#taskNext').value = task?.next || '';
  $('#taskTimer').checked = task ? Boolean(task.timer) : true; $('#taskPublish').checked = Boolean(task?.publish); $('#taskCalendar').checked = Boolean(task?.calendar);
  $('#taskCircle').checked = hasMark(task || {},'circle'); $('#taskReady').checked = hasMark(task || {},'tick'); $('#taskBox').checked = hasMark(task || {},'box'); $('#taskStar').checked = hasMark(task || {},'star');
  updateTaskPlanFields();
  const knowledge=task?knowledgeSuggestions(task,2):[],knowledgePanel=$('#taskKnowledge');knowledgePanel.hidden=!knowledge.length;$('#taskKnowledgeItems').innerHTML=knowledge.map(match=>`<article><div><small>${esc(match.reason)}</small><b>${esc(match.item.title)}</b></div><button type="button" data-knowledge-attach="${match.item.id}:${task.id}">${match.item.taskId===task.id?'Attached':'Attach'}</button><button type="button" data-knowledge-open="${match.item.id}">Open</button></article>`).join('');
  openModal('taskModal'); setTimeout(()=>$('#taskTitle').focus(),80);
}
function openBoardNoteEditor(note=null){
  ui.boardNoteId=note?.id||null;$('#boardNoteForm').reset();$('#boardNoteTitle').textContent=note?'Edit what stays visible.':'Keep it in sight.';$('#boardNoteDelete').hidden=!note;
  $('#boardNoteType').value=note?.type||'thought';$('#boardNoteText').value=note?.text||'';$('#boardNoteColor').value=note?.color||'yellow';$('#boardNoteSource').value=note?.source||'';$('#boardNoteGlance').checked=note?Boolean(note.showGlance):true;$('#boardNotePopup').checked=Boolean(note?.popup);
  const when=note?.notifyAt?new Date(note.notifyAt):null;$('#boardNoteDate').value=when?iso(when):'';$('#boardNoteTime').value=when?`${String(when.getHours()).padStart(2,'0')}:${String(when.getMinutes()).padStart(2,'0')}`:'09:00';openModal('boardNoteModal');setTimeout(()=>$('#boardNoteText').focus(),80);
}
function openLibraryEditor(item=null){
  ui.libraryId=item?.id||null;$('#libraryForm').reset();$('#libraryModalTitle').textContent=item?'Edit this useful thing.':'Capture something useful.';$('#libraryDelete').hidden=!item;
  $('#libraryTitle').value=item?.title||'';$('#libraryType').value=item?.type||'tool';$('#libraryUrl').value=item?.url||'';$('#libraryWhy').value=item?.why||'';$('#libraryContext').value=item?.context||'';$('#libraryAction').value=item?.action||'try';$('#libraryMinutes').value=String(item?.minutes||30);$('#libraryTags').value=(item?.tags||[]).join(', ');$('#libraryStatus').value=item?.status||'inbox';$('#libraryNote').value=item?.note||'';openModal('libraryModal');setTimeout(()=>$('#libraryTitle').focus(),80);
}
function openSharedLibraryCapture(){const params=new URLSearchParams(location.search);if(!params.has('share-target'))return;const title=params.get('title')||'',text=params.get('text')||'',shared=params.get('url')||text.match(/https?:\/\/\S+/)?.[0]||'';ui.view='library';render();openLibraryEditor();$('#libraryTitle').value=title||text.replace(shared,'').trim().slice(0,180)||'Shared item';$('#libraryUrl').value=safeUrl(shared);$('#libraryNote').value=text.replace(shared,'').trim();history.replaceState({},'',location.pathname+'#library');toast('Shared into your Library','Add why it matters so you can find and use it later.');}
function showGlancePopup(note){
  const popup=$('#glancePopup');if(!popup||!note)return;$('#glancePopupType').textContent=`${note.type.toUpperCase()} · FROM YOUR BOARD`;$('#glancePopupText').textContent=note.text;popup.classList.add('show');popup.setAttribute('aria-hidden','false');setTimeout(()=>{popup.classList.remove('show');popup.setAttribute('aria-hidden','true');},12000);
}

const OCR_SCRIPT = 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
let scanRuntime = { file:null, previewUrl:null, candidates:[], running:false, worker:null, libraryPromise:null, confidence:null, pass:null };

function setScanStatus(title, detail = '', mode = 'idle') {
  const status=$('#scanStatus'); if(!status)return; status.dataset.state=mode;
  status.innerHTML=`<b>${esc(title)}</b><span>${esc(detail)}</span>`;
}
function updateScanSelection() {
  const selected=scanRuntime.candidates.filter(item=>item.included&&item.text.trim()).length;
  const count=$('#scanSelectionCount'),button=$('#scanImport');
  if(count)count.textContent=selected?`${selected} item${selected===1?'':'s'} selected for Paper.`:'No items selected yet.';
  if(button)button.disabled=!selected||scanRuntime.running;
}
function renderScanCandidates() {
  const root=$('#scanCandidates'); if(!root)return;
  if(!scanRuntime.candidates.length){root.innerHTML='<div class="scan-empty"><b>1</b><span>Choose a photo or screenshot.</span><b>2</b><span>Correct the detected lines.</span><b>3</b><span>Add them to your Paper page.</span></div>';$('#scanReviewTitle').textContent='Your editable review will appear here.';updateScanSelection();return;}
  $('#scanReviewTitle').textContent=`Review ${scanRuntime.candidates.length} detected line${scanRuntime.candidates.length===1?'':'s'}.`;
  root.innerHTML=scanRuntime.candidates.map(item=>`<div class="scan-candidate ${item.included?'':'excluded'}" data-scan-candidate="${item.id}">
    <label class="scan-include" title="Include on Paper"><input type="checkbox" data-scan-include="${item.id}" ${item.included?'checked':''}><span>✓</span></label>
    <input class="scan-line-text" data-scan-text="${item.id}" value="${esc(item.text)}" aria-label="Detected text">
    <select data-scan-kind="${item.id}" aria-label="Item type"><option value="task" ${item.kind==='task'?'selected':''}>Task</option><option value="heading" ${item.kind==='heading'?'selected':''}>Heading</option><option value="note" ${item.kind==='note'?'selected':''}>Note</option></select>
    <label class="scan-important" title="Mark important"><input type="checkbox" data-scan-important="${item.id}" ${item.important?'checked':''}><span>◯</span></label>
    ${item.completed?'<small class="scan-done-badge">DONE</small>':''}
  </div>`).join('');
  updateScanSelection();
}
function parseScanText(raw) {
  const seen=new Set();
  return String(raw||'').replace(/\r/g,'').split('\n').map(line=>line.replace(/\s+/g,' ').trim()).filter(Boolean).map(line=>{
    const completed=/^(?:\[\s*[xXvV✓✔]\s*\]?|☑|✓|✔)\s*/.test(line);
    const important=/^(?:!{1,2}|★|\*)\s*/.test(line);
    let text=line.replace(/^(?:\[\s*[xXvV✓✔1Il| ]?\s*\]?|☐|☑|✓|✔|[-•·▪◦–—]|!{1,2}|★|\*)\s*/,'').replace(/^\d{1,2}[.)]\s+/,'').trim();
    if(text.length<2)return null;
    const key=text.toLowerCase();if(seen.has(key))return null;seen.add(key);
    const heading=/:$/.test(text)||(text.length<=45&&/[A-Z]/.test(text)&&text===text.toUpperCase());
    return {id:uid(),text:text.replace(/:$/,'').trim(),kind:heading?'heading':text.length>115?'note':'task',included:true,completed,important};
  }).filter(Boolean).slice(0,80);
}
function loadOcrLibrary() {
  if(window.Tesseract)return Promise.resolve(window.Tesseract);
  if(scanRuntime.libraryPromise)return scanRuntime.libraryPromise;
  scanRuntime.libraryPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=OCR_SCRIPT;script.async=true;script.crossOrigin='anonymous';script.referrerPolicy='no-referrer';
    script.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(new Error('OCR engine did not start'));
    script.onerror=()=>reject(new Error('OCR engine could not be downloaded'));
    document.head.appendChild(script);
  });
  return scanRuntime.libraryPromise;
}
async function decodeScanImage(file) {
  if('createImageBitmap' in window){
    try{return await createImageBitmap(file,{imageOrientation:'from-image'});}catch{return await createImageBitmap(file);}
  }
  const url=URL.createObjectURL(file),image=new Image();
  try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('This image could not be opened. Try JPG, PNG or WebP.'));image.src=url;});return image;}finally{URL.revokeObjectURL(url);}
}
function scanCanvas(width,height){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
async function prepareScanVariants(file,mode='auto') {
  setScanStatus('Improving the page…','Straightening orientation, enlarging text and correcting uneven light.','working');
  const source=await decodeScanImage(file),sourceWidth=source.naturalWidth||source.width,sourceHeight=source.naturalHeight||source.height;
  if(!sourceWidth||!sourceHeight)throw new Error('This image has no readable dimensions.');
  const longest=Math.max(sourceWidth,sourceHeight),scale=Math.max(.35,Math.min(3,longest<1800?1800/longest:2600/longest));
  const width=Math.max(1,Math.round(sourceWidth*scale)),height=Math.max(1,Math.round(sourceHeight*scale));
  const gray=scanCanvas(width,height),context=gray.getContext('2d',{willReadFrequently:true});context.fillStyle='#fff';context.fillRect(0,0,width,height);context.drawImage(source,0,0,width,height);if(source.close)source.close();
  const pixels=context.getImageData(0,0,width,height),data=pixels.data,histogram=new Uint32Array(256);let total=0;
  for(let i=0;i<data.length;i+=4){if(data[i+3]<24)continue;const value=Math.round(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]);histogram[value]++;total++;}
  const percentile=ratio=>{let seen=0,target=total*ratio;for(let i=0;i<256;i++){seen+=histogram[i];if(seen>=target)return i;}return ratio<.5?0:255;};
  const low=percentile(.01),high=Math.max(low+35,percentile(.995)),contrast=mode==='handwriting'?1.2:1.08;
  const grayValues=new Uint8ClampedArray(width*height);
  for(let i=0,p=0;i<data.length;i+=4,p++){
    const value=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];let adjusted=(value-low)*255/(high-low);adjusted=(adjusted-148)*contrast+148;adjusted=Math.max(0,Math.min(255,adjusted));grayValues[p]=adjusted;data[i]=data[i+1]=data[i+2]=adjusted;data[i+3]=255;
  }
  context.putImageData(pixels,0,0);
  if(mode==='printed')return [{canvas:gray,label:'clean text',psm:6}];
  const binary=scanCanvas(width,height),binaryContext=binary.getContext('2d'),binaryPixels=binaryContext.createImageData(width,height),output=binaryPixels.data;
  const integral=new Float64Array((width+1)*(height+1));
  for(let y=1;y<=height;y++){let row=0;for(let x=1;x<=width;x++){row+=grayValues[(y-1)*width+x-1];integral[y*(width+1)+x]=integral[(y-1)*(width+1)+x]+row;}}
  const radius=Math.max(12,Math.round(Math.min(width,height)/85)),bias=mode==='handwriting'?14:11;
  for(let y=0,p=0;y<height;y++){const y0=Math.max(0,y-radius),y1=Math.min(height-1,y+radius);for(let x=0;x<width;x++,p++){const x0=Math.max(0,x-radius),x1=Math.min(width-1,x+radius),count=(x1-x0+1)*(y1-y0+1),sum=integral[(y1+1)*(width+1)+(x1+1)]-integral[y0*(width+1)+(x1+1)]-integral[(y1+1)*(width+1)+x0]+integral[y0*(width+1)+x0],mean=sum/count,value=grayValues[p],ink=value<Math.min(185,mean-bias),index=p*4,tone=ink?0:255;output[index]=output[index+1]=output[index+2]=tone;output[index+3]=255;}}
  binaryContext.putImageData(binaryPixels,0,0);
  return mode==='handwriting'?[{canvas:binary,label:'handwriting',psm:11},{canvas:gray,label:'soft handwriting',psm:11}]:[{canvas:gray,label:'balanced',psm:6},{canvas:binary,label:'high contrast',psm:11}];
}
function ocrResultScore(result) {
  const text=String(result?.data?.text||'').trim(),confidence=Number(result?.data?.confidence||0);if(!text)return -1000;
  const useful=(text.match(/[A-Za-z0-9\u0900-\u097f]/g)||[]).length,weird=(text.match(/[^\sA-Za-z0-9\u0900-\u097f.,:;!?()'"\-\/&+%#@]/g)||[]).length,lines=text.split(/\n/).filter(line=>line.trim().length>1).length;
  return confidence+Math.min(12,useful/28)+Math.min(8,lines)-Math.min(24,weird*1.8)-(/(.)\1{4,}/.test(text)?12:0);
}
async function recognizeScan() {
  if(!scanRuntime.file||scanRuntime.running)return;
  scanRuntime.running=true;scanRuntime.candidates=[];scanRuntime.confidence=null;renderScanCandidates();
  $('#scanRetry').hidden=true;$('#scanProgress').hidden=false;$('#scanProgressBar').style.width='2%';
  setScanStatus('Preparing recognition…','The first scan can take a little longer.','working');updateScanSelection();
  try {
    const Tesseract=await loadOcrLibrary(),mode=$('#scanMode')?.value||'auto',language=$('#scanLanguage')?.value||'eng',variants=await prepareScanVariants(scanRuntime.file,mode),results=[];
    scanRuntime.worker=await Tesseract.createWorker(language,1,{logger:message=>{
      const progress=Math.max(0,Math.min(1,Number(message.progress||0)));
      const pass=Math.max(0,scanRuntime.pass||0),total=Math.max(1,variants.length),overall=(pass+progress)/total;
      $('#scanProgressBar').style.width=`${Math.max(3,Math.round(overall*100))}%`;
      const label=message.status?message.status.replace(/_/g,' '):'Reading the page';
      setScanStatus(label.charAt(0).toUpperCase()+label.slice(1),`${Math.round(overall*100)}% complete · pass ${Math.min(total,pass+1)} of ${total}`,'working');
    }});
    for(let index=0;index<variants.length;index++){
      scanRuntime.pass=index;const variant=variants[index];await scanRuntime.worker.setParameters({tessedit_pageseg_mode:String(variant.psm),preserve_interword_spaces:'1',user_defined_dpi:'300'});const result=await scanRuntime.worker.recognize(variant.canvas);results.push({...result,label:variant.label,score:ocrResultScore(result)});await new Promise(resolve=>setTimeout(resolve,0));
    }
    const result=results.sort((a,b)=>b.score-a.score)[0];scanRuntime.confidence=Math.round(result?.data?.confidence||0);scanRuntime.candidates=parseScanText(result?.data?.text||'');
    $('#scanConfidence').textContent=scanRuntime.candidates.length?`${scanRuntime.confidence}% · ${result.label}`:'';
    if(scanRuntime.candidates.length)setScanStatus('Enhanced page read complete.',`${scanRuntime.candidates.length} editable items are ready. Check uncertain words before importing.`,'done');
    else setScanStatus('No clear lines were found.','Try a straighter photo with stronger light, or add a line manually.','error');
  } catch(error) {
    setScanStatus('The page could not be read.',error?.message||'Try another image or a clearer photo.','error');
  } finally {
    if(scanRuntime.worker){try{await scanRuntime.worker.terminate();}catch{}scanRuntime.worker=null;}
    scanRuntime.running=false;scanRuntime.pass=null;$('#scanProgress').hidden=true;$('#scanRetry').hidden=false;renderScanCandidates();
  }
}
function resetScan() {
  if(scanRuntime.previewUrl)URL.revokeObjectURL(scanRuntime.previewUrl);
  scanRuntime.file=null;scanRuntime.previewUrl=null;scanRuntime.candidates=[];scanRuntime.running=false;scanRuntime.confidence=null;scanRuntime.pass=null;
  const image=$('#scanPreview');image.hidden=true;image.removeAttribute('src');$('#scanPlaceholder').hidden=false;$('#scanProgress').hidden=true;$('#scanRetry').hidden=true;$('#scanConfidence').textContent='';
  setScanStatus('Ready when you are.','Nothing leaves this browser until you add the detected items.');renderScanCandidates();
}
function openScan() { resetScan();openModal('scanModal'); }
function acceptScanFile(file) {
  if(!file)return;
  if(!file.type.startsWith('image/')){setScanStatus('Choose an image file.','PNG, JPG and WebP files are supported.','error');return;}
  if(file.size>20*1024*1024){setScanStatus('That image is too large.','Choose an image under 20 MB.','error');return;}
  if(scanRuntime.previewUrl)URL.revokeObjectURL(scanRuntime.previewUrl);
  scanRuntime.file=file;scanRuntime.previewUrl=URL.createObjectURL(file);
  const image=$('#scanPreview');image.src=scanRuntime.previewUrl;image.hidden=false;$('#scanPlaceholder').hidden=true;
  setScanStatus('Image ready.','Reading it now…','working');recognizeScan();
}
function addManualScanLine() {
  scanRuntime.candidates.push({id:uid(),text:'Edit this line',kind:'task',included:true,completed:false,important:false});renderScanCandidates();
  const inputs=$$('#scanCandidates .scan-line-text');inputs.at(-1)?.focus();inputs.at(-1)?.select();
}
function importScanToPaper() {
  const selected=scanRuntime.candidates.filter(item=>item.included&&item.text.trim());if(!selected.length)return;
  const area=$('#scanArea').value,category=$('#scanCategory').value.trim()||'Scanned page',areaIndex=Math.max(0,state.taxonomy.findIndex(item=>item.name===area));
  let taskCount=0,noteCount=0;
  selected.forEach((item,index)=>{
    if(item.kind==='task'){
      const id=uid()+index;state.tasks.push({id,title:item.text.trim(),area,category,duration:30,energy:'medium',date:null,start:null,plan:'inbox',progress:item.completed?100:0,next:'Clarify the first action from this page',timer:false,publish:false,calendar:false,repeat:'none',postponed:0,createdAt:new Date().toISOString(),source:'page-scan',paperMarks:{circle:item.important,tick:false,box:false,star:false}});state.paper.sequence.push(id);taskCount++;
    } else {
      const existing=state.paper.texts.length;state.paper.texts.push({id:uid()+index,x:6.2+(areaIndex%3)*31.3,y:Math.min(91,77+(existing%3)*5.4),text:item.text.trim(),type:item.kind==='heading'?'heading':'text',source:'page-scan'});noteCount++;
    }
  });
  state.paper.imports.unshift({id:uid(),fileName:scanRuntime.file?.name||'Camera scan',importedAt:new Date().toISOString(),confidence:scanRuntime.confidence,count:selected.length});state.paper.imports=state.paper.imports.slice(0,20);
  save();reward(Math.min(25,5+selected.length*2),'A paper page became an actionable plan');closeModal('scanModal');ui.view='paper';render();toast('Page added to Paper',`${taskCount} task${taskCount===1?'':'s'}${noteCount?` and ${noteCount} editable heading${noteCount===1?'':'s'}`:''} now sync everywhere.`);resetScan();
}

let paperRuntime = { tool: 'select', stroke: null, shape: null, drag: null };
function drawPaperCanvas(preview = null) {
  const canvas=$('#paperCanvas'); if(!canvas) return; const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height); ctx.lineCap='round'; ctx.lineJoin='round';
  const drawStroke = stroke => { if(!stroke.points?.length)return;ctx.beginPath();ctx.strokeStyle=stroke.color||'#252a27';ctx.lineWidth=stroke.width||2.2;ctx.moveTo(stroke.points[0].x,stroke.points[0].y);stroke.points.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke(); };
  state.paper.strokes.forEach(drawStroke); if(paperRuntime.stroke) drawStroke(paperRuntime.stroke);
  const drawShape = shape => { ctx.beginPath();ctx.strokeStyle=shape.color||'#ff7962';ctx.lineWidth=shape.width||2.6;if(shape.type==='circle'){const cx=(shape.x1+shape.x2)/2,cy=(shape.y1+shape.y2)/2,rx=Math.abs(shape.x2-shape.x1)/2,ry=Math.abs(shape.y2-shape.y1)/2;ctx.ellipse(cx,cy,Math.max(3,rx),Math.max(3,ry),-.035,0,Math.PI*2);}else if(shape.type==='box'){ctx.rect(shape.x1,shape.y1,shape.x2-shape.x1,shape.y2-shape.y1);}else if(shape.type==='tick'){ctx.moveTo(shape.x1-11,shape.y1);ctx.lineTo(shape.x1-2,shape.y1+10);ctx.lineTo(shape.x1+16,shape.y1-13);}ctx.stroke(); };
  state.paper.shapes.forEach(drawShape); if(preview) drawShape(preview);
}
function paperPoint(event, board) { const r=board.getBoundingClientRect();return{x:(event.clientX-r.left)*1180/r.width,y:(event.clientY-r.top)*board.offsetHeight/r.height}; }
function paperSafePosition(board,drag,x,y) {
  const snap=value=>Math.round(value/12)*12,w=drag.w||300,h=drag.h||78;
  let candidate={x:Math.max(12,Math.min(1180-w-12,snap(x))),y:Math.max(112,snap(y))};
  if(drag.mode==='float')return candidate;
  const boardRect=board.getBoundingClientRect(),scale=1180/boardRect.width;
  const occupied=$$('.paper-object,.paper-area-heading,.paper-category-heading',board).filter(el=>el!==drag.el).map(el=>{const r=el.getBoundingClientRect();return{x:(r.left-boardRect.left)*scale,y:(r.top-boardRect.top)*scale,w:r.width*scale,h:r.height*scale};});
  for(let attempt=0;attempt<160&&paperIsOverlap('candidate',{...candidate,w,h},occupied.map((rect,index)=>({key:String(index),...rect})));attempt++){
    candidate.y+=96;if(candidate.y+h>board.offsetHeight-20){candidate.y=112;candidate.x+=324;if(candidate.x+w>1168){candidate.x=12;candidate.y=board.offsetHeight+24;break;}}
  }
  return candidate;
}
function initPaperBoard() {
  const board=$('#paperBoard'),canvas=$('#paperCanvas');if(!board||!canvas)return;paperRuntime.tool='select';applyCanvasView('paper');drawPaperCanvas();
  const chooseTool=tool=>{paperRuntime.tool=tool;board.dataset.tool=tool;$$('[data-paper-tool]').forEach(b=>b.classList.toggle('active',b.dataset.paperTool===tool));canvas.style.pointerEvents=tool==='select'?'none':'auto';};
  $$('[data-paper-tool]').forEach(button=>button.addEventListener('click',()=>chooseTool(button.dataset.paperTool)));
  board.addEventListener('pointerdown',event=>{
    const taskEl=event.target.closest('[data-paper-task]'),textEl=event.target.closest('[data-paper-text]'),object=taskEl||(event.target.closest('[data-paper-drag-handle]')?textEl:null);
    if(canvasView.paper.locked)return;
    if(paperRuntime.tool==='select'&&object&&!object.classList.contains('is-locked')&&(!event.target.closest('button')||event.target.closest('[data-paper-drag-handle]'))){const p=paperPoint(event,board),kind=object.dataset.paperKind,id=Number(taskEl?.dataset.paperTask||textEl?.dataset.paperText),task=kind==='task'?state.tasks.find(t=>t.id===id):null,note=kind==='text'?state.paper.texts.find(t=>t.id===id):null,visible=state.tasks.filter(matchesTaskFilter),plan=paperPlan(visible),pos=kind==='task'?plan.positions.get(id):paperTextPosition(note,plan),mode=(kind==='task'?state.paper.layout[id]?.mode:note?.mode)||'placed';paperRuntime.drag={el:object,kind,id,mode,w:object.offsetWidth*(1180/board.getBoundingClientRect().width),h:object.offsetHeight*(1180/board.getBoundingClientRect().width),dx:p.x-pos.x,dy:p.y-pos.y};object.setPointerCapture?.(event.pointerId);object.classList.add('is-dragging');event.preventDefault();return;}
    if(paperRuntime.tool==='text'||paperRuntime.tool==='heading'){const p=paperPoint(event,board);state.paper.texts.push({id:uid(),x:p.x,y:p.y,unit:'px',text:paperRuntime.tool==='heading'?'New heading':'Write here…',type:paperRuntime.tool,mode:'placed',z:5,width:paperRuntime.tool==='heading'?300:240,rotation:0});save();render();return;}
    const p=paperPoint(event,board);
    if(paperRuntime.tool==='pen'){paperRuntime.stroke={id:uid(),color:'#252a27',width:2.2,points:[p]};canvas.setPointerCapture?.(event.pointerId);}
    if(paperRuntime.tool==='circle'||paperRuntime.tool==='box'){paperRuntime.shape={id:uid(),type:paperRuntime.tool,color:paperRuntime.tool==='circle'?'#ff7962':'#252a27',x1:p.x,y1:p.y,x2:p.x,y2:p.y};canvas.setPointerCapture?.(event.pointerId);}
    if(paperRuntime.tool==='tick'){state.paper.shapes.push({id:uid(),type:'tick',color:'#4d7420',x1:p.x,y1:p.y,x2:p.x,y2:p.y});save();drawPaperCanvas();}
    if(paperRuntime.tool==='eraser'){const near=stroke=>stroke.points?.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<22);let i=state.paper.strokes.findLastIndex(near);if(i>=0)state.paper.strokes.splice(i,1);else if(state.paper.shapes.length)state.paper.shapes.pop();save();drawPaperCanvas();}
  });
  board.addEventListener('pointermove',event=>{const p=paperPoint(event,board);if(paperRuntime.stroke){paperRuntime.stroke.points.push(p);drawPaperCanvas();}if(paperRuntime.shape){paperRuntime.shape.x2=p.x;paperRuntime.shape.y2=p.y;drawPaperCanvas(paperRuntime.shape);}if(paperRuntime.drag){const x=Math.max(8,Math.min(1172-paperRuntime.drag.w,p.x-paperRuntime.drag.dx)),y=Math.max(90,p.y-paperRuntime.drag.dy);paperRuntime.drag.el.style.left=`${x}px`;paperRuntime.drag.el.style.top=`${y}px`;paperRuntime.drag.x=x;paperRuntime.drag.y=y;}});
  const end=()=>{if(paperRuntime.stroke){state.paper.strokes.push(paperRuntime.stroke);paperRuntime.stroke=null;save();drawPaperCanvas();}if(paperRuntime.shape){state.paper.shapes.push(paperRuntime.shape);paperRuntime.shape=null;save();drawPaperCanvas();}if(paperRuntime.drag){const drag=paperRuntime.drag,pos=paperSafePosition(board,drag,drag.x??parseFloat(drag.el.style.left),drag.y??parseFloat(drag.el.style.top));drag.el.classList.remove('is-dragging');if(drag.kind==='task'){const old=state.paper.layout[drag.id]||{};state.paper.layout[drag.id]={...old,...pos,unit:'px',mode:drag.mode==='float'?'float':'placed',z:Number(old.z)||5};}else{const note=state.paper.texts.find(item=>item.id===drag.id);if(note)Object.assign(note,pos,{unit:'px'});}paperRuntime.drag=null;save();render();}};
  board.addEventListener('pointerup',end);board.addEventListener('pointercancel',end);
  $('#paperTitle')?.addEventListener('blur',event=>{if(canvasView.paper.locked)return;state.paper.title=event.target.textContent.trim()||'Everything on my mind';save();});
  $$('[data-paper-text]').forEach(el=>$('.paper-text-content',el)?.addEventListener('blur',event=>{if(canvasView.paper.locked)return;const note=state.paper.texts.find(n=>n.id===Number(el.dataset.paperText));if(note){note.text=event.target.textContent.trim();save();}}));
  $('#paperQuickForm')?.addEventListener('submit',event=>{event.preventDefault();const input=$('#paperQuickInput'),title=input.value.trim();if(!title)return;const id=uid(),area=state.taxonomy.find(item=>item.name==='Personal')||state.taxonomy[0],category=area.categories.includes('Paper capture')?'Paper capture':area.categories[0];state.tasks.push({id,title,area:area.name,category,duration:30,energy:'medium',date:null,start:null,plan:'inbox',progress:0,next:'Clarify this paper capture',timer:false,publish:false,calendar:false,postponed:0,paperMarks:{circle:false,tick:false,box:false,star:false}});state.paper.sequence.push(id);save();reward(5,'A scribble became a real task');toast('Task added from paper','It is also visible in Inbox and All Tasks.');render();});
  chooseTool('select');
}

document.addEventListener('click', event => {
  const view = event.target.closest('[data-view]'); if (view) { event.preventDefault(); setView(view.dataset.view); return; }
  const canvasLock=event.target.closest('[data-canvas-lock]');if(canvasLock){setCanvasLock(canvasLock.dataset.canvasLock);return;}
  const canvasZoom=event.target.closest('[data-canvas-zoom]');if(canvasZoom){const [kind,action]=canvasZoom.dataset.canvasZoom.split(':');setCanvasZoom(kind,action);return;}
  if(event.target.closest('[data-board-note-new]')){openBoardNoteEditor();return;}
  const boardSelect=event.target.closest('[data-board-select]');if(boardSelect){ui.boardId=boardSelect.dataset.boardSelect;render();return;}
  const boardNoteMenu=event.target.closest('[data-board-note-menu]');if(boardNoteMenu){const id=Number(boardNoteMenu.dataset.boardNoteMenu);ui.boardMenuId=ui.boardMenuId===id?null:id;render();return;}
  const boardNoteEdit=event.target.closest('[data-board-note-edit]');if(boardNoteEdit){openBoardNoteEditor(state.boardNotes.find(note=>note.id===Number(boardNoteEdit.dataset.boardNoteEdit)));return;}
  const boardNoteFloat=event.target.closest('[data-board-note-float]');if(boardNoteFloat){if(!requireCanvasEditing('board'))return;const note=state.boardNotes.find(item=>item.id===Number(boardNoteFloat.dataset.boardNoteFloat));if(note){note.float=!note.float;save();render();toast(note.float?'Note can float':'Note uses safe placement',note.float?'It may deliberately overlap other notes.':'Accidental overlap will be avoided when you move it.');}return;}
  const boardNoteSize=event.target.closest('[data-board-note-size]');if(boardNoteSize){if(!requireCanvasEditing('board'))return;const note=state.boardNotes.find(item=>item.id===Number(boardNoteSize.dataset.boardNoteSize));if(note){if(note.w<205){note.w=210;note.h=175;}else if(note.w<260){note.w=280;note.h=230;}else{note.w=180;note.h=150;}save();render();}return;}
  const boardNoteRotate=event.target.closest('[data-board-note-rotate]');if(boardNoteRotate){if(!requireCanvasEditing('board'))return;const note=state.boardNotes.find(item=>item.id===Number(boardNoteRotate.dataset.boardNoteRotate));if(note){note.rotation=(Number(note.rotation)||0)>=4?-4:(Number(note.rotation)||0)+2;save();render();}return;}
  const boardNoteLock=event.target.closest('[data-board-note-lock]');if(boardNoteLock){if(!requireCanvasEditing('board'))return;const note=state.boardNotes.find(item=>item.id===Number(boardNoteLock.dataset.boardNoteLock));if(note){note.locked=!note.locked;save();render();toast(note.locked?'Note position locked':'Note unlocked');}return;}
  const boardNoteFront=event.target.closest('[data-board-note-front]');if(boardNoteFront){if(!requireCanvasEditing('board'))return;const note=state.boardNotes.find(item=>item.id===Number(boardNoteFront.dataset.boardNoteFront));if(note){note.z=Math.max(1,...state.boardNotes.map(item=>Number(item.z)||0))+1;save();render();}return;}
  const boardNoteGlance=event.target.closest('[data-board-note-glance]');if(boardNoteGlance){const note=state.boardNotes.find(item=>item.id===Number(boardNoteGlance.dataset.boardNoteGlance));if(note){note.showGlance=!note.showGlance;save();render();toast(note.showGlance?'Visible around the app':'Removed from Glance',note.showGlance?'This note can meet you outside the board.':'The note still remains on its board.');}return;}
  if(event.target.closest('[data-board-arrange]')){if(!requireCanvasEditing('board'))return;const notes=state.boardNotes.filter(note=>note.boardId===activeBoard().id&&!note.archived);notes.forEach((note,index)=>{if(note.float||note.locked)return;note.x=45+(index%4)*275;note.y=70+Math.floor(index/4)*220;note.rotation=(index%3-1)*1.2;});save();render();toast('Board arranged','Guided notes have breathing room. Floating and individually locked notes stayed in place.');return;}
  const snooze=event.target.closest('[data-glance-snooze]');if(snooze){const note=state.boardNotes.find(item=>item.id===Number(snooze.dataset.glanceSnooze));if(note){note.snoozedUntil=new Date(Date.now()+4*60*60*1000).toISOString();save();render();toast('Note snoozed','It will return to Glance in four hours.');}return;}
  const hideGlance=event.target.closest('[data-glance-hide]');if(hideGlance){const note=state.boardNotes.find(item=>item.id===Number(hideGlance.dataset.glanceHide));if(note){note.showGlance=false;save();render();}return;}
  if(event.target.closest('[data-glance-popup-close]')){$('#glancePopup').classList.remove('show');$('#glancePopup').setAttribute('aria-hidden','true');return;}
  if(event.target.closest('[data-library-new]')){openLibraryEditor();return;}
  const knowledgeOpen=event.target.closest('[data-knowledge-open]');if(knowledgeOpen){const item=state.library.find(entry=>entry.id===Number(knowledgeOpen.dataset.knowledgeOpen));if(item){const link=safeUrl(item.url);if(link){item.lastOpenedAt=new Date().toISOString();if(item.status==='ready')item.status='using';save();window.open(link,'_blank','noopener');}else openLibraryEditor(item);}return;}
  const knowledgeAttach=event.target.closest('[data-knowledge-attach]');if(knowledgeAttach){const [itemId,taskId]=knowledgeAttach.dataset.knowledgeAttach.split(':').map(Number),item=state.library.find(entry=>entry.id===itemId),task=state.tasks.find(entry=>entry.id===taskId);if(item&&task){item.taskId=task.id;item.status='using';task.sourceLibraryIds=[...new Set([...(task.sourceLibraryIds||[]),item.id])];knowledgeAttach.textContent='Attached';save();render();toast('Knowledge attached',`${item.title} now belongs with ${task.title}.`);}return;}
  const libraryEdit=event.target.closest('[data-library-edit]');if(libraryEdit){openLibraryEditor(state.library.find(item=>item.id===Number(libraryEdit.dataset.libraryEdit)));return;}
  const libraryFilter=event.target.closest('[data-library-filter]');if(libraryFilter){ui.libraryFilter=libraryFilter.dataset.libraryFilter;render();return;}
  const libraryStatus=event.target.closest('[data-library-status]');if(libraryStatus){const item=state.library.find(entry=>entry.id===Number(libraryStatus.dataset.libraryStatus));if(item){item.status=item.status==='done'?'ready':'done';item.usedAt=item.status==='done'?new Date().toISOString():null;save();render();toast(item.status==='done'?'Marked as tried':'Returned to Ready',item.status==='done'?'You converted a saved thing into experience.':'It can be activated again.');}return;}
  const libraryUse=event.target.closest('[data-library-use]');if(libraryUse){const item=state.library.find(entry=>entry.id===Number(libraryUse.dataset.libraryUse));if(item){item.status='using';item.lastOpenedAt=new Date().toISOString();save();render();const link=safeUrl(item.url);if(link)window.open(link,'_blank','noopener');toast('Moved into use','Finish it, attach it to work, or return it to Ready.');}return;}
  const libraryTask=event.target.closest('[data-library-task]');if(libraryTask){const item=state.library.find(entry=>entry.id===Number(libraryTask.dataset.libraryTask));if(item){const linked=state.tasks.find(task=>task.id===item.taskId);if(linked){toast('Already attached to a task',linked.title);return;}const area=state.taxonomy.find(entry=>entry.name==='Growth')||state.taxonomy[0],id=uid();state.tasks.unshift({id,title:`${item.action==='read'?'Read':item.action==='watch'?'Watch':'Try'}: ${item.title}`,area:area.name,category:area.categories[0]||'Learning',duration:item.minutes,energy:'medium',date:null,start:null,plan:'inbox',progress:0,next:safeUrl(item.url)?`Open ${safeUrl(item.url)}`:(item.note||item.why||'Decide the first step'),timer:true,publish:false,calendar:false,repeat:'none',postponed:0,paperMarks:{circle:false,tick:true,box:false,star:false},sourceLibraryId:item.id});item.status='using';item.taskId=id;save();render();toast('Turned into a task','The source stays attached in your library.');}return;}
  const taskFilter = event.target.closest('[data-task-filter]'); if (taskFilter) { ui.taskFilter = taskFilter.dataset.taskFilter; render(); return; }
  if(event.target.closest('[data-open-scan]')){openScan();return;}
  if(event.target.closest('[data-scan-add-line]')){addManualScanLine();return;}
  const opener = event.target.closest('[data-open]'); if (opener) { opener.dataset.open==='taskModal'?openTaskEditor():openModal(opener.dataset.open); return; }
  const closer = event.target.closest('[data-close]'); if (closer) { closeModal(closer.dataset.close); return; }
  const plannerTask=event.target.closest('[data-planner-task]');if(plannerTask&&!event.target.closest('[data-schedule]')){ui.plannerSelected=Number(plannerTask.dataset.plannerTask);render();toast('Task selected','Choose an hour on the timeline, or drag it there.');return;}
  const plannerHour=event.target.closest('[data-planner-time]');if(plannerHour&&ui.plannerSelected){const task=state.tasks.find(item=>item.id===ui.plannerSelected);if(task){task.date=ui.planningDate;task.start=plannerHour.dataset.plannerTime;task.plan='fixed';save();ui.plannerSelected=null;render();toast('Task placed on the day',`${task.title} is now at ${clock(mins(task.start))}.`);}return;}
  if (event.target.closest('[data-attention-open]')) { setView('all'); return; }
  const startNow = event.target.closest('[data-start-now]'); if (startNow) { const task=state.tasks.find(t=>t.id===Number(startNow.dataset.startNow)); if(task) startTimer(task); return; }
  const placeTask = event.target.closest('[data-place-task]'); if (placeTask) { const task=state.tasks.find(t=>t.id===Number(placeTask.dataset.placeTask)); if(task) ui.planningDate=task.date||iso(); setView('planner'); return; }
  const searchTask = event.target.closest('[data-search-task]'); if(searchTask){const task=state.tasks.find(t=>t.id===Number(searchTask.dataset.searchTask));ui.allQuery=task?.title||'';closeModal('searchModal');setView('all');return;}
  const searchBoard=event.target.closest('[data-search-board]');if(searchBoard){const note=state.boardNotes.find(item=>item.id===Number(searchBoard.dataset.searchBoard));if(note)ui.boardId=note.boardId;closeModal('searchModal');setView('board');return;}
  const searchLibrary=event.target.closest('[data-search-library]');if(searchLibrary){const item=state.library.find(entry=>entry.id===Number(searchLibrary.dataset.searchLibrary));ui.libraryQuery=item?.title||'';ui.libraryFilter='all';closeModal('searchModal');setView('library');return;}
  const taskMark=event.target.closest('[data-task-mark]');if(taskMark){const task=state.tasks.find(t=>t.id===Number(taskMark.dataset.taskMarkId));if(task){task.paperMarks||={circle:false,tick:false,box:false,star:false};const mark=taskMark.dataset.taskMark;task.paperMarks[mark]=!task.paperMarks[mark];save();render();toast(task.paperMarks[mark]?`${taskMark.title} marked`:`${taskMark.title} removed`,'The mark changed on both Paper and Tasks.');}return;}
  const paperEdit=event.target.closest('[data-paper-edit]');if(paperEdit){const task=state.tasks.find(t=>t.id===Number(paperEdit.dataset.paperEdit));if(task)openTaskEditor(task);return;}
  const paperComplete=event.target.closest('[data-paper-complete]');if(paperComplete){const task=state.tasks.find(t=>t.id===Number(paperComplete.dataset.paperComplete));if(task)updateProgress(task.id,task.progress>=100?0:100);return;}
  const paperMode=event.target.closest('[data-paper-mode]');if(paperMode){if(!requireCanvasEditing('paper'))return;const [kind,idText]=paperMode.dataset.paperMode.split(':'),id=Number(idText);if(kind==='task'){const task=state.tasks.find(item=>item.id===id),visible=state.tasks.filter(matchesTaskFilter),current=state.paper.layout[id]||paperPlan(visible).positions.get(id)||{x:72,y:142};state.paper.layout[id]={...current,unit:'px',mode:current.mode==='float'?'placed':'float',z:Number(current.z)||5};}else{const note=state.paper.texts.find(item=>item.id===id);if(note)note.mode=note.mode==='float'?'placed':'float';}save();render();toast(kind==='task'?(state.paper.layout[id].mode==='float'?'Task can float':'Task returned to guided placement'):'Text placement updated','Guided items avoid collisions. Floating items may overlap deliberately.');return;}
  const paperLayer=event.target.closest('[data-paper-layer]');if(paperLayer){if(!requireCanvasEditing('paper'))return;const note=state.paper.texts.find(item=>item.id===Number(paperLayer.dataset.paperLayer));if(note){const layers=[...Object.values(state.paper.layout),...state.paper.texts];note.z=Math.max(5,...layers.map(item=>Number(item.z)||0))+1;save();render();}return;}
  const paperRotate=event.target.closest('[data-paper-rotate]');if(paperRotate){if(!requireCanvasEditing('paper'))return;const note=state.paper.texts.find(item=>item.id===Number(paperRotate.dataset.paperRotate));if(note){note.rotation=(Number(note.rotation)||0)>=4?-3:(Number(note.rotation)||0)+2;save();render();}return;}
  const paperDeleteText=event.target.closest('[data-paper-delete-text]');if(paperDeleteText){if(!requireCanvasEditing('paper'))return;state.paper.texts=state.paper.texts.filter(item=>item.id!==Number(paperDeleteText.dataset.paperDeleteText));save();render();toast('Paper note removed','Tasks and other paper objects stayed in place.');return;}
  if(event.target.closest('[data-paper-arrange]')){if(!requireCanvasEditing('paper'))return;Object.keys(state.paper.layout).forEach(id=>{if(state.paper.layout[id]?.mode!=='float'&&!state.paper.layout[id]?.locked)delete state.paper.layout[id];});const guidedBottom=Math.max(980,...paperPlan(state.tasks.filter(matchesTaskFilter)).headings.map(item=>item.y+50));state.paper.texts.forEach((note,index)=>{if(note.mode==='float'||note.locked)return;note.unit='px';note.x=72+(index%3)*369;note.y=guidedBottom+35+Math.floor(index/3)*120;});save();render();toast('Paper arranged safely','Guided items were packed without overlap. Floating and individually locked items stayed in place.');return;}
  if(event.target.closest('[data-paper-order]')){if(!requireCanvasEditing('paper'))return;const open=state.tasks.filter(t=>t.progress<100);state.paper.sequence=open.sort((a,b)=>{const pa=state.paper.layout[a.id]||paperPosition(a,open.indexOf(a),open),pb=state.paper.layout[b.id]||paperPosition(b,open.indexOf(b),open);return Math.abs(pa.y-pb.y)>4?pa.y-pb.y:pa.x-pb.x;}).map(t=>t.id);save();render();reward(10,'Your visual sequence now guides task views');toast('Page order saved','Sequence numbers now appear across the website.');return;}
  if(event.target.closest('[data-clear-ink]')){if(!requireCanvasEditing('paper'))return;state.paper.strokes=[];state.paper.shapes=[];save();drawPaperCanvas();toast('Ink cleared','Tasks and written notes stayed on the page.');return;}
  const taskEl = event.target.closest('[data-task]');
  if (taskEl) {
    const task = state.tasks.find(t => t.id === Number(taskEl.dataset.task)); if (!task) return;
    if (event.target.closest('[data-action="complete"]')) updateProgress(task.id, task.progress >= 100 ? 0 : 100);
    else if (event.target.closest('[data-action="edit"]')) openTaskEditor(task);
    else if (event.target.closest('[data-action="timer"]')) startTimer(task);
    else if (event.target.closest('[data-action="calendar"]')) exportICS(task);
    else if (event.target.closest('[data-action="publish"]')) { task.publish = !task.publish; save(); render(); toast(task.publish ? 'Visible with privacy' : 'Removed from shared view', task.publish ? 'Visitors see only its public label.' : 'This task is private again.'); }
    return;
  }
  const rescue = event.target.closest('[data-rescue-open]'); if (rescue) { ui.rescueId = Number(rescue.dataset.rescueOpen); $('#rescueName').textContent = state.tasks.find(t=>t.id===ui.rescueId)?.title || ''; openModal('rescueModal'); return; }
  const rescueAction = event.target.closest('[data-rescue]'); if (rescueAction) {
    const task = state.tasks.find(t => t.id === ui.rescueId); if (!task) return;
    if (rescueAction.dataset.rescue === 'tiny') { task.duration = 15; task.next = `Open the task and work for 15 minutes`; task.postponed = 0; }
    if (rescueAction.dataset.rescue === 'unclear') { task.next = 'Write the next physical action before doing anything else'; task.postponed = 0; }
    if (rescueAction.dataset.rescue === 'later') { task.date = iso(addDays(2)); task.plan = 'today'; task.postponed = 0; }
    if (rescueAction.dataset.rescue === 'drop') state.tasks = state.tasks.filter(t => t.id !== task.id);
    if(!task.replanRewarded){task.replanRewarded=true;state.profile.accuratePlans++;reward(10, 'A conscious decision protects attention');}
    save(); closeModal('rescueModal'); toast('Task recovered', 'Your plan now reflects reality.'); render(); return;
  }
  const schedule = event.target.closest('[data-schedule]'); if (schedule) { const t = state.tasks.find(x=>x.id===Number(schedule.dataset.schedule)); t.start = schedule.dataset.time; t.plan = 'fixed'; save(); reward(10,'A flexible commitment has a home'); toast('Time chosen', `${t.title} is now at ${clock(mins(t.start))}.`); render(); return; }
  const shift = event.target.closest('[data-date-shift]'); if (shift) { ui.planningDate = iso(addDays(Number(shift.dataset.dateShift), new Date(`${ui.planningDate}T12:00:00`))); render(); return; }
  if (event.target.closest('[data-date-today]')) { ui.planningDate = iso(); render(); return; }
  const filter = event.target.closest('[data-filter]'); if (filter) { ui.space = filter.dataset.filter === 'all' ? null : filter.dataset.filter; ui.category = null; render(); return; }
  const space = event.target.closest('[data-space]'); if (space) { ui.view='inbox'; ui.space=space.dataset.space; ui.category=null; render(); return; }
  const category = event.target.closest('[data-category]'); if (category) { ui.view='inbox'; ui.category=category.dataset.category; ui.space=category.dataset.categoryArea||null; render(); return; }
  const requestFilter = event.target.closest('[data-request-filter]'); if(requestFilter){ui.requestFilter=requestFilter.dataset.requestFilter;render();return;}
  if(event.target.closest('[data-clear-request-history]')){clearRequestHistory();return;}
  const reqAction = event.target.closest('[data-request-action]'); if (reqAction) {
    const card = reqAction.closest('[data-request]'), r = state.requests.find(x=>x.id===Number(card.dataset.request));
    if(!r)return;
    if(reqAction.dataset.requestAction==='delete'){deleteRequest(r.id);return;}
    if(r.status!=='pending')return;
    if (reqAction.dataset.requestAction === 'accept') { r.status='approved';r.resolvedAt=new Date().toISOString(); state.tasks.push({ id:uid(), title:r.purpose, area:'Career', category:'Meetings', duration:r.duration, energy:'medium', date:r.date, start:r.start, plan:'fixed', progress:0, next:r.outcome, timer:false, publish:true, publicTitle:'Scheduled conversation', calendar:true, postponed:0 }); state.tasks.push({ id:uid(), title:`Prepare for: ${r.purpose}`, area:'Career', category:'Meetings', duration:20, energy:'low', date:r.date, start:null, plan:'today', progress:0, next:'Review the request context and expected result', timer:true, publish:false, calendar:false, postponed:0 }); reward(15,'A clear commitment was created'); toast('Request approved','Event and preparation task were added. The request moved to History.'); }
    if (reqAction.dataset.requestAction === 'shorten') { r.duration=30; r.impact='Reduced to 30 minutes; your workout keeps a 30-minute buffer.'; r.safe=true; toast('Shorter option prepared','The request now fits your day better.'); }
    if (reqAction.dataset.requestAction === 'reject') { r.status='declined';r.resolvedAt=new Date().toISOString();state.profile.boundaries++; reward(10,'Protecting priorities is productive'); toast('Request declined','Your planned work remains protected. The request moved to History.'); }
    save(); render(); return;
  }
  const setting = event.target.closest('[data-setting]'); if (setting) { state.share[setting.dataset.setting]=!state.share[setting.dataset.setting]; save(); render(); return; }
  if (event.target.closest('[data-copy-link]')) { const input=$('#shareLink'); navigator.clipboard?.writeText(input.value); toast('Private link copied','It will expire according to your access rules.'); return; }
  if (event.target.closest('[data-preview-share]')) { visitorPreview(); return; }
  const removeWindow=event.target.closest('[data-remove-window]'); if(removeWindow){state.availability=state.availability.filter(a=>a.id!==Number(removeWindow.dataset.removeWindow));save();render();toast('Window removed');return;}
  if (event.target.closest('[data-visitor-pick]')) { event.target.textContent='Selected ✓'; return; }
  if (event.target.closest('[data-submit-demo-request]')) { closeModal('shareModal'); toast('Request submitted','It would now appear in your approval inbox.'); return; }
});

document.addEventListener('input', event => {
  if (event.target.matches('[data-progress]')) event.target.nextElementSibling.textContent = `${event.target.value}%`;
  if (event.target.id === 'globalSearch') renderSearchResults(event.target.value);
  if (event.target.id === 'allSearch') { ui.allQuery = event.target.value; const caret=event.target.selectionStart; render(); const next=$('#allSearch'); next.focus(); next.setSelectionRange(caret,caret); }
  if(event.target.id==='librarySearch'){ui.libraryQuery=event.target.value;const caret=event.target.selectionStart;render();const next=$('#librarySearch');next?.focus();next?.setSelectionRange(caret,caret);}
  if(event.target.matches('[data-scan-text]')){const item=scanRuntime.candidates.find(x=>x.id===Number(event.target.dataset.scanText));if(item)item.text=event.target.value;updateScanSelection();}
});
document.addEventListener('change', event => {
  if (event.target.matches('[data-progress]')) updateProgress(Number(event.target.closest('[data-task]').dataset.task), event.target.value);
  if(event.target.matches('[data-scan-include]')){const item=scanRuntime.candidates.find(x=>x.id===Number(event.target.dataset.scanInclude));if(item)item.included=event.target.checked;event.target.closest('.scan-candidate')?.classList.toggle('excluded',!event.target.checked);updateScanSelection();}
  if(event.target.matches('[data-scan-kind]')){const item=scanRuntime.candidates.find(x=>x.id===Number(event.target.dataset.scanKind));if(item)item.kind=event.target.value;}
  if(event.target.matches('[data-scan-important]')){const item=scanRuntime.candidates.find(x=>x.id===Number(event.target.dataset.scanImportant));if(item)item.important=event.target.checked;}
});

let plannerDragId=null;
document.addEventListener('dragstart',event=>{const source=event.target.closest('[data-planner-task]');if(!source)return;plannerDragId=Number(source.dataset.plannerTask);event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',String(plannerDragId));});
document.addEventListener('dragover',event=>{const target=event.target.closest('[data-planner-time]');if(!target)return;event.preventDefault();event.dataTransfer.dropEffect='move';target.classList.add('drag-over');});
document.addEventListener('dragleave',event=>{event.target.closest('[data-planner-time]')?.classList.remove('drag-over');});
document.addEventListener('drop',event=>{const target=event.target.closest('[data-planner-time]');if(!target)return;event.preventDefault();target.classList.remove('drag-over');const id=plannerDragId||Number(event.dataTransfer.getData('text/plain')),task=state.tasks.find(item=>item.id===id);plannerDragId=null;if(!task)return;task.date=ui.planningDate;task.start=target.dataset.plannerTime;task.plan='fixed';save();render();toast('Task placed on the day',`${task.title} is now at ${clock(mins(task.start))}.`);});
document.addEventListener('dragend',()=>{$$('[data-planner-time].drag-over').forEach(el=>el.classList.remove('drag-over'));plannerDragId=null;});

$('#captureTrigger').addEventListener('click',()=>openTaskEditor()); $('#mobileAdd').addEventListener('click',()=>openTaskEditor());
$('#searchTrigger').addEventListener('click',openSearch); $('#mobileSearch')?.addEventListener('click',openSearch);
$('#menuBtn').addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',String(open));});
$('#mobileMore')?.addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('open');$('#mobileMore').setAttribute('aria-expanded',String(open));$('#menuBtn').setAttribute('aria-expanded',String(open));});
$('#menuBackdrop').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');$('#mobileMore')?.setAttribute('aria-expanded','false');});
$('#toastAction').addEventListener('click',()=>{const action=toastAction;toastAction=null;clearTimeout(toastTimer);$('#toast').classList.remove('show');$('#toastAction').hidden=true;action?.run?.();});
$('#applyUpdate').addEventListener('click',()=>location.reload());
$('#dismissUpdate').addEventListener('click',()=>{$('#updateNudge').hidden=true;});
$('#focusBtn').addEventListener('click',toggleFocusMode);$('#focusSidebar').addEventListener('click',toggleFocusMode);$('#focusExit').addEventListener('click',()=>setFocusMode(false));
$('#focusExit').addEventListener('pointerdown',event=>{event.preventDefault();setFocusMode(false);},{passive:false});
$('#accentChoice').addEventListener('click',event=>{const choice=event.target.closest('[data-accent]');if(choice)applyAccent(choice.dataset.accent,{announce:true});});
$('#settingsBtn').addEventListener('click',openSettings);
$('#reminderBtn').addEventListener('click',toggleReminders);
$('#lockWorkspace').addEventListener('click',async()=>{try{await fetch('/api/logout',{method:'POST'});}finally{location.replace('/');}});
$('#scanCamera').addEventListener('change',event=>{acceptScanFile(event.target.files?.[0]);event.target.value='';});
$('#scanUpload').addEventListener('change',event=>{acceptScanFile(event.target.files?.[0]);event.target.value='';});
$('#scanRetry').addEventListener('click',recognizeScan);$('#scanImport').addEventListener('click',importScanToPaper);
$('#scanMode').addEventListener('change',event=>{$('#scanQualityTip').textContent=event.target.value==='handwriting'?'Handwriting mode uses strong local contrast and sparse-text reading. Keep the page flat and fill most of the photo.':event.target.value==='printed'?'Printed mode is faster for clean documents and screenshots.':'Auto enhance corrects lighting and tries two reading styles. Choose Handwriting for notes written with a pen.';if(scanRuntime.file)recognizeScan();});
$('#scanLanguage').addEventListener('change',()=>{if(scanRuntime.file)recognizeScan();});
$('#exportBackup').addEventListener('click',exportBackup);
$('#clearCompletedHistory').addEventListener('click',clearCompletedHistory);
$('#resetMomentum').addEventListener('click',resetMomentum);
$('#resetRhythm').addEventListener('click',resetRhythm);
$('#importBackup').addEventListener('change',event=>{const file=event.target.files?.[0];if(file)importBackupFile(file);event.target.value='';});
$('#installApp').addEventListener('click',installWebsite);
$('#installNudgeAction').addEventListener('click',installWebsite);
$('#installNudgeDismiss').addEventListener('click',()=>hideInstallNudge(true));
$('#reminderLead').addEventListener('change',event=>{state.preferences.reminderLead=Number(event.target.value);save();toast('Reminder timing saved',`Alerts will appear ${event.target.value} minutes before scheduled work.`);});
$('#addArea').addEventListener('click',()=>{const palette=['#ff7962','#75a6ff','#9cbe52','#9a7bc1','#f2b84b'];taxonomyDraft.push({name:`Area ${taxonomyDraft.length+1}`,color:palette[taxonomyDraft.length%palette.length],originalName:null,categories:[{name:'General',originalName:null}]});renderTaxonomyEditor();});
$('#saveTaxonomy').addEventListener('click',saveTaxonomy);
$('#taxonomyEditor').addEventListener('input',event=>{if(event.target.matches('[data-tax-area-name]'))taxonomyDraft[Number(event.target.dataset.taxAreaName)].name=event.target.value;if(event.target.matches('[data-tax-area-color]'))taxonomyDraft[Number(event.target.dataset.taxAreaColor)].color=event.target.value;if(event.target.matches('[data-tax-category-name]')){const [areaIndex,categoryIndex]=event.target.dataset.taxCategoryName.split(':').map(Number);taxonomyDraft[areaIndex].categories[categoryIndex].name=event.target.value;}});
$('#taxonomyEditor').addEventListener('click',event=>{
  const add=event.target.closest('[data-tax-add-category]');if(add){taxonomyDraft[Number(add.dataset.taxAddCategory)].categories.push({name:'New category',originalName:null});renderTaxonomyEditor();return;}
  const removeCategory=event.target.closest('[data-tax-remove-category]');if(removeCategory){const [areaIndex,categoryIndex]=removeCategory.dataset.taxRemoveCategory.split(':').map(Number),area=taxonomyDraft[areaIndex],category=area.categories[categoryIndex];if(category.originalName&&state.tasks.some(task=>task.area===area.originalName&&task.category===category.originalName)){toast('Category is still in use','Move its tasks before removing it.');return;}if(area.categories.length===1){toast('Keep at least one category in each area');return;}area.categories.splice(categoryIndex,1);renderTaxonomyEditor();return;}
  const removeArea=event.target.closest('[data-tax-remove-area]');if(removeArea){const areaIndex=Number(removeArea.dataset.taxRemoveArea),area=taxonomyDraft[areaIndex];if(area.originalName&&state.tasks.some(task=>task.area===area.originalName)){toast('Area is still in use','Move its tasks before removing it.');return;}if(taxonomyDraft.length===1){toast('Keep at least one life area');return;}taxonomyDraft.splice(areaIndex,1);renderTaxonomyEditor();}
});
$('#taskArea').addEventListener('change',()=>setTaskCategories($('#taskArea').value));
$('#taskPlan').addEventListener('change',updateTaskPlanFields);
$('#boardForm').addEventListener('submit',event=>{event.preventDefault();const board={id:`board-${uid()}`,name:$('#boardName').value.trim(),theme:$('#boardTheme').value,createdAt:new Date().toISOString()};if(!board.name)return;state.boards.push(board);ui.boardId=board.id;save();closeModal('boardModal');render();toast('Board created','A new visual space is ready for your thoughts.');});
$('#boardNoteForm').addEventListener('submit',event=>{event.preventDefault();const date=$('#boardNoteDate').value,time=$('#boardNoteTime').value||'09:00',values={type:$('#boardNoteType').value,text:$('#boardNoteText').value.trim(),color:$('#boardNoteColor').value,source:$('#boardNoteSource').value.trim(),showGlance:$('#boardNoteGlance').checked,popup:$('#boardNotePopup').checked,notifyAt:date?new Date(`${date}T${time}:00`).toISOString():null,updatedAt:new Date().toISOString()};if(!values.text)return;const existing=state.boardNotes.find(note=>note.id===ui.boardNoteId);if(existing)Object.assign(existing,values);else{const peers=state.boardNotes.filter(note=>note.boardId===activeBoard().id&&!note.archived),index=peers.length;state.boardNotes.push({id:uid(),boardId:activeBoard().id,x:45+(index%4)*275,y:70+Math.floor(index/4)*220,w:210,h:175,rotation:(index%3-1)*1.2,z:Math.max(1,...state.boardNotes.map(note=>Number(note.z)||0))+1,float:false,locked:false,archived:false,createdAt:new Date().toISOString(),...values});}save();ui.boardNoteId=null;closeModal('boardNoteModal');render();toast(existing?'Board note updated':'Pinned to your board',values.showGlance?'It can also appear in Glance around the app.':'It will stay on this board.');});
$('#boardNoteDelete').addEventListener('click',()=>{if(!ui.boardNoteId)return;const index=state.boardNotes.findIndex(note=>note.id===ui.boardNoteId),removed=clone(state.boardNotes[index]);state.boardNotes.splice(index,1);ui.boardNoteId=null;save();closeModal('boardNoteModal');render();toast('Board note removed','It can be restored for the next few seconds.',{label:'Undo',run:()=>{if(!state.boardNotes.some(note=>note.id===removed.id))state.boardNotes.splice(Math.max(0,index),0,removed);save();render();toast('Board note restored');}});});
$('#libraryForm').addEventListener('submit',event=>{event.preventDefault();const values={title:$('#libraryTitle').value.trim(),type:$('#libraryType').value,url:$('#libraryUrl').value.trim(),why:$('#libraryWhy').value.trim(),context:$('#libraryContext').value.trim(),action:$('#libraryAction').value,minutes:Number($('#libraryMinutes').value),tags:$('#libraryTags').value.split(',').map(tag=>tag.trim()).filter(Boolean),status:$('#libraryStatus').value,note:$('#libraryNote').value.trim(),updatedAt:new Date().toISOString()};if(!values.title)return;const existing=state.library.find(item=>item.id===ui.libraryId);if(existing)Object.assign(existing,values);else state.library.unshift({id:uid(),createdAt:new Date().toISOString(),...values});save();ui.libraryId=null;closeModal('libraryModal');ui.view='library';render();toast(existing?'Library item updated':'Saved with a purpose',values.context?`It can be found through “${values.context}”.`:'Add a use case later so it appears at the right moment.');});
$('#libraryDelete').addEventListener('click',()=>{if(!ui.libraryId)return;const index=state.library.findIndex(item=>item.id===ui.libraryId),removed=clone(state.library[index]),taskLinks=state.tasks.filter(task=>task.sourceLibraryId===removed.id||task.sourceLibraryIds?.includes(removed.id)).map(task=>({id:task.id,sourceLibraryId:task.sourceLibraryId||null,sourceLibraryIds:clone(task.sourceLibraryIds||[])}));taskLinks.forEach(link=>{const task=state.tasks.find(entry=>entry.id===link.id);if(task.sourceLibraryId===removed.id)delete task.sourceLibraryId;if(Array.isArray(task.sourceLibraryIds))task.sourceLibraryIds=task.sourceLibraryIds.filter(id=>id!==removed.id);});state.library.splice(index,1);ui.libraryId=null;save();closeModal('libraryModal');render();toast('Library item deleted','Its task links were safely removed. It can be restored for the next few seconds.',{label:'Undo',run:()=>{if(!state.library.some(item=>item.id===removed.id))state.library.splice(Math.max(0,index),0,removed);taskLinks.forEach(link=>{const task=state.tasks.find(entry=>entry.id===link.id);if(task){if(link.sourceLibraryId)task.sourceLibraryId=link.sourceLibraryId;task.sourceLibraryIds=link.sourceLibraryIds;}});save();render();toast('Library item restored','Its task links are back too.');}});});
$('#taskForm').addEventListener('submit', event => {
  event.preventDefault(); const plan=$('#taskPlan').value, date=$('#taskDate').value || (plan==='inbox'?null:iso());
  const values={title:$('#taskTitle').value.trim(),area:$('#taskArea').value,category:$('#taskCategory').value,duration:Number($('#taskDuration').value),energy:$('#taskEnergy').value,plan,date:plan==='inbox'?null:date,start:plan==='fixed'?$('#taskStart').value:null,windowStart:$('#taskStart').value,windowEnd:$('#taskEnd').value,decideBy:$('#decideBy').value||iso(),next:$('#taskNext').value.trim(),timer:$('#taskTimer').checked,publish:$('#taskPublish').checked,publicTitle:'Focused work',calendar:$('#taskCalendar').checked,repeat:$('#taskRepeat').value,paperMarks:{circle:$('#taskCircle').checked,tick:$('#taskReady').checked,box:$('#taskBox').checked,star:$('#taskStar').checked},updatedAt:new Date().toISOString()};
  const existing=state.tasks.find(t=>t.id===ui.editTaskId);
  if(existing){Object.assign(existing,values);toast('Task updated','Paper, planner and task views now use the changes.');}
  else{state.tasks.unshift({id:uid(),progress:0,postponed:0,createdAt:new Date().toISOString(),...values});reward(5,'Your mind can release the task');toast('Captured','The task is safely in your command center and cloud.');}
  save(); ui.editTaskId=null; closeModal('taskModal'); render();
});
$('#taskDelete').addEventListener('click',()=>{const id=ui.editTaskId;if(!id)return;const index=state.tasks.findIndex(task=>task.id===id),removed=clone(state.tasks[index]),layout=clone(state.paper.layout[id]||null),sequenceIndex=state.paper.sequence.indexOf(id),libraryLinks=state.library.filter(item=>item.taskId===id).map(item=>({id:item.id,status:item.status}));libraryLinks.forEach(link=>{const item=state.library.find(entry=>entry.id===link.id);delete item.taskId;if(item.status==='using')item.status='ready';});state.tasks.splice(index,1);delete state.paper.layout[id];state.paper.sequence=state.paper.sequence.filter(x=>x!==id);ui.editTaskId=null;save();closeModal('taskModal');render();toast('Task deleted','It was removed from Paper and its Knowledge links were released.',{label:'Undo',run:()=>{if(!state.tasks.some(task=>task.id===id))state.tasks.splice(Math.max(0,index),0,removed);if(layout)state.paper.layout[id]=layout;if(sequenceIndex>=0&&!state.paper.sequence.includes(id))state.paper.sequence.splice(sequenceIndex,0,id);libraryLinks.forEach(link=>{const item=state.library.find(entry=>entry.id===link.id);if(item){item.taskId=id;item.status=link.status;}});save();render();toast('Task restored','Its Paper position, details and Knowledge links are back.');}});});
$('#freeForm').addEventListener('submit',event=>{event.preventDefault();state.availability.push({id:uid(),date:$('#freeDate').value,start:$('#freeStart').value,end:$('#freeEnd').value,label:$('#freeLabel').value,max:Number($('#freeMax').value)});save();closeModal('freeModal');toast('Free time published','Visitors can request this window, subject to approval.');render();});
$('#timerToggle').addEventListener('click',()=>{if(!ui.timer)return;ui.timer.running=!ui.timer.running;$('#timerToggle').textContent=ui.timer.running?'Ⅱ':'▶';});
$('#timerStop').addEventListener('click',finishTimer); $('#timerClose').addEventListener('click',closeTimer);
$('#resetBtn').addEventListener('click',()=>{state=clone(seed);state.tasks.forEach(task=>{task.paperMarks={circle:false,tick:false,box:false,star:false};task.repeat='none';});state.paper={title:'Everything on my mind',strokes:[],shapes:[],texts:[{id:9001,x:7.5,y:11.5,text:'Do what matters. Leave room to breathe.',type:'note'}],layout:{},sequence:[],imports:[]};state.preferences={reminders:false,reminderLead:10,notified:{}};normalizeStateShape();save();ui={view:'today',space:null,category:null,planningDate:iso(),rescueId:null,timer:null,taskFilter:'open',requestFilter:'pending',plannerSelected:null,boardId:'workstation',boardNoteId:null,boardMenuId:null,libraryId:null,libraryFilter:'active',libraryQuery:''};closeTimer();render();updateReminderUI();toast('Demo restored','All sample data is back.');});
$$('.modal-layer').forEach(layer=>layer.addEventListener('click',e=>{if(e.target===layer)closeModal(layer.id);}));
document.addEventListener('keydown',e=>{
  const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName),openLayer=$('.modal-layer.open');
  if(e.key==='Tab'&&openLayer){const focusable=$$('button:not([disabled]),[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',openLayer).filter(el=>!el.hidden&&el.offsetParent!==null);if(focusable.length){const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
  if((e.key==='c'||e.key==='C')&&!typing&&!openLayer)openTaskEditor();if(e.key==='/'&&!typing&&!openLayer){e.preventDefault();openSearch();}if(e.key==='Escape'&&openLayer)closeModal(openLayer.id);else if(e.key==='Escape'&&document.body.classList.contains('focus-mode'))setFocusMode(false);
});

const now=new Date();$('#dateDay').textContent=now.getDate();$('#dateMonth').textContent=now.toLocaleDateString('en-US',{month:'short'}).toUpperCase();$('#taskDate').value=iso();$('#taskDate').min=iso();$('#decideBy').value=iso();$('#freeDate').value=iso(addDays(1));$('#freeDate').min=iso();populateAreaSelect($('#taskArea'));setTaskCategories($('#taskArea').value);populateAreaSelect($('#scanArea'));
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;document.body.classList.add('install-ready');showInstallNudge();});
window.addEventListener('appinstalled',()=>{installPrompt=null;document.body.classList.remove('install-ready');hideInstallNudge(true);$('#installApp').hidden=true;toast('Life Command Center installed','Open it from your home screen or app list.');});
function showUpdateNudge(){updateAvailable=true;const nudge=$('#updateNudge');if(nudge)nudge.hidden=false;}
async function registerServiceWorker(){
  try{
    const registration=await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});
    if(registration.waiting)showUpdateNudge();
    registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdateNudge();});});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updateAvailable)showUpdateNudge();});
    const check=()=>{if(document.visibilityState==='visible')registration.update().catch(()=>{});};
    document.addEventListener('visibilitychange',check);setInterval(check,30*60*1000);
    if(state.preferences?.reminders)registerBackgroundReminders();
  }catch{}
}
if('serviceWorker' in navigator)window.addEventListener('load',registerServiceWorker);
window.addEventListener('online',()=>{setSyncStatus(sync.dirty?'Saving changes…':'Back online',sync.dirty?'saving':'synced');if(sync.dirty)pushCloudState();else pullCloudState();});
window.addEventListener('offline',()=>setSyncStatus('Offline · saved in browser','offline'));
let canvasResizeTimer=null;window.addEventListener('resize',()=>{clearTimeout(canvasResizeTimer);canvasResizeTimer=setTimeout(()=>{if(['paper','board'].includes(ui.view)&&canvasView[ui.view].zoom==='fit')applyCanvasView(ui.view,{preserveCenter:true});},120);});
window.addEventListener('popstate',()=>{const route=location.hash.slice(1);if(APP_VIEWS.has(route))setView(route,{history:false});});
const initialRoute=location.hash.slice(1);if(APP_VIEWS.has(initialRoute))ui.view=initialRoute;else if(!location.hash)history.replaceState({view:'today'},'','#today');
if(location.hash.startsWith('#invite=')){setTimeout(visitorPreview,100);} render(); updateTaskPlanFields();updateReminderUI(); initializeCloud();setTimeout(openSharedLibraryCapture,450); setTimeout(showInstallNudge,1400); setInterval(scanReminders,30000); scanReminders();
