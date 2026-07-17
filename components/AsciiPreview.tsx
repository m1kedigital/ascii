"use client";

import { useEffect } from "react";
import type { AsciiSettings } from "@/lib/types";
import { renderAsciiToCanvas } from "@/lib/canvas";

interface AsciiPreviewProps {
  asciiData: string;
  asciiColors: (string | null)[][];
  settings: AsciiSettings;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  sourceLabel?: string;
  isLoading?: boolean;
}

export default function AsciiPreview({
  asciiData,
  asciiColors,
  settings,
  canvasRef,
  sourceLabel,
  isLoading = false,
}: AsciiPreviewProps) {
  useEffect(() => {
    if (canvasRef.current && asciiData) {
      renderAsciiToCanvas(canvasRef.current, asciiData, asciiColors, settings);
    }
  }, [asciiData, asciiColors, settings, canvasRef]);

  return (
    <div className="app-stage-canvas-wrap">
      {isLoading && !asciiData ? (
        <div className="stage-loading">Rendering…</div>
      ) : asciiData ? (
        <canvas ref={canvasRef} />
      ) : (
        <div className="stage-empty">
          <span>Drop an image</span>
          <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--text-dim)" }}>
            or pick a sample
          </span>
        </div>
      )}
      {sourceLabel ? <div className="source-chip">{sourceLabel}</div> : null}
    </div>
  );
}
