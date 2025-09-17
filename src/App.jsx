import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { FiTrash2, FiArrowRight, FiArrowLeft, FiArchive, FiRefreshCw, FiTrendingUp, FiStar, FiUsers, FiGlobe } from "react-icons/fi";
import logo from "/CompressPDFLogo.webp";
import ReviewModal from "./components/ReviewModal";
import { useReviewPrompt } from "./hooks/useReviewPrompt";

/* =========================
   I18N MESSAGES
   ========================= */
const MESSAGES = {
  en: {
    title: "Compress PDF — Free, Fast, Secure (South Africa)",
    subtitle:
      "Reduce PDF size without losing readable quality. Files auto-delete after 15 minutes.",
    addFiles: "Add files",
    addMoreFiles: "Add more files",
    pdfLimit: ".pdf up to 50MB",
    clear: "Clear",
    continue: "Continue",
    back: "Back",
    compressionLevel: "Compression level",
    privacy: "Privacy",
    keepMeta: "Keep metadata",
    removeMeta: "Remove metadata (privacy)",
    compressPDF: "Compress PDF",
    compressMore: "Compress more",
    download: "Download",
    share: "Share",
    retry: "Retry",
    downloadZip: "Download all as ZIP",
    relatedMerge: "Merge PDF",
    relatedUnlock: "Unlock PDF",
    relatedWord: "PDF to Word",
    removeFile: "Remove file",
    estSmaller: "Est. {percent}% smaller → ~{size} MB",
    metaTitle: "Compress PDF — Free Online PDF Compressor (South Africa)",
    metaDesc:
      "Reduce PDF file size without losing readable quality. Fast, secure, and free. Files are auto-deleted after 15 minutes.",
  },
  af: {
    title: "Komprimeer PDF — Gratis, Vinnig, Veilig (Suid-Afrika)",
    subtitle:
      "Verminder PDF-grootte sonder om leeskwaliteit te verloor. Lêers word na 15 minute outomaties uitgevee.",
    addFiles: "Voeg lêers by",
    addMoreFiles: "Voeg meer lêers by",
    pdfLimit: ".pdf tot 50MB",
    clear: "Maak skoon",
    continue: "Gaan voort",
    back: "Terug",
    compressionLevel: "Kompressievlak",
    privacy: "Privaatheid",
    keepMeta: "Hou metadata",
    removeMeta: "Verwyder metadata (privaatheid)",
    compressPDF: "Komprimeer PDF",
    compressMore: "Komprimeer meer",
    download: "Laai af",
    share: "Deel",
    retry: "Probeer weer",
    downloadZip: "Laai alles as ZIP af",
    relatedMerge: "Voeg PDF saam",
    relatedUnlock: "Ontsluit PDF",
    relatedWord: "PDF na Word",
    removeFile: "Verwyder lêer",
    estSmaller: "Geskat {percent}% kleiner → ~{size} MB",
    metaTitle: "Komprimeer PDF — Gratis Aanlyn PDF-kompressor (Suid-Afrika)",
    metaDesc:
      "Verminder PDF-lêers sonder om leeskwaliteit te verloor. Vinnig, veilig en gratis. Lêers word na 15 minute uitgevee.",
  },
  zu: {
    title: "Nciphisa i‑PDF — Mahhala, Ngokushesha, Kuphephile (iNingizimu Afrika)",
    subtitle:
      "Nciphisa usayizi we‑PDF ngaphandle kokulahlekelwa ikhwalithi yokufundeka. Amafayela asuswa ngemuva kwemizuzu engu‑15.",
    addFiles: "Nezela amafayela",
    addMoreFiles: "Nezela amanye amafayela",
    pdfLimit: ".pdf kuze kube 50MB",
    clear: "Sula",
    continue: "Qhubeka",
    back: "Emuva",
    compressionLevel: "Izinga lokucindezela",
    privacy: "Ubumfihlo",
    keepMeta: "Gcina i‑metadata",
    removeMeta: "Susa i‑metadata (ubumfihlo)",
    compressPDF: "Nciphisa i‑PDF",
    compressMore: "Nciphisa amanye",
    download: "Landa",
    share: "Yabelana",
    retry: "Phinda uzame",
    downloadZip: "Landa konke njenge‑ZIP",
    relatedMerge: "Hlanganisa i‑PDF",
    relatedUnlock: "Vula i‑PDF",
    relatedWord: "I‑PDF kuya ku‑Word",
    removeFile: "Susa ifayela",
    estSmaller: "Cishe {percent}% sincane → ~{size} MB",
    metaTitle:
      "Nciphisa i‑PDF — Isinciphisi se‑PDF esiku-inthanethi (iNingizimu Afrika)",
    metaDesc:
      "Nciphisa usayizi lwefayela le‑PDF ngaphandle kokulahlekelwa ikhwalithi yokufundeka. Shesha, kuphephile, futhi kumahhala. Amafayela asuswa ngemva kwemizuzu engu‑15.",
  },
  xh: {
    title: "Cinezela i‑PDF — Simahla, Ngokukhawuleza, Khuselekile (eMzantsi Afrika)",
    subtitle:
      "Nciphisa ubungakanani be‑PDF ngaphandle kokulahlekelwa ngumgangatho wokufundeka. Iifayile zisuswa emva kwemizuzu eli‑15.",
    addFiles: "Yongeza iifayile",
    addMoreFiles: "Yongeza ezinye iifayile",
    pdfLimit: ".pdf ukuya kuthi ga kwi‑50MB",
    clear: "Sula",
    continue: "Qhubeka",
    back: "Emva",
    compressionLevel: "Inqanaba lokucinezela",
    privacy: "Ubumfihlo",
    keepMeta: "Gcina i‑metadata",
    removeMeta: "Susa i‑metadata (ubumfihlo)",
    compressPDF: "Cinezela i‑PDF",
    compressMore: "Cinezela ezingaphezulu",
    download: "Khuphela",
    share: "Yabelana",
    retry: "Zama kwakhona",
    downloadZip: "Khuphela zonke njenge‑ZIP",
    relatedMerge: "Dibanisa i‑PDF",
    relatedUnlock: "Vula i‑PDF",
    relatedWord: "I‑PDF ukuya kwi‑Word",
    removeFile: "Susa ifayile",
    estSmaller: "Malunga ne‑{percent}% encinci → ~{size} MB",
    metaTitle:
      "Cinezela i‑PDF — Isicinezeli se‑PDF esikwi‑intanethi (uMzantsi Afrika)",
    metaDesc:
      "Nciphisa ubungakanani be‑PDF ngaphandle kokulahlekelwa ngumgangatho wokufundeka. Kukhawuleza, kukhuselekile, simahla. Iifayile zisuswa emva kwemizuzu eli‑15.",
  },
};

