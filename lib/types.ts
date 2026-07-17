export type CharsetId = "standard" | "dense" | "blocks" | "binary" | "dots";
export type ColorMode = "mono" | "preserve" | "invert";
export type BackgroundMode = "white" | "black" | "transparent";
export type ExportSize = 1 | 2 | 4;

export interface AsciiSettings {
  charset: CharsetId;
  cellSize: number;
  tileAspect: number;
  contrast: number;
  cutDarks: number;
  cutLights: number;
  colorMode: ColorMode;
  background: BackgroundMode;
  exportSize: ExportSize;
}

export interface SampleImage {
  id: string;
  url: string;
  label: string;
  alt: string;
}

export interface Preset {
  id: string;
  label: string;
  settings: Partial<AsciiSettings>;
}

export const DEFAULT_SETTINGS: AsciiSettings = {
  charset: "standard",
  cellSize: 10,
  tileAspect: 0.55,
  contrast: 1.5,
  cutDarks: 0,
  cutLights: 0,
  colorMode: "mono",
  background: "black",
  exportSize: 1,
};

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "architecture",
    url: "/samples/01-architecture.jpg",
    label: "Street",
    alt: "Lisbon cobblestone street",
  },
  {
    id: "street",
    url: "/samples/02-street.jpg",
    label: "Figure",
    alt: "Man walking in Barcelona",
  },
  {
    id: "nature",
    url: "/samples/03-nature.jpg",
    label: "Coast",
    alt: "Waves on rocky coastline",
  },
  {
    id: "object",
    url: "/samples/04-object.jpg",
    label: "City",
    alt: "Gondolas over city",
  },
];

export const PRESETS: Preset[] = [
  {
    id: "portrait",
    label: "Portrait",
    settings: {
      charset: "standard",
      cellSize: 8,
      tileAspect: 0.5,
      contrast: 1.7,
      cutDarks: 0.04,
      cutLights: 0.02,
      colorMode: "mono",
      background: "black",
    },
  },
  {
    id: "logo",
    label: "Logo",
    settings: {
      charset: "blocks",
      cellSize: 14,
      tileAspect: 0.6,
      contrast: 1.9,
      cutDarks: 0.08,
      cutLights: 0.05,
      colorMode: "mono",
      background: "black",
    },
  },
  {
    id: "street",
    label: "Street",
    settings: {
      charset: "dense",
      cellSize: 10,
      tileAspect: 0.55,
      contrast: 1.5,
      cutDarks: 0,
      cutLights: 0,
      colorMode: "mono",
      background: "black",
    },
  },
  {
    id: "contrast",
    label: "Punch",
    settings: {
      charset: "standard",
      cellSize: 9,
      tileAspect: 0.55,
      contrast: 2,
      cutDarks: 0.1,
      cutLights: 0.08,
      colorMode: "mono",
      background: "black",
    },
  },
  {
    id: "color",
    label: "Color",
    settings: {
      charset: "standard",
      cellSize: 10,
      tileAspect: 0.55,
      contrast: 1.4,
      cutDarks: 0,
      cutLights: 0,
      colorMode: "preserve",
      background: "black",
    },
  },
  {
    id: "matrix",
    label: "Matrix",
    settings: {
      charset: "binary",
      cellSize: 8,
      tileAspect: 0.55,
      contrast: 1.8,
      cutDarks: 0.05,
      cutLights: 0.05,
      colorMode: "mono",
      background: "black",
    },
  },
];

export const CHARSET_OPTIONS: { id: CharsetId; label: string; sample: string }[] = [
  { id: "standard", label: "Standard", sample: "`·.:-=+*#%@" },
  { id: "dense", label: "Dense", sample: "░▒▓█" },
  { id: "blocks", label: "Blocks", sample: "░▒▓█" },
  { id: "binary", label: "Binary", sample: "01" },
  { id: "dots", label: "Dots", sample: "·•●" },
];
