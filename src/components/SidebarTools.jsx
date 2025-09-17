import { useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

const handwritingFonts = [
  { name: "Dancing Script", css: "'Dancing Script', cursive" },
  { name: "Pacifico", css: "'Pacifico', cursive" },
  { name: "Satisfy", css: "'Satisfy', cursive" },
  { name: "Great Vibes", css: "'Great Vibes', cursive" },
  { name: "Courgette", css: "'Courgette', cursive" },
  { name: "Kalam", css: "'Kalam', cursive" },
];

export default function SidebarTools({ onAddItem, currentPage = 1, tool, setTool }) {
  const [tab, setTab] = useState("typed");
  const [typed, setTyped] = useState("Your Name");
  const [font, setFont] = useState(handwritingFonts[0].css);
  const [size, setSize] = useState(24);
  const [assignedSignerId, setAssignedSignerId] = useState('signer-1');
  const [required, setRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const sigRef = useRef(null);

  const typedPreview = useMemo(() => (
    <div style={{ fontFamily: font, fontSize: 28, fontWeight: 600, color: "#111827", background: "#f8fafc", borderRadius: 10, padding: 12, textAlign: "center", border: "1px solid #e2e8f0" }}>{typed}</div>
  ), [typed, font]);

  const [ink, setInk] = useState('#111827'); // black default
  const addTyped = () => {
    onAddItem({ id: crypto.randomUUID?.() || Math.random().toString(36), type: "text", page: currentPage, x: 0.3, y: 0.3, text: typed, sizePt: size, color: ink, assignedSignerId, required, placeholder, lockedAtSend: false });
  };

  const addDate = () => {
    const d = new Date().toLocaleDateString();
    onAddItem({ id: crypto.randomUUID?.() || Math.random().toString(36), type: "date", page: currentPage, x: 0.3, y: 0.25, text: d, sizePt: 16, color: ink, assignedSignerId, required, placeholder: placeholder || 'YYYY-MM-DD', lockedAtSend: false });
  };

  const addInitials = () => {
    const initials = typed.split(/\s+/).map((w) => w[0]).filter(Boolean).join("");
    onAddItem({ id: crypto.randomUUID?.() || Math.random().toString(36), type: "initials", page: currentPage, x: 0.3, y: 0.2, text: initials, sizePt: 20, color: ink, assignedSignerId, required, placeholder, lockedAtSend: false });
  };

  const addDrawn = () => {
    const canvas = sigRef.current;
    if (!canvas || canvas.isEmpty()) return;
    const dataUrl = canvas.getTrimmedCanvas().toDataURL("image/png");
    onAddItem({ id: crypto.randomUUID?.() || Math.random().toString(36), type: "signature", page: currentPage, x: 0.3, y: 0.3, w: 0.25, h: 0.08, dataUrl, color: ink, assignedSignerId, required, placeholder, lockedAtSend: false });
  };

  const addCheck = () => {
    onAddItem({ id: crypto.randomUUID?.() || Math.random().toString(36), type: 'checkbox', page: currentPage, x: 0.3, y: 0.3, sizePt: 20, color: ink, assignedSignerId, required, placeholder, lockedAtSend: false });
  }

  const clearDrawn = () => sigRef.current?.clear();

  return (
    <div style={{ background: "#0b1220", borderRight: "1px solid #1f2937", padding: 12 }}>
      <div style={{ fontWeight: 900, color: "#e2e8f0", marginBottom: 8 }}>SIGN & EDIT</div>
      <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
        <button onClick={() => setTool('signature')} style={toolBtn(tool==='signature')}>My Signature</button>
        <button onClick={() => setTool('initials')} style={toolBtn(tool==='initials')}>My Initials</button>
        <button onClick={() => setTool('text')} style={toolBtn(tool==='text')}>Text</button>
        <button onClick={() => setTool('date')} style={toolBtn(tool==='date')}>Date Signed</button>
        <button onClick={() => setTool('checkbox')} style={toolBtn(tool==='checkbox')}>Checkmark</button>
      </div>

      {tab === "typed" && (
        <div style={{ display: "grid", gap: 8 }}>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your name" style={inputStyle} />
          <div style={{ display:'grid', gap:6 }}>
            <label style={{ color:'#cbd5e1', fontSize:12 }}>Assign to signer</label>
            <select value={assignedSignerId} onChange={(e)=>setAssignedSignerId(e.target.value)} style={inputStyle}>
              <option value="signer-1">Signer 1</option>
              <option value="signer-2">Signer 2</option>
            </select>
            <label style={{ color:'#cbd5e1', fontSize:12 }}>Placeholder/help</label>
            <input value={placeholder} onChange={(e)=>setPlaceholder(e.target.value)} style={inputStyle} placeholder="Placeholder" />
            <label style={{ display:'flex', alignItems:'center', gap:8, color:'#cbd5e1' }}>
              <input type="checkbox" checked={required} onChange={(e)=>setRequired(e.target.checked)} /> Required
            </label>
          </div>
          <select value={font} onChange={(e) => setFont(e.target.value)} style={inputStyle}>
            {handwritingFonts.map((f) => (
              <option key={f.name} value={f.css}>{f.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#111827', '#1d4ed8', '#16a34a'].map(c => (
              <button key={c} onClick={() => setInk(c)} style={{ width: 20, height: 20, borderRadius: 6, border: ink === c ? '2px solid #fff' : '1px solid #64748b', background: c }} />
            ))}
          </div>
          <label style={{ color: "#cbd5e1", fontSize: 12 }}>Size</label>
          <input type="range" min={14} max={48} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          {typedPreview}
          <button onClick={addTyped} style={primaryBtn}>Add to document</button>
        </div>
      )}

      {tab === "draw" && (
        <div style={{ display: "grid", gap: 8 }}>
          <SignatureCanvas ref={sigRef} penColor={ink} backgroundColor="#f8fafc" canvasProps={{ width: 260, height: 120, style: { borderRadius: 10, border: "1px solid #e2e8f0" } }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={clearDrawn} style={ghostBtn}>Clear</button>
            <button onClick={addDrawn} style={primaryBtn}>Add signature</button>
          </div>
        </div>
      )}

      {tab === "text" && (
        <div style={{ display: "grid", gap: 8 }}>
          <button onClick={addDate} style={primaryBtn}>Add today’s date</button>
          <button onClick={addInitials} style={ghostBtn}>Add initials</button>
          <button onClick={addCheck} style={ghostBtn}>Add checkmark</button>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: 10, borderRadius: 10, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0" };
const primaryBtn = { padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", color: "#fff", background: "linear-gradient(180deg,#2563eb,#1e40af)", fontWeight: 800 };
const ghostBtn = { padding: "10px 12px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#e2e8f0", fontWeight: 600 };

const tabBtn = (active) => ({
  padding: "8px 12px",
  borderRadius: 10,
  border: active ? "1px solid #60a5fa" : "1px solid #334155",
  background: active ? "#1e40af" : "transparent",
  color: "#e2e8f0",
  fontWeight: 700,
});

const toolBtn = (active) => ({
  textAlign: 'left',
  padding: '10px 12px',
  borderRadius: 10,
  border: active ? '1px solid #60a5fa' : '1px solid #334155',
  background: active ? '#1e40af' : 'transparent',
  color: '#e2e8f0',
  fontWeight: 700,
});


