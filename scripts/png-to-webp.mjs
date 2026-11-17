// Converts the site's PNG images to lossless WebP (pixel-identical, 40–60% smaller) and removes the PNGs.
// Run once after adding a new PNG to public/assets: `node scripts/png-to-webp.mjs`, then point the markup
// at the .webp file.
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..', 'public', 'assets');
const pngs = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pngs(path);
    return name.endsWith('.png') ? [path] : [];
  });

for (const png of pngs(root)) {
  const webp = png.replace(/\.png$/, '.webp');
  // keepIccProfile: some PNGs carry a color profile, and dropping it shifts their colors in the browser.
  // exact: keep the color of fully transparent pixels too, so the file decodes to the same pixels.
  await sharp(png).keepIccProfile().webp({ lossless: true, exact: true, effort: 6 }).toFile(webp);
  const before = statSync(png).size;
  const after = statSync(webp).size;
  // Keep the PNG if the WebP isn't smaller, so the script never makes a file heavier.
  if (after >= before) {
    unlinkSync(webp);
    console.log(`kept   ${png} (WebP not smaller)`);
    continue;
  }
  unlinkSync(png);
  console.log(`${png.slice(root.length + 1)}: ${(before / 1024) | 0} KB -> ${(after / 1024) | 0} KB`);
}
