// Reproduces what popup.ts does: load a PDF, apply watermark with CJK font,
// save output. Then renders page 1 to PNG via pdftoppm for visual inspection.
//
// Run: node scripts/test-flow.mjs <input.pdf> <watermark text>
// Default: /tmp/debug-cjk-output.pdf "网络"

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const inputPath = process.argv[2] || "/tmp/debug-cjk-output.pdf";
const text = process.argv[3] || "网络";
const outputPath = "/tmp/test-flow-output.pdf";
const pngPrefix = "/tmp/test-flow-page";

const CJK_REGEX = /[　-〿一-鿿＀-￯]/;
const hasCJK = (t) => CJK_REGEX.test(t);

const FONT_SIZE = 60;
const ALPHA = 0.3;
const ANGLE = 30;

// === Mirror src/lib/watermark.ts logic exactly ===
async function applyWatermark(pdfBytes, { text, cjkFontBytes }) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  let font;
  if (hasCJK(text)) {
    pdfDoc.registerFontkit(fontkit);
    font = await pdfDoc.embedFont(cjkFontBytes, { subset: false });
  } else {
    font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  }

  const textWidth = font.widthOfTextAtSize(text, FONT_SIZE);
  const textHeight = font.heightAtSize(FONT_SIZE);
  console.log(`textWidth=${textWidth.toFixed(1)} textHeight=${textHeight.toFixed(1)}`);

  const angleRad = (ANGLE * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const halfW = textWidth / 2;
  const halfH = textHeight / 4;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const positions = [
      [width * 0.25, height * 0.25],
      [width * 0.75, height * 0.25],
      [width * 0.25, height * 0.75],
      [width * 0.75, height * 0.75],
    ];
    for (const [cx, cy] of positions) {
      const x = cx - halfW * cos + halfH * sin;
      const y = cy - halfW * sin - halfH * cos;
      console.log(`  [${cx.toFixed(0)},${cy.toFixed(0)}] -> drawText(${x.toFixed(1)}, ${y.toFixed(1)})`);
      page.drawText(text, {
        x,
        y,
        size: FONT_SIZE,
        font,
        color: rgb(0.4, 0.4, 0.4),
        opacity: ALPHA,
        rotate: degrees(ANGLE),
      });
    }
  }

  return pdfDoc.save();
}
// === End mirror ===

const pdfBytes = readFileSync(inputPath);
console.log(`Input: ${inputPath} (${pdfBytes.length} bytes)`);
console.log(`Text:  "${text}" (hasCJK=${hasCJK(text)})`);

const cjkFontBytes = hasCJK(text) ? readFileSync("src/assets/fonts/NotoSansSC-subset.ttf") : undefined;

const outBytes = await applyWatermark(pdfBytes, { text, cjkFontBytes });
writeFileSync(outputPath, outBytes);
console.log(`Output: ${outputPath} (${outBytes.length} bytes)`);

// Render page 1 to PNG
console.log("\nRendering page 1 to PNG...");
execSync(`pdftoppm -r 100 -f 1 -l 1 -png "${outputPath}" "${pngPrefix}"`);
console.log(`PNG: ${pngPrefix}-1.png`);

// Also extract text content for verification
console.log("\nText content (pdftotext):");
console.log(execSync(`pdftotext -layout "${outputPath}" -`).toString().trim() || "[no text]");
