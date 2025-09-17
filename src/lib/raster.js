export async function textToPng({
  text,
  fontFamily = 'Inter',
  fontWeight = 400,
  sizePt = 24,
  color = '#111827',
  padding = 0,
  scale = 2,
}) {
  const pxPerPt = 96 / 72; // ~1.333
  const fontSizePx = sizePt * pxPerPt;

  // measure using a temp canvas
  const measure = document.createElement('canvas');
  const mctx = measure.getContext('2d');
  mctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}, cursive`;
  const metrics = mctx.measureText(text || '');
  const widthPx = Math.max(1, Math.ceil(metrics.width));
  const ascent = Math.ceil(Math.abs(metrics.actualBoundingBoxAscent || fontSizePx * 0.8));
  const descent = Math.ceil(Math.abs(metrics.actualBoundingBoxDescent || fontSizePx * 0.2));
  const heightPx = ascent + descent;

  const w = (widthPx + padding * 2) * scale;
  const h = (heightPx + padding * 2) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.scale(scale, scale);
  ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}, cursive`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  // Draw so that the text sits tightly inside padding with correct baseline
  ctx.fillText(text || '', padding, padding + ascent);

  const dataUrl = canvas.toDataURL('image/png');
  return { dataUrl, naturalWidth: (w / scale), naturalHeight: (h / scale) };
}
