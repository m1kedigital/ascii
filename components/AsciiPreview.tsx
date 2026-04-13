"use client";

import { useEffect } from "react";
import { AsciiSettings } from "./AsciiConverter";
import { renderAsciiToCanvas } from "@/lib/canvas";

interface AsciiPreviewProps {
  asciiData: string;
  asciiColors: (string | null)[][];
  settings: AsciiSettings;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isMobile?: boolean;
}

export default function AsciiPreview({
  asciiData,
  asciiColors,
  settings,
  canvasRef,
  isMobile = false,
}: AsciiPreviewProps) {
  useEffect(() => {
    if (canvasRef.current && asciiData) {
      renderAsciiToCanvas(
        canvasRef.current,
        asciiData,
        asciiColors,
        settings
      );
    }
  }, [asciiData, asciiColors, settings, canvasRef]);

  return (
    <div
      className="relative border border-[rgba(255,255,255,0.2)] bg-[#000000] p-4 flex items-center justify-center max-w-full overflow-auto"
      style={{
        maxHeight: isMobile ? "100%" : "calc(100vh - 120px)",
      }}
    >
      {/* Corner markers */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white opacity-50"></div>
      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white opacity-50"></div>
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white opacity-50"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white opacity-50"></div>

      <canvas
        ref={canvasRef}
        style={{
          imageRendering: "pixelated",
          display: "block",
          maxWidth: "100%",
          maxHeight: "100%",
          margin: "auto",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
