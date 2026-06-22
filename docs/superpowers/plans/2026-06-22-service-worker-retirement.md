# Service Worker Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the low-value offline service worker runtime while cleaning up already-installed workers and caches for existing production visitors.

**Architecture:** Keep `manifest.webmanifest` and app icon metadata because they are static metadata, not runtime fetch interception. Replace production service worker registration with a small retirement routine that unregisters existing same-origin workers and deletes old `driesbos-webapp-*` caches. Delete `public/sw.js` after the cleanup path exists, so new visitors have no service worker surface and returning visitors get cleaned up when the app loads online.

**Tech Stack:** Next.js App Router, React client component effects, browser Service Worker and Cache Storage APIs, Node source tests.

---

### Task 1: Add Source Guard For SW Retirement

**Files:**
- Modify: `src/components/maintenance-refactors.source.test.mjs`
- Test: `src/components/maintenance-refactors.source.test.mjs`

- [ ] **Step 1: Write the failing test**

Add `existsSync` to the existing filesystem import:

```js
import { existsSync, readFileSync } from 'node:fs';
```

Append this test to `src/components/maintenance-refactors.source.test.mjs`:

```js
test('service worker runtime is retired with explicit cleanup', () => {
  const source = readSource('./ClientEnhancements.tsx');
  const serviceWorkerFile = new URL('../../public/sw.js', import.meta.url);

  assert.equal(
    existsSync(serviceWorkerFile),
    false,
    'public/sw.js should be removed when offline shell caching is retired',
  );
  assert.doesNotMatch(source, /serviceWorker\.register/);
  assert.match(source, /retireServiceWorker/);
  assert.match(source, /getRegistrations/);
  assert.match(source, /\.unregister\(\)/);
  assert.match(source, /driesbos-webapp-/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec node --test src/components/maintenance-refactors.source.test.mjs
```

Expected: FAIL because `public/sw.js` still exists and `ClientEnhancements` still calls `navigator.serviceWorker.register('/sw.js')`.

- [ ] **Step 3: Commit**

Do not commit yet. This task is only red-state test setup.

---

### Task 2: Replace Registration With Retirement Cleanup

**Files:**
- Modify: `src/components/ClientEnhancements.tsx`
- Test: `src/components/maintenance-refactors.source.test.mjs`

- [ ] **Step 1: Implement the minimal cleanup helper**

Replace the current service worker registration `useEffect` logic in `src/components/ClientEnhancements.tsx` with this module-level helper and effect:

```tsx
const RETIRED_SERVICE_WORKER_CACHE_PREFIX = 'driesbos-webapp-';

const retireServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => registration.scope === `${window.location.origin}/`)
      .map((registration) => registration.unregister()),
  );

  if (!('caches' in window)) {
    return;
  }

  const cacheNames = await window.caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) =>
        cacheName.startsWith(RETIRED_SERVICE_WORKER_CACHE_PREFIX),
      )
      .map((cacheName) => window.caches.delete(cacheName)),
  );
};

export default function ClientEnhancements() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    void retireServiceWorker();
  }, []);

  return (
    <>
      <CursorLoader />
      <TitleSwitcher />
      <FaviconSwitcher />
    </>
  );
}
```

- [ ] **Step 2: Run focused test**

Run:

```bash
pnpm exec node --test src/components/maintenance-refactors.source.test.mjs
```

Expected: still FAIL because `public/sw.js` has not been deleted yet.

- [ ] **Step 3: Check lint/type risk locally**

Run:

```bash
pnpm lint
```

Expected: PASS with no `no-unused-vars` or hook dependency errors.

---

### Task 3: Delete The Service Worker File

**Files:**
- Delete: `public/sw.js`
- Test: `src/components/maintenance-refactors.source.test.mjs`

- [ ] **Step 1: Remove the file**

Delete:

```bash
rm public/sw.js
```

- [ ] **Step 2: Run focused test**

Run:

```bash
pnpm exec node --test src/components/maintenance-refactors.source.test.mjs
```

Expected: PASS. The test should confirm `public/sw.js` is gone, registration is gone, and cleanup remains.

- [ ] **Step 3: Commit**

Commit only after full verification in Task 4, because this task depends on the cleanup helper from Task 2.

---

### Task 4: Verify No PWA Runtime Regression

**Files:**
- Verify: `src/components/ClientEnhancements.tsx`
- Verify: `public/manifest.webmanifest`
- Verify: `src/app/layout.tsx`

- [ ] **Step 1: Confirm manifest stays static**

Run:

```bash
rg -n "manifest.webmanifest|serviceWorker|sw\\.js" src public netlify.toml
```

Expected:
- `src/app/layout.tsx` still exposes `manifest: '/manifest.webmanifest'`.
- `public/manifest.webmanifest` still exists.
- `src/components/ClientEnhancements.tsx` contains cleanup only.
- No `serviceWorker.register`.
- No `public/sw.js`.

- [ ] **Step 2: Run source tests**

Run:

```bash
pnpm test:source
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm lint
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Run typecheck**

Run after build finishes:

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Review diff**

Run:

```bash
git diff -- src/components/ClientEnhancements.tsx src/components/maintenance-refactors.source.test.mjs public/sw.js
```

Expected:
- `ClientEnhancements` no longer registers `/sw.js`.
- `ClientEnhancements` unregisters same-origin service workers in production.
- `ClientEnhancements` deletes `driesbos-webapp-*` caches.
- `public/sw.js` is deleted.
- Source test locks the retirement behavior.

- [ ] **Step 7: Commit**

```bash
git add src/components/ClientEnhancements.tsx src/components/maintenance-refactors.source.test.mjs public/sw.js
git commit -m "refactor: retire service worker runtime"
```

---

### Task 5: Follow-Up Removal Decision

**Files:**
- Optional future modify: `src/components/ClientEnhancements.tsx`

- [ ] **Step 1: Decide after one production deploy window**

After enough production traffic has had a chance to run the cleanup effect, decide whether to remove the retirement helper entirely.

- [ ] **Step 2: If removing cleanup later, add a new red test**

In a separate later change, update the source test to require no `serviceWorker` API usage at all:

```js
test('service worker runtime stays fully absent', () => {
  const source = readSource('./ClientEnhancements.tsx');
  const serviceWorkerFile = new URL('../../public/sw.js', import.meta.url);

  assert.equal(existsSync(serviceWorkerFile), false);
  assert.doesNotMatch(source, /serviceWorker/);
  assert.doesNotMatch(source, /caches/);
});
```

- [ ] **Step 3: Remove cleanup code only in that later change**

Delete `retireServiceWorker`, `RETIRED_SERVICE_WORKER_CACHE_PREFIX`, and the production cleanup effect from `ClientEnhancements`.

- [ ] **Step 4: Verify later cleanup-removal change**

Run:

```bash
pnpm test:source && pnpm lint && pnpm build && pnpm typecheck
```

Expected: PASS.

---

## Self-Review

- Spec coverage: Plan retires the service worker runtime, keeps static manifest metadata, and handles existing installed workers.
- Placeholder scan: No placeholders remain.
- Type consistency: Helper names, cache prefix, and test assertions match across tasks.
