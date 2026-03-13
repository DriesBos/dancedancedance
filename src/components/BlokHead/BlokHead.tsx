'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import IconAbout from '@/components/Icons/IconAbout';
import IconClose from '@/components/Icons/IconClose';
import IconArrow from '@/components/Icons/IconArrow';
import IconArrowLong from '@/components/Icons/IconArrowLong';
import IconMail from '../Icons/IconMail';
import IconLinkOutside from '@/components/Icons/IconLinkOutside';
import IconFullscreen from '@/components/Icons/IconFullscreen';
import IconSmallScreen from '@/components/Icons/IconSmallScreen';
import Row from '@/components/Row';
import BlokSidePanels from '@/components/BlokSidePanels';
import InlineWordSwapText from '@/components/InlineWordSwapText';
import { gsap } from '@/lib/gsap';
import GrainyGradient from '@/components/GrainyGradient';
import { useShallow } from 'zustand/react/shallow';
import styles from './BlokHead.module.sass';

interface Props {
  projects: Array<{
    slug: string;
    external_link?: { cached_url: string };
  }>;
}

type TopPanelMode = 'open' | 'closed' | 'forcedClosed';

const BlokHead = ({ projects }: Props) => {
  const headRef = useRef<HTMLDivElement>(null);
  const titleViewportRef = useRef<HTMLDivElement>(null);
  const titleMeasureRef = useRef<HTMLSpanElement>(null);
  const path = usePathname();
  const currentPath = path || '/';
  const router = useRouter();
  const projectSlugs = useMemo(
    () => projects.map((project) => project.slug),
    [projects],
  );
  const {
    theme,
    cycleTheme,
    fullscreen,
    setFullscreenOn,
    setFullscreenOff,
    topPanel,
    setTopPanelTrue,
    setTopPanelFalse,
  } = useStore(
    useShallow((state) => ({
      theme: state.theme,
      cycleTheme: state.cycleTheme,
      fullscreen: state.fullscreen,
      setFullscreenOn: state.setFullscreenOn,
      setFullscreenOff: state.setFullscreenOff,
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
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const [isThemeSpinning, setIsThemeSpinning] = useState(false);
  const [isTopPanelForcedClosed, setIsTopPanelForcedClosed] = useState(false);
  const [isAboutMixedHovered, setIsAboutMixedHovered] = useState(false);
  const themeSpinTimeoutRef = useRef<number | null>(null);
  const layoutToggleRafRef = useRef<number | null>(null);
  const layoutToggleTimeoutRef = useRef<number | null>(null);
  const isHoveringTopPanelZoneRef = useRef(false);
  const TITLE_SWAP_DURATION_SECONDS = 4.8;

  const currentSlug = useMemo(
    () => currentPath.split('/')[2] || '',
    [currentPath],
  );

  const pathName = useMemo(() => {
    const route = currentPath.split('/')[1];
    if (route === 'about' || route === 'projects') {
      return route;
    }
    return 'home';
  }, [currentPath]);

  const currentProjectIndex = useMemo(() => {
    if (!projectSlugs || projectSlugs.length === 0 || !currentSlug) return -1;
    return projectSlugs.indexOf(currentSlug);
  }, [projectSlugs, currentSlug]);

  const prevProjectSlug = useMemo(() => {
    if (!projectSlugs || currentProjectIndex <= 0) return null;
    return projectSlugs[currentProjectIndex - 1] ?? null;
  }, [projectSlugs, currentProjectIndex]);

  const nextProjectSlug = useMemo(() => {
    if (
      !projectSlugs ||
      currentProjectIndex === -1 ||
      currentProjectIndex >= projectSlugs.length - 1
    ) {
      return null;
    }
    return projectSlugs[currentProjectIndex + 1] ?? null;
  }, [projectSlugs, currentProjectIndex]);

  const prevProjectHref = prevProjectSlug ? `/projects/${prevProjectSlug}` : null;
  const nextProjectHref = nextProjectSlug ? `/projects/${nextProjectSlug}` : null;
  const hasPrev = !!prevProjectHref;
  const hasNext = !!nextProjectHref;

  const projectName = useMemo(() => {
    if (!currentSlug) return '';
    return currentSlug
      .replace(/-/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, [currentSlug]);

  const titleText = useMemo(() => {
    if (pathName === 'projects') {
      return projectName ? `Dries Bos & ${projectName}` : 'Dries Bos';
    }
    return 'Dries Bos — Creative Developer';
  }, [pathName, projectName]);

  const titleTokenFormat = pathName === 'projects' ? 'ampersand' : 'emdash';
  const shouldSwapTitleText = isTitleOverflowing
    ? titleTokenFormat === 'ampersand'
      ? titleText.includes('&')
      : titleText.includes('—')
    : false;

  const externalLink = useMemo(() => {
    if (
      pathName !== 'projects' ||
      !projects ||
      projects.length === 0 ||
      !currentSlug
    ) {
      return undefined;
    }
    return projects.find((project) => project.slug === currentSlug)
      ?.external_link;
  }, [pathName, projects, currentSlug]);

  const toggleFullscreen = useCallback(() => {
    const applyNextMode = () => {
      if (fullscreen) {
        setFullscreenOff();
        return;
      }
      setFullscreenOn();
    };

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
  }, [fullscreen, setFullscreenOff, setFullscreenOn]);

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

  const clickNext = useCallback(() => {
    if (!nextProjectHref) return;
    router.push(nextProjectHref);
  }, [router, nextProjectHref]);

  const clickPrev = useCallback(() => {
    if (!prevProjectHref) return;
    router.push(prevProjectHref);
  }, [router, prevProjectHref]);

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
    const viewport = titleViewportRef.current;
    const measure = titleMeasureRef.current;
    if (!viewport || !measure) return;

    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;

    const updateOverflow = () => {
      const overflow = measure.scrollWidth - viewport.clientWidth > 1;
      setIsTitleOverflowing((previous) =>
        previous === overflow ? previous : overflow,
      );
    };

    const scheduleMeasure = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateOverflow();
      });
    };

    scheduleMeasure();
    document.fonts?.ready.then(scheduleMeasure).catch(() => {});

    if (typeof window.ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(viewport);
      resizeObserver.observe(measure);
    }

    window.addEventListener('resize', scheduleMeasure);

    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
    };
  }, [titleText]);

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

  useEffect(() => {
    if (pathName !== 'projects') return;
    const main = document.querySelector('main');
    if (!(main instanceof HTMLElement)) return;

    const SWIPE_X_THRESHOLD = 56;
    const SWIPE_Y_THRESHOLD = 56;
    let startX: number | null = null;
    let startY: number | null = null;
    let activePointerId: number | null = null;

    const maybeHandleSwipe = (endX: number, endY: number) => {
      if (startX === null || startY === null) return;

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      startX = null;
      startY = null;

      if (Math.abs(deltaX) < SWIPE_X_THRESHOLD) return;
      if (Math.abs(deltaY) > SWIPE_Y_THRESHOLD) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

      if (deltaX < 0) {
        clickNext();
        return;
      }
      clickPrev();
    };

    if (typeof window.PointerEvent === 'function') {
      const onPointerDown = (e: PointerEvent) => {
        if (e.pointerType !== 'touch') return;
        activePointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
      };

      const onPointerUp = (e: PointerEvent) => {
        if (activePointerId !== e.pointerId) return;
        activePointerId = null;
        maybeHandleSwipe(e.clientX, e.clientY);
      };

      const onPointerCancel = (e: PointerEvent) => {
        if (activePointerId !== e.pointerId) return;
        activePointerId = null;
        startX = null;
        startY = null;
      };

      main.addEventListener('pointerdown', onPointerDown, { passive: true });
      main.addEventListener('pointerup', onPointerUp, { passive: true });
      main.addEventListener('pointercancel', onPointerCancel, { passive: true });
      return () => {
        main.removeEventListener('pointerdown', onPointerDown);
        main.removeEventListener('pointerup', onPointerUp);
        main.removeEventListener('pointercancel', onPointerCancel);
      };
    }

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      maybeHandleSwipe(touch.clientX, touch.clientY);
    };

    const onTouchCancel = () => {
      startX = null;
      startY = null;
    };

    main.addEventListener('touchstart', onTouchStart, { passive: true });
    main.addEventListener('touchend', onTouchEnd, { passive: true });
    main.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      main.removeEventListener('touchstart', onTouchStart);
      main.removeEventListener('touchend', onTouchEnd);
      main.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [pathName, clickNext, clickPrev]);

  useEffect(() => {
    if (pathName !== 'projects') return;

    if (prevProjectHref) {
      router.prefetch(prevProjectHref);
    }
    if (nextProjectHref) {
      router.prefetch(nextProjectHref);
    }
  }, [router, pathName, prevProjectHref, nextProjectHref]);

  // Set Escape Key and Arrow Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/');
        return;
      }

      if (pathName === 'projects') {
        if (e.key === 'ArrowLeft' && prevProjectHref) {
          router.push(prevProjectHref);
        } else if (e.key === 'ArrowRight' && nextProjectHref) {
          router.push(nextProjectHref);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, pathName, prevProjectHref, nextProjectHref]);

  return (
    <div
      ref={headRef}
      className={`${styles.blokHead} blok blok-Head blok-AnimateHead`}
      data-active={topPanel}
      data-forced-closed={isTopPanelForcedClosed}
      data-scrollborder={hasScrollBorder}
    >
      <GrainyGradient variant="blok" />
      <BlokSidePanels showTopPanelPortrait={pathName === 'about'} />
      <Row className={styles.row}>
        <div className={`column column-Title ${styles.title}`}>
          <div ref={titleViewportRef} className={styles.titleMarqueeViewport}>
            <Link href="/" className={`cursorInteract ${styles.titleMarqueeTrack}`}>
              {shouldSwapTitleText ? (
                <InlineWordSwapText
                  text={titleText}
                  keyPrefix={`head-title-${pathName || 'home'}`}
                  tokenFormat={titleTokenFormat}
                  durationSeconds={TITLE_SWAP_DURATION_SECONDS}
                />
              ) : (
                titleText
              )}
            </Link>
            <span
              ref={titleMeasureRef}
              className={styles.titleMeasure}
              aria-hidden="true"
            >
              {titleText}
            </span>
          </div>
        </div>

        <div className="column column-Icons">
          {pathName === 'home' && (
            <>
              <button
                type="button"
                className={`icon cursorMagnetic ${styles.themeButton}`}
                onClick={handleCycleTheme}
                aria-label={`Cycle theme. Current theme: ${themeLabel}`}
                title={`Theme: ${themeLabel}`}
              >
                <span
                  className={`${styles.themeCycle} ${
                    isThemeSpinning ? styles.themeCycleSpinning : ''
                  }`}
                />
              </button>
              <button
                type="button"
                className={`icon cursorMagnetic ${styles.layoutButton}`}
                onClick={toggleFullscreen}
                aria-label={`Toggle fullscreen. Fullscreen is ${fullscreenLabel.toLowerCase()}`}
                title={`Fullscreen: ${fullscreenLabel.toUpperCase()}`}
              >
                <span className={styles.layoutIconWrap}>
                  <span
                    className={styles.layoutIcon}
                    data-active={fullscreen}
                  >
                    <IconFullscreen active={fullscreen} />
                  </span>
                </span>
              </button>
              <Link
                href="/about"
                className="icon cursorMagnetic"
                aria-label="About (mixed animation test)"
                onMouseEnter={() => setIsAboutMixedHovered(true)}
                onMouseLeave={() => setIsAboutMixedHovered(false)}
                onFocus={() => setIsAboutMixedHovered(true)}
                onBlur={() => setIsAboutMixedHovered(false)}
                title="About"
              >
                <IconAbout variant="mixed" animate={isAboutMixedHovered} />
              </Link>
            </>
          )}
          {pathName === 'about' && (
            <>
              <div
                className="icon cursorMessage desktop"
                data-cursor-message="Let's talk"
              >
                <Link href="mailto:info@driesbos.com?subject=Let's Make Internet">
                  <IconMail />
                </Link>
              </div>
              <Link href="/" className="icon cursorMagnetic">
                <IconClose />
              </Link>
            </>
          )}
          {pathName === 'projects' && (
            <>
              {externalLink?.cached_url && (
                <a
                  href={externalLink.cached_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon cursorMagnetic desktop"
                  data-external-link="true"
                >
                  <IconLinkOutside />
                </a>
              )}
              <div className="column-Icons_NextPrev">
                <div
                  onClick={clickPrev}
                  className={`${
                    hasPrev ? 'active' : 'disabled'
                  } icon icon-Wide icon-Rotate headerDesktop cursorMagnetic`}
                >
                  <IconArrowLong />
                </div>
                <div
                  onClick={clickPrev}
                  className={`${
                    hasPrev ? 'active' : 'disabled'
                  } icon icon-Rotate headerMobile cursorMagnetic`}
                >
                  <IconArrow />
                </div>
                <div className="projectNumber headerDesktop">
                  {currentProjectIndex + 1}/{projectSlugs?.length ?? 0}
                </div>
                <div
                  onClick={clickNext}
                  className={`${
                    hasNext ? 'active' : 'disabled'
                  } icon icon-Wide headerDesktop cursorMagnetic`}
                >
                  <IconArrowLong />
                </div>
                <div
                  onClick={clickNext}
                  className={`${
                    hasNext ? 'active' : 'disabled'
                  } icon headerMobile cursorMagnetic`}
                >
                  <IconArrow />
                </div>
              </div>
              <Link href="/" className="icon cursorMagnetic">
                <IconClose />
              </Link>
            </>
          )}
        </div>
      </Row>
    </div>
  );
};

export default BlokHead;
