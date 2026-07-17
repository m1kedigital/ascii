/**
 * Clean dark OG — no full-bleed photo, Inter + JetBrains Mono.
 * node scripts/generate-og.mjs
 */
import { createCanvas, registerFont } from "canvas";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fonts = join(__dirname, "fonts");
const outPath = join(__dirname, "../app/opengraph-image.png");

registerFont(join(fonts, "Inter-SemiBold.ttf"), {
  family: "Inter",
  weight: "600",
});
registerFont(join(fonts, "Inter-Medium.ttf"), {
  family: "Inter",
  weight: "500",
});
registerFont(join(fonts, "JetBrainsMono-Regular.ttf"), {
  family: "JB Mono",
  weight: "400",
});
registerFont(join(fonts, "JetBrainsMono-SemiBold.ttf"), {
  family: "JB Mono",
  weight: "600",
});

const W = 1200;
const H = 630;

async function main() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Pure dark surface
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, W, H);

  // Soft radial glow (no photo)
  const glow = ctx.createRadialGradient(W * 0.72, H * 0.42, 20, W * 0.72, H * 0.42, 380);
  glow.addColorStop(0, "rgba(255,255,255,0.06)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Corner markers (product DNA)
  const m = 40;
  const len = 18;
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1.5;
  // TL
  ctx.beginPath();
  ctx.moveTo(m, m + len);
  ctx.lineTo(m, m);
  ctx.lineTo(m + len, m);
  ctx.stroke();
  // TR
  ctx.beginPath();
  ctx.moveTo(W - m - len, m);
  ctx.lineTo(W - m, m);
  ctx.lineTo(W - m, m + len);
  ctx.stroke();
  // BL
  ctx.beginPath();
  ctx.moveTo(m, H - m - len);
  ctx.lineTo(m, H - m);
  ctx.lineTo(m + len, H - m);
  ctx.stroke();
  // BR
  ctx.beginPath();
  ctx.moveTo(W - m - len, H - m);
  ctx.lineTo(W - m, H - m);
  ctx.lineTo(W - m, H - m - len);
  ctx.stroke();

  // Left brand stack
  ctx.fillStyle = "#f4f4f5";
  ctx.font = "600 92px Inter";
  ctx.fillText("ASCII", 88, 250);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 22px Inter";
  ctx.fillText("Photo to type lab", 92, 300);

  // Mono meta line
  ctx.fillStyle = "#71717a";
  ctx.font = "400 15px JB Mono";
  ctx.fillText("client-side  ·  no upload  ·  png / svg / gif", 92, 348);

  ctx.fillStyle = "#52525b";
  ctx.font = "400 14px JB Mono";
  ctx.fillText("by m1ke.digital", 92, H - 64);

  // Right: geometric block glyph (3×3 mark scaled large) — product icon language
  const markX = 720;
  const markY = 145;
  const cell = 72;
  const gap = 14;
  const opacities = [
    [1, 0.45, 0.18],
    [0.45, 1, 0.45],
    [0.18, 0.45, 1],
  ];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = `rgba(244,244,245,${opacities[r][c]})`;
      ctx.fillRect(markX + c * (cell + gap), markY + r * (cell + gap), cell, cell);
    }
  }

  // Small mono caption under mark
  ctx.fillStyle = "#52525b";
  ctx.font = "400 13px JB Mono";
  ctx.fillText("image → characters", markX, markY + 3 * (cell + gap) + 28);

  // Hairline
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  const buf = canvas.toBuffer("image/png");
  await sharp(buf).png({ compressionLevel: 9 }).toFile(outPath);
  console.log("✓ opengraph-image.png (no photo, Inter + JetBrains Mono)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
