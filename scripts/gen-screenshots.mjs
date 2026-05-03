// Generate 1280×800 marketing screenshots for the Chrome Web Store listing.
//
// Three composite screenshots, each rendered as 1280×800 PNG:
//   1. marketing/screenshot-1-hero.png       — Product overview
//   2. marketing/screenshot-2-features.png   — Live preview & params
//   3. marketing/screenshot-3-privacy.png    — Zero permissions, zero network
//
// All composed from SVG layouts + a real watermarked PDF render produced
// by `node scripts/smoke-test.mjs` (run that first if /tmp/.../*.png missing).
//
// Run: node scripts/smoke-test.mjs && node scripts/gen-screenshots.mjs

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";

mkdirSync("marketing", { recursive: true });
const TMP = "/tmp/pdf-watermark-screenshots";
mkdirSync(TMP, { recursive: true });

// === Generate screenshot-friendly sample PDFs (short watermarks that fit) ===
const cjkFontBytes = readFileSync("src/assets/fonts/NotoSansSC-subset.ttf");
const CJK_REGEX = /[　-〿一-鿿＀-￯]/;

async function makeSample({ text, layout, name, blank = "Sample document" }) {
  const doc = await PDFDocument.create();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText(blank, { x: 50, y: 800, size: 14, font: helv });

  let font;
  if (CJK_REGEX.test(text)) {
    doc.registerFontkit(fontkit);
    font = await doc.embedFont(cjkFontBytes, { subset: false });
  } else {
    font = await doc.embedFont(StandardFonts.HelveticaOblique);
  }

  const SIZE = 60, ANGLE = 30, ALPHA = 0.3;
  const tw = font.widthOfTextAtSize(text, SIZE);
  const th = font.heightAtSize(SIZE);
  const a = (ANGLE * Math.PI) / 180;
  const cos = Math.cos(a), sin = Math.sin(a);
  const halfW = tw / 2, halfH = th / 4;

  const w = 595, h = 842;
  let positions;
  if (layout === "single") positions = [[w/2, h/2]];
  else if (layout === "grid2x2") positions = [[w*0.25, h*0.25], [w*0.75, h*0.25], [w*0.25, h*0.75], [w*0.75, h*0.75]];
  else positions = [[w/6, h/6], [w/2, h/6], [5*w/6, h/6], [w/6, h/2], [w/2, h/2], [5*w/6, h/2], [w/6, 5*h/6], [w/2, 5*h/6], [5*w/6, 5*h/6]];

  for (const [cx, cy] of positions) {
    page.drawText(text, {
      x: cx - halfW * cos + halfH * sin,
      y: cy - halfW * sin - halfH * cos,
      size: SIZE, font, color: rgb(0.4, 0.4, 0.4), opacity: ALPHA,
      rotate: degrees(ANGLE),
    });
  }

  const bytes = await doc.save();
  writeFileSync(`${TMP}/${name}.pdf`, bytes);
  execSync(`pdftoppm -r 100 -f 1 -l 1 -png "${TMP}/${name}.pdf" "${TMP}/${name}" 2>/dev/null`);
  return `${TMP}/${name}-1.png`;
}

console.log("Generating sample renders...");
// Use neutral, non-branded text in marketing imagery to keep CWS review smooth.
const enSample = await makeSample({ text: "DRAFT", layout: "grid2x2", name: "en-2x2" });
const cnSample = await makeSample({ text: "示例文档", layout: "grid2x2", name: "cn-2x2" });
const cn3x3Sample = await makeSample({ text: "样品", layout: "grid3x3", name: "cn-3x3" });

const cnGridSmall = await sharp(cnSample).resize({ height: 480 }).png().toBuffer();
const cnGrid3x3 = await sharp(cn3x3Sample).resize({ height: 410 }).png().toBuffer();
const enGridSmall = await sharp(enSample).resize({ height: 410 }).png().toBuffer();

// Brand palette
const C = {
  bg: "#0f172a",        // slate-900
  bg2: "#1e293b",       // slate-800
  accent: "#6366f1",    // indigo-500
  accentLight: "#a5b4fc",
  text: "#f8fafc",      // slate-50
  textMute: "#cbd5e1",  // slate-300
  textFaint: "#94a3b8", // slate-400
  card: "#ffffff",
  cardBorder: "#e2e8f0",
  redStamp: "#ef4444",
  green: "#10b981",
};

