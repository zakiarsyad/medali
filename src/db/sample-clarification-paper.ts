/*
 * The paper every sample clarification gets as its file: one drawn page
 * that says "SURAT KETERANGAN" and "Lampiran contoh", with grey bars
 * where a letter has its lines. It names nobody. It is a small PDF,
 * written out here so the sample data needs no file and no library.
 */

/** What a decided or waiting sample clarification says its file is called. */
export const SAMPLE_PAPER_NAME = "surat-keterangan.pdf";

const BAR_TOPS = [410, 380, 350, 320, 290, 260, 230];

/** One grey bar; every second one is shorter, as the lines of a letter are. */
function bar(top: number, place: number): string {
  const width = place % 2 === 0 ? 320 : 260;
  return `50 ${top} ${width} 10 re f`;
}

const DRAWING = [
  "BT /F1 22 Tf 0.2 0.2 0.27 rg 1 0 0 1 96 490 Tm (SURAT KETERANGAN) Tj ET",
  "BT /F1 14 Tf 0.53 0.53 0.6 rg 1 0 0 1 160 460 Tm (Lampiran contoh) Tj ET",
  "0.87 0.87 0.93 rg",
  ...BAR_TOPS.map(bar),
  "BT /F1 13 Tf 0.53 0.53 0.6 rg 1 0 0 1 290 100 Tm (Tanda tangan) Tj ET",
].join("\n");

const OBJECTS = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 560] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  `<< /Length ${DRAWING.length} >>\nstream\n${DRAWING}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];

/**
 * The document as text. A PDF ends with a table that says at which
 * letter each of its parts starts, so the parts are counted while they
 * are put together. Every letter here is one byte.
 */
function paperText(): string {
  let text = "%PDF-1.4\n";
  const starts: number[] = [];
  for (const [place, object] of OBJECTS.entries()) {
    starts.push(text.length);
    text += `${place + 1} 0 obj\n${object}\nendobj\n`;
  }
  const tableStart = text.length;
  text += `xref\n0 ${OBJECTS.length + 1}\n0000000000 65535 f \n`;
  for (const start of starts) {
    text += `${String(start).padStart(10, "0")} 00000 n \n`;
  }
  text += `trailer\n<< /Size ${OBJECTS.length + 1} /Root 1 0 R >>\n`;
  text += `startxref\n${tableStart}\n%%EOF\n`;
  return text;
}

/** The bytes of the drawn paper, as a PDF. */
export function samplePaperBytes(): Uint8Array {
  return new TextEncoder().encode(paperText());
}
