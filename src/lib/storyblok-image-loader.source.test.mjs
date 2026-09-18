import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

test('responsive loader uses Storyblok sizing and preserves quality and no-upscale', async () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  const source = read('./storyblok-image.ts') + '\n' +
    read('./storyblok-image-loader.ts').replace(/^import .*;$/gm, '');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  });
  const { default: loader } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
  const src = 'https://a.storyblok.com/f/123/2400x1600/abc/photo.jpg';
  assert.equal(loader({ src, width: 640 }), `${src}/m/640x0/filters:quality(70):no_upscale()`);
  assert.equal(loader({ src, width: 1200, quality: 80 }), `${src}/m/1200x0/filters:quality(80):no_upscale()`);
  assert.equal(loader({ src: '/logo.svg', width: 640 }), '/logo.svg');
});
