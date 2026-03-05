'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { useProjects } from '@/providers/projects-provider';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import IconAbout from '@/components/Icons/IconAbout';
import IconClose from '@/components/Icons/IconClose';
import IconArrow from '@/components/Icons/IconArrow';
import IconArrowLong from '@/components/Icons/IconArrowLong';
import IconLinkOutside from '@/components/Icons/IconLinkOutside';
import Row from '@/components/Row';
import BlokSidePanels from '@/components/BlokSidePanels';
import { gsap } from '@/lib/gsap';
import GrainyGradient from '@/components/GrainyGradient';
import IconRocket from '@/components/Icons/IconRocket';
import { useShallow } from 'zustand/react/shallow';
import styles from './BlokHead.module.sass';

interface Props {
  blok?: unknown;
  float?: boolean;
  params?: unknown;
}

type TopPanelMode = 'open' | 'closed' | 'forcedClosed';

const BlokHead = ({}: Props) => {
  const headRef = useRef<HTMLDivElement>(null);
  const titleViewportRef = useRef<HTMLDivElement>(null);
  const titleTrackRef = useRef<HTMLDivElement>(null);
  const titleMarqueeRef = useRef<gsap.core.Timeline | null>(null);
  const path = usePathname();
  const currentPath = path || '/';
  const router = useRouter();
  const { projectSlugs, projects } = useProjects();
  const {
    theme,
    cycleTheme,
    space,
    setTwoD,
    setThreeD,
    topPanel,
    setTopPanelTrue,
    setTopPanelFalse,
  } = useStore(
    useShallow((state) => ({
      theme: state.theme,
      cycleTheme: state.cycleTheme,
      space: state.space,
      setTwoD: state.setTwoD,
      setThreeD: state.setThreeD,
      topPanel: state.topPanel,
      setTopPanelTrue: state.setTopPanelTrue,
      setTopPanelFalse: state.setTopPanelFalse,
    })),
  );
  const isThreeDSpace = space === '3D';
  const [hasScrollBorder, setHasScrollBorder] = useState(false);
  const [isThemeSpinning, setIsThemeSpinning] = useState(false);
  const [isTopPanelForcedClosed, setIsTopPanelForcedClosed] = useState(false);
  const themeSpinTimeoutRef = useRef<number | null>(null);
  const spaceToggleRafRef = useRef<number | null>(null);
  const spaceToggleTimeoutRef = useRef<number | null>(null);
  const isHoveringTopPanelZoneRef = useRef(false);
  const TITLE_MARQUEE_PX_PER_SECOND = 10;

  const currentSlug = useMemo(
    () => currentPath.split('/')[2] || '',
    [currentPath],
  );

  const pathName = useMemo(() => {
    const route = currentPath.split('/')[1];
    if (route === 'about' || route === 'projects' || route === 'blurbs') {
      return route;
    }
    return 'home';
  }, [currentPath]);

  const currentProjectIndex = useMemo(() => {
    if (!projectSlugs || projectSlugs.length === 0 || !currentSlug) return -1;
    return projectSlugs.indexOf(currentSlug);
  }, [projectSlugs, currentSlug]);

  const hasPrev = currentProjectIndex > 0;
  const hasNext =
    currentProjectIndex !== -1 &&
    !!projectSlugs &&
    currentProjectIndex < projectSlugs.length - 1;

  const projectName = useMemo(() => {
    if (!currentSlug) return '';
    return currentSlug
      .replace(/-/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, [currentSlug]);

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

  const toggleSpace = useCallback(() => {
    const applyNextSpace = () => {
      if (space === '3D') {
        setTwoD();
        return;
      }
      setThreeD();
    };

    if (spaceToggleRafRef.current !== null) {
      window.cancelAnimationFrame(spaceToggleRafRef.current);
      spaceToggleRafRef.current = null;
    }
    if (spaceToggleTimeoutRef.current !== null) {
      window.clearTimeout(spaceToggleTimeoutRef.current);
      spaceToggleTimeoutRef.current = null;
    }

    if (window.scrollY <= 1) {
      applyNextSpace();
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;

      if (spaceToggleRafRef.current !== null) {
        window.cancelAnimationFrame(spaceToggleRafRef.current);
        spaceToggleRafRef.current = null;
      }
      if (spaceToggleTimeoutRef.current !== null) {
        window.clearTimeout(spaceToggleTimeoutRef.current);
        spaceToggleTimeoutRef.current = null;
      }

      applyNextSpace();
    };

    const checkTop = () => {
      if (window.scrollY <= 1) {
        settle();
        return;
      }
      spaceToggleRafRef.current = window.requestAnimationFrame(checkTop);
    };

    spaceToggleRafRef.current = window.requestAnimationFrame(checkTop);
    spaceToggleTimeoutRef.current = window.setTimeout(settle, 1200);
  }, [space, setTwoD, setThreeD]);

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
    if (!projectSlugs || projectSlugs.length === 0) return;
    if (
      currentProjectIndex !== -1 &&
      currentProjectIndex < projectSlugs.length - 1
    ) {
      const nextSlug = `/projects/${projectSlugs[currentProjectIndex + 1]}`;
      router.push(nextSlug);
    }
  }, [router, projectSlugs, currentProjectIndex]);

  const clickPrev = useCallback(() => {
    if (!projectSlugs || projectSlugs.length === 0) return;
    if (currentProjectIndex > 0) {
      const prevSlug = `/projects/${projectSlugs[currentProjectIndex - 1]}`;
      router.push(prevSlug);
    }
  }, [router, projectSlugs, currentProjectIndex]);

  const projectPageSwipeHandlers = useSwipeable({
    trackTouch: true,
    trackMouse: false,
    delta: { left: 56, right: 56 },
    preventScrollOnSwipe: false,
    onSwipedLeft: () => {
      if (pathName !== 'projects') return;
      clickNext();
    },
    onSwipedRight: () => {
      if (pathName !== 'projects') return;
      clickPrev();
    },
  });

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
      if (!headRef.current || !isThreeDSpace) return;
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
    [isThreeDSpace, isPagePastTop, animateHead, setTopPanelMode],
  );

  const openTopPanelFromTouch = useCallback(() => {
    if (!headRef.current || !isThreeDSpace) return;

    if (isPagePastTop()) {
      setTopPanelMode('forcedClosed');
      animateHead({ yPercent: 0 });
      return;
    }

    isHoveringTopPanelZoneRef.current = true;
    setTopPanelMode('open');
    animateHead({ yPercent: -100 });
  }, [isThreeDSpace, isPagePastTop, animateHead, setTopPanelMode]);

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
      if (isThreeDSpace) {
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

    if (isThreeDSpace) {
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
  }, [isThreeDSpace, isPagePastTop, animateHead, setTopPanelMode]);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    if (isThreeDSpace) {
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
  }, [handleTopPanel, isThreeDSpace, animateHead, setTopPanelMode]);

  useEffect(() => {
    if (!isThreeDSpace) return;

    const main = document.querySelector('main');
    if (!main) return;
    const topPanel = headRef.current?.querySelector('.side_Top') || null;

    const listenerOptions: AddEventListenerOptions = {
      passive: true,
      capture: true,
    };

    if (typeof window.PointerEvent === 'function') {
      const onPointerDown = (e: PointerEvent) => {
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
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

    const onTouchStart = () => {
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
  }, [isThreeDSpace, openTopPanelFromTouch]);

  useEffect(() => {
    if (!isThreeDSpace) return;

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
  }, [isThreeDSpace, isPagePastTop, animateHead, setTopPanelMode]);

  useEffect(() => {
    const viewport = titleViewportRef.current;
    const track = titleTrackRef.current;
    if (!viewport || !track) return;

    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;

    const clearTitleMarquee = () => {
      if (titleMarqueeRef.current) {
        titleMarqueeRef.current.kill();
        titleMarqueeRef.current = null;
      }
      gsap.set(track, { x: 0 });
    };

    const buildTitleMarquee = () => {
      clearTitleMarquee();

      const overflow = track.scrollWidth - viewport.clientWidth;
      if (overflow <= 1) return;

      const duration = overflow / TITLE_MARQUEE_PX_PER_SECOND;
      const marquee = gsap.timeline({ repeat: -1 });

      marquee
        .to({}, { duration: 2 })
        .to(track, {
          x: -overflow,
          duration,
          ease: 'none',
        })
        .to({}, { duration: 2 })
        .set(track, { x: 0 });

      titleMarqueeRef.current = marquee;
    };

    const scheduleBuild = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        buildTitleMarquee();
      });
    };

    scheduleBuild();
    document.fonts?.ready.then(scheduleBuild).catch(() => {});

    if (typeof window.ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(scheduleBuild);
      resizeObserver.observe(viewport);
      resizeObserver.observe(track);
    }

    window.addEventListener('resize', scheduleBuild);

    return () => {
      window.removeEventListener('resize', scheduleBuild);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
      clearTitleMarquee();
    };
  }, [pathName, projectName, TITLE_MARQUEE_PX_PER_SECOND]);

  useEffect(() => {
    return () => {
      if (themeSpinTimeoutRef.current !== null) {
        window.clearTimeout(themeSpinTimeoutRef.current);
      }
      if (spaceToggleRafRef.current !== null) {
        window.cancelAnimationFrame(spaceToggleRafRef.current);
      }
      if (spaceToggleTimeoutRef.current !== null) {
        window.clearTimeout(spaceToggleTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!(main instanceof HTMLElement)) return;

    if (pathName !== 'projects') {
      projectPageSwipeHandlers.ref(null);
      return;
    }

    projectPageSwipeHandlers.ref(main);
    return () => {
      projectPageSwipeHandlers.ref(null);
    };
  }, [pathName, projectPageSwipeHandlers]);

  // Set Escape Key and Arrow Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/');
        return;
      }

      if (pathName === 'projects' && projectSlugs && projectSlugs.length > 0) {
        if (e.key === 'ArrowLeft' && currentProjectIndex > 0) {
          const prevSlug = `/projects/${projectSlugs[currentProjectIndex - 1]}`;
          router.push(prevSlug);
        } else if (
          e.key === 'ArrowRight' &&
          currentProjectIndex !== -1 &&
          currentProjectIndex < projectSlugs.length - 1
        ) {
          const nextSlug = `/projects/${projectSlugs[currentProjectIndex + 1]}`;
          router.push(nextSlug);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, pathName, projectSlugs, currentProjectIndex]);

  return (
    <div
      ref={headRef}
      className={`${styles.root} blok blok-Head blok-AnimateHead`}
      data-active={topPanel}
      data-forced-closed={isTopPanelForcedClosed}
      data-scrollborder={hasScrollBorder}
    >
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <Row>
        <div className="column column-Title">
          <div ref={titleViewportRef} className={styles.titleMarqueeViewport}>
            <div ref={titleTrackRef} className={styles.titleMarqueeTrack}>
              {(pathName === 'home' ||
                pathName === 'about' ||
                pathName === 'projects') && (
                <Link href="/" className="cursorInteract">
                  Dries Bos&nbsp;
                </Link>
              )}
              <Link href="/" className="cursorInteract">
                {(pathName === 'home' || pathName === 'about') && (
                  <span className="cursorInteract">— Creative Developer</span>
                )}
              </Link>
              <Link href="/">
                {pathName === 'projects' && (
                  <span className="cursorInteract ">& {projectName}</span>
                )}
              </Link>
            </div>
          </div>
        </div>

        <div className="column column-Icons">
          {pathName === 'home' && (
            <>
              {/* <StoreSwitcher /> */}
              <button
                type="button"
                className={`icon cursorMagnetic ${styles.themeButton}`}
                onClick={handleCycleTheme}
                aria-label={`Cycle theme. Current theme: ${theme}`}
                title={`Theme: ${theme}`}
              >
                <span
                  className={`${styles.themeCycle} ${
                    isThemeSpinning ? styles.themeCycleSpinning : ''
                  }`}
                />
              </button>
              <button
                type="button"
                className={`icon iconRocket cursorMagnetic ${styles.spaceButton}`}
                onClick={toggleSpace}
              >
                <span className={styles.rocketWrap}>
                  <IconRocket />
                </span>
              </button>
              <Link href="/about" className="icon cursorMagnetic">
                <IconAbout />
              </Link>
              {/* <Link href="/blurbs" className="icon cursorMagnetic">
                <IconThoughts />
              </Link> */}
            </>
          )}
          {pathName === 'about' && (
            <>
              {/* <div className="icon">
                <Link href="/about">
                  <IconMail />
                </Link>
              </div> */}
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
                  className="icon cursorMagnetic"
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
          {pathName === 'blurbs' && (
            <Link href="/" className="icon cursorMagnetic">
              <IconClose />
            </Link>
          )}
        </div>
      </Row>
    </div>
  );
};

export default BlokHead;
