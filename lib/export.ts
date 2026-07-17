import type { AsciiSettings } from "./types";

/** Soft cap — above this, SVG is refused (use PNG). */
export const SVG_MAX_CHARS = 25_000;
/** Hard refuse if estimated serialized size would explode */
export const SVG_MAX_BYTES = 1_500_000; // ~1.5 MB

export function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "art"
  );
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

export type SvgResult =
  | { ok: true; svg: string; bytes: number }
  | { ok: false; reason: string };

/**
 * Compact monospaced SVG.
 * - mono: one <text> + tspans (tiny)
 * - color: run-length spans per row (still capped)
 * Never emits one <text> per character (that caused ~60MB dumps).
 */
export function asciiToSvg(
  asciiData: string,
  asciiColors: (string | null)[][],
  settings: AsciiSettings
): SvgResult {
  const lines = asciiData.trimEnd().split("\n").filter((l, i, a) => l.length || i < a.length - 1);
  const cols = Math.max(...lines.map((l) => l.length), 1);
  const rows = lines.length;
  const totalChars = lines.reduce((n, l) => n + l.length, 0);

  if (totalChars > SVG_MAX_CHARS) {
    return {
      ok: false,
      reason: `SVG too dense (${totalChars.toLocaleString()} chars). Lower density or use PNG.`,
    };
  }

  // Fixed compact font size for SVG (exportSize does not bloat vector text)
  const fontSize = Math.max(6, Math.min(14, settings.cellSize));
  const charW = fontSize * 0.6;
  const lineH = fontSize * 1.15;
  const pad = 16;
  const width = Math.ceil(cols * charW + pad * 2);
  const height = Math.ceil(rows * lineH + pad * 2 + (settings.credit ? 16 : 0));

  let bg = "none";
  if (settings.background === "black") bg = "#000";
  if (settings.background === "white") bg = "#fff";

  const defaultFill =
    settings.background === "white" ? "#000" : "#fff";

  const useColor = settings.colorMode !== "mono";
  let body = "";

  if (!useColor) {
    // Single text, tspans for lines — kilobytes, not megabytes
    const tspans = lines
      .map((line, i) => {
        const y = pad + fontSize + i * lineH;
        return `<tspan x="${pad}" y="${y.toFixed(1)}">${escapeXml(line)}</tspan>`;
      })
      .join("");
    body = `<text fill="${defaultFill}" xml:space="preserve">${tspans}</text>`;
  } else {
    // Run-length encode same-color runs per row
    for (let row = 0; row < lines.length; row++) {
      const line = lines[row];
      const y = pad + fontSize + row * lineH;
      let c = 0;
      while (c < line.length) {
        const fill = asciiColors[row]?.[c] || defaultFill;
        let run = line[c];
        let n = 1;
        while (
          c + n < line.length &&
          (asciiColors[row]?.[c + n] || defaultFill) === fill
        ) {
          run += line[c + n];
          n++;
        }
        const x = pad + c * charW;
        body += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${fill}" xml:space="preserve">${escapeXml(run)}</text>`;
        c += n;
      }
    }
  }

  if (settings.credit) {
    const cy = height - 6;
    body += `<text x="${pad}" y="${cy}" fill="${defaultFill}" font-size="9" opacity=".4">ascii.m1ke.digital</text>`;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${bg}"/><g font-family="ui-monospace,Menlo,monospace" font-size="${fontSize}" font-weight="400">${body}</g></svg>`;

  const bytes = new Blob([svg]).size;
  if (bytes > SVG_MAX_BYTES) {
    return {
      ok: false,
      reason: `SVG would be ~${Math.round(bytes / 1024 / 1024)}MB. Use mono + lower density, or PNG.`,
    };
  }

  return { ok: true, svg, bytes };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function encodeGif(
  frames: ImageData[],
  delayCs: number
): Promise<Blob> {
  const { encodeGifFrames } = await import("./gif-encode");
  return encodeGifFrames(frames, delayCs);
}
