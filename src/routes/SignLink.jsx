import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/apiService.js';

export default function SignLink() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextName, setNextName] = useState('');
  const [nextEmail, setNextEmail] = useState('');
  const [shareText, setShareText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.resolveSign(token);
        setData(res);
      } catch (e) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (error) return <div style={{ padding: 16, color: '#ef4444' }}>{error}</div>;

  const fileUrl = `${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'}/api/documents/${data?.document?.id}/file`;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ margin: 0 }}>{data?.document?.title || 'Document'}</h1>
      <div style={{ color:'#94a3b8', marginBottom: 12 }}>Please review and sign the document.</div>
      <div style={{ height: '80vh' }}>
        <iframe title="pdf" src={fileUrl} style={{ width: '100%', height: '100%', border: '1px solid #1f2937', borderRadius: 8, background: '#0f172a' }} />
      </div>

      <div style={{ marginTop: 16, display:'flex', gap:8 }}>
        <button onClick={async ()=>{
          try {
            setBusy(true);
            await fetch(`${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'}/api/sign/${token}/finish`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) });
            if (nextName && nextEmail) {
              const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'}/api/sign/${token}/append-next`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: nextName, email: nextEmail }) });
              const json = await res.json();
              const msg = `Hi ${nextName},\n\n${data?.document?.title || 'A document'} is ready for your signature. Open this link to sign:\n${json.link}\n\nSent via Sign PDF.`;
              setShareText(msg);
            } else {
              setShareText('Signed. Enter the next signer name and email to generate a share message.');
            }
          } finally {
            setBusy(false);
          }
        }} style={{ padding:'10px 12px', borderRadius:10, border:'1px solid #334155', background:'linear-gradient(180deg,#16a34a,#15803d)', color:'#fff', fontWeight:800 }} disabled={busy}>{busy ? 'Finishing…' : 'Finish'}</button>

        <input placeholder="Next signer name" value={nextName} onChange={(e)=>setNextName(e.target.value)} style={{ padding:10, borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' }} />
        <input placeholder="Next signer email" value={nextEmail} onChange={(e)=>setNextEmail(e.target.value)} style={{ padding:10, borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' }} />
      </div>

      {shareText && (
        <div style={{ marginTop: 12 }}>
          <label style={{ color:'#94a3b8', display:'block', marginBottom:6 }}>Copy this message and send:</label>
          <textarea readOnly value={shareText} style={{ width:'100%', minHeight: 120, padding:12, borderRadius:10, border:'1px solid #334155', background:'#0b1320', color:'#e2e8f0' }} />
        </div>
      )}
    </div>
  );
}


