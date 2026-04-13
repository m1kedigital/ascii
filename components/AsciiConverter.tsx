"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { imageToASCII } from "@/lib/ascii";
import Controls from "./Controls";
import AsciiPreview from "./AsciiPreview";
import MobileLayout from "./MobileLayout";

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
    contrast: 1.2,
    cutDarks: 0,
    cutLights: 0.0,
    colorMode: "mono",
    background: "black",
    exportSize: 1,
  });
  const [asciiData, setAsciiData] = useState<string>("");
  const [asciiColors, setAsciiColors] = useState<(string | null)[][]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Load and process image on mount or when imageData changes
  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      try {
        const { ascii, colors } = imageToASCII(img, settings);
        setAsciiData(ascii);
        setAsciiColors(colors);
      } catch (err) {
        console.error("Error processing image:", err);
        setAsciiData("");
        setAsciiColors([]);
      }
    };

    img.onerror = () => {
      console.error("Failed to load image");
      setAsciiData("");
      setAsciiColors([]);
    };

    img.src = imageData;
  }, [imageData, settings]);

  // Detect mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSettingsChange = useCallback((newSettings: AsciiSettings) => {
    setSettings(newSettings);
  }, []);

  const handleExport = (format: "png" | "jpg") => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const mimeType = `image/${format}`;

    // Use toBlob for better mobile support
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          // Fallback to toDataURL
          const link = document.createElement("a");
          link.href = canvas.toDataURL(mimeType);
          link.download = `ascii-art.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ascii-art.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      mimeType,
      format === "jpg" ? 0.95 : undefined
    );
  };

  if (isMobile) {
    return (
      <MobileLayout
        asciiData={asciiData}
        asciiColors={asciiColors}
        settings={settings}
        canvasRef={canvasRef}
        onSettingsChange={handleSettingsChange}
        onExport={handleExport}
        onClear={onClear}
      />
    );
  }

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
          onSettingsChange={handleSettingsChange}
          onExport={handleExport}
          onClear={onClear}
          isMobile={false}
        />
      </div>
    </div>
  );
}
