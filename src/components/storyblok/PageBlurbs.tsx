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

// Seeded pseudo-random number generator for consistent positions
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Generate item size based on index (deterministic)
const getItemSize = (index: number): { width: number; height: number } => {
  const variant = Math.floor(seededRandom(index * 777) * 3);
  const sizes = [
    { width: 12, height: 15 }, // small
    { width: 18, height: 22 }, // medium
    { width: 25, height: 30 }, // large
  ];
  return sizes[variant];
};

// Zone-based scatter algorithm with collision detection
// Canvas is 200vw x 200vh, items positioned using vw/vh units
function generateItemPositions(itemCount: number): Position[] {
  if (itemCount === 0) return [];

  const positions: Position[] = [];

  // Canvas dimensions
  const canvasWidth = 200; // vw
  const canvasHeight = 200; // vh

  // Safe padding from canvas edges (viewport is centered at 100vw, 100vh)
  // We want items visible when user is at center, so keep them within reachable area
  const edgePadding = 15; // vw/vh - keeps items away from absolute edges

  // Usable area for placing items
  const usableLeft = edgePadding;
  const usableTop = edgePadding;
  const usableWidth = canvasWidth - edgePadding * 2;
  const usableHeight = canvasHeight - edgePadding * 2;

  // Calculate grid dimensions for zones
  // Aim for roughly square zones, with some flexibility
  const aspectRatio = usableWidth / usableHeight;
  const cols = Math.ceil(Math.sqrt(itemCount * aspectRatio));
  const rows = Math.ceil(itemCount / cols);

  // Zone dimensions
  const zoneWidth = usableWidth / cols;
  const zoneHeight = usableHeight / rows;

  // Internal zone padding (prevents overlap between items in adjacent zones)
  const zonePadding = 2; // vw/vh

  // Create list of available zones
  const zones: { row: number; col: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      zones.push({ row, col });
    }
  }

  // Shuffle zones for more organic distribution (using seeded random)
  for (let i = zones.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(i * 123) * (i + 1));
    [zones[i], zones[j]] = [zones[j], zones[i]];
  }

  // Place each item in a zone
  for (let i = 0; i < itemCount; i++) {
    const zone = zones[i % zones.length];
    const { row, col } = zone;

    // Get estimated item size for this index
    const itemSize = getItemSize(i);

    // Calculate zone boundaries (with padding)
    const zoneLeft = usableLeft + col * zoneWidth + zonePadding;
    const zoneTop = usableTop + row * zoneHeight + zonePadding;
    const zoneInnerWidth = zoneWidth - zonePadding * 2 - itemSize.width;
    const zoneInnerHeight = zoneHeight - zonePadding * 2 - itemSize.height;

    // Random offset within the safe zone area
    const offsetX = seededRandom(i * 127 + 1) * Math.max(0, zoneInnerWidth);
    const offsetY = seededRandom(i * 311 + 2) * Math.max(0, zoneInnerHeight);

    // Final position
    const x = zoneLeft + offsetX;
    const y = zoneTop + offsetY;

    // Clamp to ensure items stay within canvas bounds
    const clampedX = Math.max(
      edgePadding,
      Math.min(canvasWidth - edgePadding - itemSize.width, x)
    );
    const clampedY = Math.max(
      edgePadding,
      Math.min(canvasHeight - edgePadding - itemSize.height, y)
    );

    positions.push({ x: clampedX, y: clampedY });
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
  // Canvas is 200vw x 200vh, positioned at -50vw, -50vh
  // User can drag 50vw in each direction (half a viewport on each side)
  const getBounds = useCallback(() => {
    if (typeof window === 'undefined')
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      minX: -vw * 0.5,
      maxX: vw * 0.5,
      minY: -vh * 0.5,
      maxY: vh * 0.5,
    };
  }, []);

  // Intro zoom animation
  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Calculate transform origin to keep viewport center fixed during zoom
    // Canvas is 200vw x 200vh, positioned at -50vw, -50vh
    // Viewport center relative to canvas: 50vw from canvas left, 50vh from canvas top
    // As percentage of canvas: 50vw / 200vw = 25%, 50vh / 200vh = 25%
    // But canvas is offset by -50vw, -50vh, so viewport sees center of canvas
    // Transform origin should be at the point that maps to viewport center: 50% 50%
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // The viewport center corresponds to this point on the canvas (in pixels)
    // Canvas top-left is at (-50vw, -50vh) relative to viewport
    // So viewport center (50vw, 50vh) on screen = (50vw + 50vw, 50vh + 50vh) = (100vw, 100vh) on canvas
    // As percentage of 200vw x 200vh canvas: 100/200 = 50%
    const originX = ((vw / 2 + vw / 2) / (vw * 2)) * 100; // 50%
    const originY = ((vh / 2 + vh / 2) / (vh * 2)) * 100; // 50%

    // Start with zoomed out view (scale 0.5 = seeing 2x viewport)
    gsap.set(canvas, {
      scale: 0.5,
      x: 0,
      y: 0,
      transformOrigin: `${originX}% ${originY}%`,
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
      {/* Explorable canvas - must come BEFORE header for mix-blend-mode to work */}
      <div ref={canvasRef} className="page-Blurbs-Canvas">
        {blok.body.map((nestedBlok, index: number) => (
          <BlokBlurb
            key={nestedBlok._uid}
            blok={nestedBlok as any}
            position={itemPositions[index]}
            canvasOffset={canvasOffset}
            index={index}
          />
        ))}
      </div>

      {/* Drag hint - only shows after intro */}
      {showHint && introComplete && (
        <div className="page-Blurbs-Hint">Drag to explore</div>
      )}

      {/* Header with mix-blend-mode - must come AFTER canvas in DOM */}
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
