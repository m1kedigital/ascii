import { AsciiSettings } from "@/components/AsciiConverter";

const CHARSETS = {
  standard: "`·.:-=+*#%@",
  dense: "░▒▓█",
  blocks: "░▒▓█",
  binary: "01",
  dots: "·•●",
};

// Convert RGB to HSL
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

// Convert HSL to RGB
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

export function imageToASCII(
  img: HTMLImageElement,
  settings: AsciiSettings
): { ascii: string; colors: (string | null)[][] } {
  // Create canvas to read image data
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Check if image loaded properly
  if (img.width === 0 || img.height === 0) {
    console.error("Image has invalid dimensions:", img.width, img.height);
    return { ascii: "", colors: [] };
  }

  // Set canvas size proportional to input image (preserves aspect ratio)
  const scale = settings.cellSize / 4; // Base scale for readable ASCII
  canvas.width = Math.max(40, Math.floor(img.width / scale));
  canvas.height = Math.max(20, Math.floor(img.height / scale));

  // Draw white background first (important for PNG with transparency like screenshots)
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw image on canvas
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = imageData.data;

  // Analyze average brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    totalBrightness += brightness;
  }
  const avgBrightness = totalBrightness / (data.length / 4);
  console.log("Average image brightness:", avgBrightness.toFixed(2));

  // If image is too dark, enhance it aggressively
  if (avgBrightness < 0.35) {
    console.log("Image too dark, applying aggressive enhancement");
    // Enhance dark images
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      const a = data[i + 3];

      // Skip fully transparent pixels
      if (a === 0) continue;

      // Aggressive brightness boost for very dark images
      const brightnessFactor = avgBrightness < 0.15 ? 2.0 : 1.6;
      r = Math.min(255, r * brightnessFactor);
      g = Math.min(255, g * brightnessFactor);
      b = Math.min(255, b * brightnessFactor);

      // Strong contrast increase
      const contrast = avgBrightness < 0.15 ? 2.0 : 1.8;
      const mid = 128;
      r = Math.max(0, Math.min(255, (r - mid) * contrast + mid));
      g = Math.max(0, Math.min(255, (g - mid) * contrast + mid));
      b = Math.max(0, Math.min(255, (b - mid) * contrast + mid));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    // Put enhanced data back
    ctx.putImageData(imageData, 0, 0);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    data = imageData.data;
  }

  const charset = CHARSETS[settings.charset];
  const width = canvas.width;
  const height = canvas.height;

  // Vertical step based on tileAspect (how many rows per ASCII line)
  const verticalStep = 1 / settings.tileAspect;

  let ascii = "";
  const colors: (string | null)[][] = [];

  for (let i = 0; i < height; i += verticalStep) {
    let colorRow: (string | null)[] = [];
    const rowIdx = Math.floor(i);

    for (let j = 0; j < width; j++) {
      const pixelIndex = (rowIdx * width + j) * 4;
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
          // Ensure minimum luminance of 0.35 for readability on dark background
          if (luminance < 0.35) {
            // Convert to HSL, boost L, convert back
            const [h, s, l] = rgbToHsl(r, g, b);
            const boostedL = Math.max(l, 0.35);
            [adjustedR, adjustedG, adjustedB] = hslToRgb(h, s, boostedL);
          }
        } else if (settings.background === "white") {
          // Ensure maximum luminance of 0.75 for readability on light background
          if (luminance > 0.75) {
            // Convert to HSL, reduce L, convert back
            const [h, s, l] = rgbToHsl(r, g, b);
            const cappedL = Math.min(l, 0.75);
            [adjustedR, adjustedG, adjustedB] = hslToRgb(h, s, cappedL);
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
