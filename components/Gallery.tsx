"use client";

import { GALLERY, PRESETS, SAMPLE_IMAGES } from "@/lib/types";

interface GalleryProps {
  onSelect: (sampleId: string, lookId: string) => void;
  onClose: () => void;
}

export default function Gallery({ onSelect, onClose }: GalleryProps) {
  return (
    <>
      <div className="dialog-backdrop" onClick={onClose} />
      <div className="gallery-modal" role="dialog" aria-modal="true">
        <div className="gallery-header">
          <div>
            <h2>Made with ASCII</h2>
            <p>Lookbook · tap to load sample + look</p>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="gallery-grid">
          {GALLERY.map((item) => {
            const sample = SAMPLE_IMAGES.find((s) => s.id === item.sampleId);
            const look = PRESETS.find((p) => p.id === item.lookId);
            if (!sample) return null;
            return (
              <button
                key={item.id}
                type="button"
                className="gallery-card"
                onClick={() => {
                  onSelect(item.sampleId, item.lookId);
                  onClose();
                }}
              >
                <div className="gallery-card-media">
                  <img src={sample.url} alt={item.title} />
                  <span className="gallery-look">{look?.label ?? item.lookId}</span>
                </div>
                <div className="gallery-card-meta">
                  <strong>{item.title}</strong>
                  <span>{item.caption}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
