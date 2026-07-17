/**
 * Minimal GIF89a encoder for small animated loops (RGBA ImageData frames).
 * Quantizes each frame to a shared 16-color gray palette for size/speed.
 */

function lzwEncode(indexStream: number[], minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const maxCode = () => 1 << codeSize;

  type Dict = Map<string, number>;
  let dict: Dict = new Map();

  const reset = () => {
    dict = new Map();
    for (let i = 0; i < clearCode; i++) dict.set(String(i), i);
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
  };

  const out: number[] = [];
  let cur = 0;
  let curBits = 0;

  const write = (code: number) => {
    cur |= code << curBits;
    curBits += codeSize;
    while (curBits >= 8) {
      out.push(cur & 0xff);
      cur >>= 8;
      curBits -= 8;
    }
  };

  reset();
  write(clearCode);

  let w = String(indexStream[0] ?? 0);
  for (let i = 1; i < indexStream.length; i++) {
    const k = String(indexStream[i]);
    const wk = w + "," + k;
    if (dict.has(wk)) {
      w = wk;
    } else {
      write(dict.get(w)!);
      if (nextCode < 4096) {
        dict.set(wk, nextCode++);
        if (nextCode > maxCode() && codeSize < 12) codeSize++;
      } else {
        write(clearCode);
        reset();
      }
      w = k;
    }
  }
  write(dict.get(w)!);
  write(eoiCode);
  if (curBits > 0) out.push(cur & 0xff);
  return out;
}

function toIndexed(data: ImageData, paletteSize: number): {
  indices: number[];
  palette: number[]; // RGB triples length paletteSize*3
} {
  const palette: number[] = [];
  for (let i = 0; i < paletteSize; i++) {
    const g = Math.round((i / (paletteSize - 1)) * 255);
    palette.push(g, g, g);
  }

  const indices: number[] = new Array(data.width * data.height);
  const px = data.data;
  for (let i = 0, p = 0; i < px.length; i += 4, p++) {
    const lum = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) * (px[i + 3] / 255);
    const idx = Math.min(
      paletteSize - 1,
      Math.max(0, Math.round((lum / 255) * (paletteSize - 1)))
    );
    indices[p] = idx;
  }
  return { indices, palette };
}

function writeBlocks(bytes: number[]): number[] {
  const out: number[] = [];
  let i = 0;
  while (i < bytes.length) {
    const n = Math.min(255, bytes.length - i);
    out.push(n);
    for (let j = 0; j < n; j++) out.push(bytes[i++]);
  }
  out.push(0);
  return out;
}

export function encodeGifFrames(frames: ImageData[], delayCs: number): Blob {
  if (frames.length === 0) throw new Error("No frames");
  const w = frames[0].width;
  const h = frames[0].height;
  const paletteSize = 16;
  const minCodeSize = 4; // 2^4 = 16

  const bytes: number[] = [];
  const u8 = (n: number) => bytes.push(n & 0xff);
  const u16 = (n: number) => {
    bytes.push(n & 0xff, (n >> 8) & 0xff);
  };

  // Header
  bytes.push(...[0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF89a
  u16(w);
  u16(h);
  // GCT flag, 4-bit color resolution-1, sort, GCT size
  u8(0x80 | 0x70 | (Math.log2(paletteSize) - 1));
  u8(0); // bg
  u8(0); // aspect

  // Global palette from first frame
  const first = toIndexed(frames[0], paletteSize);
  for (let i = 0; i < paletteSize * 3; i++) {
    u8(first.palette[i] ?? 0);
  }

  // Netscape loop extension
  bytes.push(0x21, 0xff, 0x0b);
  bytes.push(...[0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30]); // NETSCAPE2.0
  u8(3);
  u8(1);
  u16(0); // loop forever
  u8(0);

  for (const frame of frames) {
    const { indices } = toIndexed(frame, paletteSize);

    // Graphic Control Extension
    bytes.push(0x21, 0xf9, 0x04);
    u8(0x00); // disposal 0
    u16(delayCs);
    u8(0); // transparent index
    u8(0);

    // Image descriptor
    bytes.push(0x2c);
    u16(0);
    u16(0);
    u16(w);
    u16(h);
    u8(0); // no local CT

    u8(minCodeSize);
    const compressed = lzwEncode(indices, minCodeSize);
    bytes.push(...writeBlocks(compressed));
  }

  bytes.push(0x3b); // trailer
  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}
