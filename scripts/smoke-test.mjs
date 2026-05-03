// End-to-end smoke test for the watermark pipeline.
//
// For each test case:
//   1. Generate or load an input PDF
//   2. Apply watermark (mirrors src/lib/watermark.ts logic)
//   3. Render every page to PNG via pdftoppm
//   4. Capture pdftoppm stderr for "Embedded font file may be invalid" errors
//   5. Report PASS/FAIL
//
// Run: node scripts/smoke-test.mjs
// Requires: poppler (`brew install poppler`)

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const OUT_DIR = "/tmp/pdf-watermark-smoke";
mkdirSync(OUT_DIR, { recursive: true });

const CJK_REGEX = /[　-〿一-鿿＀-￯]/;
const hasCJK = (t) => CJK_REGEX.test(t);
const cjkFontBytes = readFileSync("src/assets/fonts/NotoSansSC-subset.ttf");

// Mirrors src/lib/watermark.ts
async function applyWatermark(pdfBytes, opts) {
  const { text, fontSize = 60, alpha = 0.3, angle = 30, layout = "grid2x2" } = opts;
  const pdfDoc = await PDFDocument.load(pdfBytes);
  let font;
  if (hasCJK(text)) {
    pdfDoc.registerFontkit(fontkit);
    font = await pdfDoc.embedFont(cjkFontBytes, { subset: false });
  } else {
    font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  }
  const tw = font.widthOfTextAtSize(text, fontSize);
  const th = font.heightAtSize(fontSize);
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a), sin = Math.sin(a);
  const halfW = tw / 2, halfH = th / 4;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const positions = layoutPositions(width, height, layout);
    for (const [cx, cy] of positions) {
      page.drawText(text, {
        x: cx - halfW * cos + halfH * sin,
        y: cy - halfW * sin - halfH * cos,
        size: fontSize, font,
        color: rgb(0.4, 0.4, 0.4), opacity: alpha,
        rotate: degrees(angle),
      });
    }
  }
  return pdfDoc.save();
}

function layoutPositions(w, h, layout) {
  if (layout === "single") return [[w / 2, h / 2]];
  if (layout === "grid2x2") return [
    [w * 0.25, h * 0.25], [w * 0.75, h * 0.25],
    [w * 0.25, h * 0.75], [w * 0.75, h * 0.75],
  ];
  return [
    [w / 6, h / 6], [w / 2, h / 6], [(5 * w) / 6, h / 6],
    [w / 6, h / 2], [w / 2, h / 2], [(5 * w) / 6, h / 2],
    [w / 6, (5 * h) / 6], [w / 2, (5 * h) / 6], [(5 * w) / 6, (5 * h) / 6],
  ];
}

async function makeBlankPdf(pages = 1) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    doc.addPage([595, 842]).drawText(`Page ${i + 1}`, { x: 50, y: 800, size: 14, font });
  }
  return doc.save();
}

async function runCase(name, opts) {
  const inputPages = opts.pages ?? 1;
  const inputBytes = await makeBlankPdf(inputPages);
  const outputBytes = await applyWatermark(inputBytes, opts);

  const inputPath = `${OUT_DIR}/${name}-input.pdf`;
  const outputPath = `${OUT_DIR}/${name}-output.pdf`;
  writeFileSync(inputPath, inputBytes);
  writeFileSync(outputPath, outputBytes);

  // Render every page; capture stderr for font errors
  let stderr = "";
  try {
    execSync(`pdftoppm -r 72 -png "${outputPath}" "${OUT_DIR}/${name}"`, {
      stdio: ["ignore", "ignore", "pipe"],
    });
  } catch (err) {
    stderr = err.stderr?.toString() ?? "";
  }
  // pdftoppm sometimes succeeds but writes warnings; capture via separate exec
  const result = execSync(`pdftoppm -r 72 -png "${outputPath}" "${OUT_DIR}/${name}" 2>&1 || true`).toString();

  const fontErrors = result.match(/Embedded font file may be invalid|Couldn't create a font|non-embedded font/g) || [];
  const ok = fontErrors.length === 0;

  return {
    name,
    ok,
    sizeKB: (outputBytes.length / 1024).toFixed(1),
    pages: inputPages,
    fontErrors: fontErrors.length,
    detail: ok ? "" : result.split("\n").filter(Boolean).slice(0, 3).join(" | "),
  };
}

const cases = [
  { name: "01-english-2x2",  text: "CONFIDENTIAL", layout: "grid2x2", pages: 1 },
  { name: "02-english-multipage", text: "DRAFT", layout: "grid2x2", pages: 5 },
  { name: "03-chinese-2x2",  text: "示例公司", layout: "grid2x2", pages: 1 },
  { name: "04-chinese-3x3",  text: "机密", layout: "grid3x3", pages: 1 },
  { name: "05-mixed",        text: "Confidential 机密", layout: "grid2x2", pages: 1 },
  { name: "06-single",       text: "网络", layout: "single", pages: 1 },
  { name: "07-tiny-angle",   text: "DRAFT", layout: "grid2x2", angle: 0, pages: 1 },
  { name: "08-extreme-angle", text: "DRAFT", layout: "grid2x2", angle: 75, pages: 1 },
  { name: "09-low-opacity",  text: "DRAFT", alpha: 0.1, pages: 1 },
  { name: "10-large-font",   text: "BIG", fontSize: 120, pages: 1 },
];

console.log(`Running ${cases.length} smoke tests → ${OUT_DIR}\n`);
const results = [];
for (const c of cases) {
  process.stdout.write(`  ${c.name}... `);
  try {
    const r = await runCase(c.name, c);
    results.push(r);
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.sizeKB} KB  ${r.pages}p  ${r.fontErrors ? `(${r.fontErrors} font errors: ${r.detail})` : ""}`);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    results.push({ name: c.name, ok: false, error: err.message });
  }
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} passed`);
if (passed < results.length) process.exit(1);
