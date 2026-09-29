import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const newsletterSource = readFileSync(
  new URL('./Newsletter.tsx', import.meta.url),
  'utf8',
);
const formBlueprint = readFileSync(
  new URL('../../../public/__forms.html', import.meta.url),
  'utf8',
);
const netlifyConfig = readFileSync(
  new URL('../../../netlify.toml', import.meta.url),
  'utf8',
);
const legacyRoute = new URL(
  '../../app/api/newsletter/subscribe/route.ts',
  import.meta.url,
);

test('newsletter is registered as a static Netlify form', () => {
  assert.match(formBlueprint, /name="newsletter"/);
  assert.match(formBlueprint, /data-netlify="true"/);
  assert.match(formBlueprint, /netlify-honeypot="company"/);
  assert.match(formBlueprint, /name="form-name" value="newsletter"/);
  assert.match(formBlueprint, /type="email" name="email"/);
  assert.match(formBlueprint, /type="text" name="company"/);
});

test('newsletter submits matching URL-encoded fields to the static form', () => {
  assert.match(newsletterSource, /fetch\('\/__forms\.html'/);
  assert.match(newsletterSource, /application\/x-www-form-urlencoded/);
  assert.match(newsletterSource, /name=\{NETLIFY_FORM_NAME\}/);
  assert.match(newsletterSource, /method="POST"/);
  assert.match(newsletterSource, /data-netlify="true"/);
  assert.match(newsletterSource, /data-netlify-honeypot="company"/);
  assert.match(newsletterSource, /name="form-name" value=\{NETLIFY_FORM_NAME\}/);
  assert.match(newsletterSource, /name="email"/);
  assert.match(newsletterSource, /name="company"/);
  assert.doesNotMatch(newsletterSource, /api\/newsletter\/subscribe/);
});

test('legacy Mailchimp configuration and endpoint are removed', () => {
  assert.equal(existsSync(legacyRoute), false);
  assert.doesNotMatch(netlifyConfig, /api\/newsletter\/subscribe/);
});
