import { useEffect, useRef, useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import HeroParticles from '../components/HeroParticles.jsx';
import BlurryBlobs from '../components/BlurryBlobs.jsx';

export default function Landing() {
  const nav = useNavigate();
  const [dropping, setDropping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const signNowRef = useRef(null);
  const sendRef = useRef(null);

  const handleDrop = async (e, dest) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (dest === 'sign-now') nav('/sign-now', { state: { file: f } });
    if (dest === 'send') nav('/send', { state: { file: f } });
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.body.classList.add('theme-dark');
    }
    setIsDark(document.body.classList.contains('theme-dark'));
  }, []);

  const toggleTheme = () => {
    const dark = document.body.classList.toggle('theme-dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    setIsDark(dark);
  };

  return (
    <div style={{ background:'var(--bg)', width:'100%', position:'relative', minHeight:'100svh', overflowX:'hidden', boxSizing:'border-box' }}>
      {/* Background blobs (non-interactive, slightly faster) */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <BlurryBlobs count={7} blurPx={8} speed={0.16} enableMouseParallax={false} enableMouseFollow={false} paused={false} />
      </div>
      {/* Background overlay removed to avoid extra global blur */}
      {/* Full-width glass header */}
      <div style={{ position:'sticky', top:0, zIndex:30, width:'100%', background: isDark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.65)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ width:'min(1200px, 100%)', margin:'0 auto', padding:'12px 16px', display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', position:'relative', boxSizing:'border-box' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, fontWeight:900, color:'var(--text)', gridColumn:'1' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--brand-primary)"><path d="M5 2h10l4 4v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm9 2H5v16h12V8h-3a1 1 0 0 1-1-1V4z"/></svg>
            <span>Sign PDF</span>
          </div>
          <nav className="desktop-nav" style={{ display:'flex', gap:26, justifyContent:'center', alignItems:'center', color:'var(--text)', fontWeight:700, gridColumn:'2' }}>
            <a
              href="https://compresspdf.co.za" target="_blank" rel="noopener noreferrer"
              style={{ position:'relative', display:'inline-flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:12, overflow:'hidden' }}
              onMouseEnter={(e)=>{ const p=e.currentTarget.querySelector('.peel'); const l=e.currentTarget.querySelector('.lbl'); if(p){p.style.opacity='1';} if(l){l.style.transform='scale(1.07)';} }}
              onMouseLeave={(e)=>{ const p=e.currentTarget.querySelector('.peel'); const l=e.currentTarget.querySelector('.lbl'); if(p){p.style.opacity='0';} if(l){l.style.transform='scale(1)';} }}
            >
              <span className="peel" aria-hidden style={{ position:'absolute', inset:-2, borderRadius:12, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px) saturate(160%)', WebkitBackdropFilter:'blur(8px) saturate(160%)', opacity:0, transition:'opacity .15s ease' }} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0C62FF" style={{ position:'relative', zIndex:1 }}><path d="M6 3h9l3 3v14H6z"/><circle cx="17" cy="7" r="3" fill="#93c5fd"/></svg>
              <span className="lbl" style={{ position:'relative', zIndex:1, transition:'transform .15s ease' }}>Compress PDF</span>
            </a>
            <a
              href="https://mergepdf.co.za" target="_blank" rel="noopener noreferrer"
              style={{ position:'relative', display:'inline-flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:12, overflow:'hidden' }}
              onMouseEnter={(e)=>{ const p=e.currentTarget.querySelector('.peel'); const l=e.currentTarget.querySelector('.lbl'); if(p){p.style.opacity='1';} if(l){l.style.transform='scale(1.07)';} }}
              onMouseLeave={(e)=>{ const p=e.currentTarget.querySelector('.peel'); const l=e.currentTarget.querySelector('.lbl'); if(p){p.style.opacity='0';} if(l){l.style.transform='scale(1)';} }}
            >
              <span className="peel" aria-hidden style={{ position:'absolute', inset:-2, borderRadius:12, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px) saturate(160%)', WebkitBackdropFilter:'blur(8px) saturate(160%)', opacity:0, transition:'opacity .15s ease' }} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#16A34A" style={{ position:'relative', zIndex:1 }}><path d="M6 3h6l3 3v14H6z"/><rect x="14" y="7" width="4" height="10" rx="1" fill="#86efac"/></svg>
              <span className="lbl" style={{ position:'relative', zIndex:1, transition:'transform .15s ease' }}>Merge PDF</span>
            </a>
            <a
              href="https://splitpdf.co.za" target="_blank" rel="noopener noreferrer"
              style={{ position:'relative', display:'inline-flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:12, overflow:'hidden' }}
              onMouseEnter={(e)=>{ const p=e.currentTarget.querySelector('.peel'); const l=e.currentTarget.querySelector('.lbl'); if(p){p.style.opacity='1';} if(l){l.style.transform='scale(1.07)';} }}
              onMouseLeave={(e)=>{ const p=e.currentTarget.querySelector('.peel'); const l=e.currentTarget.querySelector('.lbl'); if(p){p.style.opacity='0';} if(l){l.style.transform='scale(1)';} }}
            >
              <span className="peel" aria-hidden style={{ position:'absolute', inset:-2, borderRadius:12, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px) saturate(160%)', WebkitBackdropFilter:'blur(8px) saturate(160%)', opacity:0, transition:'opacity .15s ease' }} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" style={{ position:'relative', zIndex:1 }}><path d="M6 3h9l3 3v14H6z"/><path d="M8 12h8" stroke="#fde68a" strokeWidth="2"/></svg>
              <span className="lbl" style={{ position:'relative', zIndex:1, transition:'transform .15s ease' }}>Split PDF</span>
            </a>
          </nav>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center', gridColumn:'3' }}>
            <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} style={{ padding:'8px 10px', borderRadius:12, border:'1px solid var(--border)', background:'linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.06))', color:'var(--text)', display:'inline-flex', alignItems:'center', gap:6 }}>
              {isDark ? (<FiSun size={18} />) : (<FiMoon size={18} />)}
            </button>
            <button className="menu-btn" onClick={()=>setMenuOpen(v=>!v)} aria-expanded={menuOpen} aria-haspopup="menu" aria-label="Open menu" style={{ padding:'8px 10px', borderRadius:12, border:'1px solid var(--border)', background:'linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.06))', color:'var(--text)', alignItems:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>
            </button>
            <button className="cta-open" onClick={()=>nav('/sign-now')} style={{ padding:'10px 16px', borderRadius:12, border:'1px solid rgba(12,98,255,0.55)', background:'linear-gradient(180deg, rgba(12,98,255,0.95), #1e40af)', color:'#fff', fontWeight:900, boxShadow:'0 10px 26px rgba(12,98,255,0.35)' }}>Open Editor</button>
            {menuOpen && (
              <>
                <div onClick={()=>setMenuOpen(false)} aria-hidden style={{ position:'fixed', inset:0, zIndex:40 }} />
                <div className="mobileMenu" role="menu" style={{ position:'absolute', right:16, top:'calc(100% + 8px)', minWidth:240, background: isDark ? 'rgba(15,23,42,0.78)' : 'rgba(255,255,255,0.78)', backdropFilter:'blur(36px) saturate(180%)', WebkitBackdropFilter:'blur(36px) saturate(180%)', border:'1px solid var(--border)', borderRadius:16, boxShadow:'0 18px 46px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.55)', padding:12, zIndex:50 }}>
                  <a href="https://compresspdf.co.za" target="_blank" rel="noopener noreferrer" role="menuitem" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, color:'var(--text)', fontWeight:800 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0C62FF"><path d="M6 3h9l3 3v14H6z"/></svg>
                    <span>Compress PDF</span>
                  </a>
                  <a href="https://mergepdf.co.za" target="_blank" rel="noopener noreferrer" role="menuitem" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, color:'var(--text)', fontWeight:800 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#16A34A"><path d="M6 3h6l3 3v14H6z"/></svg>
                    <span>Merge PDF</span>
                  </a>
                  <a href="https://splitpdf.co.za" target="_blank" rel="noopener noreferrer" role="menuitem" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, color:'var(--text)', fontWeight:800 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M6 3h9l3 3v14H6z"/></svg>
                    <span>Split PDF</span>
                  </a>
                  <div style={{ height:1, background:'var(--border)', margin:'6px 8px' }} />
                  <button onClick={()=>{ setMenuOpen(false); nav('/sign-now'); }} role="menuitem" style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:10, padding:'12px 12px', borderRadius:12, border:'1px solid rgba(12,98,255,0.35)', background:'linear-gradient(180deg, rgba(12,98,255,0.95), #1e40af)', color:'#fff', fontWeight:900 }}>
                    Open Editor
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <style>{`
          .menu-btn { display: none; }
          .cta-open { display: inline-flex; }
          .theme-btn { display: inline-flex; }
          @media (max-width: 1024px) {
            .desktop-nav { display: none !important; }
            .menu-btn { display: inline-flex; }
            .cta-open { display: none !important; }
          }
          body.theme-dark .mobileMenu { background: rgba(15,23,42,0.78); }
        `}</style>
      </div>

      <div style={{ width:'min(1200px, 100%)', maxWidth:'100%', margin:'0 auto', padding:'20px 16px', position:'relative', zIndex:2, boxSizing:'border-box' }}>

        <section style={{ position:'relative', padding:'70px 0 28px', textAlign:'center' }}>
          <h1 style={{ margin:0, fontSize:58, color:'var(--text)' }}>Sign Documents Online</h1>
          <div style={{ marginTop:14, color:'var(--muted)', fontSize:18 }}>Create, sign, and send PDFs in minutes. Private by default — processed in your browser.</div>
        </section>

        <section style={{ display:'grid', gridTemplateColumns:'1fr', gap:16, alignItems:'center' }}>
          <div style={{ display:'grid', gap:18, placeItems:'center' }}>
            <div 
              onDragEnter={(e)=>{ e.preventDefault(); setDropping(true); }}
              onDragOver={(e)=>{ e.preventDefault(); if (!dropping) setDropping(true); }}
              onDragLeave={()=>{ setDropping(false); }}
              onDrop={(e)=>{ setDropping(false); handleDrop(e,'sign-now'); }}
              style={{ width:'min(940px, 100%)', maxWidth:'100%', position:'relative',
                background:'#ffffff', boxSizing:'border-box',
                border: `2px dashed ${dropping ? 'rgba(96,165,250,0.9)' : 'var(--border)'}`,
                borderRadius:16, padding:28, margin:'0 auto'
              }}
            >
              <div style={{ display:'grid', gap:14, placeItems:'center' }}>
                <div style={{ width:72, height:72, borderRadius:16, background:'var(--bg)', display:'grid', placeItems:'center', border:'1px solid var(--border)', boxShadow:'inset 0 1px 0 rgba(255,255,255,.45)' }}>
                  {/* stylized PDF icon */}
                  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                    <defs>
                      <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#b91c1c" />
                      </linearGradient>
                    </defs>
                    <path d="M12 4h18l8 8v28a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="url(#pg)"/>
                    <path d="M30 4v6a2 2 0 0 0 2 2h6" fill="#ffffff44" />
                    <rect x="14" y="28" width="20" height="10" rx="2" fill="#fff"/>
                    <text x="24" y="36" textAnchor="middle" fontFamily="Inter, system-ui" fontSize="8" fontWeight="800" fill="#b91c1c">PDF</text>
                  </svg>
                </div>
                <button className="btn-pulse" onClick={(e)=>{ e.stopPropagation(); signNowRef.current?.click(); }} style={{ padding:'18px 24px', fontSize:17, borderRadius:16, border:'1px solid #60a5fa', background:'linear-gradient(180deg,#3b82f6,#1e40af)', color:'#fff', fontWeight:900, boxShadow:'0 12px 28px rgba(30,64,175,.35)' }}>Upload Your File</button>
                <div style={{ color:'var(--muted)' }}>or drop your file here</div>
                <div style={{ color:'var(--muted)', fontSize:12 }}>Max 100 MB</div>
                <input ref={signNowRef} type="file" accept="application/pdf,.pdf" style={{ display:'none' }} onChange={(e)=>{ const f=e.target.files?.[0]; if(f) nav('/sign-now',{ state:{ file:f }}); }} />
                <div style={{ color:'var(--muted)', fontSize:12, textAlign:'center' }}>After upload, pick <strong>Sign & Download</strong> or <strong>Sign & Send</strong>.</div>
              </div>
              {dropping && (
                <div aria-hidden style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', pointerEvents:'none' }}>
                  <div style={{ padding:'10px 16px', borderRadius:12, background:'rgba(12,98,255,.85)', color:'#fff', fontWeight:900, boxShadow:'0 10px 24px rgba(12,98,255,.35)' }}>Drop Here</div>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={(e)=>{ e.stopPropagation(); signNowRef.current?.click(); }} style={{ padding:'14px 18px', borderRadius:12, border:'1px solid #60a5fa', background:'linear-gradient(180deg,#2563eb,#1e3a8a)', color:'#fff', fontWeight:900, boxShadow:'0 10px 26px rgba(37,99,235,.35)' }}>Upload PDF</button>
              <button onClick={()=>nav('/sign-now')} style={{ padding:'14px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,.6)', background:'linear-gradient(180deg, rgba(255,255,255,.72), rgba(255,255,255,.32))', color:'var(--text)', fontWeight:800, boxShadow:'0 12px 28px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.55)' }}>Open Editor</button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}


