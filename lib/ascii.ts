import { AsciiSettings } from "@/components/AsciiConverter";

const CHARSETS = {
  standard: "`·.:-=+*#%@",
  dense: "░▒▓█",
  blocks: "░▒▓█",
  binary: "01",
  dots: "·•●",
};

export function imageToASCII(
  img: HTMLImageElement,
  settings: AsciiSettings
): { ascii: string; colors: (string | null)[][] } {
  // Create canvas to read image data
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Set canvas size with tileAspect compensation for vertical stretching
  const scale = settings.cellSize / 4; // Base scale for readable ASCII
  canvas.width = Math.max(40, Math.floor(img.width / scale));
  // Adjust height by tileAspect to compensate for character height-to-width ratio
  canvas.height = Math.max(20, Math.floor((img.height / scale) * settings.tileAspect));

  // Draw image on canvas
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const charset = CHARSETS[settings.charset];
  const width = canvas.width;
  const height = canvas.height;

  let ascii = "";
  const colors: (string | null)[][] = [];
  let colorRow: (string | null)[] = [];

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const pixelIndex = (i * width + j) * 4;
      let r = data[pixelIndex];
      let g = data[pixelIndex + 1];
      let b = data[pixelIndex + 2];
      const a = data[pixelIndex + 3];

      // Calculate brightness (0-1)
      let brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

      // Apply alpha channel
      brightness = brightness * (a / 255);

      // Apply cut darks (lift shadows)
      if (brightness < settings.cutDarks) {
        brightness = settings.cutDarks;
      }

      // Apply cut lights (clip highlights)
      if (brightness > 1 - settings.cutLights) {
        brightness = 1 - settings.cutLights;
      }

      // Remap brightness to 0-1 range
      brightness = Math.max(0, Math.min(1, brightness));

      // Apply contrast
      brightness = Math.pow(brightness, 1 / settings.contrast);

      // Final clamp
      brightness = Math.max(0, Math.min(1, brightness));

      // Select character based on brightness
      const charIndex = Math.floor(brightness * (charset.length - 1));
      const char = charset[charIndex];

      ascii += char;

      // Store color based on mode
      let color: string | null = null;
      if (settings.colorMode === "preserve" && a > 0) {
        // Calculate luminance for contrast checking
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        let adjustedR = r;
        let adjustedG = g;
        let adjustedB = b;

        if (settings.background === "black" || settings.background === "transparent") {
          // Ensure minimum luminance of 0.25 for readability on dark background
          if (luminance < 0.25) {
            const scale = 0.25 / Math.max(luminance, 0.01);
            adjustedR = Math.min(255, Math.floor(r * scale));
            adjustedG = Math.min(255, Math.floor(g * scale));
            adjustedB = Math.min(255, Math.floor(b * scale));
          }
        } else if (settings.background === "white") {
          // Ensure maximum luminance of 0.75 for readability on light background
          if (luminance > 0.75) {
            const scale = 0.75 / Math.max(luminance, 0.01);
            adjustedR = Math.floor(r * scale);
            adjustedG = Math.floor(g * scale);
            adjustedB = Math.floor(b * scale);
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
    colorRow = [];
  }

  return { ascii, colors };
}
