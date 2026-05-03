// CJK character detection + lazy loading of the bundled Noto Sans SC subset.

// Range covers common CJK Unified Ideographs, CJK punctuation, fullwidth ASCII.
// Does not include rare extension blocks (CJK-A/B/etc.) — those will fall back
// silently to glyph .notdef in the subset font.
const CJK_REGEX = /[　-〿一-鿿＀-￯]/;

export function hasCJK(text: string): boolean {
  return CJK_REGEX.test(text);
}

let cjkFontBytesCache: Promise<ArrayBuffer> | null = null;

/**
 * Lazy-load the bundled Noto Sans SC subset.
 * Cached after first call so repeated watermarks don't re-fetch.
 *
 * `fontUrl` is injected by the caller (popup) using Vite's `?url` import,
 * which produces a chrome-extension://.../assets/...ttf URL at runtime.
 */
export async function loadCJKFont(fontUrl: string): Promise<ArrayBuffer> {
  if (!cjkFontBytesCache) {
    cjkFontBytesCache = fetch(fontUrl).then((res) => {
      if (!res.ok) throw new Error(`Failed to load CJK font: HTTP ${res.status}`);
      return res.arrayBuffer();
    });
  }
  return cjkFontBytesCache;
}

// Test-only: clear the cache (used in vitest).
export function _resetFontCache() {
  cjkFontBytesCache = null;
}
