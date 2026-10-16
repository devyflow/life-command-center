const STORE_KEY = 'life-command-center-v2';
const PROFILE_KEY = 'life-command-center-profile-v2';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const addDays = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d; };
const localISO = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const seedTasks = [
  { id: 1, title: 'Finish Q4 client proposal', area: 'Career', subcategory: 'Projects', duration: 90, energy: 'high', bucket: 'today', progress: 35, timerEnabled: true },
  { id: 2, title: 'Book annual health checkup', area: 'Personal', subcategory: 'Health', duration: 15, energy: 'low', bucket: 'today', progress: 0, timerEnabled: false },
  { id: 3, title: 'Revise graph algorithms', area: 'Career', subcategory: 'DSA', duration: 45, energy: 'medium', bucket: 'today', progress: 60, timerEnabled: true },
  { id: 4, title: '30-minute strength workout', area: 'Personal', subcategory: 'Health', duration: 30, energy: 'medium', bucket: 'today', progress: 0, timerEnabled: true },
  { id: 5, title: 'Update portfolio website', area: 'Growth', subcategory: 'Portfolio', duration: 60, energy: 'high', bucket: 'next', progress: 20, timerEnabled: true, postponed: 4, stale: 9 },
  { id: 6, title: 'Reply to finance about invoices', area: 'Career', subcategory: 'Meetings', duration: 20, energy: 'low', bucket: 'next', progress: 0, timerEnabled: false },
  { id: 7, title: 'Plan weekend dinner with family', area: 'Personal', subcategory: 'Family', duration: 15, energy: 'low', bucket: 'inbox', progress: 0, timerEnabled: false },
  { id: 8, title: 'Collect ideas for a personal newsletter', area: 'Growth', subcategory: 'Writing', duration: 30, energy: 'medium', bucket: 'inbox', progress: 10, timerEnabled: false },
  { id: 9, title: 'Submit college lab record', area: 'Career', subcategory: 'College', duration: 45, energy: 'medium', bucket: 'inbox', progress: 70, timerEnabled: true },
  { id: 10, title: 'Design feedback from Rahul', area: 'Career', subcategory: 'Meetings', duration: 10, energy: 'low', bucket: 'waiting', progress: 0, timerEnabled: false },
  { id: 11, title: 'Complete full-length practice test', area: 'Career', subcategory: 'College', duration: 120, energy: 'high', bucket: 'flex', progress: 0, timerEnabled: true, date: localISO(addDays(2)), windowStart: '10:00', windowEnd: '22:00', chosenTime: null }
];

const subcategories = {
  Career: ['College', 'DSA', 'Meetings', 'Projects'],
  Personal: ['Health', 'Family', 'Home', 'Money'],
  Growth: ['Portfolio', 'Writing', 'Learning', 'Ideas']
};

