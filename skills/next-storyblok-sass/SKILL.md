---
name: next-storyblok-sass
description: Use when changing this repo's Next.js App Router pages, Storyblok blok/component rendering, Sass modules, global Sass rules, or source tests for those surfaces.
---

# Next, Storyblok, Sass

- Treat Storyblok blok components in `src/components/storyblok/` as the content rendering boundary.
- Keep page routing and metadata behavior in `src/app/`; do not move route behavior into leaf components unless the existing pattern already does.
- Prefer component-local `.module.sass` for styling. Touch `src/assets/styles/global.sass` only for true global element, layout, variable, or cross-component rules.
- Preserve row/blok behavior ownership: `BlokContainer`, `Row`, and `data-column-behaviour` own column visibility and stacking.
- For logic that can be tested without a browser, add or update `*.source.test.mjs` near the source.
- Verify with `pnpm test:source`, `pnpm lint`, `pnpm build`, and `pnpm typecheck` when behavior or runtime code changes.
