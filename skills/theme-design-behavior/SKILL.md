---
name: theme-design-behavior
description: Use when changing this repo's LIGHT/DARK/NIGHT theme behavior, design tokens, Sass variables, motion behavior, header/surface stacking, or visual interaction contracts.
---

# Theme And Design Behavior

- Themes are `LIGHT`, `DARK`, and `NIGHT`; keep new theme logic centralized in `src/lib/theme.ts`.
- Initial theme follows browser color preference, with `NIGHT` only for dark preference during the configured night-hour window.
- Do not add `prefers-reduced-motion` handling unless the user explicitly asks.
- Preserve motion-forward transitions and existing GSAP-driven interaction patterns.
- Keep stacking and clickability explicit for header, panels, cursor, overlays, and page-transition surfaces.
- Use Sass variables and component modules consistently; avoid one-off global styling unless the behavior is truly global.