// === Screenshot 1: Hero ===
const SCREEN1_SVG = `<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.7" cy="0.4" r="0.5">
      <stop offset="0%" stop-color="#4338ca" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#4338ca" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow1" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="20"/>
      <feOffset dx="0" dy="10" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1280" height="800" fill="url(#heroBg)"/>
  <rect width="1280" height="800" fill="url(#glow)"/>

  <!-- Headline -->
  <text x="80" y="220" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="64" font-weight="800" fill="${C.text}">PDF Watermark</text>
  <text x="80" y="280" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="32" font-weight="500" fill="${C.accentLight}">Add text watermarks to PDFs</text>
  <text x="80" y="320" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="32" font-weight="500" fill="${C.accentLight}">— entirely in your browser.</text>

  <!-- Feature bullets -->
  <g font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="20" fill="${C.textMute}">
    <circle cx="92" cy="430" r="5" fill="${C.green}"/>
    <text x="112" y="436">100% local — zero network requests</text>
    <circle cx="92" cy="476" r="5" fill="${C.green}"/>
    <text x="112" y="482">Live preview, real-time parameter tweaking</text>
    <circle cx="92" cy="522" r="5" fill="${C.green}"/>
    <text x="112" y="528">English + 简体中文 + mixed-language watermarks</text>
    <circle cx="92" cy="568" r="5" fill="${C.green}"/>
    <text x="112" y="574">Zero Chrome permissions in manifest</text>
  </g>

  <!-- Tagline at bottom -->
  <text x="80" y="700" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="18" font-weight="400" fill="${C.textFaint}">Files never leave your machine. Built for privacy.</text>

  <!-- Document mockup (right side) -->
  <g transform="translate(740 90)" filter="url(#shadow1)">
    <rect x="0" y="0" width="460" height="620" rx="12" fill="${C.card}"/>
    <!-- "Browser chrome" hint at top -->
    <rect x="0" y="0" width="460" height="36" rx="12" fill="#f8fafc"/>
    <rect x="0" y="24" width="460" height="12" fill="#f8fafc"/>
    <circle cx="20" cy="18" r="5" fill="#ef4444"/>
    <circle cx="38" cy="18" r="5" fill="#fbbf24"/>
    <circle cx="56" cy="18" r="5" fill="${C.green}"/>
    <text x="220" y="22" text-anchor="middle" font-family="system-ui" font-size="11" fill="${C.textFaint}">page 1 of 1 · 595 × 842 pt</text>
  </g>

  <!-- Watermark badge corner -->
  <g transform="translate(940 620) rotate(-8)">
    <rect x="-100" y="-25" width="200" height="50" rx="8" fill="${C.redStamp}" opacity="0.9"/>
    <text x="0" y="6" text-anchor="middle" font-family="system-ui" font-size="20"
      font-weight="800" fill="white" letter-spacing="2">PRIVATE</text>
  </g>
</svg>`;

// === Screenshot 2: Features (live preview) ===
const SCREEN2_SVG = `<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
      <feOffset dx="0" dy="6"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1280" height="800" fill="url(#bg2)"/>

  <text x="640" y="100" text-anchor="middle"
    font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="48" font-weight="800" fill="${C.text}">Live preview, instant feedback</text>
  <text x="640" y="148" text-anchor="middle"
    font-family="system-ui" font-size="20" fill="${C.textMute}">
    Drag a slider, see the result before you download
  </text>

  <!-- 3 cards horizontally -->
  ${[0, 1, 2].map((i) => {
    const x = 80 + i * 380;
    const labels = ["English · 2×2 grid", "Chinese · 2×2 grid", "Chinese · 3×3 grid"];
    return `
      <g transform="translate(${x} 220)" filter="url(#shadow2)">
        <rect x="0" y="0" width="320" height="450" rx="12" fill="${C.card}"/>
      </g>
      <text x="${x + 160}" y="710" text-anchor="middle"
        font-family="system-ui" font-size="16" font-weight="600" fill="${C.text}">${labels[i]}</text>
    `;
  }).join("")}

  <!-- Bottom hint -->
  <g transform="translate(640 760)">
    <rect x="-260" y="-20" width="520" height="40" rx="20" fill="${C.bg2}"/>
    <text x="0" y="6" text-anchor="middle" font-family="system-ui" font-size="14" fill="${C.textMute}">
      Layout · Opacity · Angle · Font size · Color — all live
    </text>
  </g>
</svg>`;

