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

## Browser Checks

- Use the `/_next/mcp` checks from `skills/next-dev-loop/SKILL.md` for Next.js runtime verification.
- In Codex Desktop, use the in-app browser for isolated localhost checks by default. Use connected Chrome when the user explicitly requests it or existing Chrome state/extensions matter. Check visible behavior and browser console output, then cross-check `get_compilation_issues`, `get_errors`, and `get_page_metadata` through `/_next/mcp`.
- Do not launch `pnpm exec agent-browser` from the Codex Desktop sandbox. Its Chrome for Testing child cannot register with macOS and causes crash notifications. Do not retry the launch or misdiagnose it as an app failure.
- Use the full `agent-browser` path from `next-dev-loop` only outside the app sandbox or against an externally started Chrome CDP endpoint. Reserve it for React fiber/render-count or vitals checks that managed browser control cannot provide.
- Fall back to source inspection only when both managed browser surfaces are unavailable, and state that live browser proof is missing.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
