// Subset the Noto Sans SC font down to GB2312 + ASCII characters.
// Input:  /tmp/font-download/NotoSansSC-Regular.otf (download separately)
// Output: src/assets/fonts/NotoSansSC-subset.ttf
//
// Run:    node scripts/subset-font.mjs
//
// This is a one-time generation step. The output TTF is committed to the repo
// so end users don't need to run this.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = "/tmp/font-download/NotoSansSC-Regular.otf";
const charsetPath = join(__dirname, "gb2312-charset.txt");
const outputPath = join(__dirname, "..", "src", "assets", "fonts", "NotoSansSC-subset.ttf");

if (!existsSync(inputPath)) {
  console.error(`Missing input font: ${inputPath}`);
  console.error(
    `Download with:\n  curl -sL -o ${inputPath} "https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf"`,
  );
  process.exit(1);
}

const inputBuffer = readFileSync(inputPath);
const charset = readFileSync(charsetPath, "utf8");

console.log(`Input:    ${inputPath} (${(inputBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
console.log(`Charset:  ${charset.length} characters`);
console.log("Subsetting (this can take 30-60 seconds for large fonts)...");

const startTime = Date.now();
const subsetBuffer = await subsetFont(inputBuffer, charset, {
  targetFormat: "truetype",
});
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

writeFileSync(outputPath, subsetBuffer);

console.log(`\nDone in ${elapsed}s`);
console.log(`Output:   ${outputPath} (${(subsetBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
console.log(`Reduction: ${(100 - (subsetBuffer.length / inputBuffer.length) * 100).toFixed(1)}%`);
