"use client";

import { useEffect } from "react";
import type { AsciiSettings } from "@/lib/types";
import { renderAsciiToCanvas } from "@/lib/canvas";

export type PreviewMode = "ascii" | "original" | "split";

interface AsciiPreviewProps {
  asciiData: string;
  asciiColors: (string | null)[][];
  settings: AsciiSettings;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  sourceLabel?: string;
  isLoading?: boolean;
  /** desktop split | mobile toggles ascii/original */
  previewMode?: PreviewMode;
  imageData?: string | null;
}

export default function AsciiPreview({
  asciiData,
  asciiColors,
  settings,
  canvasRef,
  sourceLabel,
  isLoading = false,
  previewMode = "ascii",
  imageData = null,
}: AsciiPreviewProps) {
  useEffect(() => {
    if (previewMode === "original") return;
    if (canvasRef.current && asciiData) {
      renderAsciiToCanvas(canvasRef.current, asciiData, asciiColors, settings, {
        forExport: true,
      });
    }
  }, [asciiData, asciiColors, settings, canvasRef, previewMode]);

  const showOriginal = previewMode === "original" || previewMode === "split";
  const showAscii = previewMode === "ascii" || previewMode === "split";
  const isSplit = previewMode === "split";

  return (
    <div
      className={`app-stage-canvas-wrap${isSplit ? " split" : ""}${
        previewMode === "original" ? " original-only" : ""
      }`}
    >
      {showOriginal && imageData ? (
        <div className={`split-pane source-pane${isSplit ? "" : " solo"}`}>
          {isSplit ? <div className="pane-label">Original</div> : null}
          <img src={imageData} alt="Source" className="source-image" />
        </div>
      ) : null}

      {showAscii ? (
        <div className={`split-pane ascii-pane${isSplit ? "" : " solo"}`}>
          {isSplit ? <div className="pane-label">ASCII</div> : null}
          {isLoading && !asciiData ? (
            <div className="stage-loading">Rendering…</div>
          ) : asciiData ? (
            <div className="canvas-frame">
              {isLoading ? <div className="stage-busy">Updating…</div> : null}
              <canvas ref={canvasRef} />
            </div>
          ) : (
            <div className="stage-empty">
              <span>Drop an image</span>
              <span className="stage-empty-sub">or pick a sample</span>
            </div>
          )}
        </div>
      ) : null}

      {sourceLabel ? <div className="source-chip">{sourceLabel}</div> : null}
    </div>
  );
}
