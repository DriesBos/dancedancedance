# Agents Notes

- Tech stack: Next.js, App Router, React, TypeScript, pnpm, Storyblok, Sass/CSS Modules, Zustand, GSAP, Mux, and Netlify.
- State management: keep shared UI state in the Zustand store at `src/store/store.tsx`; keep component-only interaction state local.
- Theming/design: themes are explicit `LIGHT`/`DARK`/`NIGHT` tokens wired through `src/lib/theme.ts`, Sass variables/modules, Storyblok blok components, and motion-forward UI transitions.
- Local skills: use the repo skills in `skills/` when working on Next/Storyblok/Sass, Zustand UI state, or theme/design behavior.
- Naming conventions: use PascalCase for React components and component folders, camelCase for functions/state/actions, UPPERCASE for theme constants, and kebab-case for route segments, data attributes, and behavior values.
- Do not add reduced motion preference handling (`prefers-reduced-motion`); this project intentionally keeps motion enabled unless the user explicitly asks otherwise.
- Don't push to main unless specifically asked to do so.
