'use client';

import { useStore } from '@/store/store';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

type Props = {
  headRef: RefObject<HTMLDivElement | null>;
};

type HeadSurface = 'transparent' | 'solid';

const SCROLL_DIRECTION_THRESHOLD_RATIO = 0.1;

const BlokHeadBehavior = ({ headRef }: Props) => {
  const fullscreen = useStore((state) => state.fullscreen);
  const [active, setActiveState] = useState(false);
  const activeRef = useRef(false);
  const interactionActiveRef = useRef(false);
  const scrollActiveRef = useRef(false);

  const setActive = useCallback((nextActive: boolean) => {
    if (activeRef.current === nextActive) return;

    activeRef.current = nextActive;
    setActiveState(nextActive);
  }, []);

  const setHeadSurface = useCallback(
    (surface: HeadSurface) => {
      const head = headRef.current;
      if (!head) return;
      if (head.dataset.surface === surface) return;

      head.dataset.surface = surface;
    },
    [headRef],
  );

  const setHeadScrollStart = useCallback(() => {
    const head = headRef.current;
    if (!head) return;

    const nextScrollStart = String(window.scrollY <= 10);
    if (head.dataset.scrollStart === nextScrollStart) return;

    head.dataset.scrollStart = nextScrollStart;
  }, [headRef]);

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

    setHeadSurface(scrollOwnsActive ? 'solid' : 'transparent');
    setActive(
      scrollOwnsActive ? scrollActiveRef.current : interactionActiveRef.current,
    );
  }, [fullscreen, getIsSticky, setActive, setHeadSurface]);

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

  useEffect(() => {
    const head = headRef.current;
    if (!head) return;

    head.dataset.active = String(active);
  }, [active, headRef]);

  useEffect(() => {
    syncActive();
  }, [syncActive]);

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
      setHeadScrollStart();

      if (!scrollOwnsActive) {
        scrollActiveRef.current = false;
        resetScrollDirection(currentScrollY);
        syncActive();
        return;
      }

      const scrollThreshold =
        window.innerHeight * SCROLL_DIRECTION_THRESHOLD_RATIO;

      if (currentScrollY < scrollThreshold) {
        scrollActiveRef.current = false;
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
  }, [fullscreen, getIsSticky, setHeadScrollStart, setScrollActive, syncActive]);

  return null;
};

export default BlokHeadBehavior;
