"use client";

import { useEffect, useRef, useState } from "react";
import { AsciiSettings } from "./AsciiConverter";
import AsciiPreview from "./AsciiPreview";
import MobileControlsSheet from "./MobileControlsSheet";
import MobileExportSheet from "./MobileExportSheet";
import ConfirmationDialog from "./ConfirmationDialog";

interface MobileLayoutProps {
  asciiData: string;
  asciiColors: (string | null)[][];
  settings: AsciiSettings;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onSettingsChange: (settings: AsciiSettings) => void;
  onExport: (format: "png" | "jpg") => void;
  onClear: () => void;
}

export default function MobileLayout({
  asciiData,
  asciiColors,
  settings,
  canvasRef,
  onSettingsChange,
  onExport,
  onClear,
}: MobileLayoutProps) {
  const [showControlsSheet, setShowControlsSheet] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearConfirm = () => {
    setShowClearConfirm(false);
    onClear();
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Full-screen preview with safe-area padding */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto"
        style={{
          paddingTop: "max(8px, env(safe-area-inset-top))",
          paddingRight: "max(8px, env(safe-area-inset-right))",
          paddingLeft: "max(8px, env(safe-area-inset-left))",
          paddingBottom: "0px",
        }}
      >
        <div className="w-full flex items-center justify-center" style={{ minHeight: "100%" }}>
          <AsciiPreview
            asciiData={asciiData}
            asciiColors={asciiColors}
            settings={settings}
            canvasRef={canvasRef}
          />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="flex gap-0 border-t"
        style={{
          height: "56px",
          backgroundColor: "#0a0a0a",
          borderTopColor: "rgba(255, 255, 255, 0.1)",
          paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        }}
      >
        <button
          onClick={() => setShowControlsSheet(true)}
          className="flex-1 flex items-center justify-center text-xs font-medium tracking-wider uppercase hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          style={{ minHeight: "44px" }}
        >
          Controls
        </button>
        <button
          onClick={() => setShowExportSheet(true)}
          className="flex-1 flex items-center justify-center text-xs font-medium tracking-wider uppercase hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          style={{ minHeight: "44px" }}
        >
          Export
        </button>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex-1 flex items-center justify-center text-xs font-medium tracking-wider uppercase hover:bg-[rgba(255,255,255,0.05)] transition-colors text-red-400"
          style={{ minHeight: "44px" }}
        >
          Clear
        </button>
      </div>

      {/* Bottom Sheets */}
      {showControlsSheet && (
        <MobileControlsSheet
          settings={settings}
          onSettingsChange={onSettingsChange}
          onClose={() => setShowControlsSheet(false)}
        />
      )}

      {showExportSheet && (
        <MobileExportSheet
          settings={settings}
          onSettingsChange={onSettingsChange}
          onExport={onExport}
          onClose={() => setShowExportSheet(false)}
        />
      )}

      {/* Confirmation Dialog */}
      {showClearConfirm && (
        <ConfirmationDialog
          title="Clear image?"
          message="This will remove the image and return to the upload screen."
          confirmText="Clear"
          cancelText="Cancel"
          onConfirm={handleClearConfirm}
          onCancel={() => setShowClearConfirm(false)}
          isDangerous
        />
      )}
    </div>
  );
}
