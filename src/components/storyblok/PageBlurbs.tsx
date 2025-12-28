'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import BlokBlurb from './BlokBlurb';
import Link from 'next/link';
import IconClose from '@/components/Icons/IconClose';
import IconExternal from '../Icons/IconExternal';
import IconArrowHead from '../Icons/IconArrowHead';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable, InertiaPlugin);
}

interface SbPageBlurbsData extends SbBlokData {
  body: SbBlokData[];
}

interface PageBlurbsProps {
  blok: SbPageBlurbsData;
}

interface Position {
  x: number;
  y: number;
}

// Generate deterministic positions for items across the canvas
// Canvas is 300vw x 300vh, items positioned using vw/vh units
function generateItemPositions(itemCount: number): Position[] {
  const positions: Position[] = [];
  const canvasWidth = 300; // in vw
  const canvasHeight = 300; // in vh
  const padding = 10; // padding from edges in vw/vh
  const itemSpread = 20; // minimum spread between items

  // Seed-based pseudo-random for consistent positions
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < itemCount; i++) {
    let attempts = 0;
    let pos: Position;

    do {
      // Use index-based seeding for deterministic positions
      const seedX = seededRandom(i * 127 + 1 + attempts * 17);
      const seedY = seededRandom(i * 311 + 2 + attempts * 23);

      pos = {
        x: padding + seedX * (canvasWidth - padding * 2 - 25),
        y: padding + seedY * (canvasHeight - padding * 2 - 25),
      };

      attempts++;
    } while (
      attempts < 100 &&
      positions.some(
        (existing) =>
          Math.abs(existing.x - pos.x) < itemSpread &&
          Math.abs(existing.y - pos.y) < itemSpread
      )
    );

    // Clamp to canvas bounds
    pos.x = Math.max(padding, Math.min(canvasWidth - padding - 25, pos.x));
    pos.y = Math.max(padding, Math.min(canvasHeight - padding - 25, pos.y));

    positions.push(pos);
  }

  return positions;
}

