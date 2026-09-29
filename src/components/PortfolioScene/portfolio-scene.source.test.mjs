import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const viewportSource = readFileSync(
  new URL('./PortfolioViewport.tsx', import.meta.url),
  'utf8',
);
const sceneSource = readFileSync(
  new URL('./DesktopPortfolioScene.tsx', import.meta.url),
  'utf8',
);

test('the native mobile layout hands off to one desktop scene at 771px', () => {
  assert.match(viewportSource, /\(min-width: 771px\)/);
  assert.match(viewportSource, /routeKey=\{pathname\}/);
  assert.match(viewportSource, /<main className="main">/);
});

test('the desktop scene uses transformed HTML on an orthographic camera', () => {
  assert.match(sceneSource, /<Canvas[\s\S]*orthographic/);
  assert.match(sceneSource, /<Html[\s\S]*distanceFactor=\{400\}[\s\S]*transform/);
});

test('every measured block gets a square footprint', () => {
  assert.match(sceneSource, /depth: width/);
  assert.match(sceneSource, /args=\{\[block\.width, block\.height, block\.depth\]\}/);
});

test('cube geometry is measured before the camera transforms the HTML', () => {
  assert.match(sceneSource, /element\.offsetWidth/);
  assert.match(sceneSource, /element\.offsetHeight/);
  assert.match(sceneSource, /current\.offsetTop/);
  assert.doesNotMatch(sceneSource, /documentElement\.getBoundingClientRect/);
});

test('Three edges match the resolved native border color and width', () => {
  assert.match(sceneSource, /edge: styles\.color/);
  assert.match(sceneSource, /lineWidth=\{colors\.edgeWidth\}/);
});
