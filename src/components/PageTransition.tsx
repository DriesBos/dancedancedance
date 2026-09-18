'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/store';

interface PageTransitionProps {
  children: React.ReactNode;
}

const ENTRANCE_ANIMATION = 'blokEnter';

// The route and theme the entrance last ran for. Module scope rather than a
// ref, because this component remounts on a client-side route change and a ref
// would come back empty exactly when the footer needs replaying. It is reset
// per document, so a full page load always starts from null.
let lastEntrance: { pathname: string; theme: string } | null = null;

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const theme = useStore((state) => state.theme);

  // Force top on every client-side route change.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const scrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    html.getClientRects();
    window.scrollTo(0, 0);
    html.style.scrollBehavior = scrollBehavior;
  }, [pathname]);

  // Replay the CSS entrance on route and theme change. Page bloks remount and
  // would replay on their own, but the footer lives in the layout and never
  // does, so every animated blok is restarted together here.
  //
  // The theme is read off <body> instead of the store: the inline script in the
  // layout puts the resolved theme there before first paint, so the entrance
  // already ran with it. The store starts on its own default and catches up in
  // a layout effect during hydration, and that catch-up must not count as a
  // change, or the entrance would run a second time on every initial load.
  useLayoutEffect(() => {
    const committed = { pathname, theme: document.body?.dataset.theme ?? '' };
    const previous = lastEntrance;
    lastEntrance = committed;

    if (
      !previous ||
      (previous.pathname === committed.pathname && previous.theme === committed.theme)
    ) {
      return;
    }

    document.body.dataset.entranceDone = 'true';

    const blockTargets = document.querySelectorAll<HTMLElement>('.blok-Animate');

    for (const blockTarget of blockTargets) {
      for (const animation of blockTarget.getAnimations()) {
        if ((animation as CSSAnimation).animationName !== ENTRANCE_ANIMATION) {
          continue;
        }
        animation.cancel();
        animation.play();
      }
    }
  }, [pathname, theme]);

  return <>{children}</>;
}
