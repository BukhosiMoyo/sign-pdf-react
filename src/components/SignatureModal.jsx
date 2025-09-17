import { useEffect, useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { HANDWRITING_FONTS, FONT_MANIFEST } from "../lib/fonts";

export default function SignatureModal({ open, onClose, onSave, initialInk = '#111827', kind = 'signature', initialName = '' }) {
  const [tab, setTab] = useState('type');
  const [name, setName] = useState('');
  const [fontKey, setFontKey] = useState('dancing');
  const [ink, setInk] = useState(initialInk);
  const [penW, setPenW] = useState(2); // slimmer default; variable width via min/max
  const sigRef = useRef(null);
  const fileRef = useRef(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const drawWrapRef = useRef(null);
  const [drawDims, setDrawDims] = useState({ w: 600, h: 220 });
  const [draggingUpload, setDraggingUpload] = useState(false);

  const isInitials = kind === 'initials';
  const placeholder = isInitials ? 'Type initials here' : 'Type name here';
  const primaryLabel = isInitials ? 'Add' : 'Sign';

  useEffect(() => {
    if (open) {
      setInk(initialInk);
      if (isInitials) setName(''); else setName(initialName || '');
    }
  }, [open, initialInk, isInitials, initialName]);

  // Prevent upload tab for initials
  useEffect(() => {
    if (isInitials && tab === 'upload') setTab('type');
  }, [isInitials, tab]);

  const TOP_FONT_KEYS = ['dancing','pacifico','greatv','kalam','courget','caveat'];
  const TOP_FONTS = useMemo(() => FONT_MANIFEST.filter(f => TOP_FONT_KEYS.includes(f.key)), []);

  useEffect(() => {
    if (!open) return;
    const id = 'sig-fonts-link';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Pacifico&family=Great+Vibes&family=Kalam&family=Courgette&family=Caveat:wght@400..700&display=swap';
    document.head.appendChild(link);
  }, [open]);

  useEffect(() => { if (!open) setUploadPreview(null); }, [open]);

  useEffect(() => {
    if (!open || tab !== 'draw') return;
    const ratio = 220 / 600;
    const measure = () => {
      const el = drawWrapRef.current;
      if (!el) return;
      const w = Math.max(360, Math.min(1024, Math.floor(el.clientWidth)));
      const h = Math.max(160, Math.floor(w * ratio));
      setDrawDims({ w, h });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, tab]);

  if (!open) return null;

  const addTyped = async () => {
    const value = (name || '').trim();
    if (value.length === 0) return; // do not save empty typed values
    const f = TOP_FONTS.find(x => x.key === fontKey);
    const family = f?.name || 'Dancing Script';
    const out = await renderTypedSignatureToTightPng(value, family, ink, 48, false);
    onSave({ kind: 'typed-image', dataUrl: out.dataUrl, meta: { value, fontKey, color: ink, sizePt: 28, naturalWidth: out.naturalWidth, naturalHeight: out.naturalHeight } });
  };

  const addDrawn = async () => {
    const cvs = sigRef.current;
    if (!cvs || cvs.isEmpty()) return;
    // Use trimmed alpha bounds for tight PNG
    const dataUrl = trimCanvasAlpha(cvs.getTrimmedCanvas())
    onSave({ kind: 'drawn', dataUrl });
  };

  const onUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isPng = /png$/i.test(f.type) || f.name.toLowerCase().endsWith('.png');
    const isSvg = /svg\+xml$/i.test(f.type) || f.name.toLowerCase().endsWith('.svg');
    if (!isPng && !isSvg) return;
    const url = URL.createObjectURL(f);
    if (isPng) {
      const img = new Image();
      img.onload = () => { const trimmed = trimPng(img); setUploadPreview(trimmed); };
      img.src = url;
    } else {
      setUploadPreview(url);
    }
  };

  const saveUpload = () => { if (!uploadPreview) return; onSave({ kind: 'upload', dataUrl: uploadPreview }); };

  const colorOptions = [ { hex: '#111827', name: 'Black' }, { hex: '#1d4ed8', name: 'Blue' }, { hex: '#16a34a', name: 'Green' } ];

  const previewText = name && name.trim().length > 0 ? name : placeholder;
  const isPlaceholder = !(name && name.trim().length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isInitials ? 'Initials' : 'Signature'}
      style={backdrop}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={modal}>
        <div style={tabs}>
          <button onClick={() => setTab('type')} style={btn(tab==='type')}>Type</button>
          <button onClick={() => setTab('draw')} style={btn(tab==='draw')}>Draw</button>
          {!isInitials && (
            <button onClick={() => setTab('upload')} style={btn(tab==='upload')}>Upload</button>
          )}
        </div>

        {tab === 'type' && (
          <div style={{ display:'grid', gap:10 }}>
            <input aria-label={isInitials ? 'Type initials here' : 'Type name here'} value={name} onChange={(e)=>setName(e.target.value)} placeholder={placeholder} style={input} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12, alignItems:'stretch' }}>
              {TOP_FONTS.map((f) => (
                <button
                  key={f.key}
                  className="no-grow"
                  onClick={()=>setFontKey(f.key)}
                  aria-label={`Choose font ${f.name}`}
                  style={{
                    display:'block', textAlign:'left', padding:0, borderRadius:12,
                    border:'1px solid var(--border)',
                    background:'linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,.25))',
                    color:'var(--text)', cursor:'pointer', minWidth: 0,
                    boxShadow: fontKey===f.key
                      ? '0 0 0 2px rgba(96,165,250,.85), 0 10px 24px rgba(0,0,0,.08)'
                      : 'inset 0 1px 0 rgba(255,255,255,.45), 0 10px 24px rgba(0,0,0,.06)',
                    overflow:'hidden', boxSizing:'border-box', position:'relative'
                  }}
                >
                  <div style={{ padding:10, boxSizing:'border-box' }}>
                    <div aria-hidden="true" style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, fontFamily: `'${f.name}', ${HANDWRITING_FONTS[f.key]?.css || 'cursive'}`, fontSize: 28, lineHeight:1.2, color: isPlaceholder ? 'var(--muted)' : ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minHeight:60, width:'100%', display:'flex', alignItems:'center', justifyContent:'flex-start', padding:'8px 12px', boxSizing:'border-box' }}>{previewText}</div>
                    <div style={{ fontSize: 11, color:'var(--muted)', marginTop:6, padding:'0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', gap:12 }}>
                {colorOptions.map(({hex, name: label}) => (
                  <button key={hex} className="no-grow" title={label} aria-label={`Ink ${label}`} onClick={()=>setInk(hex)} style={{ width:24, height:24, borderRadius:'50%', border: ink===hex? '2px solid #fff':'1px solid #64748b', background:hex }} />
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={onClose} style={ghost} aria-label="Cancel">Cancel</button>
                <button onClick={addTyped} style={{ ...primary, opacity: (name||'').trim().length===0 ? .5 : 1, cursor: (name||'').trim().length===0 ? 'not-allowed' : 'pointer' }} aria-label={primaryLabel} disabled={(name||'').trim().length===0}>{primaryLabel}</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'draw' && (
          <div style={{ display:'grid', gap:10 }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ color:'var(--text)' }}>Pen width</span>
              <input aria-label="Pen width" type="range" min={1} max={6} value={penW} onChange={(e)=>setPenW(Number(e.target.value))} />
              <div style={{ display:'flex', gap:10 }}>
                {colorOptions.map(({hex, name: label}) => (
                  <button key={hex} title={label} aria-label={`Ink ${label}`} onClick={()=>setInk(hex)} style={{ width:20, height:20, borderRadius:'50%', border: ink===hex? '2px solid #fff':'1px solid #64748b', background:hex }} />
                ))}
              </div>
            </div>
            <div ref={drawWrapRef} style={{ width:'100%' }}>
              <SignatureCanvas
                ref={sigRef}
                penColor={ink}
                minWidth={Math.max(0.5, penW * 0.5)}
                maxWidth={Math.max(1.2, penW * 2)}
                backgroundColor="rgba(0,0,0,0)"
                canvasProps={{ width: drawDims.w, height: drawDims.h, style: { width:'100%', display:'block', margin:'0 auto', borderRadius: 12, border: '1px solid var(--border)', background:'var(--card)', boxShadow:'inset 0 1px 0 rgba(255,255,255,.35)' } }}
              />
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'space-between' }}>
              <button onClick={()=>sigRef.current?.clear()} style={ghost}>Clear</button>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={onClose} style={ghost} aria-label="Cancel">Cancel</button>
                <button onClick={addDrawn} style={primary} aria-label={primaryLabel}>{primaryLabel}</button>
              </div>
            </div>
          </div>
        )}

        {!isInitials && tab === 'upload' && (
          <div style={{ display:'grid', gap:10 }}>
            <div
              onDragEnter={(e)=>{ e.preventDefault(); setDraggingUpload(true); }}
              onDragOver={(e)=>{ e.preventDefault(); if (!draggingUpload) setDraggingUpload(true); }}
              onDragLeave={()=>setDraggingUpload(false)}
              onDrop={(e)=>{ e.preventDefault(); setDraggingUpload(false); const f=e.dataTransfer.files?.[0]; if (f) onUpload({ target:{ files:[f] } }); }}
              onClick={()=>fileRef.current?.click()}
              style={{
                border:`2px dashed ${draggingUpload ? 'rgba(96,165,250,0.9)' : 'var(--border)'}`,
                borderRadius:12,
                background:'var(--card)',
                padding:16,
                textAlign:'center',
                cursor:'pointer',
                boxShadow: draggingUpload ? '0 12px 28px rgba(96,165,250,.25)' : 'inset 0 1px 0 rgba(255,255,255,.45)'
              }}
              aria-label={isInitials ? 'Drop initials PNG/SVG or click to choose' : 'Drop signature PNG/SVG or click to choose'}
            >
              <div style={{ display:'grid', gap:8, placeItems:'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--brand-primary)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2 4 4h-4z"/></svg>
                <div style={{ fontWeight:800, color:'var(--text)' }}>Drag & drop PNG/SVG here</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>or click to browse</div>
              </div>
            </div>
            <input ref={fileRef} aria-label={isInitials ? 'Upload initials' : 'Upload signature'} type="file" accept="image/png,image/svg+xml" onChange={onUpload} style={{ display:'none' }} />
            {uploadPreview && (
              <div style={{ textAlign:'left' }}>
                <img src={uploadPreview} alt="Signature preview" style={{ maxWidth: '100%', background:'var(--card)', border:'1px dashed var(--border)', padding:12, borderRadius:12 }} />
              </div>
            )}
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={onClose} style={ghost} aria-label="Cancel">Cancel</button>
              <button onClick={saveUpload} style={primary} disabled={!uploadPreview} aria-label={primaryLabel}>{primaryLabel}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function renderTypedSignatureToTightPng(text, fontFamily, color, sizePx, isPlaceholder){
  try { await document.fonts.load(`${sizePx}px '${fontFamily}'`); } catch {}
  const padX = 0, padY = 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${sizePx}px '${fontFamily}', cursive`;
  const metrics = ctx.measureText(text || '');
  const ascent = Math.ceil(Math.abs(metrics.actualBoundingBoxAscent || sizePx * 0.8));
  const descent = Math.ceil(Math.abs(metrics.actualBoundingBoxDescent || sizePx * 0.2));
  const w = Math.max(2, Math.ceil(metrics.width)) + padX * 2;
  const h = ascent + descent + padY * 2;
  canvas.width = w; canvas.height = h;
  const ctx2 = canvas.getContext('2d');
  ctx2.clearRect(0,0,w,h);
  ctx2.font = `${sizePx}px '${fontFamily}', cursive`;
  ctx2.fillStyle = color || '#111827';
  ctx2.textBaseline = 'alphabetic';
  ctx2.fillText(text || '', padX, padY + ascent);
  // Trim transparent bounds for tight fit
  const trimmed = trimCanvasAlpha(canvas);
  return { dataUrl: trimmed, naturalWidth: w, naturalHeight: h };
}

function trimCanvasAlpha(canvas){
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0,0,w,h);
  let top = 0, left = 0, right = w - 1, bottom = h - 1;
  const isEmptyRow = (y) => { for (let x=0;x<w;x++){ if (data[(y*w + x)*4 + 3] > 5) return false; } return true; };
  const isEmptyCol = (x, t, b) => { for (let y=t;y<=b;y++){ if (data[(y*w + x)*4 + 3] > 5) return false; } return true; };
  while (top < bottom && isEmptyRow(top)) top++;
  while (bottom > top && isEmptyRow(bottom)) bottom--;
  while (left < right && isEmptyCol(left, top, bottom)) left++;
  while (right > left && isEmptyCol(right, top, bottom)) right--;
  const outW = Math.max(1, right - left + 1), outH = Math.max(1, bottom - top + 1);
  const out = document.createElement('canvas');
  out.width = outW; out.height = outH;
  out.getContext('2d').drawImage(canvas, left, top, outW, outH, 0, 0, outW, outH);
  return out.toDataURL('image/png');
}

function trimPng(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0,0,c.width,c.height);
  let top = 0, left = 0, right = width - 1, bottom = height - 1;
  const isWhite = (x, y) => { const i = (y*width + x) * 4; const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3]; return a > 0 && r > 245 && g > 245 && b > 245; };
  while (top < bottom && Array.from({ length: width }).every((_, x) => isWhite(x, top))) top++;
  while (bottom > top && Array.from({ length: width }).every((_, x) => isWhite(x, bottom))) bottom--;
  while (left < right && Array.from({ length: bottom - top + 1 }).every((_, i) => isWhite(left, top + i))) left++;
  while (right > left && Array.from({ length: bottom - top + 1 }).every((_, i) => isWhite(right, top + i))) right--;
  const w2 = right - left + 1, h2 = bottom - top + 1;
  const out = document.createElement('canvas');
  out.width = w2; out.height = h2;
  out.getContext('2d').drawImage(c, left, top, w2, h2, 0, 0, w2, h2);
  return out.toDataURL('image/png');
}

const backdrop = { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)' };
const modal = { width: 'min(760px, 96vw)', maxHeight: '90vh', overflow: 'auto', background:'linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.35))', border:'1px solid rgba(255,255,255,0.45)', borderRadius:16, padding:16, boxShadow:'0 24px 70px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.6)', color:'var(--text)', backdropFilter:'saturate(160%) blur(10px)', WebkitBackdropFilter:'saturate(160%) blur(10px)' };
const tabs = { display:'flex', gap:8, marginBottom:12 };
const btn = (active) => ({ padding:'8px 12px', borderRadius:12, border: active? '1px solid rgba(96,165,250,.9)' : '1px solid var(--border)', background: active? 'linear-gradient(180deg, rgba(96,165,250,.95), #1e40af)' : 'linear-gradient(180deg, rgba(255,255,255,.6), rgba(255,255,255,.25))', color: active? '#fff' : 'var(--text)', fontWeight:800, boxShadow: active? '0 10px 24px rgba(30,64,175,.35)' : 'inset 0 1px 0 rgba(255,255,255,.55)' });
const input = { padding:10, borderRadius:10, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)' };
const primary = { padding:'12px 16px', borderRadius:12, border:'1px solid rgba(96,165,250,.55)', color:'#fff', background:'linear-gradient(180deg,var(--brand-primary),#1e40af)', fontWeight:900, boxShadow:'0 12px 28px rgba(30,64,175,.35)' };
const ghost = { padding:'10px 12px', borderRadius:12, border:'1px solid var(--border)', background:'linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,.18))', color:'var(--text)', fontWeight:700 };


