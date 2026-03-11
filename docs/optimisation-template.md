# Storyblok + Next.js Optimisation Template

Use this checklist for Storyblok-driven Next.js apps and mark each item as done per project.

## Foundation
- [ ] Keep `next`, `react`, `react-dom`, and `@storyblok/react` current and remove unused dependencies early.
- [ ] Use App Router Server Components by default and move only interactive islands to Client Components.
- [ ] Add `error.tsx`, `global-error.tsx`, and `not-found.tsx` boundaries for resilient route-level failure handling.
- [ ] Use ESLint CLI with flat config and run lint in CI on every push and pull request.

## Storyblok API
- [ ] Use tag-aware caching with `revalidate` for published content and `cache: 'no-store'` for draft content.
- [ ] Cache and periodically refresh Storyblok `cv` from `/cdn/spaces/me` to improve CDN hit rate.
- [ ] Trigger webhook revalidation with `revalidateTag(tag, 'max')` and targeted `revalidatePath` calls.
- [ ] Keep Storyblok API access centralized in one fetch layer with strict typing and environment-safe token handling.
- [ ] Disable Storyblok Live Preview in production-focused projects when editorial live editing is not required.

## Storyblok Images
- [ ] Centralize Storyblok image URL building with transform presets (`/m`, quality, fit, and no-upscale guards).
- [ ] Use `next/image` with constrained `remotePatterns` and only allow expected Storyblok asset paths.
- [ ] Generate optimized image and poster variants per component use case (hero, slider, thumbnail, video poster).
- [ ] Avoid upscaling source assets and serve responsive sizes tuned to real layout breakpoints.

## Rendering And Code Splitting
- [ ] Keep always-visible UI elements eagerly loaded and lazy-load non-critical enhancements after first paint.
- [ ] Use route-level dynamic imports for heavy client features and keep content-first sections server-rendered.
- [ ] Convert static markdown rendering to SSR and keep only interactive token swaps client-side.
- [ ] Replace blanket link prefetching with intent-driven prefetching on hover/touch for expensive route sets.

## GSAP And Interaction
- [ ] Use GSAP `quickSetter` or `quickTo` for high-frequency pointer/mouse animations.
- [ ] Collapse pointer updates into a single RAF loop and avoid per-element listeners where delegation works.
- [ ] Prefer timeline batching and stagger orchestration over many independent tweens.
- [ ] Respect reduced motion and pause heavy animation when the document is hidden.

## Three.js, R3F, p5.js, And Physics
- [ ] Lazy-load heavy renderers (`three`, `@react-three/fiber`, `p5`, `matter-js`) only where needed.
- [ ] Use demand-driven rendering (`frameloop="demand"`) and manual `invalidate()` for mostly idle scenes.
- [ ] Add adaptive DPR logic based on sustained FPS regression and gradual recovery thresholds.
- [ ] Apply adaptive frame-rate tiers for p5 sketches based on viewport/device capabilities.
- [ ] Pause or tear down physics/render loops when offscreen, hidden, or settled.

## Third-Party Scripts
- [ ] Load analytics and marketing scripts with Next.js `Script` strategies (`beforeInteractive`, `afterInteractive`, `lazyOnload`) based on criticality.
- [ ] Defer non-essential third-party scripts until after user interaction or idle time.
- [ ] Keep all script loading centralized and documented to prevent duplicate embeds.

## SEO And Metadata
- [ ] Add `app/sitemap.ts` and include sitemap location in robots metadata route output.
- [ ] Keep canonical, Open Graph, and route metadata generation server-side and cache-aware.
- [ ] Ensure crawlable static content exists even when interactive enhancements are disabled.

## Performance Telemetry
- [ ] Capture Web Vitals and sample React Profiler data to a lightweight batched ingestion endpoint.
- [ ] Track perf regressions per route and component group and alert on sustained threshold breaches.
- [ ] Run periodic Lighthouse and real-user monitoring checks and store trend history per release.

## Suggested Rollout Order
- [ ] First pass: dependency cleanup, lint/CI, and Storyblok API/image hardening.
- [ ] Second pass: SSR/client boundary cleanup, lazy loading, and prefetch strategy tuning.
- [ ] Third pass: GSAP/R3F/p5/physics runtime tuning with adaptive frame and DPR logic.
- [ ] Fourth pass: telemetry, SEO metadata completeness, and long-term regression guardrails.
