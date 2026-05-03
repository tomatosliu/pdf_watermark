// Generate the PDF Watermark extension icons.
//
// Design rationale:
//   The icon is itself a watermark. A single bold letterform sits on a coral
//   gradient background. Across the whole icon — letterform AND background —
//   runs one bold translucent diagonal stripe with the word "WATERMARK"
//   subtly typeset inside, and a thinner stripe trailing it. The icon
//   visually demonstrates what the extension does: it applies a translucent
//   rotated watermark layer on top of any surface.
//
//   No literal "document silhouette" — that's a tired PDF-tool trope. Instead
//   the icon's own surface IS the document being watermarked.
//
// Outputs:
//   src/assets/icon-16.png         (toolbar — uses simplified version)
//   src/assets/icon-48.png         (extensions page — full design)
//   src/assets/icon-128.png        (manifest + CWS)
//   marketing/icon-512.png         (CWS hi-res)
//   marketing/icon-440x280.png     (CWS small promo tile)
//
// Run: node scripts/gen-icons.mjs

import { writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

mkdirSync("src/assets", { recursive: true });
mkdirSync("marketing", { recursive: true });

// Single icon used at all sizes. A bold white "W" letterform on a violet→indigo
// gradient, with one translucent diagonal stripe across the entire icon — the
// icon's own surface is the "watermarked" object. No text inside the stripe to
// avoid legibility noise; the stripe alone reads as a watermark layer.
const ICON = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#4338ca"/>
    </linearGradient>
    <clipPath id="round">
      <rect x="0" y="0" width="512" height="512" rx="112" ry="112"/>
    </clipPath>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="112" ry="112" fill="url(#bg)"/>
  <g clip-path="url(#round)">
    <text x="256" y="376" text-anchor="middle"
      font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
      font-size="400" font-weight="900" letter-spacing="-12"
      fill="#ffffff">W</text>
    <g transform="rotate(-28 256 256)">
      <rect x="-80" y="220" width="672" height="80" fill="#ffffff" opacity="0.30"/>
    </g>
  </g>
</svg>`;

const tasks = [
  { size: 16,  out: "src/assets/icon-16.png" },
  { size: 48,  out: "src/assets/icon-48.png" },
  { size: 128, out: "src/assets/icon-128.png" },
  { size: 512, out: "marketing/icon-512.png" },
];

for (const { size, out } of tasks) {
  await sharp(Buffer.from(ICON)).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
  console.log(`  ${out}  (${size}×${size})`);
}

writeFileSync("marketing/icon.svg", ICON);

// === CWS small promo tile (440×280) ===
const iconPng = await sharp(Buffer.from(ICON)).resize(200, 200).png().toBuffer();
const PROMO = `<svg width="440" height="280" viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="promoBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="440" height="280" fill="url(#promoBg)"/>
  <text x="250" y="120" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="24" font-weight="700" fill="#ffffff">PDF Watermark</text>
  <text x="250" y="152" font-family="system-ui" font-size="12" font-weight="400" fill="#c7d2fe">100% local — files never</text>
  <text x="250" y="170" font-family="system-ui" font-size="12" font-weight="400" fill="#c7d2fe">leave your browser.</text>
  <text x="250" y="200" font-family="system-ui" font-size="12" font-weight="400" fill="#a5b4fc">CN + EN watermarks</text>
</svg>`;

await sharp(Buffer.from(PROMO))
  .composite([{ input: iconPng, top: 40, left: 40 }])
  .png({ compressionLevel: 9 })
  .toFile("marketing/icon-440x280.png");
console.log(`  marketing/icon-440x280.png  (440×280)`);

console.log(`\nSVG source preserved at marketing/icon.svg`);
