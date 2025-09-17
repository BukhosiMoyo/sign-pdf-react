import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/apiService.js';

export default function SendFlow() {
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState('owner@example.com');
  const [ownerName, setOwnerName] = useState('Owner');
  const [title, setTitle] = useState('Untitled');
  const [signers, setSigners] = useState([{ name: '', email: '' }]);
  const [routingMode, setRoutingMode] = useState('parallel');
  const [links, setLinks] = useState([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const f = location.state && location.state.file;
    if (f) setFile(f);
  }, [location.state]);

  const addSigner = () => setSigners(prev => prev.concat({ name: '', email: '' }));
  const updateSigner = (i, field, val) => setSigners(prev => prev.map((s, idx) => idx===i ? { ...s, [field]: val } : s));
  const removeSigner = (i) => setSigners(prev => prev.filter((_, idx) => idx !== i));

  const startSend = async () => {
    if (!file) return;
    try {
      setBusy(true);
      // Frictionless: if owner details are empty, create a placeholder owner
      const placeholderEmail = `anon-${Date.now()}@example.invalid`;
      const u = await api.upsertUser({ email: (ownerEmail||'').trim() || placeholderEmail, name: (ownerName||'').trim() || 'Anonymous' });
      const bytes = await file.arrayBuffer();
      const pdfBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));
      const doc = await api.createDocument({ ownerId: u.id, title, pdfBase64, routingMode });
      const payload = signers
        .map((s, idx) => ({ roleIndex: idx, name: s.name.trim(), email: s.email.trim() }))
        .filter(s => s.name && s.email);
      const res = await api.setSigners(doc.id, payload);
      setLinks(res.signers || []);
    } catch (e) {
      console.error(e);
      alert('Failed to send: ' + (e?.message || 'unknown error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ margin: 0 }}>Send for signing</h1>
      <p style={{ color: '#94a3b8' }}>Create a document, add signers, and share links.</p>

      <div style={{ display:'grid', gap: 12, marginTop: 16 }}>
        <div>
          <label style={label}>Signing order</label>
          <div style={{ display:'flex', gap:12 }}>
            <label style={{ color:'#cbd5e1' }}>
              <input type="radio" name="routing" value="parallel" checked={routingMode==='parallel'} onChange={()=>setRoutingMode('parallel')} /> Parallel (any order)
            </label>
            <label style={{ color:'#cbd5e1' }}>
              <input type="radio" name="routing" value="sequential" checked={routingMode==='sequential'} onChange={()=>setRoutingMode('sequential')} /> Sequential (in order)
            </label>
          </div>
        </div>
        <div>
          <label style={label}>Your email</label>
          <input value={ownerEmail} onChange={(e)=>setOwnerEmail(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Your name</label>
          <input value={ownerName} onChange={(e)=>setOwnerName(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Document title</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>PDF</label>
          <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
            <button onClick={()=>inputRef.current?.click()} style={btn}>Choose file</button>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={(e)=>setFile(e.target.files?.[0]||null)} style={{ display:'none' }} />
            <span style={{ color:'#cbd5e1' }}>{file ? file.name : 'No file selected'}</span>
          </div>
        </div>
        <div>
          <label style={label}>Signers</label>
          <div style={{ display:'grid', gap: 8 }}>
            {signers.map((s, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap: 8 }}>
                <input placeholder="Name" value={s.name} onChange={(e)=>updateSigner(i,'name',e.target.value)} style={input} />
                <input placeholder="Email" value={s.email} onChange={(e)=>updateSigner(i,'email',e.target.value)} style={input} />
                <button onClick={()=>removeSigner(i)} style={ghost}>Remove</button>
              </div>
            ))}
            <button onClick={addSigner} style={ghost}>Add signer</button>
          </div>
        </div>
        <div>
          <button onClick={startSend} disabled={busy || !file} style={{ ...primary, opacity: (!file||busy)?0.6:1 }}>{busy ? 'Sending…' : 'Create and generate links'}</button>
        </div>
      </div>

      {links.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: '12px 0' }}>Signing links</h3>
          <ol style={{ paddingLeft: 18 }}>
            {links.map(s => (
              <li key={s.id} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{s.name} &lt;{s.email}&gt;</div>
                <div style={{ wordBreak:'break-all' }}>
                  <a href={s.link} target="_blank" rel="noreferrer">{s.link}</a>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

const label = { display:'block', color:'#94a3b8', marginBottom: 6 };
const input = { padding: 10, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' };
const btn = { padding:'10px 12px', borderRadius: 10, border:'1px solid #334155', background:'transparent', color:'#e2e8f0', fontWeight:600 };
const ghost = btn;
const primary = { padding:'12px 16px', borderRadius: 12, border:'1px solid rgba(255,255,255,.06)', color:'#fff', background:'linear-gradient(180deg,#2563eb,#1e40af)', fontWeight:800 };


