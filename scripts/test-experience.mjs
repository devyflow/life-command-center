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
  body:element(), documentElement:{dataset:{}}, activeElement:{tagName:'BODY'}, hidden:false,
  querySelector(key){if(!elements.has(key))elements.set(key,element());return elements.get(key);},
  querySelectorAll(){return [];},createElement:element,dispatchEvent(){},
  addEventListener(type,listener){const list=listeners.get(type)||[];list.push(listener);listeners.set(type,list);}
};
const testLocation={hash:'#today'};
const context = vm.createContext({
  document,location:testLocation,history:{},window:{matchMedia:()=>({matches:false}),scrollTo(){},addEventListener(){},history:{pushState(_state,_title,hash){testLocation.hash=hash;}}},
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

reset();
run(`state.tasks=Array.from({length:24},(_,index)=>({id:index+1,title:'Dense task '+(index+1),progress:0,duration:30,area:'Career',category:'Projects',plan:'inbox',paperMarks:{}}));state.paper.layout={};state.paper.texts=[];normalizeStateShape();`);
const densePaper=read(`(()=>{const plan=paperPlan(state.tasks),rects=[...plan.positions.values()].map(item=>({...item,w:300,h:76}));let overlaps=0;for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)overlaps++;}return{height:plan.height,count:rects.length,overlaps,maxBottom:Math.max(...rects.map(item=>item.y+item.h))};})()`);
assert.equal(densePaper.count,24);
assert.equal(densePaper.overlaps,0,'Guided Paper placement must not overlap dense tasks');
assert.ok(densePaper.height>=densePaper.maxBottom,'Paper must expand to contain every task');
assert.equal(read('canvasView.paper.locked'),true,'Paper opens with layout protection enabled');
assert.match(run('paperView()'),/data-canvas-lock="paper"/,'Paper exposes a clear canvas lock');
assert.match(run('paperView()'),/data-canvas-zoom="paper:fit"/,'Paper can fit the whole page to a phone');
assert.match(run('paperView()'),/id="paperStage"/,'Paper uses a scaled stage without changing saved coordinates');
run(`state.paper.texts=[{id:90,x:7.5,y:11.5,text:'Legacy note',type:'note',mode:'placed',width:240,z:5}];normalizeStateShape();`);
assert.equal(read(`(()=>{const plan=paperPlan(state.tasks),p=plan.textPositions.get(90),taskRects=[...plan.positions.values()].map(item=>({...item,w:300,h:76})),headRects=plan.headings.map((item,index)=>({key:'h'+index,x:item.x,y:item.y,w:330,h:item.kind==='area'?32:18}));return paperIsOverlap('text:90',{...p,w:240,h:88},[...taskRects.map((item,index)=>({key:'t'+index,...item})),...headRects]);})()`),false,'Guided Paper text must move away from tasks and section headings');
run(`state.paper.layout[1]={x:100,y:140,unit:'px',mode:'float',z:9};`);
assert.equal(read(`paperPlan(state.tasks).positions.get(1).mode`),'float','Individual Paper tasks can deliberately float');
run(`state.boardNotes=[{id:1,text:'A visible principle',x:-5,y:0,w:20,h:30,showGlance:true}];state.library=[{id:2,title:'Diagram tool',context:'presentations',tags:['design'],status:'ready'}];normalizeStateShape();`);
assert.deepEqual(read(`({x:state.boardNotes[0].x,y:state.boardNotes[0].y,w:state.boardNotes[0].w,h:state.boardNotes[0].h})`),{x:12,y:35,w:170,h:145},'Board notes receive safe sizes and positions');
assert.match(run('boardView()'),/data-board-note-float/);
assert.equal(read('canvasView.board.locked'),true,'Bulletin opens with layout protection enabled');
assert.match(run('boardView()'),/data-canvas-lock="board"/,'Bulletin exposes a clear canvas lock');
assert.match(run('boardView()'),/data-canvas-zoom="board:fit"/,'Bulletin can fit the whole board to a phone');
assert.match(run('boardView()'),/id="bulletinStage"/,'Bulletin uses a scaled stage without changing note positions');
run(`ui.boardMenuId=1`);assert.match(run('boardView()'),/menu-open/,'Selected Bulletin controls stay open');
run(`ui.libraryFilter='active';ui.libraryQuery='presentations'`);
assert.equal(read(`state.library.filter(libraryMatches).length`),1,'Library search finds an item by its use context');
run(`state.tasks=[{id:7,title:'Prepare design presentation',next:'Build a visual diagram',area:'Career',category:'Projects',progress:0}];state.library=[{id:8,title:'Visual presentation design toolkit',context:'presentations and teaching',tags:['design','diagram'],status:'ready',minutes:30}];ui.libraryQuery='';`);
assert.equal(read(`knowledgeSuggestions(state.tasks[0],1)[0].item.id`),8,'Knowledge suggestions connect a useful item to a relevant task');
assert.match(run('libraryView()'),/QUIET CONTEXTUAL SUGGESTIONS/);
run(`renderSearchResults('diagram')`);
assert.match(elements.get('#searchResults').textContent,/data-search-library="8"/,'Global search includes useful-library items');
run(`state.tasks[0].sourceLibraryId=999;state.tasks[0].sourceLibraryIds=[8,999];state.library[0].taskId=999;normalizeStateShape();`);
assert.equal(run(`typeof state.library[0].taskId`),'undefined','Orphaned task links are removed from Knowledge items');
assert.equal(run(`typeof state.tasks[0].sourceLibraryId`),'undefined','Orphaned Knowledge sources are removed from tasks');
assert.deepEqual(read(`state.tasks[0].sourceLibraryIds`),[8],'Valid Knowledge links survive normalization');
const manifest=JSON.parse(await readFile(new URL('../client/manifest.webmanifest',import.meta.url),'utf8'));
assert.equal(manifest.share_target.action,'/?share-target=1','Installed app can receive shared links');
const serviceWorker=await readFile(new URL('../client/sw.js',import.meta.url),'utf8');
assert.match(serviceWorker,/periodicsync/,'Supporting installed browsers can check reminders in the background');
assert.match(serviceWorker,/life-command-static-v12/,'A new cache generation ships account-safe app assets');
assert.match(serviceWorker,/freshAsset/,'JavaScript and CSS check the network before using stale cache');
const page=await readFile(new URL('../client/index.html',import.meta.url),'utf8');
const stylesheet=await readFile(new URL('../client/styles.css',import.meta.url),'utf8');
assert.match(page,/id="mobileMore"/,'Mobile navigation keeps every section reachable through More');
assert.match(page,/data-task-plan-show="window"/,'Task capture progressively reveals flexible-window fields');
assert.match(page,/id="toastAction"/,'Destructive actions can offer an inline recovery action');
assert.match(page,/id="focusExit"/,'Focus mode always has a visible exit control');
assert.match(page,/id="focusSidebar"/,'Installed mobile users can enter focus mode from More');
assert.match(page,/id="accentChoice"/,'Users can choose an interface accent on their device');
assert.match(source,/else if\(e\.key==='Escape'&&document\.body\.classList\.contains\('focus-mode'\)\)setFocusMode\(false\)/,'Escape exits focus mode when no dialog is open');
assert.match(source,/\$\('#focusExit'\)\.addEventListener\('pointerdown'/,'The floating focus exit responds directly to touch input');
assert.match(source,/if\(canvasView\.paper\.locked\)return/,'Paper blocks drawing and dragging while locked');
assert.match(source,/if\(!el\|\|canvasView\.board\.locked\|\|el\.classList\.contains\('is-locked'\)\)return/,'Bulletin blocks note dragging while locked');
assert.match(stylesheet,/\.canvas-surface-locked :is\(\.paper-board,\.paper-object,#paperCanvas,\.bulletin-board,\.bulletin-note\)\{touch-action:pan-x pan-y\}/,'Locked canvases reserve touch gestures for scrolling');
assert.match(stylesheet,/\.focus-mode \.install-nudge,\.focus-mode \.update-nudge\{display:none!important\}/,'Focus mode hides install and update prompts');
console.log('Workspace: dense Paper layout, deliberate floating, bulletin normalization and contextual library retrieval passed.');

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
