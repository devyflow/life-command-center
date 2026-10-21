import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Run the actual app handlers with disposable state. No browser, server or live API is used.
const elements = new Map(), listeners = new Map(), saved = new Map();
function element() {
  let text = '';
  return {
    value:'', style:{setProperty(){}}, dataset:{}, checked:false, hidden:false,
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    set textContent(value){text=String(value);}, get textContent(){return text;},
    get innerHTML(){return text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}, set innerHTML(value){text=value;},
    addEventListener(){},setAttribute(){},closest(){return null;},querySelector(){return element();},querySelectorAll(){return [];},
    focus(){},click(){},insertAdjacentHTML(){},setSelectionRange(){}
  };
}
const document = {
  body:element(), activeElement:{tagName:'BODY'}, hidden:false,
  querySelector(key){if(!elements.has(key))elements.set(key,element());return elements.get(key);},
  querySelectorAll(){return [];},createElement:element,dispatchEvent(){},
  addEventListener(type,listener){const list=listeners.get(type)||[];list.push(listener);listeners.set(type,list);}
};
const context = vm.createContext({
  document,window:{matchMedia:()=>({matches:false}),scrollTo(){},addEventListener(){}},
  navigator:{},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},
  sessionStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},
  requestAnimationFrame(){},Event,Blob,URL,console,
  fetch(){throw new Error('Tests must never call a real API');}
});
const source=await readFile(new URL('../client/app.js',import.meta.url),'utf8');
const bootstrap=source.indexOf('const now=new Date();');
assert.ok(bootstrap>0);
vm.runInContext(source.slice(0,bootstrap),context);
const run=code=>vm.runInContext(code,context);
const read=expression=>JSON.parse(run(`JSON.stringify(${expression})`));
const reset=()=>run(`state=clone(seed);state.profile={xp:900,streak:6,bestStreak:6,sessions:9,accuratePlans:2,boundaries:1,lastProductive:iso(addDays(-14))};state.tasks=[{id:1,title:'Fixture task',progress:0,duration:30,area:'Career',category:'Projects',repeat:'none'}];normalizeStateShape();sync.ready=false;`);
reset();
assert.equal(read('state.profile.xp'),900);
run('updateProgress(1,5)');
assert.equal(read('state.profile.streak'),7,'Partial progress counts after a break');
assert.equal(read('state.profile.xp'),900,'A sub-milestone progress change gives days, not duplicate XP');
run('updateProgress(1,25);updateProgress(1,0);updateProgress(1,25)');
assert.equal(read('state.profile.xp'),910,'The same progress milestone pays only once');
assert.equal(read('state.profile.streak'),7,'A day counts only once');
run('updateProgress(1,100);updateProgress(1,0);updateProgress(1,100)');
assert.equal(read('state.profile.xp'),960,'Completion can only be rewarded once');
run('state.tasks[0].repeat="daily";spawnRecurringTask(state.tasks[0])');
assert.equal(read('state.tasks[1].rewardProgress'),0,'A recurring copy starts with fresh progress credit');
assert.equal(read('state.tasks[0].rewardProgress'),100);
const taskSnapshot=read('state.tasks'), badges=read('earnedBadges()'), sessionCount=read('state.profile.sessions');
run('resetMomentum()');
assert.equal(read('state.profile.xp'),0);
assert.equal(read('state.profile.sessions'),sessionCount,'Resetting XP preserves recorded focus sessions');
assert.deepEqual(read('earnedBadges()'),badges,'Earned badges survive the reset');
assert.deepEqual(read('state.tasks'),taskSnapshot);
run('resetRhythm()');
assert.equal(read('state.profile.streak'),0);
assert.deepEqual(read('earnedBadges()'),badges,'Resetting productive days keeps earned badges');
run('state.profile={xp:0,streak:0,bestStreak:0,sessions:0,accuratePlans:0,boundaries:0}');
assert.equal(read('earnedBadges().filter(b=>b.earned).length'),0,'New users see no invented achievements');

reset();
run(`state.requests=[
{id:1,name:'Pending Person',purpose:'Pending fixture',status:'pending',date:iso(),start:'10:00',duration:30},
{id:2,name:'Approved Person',purpose:'Approved fixture',status:'approved',date:iso(),start:'11:00',duration:30},
{id:3,name:'Declined Person',purpose:'Declined fixture',status:'declined',date:iso(),start:'12:00',duration:30}
];ui.requestFilter='pending';`);
assert.match(run('requestsView()'),/Pending fixture/);
assert.doesNotMatch(run('requestsView()'),/Approved fixture|Declined fixture/);
run("ui.requestFilter='history'");
assert.match(run('requestsView()'),/Approved fixture/);
assert.doesNotMatch(run('requestsView()'),/Pending fixture/);
const approvedTasks=read('state.tasks');
run('deleteRequest(2)');
assert.deepEqual(read('state.requests.map(r=>r.id)'),[1,3]);
assert.deepEqual(read('state.tasks'),approvedTasks,'Deleting a request must preserve created tasks');
run('clearRequestHistory()');
assert.deepEqual(read('state.requests.map(r=>r.id)'),[1],'Bulk history deletion preserves pending requests');
assert.deepEqual(read('state.tasks'),approvedTasks);
assert.equal(read('earnedBadges().find(b=>b.name==="Boundary Keeper").earned'),true);
run("ui.view='requests';ui.requestFilter='history';setView('today');setView('requests')");
assert.equal(read('ui.requestFilter'),'pending','History closes when leaving and re-entering Requests');

