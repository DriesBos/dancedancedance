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

## 2. To Do
- Storyblok API should cache and refresh the `cv` value from `/cdn/spaces/me` to maximize CDN hit rate.
- React Three Fiber dots should move to demand-driven rendering with manual `invalidate` where motion is idle.
- Three.js bird and dots renderers should dynamically scale DPR using real FPS regression signals.
- p5.js sketches should add adaptive `frameRate` tiers based on device capability and reduced-motion preferences.
- Performance telemetry should add Web Vitals and React profiler hooks for ongoing regression tracking.
- MatterJS optimisation. Look at the Matter.js instances. Check if we can do optimizations. 
- Optimizing Third-Party Scripts with the Next.js Script Component
- NextJS lazy loading. Analyse components and make a plan for where to implement more lazy loading. Also consider code splitting welcome to Next.js and React best practices. When code splitting, use opportunities to move components to SSR. 
- Analyse the current state of pre-fetching. And if needed, optimize. If it's already looking good, add it to the "have been optimized" list. 
