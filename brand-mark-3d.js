// Knotide Bio -- 3D brand mark (Three.js)
// A genuine 3D rendering of the ring + double-helix mark, rotating slowly.
// Decorative, passive: no drag/zoom controls, pauses off-screen, and skips
// the render loop entirely under prefers-reduced-motion.

(function () {
  const canvas = document.getElementById('brand-mark-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const frame = canvas.closest('.brand-mark-frame');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    return; // WebGL unavailable -- page works fine without the visual
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.1, 6.2);
  camera.lookAt(0, 0, 0);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // ---------- Lighting ----------
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9dbd6, 0.95));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(4, 5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd8e6ff, 0.5);
  fill.position.set(-5, -2, -4);
  scene.add(fill);

  const group = new THREE.Group();
  group.rotation.x = 0.1;
  scene.add(group);

  // ---------- Ring ----------
  const RING_COLOR = 0x1B2740;
  const ringGeo = new THREE.TorusGeometry(1.35, 0.20, 20, 72);
  const ringMat = new THREE.MeshStandardMaterial({ color: RING_COLOR, roughness: 0.45, metalness: 0.06 });
  group.add(new THREE.Mesh(ringGeo, ringMat));

  // ---------- Double helix ----------
  const TURNS = 2.4;
  const HEIGHT = 2.5;
  const HELIX_RADIUS = 0.62;
  const SAMPLES = 140;

  function strandPoints(phase) {
    const pts = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const theta = t * TURNS * Math.PI * 2 + phase;
      pts.push(new THREE.Vector3(
        Math.cos(theta) * HELIX_RADIUS,
        (t - 0.5) * HEIGHT,
        Math.sin(theta) * HELIX_RADIUS
      ));
    }
    return pts;
  }

  const strandAPts = strandPoints(0);
  const strandBPts = strandPoints(Math.PI);

  const strandACurve = new THREE.CatmullRomCurve3(strandAPts);
  const strandBCurve = new THREE.CatmullRomCurve3(strandBPts);

  const strandAMat = new THREE.MeshStandardMaterial({ color: 0x0F9C86, roughness: 0.35, metalness: 0.08 });
  const strandBMat = new THREE.MeshStandardMaterial({ color: 0x1B6E63, roughness: 0.35, metalness: 0.08 });

  const strandAGeo = new THREE.TubeGeometry(strandACurve, 220, 0.11, 12, false);
  const strandBGeo = new THREE.TubeGeometry(strandBCurve, 220, 0.11, 12, false);
  group.add(new THREE.Mesh(strandAGeo, strandAMat));
  group.add(new THREE.Mesh(strandBGeo, strandBMat));

  // Rungs connecting the two strands at regular intervals
  const rungMat = new THREE.MeshStandardMaterial({ color: 0x93A3B8, roughness: 0.5, metalness: 0.04 });
  const RUNG_COUNT = 9;
  for (let i = 1; i < RUNG_COUNT; i++) {
    const t = i / RUNG_COUNT;
    const a = strandACurve.getPoint(t);
    const b = strandBCurve.getPoint(t);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const len = dir.length();
    if (len < 0.05) continue; // strands cross here -- skip a degenerate rung
    const rungGeo = new THREE.CylinderGeometry(0.045, 0.045, len, 8);
    const rung = new THREE.Mesh(rungGeo, rungMat);
    rung.position.copy(mid);
    rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    group.add(rung);
  }

  // ---------- Base bar, echoing the flat mark ----------
  const barGeo = new THREE.BoxGeometry(2.9, 0.22, 0.22);
  const barMat = new THREE.MeshStandardMaterial({ color: RING_COLOR, roughness: 0.45, metalness: 0.06 });
  const bar = new THREE.Mesh(barGeo, barMat);
  bar.position.y = -1.62;
  group.add(bar);

  resize();
  window.addEventListener('resize', resize);

  // ---------- Pause the render loop when off-screen ----------
  let isVisible = true;
  if ('IntersectionObserver' in window && frame) {
    const io = new IntersectionObserver(function (entries) {
      isVisible = entries[0].isIntersecting;
      if (isVisible && !prefersReducedMotion) requestAnimationFrame(animate);
    }, { threshold: 0.05 });
    io.observe(frame);
  }

  if (prefersReducedMotion) {
    renderer.render(scene, camera);
    return;
  }

  let running = false;
  function animate() {
    if (!isVisible) { running = false; return; }
    running = true;
    requestAnimationFrame(animate);
    group.rotation.y += 0.0032;
    renderer.render(scene, camera);
  }
  if (!running) animate();
})();
