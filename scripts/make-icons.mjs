#!/usr/bin/env node
// Generates the PWA / touch / social PNG icons from simple geometry (no dependencies).
// Run with `npm run icons`; outputs are committed to src/assets/icons.
import { deflateSync, crc32 } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/assets/icons');

const BG = [10, 33, 30];
const GOLD = [212, 175, 55];
const EMERALD = [16, 185, 129];

function png(width, height, rgba) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Render the logo in a 100×100 design space.
 * @param {object} o  rounded: corner radius for the tile (0 = full bleed), scale: logo scale around its center
 */
function render(width, height, { rounded = 20, scale = 1, transparent = true } = {}) {
  const buf = Buffer.alloc(width * height * 4);
  const S = 4; // supersampling per axis
  const unit = Math.min(width, height) / 100;
  const ox = (width - 100 * unit) / 2;
  const oy = (height - 100 * unit) / 2;

  const inTile = (x, y) => {
    if (!rounded) return true;
    const r = rounded;
    const cx = Math.min(Math.max(x, r), 100 - r);
    const cy = Math.min(Math.max(y, r), 100 - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= 0 && x <= 100 && y >= 0 && y <= 100;
  };
  const logo = (x, y) => {
    // Map into logo space (scaled around the center 50,50).
    const lx = 50 + (x - 50) / scale;
    const ly = 50 + (y - 50) / scale;
    if ((lx - 50) ** 2 + (ly - 47) ** 2 <= 12 * 12) return EMERALD;
    if (Math.abs(lx - 50) + Math.abs(ly - 47) <= 27) return GOLD;
    return null;
  };

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const x = (px + (sx + 0.5) / S - ox) / unit;
          const y = (py + (sy + 0.5) / S - oy) / unit;
          const tile = width === height ? inTile(x, y) : true;
          if (!tile) continue;
          const c = logo(x, y) || BG;
          r += c[0];
          g += c[1];
          b += c[2];
          a += 255;
        }
      }
      const n = S * S;
      const i = (py * width + px) * 4;
      if (!transparent) {
        const cov = a / 255 / n;
        buf[i] = Math.round(r / n + BG[0] * (1 - cov));
        buf[i + 1] = Math.round(g / n + BG[1] * (1 - cov));
        buf[i + 2] = Math.round(b / n + BG[2] * (1 - cov));
        buf[i + 3] = 255;
      } else {
        const count = a / 255;
        buf[i] = count ? Math.round(r / count) : 0;
        buf[i + 1] = count ? Math.round(g / count) : 0;
        buf[i + 2] = count ? Math.round(b / count) : 0;
        buf[i + 3] = Math.round(a / n);
      }
    }
  }
  return png(width, height, buf);
}

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0a211e"/><path d="M50 20 L77 47 L50 74 L23 47 Z" fill="#d4af37"/><circle cx="50" cy="47" r="12" fill="#10b981"/></svg>\n`;

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, 'favicon.svg'), SVG);
await writeFile(join(OUT, 'icon-192.png'), render(192, 192));
await writeFile(join(OUT, 'icon-512.png'), render(512, 512));
// Maskable: full-bleed background, logo inside the 80% safe zone.
await writeFile(join(OUT, 'maskable-512.png'), render(512, 512, { rounded: 0, scale: 0.8, transparent: false }));
// iOS ignores transparency; use an opaque full-bleed tile.
await writeFile(join(OUT, 'apple-touch-icon.png'), render(180, 180, { rounded: 0, scale: 0.9, transparent: false }));
await writeFile(join(OUT, 'og-image.png'), render(1200, 630, { rounded: 0, scale: 0.8, transparent: false }));
console.log(`Icons written to ${OUT}`);
