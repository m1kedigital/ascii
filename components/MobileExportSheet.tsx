"use client";

import { useEffect, useRef } from "react";
import type { AsciiSettings } from "@/lib/types";

interface MobileExportSheetProps {
  settings: AsciiSettings;
  onSettingsChange: (settings: AsciiSettings) => void;
  onExport: (format: "png" | "jpg" | "svg") => void;
  onCopyText: () => void;
  onCopyLink: () => void;
  onPrintPack: () => void;
  onGifLoop: () => void;
  exportingGif?: boolean;
  onClose: () => void;
  hasImage: boolean;
}

export default function MobileExportSheet({
  settings,
  onSettingsChange,
  onExport,
  onCopyText,
  onCopyLink,
  onPrintPack,
  onGifLoop,
  exportingGif = false,
  onClose,
  hasImage,
}: MobileExportSheetProps) {
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

  const run = (fn: () => void) => {
    fn();
    setTimeout(onClose, 150);
  };

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: "60dvh" }}>
        <div className="sheet-handle">
          <span />
        </div>
        <div className="sheet-header">
          <h2>Export</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="sheet-body" ref={bodyRef}>
          <section className="section">
            <div className="section-label">Scale</div>
            <div className="seg">
              {([1, 2, 4] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`seg-btn${settings.exportSize === size ? " active" : ""}`}
                  onClick={() =>
                    onSettingsChange({ ...settings, exportSize: size })
                  }
                >
                  {size}×
                </button>
              ))}
            </div>
          </section>
          <section className="section">
            <div className="btn-stack">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!hasImage}
                style={{ minHeight: 44 }}
                onClick={() => run(() => void onExport("png"))}
              >
                Export PNG
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!hasImage}
                style={{ minHeight: 44 }}
                onClick={() => run(() => void onExport("jpg"))}
              >
                Export JPG
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!hasImage}
                style={{ minHeight: 44 }}
                onClick={() => run(() => void onExport("svg"))}
              >
                Export SVG
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!hasImage}
                style={{ minHeight: 44 }}
                onClick={() => run(onCopyText)}
              >
                Copy text
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minHeight: 44 }}
                onClick={() => run(() => void onCopyLink())}
              >
                Copy link
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!hasImage}
                style={{ minHeight: 44 }}
                onClick={() => run(() => void onPrintPack())}
              >
                Print pack 4×
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!hasImage || exportingGif}
                style={{ minHeight: 44 }}
                onClick={() => {
                  void onGifLoop();
                  setTimeout(onClose, 200);
                }}
              >
                {exportingGif ? "GIF…" : "GIF loop"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
