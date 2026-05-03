// Debug script: produce a sample watermarked PDF using the bundled CJK subset font.
// Validates that subset font + pdf-lib + fontkit pipeline works end-to-end in Node,
// independent of any browser/extension issue.
//
// Run:    node scripts/debug-cjk.mjs
// Output: /tmp/debug-cjk-output.pdf  (open in any PDF reader to visually inspect)

import { readFileSync, writeFileSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const fontPath = "src/assets/fonts/NotoSansSC-subset.ttf";
const fontBytes = readFileSync(fontPath);
console.log(`Font: ${fontPath} (${(fontBytes.length / 1024 / 1024).toFixed(2)} MB)`);

const pdfDoc = await PDFDocument.create();
pdfDoc.registerFontkit(fontkit);

const englishFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
const cjkFont = await pdfDoc.embedFont(fontBytes, { subset: true });

const page = pdfDoc.addPage([595, 842]);
page.drawText("Sample blank page for watermark testing", {
  x: 50,
  y: 800,
  size: 14,
  font: englishFont,
});

const TEXT = "示例公司";
const FONT_SIZE = 60;
const ALPHA = 0.3;
const ANGLE = 30;

const textWidth = cjkFont.widthOfTextAtSize(TEXT, FONT_SIZE);
const textHeight = cjkFont.heightAtSize(FONT_SIZE);
console.log(`Text "${TEXT}": width=${textWidth.toFixed(1)} height=${textHeight.toFixed(1)}`);

const positions = [
  [595 * 0.25, 842 * 0.25],
  [595 * 0.75, 842 * 0.25],
  [595 * 0.25, 842 * 0.75],
  [595 * 0.75, 842 * 0.75],
];

const angleRad = (ANGLE * Math.PI) / 180;
const cos = Math.cos(angleRad);
const sin = Math.sin(angleRad);
const halfW = textWidth / 2;
const halfH = textHeight / 4;

for (const [cx, cy] of positions) {
  const x = cx - halfW * cos + halfH * sin;
  const y = cy - halfW * sin - halfH * cos;
  page.drawText(TEXT, {
    x,
    y,
    size: FONT_SIZE,
    font: cjkFont,
    color: rgb(0.4, 0.4, 0.4),
    opacity: ALPHA,
    rotate: degrees(ANGLE),
  });
}

const bytes = await pdfDoc.save();
const outPath = "/tmp/debug-cjk-output.pdf";
writeFileSync(outPath, bytes);
console.log(`Wrote ${outPath} (${bytes.length} bytes)`);
console.log(`Open with: open ${outPath}`);