let tasks = loadJSON(STORE_KEY, seedTasks).map(normalizeTask);
let profile = loadJSON(PROFILE_KEY, { xp: 280, streak: 4, lastProductiveDate: localISO(addDays(-1)), timedSessions: 1 });
let currentView = 'today';
let areaFilter = null;
let subcategoryFilter = null;
let sortedByEnergy = false;
let timerState = { taskId: null, remaining: 0, running: false, handle: null };

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || structuredClone(fallback); }
  catch { return structuredClone(fallback); }
}
function normalizeTask(task) {
  const progress = Number(task.progress ?? (task.completed ? 100 : 0));
  return { timerEnabled: false, ...task, progress, milestone: task.milestone ?? Math.floor(progress / 25), completed: progress >= 100 };
}
function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
function durationLabel(minutes) { return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`; }
function areaColor(area) { return area === 'Career' ? '#ff795e' : area === 'Personal' ? '#75a7ff' : '#9bc449'; }
function escapeHtml(value = '') { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }
function formatDate(iso) { if (!iso) return 'Choose a day'; return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }); }
function toMinutes(time) { const [h,m] = (time || '00:00').split(':').map(Number); return h * 60 + m; }
function fromMinutes(minutes) { const h = Math.floor(minutes / 60); const m = minutes % 60; const suffix = h >= 12 ? 'PM' : 'AM'; const hour = h % 12 || 12; return `${hour}:${String(m).padStart(2,'0')} ${suffix}`; }

function taskRow(task) {
  const progress = Number(task.progress || 0);
  const timerTitle = task.timerEnabled ? 'Start focus timer' : 'Add an optional timer';
  return `<article class="task-row ${task.completed ? 'completed' : ''}" data-id="${task.id}">
    <button class="check" data-action="complete" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">✓</button>
    <div class="task-copy"><div class="task-title">${escapeHtml(task.title)}</div><div class="task-sub"><span class="dot" style="background:${areaColor(task.area)}"></span>${escapeHtml(task.area)} <strong>${escapeHtml(task.subcategory || 'General')}</strong>${task.bucket === 'waiting' ? ' · Waiting' : ''}</div></div>
    <span class="task-time">${durationLabel(task.duration)}</span>
    <span class="energy ${task.energy}">${task.energy}</span>
    <button class="task-action ${timerState.taskId === task.id ? 'active' : ''}" data-action="timer" title="${timerTitle}" aria-label="${timerTitle}">◷</button>
    <label class="progress-wrap" aria-label="Completion percentage for ${escapeHtml(task.title)}">
      <input type="range" min="0" max="100" step="5" value="${progress}" data-progress style="--progress:${progress}%">
      <span class="progress-value">${progress}%</span>
    </label>
  </article>`;
}

function suggestedSlots(task) {
  const start = toMinutes(task.windowStart || '09:00');
  const end = toMinutes(task.windowEnd || '18:00');
  const duration = Math.min(task.duration || 30, Math.max(30, end - start));
  const candidates = [start, Math.round(((start + end - duration) / 2) / 30) * 30, end - duration];
  return [...new Set(candidates)].filter(m => m >= start && m + duration <= end).map(m => ({ value: `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`, label: `${fromMinutes(m)}–${fromMinutes(m + duration)}` }));
}

function plannerCard(task) {
  const slots = suggestedSlots(task);
  return `<article class="planner-card" data-id="${task.id}">
    <div><div class="planner-date">${formatDate(task.date).toUpperCase()}</div><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(task.area)} → ${escapeHtml(task.subcategory)} · ${durationLabel(task.duration)} · available ${fromMinutes(toMinutes(task.windowStart))}–${fromMinutes(toMinutes(task.windowEnd))}</p></div>
    <div class="planner-window"><span>${task.chosenTime ? 'TIME CHOSEN' : 'BEST-FIT OPTIONS'}</span><div class="slot-options">${slots.map(slot => `<button class="${task.chosenTime === slot.value ? 'selected' : ''}" data-slot="${slot.value}">${slot.label}</button>`).join('')}</div></div>
    <div class="planner-status">${task.chosenTime ? `<strong>Locked in:</strong> ${formatDate(task.date)} at ${fromMinutes(toMinutes(task.chosenTime))}. You can change it anytime.` : `<strong>No pressure to decide now.</strong> These options appear the day before; choose the one that fits your energy and calendar.`}</div>
  </article>`;
}

function sortTasks(items) {
  if (!sortedByEnergy) return items;
  const rank = { high: 0, medium: 1, low: 2 };
  return [...items].sort((a,b) => rank[a.energy] - rank[b.energy]);
}

function render() {
  let primary = [];
  let title = '';
  let heading = '';
  let overline = '';
  const longDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  if (subcategoryFilter) {
    primary = tasks.filter(t => t.subcategory === subcategoryFilter && !t.completed);
    title = `${subcategoryFilter},<br><em>without the clutter.</em>`; heading = `${subcategoryFilter} tasks`; overline = `${primary.length} OPEN COMMITMENTS`;
  } else if (areaFilter) {
    primary = tasks.filter(t => t.area === areaFilter && !t.completed);
    title = `${areaFilter},<br><em>all in one place.</em>`; heading = `${areaFilter} tasks`; overline = `${primary.length} OPEN COMMITMENTS`;
  } else if (currentView === 'today') {
    primary = tasks.filter(t => t.bucket === 'today');
    title = `Good morning.<br><em>What matters today?</em>`; heading = 'Committed today'; overline = longDate;
  } else if (currentView === 'inbox') {
    primary = tasks.filter(t => t.bucket === 'inbox');
    title = `Clear your mind.<br><em>Decide what these mean.</em>`; heading = 'Unsorted captures'; overline = 'YOUR UNIVERSAL INBOX';
  } else if (currentView === 'waiting') {
    primary = tasks.filter(t => t.bucket === 'waiting');
    title = `Keep the thread.<br><em>Follow up at the right time.</em>`; heading = 'Waiting on others'; overline = 'OPEN LOOPS';
  } else if (currentView === 'planner') {
    primary = tasks.filter(t => t.bucket === 'flex');
    title = `Choose the day.<br><em>Let the time stay flexible.</em>`; heading = 'Flexible commitments'; overline = 'PLAN WHEN YOU KNOW MORE';
  } else {
    primary = tasks.filter(t => !t.completed);
    title = `Everything, visible.<br><em>Nothing, shouting.</em>`; heading = 'All open tasks'; overline = `${primary.length} OPEN COMMITMENTS`;
  }

  primary = sortTasks(primary);
  $('#taskList').innerHTML = primary.length
    ? (currentView === 'planner' && !areaFilter && !subcategoryFilter ? primary.map(plannerCard).join('') : primary.map(taskRow).join(''))
    : `<div class="empty-state"><strong>Nothing here.</strong><span>Your attention is clear.</span><br><button data-open-capture>Add something</button></div>`;
  $('#viewTitle').innerHTML = title;
  $('#primaryHeading').textContent = heading;
  $('#overline').textContent = overline;

  const later = tasks.filter(t => t.bucket === 'next' && !t.completed && (!areaFilter || t.area === areaFilter) && (!subcategoryFilter || t.subcategory === subcategoryFilter));
  $('#laterList').innerHTML = later.length ? later.slice(0,3).map(taskRow).join('') : `<div class="empty-state"><span>No tasks queued next.</span></div>`;
  $('#laterCount').textContent = `${later.length} queued`;

  const today = tasks.filter(t => t.bucket === 'today' && !t.completed);
  const minutes = today.reduce((sum, t) => sum + t.duration * (1 - (t.progress || 0) / 100), 0);
  const percent = Math.min(100, Math.round(minutes / 300 * 100));
  $('#capacityPercent').textContent = `${percent}%`;
  $('#capacityRing').style.background = `conic-gradient(${percent > 90 ? '#ff795e' : '#c7f36a'} ${percent}%, #e5e3da 0)`;
  $('#capacityText').textContent = `${durationLabel(Math.round(minutes))} remaining`;
  $('#capacityHint').textContent = percent > 95 ? 'Over capacity — move something' : percent > 80 ? 'A full, focused day' : 'Comfortably achievable';

  const stuck = tasks.filter(t => !t.completed && t.postponed).sort((a,b) => b.postponed - a.postponed)[0];
  $('#signalStrip').style.display = stuck && currentView === 'today' && !areaFilter && !subcategoryFilter ? 'grid' : 'none';
  if (stuck) { $('#stuckTitle').textContent = stuck.title; $('#stuckMeta').textContent = `Postponed ${stuck.postponed} times · last touched ${stuck.stale} days ago`; $('#rescueTaskName').textContent = stuck.title; $('#rescueBtn').dataset.id = stuck.id; }

  $('#todayCount').textContent = today.length;
  $('#inboxCount').textContent = tasks.filter(t => t.bucket === 'inbox' && !t.completed).length;
  $('#waitingCount').textContent = tasks.filter(t => t.bucket === 'waiting' && !t.completed).length;
  $('#plannerCount').textContent = tasks.filter(t => t.bucket === 'flex' && !t.completed).length;
  ['Career','Personal','Growth'].forEach(a => $(`#${a.toLowerCase()}Count`).textContent = tasks.filter(t => t.area === a && !t.completed).length);
  ['College','DSA','Meetings'].forEach(a => $(`#${a.toLowerCase()}Count`).textContent = tasks.filter(t => t.subcategory === a && !t.completed).length);
  $('#doneCount').textContent = 12 + tasks.filter(t => t.completed).length;
  $('#xpCount').textContent = profile.xp; $('#streakDays').textContent = profile.streak;
  $('#levelProgress').style.width = `${Math.min(100, (profile.xp % 400) / 4)}%`;
  $('#levelCaption').textContent = `${profile.xp % 400} / 400 XP to level ${Math.floor(profile.xp / 400) + 4}`;

  $('#capacityCard').style.display = currentView === 'today' && !areaFilter && !subcategoryFilter ? 'flex' : 'none';
  $('#lowerGrid').style.display = currentView === 'today' || areaFilter || subcategoryFilter ? 'grid' : 'none';
  $$('.nav-item, .mobile-nav button[data-view]').forEach(b => b.classList.toggle('active', !areaFilter && !subcategoryFilter && b.dataset.view === currentView));
  $$('.subspace-list button').forEach(b => b.classList.toggle('active', b.dataset.subcategory === subcategoryFilter));
}

