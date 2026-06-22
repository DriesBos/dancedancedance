'use client';

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { usePathname } from 'next/navigation';
import { gsap, useGSAP } from '@/lib/gsap';
import styles from './CustomCursor.module.sass';

type FollowerMode = 'default' | 'interact' | 'magnetic';
type QuickToSetter = (value: number) => void;
type MutableRef<T> = { current: T };
type TextTweenSetters = {
  xTo: QuickToSetter;
  yTo: QuickToSetter;
};
type PositionBoundary = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};
type ElementSize = {
  width: number;
  height: number;
};
type CursorRuntime = {
  resetPreviewForRoute: () => void;
  updateCursorMeasurements: () => void;
  handlePointerMove: (event: MouseEvent | PointerEvent) => void;
  handleMouseLeaveWindow: () => void;
  handleClick: () => void;
  showProjectNavigationHint: () => void;
  syncIntroMessageVisibility: () => void;
  destroy: () => void;
};
type CursorRuntimeOptions = {
  cursorRef: MutableRef<HTMLDivElement | null>;
  followerRef: MutableRef<HTMLDivElement | null>;
  messageRef: MutableRef<HTMLDivElement | null>;
  previewRef: MutableRef<HTMLDivElement | null>;
  previewImageRef: MutableRef<HTMLImageElement | null>;
  runtimeRef: MutableRef<CursorRuntime | null>;
  isVisible: MutableRef<boolean>;
  isPreviewVisible: MutableRef<boolean>;
  cursorSurface: MutableRef<'bg' | 'blok'>;
  prevMousePos: MutableRef<{ x: number; y: number }>;
  hintShowTimeout: MutableRef<ReturnType<typeof setTimeout> | null>;
  hintHideTimeout: MutableRef<ReturnType<typeof setTimeout> | null>;
  setMessage: Dispatch<SetStateAction<string>>;
};

const INTRO_MESSAGE_SELECTOR =
  '.enterCursorLayer.cursorMessage[data-cursor-message]';
const PREVIEW_HIDDEN_STATE = {
  x: -1000,
  y: -1000,
  autoAlpha: 0,
  scale: 0.96,
  rotate: -1.5,
};
const FOLLOWER_DEFAULT_SIZE = '1rem';
const FOLLOWER_INTERACT_SIZE = '2rem';
const FOLLOWER_MAGNETIC_SIZE = '3rem';

// Cursor message offsets come from the baseline 22px type scale:
// 0.909rem is 20px and 0.4545rem is 10px, plus the old sub-pixel x nudge.
const MESSAGE_OFFSET_X_PIXEL_NUDGE = 0.4545454545;
const MESSAGE_OFFSET_X_REM = 0.909090909;
const MESSAGE_OFFSET_Y_REM = 0.4545454545;

