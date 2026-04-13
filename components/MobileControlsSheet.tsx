"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import { AsciiSettings } from "./AsciiConverter";

interface MobileControlsSheetProps {
  settings: AsciiSettings;
  onSettingsChange: (settings: AsciiSettings) => void;
  onClose: () => void;
}

const charsetLabels: Record<AsciiSettings["charset"], string> = {
  standard: "STANDARD",
  dense: "DENSE",
  blocks: "BLOCKS",
  binary: "BINARY",
  dots: "DOTS",
};

export default function MobileControlsSheet({
  settings,
  onSettingsChange,
  onClose,
}: MobileControlsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const colorModes: Array<AsciiSettings["colorMode"]> = useMemo(
    () => ["mono", "preserve", "invert"],
    []
  );
  const backgroundModes: Array<AsciiSettings["background"]> = useMemo(
    () => ["white", "black", "transparent"],
    []
  );

  const charsetOptions = useMemo(
    () =>
      Object.entries(charsetLabels).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  // Handle swipe down to close
  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const diff = endY - startY;
      if (diff > 50 && contentRef.current?.scrollTop === 0) {
        onClose();
      }
    };

    contentRef.current?.addEventListener("touchstart", handleTouchStart);
    contentRef.current?.addEventListener("touchend", handleTouchEnd);

    return () => {
      contentRef.current?.removeEventListener("touchstart", handleTouchStart);
      contentRef.current?.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onClose]);

  const SegmentedControl = useCallback(
    ({
      label,
      value,
      options,
      onChange,
      dividerAbove,
    }: {
      label: string;
      value: string;
      options: Array<{ id: string; label: string }>;
      onChange: (id: string) => void;
      dividerAbove?: boolean;
    }) => (
      <div style={dividerAbove ? { paddingTop: "16px", borderTop: "1px solid #1a1a1a" } : { paddingTop: "16px" }}>
        <div
          className="text-xs font-medium tracking-[0.1em] uppercase text-[#707070] mb-2"
          style={{ letterSpacing: "0.1em", marginBottom: "8px" }}
        >
          {label}
        </div>
        <div className="flex flex-col gap-1">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`text-xs font-medium tracking-widest uppercase transition-all ${
                value === opt.id
                  ? "bg-white text-black"
                  : "bg-transparent text-[#707070] hover:bg-[rgba(255,255,255,0.05)]"
              }`}
              style={{
                padding: "12px",
                minHeight: "44px",
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

  const Slider = useCallback(
    ({
      label,
      value,
      min,
      max,
      step,
      onChange,
      formatValue,
    }: {
      label: string;
      value: number;
      min: number;
      max: number;
      step?: number;
      onChange: (val: number) => void;
      formatValue: (val: number) => string;
    }) => (
      <div style={{ paddingTop: "16px" }}>
        <div className="flex justify-between items-baseline" style={{ marginBottom: "12px" }}>
          <div
            className="text-xs font-medium tracking-[0.1em] uppercase text-[#707070]"
            style={{ letterSpacing: "0.1em" }}
          >
            {label}
          </div>
          <div className="text-xs font-medium text-white text-right font-mono">
            {formatValue(value)}
          </div>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step || "1"}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1 appearance-none cursor-pointer"
          style={{
            background: "white",
            WebkitAppearance: "none",
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            background: white;
            cursor: pointer;
            border: 1px solid rgba(255, 255, 255, 0.5);
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: white;
            cursor: pointer;
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 0;
          }
        `}</style>
      </div>
    ),
    []
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] rounded-t-2xl z-50 flex flex-col max-h-[70vh]"
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
          {/* Charset - Segmented Control */}
          <SegmentedControl
            label="CHARACTER SET"
            value={settings.charset}
            options={charsetOptions}
            onChange={(id) =>
              onSettingsChange({
                ...settings,
                charset: id as AsciiSettings["charset"],
              })
            }
          />

          {/* Density Slider */}
          <Slider
            label="DENSITY"
            value={settings.cellSize}
            min={4}
            max={20}
            onChange={(val) => onSettingsChange({ ...settings, cellSize: val })}
            formatValue={(val) => `${val}px`}
          />

          {/* Tile Aspect Slider */}
          <Slider
            label="TILE ASPECT"
            value={settings.tileAspect}
            min={0.4}
            max={1.2}
            step={0.05}
            onChange={(val) => onSettingsChange({ ...settings, tileAspect: val })}
            formatValue={(val) => val.toFixed(2)}
          />

          {/* Contrast Slider */}
          <Slider
            label="CONTRAST"
            value={settings.contrast}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(val) => onSettingsChange({ ...settings, contrast: val })}
            formatValue={(val) => `${val.toFixed(1)}x`}
          />

          {/* Cut Darks Slider */}
          <Slider
            label="CUT DARKS"
            value={settings.cutDarks}
            min={0}
            max={0.3}
            step={0.01}
            onChange={(val) => onSettingsChange({ ...settings, cutDarks: val })}
            formatValue={(val) => val.toFixed(2)}
          />

          {/* Cut Lights Slider */}
          <Slider
            label="CUT LIGHTS"
            value={settings.cutLights}
            min={0}
            max={0.3}
            step={0.01}
            onChange={(val) => onSettingsChange({ ...settings, cutLights: val })}
            formatValue={(val) => val.toFixed(2)}
          />

          {/* Color Mode - Segmented Control with divider */}
          <SegmentedControl
            label="COLOR MODE"
            value={settings.colorMode}
            options={useMemo(
              () =>
                colorModes.map((mode) => ({
                  id: mode,
                  label: mode.toUpperCase(),
                })),
              [colorModes]
            )}
            onChange={(id) =>
              onSettingsChange({
                ...settings,
                colorMode: id as AsciiSettings["colorMode"],
              })
            }
            dividerAbove={true}
          />

          {/* Background - Segmented Control */}
          <SegmentedControl
            label="BACKGROUND"
            value={settings.background}
            options={useMemo(
              () =>
                backgroundModes.map((mode) => ({
                  id: mode,
                  label: mode.toUpperCase(),
                })),
              [backgroundModes]
            )}
            onChange={(id) =>
              onSettingsChange({
                ...settings,
                background: id as AsciiSettings["background"],
              })
            }
          />
        </div>
      </div>
    </>
  );
}
