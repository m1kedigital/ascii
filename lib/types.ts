export type CharsetId =
  | "standard"
  | "dense"
  | "blocks"
  | "binary"
  | "dots"
  | "custom";
export type ColorMode = "mono" | "preserve" | "invert";
export type BackgroundMode = "white" | "black" | "transparent";
export type ExportSize = 1 | 2 | 4;
export type DitherMode = "none" | "ordered" | "floyd";

export interface AsciiSettings {
  charset: CharsetId;
  customCharset: string;
  cellSize: number;
  tileAspect: number;
  contrast: number;
  cutDarks: number;
  cutLights: number;
  colorMode: ColorMode;
  background: BackgroundMode;
  exportSize: ExportSize;
  dither: DitherMode;
  credit: boolean;
}

export interface SampleImage {
  id: string;
  url: string;
  label: string;
  alt: string;
  lookId?: string;
}

export interface Preset {
  id: string;
  label: string;
  settings: Partial<AsciiSettings>;
}

export interface GalleryItem {
  id: string;
  sampleId: string;
  lookId: string;
  title: string;
  caption: string;
}

export const DEFAULT_SETTINGS: AsciiSettings = {
  charset: "standard",
  customCharset: "@%#*+=-:. ",
  cellSize: 10,
  tileAspect: 0.55,
  contrast: 1.5,
  cutDarks: 0,
  cutLights: 0,
  colorMode: "mono",
  background: "black",
  exportSize: 1,
  dither: "none",
  credit: false,
};

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "architecture",
    url: "/samples/01-architecture.jpg",
    label: "Street",
    alt: "Lisbon cobblestone street",
    lookId: "street",
  },
  {
    id: "street",
    url: "/samples/02-street.jpg",
    label: "Figure",
    alt: "Man walking in Barcelona",
    lookId: "portrait",
  },
  {
    id: "nature",
    url: "/samples/03-nature.jpg",
    label: "Coast",
    alt: "Waves on rocky coastline",
    lookId: "contrast",
  },
  {
    id: "object",
    url: "/samples/04-object.jpg",
    label: "City",
    alt: "Gondolas over city",
    lookId: "color",
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
      dither: "floyd",
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
      dither: "none",
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
      dither: "ordered",
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
      dither: "none",
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
      dither: "none",
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
      dither: "ordered",
    },
  },
];

export const GALLERY: GalleryItem[] = [
  {
    id: "g1",
    sampleId: "architecture",
    lookId: "street",
    title: "Lisbon grid",
    caption: "Street look · dense blocks",
  },
  {
    id: "g2",
    sampleId: "street",
    lookId: "portrait",
    title: "Figure study",
    caption: "Portrait · Floyd dither",
  },
  {
    id: "g3",
    sampleId: "nature",
    lookId: "contrast",
    title: "Coast punch",
    caption: "High contrast · clipped tones",
  },
  {
    id: "g4",
    sampleId: "object",
    lookId: "color",
    title: "City color",
    caption: "Preserve · street neon feel",
  },
  {
    id: "g5",
    sampleId: "architecture",
    lookId: "matrix",
    title: "Binary facade",
    caption: "Matrix · ordered dither",
  },
  {
    id: "g6",
    sampleId: "street",
    lookId: "logo",
    title: "Hard blocks",
    caption: "Logo · bold mass",
  },
];

export const CHARSET_OPTIONS: { id: CharsetId; label: string; sample: string }[] =
  [
    { id: "standard", label: "Standard", sample: "`·.:-=+*#%@" },
    { id: "dense", label: "Dense", sample: "░▒▓█" },
    { id: "blocks", label: "Blocks", sample: "░▒▓█" },
    { id: "binary", label: "Binary", sample: "01" },
    { id: "dots", label: "Dots", sample: "·•●" },
    { id: "custom", label: "Custom", sample: "you define" },
  ];

export const BUILTIN_CHARSETS: Record<Exclude<CharsetId, "custom">, string> = {
  standard: "`·.:-=+*#%@",
  dense: "░▒▓█",
  blocks: "░▒▓█",
  binary: "01",
  dots: "·•●",
};

export function resolveCharset(settings: AsciiSettings): string {
  if (settings.charset === "custom") {
    const s = settings.customCharset.replace(/\s+$/g, "");
    return s.length > 0 ? s : BUILTIN_CHARSETS.standard;
  }
  return BUILTIN_CHARSETS[settings.charset];
}
