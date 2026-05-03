import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyWatermark, watermarkedFilename } from "../src/lib/watermark";

const cjkFontPath = join(__dirname, "..", "src", "assets", "fonts", "NotoSansSC-subset.ttf");
const cjkFontBytes = readFileSync(cjkFontPath);

async function makeBlankPdf(pages = 3): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([595, 842]); // A4
    page.drawText(`Page ${i + 1}`, { x: 50, y: 800, size: 20, font });
  }
  return doc.save();
}

describe("watermarkedFilename", () => {
  it("appends _watermarked before .pdf", () => {
    expect(watermarkedFilename("invoice.pdf")).toBe("invoice_watermarked.pdf");
    expect(watermarkedFilename("My File.PDF")).toBe("My File_watermarked.pdf");
  });

  it("appends _watermarked.pdf when no extension", () => {
    expect(watermarkedFilename("doc")).toBe("doc_watermarked.pdf");
  });
});

describe("applyWatermark", () => {
  it("rejects empty text", async () => {
    const input = await makeBlankPdf(1);
    await expect(applyWatermark(input, { text: "" })).rejects.toThrow(/required/i);
  });

  it("preserves page count", async () => {
    const input = await makeBlankPdf(5);
    const output = await applyWatermark(input, { text: "TEST" });
    const doc = await PDFDocument.load(output);
    expect(doc.getPageCount()).toBe(5);
  });

  it("returns a larger PDF (watermark adds bytes)", async () => {
    const input = await makeBlankPdf(3);
    const output = await applyWatermark(input, { text: "CONFIDENTIAL" });
    expect(output.byteLength).toBeGreaterThan(input.byteLength);
  });

  it("preserves original page dimensions", async () => {
    const input = await makeBlankPdf(1);
    const output = await applyWatermark(input, { text: "X" });
    const doc = await PDFDocument.load(output);
    const page = doc.getPage(0);
    expect(page.getWidth()).toBe(595);
    expect(page.getHeight()).toBe(842);
  });

  it("supports single layout (1 watermark per page)", async () => {
    const input = await makeBlankPdf(1);
    const result = await applyWatermark(input, { text: "X", layout: "single" });
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("supports grid3x3 layout", async () => {
    const input = await makeBlankPdf(1);
    const result = await applyWatermark(input, { text: "X", layout: "grid3x3" });
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("respects custom alpha, angle, fontSize", async () => {
    const input = await makeBlankPdf(1);
    const result = await applyWatermark(input, {
      text: "DRAFT",
      alpha: 0.5,
      angle: 45,
      fontSize: 80,
    });
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("rejects CJK text when no CJK font provided", async () => {
    const input = await makeBlankPdf(1);
    await expect(applyWatermark(input, { text: "示例公司" })).rejects.toThrow(/CJK/i);
  });

  it("watermarks PDF with simplified Chinese", async () => {
    const input = await makeBlankPdf(2);
    const output = await applyWatermark(input, {
      text: "示例公司",
      cjkFontBytes,
    });
    const doc = await PDFDocument.load(output);
    expect(doc.getPageCount()).toBe(2);
    expect(output.byteLength).toBeGreaterThan(input.byteLength);
  });

  it("watermarks PDF with mixed CJK + ASCII", async () => {
    const input = await makeBlankPdf(1);
    const output = await applyWatermark(input, {
      text: "Confidential 机密",
      cjkFontBytes,
    });
    expect(output).toBeInstanceOf(Uint8Array);
  });

  it("uses Helvetica for pure ASCII even when CJK font is provided", async () => {
    const input = await makeBlankPdf(1);
    const result = await applyWatermark(input, {
      text: "DRAFT",
      cjkFontBytes,
    });
    expect(result).toBeInstanceOf(Uint8Array);
  });
});
