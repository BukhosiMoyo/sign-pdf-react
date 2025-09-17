import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'fs';

const PAGES = Number(process.env.PAGES || 150);
const A4 = [595, 842];

async function run(){
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i=1;i<=PAGES;i++){
    const p = pdf.addPage(A4);
    p.drawText(`Performance Test – Page ${i}/${PAGES}`, { x: 50, y: 800, size: 14, font });
  }
  const bytes = await pdf.save();
  fs.writeFileSync('big-test.pdf', bytes);
  console.log('Generated big-test.pdf with', PAGES, 'pages');
}
run();