/* =========================
   CONFIG
   ========================= */
const API_BASE = import.meta.env.VITE_API_BASE || "https://api.compresspdf.co.za";
const SUPPORTED = ["en", "af", "zu", "xh"];
const baseUrl = "https://compresspdf.co.za";

/* =========================
   STYLES
   ========================= */
const page = {
  minHeight: "100svh",
  width: "100%",
  background: "#0b1220",
  color: "#e2e8f0",
};
const container = {
  width: "min(1280px, 100%)",
  margin: "0 auto",
  padding: "16px",
  boxSizing: "border-box",
};
const card = {
  background: "#0f172a",
  border: "1px solid #1f2937",
  borderRadius: 18,
  boxShadow: "0 12px 28px rgba(0,0,0,.25)",
};
const sectionPad = { padding: 20 };
const h1 = { fontSize: 36, fontWeight: 900, margin: "0 0 6px" };
const subtle = { color: "#94a3b8" };

const bigBtnBase = {
  padding: "16px 28px",
  borderRadius: 14,
  fontSize: 18,
  fontWeight: 800,
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  border: "none",
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(0,0,0,.20)",
  transition: "all 0.2s ease",
};

// Mobile responsive styles
const mobileStyles = `
  @media (max-width: 768px) {
    .container-sm {
      padding: 12px !important;
    }
    
    .titleClamp {
      font-size: 28px !important;
    }
    
    .subtleClamp {
      font-size: 16px !important;
    }
    
    .stats-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    
    .stat-card {
      padding: 20px !important;
    }
    
    .stat-number {
      font-size: 2rem !important;
    }
  }
`;
const bigBtnRed = { ...bigBtnBase, background: "#ef4444", color: "#fff" };
const bigBtnBlue = { ...bigBtnBase, background: "#374151", color: "#fff" };
const bigBtnGreen = { ...bigBtnBase, background: "#16a34a", color: "#fff" };
const bigBtnIndigo = { ...bigBtnBase, background: "#4f46e5", color: "#fff" };

const primaryBtn = (enabled = true) => ({
  padding: "14px 24px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.06)",
  color: "#fff",
  background: enabled ? "linear-gradient(180deg,#2563eb,#1e40af)" : "#334155",
  boxShadow: enabled
    ? "inset 0 1px 0 rgba(255,255,255,.25), 0 10px 24px rgba(30,64,175,.45)"
    : "none",
  cursor: enabled ? "pointer" : "not-allowed",
  fontWeight: 800,
  fontSize: 16,
});
const ghostBtn = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #334155",
  background: "transparent",
  color: "#e2e8f0",
  fontWeight: 600,
};

