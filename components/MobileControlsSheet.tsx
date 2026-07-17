"use client";

import { useEffect, useRef } from "react";
import type { AsciiSettings, SampleImage } from "@/lib/types";
import Controls from "./Controls";

interface MobileControlsSheetProps {
  settings: AsciiSettings;
  onSettingsChange: (settings: AsciiSettings) => void;
  sourceLabel: string;
  activeSampleId: string | null;
  activePresetId: string | null;
  onUploadClick: () => void;
  onSampleSelect: (sample: SampleImage) => void;
  onPresetSelect: (presetId: string) => void;
  onExport: (format: "png" | "jpg") => void;
  onCopyText: () => void;
  onRandomize: () => void;
  hasImage: boolean;
  onClose: () => void;
}

export default function MobileControlsSheet({
  settings,
  onSettingsChange,
  sourceLabel,
  activeSampleId,
  activePresetId,
  onUploadClick,
  onSampleSelect,
  onPresetSelect,
  onExport,
  onCopyText,
  onRandomize,
  hasImage,
  onClose,
}: MobileControlsSheetProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let startY = 0;
    const content = bodyRef.current;
    if (!content) return;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY || 0;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY || 0;
      if (endY - startY > 50 && content.scrollTop === 0) onClose();
    };

    content.addEventListener("touchstart", handleTouchStart, { passive: true });
    content.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      content.removeEventListener("touchstart", handleTouchStart);
      content.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onClose]);

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle">
          <span />
        </div>
        <div className="sheet-header">
          <h2>Controls</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="sheet-body" ref={bodyRef}>
          <Controls
            settings={settings}
            onSettingsChange={onSettingsChange}
            sourceLabel={sourceLabel}
            activeSampleId={activeSampleId}
            activePresetId={activePresetId}
            onUploadClick={() => {
              onUploadClick();
            }}
            onSampleSelect={(s) => {
              onSampleSelect(s);
            }}
            onPresetSelect={onPresetSelect}
            onExport={onExport}
            onCopyText={onCopyText}
            onRandomize={onRandomize}
            hasImage={hasImage}
            compact
          />
        </div>
      </div>
    </>
  );
}
