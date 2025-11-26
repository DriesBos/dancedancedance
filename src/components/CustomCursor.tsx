'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const isVisible = useRef(false);
  const mouseInTarget = useRef(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    // Initial scale
    gsap.set(cursor, { scale: 1 });
    gsap.set(follower, { scale: 1, opacity: 0 });

    // QuickTo for smooth cursor movement
    const xCursorTo = gsap.quickTo(cursor, 'x', {
      duration: 0.01,
      ease: 'power3',
    });
    const yCursorTo = gsap.quickTo(cursor, 'y', {
      duration: 0.01,
      ease: 'power3',
    });
    const xFollowerTo = gsap.quickTo(follower, 'x', {
      duration: 0.33,
      ease: 'power3',
    });
    const yFollowerTo = gsap.quickTo(follower, 'y', {
      duration: 0.33,
      ease: 'power3',
    });

    // Size animation timeline (width/height instead of scale)
    const sizeAnimInteract = gsap.timeline({ paused: true });
    sizeAnimInteract.to(follower, {
      width: '1.8181818182rem',
      height: '1.8181818182rem',
      duration: 0.165,
    });

    const sizeAnimMagnetic = gsap.timeline({ paused: true });
    sizeAnimMagnetic.to(follower, {
      width: '2.7272727273rem',
      height: '2.7272727273rem',
      duration: 0.165,
    });

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

      const targetElements = document.querySelectorAll('.cursorMagnetic');
      let foundTarget = false;

      targetElements.forEach((targetEle) => {
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
          distance.adj * distance.adj + distance.opp * distance.opp
        );

        // Get angle from adj and opp
        const angle = Math.atan2(distance.adj, distance.opp);

        // Inside trigger area
        if (hypotenuse * 2 < triggerDistance) {
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
            });
          }
        } else {
          // Release text
          const textEl = targetEle.querySelector('.text');
          if (textEl) {
            gsap.to(textEl, { x: 0, y: 0, duration: 0.6 });
          }
        }
      });

      // If not hovering any target, follower follows mouse normally
      if (!foundTarget) {
        xFollowerTo(cursorPosition.x);
        yFollowerTo(cursorPosition.y);
      }

      // Main cursor always follows mouse directly
      xCursorTo(cursorPosition.x);
      yCursorTo(cursorPosition.y);
    };

    // Hover handlers for magnetic targets (magnetic + size)
    const handleMagneticEnter = () => {
      mouseInTarget.current = true;
      sizeAnimMagnetic.play();
    };

    const handleMagneticLeave = () => {
      mouseInTarget.current = false;
      sizeAnimMagnetic.reverse();
    };

    // Hover handlers for interact targets (size only, no magnetic)
    const handleInteractEnter = () => {
      sizeAnimInteract.play();
    };

    const handleInteractLeave = () => {
      sizeAnimInteract.reverse();
    };

    // Add listeners
    document.addEventListener('mousemove', handleMouseMove);

    const addTargetListeners = () => {
      const magneticTargets = document.querySelectorAll('.cursorMagnetic');
      magneticTargets.forEach((target) => {
        target.addEventListener('mouseenter', handleMagneticEnter);
        target.addEventListener('mouseleave', handleMagneticLeave);
      });

      const interactTargets = document.querySelectorAll('.cursorInteract');
      interactTargets.forEach((target) => {
        target.addEventListener('mouseenter', handleInteractEnter);
        target.addEventListener('mouseleave', handleInteractLeave);
      });
    };

    addTargetListeners();

    // MutationObserver for dynamic elements
    const observer = new MutationObserver(addTargetListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      const magneticTargets = document.querySelectorAll('.cursorMagnetic');
      magneticTargets.forEach((target) => {
        target.removeEventListener('mouseenter', handleMagneticEnter);
        target.removeEventListener('mouseleave', handleMagneticLeave);
      });
      const interactTargets = document.querySelectorAll('.cursorInteract');
      interactTargets.forEach((target) => {
        target.removeEventListener('mouseenter', handleInteractEnter);
        target.removeEventListener('mouseleave', handleInteractLeave);
      });
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={followerRef} className="customCursor customCursor-Follower" />
      <div ref={cursorRef} className="customCursor customCursor-Main" />
    </>
  );
}
