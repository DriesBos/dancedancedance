'use client';

import { useLayoutEffect } from 'react';

const HEADER_INIT_COMPLETE_ATTR = 'data-header-init-complete';
const HEADER_INTRO_VISIBLE_ATTR = 'data-header-intro-visible';
const ENTRANCE_ANIMATION = 'blokEnter';

const getHeaderTarget = () =>
  document.querySelector<HTMLElement>('.blok-AnimateHead');

const hasHeaderInitCompleted = () =>
  document.body?.getAttribute(HEADER_INIT_COMPLETE_ATTR) === 'true';

const markHeaderInitCompleted = () => {
  document.body?.setAttribute(HEADER_INIT_COMPLETE_ATTR, 'true');
};

const markHeaderIntroVisible = () => {
  document.body?.setAttribute(HEADER_INTRO_VISIBLE_ATTR, 'true');
};

export default function HeaderInitAnimation() {
  useLayoutEffect(() => {
    // The header's fade/slide runs from CSS (`.blok-AnimateHead`, slot 0 of
    // the shared entrance) so it starts at first paint. This effect only
    // waits for that animation to finish and then flips the body flags that
    // gate the header's scroll-lift behavior.
    const complete = () => {
      markHeaderInitCompleted();
      markHeaderIntroVisible();
    };

    if (hasHeaderInitCompleted()) {
      markHeaderIntroVisible();
      return;
    }

    const headerTarget = getHeaderTarget();
    if (!headerTarget) {
      complete();
      return;
    }

    const animation = headerTarget
      .getAnimations()
      .find((a): a is CSSAnimation => (a as CSSAnimation).animationName === ENTRANCE_ANIMATION);

    if (!animation || animation.playState === 'finished') {
      complete();
      return;
    }

    animation.finished.then(complete).catch(() => {});
  }, []);

  return null;
}
