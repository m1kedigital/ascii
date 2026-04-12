import { AsciiSettings } from "@/components/AsciiConverter";

export function renderAsciiToCanvas(
  canvas: HTMLCanvasElement,
  asciiData: string,
  asciiColors: (string | null)[][],
  settings: AsciiSettings
): void {
  const ctx = canvas.getContext("2d")!;

  // Font metrics
  const fontSize = settings.cellSize;
  const fontFamily = "IBM Plex Mono, monospace";
  const lineHeight = fontSize * 1.2;
  const charWidth = fontSize * 0.6; // Monospace char width is roughly 0.6 of font size

  // Calculate canvas dimensions
  const lines = asciiData.trim().split("\n");
  const maxWidth = Math.max(...lines.map((line) => line.length));

  const canvasWidth = maxWidth * charWidth + 40; // 20px padding on each side
  const canvasHeight = lines.length * lineHeight + 40;

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