function updateProgress(task, value, announce = true) {
  const old = Number(task.progress || 0);
  const next = Number(value);
  const wasCompleted = Boolean(task.completed);
  task.progress = next; task.completed = next >= 100;
  const milestone = Math.floor(next / 25);
  const priorMilestone = Number(task.milestone ?? Math.floor(old / 25));
  let gained = Math.max(0, milestone - priorMilestone) * 10;
  if (next >= 100 && !wasCompleted) gained += 20;
  if (milestone > priorMilestone) {
    task.milestone = milestone;
  }
  if (gained > 0) reward(gained, next >= 100 ? 'Task finished. Your momentum grew.' : `${next}% complete. Progress counts.`);
  if (next >= 100 && !wasCompleted) markProductiveDay();
  saveState(); render();
  if (announce && next >= 100) showToast('Finished — nicely handled');
}

function markProductiveDay() {
  const today = localISO();
  if (profile.lastProductiveDate === today) return;
  profile.streak = profile.lastProductiveDate === localISO(addDays(-1)) ? profile.streak + 1 : 1;
  profile.lastProductiveDate = today;
}

function reward(xp, message) {
  profile.xp += xp;
  $('#burstTitle').textContent = `+${xp} XP`;
  $('#burstText').textContent = message;
  $('#rewardBurst').classList.add('show');
  setTimeout(() => $('#rewardBurst').classList.remove('show'), 1900);
}

