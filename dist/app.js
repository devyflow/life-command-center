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
  return `<article class="task-row ${done ? 'done' : ''}" data-task="${task.id}">
    <button class="task-check" data-action="complete" aria-label="${done ? 'Mark incomplete' : 'Complete task'}">${done ? '✓' : ''}</button>
    <div><div class="task-title">${esc(task.title)}</div><div class="task-meta"><span class="mini-dot" style="background:${color(task.area)}"></span>${esc(task.area)} / ${esc(task.category)} · ${duration(task.duration)} <span class="energy">${task.energy}</span>${task.start ? ` · ${clock(mins(task.start))}` : ''}</div></div>
    <div class="task-side"><button class="icon-action" data-action="timer" title="Start timer">◷</button><button class="icon-action" data-action="calendar" title="Export calendar event">▣</button><button class="icon-action" data-action="publish" title="${task.publish ? 'Remove from shared calendar' : 'Show on shared calendar'}">${task.publish ? '●' : '○'}</button></div>
    <label class="progress-line"><input type="range" min="0" max="100" step="5" value="${task.progress}" data-progress><span>${task.progress}%</span></label>
    ${task.next ? `<div class="next-step">Next: ${esc(task.next)}</div>` : ''}
  </article>`;
}

function pageHead(kicker, title, actions = '') {
  return `<header class="page-head"><div><p class="page-kicker">${kicker}</p><h1>${title}</h1></div>${actions ? `<div class="head-actions">${actions}</div>` : ''}</header>`;
}

function todayView() {
  const tasks = state.tasks.filter(t => t.date === iso() && t.plan !== 'inbox');
  const open = tasks.filter(t => t.progress < 100);
  const remaining = Math.round(open.reduce((n, t) => n + t.duration * (1 - t.progress / 100), 0));
  const focus = Math.round(state.tasks.reduce((n, t) => n + t.duration * t.progress / 100, 0));
  const stuck = state.tasks.filter(t => t.postponed >= 2 && t.progress < 100).sort((a, b) => b.postponed - a.postponed)[0];
  const level = Math.floor(state.profile.xp / 400) + 3, progress = state.profile.xp % 400;
  return `${pageHead(new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase(), `Good morning.<br><em>Protect what matters.</em>`, `<button class="secondary" data-view="planner">Open hour plan</button><button class="primary" data-open="taskModal">+ Add task</button>`)}
    <section class="metric-row">
      <article class="metric"><small>REMAINING LOAD</small><strong>${duration(remaining)}</strong><span>${remaining > 300 ? 'A full day — protect focus' : 'Comfortably achievable'}</span></article>
      <article class="metric"><small>FOCUS COMPLETED</small><strong>${duration(focus)}</strong><span>${state.profile.sessions} sessions this week</span></article>
      <article class="metric"><small>PRODUCTIVE STREAK</small><strong>${state.profile.streak} days</strong><span>Rest never breaks recovery</span></article>
      <article class="metric accent"><small>MOMENTUM</small><strong>${state.profile.xp} XP</strong><span>Level ${level} · ${400 - progress} XP to next</span></article>
    </section>
    <div class="grid-main">
      <section class="section-card"><div class="section-title"><div><h2>Committed today</h2><p>Progress changes the time still needed.</p></div><button class="ghost-btn" data-view="planner">See timeline →</button></div><div class="task-list">${tasks.length ? tasks.map(taskCard).join('') : '<div class="empty"><b>Your day is open.</b>Capture a task or protect some free time.</div>'}</div></section>
      <aside>
        ${stuck ? `<article class="recovery-card"><div class="recovery-top"><p class="eyebrow">NEEDS RECOVERY</p><span>!</span></div><h3>${esc(stuck.title)}</h3><p>Postponed ${stuck.postponed} times. The problem may be the starting point, not your motivation.</p><button data-rescue-open="${stuck.id}">Unstick this task →</button></article>` : ''}
        <article class="momentum-card"><p class="eyebrow">YOUR MOMENTUM</p><div class="level"><strong>Level ${level}</strong><small>${progress} / 400 XP</small></div><div class="xp-track"><i style="width:${progress / 4}%"></i></div><small>Rewarding focus, honest progress and realistic planning.</small><div class="badge-row"><span class="mini-badge" title="First focus">◈</span><span class="mini-badge" title="Five day flow">✦</span><span class="mini-badge" title="Accurate planner">⌁</span><span class="mini-badge locked" title="Deep work week">◇</span></div></article>
      </aside>
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
  const renderers = { today: todayView, planner: plannerView, inbox: inboxView, requests: requestsView, share: shareView, insights: insightsView };
  $('#app').innerHTML = (renderers[ui.view] || todayView)();
  $$('.nav-item,.mobile-nav button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === ui.view));
  const todayOpen = state.tasks.filter(t => t.date === iso() && t.progress < 100).length;
  $('#todayCount').textContent = todayOpen; $('#plannerCount').textContent = state.tasks.filter(t => t.date === ui.planningDate && t.progress < 100).length;
  $('#inboxCount').textContent = state.tasks.filter(t => t.plan === 'inbox' && t.progress < 100).length;
  $('#requestCount').textContent = state.requests.filter(r => r.status === 'pending').length;
  ['Career','Personal','Growth'].forEach(a => $(`#${a.toLowerCase()}Count`).textContent = state.tasks.filter(t => t.area === a && t.progress < 100).length);
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

document.addEventListener('click', event => {
  const view = event.target.closest('[data-view]'); if (view) { event.preventDefault(); setView(view.dataset.view); return; }
  const opener = event.target.closest('[data-open]'); if (opener) { openModal(opener.dataset.open); return; }
  const closer = event.target.closest('[data-close]'); if (closer) { closeModal(closer.dataset.close); return; }
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

document.addEventListener('input', event => { if (event.target.matches('[data-progress]')) event.target.nextElementSibling.textContent = `${event.target.value}%`; });
document.addEventListener('change', event => { if (event.target.matches('[data-progress]')) updateProgress(Number(event.target.closest('[data-task]').dataset.task), event.target.value); });

$('#captureTrigger').addEventListener('click',()=>openModal('taskModal')); $('#mobileAdd').addEventListener('click',()=>openModal('taskModal'));
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
$('#resetBtn').addEventListener('click',()=>{state=clone(seed);save();ui={view:'today',space:null,category:null,planningDate:iso(),rescueId:null,timer:null};closeTimer();render();toast('Demo restored','All sample data is back.');});
$$('.modal-layer').forEach(layer=>layer.addEventListener('click',e=>{if(e.target===layer)closeModal(layer.id);}));
document.addEventListener('keydown',e=>{if((e.key==='c'||e.key==='C')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))openModal('taskModal');if(e.key==='Escape')$$('.modal-layer.open').forEach(m=>closeModal(m.id));});

const now=new Date();$('#dateDay').textContent=now.getDate();$('#dateMonth').textContent=now.toLocaleDateString('en-US',{month:'short'}).toUpperCase();$('#taskDate').value=iso();$('#taskDate').min=iso();$('#decideBy').value=iso();$('#freeDate').value=iso(addDays(1));$('#freeDate').min=iso();
if(location.hash.startsWith('#invite=')){setTimeout(visitorPreview,100);} render();
