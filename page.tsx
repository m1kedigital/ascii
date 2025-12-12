"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Settings = {
  scale: number;      // кількість “клітинок” по ширині умовно (чим більше — тим дрібніше)
  fontSize: number;   // розмір шрифту
  bold: number;       // 0..1
  invert: boolean;
  colored: boolean;   // брати колір з оригіналу чи монохром
  bg: "black" | "white" | "transparent";
  charset: string;
};

const DEFAULT_CHARSET =
  " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function luminance(r: number, g: number, b: number) {
  // sRGB luminance (простий варіант, достатній для ASCII)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function pickChar(v01: number, charset: string) {
  const idx = Math.round(clamp(v01, 0, 1) * (charset.length - 1));
  return charset[idx];
}

export default function Page() {
  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);

  const [settings, setSettings] = useState<Settings>({
    scale: 120, // “детальність”: більше -> дрібніше
    fontSize: 10,
    bold: 0.6,
    invert: false,
    colored: false,
    bg: "black",
    charset: DEFAULT_CHARSET,
  });

  const [asciiText, setAsciiText] = useState<string>("");

  // грузимо зображення
  useEffect(() => {
    if (!imgUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImgEl(img);
    img.src = imgUrl;
    return () => setImgEl(null);
  }, [imgUrl]);

  const fontWeight = useMemo(() => {
    // мапимо 0..1 у 300..900
    const w = Math.round(300 + settings.bold * 600);
    return clamp(w, 300, 900);
  }, [settings.bold]);

  function draw() {
    const inputCanvas = inputCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    if (!inputCanvas || !outputCanvas || !imgEl) return;

    const ctxIn = inputCanvas.getContext("2d", { willReadFrequently: true });
    const ctxOut = outputCanvas.getContext("2d");
    if (!ctxIn || !ctxOut) return;

    // Підганяємо canvas під реальний розмір зображення (але з лімітом, щоб не вбивати браузер)
    const MAX_W = 1400;
    const scaleDown = Math.min(1, MAX_W / imgEl.width);
    const w = Math.max(1, Math.floor(imgEl.width * scaleDown));
    const h = Math.max(1, Math.floor(imgEl.height * scaleDown));

    inputCanvas.width = w;
    inputCanvas.height = h;
    outputCanvas.width = w;
    outputCanvas.height = h;

    ctxIn.clearRect(0, 0, w, h);
    ctxIn.drawImage(imgEl, 0, 0, w, h);

    const imgData = ctxIn.getImageData(0, 0, w, h).data;

    // Розрахунок “кроку” сітки з settings.scale
    // scale тут інтерпретуємо як приблизну кількість колонок
    const cols = clamp(settings.scale, 40, 400);
    const cellW = w / cols;
    const cellH = cellW * 1.8; // корекція під пропорції моношрифту
    const rows = Math.floor(h / cellH);

    // Готуємо фон
    ctxOut.clearRect(0, 0, w, h);
    if (settings.bg !== "transparent") {
      ctxOut.fillStyle = settings.bg === "black" ? "#000" : "#fff";
      ctxOut.fillRect(0, 0, w, h);
    }

    // Налаштування шрифту
    ctxOut.textBaseline = "top";
    ctxOut.font = `${fontWeight} ${settings.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

    let lines: string[] = [];
    for (let r = 0; r < rows; r++) {
      let line = "";
      for (let c = 0; c < cols; c++) {
        const x = Math.floor(c * cellW);
        const y = Math.floor(r * cellH);

        // беремо центр клітинки
        const sx = clamp(Math.floor(x + cellW / 2), 0, w - 1);
        const sy = clamp(Math.floor(y + cellH / 2), 0, h - 1);
        const i = (sy * w + sx) * 4;

        const R = imgData[i];
        const G = imgData[i + 1];
        const B = imgData[i + 2];
        const A = imgData[i + 3];

        // якщо піксель прозорий — пропускаємо як пробіл
        if (A < 10) {
          line += " ";
          continue;
        }

        let lum = luminance(R, G, B) / 255; // 0..1
        if (settings.invert) lum = 1 - lum;

        const ch = pickChar(lum, settings.charset);
        line += ch;

        // малюємо символ
        if (settings.colored) {
          ctxOut.fillStyle = `rgb(${R},${G},${B})`;
        } else {
          ctxOut.fillStyle =
            settings.bg === "white" ? "#000" : "#fff";
        }

        ctxOut.fillText(ch, x, y);
      }
      lines.push(line);
    }

    setAsciiText(lines.join("\n"));
  }

  // перемальовуємо при зміні налаштувань/картинки
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgEl, settings]);

  function onFile(file: File) {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
  }

  function downloadPng() {
    const c = outputCanvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "ascii.png";
    a.click();
  }

  async function copyAscii() {
    await navigator.clipboard.writeText(asciiText);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg">ASCII Editor</div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
              onClick={downloadPng}
              disabled={!imgEl}
            >
              Export PNG
            </button>
            <button
              className="rounded-md bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
              onClick={copyAscii}
              disabled={!asciiText}
            >
              Copy ASCII
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm">
                <span className="mr-2 text-neutral-300">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                />
              </label>

              <div className="text-xs text-neutral-400">
                Tip: higher Scale = more detail
              </div>
            </div>

            <div className="mt-3">
              <canvas ref={outputCanvasRef} className="h-auto w-full rounded-lg bg-black" />
              <canvas ref={inputCanvasRef} className="hidden" />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="text-sm text-neutral-300">Effects and Filters</div>

            <div className="mt-4 space-y-4">
              <Control
                label="Scale"
                value={settings.scale}
                min={40}
                max={400}
                step={1}
                onChange={(v) => setSettings((s) => ({ ...s, scale: v }))}
              />
              <Control
                label="Size"
                value={settings.fontSize}
                min={6}
                max={24}
                step={1}
                onChange={(v) => setSettings((s) => ({ ...s, fontSize: v }))}
              />
              <Control
                label="Bold"
                value={settings.bold}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => setSettings((s) => ({ ...s, bold: v }))}
              />

              <Toggle
                label="Invert"
                checked={settings.invert}
                onChange={(v) => setSettings((s) => ({ ...s, invert: v }))}
              />
              <Toggle
                label="Color"
                checked={settings.colored}
                onChange={(v) => setSettings((s) => ({ ...s, colored: v }))}
              />

              <div className="space-y-2">
                <div className="text-xs text-neutral-400">Background</div>
                <div className="flex gap-2">
                  {(["black", "white", "transparent"] as const).map((bg) => (
                    <button
                      key={bg}
                      className={`rounded-md px-3 py-2 text-sm ${
                        settings.bg === bg ? "bg-neutral-700" : "bg-neutral-800 hover:bg-neutral-700"
                      }`}
                      onClick={() => setSettings((s) => ({ ...s, bg }))}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-neutral-400">Charset</div>
                <textarea
                  className="h-20 w-full resize-none rounded-md border border-neutral-800 bg-neutral-950 p-2 text-xs text-neutral-100"
                  value={settings.charset}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      charset: e.target.value || DEFAULT_CHARSET,
                    }))
                  }
                />
                <div className="text-xs text-neutral-500">
                  Left = light, right = dark (if not inverted)
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-neutral-800 pt-4 text-xs text-neutral-500">
              by <a className="text-neutral-300 hover:underline" href="https://brandson.digital" target="_blank" rel="noreferrer">Brandson</a>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
          <div className="text-xs text-neutral-400">ASCII output</div>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre rounded-lg bg-neutral-950 p-3 text-[10px] leading-[12px] text-neutral-100">
{asciiText || "Upload an image to see ASCII here."}
          </pre>
        </div>
      </div>
    </div>
  );
}

function Control(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-400">{props.label}</div>
        <div className="text-xs text-neutral-300">{String(props.value)}</div>
      </div>
      <input
        className="mt-2 w-full"
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Toggle(props: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-xs text-neutral-400">{props.label}</span>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
    </label>
  );
}
