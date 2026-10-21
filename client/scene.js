const canvas = document.querySelector('#lifeScene');
const sceneButton = document.querySelector('#sceneBtn');
const effectsSelect = document.querySelector('#visualEffects');
const effectsHint = document.querySelector('#visualEffectsHint');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compactDevice = matchMedia('(max-width: 760px), (pointer: coarse)');
const standaloneMode = matchMedia('(display-mode: standalone)');
const lowPower = (navigator.hardwareConcurrency || 4) <= 4;
let preference = 'auto';
try { preference = localStorage.getItem('life-command-3d') || 'auto'; } catch {}
if (!['auto', 'off', 'on'].includes(preference)) preference = 'auto';

let enabled = false, initialization = null, renderer = null, drawFrame = null;
let scrolling = false, scrollTimer = 0, rendering = false, activeCard = null;
let pointerFrame = 0, latestPointer = null;
const pointer = { x:0, y:0, tx:0, ty:0 };
const tiltSelector = '.metric,.attention-section,.section-card,.decision-card,.unscheduled-card,.request-card,.share-settings,.public-card,.insight-card,.now-card';

function clearTilt() {
  if (!activeCard) return;
  activeCard.classList.remove('tilt-active');
  activeCard.style.transform = '';
  activeCard = null;
}
function refreshLoop() {
  if (!renderer || !drawFrame) return;
  const shouldRender = enabled && !document.hidden && !scrolling && !document.querySelector('.modal-layer.open');
  if (shouldRender === rendering) return;
  rendering = shouldRender;
  renderer.setAnimationLoop(shouldRender ? drawFrame : null);
  if (!shouldRender) {
    clearTilt();
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
  }
}
async function applyEffects() {
  const installed = standaloneMode.matches || Boolean(navigator.standalone);
  enabled = !reducedMotion.matches && (preference === 'on' || (preference === 'auto' && !compactDevice.matches && !lowPower && !installed));
  document.body.classList.toggle('app-standalone', installed);
  document.body.classList.toggle('scene-off', !enabled);
  document.body.classList.toggle('performance-mode', !enabled);
  sceneButton?.classList.toggle('active', enabled);
  sceneButton?.setAttribute('aria-pressed', String(enabled));
  if (canvas) canvas.hidden = !enabled;
  if (effectsSelect) effectsSelect.value = preference;
  if (effectsHint) effectsHint.textContent = reducedMotion.matches
    ? 'Reduced motion is enabled on this device. Smooth mode is active.'
    : enabled ? '3D is on. Animation pauses while scrolling, in dialogs and when the app is hidden.'
    : 'Smooth mode is active. Decorative animation and blur are off on this device.';
  clearTilt();
  if (enabled && !renderer) {
    try { await initializeScene(); }
    catch {
      renderer?.dispose(); renderer = null; drawFrame = null; rendering = false;
      initialization = null;
      preference = 'off';
      await applyEffects();
      if (effectsHint) effectsHint.textContent = '3D could not load. Smooth mode is ready; you can try 3D again later.';
      return;
    }
  }
  refreshLoop();
}
function chooseEffects(value) {
  preference = value;
  try { localStorage.setItem('life-command-3d', preference); } catch {}
  applyEffects();
}
sceneButton?.addEventListener('click', () => chooseEffects(enabled ? 'off' : 'on'));
effectsSelect?.addEventListener('change', event => chooseEffects(event.target.value));
[reducedMotion, compactDevice, standaloneMode].forEach(query => query.addEventListener('change', applyEffects));
document.addEventListener('visibilitychange', refreshLoop);
document.addEventListener('life-modal-change', refreshLoop);
document.addEventListener('scroll', () => {
  scrolling = true;
  refreshLoop();
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => { scrolling = false; refreshLoop(); }, 140);
}, { passive:true, capture:true });

