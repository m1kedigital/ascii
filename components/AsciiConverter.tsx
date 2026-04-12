"use client";

import { useEffect, useRef, useState } from "react";
import { imageToASCII } from "@/lib/ascii";
import Controls from "./Controls";
import AsciiPreview from "./AsciiPreview";

export interface AsciiSettings {
  charset: "standard" | "dense" | "blocks" | "binary" | "dots";
  cellSize: number;
  tileAspect: number;
  contrast: number;
  cutDarks: number;
  cutLights: number;
  colorMode: "mono" | "preserve" | "invert";
  background: "white" | "black" | "transparent";
  exportSize: 1 | 2 | 4;
}

interface AsciiConverterProps {
  imageData: string;
  onClear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function AsciiConverter({
  imageData,
  onClear,
  fileInputRef,
}: AsciiConverterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [settings, setSettings] = useState<AsciiSettings>({
    charset: "standard",
    cellSize: 10,
    tileAspect: 0.55,
    contrast: 1,
    cutDarks: 0.02,
    cutLights: 0.0,
    colorMode: "mono",
    background: "black",
    exportSize: 1,
  });
  const [asciiData, setAsciiData] = useState<string>("");
  const [asciiColors, setAsciiColors] = useState<(string | null)[][]>([]);

  // Load and process image on mount or when imageData changes
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const { ascii, colors } = imageToASCII(img, settings);
      setAsciiData(ascii);
      setAsciiColors(colors);
    };
    img.src = imageData;
  }, [imageData, settings]);

  const handleExport = (format: "png" | "jpg") => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.href = canvas.toDataURL(`image/${format}`);
    link.download = `ascii-art.${format}`;
    link.click();
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Preview Section */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <AsciiPreview
          asciiData={asciiData}
          asciiColors={asciiColors}
          settings={settings}
          canvasRef={canvasRef}
        />
      </div>

      {/* Controls Section */}
      <div className="w-80 border-l border-[rgba(255,255,255,0.2)] bg-[#0a0a0a] flex flex-col overflow-auto">
        <Controls
          settings={settings}
          onSettingsChange={setSettings}
          onExport={handleExport}
          onClear={onClear}
        />
      </div>
    </div>
  );
}
