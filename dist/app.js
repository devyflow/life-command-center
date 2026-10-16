const STORE_KEY = 'life-command-center-v1';

const seedTasks = [
  { id: 1, title: 'Finish Q4 client proposal', area: 'Work', duration: 90, energy: 'high', bucket: 'today', completed: false },
  { id: 2, title: 'Book annual health checkup', area: 'Personal', duration: 15, energy: 'low', bucket: 'today', completed: false },
  { id: 3, title: 'Review team hiring shortlist', area: 'Work', duration: 45, energy: 'medium', bucket: 'today', completed: false },
  { id: 4, title: '30-minute strength workout', area: 'Personal', duration: 30, energy: 'medium', bucket: 'today', completed: false },
  { id: 5, title: 'Update portfolio website', area: 'Growth', duration: 60, energy: 'high', bucket: 'next', completed: false, postponed: 4, stale: 9 },
  { id: 6, title: 'Reply to finance about invoices', area: 'Work', duration: 20, energy: 'low', bucket: 'next', completed: false },
  { id: 7, title: 'Plan weekend dinner with family', area: 'Personal', duration: 15, energy: 'low', bucket: 'inbox', completed: false },
  { id: 8, title: 'Collect ideas for a personal newsletter', area: 'Growth', duration: 30, energy: 'medium', bucket: 'inbox', completed: false },
  { id: 9, title: 'Replace bedroom reading lamp', area: 'Personal', duration: 20, energy: 'low', bucket: 'inbox', completed: false },
  { id: 10, title: 'Design feedback from Rahul', area: 'Work', duration: 10, energy: 'low', bucket: 'waiting', completed: false }
];

let tasks = loadTasks();
let currentView = 'today';
let areaFilter = null;
let sortedByEnergy = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const taskList = $('#taskList');
const laterList = $('#laterList');

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || structuredClone(seedTasks); }
  catch { return structuredClone(seedTasks); }
}
function saveTasks() { localStorage.setItem(STORE_KEY, JSON.stringify(tasks)); }
function durationLabel(minutes) { return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`; }
function areaColor(area) { return area === 'Work' ? '#ff795e' : area === 'Personal' ? '#75a7ff' : '#9bc449'; }
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }

function taskRow(task, compact = false) {
  return `<article class="task-row ${task.completed ? 'completed' : ''}" data-id="${task.id}">
    <button class="check" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">✓</button>
    <div class="task-copy"><div class="task-title">${escapeHtml(task.title)}</div><div class="task-sub"><span class="dot" style="background:${areaColor(task.area)}"></span>${task.area}${task.bucket === 'waiting' ? ' · Waiting on someone' : ''}</div></div>
    <span class="task-time">${durationLabel(task.duration)}</span>
    <span class="energy ${task.energy}">${task.energy}</span>
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
  const now = new Date();
  const longDate = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  if (areaFilter) {
    primary = tasks.filter(t => t.area === areaFilter && !t.completed);
    title = `${areaFilter},<br><em>all in one place.</em>`;
    heading = `${areaFilter} tasks`;
    overline = `${primary.length} OPEN COMMITMENTS`;
  } else if (currentView === 'today') {
    primary = tasks.filter(t => t.bucket === 'today');
    title = `Good morning.<br><em>What matters today?</em>`;
    heading = 'Committed today';
    overline = longDate;
  } else if (currentView === 'inbox') {
    primary = tasks.filter(t => t.bucket === 'inbox');
    title = `Clear your mind.<br><em>Decide what these mean.</em>`;
    heading = 'Unsorted captures';
    overline = 'YOUR UNIVERSAL INBOX';
  } else if (currentView === 'waiting') {
    primary = tasks.filter(t => t.bucket === 'waiting');
    title = `Keep the thread.<br><em>Follow up at the right time.</em>`;
    heading = 'Waiting on others';
    overline = 'OPEN LOOPS';
  } else {
    primary = tasks.filter(t => !t.completed);
    title = `Everything, visible.<br><em>Nothing, shouting.</em>`;
    heading = 'All open tasks';
    overline = `${primary.length} OPEN COMMITMENTS`;
  }

  primary = sortTasks(primary);
  taskList.innerHTML = primary.length ? primary.map(t => taskRow(t)).join('') : `<div class="empty-state"><strong>Nothing here.</strong><span>Your attention is clear.</span><br><button data-open-capture>Add something</button></div>`;
  $('#viewTitle').innerHTML = title;
  $('#primaryHeading').textContent = heading;
  $('#overline').textContent = overline;

  const later = tasks.filter(t => t.bucket === 'next' && !t.completed && (!areaFilter || t.area === areaFilter));
  laterList.innerHTML = later.length ? later.slice(0,3).map(t => taskRow(t, true)).join('') : `<div class="empty-state"><span>No tasks queued next.</span></div>`;
  $('#laterCount').textContent = `${later.length} queued`;

  const today = tasks.filter(t => t.bucket === 'today' && !t.completed);
  const minutes = today.reduce((sum, t) => sum + t.duration, 0);
  const percent = Math.min(100, Math.round(minutes / 300 * 100));
  $('#capacityPercent').textContent = `${percent}%`;
  $('#capacityRing').style.background = `conic-gradient(${percent > 90 ? '#ff795e' : '#c7f36a'} ${percent}%, #e5e3da 0)`;
  $('#capacityText').textContent = `${durationLabel(minutes)} of 5h`;
  $('#capacityHint').textContent = percent > 100 ? 'Over capacity — move something' : percent > 85 ? 'A full, focused day' : 'Comfortably achievable';
  $('#capacityHint').style.color = percent > 90 ? '#b54d39' : '#789836';

  const stuck = tasks.filter(t => !t.completed && t.postponed).sort((a,b) => b.postponed - a.postponed)[0];
  $('#signalStrip').style.display = stuck && currentView === 'today' && !areaFilter ? 'grid' : 'none';
  if (stuck) { $('#stuckTitle').textContent = stuck.title; $('#stuckMeta').textContent = `Postponed ${stuck.postponed} times · last touched ${stuck.stale} days ago`; $('#rescueTaskName').textContent = stuck.title; $('#rescueBtn').dataset.id = stuck.id; }

  $('#todayCount').textContent = today.length;
  $('#inboxCount').textContent = tasks.filter(t => t.bucket === 'inbox' && !t.completed).length;
  $('#waitingCount').textContent = tasks.filter(t => t.bucket === 'waiting' && !t.completed).length;
  ['Work','Personal','Growth'].forEach(a => $(`#${a.toLowerCase()}Count`).textContent = tasks.filter(t => t.area === a && !t.completed).length);
  $('#doneCount').textContent = 12 + tasks.filter(t => t.completed).length;

  $('#capacityCard').style.display = currentView === 'today' && !areaFilter ? 'flex' : 'none';
  $('#lowerGrid').style.display = currentView === 'today' || areaFilter ? 'grid' : 'block';
  $$('.nav-item, .mobile-nav button[data-view]').forEach(b => b.classList.toggle('active', !areaFilter && b.dataset.view === currentView));
  bindTaskButtons();
}

