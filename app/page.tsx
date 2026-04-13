"use client";

import { useRef, useState, useEffect } from "react";
import AsciiConverter from "@/components/AsciiConverter";

const SAMPLE_IMAGES = [
  {
    url: "/samples/01-architecture.jpg",
    alt: "Lisbon cobblestone street",
  },
  {
    url: "/samples/02-street.jpg",
    alt: "Man walking in Barcelona",
  },
  {
    url: "/samples/03-nature.jpg",
    alt: "Waves on rocky coastline",
  },
  {
    url: "/samples/04-object.jpg",
    alt: "Gondolas over city",
  },
];

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleImageLoad = (dataUrl: string) => {
    setImageData(dataUrl);
  };

  const handleImageClear = () => {
    setImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = async (file: File) => {
    if (file && (file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".heic"))) {
      console.log("Processing file:", file.name, file.type, file.size);

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error("File too large");
        return;
      }

      try {
        let fileToProcess = file;

        // Convert HEIC to JPEG on iPhone
        if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic")) {
          console.log("HEIC format detected, converting to JPEG...");
          try {
            const heic2anyModule = await import("heic2any");
            const heic2anyFn = heic2anyModule.default;
            const convertedData = await heic2anyFn({
              blob: file,
              toType: "image/jpeg",
            });
            // heic2any can return Blob or Blob[], ensure we get a single Blob
            const blob = Array.isArray(convertedData) ? convertedData[0] : (convertedData as Blob);
            fileToProcess = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
            console.log("HEIC converted to JPEG successfully");
          } catch (err) {
            console.error("HEIC conversion failed, trying original:", err);
            // Continue with original file if conversion fails
          }
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === "string") {
            console.log("File read as data URL, length:", event.target.result.length);

            // On iOS/Safari, re-encode through canvas to handle EXIF rotation
            const img = new Image();
            img.onload = () => {
              console.log("Image loaded:", img.width, "x", img.height);

              // Create canvas and redraw to normalize (handles EXIF rotation, etc)
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");

              if (ctx) {
                // Draw directly without background to preserve transparency/original colors
                ctx.drawImage(img, 0, 0);
                // Convert to JPEG to avoid PNG transparency issues on mobile
                const normalizedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
                console.log("Image re-encoded via canvas to JPEG");
                handleImageLoad(normalizedDataUrl);
              } else {
                // Fallback if canvas context fails
                handleImageLoad(event.target!.result as string);
              }
            };

            img.onerror = () => {
              console.error("Failed to load image");
              // On error, try original directly
              handleImageLoad(event.target!.result as string);
            };

            // Add delay for iOS to ensure image is fully ready
            const result = event.target!.result as string;
            setTimeout(() => {
              img.src = result;
            }, 100);
          }
        };
        reader.onerror = () => {
          console.error("Failed to read file");
        };
        reader.readAsDataURL(fileToProcess);
      } catch (err) {
        console.error("Error processing file:", err);
      }
    }
  };

  const handleSampleClick = (url: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        handleImageLoad(canvas.toDataURL("image/jpeg"));
      }
    };
    img.src = url;
  };

  // Detect mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) {
              void processFile(file);
            }
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFile]);

  return (
    <div className="flex flex-col bg-[#0a0a0a] text-white" style={{ height: "100dvh" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (file) {
            processFile(file);
          }
        }}
      />

      {!imageData ? (
        <div
          className="flex flex-1 flex-col items-center justify-center relative transition-colors"
          style={{
            backgroundColor: isDragging ? "#0f0f0f" : "#0a0a0a",
          }}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) {
              void processFile(file);
            }
          }}
        >
          {/* Viewport corner markers */}
          <div
            className="absolute top-10 left-10 w-4 h-4 border-t border-l transition-all"
            style={{
              borderColor: isDragging ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
            }}
          ></div>
          <div
            className="absolute top-10 right-10 w-4 h-4 border-t border-r transition-all"
            style={{
              borderColor: isDragging ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
            }}
          ></div>
          <div
            className="absolute bottom-10 left-10 w-4 h-4 border-b border-l transition-all"
            style={{
              borderColor: isDragging ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
            }}
          ></div>
          <div
            className="absolute bottom-10 right-10 w-4 h-4 border-b border-r transition-all"
            style={{
              borderColor: isDragging ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
            }}
          ></div>

          {/* Unified centered content block */}
          <div className="flex flex-col items-center">
            {/* Heading group - clickable to open file picker */}
            <div
              className="text-center cursor-pointer select-none"
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="font-medium uppercase"
                style={{
                  fontSize: "28px",
                  letterSpacing: "0.08em",
                }}
              >
                DROP IMAGE HERE
              </div>
              <div
                className="text-[#707070] text-xs tracking-widest uppercase"
                style={{
                  marginTop: "8px",
                  letterSpacing: "0.08em",
                }}
              >
                OR CLICK TO BROWSE
              </div>
              <div
                className="text-[#505050] text-[10px] tracking-[0.1em] uppercase"
                style={{
                  marginTop: "6px",
                  letterSpacing: "0.1em",
                }}
              >
                OR PASTE FROM CLIPBOARD (⌘V)
              </div>
            </div>

            {/* Samples section */}
            <div
              className="flex flex-col items-center"
              style={{ marginTop: "48px" }}
            >
              <div
                className="text-[#707070] text-[10px] tracking-[0.1em] uppercase text-center"
                style={{ letterSpacing: "0.1em" }}
              >
                TRY WITH SAMPLE
              </div>
              <div
                className="flex items-center justify-center"
                style={{ marginTop: "16px", gap: "12px" }}
              >
                {SAMPLE_IMAGES.map((sample, idx) => (
                  <SampleImage
                    key={idx}
                    url={sample.url}
                    alt={sample.alt}
                    onClick={() => handleSampleClick(sample.url)}
                  />
                ))}
              </div>
            </div>

            {/* Credit line */}
            <a
              href="https://unsplash.com/@m1kedigital"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#505050] text-[10px] tracking-[0.1em] uppercase hover:text-[#707070] transition-colors text-center"
              style={{
                marginTop: "20px",
                letterSpacing: "0.1em",
              }}
            >
              photos by @m1kedigital on unsplash
            </a>
          </div>
        </div>
      ) : (
        <AsciiConverter
          imageData={imageData}
          onClear={handleImageClear}
          fileInputRef={fileInputRef}
        />
      )}

      {/* Footer - only on drop image page */}
      {!imageData ? (
        <div className="px-8 absolute bottom-20" style={{ left: "0", right: "0" }}>
          <div className="text-center">
            <a
              href="https://m1ke.digital"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#707070] text-[11px] hover:text-white transition-colors"
              style={{ letterSpacing: "0.05em" }}
            >
              by{" "}
              <span className="text-white hover:text-[#707070] transition-colors">
                m1ke.digital
              </span>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface SampleImageProps {
  url: string;
  alt: string;
  onClick: () => void;
}

function SampleImage({ url, alt, onClick }: SampleImageProps) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer transition-opacity group flex-shrink-0"
      style={{ width: "80px", height: "80px" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img
        src={url}
        alt={alt}
        loading="eager"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Corner markers */}
      <div
        className="absolute top-1 left-1 w-2 h-2 border-t border-l transition-all pointer-events-none"
        style={{
          borderColor: hover ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
        }}
      ></div>
      <div
        className="absolute top-1 right-1 w-2 h-2 border-t border-r transition-all pointer-events-none"
        style={{
          borderColor: hover ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
        }}
      ></div>
      <div
        className="absolute bottom-1 left-1 w-2 h-2 border-b border-l transition-all pointer-events-none"
        style={{
          borderColor: hover ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
        }}
      ></div>
      <div
        className="absolute bottom-1 right-1 w-2 h-2 border-b border-r transition-all pointer-events-none"
        style={{
          borderColor: hover ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
        }}
      ></div>
    </button>
  );
}