const supportsHoverCursor = () =>
  typeof window !== 'undefined' && !window.matchMedia('(hover: none)').matches;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const toPixels = (cssLength: string, remInPixels: number): number => {
  if (!cssLength) return 0;
  const value = cssLength.trim();

  if (value.endsWith('rem')) {
    const remValue = parseFloat(value.slice(0, -3));
    return Number.isFinite(remValue) ? remValue * remInPixels : 0;
  }

  if (value.endsWith('px')) {
    const pixelValue = parseFloat(value.slice(0, -2));
    return Number.isFinite(pixelValue) ? pixelValue : 0;
  }

  const numericValue = parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const createCustomCursorRuntime = ({
  cursor,
  follower,
  messageContainer,
  previewContainer,
  previewImage,
  isVisible,
  isPreviewVisible,
  cursorSurface,
  prevMousePos,
  hintShowTimeout,
  hintHideTimeout,
  setMessage,
}: {
  cursor: HTMLDivElement;
  follower: HTMLDivElement;
  messageContainer: HTMLDivElement;
  previewContainer: HTMLDivElement;
  previewImage: HTMLImageElement;
} & Pick<
  CursorRuntimeOptions,
  | 'isVisible'
  | 'isPreviewVisible'
  | 'cursorSurface'
  | 'prevMousePos'
  | 'hintShowTimeout'
  | 'hintHideTimeout'
  | 'setMessage'
>): CursorRuntime => {
  const setCursorX = gsap.quickSetter(cursor, 'x', 'px') as QuickToSetter;
  const setCursorY = gsap.quickSetter(cursor, 'y', 'px') as QuickToSetter;

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

  const preloadedPreviewImages = new Map<string, HTMLImageElement>();
  const textTweenMap = new WeakMap<HTMLElement, TextTweenSetters>();

  let currentFollowerMode: FollowerMode = 'default';
  let activeMessageTarget: HTMLElement | null = null;
  let activePreviewTarget: HTMLElement | null = null;
  let activeMagneticTarget: HTMLElement | null = null;
  let pointerFrameId: number | null = null;
  let latestPointerX = 0;
  let latestPointerY = 0;
  let latestPointerTarget: EventTarget | null = null;
  let messageOffsetX = 0;
  let messageOffsetY = 0;
  let previewRightInset = 0;
  let messageSize: ElementSize = { width: 220, height: 44 };
  let previewSize: ElementSize = { width: 360, height: 270 };
  let previewBoundary: PositionBoundary = {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
  };
  let activeMagneticRect: DOMRect | null = null;

  const getCachedElementSize = (
    element: HTMLElement,
    fallback: ElementSize,
  ): ElementSize => ({
    width: element.offsetWidth || fallback.width,
    height: element.offsetHeight || fallback.height,
  });

  const setFollowerMode = (mode: FollowerMode) => {
    if (currentFollowerMode === mode) return;
    currentFollowerMode = mode;

    const size =
      mode === 'magnetic'
        ? FOLLOWER_MAGNETIC_SIZE
        : mode === 'interact'
          ? FOLLOWER_INTERACT_SIZE
          : FOLLOWER_DEFAULT_SIZE;

    gsap.to(follower, {
      width: size,
      height: size,
      duration: 0.165,
      overwrite: 'auto',
    });
  };

  const updateMessageOffsets = () => {
    const remInPixels =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    messageOffsetX =
      MESSAGE_OFFSET_X_PIXEL_NUDGE + MESSAGE_OFFSET_X_REM * remInPixels;
    messageOffsetY = MESSAGE_OFFSET_Y_REM * remInPixels;
  };

  const updatePreviewBoundaryInset = () => {
    const rootStyle = getComputedStyle(document.documentElement);
    const remInPixels = parseFloat(rootStyle.fontSize) || 16;
    const iconSize = toPixels(
      rootStyle.getPropertyValue('--icon-size'),
      remInPixels,
    );
    const iconSpacing = toPixels(
      rootStyle.getPropertyValue('--spacing-icons'),
      remInPixels,
    );
    previewRightInset = iconSize + iconSpacing;
  };

  const refreshMessageSize = () => {
    messageSize = getCachedElementSize(messageContainer, {
      width: 220,
      height: 44,
    });
  };

  const refreshPreviewSize = () => {
    previewSize = getCachedElementSize(previewContainer, {
      width: 360,
      height: 270,
    });
  };

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

  const setActiveMagneticTarget = (target: HTMLElement | null) => {
    if (target === activeMagneticTarget) return;
    clearMagneticTextTween(activeMagneticTarget);
    activeMagneticTarget = target;
    refreshActiveMagneticRect();
  };

  const preloadPreviewImage = (src: string) => {
    if (!src || preloadedPreviewImages.has(src)) return;

    const image = new Image();
    image.decoding = 'async';
    image.loading = 'eager';
    image.src = src;
    preloadedPreviewImages.set(src, image);

    if (typeof image.decode === 'function') {
      image.decode().catch(() => {});
    }
  };

  const refreshPreviewBoundary = () => {
    const viewportBoundary: PositionBoundary = {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };

    const mainContainer =
      document.querySelector<HTMLElement>('main.main') ??
      document.querySelector<HTMLElement>('main');

    if (!mainContainer) {
      previewBoundary = viewportBoundary;
      return;
    }

    const rect = mainContainer.getBoundingClientRect();
    const mainBoundary: PositionBoundary = {
      left: Math.max(0, rect.left),
      top: Math.max(0, rect.top),
      right: Math.min(window.innerWidth, rect.right) - previewRightInset,
      bottom: Math.min(window.innerHeight, rect.bottom),
    };

    if (
      mainBoundary.right <= mainBoundary.left ||
      mainBoundary.bottom <= mainBoundary.top
    ) {
      previewBoundary = viewportBoundary;
      return;
    }

    previewBoundary = mainBoundary;
  };

  const refreshActiveMagneticRect = () => {
    activeMagneticRect = activeMagneticTarget?.getBoundingClientRect() ?? null;
  };

  const updateCursorMeasurements = () => {
    updateMessageOffsets();
    updatePreviewBoundaryInset();
    refreshMessageSize();
    refreshPreviewSize();
    refreshPreviewBoundary();
    refreshActiveMagneticRect();
  };

  const clampPreviewPosition = (clientX: number, clientY: number) => {
    const previewWidth = previewSize.width;
    const previewHeight = previewSize.height;
    const boundary = previewBoundary;
    const padding = 16;
    let x = clientX - previewWidth / 2;
    let y = clientY - previewHeight / 2;
    const minX = boundary.left + padding;
    const minY = boundary.top + padding;
    const maxX = boundary.right - previewWidth - padding;
    const maxY = boundary.bottom - previewHeight - padding;

    if (maxX < minX) {
      x = boundary.left + (boundary.right - boundary.left - previewWidth) / 2;
    } else {
      x = clamp(x, minX, maxX);
    }

    if (maxY < minY) {
      y = boundary.top + (boundary.bottom - boundary.top - previewHeight) / 2;
    } else {
      y = clamp(y, minY, maxY);
    }

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
    const messageWidth = messageSize.width;
    const messageHeight = messageSize.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16;

    return {
      x: clamp(clientX, padding, viewportWidth - messageWidth - padding),
      y: clamp(clientY, padding, viewportHeight - messageHeight - padding),
    };
  };

  const setMessageToPointerInstant = (clientX: number, clientY: number) => {
    const { x, y } = clampMessagePosition(
      clientX + messageOffsetX,
      clientY + messageOffsetY,
    );
    gsap.set(messageContainer, { x, y });
  };

  const refreshMessageSizeAfterRender = () => {
    refreshMessageSize();
    window.requestAnimationFrame(refreshMessageSize);
  };

  const showPreview = () => {
    if (isPreviewVisible.current) return;
    isPreviewVisible.current = true;
    refreshPreviewSize();
    refreshPreviewBoundary();
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

  const resolveFollowerMode = (
    hoveredElement: Element | null,
  ): FollowerMode => {
    const magneticTarget = hoveredElement?.closest('.cursorMagnetic');
    if (magneticTarget) return 'magnetic';

    const interactTarget = hoveredElement?.closest(
      '.cursorInteract, .markdown a',
    );
    if (
      interactTarget &&
      !interactTarget.hasAttribute('data-cursor-message') &&
      !interactTarget.hasAttribute('data-cursor-preview')
    ) {
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
      setMessageToPointerInstant(latestPointerX, latestPointerY);
      rotateMessageTo(0);
      setMessage(messageText);
      refreshMessageSizeAfterRender();
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
    refreshPreviewSize();
    refreshPreviewBoundary();

    if (previewImage.getAttribute('src') !== src) {
      previewImage.setAttribute('src', src);
    }
    previewImage.setAttribute('alt', alt);

    prevMousePos.current = { x: pointerX, y: pointerY };
    setPreviewToPointerInstant(pointerX, pointerY);
    showPreview();
  };

  const resolveHoveredElement = (): Element | null => {
    if (latestPointerTarget instanceof Element) return latestPointerTarget;
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
    setActiveMagneticTarget(resolvedMagneticTarget);

    let foundTarget = false;
    if (activeMagneticTarget && activeMagneticRect) {
      const rect = activeMagneticRect;
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
    const rotation = clamp(-deltaY * 0.5, -25, 25);
    rotateMessageTo(rotation);
    rotationReset.restart(true);

    prevMousePos.current = { x: cursorPosition.x, y: cursorPosition.y };
  };

  const schedulePointerFrame = () => {
    if (pointerFrameId !== null) return;
    pointerFrameId = window.requestAnimationFrame(runPointerFrame);
  };

  const syncIntroMessageVisibility = () => {
    const introTarget =
      document.querySelector<HTMLElement>(INTRO_MESSAGE_SELECTOR);

    if (!introTarget) {
      if (activeMessageTarget?.matches(INTRO_MESSAGE_SELECTOR)) {
        activeMessageTarget = null;
        messageFadeAnim.reverse();
      }
      return;
    }

    if (isVisible.current) return;

    const messageText = introTarget.getAttribute('data-cursor-message');
    if (!messageText) return;

    latestPointerX = window.innerWidth / 2;
    latestPointerY = window.innerHeight / 2;
    latestPointerTarget = introTarget;
    prevMousePos.current = { x: latestPointerX, y: latestPointerY };
    activeMessageTarget = introTarget;
    setMessage(messageText);
    refreshMessageSizeAfterRender();
    setMessageToPointerInstant(latestPointerX, latestPointerY);
    rotateMessageTo(0);
    messageFadeAnim.progress(1).pause();
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
    activeMagneticRect = null;
    activeMessageTarget = null;
    activePreviewTarget = null;

    rotationReset.pause(0);
    rotateMessageTo(0);
    messageFadeAnim.reverse();
    hidePreview();
    syncIntroMessageVisibility();
  };

  const handleClick = () => {
    setFollowerMode('default');
    hidePreview();

    if (activeMessageTarget?.matches(INTRO_MESSAGE_SELECTOR)) {
      activeMessageTarget = null;
      messageFadeAnim.reverse();
    }
  };

  const showProjectNavigationHint = () => {
    const isProjectPage = document.querySelector('.page-Project');
    const hasSeenHint = sessionStorage.getItem('cursorNavigationHintShown');

    if (!isProjectPage || hasSeenHint) return;

    if (hintShowTimeout.current) {
      clearTimeout(hintShowTimeout.current);
    }
    if (hintHideTimeout.current) {
      clearTimeout(hintHideTimeout.current);
    }

    hintShowTimeout.current = setTimeout(() => {
      setMessage("tip: use ←, → or 'esc'");
      refreshMessageSizeAfterRender();
      messageFadeAnim.play();

      hintHideTimeout.current = setTimeout(() => {
        messageFadeAnim.reverse();
      }, 4000);

      sessionStorage.setItem('cursorNavigationHintShown', 'true');
    }, 500);
  };

  const resetPreviewForRoute = () => {
    activePreviewTarget = null;
    isPreviewVisible.current = false;
    gsap.killTweensOf(previewContainer);
    gsap.set(previewContainer, PREVIEW_HIDDEN_STATE);
    previewImage.setAttribute('src', '');
    previewImage.setAttribute('alt', '');
    refreshPreviewSize();
    refreshPreviewBoundary();
    showProjectNavigationHint();
  };

  const destroy = () => {
    if (pointerFrameId !== null) {
      window.cancelAnimationFrame(pointerFrameId);
      pointerFrameId = null;
    }

    if (hintShowTimeout.current) {
      clearTimeout(hintShowTimeout.current);
      hintShowTimeout.current = null;
    }
    if (hintHideTimeout.current) {
      clearTimeout(hintHideTimeout.current);
      hintHideTimeout.current = null;
    }

    rotationReset.kill();
    preloadedPreviewImages.clear();
    hidePreview();
    document.body.removeAttribute('data-cursor-surface');
  };

  document.body.setAttribute('data-cursor-surface', 'bg');
  gsap.set([cursor, follower], { opacity: 0, xPercent: -50, yPercent: -50 });
  gsap.set(messageContainer, { opacity: 0, xPercent: 0, yPercent: 0 });
  gsap.set(previewContainer, PREVIEW_HIDDEN_STATE);
  gsap.set(follower, {
    width: FOLLOWER_DEFAULT_SIZE,
    height: FOLLOWER_DEFAULT_SIZE,
  });
  updateCursorMeasurements();
  showProjectNavigationHint();
  syncIntroMessageVisibility();

  return {
    resetPreviewForRoute,
    updateCursorMeasurements,
    handlePointerMove,
    handleMouseLeaveWindow,
    handleClick,
    showProjectNavigationHint,
    syncIntroMessageVisibility,
    destroy,
  };
};

const useCustomCursorRuntime = ({
  cursorRef,
  followerRef,
  messageRef,
  previewRef,
  previewImageRef,
  runtimeRef,
  isVisible,
  isPreviewVisible,
  cursorSurface,
  prevMousePos,
  hintShowTimeout,
  hintHideTimeout,
  setMessage,
}: CursorRuntimeOptions) => {
  useGSAP(() => {
    if (!supportsHoverCursor()) return;

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

    const runtime = createCustomCursorRuntime({
      cursor,
      follower,
      messageContainer,
      previewContainer,
      previewImage,
      isVisible,
      isPreviewVisible,
      cursorSurface,
      prevMousePos,
      hintShowTimeout,
      hintHideTimeout,
      setMessage,
    });

    runtimeRef.current = runtime;

    return () => {
      runtime.destroy();
      runtimeRef.current = null;
    };
  });
};

const useCursorPreviewRouteReset = (
  pathname: string,
  runtimeRef: MutableRef<CursorRuntime | null>,
) => {
  useEffect(() => {
    runtimeRef.current?.resetPreviewForRoute();
  }, [pathname, runtimeRef]);
};

const useCursorEventListeners = (
  runtimeRef: MutableRef<CursorRuntime | null>,
) => {
  useEffect(() => {
    if (!supportsHoverCursor()) return;

    const handleResize = () => {
      runtimeRef.current?.updateCursorMeasurements();
    };
    const handleScroll = () => {
      runtimeRef.current?.updateCursorMeasurements();
    };
    const handleBlur = () => {
      runtimeRef.current?.handleMouseLeaveWindow();
    };
    const handlePointerMove = (event: MouseEvent | PointerEvent) => {
      runtimeRef.current?.handlePointerMove(event);
    };
    const handleMouseLeave = () => {
      runtimeRef.current?.handleMouseLeaveWindow();
    };
    const handleClick = () => {
      runtimeRef.current?.handleClick();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('blur', handleBlur);
    if (typeof window.PointerEvent === 'function') {
      document.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });
    } else {
      document.addEventListener('mousemove', handlePointerMove);
    }
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('blur', handleBlur);
      if (typeof window.PointerEvent === 'function') {
        document.removeEventListener('pointermove', handlePointerMove);
      } else {
        document.removeEventListener('mousemove', handlePointerMove);
      }
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('click', handleClick);
    };
  }, [runtimeRef]);
};

const useCursorIntroMessageObserver = (
  runtimeRef: MutableRef<CursorRuntime | null>,
) => {
  useEffect(() => {
    if (!supportsHoverCursor() || typeof MutationObserver === 'undefined') {
      return;
    }

    const syncIntroMessageVisibility = () => {
      runtimeRef.current?.syncIntroMessageVisibility();
    };
    const introMessageObserver = new MutationObserver(
      syncIntroMessageVisibility,
    );

    syncIntroMessageVisibility();
    introMessageObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      introMessageObserver.disconnect();
    };
  }, [runtimeRef]);
};

export default function CustomCursor() {
  const pathname = usePathname();
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const runtimeRef = useRef<CursorRuntime | null>(null);
  const isVisible = useRef(false);
  const isPreviewVisible = useRef(false);
  const cursorSurface = useRef<'bg' | 'blok'>('bg');
  const prevMousePos = useRef({ x: 0, y: 0 });
  const hintShowTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [message, setMessage] = useState('');

  useCustomCursorRuntime({
    cursorRef,
    followerRef,
    messageRef,
    previewRef,
    previewImageRef,
    runtimeRef,
    isVisible,
    isPreviewVisible,
    cursorSurface,
    prevMousePos,
    hintShowTimeout,
    hintHideTimeout,
    setMessage,
  });
  useCursorPreviewRouteReset(pathname, runtimeRef);
  useCursorEventListeners(runtimeRef);
  useCursorIntroMessageObserver(runtimeRef);

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
