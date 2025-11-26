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
      duration: 0.3,
      ease: 'power3',
    });
    const yFollowerTo = gsap.quickTo(follower, 'y', {
      duration: 0.3,
      ease: 'power3',
    });

    // Scale animation timeline
    const scaleAnim = gsap.timeline({ paused: true });
    scaleAnim.to(follower, { scale: 1.5, duration: 0.35 });
    // .to(cursor, { scale: 1.5, duration: 0.35 }, 0);

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

    // Hover handlers for magnetic targets
    const handleMouseEnter = () => {
      mouseInTarget.current = true;
      scaleAnim.play();
    };

    const handleMouseLeave = () => {
      mouseInTarget.current = false;
      scaleAnim.reverse();
    };

    // Add listeners
    document.addEventListener('mousemove', handleMouseMove);

    const addTargetListeners = () => {
      const targets = document.querySelectorAll('.cursorMagnetic');
      targets.forEach((target) => {
        target.addEventListener('mouseenter', handleMouseEnter);
        target.addEventListener('mouseleave', handleMouseLeave);
      });
    };

    addTargetListeners();

    // MutationObserver for dynamic elements
    const observer = new MutationObserver(addTargetListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      const targets = document.querySelectorAll('.cursorMagnetic');
      targets.forEach((target) => {
        target.removeEventListener('mouseenter', handleMouseEnter);
        target.removeEventListener('mouseleave', handleMouseLeave);
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
