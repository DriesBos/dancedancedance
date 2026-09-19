'use client';

import { useStore } from '@/store/store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from '@/lib/gsap';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_DIRECTION_THRESHOLD_RATIO = 0.1;
// Matches the `.blokHead` transform transition in BlokHead.module.sass.
const HEAD_SLIDE_MS = 500;
// Fullscreen only: the bottom border (`.blokHead::after`) fades in between
// header height and 20vh of scroll, scrubbed by ScrollTrigger, so it is gone
// while the in-flow header is still in view.
const BORDER_FADE_RATIO = 0.2;

const BlokHeadBehavior = () => {
  // Resolved by class so BlokHead can stay a server component. Declared first
  // so it is set before any effect below reads it.
  const headRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    headRef.current = document.querySelector<HTMLDivElement>('.blok-AnimateHead');
  }, []);
  const fullscreen = useStore((state) => state.fullscreen);
  // `active` = hidden. Starts hidden: in fullscreen that is the in-flow state
  // (see BlokHead.module.sass), so the header scrolls away with the content.
  const [active, setActiveState] = useState(true);
  const activeRef = useRef(true);
  const interactionActiveRef = useRef(false);
  const scrollActiveRef = useRef(true);

  const setActive = useCallback((nextActive: boolean) => {
    if (activeRef.current === nextActive) return;

    activeRef.current = nextActive;
    setActiveState(nextActive);
  }, []);

  const getIsSticky = useCallback(() => {
    const head = headRef.current;
    if (!head) return false;

    return (
      window.scrollY > 0 &&
      head.getBoundingClientRect().top <= 1
    );
  }, [headRef]);

  const syncActive = useCallback(() => {
    const scrollOwnsActive = fullscreen || getIsSticky();

    setActive(
      scrollOwnsActive ? scrollActiveRef.current : interactionActiveRef.current,
    );
  }, [fullscreen, getIsSticky, setActive]);

  const setInteractionActive = useCallback(
    (nextActive: boolean) => {
      interactionActiveRef.current = nextActive;
      syncActive();
    },
    [syncActive],
  );

  const setScrollActive = useCallback(
    (nextActive: boolean) => {
      scrollActiveRef.current = nextActive;
      syncActive();
    },
    [syncActive],
  );

  // Maps `active` (= hidden) onto the fullscreen `data-head` states, see
  // BlokHead.module.sass. Reveal goes parked → hidden (no transition, still
  // off-screen) → shown, so the inner slides in from -100%. Hide goes shown →
  // hidden (slides out) → parked once the slide has finished.
  useEffect(() => {
    const head = headRef.current;
    if (!head) return;

    head.dataset.active = String(active);

    if (!fullscreen) {
      delete head.dataset.head;
      return;
    }

    const inner = head.firstElementChild as HTMLElement;

    if (!active) {
      if (head.dataset.head !== 'hidden') {
        inner.style.transition = 'none';
        head.dataset.head = 'hidden';
        void inner.offsetHeight;
        inner.style.transition = '';
      }
      head.dataset.head = 'shown';
      return;
    }

    if (head.dataset.head !== 'shown' || window.scrollY <= 0) {
      head.dataset.head = 'parked';
      return;
    }

    head.dataset.head = 'hidden';
    const park = window.setTimeout(() => {
      head.dataset.head = 'parked';
    }, HEAD_SLIDE_MS);

    return () => window.clearTimeout(park);
  }, [active, fullscreen, headRef]);

  useEffect(() => {
    syncActive();
  }, [syncActive]);

  useEffect(() => {
    const head = headRef.current;
    if (!head || !fullscreen) return;

    const tween = gsap.fromTo(
      head,
      { '--head-border': 0 },
      {
        '--head-border': 1,
        ease: 'none',
        scrollTrigger: {
          // Fade starts once the in-flow header has fully scrolled out.
          start: () => head.offsetHeight,
          end: () => window.innerHeight * BORDER_FADE_RATIO,
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      head.style.removeProperty('--head-border');
    };
  }, [fullscreen, headRef]);

  useEffect(() => {
    const getMain = () => document.querySelector('main');

    const isWithinInteractionZone = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;

      const main = getMain();
      const topSidePanel = headRef.current?.querySelector('.side_Top') || null;

      return (
        (main ? main.contains(target) : false) ||
        (topSidePanel ? topSidePanel.contains(target) : false)
      );
    };

    const activateFromPointer = (target: EventTarget | null) => {
      if (!isWithinInteractionZone(target)) return;
      setInteractionActive(true);
    };

    const onMouseOver = (event: MouseEvent) => {
      if (isWithinInteractionZone(event.relatedTarget)) return;
      activateFromPointer(event.target);
    };

    const onMouseOut = (event: MouseEvent) => {
      if (!isWithinInteractionZone(event.target)) return;
      if (isWithinInteractionZone(event.relatedTarget)) return;
      setInteractionActive(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      setInteractionActive(isWithinInteractionZone(event.target));
    };

    const listenerOptions: AddEventListenerOptions = {
      passive: true,
      capture: true,
    };

    document.addEventListener('mouseover', onMouseOver, listenerOptions);
    document.addEventListener('mouseout', onMouseOut, listenerOptions);
    document.addEventListener('pointerdown', onPointerDown, listenerOptions);

    return () => {
      document.removeEventListener('mouseover', onMouseOver, listenerOptions);
      document.removeEventListener('mouseout', onMouseOut, listenerOptions);
      document.removeEventListener('pointerdown', onPointerDown, listenerOptions);
    };
  }, [headRef, setInteractionActive]);

  useEffect(() => {
    let rafId: number | null = null;
    let lastScrollY = window.scrollY;
    let scrollStartY = window.scrollY;
    let isScrollingDown = false;

    const resetScrollDirection = (currentScrollY = window.scrollY) => {
      lastScrollY = currentScrollY;
      scrollStartY = currentScrollY;
      isScrollingDown = false;
    };

    const syncScrollController = () => {
      const currentScrollY = window.scrollY;
      const scrollOwnsActive = fullscreen || getIsSticky();

      if (!scrollOwnsActive) {
        scrollActiveRef.current = false;
        resetScrollDirection(currentScrollY);
        syncActive();
        return;
      }

      const scrollThreshold =
        window.innerHeight * SCROLL_DIRECTION_THRESHOLD_RATIO;

      // At the top, hidden and shown coincide (the frame sits at its flow
      // position either way), so reset to hidden here without any movement.
      // Then the next scroll down carries it away with the content.
      if (currentScrollY <= 0) {
        scrollActiveRef.current = true;
        resetScrollDirection(currentScrollY);
        syncActive();
        return;
      }

      const scrollingDown = currentScrollY > lastScrollY;
      if (scrollingDown !== isScrollingDown) {
        scrollStartY = lastScrollY;
        isScrollingDown = scrollingDown;
      }

      const scrollDistance = Math.abs(currentScrollY - scrollStartY);
      if (scrollingDown && scrollDistance > scrollThreshold) {
        setScrollActive(true);
        scrollStartY = currentScrollY;
      } else if (!scrollingDown && scrollDistance > scrollThreshold) {
        setScrollActive(false);
        scrollStartY = currentScrollY;
      } else {
        syncActive();
      }

      lastScrollY = currentScrollY;
    };

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncScrollController();
      });
    };

    const handleResize = () => {
      syncScrollController();
    };

    syncScrollController();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [fullscreen, getIsSticky, setScrollActive, syncActive]);

  return null;
};

export default BlokHeadBehavior;
