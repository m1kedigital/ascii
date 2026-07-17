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
  showSource?: boolean;
  imageData?: string | null;
}

export default function AsciiPreview({
  asciiData,
  asciiColors,
  settings,
  canvasRef,
  sourceLabel,
  isLoading = false,
  showSource = false,
  imageData = null,
}: AsciiPreviewProps) {
  useEffect(() => {
    if (canvasRef.current && asciiData) {
      renderAsciiToCanvas(canvasRef.current, asciiData, asciiColors, settings, {
        forExport: true,
      });
    }
  }, [asciiData, asciiColors, settings, canvasRef]);

  return (
    <div className={`app-stage-canvas-wrap${showSource ? " split" : ""}`}>
      {showSource && imageData ? (
        <div className="split-pane source-pane">
          <div className="pane-label">Original</div>
          <img src={imageData} alt="Source" className="source-image" />
        </div>
      ) : null}

      <div className={`split-pane ascii-pane${showSource ? "" : " solo"}`}>
        {showSource ? <div className="pane-label">ASCII</div> : null}
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

      {sourceLabel ? <div className="source-chip">{sourceLabel}</div> : null}
    </div>
  );
}
