'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, useGSAP } from '@/lib/gsap';
import styles from './CustomCursor.module.sass';

type FollowerMode = 'default' | 'interact' | 'magnetic';
type QuickToSetter = (value: number) => void;
type TextTweenSetters = {
  xTo: QuickToSetter;
  yTo: QuickToSetter;
};

export default function CustomCursor() {
  const pathname = usePathname();
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const isVisible = useRef(false);
  const isPreviewVisible = useRef(false);
  const cursorSurface = useRef<'bg' | 'blok'>('bg');
  const prevMousePos = useRef({ x: 0, y: 0 });
  const hintShowTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showNavigationHintRef = useRef<(() => void) | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const previewContainer = previewRef.current;
    const previewImage = previewImageRef.current;
    if (!previewContainer || !previewImage) return;

    // Route changes can skip hover-leave events, so force-reset preview state.
    isPreviewVisible.current = false;
    gsap.killTweensOf(previewContainer);
    gsap.set(previewContainer, {
      x: -1000,
      y: -1000,
      autoAlpha: 0,
      scale: 0.96,
      rotate: -1.5,
    });
    previewImage.setAttribute('src', '');
    previewImage.setAttribute('alt', '');
    showNavigationHintRef.current?.();
  }, [pathname]);

  useGSAP(() => {
    // Skip on touch devices - no hover support.
    if (window.matchMedia('(hover: none)').matches) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;
    const messageContainer = messageRef.current;
    const previewContainer = previewRef.current;
    const previewImage = previewImageRef.current;

    if (
      !cursor ||
      !follower ||
      !messageContainer ||
      !previewContainer ||
      !previewImage
    ) {
      return;
    }

    document.body.setAttribute('data-cursor-surface', 'bg');

    // Initial state.
    gsap.set([cursor, follower], { opacity: 0, xPercent: -50, yPercent: -50 });
    gsap.set(messageContainer, { opacity: 0, xPercent: 0, yPercent: 0 });
    gsap.set(previewContainer, {
      x: -1000,
      y: -1000,
      autoAlpha: 0,
      scale: 0.96,
      rotate: -1.5,
    });

    const setCursorX = gsap.quickSetter(cursor, 'x', 'px') as QuickToSetter;
    const setCursorY = gsap.quickSetter(cursor, 'y', 'px') as QuickToSetter;

    // QuickTo for smoothed movement.
    const xFollowerTo = gsap.quickTo(follower, 'x', {
      duration: 0.33,
      ease: 'power3',
    }) as QuickToSetter;
    const yFollowerTo = gsap.quickTo(follower, 'y', {
      duration: 0.33,
      ease: 'power3',
    }) as QuickToSetter;
    const xMessageTo = gsap.quickTo(messageContainer, 'x', {
      duration: 0.6,
      ease: 'power3',
    }) as QuickToSetter;
    const yMessageTo = gsap.quickTo(messageContainer, 'y', {
      duration: 0.6,
      ease: 'power3',
    }) as QuickToSetter;
    const xPreviewTo = gsap.quickTo(previewContainer, 'x', {
      duration: 0.36,
      ease: 'power3',
    }) as QuickToSetter;
    const yPreviewTo = gsap.quickTo(previewContainer, 'y', {
      duration: 0.36,
      ease: 'power3',
    }) as QuickToSetter;
    const rotateMessageTo = gsap.quickTo(messageContainer, 'rotation', {
      duration: 0.6,
      ease: 'power3',
    }) as QuickToSetter;

    const followerDefaultSize = '0.9090909091rem';
    const followerInteractSize = '1.8181818182rem';
    const followerMagneticSize = '2.7272727273rem';
    let currentFollowerMode: FollowerMode = 'default';

    const setFollowerMode = (mode: FollowerMode) => {
      if (currentFollowerMode === mode) return;
      currentFollowerMode = mode;
      follower.classList.toggle(styles.magnetic, mode === 'magnetic');

      const size =
        mode === 'magnetic'
          ? followerMagneticSize
          : mode === 'interact'
            ? followerInteractSize
            : followerDefaultSize;

      gsap.to(follower, {
        width: size,
        height: size,
        duration: 0.165,
        overwrite: 'auto',
      });
    };

    gsap.set(follower, {
      width: followerDefaultSize,
      height: followerDefaultSize,
    });

    const messageFadeAnim = gsap.timeline({ paused: true });
    messageFadeAnim.to(messageContainer, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    });

    const rotationReset = gsap
      .delayedCall(0.15, () => {
        rotateMessageTo(0);
      })
      .pause();

    const preloadedPreviewUrls = new Set<string>();
    const preloadedPreviewImages: HTMLImageElement[] = [];
    const textTweenMap = new WeakMap<HTMLElement, TextTweenSetters>();

    let activeMessageTarget: HTMLElement | null = null;
    let activePreviewTarget: HTMLElement | null = null;
    let activeMagneticTarget: HTMLElement | null = null;

    let pointerFrameId: number | null = null;
    let latestPointerX = 0;
    let latestPointerY = 0;
    let latestPointerTarget: EventTarget | null = null;

    let messageOffsetX = 0;
    let messageOffsetY = 0;

    const updateMessageOffsets = () => {
      const remInPixels = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      messageOffsetX = 0.4545454545 + 0.909090909 * remInPixels;
      messageOffsetY = 0.4545454545 * remInPixels;
    };

    updateMessageOffsets();

    const getTextTweens = (textEl: HTMLElement): TextTweenSetters => {
      const existing = textTweenMap.get(textEl);
      if (existing) return existing;

      const next: TextTweenSetters = {
        xTo: gsap.quickTo(textEl, 'x', {
          duration: 0.6,
          ease: 'power3',
        }) as QuickToSetter,
        yTo: gsap.quickTo(textEl, 'y', {
          duration: 0.6,
          ease: 'power3',
        }) as QuickToSetter,
      };
      textTweenMap.set(textEl, next);
      return next;
    };

    const clearMagneticTextTween = (target: HTMLElement | null) => {
      if (!target) return;
      const textEl = target.querySelector('.text');
      if (!(textEl instanceof HTMLElement)) return;
      const tweens = getTextTweens(textEl);
      tweens.xTo(0);
      tweens.yTo(0);
    };

    const preloadPreviewImage = (src: string) => {
      if (!src || preloadedPreviewUrls.has(src)) return;
      preloadedPreviewUrls.add(src);

      const image = new Image();
      image.decoding = 'async';
      image.loading = 'eager';
      image.src = src;
      preloadedPreviewImages.push(image);

      if (typeof image.decode === 'function') {
        image.decode().catch(() => {});
      }
    };

    const clampPreviewPosition = (clientX: number, clientY: number) => {
      const previewWidth = previewContainer.offsetWidth || 360;
      const previewHeight = previewContainer.offsetHeight || 270;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 16;
      let x = clientX - previewWidth / 2;
      let y = clientY - previewHeight / 2;

      x = Math.max(
        padding,
        Math.min(viewportWidth - previewWidth - padding, x),
      );
      y = Math.max(
        padding,
        Math.min(viewportHeight - previewHeight - padding, y),
      );

      return { x, y };
    };

    const movePreviewToPointer = (clientX: number, clientY: number) => {
      const { x, y } = clampPreviewPosition(clientX, clientY);
      xPreviewTo(x);
      yPreviewTo(y);
    };

    const setPreviewToPointerInstant = (clientX: number, clientY: number) => {
      const { x, y } = clampPreviewPosition(clientX, clientY);
      gsap.set(previewContainer, { x, y });
    };

    const clampMessagePosition = (clientX: number, clientY: number) => {
      const messageWidth = messageContainer.offsetWidth || 220;
      const messageHeight = messageContainer.offsetHeight || 44;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 16;
      let x = clientX;
      let y = clientY;

      x = Math.max(
        padding,
        Math.min(viewportWidth - messageWidth - padding, x),
      );
      y = Math.max(
        padding,
        Math.min(viewportHeight - messageHeight - padding, y),
      );

      return { x, y };
    };

    const showPreview = () => {
      if (isPreviewVisible.current) return;
      isPreviewVisible.current = true;
      gsap.to(previewContainer, {
        autoAlpha: 1,
        scale: 1,
        rotate: 0,
        duration: 0.18,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };

    const hidePreview = () => {
      if (!isPreviewVisible.current) return;
      isPreviewVisible.current = false;
      gsap.to(previewContainer, {
        autoAlpha: 0,
        scale: 0.96,
        rotate: -1.5,
        duration: 0.42,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const shouldSkipInteractSize = (target: Element | null) =>
      target instanceof Element &&
      (target.hasAttribute('data-cursor-message') ||
        target.hasAttribute('data-cursor-preview'));

    const resolveFollowerMode = (
      hoveredElement: Element | null,
    ): FollowerMode => {
      const magneticTarget = hoveredElement?.closest('.cursorMagnetic');
      if (magneticTarget) return 'magnetic';

      const interactTarget = hoveredElement?.closest(
        '.cursorInteract, .markdown a',
      );
      if (interactTarget && !shouldSkipInteractSize(interactTarget)) {
        return 'interact';
      }

      return 'default';
    };

    const updateMessageTarget = (hoveredElement: Element | null) => {
      const nextTarget = hoveredElement?.closest('.cursorMessage');
      const resolvedTarget =
        nextTarget instanceof HTMLElement ? nextTarget : null;
      if (resolvedTarget === activeMessageTarget) return;

      activeMessageTarget = resolvedTarget;
      if (!resolvedTarget) {
        messageFadeAnim.reverse();
        return;
      }

      const messageText = resolvedTarget.getAttribute('data-cursor-message');
      if (messageText) {
        setMessage(messageText);
        messageFadeAnim.restart();
      } else {
        messageFadeAnim.reverse();
      }
    };

    const updatePreviewTarget = (
      hoveredElement: Element | null,
      pointerX: number,
      pointerY: number,
    ) => {
      const nextTarget = hoveredElement?.closest('.cursorPreview');
      const resolvedTarget =
        nextTarget instanceof HTMLElement ? nextTarget : null;
      if (resolvedTarget === activePreviewTarget) return;

      activePreviewTarget = resolvedTarget;
      if (!resolvedTarget) {
        hidePreview();
        return;
      }

      const src = resolvedTarget.getAttribute('data-cursor-preview');
      if (!src) {
        hidePreview();
        return;
      }

      const alt = resolvedTarget.getAttribute('data-cursor-preview-alt') || '';
      preloadPreviewImage(src);

      if (previewImage.getAttribute('src') !== src) {
        previewImage.setAttribute('src', src);
      }
      previewImage.setAttribute('alt', alt);

      prevMousePos.current = { x: pointerX, y: pointerY };
      setPreviewToPointerInstant(pointerX, pointerY);
      showPreview();
    };

    const resolveHoveredElement = (): Element | null => {
      if (latestPointerTarget instanceof Element) {
        return latestPointerTarget;
      }

      return document.elementFromPoint(latestPointerX, latestPointerY);
    };

    const runPointerFrame = () => {
      pointerFrameId = null;

      if (!isVisible.current) {
        gsap.set([cursor, follower], { opacity: 1 });
        isVisible.current = true;
      }

      const cursorPosition = {
        x: latestPointerX,
        y: latestPointerY,
      };

      const hoveredElement = resolveHoveredElement();
      const nextSurface: 'bg' | 'blok' = hoveredElement?.closest('.blok')
        ? 'blok'
        : 'bg';
      if (nextSurface !== cursorSurface.current) {
        cursorSurface.current = nextSurface;
        document.body.setAttribute('data-cursor-surface', nextSurface);
      }

      setFollowerMode(resolveFollowerMode(hoveredElement));
      updateMessageTarget(hoveredElement);
      updatePreviewTarget(hoveredElement, cursorPosition.x, cursorPosition.y);

      const magneticTarget = hoveredElement?.closest('.cursorMagnetic');
      const resolvedMagneticTarget =
        magneticTarget instanceof HTMLElement ? magneticTarget : null;
      if (resolvedMagneticTarget !== activeMagneticTarget) {
        clearMagneticTextTween(activeMagneticTarget);
        activeMagneticTarget = resolvedMagneticTarget;
      }

      let foundTarget = false;
      if (activeMagneticTarget) {
        const rect = activeMagneticTarget.getBoundingClientRect();
        const triggerDistance = rect.width;

        const targetPosition = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        const distance = {
          adj: targetPosition.x - cursorPosition.x,
          opp: targetPosition.y - cursorPosition.y,
        };
        const hypotenuse = Math.hypot(distance.adj, distance.opp);
        const angle = Math.atan2(distance.adj, distance.opp);

        if (hypotenuse * 1.5 < triggerDistance) {
          foundTarget = true;
          const magneticX =
            targetPosition.x - (Math.sin(angle) * hypotenuse) / 4;
          const magneticY =
            targetPosition.y - (Math.cos(angle) * hypotenuse) / 4;

          xFollowerTo(magneticX);
          yFollowerTo(magneticY);

          const textEl = activeMagneticTarget.querySelector('.text');
          if (textEl instanceof HTMLElement) {
            const tweens = getTextTweens(textEl);
            tweens.xTo(-((Math.sin(angle) * hypotenuse) / 8));
            tweens.yTo(-((Math.cos(angle) * hypotenuse) / 8));
          }
        } else {
          clearMagneticTextTween(activeMagneticTarget);
        }
      }

      if (!foundTarget) {
        xFollowerTo(cursorPosition.x);
        yFollowerTo(cursorPosition.y);
      }

      setCursorX(cursorPosition.x);
      setCursorY(cursorPosition.y);

      const { x: clampedMessageX, y: clampedMessageY } = clampMessagePosition(
        cursorPosition.x + messageOffsetX,
        cursorPosition.y + messageOffsetY,
      );
      xMessageTo(clampedMessageX);
      yMessageTo(clampedMessageY);

      if (isPreviewVisible.current) {
        movePreviewToPointer(cursorPosition.x, cursorPosition.y);
      }

      const deltaY = cursorPosition.y - prevMousePos.current.y;
      const rotation = Math.max(-25, Math.min(25, -deltaY * 0.5));
      rotateMessageTo(rotation);
      rotationReset.restart(true);

      prevMousePos.current = { x: cursorPosition.x, y: cursorPosition.y };
    };

    const schedulePointerFrame = () => {
      if (pointerFrameId !== null) return;
      pointerFrameId = window.requestAnimationFrame(runPointerFrame);
    };

    const handlePointerMove = (event: MouseEvent | PointerEvent) => {
      if ('pointerType' in event && event.pointerType === 'touch') return;
      latestPointerX = event.clientX;
      latestPointerY = event.clientY;
      latestPointerTarget = event.target;
      schedulePointerFrame();
    };

    const handleMouseLeaveWindow = () => {
      if (pointerFrameId !== null) {
        window.cancelAnimationFrame(pointerFrameId);
        pointerFrameId = null;
      }

      gsap.set([cursor, follower], { opacity: 0 });
      isVisible.current = false;
      cursorSurface.current = 'bg';
      document.body.setAttribute('data-cursor-surface', 'bg');

      setFollowerMode('default');
      clearMagneticTextTween(activeMagneticTarget);
      activeMagneticTarget = null;
      activeMessageTarget = null;
      activePreviewTarget = null;

      rotationReset.pause(0);
      rotateMessageTo(0);
      messageFadeAnim.reverse();
      hidePreview();
    };

    const handleClick = () => {
      setFollowerMode('default');
      hidePreview();
    };

    const showProjectNavigationHint = () => {
      const isProjectPage = document.querySelector('.page-Project');
      const hasSeenHint = sessionStorage.getItem('cursorNavigationHintShown');

      if (isProjectPage && !hasSeenHint) {
        if (hintShowTimeout.current) {
          clearTimeout(hintShowTimeout.current);
        }
        if (hintHideTimeout.current) {
          clearTimeout(hintHideTimeout.current);
        }

        hintShowTimeout.current = setTimeout(() => {
          setMessage("tip: use ←, → or 'esc'");
          messageFadeAnim.play();

          hintHideTimeout.current = setTimeout(() => {
            messageFadeAnim.reverse();
          }, 4000);

          sessionStorage.setItem('cursorNavigationHintShown', 'true');
        }, 500);
      }
    };

    showNavigationHintRef.current = showProjectNavigationHint;
    showProjectNavigationHint();

    window.addEventListener('resize', updateMessageOffsets, { passive: true });
    window.addEventListener('blur', handleMouseLeaveWindow);
    if (typeof window.PointerEvent === 'function') {
      document.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });
    } else {
      document.addEventListener('mousemove', handlePointerMove);
    }
    document.addEventListener('mouseleave', handleMouseLeaveWindow);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', updateMessageOffsets);
      window.removeEventListener('blur', handleMouseLeaveWindow);
      if (typeof window.PointerEvent === 'function') {
        document.removeEventListener('pointermove', handlePointerMove);
      } else {
        document.removeEventListener('mousemove', handlePointerMove);
      }
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      document.removeEventListener('click', handleClick);

      if (pointerFrameId !== null) {
        window.cancelAnimationFrame(pointerFrameId);
      }

      if (hintShowTimeout.current) {
        clearTimeout(hintShowTimeout.current);
      }
      if (hintHideTimeout.current) {
        clearTimeout(hintHideTimeout.current);
      }

      rotationReset.kill();
      preloadedPreviewImages.length = 0;
      preloadedPreviewUrls.clear();
      hidePreview();

      showNavigationHintRef.current = null;
      document.body.removeAttribute('data-cursor-surface');
    };
  });

  return (
    <>
      <div ref={messageRef} className={`${styles.cursor} ${styles.message}`}>
        {message}
      </div>
      <div
        ref={previewRef}
        className={`${styles.preview} imageItem`}
        aria-hidden="true"
      >
        <img ref={previewImageRef} src={undefined} alt="" />
      </div>
      <div
        ref={followerRef}
        className={`${styles.cursor} ${styles.follower}`}
      />
      <div ref={cursorRef} className={`${styles.cursor} ${styles.main}`} />
    </>
  );
}
