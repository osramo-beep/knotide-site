// Knotide Bio — rotating illustrative molecular visual (Three.js)
// This renders a stylised, non-labelled protein-surface + docked-peptide
// model. It is a conceptual illustration, not real structural data.

(function () {
  const canvas = document.getElementById('molecule-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    return; // WebGL unavailable — page works fine without the visual
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.25, 6.4);
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

  // Lighting — bright, neutral studio setup for a light backdrop
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9dbd6, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(4, 5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfe1d9, 0.5);
  fill.position.set(-5, -2, -4);
  scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  // Target surface — organic bumpy blob (illustrative, not real structure)
  const surfaceGeo = new THREE.IcosahedronGeometry(1.65, 4);
  const posAttr = surfaceGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i);
    const n = v.clone().normalize();
    const bump =
      Math.sin(n.x * 5.2 + n.y * 3.1) * 0.09 +
      Math.sin(n.y * 6.7 + n.z * 4.4) * 0.07 +
      Math.sin(n.z * 4.1 + n.x * 7.3) * 0.05;
    v.addScaledVector(n, bump);
    posAttr.setXYZ(i, v.x, v.y, v.z);
  }
  surfaceGeo.computeVertexNormals();

  const surfaceMat = new THREE.MeshStandardMaterial({
    color: 0x2C4744,
    roughness: 0.5,
    metalness: 0.04
  });
  group.add(new THREE.Mesh(surfaceGeo, surfaceMat));

  // Docked peptide loop — closed tube along a knotted path
  const loopPoints = [
    new THREE.Vector3(1.35, 0.55, 0.95),
    new THREE.Vector3(1.78, 0.9, 0.5),
    new THREE.Vector3(2.0, 0.45, -0.1),
    new THREE.Vector3(1.7, -0.1, -0.55),
    new THREE.Vector3(1.28, -0.3, -0.15),
    new THREE.Vector3(1.12, 0.05, 0.42),
    new THREE.Vector3(1.4, 0.35, 0.85)
  ];
  const curve = new THREE.CatmullRomCurve3(loopPoints, true, 'catmullrom', 0.4);
  const tubeGeo = new THREE.TubeGeometry(curve, 220, 0.075, 14, true);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x0F9C86,
    roughness: 0.28,
    metalness: 0.12,
    emissive: 0x063028,
    emissiveIntensity: 0.25
  });
  group.add(new THREE.Mesh(tubeGeo, tubeMat));

  // Residue accent points along the loop
  const accentGeo = new THREE.SphereGeometry(0.11, 20, 20);
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xBFE7DD, roughness: 0.35 });
  [0, 2, 4].forEach(function (i) {
    const dot = new THREE.Mesh(accentGeo, accentMat);
    dot.position.copy(loopPoints[i]);
    group.add(dot);
  });

  group.rotation.x = 0.18;

  resize();
  window.addEventListener('resize', resize);

  if (prefersReducedMotion) {
    renderer.render(scene, camera);
    return;
  }

  function animate(t) {
    requestAnimationFrame(animate);
    group.rotation.y += 0.0032;
    group.rotation.x = 0.18 + Math.sin(t * 0.00018) * 0.12;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();
