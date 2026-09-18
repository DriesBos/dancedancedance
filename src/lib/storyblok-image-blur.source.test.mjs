import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

const helper = stripTypeScriptTypes(readFileSync(new URL('./storyblok-image.ts', import.meta.url), 'utf8'));
const source = stripTypeScriptTypes(readFileSync(new URL('./storyblok-image-blur.ts', import.meta.url), 'utf8'))
  .replace(/import .* from '.\/storyblok-image';/, '');
const { addStoryblokImageBlurs } = await import(`data:text/javascript;base64,${Buffer.from(helper + '\n' + source).toString('base64')}`);

test('blur enrichment deduplicates assets, preserves CMS data, and tolerates unavailable previews', async (t) => {
  const filename = 'https://a.storyblok.com/f/123/100x100/abc/photo.png';
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls++;
    assert.match(url, /\/m\/8x0\//);
    return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/webp' } });
  });
  const input = { body: [{ component: 'Column Image', image: { filename } }, { component: 'Column Slider', images: [{ filename }], images_mobile: [{ filename }] }] };
  const result = await addStoryblokImageBlurs(input);
  assert.equal(calls, 1);
  assert.equal(result.body[0].image.blurDataURL, 'data:image/webp;base64,AQID');
  assert.equal(result.body[1].images_mobile[0].blurDataURL, 'data:image/webp;base64,AQID');
  assert.equal(input.body[0].image.blurDataURL, undefined);
  globalThis.fetch.mock.mockImplementation(async () => { throw new Error('offline'); });
  assert.deepEqual(await addStoryblokImageBlurs(input), input);
});