function initializeScene() {
  if (initialization) return initialization;
  initialization = (async () => {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js');
    renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:false, powerPreference:'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
    camera.position.set(0, 0, 7.5);
    const world = new THREE.Group(); scene.add(world);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 1), new THREE.MeshPhysicalMaterial({color:0xc9f46c,roughness:.4,metalness:.08,transparent:true,opacity:.5,flatShading:true})); world.add(core);
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.52, 1), new THREE.MeshBasicMaterial({color:0x111514,wireframe:true,transparent:true,opacity:.11})); world.add(shell);
    const rings = [2.05,2.48].map((radius,index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius,.012,6,72),new THREE.MeshBasicMaterial({color:0x111514,transparent:true,opacity:.14}));
      ring.rotation.set(index ? 1.15 : .58, index ? .35 : -.28, index ? .2 : -.15);
      world.add(ring); return ring;
    });
    const nodes = [[0xff7962,2.05,0],[0x75a6ff,2.48,2.1],[0xc9f46c,2.05,4.2],[0xb79cff,2.48,5.2]].map(([color,radius,angle],index) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(index===3 ? .14 : .11,10,10),new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.1}));
      mesh.userData = {radius,angle,speed:.0017+index*.00035,lift:(index-1.5)*.24};
      world.add(mesh); return mesh;
    });
    scene.add(new THREE.HemisphereLight(0xf8fff0,0x34403a,2));
    const key = new THREE.DirectionalLight(0xffffff,2.2); key.position.set(4,5,5); scene.add(key);
    const layout = () => {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth,innerHeight,false);
      world.position.set(innerWidth>1050 ? 2.65 : innerWidth>760 ? 1.8 : .7, -.15, -1.25);
      world.scale.setScalar(innerWidth<760 ? .68 : 1);
    };
    layout(); addEventListener('resize', layout, {passive:true});
    let lastFrame = 0;
    // Stop the renderer entirely outside active use; cap decorative drawing at 30 fps.
    drawFrame = time => {
      if (time - lastFrame < 1000/30) return;
      lastFrame = time;
      const t = time / 1000;
      pointer.x += (pointer.tx-pointer.x)*.05; pointer.y += (pointer.ty-pointer.y)*.05;
      world.rotation.y = t*.055+pointer.x*.14; world.rotation.x = -.12+pointer.y*.1;
      shell.rotation.y = -t*.075; shell.rotation.z = t*.035;
      rings[0].rotation.z = -.15+Math.sin(t*.22)*.12; rings[1].rotation.y = .35+Math.cos(t*.18)*.1;
      core.scale.setScalar(1+Math.sin(t*.85)*.015);
      nodes.forEach((node,index) => {
        const data = node.userData, a = data.angle+t*data.speed*60;
        node.position.set(Math.cos(a)*data.radius,Math.sin(a)*data.radius*.42+data.lift,Math.sin(a)*.7);
        node.scale.setScalar(1+Math.sin(t*1.2+index)*.08);
      });
      camera.position.x += (pointer.x*.1-camera.position.x)*.025;
      camera.position.y += (pointer.y*.07-camera.position.y)*.025;
      camera.lookAt(0,0,0); renderer.render(scene,camera);
    };
  })();
  return initialization;
}
document.addEventListener('pointermove', event => {
  if (!rendering || event.pointerType === 'touch' || compactDevice.matches) return;
  latestPointer = event;
  if (pointerFrame) return;
  pointerFrame = requestAnimationFrame(() => {
    pointerFrame = 0;
    if (!rendering) return;
    const { clientX,clientY,target } = latestPointer;
    pointer.tx = clientX/innerWidth*2-1; pointer.ty = -(clientY/innerHeight*2-1);
    const card = target.closest(tiltSelector);
    if (card !== activeCard) clearTilt();
    if (!card) return;
    activeCard = card;
    const rect = card.getBoundingClientRect(), x = (clientX-rect.left)/rect.width, y = (clientY-rect.top)/rect.height;
    card.classList.add('tilt-active');
    card.style.setProperty('--shine-x', `${x*100}%`); card.style.setProperty('--shine-y', `${y*100}%`);
    card.style.transform = `perspective(900px) rotateX(${(.5-y)*2.2}deg) rotateY(${(x-.5)*3}deg) translateZ(3px)`;
  });
}, {passive:true});
document.addEventListener('pointerout', event => {
  if (activeCard && !activeCard.contains(event.relatedTarget)) clearTilt();
});
applyEffects();
