// Knotide Bio -- interactive 3D structural rendering (Three.js)
// A procedural, illustrative model built to echo the morphology of a
// real structural rendering: a light protein surface, a highlighted
// binding region, and a tangled peptide ligand docked at the interface.
// This is conceptual and does not represent experimental structural data.

(function () {
  const canvas = document.getElementById('molecule-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const frame = canvas.closest('.molecule-frame');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    return; // WebGL unavailable -- page works fine without the visual
  }

  const scene = new THREE.Scene();
  const DEFAULT_Z = 6.4;
  const MIN_Z = 4.2;
  const MAX_Z = 9.5;
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.15, DEFAULT_Z);
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
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9dbd6, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd8e6ff, 0.45);
  fill.position.set(-5, -2, -4);
  scene.add(fill);

  const DEFAULT_ROT = { x: 0.12, y: -0.35 };
  const group = new THREE.Group();
  group.rotation.x = DEFAULT_ROT.x;
  group.rotation.y = DEFAULT_ROT.y;
  scene.add(group);

  // ---------- Protein-peptide docking render, textured on a card ----------
  // A single illustrative image (protein surface in blue, peptide ligand
  // docked in orange) mapped onto a plane so it can keep rotating, and be
  // dragged and zoomed, exactly like the previous procedural model.
  const BG_COLOR = 0xd8dee9;
  renderer.setClearColor(BG_COLOR, 1);

  const textureLoader = new THREE.TextureLoader();
  const imgAspect = 1000 / 562;
  const planeHeight = 2.6;
  const planeWidth = planeHeight * imgAspect;
  const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight);
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  group.add(plane);

  textureLoader.load('images/molecule-docking-render.webp', function (tex) {
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('encoding' in tex) tex.encoding = THREE.sRGBEncoding;
    planeMat.map = tex;
    planeMat.needsUpdate = true;
  });

  resize();
  window.addEventListener('resize', resize);

  // ---------- Interaction: auto-rotate, drag-to-rotate, zoom, buttons ----------
  let autoRotate = !prefersReducedMotion;
  let userPaused = false;
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let idleTimer = null;
  const IDLE_RESUME_MS = 2600;

  function scheduleIdleResume() {
    if (userPaused) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { autoRotate = true; }, IDLE_RESUME_MS);
  }

  function onPointerDown(e) {
    isDragging = true;
    autoRotate = false;
    clearTimeout(idleTimer);
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture && e.pointerId != null && canvas.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    group.rotation.y += dx * 0.006;
    group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + dy * 0.006, -1.1, 1.1);
  }
  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    scheduleIdleResume();
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  function zoomBy(delta) {
    camera.position.z = THREE.MathUtils.clamp(camera.position.z + delta, MIN_Z, MAX_Z);
  }
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomBy(e.deltaY * 0.0025);
  }, { passive: false });

  const rotateToggleBtn = document.getElementById('molRotateToggle');
  const resetBtn = document.getElementById('molReset');
  const zoomInBtn = document.getElementById('molZoomIn');
  const zoomOutBtn = document.getElementById('molZoomOut');

  if (rotateToggleBtn) {
    rotateToggleBtn.addEventListener('click', function () {
      userPaused = !userPaused;
      autoRotate = !userPaused;
      clearTimeout(idleTimer);
      rotateToggleBtn.textContent = userPaused ? 'Resume rotation' : 'Pause rotation';
      rotateToggleBtn.setAttribute('aria-pressed', userPaused ? 'false' : 'true');
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      group.rotation.x = DEFAULT_ROT.x;
      group.rotation.y = DEFAULT_ROT.y;
      camera.position.z = DEFAULT_Z;
      userPaused = false;
      autoRotate = !prefersReducedMotion;
      if (rotateToggleBtn) {
        rotateToggleBtn.textContent = 'Pause rotation';
        rotateToggleBtn.setAttribute('aria-pressed', 'true');
      }
    });
  }
  if (zoomInBtn) zoomInBtn.addEventListener('click', function () { zoomBy(-0.6); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', function () { zoomBy(0.6); });

  if (prefersReducedMotion) {
    renderer.render(scene, camera);
    return;
  }

  let swayTime = 0;
  const SWAY_RANGE = 0.32; // ~18 degrees either side -- stays close to face-on, never edge-on
  const SWAY_SPEED = 0.012;
  function animate() {
    requestAnimationFrame(animate);
    if (autoRotate && !isDragging) {
      swayTime += SWAY_SPEED;
      group.rotation.y = DEFAULT_ROT.y + Math.sin(swayTime) * SWAY_RANGE;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();
