import { useEffect, useState } from 'react';
import api from '../services/apiService.js';

export default function AdminPanel() {
  const [settings, setSettings] = useState(null);
  const [key, setKey] = useState(localStorage.getItem('adminKey')||'');
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async()=>{ const s = await api.getSettings(); setSettings(s); })(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      localStorage.setItem('adminKey', key);
      const r = await fetch(`${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-admin-key': key },
        body: JSON.stringify({
          emailEnabled: !!settings?.email_enabled,
          webhookUrl: settings?.webhook_url || '',
          allowMultiSign: !!settings?.allow_multi_sign,
          enableGuides: !!settings?.enable_guides,
          enableDuplicateAll: !!settings?.enable_duplicate_all,
          enablePreviewLinks: !!settings?.enable_preview_links,
        })
      });
      const j = await r.json();
      setSettings(j);
    } finally { setSaving(false); }
  };

  if (!settings) return <div style={{ padding:16 }}>Loading…</div>;

  return (
    <div style={{ padding:16, maxWidth:800, margin:'0 auto' }}>
      <h1 style={{ margin:0 }}>Admin Panel</h1>
      <div style={{ marginTop:12 }}>
        <label style={label}>Admin API Key</label>
        <input value={key} onChange={(e)=>setKey(e.target.value)} style={input} placeholder="Set ADMIN_API_KEY in backend .env" />
      </div>
      <div style={{ display:'grid', gap:10, marginTop:12 }}>
        <label style={row}><input type="checkbox" checked={!!settings.email_enabled} onChange={(e)=>setSettings({ ...settings, email_enabled: e.target.checked })} /> Email enabled</label>
        <label style={row}><input type="checkbox" checked={!!settings.allow_multi_sign} onChange={(e)=>setSettings({ ...settings, allow_multi_sign: e.target.checked })} /> Allow multi-sign</label>
        <label style={row}><input type="checkbox" checked={!!settings.enable_guides} onChange={(e)=>setSettings({ ...settings, enable_guides: e.target.checked })} /> Enable alignment guides</label>
        <label style={row}><input type="checkbox" checked={!!settings.enable_duplicate_all} onChange={(e)=>setSettings({ ...settings, enable_duplicate_all: e.target.checked })} /> Enable Duplicate All</label>
        <label style={row}><input type="checkbox" checked={!!settings.enable_preview_links} onChange={(e)=>setSettings({ ...settings, enable_preview_links: e.target.checked })} /> Enable preview links</label>
        <div>
          <label style={label}>Webhook URL</label>
          <input value={settings.webhook_url || ''} onChange={(e)=>setSettings({ ...settings, webhook_url: e.target.value })} style={input} placeholder="https://example.com/webhook" />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={save} disabled={saving} style={primary}>{saving ? 'Saving…' : 'Save settings'}</button>
          <button onClick={async()=>{
            const r = await fetch(`${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'}/api/settings/test-webhook`, { method:'POST', headers:{ 'x-admin-key': key } });
            const j = await r.json();
            alert(j?.ok ? 'Webhook sent' : 'Failed');
          }} style={primary}>Test webhook</button>
        </div>
      </div>
    </div>
  );
}

const label = { display:'block', color:'#94a3b8', marginBottom:6 };
const input = { padding:10, borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0', width:'100%' };
const row = { display:'flex', alignItems:'center', gap:8, color:'#e2e8f0' };
const primary = { padding:'10px 12px', borderRadius:10, border:'1px solid rgba(255,255,255,.06)', background:'linear-gradient(180deg,#2563eb,#1e40af)', color:'#fff', fontWeight:800 };


