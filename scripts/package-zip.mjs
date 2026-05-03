// Package the built dist/ folder as a .zip ready for Chrome Web Store upload.
// Output: marketing/pdf-watermark-v<version>.zip
//
// Run: npm run package  (also runs the build first)

import { execSync } from "node:child_process";
import { readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.version;

if (!existsSync("dist")) {
  console.error("dist/ does not exist. Run `npm run build` first.");
  process.exit(1);
}

const manifestPath = "dist/manifest.json";
if (!existsSync(manifestPath)) {
  console.error(`Missing ${manifestPath} — build output looks broken.`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.version !== version) {
  console.error(`Version mismatch: package.json=${version} vs manifest.json=${manifest.version}`);
  process.exit(1);
}

mkdirSync("marketing", { recursive: true });
const zipPath = join("marketing", `pdf-watermark-v${version}.zip`);

// Use the macOS/Linux `zip` command. -r recursive, -X exclude resource forks/.DS_Store etc.
execSync(`rm -f "${zipPath}"`);
execSync(`cd dist && zip -rqX "../${zipPath}" .`);

const size = statSync(zipPath).size;
console.log(`Packaged: ${zipPath}  (${(size / 1024 / 1024).toFixed(2)} MB)`);

// Sanity: list zip contents
console.log("\nZip contents:");
console.log(execSync(`unzip -l "${zipPath}"`).toString().split("\n").slice(3, -3).map((l) => `  ${l.trim()}`).join("\n"));
