'use client';

import { useStore } from '@/store/store';
import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import GrainyGradient from '@/components/GrainyGradient';
import { useShallow } from 'zustand/react/shallow';
import BlokHeadRouteContent from './BlokHeadRouteContent';
import BlokHeadSidePanels from './BlokHeadSidePanels';
import styles from './BlokHead.module.sass';

interface Props {
  projects: Array<{
    slug: string;
    external_link?: { cached_url: string };
  }>;
}

type TopPanelMode = 'open' | 'closed' | 'forcedClosed';

const haveProjectsChanged = (prevProjects: Props['projects'], nextProjects: Props['projects']) => {
  if (prevProjects === nextProjects) return false;
  if (prevProjects.length !== nextProjects.length) return true;

  for (let index = 0; index < prevProjects.length; index += 1) {
    const previousProject = prevProjects[index];
    const nextProject = nextProjects[index];

    if (!previousProject || !nextProject) return true;
    if (previousProject.slug !== nextProject.slug) return true;

    const previousExternalLink = previousProject.external_link?.cached_url ?? '';
    const nextExternalLink = nextProject.external_link?.cached_url ?? '';

    if (previousExternalLink !== nextExternalLink) return true;
  }

  return false;
};

const BlokHeadComponent = ({ projects }: Props) => {
  const headRef = useRef<HTMLDivElement>(null);
  const {
    theme,
    cycleTheme,
    fullscreen,
    setFullscreen,
    topPanel,
    setTopPanelTrue,
    setTopPanelFalse,
  } = useStore(
    useShallow((state) => ({
      theme: state.theme,
      cycleTheme: state.cycleTheme,
      fullscreen: state.fullscreen,
      setFullscreen: state.setFullscreen,
      topPanel: state.topPanel,
      setTopPanelTrue: state.setTopPanelTrue,
      setTopPanelFalse: state.setTopPanelFalse,
    })),
  );
  const isThreeDLayout = !fullscreen;
  const themeLabel = theme
    .toUpperCase()
    .split(' ')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
  const fullscreenLabel = fullscreen ? 'ON' : 'OFF';
  const [hasScrollBorder, setHasScrollBorder] = useState(false);
  const [isThemeSpinning, setIsThemeSpinning] = useState(false);
  const [isTopPanelForcedClosed, setIsTopPanelForcedClosed] = useState(false);
  const [isAboutMixedHovered, setIsAboutMixedHovered] = useState(false);
  const themeSpinTimeoutRef = useRef<number | null>(null);
  const layoutToggleRafRef = useRef<number | null>(null);
  const layoutToggleTimeoutRef = useRef<number | null>(null);
  const isHoveringTopPanelZoneRef = useRef(false);

  const toggleFullscreen = useCallback(() => {
    const nextFullscreen = !fullscreen;
    const applyNextMode = () => setFullscreen(nextFullscreen);

    if (layoutToggleRafRef.current !== null) {
      window.cancelAnimationFrame(layoutToggleRafRef.current);
      layoutToggleRafRef.current = null;
    }
    if (layoutToggleTimeoutRef.current !== null) {
      window.clearTimeout(layoutToggleTimeoutRef.current);
      layoutToggleTimeoutRef.current = null;
    }

    if (window.scrollY <= 1) {
      applyNextMode();
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;

      if (layoutToggleRafRef.current !== null) {
        window.cancelAnimationFrame(layoutToggleRafRef.current);
        layoutToggleRafRef.current = null;
      }
      if (layoutToggleTimeoutRef.current !== null) {
        window.clearTimeout(layoutToggleTimeoutRef.current);
        layoutToggleTimeoutRef.current = null;
      }

      applyNextMode();
    };

    const checkTop = () => {
      if (window.scrollY <= 1) {
        settle();
        return;
      }
      layoutToggleRafRef.current = window.requestAnimationFrame(checkTop);
    };

    layoutToggleRafRef.current = window.requestAnimationFrame(checkTop);
    layoutToggleTimeoutRef.current = window.setTimeout(settle, 1200);
  }, [fullscreen, setFullscreen]);

  const handleCycleTheme = useCallback(() => {
    cycleTheme();

    if (themeSpinTimeoutRef.current !== null) {
      window.clearTimeout(themeSpinTimeoutRef.current);
    }

    setIsThemeSpinning(false);
    requestAnimationFrame(() => {
      setIsThemeSpinning(true);
    });

    themeSpinTimeoutRef.current = window.setTimeout(() => {
      setIsThemeSpinning(false);
      themeSpinTimeoutRef.current = null;
    }, 700);
  }, [cycleTheme]);

  const isPagePastTop = useCallback(() => {
    const page = document.querySelector('.page');
    if (page instanceof HTMLElement) {
      return page.getBoundingClientRect().top < 0;
    }
    return window.scrollY > 0;
  }, []);

  const animateHead = useCallback((vars: gsap.TweenVars) => {
    if (!headRef.current) return;
    gsap.to(headRef.current, {
      duration: 0.33,
      ease: 'power1.inOut',
      overwrite: 'auto',
      ...vars,
    });
  }, []);

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
          setTopPanelMode('forcedClosed');
          animateHead({ yPercent: 0 });
          return;
        }

        setTopPanelMode('open');
        animateHead({ yPercent: -100 });
      } else {
        setTopPanelMode(pagePastTop ? 'forcedClosed' : 'closed');
        animateHead({ yPercent: 0 });
      }
    },
    [isThreeDLayout, isPagePastTop, animateHead, setTopPanelMode],
  );

  const openTopPanelFromTouch = useCallback(() => {
    if (!headRef.current || !isThreeDLayout) return;

    if (isPagePastTop()) {
      setTopPanelMode('forcedClosed');
      animateHead({ yPercent: 0 });
      return;
    }

    isHoveringTopPanelZoneRef.current = true;
    setTopPanelMode('open');
    animateHead({ yPercent: -100 });
  }, [isThreeDLayout, isPagePastTop, animateHead, setTopPanelMode]);

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
      const hasBorder = scrollY > threshold;
      setHasScrollBorder((prev) => (prev === hasBorder ? prev : hasBorder));
    };

    const resetScrollDirection = () => {
      lastScrollY = window.scrollY;
      scrollStartY = window.scrollY;
      isScrollingDown = false;
    };

    const syncTopPanelWithScroll = () => {
      const shouldForceClosed = isPagePastTop();
      if (!shouldForceClosed) {
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
      if (!isLandscape) {
        gsap.set(headRef.current, { y: 0 });
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
      gsap.set(headRef.current, { y: 0, yPercent: 0 });
    } else {
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
  }, [isThreeDLayout, isPagePastTop, animateHead, setTopPanelMode]);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    if (isThreeDLayout) {
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

    setTopPanelMode('closed');
    animateHead({
      y: 0,
      yPercent: 0,
      duration: 0.165,
    });
  }, [handleTopPanel, isThreeDLayout, animateHead, setTopPanelMode]);

  useEffect(() => {
    if (!isThreeDLayout) return;

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
  }, [isThreeDLayout, openTopPanelFromTouch]);

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
  }, [isThreeDLayout, isPagePastTop, animateHead, setTopPanelMode]);

  useEffect(() => {
    return () => {
      if (themeSpinTimeoutRef.current !== null) {
        window.clearTimeout(themeSpinTimeoutRef.current);
      }
      if (layoutToggleRafRef.current !== null) {
        window.cancelAnimationFrame(layoutToggleRafRef.current);
      }
      if (layoutToggleTimeoutRef.current !== null) {
        window.clearTimeout(layoutToggleTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={headRef}
      className={`${styles.blokHead} blok blok-Head blok-AnimateHead`}
      data-active={topPanel}
      data-forced-closed={isTopPanelForcedClosed}
      data-scrollborder={hasScrollBorder}
    >
      <GrainyGradient variant="blok" />
      <BlokHeadSidePanels />
      <BlokHeadRouteContent
        projects={projects}
        themeLabel={themeLabel}
        fullscreen={fullscreen}
        fullscreenLabel={fullscreenLabel}
        isThemeSpinning={isThemeSpinning}
        isAboutMixedHovered={isAboutMixedHovered}
        onAboutMixedHoverChange={setIsAboutMixedHovered}
        onCycleTheme={handleCycleTheme}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
};

const BlokHead = memo(
  BlokHeadComponent,
  (prevProps, nextProps) =>
    !haveProjectsChanged(prevProps.projects, nextProps.projects),
);

BlokHead.displayName = 'BlokHead';

export default BlokHead;
