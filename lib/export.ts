import type { AsciiSettings } from "./types";

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "art";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/** Build monospaced SVG from ASCII grid */
export function asciiToSvg(
  asciiData: string,
  asciiColors: (string | null)[][],
  settings: AsciiSettings
): string {
  const lines = asciiData.trimEnd().split("\n");
  const cols = Math.max(...lines.map((l) => l.length), 1);
  const rows = lines.length;
  const fontSize = settings.cellSize;
  const charW = fontSize * 0.6;
  const lineH = fontSize * 1.2;
  const pad = 20;
  const width = cols * charW + pad * 2;
  const height = rows * lineH + pad * 2 + (settings.credit ? 18 : 0);

  let bg = "none";
  if (settings.background === "black") bg = "#000000";
  if (settings.background === "white") bg = "#ffffff";

  const defaultFill =
    settings.background === "white" ? "#000000" : "#ffffff";

  const useColor = settings.colorMode !== "mono";
  let body = "";

  if (useColor) {
    lines.forEach((line, row) => {
      let x = pad;
      const y = pad + row * lineH + fontSize;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        const fill = asciiColors[row]?.[c] || defaultFill;
        const esc = escapeXml(ch);
        body += `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" fill="${fill}">${esc}</text>`;
        x += charW;
      }
    });
  } else {
    // Single color: one text block per line for smaller SVG
    lines.forEach((line, row) => {
      const y = pad + row * lineH + fontSize;
      body += `<text x="${pad}" y="${y.toFixed(2)}" fill="${defaultFill}">${escapeXml(line)}</text>`;
    });
  }

  if (settings.credit) {
    const cy = height - 8;
    body += `<text x="${pad}" y="${cy}" fill="${defaultFill}" font-size="10" opacity="0.45">ascii.m1ke.digital</text>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(0)}" height="${height.toFixed(0)}" viewBox="0 0 ${width.toFixed(1)} ${height.toFixed(1)}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g font-family="ui-monospace, 'IBM Plex Mono', Menlo, monospace" font-size="${fontSize}" font-weight="400" xml:space="preserve">
${body}
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal GIF89a encoder for palette frames (RGBA → grayscale-ish) */
export async function encodeGif(
  frames: ImageData[],
  delayCs: number // centiseconds
): Promise<Blob> {
  // Dynamic import optional pure encoder — use built-in minimal path
  const { encodeGifFrames } = await import("./gif-encode");
  return encodeGifFrames(frames, delayCs);
}
