# Optimisation History

## 1. Have been optimised
- [2026-03-10] Storyblok images were centralized into `storyblok-image.ts` with `/m` transforms, quality controls, and `no_upscale()`.
- [2026-03-10] Storyblok images for sliders and project media now use the shared Storyblok loader and optimized poster URLs.
- [2026-03-04] Storyblok API requests were moved to tag-aware cache settings with hourly `revalidate` for published content and `no-store` for draft content.
- [2026-03-04] Storyblok API webhook revalidation now invalidates tags and paths and flushes Storyblok memory cache.
- [2026-03-10] GSAP-heavy cursor movement now uses `quickTo` for high-frequency pointer updates.
- [2026-03-08] GSAP page transitions now run as a single timeline with staggered block animation.
- [2026-03-10] Three.js and p5.js background engines are lazily imported so inactive themes avoid initial JS cost.
- [2026-03-09] Dithering video rendering now caps FPS and uses visibility-aware frame scheduling.
- [2026-03-11] Storyblok API webhook revalidation now uses `revalidateTag(tag, 'max')` for profile-based cache refresh.
- [2026-03-11] Storyblok image `remotePatterns` now constrain assets to `/f/**` with empty search query strings.
- [2026-03-11] Non-critical layout enhancements now load lazily through client-side dynamic imports.
- [2026-03-11] Unused runtime packages were removed to reduce install size and lockfile churn.
- [2026-03-11] CustomCursor now runs a single RAF pointer loop and uses `quickSetter` for lower-cost high-frequency writes.
- [2026-03-11] CustomCursor now derives hover targets without subtree observers or per-node listener binding.
- [2026-03-11] CustomCursor preview image preloading is now demand-driven on hover instead of eager page-wide scanning.
- [2026-03-11] Root layout no longer wraps the app in `ProjectsProvider`, and `BlokHead` now receives project data directly from the server layout.
- [2026-03-11] `BlokHead` replaced `react-swipeable` with route-scoped native swipe listeners so project swipe logic only runs when needed.
- [2026-03-11] `ActionButtonContainer` now waits for near-viewport visibility before loading `matter-js` and starting physics work.
- [2026-03-11] `ActionButtonContainer` now stops Matter.js runner/RAF loops when items settle, pauses simulation while the document is hidden, tears down physics once all route-scoped buttons have spawned and settled, and keeps a lightweight resize/orientation sync for persisted button positions.
- [2026-03-11] Storyblok Live Preview was fully removed, including preview route, provider bootstrap, and client init code.
- [2026-03-11] `CursorLoader` is now mounted eagerly while still gate-loading the cursor to fine-pointer devices for faster desktop startup.
- [2026-03-11] `BlokHead` theme cycler hover now only rotates the icon and no longer applies next-theme color previews.
- [2026-03-11] Third-party Google Analytics loading now uses Next.js `Script` with `lazyOnload`, and the root bootstrap script now uses `Script` with `beforeInteractive`.
- [2026-03-11] Route-static markdown now renders on the server while inline token-swap rotators stay client-side.
- [2026-03-11] Performance telemetry now tracks Web Vitals and sampled React Profiler commits through a batched ingestion endpoint.
- [2026-03-11] Route prefetching is now intent-driven: project cards prefetch on hover/touch intent, and the project slider disables blanket link prefetch while manually prefetching only active/hovered internal routes.
- [2026-03-11] Markdown handling dependency review was intentionally skipped to avoid unnecessary changes.
- [2026-03-11] Added `app/sitemap.ts` plus robots metadata route output that explicitly includes the sitemap location.

## 2. To Do
- Storyblok API should cache and refresh the `cv` value from `/cdn/spaces/me` to maximize CDN hit rate.
- React Three Fiber dots should move to demand-driven rendering with manual `invalidate` where motion is idle.
- Three.js bird and dots renderers should dynamically scale DPR using real FPS regression signals.
- p5.js sketches should add adaptive `frameRate` tiers based on device capability.
- Add App Router error handling files (`error.tsx`, `global-error.tsx`, and `not-found.tsx`) so runtime failures and 404s are handled through framework boundaries instead of inline JSX fallbacks.
