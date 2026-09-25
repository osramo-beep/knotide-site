// Knotide Bio -- 360-degree product-style viewer
// Plays back a real 48-frame turntable render (one image per angle) instead
// of faking rotation on a flat plane. Supports continuous auto-rotation,
// drag-to-spin through the real angles, zoom, and the same button controls
// as before.

(function () {
  const canvas = document.getElementById('molecule-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const frame = canvas.closest('.molecule-frame');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FRAME_COUNT = 48;
  function framePath(i) {
    return 'images/molecule-spin/f' + String(i + 1).padStart(3, '0') + '.webp';
  }

  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let ready = false;
  let currentFrame = 0;

  function draw(idx) {
    const img = images[idx];
    if (!img || !img.complete || !img.naturalWidth) return;
    const cw = canvas.width, ch = canvas.height;
    if (!cw || !ch) return;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    draw(currentFrame);
  }

  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      loadedCount++;
      if (i === 0) resize();
      if (loadedCount === FRAME_COUNT) ready = true;
    };
    img.src = framePath(i);
    images[i] = img;
  }
  window.addEventListener('resize', resize);

  // ---------- Interaction: auto-rotate, drag-to-spin, zoom, buttons ----------
  let autoRotate = !prefersReducedMotion;
  let userPaused = false;
  let isDragging = false;
  let lastX = 0;
  let dragAccum = 0;
  let idleTimer = null;
  const IDLE_RESUME_MS = 2600;
  const PX_PER_FRAME = 7;

  let zoom = 1;
  const MIN_ZOOM = 0.7, MAX_ZOOM = 2.3;
  function applyZoom() { canvas.style.transform = 'scale(' + zoom + ')'; }

  function scheduleIdleResume() {
    if (userPaused) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { autoRotate = true; }, IDLE_RESUME_MS);
  }

  function onPointerDown(e) {
    isDragging = true;
    autoRotate = false;
    clearTimeout(idleTimer);
    lastX = e.clientX;
    dragAccum = 0;
    canvas.setPointerCapture && e.pointerId != null && canvas.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    dragAccum += dx;
    while (dragAccum >= PX_PER_FRAME) {
      currentFrame = (currentFrame + 1) % FRAME_COUNT;
      dragAccum -= PX_PER_FRAME;
    }
    while (dragAccum <= -PX_PER_FRAME) {
      currentFrame = (currentFrame - 1 + FRAME_COUNT) % FRAME_COUNT;
      dragAccum += PX_PER_FRAME;
    }
    draw(currentFrame);
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
    zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
    applyZoom();
  }
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomBy(-e.deltaY * 0.0015);
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
      currentFrame = 0;
      zoom = 1;
      applyZoom();
      draw(currentFrame);
      userPaused = false;
      autoRotate = !prefersReducedMotion;
      if (rotateToggleBtn) {
        rotateToggleBtn.textContent = 'Pause rotation';
        rotateToggleBtn.setAttribute('aria-pressed', 'true');
      }
    });
  }
  if (zoomInBtn) zoomInBtn.addEventListener('click', function () { zoomBy(0.3); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', function () { zoomBy(-0.3); });

  if (prefersReducedMotion) return; // first frame is drawn once resize() runs; no animation loop

  let lastTick = 0;
  const MS_PER_STEP = 90;
  function animate(ts) {
    requestAnimationFrame(animate);
    if (!ready) return;
    if (autoRotate && !isDragging && ts - lastTick > MS_PER_STEP) {
      currentFrame = (currentFrame + 1) % FRAME_COUNT;
      draw(currentFrame);
      lastTick = ts;
    }
  }
  requestAnimationFrame(animate);
})();
