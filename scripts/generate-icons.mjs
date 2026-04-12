import sharp from "sharp";
import { writeFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Generate apple-icon.png (180x180)
async function generateAppleIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
      <rect width="180" height="180" fill="#0a0a0a"/>
      <text x="90" y="95" font-family="monospace" font-size="130" font-weight="600" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">▓</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(`${__dirname}/../app/apple-icon.png`);
  console.log("✓ Generated apple-icon.png");
}

// Generate opengraph-image.png (1200x630)
async function generateOGImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#0a0a0a"/>

      <!-- Corner markers -->
      <line x1="40" y1="56" x2="40" y2="40" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <line x1="40" y1="40" x2="56" y2="40" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>

      <line x1="1160" y1="40" x2="1144" y2="40" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <line x1="1160" y1="40" x2="1160" y2="56" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>

      <line x1="40" y1="590" x2="40" y2="574" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <line x1="40" y1="590" x2="56" y2="590" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>

      <line x1="1160" y1="574" x2="1160" y2="590" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <line x1="1144" y1="590" x2="1160" y2="590" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>

      <!-- Large character -->
      <text x="200" y="315" font-family="monospace" font-size="280" font-weight="600" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">▓</text>

      <!-- Main text -->
      <text x="480" y="200" font-family="monospace" font-size="72" font-weight="600" fill="#ffffff" letter-spacing="0.05em">ASCII</text>

      <!-- Subtext -->
      <text x="480" y="290" font-family="monospace" font-size="18" font-weight="500" fill="#707070" letter-spacing="0.1em">IMAGE TO ASCII ART CONVERTER</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(`${__dirname}/../app/opengraph-image.png`);
  console.log("✓ Generated opengraph-image.png");
}

// Generate both
(async () => {
  try {
    await generateAppleIcon();
    await generateOGImage();
    console.log("\n✓ All icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
    process.exit(1);
  }
})();
