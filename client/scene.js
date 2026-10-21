const canvas = document.querySelector('#lifeScene');
const sceneButton = document.querySelector('#sceneBtn');
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const compactDevice = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const lowPower = (navigator.hardwareConcurrency || 4) <= 4;
const standalone = document.body.classList.contains('app-standalone');
let preference = null;
try { preference = localStorage.getItem('life-command-3d'); } catch {}

let enabled = preference === 'on' || (preference !== 'off' && !prefersReduced && !compactDevice && !lowPower && !standalone);
document.body.classList.toggle('scene-off', !enabled);
sceneButton?.classList.toggle('active', enabled);
if (canvas) canvas.hidden = !enabled;

let initialized = false;
let startScene = null;
sceneButton?.addEventListener('click', async () => {
  enabled = !enabled;
  document.body.classList.toggle('scene-off', !enabled);
  document.body.classList.toggle('performance-mode', !enabled && (compactDevice || standalone));
  sceneButton.classList.toggle('active', enabled);
  if (canvas) canvas.hidden = !enabled;
  try { localStorage.setItem('life-command-3d', enabled ? 'on' : 'off'); } catch {}
  if (enabled && startScene) await startScene();
});

startScene = async () => {
  if (initialized || !canvas) return;
  initialized = true;
  let THREE;
  try { THREE = await import('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js'); }
  catch { canvas.hidden = true; enabled = false; return; }

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:false, powerPreference:'low-power' }); }
  catch { canvas.hidden = true; enabled = false; return; }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
  camera.position.set(0, 0, 7.5);
  const world = new THREE.Group(); scene.add(world);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 1), new THREE.MeshPhysicalMaterial({color:0xc9f46c,roughness:.4,metalness:.08,transparent:true,opacity:.5,flatShading:true})); world.add(core);
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.52, 1), new THREE.MeshBasicMaterial({color:0x111514,wireframe:true,transparent:true,opacity:.11})); world.add(shell);
  const rings = [2.05,2.48].map((radius,index)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.012,6,72),new THREE.MeshBasicMaterial({color:0x111514,transparent:true,opacity:.14}));ring.rotation.set(index ? 1.15 : .58,index ? .35 : -.28,index ? .2 : -.15);world.add(ring);return ring;});
  const nodeData=[[0xff7962,2.05,0],[0x75a6ff,2.48,2.1],[0xc9f46c,2.05,4.2],[0xb79cff,2.48,5.2]];
  const nodes=nodeData.map(([color,radius,angle],index)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(index===3 ? .14 : .11,10,10),new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.1}));mesh.userData={radius,angle,speed:.0017+index*.00035,lift:(index-1.5)*.24};world.add(mesh);return mesh;});
  scene.add(new THREE.HemisphereLight(0xf8fff0,0x34403a,2));
  const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(4,5,5);scene.add(key);
  const pointer={x:0,y:0,tx:0,ty:0};
  let impulse=0,progressTarget=1,lastFrame=0,scrolling=false,scrollTimer=0,pointerFrame=0;
  const layout=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);world.position.set(innerWidth>1050?2.65:1.8,-.15,-1.25);};
  layout(); addEventListener('resize',layout,{passive:true});
  addEventListener('scroll',()=>{scrolling=true;clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>scrolling=false,120);},{passive:true});
  addEventListener('pointermove',event=>{if(pointerFrame)return;pointerFrame=requestAnimationFrame(()=>{pointer.tx=event.clientX/innerWidth*2-1;pointer.ty=-(event.clientY/innerHeight*2-1);pointerFrame=0;});},{passive:true});
  document.addEventListener('click',event=>{if(event.target.closest('[data-view],[data-action],[data-start-now],[data-schedule]'))impulse=.8;});
  document.addEventListener('input',event=>{if(event.target.matches('[data-progress]'))progressTarget=.86+Number(event.target.value)/360;});
  const clock=new THREE.Clock();
  renderer.setAnimationLoop(time=>{
    if(!enabled||document.hidden||scrolling||document.body.classList.contains('scene-off')||time-lastFrame<33)return;
    lastFrame=time;const t=clock.getElapsedTime();pointer.x+=(pointer.tx-pointer.x)*.05;pointer.y+=(pointer.ty-pointer.y)*.05;impulse*=.92;
    world.rotation.y=t*.055+pointer.x*.14+impulse;world.rotation.x=-.12+pointer.y*.1;shell.rotation.y=-t*.075;shell.rotation.z=t*.035;rings[0].rotation.z=-.15+Math.sin(t*.22)*.12;rings[1].rotation.y=.35+Math.cos(t*.18)*.1;
    const pulse=progressTarget+Math.sin(t*.85)*.015;core.scale.setScalar(core.scale.x+(pulse-core.scale.x)*.04);
    nodes.forEach((node,index)=>{const data=node.userData,a=data.angle+t*data.speed*60;node.position.set(Math.cos(a)*data.radius,Math.sin(a)*data.radius*.42+data.lift,Math.sin(a)*.7);node.scale.setScalar(1+Math.sin(t*1.2+index)*.08);});
    camera.position.x+=(pointer.x*.1-camera.position.x)*.025;camera.position.y+=(pointer.y*.07-camera.position.y)*.025;camera.lookAt(0,0,0);renderer.render(scene,camera);
  });

  const tiltSelector='.metric,.attention-section,.section-card,.decision-card,.unscheduled-card,.request-card,.share-settings,.public-card,.insight-card,.now-card';
  let tiltFrame=0,tiltEvent=null;
  document.addEventListener('pointermove',event=>{if(!enabled||scrolling||tiltFrame)return;tiltEvent=event;tiltFrame=requestAnimationFrame(()=>{const card=tiltEvent.target.closest(tiltSelector);tiltFrame=0;if(!card)return;const rect=card.getBoundingClientRect(),x=(tiltEvent.clientX-rect.left)/rect.width,y=(tiltEvent.clientY-rect.top)/rect.height;card.classList.add('tilt-active');card.style.setProperty('--shine-x',`${x*100}%`);card.style.setProperty('--shine-y',`${y*100}%`);card.style.transform=`perspective(900px) rotateX(${(0.5-y)*2.2}deg) rotateY(${(x-.5)*3}deg) translateZ(3px)`;});},{passive:true});
  document.addEventListener('pointerout',event=>{const card=event.target.closest?.(tiltSelector);if(!card||card.contains(event.relatedTarget))return;card.classList.remove('tilt-active');card.style.transform='';});
};

if (enabled) startScene();
