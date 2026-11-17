import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const holder = document.querySelector('.why-3d');
const canvas = document.getElementById('logo3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fail = () => holder && holder.classList.add('no-webgl');

try {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100); camera.position.set(0, 0, 11);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fb6dd, 3); rim.position.set(-6, -2, -4); scene.add(rim);

  const palette = { 'rgb(47, 126, 183)': [0x2f7eb7, .55, .25], 'rgb(171, 171, 175)': [0xd4d6da, .55, .3], 'rgb(2, 2, 2)': [0xe9edf2, .3, .35], 'rgb(255, 255, 255)': [0xffffff, .1, .4] };
  const group = new THREE.Group(), pivot = new THREE.Group(); pivot.add(group); scene.add(pivot);

  new SVGLoader().load(new URL('../img/ICONE.svg', import.meta.url).href, data => {
    data.paths.forEach(p => {
      const fill = (p.userData.style.fill || '').toLowerCase();
      if (!fill || fill === 'none' || !palette[fill]) return;
      const [color, metalness, roughness] = palette[fill];
      const mat = new THREE.MeshPhysicalMaterial({ color, metalness, roughness, clearcoat: .7, clearcoatRoughness: .15 });
      SVGLoader.createShapes(p).forEach(shape => {
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 22, bevelEnabled: true, bevelThickness: 2, bevelSize: 1.2, bevelSegments: 4, curveSegments: 16 });
        group.add(new THREE.Mesh(geo, mat));
      });
    });
    const box = new THREE.Box3().setFromObject(group), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    group.position.set(-c.x, -c.y, -c.z);
    const k = 4.2 / Math.max(s.x, s.y); pivot.scale.set(k, -k, k);
resize(); intro = performance.now(); if (reduce) renderer.render(scene, camera);
  }, undefined, fail);

  const resize = () => { const r = holder.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(holder);
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  let visible = false, intro = 0, raf = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !reduce && !raf) loop(); }).observe(holder);
  const loop = now => {
    raf = visible ? requestAnimationFrame(loop) : 0; if (!now) return;
    const t = now / 1000, p = intro ? Math.min(1, (now - intro) / 2200) : 0, e = 1 - Math.pow(1 - p, 4);
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
    pivot.rotation.y = (1 - e) * -Math.PI * 2 + Math.sin(t * .5) * .22 + mouse.x * .28;
    pivot.rotation.x = .08 + mouse.y * .15;
    pivot.position.y = Math.sin(t * 1.1) * .1;
    renderer.render(scene, camera);
  };
} catch (err) { console.warn('[Inova] 3D disabled:', err); fail(); }
