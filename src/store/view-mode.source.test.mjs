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

test('view modes cycle fullscreen, stacked 3D, overview 3D, then wrap', () => {
  const fullscreen = storeSource.indexOf("case 'FULLSCREEN'");
  const stacked = storeSource.indexOf("case 'STACKED_3D'");
  const overview = storeSource.indexOf("case 'OVERVIEW_3D'");

  assert.ok(fullscreen >= 0);
  assert.ok(stacked > fullscreen);
  assert.ok(overview > stacked);
  assert.match(storeSource, /case 'FULLSCREEN':[\s\S]*return 'STACKED_3D'/);
  assert.match(storeSource, /case 'STACKED_3D':[\s\S]*return 'OVERVIEW_3D'/);
  assert.match(storeSource, /case 'OVERVIEW_3D':[\s\S]*return 'FULLSCREEN'/);
});

test('legacy fullscreen is derived only from the fullscreen view mode', () => {
  assert.match(
    storeSource,
    /fullscreen:\s*viewMode === 'FULLSCREEN'/,
  );
  assert.match(
    initSource,
    /data-fullscreen', String\(viewMode === 'FULLSCREEN'\)/,
  );
});

test('initial bootstrap uses fullscreen on mobile and stacked 3D on desktop', () => {
  assert.match(
    layoutSource,
    /isMobile \? 'FULLSCREEN' : 'STACKED_3D'/,
  );
  assert.match(layoutSource, /data-view-mode/);
  assert.match(initSource, /data-view-mode/);
});