// --- Animated number (no React. prefix) ---
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf, start;
    const from = display;
    const to = value;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      setDisplay(Math.round(from + (to - from) * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

// --- StatCompressedTotal (use API_BASE and hooks directly) ---
function StatCompressedTotal() {
  const [total, setTotal] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/v1/compress-pdf/stats`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad_response'))))
      .then((s) => {
        if (alive) setTotal(s.total_compressed || 0);
      })
      .catch(() => {
        if (alive) setTotal(0);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div
      style={{
        maxWidth: 800,
        margin: '16px auto 0',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.03)',
        border: '1px dashed rgba(255,255,255,0.12)',
        padding: '12px 16px',
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 4 }}>
        Total PDFs Compressed
      </div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>
        {total === null ? '—' : <AnimatedNumber value={total} />}
      </div>
    </div>
  );
}


/* =========================
   SMALL HELPERS
   ========================= */
function estimateSavings(bytes, level) {
  const mb = bytes / 1e6;
  const range =
    level === "high" ? [0.7, 0.85] : level === "low" ? [0.3, 0.5] : [0.6, 0.8];
  const mid = (range[0] + range[1]) / 2;
  const saved = mb * mid;
  return { percent: Math.round(mid * 100), projectedMb: Math.max(mb - saved, 0.01) };
}

// ---- JSON‑LD injector (adds/updates a <script type="application/ld+json">) ----
function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}


/* =========================
   HEADER
   ========================= */
function Header({ locale, changeLocale }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "saturate(120%) blur(6px)",
        background: "rgba(11, 18, 32, 0.85)",
        borderBottom: "1px solid #111827",
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <button 
            onClick={() => setShowStats(false)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              outline: "none"
            }}
            onFocus={(e) => e.target.style.outline = "none"}
          >
            <img src={logo} alt="Compress PDF Logo" style={{ height: 32, width: "auto" }} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => {
              console.log('Stats button clicked, scrolling to stats section');
              document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              color: "#e2e8f0",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.1)",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              border: "none",
              cursor: "pointer",
              outline: "none"
            }}
            onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
            onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
            onFocus={(e) => e.target.style.outline = "none"}
          >
            📊 Stats
          </button>
          
          <div className="langWrap">

            {/* Language Selector with Globe Icon */}
            <div style={{ position: "relative" }}>
              <select
                id="lang"
                value={locale}
                onChange={(e) => changeLocale(e.target.value)}
                style={{
                  padding: "8px 12px",
                  paddingLeft: "36px",
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "#0f172a",
                  color: "#e2e8f0",
                  fontWeight: "600",
                  cursor: "pointer",
                  appearance: "none",
                  minWidth: "80px"
                }}
                className="desktop-lang-selector"
              >
                <option value="en">EN</option>
                <option value="af">AF</option>
                <option value="zu">ZU</option>
                <option value="xh">XH</option>
              </select>
              
              {/* Globe Icon */}
              <div style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none"
              }}>
                <FiGlobe size={16} />
              </div>
              
              {/* Dropdown Arrow */}
              <div style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none"
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* =========================
   APP
   ========================= */
export default function App() {

  // use the named hooks you already import at the top

  /* 1) Router params */
  const { locale: routeLocale } = useParams();
  const navigate = useNavigate();
  const [showReview, setShowReview] = useState(false);
  const { shouldAsk, markAsked, markRated } = useReviewPrompt();

























  /* 2) Initial locale and state (single source of truth) */
  const initialLocale = SUPPORTED.includes(routeLocale || "")
    ? routeLocale
    : localStorage.getItem("locale") || "en";
  const [locale, setLocale] = useState(initialLocale);

  /* 3) Keep URL <-> state in sync */
  useEffect(() => {
    if (!routeLocale || !SUPPORTED.includes(routeLocale)) {
      navigate(`/${initialLocale}`, { replace: true });
      return;
    }
    if (routeLocale !== locale) setLocale(routeLocale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLocale]);

  useEffect(() => {
    localStorage.setItem("locale", locale);
    if (routeLocale !== locale) navigate(`/${locale}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  /* 4) SEO: <title> + meta description */
  useEffect(() => {
    const title = MESSAGES[locale]?.metaTitle || MESSAGES.en.metaTitle;
    const desc = MESSAGES[locale]?.metaDesc || MESSAGES.en.metaDesc;

    document.title = title;

    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, [locale]);


  /* 5) SEO: canonical + hreflang + social tags */
  useEffect(() => {
    // clear previous
    document
      .querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]')
      .forEach((n) => n.parentNode.removeChild(n));

    // canonical
    const canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", `${baseUrl}/${locale}`);
    document.head.appendChild(canonical);

    // hreflang
    SUPPORTED.forEach((lc) => {
      const alt = document.createElement("link");
      alt.setAttribute("rel", "alternate");
      alt.setAttribute("hreflang", lc);
      alt.setAttribute("href", `${baseUrl}/${lc}`);
      document.head.appendChild(alt);
    });

    // x-default
    const xdef = document.createElement("link");
    xdef.setAttribute("rel", "alternate");
    xdef.setAttribute("hreflang", "x-default");
    xdef.setAttribute("href", `${baseUrl}/en`);
    document.head.appendChild(xdef);

    // Social (OG/Twitter)
    const setMeta = (attr, key, val) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", val);
    };
    const title = MESSAGES[locale]?.metaTitle || MESSAGES.en.metaTitle;
    const desc = MESSAGES[locale]?.metaDesc || MESSAGES.en.metaDesc;
    const url = `${baseUrl}/${locale}`;
    const image = "/og-default.png"; // ensure this exists in /public

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", image);
  }, [locale]);

  /* 6) App state */
  const [step, setStep] = useState(1);
  // Reviews aggregate stats (live)
  const [reviewStats, setReviewStats] = useState({ count: 0, average: 5 });
  // Stats for compressed PDFs
  const [pdfStats, setPdfStats] = useState({ total_compressed: 0, updated_at: null });
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [compression, setCompression] = useState("medium");
  const [removeMeta, setRemoveMeta] = useState("false");
  const [forceReviewOpen, setForceReviewOpen] = useState(false); // turn off debug pop



  // ✅ Fetch stats and reviews once when app loads
  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch both stats and reviews in parallel
        const [statsRes, reviewsRes] = await Promise.all([
          fetch(`${API_BASE}/v1/compress-pdf/stats`),
          fetch(`${API_BASE}/v1/compress-pdf/reviews`)
        ]);
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setPdfStats({
            total_compressed: statsData.total_compressed || 0,
            updated_at: statsData.updated_at
          });
        }
        
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviewStats({
            count: reviewsData.reviewCount || 0,
            average: reviewsData.ratingValue || 5
          });
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    }
    
    // Initial fetch only - no more aggressive polling
    fetchStats();
    
    // Optional: Update stats every 5 minutes instead of every 2 seconds
    const interval = setInterval(fetchStats, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // ✅ now it's safe to use step/files
  useEffect(() => {
    if (step === 3 && files.some(f => f.status === "done" && f.result)) {
      if (shouldAsk()) {
        setShowReview(true);
        markAsked();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, files]);


  /* 7) i18n helpers */
  const t = (key, vars = {}) => {
    const raw = (MESSAGES[locale] && MESSAGES[locale][key]) || MESSAGES.en[key] || key;
    return raw.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  };
  const changeLocale = (val) => setLocale(val);

  /* 8) File helpers */
  const addFiles = (list) => {
    const arr = Array.from(list || []).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    const mapped = arr.map((f) => ({
      key: `${f.name}-${f.size}-${
        (crypto.randomUUID?.() || Math.random().toString(36)).slice(0, 6)
      }`,
      file: f,
      status: "idle",
      progress: 0,
      result: null,
      error: "",
    }));
    setFiles((prev) => [...prev, ...mapped]);
  };
  const onDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };
  const onPick = (e) => addFiles(e.target.files);

  const estimates = useMemo(
    () => files.map((f) => ({ key: f.key, ...estimateSavings(f.file.size, compression) })),
    [files, compression]
  );

  const uploadOne = (item) =>
    new Promise((resolve) => {
      const fd = new FormData();
      fd.append("file", item.file);
      fd.append("compression", compression);
      fd.append("downsample_dpi", "150");
      fd.append("remove_metadata", removeMeta);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/v1/pdf/compress`);
      xhr.timeout = 300000;

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const p = Math.round((ev.loaded / ev.total) * 100);
          setFiles((prev) =>
            prev.map((x) => (x.key === item.key ? { ...x, status: "uploading", progress: p } : x))
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            setFiles((prev) =>
              prev.map((x) => (x.key === item.key ? { ...x, status: "done", result: data } : x))
            );
          } catch {
            setFiles((prev) =>
              prev.map((x) =>
                x.key === item.key
                  ? { ...x, status: "error", error: "Unexpected server response." }
                  : x
              )
            );
          }
        } else {
          setFiles((prev) =>
            prev.map((x) =>
              x.key === item.key ? { ...x, status: "error", error: "Network error. Retry?" } : x
            )
          );
        }
        resolve();
      };

      xhr.ontimeout = xhr.onerror = () => {
        setFiles((prev) =>
          prev.map((x) =>
            x.key === item.key ? { ...x, status: "error", error: "Network timeout. Retry?" } : x
          )
        );
        resolve();
      };

      xhr.send(fd);
    });

  const startCompression = async () => {
    setStep(3);
    for (const item of files) {
      if (item.status === "idle" || item.status === "error") {
        // eslint-disable-next-line no-await-in-loop
        await uploadOne(item);
      }
    }
  };

  const retryOne = async (key) => {
    const found = files.find((f) => f.key === key);
    if (!found) return;
    setFiles((prev) =>
      prev.map((x) => (x.key === key ? { ...x, status: "idle", progress: 0, error: "" } : x))
    );
    await uploadOne({ ...found, status: "idle", progress: 0, error: "" });
  };

  const removeOne = (key) => {
    setFiles((prev) => prev.filter((f) => f.key !== key));
    if (files.length <= 1) setStep(1);
  };

  const shareWhatsapp = (url) => {
    const msg = encodeURIComponent(`Here is your compressed PDF: ${url}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  const clearAll = () => {
    setFiles([]);
    inputRef.current && (inputRef.current.value = "");
    setStep(1);
  };

  const tokenFromUrl = (url) => {
    try {
      return new URL(API_BASE + url).searchParams.get("token");
    } catch {
      return "";
    }
  };

  const downloadAllZip = async () => {
    const items = files
      .filter((f) => f.status === "done" && f.result?.output?.download_url && f.result?.job_id)
      .map((f) => ({
        job_id: f.result.job_id,
        token: tokenFromUrl(f.result.output.download_url),
      }));

    if (items.length < 1) return;

    const resp = await fetch(`${API_BASE}/v1/jobs/zip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!resp.ok) return;

    const data = await resp.json();
    const a = document.createElement("a");
    a.href = `${API_BASE}${data.download_url}`;
    a.download = "compressed_pdfs.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };



  return (
    <div style={page}>
      {/* Anim + responsive utilities */}
      <style>{`
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(96,165,250, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(96,165,250, 0); }
          100% { box-shadow: 0 0 0 0 rgba(96,165,250, 0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
            max-width: 300px;
            margin: 0 auto;
          }
        }
        
        @media (max-width: 1024px) and (min-width: 769px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            max-width: 600px;
            margin: 0 auto;
          }
        }
        
        /* Language selector styling */
        #lang {
          background-image: none !important;
        }
        
        #lang::-ms-expand {
          display: none;
        }
        *, *::before, *::after { box-sizing: border-box; }
        html, body { width:100%; margin:0; overflow-x:hidden; }
        .container-sm { padding: 12px; }
        .actionsRow { display:flex; gap:16px; flex-wrap:wrap; align-items:center; justify-content:center; }
        .fileTile { padding: 10px 12px; }
        .btnBig { display:inline-flex; align-items:center; gap:10px; }
        @media (max-width: 480px) {
          .container-sm { padding: 8px; }
          .actionsRow button { width: 100%; justify-content: center; }
          .dropZone { padding: 18px !important; }
          .fileName { 
            max-width: 100% !important; 
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
          }
          .btnBig { width:100%; justify-content:center; }
        }
        
        /* Mobile responsive button layouts */
        @media (max-width: 768px) {
          /* Make all step buttons stack on mobile */
          .step-buttons {
            flex-direction: column !important;
            width: 100% !important;
          }
          
          .step-buttons button {
            width: 100% !important;
          }
        }
        .titleClamp { font-size: clamp(22px, 6.2vw, 36px); line-height: 1.15; }
        .subtleClamp { font-size: clamp(13px, 3.6vw, 16px); }
        .dropZone { padding: 28px; }
        .langWrap { display:flex; align-items:center; gap:8px; }
        @media (max-width: 480px) {
          .langWrap label { display:none; }
          .langWrap select { padding:6px 10px; font-size:14px; }
        }
      `}</style>

      <Header locale={locale} changeLocale={changeLocale} />

      <div style={container} className="container-sm">
        {/* Intro */}
        <div style={{ marginTop: 60, marginBottom: 40, textAlign: "center" }}>
          <h1 style={h1} className="titleClamp">
            {t("title")}
          </h1>
          <div style={subtle} className="subtleClamp">
            {t("subtitle")}
          </div>
        </div>



        {/* Card */}
        <div style={card}>
          {/* Step 1 */}
          {step === 1 && (
            <div style={sectionPad}>
              <div
                className="dropZone"
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  border: "2px dashed #334155",
                  borderRadius: 16,
                  padding: 28,
                  background: "#0f172a",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button
                    onClick={() => inputRef.current?.click()}
                    style={{
                      border: "1px dashed #475569",
                      borderRadius: 14,
                      background: "transparent",
                      color: "#cbd5e1",
                      padding: 20,
                      minHeight: 140,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {/* simple icon */}
                    <svg viewBox="0 0 24 24" width={36} height={36} fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2 4 4h-4z" />
                    </svg>
                    <div style={{ fontWeight: 700, marginTop: 8 }}>
                      {files.length > 0 ? t("addMoreFiles") : t("addFiles")}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{t("pdfLimit")}</div>
                  </button>

                  {files.map((f, idx) => {
                    const est = estimates.find((e) => e.key === f.key);
                    return (
                      <div
                        key={f.key}
                        style={{
                          border: "1px solid #1f2937",
                          borderRadius: 8,
                          padding: "8px 12px",
                          background: "#0f172a",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <svg viewBox="0 0 24 24" width={36} height={36} fill="currentColor">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2 4 4h-4z" />
                            </svg>
                            <div
                              style={{
                                position: "absolute",
                                top: -6,
                                left: -6,
                                backgroundColor: "#02f0a1",
                                color: "#065f46",
                                border: "2px solid white",
                                borderRadius: "50%",
                                width: 20,
                                height: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: "bold",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              }}
                            >
                              {idx + 1}
                            </div>
                          </div>

                          <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                            <div
                              className="fileName"
                              title={f.file.name}
                              style={{
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                whiteSpace: "normal",
                                maxWidth: "100%",
                                fontSize: 14,
                                fontWeight: 600,
                                lineHeight: 1.3,
                              }}
                            >
                              {f.file.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>
                              {(f.file.size / 1e6).toFixed(2)} MB ·{" "}
                              {t("estSmaller", {
                                percent: est?.percent ?? 0,
                                size: (est?.projectedMb ?? 0).toFixed(2),
                              })}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeOne(f.key)}
                          aria-label={t("removeFile")}
                          style={{
                            border: "none",
                            backgroundColor: "#fecaca",
                            color: "#b91c1c",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            fontWeight: "bold",
                            lineHeight: 1,
                            cursor: "pointer",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  onChange={onPick}
                  style={{ display: "none" }}
                />
              </div>

              {/* Step 1 actions */}
              <div style={{ marginTop: 16 }}>
                <div className="step-buttons" style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  flexWrap: "wrap"
                }}>
                  <button onClick={clearAll} style={{
                    ...bigBtnRed,
                    justifyContent: "center"
                  }}>
                    {t("clear")} <FiTrash2 />
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={files.length === 0}
                    style={{
                      ...bigBtnBlue,
                      justifyContent: "center",
                      border: files.length > 0 ? "2px solid #60a5fa" : "1px solid #334155",
                      animation: files.length > 0 ? "pulseRing 1.6s ease-in-out infinite" : "none",
                      cursor: files.length > 0 ? "pointer" : "not-allowed",
                      background: files.length > 0 ? "#2563eb" : "#374151",
                    }}
                    title={t("continue")}
                    aria-label={t("continue")}
                  >
                    {t("continue")} <FiArrowRight />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={sectionPad}>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                }}
              >
                <label>
                  <div style={{ color: "#cbd5e1", marginBottom: 6, fontWeight: 600 }}>
                    {t("compressionLevel")}
                  </div>
                  <select
                    value={compression}
                    onChange={(e) => setCompression(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #334155",
                      background: "#0f172a",
                      color: "#e2e8f0",
                    }}
                  >
                    <option value="medium">Recommended (good quality)</option>
                    <option value="high">Smaller file (lower quality)</option>
                    <option value="low">Higher quality (bigger file)</option>
                  </select>
                </label>

                <label>
                  <div style={{ color: "#cbd5e1", marginBottom: 6, fontWeight: 600 }}>
                    {t("privacy")}
                  </div>
                  <select
                    value={removeMeta}
                    onChange={(e) => setRemoveMeta(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #334155",
                      background: "#0f172a",
                      color: "#e2e8f0",
                    }}
                  >
                    <option value="false">{t("keepMeta")}</option>
                    <option value="true">{t("removeMeta")}</option>
                  </select>
                </label>
              </div>

              <div
                className="step-buttons"
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  flexWrap: "wrap"
                }}
              >
                <button onClick={() => setStep(1)} style={{
                  ...ghostBtn,
                  justifyContent: "center",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }} className="btnBig">
                  <FiArrowLeft /> {t("back")}
                </button>
                <button onClick={startCompression} style={{
                  ...primaryBtn(true),
                  justifyContent: "center",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <FiRefreshCw /> {t("compressPDF")}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={sectionPad}>
              <div style={{ display: "grid", gap: 10 }}>
                {files.map((f) => (
                  <div
                    key={f.key}
                    style={{
                      background: "#0f172a",
                      border: "1px solid #1f2937",
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
                        <div
                          title={f.file.name}
                          style={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            whiteSpace: "normal",
                            maxWidth: "100%",
                            fontWeight: 700,
                            lineHeight: 1.3,
                          }}
                        >
                          {f.file.name}
                        </div>

                        {f.status === "uploading" && (
                          <div style={{ marginTop: 8 }}>
                            <div
                              style={{
                                width: "100%",
                                background: "#1f2937",
                                borderRadius: 6,
                                height: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: `${f.progress}%`,
                                  height: 8,
                                  borderRadius: 6,
                                  background: "#2563eb",
                                  transition: "width .2s",
                                }}
                              />
                            </div>
                            <div style={{ fontSize: 12, color: "#93c5fd", marginTop: 6 }}>
                              Uploading… {f.progress}%
                            </div>
                          </div>
                        )}

                        {f.status === "error" && (
                          <div style={{ fontSize: 13, color: "#fca5a5", marginTop: 6 }}>
                            {f.error}
                          </div>
                        )}

                        {f.status === "done" && f.result && (
                          <div style={{ fontSize: 14, color: "#cbd5e1", marginTop: 6 }}>
                            {(f.result.input.bytes / 1e6).toFixed(2)} MB →{" "}
                            {(f.result.output.bytes / 1e6).toFixed(2)} MB (
                            {Math.round(f.result.output.compression_ratio * 100)}% smaller)
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {f.status === "error" && (
                          <button onClick={() => retryOne(f.key)} style={ghostBtn}>
                            {t("retry")}
                          </button>
                        )}
                        {f.status === "done" && f.result && (
                          <>
                            <a
                              href={`${API_BASE}${f.result.output.download_url}`}
                              style={{ ...ghostBtn, display: "inline-flex", alignItems: "center", gap: 6 }}
                            >
                              {/* download icon */}
                              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                                <path d="M5 20h14v-2H5v2zm7-18-5 5h3v6h4V7h3l-5-5z" />
                              </svg>
                              {t("download")}
                            </a>
                            <button
                              onClick={() => shareWhatsapp(`${API_BASE}${f.result.output.download_url}`)}
                              style={{ ...ghostBtn, display: "inline-flex", alignItems: "center", gap: 6 }}
                              title="Share download link via WhatsApp"
                            >
                              {/* whatsapp icon */}
                              <svg viewBox="0 0 32 32" width={16} height={16} fill="currentColor">
                                <path d="M19.11 17.08c-.29-.14-1.69-.83-1.95-.92-.26-.1-.45-.14-.64.14-.19.29-.74.92-.91 1.1-.17.19-.34.21-.63.07-.29-.14-1.22-.45-2.32-1.45-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.12-.59.13-.13.29-.34.43-.52.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.56-.47-.48-.64-.48h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.43s1.02 2.82 1.16 3.02c.14.19 2.02 3.08 4.88 4.32.68.29 1.21.46 1.62.59.68.22 1.31.19 1.8.12.55-.08 1.69-.69 1.92-1.36.24-.67.24-1.25.17-1.36-.07-.12-.26-.19-.55-.33z"/>
                                <path d="M26.67 5.33A13.33 13.33 0 1 0 5.33 26.67L4 30.67l4.16-1.3A13.33 13.33 0 1 0 26.67 5.33zm-5.2 16.54c-.74.21-1.69.38-2.8.22-1.22-.18-2.81-.69-4.86-1.69-2.57-1.26-4.24-3.62-4.87-4.47-.64-.86-1.5-2.29-1.5-3.78s.93-2.7 1.26-3.07c.34-.38.74-.55 1-.55h1.45c.31 0 .48.02.69.53.26.64.83 2.06.91 2.21.07.14.12.31.02.5-.1.19-.14.31-.29.5-.14.17-.29.36-.43.52-.14.14-.19.31-.12.5.07.19.31.77.69 1.24.48.64 1.06 1.24 1.88 1.8.64.45 1.43.76 1.62.84.19.07.38.07.5-.07.14-.14.57-.66.72-.89.14-.24.31-.19.5-.12.19.07 1.21.57 1.41.67.19.1.31.14.36.22.05.07.05.4-.1.79-.14.38-.43.67-.6.88-.17.21-.36.29-.6.36z"/>
                              </svg>
                              {t("share")}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step 3 footer controls */}
              <div style={{ marginTop: 20 }}>
                <div className="step-buttons" style={{
                  display: "flex",
                  gap: "16px",
                  justifyContent: "center",
                  flexWrap: "wrap"
                }}>
                  <button onClick={() => setStep(1)} style={{
                    ...bigBtnGreen,
                    justifyContent: "center"
                  }}>
                    {t("compressMore")} <FiRefreshCw />
                  </button>
                  {files.some((f) => f.status === "done") && (
                    <button onClick={downloadAllZip} style={{
                      ...bigBtnIndigo,
                      justifyContent: "center"
                    }} className="btnBig">
                      {t("downloadZip")} <FiArchive />
                    </button>
                  )}
                  <button onClick={clearAll} style={{
                    ...bigBtnRed,
                    justifyContent: "center"
                  }} className="btnBig">
                    {t("clear")} <FiTrash2 />
                  </button>
                </div>
              </div>

              {/* 🔔 Review modal lives here */}
              <ReviewModal
                open={showReview}
                onClose={() => setShowReview(false)}
                onSubmit={(stars) => {
                  markRated(stars);
                  setShowReview(false);
                }}
              />
            </div>
          )}

        </div>

        {/* Privacy notice + FAQs (centered, max 800px) */}
        <section
          style={{
            maxWidth: 800,
            margin: "24px auto 32px",
            padding: "0 16px",
            textAlign: "center",
          }}
        >
          {/* Highlighted auto-delete notice */}
          <div
            style={{
              display: "inline-block",
              textAlign: "left",
              background: "#fef3c7",            // amber-100
              border: "1px solid #fbbf24",      // amber-400
              color: "#78350f",                  // amber-900
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            ⚠ Files are automatically deleted <span style={{textDecoration:"underline"}}>15 minutes</span> after upload for your privacy.
          </div>

          {/* Total Compressed PDFs count */}
          <div
            style={{
              display: "inline-block",
              textAlign: "center",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "24px 32px",
              borderRadius: 16,
              fontWeight: 700,
              marginTop: 20,
              boxShadow: "0 12px 35px rgba(0,0,0,0.2)",
              minWidth: "280px"
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📊</div>
            <div style={{ fontSize: "3.5rem", fontWeight: "900", marginBottom: "8px", lineHeight: 1 }}>
              {pdfStats.total_compressed?.toLocaleString() || "0"}
            </div>
            <div style={{ fontSize: "1.1rem", opacity: 0.9 }}>
              PDFs compressed so far
            </div>
          </div>



          {/* FAQ heading */}
          <h2 style={{ marginTop: 60, marginBottom: 12, fontSize: 30, fontWeight: 900 }}>
            Frequently Asked Questions
          </h2>

          {/* FAQ list (left-aligned inside the centered container) */}
          <div style={{ textAlign: "left", color: "#cbd5e1", lineHeight: 1.6 }}>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: "#e2e8f0", fontWeight: 800,  margin: "0 0 6px" }}>
                What is CompressPDF.co.za?
              </h3>
              <p>
                CompressPDF.co.za is a fast, free, and secure tool for reducing the size of PDF
                documents without noticeably affecting readability. Upload, compress, and download—no
                signup required.
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: "#e2e8f0", fontWeight: 800, margin: "0 0 6px" }}>
                How do I compress a PDF file?
              </h3>
              <p>
                Click <em>Add files</em> (or drag &amp; drop your PDF), choose your options, and hit
                <em> Compress PDF</em>. In a few seconds, you’ll get a download link to the optimized file.
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: "#e2e8f0", fontWeight: 800, margin: "0 0 6px" }}>
                Will the quality of my PDF be affected?
              </h3>
              <p>
                The compressor balances size and clarity. The default setting keeps documents readable
                while reducing file size significantly. If you need smaller files, choose a higher
                compression level (with some quality trade‑off). For best quality, pick a lower
                compression level.
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: "#e2e8f0", fontWeight: 800, margin: "0 0 6px" }}>
                Is it safe to upload my files?
              </h3>
              <p>
                Yes. Uploads are processed securely, and your files are not shared. For additional
                privacy, you can remove metadata during compression.
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: "#e2e8f0", fontWeight: 800, margin: "0 0 6px" }}>
                When are my files deleted?
              </h3>
              <p>
                All uploaded and processed files are automatically deleted from our servers
                <strong> 15 minutes</strong> after upload. If you share a link, the recipient should
                download the file within that time window.
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: "#e2e8f0", fontWeight: 800, margin: "0 0 6px" }}>
                What is the maximum file size?
              </h3>
              <p>
                The current upload limit is <strong>50&nbsp;MB</strong> per PDF. This keeps the service
                responsive for everyone. Larger limits may be introduced later.
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: "#e2e8f0", fontWeight: 800, margin: "0 0 6px" }}>
                Does it work on mobile?
              </h3>
              <p>
                Absolutely. The tool is optimized for phones, tablets, and desktops—no app installation
                needed.
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: "#e2e8f0", fontWeight: 800, margin: "0 0 6px" }}>
                Is the service free?
              </h3>
              <p>
                Yes, the core compression tool is free to use. We plan to add more PDF utilities over
                time while keeping the experience simple and fast.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats-section" style={{
          maxWidth: 800,
          margin: "40px auto 32px",
          padding: "0 16px",
          textAlign: "center",
        }}>
          <h2 style={{ marginBottom: 32, fontSize: 32, fontWeight: 900, color: "#e2e8f0" }}>
            📊 Live Statistics
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
            justifyContent: "center"
          }}
          className="stats-grid"
          >
            {/* Total Compressed PDFs */}
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "28px",
              borderRadius: "20px",
              textAlign: "center",
              boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
              transition: "transform 0.3s ease"
            }}
            onMouseEnter={(e) => e.target.style.transform = "translateY(-8px)"}
            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📊</div>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "1.3rem", opacity: 0.9 }}>
                Total Compressed
              </h3>
              <div style={{ fontSize: "3.5rem", fontWeight: "900", margin: "12px 0", lineHeight: 1 }}>
                {pdfStats.total_compressed?.toLocaleString() || "0"}
              </div>
              <p style={{ margin: "0", fontSize: "1rem", opacity: 0.8 }}>
                PDF files processed
              </p>
            </div>

            {/* Total Reviews */}
            <div style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              padding: "28px",
              borderRadius: "20px",
              textAlign: "center",
              boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
              transition: "transform 0.3s ease"
            }}
            onMouseEnter={(e) => e.target.style.transform = "translateY(-8px)"}
            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⭐</div>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "1.3rem", opacity: 0.9 }}>
                Total Reviews
              </h3>
              <div style={{ fontSize: "3.5rem", fontWeight: "900", margin: "12px 0", lineHeight: 1 }}>
                {reviewStats.count || "0"}
              </div>
              <p style={{ margin: "0", fontSize: "1rem", opacity: 0.8 }}>
                User ratings received
              </p>
            </div>

            {/* Average Rating */}
            <div style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              padding: "28px",
              borderRadius: "20px",
              textAlign: "center",
              boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
              transition: "transform 0.3s ease"
            }}
            onMouseEnter={(e) => e.target.style.transform = "translateY(-8px)"}
            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>👥</div>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "1.3rem", opacity: 0.9 }}>
                Average Rating
              </h3>
              <div style={{ fontSize: "2.5rem", fontWeight: "900", margin: "12px 0", lineHeight: 1, display: "flex", justifyContent: "center", gap: "4px" }}>
                {reviewStats.average ? 
                  Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{ 
                      color: i < reviewStats.average ? "#FFD700" : "#6b7280",
                      fontSize: "2.5rem"
                    }}>
                      ⭐
                    </span>
                  ))
                  : "N/A"
                }
              </div>
              <p style={{ margin: "0", fontSize: "1rem", opacity: 0.8 }}>
                Out of 5 stars
              </p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div style={{
            background: "#0f172a",
            border: "1px solid #1f2937",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            marginBottom: "24px"
          }}>
            <h3 style={{ color: "#e2e8f0", fontSize: "1.8rem", fontWeight: "800", margin: "0 0 24px 0" }}>
              📈 Performance Metrics
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                background: "#1e293b",
                borderRadius: "12px",
                border: "1px solid #334155"
              }}>
                <span style={{ color: "#cbd5e1", fontWeight: "600" }}>Success Rate</span>
                <span style={{ color: "#10b981", fontWeight: "700", fontSize: "1.1rem" }}>99.9%</span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                background: "#1e293b",
                borderRadius: "12px",
                border: "1px solid #334155"
              }}>
                <span style={{ color: "#cbd5e1", fontWeight: "600" }}>Processing Time</span>
                <span style={{ color: "#60a5fa", fontWeight: "700", fontSize: "1.1rem" }}>~3s</span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                background: "#1e293b",
                borderRadius: "12px",
                border: "1px solid #334155"
              }}>
                <span style={{ color: "#cbd5e1", fontWeight: "600" }}>Size Reduction</span>
                <span style={{ color: "#f59e0b", fontWeight: "700", fontSize: "1.1rem" }}>Up to 80%</span>
              </div>
            </div>
          </div>

          {/* Update Indicator */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#10b981",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600"
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              background: "white",
              borderRadius: "50%",
              animation: "pulse 2s infinite"
            }}></div>
            Stats updated every 5 minutes
          </div>

          {/* Last Updated */}
          {pdfStats.updated_at && (
            <div style={{ marginTop: "16px", color: "#94a3b8", fontSize: "0.9rem" }}>
              📅 Last updated: {new Date(pdfStats.updated_at).toLocaleDateString()}
            </div>
          )}
        </section>

        <ReviewModal
          open={forceReviewOpen}
          onClose={() => setForceReviewOpen(false)}
          onSubmit={(stars) => {
            console.log("DEBUG: submitted stars =", stars);
            setForceReviewOpen(false);
          }}
        />

        <div style={{ marginTop: 10, textAlign: "center", ...subtle }}>
          Powered By <a href="https://symaxx.com" rel="follow">Symaxx Digital.</a> © {new Date().getFullYear()} CompressPDF
        </div>
      </div>
    </div>
  );
}
