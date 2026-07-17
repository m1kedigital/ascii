import sharp from "sharp";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, "../app");

function blockGridSvg(size, bg = "#0a0a0c", fg = "#f2f2f3") {
  const pad = size * 0.18;
  const gap = size * 0.06;
  const cell = (size - pad * 2 - gap * 2) / 3;
  const opacities = [
    [1, 0.55, 0.25],
    [0.55, 1, 0.55],
    [0.25, 0.55, 1],
  ];
  let cells = "";
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = pad + col * (cell + gap);
      const y = pad + row * (cell + gap);
      const o = opacities[row][col];
      cells += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="${fg}" opacity="${o}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  ${cells}
</svg>`;
}

async function generateAppleIcon() {
  const svg = blockGridSvg(180);
  await sharp(Buffer.from(svg)).png().toFile(join(appDir, "apple-icon.png"));
  console.log("✓ apple-icon.png");
}

async function generateFaviconPng() {
  const svg = blockGridSvg(64);
  await sharp(Buffer.from(svg)).png().toFile(join(appDir, "icon.png"));
  console.log("✓ icon.png");
}

async function generateOGImage() {
  const W = 1200;
  const H = 630;
  // ASCII-like density field as pure geometry
  const cols = 48;
  const rows = 22;
  const padX = 80;
  const padY = 100;
  const cellW = (W - padX * 2) / cols;
  const cellH = (H - padY * 2 - 80) / rows;

  // Simple radial falloff "portrait" blob for visual interest
  const cx = W * 0.38;
  const cy = H * 0.48;
  let dots = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * cellW + cellW / 2;
      const y = padY + r * cellH + cellH / 2;
      const dx = (x - cx) / (W * 0.28);
      const dy = (y - cy) / (H * 0.32);
      const d = Math.sqrt(dx * dx + dy * dy);
      const noise = ((c * 17 + r * 31) % 10) / 40;
      const density = Math.max(0, 1 - d + noise);
      if (density < 0.18) continue;
      const size = 1.2 + density * 5.5;
      const opacity = 0.25 + density * 0.75;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(2)}" fill="#f2f2f3" opacity="${opacity.toFixed(2)}"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#0a0a0c"/>
  ${dots}
  <text x="720" y="280" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="72" font-weight="600" fill="#f2f2f3" letter-spacing="0.08em">ASCII</text>
  <text x="720" y="330" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="20" font-weight="500" fill="#8a8a93" letter-spacing="0.12em">PHOTO TO TYPE LAB</text>
  <text x="720" y="520" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="16" fill="#5c5c66" letter-spacing="0.06em">by m1ke.digital</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(join(appDir, "opengraph-image.png"));
  console.log("✓ opengraph-image.png");
}

// Also write icon.svg for completeness
function writeIconSvg() {
  writeFileSync(join(appDir, "icon.svg"), blockGridSvg(32));
  console.log("✓ icon.svg");
}

(async () => {
  try {
    writeIconSvg();
    await generateAppleIcon();
    await generateFaviconPng();
    await generateOGImage();
    console.log("\n✓ All brand assets generated");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