function startTimer(taskId) {
  const task = tasks.find(t => t.id === taskId); if (!task) return;
  if (!task.timerEnabled) { task.timerEnabled = true; showToast('Focus timer added'); }
  if (timerState.handle) clearInterval(timerState.handle);
  timerState = { taskId, remaining: Math.max(60, Math.round(task.duration * 60 * (1 - task.progress / 100))), running: true, handle: null };
  $('#timerTask').textContent = task.title; $('#timerDock').classList.add('show'); $('#timerPause').textContent = 'Pause'; $('#timerGlyph').textContent = '▶';
  tickTimer(); timerState.handle = setInterval(tickTimer, 1000); saveState(); render();
}
function tickTimer() {
  const minutes = Math.floor(timerState.remaining / 60); const seconds = timerState.remaining % 60;
  $('#timerTime').textContent = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  if (!timerState.running) return;
  if (timerState.remaining <= 0) {
    clearInterval(timerState.handle); const task = tasks.find(t => t.id === timerState.taskId); if (task) { profile.timedSessions += 1; updateProgress(task, 100); reward(30, 'Focus session complete. Badge progress earned.'); }
    closeTimer(); return;
  }
  timerState.remaining -= 1;
}
function closeTimer() { if (timerState.handle) clearInterval(timerState.handle); timerState = { taskId:null, remaining:0, running:false, handle:null }; $('#timerDock').classList.remove('show'); render(); }

