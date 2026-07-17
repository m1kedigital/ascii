# ASCII

Photo to type lab. Free, client-side, no uploads.

🔗 [ascii.m1ke.digital](https://ascii.m1ke.digital)

## About

Convert any image into ASCII art with control over character set, density, tone, and color. All processing happens in the browser — no server, no uploads, no tracking.

Built as part of [m1ke.digital](https://m1ke.digital) Labs.

## Features

- Result-first workspace (sample loaded on open)
- Split view (original | ASCII)
- Named looks: Portrait, Logo, Street, Punch, Color, Matrix
- Character sets + custom ramp · dither (ordered / Floyd–Steinberg)
- Density, tile aspect, contrast, shadow lift, highlight clip
- Color modes: mono, preserve, invert
- Backgrounds: black, white, transparent
- Export PNG / JPG / **SVG** · Copy text · Copy share link
- Print pack (4× PNG) · GIF density loop · optional credit mark
- Gallery lookbook · light/dark theme · URL state for looks
- Drag & drop, click, or paste (⌘V) · HEIC (iPhone)
- Keyboard: `1–6` looks · `R` random · `C` copy · `S` PNG · `V` split · `L` link · `T` theme · `G` gallery

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- IBM Plex Mono
- Canvas 2D
- Deployed on Vercel

## Running locally

```bash
git clone git@github.com:m1kedigital/ascii.git
cd ascii
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Brand assets

```bash
node scripts/generate-icons.mjs
```

## License

MIT

---

Built by [@m1kedigital](https://m1ke.digital).
