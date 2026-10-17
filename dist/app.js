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
const color = area => area === 'Career' ? '#ff7962' : area === 'Personal' ? '#75a6ff' : '#9cbe52';

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
  share: { token: 'focus-7K3P', oneTime: true, expires: true, approval: true, questions: true, privacy: true }
};

const STORE = 'life-command-v3';
const clone = obj => JSON.parse(JSON.stringify(obj));
let state = (() => { try { return { ...clone(seed), ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return clone(seed); } })();
let ui = { view: 'today', space: null, category: null, planningDate: iso(), rescueId: null, timer: null };
let timerHandle = null;
state.paper ||= { title: 'Everything on my mind', strokes: [], shapes: [], texts: [{ id: 9001, x: 7.5, y: 11.5, text: 'Do what matters. Leave room to breathe.', type: 'note' }], layout: {}, sequence: [] };
state.paper.strokes ||= []; state.paper.shapes ||= []; state.paper.texts ||= []; state.paper.layout ||= {}; state.paper.sequence ||= [];
const save = () => localStorage.setItem(STORE, JSON.stringify(state));

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
  return `<article class="task-row ${done ? 'done' : ''} ${task.paperEmphasis ? 'paper-important' : ''}" data-task="${task.id}">
    <button class="task-check" data-action="complete" aria-label="${done ? 'Mark incomplete' : 'Complete task'}">${done ? '✓' : ''}</button>
    <div><div class="task-title">${esc(task.title)}</div><div class="task-meta"><span class="mini-dot" style="background:${color(task.area)}"></span>${esc(task.area)} / ${esc(task.category)} · ${duration(task.duration)} <span class="energy">${task.energy}</span>${task.start ? ` · ${clock(mins(task.start))}` : ''}${order>=0?` <span class="paper-order">Paper #${order+1}</span>`:''}${task.paperEmphasis?` · ${task.paperEmphasis} marked`:''}</div></div>
    <div class="task-side"><button class="icon-action" data-action="timer" title="Start timer">◷</button><button class="icon-action" data-action="calendar" title="Export calendar event">▣</button><button class="icon-action" data-action="publish" title="${task.publish ? 'Remove from shared calendar' : 'Show on shared calendar'}">${task.publish ? '●' : '○'}</button></div>
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

function hourRows() { return Array.from({ length: 17 }, (_, i) => { const h = i + 6; return `<div class="hour-row"><time>${clock(h * 60)}</time><div class="hour-line"></div></div>`; }).join(''); }
function positionedBlock(item, type = 'task') {
  const start = mins(item.start), dayStart = 360, top = Math.max(0, (start - dayStart) / 60 * 64), height = Math.max(28, ((item.duration || (mins(item.end) - start)) / 60) * 64 - 3);
  const klass = type === 'free' ? 'free' : type === 'pending' ? 'pending' : (item.area || 'Career').toLowerCase();
  const title = type === 'free' ? item.label : type === 'pending' ? `Pending · ${item.purpose}` : item.title;
  return `<div class="time-block ${klass}" style="top:${top}px;height:${height}px"><b>${esc(title)}</b><small>${clock(start)} · ${duration(item.duration || mins(item.end) - start)}</small></div>`;
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
      <section class="calendar-board"><div class="calendar-head"><span>${date === iso() ? 'TODAY' : 'DAY'}</span><div><strong>${dayLong(date)}</strong><span>${scheduled.length} commitments · ${duration(scheduled.reduce((n,t)=>n+t.duration,0))}</span></div></div><div class="timeline">${hourRows()}${blocks}</div></section>
      <aside class="planner-side">
        ${decisions.map(t => `<article class="decision-card"><p class="eyebrow">DECIDE BY ${dateLabel(t.decideBy || iso()).toUpperCase()}</p><h3>${esc(t.title)}</h3><p>${duration(t.duration)} needed between ${clock(mins(t.windowStart))} and ${clock(mins(t.windowEnd))}. Choose when your energy fits.</p><div class="slot-picks">${fitSlots(t).map((s,i)=>`<button data-schedule="${t.id}" data-time="${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}"><b>${clock(s)}–${clock(s+t.duration)}</b>${i===1?'Best balance with your current plan':i===0?'Finish it early':'Keep the daytime flexible'}</button>`).join('')}</div></article>`).join('')}
        <article class="unscheduled-card"><p class="eyebrow">STILL FLEXIBLE</p><h3>Tasks waiting for a home</h3><p>Scheduling one will turn it into a calendar block and preserve its context.</p>${flexible.filter(t=>t.plan!=='window').map(t=>`<div class="unscheduled-item"><b>${esc(t.title)}</b><span>${duration(t.duration)} · ${t.energy} energy</span><div class="slot-picks"><button data-schedule="${t.id}" data-time="15:00">Place at 3:00 PM</button></div></div>`).join('') || '<div class="empty"><b>Everything has a place.</b>No loose work on this day.</div>'}</article>
      </aside>
    </div>`;
}

function inboxView() {
  let tasks = state.tasks.filter(t => t.plan === 'inbox' && t.progress < 100);
  if (ui.space) tasks = tasks.filter(t => t.area === ui.space);
  if (ui.category) tasks = state.tasks.filter(t => t.category === ui.category && t.progress < 100);
  const title = ui.category || ui.space || 'Your inbox';
  return `${pageHead('CAPTURE FIRST, DECIDE SECOND', `${esc(title)}.<br><em>Nothing gets lost.</em>`, `<button class="primary" data-open="taskModal">+ Capture something</button>`)}
    <div class="filter-bar"><button class="filter-chip ${!ui.space&&!ui.category?'active':''}" data-filter="all">All captures</button><button class="filter-chip ${ui.space==='Career'?'active':''}" data-filter="Career">Career</button><button class="filter-chip ${ui.space==='Personal'?'active':''}" data-filter="Personal">Personal</button><button class="filter-chip ${ui.space==='Growth'?'active':''}" data-filter="Growth">Growth</button></div>
    <div class="inbox-layout"><section class="section-card"><div class="section-title"><div><h2>${tasks.length} things need a decision</h2><p>Keep categories useful without putting everything in one crowded list.</p></div></div><div class="task-list">${tasks.length ? tasks.map(taskCard).join('') : '<div class="empty"><b>Inbox zero.</b>Everything has been clarified.</div>'}</div></section>
    <aside class="triage-card"><p class="eyebrow">60-SECOND TRIAGE</p><h3>Ask only what matters.</h3><p>Every capture should become a clear action, a scheduled commitment, a waiting item or something you consciously release.</p><div class="triage-steps"><span><b>01</b> What does “done” mean?</span><span><b>02</b> What is the smallest next action?</span><span><b>03</b> Does it need time or only a deadline?</span><span><b>04</b> Which part of your life owns it?</span></div></aside></div>`;
}

function allView() {
  const query = (ui.allQuery || '').toLowerCase();
  const open = state.tasks.filter(t => t.progress < 100).filter(t => !query || [t.title,t.area,t.category,t.next].some(v=>String(v||'').toLowerCase().includes(query)));
  const groups = ['Career','Personal','Growth'];
  return `${pageHead('THE GUARANTEED ESCAPE HATCH', `Every open task.<br><em>No hidden corners.</em>`, `<button class="primary" data-open="taskModal">+ Capture</button>`)}
    <div class="all-toolbar"><input id="allSearch" value="${esc(ui.allQuery||'')}" placeholder="Filter every task by title, area, category or next action…"><span class="all-summary">${open.length} visible · ${state.tasks.filter(t=>t.progress>=100).length} completed</span></div>
    <div class="status-legend"><span><i style="background:var(--coral)"></i>At risk</span><span><i style="background:var(--violet)"></i>Flexible or undecided</span><span><i style="background:var(--lime)"></i>Ready to act</span><span><i style="background:#a4a8a4"></i>Inbox</span></div>
    ${groups.map(area=>{const items=open.filter(t=>t.area===area);return `<section class="all-group"><div class="all-group-head"><h2><span class="mini-dot" style="background:${color(area)}"></span> ${area}</h2><span>${items.length} open</span></div><div class="task-list">${items.length?items.map(taskCard).join(''):'<div class="empty"><b>No matching tasks.</b>This area is clear.</div>'}</div></section>`}).join('')}`;
}

function paperPosition(task, index) {
  if (state.paper.layout[task.id]) return state.paper.layout[task.id];
  const col = index % 4, row = Math.floor(index / 4);
  return { x: 7.5 + col * 22.5, y: 19 + row * 15 };
}
function paperView() {
  const tasks = state.tasks.filter(t => t.progress < 100 || state.paper.layout[t.id]);
  const ordered = [...tasks].sort((a,b) => {
    const ai=state.paper.sequence.indexOf(a.id), bi=state.paper.sequence.indexOf(b.id);
    if(ai>=0||bi>=0) return (ai<0?999:ai)-(bi<0?999:bi);
    return a.id-b.id;
  });
  return `${pageHead('WHEN STRUCTURE FAILS, USE THE PAGE', `Your paper page.<br><em>See everything at once.</em>`, `<span class="paper-page-count">${tasks.filter(t=>t.progress<100).length} open tasks on one page</span>`)}
    <section class="paper-shell">
      <div class="paper-toolbar" role="toolbar" aria-label="Paper tools">
        ${[['select','↖','Move'],['pen','✎','Pen'],['text','T','Text'],['heading','H','Heading'],['circle','◯','Circle'],['box','□','Box'],['tick','✓','Tick'],['eraser','⌫','Eraser']].map(([tool,icon,label])=>`<button class="paper-tool ${tool==='select'?'active':''}" data-paper-tool="${tool}" title="${label}"><span>${icon}</span><b>${label}</b></button>`).join('')}
        <form class="paper-quick" id="paperQuickForm"><input id="paperQuickInput" placeholder="Write a task straight onto the page…"><button>Add task</button></form>
        <button class="paper-save" data-paper-order>Use page order</button><button class="paper-save" data-clear-ink>Clear ink</button>
      </div>
      <div class="paper-board-wrap"><div class="paper-board" id="paperBoard" data-tool="select">
        <canvas id="paperCanvas" width="1180" height="790"></canvas>
        <div class="paper-title" id="paperTitle" contenteditable="true" spellcheck="false">${esc(state.paper.title)}</div>
        <span class="paper-hint">DRAG · WRITE · CIRCLE · CHECK · REORDER</span>
        ${ordered.map((task,index)=>{const p=paperPosition(task,index);const order=state.paper.sequence.indexOf(task.id);return `<article class="paper-task ${task.progress>=100?'is-done':''} ${task.paperEmphasis?`emphasis-${task.paperEmphasis}`:''}" data-paper-task="${task.id}" style="left:${p.x}%;top:${p.y}%"><button class="paper-check" data-paper-complete="${task.id}">${task.progress>=100?'✓':''}</button><b>${esc(task.title)}</b><small>${esc(task.area)} / ${esc(task.category)} · ${task.progress}%</small>${order>=0?`<span class="paper-seq">#${order+1}</span>`:''}<button class="paper-mark" data-paper-mark="${task.id}" title="Cycle circle, box and highlight">${task.paperEmphasis==='circle'?'◯':task.paperEmphasis==='box'?'□':task.paperEmphasis==='star'?'★':'☆'}</button></article>`}).join('')}
        ${state.paper.texts.map(note=>`<div class="paper-text ${note.type==='heading'?'heading':''}" contenteditable="true" spellcheck="false" data-paper-text="${note.id}" style="left:${note.x}%;top:${note.y}%">${esc(note.text)}</div>`).join('')}
      </div></div>
      <div class="paper-key"><span><b><i style="background:var(--coral)"></i>Circle = important</b><b><i style="border:2px solid var(--ink)"></i>Box = protected</b><b><i style="background:var(--lime)"></i>Highlight = priority</b></span><span>Everything created here also lives in tasks.</span></div>
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
  $$('.nav-item,.mobile-nav button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === ui.view));
  const todayOpen = state.tasks.filter(t => t.date === iso() && t.progress < 100).length;
  $('#todayCount').textContent = todayOpen; $('#plannerCount').textContent = state.tasks.filter(t => t.date === ui.planningDate && t.progress < 100).length;
  $('#inboxCount').textContent = state.tasks.filter(t => t.plan === 'inbox' && t.progress < 100).length;
  $('#allCount').textContent = state.tasks.filter(t => t.progress < 100).length;
  $('#paperCount').textContent = state.tasks.filter(t => t.progress < 100).length;
  $('#requestCount').textContent = state.requests.filter(r => r.status === 'pending').length;
  ['Career','Personal','Growth'].forEach(a => $(`#${a.toLowerCase()}Count`).textContent = state.tasks.filter(t => t.area === a && t.progress < 100).length);
  if (ui.view === 'paper') requestAnimationFrame(initPaperBoard);
}

function setView(view) { ui.view = view; if (view !== 'inbox') { ui.space = null; ui.category = null; } render(); $('#sidebar').classList.remove('open'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function updateProgress(id, value) {
  const task = state.tasks.find(t => t.id === id); if (!task) return;
  const old = task.progress; task.progress = Number(value);
  const crossed = Math.floor(task.progress / 25) - Math.floor(old / 25);
  if (crossed > 0) reward(crossed * 10 + (task.progress === 100 ? 20 : 0), task.progress === 100 ? 'Completion with context preserved' : 'Honest progress counts');
  if (task.progress === 100 && old < 100) { setProductive(); toast('Task complete', 'Your remaining workload has been recalculated.'); }
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

let paperRuntime = { tool: 'select', stroke: null, shape: null, drag: null };
function drawPaperCanvas(preview = null) {
  const canvas=$('#paperCanvas'); if(!canvas) return; const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height); ctx.lineCap='round'; ctx.lineJoin='round';
  const drawStroke = stroke => { if(!stroke.points?.length)return;ctx.beginPath();ctx.strokeStyle=stroke.color||'#252a27';ctx.lineWidth=stroke.width||2.2;ctx.moveTo(stroke.points[0].x,stroke.points[0].y);stroke.points.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke(); };
  state.paper.strokes.forEach(drawStroke); if(paperRuntime.stroke) drawStroke(paperRuntime.stroke);
  const drawShape = shape => { ctx.beginPath();ctx.strokeStyle=shape.color||'#ff7962';ctx.lineWidth=shape.width||2.6;if(shape.type==='circle'){const cx=(shape.x1+shape.x2)/2,cy=(shape.y1+shape.y2)/2,rx=Math.abs(shape.x2-shape.x1)/2,ry=Math.abs(shape.y2-shape.y1)/2;ctx.ellipse(cx,cy,Math.max(3,rx),Math.max(3,ry),-.035,0,Math.PI*2);}else if(shape.type==='box'){ctx.rect(shape.x1,shape.y1,shape.x2-shape.x1,shape.y2-shape.y1);}else if(shape.type==='tick'){ctx.moveTo(shape.x1-11,shape.y1);ctx.lineTo(shape.x1-2,shape.y1+10);ctx.lineTo(shape.x1+16,shape.y1-13);}ctx.stroke(); };
  state.paper.shapes.forEach(drawShape); if(preview) drawShape(preview);
}
function paperPoint(event, board) { const r=board.getBoundingClientRect();return{x:(event.clientX-r.left)*1180/r.width,y:(event.clientY-r.top)*790/r.height}; }
function initPaperBoard() {
  const board=$('#paperBoard'),canvas=$('#paperCanvas');if(!board||!canvas)return;paperRuntime.tool='select';drawPaperCanvas();
  const chooseTool=tool=>{paperRuntime.tool=tool;board.dataset.tool=tool;$$('[data-paper-tool]').forEach(b=>b.classList.toggle('active',b.dataset.paperTool===tool));canvas.style.pointerEvents=tool==='select'?'none':'auto';};
  $$('[data-paper-tool]').forEach(button=>button.addEventListener('click',()=>chooseTool(button.dataset.paperTool)));
  board.addEventListener('pointerdown',event=>{
    const taskEl=event.target.closest('[data-paper-task]');
    if(paperRuntime.tool==='select'&&taskEl&&!event.target.closest('button')){const p=paperPoint(event,board),task=state.tasks.find(t=>t.id===Number(taskEl.dataset.paperTask)),pos=state.paper.layout[task.id]||paperPosition(task,state.tasks.filter(t=>t.progress<100).indexOf(task));paperRuntime.drag={el:taskEl,id:task.id,dx:p.x-pos.x/100*1180,dy:p.y-pos.y/100*790};taskEl.setPointerCapture?.(event.pointerId);return;}
    if(paperRuntime.tool==='text'||paperRuntime.tool==='heading'){const p=paperPoint(event,board);state.paper.texts.push({id:uid(),x:p.x/11.8,y:p.y/7.9,text:paperRuntime.tool==='heading'?'New heading':'Write here…',type:paperRuntime.tool});save();render();return;}
    const p=paperPoint(event,board);
    if(paperRuntime.tool==='pen'){paperRuntime.stroke={id:uid(),color:'#252a27',width:2.2,points:[p]};canvas.setPointerCapture?.(event.pointerId);}
    if(paperRuntime.tool==='circle'||paperRuntime.tool==='box'){paperRuntime.shape={id:uid(),type:paperRuntime.tool,color:paperRuntime.tool==='circle'?'#ff7962':'#252a27',x1:p.x,y1:p.y,x2:p.x,y2:p.y};canvas.setPointerCapture?.(event.pointerId);}
    if(paperRuntime.tool==='tick'){state.paper.shapes.push({id:uid(),type:'tick',color:'#4d7420',x1:p.x,y1:p.y,x2:p.x,y2:p.y});save();drawPaperCanvas();}
    if(paperRuntime.tool==='eraser'){const near=stroke=>stroke.points?.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<22);let i=state.paper.strokes.findLastIndex(near);if(i>=0)state.paper.strokes.splice(i,1);else if(state.paper.shapes.length)state.paper.shapes.pop();save();drawPaperCanvas();}
  });
  board.addEventListener('pointermove',event=>{const p=paperPoint(event,board);if(paperRuntime.stroke){paperRuntime.stroke.points.push(p);drawPaperCanvas();}if(paperRuntime.shape){paperRuntime.shape.x2=p.x;paperRuntime.shape.y2=p.y;drawPaperCanvas(paperRuntime.shape);}if(paperRuntime.drag){const x=Math.max(2,Math.min(79,(p.x-paperRuntime.drag.dx)/11.8)),y=Math.max(10,Math.min(86,(p.y-paperRuntime.drag.dy)/7.9));paperRuntime.drag.el.style.left=`${x}%`;paperRuntime.drag.el.style.top=`${y}%`;paperRuntime.drag.x=x;paperRuntime.drag.y=y;}});
  const end=()=>{if(paperRuntime.stroke){state.paper.strokes.push(paperRuntime.stroke);paperRuntime.stroke=null;save();drawPaperCanvas();}if(paperRuntime.shape){state.paper.shapes.push(paperRuntime.shape);paperRuntime.shape=null;save();drawPaperCanvas();}if(paperRuntime.drag){state.paper.layout[paperRuntime.drag.id]={x:paperRuntime.drag.x??parseFloat(paperRuntime.drag.el.style.left),y:paperRuntime.drag.y??parseFloat(paperRuntime.drag.el.style.top)};paperRuntime.drag=null;save();}};
  board.addEventListener('pointerup',end);board.addEventListener('pointercancel',end);
  $('#paperTitle')?.addEventListener('blur',event=>{state.paper.title=event.target.textContent.trim()||'Everything on my mind';save();});
  $$('[data-paper-text]').forEach(el=>el.addEventListener('blur',()=>{const note=state.paper.texts.find(n=>n.id===Number(el.dataset.paperText));if(note){note.text=el.textContent.trim();save();}}));
  $('#paperQuickForm')?.addEventListener('submit',event=>{event.preventDefault();const input=$('#paperQuickInput'),title=input.value.trim();if(!title)return;const id=uid();state.tasks.push({id,title,area:'Personal',category:'Paper capture',duration:30,energy:'medium',date:null,start:null,plan:'inbox',progress:0,next:'Clarify this paper capture',timer:false,publish:false,calendar:false,postponed:0});state.paper.layout[id]={x:38,y:67};state.paper.sequence.push(id);save();reward(5,'A scribble became a real task');toast('Task added from paper','It is also visible in Inbox and All Tasks.');render();});
  chooseTool('select');
}

document.addEventListener('click', event => {
  const view = event.target.closest('[data-view]'); if (view) { event.preventDefault(); setView(view.dataset.view); return; }
  const opener = event.target.closest('[data-open]'); if (opener) { openModal(opener.dataset.open); return; }
  const closer = event.target.closest('[data-close]'); if (closer) { closeModal(closer.dataset.close); return; }
  if (event.target.closest('[data-attention-open]')) { setView('all'); return; }
  const startNow = event.target.closest('[data-start-now]'); if (startNow) { const task=state.tasks.find(t=>t.id===Number(startNow.dataset.startNow)); if(task) startTimer(task); return; }
  const placeTask = event.target.closest('[data-place-task]'); if (placeTask) { const task=state.tasks.find(t=>t.id===Number(placeTask.dataset.placeTask)); if(task) ui.planningDate=task.date||iso(); setView('planner'); return; }
  const searchTask = event.target.closest('[data-search-task]'); if(searchTask){const task=state.tasks.find(t=>t.id===Number(searchTask.dataset.searchTask));ui.allQuery=task?.title||'';closeModal('searchModal');setView('all');return;}
  const paperComplete=event.target.closest('[data-paper-complete]');if(paperComplete){const task=state.tasks.find(t=>t.id===Number(paperComplete.dataset.paperComplete));if(task)updateProgress(task.id,task.progress>=100?0:100);return;}
  const paperMark=event.target.closest('[data-paper-mark]');if(paperMark){const task=state.tasks.find(t=>t.id===Number(paperMark.dataset.paperMark));if(task){const marks=[null,'circle','box','star'],current=marks.includes(task.paperEmphasis)?task.paperEmphasis:null;task.paperEmphasis=marks[(marks.indexOf(current)+1)%marks.length];save();render();toast(task.paperEmphasis?`Marked ${task.paperEmphasis}`:'Mark removed','The same importance appears in structured task views.');}return;}
  if(event.target.closest('[data-paper-order]')){const open=state.tasks.filter(t=>t.progress<100);state.paper.sequence=open.sort((a,b)=>{const pa=state.paper.layout[a.id]||paperPosition(a,open.indexOf(a)),pb=state.paper.layout[b.id]||paperPosition(b,open.indexOf(b));return Math.abs(pa.y-pb.y)>4?pa.y-pb.y:pa.x-pb.x;}).map(t=>t.id);save();render();reward(10,'Your visual sequence now guides task views');toast('Page order saved','Sequence numbers now appear across the website.');return;}
  if(event.target.closest('[data-clear-ink]')){state.paper.strokes=[];state.paper.shapes=[];save();drawPaperCanvas();toast('Ink cleared','Tasks and written notes stayed on the page.');return;}
  const taskEl = event.target.closest('[data-task]');
  if (taskEl) {
    const task = state.tasks.find(t => t.id === Number(taskEl.dataset.task)); if (!task) return;
    if (event.target.closest('[data-action="complete"]')) updateProgress(task.id, task.progress >= 100 ? 0 : 100);
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
  const category = event.target.closest('[data-category]'); if (category) { ui.view='inbox'; ui.category=category.dataset.category; ui.space=null; render(); return; }
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
});
document.addEventListener('change', event => { if (event.target.matches('[data-progress]')) updateProgress(Number(event.target.closest('[data-task]').dataset.task), event.target.value); });

$('#captureTrigger').addEventListener('click',()=>openModal('taskModal')); $('#mobileAdd').addEventListener('click',()=>openModal('taskModal'));
$('#searchTrigger').addEventListener('click',openSearch); $('#mobileSearch').addEventListener('click',openSearch);
$$('[data-view]').forEach(control => control.addEventListener('click', event => { event.preventDefault(); setView(control.dataset.view); }));
$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#focusBtn').addEventListener('click',()=>{document.body.classList.toggle('focus-mode');toast(document.body.classList.contains('focus-mode')?'Focus mode on':'Focus mode off');});
$('#taskArea').addEventListener('change',()=>{const map={Career:['College','DSA','Meetings','Projects'],Personal:['Health','Home','Relationships'],Growth:['Learning','Reading','Skills']};$('#taskCategory').innerHTML=map[$('#taskArea').value].map(x=>`<option>${x}</option>`).join('');});
$('#taskForm').addEventListener('submit', event => {
  event.preventDefault(); const plan=$('#taskPlan').value, date=$('#taskDate').value || (plan==='inbox'?null:iso());
  state.tasks.unshift({id:uid(),title:$('#taskTitle').value.trim(),area:$('#taskArea').value,category:$('#taskCategory').value,duration:Number($('#taskDuration').value),energy:$('#taskEnergy').value,plan,date,start:plan==='fixed'?$('#taskStart').value:null,windowStart:$('#taskStart').value,windowEnd:$('#taskEnd').value,decideBy:$('#decideBy').value||iso(),progress:0,next:$('#taskNext').value.trim(),timer:$('#taskTimer').checked,publish:$('#taskPublish').checked,publicTitle:'Focused work',calendar:$('#taskCalendar').checked,postponed:0});
  save(); event.target.reset(); $('#taskStart').value='10:00';$('#taskEnd').value='18:00';closeModal('taskModal');reward(5,'Your mind can release the task');toast('Captured','The task is safely in your command center.');render();
});
$('#freeForm').addEventListener('submit',event=>{event.preventDefault();state.availability.push({id:uid(),date:$('#freeDate').value,start:$('#freeStart').value,end:$('#freeEnd').value,label:$('#freeLabel').value,max:Number($('#freeMax').value)});save();closeModal('freeModal');toast('Free time published','Visitors can request this window, subject to approval.');render();});
$('#timerToggle').addEventListener('click',()=>{if(!ui.timer)return;ui.timer.running=!ui.timer.running;$('#timerToggle').textContent=ui.timer.running?'Ⅱ':'▶';});
$('#timerStop').addEventListener('click',finishTimer); $('#timerClose').addEventListener('click',closeTimer);
$('#resetBtn').addEventListener('click',()=>{state=clone(seed);state.paper={title:'Everything on my mind',strokes:[],shapes:[],texts:[{id:9001,x:7.5,y:11.5,text:'Do what matters. Leave room to breathe.',type:'note'}],layout:{},sequence:[]};save();ui={view:'today',space:null,category:null,planningDate:iso(),rescueId:null,timer:null};closeTimer();render();toast('Demo restored','All sample data is back.');});
$$('.modal-layer').forEach(layer=>layer.addEventListener('click',e=>{if(e.target===layer)closeModal(layer.id);}));
document.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);if((e.key==='c'||e.key==='C')&&!typing)openModal('taskModal');if(e.key==='/'&&!typing){e.preventDefault();openSearch();}if(e.key==='Escape')$$('.modal-layer.open').forEach(m=>closeModal(m.id));});

const now=new Date();$('#dateDay').textContent=now.getDate();$('#dateMonth').textContent=now.toLocaleDateString('en-US',{month:'short'}).toUpperCase();$('#taskDate').value=iso();$('#taskDate').min=iso();$('#decideBy').value=iso();$('#freeDate').value=iso(addDays(1));$('#freeDate').min=iso();
if(location.hash.startsWith('#invite=')){setTimeout(visitorPreview,100);} render();
