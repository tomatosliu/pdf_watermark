// Generate the union of GB2312 (Level 1 + Level 2) characters as a Unicode string.
// Output: scripts/gb2312-charset.txt — a single-line file of all unique characters.
//
// GB2312 layout (94×94 grid, rows 1-94, cells 1-94):
//   Row 1-15:  symbols, punctuation, Latin/Greek/Cyrillic, etc.
//   Row 16-55: Level 1 hanzi (3755 chars), in pinyin order
//   Row 56-87: Level 2 hanzi (3008 chars), in radical order
//   Row 88-94: unused
//
// We extract all printable cells (rows 1-87) since we want symbols/punctuation too.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "gb2312-charset.txt");

const decoder = new TextDecoder("gb2312", { fatal: false });
const chars = new Set();

// Iterate GB2312 rows 1..87 (skip unused 88..94)
for (let row = 1; row <= 87; row++) {
  for (let cell = 1; cell <= 94; cell++) {
    const high = 0xa0 + row;
    const low = 0xa0 + cell;
    const bytes = new Uint8Array([high, low]);
    const decoded = decoder.decode(bytes);
    if (decoded && decoded !== "�" && decoded.length > 0) {
      const ch = decoded[0];
      if (ch.charCodeAt(0) !== 0xfffd) chars.add(ch);
    }
  }
}

// Add ASCII printable range (0x20 - 0x7E) — needed for Latin chars in mixed-language watermarks
for (let code = 0x20; code <= 0x7e; code++) {
  chars.add(String.fromCharCode(code));
}

// Common extras not always in GB2312 strict mapping
const extras = "·—…‘’“”《》〈〉「」『』【】〖〗·•★☆◆◇○●";
for (const ch of extras) chars.add(ch);

const charsetString = [...chars].join("");
writeFileSync(outPath, charsetString);

console.log(`Generated ${chars.size} unique characters → ${outPath}`);
console.log(`Sample: ${charsetString.slice(0, 50)}...`);