function bindTaskButtons() {
  $$('.task-row .check').forEach(btn => btn.addEventListener('click', () => {
    const id = Number(btn.closest('.task-row').dataset.id);
    const task = tasks.find(t => t.id === id);
    task.completed = !task.completed;
    saveTasks(); render(); showToast(task.completed ? 'Done — nicely handled' : 'Task reopened');
  }));
  $$('[data-open-capture]').forEach(btn => btn.addEventListener('click', openCapture));
}

function openCapture() { $('#captureModal').classList.add('open'); $('#captureModal').setAttribute('aria-hidden','false'); setTimeout(() => $('#taskInput').focus(), 120); }
function closeCapture() { $('#captureModal').classList.remove('open'); $('#captureModal').setAttribute('aria-hidden','true'); }
function showToast(message) { $('#toast p').textContent = message; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 2200); }

function setView(view) { currentView = view; areaFilter = null; render(); if (innerWidth < 680) $('.sidebar').classList.remove('open'); }
$$('[data-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
$$('[data-area]').forEach(btn => btn.addEventListener('click', () => { areaFilter = btn.dataset.area; render(); if (innerWidth < 680) $('.sidebar').classList.remove('open'); }));

$('#openCapture').addEventListener('click', openCapture); $('#mobileAdd').addEventListener('click', openCapture); $('#closeCapture').addEventListener('click', closeCapture);
$('#captureModal').addEventListener('click', e => { if (e.target === $('#captureModal')) closeCapture(); });
$('#taskForm').addEventListener('submit', e => {
  e.preventDefault();
  const title = $('#taskInput').value.trim(); if (!title) return;
  tasks.unshift({ id: Date.now(), title, area: $('#taskArea').value, duration: Number($('#taskDuration').value), energy: $('#taskEnergy').value, bucket: $('#taskWhen').value, completed: false });
  saveTasks(); e.target.reset(); closeCapture(); render(); showToast('Captured — your mind can let go');
});
$('#taskInput').addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'Enter') $('#taskForm').requestSubmit(); });

$('#rescueBtn').addEventListener('click', () => { $('#rescueModal').classList.add('open'); $('#rescueModal').setAttribute('aria-hidden','false'); });
$('#closeRescue').addEventListener('click', () => $('#rescueModal').classList.remove('open'));
$('#rescueModal').addEventListener('click', e => { if (e.target === $('#rescueModal')) $('#rescueModal').classList.remove('open'); });
$$('[data-rescue]').forEach(btn => btn.addEventListener('click', () => {
  const id = Number($('#rescueBtn').dataset.id); const task = tasks.find(t => t.id === id); if (!task) return;
  const action = btn.dataset.rescue;
  if (action === 'split') { task.title = `Spend 15 minutes outlining: ${task.title}`; task.duration = 15; task.energy = 'low'; task.bucket = 'today'; delete task.postponed; showToast('Made smaller and moved to today'); }
  if (action === 'waiting') { task.bucket = 'waiting'; delete task.postponed; showToast('Moved to Waiting'); }
  if (action === 'later') { task.bucket = 'next'; delete task.postponed; showToast('Kept for later, without guilt'); }
  if (action === 'drop') { tasks = tasks.filter(t => t.id !== id); showToast('Commitment removed'); }
  saveTasks(); $('#rescueModal').classList.remove('open'); render();
}));

$('#sortBtn').addEventListener('click', () => { sortedByEnergy = !sortedByEnergy; $('#sortBtn').textContent = sortedByEnergy ? 'Energy sorted ✓' : 'Sort by energy ↕'; render(); });
$('#focusToggle').addEventListener('click', () => { document.body.classList.toggle('focus-mode'); showToast(document.body.classList.contains('focus-mode') ? 'Focus mode on' : 'Focus mode off'); });
$('#mobileMenu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
$('#resetBtn').addEventListener('click', () => { tasks = structuredClone(seedTasks); saveTasks(); areaFilter = null; currentView = 'today'; render(); showToast('Demo data restored'); });
document.addEventListener('keydown', e => { if ((e.key === 'c' || e.key === 'C') && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) openCapture(); if (e.key === 'Escape') { closeCapture(); $('#rescueModal').classList.remove('open'); } });

const now = new Date(); $('#dateDay').textContent = now.getDate(); $('#dateMonth').textContent = now.toLocaleDateString('en-US',{month:'short'}).toUpperCase();
render();
