import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiGlobe, FiArrowLeft, FiArrowRight, FiDownload, FiTrash2, FiSun, FiMoon, FiPenTool, FiUser, FiType, FiCalendar, FiCheckSquare, FiMousePointer, FiEye, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { saveAs } from "file-saver";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import PdfViewer from "./components/PdfViewer";
import SidebarTools from "./components/SidebarTools";
import SignatureModal from "./components/SignatureModal";
import SendModal from "./components/SendModal";
import LoginModal from "./components/LoginModal";
import { fetchFontBytes } from "./lib/fonts";
import { textToPng } from "./lib/raster";

const SUPPORTED = ["en", "af", "zu", "xh"];

const MESSAGES = {
  en: {
    title: "Sign PDF — Draw or Type Signature",
    subtitle: "Upload a PDF, add signatures, text, date, and initials.",
    addFile: "Add file",
    pdfLimit: ".pdf up to 50MB",
    continue: "Continue",
    back: "Back",
    clear: "Clear",
    editStep: "Edit Document",
    downloadStep: "Download",
    download: "Download",
  },
};

const pageStyle = { minHeight: "100svh", width: "100%", background: "var(--bg)", color: "var(--text)" };
const container = { width: "100%", maxWidth: "100%", margin: 0, padding: 0, boxSizing: "border-box" };
const sectionPad = { padding: 16 };
const h1 = { fontSize: 36, fontWeight: 900, margin: "0 0 6px" };
const subtle = { color: "#94a3b8" };
const bigBtnBase = { padding: "16px 28px", borderRadius: 14, fontSize: 18, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 10, border: "none", cursor: "pointer", boxShadow: "0 10px 24px rgba(0,0,0,.20)" };
const bigBtnBlue = { ...bigBtnBase, background: "#2563eb", color: "#fff" };
const bigBtnRed = { ...bigBtnBase, background: "#ef4444", color: "#fff" };
const ghostBtn = { padding: "12px 16px", borderRadius: 12, border: "1px solid #334155", background: "transparent", color: "#e2e8f0", fontWeight: 600 };

