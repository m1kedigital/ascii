"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { imageToASCII } from "@/lib/ascii";
import { asciiToImageData, renderAsciiToCanvas } from "@/lib/canvas";
import {
  asciiToSvg,
  canvasToBlob,
  downloadBlob,
  downloadDataUrl,
  encodeGif,
  slugify,
} from "@/lib/export";
import { fileToDataUrl, isImageFile, urlToDataUrl } from "@/lib/image";
import {
  DEFAULT_SETTINGS,
  PRESETS,
  SAMPLE_IMAGES,
  type AsciiSettings,
  type SampleImage,
} from "@/lib/types";
import {
  settingsFromSearchParams,
  settingsToSearchParams,
} from "@/lib/url-state";
import AsciiPreview from "./AsciiPreview";
import Controls from "./Controls";
import Toast from "./Toast";
import MobileControlsSheet from "./MobileControlsSheet";
import MobileExportSheet from "./MobileExportSheet";
import ConfirmationDialog from "./ConfirmationDialog";
import Gallery from "./Gallery";

function isTypingTarget(el: EventTarget | null) {
  const tag = (el as HTMLElement)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function ThemeIcon({ theme }: { theme: "dark" | "light" }) {
  // dark mode UI → show sun (switch to light); light mode → show moon
  if (theme === "dark") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AsciiApp() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const urlReady = useRef(false);

  const [imageData, setImageData] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>("street");
  const [settings, setSettings] = useState<AsciiSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...PRESETS.find((p) => p.id === "street")?.settings,
  }));
  const [asciiData, setAsciiData] = useState("");
  const [asciiColors, setAsciiColors] = useState<(string | null)[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [mobilePreview, setMobilePreview] = useState<"ascii" | "original">(
    "ascii"
  );
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [exportingGif, setExportingGif] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  // Theme
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ascii:theme") as "dark" | "light" | null;
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("ascii:theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth <= 860);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const applyLook = useCallback((lookId: string) => {
    const preset = PRESETS.find((p) => p.id === lookId);
    if (!preset) return;
    setSettings((prev) => ({ ...prev, ...preset.settings }));
    setActivePresetId(lookId);
  }, []);

  const loadSample = useCallback(
    async (sample: SampleImage, withLook = true) => {
      setIsLoading(true);
      try {
        const dataUrl = await urlToDataUrl(sample.url);
        setImageData(dataUrl);
        setSourceLabel(sample.label);
        setActiveSampleId(sample.id);
        if (withLook && sample.lookId) applyLook(sample.lookId);
      } catch {
        showToast("Could not load sample");
      } finally {
        setIsLoading(false);
      }
    },
    [applyLook, showToast]
  );

  // Bootstrap from URL once
  useEffect(() => {
    if (bootstrapped) return;
    const params = new URLSearchParams(window.location.search);
    const parsed = settingsFromSearchParams(params);

    if (params.toString()) {
      setSettings((prev) => ({ ...prev, ...parsed.settings }));
      if (parsed.lookId && PRESETS.some((p) => p.id === parsed.lookId)) {
        setActivePresetId(parsed.lookId);
      } else if (params.toString()) {
        setActivePresetId(null);
      }
      setShowSource(parsed.showSource);
    }

    const sample =
      SAMPLE_IMAGES.find((s) => s.id === parsed.sampleId) || SAMPLE_IMAGES[0];

    void (async () => {
      setIsLoading(true);
      try {
        const dataUrl = await urlToDataUrl(sample.url);
        setImageData(dataUrl);
        setSourceLabel(sample.label);
        setActiveSampleId(sample.id);
        if (!parsed.lookId && sample.lookId && !params.get("charset")) {
          applyLook(sample.lookId);
        }
      } catch {
        showToast("Could not load sample");
      } finally {
        setIsLoading(false);
        setBootstrapped(true);
        urlReady.current = true;
      }
    })();
  }, [applyLook, bootstrapped, showToast]);

  // Sync URL
  useEffect(() => {
    if (!urlReady.current) return;
    const qs = settingsToSearchParams({
      settings,
      lookId: activePresetId,
      sampleId: activeSampleId,
      showSource,
    });
    const next = `${window.location.pathname}${qs}`;
    window.history.replaceState(null, "", next);
  }, [settings, activePresetId, activeSampleId, showSource]);

  // Generate ASCII
  useEffect(() => {
    if (!imageData) {
      setAsciiData("");
      setAsciiColors([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        const mobile = window.innerWidth <= 860;
        const maxCols = mobile ? 120 : undefined;
        const { ascii, colors } = imageToASCII(img, settings, maxCols);
        setAsciiData(ascii);
        setAsciiColors(colors);
      } catch {
        setAsciiData("");
        setAsciiColors([]);
        showToast("Could not process image");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    img.onerror = () => {
      if (cancelled) return;
      setIsLoading(false);
      showToast("Could not load image");
    };
    img.src = imageData;
    return () => {
      cancelled = true;
    };
  }, [imageData, settings, showToast]);

  const processFile = useCallback(
    async (file: File) => {
      if (!isImageFile(file)) {
        showToast("Unsupported file type — use JPG, PNG, WebP, or HEIC");
        return;
      }
      setIsLoading(true);
      try {
        const dataUrl = await fileToDataUrl(file);
        setImageData(dataUrl);
        setSourceLabel(file.name.replace(/\.[^.]+$/, "") || "Upload");
        setActiveSampleId(null);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not read file";
        showToast(
          msg.includes("10MB")
            ? "File too large (max 10MB)"
            : "Could not read image — try JPG/PNG"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) void processFile(file);
          break;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [processFile]);

  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) void processFile(file);
    };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", onDrop);
    };
  }, [processFile]);

  const handleSettingsChange = useCallback((next: AsciiSettings) => {
    setSettings(next);
    setActivePresetId(null);
  }, []);

  const handlePresetSelect = useCallback((presetId: string) => {
    applyLook(presetId);
  }, [applyLook]);

  const handleRandomize = useCallback(() => {
    setSettings((prev) => {
      const charsets: AsciiSettings["charset"][] = [
        "standard",
        "dense",
        "blocks",
        "binary",
        "dots",
      ];
      const dithers: AsciiSettings["dither"][] = ["none", "ordered", "floyd"];
      return {
        ...prev,
        charset: charsets[Math.floor(Math.random() * charsets.length)],
        cellSize: 6 + Math.floor(Math.random() * 10),
        tileAspect: 0.45 + Math.round(Math.random() * 12) * 0.05,
        contrast: 0.8 + Math.round(Math.random() * 12) * 0.1,
        cutDarks: Math.round(Math.random() * 12) * 0.01,
        cutLights: Math.round(Math.random() * 10) * 0.01,
        dither: dithers[Math.floor(Math.random() * dithers.length)],
      };
    });
    setActivePresetId(null);
    showToast("Look randomized");
  }, [showToast]);

  const handleResetLook = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
    setActivePresetId(null);
    showToast("Look reset");
  }, [showToast]);

  const ensureCanvas = useCallback(() => {
    if (!canvasRef.current || !asciiData) return null;
    renderAsciiToCanvas(
      canvasRef.current,
      asciiData,
      asciiColors,
      settings,
      { forExport: true }
    );
    return canvasRef.current;
  }, [asciiData, asciiColors, settings]);

  const handleExport = useCallback(
    async (format: "png" | "jpg" | "svg") => {
      if (!asciiData) return;
      const slug = slugify(sourceLabel || "art");

      if (format === "svg") {
        const svg = asciiToSvg(asciiData, asciiColors, settings);
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        downloadBlob(blob, `ascii-${slug}.svg`);
        showToast("Exported SVG");
        return;
      }

      const canvas = ensureCanvas();
      if (!canvas) return;
      const mime = format === "png" ? "image/png" : "image/jpeg";
      const filename = `ascii-${slug}-${settings.exportSize}x.${format}`;
      const blob = await canvasToBlob(
        canvas,
        mime,
        format === "jpg" ? 0.95 : undefined
      );
      if (blob) {
        downloadBlob(blob, filename);
      } else {
        downloadDataUrl(
          canvas.toDataURL(mime, format === "jpg" ? 0.95 : undefined),
          filename
        );
      }
      showToast(`Exported ${format.toUpperCase()}`);
    },
    [asciiData, asciiColors, ensureCanvas, settings, sourceLabel, showToast]
  );

  const handlePrintPack = useCallback(async () => {
    if (!asciiData) return;
    const slug = slugify(sourceLabel || "art");
    const printSettings: AsciiSettings = {
      ...settings,
      exportSize: 4,
      background: settings.background === "transparent" ? "transparent" : settings.background,
      credit: settings.credit,
    };
    const canvas = document.createElement("canvas");
    renderAsciiToCanvas(canvas, asciiData, asciiColors, printSettings, {
      forExport: true,
    });
    const blob = await canvasToBlob(canvas, "image/png");
    if (blob) downloadBlob(blob, `ascii-${slug}-print-4x.png`);
    else
      downloadDataUrl(canvas.toDataURL("image/png"), `ascii-${slug}-print-4x.png`);
    showToast("Print pack · 4× PNG");
  }, [asciiData, asciiColors, settings, sourceLabel, showToast]);

  const handleGifLoop = useCallback(async () => {
    if (!imageData || exportingGif) return;
    setExportingGif(true);
    showToast("Rendering GIF loop…");
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("img"));
        img.src = imageData;
      });

      const densities = [16, 13, 10, 8, 6, 8, 10, 13];
      const frames: ImageData[] = [];
      const mobile = window.innerWidth <= 860;
      const maxCols = mobile ? 90 : 140;

      for (const cellSize of densities) {
        const s: AsciiSettings = { ...settings, cellSize, exportSize: 1 };
        const { ascii, colors } = imageToASCII(img, s, maxCols);
        frames.push(asciiToImageData(ascii, colors, s, 420));
      }

      // Normalize frame sizes
      const w = frames[0].width;
      const h = frames[0].height;
      const normalized = frames.map((f) => {
        if (f.width === w && f.height === h) return f;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d")!;
        const tmp = document.createElement("canvas");
        tmp.width = f.width;
        tmp.height = f.height;
        tmp.getContext("2d")!.putImageData(f, 0, 0);
        ctx.fillStyle = settings.background === "white" ? "#fff" : "#000";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(tmp, 0, 0, w, h);
        return ctx.getImageData(0, 0, w, h);
      });

      const blob = await encodeGif(normalized, 12);
      downloadBlob(blob, `ascii-${slugify(sourceLabel || "art")}-loop.gif`);
      showToast("Exported GIF loop");
    } catch {
      showToast("GIF export failed");
    } finally {
      setExportingGif(false);
    }
  }, [exportingGif, imageData, settings, sourceLabel, showToast]);

  const handleCopyText = useCallback(async () => {
    if (!asciiData) return;
    try {
      await navigator.clipboard.writeText(asciiData.trimEnd());
      showToast("ASCII copied");
    } catch {
      showToast("Could not copy");
    }
  }, [asciiData, showToast]);

  const handleCopyLink = useCallback(async () => {
    const qs = settingsToSearchParams({
      settings,
      lookId: activePresetId,
      sampleId: activeSampleId,
      showSource,
    });
    const url = `${window.location.origin}${window.location.pathname}${qs}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch {
      showToast("Could not copy link");
    }
  }, [activePresetId, activeSampleId, settings, showSource, showToast]);

  // Keyboard map
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const k = e.key.toLowerCase();

      if (k >= "1" && k <= "6") {
        const idx = parseInt(k, 10) - 1;
        if (PRESETS[idx]) {
          e.preventDefault();
          applyLook(PRESETS[idx].id);
        }
        return;
      }

      switch (k) {
        case "s":
          e.preventDefault();
          void handleExport("png");
          break;
        case "c":
          e.preventDefault();
          void handleCopyText();
          break;
        case "r":
          e.preventDefault();
          handleRandomize();
          break;
        case "v":
          e.preventDefault();
          if (window.innerWidth <= 860) {
            setMobilePreview((m) => (m === "ascii" ? "original" : "ascii"));
          } else {
            setShowSource((s) => !s);
          }
          break;
        case "l":
          e.preventDefault();
          void handleCopyLink();
          break;
        case "t":
          e.preventDefault();
          setTheme((t) => (t === "dark" ? "light" : "dark"));
          break;
        case "g":
          e.preventDefault();
          setShowGallery(true);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyLook, handleCopyLink, handleCopyText, handleExport, handleRandomize]);

  const handleClear = useCallback(() => {
    setShowClearConfirm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    void loadSample(SAMPLE_IMAGES[0], false);
  }, [loadSample]);

  const handleGallerySelect = useCallback(
    (sampleId: string, lookId: string) => {
      const sample = SAMPLE_IMAGES.find((s) => s.id === sampleId);
      if (!sample) return;
      applyLook(lookId);
      void loadSample(sample, false);
    },
    [applyLook, loadSample]
  );

  const openUpload = () => fileInputRef.current?.click();
  const hasImage = Boolean(imageData && asciiData);

  const previewMode = isMobile
    ? mobilePreview
    : showSource
      ? "split"
      : "ascii";

  const controlsProps = {
    settings,
    onSettingsChange: handleSettingsChange,
    sourceLabel,
    activeSampleId,
    activePresetId,
    showSource,
    onShowSourceChange: setShowSource,
    onUploadClick: openUpload,
    onSampleSelect: (s: SampleImage) => void loadSample(s, true),
    onPresetSelect: handlePresetSelect,
    onExport: handleExport,
    onCopyText: handleCopyText,
    onCopyLink: handleCopyLink,
    onRandomize: handleRandomize,
    onResetLook: handleResetLook,
    onPrintPack: handlePrintPack,
    onGifLoop: handleGifLoop,
    onOpenGallery: () => setShowGallery(true),
    exportingGif,
    hasImage,
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (file) void processFile(file);
        }}
      />

      <div className={`app-shell${isMobile ? " is-mobile" : ""}`}>
        <main className="app-stage">
          <div className="stage-toolbar">
            {isMobile ? (
              <>
                <button
                  type="button"
                  className={`tool-btn${mobilePreview === "original" ? " active" : ""}`}
                  onClick={() =>
                    setMobilePreview((m) =>
                      m === "ascii" ? "original" : "ascii"
                    )
                  }
                >
                  {mobilePreview === "ascii" ? "Original" : "ASCII"}
                </button>
                <button
                  type="button"
                  className="tool-btn tool-btn-icon"
                  onClick={() =>
                    setTheme((t) => (t === "dark" ? "light" : "dark"))
                  }
                  title={theme === "dark" ? "Light mode (T)" : "Dark mode (T)"}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <ThemeIcon theme={theme} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`tool-btn${showSource ? " active" : ""}`}
                  onClick={() => setShowSource((s) => !s)}
                  title="Split view (V)"
                >
                  Split
                </button>
                <button
                  type="button"
                  className="tool-btn tool-btn-icon"
                  onClick={() =>
                    setTheme((t) => (t === "dark" ? "light" : "dark"))
                  }
                  title={theme === "dark" ? "Light mode (T)" : "Dark mode (T)"}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <ThemeIcon theme={theme} />
                </button>
              </>
            )}
          </div>
          <AsciiPreview
            asciiData={asciiData}
            asciiColors={asciiColors}
            settings={settings}
            canvasRef={canvasRef}
            sourceLabel={sourceLabel}
            isLoading={isLoading}
            previewMode={previewMode}
            imageData={imageData}
          />
        </main>

        <aside className="app-rail desktop-rail">
          <header className="rail-header">
            <div className="rail-brand">
              <h1>ASCII</h1>
              <p>photo to type lab</p>
            </div>
            <a
              className="rail-credit"
              href="https://m1ke.digital"
              target="_blank"
              rel="noopener noreferrer"
            >
              by m1ke.digital
            </a>
          </header>
          <Controls
            {...controlsProps}
            onClear={() => setShowClearConfirm(true)}
          />
        </aside>

        {/* Mobile chrome */}
        <div className="mobile-chrome">
          <div className="mobile-looks" aria-label="Looks">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`mobile-look-chip${
                  activePresetId === preset.id ? " active" : ""
                }`}
                onClick={() => handlePresetSelect(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <nav className="mobile-bar" aria-label="Mobile actions">
            <button type="button" onClick={() => setShowControls(true)}>
              Edit
            </button>
            <button
              type="button"
              className="mobile-bar-primary"
              disabled={!hasImage}
              onClick={() => void handleExport("png")}
            >
              PNG
            </button>
            <button type="button" onClick={() => setShowExport(true)}>
              More
            </button>
          </nav>
        </div>
      </div>

      {showControls && (
        <MobileControlsSheet
          settings={settings}
          onSettingsChange={handleSettingsChange}
          sourceLabel={sourceLabel}
          activeSampleId={activeSampleId}
          activePresetId={activePresetId}
          previewMode={mobilePreview}
          onPreviewModeChange={setMobilePreview}
          onUploadClick={openUpload}
          onSampleSelect={(s) => void loadSample(s, true)}
          onPresetSelect={handlePresetSelect}
          onRandomize={handleRandomize}
          onResetLook={handleResetLook}
          onOpenGallery={() => setShowGallery(true)}
          hasImage={hasImage}
          onClose={() => setShowControls(false)}
        />
      )}
      {showExport && (
        <MobileExportSheet
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onExport={handleExport}
          onCopyText={handleCopyText}
          onCopyLink={handleCopyLink}
          onPrintPack={handlePrintPack}
          onClose={() => setShowExport(false)}
          hasImage={hasImage}
        />
      )}

      {showClearConfirm && (
        <ConfirmationDialog
          title="Reset image?"
          message="Reload the default sample and keep your current look settings."
          confirmText="Reset"
          cancelText="Cancel"
          onConfirm={handleClear}
          onCancel={() => setShowClearConfirm(false)}
          isDangerous
        />
      )}

      {showGallery && (
        <Gallery
          onSelect={handleGallerySelect}
          onClose={() => setShowGallery(false)}
        />
      )}

      <Toast message={toast} />
    </>
  );
}
