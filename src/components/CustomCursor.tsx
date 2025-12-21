'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const isVisible = useRef(false);
  const mouseInTarget = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const rotationResetTimeout = useRef<NodeJS.Timeout | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Skip on touch devices - no hover support
    if (window.matchMedia('(hover: none)').matches) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;
    const messageContainer = messageRef.current;
    if (!cursor || !follower || !messageContainer) return;

    // Initial state - both cursors and message hidden and centered on cursor point
    gsap.set([cursor, follower], { opacity: 0, xPercent: -50, yPercent: -50 });
    gsap.set(messageContainer, { opacity: 0, xPercent: 0, yPercent: 0 });

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

    // QuickTo for message rotation based on velocity
    const rotateMessageTo = gsap.quickTo(messageContainer, 'rotation', {
      duration: 0.6,
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

    // Message fade animation
    const messageFadeAnim = gsap.timeline({ paused: true });
    messageFadeAnim.to(messageContainer, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
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

      // Main cursor always follows mouse directly (no delay)
      gsap.set(cursor, { x: cursorPosition.x, y: cursorPosition.y });

      // Message container follows cursor with delay and slight offset
      const remInPixels = parseFloat(
        getComputedStyle(document.documentElement).fontSize
      );
      const xOffset = 0.4545454545 + 0.909090909 * remInPixels;
      const yOffset = 0.4545454545 * remInPixels;
      xMessageTo(cursorPosition.x + xOffset);
      yMessageTo(cursorPosition.y + 0); // Offset below cursor

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

    // Hide cursors when mouse leaves window
    const handleMouseLeaveWindow = () => {
      gsap.set([cursor, follower], { opacity: 0 });
      isVisible.current = false;

      // Clear rotation reset timeout and reset rotation
      if (rotationResetTimeout.current) {
        clearTimeout(rotationResetTimeout.current);
      }
      rotateMessageTo(0); // Reset rotation when leaving window
    };

    // Reset size animations on click (for route changes where leave isn't triggered)
    const handleClick = () => {
      sizeAnimMagnetic.reverse();
      sizeAnimInteract.reverse();
      mouseInTarget.current = false;
    };

    // Show navigation hint on project pages (first time only per session)
    const showProjectNavigationHint = () => {
      const isProjectPage = document.querySelector('.page-Project');
      const hasSeenHint = sessionStorage.getItem('cursorNavigationHintShown');

      if (isProjectPage && !hasSeenHint) {
        // Wait a moment for page to settle
        setTimeout(() => {
          setMessage("tip: use ←, → or 'esc'");
          messageFadeAnim.play();

          // Auto-hide after 6 seconds
          setTimeout(() => {
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
      const magneticTargets = document.querySelectorAll('.cursorMagnetic');
      magneticTargets.forEach((target) => {
        target.addEventListener('mouseenter', handleMagneticEnter);
        target.addEventListener('mouseleave', handleMagneticLeave);
      });

      const interactTargets = document.querySelectorAll(
        '.cursorInteract, .markdown a'
      );
      interactTargets.forEach((target) => {
        target.addEventListener('mouseenter', handleInteractEnter);
        target.addEventListener('mouseleave', handleInteractLeave);
      });

      const messageTargets = document.querySelectorAll('.cursorMessage');
      messageTargets.forEach((target) => {
        target.addEventListener('mouseenter', handleMessageEnter);
        target.addEventListener('mouseleave', handleMessageLeave);
      });
    };

    addTargetListeners();

    // MutationObserver for dynamic elements and route changes
    const observer = new MutationObserver(() => {
      addTargetListeners();
      showProjectNavigationHint(); // Check for project page on route change
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      document.removeEventListener('click', handleClick);
      const magneticTargets = document.querySelectorAll('.cursorMagnetic');
      magneticTargets.forEach((target) => {
        target.removeEventListener('mouseenter', handleMagneticEnter);
        target.removeEventListener('mouseleave', handleMagneticLeave);
      });
      const interactTargets = document.querySelectorAll(
        '.cursorInteract, .markdown a'
      );
      interactTargets.forEach((target) => {
        target.removeEventListener('mouseenter', handleInteractEnter);
        target.removeEventListener('mouseleave', handleInteractLeave);
      });
      const messageTargets = document.querySelectorAll('.cursorMessage');
      messageTargets.forEach((target) => {
        target.removeEventListener('mouseenter', handleMessageEnter);
        target.removeEventListener('mouseleave', handleMessageLeave);
      });

      // Clear rotation reset timeout
      if (rotationResetTimeout.current) {
        clearTimeout(rotationResetTimeout.current);
      }

      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={messageRef} className="customCursor customCursor-Message">
        {message}
      </div>
      <div ref={followerRef} className="customCursor customCursor-Follower" />
      <div ref={cursorRef} className="customCursor customCursor-Main" />
    </>
  );
}
