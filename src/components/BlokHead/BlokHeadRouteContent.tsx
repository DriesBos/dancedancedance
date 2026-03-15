'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Row from '@/components/Row';
import InlineWordSwapText from '@/components/InlineWordSwapText';
import IconAbout from '@/components/Icons/IconAbout';
import IconArrow from '@/components/Icons/IconArrow';
import IconArrowLong from '@/components/Icons/IconArrowLong';
import IconClose from '@/components/Icons/IconClose';
import IconFullscreen from '@/components/Icons/IconFullscreen';
import IconLinkOutside from '@/components/Icons/IconLinkOutside';
import IconMail from '@/components/Icons/IconMail';
import styles from './BlokHead.module.sass';

interface Props {
  projects: Array<{
    slug: string;
    external_link?: { cached_url: string };
  }>;
  themeLabel: string;
  fullscreen: boolean;
  fullscreenLabel: string;
  isThemeSpinning: boolean;
  isAboutMixedHovered: boolean;
  onAboutMixedHoverChange: (value: boolean) => void;
  onCycleTheme: () => void;
  onToggleFullscreen: () => void;
}

const TITLE_SWAP_DURATION_SECONDS = 4.8;

const BlokHeadRouteContent = ({
  projects,
  themeLabel,
  fullscreen,
  fullscreenLabel,
  isThemeSpinning,
  isAboutMixedHovered,
  onAboutMixedHoverChange,
  onCycleTheme,
  onToggleFullscreen,
}: Props) => {
  const path = usePathname();
  const currentPath = path || '/';
  const router = useRouter();
  const titleViewportRef = useRef<HTMLDivElement>(null);
  const titleMeasureRef = useRef<HTMLSpanElement>(null);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const projectSlugs = useMemo(
    () => projects.map((project) => project.slug),
    [projects],
  );

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
    if (projectSlugs.length === 0 || !currentSlug) return -1;
    return projectSlugs.indexOf(currentSlug);
  }, [projectSlugs, currentSlug]);

  const prevProjectSlug = useMemo(() => {
    if (currentProjectIndex <= 0) return null;
    return projectSlugs[currentProjectIndex - 1] ?? null;
  }, [projectSlugs, currentProjectIndex]);

  const nextProjectSlug = useMemo(() => {
    if (
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
    if (pathName !== 'projects' || !currentSlug) {
      return undefined;
    }
    return projects.find((project) => project.slug === currentSlug)
      ?.external_link;
  }, [pathName, projects, currentSlug]);

  const clickNext = useCallback(() => {
    if (!nextProjectHref) return;
    router.push(nextProjectHref);
  }, [router, nextProjectHref]);

  const clickPrev = useCallback(() => {
    if (!prevProjectHref) return;
    router.push(prevProjectHref);
  }, [router, prevProjectHref]);

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
              onClick={onCycleTheme}
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
              onClick={onToggleFullscreen}
              aria-label={`Toggle fullscreen. Fullscreen is ${fullscreenLabel.toLowerCase()}`}
              title={`Fullscreen: ${fullscreenLabel.toUpperCase()}`}
            >
              <span className={styles.layoutIconWrap}>
                <span className={styles.layoutIcon} data-active={!fullscreen}>
                  <IconFullscreen active={!fullscreen} />
                </span>
              </span>
            </button>
            <Link
              href="/about"
              className="icon cursorMagnetic"
              aria-label="About (mixed animation test)"
              onMouseEnter={() => onAboutMixedHoverChange(true)}
              onMouseLeave={() => onAboutMixedHoverChange(false)}
              onFocus={() => onAboutMixedHoverChange(true)}
              onBlur={() => onAboutMixedHoverChange(false)}
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
              <Link href="mailto:hello@driesbos.com?subject=Let's Make Internet">
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
                {currentProjectIndex + 1}/{projectSlugs.length}
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
  );
};

export default BlokHeadRouteContent;
