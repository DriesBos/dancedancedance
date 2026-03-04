'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { useProjects } from '@/providers/projects-provider';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import IconAbout from '@/components/Icons/IconAbout';
import IconClose from '@/components/Icons/IconClose';
import IconArrow from '@/components/Icons/IconArrow';
import IconArrowLong from '@/components/Icons/IconArrowLong';
import IconLinkOutside from '@/components/Icons/IconLinkOutside';
import Row from '@/components/Row';
import BlokSidePanels from '@/components/BlokSidePanels';
import { gsap, useGSAP } from '@/lib/gsap';
import GrainyGradient from '@/components/GrainyGradient';
import IconRocket from '@/components/Icons/IconRocket';
import styles from './BlokHead.module.sass';

interface Props {
  blok?: unknown;
  float?: boolean;
  params?: unknown;
}

type TopPanelMode = 'open' | 'closed' | 'forcedClosed';

const BlokHead = ({}: Props) => {
  const headRef = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const currentPath = path || '/';
  const router = useRouter();
  const { projectSlugs, projects } = useProjects();
  const theme = useStore((state) => state.theme);
  const cycleTheme = useStore((state) => state.cycleTheme);
  const space = useStore((state) => state.space);
  const isThreeDSpace = space === '3D';
  const setTwoD = useStore((state) => state.setTwoD);
  const setThreeD = useStore((state) => state.setThreeD);
  const topPanel = useStore((state) => state.topPanel);
  const setTopPanelTrue = useStore((state) => state.setTopPanelTrue);
  const setTopPanelFalse = useStore((state) => state.setTopPanelFalse);
  const [hasScrollBorder, setHasScrollBorder] = useState(false);
  const [isThemeSpinning, setIsThemeSpinning] = useState(false);
  const [isTopPanelForcedClosed, setIsTopPanelForcedClosed] = useState(false);
  const themeSpinTimeoutRef = useRef<number | null>(null);
  const spaceToggleRafRef = useRef<number | null>(null);
  const spaceToggleTimeoutRef = useRef<number | null>(null);
  const isHoveringTopPanelZoneRef = useRef(false);

  const currentSlug = useMemo(() => currentPath.split('/')[2] || '', [currentPath]);

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
    if (pathName !== 'projects' || !projects || projects.length === 0 || !currentSlug) {
      return undefined;
    }
    return projects.find((project) => project.slug === currentSlug)?.external_link;
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
    if (currentProjectIndex !== -1 && currentProjectIndex < projectSlugs.length - 1) {
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

  useEffect(() => {
    if (!isThreeDSpace) {
      setIsTopPanelForcedClosed(false);
      isHoveringTopPanelZoneRef.current = false;
      return;
    }

    let rafId: number | null = null;
    let isForcedClosed = false;
    let lastScrollY = window.scrollY;
    let scrollStartY = window.scrollY;
    let isScrollingDown = false;

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
        lastScrollY = window.scrollY;
        scrollStartY = window.scrollY;
        isScrollingDown = false;
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

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncTopPanelWithScroll();
      });
    };

    syncTopPanelWithScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
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
        return main.contains(node) || (topPanel ? topPanel.contains(node) : false);
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

  // Reveal on scroll up header pattern
  useGSAP(
    (_, contextSafe) => {
      if (typeof window.matchMedia !== 'function' || !headRef.current) return;

      // In 3D mode, header is controlled by handleTopPanel.
      if (isThreeDSpace) {
        gsap.set(headRef.current, { y: 0, yPercent: 0 });
        return;
      }

      const mediaQuery = window.matchMedia('(orientation: landscape)');
      let isEnabled = mediaQuery.matches;
      let rafId: number | null = null;

      let lastScrollY = window.scrollY;
      let scrollStartY = window.scrollY;
      let isScrollingDown = false;

      const updateHeaderVisibility = contextSafe(() => {
        if (!isEnabled) return; // Skip if not in landscape

        const currentScrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const scrollThreshold = windowHeight * 0.1; // 10% of window height

        // Always show header at the top
        if (currentScrollY < scrollThreshold) {
          animateHead({ y: 0 });
          scrollStartY = currentScrollY;
          lastScrollY = currentScrollY;
          return;
        }

        // Detect direction change
        const scrollingDown = currentScrollY > lastScrollY;

        if (scrollingDown !== isScrollingDown) {
          // Direction changed, reset start point
          scrollStartY = lastScrollY;
          isScrollingDown = scrollingDown;
        }

        const scrollDistance = Math.abs(currentScrollY - scrollStartY);

        // Check if we've scrolled enough in the current direction
        if (isScrollingDown && scrollDistance > scrollThreshold) {
          // Hide header - move up
          animateHead({ y: -100, ease: 'power1.out' });
        } else if (!isScrollingDown && scrollDistance > scrollThreshold) {
          // Show header - move to normal position
          animateHead({ y: 0, ease: 'power1.out' });
        }

        lastScrollY = currentScrollY;
      });

      const handleScroll = () => {
        if (rafId !== null) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          updateHeaderVisibility();
        });
      };

      const handleOrientationChange = contextSafe((e: MediaQueryListEvent) => {
        isEnabled = e.matches;

        // Reset header position when switching to portrait
        if (!isEnabled) {
          gsap.set(headRef.current, { y: 0 });
        }
      });

      // Listen for orientation changes (Safari fallback)
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleOrientationChange);
      } else {
        mediaQuery.addListener(handleOrientationChange);
      }
      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', handleOrientationChange);
        } else {
          mediaQuery.removeListener(handleOrientationChange);
        }
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
        }
        window.removeEventListener('scroll', handleScroll);
      };
    },
    { scope: headRef, dependencies: [isThreeDSpace, animateHead], revertOnUpdate: true },
  );

  // Scroll border state
  useEffect(() => {
    const handleScrollBorder = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const threshold = viewportHeight * 0.2; // 20% of viewport height

      if (scrollY > threshold) {
        setHasScrollBorder(true);
      } else {
        setHasScrollBorder(false);
      }
    };

    // Check initial state
    handleScrollBorder();

    window.addEventListener('scroll', handleScrollBorder, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollBorder);
    };
  }, []);

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
        <div className="column column-Title ellipsis">
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
