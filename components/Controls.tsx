"use client";

import {
  AsciiSettings,
  CHARSET_OPTIONS,
  PRESETS,
  SAMPLE_IMAGES,
  type SampleImage,
} from "@/lib/types";

interface ControlsProps {
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
  onClear?: () => void;
  hasImage: boolean;
  compact?: boolean;
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-label">{label}</div>
      {children}
    </section>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint?: string;
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
      {hint ? <div className="control-hint">{hint}</div> : null}
    </div>
  );
}

export default function Controls({
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
  onClear,
  hasImage,
  compact = false,
}: ControlsProps) {
  const patch = (partial: Partial<AsciiSettings>) =>
    onSettingsChange({ ...settings, ...partial });

  return (
    <div className={compact ? "" : "rail-scroll"}>
      <Section label="Source">
        <div className="control-row">
          <div className="control-head">
            <span className="control-label">Current</span>
            <span className="control-value">{sourceLabel || "—"}</span>
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn-secondary" onClick={onUploadClick}>
              Upload
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onRandomize}
              disabled={!hasImage}
              title="Jitter look settings"
            >
              Random
            </button>
          </div>
        </div>
        <div className="control-row">
          <div className="control-label" style={{ marginBottom: 4 }}>
            Samples
          </div>
          <div className="sample-grid">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className={`sample-thumb${activeSampleId === sample.id ? " active" : ""}`}
                onClick={() => onSampleSelect(sample)}
                title={sample.label}
              >
                <img src={sample.url} alt={sample.alt} loading="eager" />
              </button>
            ))}
          </div>
        </div>
        <div className="control-row">
          <div className="control-label" style={{ marginBottom: 4 }}>
            Looks
          </div>
          <div className="preset-row">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-chip${activePresetId === preset.id ? " active" : ""}`}
                onClick={() => onPresetSelect(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section label="Geometry">
        <SliderRow
          label="Density"
          value={settings.cellSize}
          min={4}
          max={20}
          format={(v) => `${v}px`}
          onChange={(cellSize) => patch({ cellSize })}
          hint="Smaller = more detail"
        />
        <SliderRow
          label="Tile aspect"
          value={settings.tileAspect}
          min={0.4}
          max={1.2}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(tileAspect) => patch({ tileAspect })}
          hint="Character height stretch"
        />
      </Section>

      <Section label="Tone">
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
          hint="Pull dark areas up"
        />
        <SliderRow
          label="Clip highlights"
          value={settings.cutLights}
          min={0}
          max={0.3}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(cutLights) => patch({ cutLights })}
          hint="Pull bright areas down"
        />
      </Section>

      <Section label="Charset">
        <div className="control-row">
          <div className="control-head">
            <span className="control-label">Set</span>
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
                {opt.label} — {opt.sample}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section label="Color">
        <div className="control-row">
          <div className="control-head">
            <span className="control-label">Mode</span>
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
          <div className="control-head">
            <span className="control-label">Background</span>
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
      </Section>

      <Section label="Export">
        <div className="control-row">
          <div className="control-head">
            <span className="control-label">Scale</span>
          </div>
          <div className="seg">
            {([1, 2, 4] as const).map((size) => (
              <button
                key={size}
                type="button"
                className={`seg-btn${settings.exportSize === size ? " active" : ""}`}
                onClick={() => patch({ exportSize: size })}
              >
                {size}×
              </button>
            ))}
          </div>
        </div>
        <div className="btn-stack">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onExport("png")}
            disabled={!hasImage}
          >
            Export PNG
          </button>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onExport("jpg")}
              disabled={!hasImage}
            >
              JPG
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCopyText}
              disabled={!hasImage}
            >
              Copy text
            </button>
          </div>
          {onClear ? (
            <button type="button" className="btn btn-ghost" onClick={onClear}>
              Reset image
            </button>
          ) : null}
        </div>
        <div className="control-hint" style={{ marginTop: 10 }}>
          S — snapshot PNG · client-side, no upload
        </div>
      </Section>
    </div>
  );
}
