const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

async function files(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.filter(e => e.name !== 'optimized').map(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? files(full) : full.endsWith('.png') ? [full] : [];
  }));
  return nested.flat();
}

(async () => {
  const manifest = {};
  let before = 0;
  let after = 0;
  // Keep originals, including full-resolution certificate scans, for future edits.
  for (const file of await files(publicDir)) {
    const relative = path.relative(publicDir, file).replaceAll('\\', '/');
    const output = 'optimized/' + relative.replace(/\.png$/, '.webp');
    const limit = /handwritten|cursive/.test(relative) ? 1100 : relative.includes('wordmark') ? 640 : relative.includes('icon') ? 320 : 1800;
    await fs.mkdir(path.dirname(path.join(publicDir, output)), { recursive: true });
    const info = await sharp(file).resize({ width: limit, withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 100, effort: 5 })
      .toFile(path.join(publicDir, output));
    manifest['/' + relative] = '/' + output;
    const original = (await fs.stat(file)).size;
    before += original;
    after += info.size;
    console.log(`${relative}: ${Math.round(original / 1024)} -> ${Math.round(info.size / 1024)} KB`);
  }
  await fs.writeFile(path.join(root, 'lib/image-assets.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Total: ${(before / 1048576).toFixed(2)} -> ${(after / 1048576).toFixed(2)} MiB`);
})().catch(error => { console.error(error); process.exitCode = 1; });
