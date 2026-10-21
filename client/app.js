const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const DAY = 86400000;
const iso = (date = new Date()) => {
  const d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const addDays = (n, date = new Date()) => new Date(new Date(date).getTime() + n * DAY);
const uid = () => Date.now() + Math.floor(Math.random() * 9999);
const esc = (value = '') => { const d = document.createElement('div'); d.textContent = value; return d.innerHTML; };
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
  profile: { xp: 340, streak: 5, sessions: 8, accuratePlans: 6, lastProductive: iso(addDays(-1)) },
  share: { token: 'focus-7K3P', oneTime: true, expires: true, approval: true, questions: true, privacy: true },
  taxonomy: DEFAULT_TAXONOMY
};

const STORE = 'life-command-v3';
const clone = obj => JSON.parse(JSON.stringify(obj));
let state = (() => { try { return { ...clone(seed), ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return clone(seed); } })();
let ui = { view: 'today', space: null, category: null, planningDate: iso(), rescueId: null, timer: null, taskFilter: 'open', plannerSelected: null };
let timerHandle = null;
let sync = { ready: false, revision: 0, dirty: false, saving: false, timer: null, user: null };
let taxonomyDraft = null;
let installPrompt = null;
function normalizeStateShape() {
  state.paper ||= { title: 'Everything on my mind', strokes: [], shapes: [], texts: [{ id: 9001, x: 7.5, y: 11.5, text: 'Do what matters. Leave room to breathe.', type: 'note' }], layout: {}, sequence: [] };
  state.paper.strokes ||= []; state.paper.shapes ||= []; state.paper.texts ||= []; state.paper.layout ||= {}; state.paper.sequence ||= []; state.paper.imports ||= [];
  state.preferences ||= { reminders: false, reminderLead: 10, notified: {} };
  state.tasks ||= [];
  state.taxonomy = Array.isArray(state.taxonomy) && state.taxonomy.length ? state.taxonomy : clone(DEFAULT_TAXONOMY);
  state.taxonomy = state.taxonomy.map((area,index)=>({ name:String(area.name||`Area ${index+1}`).trim(), color:/^#[0-9a-f]{6}$/i.test(area.color||'')?area.color:DEFAULT_TAXONOMY[index%DEFAULT_TAXONOMY.length].color, categories:[...new Set((area.categories||[]).map(String).map(x=>x.trim()).filter(Boolean))] }));
  state.tasks.forEach(task=>{
    let area=state.taxonomy.find(item=>item.name===task.area);
    if(!area){area={name:task.area||'Unsorted',color:'#9cbe52',categories:[]};state.taxonomy.push(area);}
    if(task.category&&!area.categories.includes(task.category))area.categories.push(task.category);
  });
  state.tasks.forEach(task => { task.paperMarks ||= { circle: task.paperEmphasis === 'circle', tick: false, box: task.paperEmphasis === 'box', star: task.paperEmphasis === 'star' }; task.repeat ||= 'none'; });
}
normalizeStateShape();
function setSyncStatus(text, mode = '') {
  const el = $('#syncStatus'); if (!el) return; el.textContent = text; el.dataset.mode = mode;
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
  if (state.preferences.reminders) { state.preferences.reminders=false; save(); updateReminderUI(); toast('Browser reminders paused'); return; }
  const permission = await Notification.requestPermission();
  state.preferences.reminders = permission === 'granted'; save(); updateReminderUI();
  toast(state.preferences.reminders?'Browser reminders enabled':'Permission was not granted',state.preferences.reminders?'Scheduled tasks can alert you while the website is open.':'You can change notification permission in your browser settings.');
}
function scanReminders() {
  if (!state.preferences?.reminders || !('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date(), lead = Number(state.preferences.reminderLead || 10);
  state.tasks.filter(t=>t.progress<100&&t.date&&t.start).forEach(task=>{
    const due = new Date(`${task.date}T${task.start}:00`), minutes=(due-now)/60000, key=`${task.id}:${task.date}:${task.start}`;
    if(minutes<=lead&&minutes>=-5&&!state.preferences.notified[key]){
      new Notification(task.title,{body:`${minutes<=0?'Scheduled now':`Starts in ${Math.ceil(minutes)} minutes`} · ${task.next||'Open Life Command Center'}`,tag:key});
      state.preferences.notified[key]=new Date().toISOString(); save();
    }
  });
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
  $('#reminderLead').value=String(state.preferences.reminderLead||10);updateCompletedHistoryControl();openModal('settingsModal');
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
  const ids=new Set(completed.map(task=>task.id));
  state.tasks=state.tasks.filter(task=>!ids.has(task.id));
  state.paper.sequence=state.paper.sequence.filter(id=>!ids.has(id));
  ids.forEach(id=>delete state.paper.layout[id]);
  if(state.preferences?.notified)Object.keys(state.preferences.notified).forEach(key=>{if(ids.has(Number(key.split(':')[0])))delete state.preferences.notified[key];});
  if(ui.plannerSelected&&ids.has(ui.plannerSelected))ui.plannerSelected=null;
  if(ui.timer&&ids.has(ui.timer.taskId))closeTimer();
  state.meta={...(state.meta||{}),completedHistoryClearedAt:new Date().toISOString(),completedHistoryClearedCount:completed.length};
  save();render();updateCompletedHistoryControl();toast('Completed history cleared',`${completed.length} completed task${completed.length===1?' was':'s were'} removed everywhere. Your XP and streak were kept.`);
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

function reward(points, text) {
  state.profile.xp += points; save();
  $('#xpBurstValue').textContent = `+${points} XP`; $('#xpBurstText').textContent = text;
  $('#xpBurst').classList.add('show'); setTimeout(() => $('#xpBurst').classList.remove('show'), 1900);
}
function toast(title, text = 'Your change is ready.') {
  $('#toastTitle').textContent = title; $('#toastText').textContent = text;
  $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 2200);
}
function openModal(id) { $(`#${id}`).classList.add('open'); $(`#${id}`).setAttribute('aria-hidden', 'false'); }
function closeModal(id) { $(`#${id}`).classList.remove('open'); $(`#${id}`).setAttribute('aria-hidden', 'true'); }
function setProductive() {
  if (state.profile.lastProductive === iso()) return;
  state.profile.streak = state.profile.lastProductive === iso(addDays(-1)) ? state.profile.streak + 1 : 1;
  state.profile.lastProductive = iso();
}

function taskCard(task) {
  const done = task.progress >= 100;
  const order = state.paper.sequence.indexOf(task.id);
  const marked = Object.values(task.paperMarks || {}).some(Boolean);
  return `<article class="task-row ${done ? 'done' : ''} ${marked ? 'paper-important' : ''}" data-task="${task.id}">
    <button class="task-check" data-action="complete" aria-label="${done ? 'Mark incomplete' : 'Complete task'}">${done ? '✓' : ''}</button>
    <div><div class="task-title">${esc(task.title)}</div><div class="task-meta"><span class="mini-dot" style="background:${color(task.area)}"></span>${esc(task.area)} / ${esc(task.category)} · ${duration(task.duration)} <span class="energy">${task.energy}</span>${task.start ? ` · ${clock(mins(task.start))}` : ''}${task.repeat&&task.repeat!=='none'?` · repeats ${task.repeat}`:''}${order>=0?` <span class="paper-order">Paper #${order+1}</span>`:''}</div>${taskMarkButtons(task)}</div>
    <div class="task-side"><button class="icon-action" data-action="edit" title="Edit task">✎</button><button class="icon-action" data-action="timer" title="Start timer">◷</button><button class="icon-action" data-action="calendar" title="Export calendar event">▣</button><button class="icon-action" data-action="publish" title="${task.publish ? 'Remove from shared calendar' : 'Show on shared calendar'}">${task.publish ? '●' : '○'}</button></div>
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
  const level = Math.floor(state.profile.xp/400)+3;
  return `${pageHead(new Date().toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'}).toUpperCase(), `Today, clearly.<br><em>Nothing out of sight.</em>`, `<button class="secondary" data-view="all">All open tasks</button><button class="primary" data-open="taskModal">+ Capture</button>`)}
    <section class="metric-row"><article class="metric"><small>OPEN TODAY</small><strong>${tasks.length}</strong><span>${unscheduled.length} still need a time</span></article><article class="metric"><small>REMAINING LOAD</small><strong>${duration(remaining)}</strong><span>${remaining>300?'Protect your focus blocks':'Achievable with breathing room'}</span></article><article class="metric"><small>STREAK</small><strong>${state.profile.streak} days</strong><span>Honest replanning counts</span></article><article class="metric accent"><small>MOMENTUM</small><strong>${state.profile.xp} XP</strong><span>Level ${level}</span></article></section>
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

function paperPosition(task, index, tasks = state.tasks.filter(t => t.progress < 100)) {
  if (state.paper.layout[task.id]) return state.paper.layout[task.id];
  const areas = state.taxonomy.map(area=>area.name), areaIndex = Math.max(0, areas.indexOf(task.area));
  const peers = tasks.filter(t => t.area === task.area);
  const categories = [...new Set(peers.map(t => t.category))];
  const column=areaIndex%3,row=Math.floor(areaIndex/3);let y=17+row*32;
  for (const category of categories) {
    const categoryTasks = peers.filter(t => t.category === category);
    if (category === task.category) { y += 3 + Math.max(0, categoryTasks.indexOf(task)) * 9.3; break; }
    y += 3 + categoryTasks.length * 9.3;
  }
  return { x: 6.2 + column * 31.3, y };
}
function paperHeadings(tasks) {
  const areas = state.taxonomy.map(area=>area.name);
  return areas.map((area, areaIndex) => {
    const peers = tasks.filter(t => t.area === area);
    if (!peers.length) return '';
    const categories = [...new Set(peers.map(t => t.category))];
    const column=areaIndex%3,row=Math.floor(areaIndex/3);let y=15.2+row*32;
    const categoryLabels = categories.map(category => {
      const label = `<div class="paper-category-heading" style="left:${6.2 + column * 31.3}%;top:${y}%">${esc(category)}</div>`;
      y += 3 + peers.filter(t => t.category === category).length * 9.3;
      return label;
    }).join('');
    return `<div class="paper-area-heading" style="left:${6.2 + column * 31.3}%;top:${10.5+row*32}%;border-color:${color(area)}">${esc(area)} <span>${peers.length}</span></div>${categoryLabels}`;
  }).join('');
}
function paperView() {
  const tasks = state.tasks.filter(matchesTaskFilter);
  const ordered = [...tasks].sort((a,b) => {
    const ai=state.paper.sequence.indexOf(a.id), bi=state.paper.sequence.indexOf(b.id);
    if(ai>=0||bi>=0) return (ai<0?999:ai)-(bi<0?999:bi);
    return a.id-b.id;
  });
  return `${pageHead('WHEN STRUCTURE FAILS, USE THE PAGE', `Your paper page.<br><em>See everything at once.</em>`, `<span class="paper-page-count">${tasks.length} visible tasks on one page</span><button class="primary" data-open-scan>▧ Scan a page</button>`)}
    <section class="paper-shell">
      ${taskFilterBar()}
      <div class="paper-toolbar" role="toolbar" aria-label="Paper tools">
        ${[['select','↖','Move'],['pen','✎','Pen'],['text','T','Text'],['heading','H','Heading'],['circle','◯','Circle'],['box','□','Box'],['tick','✓','Tick'],['eraser','⌫','Eraser']].map(([tool,icon,label])=>`<button class="paper-tool ${tool==='select'?'active':''}" data-paper-tool="${tool}" title="${label}"><span>${icon}</span><b>${label}</b></button>`).join('')}
        <form class="paper-quick" id="paperQuickForm"><input id="paperQuickInput" placeholder="Write a task straight onto the page…"><button>Add task</button></form>
        <button class="paper-save paper-scan-shortcut" data-open-scan>▧ Scan</button><button class="paper-save" data-paper-order>Use page order</button><button class="paper-save" data-clear-ink>Clear ink</button>
      </div>
      <div class="paper-board-wrap"><div class="paper-board" id="paperBoard" data-tool="select">
        <canvas id="paperCanvas" width="1180" height="980"></canvas>
        <div class="paper-title" id="paperTitle" contenteditable="true" spellcheck="false">${esc(state.paper.title)}</div>
        <span class="paper-hint">DRAG · WRITE · CIRCLE · CHECK · REORDER</span>
        ${paperHeadings(tasks)}
        ${ordered.map((task,index)=>{const p=paperPosition(task,index,tasks);const order=state.paper.sequence.indexOf(task.id);const classes=['circle','tick','box','star'].filter(mark=>hasMark(task,mark)).map(mark=>`mark-${mark}`).join(' ');return `<article class="paper-task ${task.progress>=100?'is-done':''} ${classes}" data-paper-task="${task.id}" style="left:${p.x}%;top:${p.y}%"><button class="paper-check" data-paper-complete="${task.id}" aria-label="Toggle completion">${task.progress>=100?'✓':''}</button><button class="paper-edit" data-paper-edit="${task.id}" aria-label="Edit ${esc(task.title)}" title="Edit task">✎</button><b>${esc(task.title)}</b><small>${esc(task.category)} · ${task.progress}%</small>${order>=0?`<span class="paper-seq">#${order+1}</span>`:''}${taskMarkButtons(task,true)}</article>`}).join('')}
        ${state.paper.texts.map(note=>`<div class="paper-text ${note.type==='heading'?'heading':''}" contenteditable="true" spellcheck="false" data-paper-text="${note.id}" style="left:${note.x}%;top:${note.y}%">${esc(note.text)}</div>`).join('')}
      </div></div>
      <div class="paper-key"><span><b>◯ Important</b><b>✓ Ready to act</b><b>□ Protected time</b><b>★ Today focus</b></span><span>Marks, completion and progress stay synchronized with Tasks.</span></div>
    </section>`;
}

function requestCard(r) {
  return `<article class="request-card ${r.status !== 'pending' ? 'resolved' : ''}" data-request="${r.id}"><div class="request-head"><div class="request-person"><span class="person-avatar">${r.initials}</span><div><h3>${esc(r.name)}</h3><p>${dateLabel(r.date)} · ${clock(mins(r.start))} · ${duration(r.duration)}</p></div></div><span class="pending-pill">${r.status.toUpperCase()}</span></div><div class="request-purpose">${esc(r.purpose)}</div><p class="request-note">${esc(r.note)}</p><div class="request-facts"><div><small>EXPECTED RESULT</small><b>${esc(r.outcome)}</b></div><div><small>URGENCY</small><b>${esc(r.urgency)}</b></div><div><small>FLEXIBILITY</small><b>${esc(r.flexibility)}</b></div><div><small>TIME ASKED</small><b>${duration(r.duration)}</b></div></div><div class="impact-box ${r.safe ? 'safe' : ''}"><b>${r.safe ? '✓ Fits your plan: ' : '⚠ Scheduling impact: '}</b>${esc(r.impact)}</div><div class="request-actions"><button class="accept" data-request-action="accept">Approve + create plan</button><button data-request-action="shorten">Offer 30 minutes</button><button data-request-action="reject">Decline</button></div></article>`;
}
function requestsView() {
  const pending = state.requests.filter(r => r.status === 'pending');
  return `${pageHead('CONTROL WHO GETS YOUR TIME', `Requests wait.<br><em>You choose the tradeoff.</em>`, `<button class="secondary" data-view="share">Manage share link</button>`)}<section class="section-card"><div class="section-title"><div><h2>${pending.length} pending request${pending.length===1?'':'s'}</h2><p>Purpose, outcome and impact are visible before anything reaches your calendar.</p></div></div><div class="request-list">${state.requests.map(requestCard).join('')}</div></section>`;
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
function settingRow(key,title,copy) { return `<div class="setting-row"><div><b>${title}</b><small>${copy}</small></div><button class="switch ${state.share[key]?'on':''}" data-setting="${key}" aria-label="Toggle ${title}"><i></i></button></div>`; }

function insightsView() {
  return `${pageHead('LEARN FROM YOUR REAL BEHAVIOR', `Your patterns.<br><em>Without judgment.</em>`)}<div class="insight-grid">
    <article class="insight-card"><p class="eyebrow">FOCUS BY DAY</p><h3>You work best below five planned hours.</h3><p>Days with breathing room have produced more completed focus time than overloaded days.</p><div class="bar-chart">${[52,78,61,90,72,28,18].map((h,i)=>`<div><i style="height:${h}%"></i><span>${'MTWTFSS'[i]}</span></div>`).join('')}</div></article>
    <article class="insight-card"><p class="eyebrow">RECOVERY PATTERNS</p><h3>What usually causes delay</h3><div class="pattern-list"><div><b>42%</b> No clear first action</div><div><b>31%</b> Duration was underestimated</div><div><b>18%</b> Meetings displaced the session</div><div><b>9%</b> Energy did not match the task</div></div></article>
    <article class="insight-card large"><p class="eyebrow">BADGES THAT REWARD HEALTHY WORK</p><h3>Your mind gets credit for good decisions, not just more checkboxes.</h3><div class="reward-showcase"><div class="reward-badge"><span>◈</span><b>First Focus</b><small>Completed a timed session</small></div><div class="reward-badge"><span>✦</span><b>Five-Day Flow</b><small>Showed up for five days</small></div><div class="reward-badge"><span>⌁</span><b>Honest Planner</b><small>Rescheduled before overload</small></div><div class="reward-badge"><span>◇</span><b>Boundary Keeper</b><small>Protected priority work</small></div></div></article>
  </div>`;
}

function render() {
  const renderers = { today: todayView, planner: plannerView, inbox: inboxView, paper: paperView, all: allView, requests: requestsView, share: shareView, insights: insightsView };
  $('#app').innerHTML = attentionRail() + (renderers[ui.view] || todayView)();
  renderLifeTree();
  $$('.nav-item,.mobile-nav button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === ui.view));
  const todayOpen = state.tasks.filter(t => t.date === iso() && t.progress < 100).length;
  $('#todayCount').textContent = todayOpen; $('#plannerCount').textContent = state.tasks.filter(t => t.date === ui.planningDate && t.progress < 100).length;
  $('#inboxCount').textContent = state.tasks.filter(t => t.plan === 'inbox' && t.progress < 100).length;
  $('#allCount').textContent = state.tasks.filter(t => t.progress < 100).length;
  $('#paperCount').textContent = state.tasks.filter(t => t.progress < 100).length;
  $('#requestCount').textContent = state.requests.filter(r => r.status === 'pending').length;
  if (ui.view === 'paper') requestAnimationFrame(initPaperBoard);
}

function setView(view) { ui.view = view; if (view !== 'inbox') { ui.space = null; ui.category = null; } render(); $('#sidebar').classList.remove('open'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
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
  const next = { ...clone(task), id:uid(), date:nextRecurringDate(task), progress:0, recurrenceSpawned:false, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  state.tasks.push(next);
  toast('Next recurring task created', `${next.title} is scheduled for ${dateLabel(next.date)}.`);
}
function updateProgress(id, value) {
  const task = state.tasks.find(t => t.id === id); if (!task) return;
  const old = task.progress; task.progress = Number(value);
  const crossed = Math.floor(task.progress / 25) - Math.floor(old / 25);
  if (crossed > 0) reward(crossed * 10 + (task.progress === 100 ? 20 : 0), task.progress === 100 ? 'Completion with context preserved' : 'Honest progress counts');
  if (task.progress === 100 && old < 100) { setProductive(); spawnRecurringTask(task); if(!task.repeat||task.repeat==='none')toast('Task complete', 'Your remaining workload has been recalculated.'); }
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
  if (task) { state.profile.sessions++; updateProgress(task.id, Math.min(100, task.progress + 25)); reward(20, 'Focused session completed'); }
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
  const results = state.tasks.filter(t => !q || [t.title,t.area,t.category,t.next].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,10);
  $('#searchResults').innerHTML = results.length ? results.map(t=>`<button class="search-result" data-search-task="${t.id}"><i class="state-edge ${t.postponed>=2?'risk':t.plan==='window'?'flex':''}"></i><div><b>${esc(t.title)}</b><small>${esc(t.area)} / ${esc(t.category)} · ${t.progress}% complete${t.date?` · ${dateLabel(t.date)}`:' · Inbox'}</small></div><span>→</span></button>`).join('') : '<div class="empty"><b>No matching task.</b>Try a category, next action or different phrase.</div>';
}
function openSearch() { openModal('searchModal'); $('#globalSearch').value=''; renderSearchResults(); setTimeout(()=>$('#globalSearch').focus(),80); }

function setTaskCategories(area, selected = '') {
  const options=[...(state.taxonomy.find(item=>item.name===area)?.categories||[])];if(selected&&!options.includes(selected))options.unshift(selected);
  $('#taskCategory').innerHTML = options.map(x=>`<option ${x===selected?'selected':''}>${esc(x)}</option>`).join('');
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
  openModal('taskModal'); setTimeout(()=>$('#taskTitle').focus(),80);
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
function paperPoint(event, board) { const r=board.getBoundingClientRect();return{x:(event.clientX-r.left)*1180/r.width,y:(event.clientY-r.top)*980/r.height}; }
function initPaperBoard() {
  const board=$('#paperBoard'),canvas=$('#paperCanvas');if(!board||!canvas)return;paperRuntime.tool='select';drawPaperCanvas();
  const chooseTool=tool=>{paperRuntime.tool=tool;board.dataset.tool=tool;$$('[data-paper-tool]').forEach(b=>b.classList.toggle('active',b.dataset.paperTool===tool));canvas.style.pointerEvents=tool==='select'?'none':'auto';};
  $$('[data-paper-tool]').forEach(button=>button.addEventListener('click',()=>chooseTool(button.dataset.paperTool)));
  board.addEventListener('pointerdown',event=>{
    const taskEl=event.target.closest('[data-paper-task]');
    if(paperRuntime.tool==='select'&&taskEl&&!event.target.closest('button')){const p=paperPoint(event,board),task=state.tasks.find(t=>t.id===Number(taskEl.dataset.paperTask)),visible=state.tasks.filter(matchesTaskFilter),pos=state.paper.layout[task.id]||paperPosition(task,visible.indexOf(task),visible);paperRuntime.drag={el:taskEl,id:task.id,dx:p.x-pos.x/100*1180,dy:p.y-pos.y/100*980};taskEl.setPointerCapture?.(event.pointerId);return;}
    if(paperRuntime.tool==='text'||paperRuntime.tool==='heading'){const p=paperPoint(event,board);state.paper.texts.push({id:uid(),x:p.x/11.8,y:p.y/9.8,text:paperRuntime.tool==='heading'?'New heading':'Write here…',type:paperRuntime.tool});save();render();return;}
    const p=paperPoint(event,board);
    if(paperRuntime.tool==='pen'){paperRuntime.stroke={id:uid(),color:'#252a27',width:2.2,points:[p]};canvas.setPointerCapture?.(event.pointerId);}
    if(paperRuntime.tool==='circle'||paperRuntime.tool==='box'){paperRuntime.shape={id:uid(),type:paperRuntime.tool,color:paperRuntime.tool==='circle'?'#ff7962':'#252a27',x1:p.x,y1:p.y,x2:p.x,y2:p.y};canvas.setPointerCapture?.(event.pointerId);}
    if(paperRuntime.tool==='tick'){state.paper.shapes.push({id:uid(),type:'tick',color:'#4d7420',x1:p.x,y1:p.y,x2:p.x,y2:p.y});save();drawPaperCanvas();}
    if(paperRuntime.tool==='eraser'){const near=stroke=>stroke.points?.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<22);let i=state.paper.strokes.findLastIndex(near);if(i>=0)state.paper.strokes.splice(i,1);else if(state.paper.shapes.length)state.paper.shapes.pop();save();drawPaperCanvas();}
  });
  board.addEventListener('pointermove',event=>{const p=paperPoint(event,board);if(paperRuntime.stroke){paperRuntime.stroke.points.push(p);drawPaperCanvas();}if(paperRuntime.shape){paperRuntime.shape.x2=p.x;paperRuntime.shape.y2=p.y;drawPaperCanvas(paperRuntime.shape);}if(paperRuntime.drag){const x=Math.max(2,Math.min(79,(p.x-paperRuntime.drag.dx)/11.8)),y=Math.max(10,Math.min(90,(p.y-paperRuntime.drag.dy)/9.8));paperRuntime.drag.el.style.left=`${x}%`;paperRuntime.drag.el.style.top=`${y}%`;paperRuntime.drag.x=x;paperRuntime.drag.y=y;}});
  const end=()=>{if(paperRuntime.stroke){state.paper.strokes.push(paperRuntime.stroke);paperRuntime.stroke=null;save();drawPaperCanvas();}if(paperRuntime.shape){state.paper.shapes.push(paperRuntime.shape);paperRuntime.shape=null;save();drawPaperCanvas();}if(paperRuntime.drag){state.paper.layout[paperRuntime.drag.id]={x:paperRuntime.drag.x??parseFloat(paperRuntime.drag.el.style.left),y:paperRuntime.drag.y??parseFloat(paperRuntime.drag.el.style.top)};paperRuntime.drag=null;save();}};
  board.addEventListener('pointerup',end);board.addEventListener('pointercancel',end);
  $('#paperTitle')?.addEventListener('blur',event=>{state.paper.title=event.target.textContent.trim()||'Everything on my mind';save();});
  $$('[data-paper-text]').forEach(el=>el.addEventListener('blur',()=>{const note=state.paper.texts.find(n=>n.id===Number(el.dataset.paperText));if(note){note.text=el.textContent.trim();save();}}));
  $('#paperQuickForm')?.addEventListener('submit',event=>{event.preventDefault();const input=$('#paperQuickInput'),title=input.value.trim();if(!title)return;const id=uid(),area=state.taxonomy.find(item=>item.name==='Personal')||state.taxonomy[0],category=area.categories.includes('Paper capture')?'Paper capture':area.categories[0];state.tasks.push({id,title,area:area.name,category,duration:30,energy:'medium',date:null,start:null,plan:'inbox',progress:0,next:'Clarify this paper capture',timer:false,publish:false,calendar:false,postponed:0,paperMarks:{circle:false,tick:false,box:false,star:false}});state.paper.sequence.push(id);save();reward(5,'A scribble became a real task');toast('Task added from paper','It is also visible in Inbox and All Tasks.');render();});
  chooseTool('select');
}

document.addEventListener('click', event => {
  const view = event.target.closest('[data-view]'); if (view) { event.preventDefault(); setView(view.dataset.view); return; }
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
  const taskMark=event.target.closest('[data-task-mark]');if(taskMark){const task=state.tasks.find(t=>t.id===Number(taskMark.dataset.taskMarkId));if(task){task.paperMarks||={circle:false,tick:false,box:false,star:false};const mark=taskMark.dataset.taskMark;task.paperMarks[mark]=!task.paperMarks[mark];save();render();toast(task.paperMarks[mark]?`${taskMark.title} marked`:`${taskMark.title} removed`,'The mark changed on both Paper and Tasks.');}return;}
  const paperEdit=event.target.closest('[data-paper-edit]');if(paperEdit){const task=state.tasks.find(t=>t.id===Number(paperEdit.dataset.paperEdit));if(task)openTaskEditor(task);return;}
  const paperComplete=event.target.closest('[data-paper-complete]');if(paperComplete){const task=state.tasks.find(t=>t.id===Number(paperComplete.dataset.paperComplete));if(task)updateProgress(task.id,task.progress>=100?0:100);return;}
  if(event.target.closest('[data-paper-order]')){const open=state.tasks.filter(t=>t.progress<100);state.paper.sequence=open.sort((a,b)=>{const pa=state.paper.layout[a.id]||paperPosition(a,open.indexOf(a),open),pb=state.paper.layout[b.id]||paperPosition(b,open.indexOf(b),open);return Math.abs(pa.y-pb.y)>4?pa.y-pb.y:pa.x-pb.x;}).map(t=>t.id);save();render();reward(10,'Your visual sequence now guides task views');toast('Page order saved','Sequence numbers now appear across the website.');return;}
  if(event.target.closest('[data-clear-ink]')){state.paper.strokes=[];state.paper.shapes=[];save();drawPaperCanvas();toast('Ink cleared','Tasks and written notes stayed on the page.');return;}
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
    save(); closeModal('rescueModal'); reward(10, 'A conscious decision protects attention'); toast('Task recovered', 'Your plan now reflects reality.'); render(); return;
  }
  const schedule = event.target.closest('[data-schedule]'); if (schedule) { const t = state.tasks.find(x=>x.id===Number(schedule.dataset.schedule)); t.start = schedule.dataset.time; t.plan = 'fixed'; save(); reward(10,'A flexible commitment has a home'); toast('Time chosen', `${t.title} is now at ${clock(mins(t.start))}.`); render(); return; }
  const shift = event.target.closest('[data-date-shift]'); if (shift) { ui.planningDate = iso(addDays(Number(shift.dataset.dateShift), new Date(`${ui.planningDate}T12:00:00`))); render(); return; }
  if (event.target.closest('[data-date-today]')) { ui.planningDate = iso(); render(); return; }
  const filter = event.target.closest('[data-filter]'); if (filter) { ui.space = filter.dataset.filter === 'all' ? null : filter.dataset.filter; ui.category = null; render(); return; }
  const space = event.target.closest('[data-space]'); if (space) { ui.view='inbox'; ui.space=space.dataset.space; ui.category=null; render(); return; }
  const category = event.target.closest('[data-category]'); if (category) { ui.view='inbox'; ui.category=category.dataset.category; ui.space=category.dataset.categoryArea||null; render(); return; }
  const reqAction = event.target.closest('[data-request-action]'); if (reqAction) {
    const card = reqAction.closest('[data-request]'), r = state.requests.find(x=>x.id===Number(card.dataset.request));
    if (reqAction.dataset.requestAction === 'accept') { r.status='approved'; state.tasks.push({ id:uid(), title:r.purpose, area:'Career', category:'Meetings', duration:r.duration, energy:'medium', date:r.date, start:r.start, plan:'fixed', progress:0, next:r.outcome, timer:false, publish:true, publicTitle:'Scheduled conversation', calendar:true, postponed:0 }); state.tasks.push({ id:uid(), title:`Prepare for: ${r.purpose}`, area:'Career', category:'Meetings', duration:20, energy:'low', date:r.date, start:null, plan:'today', progress:0, next:'Review the request context and expected result', timer:true, publish:false, calendar:false, postponed:0 }); reward(15,'A clear commitment was created'); toast('Request approved','Event and preparation task were added.'); }
    if (reqAction.dataset.requestAction === 'shorten') { r.duration=30; r.impact='Reduced to 30 minutes; your workout keeps a 30-minute buffer.'; r.safe=true; toast('Shorter option prepared','The request now fits your day better.'); }
    if (reqAction.dataset.requestAction === 'reject') { r.status='declined'; reward(10,'Protecting priorities is productive'); toast('Request declined','Your planned work remains protected.'); }
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
$('#searchTrigger').addEventListener('click',openSearch); $('#mobileSearch').addEventListener('click',openSearch);
$$('[data-view]').forEach(control => control.addEventListener('click', event => { event.preventDefault(); setView(control.dataset.view); }));
$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#focusBtn').addEventListener('click',()=>{document.body.classList.toggle('focus-mode');toast(document.body.classList.contains('focus-mode')?'Focus mode on':'Focus mode off');});
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
$('#taskForm').addEventListener('submit', event => {
  event.preventDefault(); const plan=$('#taskPlan').value, date=$('#taskDate').value || (plan==='inbox'?null:iso());
  const values={title:$('#taskTitle').value.trim(),area:$('#taskArea').value,category:$('#taskCategory').value,duration:Number($('#taskDuration').value),energy:$('#taskEnergy').value,plan,date:plan==='inbox'?null:date,start:plan==='fixed'?$('#taskStart').value:null,windowStart:$('#taskStart').value,windowEnd:$('#taskEnd').value,decideBy:$('#decideBy').value||iso(),next:$('#taskNext').value.trim(),timer:$('#taskTimer').checked,publish:$('#taskPublish').checked,publicTitle:'Focused work',calendar:$('#taskCalendar').checked,repeat:$('#taskRepeat').value,paperMarks:{circle:$('#taskCircle').checked,tick:$('#taskReady').checked,box:$('#taskBox').checked,star:$('#taskStar').checked},updatedAt:new Date().toISOString()};
  const existing=state.tasks.find(t=>t.id===ui.editTaskId);
  if(existing){Object.assign(existing,values);toast('Task updated','Paper, planner and task views now use the changes.');}
  else{state.tasks.unshift({id:uid(),progress:0,postponed:0,createdAt:new Date().toISOString(),...values});reward(5,'Your mind can release the task');toast('Captured','The task is safely in your command center and cloud.');}
  save(); ui.editTaskId=null; closeModal('taskModal'); render();
});
$('#taskDelete').addEventListener('click',()=>{const id=ui.editTaskId;if(!id)return;state.tasks=state.tasks.filter(t=>t.id!==id);delete state.paper.layout[id];state.paper.sequence=state.paper.sequence.filter(x=>x!==id);ui.editTaskId=null;save();closeModal('taskModal');render();toast('Task deleted','It was removed from Paper and every task view.');});
$('#freeForm').addEventListener('submit',event=>{event.preventDefault();state.availability.push({id:uid(),date:$('#freeDate').value,start:$('#freeStart').value,end:$('#freeEnd').value,label:$('#freeLabel').value,max:Number($('#freeMax').value)});save();closeModal('freeModal');toast('Free time published','Visitors can request this window, subject to approval.');render();});
$('#timerToggle').addEventListener('click',()=>{if(!ui.timer)return;ui.timer.running=!ui.timer.running;$('#timerToggle').textContent=ui.timer.running?'Ⅱ':'▶';});
$('#timerStop').addEventListener('click',finishTimer); $('#timerClose').addEventListener('click',closeTimer);
$('#resetBtn').addEventListener('click',()=>{state=clone(seed);state.tasks.forEach(task=>{task.paperMarks={circle:false,tick:false,box:false,star:false};task.repeat='none';});state.paper={title:'Everything on my mind',strokes:[],shapes:[],texts:[{id:9001,x:7.5,y:11.5,text:'Do what matters. Leave room to breathe.',type:'note'}],layout:{},sequence:[],imports:[]};state.preferences={reminders:false,reminderLead:10,notified:{}};save();ui={view:'today',space:null,category:null,planningDate:iso(),rescueId:null,timer:null,taskFilter:'open',plannerSelected:null};closeTimer();render();updateReminderUI();toast('Demo restored','All sample data is back.');});
$$('.modal-layer').forEach(layer=>layer.addEventListener('click',e=>{if(e.target===layer)closeModal(layer.id);}));
document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);if((e.key==='c'||e.key==='C')&&!typing)openTaskEditor();if(e.key==='/'&&!typing){e.preventDefault();openSearch();}if(e.key==='Escape')$$('.modal-layer.open').forEach(m=>closeModal(m.id));});

const now=new Date();$('#dateDay').textContent=now.getDate();$('#dateMonth').textContent=now.toLocaleDateString('en-US',{month:'short'}).toUpperCase();$('#taskDate').value=iso();$('#taskDate').min=iso();$('#decideBy').value=iso();$('#freeDate').value=iso(addDays(1));$('#freeDate').min=iso();populateAreaSelect($('#taskArea'));setTaskCategories($('#taskArea').value);populateAreaSelect($('#scanArea'));
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;document.body.classList.add('install-ready');showInstallNudge();});
window.addEventListener('appinstalled',()=>{installPrompt=null;document.body.classList.remove('install-ready');hideInstallNudge(true);$('#installApp').hidden=true;toast('Life Command Center installed','Open it from your home screen or app list.');});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
if(location.hash.startsWith('#invite=')){setTimeout(visitorPreview,100);} render(); updateReminderUI(); initializeCloud(); setTimeout(showInstallNudge,1400); setInterval(scanReminders,30000); scanReminders();
