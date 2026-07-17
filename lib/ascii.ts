import { resolveCharset, type AsciiSettings } from "@/lib/types";

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Bayer 8×8 ordered dither matrix, normalized 0–1 thresholds
const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((v) => (v + 0.5) / 64));

function applyTone(
  brightness: number,
  settings: AsciiSettings
): number {
  let b = brightness;
  if (b < settings.cutDarks) b = settings.cutDarks;
  if (b > 1 - settings.cutLights) b = 1 - settings.cutLights;
  b = Math.max(0, Math.min(1, b));
  b = Math.pow(b, 1 / settings.contrast);
  return Math.max(0, Math.min(1, b));
}

export function imageToASCII(
  img: HTMLImageElement,
  settings: AsciiSettings,
  maxColumns?: number
): { ascii: string; colors: (string | null)[][] } {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  if (img.width === 0 || img.height === 0) {
    return { ascii: "", colors: [] };
  }

  const scale = settings.cellSize / 4;
  canvas.width = Math.max(40, Math.floor(img.width / scale));
  canvas.height = Math.max(20, Math.floor(img.height / scale));

  if (maxColumns && canvas.width > maxColumns) {
    const ratio = maxColumns / canvas.width;
    canvas.height = Math.max(20, Math.floor(canvas.height * ratio));
    canvas.width = maxColumns;
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = imageData.data;

  let totalBrightness = 0;
  let pixelCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    pixelCount++;
  }
  const avgBrightness = totalBrightness / pixelCount;

  if (avgBrightness < 0.15) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    ctx.putImageData(imageData, 0, 0);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    data = imageData.data;
  } else if (avgBrightness < 0.35) {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      const a = data[i + 3];
      if (a === 0) continue;
      const brightnessFactor = 1.6;
      r = Math.min(255, r * brightnessFactor);
      g = Math.min(255, g * brightnessFactor);
      b = Math.min(255, b * brightnessFactor);
      const contrast = 1.8;
      const mid = 128;
      r = Math.max(0, Math.min(255, (r - mid) * contrast + mid));
      g = Math.max(0, Math.min(255, (g - mid) * contrast + mid));
      b = Math.max(0, Math.min(255, (b - mid) * contrast + mid));
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    ctx.putImageData(imageData, 0, 0);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    data = imageData.data;
  }

  const charset = resolveCharset(settings);
  const width = canvas.width;
  const height = canvas.height;
  const verticalStep = 1 / settings.tileAspect;
  const levels = charset.length;

  // Precompute brightness grid for dither (row-major at sampling positions)
  type Cell = { b: number; r: number; g: number; bl: number; a: number };
  const rowIndices: number[] = [];
  for (let i = 0; i < height; i += verticalStep) rowIndices.push(Math.floor(i));
  const nRows = rowIndices.length;
  const nCols = width;

  const cells: Cell[][] = [];
  for (let ry = 0; ry < nRows; ry++) {
    const rowIdx = rowIndices[ry];
    const row: Cell[] = [];
    for (let j = 0; j < nCols; j++) {
      const pixelIndex = (rowIdx * width + j) * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const a = data[pixelIndex + 3];
      let brightness = ((r * 0.299 + g * 0.587 + b * 0.114) / 255) * (a / 255);
      brightness = applyTone(brightness, settings);
      row.push({ b: brightness, r, g, bl: b, a });
    }
    cells.push(row);
  }

  // Floyd–Steinberg on brightness grid
  if (settings.dither === "floyd") {
    for (let y = 0; y < nRows; y++) {
      for (let x = 0; x < nCols; x++) {
        const old = cells[y][x].b;
        const q = Math.round(old * (levels - 1)) / (levels - 1);
        const err = old - q;
        cells[y][x].b = q;
        if (x + 1 < nCols) cells[y][x + 1].b = clamp01(cells[y][x + 1].b + err * (7 / 16));
        if (y + 1 < nRows) {
          if (x > 0) cells[y + 1][x - 1].b = clamp01(cells[y + 1][x - 1].b + err * (3 / 16));
          cells[y + 1][x].b = clamp01(cells[y + 1][x].b + err * (5 / 16));
          if (x + 1 < nCols)
            cells[y + 1][x + 1].b = clamp01(cells[y + 1][x + 1].b + err * (1 / 16));
        }
      }
    }
  }

  let ascii = "";
  const colors: (string | null)[][] = [];

  for (let ry = 0; ry < nRows; ry++) {
    const colorRow: (string | null)[] = [];
    for (let j = 0; j < nCols; j++) {
      const cell = cells[ry][j];
      let brightness = cell.b;

      if (settings.dither === "ordered") {
        const t = BAYER8[ry % 8][j % 8];
        // Bias continuous tone into nearest level with ordered threshold
        const scaled = brightness * (levels - 1);
        const base = Math.floor(scaled);
        const frac = scaled - base;
        const idx = Math.min(levels - 1, base + (frac > t ? 1 : 0));
        brightness = idx / (levels - 1);
      }

      const charIndex = Math.min(
        levels - 1,
        Math.max(0, Math.floor(brightness * (levels - 1)))
      );
      ascii += charset[charIndex];

      let color: string | null = null;
      const { r, g, bl: b, a } = cell;
      if (settings.colorMode === "preserve" && a > 0) {
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        let adjustedR = r;
        let adjustedG = g;
        let adjustedB = b;

        if (
          settings.background === "black" ||
          settings.background === "transparent"
        ) {
          if (luminance < 0.35) {
            const [h, s, l] = rgbToHsl(r, g, b);
            [adjustedR, adjustedG, adjustedB] = hslToRgb(h, s, Math.max(l, 0.35));
          }
        } else if (settings.background === "white") {
          if (luminance > 0.75) {
            const [h, s, l] = rgbToHsl(r, g, b);
            [adjustedR, adjustedG, adjustedB] = hslToRgb(h, s, Math.min(l, 0.75));
          }
        }
        color = `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
      } else if (settings.colorMode === "invert" && a > 0) {
        color = `rgb(${255 - r}, ${255 - g}, ${255 - b})`;
      }

      colorRow.push(color);
    }
    ascii += "\n";
    colors.push(colorRow);
  }

  return { ascii, colors };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
