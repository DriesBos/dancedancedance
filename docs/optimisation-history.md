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

## 2. To Do
- Storyblok API revalidation should use `revalidateTag(tag, 'max')` in the webhook route for current Next.js semantics.
- Storyblok API should cache and refresh the `cv` value from `/cdn/spaces/me` to maximize CDN hit rate.
- GSAP pointer code should benchmark `quickSetter` for immediate-set branches to cut per-event overhead further.
- GSAP target discovery should avoid broad `document.querySelectorAll` scans on every mutation.
- React Three Fiber dots should move to demand-driven rendering with manual `invalidate` where motion is idle.
- Three.js bird and dots renderers should dynamically scale DPR using real FPS regression signals.
- p5.js sketches should add adaptive `frameRate` tiers based on device capability and reduced-motion preferences.
- Next.js layout should lazy-load non-critical client UI blocks to reduce the 206 kB first-load bundle.
- Performance telemetry should add Web Vitals and React profiler hooks for ongoing regression tracking.
- MatterJS optimisation
