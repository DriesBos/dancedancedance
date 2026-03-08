'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, useGSAP } from '@/lib/gsap';
import styles from './CustomCursor.module.sass';

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
  const rotationResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hintShowTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  }, [pathname]);

  useGSAP(() => {
    // Skip on touch devices - no hover support
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

    // Initial state - both cursors and message hidden and centered on cursor point
    gsap.set([cursor, follower], { opacity: 0, xPercent: -50, yPercent: -50 });
    gsap.set(messageContainer, { opacity: 0, xPercent: 0, yPercent: 0 });
    gsap.set(previewContainer, {
      x: -1000,
      y: -1000,
      autoAlpha: 0,
      scale: 0.96,
      rotate: -1.5,
    });

    // QuickTo for smooth follower movement
    const xFollowerTo = gsap.quickTo(follower, 'x', {
      duration: 0.33,
      ease: 'power3',
    });
    const yFollowerTo = gsap.quickTo(follower, 'y', {
      duration: 0.33,
      ease: 'power3',
    });

    // QuickTo for smooth message container movement
    const xMessageTo = gsap.quickTo(messageContainer, 'x', {
      duration: 0.6,
      ease: 'power3',
    });
    const yMessageTo = gsap.quickTo(messageContainer, 'y', {
      duration: 0.6,
      ease: 'power3',
    });
    const xPreviewTo = gsap.quickTo(previewContainer, 'x', {
      duration: 0.36,
      ease: 'power3',
    });
    const yPreviewTo = gsap.quickTo(previewContainer, 'y', {
      duration: 0.36,
      ease: 'power3',
    });

    // QuickTo for message rotation based on velocity
    const rotateMessageTo = gsap.quickTo(messageContainer, 'rotation', {
      duration: 0.6,
      ease: 'power3',
    });

    const followerDefaultSize = '0.9090909091rem';
    const followerInteractSize = '1.8181818182rem';
    const followerMagneticSize = '2.7272727273rem';
    type FollowerMode = 'default' | 'interact' | 'magnetic';
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

    // Message fade animation
    const messageFadeAnim = gsap.timeline({ paused: true });
    messageFadeAnim.to(messageContainer, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    });

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

    let magneticTargets: HTMLElement[] = [];
    const boundMessageTargets = new WeakSet<EventTarget>();
    const boundPreviewTargets = new WeakSet<EventTarget>();
    const preloadedPreviewUrls = new Set<string>();
    const preloadedPreviewImages: HTMLImageElement[] = [];

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

    const handleMouseMove = (e: MouseEvent) => {
      // Show cursor on first move
      if (!isVisible.current) {
        gsap.set([cursor, follower], { opacity: 1 });
        isVisible.current = true;
      }

      const cursorPosition = {
        x: e.clientX,
        y: e.clientY,
      };

      const hoveredElement = document.elementFromPoint(
        cursorPosition.x,
        cursorPosition.y,
      );
      const nextSurface: 'bg' | 'blok' = hoveredElement?.closest('.blok')
        ? 'blok'
        : 'bg';
      if (nextSurface !== cursorSurface.current) {
        cursorSurface.current = nextSurface;
        document.body.setAttribute('data-cursor-surface', nextSurface);
      }
      setFollowerMode(resolveFollowerMode(hoveredElement));

      let foundTarget = false;

      magneticTargets.forEach((targetEle) => {
        const rect = targetEle.getBoundingClientRect();
        const triggerDistance = rect.width;

        // Get position of target center
        const targetPosition = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };

        // Get distance between target and mouse
        const distance = {
          adj: targetPosition.x - cursorPosition.x,
          opp: targetPosition.y - cursorPosition.y,
        };

        const hypotenuse = Math.sqrt(
          distance.adj * distance.adj + distance.opp * distance.opp,
        );

        // Get angle from adj and opp
        const angle = Math.atan2(distance.adj, distance.opp);

        // Inside trigger area
        if (hypotenuse * 1.5 < triggerDistance) {
          foundTarget = true;

          // Tween follower position towards target (magnetic)
          const magneticX =
            targetPosition.x - (Math.sin(angle) * hypotenuse) / 4;
          const magneticY =
            targetPosition.y - (Math.cos(angle) * hypotenuse) / 4;

          // Only follower is magnetic, main cursor follows mouse
          xFollowerTo(magneticX);
          yFollowerTo(magneticY);

          // Pull text inside target (optional)
          const textEl = targetEle.querySelector('.text');
          if (textEl) {
            gsap.to(textEl, {
              x: -((Math.sin(angle) * hypotenuse) / 8),
              y: -((Math.cos(angle) * hypotenuse) / 8),
              duration: 0.6,
              overwrite: 'auto',
            });
          }
        } else {
          // Release text
          const textEl = targetEle.querySelector('.text');
          if (textEl) {
            gsap.to(textEl, {
              x: 0,
              y: 0,
              duration: 0.6,
              overwrite: 'auto',
            });
          }
        }
      });

      // If not hovering any target, follower follows mouse normally
      if (!foundTarget) {
        xFollowerTo(cursorPosition.x);
        yFollowerTo(cursorPosition.y);
      }

      // Main cursor always follows mouse directly (no delay)
      gsap.set(cursor, { x: cursorPosition.x, y: cursorPosition.y });

      // Message container follows cursor with delay and slight offset
      const remInPixels = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const xOffset = 0.4545454545 + 0.909090909 * remInPixels;
      const yOffset = 0.4545454545 * remInPixels;
      const { x: clampedMessageX, y: clampedMessageY } = clampMessagePosition(
        cursorPosition.x + xOffset,
        cursorPosition.y + yOffset,
      );
      xMessageTo(clampedMessageX);
      yMessageTo(clampedMessageY);
      if (isPreviewVisible.current) {
        movePreviewToPointer(cursorPosition.x, cursorPosition.y);
      }

      // Calculate velocity for tilt effect
      const deltaY = cursorPosition.y - prevMousePos.current.y;
      // Clamp rotation between -25 and 25 degrees based on vertical velocity
      // Negative deltaY (upward) = positive rotation, positive deltaY (downward) = negative rotation
      const rotation = Math.max(-25, Math.min(25, -deltaY * 0.5));
      rotateMessageTo(rotation);

      // Clear any existing rotation reset timeout
      if (rotationResetTimeout.current) {
        clearTimeout(rotationResetTimeout.current);
      }

      // Reset rotation to horizontal after movement stops
      rotationResetTimeout.current = setTimeout(() => {
        rotateMessageTo(0);
      }, 150);

      // Update previous position
      prevMousePos.current = { x: cursorPosition.x, y: cursorPosition.y };
    };

    // Hover handlers for message targets
    const handleMessageEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const messageText = target.getAttribute('data-cursor-message');
      if (messageText) {
        setMessage(messageText);
        // Restart from beginning to ensure it shows even if already playing
        messageFadeAnim.restart();
      }
    };

    const handleMessageLeave = () => {
      messageFadeAnim.reverse();
    };

    const handlePreviewEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const src = target.getAttribute('data-cursor-preview');
      if (!src) return;

      const alt = target.getAttribute('data-cursor-preview-alt') || '';
      if (previewImage.getAttribute('src') !== src) {
        previewImage.setAttribute('src', src);
      }
      previewImage.setAttribute('alt', alt);

      const mouseEvent = e as MouseEvent;
      const enterX = mouseEvent.clientX;
      const enterY = mouseEvent.clientY;
      prevMousePos.current = { x: enterX, y: enterY };
      setPreviewToPointerInstant(enterX, enterY);
      showPreview();
    };

    const handlePreviewLeave = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const nextTarget = mouseEvent.relatedTarget;
      if (
        nextTarget instanceof Element &&
        nextTarget.closest('.cursorPreview')
      ) {
        return;
      }
      hidePreview();
    };

    const preloadPreviewImages = () => {
      const previewTargets = document.querySelectorAll<HTMLElement>(
        '.cursorPreview[data-cursor-preview]',
      );

      previewTargets.forEach((target) => {
        const src = target.getAttribute('data-cursor-preview');
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
      });
    };

    // Hide cursors when mouse leaves window
    const handleMouseLeaveWindow = () => {
      gsap.set([cursor, follower], { opacity: 0 });
      isVisible.current = false;
      cursorSurface.current = 'bg';
      document.body.setAttribute('data-cursor-surface', 'bg');
      setFollowerMode('default');

      // Clear rotation reset timeout and reset rotation
      if (rotationResetTimeout.current) {
        clearTimeout(rotationResetTimeout.current);
      }
      rotateMessageTo(0); // Reset rotation when leaving window
      hidePreview();
    };

    // Reset size animations on click (for route changes where leave isn't triggered)
    const handleClick = () => {
      setFollowerMode('default');
      hidePreview();
    };

    // Show navigation hint on project pages (first time only per session)
    const showProjectNavigationHint = () => {
      const isProjectPage = document.querySelector('.page-Project');
      const hasSeenHint = sessionStorage.getItem('cursorNavigationHintShown');

      if (isProjectPage && !hasSeenHint) {
        // Wait a moment for page to settle
        if (hintShowTimeout.current) {
          clearTimeout(hintShowTimeout.current);
        }
        if (hintHideTimeout.current) {
          clearTimeout(hintHideTimeout.current);
        }
        hintShowTimeout.current = setTimeout(() => {
          setMessage("tip: use ←, → or 'esc'");
          messageFadeAnim.play();

          // Auto-hide after 6 seconds
          hintHideTimeout.current = setTimeout(() => {
            messageFadeAnim.reverse();
          }, 4000);

          // Mark as shown for this session
          sessionStorage.setItem('cursorNavigationHintShown', 'true');
        }, 500);
      }
    };

    // Check for project page hint
    showProjectNavigationHint();

    // Add listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeaveWindow);
    document.addEventListener('click', handleClick);

    const addTargetListeners = () => {
      magneticTargets = Array.from(
        document.querySelectorAll<HTMLElement>('.cursorMagnetic'),
      );

      const messageTargets = document.querySelectorAll('.cursorMessage');
      messageTargets.forEach((target) => {
        if (boundMessageTargets.has(target)) return;
        target.addEventListener('mouseenter', handleMessageEnter);
        target.addEventListener('mouseleave', handleMessageLeave);
        boundMessageTargets.add(target);
      });

      const previewTargets = document.querySelectorAll('.cursorPreview');
      previewTargets.forEach((target) => {
        if (boundPreviewTargets.has(target)) return;
        target.addEventListener('mouseenter', handlePreviewEnter);
        target.addEventListener('mouseleave', handlePreviewLeave);
        boundPreviewTargets.add(target);
      });
    };

    addTargetListeners();
    preloadPreviewImages();

    // MutationObserver for dynamic elements and route changes
    const observer = new MutationObserver(() => {
      addTargetListeners();
      preloadPreviewImages();
      showProjectNavigationHint(); // Check for project page on route change
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      document.removeEventListener('click', handleClick);
      const messageTargets = document.querySelectorAll('.cursorMessage');
      messageTargets.forEach((target) => {
        target.removeEventListener('mouseenter', handleMessageEnter);
        target.removeEventListener('mouseleave', handleMessageLeave);
      });
      const previewTargets = document.querySelectorAll('.cursorPreview');
      previewTargets.forEach((target) => {
        target.removeEventListener('mouseenter', handlePreviewEnter);
        target.removeEventListener('mouseleave', handlePreviewLeave);
      });

      // Clear rotation reset timeout
      if (rotationResetTimeout.current) {
        clearTimeout(rotationResetTimeout.current);
      }
      if (hintShowTimeout.current) {
        clearTimeout(hintShowTimeout.current);
      }
      if (hintHideTimeout.current) {
        clearTimeout(hintHideTimeout.current);
      }
      preloadedPreviewImages.length = 0;
      preloadedPreviewUrls.clear();
      hidePreview();

      document.body.removeAttribute('data-cursor-surface');
      observer.disconnect();
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
