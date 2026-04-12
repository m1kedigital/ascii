"use client";

import { AsciiSettings } from "./AsciiConverter";

interface ControlsProps {
  settings: AsciiSettings;
  onSettingsChange: (settings: AsciiSettings) => void;
  onExport: (format: "png" | "jpg") => void;
  onClear: () => void;
}

const charsetLabels: Record<AsciiSettings["charset"], string> = {
  standard: "STANDARD",
  dense: "DENSE",
  blocks: "BLOCKS",
  binary: "BINARY",
  dots: "DOTS",
};

export default function Controls({
  settings,
  onSettingsChange,
  onExport,
  onClear,
}: ControlsProps) {
  const colorModes: Array<AsciiSettings["colorMode"]> = [
    "mono",
    "preserve",
    "invert",
  ];
  const backgroundModes: Array<AsciiSettings["background"]> = [
    "white",
    "black",
    "transparent",
  ];
  const exportSizes: Array<AsciiSettings["exportSize"]> = [1, 2, 4];

  const SegmentedControl = ({
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
    <div style={dividerAbove ? { paddingTop: "24px", borderTop: "1px solid #1a1a1a" } : { paddingTop: "24px" }}>
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
              padding: "8px 12px",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const Slider = ({
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
    <div style={{ paddingTop: "24px" }}>
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
          width: 8px;
          height: 8px;
          background: white;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 8px;
          height: 8px;
          background: white;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 0;
        }
      `}</style>
    </div>
  );

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        padding: "24px",
        maxWidth: "280px",
      }}
    >
      {/* Charset - Segmented Control */}
      <SegmentedControl
        label="CHARACTER SET"
        value={settings.charset}
        options={Object.entries(charsetLabels).map(([id, label]) => ({
          id,
          label,
        }))}
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
        options={colorModes.map((mode) => ({
          id: mode,
          label: mode.toUpperCase(),
        }))}
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
        options={backgroundModes.map((mode) => ({
          id: mode,
          label: mode.toUpperCase(),
        }))}
        onChange={(id) =>
          onSettingsChange({
            ...settings,
            background: id as AsciiSettings["background"],
          })
        }
      />

      {/* Export Size - Segmented Control with divider */}
      <div style={{ paddingTop: "24px", borderTop: "1px solid #1a1a1a" }}>
        <div
          className="text-xs font-medium tracking-[0.1em] uppercase text-[#707070] mb-2"
          style={{ letterSpacing: "0.1em", marginBottom: "8px" }}
        >
          EXPORT SIZE
        </div>
        <div className="flex gap-1">
          {exportSizes.map((size) => (
            <button
              key={size}
              onClick={() =>
                onSettingsChange({
                  ...settings,
                  exportSize: size,
                })
              }
              className={`flex-1 text-xs font-medium tracking-widest uppercase transition-all ${
                settings.exportSize === size
                  ? "bg-white text-black"
                  : "bg-transparent text-[#707070] hover:bg-[rgba(255,255,255,0.05)]"
              }`}
              style={{
                padding: "8px 12px",
              }}
            >
              {size}x
            </button>
          ))}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-col" style={{ marginTop: "24px", gap: "8px" }}>
        <button
          onClick={() => onExport("png")}
          className="w-full bg-white text-black text-xs font-medium tracking-wider uppercase hover:bg-[#707070] transition-colors"
          style={{ padding: "12px" }}
        >
          Export PNG
        </button>
        <button
          onClick={() => onExport("jpg")}
          className="w-full bg-white text-black text-xs font-medium tracking-wider uppercase hover:bg-[#707070] transition-colors"
          style={{ padding: "12px" }}
        >
          Export JPG
        </button>
        <button
          onClick={onClear}
          className="w-full text-xs font-medium tracking-wider uppercase hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[#707070]"
          style={{
            padding: "12px",
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "transparent",
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
