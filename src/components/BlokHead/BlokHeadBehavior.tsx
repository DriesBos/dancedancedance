'use client';

import { gsap } from '@/lib/gsap';
import { useStore } from '@/store/store';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useShallow } from 'zustand/react/shallow';

type Props = {
  headRef: RefObject<HTMLDivElement | null>;
  headSentinelRef: RefObject<HTMLDivElement | null>;
};

type TopPanelMode = 'open' | 'closed' | 'forcedClosed';
type HeadSurface = 'transparent' | 'solid';

const MOBILE_HEAD_ANIMATION_MEDIA_QUERY = '(hover: none), (pointer: coarse)';
const MOBILE_HEAD_ANIMATION_DELAY = 1000;

const BlokHeadBehavior = ({ headRef, headSentinelRef }: Props) => {
  const { fullscreen, topPanel, setTopPanelTrue, setTopPanelFalse } = useStore(
    useShallow((state) => ({
      fullscreen: state.fullscreen,
      topPanel: state.topPanel,
      setTopPanelTrue: state.setTopPanelTrue,
      setTopPanelFalse: state.setTopPanelFalse,
    })),
  );
  const isThreeDLayout = !fullscreen;
  const [hasScrollBorder, setHasScrollBorder] = useState(false);
  const [isTopPanelForcedClosed, setIsTopPanelForcedClosed] = useState(false);
  const [hasMobileHeadAnimationMedia, setHasMobileHeadAnimationMedia] =
    useState(false);
  const isHoveringTopPanelZoneRef = useRef(false);
  const isMobileHeadAnimationLayout =
    isThreeDLayout && hasMobileHeadAnimationMedia;

  const animateHead = useCallback(
    (vars: gsap.TweenVars) => {
      if (!headRef.current) return;

      gsap.to(headRef.current, {
        duration: 0.33,
        ease: 'power1.inOut',
        overwrite: 'auto',
        ...vars,
      });
    },
    [headRef],
  );

  const isPagePastTop = useCallback(() => {
    const page = document.querySelector('.page');
    if (page instanceof HTMLElement) {
      return page.getBoundingClientRect().top < 0;
    }
    return window.scrollY > 0;
  }, []);

  const setHeadSurface = useCallback(
    (surface: HeadSurface) => {
      const head = headRef.current;
      if (!head) return;

      head.dataset.surface = surface;
    },
    [headRef],
  );

  const setTopPanelMode = useCallback(
    (mode: TopPanelMode) => {
      if (mode === 'open') {
        setIsTopPanelForcedClosed(false);
        setTopPanelTrue();
        return;
      }

      if (mode === 'forcedClosed') {
        setIsTopPanelForcedClosed(true);
        setTopPanelFalse();
        return;
      }

      setIsTopPanelForcedClosed(false);
      setTopPanelFalse();
    },
    [setTopPanelTrue, setTopPanelFalse],
  );

  const handleTopPanel = useCallback(
    (e: MouseEvent) => {
      if (!headRef.current || !isThreeDLayout) return;
      const pagePastTop = isPagePastTop();

      if (e.type === 'mouseenter') {
        isHoveringTopPanelZoneRef.current = true;
      } else if (e.type === 'mouseleave') {
        isHoveringTopPanelZoneRef.current = false;
      }

      if (e.type === 'mouseenter') {
        if (pagePastTop) {
          setHeadSurface('solid');
          setTopPanelMode('forcedClosed');
          animateHead({ yPercent: 0 });
          return;
        }

        setHeadSurface('transparent');
        setTopPanelMode('open');
        animateHead({ yPercent: -100 });
      } else {
        setHeadSurface(pagePastTop ? 'solid' : 'transparent');
        setTopPanelMode(pagePastTop ? 'forcedClosed' : 'closed');
        animateHead({ yPercent: 0 });
      }
    },
    [
      headRef,
      isThreeDLayout,
      isPagePastTop,
      animateHead,
      setHeadSurface,
      setTopPanelMode,
    ],
  );

  const openTopPanelFromTouch = useCallback(() => {
    if (!headRef.current || !isThreeDLayout) return;

    if (isPagePastTop()) {
      setHeadSurface('solid');
      setTopPanelMode('forcedClosed');
      animateHead({ yPercent: 0 });
      return;
    }

    isHoveringTopPanelZoneRef.current = true;
    setHeadSurface('transparent');
    setTopPanelMode('open');
    animateHead({ yPercent: -100 });
  }, [
    headRef,
    isThreeDLayout,
    isPagePastTop,
    animateHead,
    setHeadSurface,
    setTopPanelMode,
  ]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia(MOBILE_HEAD_ANIMATION_MEDIA_QUERY);

    const syncMobileHeadAnimationMedia = () => {
      setHasMobileHeadAnimationMedia(mediaQuery.matches);
    };

    syncMobileHeadAnimationMedia();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMobileHeadAnimationMedia);
    } else {
      mediaQuery.addListener(syncMobileHeadAnimationMedia);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', syncMobileHeadAnimationMedia);
      } else {
        mediaQuery.removeListener(syncMobileHeadAnimationMedia);
      }
    };
  }, []);

  useEffect(() => {
    const head = headRef.current;
    if (!head) return;

    head.dataset.active = String(topPanel);
  }, [headRef, topPanel]);

  useEffect(() => {
    const head = headRef.current;
    if (!head) return;

    head.dataset.forcedClosed = String(isTopPanelForcedClosed);
  }, [headRef, isTopPanelForcedClosed]);

  useEffect(() => {
    const head = headRef.current;
    if (!head) return;

    head.dataset.scrollborder = String(hasScrollBorder);
  }, [headRef, hasScrollBorder]);

  useEffect(() => {
    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(orientation: landscape)')
        : null;
    let isLandscape = mediaQuery ? mediaQuery.matches : true;
    let rafId: number | null = null;
    let isForcedClosed = false;
    let lastScrollY = window.scrollY;
    let scrollStartY = window.scrollY;
    let isScrollingDown = false;

    const updateScrollBorder = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const threshold = viewportHeight * 0.2;
      const nextHasBorder = scrollY > threshold;

      setHasScrollBorder((prev) =>
        prev === nextHasBorder ? prev : nextHasBorder,
      );
    };

    const resetScrollDirection = () => {
      lastScrollY = window.scrollY;
      scrollStartY = window.scrollY;
      isScrollingDown = false;
    };

    const syncTopPanelWithScroll = () => {
      const shouldForceClosed = isPagePastTop();
      if (!shouldForceClosed) {
        setHeadSurface('transparent');
        if (isForcedClosed) {
          if (isHoveringTopPanelZoneRef.current) {
            setTopPanelMode('open');
            animateHead({ y: 0, yPercent: -100 });
          } else {
            setTopPanelMode('closed');
            animateHead({ y: 0 });
          }
        } else {
          setIsTopPanelForcedClosed(false);
        }
        isForcedClosed = false;
        resetScrollDirection();
        return;
      }

      setHeadSurface('solid');
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollThreshold = windowHeight * 0.1;

      if (!isForcedClosed) {
        setTopPanelMode('forcedClosed');
        animateHead({ y: 0, yPercent: 0 });
        isForcedClosed = true;
        lastScrollY = currentScrollY;
        scrollStartY = currentScrollY;
        isScrollingDown = false;
        return;
      }

      if (currentScrollY < scrollThreshold) {
        animateHead({ y: 0 });
        scrollStartY = currentScrollY;
        lastScrollY = currentScrollY;
        return;
      }

      const scrollingDown = currentScrollY > lastScrollY;
      if (scrollingDown !== isScrollingDown) {
        scrollStartY = lastScrollY;
        isScrollingDown = scrollingDown;
      }

      const scrollDistance = Math.abs(currentScrollY - scrollStartY);
      if (isScrollingDown && scrollDistance > scrollThreshold) {
        animateHead({ y: -100, ease: 'power1.out' });
      } else if (!isScrollingDown && scrollDistance > scrollThreshold) {
        animateHead({ y: 0, ease: 'power1.out' });
      }

      lastScrollY = currentScrollY;
    };

    const syncDesktopHeadOnScroll = () => {
      setHeadSurface('solid');

      if (!isLandscape) {
        if (headRef.current) {
          gsap.set(headRef.current, { y: 0 });
        }
        resetScrollDirection();
        return;
      }

      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollThreshold = windowHeight * 0.1;

      if (currentScrollY < scrollThreshold) {
        animateHead({ y: 0 });
        scrollStartY = currentScrollY;
        lastScrollY = currentScrollY;
        return;
      }

      const scrollingDown = currentScrollY > lastScrollY;
      if (scrollingDown !== isScrollingDown) {
        scrollStartY = lastScrollY;
        isScrollingDown = scrollingDown;
      }

      const scrollDistance = Math.abs(currentScrollY - scrollStartY);
      if (isScrollingDown && scrollDistance > scrollThreshold) {
        animateHead({ y: -100, ease: 'power1.out' });
      } else if (!isScrollingDown && scrollDistance > scrollThreshold) {
        animateHead({ y: 0, ease: 'power1.out' });
      }

      lastScrollY = currentScrollY;
    };

    const syncHeadOnScroll = () => {
      updateScrollBorder();
      if (isMobileHeadAnimationLayout) return;
      if (isThreeDLayout) {
        syncTopPanelWithScroll();
        return;
      }
      syncDesktopHeadOnScroll();
    };

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncHeadOnScroll();
      });
    };

    const handleOrientationChange = (e: MediaQueryListEvent) => {
      isLandscape = e.matches;
      syncHeadOnScroll();
    };

    if (isThreeDLayout) {
      setHeadSurface(isPagePastTop() ? 'solid' : 'transparent');
      gsap.set(headRef.current, { y: 0, yPercent: 0 });
    } else {
      setHeadSurface('solid');
      setIsTopPanelForcedClosed(false);
      isHoveringTopPanelZoneRef.current = false;
    }

    syncHeadOnScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (mediaQuery) {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleOrientationChange);
      } else {
        mediaQuery.addListener(handleOrientationChange);
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', handleOrientationChange);
        } else {
          mediaQuery.removeListener(handleOrientationChange);
        }
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [
    headRef,
    isThreeDLayout,
    isMobileHeadAnimationLayout,
    isPagePastTop,
    animateHead,
    setHeadSurface,
    setTopPanelMode,
  ]);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    if (isThreeDLayout && !isMobileHeadAnimationLayout) {
      const topPanel = headRef.current?.querySelector('.side_Top') || null;
      const isWithinInteractiveZone = (node: EventTarget | null) => {
        if (!(node instanceof Node)) return false;
        return (
          main.contains(node) || (topPanel ? topPanel.contains(node) : false)
        );
      };

      const onEnter = (e: Event) => {
        handleTopPanel(e as MouseEvent);
      };

      const onLeave = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        if (isWithinInteractiveZone(mouseEvent.relatedTarget)) return;
        handleTopPanel(mouseEvent);
      };

      main.addEventListener('mouseenter', onEnter);
      main.addEventListener('mouseleave', onLeave);
      topPanel?.addEventListener('mouseenter', onEnter);
      topPanel?.addEventListener('mouseleave', onLeave);

      return () => {
        main.removeEventListener('mouseenter', onEnter);
        main.removeEventListener('mouseleave', onLeave);
        topPanel?.removeEventListener('mouseenter', onEnter);
        topPanel?.removeEventListener('mouseleave', onLeave);
      };
    }

    if (!isThreeDLayout) {
      setTopPanelMode('closed');
      animateHead({
        y: 0,
        yPercent: 0,
        duration: 0.165,
      });
    }
  }, [
    headRef,
    handleTopPanel,
    isThreeDLayout,
    isMobileHeadAnimationLayout,
    animateHead,
    setTopPanelMode,
  ]);

  useEffect(() => {
    if (!isThreeDLayout || isMobileHeadAnimationLayout) return;

    const main = document.querySelector('main');
    if (!main) return;
    const topPanel = headRef.current?.querySelector('.side_Top') || null;

    const isInteractiveTouchTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return !!target.closest(
        [
          'button',
          'a',
          'input',
          'select',
          'textarea',
          'label',
          'summary',
          '[role="button"]',
          '[role="link"]',
          '[contenteditable="true"]',
          '.icon',
          '.cursorInteract',
          '.cursorMagnetic',
        ].join(','),
      );
    };

    const listenerOptions: AddEventListenerOptions = {
      passive: true,
      capture: true,
    };

    if (typeof window.PointerEvent === 'function') {
      const onPointerDown = (e: PointerEvent) => {
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        if (isInteractiveTouchTarget(e.target)) return;
        openTopPanelFromTouch();
      };

      main.addEventListener('pointerdown', onPointerDown, listenerOptions);
      topPanel?.addEventListener('pointerdown', onPointerDown, listenerOptions);
      return () => {
        main.removeEventListener('pointerdown', onPointerDown, listenerOptions);
        topPanel?.removeEventListener(
          'pointerdown',
          onPointerDown,
          listenerOptions,
        );
      };
    }

    const onTouchStart = (e: TouchEvent) => {
      if (isInteractiveTouchTarget(e.target)) return;
      openTopPanelFromTouch();
    };

    main.addEventListener('touchstart', onTouchStart, listenerOptions);
    topPanel?.addEventListener('touchstart', onTouchStart, listenerOptions);
    return () => {
      main.removeEventListener('touchstart', onTouchStart, listenerOptions);
      topPanel?.removeEventListener(
        'touchstart',
        onTouchStart,
        listenerOptions,
      );
    };
  }, [
    headRef,
    isThreeDLayout,
    isMobileHeadAnimationLayout,
    openTopPanelFromTouch,
  ]);

  useEffect(() => {
    if (!isMobileHeadAnimationLayout || !headRef.current) return;

    let openTimer: number | null = null;
    let isHeadSentinelVisible = true;
    let observer: IntersectionObserver | null = null;

    const clearOpenTimer = () => {
      if (openTimer === null) return;
      window.clearTimeout(openTimer);
      openTimer = null;
    };

    const moveMobileHeadDown = (
      mode: TopPanelMode = 'closed',
      surface: HeadSurface = 'transparent',
    ) => {
      clearOpenTimer();
      isHoveringTopPanelZoneRef.current = false;
      setHeadSurface(surface);
      setTopPanelMode(mode);
      animateHead({ y: 0, yPercent: 0 });
    };

    const scheduleMobileHeadUp = () => {
      if (document.hidden || !isHeadSentinelVisible) {
        clearOpenTimer();
        return;
      }

      moveMobileHeadDown('closed', 'transparent');
      openTimer = window.setTimeout(() => {
        if (document.hidden || !isHeadSentinelVisible) return;

        isHoveringTopPanelZoneRef.current = true;
        setHeadSurface('transparent');
        setTopPanelMode('open');
        animateHead({ y: 0, yPercent: -100 });
        openTimer = null;
      }, MOBILE_HEAD_ANIMATION_DELAY);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        moveMobileHeadDown('closed', 'transparent');
        return;
      }

      scheduleMobileHeadUp();
    };

    const handleFocus = () => {
      scheduleMobileHeadUp();
    };

    const sentinel = headSentinelRef.current;
    if (sentinel && typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(([entry]) => {
        isHeadSentinelVisible = entry?.isIntersecting ?? true;

        if (!isHeadSentinelVisible) {
          moveMobileHeadDown('forcedClosed', 'solid');
          return;
        }

        scheduleMobileHeadUp();
      });
      observer.observe(sentinel);
    }

    scheduleMobileHeadUp();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearOpenTimer();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [
    headRef,
    headSentinelRef,
    isMobileHeadAnimationLayout,
    animateHead,
    setHeadSurface,
    setTopPanelMode,
  ]);

  useEffect(() => {
    if (!isThreeDLayout) return;

    const main = document.querySelector('main');
    if (!main) return;
    const topPanel = headRef.current?.querySelector('.side_Top') || null;

    const isWithinInteractiveZone = (node: EventTarget | null) => {
      if (!(node instanceof Node)) return false;
      return (
        main.contains(node) || (topPanel ? topPanel.contains(node) : false)
      );
    };

    const closeTopPanelFromOutsideClick = () => {
      isHoveringTopPanelZoneRef.current = false;
      const pagePastTop = isPagePastTop();
      setTopPanelMode(pagePastTop ? 'forcedClosed' : 'closed');
      animateHead({ yPercent: 0 });
    };

    const listenerOptions: AddEventListenerOptions = {
      passive: true,
      capture: true,
    };

    if (typeof window.PointerEvent === 'function') {
      const onPointerDown = (e: PointerEvent) => {
        if (isWithinInteractiveZone(e.target)) return;
        closeTopPanelFromOutsideClick();
      };

      document.addEventListener('pointerdown', onPointerDown, listenerOptions);
      return () => {
        document.removeEventListener(
          'pointerdown',
          onPointerDown,
          listenerOptions,
        );
      };
    }

    const onMouseDown = (e: MouseEvent) => {
      if (isWithinInteractiveZone(e.target)) return;
      closeTopPanelFromOutsideClick();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (isWithinInteractiveZone(e.target)) return;
      closeTopPanelFromOutsideClick();
    };

    document.addEventListener('mousedown', onMouseDown, listenerOptions);
    document.addEventListener('touchstart', onTouchStart, listenerOptions);
    return () => {
      document.removeEventListener('mousedown', onMouseDown, listenerOptions);
      document.removeEventListener('touchstart', onTouchStart, listenerOptions);
    };
  }, [headRef, isThreeDLayout, isPagePastTop, animateHead, setTopPanelMode]);

  return null;
};

export default BlokHeadBehavior;
