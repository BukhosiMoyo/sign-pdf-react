import { useEffect, useRef } from 'react';

// Lightweight canvas particle background with pseudo-3D feel
// Shapes: circle, triangle, diamond, rounded-rect, star
export default function HeroParticles({ count = 12, speed = 0.35, opacity = 0.10, fullScreen = false, style }) {
  const ref = useRef(null);
  const animRef = useRef(0);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize();
    const onResize = () => resize();
    const colors = [
      'rgba(12,98,255,1)',       // blue
      'rgba(22,163,74,1)',       // green
      'rgba(99,102,241,1)',      // indigo
      'rgba(245,158,11,1)',      // amber
      'rgba(236,72,153,1)',      // pink
    ];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Create particles
    const create = () => {
      particlesRef.current = Array.from({ length: count }).map(() => {
        const size = 8 + Math.random() * 28; // px
        const depth = 0.5 + Math.random() * 1.5; // fake z for parallax
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speed * 60 * depth,
          vy: (Math.random() - 0.5) * speed * 60 * depth,
          size,
          color: pick(colors),
          shape: pick(['circle','triangle','diamond','roundrect','star']),
          depth,
        };
      });
    };
    create();

    const drawShape = (p) => {
      ctx.save();
      ctx.globalAlpha = opacity * (0.8 + 0.4 * p.depth);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 24 * p.depth;
      const s = p.size;
      ctx.translate(p.x, p.y);
      switch (p.shape) {
        case 'circle':
          ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill(); break;
        case 'triangle':
          ctx.beginPath(); ctx.moveTo(0,-s); ctx.lineTo(s*0.9, s*0.8); ctx.lineTo(-s*0.9, s*0.8); ctx.closePath(); ctx.fill(); break;
        case 'diamond':
          ctx.beginPath(); ctx.moveTo(0,-s); ctx.lineTo(s,0); ctx.lineTo(0,s); ctx.lineTo(-s,0); ctx.closePath(); ctx.fill(); break;
        case 'roundrect':
          roundRect(ctx, -s, -s*0.7, s*2, s*1.4, Math.min(10, s*0.3)); ctx.fill(); break;
        case 'star':
          star(ctx, s, 5); ctx.fill(); break;
        default:
          ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill();
      }
      // subtle specular highlight to sell 3D depth
      ctx.globalAlpha = Math.min(0.18, 0.06 + 0.12 * p.depth);
      ctx.fillStyle = 'white';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(-s*0.4, -s*0.4, Math.min(3, s*0.22), 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    };

    const step = () => {
      ctx.clearRect(0,0,width,height);
      const pts = particlesRef.current;
      for (let i=0;i<pts.length;i++){
        const p = pts[i];
        p.x += p.vx * 0.016; // 60fps base
        p.y += p.vy * 0.016;
        // bounce within viewport with slight random turn
        if (p.x < -40 || p.x > width + 40) { p.vx *= -1; p.x = Math.max(-40, Math.min(width+40,p.x)); }
        if (p.y < -40 || p.y > height + 40) { p.vy *= -1; p.y = Math.max(-40, Math.min(height+40,p.y)); }
        // small drift
        p.vx += (Math.random()-0.5) * 0.02; p.vy += (Math.random()-0.5) * 0.02;
        drawShape(p);
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', onResize); };
  }, [count, speed, opacity]);

  const canvasStyle = fullScreen
    ? { position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }
    : { position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' };

  return <canvas ref={ref} style={{ ...canvasStyle, ...(style || {}) }} aria-hidden />;
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

function star(ctx, radius, points){
  const step = Math.PI / points;
  ctx.beginPath();
  for (let i = 0; i < 2*points; i++) {
    const r = (i % 2 === 0) ? radius : radius/2;
    ctx.lineTo(Math.cos(i*step) * r, Math.sin(i*step) * r);
  }
  ctx.closePath();
}



