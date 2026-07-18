import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const index = await readFile(resolve(dist, 'index.html'), 'utf8');
const manifestHref = index.match(/<link rel="manifest" href="([^"]+)"/)?.[1];
if (!manifestHref) throw new Error('Built index does not link the manifest');
const manifest = JSON.parse(await readFile(resolve(dist, manifestHref.replace(/^\//, '')), 'utf8'));
const worker = await readFile(resolve(dist, 'sw.js'), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(manifest.name === 'Mira', 'Manifest name is missing');
assert(manifest.display === 'standalone', 'Manifest must use standalone display');
assert(manifest.start_url === '/' && manifest.scope === '/', 'Manifest scope/start_url must cover the app');
assert(index.includes('apple-touch-icon'), 'Built index does not include an Apple touch icon');
assert(worker.includes("request.mode === 'navigate'"), 'Service worker has no navigation fallback');
assert(worker.includes("caches.match('/')"), 'Service worker has no cached app-shell fallback');
new Function(worker);

for (const shellFile of ['manifest.webmanifest', 'mira-favicon.svg', 'mira-logo-transparent.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'privacy.html']) {
  assert((await stat(resolve(dist, shellFile))).size > 0, `App-shell file is missing: ${shellFile}`);
}

const expectedIcons = new Map([
  ['/icon-192.png', [192, 192]],
  ['/icon-512.png', [512, 512]],
  ['/icon-maskable-512.png', [512, 512]],
]);

for (const icon of manifest.icons ?? []) {
  const expected = expectedIcons.get(icon.src);
  assert(expected, `Unexpected manifest icon: ${icon.src}`);
  const file = resolve(dist, icon.src.slice(1));
  assert((await stat(file)).size > 1_000, `Icon is unexpectedly small: ${icon.src}`);
  const bytes = await readFile(file);
  assert(bytes.subarray(1, 4).toString('ascii') === 'PNG', `Icon is not PNG: ${icon.src}`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert(width === expected[0] && height === expected[1], `Wrong icon dimensions for ${icon.src}: ${width}x${height}`);
}

assert((manifest.icons ?? []).length === expectedIcons.size, 'Manifest icon set is incomplete');
console.log('PWA artifacts verified: manifest, service worker, offline shell and install icons.');
