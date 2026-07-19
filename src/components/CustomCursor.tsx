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
type ElementSize = {
  width: number;
  height: number;
};
type CursorRuntime = {
  updateCursorMeasurements: () => void;
  handlePointerMove: (event: MouseEvent | PointerEvent) => void;
  handleMouseLeaveWindow: () => void;
  handleClick: () => void;
  showProjectNavigationHint: () => void;
  destroy: () => void;
};
type CursorRuntimeOptions = {
  cursorRef: MutableRef<HTMLDivElement | null>;
  followerRef: MutableRef<HTMLDivElement | null>;
  messageRef: MutableRef<HTMLDivElement | null>;
  runtimeRef: MutableRef<CursorRuntime | null>;
  isVisible: MutableRef<boolean>;
  cursorSurface: MutableRef<'bg' | 'blok'>;
  prevMousePos: MutableRef<{ x: number; y: number }>;
  hintShowTimeout: MutableRef<ReturnType<typeof setTimeout> | null>;
  hintHideTimeout: MutableRef<ReturnType<typeof setTimeout> | null>;
  setMessage: Dispatch<SetStateAction<string>>;
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

const createCustomCursorRuntime = ({
  cursor,
  follower,
  messageContainer,
  isVisible,
  cursorSurface,
  prevMousePos,
  hintShowTimeout,
  hintHideTimeout,
  setMessage,
}: {
  cursor: HTMLDivElement;
  follower: HTMLDivElement;
  messageContainer: HTMLDivElement;
} & Pick<
  CursorRuntimeOptions,
  | 'isVisible'
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

  const textTweenMap = new WeakMap<HTMLElement, TextTweenSetters>();

  let currentFollowerMode: FollowerMode = 'default';
  let activeMessageTarget: HTMLElement | null = null;
  let activeMagneticTarget: HTMLElement | null = null;
  let pointerFrameId: number | null = null;
  let latestPointerX = 0;
  let latestPointerY = 0;
  let latestPointerTarget: EventTarget | null = null;
  let messageOffsetX = 0;
  let messageOffsetY = 0;
  let messageSize: ElementSize = { width: 220, height: 44 };
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

  const refreshMessageSize = () => {
    messageSize = getCachedElementSize(messageContainer, {
      width: 220,
      height: 44,
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

  const refreshActiveMagneticRect = () => {
    activeMagneticRect = activeMagneticTarget?.getBoundingClientRect() ?? null;
  };

  const updateCursorMeasurements = () => {
    updateMessageOffsets();
    refreshMessageSize();
    refreshActiveMagneticRect();
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

  const resolveFollowerMode = (
    hoveredElement: Element | null,
  ): FollowerMode => {
    const magneticTarget = hoveredElement?.closest('.cursorMagnetic');
    if (magneticTarget) return 'magnetic';

    const interactTarget = hoveredElement?.closest(
      '.cursorInteract, .markdown a',
    );
    if (
      interactTarget && !interactTarget.hasAttribute('data-cursor-message')
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
    rotationReset.pause(0);
    rotateMessageTo(0);
    messageFadeAnim.reverse();
  };

  const handleClick = () => {
    setFollowerMode('default');
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
    document.body.removeAttribute('data-cursor-surface');
  };

  document.body.setAttribute('data-cursor-surface', 'bg');
  gsap.set([cursor, follower], { opacity: 0, xPercent: -50, yPercent: -50 });
  gsap.set(messageContainer, { opacity: 0, xPercent: 0, yPercent: 0 });
  gsap.set(follower, {
    width: FOLLOWER_DEFAULT_SIZE,
    height: FOLLOWER_DEFAULT_SIZE,
  });
  updateCursorMeasurements();
  showProjectNavigationHint();

  return {
    updateCursorMeasurements,
    handlePointerMove,
    handleMouseLeaveWindow,
    handleClick,
    showProjectNavigationHint,
    destroy,
  };
};

const useCustomCursorRuntime = ({
  cursorRef,
  followerRef,
  messageRef,
  runtimeRef,
  isVisible,
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

    if (!cursor || !follower || !messageContainer) {
      return;
    }

    const runtime = createCustomCursorRuntime({
      cursor,
      follower,
      messageContainer,
      isVisible,
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

const useCursorRouteHint = (
  pathname: string,
  runtimeRef: MutableRef<CursorRuntime | null>,
) => {
  useEffect(() => {
    runtimeRef.current?.showProjectNavigationHint();
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

export default function CustomCursor() {
  const pathname = usePathname();
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<CursorRuntime | null>(null);
  const isVisible = useRef(false);
  const cursorSurface = useRef<'bg' | 'blok'>('bg');
  const prevMousePos = useRef({ x: 0, y: 0 });
  const hintShowTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [message, setMessage] = useState('');

  useCustomCursorRuntime({
    cursorRef,
    followerRef,
    messageRef,
    runtimeRef,
    isVisible,
    cursorSurface,
    prevMousePos,
    hintShowTimeout,
    hintHideTimeout,
    setMessage,
  });
  useCursorRouteHint(pathname, runtimeRef);
  useCursorEventListeners(runtimeRef);

  return (
    <>
      <div ref={messageRef} className={`${styles.cursor} ${styles.message}`}>
        {message}
      </div>
      <div
        ref={followerRef}
        className={`${styles.cursor} ${styles.follower}`}
      />
      <div ref={cursorRef} className={`${styles.cursor} ${styles.main}`} />
    </>
  );
}
