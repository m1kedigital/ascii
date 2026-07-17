import type { AsciiSettings } from "@/lib/types";

const MAX_CANVAS_PIXELS = 12_000_000;

export function renderAsciiToCanvas(
  canvas: HTMLCanvasElement,
  asciiData: string,
  asciiColors: (string | null)[][],
  settings: AsciiSettings,
  options?: { forExport?: boolean }
): void {
  const ctx = canvas.getContext("2d")!;
  const forExport = options?.forExport ?? true;

  let fontSize = settings.cellSize;
  const fontFamily = "IBM Plex Mono, monospace";

  const lines = asciiData.trimEnd().split("\n");
  const maxWidth = Math.max(...lines.map((line) => line.length), 1);

  let charWidth = fontSize * 0.6;
  let lineHeight = fontSize * 1.2;

  const creditExtra = settings.credit ? 22 : 0;
  let canvasWidth = maxWidth * charWidth + 40;
  let canvasHeight = lines.length * lineHeight + 40 + creditExtra;

  const exportScale = forExport ? settings.exportSize : 1;
  const totalPixels = canvasWidth * canvasHeight * exportScale * exportScale;
  if (totalPixels > MAX_CANVAS_PIXELS) {
    const scale = Math.sqrt(MAX_CANVAS_PIXELS / totalPixels);
    fontSize = Math.max(2, fontSize * scale);
    charWidth = fontSize * 0.6;
    lineHeight = fontSize * 1.2;
    canvasWidth = maxWidth * charWidth + 40;
    canvasHeight = lines.length * lineHeight + 40 + creditExtra;
  }

  canvas.width = canvasWidth * exportScale;
  canvas.height = canvasHeight * exportScale;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(exportScale, exportScale);

  let bgColor = "transparent";
  if (settings.background === "white") bgColor = "#ffffff";
  if (settings.background === "black") bgColor = "#000000";

  if (bgColor !== "transparent") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  ctx.font = `400 ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";

  let yPos = 20;
  let lineIndex = 0;

  for (const line of lines) {
    let xPos = 20;
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      const color = asciiColors[lineIndex]?.[charIndex];
      if (color) {
        ctx.fillStyle = color;
      } else {
        ctx.fillStyle = settings.background === "white" ? "#000000" : "#ffffff";
      }
      ctx.fillText(char, xPos, yPos);
      xPos += charWidth;
    }
    yPos += lineHeight;
    lineIndex++;
  }

  if (settings.credit) {
    ctx.font = `400 10px ${fontFamily}`;
    ctx.fillStyle =
      settings.background === "white"
        ? "rgba(0,0,0,0.4)"
        : "rgba(255,255,255,0.4)";
    ctx.fillText("ascii.m1ke.digital", 20, canvasHeight - 16);
  }
}

/** Snapshot current ascii render to ImageData at fixed scale for GIF */
export function asciiToImageData(
  asciiData: string,
  asciiColors: (string | null)[][],
  settings: AsciiSettings,
  maxDim = 480
): ImageData {
  const canvas = document.createElement("canvas");
  const scaled: AsciiSettings = {
    ...settings,
    exportSize: 1,
    cellSize: Math.max(4, Math.min(settings.cellSize, 8)),
  };
  renderAsciiToCanvas(canvas, asciiData, asciiColors, scaled, { forExport: true });

  // Downscale if needed
  let w = canvas.width;
  let h = canvas.height;
  if (w > maxDim || h > maxDim) {
    const r = Math.min(maxDim / w, maxDim / h);
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(w * r));
    out.height = Math.max(1, Math.round(h * r));
    const octx = out.getContext("2d")!;
    octx.drawImage(canvas, 0, 0, out.width, out.height);
    return octx.getImageData(0, 0, out.width, out.height);
  }
  const ctx = canvas.getContext("2d")!;
  return ctx.getImageData(0, 0, w, h);
}
