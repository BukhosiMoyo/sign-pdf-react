import { useEffect, useState } from 'react';
import api from '../services/apiService.js';

export default function OwnerDashboard() {
  const [ownerId, setOwnerId] = useState(localStorage.getItem('ownerId') || '');
  const [docs, setDocs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => { if (ownerId) { localStorage.setItem('ownerId', ownerId); refresh(); } }, [ownerId]);

  const refresh = async () => {
    const r = await api.listOwnerDocuments(ownerId);
    setDocs(r.documents || []);
  };

  const openDoc = async (d) => {
    setSelected(d);
    const ev = await api.getEvents(d.id);
    setEvents(ev.events || []);
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ margin:0 }}>Owner Dashboard</h1>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:12 }}>
        <input placeholder="Owner ID (uuid)" value={ownerId} onChange={(e)=>setOwnerId(e.target.value)} style={input} />
        <button onClick={refresh} style={primary}>Load</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
        <div>
          <div style={{ fontWeight:900, marginBottom:8 }}>Documents</div>
          <div style={{ display:'grid', gap:8 }}>
            {docs.map(d => (
              <div key={d.id} style={card}>
                <div style={{ fontWeight:700 }}>{d.title || 'Untitled'}</div>
                <div style={{ color:'#94a3b8' }}>{d.status}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>openDoc(d)} style={ghost}>Open</button>
                  <button onClick={async()=>{ const r = await api.createPreviewLink(d.id); await navigator.clipboard.writeText(r.url); }} style={ghost}>Preview link</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {selected && (
          <div>
            <div style={{ fontWeight:900, marginBottom:8 }}>Signers</div>
            <div style={{ display:'grid', gap:8 }}>
              {(selected.signers||[]).map(s => (
                <div key={s.id} style={card}>
                  <div style={{ fontWeight:700 }}>{s.name} &lt;{s.email}&gt;</div>
                  <div style={{ color:'#94a3b8' }}>Status: {s.status}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={async()=>{ await api.revokeSigner(s.id); await openDoc(selected); }} style={ghost}>Revoke</button>
                    <button onClick={async()=>{ const r=await api.regenerateSigner(s.id); await openDoc(selected); navigator.clipboard.writeText(r.link); }} style={ghost}>Regenerate & Copy</button>
                    <button onClick={async()=>{ await api.extendSigner(s.id, 30); await openDoc(selected); }} style={ghost}>Extend 30d</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontWeight:900, margin:'16px 0 8px' }}>Events</div>
            <ol style={{ paddingLeft:18 }}>
              {events.map((e,i)=>(<li key={i} style={{ marginBottom:4 }}>{new Date(e.created_at).toLocaleString()} — {e.type}</li>))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

const input = { padding:10, borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' };
const primary = { padding:'10px 12px', borderRadius:10, border:'1px solid rgba(255,255,255,.06)', background:'linear-gradient(180deg,#2563eb,#1e40af)', color:'#fff', fontWeight:800 };
const ghost = { padding:'8px 10px', borderRadius:10, border:'1px solid #334155', background:'transparent', color:'#e2e8f0' };
const card = { border:'1px solid #1f2937', borderRadius:10, padding:12, background:'#0b1320', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 };


