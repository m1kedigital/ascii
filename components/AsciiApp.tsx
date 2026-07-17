"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { imageToASCII } from "@/lib/ascii";
import { fileToDataUrl, isImageFile, urlToDataUrl } from "@/lib/image";
import {
  DEFAULT_SETTINGS,
  PRESETS,
  SAMPLE_IMAGES,
  type AsciiSettings,
  type SampleImage,
} from "@/lib/types";
import AsciiPreview from "./AsciiPreview";
import Controls from "./Controls";
import Toast from "./Toast";
import MobileControlsSheet from "./MobileControlsSheet";
import MobileExportSheet from "./MobileExportSheet";
import ConfirmationDialog from "./ConfirmationDialog";

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AsciiApp() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const loadSample = useCallback(
    async (sample: SampleImage) => {
      setIsLoading(true);
      try {
        const dataUrl = await urlToDataUrl(sample.url);
        setImageData(dataUrl);
        setSourceLabel(sample.label);
        setActiveSampleId(sample.id);
      } catch {
        showToast("Could not load sample");
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  // Result-first: load default sample on mount
  useEffect(() => {
    void loadSample(SAMPLE_IMAGES[0]);
  }, [loadSample]);

  // Generate ASCII when image or settings change
  useEffect(() => {
    if (!imageData) {
      setAsciiData("");
      setAsciiColors([]);
      return;
    }

    const img = new Image();
    img.onload = () => {
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
        setIsLoading(false);
      }
    };
    img.onerror = () => {
      setIsLoading(false);
      showToast("Could not load image");
    };
    img.src = imageData;
  }, [imageData, settings, showToast]);

  const processFile = useCallback(
    async (file: File) => {
      if (!isImageFile(file)) {
        showToast("Unsupported file type");
        return;
      }
      setIsLoading(true);
      try {
        const dataUrl = await fileToDataUrl(file);
        setImageData(dataUrl);
        setSourceLabel(file.name.replace(/\.[^.]+$/, "") || "Upload");
        setActiveSampleId(null);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not read file");
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  // Paste image
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

  // Drag & drop
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      e.preventDefault();
    };
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
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSettings((prev) => ({ ...prev, ...preset.settings }));
    setActivePresetId(presetId);
  }, []);

  const handleRandomize = useCallback(() => {
    setSettings((prev) => {
      const charsets: AsciiSettings["charset"][] = [
        "standard",
        "dense",
        "blocks",
        "binary",
        "dots",
      ];
      return {
        ...prev,
        charset: charsets[Math.floor(Math.random() * charsets.length)],
        cellSize: 6 + Math.floor(Math.random() * 10),
        tileAspect: 0.45 + Math.round(Math.random() * 12) * 0.05,
        contrast: 0.8 + Math.round(Math.random() * 12) * 0.1,
        cutDarks: Math.round(Math.random() * 12) * 0.01,
        cutLights: Math.round(Math.random() * 10) * 0.01,
      };
    });
    setActivePresetId(null);
    showToast("Look randomized");
  }, [showToast]);

  const handleExport = useCallback(
    (format: "png" | "jpg") => {
      if (!canvasRef.current || !asciiData) return;
      const canvas = canvasRef.current;
      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const slug = slugify(sourceLabel || "art");
      const filename = `ascii-${slug}-${settings.exportSize}x.${format}`;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const link = document.createElement("a");
            link.href = canvas.toDataURL(
              mimeType,
              format === "jpg" ? 0.95 : undefined
            );
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast(`Exported ${format.toUpperCase()}`);
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showToast(`Exported ${format.toUpperCase()}`);
        },
        mimeType,
        format === "jpg" ? 0.95 : undefined
      );
    },
    [asciiData, settings.exportSize, sourceLabel, showToast]
  );

  const handleCopyText = useCallback(async () => {
    if (!asciiData) return;
    try {
      await navigator.clipboard.writeText(asciiData.trimEnd());
      showToast("ASCII copied");
    } catch {
      showToast("Could not copy");
    }
  }, [asciiData, showToast]);

  // Keyboard: S = PNG snapshot
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "s" && e.key !== "S") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      handleExport("png");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleExport]);

  const handleClear = useCallback(() => {
    setShowClearConfirm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    void loadSample(SAMPLE_IMAGES[0]);
  }, [loadSample]);

  const openUpload = () => fileInputRef.current?.click();
  const hasImage = Boolean(imageData && asciiData);

  const controlsProps = {
    settings,
    onSettingsChange: handleSettingsChange,
    sourceLabel,
    activeSampleId,
    activePresetId,
    onUploadClick: openUpload,
    onSampleSelect: (s: SampleImage) => void loadSample(s),
    onPresetSelect: handlePresetSelect,
    onExport: handleExport,
    onCopyText: handleCopyText,
    onRandomize: handleRandomize,
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

      <div className="app-shell">
        <main className="app-stage">
          <AsciiPreview
            asciiData={asciiData}
            asciiColors={asciiColors}
            settings={settings}
            canvasRef={canvasRef}
            sourceLabel={sourceLabel}
            isLoading={isLoading}
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

        <nav className="mobile-bar" aria-label="Mobile actions">
          <button type="button" onClick={() => setShowControls(true)}>
            Controls
          </button>
          <button type="button" onClick={() => setShowExport(true)}>
            Export
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => setShowClearConfirm(true)}
          >
            Reset
          </button>
        </nav>
      </div>

      {showControls && (
        <MobileControlsSheet
          {...controlsProps}
          onClose={() => setShowControls(false)}
        />
      )}
      {showExport && (
        <MobileExportSheet
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onExport={handleExport}
          onCopyText={handleCopyText}
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

      <Toast message={toast} />
    </>
  );
}