export default function SignApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialLocale = localStorage.getItem("locale") || "en";
  const [locale, setLocale] = useState(initialLocale);

  useEffect(() => {
    localStorage.setItem("locale", locale);
  }, [locale]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.body.classList.add('theme-dark');
    }
    setIsDark(document.body.classList.contains('theme-dark'));
  }, []);

  // Load handwriting fonts for on-canvas rendering (matches modal previews)
  useEffect(() => {
    const id = 'sig-fonts-link';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Pacifico&family=Great+Vibes&family=Kalam&family=Courgette&family=Caveat:wght@400..700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const t = (key) => (MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key);

  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null); // used by viewer (can be detached)
  const [fileBytesRaw, setFileBytesRaw] = useState(null); // immutable master copy for export
  // Accept file passed from landing via navigation state
  useEffect(() => {
    const f = location.state && location.state.file;
    if (f && !fileBytesRaw) {
      (async () => {
        setFile(f);
        const buf = await f.arrayBuffer();
        const master = new Uint8Array(buf);
        setFileBytesRaw(master);
        setFileBytes(master.slice());
        setStep(2);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);
  const [step, setStep] = useState(1); // 1: upload, 2: editor, 3: download
  const [items, setItems] = useState([]); // overlays: { id, type: 'text'|'image'|'check', page, x, y, w, h, text, size, color, dataUrl, rotate }
  const [page, setPage] = useState(1);
  const [sigOpen, setSigOpen] = useState(false);
  const [sigKind, setSigKind] = useState('signature'); // 'signature' | 'initials'
  const [signatureDraft, setSignatureDraft] = useState('');
  const [tool, setTool] = useState(null);
  const [pendingPlace, setPendingPlace] = useState(null); // {x,y,page}
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState('fit');
  const [isDark, setIsDark] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [signedName, setSignedName] = useState(null);
  const [showFabTools, setShowFabTools] = useState(false);
  const [fabClosing, setFabClosing] = useState(false);
  const [showToolHints, setShowToolHints] = useState(false);
  const [draggingAdd, setDraggingAdd] = useState(false);

  // Editor placement mode
  const [mode, setMode] = useState({ kind: 'select' });

  // Esc exits placement mode
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setMode({ kind:'select' }); setTool(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Delete removes selected overlay
  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      const isEditable = target && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (isEditable) return; // don't intercept when user is typing
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
        e.preventDefault();
        setItems((prev) => prev.filter((x) => x.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);


  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return;
    setFile(f);
    const buf = await f.arrayBuffer();
    const master = new Uint8Array(buf);
    setFileBytesRaw(master);
    setFileBytes(master.slice());
  };

  const clearAll = () => {
    setFile(null);
    setFileBytes(null);
    setFileBytesRaw(null);
    setItems([]);
    inputRef.current && (inputRef.current.value = "");
    setStep(1);
  };

  const exportPdf = async () => {
    if (!fileBytesRaw || exporting) return;
    setExporting(true);
    try {
      const pdfDoc = await PDFDocument.load(fileBytesRaw);
      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Group items per page
      const byPage = items.reduce((acc, it) => {
        acc[it.page] = acc[it.page] || [];
        acc[it.page].push(it);
        return acc;
      }, {});

      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const pageItems = byPage[i + 1] || [];
        if (pageItems.length === 0) continue;
        const p = pages[i];
        const { width, height } = p.getSize();
        for (const it of pageItems) {
          const x = it.x * width;
          const y = it.y * height;
          const color = it.color ? hexToRgb01(it.color) : { r: 0, g: 0, b: 0 };
          const rot = it.rotate ? degrees(it.rotate) : undefined;

          // Prefer image if present (covers signature/text/date/initials rendered as PNG)
          if (it.dataUrl || it.imageDataUrl) {
            const src = it.dataUrl || it.imageDataUrl;
            const bytes = await dataUrlOrUrlToBytes(src);
            const img = await pdfDoc.embedPng(bytes).catch(async () => pdfDoc.embedJpg(bytes));
            const w = (it.w || 0.2) * width;
            const h = (it.h || 0.08) * height;
            p.drawImage(img, { x, y, width: w, height: h, rotate: rot });
            continue;
          }

          if (it.type === "text" || it.type === "check" || it.type === "initials" || it.type === "date") {
            const size = it.sizePt || it.size || 18;
            let chosenFont = helv;
            if (it.fontKey) {
              const bytes = await fetchFontBytes(it.fontKey);
              if (bytes) {
                try { chosenFont = await pdfDoc.embedFont(bytes); } catch {}
              }
            }
            const text = it.type === "check" || it.type === 'checkbox' ? "✓" : (it.text || "");
            p.drawText(text, { x, y, size, font: chosenFont, color: rgb(color.r, color.g, color.b), rotate: rot });
          }
        }
      }
      const out = await pdfDoc.save();
      try { if (signedUrl) { URL.revokeObjectURL(signedUrl); } } catch {}
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setSignedUrl(url);
      setSignedName((file?.name?.replace(/\.pdf$/i, "") || "signed") + "-signed.pdf");
      setStep(3); // go to preview & download screen
    } catch (e) {
      console.error('Export failed', e);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  function hexToRgb01(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#000000");
    if (!m) return { r: 0, g: 0, b: 0 };
    const r = parseInt(m[1], 16) / 255;
    const g = parseInt(m[2], 16) / 255;
    const b = parseInt(m[3], 16) / 255;
    return { r, g, b };
  }

  async function dataUrlOrUrlToBytes(src) {
    try {
      if (typeof src === 'string' && src.startsWith('data:')) {
        const comma = src.indexOf(',');
        const header = src.substring(0, comma);
        const isBase64 = /;base64/i.test(header);
        const data = src.substring(comma + 1);
        if (isBase64) {
          const bin = atob(data);
          const len = bin.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
          return bytes;
        }
        const decoded = decodeURIComponent(data);
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
        return bytes;
      }
      const res = await fetch(src);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    } catch (e) {
      console.error('image fetch failed', e);
      throw e;
    }
  }

  // Helpers to enter placement mode for sidebar tools (typed text/date/checkbox/initials)
  const startPlace = (payload) => { setMode({ kind:'place', payload }); };

  // Rasterize generic label (Text/Date/Initials) into PNG and add as image chip
  async function rasterizeAndAddLabel({ text, sizePt = 16, color = '#111827', at }) {
    const cssFamily = "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    const { dataUrl } = await textToPng({ text: text || '', cssFamily, weight: 400, sizePt, color, scale: 2, padding: 0 });
    // Half previous default (0.25x0.08)
    const baseW = 0.125; const baseH = 0.04;
    const insetX = at.insetX || 0; const insetY = at.insetY || 0;
    const nx = Math.max(insetX, Math.min(1 - insetX - baseW, at.x));
    const ny = Math.max(insetY, Math.min(1 - insetY - baseH, at.y));
    const base = {
      id: crypto.randomUUID?.() || Math.random().toString(36),
      page: at.page,
      x: nx, y: ny,
      w: baseW, h: baseH,
      rotate: 0,
      bgColor: 'rgba(22,163,74,0.15)',
      color,
    };
    setItems(prev => [...prev, { ...base, type: 'image', dataUrl }]);
  }

  return (
    <div className="editor-root" style={{ gridTemplateColumns: step === 3 ? '1fr' : undefined }}>
      {step !== 3 && (
      <aside className="editor-sidebar">
        <div style={{ fontWeight: 900, marginBottom: 8, fontSize: 18 }}>SIGN & EDIT</div>
        <div style={{ display:'grid', gap:8 }}>
          <button className="tool" aria-pressed={tool==='signature'} onClick={()=>{ setTool('signature'); setSigKind('signature'); setSigOpen(true); }}><FiPenTool className="tool-icon" style={{ color:'#0C62FF' }}/> <span style={{ color:'var(--text)' }}>My Signature</span></button>
          <button className="tool" aria-pressed={tool==='initials'} onClick={()=>{ setTool('initials'); setSigKind('initials'); setSigOpen(true); }}><FiUser className="tool-icon" style={{ color:'#16A34A' }}/> <span style={{ color:'var(--text)' }}>My Initials</span></button>
          <button className="tool" aria-pressed={tool==='text'} onClick={()=>{ setTool('text'); startPlace({ type:'text', color:'#111827', sizePt:12 }); }}><FiType className="tool-icon" style={{ color:'#4f46e5' }}/> <span style={{ color:'var(--text)' }}>Text</span></button>
          <button className="tool" aria-pressed={tool==='date'} onClick={()=>{ setTool('date'); startPlace({ type:'date', color:'#111827', sizePt:12, value: new Date().toLocaleDateString() }); }}><FiCalendar className="tool-icon" style={{ color:'#f59e0b' }}/> <span style={{ color:'var(--text)' }}>Date Signed</span></button>
          <button className="tool" aria-pressed={tool==='checkbox'} onClick={()=>{ setTool('checkbox'); startPlace({ type:'checkbox', color:'#111827', sizePt:20 }); }}><FiCheckSquare className="tool-icon" style={{ color:'#0ea5e9' }}/> <span style={{ color:'var(--text)' }}>Checkmark</span></button>
          <button className="tool" onClick={()=>{
            if (items.length === 0) return;
            const ok = window.confirm('This will remove all signatures, text, and marks from the document. Are you sure?');
            if (ok) { setItems([]); setSelectedId(null); }
          }} disabled={items.length===0} style={{ opacity: items.length===0 ? .5 : 1, cursor: items.length===0 ? 'not-allowed' : 'pointer' }}>Clear All</button>
        </div>
      </aside>
      )}
      <main className="editor-canvas">
        {step === 1 && (
          <div style={{ padding: 0 }}>
            <div className="editor-header" style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'8px 16px 8px 28px' }}>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
                <button className="btn" onClick={()=>navigate('/')} style={{ padding:'8px 10px', borderRadius:10, display:'inline-flex', alignItems:'center', gap:6 }}>
                  <FiArrowLeft/> Home
                </button>
              </div>
              <div style={{ flex:1, display:'flex', justifyContent:'center', fontWeight:800, color:'var(--text)' }}>
                Upload
              </div>
              <div style={{ flex:1, display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button className="btn" onClick={()=>{ const dark = document.body.classList.toggle('theme-dark'); localStorage.setItem('theme', dark ? 'dark' : 'light'); setIsDark(dark); }} style={{ padding:'6px 10px', borderRadius: 8, display:'inline-flex', alignItems:'center', gap:6 }} aria-label="Toggle theme">
                  {isDark ? (<><FiSun/> Light</>) : (<><FiMoon/> Dark</>)}
                </button>
              </div>
            </div>
            <div style={{ padding: 16, display:'grid', placeItems:'center', minHeight:'calc(100svh - 140px)' }}>
            <div
              className={`dz-modern ${draggingAdd ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); if (!draggingAdd) setDraggingAdd(true); }}
              onDragEnter={(e)=>{ e.preventDefault(); setDraggingAdd(true); }}
              onDragLeave={()=> setDraggingAdd(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setDraggingAdd(false);
                const f = e.dataTransfer.files?.[0];
                if (!f) return;
                setFile(f);
                const buf = await f.arrayBuffer();
                const master = new Uint8Array(buf);
                setFileBytesRaw(master);
                setFileBytes(master.slice());
                setStep(2);
              }}
            >
              <div className="dz-inner" onClick={() => inputRef.current?.click()}>
                <div className="dz-icon">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2 4 4h-4z"/></svg>
                </div>
                <div className="dz-text">
                  <div className="dz-title">Add file</div>
                  <div className="dz-sub">.pdf up to 50MB</div>
                </div>
                <div className="dz-cta btn-pulse">Browse files</div>
              </div>
              <div className="dz-types">
                <div className="dz-type"><span>PDF</span></div>
                <div className="dz-type"><span>DOC</span></div>
                <div className="dz-type"><span>XLS</span></div>
                <div className="dz-type"><span>JPG</span></div>
                <div className="dz-type"><span>PNG</span></div>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png"
                onChange={(e)=>{ onPick(e); setStep(2); }}
                style={{ display: "none" }}
              />
              {draggingAdd && (
                <div className="dz-overlay" aria-hidden>Drop to upload</div>
              )}
              {file && (
                <div className="dz-file">
                  <div className="dz-fname">{file.name}</div>
                  <div className="dz-actions">
                    <button onClick={() => setStep(2)} className="dz-btn primary">Start signing</button>
                    <button onClick={clearAll} className="dz-btn">Clear</button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: 0 }}>
            {/* Editor Top Header */}
            <div className="editor-header" style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'8px 16px 8px 28px' }}>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
                <button className="btn" onClick={() => setStep(1)} style={{ padding:'8px 10px', borderRadius:10, display:'inline-flex', alignItems:'center', gap:6 }}><FiArrowLeft/> {t('back')}</button>
              </div>
              <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
                <select className="select" value={zoom} onChange={(e)=>setZoom(e.target.value)} aria-label="Zoom" style={{ padding:'6px 8px', borderRadius:8 }}>
                  <option value="fit">Fit width</option>
                  <option value="100">100%</option>
                  <option value="150">150%</option>
                  <option value="200">200%</option>
                </select>
              </div>
              <div style={{ flex:1, display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button className="btn" onClick={()=>{ const dark = document.body.classList.toggle('theme-dark'); localStorage.setItem('theme', dark ? 'dark' : 'light'); setIsDark(dark); }} style={{ padding:'6px 10px', borderRadius: 8, display:'inline-flex', alignItems:'center', gap:6 }} aria-label="Toggle theme">
                  {isDark ? (<><FiSun/> Light</>) : (<><FiMoon/> Dark</>)}
                </button>
              </div>
            </div>

            <PdfViewer
              fileBytes={fileBytes}
              items={items}
              setItems={setItems}
              mode={mode}
              tool={tool}
              selectedId={selectedId}
              onSelect={setSelectedId}
              zoom={zoom}
              onZoomChange={setZoom}
              showZoomControl={false}
              onNumPages={setNumPages}
              // Keep a global cache for alignment guides
              // eslint-disable-next-line react/jsx-no-bind
              refCb={(list)=>{ window.__itemsCache = list; }}
              onCanvasClick={async ({ x, y, page, insetX = 0, insetY = 0 }) => {
                if (mode?.kind !== 'place') return;
                const base = {
                  id: crypto.randomUUID?.() || Math.random().toString(36),
                  page,
                  x, y,
                  w: 0.25, h: 0.08,
                  rotate: 0,
                  bgColor: 'rgba(22,163,74,0.15)',
                  color: mode.payload?.color || '#111827',
                  sizePt: mode.payload?.sizePt || 24,
                };
                const t = mode.payload?.type;
                if (t === 'signature') {
                  if (mode.payload?.imageDataUrl) {
                    // Half previous default size (approx 50%)
                    const w = 0.125, h = 0.04;
                    const nx = Math.max(insetX, Math.min(1 - insetX - w, x));
                    const ny = Math.max(insetY, Math.min(1 - insetY - h, y));
                    setItems(prev => [...prev, { ...base, x: nx, y: ny, type:'signature', w, h, dataUrl: mode.payload.imageDataUrl }]);
                  } else if (mode.payload?.value) {
                    await rasterizeAndAddLabel({ text: mode.payload.value, sizePt: base.sizePt, color: base.color, at: { x, y, page, insetX, insetY } });
                  }
                } else if (t === 'text') {
                  // Create a text-backed chip (inline editable on canvas)
                  const nx = Math.max(insetX, Math.min(1 - insetX - (base.w || 0.25), x));
                  const ny = Math.max(insetY, Math.min(1 - insetY - (base.h || 0.08), y));
                  setItems(prev => prev.concat({
                    ...base,
                    x: nx, y: ny,
                    type: 'text',
                    text: '',
                    sizePt: mode.payload?.sizePt ?? 12,
                  }));
                } else if (t === 'initials') {
                  if (mode.payload?.imageDataUrl) {
                    const w = 0.125, h = 0.04;
                    const nx = Math.max(insetX, Math.min(1 - insetX - w, x));
                    const ny = Math.max(insetY, Math.min(1 - insetY - h, y));
                    setItems(prev => [...prev, { ...base, x: nx, y: ny, type:'initials', w, h, dataUrl: mode.payload.imageDataUrl }]);
                  } else {
                    const initials = (mode.payload?.value || '').trim().slice(0,4);
                    if (!initials) return; // do not place empty initials
                    await rasterizeAndAddLabel({ text: initials, sizePt: base.sizePt || 20, color: base.color, at: { x, y, page, insetX, insetY } });
                  }
                } else if (t === 'date') {
                  await rasterizeAndAddLabel({ text: mode.payload?.value || new Date().toLocaleDateString(), sizePt: 12, color: base.color, at: { x, y, page, insetX, insetY } });
                } else if (t === 'checkbox') {
                  setItems(prev => [...prev, { ...base, type:'checkbox', sizePt: 20 }]);
                }
                // remain in place mode until Esc/tool change
              }}
            />

          {/* FAB toggle (bottom) and fixed tool stack (center-right) for mobile/tablet */}
          <div className="fab-container" aria-hidden={false}>
            <button
              className={`fab-btn fab-main ${!showFabTools ? 'btn-pulse pulse-ring bounce' : ''}`}
              aria-label={showFabTools ? 'Hide tools' : 'Show tools'}
              onClick={()=>{
                if (showFabTools) {
                  setShowToolHints(false);
                  setFabClosing(true);
                  setTimeout(()=>{ setShowFabTools(false); setFabClosing(false); }, 250);
                } else {
                  setShowFabTools(true);
                  setShowToolHints(true);
                  setTimeout(()=>setShowToolHints(false), 3000);
                }
              }}
            >
              <div className="fab-main-inner">
                {showFabTools ? (<FiChevronDown className="fab-chevron"/>) : (<FiChevronUp className="fab-chevron"/>) }
                <div className="fab-label">{showFabTools ? 'Close' : 'Sign'}</div>
              </div>
            </button>
          </div>

          {(showFabTools || fabClosing) && (
            <div className="fab-stack">
              <div className={`fab-tools ${showFabTools && !fabClosing ? 'open' : 'closing'}`} aria-label="Editor tools">
                <div className="fab-row">
                  <button className="fab-btn" aria-label="My Signature" onClick={()=>{ setTool('signature'); setSigKind('signature'); setSigOpen(true); }}>
                    <FiPenTool/>
                  </button>
                  <div className={`fab-hint ${showToolHints ? 'visible' : ''}`}>Signature</div>
                </div>
                <div className="fab-row">
                  <button className="fab-btn" aria-label="My Initials" onClick={()=>{ setTool('initials'); setSigKind('initials'); setSigOpen(true); }}>
                    <FiUser/>
                  </button>
                  <div className={`fab-hint ${showToolHints ? 'visible' : ''}`}>Initials</div>
                </div>
                <div className="fab-row">
                  <button className="fab-btn" aria-label="Text" onClick={()=>{ setTool('text'); startPlace({ type:'text', color:'#111827', sizePt:12 }); }}>
                    <FiType/>
                  </button>
                  <div className={`fab-hint ${showToolHints ? 'visible' : ''}`}>Text</div>
                </div>
                <div className="fab-row">
                  <button className="fab-btn" aria-label="Date" onClick={()=>{ setTool('date'); startPlace({ type:'date', color:'#111827', sizePt:12, value: new Date().toLocaleDateString() }); }}>
                    <FiCalendar/>
                  </button>
                  <div className={`fab-hint ${showToolHints ? 'visible' : ''}`}>Date</div>
                </div>
                <div className="fab-row">
                  <button className="fab-btn" aria-label="Checkmark" onClick={()=>{ setTool('checkbox'); startPlace({ type:'checkbox', color:'#111827', sizePt:20 }); }}>
                    <FiCheckSquare/>
                  </button>
                  <div className={`fab-hint ${showToolHints ? 'visible' : ''}`}>Checkmark</div>
                </div>
                <div className="fab-row">
                  <button className="fab-btn danger" aria-label="Clear All" disabled={items.length===0} onClick={()=>{
                    if (items.length===0) return;
                    const ok = window.confirm('This will remove all signatures, text, and marks from the document. Are you sure?');
                    if (ok) { setItems([]); setSelectedId(null); }
                  }}>
                    <FiTrash2/>
                  </button>
                  <div className={`fab-hint ${showToolHints ? 'visible' : ''}`}>Clear All</div>
                </div>
              </div>
            </div>
          )}

            {/* Bottom fixed action bar */}
            <div className="editor-bottom-bar" style={{ position:'fixed', left:'var(--sidebar-w)', right:0, bottom:0, zIndex:22, background:'var(--card)', borderTop:'1px solid var(--border)', padding:'8px 12px', display:'flex', gap:10, justifyContent:'center', alignItems:'center' }}>
              <div className="editor-bottom-content" style={{ width:'min(980px, 100%)', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button onClick={()=>{
                  const raw = localStorage.getItem('owner');
                  if (!raw) { setLoginOpen(true); } else { setSendOpen(true); }
                }} style={{ padding:'12px 14px', borderRadius:12, border:'1px solid var(--border)', background:'linear-gradient(180deg,var(--brand-primary),#1e40af)', color:'#fff', fontWeight:900, boxShadow:'0 8px 18px rgba(12,98,255,.25)', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <FiGlobe/> <span className="btn-text">Send for signing</span>
                </button>
                <button onClick={exportPdf} disabled={exporting} style={{ padding:'12px 14px', borderRadius:12, border:'1px solid var(--border)', background:'linear-gradient(180deg, rgba(255,255,255,.70), rgba(255,255,255,.32))', color:'var(--text)', fontWeight:900, boxShadow:'inset 0 1px 0 rgba(255,255,255,.65), 0 8px 18px rgba(0,0,0,.18)', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <FiDownload/> <span className="btn-text">{exporting ? 'Preparing…' : t('download')}</span>
                </button>
              </div>
            </div>

            {/* Mini toolbar for selection color */}
            {selectedId && (
              <div style={{ position:'fixed', left: 300, bottom: 64, background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:12, padding:'6px 8px', display:'flex', gap:8, alignItems:'center' }}>
                {['#111827','#0C62FF','#16A34A'].map(c => (
                  <button key={c} onClick={()=>{
                    setItems(prev => prev.map(x => x.id===selectedId ? { ...x, color: c } : x));
                  }} style={{ width:18, height:18, borderRadius:6, background:c, border:'1px solid var(--border)' }} aria-label={`Set color ${c}`} />
                ))}
                <button onClick={()=>{
                  setItems(prev => prev.map(x => x.id===selectedId ? { ...x, bgColor: x.bgColor ? undefined : 'rgba(22,163,74,0.15)' } : x));
                }} style={{ padding:'4px 8px', border:'1px solid var(--border)', borderRadius:8 }} title="Toggle light green background">BG</button>
                <button onClick={()=>{
                  const base = items.find(x=>x.id===selectedId);
                  if (!base || !numPages) return;
                  const clones = [];
                  for (let p=1;p<=numPages;p++){
                    if (p===base.page) continue;
                    const id = crypto.randomUUID?.() || Math.random().toString(36);
                    const { id:_, ...rest } = base;
                    clones.push({ ...rest, id, page:p });
                  }
                  setItems(prev=> prev.concat(clones));
                }} style={{ padding:'4px 8px', border:'1px solid var(--border)', borderRadius:8 }} title="Duplicate to all pages">Duplicate all</button>
                <button onClick={()=>{ setItems(prev=>prev.filter(x=>x.id!==selectedId)); setSelectedId(null); }} style={{ padding:'4px 8px', border:'1px solid var(--border)', borderRadius:8 }}>Delete</button>
              </div>
            )}
            <SignatureModal
              key={sigKind}
              open={sigOpen}
              kind={sigKind}
              initialName={sigKind === 'signature' ? signatureDraft : ''}
              onClose={() => setSigOpen(false)}
              onSave={(data) => {
                // Enter placement mode with signature or initials payload
                const overlayType = sigKind === 'initials' ? 'initials' : 'signature';
                if (data.kind === 'typed-image') {
                  setMode({ kind:'place', payload:{ type: overlayType, imageDataUrl: data.dataUrl, color: data.meta?.color } });
                  if (overlayType === 'signature') {
                    setSignatureDraft(data.meta?.value || '');
                  }
                } else if (data.kind === 'typed') {
                  setMode({ kind:'place', payload:{ type: overlayType, value: data.name, fontKey: data.fontKey, sizePt: 28, color: data.ink } });
                  if (overlayType === 'signature') {
                    setSignatureDraft(data.name || '');
                  }
                } else if (data.kind === 'drawn' || data.kind === 'upload') {
                  setMode({ kind:'place', payload:{ type: overlayType, imageDataUrl: data.dataUrl, color: data.ink } });
                }
                setSigOpen(false);
              }}
            />
            <SendModal
              open={sendOpen}
              onClose={()=>setSendOpen(false)}
              fieldsSnapshot={items.map(({id, dataUrl, imageDataUrl, text, value, size, ...rest})=>({ ...rest, text: text || value, imageDataUrl: imageDataUrl || dataUrl }))}
              pdfBytes={fileBytesRaw}
              defaultTitle={file?.name?.replace(/\.pdf$/i,'') || 'Untitled'}
            />
            <LoginModal open={loginOpen} onClose={()=>setLoginOpen(false)} onLoggedIn={()=>setSendOpen(true)} />
          </div>
        )}

        {step === 3 && (
          <div style={{ ...sectionPad, paddingTop: 0 }}>
            {/* Keep top navigation/header on download step */}
            <div className="editor-header" style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', padding:'8px 12px' }}>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
                <button className="btn" onClick={() => setStep(2)} style={{ padding:'8px 10px', borderRadius:10, display:'inline-flex', alignItems:'center', gap:6 }}><FiArrowLeft/> {t('back')}</button>
              </div>
              <div style={{ flex:1, display:'flex', justifyContent:'center', fontWeight:800, color:'var(--text)' }}>
                Preview & Download
              </div>
              <div style={{ flex:1, display:'flex', justifyContent:'flex-end' }}>
                <button className="btn" onClick={()=>{ const dark = document.body.classList.toggle('theme-dark'); localStorage.setItem('theme', dark ? 'dark' : 'light'); setIsDark(dark); }} style={{ padding:'6px 10px', borderRadius: 8, display:'inline-flex', alignItems:'center', gap:6 }} aria-label="Toggle theme">
                  {isDark ? (<><FiSun/> Light</>) : (<><FiMoon/> Dark</>)}
                </button>
              </div>
            </div>
            <div style={{ display:'grid', gap:16 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, color:'var(--text)' }}>You can download your PDF now</div>
                <div style={{ color:'var(--muted)' }}>Preview your signed document below, keep editing, or start over.</div>
              </div>
              <div style={{ display:'grid', placeItems:'center' }}>
                <div
                  className="previewCard"
                  style={{ position:'relative', width:'min(1200px, 98vw)', height:'min(96svh, calc(100vh - 220px))', maxHeight:'calc(100vh - 220px)', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, boxShadow:'0 14px 40px rgba(0,0,0,.22)', overflow:'hidden' }}
                  onClick={()=>{ if (signedUrl) window.open(signedUrl, '_blank', 'noopener,noreferrer'); }}
                >
                  {signedUrl ? (
                    <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
                      <div style={{ width:'calc(100% / 0.65)', height:'calc(100% / 0.65)', transform:'scale(0.65)', transformOrigin:'top left' }}>
                        <iframe title="Signed PDF preview" src={signedUrl} style={{ width:'100%', height:'100%', border:'none', background:'#fff' }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', color:'var(--muted)' }}>No preview.</div>
                  )}
                  <div aria-hidden className="previewOverlay" style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', background:'linear-gradient( to bottom, rgba(0,0,0,.0), rgba(0,0,0,.10))', opacity:0, transition:'opacity .2s ease', pointerEvents:'none' }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:12, background:'rgba(0,0,0,.55)', color:'#fff', fontWeight:800 }}><FiEye/> Preview</div>
                  </div>
                </div>
              </div>
              <style>{`.previewCard:hover .previewOverlay{opacity:1}`}</style>
              <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
                <button onClick={()=>setStep(2)} style={{ ...ghostBtn, display:'inline-flex', alignItems:'center', gap:8, border:'1px solid #60a5fa', color:'#0C62FF', background:'linear-gradient(180deg, rgba(255,255,255,.70), rgba(255,255,255,.32))', boxShadow:'inset 0 1px 0 rgba(255,255,255,.65), 0 8px 22px rgba(96,165,250,.25)', padding:'14px 20px', borderRadius:14 }}><FiPenTool/> Keep Editing</button>
                <button onClick={()=>{ if (signedUrl) { fetch(signedUrl).then(r=>r.blob()).then(b=>saveAs(b, signedName || 'signed.pdf')); } }} style={{ ...bigBtnBlue, display:'inline-flex', alignItems:'center', gap:8, padding:'16px 24px', borderRadius:14 }}><FiDownload/> Download Now</button>
                <button onClick={clearAll} style={{ ...bigBtnRed, display:'inline-flex', alignItems:'center', gap:8, padding:'14px 20px', borderRadius:14 }}><FiArrowLeft/> Start Over</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


