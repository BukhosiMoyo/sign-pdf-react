import { useEffect, useRef } from 'react';

// Full-screen blurry color blobs background using canvas
// Step 1: soft abstract color, large sizes, slow drift (no spiral yet)
export default function BlurryBlobs({
  count = 7,
  speed = 0.025, // px per ms at depth 1 (slower idle)
  blurPx = 8,
  colors = [
    'rgba(12,98,255,1)',      // blue
    'rgba(22,163,74,1)',      // green
    'rgba(236,72,153,1)',     // pink
  ],
  fullScreen = true,
  style,
  attractor = null, // optional: { x, y, strength }
  enableMouseParallax = true,
  enableMouseFollow = true,
  paused = false,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const blobsRef = useRef([]);
  const dprRef = useRef(1);
  const mouseRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const offscreenRef = useRef(null);
  const attractRef = useRef(attractor);

  useEffect(()=>{ attractRef.current = attractor; }, [attractor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d');
    offscreenRef.current = off;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;

    const resize = () => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      const w = Math.max(1, Math.floor(width * dpr));
      const h = Math.max(1, Math.floor(height * dpr));
      canvas.width = w; canvas.height = h;
      off.width = w; off.height = h;
      ctx.setTransform(1,0,0,1,0,0);
      offCtx.setTransform(1,0,0,1,0,0);
    };
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // mouse movement listener for interactive parallax/impulse
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pm = prevMouseRef.current;
      mouseRef.current.vx = x - pm.x;
      mouseRef.current.vy = y - pm.y;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      prevMouseRef.current = { x, y };
    };
    if (enableMouseParallax || enableMouseFollow) {
      window.addEventListener('mousemove', onMove);
    }

    // Create large soft blobs
    const createBlobs = () => {
      const followCount = Math.max(2, Math.floor(count * 0.35));
      blobsRef.current = Array.from({ length: count }).map((_, i) => {
        const depth = 0.6 + Math.random() * 1.2; // 0.6..1.8 affects size/alpha/speed
        const base = Math.min(width, height);
        const radius = (base * (0.18 + Math.random() * 0.28)) * depth; // large
        const angle = Math.random() * Math.PI * 2;
        const vx = (Math.random() - 0.5) * speed * 40 * depth; // even softer
        const vy = (Math.random() - 0.5) * speed * 40 * depth;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx, vy,
          radius,
          depth,
          color: pick(colors),
          angle,
          follow: i < followCount, // only a few follow the mouse
        };
      });
    };
    createBlobs();

    const fillBlob = (c, cx, cy, b) => {
      const grad = c.createRadialGradient(cx, cy, 0, cx, cy, b.radius);
      const alpha = Math.min(0.30, 0.16 + 0.14 * (b.depth - 0.4));
      grad.addColorStop(0, toRgba(b.color, alpha));
      grad.addColorStop(0.6, toRgba(b.color, alpha * 0.35));
      grad.addColorStop(1, toRgba(b.color, 0));
      c.fillStyle = grad;
      c.beginPath();
      c.arc(cx, cy, b.radius, 0, Math.PI * 2);
      c.fill();
    };

    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(33, now - last); // ms
      last = now;

      // Draw to offscreen with screen blending for rich color mix
      offCtx.clearRect(0, 0, off.width, off.height);
      offCtx.globalCompositeOperation = 'screen';

      const blobs = blobsRef.current;
      const mx = (enableMouseParallax || enableMouseFollow) ? (mouseRef.current.x || width * 0.5) : width * 0.5;
      const my = (enableMouseParallax || enableMouseFollow) ? (mouseRef.current.y || height * 0.5) : height * 0.5;
      const mvx = enableMouseFollow ? (mouseRef.current.vx || 0) : 0;
      const mvy = enableMouseFollow ? (mouseRef.current.vy || 0) : 0;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const attract = attractRef.current;

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        // slow drift; keep within a padded frame
        const velFactor = paused ? 0 : (attract ? 0.05 : 1); // halt motion when paused
        b.x += (b.vx * dt * velFactor) / 1000;
        b.y += (b.vy * dt * velFactor) / 1000;

        const pad = Math.max(120, b.radius * 0.5);
        if (b.x < -pad || b.x > width + pad) b.vx *= -1;
        if (b.y < -pad || b.y > height + pad) b.vy *= -1;

        // interactive parallax draw position
        const parallax = enableMouseParallax ? (0.035 / b.depth) : 0; // disable parallax if not enabled
        const dx = (mx - centerX) * parallax;
        const dy = (my - centerY) * parallax;

        // mouse-follow behavior for a subset; others get small impulse only (disabled when attractor is active)
        if (!paused && !attract && enableMouseFollow) {
          if (b.follow) {
            const toMx = (mx - b.x);
            const toMy = (my - b.y);
            b.vx += (toMx * 0.00006) / b.depth; // gentle attraction
            b.vy += (toMy * 0.00006) / b.depth;
          } else {
            b.vx += (mvx * 0.0006) / b.depth; // lighter influence
            b.vy += (mvy * 0.0006) / b.depth;
          }
        }

        // External attractor (drag effect): smooth ease toward target center over ~1–1.5s
        if (!paused && attract && typeof attract.x === 'number' && typeof attract.y === 'number') {
          const duration = Math.max(600, Math.min(2200, attract.durationMs || 1500));
          const ease = Math.min(0.02, dt / duration); // much softer per-frame blend
          b.vx *= 0.6; b.vy *= 0.6; // stronger damping to avoid "crazy" motion
          b.x += (attract.x - b.x) * ease;
          b.y += (attract.y - b.y) * ease;
        }

        fillBlob(offCtx, b.x + dx, b.y + dy, b);
      }

      // Composite offscreen onto main with extra blur for creamy diffusion
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.filter = `blur(${blurPx}px)`;
      ctx.drawImage(off, 0, 0);
      ctx.restore();

      // soft vignette to avoid hard edges
      const vignette = ctx.createRadialGradient(
        canvas.width * 0.5,
        canvas.height * 0.55,
        0,
        canvas.width * 0.5,
        canvas.height * 0.55,
        Math.hypot(canvas.width, canvas.height) * 0.6
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      if (enableMouseParallax || enableMouseFollow) {
        window.removeEventListener('mousemove', onMove);
      }
    };
  }, [count, speed, blurPx, colors, enableMouseParallax, enableMouseFollow]);

  const canvasStyle = fullScreen
    ? { position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }
    : { position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' };

  return (
    <canvas
      ref={canvasRef}
      style={{ ...canvasStyle, ...(style || {}) }}
      aria-hidden
    />
  );
}

function toRgba(rgbString, alpha) {
  // expects 'rgba(r,g,b,1)' or 'rgb(r,g,b)' → returns 'rgba(r,g,b,alpha)'
  const m = rgbString.match(/rgba?\(([^)]+)\)/);
  if (!m) return rgbString;
  const parts = m[1].split(',').map((s) => s.trim());
  const [r, g, b] = parts.map((v) => parseFloat(v));
  return `rgba(${r|0}, ${g|0}, ${b|0}, ${alpha})`;
}


