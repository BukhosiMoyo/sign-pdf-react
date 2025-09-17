import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { HANDWRITING_FONTS } from "../lib/fonts";

// Ensure the PDF.js worker loads locally via Vite (avoids CORS on CDNs)
// Vite will bundle this worker and serve it from the dev server
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
// Use workerSrc with version matching pdfjs-dist to avoid API/Worker mismatches
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const FORGIVENESS_PX = 12; // hit slop around chips for placement
const PAGE_INSET_PX = 5;   // keep chips 5px inside page edges
const GRID_PX = 8;         // grid used for placement clicks
const SNAP_PX = 6;         // alignment snap tolerance (px)

export default function PdfViewer({ fileBytes, items, setItems, mode, tool, onCanvasClick, selectedId, onSelect, zoom = '100', onZoomChange, showZoomControl = false, onNumPages }) {
  const [numPages, setNumPages] = useState(0);
  const pageRefs = useRef({});
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageWidth, setPageWidth] = useState(800);
  const [docUrl, setDocUrl] = useState(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const lastPlaceRef = useRef(0);
  const [hintPos, setHintPos] = useState(null); // {x,y}
  const [alignGuide, setAlignGuide] = useState({ page: null, v: null, h: null }); // page-relative px lines

  const onDocLoad = ({ numPages }) => { setNumPages(numPages); if (onNumPages) onNumPages(numPages); };

  // Create object URL for PDF to avoid ArrayBuffer transfer/detach issues with worker
  useEffect(() => {
    if (!fileBytes) { if (docUrl) { URL.revokeObjectURL(docUrl); setDocUrl(null); } return; }
    try {
      const blob = new Blob([fileBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (docUrl) URL.revokeObjectURL(docUrl);
      setDocUrl(url);
    } catch {}
    // cleanup on unmount/change
    return () => { if (docUrl) URL.revokeObjectURL(docUrl); };
  }, [fileBytes]);

  const updateItem = (id, next) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...next } : it)));
  const removeItemDirect = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const onWheelRotate = (e, it) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    const next = Math.max(-180, Math.min(180, (it.rotate || 0) + (e.deltaY > 0 ? 5 : -5)));
    updateItem(it.id, { rotate: next });
  };

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];
      if (visible) setCurrentPage(Number(visible.target.getAttribute('data-page')));
    }, { root: null, threshold: 0.5 });
    Object.values(pageRefs.current).forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [numPages]);

  useEffect(() => {
    const calc = () => {
      if (zoom === 'fit') {
        const el = containerRef.current;
        const avail = (el?.clientWidth || 1000) - 48; // padding
        setPageWidth(Math.max(480, Math.min(1200, avail)));
      } else if (zoom === '100') setPageWidth(800);
      else if (zoom === '150') setPageWidth(Math.round(800 * 1.5));
      else if (zoom === '200') setPageWidth(1600);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [zoom]);

  const handleMouseUp = (e, pageNumber) => {
    const now = Date.now();
    if (now < cooldownUntilRef.current) return;
    if (now - lastPlaceRef.current < 200) return;
    lastPlaceRef.current = now;
    if ((e.target.closest && e.target.closest('[data-chip="1"]')) || isDraggingRef.current || isResizingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    if (!onCanvasClick || !mode || mode.kind !== 'place') return;
    const host = pageRefs.current[pageNumber]?.querySelector('canvas');
    if (!host) return;
    const rect = host.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Forgiveness check: ignore placement if near any chip on this page
    const pageItems = items.filter(it => it.page === pageNumber);
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top; // top-origin
    for (const it of pageItems) {
      const left = (it.x || 0) * rect.width;
      const width = (it.w || 0.25) * rect.width;
      const height = (it.h || 0.08) * rect.height;
      const top = rect.height - (it.y || 0) * rect.height - height; // convert bottom->top origin
      const l = left - FORGIVENESS_PX;
      const r = left + width + FORGIVENESS_PX;
      const t = top - FORGIVENESS_PX;
      const b = top + height + FORGIVENESS_PX;
      if (clickX >= l && clickX <= r && clickY >= t && clickY <= b) return; // near a chip → no placement
    }

    const rawX = (e.clientX - rect.left);
    const rawY = (e.clientY - rect.top);
    const grid = 8;
    const sx = Math.round(rawX / grid) * grid;
    const sy = Math.round(rawY / grid) * grid;
    const insetX = PAGE_INSET_PX / rect.width;
    const insetY = PAGE_INSET_PX / rect.height;
    const nx = Math.min(1 - insetX, Math.max(insetX, sx / rect.width));
    const nyTop = Math.min(1 - insetY, Math.max(insetY, sy / rect.height));
    const ny = 1 - nyTop;
    onCanvasClick({ x: nx, y: ny, page: pageNumber, insetX, insetY });
  };

  const onMouseMoveContainer = (e) => {
    // Only show hint in placement mode, over PDF pages, and not over chips
    if (!(mode && mode.kind === 'place')) {
      if (hintPos) setHintPos(null);
      return;
    }
    if (e.target.closest && e.target.closest('[data-chip="1"]')) {
      if (hintPos) setHintPos(null);
      return;
    }
    const isOverPage = !!(e.target.closest && e.target.closest('.pdf-page'));
    if (!isOverPage) {
      if (hintPos) setHintPos(null);
      return;
    }
    setHintPos({ x: e.clientX + 14, y: e.clientY + 14 });
  };

  // Auto-focus text immediately after placement
  useEffect(() => {
    if (!items || items.length === 0) return;
    const latest = items[items.length - 1];
    if (!latest || latest.type !== 'text') return;
    // Wait a tick for OverlayItem to mount, then focus the contentEditable
    const t = setTimeout(() => {
      try {
        const host = document.querySelector('[data-chip="1"] [data-editable="1"]:last-of-type');
        if (host && host.focus) host.focus();
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [items]);

  const hint = (() => {
    if (!mode || mode.kind !== 'place') return null;
    const t = mode.payload?.type;
    const map = {
      signature: { icon: '✋', text: 'Add signature' },
      initials:  { icon: '✋', text: 'Add initials' },
      text:      { icon: '✋', text: 'Add text' },
      date:      { icon: '✋', text: 'Add date' },
      checkbox:  { icon: '✋', text: 'Add checkmark' },
    };
    return map[t] || null;
  })();

  return (
    <div
      ref={containerRef}
      style={{ position:'relative', height:'100%', overflow:'auto', cursor: mode && mode.kind==='place' ? 'pointer' : 'auto' }}
      onMouseMove={onMouseMoveContainer}
    >
      {showZoomControl && (
        <div style={{ position:'sticky', top: 8, right: 8, display:'flex', justifyContent:'flex-end', zIndex:10 }}>
          <select value={zoom} onChange={(e)=>onZoomChange && onZoomChange(e.target.value)} style={{ padding:'6px 8px', border:'1px solid var(--border)', borderRadius:8, background:'var(--card)', color:'var(--text)' }} aria-label="Zoom">
            <option value="fit">Fit width</option>
            <option value="100">100%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
          </select>
        </div>
      )}
      <Document file={docUrl} onLoadSuccess={onDocLoad} loading={<div style={{ padding: 20 }}>Loading…</div>}>
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pn) => {
          const refCb = (el) => { pageRefs.current[pn] = el; };
          const pageItems = items.filter((it) => it.page === pn);
          return (
            <div key={pn}>
              <div className="pdf-page" data-page={pn} ref={refCb} onMouseUp={(e)=>handleMouseUp(e, pn)} style={{ position:'relative', width: pageWidth + 20, margin: '0 auto', cursor: (mode && mode.kind==='place') ? 'pointer' : 'auto' }}>
                <Page pageNumber={pn} renderTextLayer={false} renderAnnotationLayer={false} width={pageWidth} />
                {pageItems.map((it) => (
                  <OverlayItem
                    key={it.id}
                    item={it}
                    isSelected={selectedId===it.id}
                    onSelect={()=>onSelect && onSelect(it.id)}
                    pagePixelWidth={pageWidth}
                    containerRef={{ current: pageRefs.current[pn] }}
                    onChange={(next) => updateItem(it.id, next)}
                    onRemove={() => removeItemDirect(it.id)}
                    onWheelRotate={(e) => onWheelRotate(e, it)}
                    isDraggingRef={isDraggingRef}
                    isResizingRef={isResizingRef}
                    cooldownUntilRef={cooldownUntilRef}
                    allItems={items}
                    onAlignGuideChange={(g)=> setAlignGuide(g || { page:null, v:null, h:null })}
                  />
                ))}
                {alignGuide.page===pn && (alignGuide.v!=null || alignGuide.h!=null) && (
                  <>
                    {alignGuide.v!=null && (<div style={{ position:'absolute', left:alignGuide.v+10, top:0, bottom:0, width:1, background:'#60a5fa', zIndex:50, pointerEvents:'none' }} />)}
                    {alignGuide.h!=null && (<div style={{ position:'absolute', top:alignGuide.h, left:10, right:10, height:1, background:'#60a5fa', zIndex:50, pointerEvents:'none' }} />)}
                  </>
                )}
              </div>
              {pn < numPages && (
                <div style={{ margin: '20px auto 8px', width: pageWidth + 20, height: 28, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div className="page-indicator" aria-live="polite" style={{ background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:9999, padding:'4px 10px', fontSize:12, fontWeight:700, boxShadow:'0 2px 6px rgba(0,0,0,.08)' }}>Page {pn} of {numPages || '—'}</div>
                </div>
              )}
            </div>
          );
        })}
      </Document>
      {hint && hintPos && (
        <div style={{ position:'fixed', left: hintPos.x, top: hintPos.y, pointerEvents:'none', zIndex: 50, background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 8px', display:'inline-flex', alignItems:'center', gap:6, boxShadow:'0 2px 8px rgba(0,0,0,.15)' }}>
          <span aria-hidden>{hint.icon}</span>
          <span style={{ fontSize:12, fontWeight:700 }}>{hint.text}</span>
        </div>
      )}
    </div>
  );
}

function OverlayItem({ item, isSelected=false, onSelect, pagePixelWidth = 800, containerRef, onChange, onRemove, onWheelRotate, isDraggingRef, isResizingRef, cooldownUntilRef, onAlignGuideChange, allItems = [] }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);
  const [resize, setResize] = useState(null); // { corner: 'tl'|'tr'|'bl'|'br', start:{x,y,w,h}, startPxX, startPxY }
  const [isEditing, setIsEditing] = useState(false);
  const editableRef = useRef(null);
  const dragArmRef = useRef(null); // pending drag when starting inside editable
  const lastGuideRef = useRef(null);

  const setGlobalUserSelect = (disabled) => {
    const val = disabled ? 'none' : '';
    document.body.style.userSelect = val;
    document.body.style.webkitUserSelect = val;
    document.body.style.MozUserSelect = val;
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      const host = containerRef.current?.querySelector("canvas");
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

      // Promote to drag if user moved enough after starting inside editable
      if (!drag && dragArmRef.current) {
        const d = dragArmRef.current;
        const moved = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
        if (moved > 4) {
          setDrag({ offsetX: d.offsetX, offsetY: d.offsetY });
          isDraggingRef.current = true;
          setGlobalUserSelect(true);
          if (d.fromEditable && editableRef.current) {
            try { editableRef.current.blur(); } catch {}
            const sel = window.getSelection && window.getSelection();
            if (sel && sel.removeAllRanges) sel.removeAllRanges();
          }
        }
      }

      if (drag) {
        const px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        const py = clamp(1 - ((e.clientY - rect.top) / rect.height), 0, 1);
        const insetX = 5 / rect.width;
        const insetY = 5 / rect.height;
        // base position (smooth)
        let nx = clamp(px - drag.offsetX, insetX, 1 - insetX - (item.w || 0));
        let ny = clamp(py - drag.offsetY, insetY, 1 - insetY - (item.h || 0));
        // alignment snaps relative to other items on this page
        let guideV = null, guideH = null;
        const others = allItems.filter(x => x.page === item.page && x.id !== item.id);
        const thisLeft = nx * rect.width;
        const thisTop = (1 - ny) * rect.height - (item.h || 0.08) * rect.height;
        const thisCenterX = thisLeft + (item.w || 0.25) * rect.width / 2;
        const thisCenterY = thisTop + (item.h || 0.08) * rect.height / 2;
        const wr = containerRef.current?.getBoundingClientRect();
        for (const o of others) {
          const oLeft = (o.x || 0) * rect.width;
          const oTop = rect.height - (o.y || 0) * rect.height - (o.h || 0.08) * rect.height;
          const oCenterX = oLeft + (o.w || 0.25) * rect.width / 2;
          const oCenterY = oTop + (o.h || 0.08) * rect.height / 2;
          if (Math.abs(thisCenterX - oCenterX) <= SNAP_PX) {
            if (wr) guideV = (rect.left - wr.left) + oCenterX;
            nx = (oCenterX - (item.w || 0.25) * rect.width / 2) / rect.width;
          }
          if (Math.abs(thisCenterY - oCenterY) <= SNAP_PX) {
            if (wr) guideH = (rect.top - wr.top) + oCenterY;
            // Align centers vertically: ny is bottom-origin fraction
            // B = rect.height - centerY - (itemHeight/2)
            // ny = B / rect.height = 1 - (centerY/rect.height) - (item.h/2)
            ny = 1 - (oCenterY / rect.height) - ((item.h || 0.08) / 2);
            // clamp within insets and bounds
            ny = clamp(ny, insetY, 1 - insetY - (item.h || 0.08));
          }
        }
        const nextGuide = { page: item.page, v: guideV, h: guideH };
        if (onAlignGuideChange) {
          const prev = lastGuideRef.current || {};
          const changed = prev.page !== nextGuide.page || prev.v !== nextGuide.v || prev.h !== nextGuide.h;
          if (changed) { lastGuideRef.current = nextGuide; onAlignGuideChange(nextGuide); }
        }
        onChange({ x: nx, y: ny });
      } else if (resize) {
        const { start, corner } = resize;
        // Pointer in normalized coords
        const px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        const py = clamp(1 - ((e.clientY - rect.top) / rect.height), 0, 1);

        // Center-anchored proportional resize: keep center fixed while scaling
        const cx = start.x + (start.w || 0.25) / 2;
        const cy = start.y + (start.h || 0.08) / 2;

        // Initial vector from center to the dragged corner
        let c0x, c0y;
        if (corner === 'br') { c0x = start.x + start.w - cx; c0y = start.y - cy; }
        if (corner === 'tl') { c0x = start.x - cx; c0y = start.y + start.h - cy; }
        if (corner === 'tr') { c0x = start.x - cx; c0y = start.y - cy; }
        if (corner === 'bl') { c0x = start.x + start.w - cx; c0y = start.y + start.h - cy; }
        const v0 = Math.hypot(c0x, c0y) || 0.0001;

        // Current vector from center to pointer
        const v1 = Math.hypot(px - cx, py - cy);

        // Scale relative to initial
        let s = v1 / v0;
        s = clamp(s, 0.2, 5);

        const minSize = 0.02;
        const baseW = start.w || 0.25;
        const baseH = start.h || 0.08;
        let newW = Math.max(minSize, baseW * s);
        let newH = Math.max(minSize, baseH * s);

        // Keep center fixed
        let newX = cx - newW / 2;
        let newY = cy - newH / 2;

        // Clamp within 5px inset bounds
        const insetX = 5 / rect.width;
        const insetY = 5 / rect.height;
        const minX = insetX;
        const minY = insetY;
        const maxX = 1 - insetX - newW;
        const maxY = 1 - insetY - newH;
        newX = clamp(newX, minX, Math.max(minX, maxX));
        newY = clamp(newY, minY, Math.max(minY, maxY));

        onChange({ x: newX, y: newY, w: newW, h: newH });
      }
    };
    const onMouseUp = () => {
      setDrag(null);
      setResize(null);
      dragArmRef.current = null;
      isDraggingRef.current = false;
      isResizingRef.current = false;
      cooldownUntilRef.current = Date.now() + 150;
      setGlobalUserSelect(false);
      onAlignGuideChange && onAlignGuideChange(null);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [drag, resize, item]);

  const fontFamily = item.fontKey ? HANDWRITING_FONTS[item.fontKey]?.css : undefined;
  const isTextLike = item.type === "text" || item.type === "check" || item.type === 'checkbox' || item.type === 'initials' || item.type === 'date';

  const style = isTextLike
    ? { position: "absolute", left: `${item.x * 100}%`, bottom: `${item.y * 100}%`, transform: `rotate(${item.rotate || 0}deg)`, color: item.color || "#111827", background: item.bgColor || "rgba(22,163,74,0.15)", borderRadius: 8, padding: "5px 4px", fontWeight: 400, fontFamily, fontSize: item.size || item.sizePt || 16, cursor: "move", userSelect: "none", maxWidth: item.w ? `${(item.w) * pagePixelWidth}px` : undefined, zIndex:5 }
    : { position: "absolute", left: `${item.x * 100}%`, bottom: `${item.y * 100}%`, transform: `rotate(${item.rotate || 0}deg)`, cursor: "move", zIndex:5, background: item.bgColor || "rgba(22,163,74,0.15)", borderRadius: 8, padding: "5px 4px" };

  const handleStyle = (pos) => ({ position:'absolute', width:12, height:12, borderRadius:'50%', background: pos==='tr' ? '#ef4444' : '#fff', border: pos==='tr' ? '2px solid #ef4444' : '2px solid #0C62FF', boxShadow:'0 1px 2px rgba(0,0,0,.2)', cursor: (pos==='tl'||pos==='br') ? 'nwse-resize' : 'nesw-resize' });

  const displayText = (item.type === 'check' || item.type === 'checkbox') ? '✓' : (item.text ?? item.value ?? '');

  return (
    <div data-chip="1" ref={ref} onMouseDown={(e) => {
      // If clicking inside editable text, stage a potential drag and let caret work
      if (item.type === 'text' && e.target.closest && e.target.closest('[data-editable="1"]')) {
        e.stopPropagation();
        const host = containerRef.current?.querySelector("canvas");
        if (host) {
          const rect = host.getBoundingClientRect();
          const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const py = Math.max(0, Math.min(1, 1 - ((e.clientY - rect.top) / rect.height)));
          dragArmRef.current = { startX: e.clientX, startY: e.clientY, offsetX: px - (item.x || 0), offsetY: py - (item.y || 0), fromEditable: true };
        }
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      onSelect && onSelect();
      const host = containerRef.current?.querySelector("canvas");
      if (host) {
        const rect = host.getBoundingClientRect();
        const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const py = Math.max(0, Math.min(1, 1 - ((e.clientY - rect.top) / rect.height)));
        setDrag({ offsetX: px - (item.x || 0), offsetY: py - (item.y || 0) });
      } else {
        setDrag({ offsetX: 0, offsetY: 0 });
      }
      isDraggingRef.current = true;
      setGlobalUserSelect(true);
    }} onClick={(e)=> e.stopPropagation()} onWheel={onWheelRotate} style={{ ...style, outline: isSelected ? '2px solid #60a5fa' : 'none', boxShadow: isSelected ? '0 0 0 2px rgba(96,165,250,.2)' : 'none' }}>
      {item.type === 'text' ? (
        <div style={{ position:'relative', display:'inline-block' }}>
          <div
            data-editable="1"
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onMouseDown={(e)=>{ e.stopPropagation(); /* allow text selection & caret */ }}
            onClick={(e)=>{ e.stopPropagation(); /* focus handled by browser */ }}
            onFocus={()=>{
              setIsEditing(true);
              if (editableRef.current && editableRef.current.textContent !== (item.text || '')) {
                editableRef.current.textContent = item.text || '';
              }
            }}
            onInput={(e)=> onChange({ text: e.currentTarget.textContent || '' })}
            onBlur={(e)=>{ setIsEditing(false); onChange({ text: e.currentTarget.textContent || '' }); }}
            style={{ outline:'none', userSelect:'text', pointerEvents: drag ? 'none' : 'auto', display:'inline-block', lineHeight:1.2, minWidth: 8 }}
          />
        </div>
      ) : (isTextLike ? (
        <span contentEditable={false} suppressContentEditableWarning onClick={(e)=> e.stopPropagation()} draggable={false} style={{ outline: 'none', userSelect:'none', pointerEvents:'none', display:'inline-block', lineHeight:1 }}>{displayText}</span>
      ) : (
        <img src={item.dataUrl} alt="signature" draggable={false} style={{ width: `${(item.w || 0.25) * pagePixelWidth}px`, height: `${(item.h || 0.08) * pagePixelWidth}px`, objectFit:'contain', filter: "drop-shadow(0 1px 1px rgba(0,0,0,.15))", pointerEvents: "none", userSelect:'none', display:'block', verticalAlign:'top' }} />
      ))}
      {(isTextLike || item.type === 'signature' || item.type === 'image') && isSelected && (
        <>
          <div onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); setResize({ corner:'tl', start:{ x:item.x, y:item.y, w:item.w||0.25, h:item.h||0.08, sizePt: item.sizePt || item.size || 12 }, startPxX:e.clientX, startPxY:e.clientY }); isResizingRef.current = true; setGlobalUserSelect(true); }} style={{ ...handleStyle('tl'), left:-8, top:-8 }} />
          <div onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); isDraggingRef.current = false; isResizingRef.current = false; if (cooldownUntilRef) cooldownUntilRef.current = Date.now() + 300; onRemove(); }} style={{ ...handleStyle('tr'), right:-8, top:-8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:700, lineHeight:1, cursor:'pointer' }}>×</div>
          <div onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); setResize({ corner:'bl', start:{ x:item.x, y:item.y, w:item.w||0.25, h:item.h||0.08, sizePt: item.sizePt || item.size || 12 }, startPxX:e.clientX, startPxY:e.clientY }); isResizingRef.current = true; setGlobalUserSelect(true); }} style={{ ...handleStyle('bl'), left:-8, bottom:-8 }} />
          {item.type === 'text' ? (
            <div
              onMouseDown={(e)=>{
                e.preventDefault(); e.stopPropagation();
                const host = containerRef.current?.querySelector("canvas");
                if (host) {
                  const rect = host.getBoundingClientRect();
                  const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const py = Math.max(0, Math.min(1, 1 - ((e.clientY - rect.top) / rect.height)));
                  setDrag({ offsetX: px - (item.x || 0), offsetY: py - (item.y || 0) });
                  isDraggingRef.current = true; setGlobalUserSelect(true);
                }
              }}
              style={{ position:'absolute', right:-8, bottom:-8, width:12, height:12, borderRadius:'50%', background:'#64748b', border:'2px solid #64748b', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, lineHeight:1, cursor:'grab', boxShadow:'0 1px 2px rgba(0,0,0,.2)' }}
              title="Drag"
            >⠿</div>
          ) : (
            <div onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); setResize({ corner:'br', start:{ x:item.x, y:item.y, w:item.w||0.25, h:item.h||0.08, sizePt: item.sizePt || item.size || 12 }, startPxX:e.clientX, startPxY:e.clientY }); isResizingRef.current = true; setGlobalUserSelect(true); }} style={{ ...handleStyle('br'), right:-8, bottom:-8 }} />
          )}
        </>
      )}
    </div>
  );
}


