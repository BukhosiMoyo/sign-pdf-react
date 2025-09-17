// Map font keys to remote TTF URLs (GitHub google/fonts raw)
// Includes a simple cache so export reuses fetched bytes.

export const FONT_MANIFEST = [
  { key: 'dancing',  name: 'Dancing Script',   url: 'https://github.com/google/fonts/raw/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf' },
  { key: 'pacifico', name: 'Pacifico',         url: 'https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf' },
  { key: 'greatv',   name: 'Great Vibes',      url: 'https://github.com/google/fonts/raw/main/ofl/greatvibes/GreatVibes-Regular.ttf' },
  { key: 'kalam',    name: 'Kalam',            url: 'https://github.com/google/fonts/raw/main/ofl/kalam/Kalam-Regular.ttf' },
  { key: 'courget',  name: 'Courgette',        url: 'https://github.com/google/fonts/raw/main/ofl/courgette/Courgette-Regular.ttf' },
  { key: 'satisfy',  name: 'Satisfy',          url: 'https://github.com/google/fonts/raw/main/ofl/satisfy/Satisfy-Regular.ttf' },
  { key: 'hmapple',  name: 'Homemade Apple',   url: 'https://github.com/google/fonts/raw/main/ofl/homemadeapple/HomemadeApple-Regular.ttf' },
  { key: 'caveat',   name: 'Caveat',           url: 'https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf' },
];

// CSS mapping for on-screen preview (generic cursive fallback)
export const HANDWRITING_FONTS = Object.fromEntries(
  FONT_MANIFEST.map(f => [f.key, { label: f.name, css: `'${f.name}', cursive` }])
);

const _cache = new Map();

export function listFonts() {
  return FONT_MANIFEST.map(f => ({ key: f.key, displayName: f.name }));
}

export async function fetchFontBytes(fontKey) {
  if (_cache.has(fontKey)) return _cache.get(fontKey);
  const f = FONT_MANIFEST.find(x => x.key === fontKey);
  if (!f) throw new Error(`Unknown fontKey: ${fontKey}`);
  const res = await fetch(f.url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Failed to load font: ${fontKey}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  _cache.set(fontKey, bytes);
  return bytes;
}
