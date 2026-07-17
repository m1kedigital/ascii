/**
 * OG for Telegram / iMessage / Twitter — must read at ~400px wide.
 * Bold photo + coarse ASCII blocks + huge type. No fine noise.
 *
 * node scripts/generate-og.mjs
 */
import { createCanvas, loadImage } from "canvas";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
// Strong subject + geometry — works as coarse ASCII
const samplePath = join(root, "public/samples/01-architecture.jpg");
const outPath = join(root, "app/opengraph-image.png");

const W = 1200;
const H = 630;

// Dense ramp for bold block look (dark → light)
const RAMP = " ░▒▓█";

function sampleToBlocks(img, cols, rows) {
  const c = createCanvas(cols, rows);
  const ctx = c.getContext("2d");
  // Cover-crop center
  const scale = Math.max(cols / img.width, rows / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
  const { data } = ctx.getImageData(0, 0, cols, rows);
  const grid = [];
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      let b = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      // Punch contrast so blocks read at thumbnail size
      b = Math.pow(Math.min(1, Math.max(0, (b - 0.15) / 0.7)), 0.85);
      const idx = Math.min(RAMP.length - 1, Math.floor(b * (RAMP.length - 1)));
      row.push({ ch: RAMP[idx], b });
    }
    grid.push(row);
  }
  return grid;
}

async function main() {
  const src = await loadImage(samplePath);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // === Full-bleed photo (cover) ===
  const scale = Math.max(W / src.width, H / src.height);
  const dw = src.width * scale;
  const dh = src.height * scale;
  ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2 - 40, dw, dh);

  // Dark scrim — left readable brand zone + bottom
  const g1 = ctx.createLinearGradient(0, 0, W * 0.72, 0);
  g1.addColorStop(0, "rgba(6,6,8,0.92)");
  g1.addColorStop(0.45, "rgba(6,6,8,0.55)");
  g1.addColorStop(1, "rgba(6,6,8,0.15)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  const g2 = ctx.createLinearGradient(0, H * 0.45, 0, H);
  g2.addColorStop(0, "rgba(6,6,8,0)");
  g2.addColorStop(1, "rgba(6,6,8,0.75)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // === Coarse ASCII panel (right third) — big glyphs, thumbnail-safe ===
  const panelX = 620;
  const panelY = 70;
  const panelW = 520;
  const panelH = 400;
  const cols = 28;
  const rows = 18;
  const grid = sampleToBlocks(src, cols, rows);

  // Panel plate
  ctx.fillStyle = "rgba(8,8,10,0.78)";
  roundRect(ctx, panelX, panelY, panelW, panelH, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  roundRect(ctx, panelX, panelY, panelW, panelH, 10);
  ctx.stroke();

  // Draw blocks as filled squares (not tiny text) — reads on Telegram
  const pad = 18;
  const cellW = (panelW - pad * 2) / cols;
  const cellH = (panelH - pad * 2 - 28) / rows;
  const gap = 1.5;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const { b } = grid[y][x];
      if (b < 0.08) continue;
      const a = 0.2 + b * 0.85;
      ctx.fillStyle = `rgba(242,242,243,${a.toFixed(3)})`;
      const px = panelX + pad + x * cellW + gap / 2;
      const py = panelY + pad + 22 + y * cellH + gap / 2;
      ctx.fillRect(px, py, cellW - gap, cellH - gap);
    }
  }

  // Panel label
  ctx.font = "600 12px ui-monospace, Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("OUTPUT", panelX + pad, panelY + 22);

  // === Brand left ===
  ctx.fillStyle = "#f2f2f3";
  ctx.font = "600 78px ui-monospace, Menlo, monospace";
  ctx.fillText("ASCII", 56, 200);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 20px ui-monospace, Menlo, monospace";
  ctx.fillText("PHOTO  →  TYPE  LAB", 56, 250);

  // Value chips
  const chips = ["CLIENT-SIDE", "NO UPLOAD", "PNG · SVG · GIF"];
  let chipX = 56;
  ctx.font = "500 12px ui-monospace, Menlo, monospace";
  for (const chip of chips) {
    const tw = ctx.measureText(chip).width;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, chipX, 280, tw + 20, 30, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(242,242,243,0.75)";
    ctx.fillText(chip, chipX + 10, 300);
    chipX += tw + 32;
  }

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "400 16px ui-monospace, Menlo, monospace";
  ctx.fillText("by m1ke.digital", 56, H - 48);

  // Outer hairline
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  const buf = canvas.toBuffer("image/png");
  await sharp(buf)
    .png({ compressionLevel: 8, quality: 90 })
    .toFile(outPath);

  console.log("✓ opengraph-image.png", outPath);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