function openModal(id) { $(id).classList.add('open'); $(id).setAttribute('aria-hidden','false'); }
function closeModal(id) { $(id).classList.remove('open'); $(id).setAttribute('aria-hidden','true'); }
function openCapture() { openModal('#captureModal'); setTimeout(() => $('#taskInput').focus(), 100); }
function showToast(message) { $('#toast p').textContent = message; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 2200); }
function setView(view) { currentView = view; areaFilter = null; subcategoryFilter = null; render(); if (innerWidth < 680) $('.sidebar').classList.remove('open'); }

document.addEventListener('click', (event) => {
  const open = event.target.closest('[data-open-capture]'); if (open) openCapture();
  const nav = event.target.closest('[data-view]'); if (nav) setView(nav.dataset.view);
  const area = event.target.closest('[data-area]'); if (area) { areaFilter = area.dataset.area; subcategoryFilter = null; render(); if (innerWidth < 680) $('.sidebar').classList.remove('open'); }
  const sub = event.target.closest('[data-subcategory]'); if (sub) { subcategoryFilter = sub.dataset.subcategory; areaFilter = null; render(); if (innerWidth < 680) $('.sidebar').classList.remove('open'); }
  const row = event.target.closest('.task-row');
  if (row) {
    const task = tasks.find(t => t.id === Number(row.dataset.id)); if (!task) return;
    if (event.target.closest('[data-action="complete"]')) updateProgress(task, task.completed ? 0 : 100);
    if (event.target.closest('[data-action="timer"]')) startTimer(task.id);
  }
  const slot = event.target.closest('[data-slot]');
  if (slot) { const card = slot.closest('.planner-card'); const task = tasks.find(t => t.id === Number(card.dataset.id)); task.chosenTime = slot.dataset.slot; saveState(); render(); reward(10, 'A flexible task now has a home.'); showToast('Best-fit time chosen'); }
});

document.addEventListener('input', (event) => {
  if (!event.target.matches('[data-progress]')) return;
  const row = event.target.closest('.task-row');
  event.target.style.setProperty('--progress', `${event.target.value}%`); row.querySelector('.progress-value').textContent = `${event.target.value}%`;
});
document.addEventListener('change', (event) => {
  if (!event.target.matches('[data-progress]')) return;
  const task = tasks.find(t => t.id === Number(event.target.closest('.task-row').dataset.id)); updateProgress(task, event.target.value, false);
});

