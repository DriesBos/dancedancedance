# Agents Notes

- Tech stack: Next.js, App Router, React, TypeScript, pnpm, Storyblok, Sass/CSS Modules, Zustand, GSAP, Mux, and Netlify.
- State management: keep shared UI state in the Zustand store at `src/store/store.tsx`; keep component-only interaction state local.
- Theming/design: themes are explicit `LIGHT`/`DARK`/`NIGHT` tokens wired through `src/lib/theme.ts`, Sass variables/modules, Storyblok blok components, and motion-forward UI transitions.
- Local skills: use the repo skills in `skills/` when working on Next/Storyblok/Sass, Zustand UI state, or theme/design behavior.
- Naming conventions: use PascalCase for React components and component folders, camelCase for functions/state/actions, UPPERCASE for theme constants, and kebab-case for route segments, data attributes, and behavior values.
- Do not add reduced motion preference handling (`prefers-reduced-motion`); this project intentionally keeps motion enabled unless the user explicitly asks otherwise.
- Don't push to main unless specifically asked to do so.

## Deploy Checks

- Netlify site id: `413466f9-c196-4d8d-8058-b83cda25c765`.
- Netlify project: `https://app.netlify.com/projects/dries-bos`.
- Production URL: `https://www.driesbos.com`.
- When debugging deploys, inspect GitHub first:
  - `gh pr checks <pr-number>`
  - `gh api repos/DriesBos/dancedancedance/commits/<sha>/check-runs --jq '{total_count, check_runs: [.check_runs[] | {name, status, conclusion, html_url, app: .app.slug}]}'`
  - `gh api repos/DriesBos/dancedancedance/commits/<sha>/status --jq '{state: .state, statuses: [.statuses[] | {context, state, target_url, description}]}'`
- If GitHub points to a Netlify deploy id, inspect that deploy next with the Netlify connector: `get-deploy-for-site` using the site id above and the deploy id from GitHub/Netlify.
- GitHub Actions deploys require repository secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`; branch protection expects required checks `check`, `deploy-preview`, and `netlify/dries-bos/deploy-preview`.
