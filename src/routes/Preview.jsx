import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/apiService.js';

export default function Preview() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.resolveSign(token);
        setData(res);
      } catch (e) {
        setError(e?.message || 'Failed to load');
      }
    })();
  }, [token]);

  if (error) return <div style={{ padding:16, color:'#ef4444' }}>{error}</div>;
  if (!data) return <div style={{ padding:16 }}>Loading…</div>;

  const fileUrl = `${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000'}/api/documents/${data?.document?.id}/file`;

  return (
    <div style={{ position:'relative', padding: 16 }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', display:'grid', placeItems:'center', opacity:0.12, fontSize:64, fontWeight:900, transform:'rotate(-20deg)' }}>VIEW ONLY</div>
      <iframe title="preview" src={fileUrl} style={{ width:'100%', height:'90vh', border:'1px solid #1f2937', borderRadius:8, background:'#0f172a' }} />
    </div>
  );
}