$('#openCapture').addEventListener('click', openCapture); $('#mobileAdd').addEventListener('click', openCapture); $('#closeCapture').addEventListener('click', () => closeModal('#captureModal'));
$('#captureModal').addEventListener('click', e => { if (e.target === $('#captureModal')) closeModal('#captureModal'); });
$('#taskArea').addEventListener('change', () => {
  $('#taskSubcategory').innerHTML = subcategories[$('#taskArea').value].map(x => `<option>${x}</option>`).join('');
});
$('#taskWhen').addEventListener('change', () => { if ($('#taskWhen').value === 'flex' && !$('#taskDate').value) $('#taskDate').value = localISO(addDays(1)); });
$('#taskForm').addEventListener('submit', e => {
  e.preventDefault(); const title = $('#taskInput').value.trim(); if (!title) return;
  const bucket = $('#taskWhen').value;
  tasks.unshift({ id: Date.now(), title, area: $('#taskArea').value, subcategory: $('#taskSubcategory').value, duration: Number($('#taskDuration').value), energy: $('#taskEnergy').value, bucket, progress: 0, completed: false, milestone: 0, timerEnabled: $('#taskTimer').checked, date: bucket === 'flex' ? ($('#taskDate').value || localISO(addDays(1))) : null, windowStart: $('#windowStart').value, windowEnd: $('#windowEnd').value, chosenTime: null });
  saveState(); e.target.reset(); $('#windowStart').value = '10:00'; $('#windowEnd').value = '22:00'; closeModal('#captureModal'); render(); showToast(bucket === 'flex' ? 'Flexible task added to planner' : 'Captured — your mind can let go');
});
$('#taskInput').addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'Enter') $('#taskForm').requestSubmit(); });

$('#rescueBtn').addEventListener('click', () => openModal('#rescueModal')); $('#closeRescue').addEventListener('click', () => closeModal('#rescueModal'));
$$('[data-rescue]').forEach(btn => btn.addEventListener('click', () => {
  const id = Number($('#rescueBtn').dataset.id); const task = tasks.find(t => t.id === id); if (!task) return;
  if (btn.dataset.rescue === 'split') { task.title = `Spend 15 minutes outlining: ${task.title}`; task.duration = 15; task.energy = 'low'; task.bucket = 'today'; delete task.postponed; }
  if (btn.dataset.rescue === 'waiting') { task.bucket = 'waiting'; delete task.postponed; }
  if (btn.dataset.rescue === 'later') { task.bucket = 'next'; delete task.postponed; }
  if (btn.dataset.rescue === 'drop') tasks = tasks.filter(t => t.id !== id);
  saveState(); closeModal('#rescueModal'); render(); showToast('Task unstuck');
}));

$('#rewardCard').addEventListener('click', () => openModal('#rewardsModal')); $('#closeRewards').addEventListener('click', () => closeModal('#rewardsModal'));
$('#rewardsModal').addEventListener('click', e => { if (e.target === $('#rewardsModal')) closeModal('#rewardsModal'); });
$('#timerPause').addEventListener('click', () => { timerState.running = !timerState.running; $('#timerPause').textContent = timerState.running ? 'Pause' : 'Resume'; $('#timerGlyph').textContent = timerState.running ? '▶' : 'Ⅱ'; });
$('#timerClose').addEventListener('click', closeTimer);
$('#sortBtn').addEventListener('click', () => { sortedByEnergy = !sortedByEnergy; $('#sortBtn').textContent = sortedByEnergy ? 'Energy sorted ✓' : 'Sort by energy ↕'; render(); });
$('#focusToggle').addEventListener('click', () => { document.body.classList.toggle('focus-mode'); showToast(document.body.classList.contains('focus-mode') ? 'Focus mode on' : 'Focus mode off'); });
$('#mobileMenu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
$('#resetBtn').addEventListener('click', () => { tasks = structuredClone(seedTasks).map(normalizeTask); profile = { xp:280, streak:4, lastProductiveDate:localISO(addDays(-1)), timedSessions:1 }; saveState(); areaFilter = null; subcategoryFilter = null; currentView = 'today'; closeTimer(); render(); showToast('Demo data restored'); });
document.addEventListener('keydown', e => { if ((e.key === 'c' || e.key === 'C') && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) openCapture(); if (e.key === 'Escape') ['#captureModal','#rescueModal','#rewardsModal'].forEach(closeModal); });

const now = new Date(); $('#dateDay').textContent = now.getDate(); $('#dateMonth').textContent = now.toLocaleDateString('en-US',{month:'short'}).toUpperCase(); $('#taskDate').min = localISO(); $('#taskDate').value = localISO(addDays(1));
render();