const PageBlurbs = ({ blok }: PageBlurbsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable[]>([]);

  const [showHint, setShowHint] = useState(false); // Start hidden, show after intro
  const [canvasOffset, setCanvasOffset] = useState<Position>({ x: 0, y: 0 });
  const [introComplete, setIntroComplete] = useState(false);

  // Generate positions for all items
  const itemPositions = generateItemPositions(blok.body.length);

  // Get canvas bounds (how far user can drag)
  const getBounds = useCallback(() => {
    if (typeof window === 'undefined')
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      minX: -vw,
      maxX: vw,
      minY: -vh,
      maxY: vh,
    };
  }, []);

  // Intro zoom animation
  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Start with zoomed out view (scale 0.5 = seeing 2x viewport)
    gsap.set(canvas, {
      scale: 0.5,
      x: 0,
      y: 0,
      transformOrigin: 'center center',
    });

    // Disable pointer events during intro
    if (container) {
      container.style.pointerEvents = 'none';
    }

    // Create intro timeline
    const introTl = gsap.timeline({
      delay: 0.3, // Small delay for page load
      onComplete: () => {
        setIntroComplete(true);
        setShowHint(true);
        // Re-enable pointer events
        if (container) {
          container.style.pointerEvents = 'auto';
        }
      },
    });

    // Zoom in animation
    introTl.to(canvas, {
      scale: 1,
      duration: 2,
      ease: 'power2.inOut',
    });

    return () => {
      introTl.kill();
    };
  }, []);

  // Initialize GSAP Draggable after intro completes
  useEffect(() => {
    if (!introComplete || !canvasRef.current || typeof window === 'undefined')
      return;

    const canvas = canvasRef.current;
    const bounds = getBounds();

    // Create Draggable instance with inertia
    draggableRef.current = Draggable.create(canvas, {
      type: 'x,y',
      bounds: {
        minX: bounds.minX,
        maxX: bounds.maxX,
        minY: bounds.minY,
        maxY: bounds.maxY,
      },
      inertia: true, // Enables throw physics with InertiaPlugin
      edgeResistance: 0.85,
      throwResistance: 2000,
      onDragStart: () => {
        setShowHint(false);
      },
      onDrag: function () {
        setCanvasOffset({ x: this.x, y: this.y });
      },
      onThrowUpdate: function () {
        setCanvasOffset({ x: this.x, y: this.y });
      },
      cursor: 'grab',
      activeCursor: 'grabbing',
    });

    // Handle wheel/trackpad scrolling
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setShowHint(false);

      if (!draggableRef.current[0]) return;

      const draggable = draggableRef.current[0];
      const currentX = draggable.x;
      const currentY = draggable.y;

      // Calculate new position
      let newX = currentX - e.deltaX;
      let newY = currentY - e.deltaY;

      // Clamp to bounds
      newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
      newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));

      // Animate to new position
      gsap.to(canvas, {
        x: newX,
        y: newY,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: () => {
          draggable.update();
          setCanvasOffset({ x: draggable.x, y: draggable.y });
        },
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    // Update bounds on resize
    const handleResize = () => {
      const newBounds = getBounds();
      if (draggableRef.current[0]) {
        draggableRef.current[0].applyBounds({
          minX: newBounds.minX,
          maxX: newBounds.maxX,
          minY: newBounds.minY,
          maxY: newBounds.maxY,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('resize', handleResize);
      if (draggableRef.current[0]) {
        draggableRef.current[0].kill();
      }
    };
  }, [introComplete, getBounds]);

  // Hide hint after delay
  useEffect(() => {
    if (!showHint) return;

    const timer = setTimeout(() => {
      setShowHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showHint]);

  // Scroll to center function
  const scrollToCenter = useCallback(() => {
    if (!canvasRef.current || !draggableRef.current[0]) return;

    const canvas = canvasRef.current;
    const draggable = draggableRef.current[0];

    // Animate canvas back to center (x: 0, y: 0)
    gsap.to(canvas, {
      x: 0,
      y: 0,
      duration: 1,
      ease: 'power3.inOut',
      onUpdate: () => {
        draggable.update();
        setCanvasOffset({ x: draggable.x, y: draggable.y });
      },
      onComplete: () => {
        draggable.update();
        setCanvasOffset({ x: 0, y: 0 });
      },
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`page page-Blurbs ${!introComplete ? 'is-intro' : ''}`}
      {...storyblokEditable(blok)}
    >
      {/* Drag hint - only shows after intro */}
      {showHint && introComplete && (
        <div className="page-Blurbs-Hint">Drag to explore</div>
      )}

      {/* Explorable canvas */}
      <div ref={canvasRef} className="page-Blurbs-Canvas">
        {blok.body.map((nestedBlok, index: number) => (
          <BlokBlurb
            key={nestedBlok._uid}
            blok={nestedBlok as any}
            position={itemPositions[index]}
            canvasOffset={canvasOffset}
          />
        ))}
      </div>
      <div className="page-Blurbs-Header">
        <div className="page-Blurbs-Header-Top">
          <Link href="/" className="cursorInteract">
            Blurbs..
          </Link>
          <Link href="/" className="icon cursorMagnetic">
            <IconClose />
          </Link>
        </div>
        <div className="page-Blurbs-Header-Bottom">
          <div className="column column-Year column-Copyright">
            {new Date().getFullYear()}
            <span>&copy;</span>
          </div>
          <a
            href="mailto:info@driesbos.com"
            target="_blank"
            className="linkAnimation cursorMessage"
            data-cursor-message="Let's talk"
          >
            <div className="hasExternalIcon">
              <span className="mailMobile">Email</span>
              <span className="mailDesktop">info@driesbos.com</span>
              <IconExternal />
            </div>
          </a>
          <button
            onClick={scrollToCenter}
            className="icon icon-High icon-Footer cursorMagnetic"
            aria-label="Scroll to center"
          >
            <div className="iconLine" />
            <IconArrowHead />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageBlurbs;
