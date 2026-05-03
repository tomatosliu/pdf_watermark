import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { applyWatermark, watermarkedFilename, type GridLayout, type WatermarkOptions } from "../lib/watermark";
import { hasCJK, loadCJKFont } from "../lib/fonts";
import cjkFontUrl from "../assets/fonts/NotoSansSC-subset.ttf?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const fileInput = $<HTMLInputElement>("file-input");
const dropzone = $<HTMLElement>("dropzone");
const statusEl = $<HTMLElement>("status");
const downloadBtn = $<HTMLButtonElement>("download-btn");
const textInput = $<HTMLInputElement>("watermark-text");
const layoutSelect = $<HTMLSelectElement>("layout-select");
const alphaInput = $<HTMLInputElement>("alpha-input");
const angleInput = $<HTMLInputElement>("angle-input");
const sizeInput = $<HTMLInputElement>("size-input");
const colorInput = $<HTMLInputElement>("color-input");
const alphaValue = $<HTMLElement>("alpha-value");
const angleValue = $<HTMLElement>("angle-value");
const sizeValue = $<HTMLElement>("size-value");
const previewWrap = $<HTMLElement>("preview-wrap");
const previewStage = $<HTMLElement>("preview-stage");
const previewCanvas = $<HTMLCanvasElement>("preview-canvas");
const previewOverlay = $<HTMLElement>("preview-overlay");
const previewMeta = $<HTMLElement>("preview-meta");

const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100MB
const PREVIEW_TARGET_WIDTH = 380;

interface AppState {
  file: File | null;
  pdfBytes: ArrayBuffer | null;
  pageCount: number;
  /** PDF page 1 dimensions (in PDF points) */
  pdfWidth: number;
  pdfHeight: number;
  /** Preview canvas display dimensions (in CSS px) */
  previewWidth: number;
  previewHeight: number;
}

const state: AppState = {
  file: null,
  pdfBytes: null,
  pageCount: 0,
  pdfWidth: 0,
  pdfHeight: 0,
  previewWidth: 0,
  previewHeight: 0,
};

function setStatus(message: string, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function getOptions(): WatermarkOptions {
  const hex = colorInput.value;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return {
    text: textInput.value.trim(),
    layout: layoutSelect.value as GridLayout,
    alpha: parseFloat(alphaInput.value),
    angle: parseFloat(angleInput.value),
    fontSize: parseFloat(sizeInput.value),
    color: { r, g, b },
  };
}

function updateValueTags() {
  alphaValue.textContent = parseFloat(alphaInput.value).toFixed(2);
  angleValue.textContent = `${angleInput.value}°`;
  sizeValue.textContent = sizeInput.value;
}

function gridPositionsForPreview(width: number, height: number, layout: GridLayout): Array<[number, number]> {
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

function renderOverlay() {
  if (!state.pdfBytes) return;
  previewOverlay.innerHTML = "";

  const opts = getOptions();
  if (!opts.text) return;

  // Scale PDF coordinates to preview pixels.
  const scale = state.previewWidth / state.pdfWidth;

  // PDF y-axis is bottom-up; CSS y-axis is top-down. Flip y.
  const positions = gridPositionsForPreview(state.pdfWidth, state.pdfHeight, opts.layout!);
  const cssFontSize = (opts.fontSize ?? 60) * scale;
  const hex = colorInput.value;

  for (const [pdfX, pdfY] of positions) {
    const el = document.createElement("div");
    el.className = "watermark-token";
    el.textContent = opts.text;
    const cssX = pdfX * scale;
    const cssY = state.previewHeight - pdfY * scale; // flip y
    el.style.left = `${cssX}px`;
    el.style.top = `${cssY}px`;
    // CSS rotate is clockwise positive; PDF rotate is counter-clockwise positive.
    // Negate the angle so visual rotation matches the PDF output direction.
    el.style.transform = `translate(-50%, -50%) rotate(${-(opts.angle ?? 0)}deg)`;
    el.style.fontSize = `${cssFontSize}px`;
    el.style.color = hex;
    el.style.opacity = String(opts.alpha ?? 0.3);
    previewOverlay.appendChild(el);
  }
}

async function renderPreview() {
  if (!state.pdfBytes) return;
  // Make a fresh copy because pdfjs may detach the buffer.
  const bytesCopy = state.pdfBytes.slice(0);
  const pdf = await pdfjsLib.getDocument({ data: bytesCopy }).promise;
  state.pageCount = pdf.numPages;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  state.pdfWidth = viewport.width;
  state.pdfHeight = viewport.height;

  const renderScale = PREVIEW_TARGET_WIDTH / viewport.width;
  const renderViewport = page.getViewport({ scale: renderScale });
  state.previewWidth = renderViewport.width;
  state.previewHeight = renderViewport.height;

  const dpr = window.devicePixelRatio || 1;
  previewCanvas.width = renderViewport.width * dpr;
  previewCanvas.height = renderViewport.height * dpr;
  previewCanvas.style.width = `${renderViewport.width}px`;
  previewCanvas.style.height = `${renderViewport.height}px`;
  previewStage.style.height = `${renderViewport.height}px`;
  previewOverlay.style.width = `${renderViewport.width}px`;
  previewOverlay.style.height = `${renderViewport.height}px`;

  const ctx = previewCanvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

  previewMeta.textContent = `Page 1 of ${state.pageCount} · ${Math.round(state.pdfWidth)} × ${Math.round(state.pdfHeight)} pt`;
  previewWrap.hidden = false;
  renderOverlay();
}

async function handleFile(file: File) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    setStatus("Please select a PDF file.", true);
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    setStatus(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB — max 100 MB.`, true);
    return;
  }

  state.file = file;
  setStatus(`Loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  downloadBtn.disabled = false;

  try {
    state.pdfBytes = await file.arrayBuffer();
    await renderPreview();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/password|encrypt/i.test(msg)) {
      setStatus("This PDF is password-protected. Please unlock it first.", true);
    } else {
      setStatus(`Failed to read PDF: ${msg}`, true);
    }
    downloadBtn.disabled = true;
    state.pdfBytes = null;
    previewWrap.hidden = true;
  }
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) handleFile(file);
});

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  const file = e.dataTransfer?.files[0];
  if (file) handleFile(file);
});

// Live preview: re-render overlay on every control change.
for (const input of [textInput, layoutSelect, alphaInput, angleInput, sizeInput, colorInput]) {
  input.addEventListener("input", () => {
    updateValueTags();
    renderOverlay();
  });
}

function triggerDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

downloadBtn.addEventListener("click", async () => {
  if (!state.file || !state.pdfBytes) return;
  const opts = getOptions();
  if (!opts.text) {
    setStatus("Watermark text cannot be empty.", true);
    return;
  }

  downloadBtn.disabled = true;
  setStatus("Processing...");

  try {
    const cjkFontBytes = hasCJK(opts.text) ? await loadCJKFont(cjkFontUrl) : undefined;
    // pdfjs may have detached the original; use a fresh copy from the File.
    const fresh = await state.file.arrayBuffer();
    const watermarkedBytes = await applyWatermark(fresh, { ...opts, cjkFontBytes });
    const outName = watermarkedFilename(state.file.name);
    triggerDownload(watermarkedBytes, outName);
    setStatus(`Done: ${outName}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/encrypt/i.test(msg)) {
      setStatus("This PDF is encrypted. Please remove the password first.", true);
    } else {
      setStatus(`Failed: ${msg}`, true);
    }
  } finally {
    downloadBtn.disabled = false;
  }
});

updateValueTags();
