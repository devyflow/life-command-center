import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';

const canvas = document.querySelector('#lifeScene');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const lowPower = (navigator.hardwareConcurrency || 4) <= 2;
let enabled = !prefersReduced.matches && !lowPower;
let renderer;

try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
} catch {
  canvas.hidden = true;
  enabled = false;
}

if (renderer) {
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
  camera.position.set(0, 0, 7.5);

  const world = new THREE.Group();
  scene.add(world);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.18, 2),
    new THREE.MeshPhysicalMaterial({ color: 0xc9f46c, roughness: .34, metalness: .12, transmission: .16, transparent: true, opacity: .56, flatShading: true })
  );
  world.add(core);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.52, 1),
    new THREE.MeshBasicMaterial({ color: 0x111514, wireframe: true, transparent: true, opacity: .12 })
  );
  world.add(shell);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x111514, transparent: true, opacity: .16 });
  const rings = [2.05, 2.48].map((radius, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .012, 8, 128), ringMaterial.clone());
    ring.rotation.set(index ? 1.15 : .58, index ? .35 : -.28, index ? .2 : -.15);
    world.add(ring);
    return ring;
  });

  const nodeData = [
    [0xff7962, 2.05, 0], [0x75a6ff, 2.48, 2.1], [0xc9f46c, 2.05, 4.2], [0xb79cff, 2.48, 5.2]
  ];
  const nodes = nodeData.map(([color, radius, angle], index) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(index === 3 ? .14 : .11, 18, 18),
      new THREE.MeshStandardMaterial({ color, roughness: .3, metalness: .18, emissive: color, emissiveIntensity: .08 })
    );
    mesh.userData = { radius, angle, speed: .0017 + index * .00035, lift: (index - 1.5) * .24 };
    world.add(mesh);
    return mesh;
  });

  const positions = new Float32Array(270);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (Math.random() - .5) * 9;
    positions[i + 1] = (Math.random() - .5) * 6;
    positions[i + 2] = (Math.random() - .5) * 5 - 1;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0x58615c, size: .025, transparent: true, opacity: .28 }));
  scene.add(particles);

  scene.add(new THREE.HemisphereLight(0xf8fff0, 0x34403a, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(4, 5, 5); scene.add(key);
  const limeLight = new THREE.PointLight(0xc9f46c, 12, 8); limeLight.position.set(-2, -1, 3); scene.add(limeLight);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let impulse = 0;
  let progressTarget = 1;

  function layout() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    world.position.set(innerWidth > 1050 ? 2.65 : innerWidth > 760 ? 1.8 : .7, -.15, -1.25);
    world.scale.setScalar(innerWidth < 760 ? .68 : 1);
  }
  layout();
  addEventListener('resize', layout, { passive: true });
  addEventListener('pointermove', event => {
    pointer.tx = event.clientX / innerWidth * 2 - 1;
    pointer.ty = -(event.clientY / innerHeight * 2 - 1);
  }, { passive: true });

  document.addEventListener('click', event => {
    if (event.target.closest('[data-view], [data-action], [data-start-now], [data-schedule]')) impulse = .8;
  });
  document.addEventListener('input', event => {
    if (event.target.matches('[data-progress]')) progressTarget = .86 + Number(event.target.value) / 360;
  });

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!enabled || document.hidden || document.body.classList.contains('scene-off')) return;
    const t = clock.getElapsedTime();
    pointer.x += (pointer.tx - pointer.x) * .035;
    pointer.y += (pointer.ty - pointer.y) * .035;
    impulse *= .94;
    world.rotation.y = t * .055 + pointer.x * .18 + impulse;
    world.rotation.x = -.12 + pointer.y * .12;
    shell.rotation.y = -t * .075;
    shell.rotation.z = t * .035;
    rings[0].rotation.z = -.15 + Math.sin(t * .22) * .12;
    rings[1].rotation.y = .35 + Math.cos(t * .18) * .1;
    const pulse = progressTarget + Math.sin(t * .85) * .015;
    core.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), .04);
    nodes.forEach((node, index) => {
      const data = node.userData;
      const a = data.angle + t * data.speed * 60;
      node.position.set(Math.cos(a) * data.radius, Math.sin(a) * data.radius * .42 + data.lift, Math.sin(a) * .7);
      node.scale.setScalar(1 + Math.sin(t * 1.2 + index) * .08);
    });
    particles.rotation.y = t * .006;
    camera.position.x += (pointer.x * .13 - camera.position.x) * .025;
    camera.position.y += (pointer.y * .09 - camera.position.y) * .025;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });

  const sceneButton = document.querySelector('#sceneBtn');
  sceneButton?.addEventListener('click', () => {
    document.body.classList.toggle('scene-off');
    sceneButton.classList.toggle('active', !document.body.classList.contains('scene-off'));
  });
}

const tiltSelector = '.metric,.attention-section,.section-card,.decision-card,.unscheduled-card,.request-card,.share-settings,.public-card,.insight-card,.now-card';
document.addEventListener('pointermove', event => {
  if (!enabled || innerWidth < 760 || document.body.classList.contains('scene-off')) return;
  const card = event.target.closest(tiltSelector);
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  card.classList.add('tilt-active');
  card.style.setProperty('--shine-x', `${x * 100}%`);
  card.style.setProperty('--shine-y', `${y * 100}%`);
  card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 3.2}deg) rotateY(${(x - 0.5) * 4.2}deg) translateZ(4px)`;
}, { passive: true });
document.addEventListener('pointerout', event => {
  const card = event.target.closest?.(tiltSelector);
  if (!card || card.contains(event.relatedTarget)) return;
  card.classList.remove('tilt-active');
  card.style.transform = '';
});
