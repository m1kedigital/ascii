/**
 * Premium OG: real sample photo | real ASCII conversion.
 * Usage: node scripts/generate-og.mjs
 */
import { createCanvas, loadImage, registerFont } from "canvas";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const samplePath = join(root, "public/samples/02-street.jpg");
const outPath = join(root, "app/opengraph-image.png");

const W = 1200;
const H = 630;
const CHARSET = " .:-=+*#%@";
const CELL = 7; // source sample step in px (on resized work image)
const FONT = 9;

function imageToAsciiGrid(img, maxCols = 70) {
  const aspect = img.height / img.width;
  const cols = maxCols;
  const rows = Math.max(12, Math.round(cols * aspect * 0.48));
  const c = createCanvas(cols, rows);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, cols, rows);
  const { data } = ctx.getImageData(0, 0, cols, rows);
  const lines = [];
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const b = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      // contrast boost
      const t = Math.pow(Math.min(1, Math.max(0, b)), 0.75);
      const idx = Math.min(CHARSET.length - 1, Math.floor(t * (CHARSET.length - 1)));
      line += CHARSET[idx];
    }
    lines.push(line);
  }
  return lines;
}

async function main() {
  const src = await loadImage(samplePath);

  // Full canvas
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, W, H);

  // --- LEFT: photo (cover, 560 wide) ---
  const leftW = 560;
  const scale = Math.max(leftW / src.width, H / src.height);
  const sw = src.width * scale;
  const sh = src.height * scale;
  const sx = (leftW - sw) / 2;
  const sy = (H - sh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, leftW, H);
  ctx.clip();
  ctx.drawImage(src, sx, sy, sw, sh);
  // subtle vignette
  const vg = ctx.createLinearGradient(leftW - 80, 0, leftW, 0);
  vg.addColorStop(0, "rgba(10,10,12,0)");
  vg.addColorStop(1, "rgba(10,10,12,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(leftW - 80, 0, 80, H);
  ctx.restore();

  // Label ORIGINAL
  ctx.font = "500 11px ui-monospace, Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("ORIGINAL", 28, 36);

  // --- RIGHT: ASCII panel ---
  const rightX = leftW;
  const rightW = W - leftW;
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(rightX, 0, rightW, H);

  // Work image for ASCII — portrait crop of face area roughly center
  const work = createCanvas(480, 640);
  const wctx = work.getContext("2d");
  const ws = Math.max(480 / src.width, 640 / src.height);
  wctx.drawImage(
    src,
    (480 - src.width * ws) / 2,
    (640 - src.height * ws) / 2 - 40,
    src.width * ws,
    src.height * ws
  );

  const lines = imageToAsciiGrid(work, 62);
  ctx.font = `400 ${FONT}px ui-monospace, Menlo, Monaco, monospace`;
  ctx.fillStyle = "#e8e8ea";
  ctx.textBaseline = "top";

  const charW = FONT * 0.62;
  const lineH = FONT * 1.05;
  const gridW = lines[0].length * charW;
  const gridH = lines.length * lineH;
  // place ASCII block upper-center of right panel, leave room for type below
  const asciiX = rightX + (rightW - gridW) / 2;
  const asciiY = 48;

  for (let i = 0; i < lines.length; i++) {
    // slight fade at edges for polish
    ctx.globalAlpha = 0.92;
    ctx.fillText(lines[i], asciiX, asciiY + i * lineH);
  }
  ctx.globalAlpha = 1;

  // Label ASCII
  ctx.font = "500 11px ui-monospace, Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("ASCII", rightX + 28, 36);

  // --- Brand block bottom-right ---
  const brandY = H - 110;
  ctx.font = "600 52px ui-monospace, Menlo, monospace";
  ctx.fillStyle = "#f2f2f3";
  ctx.letterSpacing = "0.06em";
  ctx.fillText("ASCII", rightX + 40, brandY);

  ctx.font = "500 15px ui-monospace, Menlo, monospace";
  ctx.fillStyle = "#8a8a93";
  ctx.fillText("PHOTO TO TYPE LAB", rightX + 40, brandY + 48);

  ctx.font = "400 13px ui-monospace, Menlo, monospace";
  ctx.fillStyle = "#5c5c66";
  ctx.fillText("by m1ke.digital", rightX + 40, brandY + 74);

  // Divider line
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftW + 0.5, 24);
  ctx.lineTo(leftW + 0.5, H - 24);
  ctx.stroke();

  // Thin outer frame (subtle)
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  const buf = canvas.toBuffer("image/png");
  // Re-encode via sharp for optimized PNG
  await sharp(buf).png({ compressionLevel: 9 }).toFile(outPath);
  console.log("✓ opengraph-image.png", outPath, `${(buf.length / 1024).toFixed(0)}KB raw`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
