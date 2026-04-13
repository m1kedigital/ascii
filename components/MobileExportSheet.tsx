"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import { AsciiSettings } from "./AsciiConverter";

interface MobileExportSheetProps {
  settings: AsciiSettings;
  onSettingsChange: (settings: AsciiSettings) => void;
  onExport: (format: "png" | "jpg") => void;
  onClose: () => void;
}

export default function MobileExportSheet({
  settings,
  onSettingsChange,
  onExport,
  onClose,
}: MobileExportSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const exportSizes: Array<AsciiSettings["exportSize"]> = useMemo(
    () => [1, 2, 4],
    []
  );

  // Handle swipe down to close
  useEffect(() => {
    let startY = 0;
    const content = contentRef.current;
    if (!content) return;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY || 0;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY || 0;
      const diff = endY - startY;
      if (diff > 50 && content.scrollTop === 0) {
        onClose();
      }
    };

    content.addEventListener("touchstart", handleTouchStart, { passive: true });
    content.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      content.removeEventListener("touchstart", handleTouchStart);
      content.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onClose]);

  const SegmentedControl = useCallback(
    ({
      label,
      value,
      options,
      onChange,
    }: {
      label: string;
      value: string | number;
      options: Array<{ id: string | number; label: string }>;
      onChange: (id: string | number) => void;
    }) => (
      <div style={{ paddingTop: "16px" }}>
        <div
          className="text-xs font-medium tracking-[0.1em] uppercase text-[#707070] mb-2"
          style={{ letterSpacing: "0.1em", marginBottom: "12px" }}
        >
          {label}
        </div>
        <div className="flex gap-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`flex-1 text-xs font-medium tracking-widest uppercase transition-all ${
                value === opt.id
                  ? "bg-white text-black"
                  : "bg-transparent text-[#707070] hover:bg-[rgba(255,255,255,0.05)]"
              }`}
              style={{
                padding: "12px",
                minHeight: "44px",
                border: value !== opt.id ? "1px solid rgba(255,255,255,0.2)" : "none",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    ),
    []
  );

  const handleExport = (format: "png" | "jpg") => {
    onExport(format);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] rounded-t-2xl z-50 flex flex-col max-h-[40vh]"
        style={{
          paddingTop: "16px",
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pb-4">
          <div
            style={{
              width: "40px",
              height: "4px",
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 text-xl text-[#707070] hover:text-white transition-colors"
          style={{ minHeight: "44px", minWidth: "44px" }}
        >
          ×
        </button>

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-6 pb-6"
          style={{
            paddingLeft: "24px",
            paddingRight: "24px",
            paddingBottom: "24px",
          }}
        >
          {/* Export Size - Segmented Control */}
          <SegmentedControl
            label="EXPORT SIZE"
            value={settings.exportSize}
            options={exportSizes.map((size) => ({
              id: size,
              label: `${size}x`,
            }))}
            onChange={(size) =>
              onSettingsChange({
                ...settings,
                exportSize: size as AsciiSettings["exportSize"],
              })
            }
          />

          {/* Export Buttons */}
          <div className="flex flex-col gap-2" style={{ marginTop: "24px" }}>
            <button
              onClick={() => handleExport("png")}
              className="w-full bg-white text-black text-xs font-medium tracking-wider uppercase hover:bg-[#d0d0d0] transition-colors"
              style={{
                padding: "12px",
                minHeight: "44px",
              }}
            >
              Export PNG
            </button>
            <button
              onClick={() => handleExport("jpg")}
              className="w-full bg-white text-black text-xs font-medium tracking-wider uppercase hover:bg-[#d0d0d0] transition-colors"
              style={{
                padding: "12px",
                minHeight: "44px",
              }}
            >
              Export JPG
            </button>
            <button
              onClick={onClose}
              className="w-full text-xs font-medium tracking-wider uppercase hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[#707070]"
              style={{
                padding: "12px",
                minHeight: "44px",
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundColor: "transparent",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
