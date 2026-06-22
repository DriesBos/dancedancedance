# Newsletter Input Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize and validate newsletter email input before Mailchimp, and add small bot/rate defenses that fit the current route and form.

**Architecture:** Keep the hardening local to the newsletter route. Normalize the email once at the edge of `POST`, use that normalized value for Mailchimp and the subscriber hash, short-circuit invalid or bot-like payloads before external calls, and add a best-effort in-memory rate limit for casual abuse. Add source tests because this repo currently tests route contracts with `node:test` source assertions.

**Tech Stack:** Next.js App Router route handlers, Node `crypto`, `NextResponse`, `node:test`, existing React newsletter form.

---

### Task 1: Lock Down Route Contract With Source Tests

**Files:**
- Modify: `src/app/api/newsletter/subscribe/route.source.test.mjs`
- Test: `src/app/api/newsletter/subscribe/route.source.test.mjs`

- [ ] **Step 1: Add source tests for normalization, validation, bot gate, and rate gate**

Replace `src/app/api/newsletter/subscribe/route.source.test.mjs` with:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const routeSource = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');

test('newsletter tag failure check relies on Response.ok only', () => {
  assert.match(routeSource, /if \(!tagResponse\.ok\) \{/);
  assert.doesNotMatch(routeSource, /tagResponse\.status !== 204/);
});

test('newsletter route normalizes email once before Mailchimp and hashing', () => {
  assert.match(routeSource, /const normalizeEmail = \(value: unknown\) =>/);
  assert.match(routeSource, /const email = normalizeEmail\(payload\.email\);/);
  assert.match(routeSource, /email_address: email/);
  assert.match(routeSource, /\.update\(email\)/);
  assert.doesNotMatch(routeSource, /\.update\(email\.toLowerCase\(\)\)/);
});

test('newsletter route validates email shape before external calls', () => {
  const invalidEmailIndex = routeSource.indexOf('if (!isValidEmail(email))');
  const firstFetchIndex = routeSource.indexOf('await fetch(');

  assert.notEqual(invalidEmailIndex, -1);
  assert.notEqual(firstFetchIndex, -1);
  assert.ok(invalidEmailIndex < firstFetchIndex);
  assert.match(routeSource, /const isValidEmail = \(email: string\) =>/);
  assert.match(routeSource, /email\.length <= 254/);
});

test('newsletter route has simple bot and rate protection before Mailchimp', () => {
  const botGateIndex = routeSource.indexOf('if (isBotSubmission(payload))');
  const rateLimitIndex = routeSource.indexOf('if (isRateLimited(getClientKey(request)))');
  const firstFetchIndex = routeSource.indexOf('await fetch(');

  assert.notEqual(botGateIndex, -1);
  assert.notEqual(rateLimitIndex, -1);
  assert.notEqual(firstFetchIndex, -1);
  assert.ok(botGateIndex < firstFetchIndex);
  assert.ok(rateLimitIndex < firstFetchIndex);
  assert.match(routeSource, /const RATE_LIMIT_WINDOW_MS = 60_000;/);
  assert.match(routeSource, /const RATE_LIMIT_MAX_REQUESTS = 5;/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:source -- src/app/api/newsletter/subscribe/route.source.test.mjs
```

Expected: FAIL because `normalizeEmail`, `isValidEmail`, `isBotSubmission`, and rate-limit constants do not exist yet.

### Task 2: Normalize And Validate In The Route

**Files:**
- Modify: `src/app/api/newsletter/subscribe/route.ts:1-92`
- Test: `src/app/api/newsletter/subscribe/route.source.test.mjs`

- [ ] **Step 1: Add local helpers above `POST`**

Insert this after the Mailchimp constants:

```ts
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const isValidEmail = (email: string) =>
  email.length > 0 && email.length <= 254 && EMAIL_PATTERN.test(email);
```

- [ ] **Step 2: Parse payload safely and use normalized email everywhere**

Replace:

```ts
const { email } = await request.json();

if (!email) {
  return NextResponse.json({ error: 'Email is required' }, { status: 400 });
}
```

with:

```ts
const payload = await request.json();
const email = normalizeEmail(payload.email);

if (!email) {
  return NextResponse.json({ error: 'Email is required' }, { status: 400 });
}

if (!isValidEmail(email)) {
  return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
}
```

Then replace:

```ts
.update(email.toLowerCase())
```

with:

```ts
.update(email)
```

- [ ] **Step 3: Run source test**

Run:

```bash
pnpm test:source -- src/app/api/newsletter/subscribe/route.source.test.mjs
```

Expected: still FAIL, but only on bot/rate protection.

### Task 3: Add Bot And Rate Protection

**Files:**
- Modify: `src/app/api/newsletter/subscribe/route.ts:1-92`
- Modify: `src/components/Newsletter/Newsletter.tsx:132-150,197-210`
- Test: `src/app/api/newsletter/subscribe/route.source.test.mjs`

- [ ] **Step 1: Add best-effort rate helpers to the route**

Insert this below `isValidEmail`:

```ts
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

const getClientKey = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const firstForwardedIp = forwardedFor?.split(',')[0]?.trim();

  return firstForwardedIp || request.headers.get('x-real-ip') || 'unknown';
};

const isRateLimited = (clientKey: string, now = Date.now()) => {
  const bucket = rateLimitBuckets.get(clientKey);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
};
```

- [ ] **Step 2: Add a honeypot helper**

Insert this below `isRateLimited`:

```ts
interface NewsletterPayload {
  email?: unknown;
  company?: unknown;
}

const isBotSubmission = (payload: NewsletterPayload) =>
  typeof payload.company === 'string' && payload.company.trim().length > 0;
```

- [ ] **Step 3: Wire bot/rate checks before Mailchimp config and fetch**

Change:

```ts
const payload = await request.json();
const email = normalizeEmail(payload.email);
```

to:

```ts
const payload = (await request.json()) as NewsletterPayload;
const email = normalizeEmail(payload.email);
```

Insert this after the email validation block and before the Mailchimp configuration check:

```ts
if (isBotSubmission(payload)) {
  return NextResponse.json(
    { data: 'Successfully subscribed!' },
    { status: 200 }
  );
}

if (isRateLimited(getClientKey(request))) {
  return NextResponse.json(
    { error: 'Too many requests. Try again later.' },
    { status: 429 }
  );
}
```

- [ ] **Step 4: Add the hidden honeypot field to the form**

In `src/components/Newsletter/Newsletter.tsx`, change the request body from:

```ts
body: JSON.stringify({ email }),
```

to:

```ts
body: JSON.stringify({
  email,
  company: formData.get('company'),
}),
```

Add this hidden input inside the form, after the visible email input wrapper:

```tsx
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ display: 'none' }}
        />
```

- [ ] **Step 5: Run source test**

Run:

```bash
pnpm test:source -- src/app/api/newsletter/subscribe/route.source.test.mjs
```

Expected: PASS.

### Task 4: Verify Full Repo Gates

**Files:**
- No edits

- [ ] **Step 1: Run lint**

Run:

```bash
pnpm lint
```

Expected: PASS.

- [ ] **Step 2: Run build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 3: Run typecheck after build**

Run:

```bash
pnpm typecheck
```

Expected: PASS. Run after build to avoid stale Next-generated type artifacts.

- [ ] **Step 4: Review diff**

Run:

```bash
git diff -- src/app/api/newsletter/subscribe/route.ts src/app/api/newsletter/subscribe/route.source.test.mjs src/components/Newsletter/Newsletter.tsx
```

Expected: Diff only contains newsletter route hardening, source tests, and the hidden form honeypot.

- [ ] **Step 5: Commit if requested**

Run only if the user asks for a commit:

```bash
git add src/app/api/newsletter/subscribe/route.ts src/app/api/newsletter/subscribe/route.source.test.mjs src/components/Newsletter/Newsletter.tsx
git commit -m "fix: harden newsletter subscription input"
```

Do not push to `main` unless explicitly asked.

---

Self-review:
- Covers raw email normalization, shape validation before Mailchimp, normalized Mailchimp/hash usage, bot honeypot, rate limiting, and repo verification.
- Keeps changes local to newsletter route and form.
- Avoids new dependencies.
- Uses current repo source-test style.
