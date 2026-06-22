---
name: zustand-ui-state
description: Use when changing shared UI state, theme state, locale state, fullscreen state, page-content reveal state, or Zustand actions in this repo.
---

# Zustand UI State

- Shared UI state lives in `src/store/store.tsx`; avoid adding a second global state system.
- Keep state shape small and explicit: theme, locale, fullscreen, page-content visibility, reveal key, and initial intro flags belong in the store.
- Keep component-only hover, focus, animation, and temporary interaction state local to the component.
- Route theme decisions through `src/lib/theme.ts`; store actions should apply decisions, not duplicate theme rules.
- When adding actions, name them as verbs in camelCase and keep each action focused on one UI transition.
- Update source tests when theme bootstrap, reveal behavior, or default-state contracts change.