function requestAction(action) {
  const card={dataset:{request:'1'}};
  const button={dataset:{requestAction:action},closest:()=>card};
  const event={target:{closest:selector=>selector==='[data-request-action]'?button:null},preventDefault(){}};
  for(const listener of listeners.get('click')||[])listener(event);
}
requestAction('accept');
assert.equal(read('state.tasks.length'),3);
requestAction('accept');
assert.equal(read('state.tasks.length'),3,'Repeated approval cannot duplicate tasks');
assert.doesNotMatch(run('insightsView()'),/42%|You work best below five/);
console.log('Experience: partial progress, rest days, repeat rewards, recurring tasks, safe resets, earned badges, hidden history and request deletion passed.');

// The lifecycle test replaces only WebGL construction. Real mode/visibility handlers run unchanged.
const media = new Map(), sceneNodes = new Map(), sceneEvents = new Map(), classes = new Set();
const sceneDocument = {
  hidden:false, modal:false,
  body:{classList:{toggle(name,value){value?classes.add(name):classes.delete(name);}}},
  querySelector(selector){if(selector==='.modal-layer.open')return this.modal?{}:null;if(!sceneNodes.has(selector))sceneNodes.set(selector,element());return sceneNodes.get(selector);},
  addEventListener(name,fn){sceneEvents.set(name,fn);}
};
const sceneContext=vm.createContext({
  document:sceneDocument,navigator:{hardwareConcurrency:8},localStorage:{getItem:()=>null,setItem(){}},
  matchMedia(query){if(!media.has(query))media.set(query,{matches:query.includes('max-width'),addEventListener(){}});return media.get(query);},
  setTimeout(fn){sceneEvents.set('scrollEnd',fn);return 1;},clearTimeout(){},cancelAnimationFrame(){},requestAnimationFrame(){},
  console
});
vm.runInContext(await readFile(new URL('../client/scene.js',import.meta.url),'utf8'),sceneContext);
assert.ok(classes.has('performance-mode'),'Compact devices start without WebGL or blur');
vm.runInContext('var loopCalls=[];initializeScene=async()=>{renderer={setAnimationLoop(fn){loopCalls.push(Boolean(fn));}};drawFrame=()=>{};};preference="on";',sceneContext);
await vm.runInContext('applyEffects()',sceneContext);
assert.equal(vm.runInContext('loopCalls.at(-1)',sceneContext),true);
sceneDocument.hidden=true;sceneEvents.get('visibilitychange')();
assert.equal(vm.runInContext('loopCalls.at(-1)',sceneContext),false,'Hidden apps stop the animation loop');
sceneDocument.hidden=false;sceneEvents.get('visibilitychange')();
sceneEvents.get('scroll')();
assert.equal(vm.runInContext('loopCalls.at(-1)',sceneContext),false,'Scrolling stops the animation loop');
sceneEvents.get('scrollEnd')();
assert.equal(vm.runInContext('loopCalls.at(-1)',sceneContext),true);
sceneDocument.modal=true;sceneEvents.get('life-modal-change')();
assert.equal(vm.runInContext('loopCalls.at(-1)',sceneContext),false,'Open dialogs stop background animation');
sceneDocument.modal=false;sceneEvents.get('life-modal-change')();
vm.runInContext('preference="off"',sceneContext);await vm.runInContext('applyEffects()',sceneContext);
assert.equal(vm.runInContext('loopCalls.at(-1)',sceneContext),false);
assert.ok(classes.has('performance-mode'));
media.get('(prefers-reduced-motion: reduce)').matches=true;
vm.runInContext('preference="on"',sceneContext);await vm.runInContext('applyEffects()',sceneContext);
assert.ok(classes.has('performance-mode'),'Reduced motion is respected even with a saved 3D preference');
media.get('(prefers-reduced-motion: reduce)').matches=false;
media.get('(max-width: 760px), (pointer: coarse)').matches=false;
media.get('(display-mode: standalone)').matches=true;
vm.runInContext('preference="auto"',sceneContext);await vm.runInContext('applyEffects()',sceneContext);
assert.ok(classes.has('app-standalone'));
assert.ok(classes.has('performance-mode'),'Installed apps default to smooth rendering');
console.log('Rendering: adaptive mode, hidden tabs, scrolling, dialogs, 3D toggle and reduced-motion preference passed.');
