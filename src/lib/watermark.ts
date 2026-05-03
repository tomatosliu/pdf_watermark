import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  type PDFFont,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { hasCJK } from "./fonts";

export type GridLayout = "single" | "grid2x2" | "grid3x3";

export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  alpha?: number;
  angle?: number;
  color?: { r: number; g: number; b: number };
  layout?: GridLayout;
  /** Bytes of CJK font (Noto Sans SC subset). Required when text contains CJK characters. */
  cjkFontBytes?: ArrayBuffer | Uint8Array;
}

const DEFAULTS = {
  fontSize: 60,
  alpha: 0.3,
  angle: 30,
  color: { r: 0.4, g: 0.4, b: 0.4 },
  layout: "grid2x2" as GridLayout,
};

function gridPositions(width: number, height: number, layout: GridLayout): Array<[number, number]> {
  switch (layout) {
    case "single":
      return [[width / 2, height / 2]];
    case "grid2x2":
      return [
        [width * 0.25, height * 0.25],
        [width * 0.75, height * 0.25],
        [width * 0.25, height * 0.75],
        [width * 0.75, height * 0.75],
      ];
    case "grid3x3":
      return [
        [width / 6, height / 6],
        [width / 2, height / 6],
        [(5 * width) / 6, height / 6],
        [width / 6, height / 2],
        [width / 2, height / 2],
        [(5 * width) / 6, height / 2],
        [width / 6, (5 * height) / 6],
        [width / 2, (5 * height) / 6],
        [(5 * width) / 6, (5 * height) / 6],
      ];
  }
}

async function pickFont(pdfDoc: PDFDocument, text: string, cjkFontBytes?: ArrayBuffer | Uint8Array): Promise<PDFFont> {
  if (hasCJK(text)) {
    if (!cjkFontBytes) {
      throw new Error("Watermark text contains CJK characters but no CJK font was provided");
    }
    pdfDoc.registerFontkit(fontkit);
    // subset: false — pdf-lib's CFF subsetting corrupts CJK fonts when used after
    // PDFDocument.load(), causing PDF viewers to fail rendering. Trade-off: the
    // full ~3.35MB font is embedded in each output PDF.
    return pdfDoc.embedFont(cjkFontBytes, { subset: false });
  }
  return pdfDoc.embedFont(StandardFonts.HelveticaOblique);
}

/**
 * Apply text watermark to every page of a PDF.
 * Returns new PDF bytes; original input is not mutated.
 */
export async function applyWatermark(
  pdfBytes: ArrayBuffer | Uint8Array,
  options: WatermarkOptions,
): Promise<Uint8Array> {
  const opts = { ...DEFAULTS, ...options };
  const text = opts.text;
  if (!text) throw new Error("Watermark text is required");

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pickFont(pdfDoc, text, options.cjkFontBytes);

  const textWidth = font.widthOfTextAtSize(text, opts.fontSize);
  const textHeight = font.heightAtSize(opts.fontSize);

  // pdf-lib's drawText rotates around (x, y), where (x, y) is the baseline-left
  // of the (un-rotated) text. To make the visual center end up at (cx, cy), we
  // compute the offset from baseline-left to text's geometric center, rotate it,
  // and subtract from (cx, cy).
  const angleRad = (opts.angle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const halfW = textWidth / 2;
  const halfH = textHeight / 4; // baseline-to-cap-center approximation

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();

    for (const [cx, cy] of gridPositions(width, height, opts.layout)) {
      const x = cx - halfW * cos + halfH * sin;
      const y = cy - halfW * sin - halfH * cos;

      page.drawText(text, {
        x,
        y,
        size: opts.fontSize,
        font,
        color: rgb(opts.color.r, opts.color.g, opts.color.b),
        opacity: opts.alpha,
        rotate: degrees(opts.angle),
      });
    }
  }

  return pdfDoc.save();
}

export function watermarkedFilename(originalName: string): string {
  if (originalName.toLowerCase().endsWith(".pdf")) {
    return originalName.slice(0, -4) + "_watermarked.pdf";
  }
  return originalName + "_watermarked.pdf";
}
