import { useState } from 'react';
import api from '../services/apiService.js';
import API_CONFIG from '../config/api.js';

export default function SendModal({ open, onClose, fieldsSnapshot, pdfBytes, defaultTitle = 'Untitled' }) {
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [title, setTitle] = useState(defaultTitle);
  const [routingMode, setRoutingMode] = useState('parallel');
  const [signers, setSigners] = useState([{ name: '', email: '' }]);
  const [links, setLinks] = useState([]);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const addSigner = () => setSigners(prev => prev.concat({ name: '', email: '' }));
  const updateSigner = (i, k, v) => setSigners(prev => prev.map((s, idx) => idx===i ? { ...s, [k]: v } : s));
  const removeSigner = (i) => setSigners(prev => prev.filter((_, idx) => idx !== i));

  const startSend = async () => {
    if (!pdfBytes) return;
    try {
      setBusy(true);
      const placeholderEmail = `owner-${Date.now()}@example.invalid`;
      const u = await api.upsertUser({ email: (ownerEmail||'').trim() || placeholderEmail, name: (ownerName||'').trim() || 'Owner' });
      const pdfBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(pdfBytes)));
      const doc = await api.createDocument({ ownerId: u.id, title, pdfBase64, routingMode });
      if (fieldsSnapshot && fieldsSnapshot.length > 0) {
        await api.setFields(doc.id, fieldsSnapshot);
      }
      const payload = signers
        .map((s, idx) => ({ roleIndex: idx, name: s.name.trim(), email: s.email.trim() }))
        .filter(s => s.name && s.email);
      const res = await api.setSigners(doc.id, payload);
      setLinks(res.signers || []);
    } catch (e) {
      alert('Failed to send: ' + (e?.message || 'unknown error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" style={backdrop}>
      <div style={modal}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontWeight:900 }}>Send for signing</div>
          <button onClick={onClose} style={ghost}>Close</button>
        </div>

        <div style={{ display:'grid', gap:12 }}>
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
            <label style={label}>Signing order</label>
            <div style={{ display:'flex', gap:12 }}>
              <label style={{ color:'#cbd5e1' }}>
                <input type="radio" name="routing2" value="parallel" checked={routingMode==='parallel'} onChange={()=>setRoutingMode('parallel')} /> Parallel
              </label>
              <label style={{ color:'#cbd5e1' }}>
                <input type="radio" name="routing2" value="sequential" checked={routingMode==='sequential'} onChange={()=>setRoutingMode('sequential')} /> Sequential
              </label>
            </div>
          </div>
          <div>
            <label style={label}>Recipients</label>
            <div style={{ display:'grid', gap:8 }}>
              {signers.map((s, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8 }}>
                  <input placeholder="Name" value={s.name} onChange={(e)=>updateSigner(i,'name',e.target.value)} style={input} />
                  <input placeholder="Email" value={s.email} onChange={(e)=>updateSigner(i,'email',e.target.value)} style={input} />
                  <button onClick={()=>removeSigner(i)} style={ghost}>Remove</button>
                </div>
              ))}
              <button onClick={addSigner} style={ghost}>Add recipient</button>
            </div>
          </div>
          <button onClick={startSend} disabled={busy || !pdfBytes} style={{ ...primary, opacity: (!pdfBytes||busy)?0.6:1 }}>{busy ? 'Sending…' : 'Create and generate links'}</button>

          {links.length > 0 && (
            <div>
              <div style={{ fontWeight:900, margin:'8px 0' }}>Signing links</div>
              <ol style={{ paddingLeft:18 }}>
                {links.map(s => (
                  <li key={s.id} style={{ marginBottom:8 }}>
                    <div style={{ fontWeight:700 }}>{s.name} &lt;{s.email}&gt;</div>
                    <div style={{ wordBreak:'break-all' }}>
                      <a href={s.link} target="_blank" rel="noreferrer">{s.link}</a>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const backdrop = { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 };
const modal = { width: 'min(800px, 96vw)', maxHeight:'90vh', overflow:'auto', background:'#0f172a', border:'1px solid #1f2937', borderRadius:14, padding:16, color:'#e2e8f0' };
const label = { display:'block', color:'#94a3b8', marginBottom:6 };
const input = { padding:10, borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' };
const ghost = { padding:'10px 12px', borderRadius:10, border:'1px solid #334155', background:'transparent', color:'#e2e8f0', fontWeight:600 };
const primary = { padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,.06)', color:'#fff', background:'linear-gradient(180deg,#2563eb,#1e40af)', fontWeight:800 };


