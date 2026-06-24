# Home Project Thumbnail Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a homepage-only fixed thumbnail layer for project list hovers.

**Architecture:** Keep sort/search and row hover dispatch inside `BlokProjectListClient`, and move fixed thumbnail placement/lifetime into `ThumbnailWrapper`. Reuse existing Storyblok thumbnail URLs. Disable the old `CustomCursor` preview path for this project list.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Sass modules, GSAP, Storyblok image helper.

---

### Task 1: Add Local Thumbnail Layer

**Files:**
- Modify: `src/components/storyblok/BlokProjectListClient.tsx`
- Create: `src/components/storyblok/BlokProjectListClient.module.sass`
- Create: `src/components/storyblok/ThumbnailWrapper.tsx`
- Create: `src/components/storyblok/ThumbnailWrapper.module.sass`
- Modify: `src/components/BlokProject.tsx`
- Modify: `src/components/maintenance-refactors.source.test.mjs`

- [x] Add a source test that checks `BlokProject` can disable cursor previews and `ThumbnailWrapper` owns the thumbnail layer.
- [x] In `BlokProject`, add `disableCursorPreview?: boolean` and only emit `cursorPreview` class/data when it is false.
- [x] In `BlokProjectListClient`, create hover/leave event handlers and active row state.
- [x] In `ThumbnailWrapper`, append a thumbnail item to a fixed layer, randomly place it, animate in, linger, animate out, then remove it.
- [x] Add Sass module classes for the fixed wrapper, square item, contained image, and active row z-index.
- [x] Run `pnpm test:source`, then `pnpm lint`, `pnpm build`, `pnpm typecheck`.
