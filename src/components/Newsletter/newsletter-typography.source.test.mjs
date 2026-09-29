import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const newsletterSource = readFileSync(
  new URL('./Newsletter.tsx', import.meta.url),
  'utf8',
);
const colorBurstSource = readFileSync(
  new URL('../ColorBurstTypography/ColorBurstText.tsx', import.meta.url),
  'utf8',
);

test('newsletter state labels preserve color-burst character markup', () => {
  assert.match(
    newsletterSource,
    /const ScrambledColorBurstText = \(\{ text \}: \{ text: string \}\)/,
  );
  assert.match(
    newsletterSource,
    /<ColorBurstText accessibleText=\{text\}>\{displayText\}<\/ColorBurstText>/,
  );
  assert.match(
    newsletterSource,
    /<ScrambledColorBurstText text=\{message\} \/>/,
  );
  assert.match(
    newsletterSource,
    /<ScrambledColorBurstText text=\{buttonText\} \/>/,
  );
  assert.match(
    newsletterSource,
    /<ColorBurstText>Enter your email<\/ColorBurstText>/,
  );
  assert.doesNotMatch(newsletterSource, /element\.textContent = text/);
});

test('newsletter submission returns to idle after terminal feedback', () => {
  assert.match(
    newsletterSource,
    /type SubmissionStatus = 'idle' \| 'submitting' \| 'success' \| 'error'/,
  );
  assert.match(newsletterSource, /setSubmissionStatus\('success'\)/);
  assert.match(newsletterSource, /setSubmissionStatus\('error'\)/);
  assert.match(
    newsletterSource,
    /setTimeout\(\(\) => \{\s*setSubmissionStatus\('idle'\)/,
  );
  assert.match(newsletterSource, /\? 'Thank you!'/);
  assert.match(newsletterSource, /\? 'Submitting\.\.\.'/);
  assert.doesNotMatch(newsletterSource, /setIsLoading/);
});

test('color-burst text can keep a stable accessible label while scrambling', () => {
  assert.match(colorBurstSource, /accessibleText\?: string/);
  assert.match(colorBurstSource, /\{accessibleText \?\? children\}/);
});
