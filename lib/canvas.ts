import type { AsciiSettings } from "@/lib/types";

// iOS Safari limits canvas to ~16.7MP. Use conservative limit.
const MAX_CANVAS_PIXELS = 12_000_000;

export function renderAsciiToCanvas(
  canvas: HTMLCanvasElement,
  asciiData: string,
  asciiColors: (string | null)[][],
  settings: AsciiSettings
): void {
  const ctx = canvas.getContext("2d")!;

  // Font metrics
  let fontSize = settings.cellSize;
  const fontFamily = "IBM Plex Mono, monospace";

  // Calculate canvas dimensions
  const lines = asciiData.trim().split("\n");
  const maxWidth = Math.max(...lines.map((line) => line.length));

  let charWidth = fontSize * 0.6;
  let lineHeight = fontSize * 1.2;

  let canvasWidth = maxWidth * charWidth + 40;
  let canvasHeight = lines.length * lineHeight + 40;

  // Check if canvas exceeds mobile pixel limit and scale down if needed
  const totalPixels = canvasWidth * canvasHeight * settings.exportSize * settings.exportSize;
  if (totalPixels > MAX_CANVAS_PIXELS) {
    const scale = Math.sqrt(MAX_CANVAS_PIXELS / totalPixels);
    fontSize = Math.max(2, fontSize * scale);
    charWidth = fontSize * 0.6;
    lineHeight = fontSize * 1.2;
    canvasWidth = maxWidth * charWidth + 40;
    canvasHeight = lines.length * lineHeight + 40;
  }

  canvas.width = canvasWidth * settings.exportSize;
  canvas.height = canvasHeight * settings.exportSize;

  // Scale context for export size
  ctx.scale(settings.exportSize, settings.exportSize);

  // Set background
  let bgColor = settings.background === "transparent" ? "transparent" : "#ffffff";
  if (settings.background === "black") {
    bgColor = "#000000";
  }

  if (bgColor !== "transparent") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Draw text
  ctx.font = `400 ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";

  let yPos = 20;
  let lineIndex = 0;

  for (const line of lines) {
    let xPos = 20;

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      const color = asciiColors[lineIndex]?.[charIndex];

      // Set color based on mode
      if (color) {
        ctx.fillStyle = color;
      } else {
        ctx.fillStyle = settings.background === "white" ? "#000000" : "#ffffff";
      }

      ctx.fillText(char, xPos, yPos);
      xPos += charWidth;
    }

    yPos += lineHeight;
    lineIndex++;
  }
}
