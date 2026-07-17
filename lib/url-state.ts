import {
  DEFAULT_SETTINGS,
  type AsciiSettings,
  type BackgroundMode,
  type CharsetId,
  type ColorMode,
  type DitherMode,
  type ExportSize,
} from "./types";

const KEYS = [
  "look",
  "charset",
  "custom",
  "density",
  "aspect",
  "contrast",
  "darks",
  "lights",
  "color",
  "bg",
  "scale",
  "dither",
  "credit",
  "sample",
  "split",
] as const;

function num(v: string | null, fallback: number, min: number, max: number) {
  if (v == null || v === "") return fallback;
  const n = parseFloat(v);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function settingsFromSearchParams(
  params: URLSearchParams
): {
  settings: AsciiSettings;
  lookId: string | null;
  sampleId: string | null;
  showSource: boolean;
} {
  const settings: AsciiSettings = { ...DEFAULT_SETTINGS };

  const charset = params.get("charset") as CharsetId | null;
  if (
    charset &&
    ["standard", "dense", "blocks", "binary", "dots", "custom"].includes(charset)
  ) {
    settings.charset = charset;
  }

  const custom = params.get("custom");
  if (custom) settings.customCharset = decodeURIComponent(custom);

  settings.cellSize = Math.round(num(params.get("density"), settings.cellSize, 4, 20));
  settings.tileAspect = num(params.get("aspect"), settings.tileAspect, 0.4, 1.2);
  settings.contrast = num(params.get("contrast"), settings.contrast, 0.5, 2);
  settings.cutDarks = num(params.get("darks"), settings.cutDarks, 0, 0.3);
  settings.cutLights = num(params.get("lights"), settings.cutLights, 0, 0.3);

  const color = params.get("color") as ColorMode | null;
  if (color && ["mono", "preserve", "invert"].includes(color)) {
    settings.colorMode = color;
  }

  const bg = params.get("bg") as BackgroundMode | null;
  if (bg && ["white", "black", "transparent"].includes(bg)) {
    settings.background = bg;
  }

  const scale = num(params.get("scale"), settings.exportSize, 1, 4);
  settings.exportSize = ([1, 2, 4].includes(scale) ? scale : 1) as ExportSize;

  const dither = params.get("dither") as DitherMode | null;
  if (dither && ["none", "ordered", "floyd"].includes(dither)) {
    settings.dither = dither;
  }

  settings.credit = params.get("credit") === "1";

  return {
    settings,
    lookId: params.get("look"),
    sampleId: params.get("sample"),
    showSource: params.get("split") === "1",
  };
}

export function settingsToSearchParams(input: {
  settings: AsciiSettings;
  lookId: string | null;
  sampleId: string | null;
  showSource: boolean;
}): string {
  const { settings, lookId, sampleId, showSource } = input;
  const p = new URLSearchParams();

  if (lookId) p.set("look", lookId);
  if (sampleId) p.set("sample", sampleId);
  if (showSource) p.set("split", "1");

  if (settings.charset !== DEFAULT_SETTINGS.charset) p.set("charset", settings.charset);
  if (
    settings.charset === "custom" &&
    settings.customCharset !== DEFAULT_SETTINGS.customCharset
  ) {
    p.set("custom", settings.customCharset);
  }
  if (settings.cellSize !== DEFAULT_SETTINGS.cellSize)
    p.set("density", String(settings.cellSize));
  if (settings.tileAspect !== DEFAULT_SETTINGS.tileAspect)
    p.set("aspect", settings.tileAspect.toFixed(2));
  if (settings.contrast !== DEFAULT_SETTINGS.contrast)
    p.set("contrast", settings.contrast.toFixed(1));
  if (settings.cutDarks !== DEFAULT_SETTINGS.cutDarks)
    p.set("darks", settings.cutDarks.toFixed(2));
  if (settings.cutLights !== DEFAULT_SETTINGS.cutLights)
    p.set("lights", settings.cutLights.toFixed(2));
  if (settings.colorMode !== DEFAULT_SETTINGS.colorMode)
    p.set("color", settings.colorMode);
  if (settings.background !== DEFAULT_SETTINGS.background)
    p.set("bg", settings.background);
  if (settings.exportSize !== DEFAULT_SETTINGS.exportSize)
    p.set("scale", String(settings.exportSize));
  if (settings.dither !== DEFAULT_SETTINGS.dither) p.set("dither", settings.dither);
  if (settings.credit) p.set("credit", "1");

  // Drop unused KEYS noise — only set keys above
  void KEYS;
  const s = p.toString();
  return s ? `?${s}` : "";
}
