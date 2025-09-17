import { useState } from 'react';
import api from '../services/apiService.js';

export default function LoginModal({ open, onClose, onLoggedIn }){
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const save = async () => {
    if (!email) return;
    setBusy(true);
    try {
      const u = await api.upsertUser({ email, name });
      const owner = { id: u.id, email: u.email, name: u.name };
      localStorage.setItem('owner', JSON.stringify(owner));
      onLoggedIn && onLoggedIn(owner);
      onClose && onClose();
    } finally { setBusy(false); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Login" style={backdrop}>
      <div style={modal}>
        <div style={{ fontWeight:900, marginBottom:12 }}>Sign in to send for signing</div>
        <div style={{ display:'grid', gap:10 }}>
          <label style={label}>Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" style={input} />
          <label style={label}>Your name (optional)</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" style={input} />
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={ghost}>Cancel</button>
            <button onClick={save} disabled={busy || !email} style={{ ...primary, opacity: (!email||busy)?0.6:1 }}>{busy ? 'Saving…' : 'Continue'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const backdrop = { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 };
const modal = { width: 'min(520px, 96vw)', background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:16, color:'var(--text)' };
const label = { color:'var(--muted)', fontSize:12 };
const input = { padding:10, borderRadius:10, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)' };
const ghost = { padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', fontWeight:600 };
const primary = { padding:'10px 12px', borderRadius:10, border:'1px solid rgba(255,255,255,.06)', background:'linear-gradient(180deg,var(--brand-primary),#1e40af)', color:'#fff', fontWeight:800 };



