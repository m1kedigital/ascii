"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHARSET_OPTIONS,
  PRESETS,
  SAMPLE_IMAGES,
  type AsciiSettings,
  type SampleImage,
} from "@/lib/types";

type TabId = "source" | "adjust" | "color";

interface MobileControlsSheetProps {
  settings: AsciiSettings;
  onSettingsChange: (settings: AsciiSettings) => void;
  sourceLabel: string;
  activeSampleId: string | null;
  activePresetId: string | null;
  previewMode: "ascii" | "original";
  onPreviewModeChange: (mode: "ascii" | "original") => void;
  onUploadClick: () => void;
  onSampleSelect: (sample: SampleImage) => void;
  onPresetSelect: (presetId: string) => void;
  onRandomize: () => void;
  onResetLook: () => void;
  onOpenGallery: () => void;
  hasImage: boolean;
  onClose: () => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="control-row">
      <div className="control-head">
        <span className="control-label">{label}</span>
        <span className="control-value">{format(value)}</span>
      </div>
      <input
        type="range"
        className="ui-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export default function MobileControlsSheet({
  settings,
  onSettingsChange,
  sourceLabel,
  activeSampleId,
  activePresetId,
  previewMode,
  onPreviewModeChange,
  onUploadClick,
  onSampleSelect,
  onPresetSelect,
  onRandomize,
  onResetLook,
  onOpenGallery,
  hasImage,
  onClose,
}: MobileControlsSheetProps) {
  const [tab, setTab] = useState<TabId>("source");
  const bodyRef = useRef<HTMLDivElement>(null);

  const patch = (partial: Partial<AsciiSettings>) =>
    onSettingsChange({ ...settings, ...partial });

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
      <div className="sheet mobile-edit-sheet">
        <div className="sheet-handle">
          <span />
        </div>
        <div className="sheet-header">
          <h2>Edit</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="mobile-tabs" role="tablist">
          {(
            [
              ["source", "Source"],
              ["adjust", "Adjust"],
              ["color", "Color"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`mobile-tab${tab === id ? " active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="sheet-body" ref={bodyRef}>
          {tab === "source" && (
            <>
              <section className="section">
                <div className="control-head" style={{ marginBottom: 10 }}>
                  <span className="control-label">Current</span>
                  <span className="control-value">{sourceLabel || "—"}</span>
                </div>
                <div className="btn-row">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ minHeight: 44 }}
                    onClick={onUploadClick}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ minHeight: 44 }}
                    onClick={onRandomize}
                    disabled={!hasImage}
                  >
                    Random
                  </button>
                </div>
              </section>

              <section className="section">
                <div className="section-label">Preview</div>
                <div className="seg">
                  <button
                    type="button"
                    className={`seg-btn${previewMode === "ascii" ? " active" : ""}`}
                    onClick={() => onPreviewModeChange("ascii")}
                  >
                    ASCII
                  </button>
                  <button
                    type="button"
                    className={`seg-btn${previewMode === "original" ? " active" : ""}`}
                    onClick={() => onPreviewModeChange("original")}
                  >
                    Original
                  </button>
                </div>
              </section>

              <section className="section">
                <div className="section-label">Samples</div>
                <div className="sample-grid">
                  {SAMPLE_IMAGES.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      className={`sample-thumb lookbook${
                        activeSampleId === sample.id ? " active" : ""
                      }`}
                      onClick={() => onSampleSelect(sample)}
                    >
                      <img src={sample.url} alt={sample.alt} />
                      <span className="sample-thumb-label">{sample.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ minHeight: 44, marginTop: 8 }}
                  onClick={() => {
                    onOpenGallery();
                    onClose();
                  }}
                >
                  Gallery lookbook
                </button>
              </section>

              <section className="section">
                <div className="section-label">Looks</div>
                <div className="preset-row">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`preset-chip${
                        activePresetId === preset.id ? " active" : ""
                      }`}
                      onClick={() => onPresetSelect(preset.id)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ minHeight: 44, marginTop: 8 }}
                  onClick={onResetLook}
                >
                  Reset look
                </button>
              </section>
            </>
          )}

          {tab === "adjust" && (
            <section className="section">
              <SliderRow
                label="Density"
                value={settings.cellSize}
                min={4}
                max={20}
                format={(v) => `${v}px`}
                onChange={(cellSize) => patch({ cellSize })}
              />
              <SliderRow
                label="Tile aspect"
                value={settings.tileAspect}
                min={0.4}
                max={1.2}
                step={0.05}
                format={(v) => v.toFixed(2)}
                onChange={(tileAspect) => patch({ tileAspect })}
              />
              <SliderRow
                label="Contrast"
                value={settings.contrast}
                min={0.5}
                max={2}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                onChange={(contrast) => patch({ contrast })}
              />
              <SliderRow
                label="Lift shadows"
                value={settings.cutDarks}
                min={0}
                max={0.3}
                step={0.01}
                format={(v) => v.toFixed(2)}
                onChange={(cutDarks) => patch({ cutDarks })}
              />
              <SliderRow
                label="Clip highlights"
                value={settings.cutLights}
                min={0}
                max={0.3}
                step={0.01}
                format={(v) => v.toFixed(2)}
                onChange={(cutLights) => patch({ cutLights })}
              />
              <div className="control-row">
                <div className="control-label" style={{ marginBottom: 8 }}>
                  Dither
                </div>
                <div className="seg">
                  {(
                    [
                      ["none", "Off"],
                      ["ordered", "Ordered"],
                      ["floyd", "Floyd"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`seg-btn${settings.dither === id ? " active" : ""}`}
                      onClick={() => patch({ dither: id })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="control-row">
                <div className="control-label" style={{ marginBottom: 8 }}>
                  Charset
                </div>
                <select
                  className="ui-select"
                  value={settings.charset}
                  onChange={(e) =>
                    patch({ charset: e.target.value as AsciiSettings["charset"] })
                  }
                >
                  {CHARSET_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {settings.charset === "custom" ? (
                <div className="control-row">
                  <input
                    type="text"
                    className="ui-input"
                    value={settings.customCharset}
                    onChange={(e) => patch({ customCharset: e.target.value })}
                    spellCheck={false}
                    placeholder="@%#*+=-:. "
                  />
                </div>
              ) : null}
            </section>
          )}

          {tab === "color" && (
            <section className="section">
              <div className="control-row">
                <div className="control-label" style={{ marginBottom: 8 }}>
                  Mode
                </div>
                <div className="seg">
                  {(
                    [
                      ["mono", "Mono"],
                      ["preserve", "Color"],
                      ["invert", "Invert"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`seg-btn${settings.colorMode === id ? " active" : ""}`}
                      onClick={() => patch({ colorMode: id })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="control-row">
                <div className="control-label" style={{ marginBottom: 8 }}>
                  Background
                </div>
                <div className="seg">
                  {(
                    [
                      ["black", "Black"],
                      ["white", "White"],
                      ["transparent", "Clear"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`seg-btn${settings.background === id ? " active" : ""}`}
                      onClick={() => patch({ background: id })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="control-row">
                <div className="control-head">
                  <span className="control-label">Credit mark</span>
                  <button
                    type="button"
                    className={`toggle-switch${settings.credit ? " on" : ""}`}
                    onClick={() => patch({ credit: !settings.credit })}
                    aria-pressed={settings.credit}
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="mobile-sheet-done">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}
