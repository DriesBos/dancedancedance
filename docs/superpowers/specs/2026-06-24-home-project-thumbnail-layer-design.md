# Home Project Thumbnail Layer Design

## Goal

Prototype a Waka Waka-style hover thumbnail interaction for the homepage project list only.

## Decisions

- Replace the current cursor-follow thumbnail for homepage project rows.
- Leave existing stack order alone, then add the thumbnail layer above content/header and below the custom cursor.
- Lift the active whole project row above the thumbnail layer.
- Use a fixed full-viewport thumbnail layer with `pointer-events: none`.
- Place thumbnails randomly inside `var(--spacing-base)` viewport padding.
- Use true random placement on every hover.
- Use a square thumbnail container with the image contained inside it.
- Size thumbnails from the reference site's `25vw` hover-item rhythm, while capping and clamping them to stay inside the viewport.
- Allow thumbnail overlap.
- Use reference timing: item fade/scale in, linger after hover-out, then fade out.
- Keep the homepage project rows from translating on hover so hovered rows do not move away from the pointer.
- Do not add reduced-motion handling.

## Architecture

Keep sort/search and row hover dispatch local to `BlokProjectListClient`, where the sorted/filtered homepage project rows already render. Pass all project thumbnail data into `ThumbnailWrapper`; it owns the fixed full-viewport layer, random placement, and hover-out lifetime. Pass a `disableCursorPreview` prop to `BlokProject` so this list no longer triggers the global cursor preview. Add component-local Sass modules for the fixed wrapper and active row z-index.

## Verification

Run `pnpm test:source`, `pnpm lint`, `pnpm build`, and `pnpm typecheck` after implementation.
