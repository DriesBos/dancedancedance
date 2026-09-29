import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const storeSource = readFileSync(new URL('./store.tsx', import.meta.url), 'utf8');
const initSource = readFileSync(
  new URL('../components/AppInitStore.tsx', import.meta.url),
  'utf8',
);
const layoutSource = readFileSync(
  new URL('../app/layout.tsx', import.meta.url),
  'utf8',
);

test('camera tracks cycle fullscreen, structure, angled, then wrap', () => {
  const fullscreen = storeSource.indexOf("case 'FULLSCREEN'");
  const structure = storeSource.indexOf("case 'STRUCTURE'");
  const angled = storeSource.indexOf("case 'ANGLED'");

  assert.ok(fullscreen >= 0);
  assert.ok(structure > fullscreen);
  assert.ok(angled > structure);
  assert.match(storeSource, /case 'FULLSCREEN':[\s\S]*return 'STRUCTURE'/);
  assert.match(storeSource, /case 'STRUCTURE':[\s\S]*return 'ANGLED'/);
  assert.match(storeSource, /case 'ANGLED':[\s\S]*return 'FULLSCREEN'/);
});

test('legacy fullscreen is derived only from the fullscreen camera track', () => {
  assert.match(
    storeSource,
    /fullscreen:\s*cameraTrack === 'FULLSCREEN'/,
  );
  assert.match(
    initSource,
    /data-fullscreen', String\(cameraTrack === 'FULLSCREEN'\)/,
  );
});

test('initial bootstrap uses fullscreen on mobile and structure on desktop', () => {
  assert.match(
    layoutSource,
    /isMobile \? 'FULLSCREEN' : 'STRUCTURE'/,
  );
  assert.match(layoutSource, /data-camera-track/);
  assert.match(initSource, /data-camera-track/);
});
