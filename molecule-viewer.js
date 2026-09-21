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

  // ---------- Protein surface, with a highlighted binding patch ----------
  const BODY_COLOR = new THREE.Color(0xC9C5E3);
  const SITE_COLOR = new THREE.Color(0x4FA8E0);

  const surfaceGeo = new THREE.IcosahedronGeometry(1.55, 4);
  const posAttr = surfaceGeo.attributes.position;
  const v = new THREE.Vector3();
  const colors = new Float32Array(posAttr.count * 3);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i);
    const n = v.clone().normalize();
    const bump =
      Math.sin(n.x * 5.2 + n.y * 3.1) * 0.08 +
      Math.sin(n.y * 6.7 + n.z * 4.4) * 0.06 +
      Math.sin(n.z * 4.1 + n.x * 7.3) * 0.05;
    v.addScaledVector(n, bump);
    posAttr.setXYZ(i, v.x, v.y, v.z);

    // Binding patch: an organic region on the +x / +y face of the blob,
    // where the peptide ligand docks.
    const patchScore = n.x * 0.75 + n.y * 0.2 + bump * 1.6;
    const t = THREE.MathUtils.smoothstep(patchScore, 0.28, 0.55);
    tmpColor.copy(BODY_COLOR).lerp(SITE_COLOR, t);
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }
  surfaceGeo.computeVertexNormals();
  surfaceGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const surfaceMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.55,
    metalness: 0.02
  });
  group.add(new THREE.Mesh(surfaceGeo, surfaceMat));

  // ---------- Peptide ligand: a tangled backbone with side chains ----------
  const peptideGroup = new THREE.Group();
  group.add(peptideGroup);

  const PEPTIDE_COLOR = 0xE0327A;
  const backboneMat = new THREE.MeshStandardMaterial({
    color: PEPTIDE_COLOR,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0x4A0F2C,
    emissiveIntensity: 0.18
  });
  const residueMat = new THREE.MeshStandardMaterial({
    color: 0xF6D9E6,
    roughness: 0.4
  });

  const backbonePoints = [
    new THREE.Vector3(1.28, 0.55, 0.55),
    new THREE.Vector3(1.55, 0.85, 0.70),
    new THREE.Vector3(1.82, 0.62, 0.42),
    new THREE.Vector3(1.95, 0.28, 0.62),
    new THREE.Vector3(1.72, 0.05, 0.85),
    new THREE.Vector3(1.55, 0.30, 1.05),
    new THREE.Vector3(1.78, 0.55, 1.15),
    new THREE.Vector3(2.05, 0.40, 0.95),
    new THREE.Vector3(2.18, 0.10, 0.65),
    new THREE.Vector3(1.98, -0.15, 0.40)
  ];
  const backboneCurve = new THREE.CatmullRomCurve3(backbonePoints, false, 'catmullrom', 0.35);
  const backboneGeo = new THREE.TubeGeometry(backboneCurve, 220, 0.045, 10, false);
  peptideGroup.add(new THREE.Mesh(backboneGeo, backboneMat));

  // Residue markers along the backbone
  const residueGeo = new THREE.SphereGeometry(0.065, 14, 14);
  backbonePoints.forEach(function (p) {
    const dot = new THREE.Mesh(residueGeo, residueMat);
    dot.position.copy(p);
    peptideGroup.add(dot);
  });

  // Side-chain "sticks" radiating outward from the backbone, echoing
  // the tangled, wireframe-like look of a licorice-style peptide render.
  const sideChainOffsets = [
    [0.20, 0.22, -0.10], [-0.15, 0.28, 0.18], [0.24, -0.12, 0.20],
    [0.10, 0.30, -0.22], [-0.22, 0.10, -0.18], [0.18, -0.22, -0.15],
    [0.26, 0.08, 0.22], [-0.12, -0.24, 0.16], [0.14, 0.24, 0.24],
    [-0.20, 0.16, -0.20]
  ];
  const stickMat = new THREE.MeshStandardMaterial({
    color: PEPTIDE_COLOR,
    roughness: 0.35,
    metalness: 0.08
  });
  backbonePoints.forEach(function (p, idx) {
    const offset = sideChainOffsets[idx % sideChainOffsets.length];
    const dir = new THREE.Vector3(offset[0], offset[1], offset[2]);
    const len = dir.length();
    const end = p.clone().add(dir);
    const mid = p.clone().add(end).multiplyScalar(0.5);

    const stickGeo = new THREE.CylinderGeometry(0.016, 0.016, len, 6);
    const stick = new THREE.Mesh(stickGeo, stickMat);
    stick.position.copy(mid);
    stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    peptideGroup.add(stick);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), stickMat);
    tip.position.copy(end);
    peptideGroup.add(tip);
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

  function animate() {
    requestAnimationFrame(animate);
    if (autoRotate && !isDragging) {
      group.rotation.y += 0.0035;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();