// === Screenshot 3: Privacy ===
const SCREEN3_SVG = `<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <filter id="shadow3" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
      <feOffset dx="0" dy="6"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1280" height="800" fill="url(#bg3)"/>

  <!-- Title -->
  <text x="640" y="120" text-anchor="middle"
    font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="56" font-weight="800" fill="${C.text}">Zero permissions  ·  Zero network</text>
  <text x="640" y="170" text-anchor="middle"
    font-family="system-ui" font-size="22" fill="${C.accentLight}">Verify it yourself in the bundled manifest.</text>

  <!-- Code snippet card -->
  <g transform="translate(280 230)" filter="url(#shadow3)">
    <rect width="720" height="320" rx="14" fill="#0b1220"/>
    <!-- code header -->
    <rect width="720" height="44" rx="14" fill="#1e293b"/>
    <rect y="32" width="720" height="12" fill="#1e293b"/>
    <circle cx="22" cy="22" r="6" fill="#ef4444"/>
    <circle cx="44" cy="22" r="6" fill="#fbbf24"/>
    <circle cx="66" cy="22" r="6" fill="${C.green}"/>
    <text x="360" y="27" text-anchor="middle" font-family="ui-monospace, Menlo, monospace"
      font-size="13" fill="${C.textFaint}">manifest.json</text>

    <g font-family="ui-monospace, 'SF Mono', Menlo, monospace" font-size="17" fill="#cbd5e1">
      <text x="40" y="86"><tspan fill="#94a3b8">{</tspan></text>
      <text x="60" y="116"><tspan fill="#7dd3fc">"manifest_version"</tspan><tspan fill="#94a3b8">: </tspan><tspan fill="#fde047">3</tspan><tspan fill="#94a3b8">,</tspan></text>
      <text x="60" y="146"><tspan fill="#7dd3fc">"name"</tspan><tspan fill="#94a3b8">: </tspan><tspan fill="#86efac">"PDF Watermark"</tspan><tspan fill="#94a3b8">,</tspan></text>
      <text x="60" y="176"><tspan fill="#7dd3fc">"version"</tspan><tspan fill="#94a3b8">: </tspan><tspan fill="#86efac">"0.1.0"</tspan><tspan fill="#94a3b8">,</tspan></text>
      <text x="60" y="206"><tspan fill="#7dd3fc">"action"</tspan><tspan fill="#94a3b8">: { </tspan><tspan fill="#cbd5e1">…</tspan><tspan fill="#94a3b8"> },</tspan></text>
      <text x="60" y="246"><tspan fill="#fca5a5" font-weight="700">"permissions"</tspan><tspan fill="#94a3b8">: </tspan><tspan fill="#fca5a5" font-weight="700">[]</tspan><tspan fill="#94a3b8">     </tspan><tspan fill="${C.green}">// ← empty, by design</tspan></text>
      <text x="40" y="286"><tspan fill="#94a3b8">}</tspan></text>
    </g>
  </g>

  <!-- Promise badges (4 across, 1280-wide canvas, 290 px each + 24 px gaps) -->
  <g transform="translate(50 620)">
    ${[
      ["No background workers", 0],
      ["No analytics or telemetry", 296],
      ["No external fetches", 592],
      ["No data collection", 888],
    ].map(([label, x]) => `
      <g transform="translate(${x} 0)">
        <rect width="290" height="60" rx="30" fill="${C.bg2}" stroke="${C.accent}" stroke-width="1"/>
        <circle cx="34" cy="30" r="14" fill="${C.green}"/>
        <path d="M 28 30 L 32 34 L 40 26" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="58" y="35" font-family="system-ui" font-size="16" font-weight="500" fill="${C.text}">${label}</text>
      </g>
    `).join("")}
  </g>

  <text x="640" y="760" text-anchor="middle"
    font-family="system-ui" font-size="14" fill="${C.textFaint}">Open-source. Files never leave your device.</text>
</svg>`;

// Render the three screenshots, compositing the watermarked PDF samples on top.

// Screenshot 1: paste cnGridSmall onto the document mockup area
await sharp(Buffer.from(SCREEN1_SVG))
  .composite([
    { input: cnGridSmall, top: 90 + 60, left: 740 + 80 }, // Approx fits inside the 460×620 mockup
  ])
  .png({ compressionLevel: 9 })
  .toFile("marketing/screenshot-1-hero.png");
console.log("  marketing/screenshot-1-hero.png");

// Screenshot 2: paste 3 sample renders into the cards.
// Cards are 320px wide; resized PDF at height 410 has width ~290 (A4 ratio).
// Center horizontally with (320 - 290) / 2 = 15px padding.
const cnGridForCard = await sharp(cnSample).resize({ height: 410 }).png().toBuffer();
await sharp(Buffer.from(SCREEN2_SVG))
  .composite([
    { input: enGridSmall, top: 240, left: 80 + 15 },
    { input: cnGridForCard, top: 240, left: 460 + 15 },
    { input: cnGrid3x3, top: 240, left: 840 + 15 },
  ])
  .png({ compressionLevel: 9 })
  .toFile("marketing/screenshot-2-features.png");
console.log("  marketing/screenshot-2-features.png");

// Screenshot 3: pure SVG (no composite needed)
await sharp(Buffer.from(SCREEN3_SVG))
  .png({ compressionLevel: 9 })
  .toFile("marketing/screenshot-3-privacy.png");
console.log("  marketing/screenshot-3-privacy.png");

console.log("\nAll three 1280×800 screenshots written to marketing/");
