import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createParallaxTween,
  retargetParallaxTween,
  sampleParallaxTween,
  snapParallaxTween,
} from './parallaxEasing';

type DotsSceneProps = {
  backgroundColor: string;
  dotColors: string[];
  dotSize: number;
  densityScale?: number;
  drawBackground?: boolean;
  className?: string;
  scrollProgressRef: MutableRefObject<number>;
  disableInputs?: boolean;
};

type DotParticle = {
  baseX: number;
  baseY: number;
  baseZ: number;
  driftX: number;
  driftY: number;
  driftZ: number;
  speed: number;
  phase: number;
};

const DOTS_PARALLAX_REFERENCE_WIDTH_PX = 1440;
const DOTS_PARALLAX_MIN_SCALE = 0.7;
const DOTS_PARALLAX_MAX_SCALE = 1.35;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getDotsParallaxScale(viewportWidth: number): number {
  return clamp(
    viewportWidth / DOTS_PARALLAX_REFERENCE_WIDTH_PX,
    DOTS_PARALLAX_MIN_SCALE,
    DOTS_PARALLAX_MAX_SCALE,
  );
}

function DotsField({
  dotColors,
  dotSize,
  densityScale = 1,
  lockToInitialViewport = false,
  countScale = 1,
}: {
  dotColors: string[];
  dotSize: number;
  densityScale?: number;
  lockToInitialViewport?: boolean;
  countScale?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const initialViewportRef = useRef<{ width: number; height: number } | null>(
    null,
  );
  const dotTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, 64, 64);
      context.fillStyle = '#ffffff';
      context.beginPath();
      context.arc(32, 32, 28, 0, Math.PI * 2);
      context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, []);
  const { viewport } = useThree();
  const liveViewportWidth = viewport.width;
  const liveViewportHeight = viewport.height;

  if (
    lockToInitialViewport &&
    !initialViewportRef.current &&
    liveViewportWidth > 0 &&
    liveViewportHeight > 0
  ) {
    initialViewportRef.current = {
      width: liveViewportWidth,
      height: liveViewportHeight,
    };
  }

  const viewportWidth = lockToInitialViewport
    ? (initialViewportRef.current?.width ?? liveViewportWidth)
    : liveViewportWidth;
  const viewportHeight = lockToInitialViewport
    ? (initialViewportRef.current?.height ?? liveViewportHeight)
    : liveViewportHeight;

  const dotCount = useMemo(() => {
    const clampedDensityScale = clamp(densityScale, 0.05, 1.5);
    const clampedCountScale = clamp(countScale, 0.2, 1);
    const minCount = Math.max(6, Math.round(90 * clampedDensityScale));
    const maxCount = Math.max(minCount, Math.round(270 * clampedDensityScale));
    const count = Math.round(
      viewportWidth * viewportHeight * 4.2 * clampedDensityScale,
    );
    const baseCount = clamp(count, minCount, maxCount);
    const scaledMinCount = Math.max(
      3,
      Math.round(minCount * clampedCountScale),
    );
    const scaledMaxCount = Math.max(
      scaledMinCount,
      Math.round(maxCount * clampedCountScale),
    );
    const scaledCount = Math.round(baseCount * clampedCountScale);

    return clamp(scaledCount, scaledMinCount, scaledMaxCount);
  }, [countScale, densityScale, viewportHeight, viewportWidth]);
  const positions = useMemo(() => new Float32Array(dotCount * 3), [dotCount]);
  const colors = useMemo(() => new Float32Array(dotCount * 3), [dotCount]);

  const particles = useMemo<DotParticle[]>(() => {
    const spreadX = viewportWidth * 0.56;
    const spreadY = viewportHeight * 0.56;

    return Array.from({ length: dotCount }, () => ({
      baseX: THREE.MathUtils.randFloatSpread(spreadX * 2),
      baseY: THREE.MathUtils.randFloatSpread(spreadY * 2),
      baseZ: THREE.MathUtils.randFloatSpread(20),
      driftX: THREE.MathUtils.randFloat(0.2, 1.6),
      driftY: THREE.MathUtils.randFloat(0.2, 1.2),
      driftZ: THREE.MathUtils.randFloat(0.08, 0.6),
      speed: THREE.MathUtils.randFloat(0.28, 0.92),
      phase: Math.random() * Math.PI * 2,
    }));
  }, [dotCount, viewportHeight, viewportWidth]);

  useEffect(() => {
    const geometry = geometryRef.current;
    if (!geometry) return;

    const palette = dotColors.length > 0 ? dotColors : ['#ffffff'];
    const fallbackColor = new THREE.Color('#ffffff');
    for (let index = 0; index < dotCount; index += 1) {
      const paletteColor = new THREE.Color(palette[index % palette.length]);
      const resolvedColor = Number.isFinite(paletteColor.r)
        ? paletteColor
        : fallbackColor;
      const cursor = index * 3;
      colors[cursor] = resolvedColor.r;
      colors[cursor + 1] = resolvedColor.g;
      colors[cursor + 2] = resolvedColor.b;
    }

    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();
  }, [colors, dotColors, dotCount, positions]);

  useEffect(() => {
    return () => {
      dotTexture.dispose();
    };
  }, [dotTexture]);

  useFrame((state) => {
    const geometry = geometryRef.current;
    if (!geometry) return;

    const movementScale = 1;
    const elapsed = state.clock.elapsedTime;

    for (let index = 0; index < dotCount; index += 1) {
      const particle = particles[index];
      const time = elapsed * particle.speed + particle.phase;
      const cursor = index * 3;

      const positionX = particle.baseX + Math.sin(time * 0.9) * particle.driftX;
      const positionY =
        particle.baseY + Math.cos(time * 1.05) * particle.driftY;
      const positionZ =
        particle.baseZ +
        Math.sin(time * 0.62) * particle.driftZ * movementScale;

      positions[cursor] = positionX;
      positions[cursor + 1] = positionY;
      positions[cursor + 2] = positionZ;
    }

    const positionAttribute = geometry.getAttribute(
      'position',
    ) as THREE.BufferAttribute;
    positionAttribute.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry ref={geometryRef} />
        <pointsMaterial
          vertexColors
          size={dotSize}
          sizeAttenuation
          map={dotTexture}
          alphaMap={dotTexture}
          alphaTest={0.5}
          transparent
          opacity={0.95}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </>
  );
}

function CameraRig({
  scrollProgressRef,
  enableParallax = true,
}: {
  scrollProgressRef: MutableRefObject<number>;
  enableParallax?: boolean;
}) {
  const { camera } = useThree();
  const pointerTweenRef = useRef({
    x: createParallaxTween(0),
    y: createParallaxTween(0),
  });
  const tuning = {
    maxOffsetX: 2.8,
    maxOffsetY: 1.6,
    maxYaw: THREE.MathUtils.degToRad(2),
    maxPitch: THREE.MathUtils.degToRad(1.2),
    depthPush: 0.35,
    scrollTravelY: 3,
  };

  useEffect(() => {
    if (!enableParallax) {
      snapParallaxTween(pointerTweenRef.current.x, 0);
      snapParallaxTween(pointerTweenRef.current.y, 0);
      return;
    }

    const updatePointer = (clientX: number, clientY: number) => {
      const viewportWidth = Math.max(1, window.innerWidth);
      const viewportHeight = Math.max(1, window.innerHeight);
      // Matches Shopify's `x / width - 0.5` coordinate space.
      const normalizedX = clientX / viewportWidth - 0.5;
      const normalizedY = clientY / viewportHeight - 0.5;
      const nextX = clamp(normalizedX, -1, 1);
      const nextY = clamp(normalizedY, -1, 1);
      const nowMs = performance.now();

      retargetParallaxTween(pointerTweenRef.current.x, nextX, nowMs);
      retargetParallaxTween(pointerTweenRef.current.y, nextY, nowMs);
    };

    const handlePointerMove = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const handleMouseMove = (event: MouseEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const resetPointer = () => {
      const nowMs = performance.now();
      retargetParallaxTween(pointerTweenRef.current.x, 0, nowMs);
      retargetParallaxTween(pointerTweenRef.current.y, 0, nowMs);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('blur', resetPointer);
    document.addEventListener('mouseleave', resetPointer);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('blur', resetPointer);
      document.removeEventListener('mouseleave', resetPointer);
    };
  }, [enableParallax]);

  useFrame(() => {
    const nowMs = performance.now();
    const pointerX = enableParallax
      ? sampleParallaxTween(pointerTweenRef.current.x, nowMs)
      : 0;
    const pointerY = enableParallax
      ? sampleParallaxTween(pointerTweenRef.current.y, nowMs)
      : 0;
    const viewportWidth =
      typeof window !== 'undefined'
        ? window.innerWidth
        : DOTS_PARALLAX_REFERENCE_WIDTH_PX;
    const viewportScale = getDotsParallaxScale(viewportWidth);
    const targetOffsetX = -pointerX * tuning.maxOffsetX * viewportScale;
    const targetOffsetY = -pointerY * tuning.maxOffsetY * viewportScale;
    const interaction = clamp(Math.hypot(pointerX, pointerY) / 0.75, 0, 1);
    const targetZ = 28 - interaction * tuning.depthPush * viewportScale;

    const progress = clamp(scrollProgressRef.current, 0, 1);
    const travelY = tuning.scrollTravelY * viewportScale;
    const targetY = -progress * travelY + targetOffsetY;

    camera.position.x = targetOffsetX;
    camera.position.y = targetY;
    camera.position.z = targetZ;
    camera.rotation.y = pointerX * tuning.maxYaw * viewportScale;
    camera.rotation.x = -pointerY * tuning.maxPitch * viewportScale;
    camera.rotation.z = 0;
  });

  return null;
}

export default function DotsScene({
  backgroundColor,
  dotColors,
  dotSize,
  densityScale = 1,
  drawBackground = true,
  className,
  scrollProgressRef,
  disableInputs = false,
}: DotsSceneProps) {
  const countScale = disableInputs ? 0.5 : 1;

  return (
    <Canvas
      className={className}
      camera={{ fov: 48, near: 0.1, far: 120, position: [0, 0, 28] }}
      dpr={[1, 1.2]}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 200 } }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
      }}
    >
      {drawBackground && <color attach="background" args={[backgroundColor]} />}
      {drawBackground && <fog attach="fog" args={[backgroundColor, 20, 64]} />}
      <CameraRig
        scrollProgressRef={scrollProgressRef}
        enableParallax={!disableInputs}
      />
      <DotsField
        dotColors={dotColors}
        dotSize={dotSize}
        densityScale={densityScale}
        lockToInitialViewport={disableInputs}
        countScale={countScale}
      />
    </Canvas>
  );
}
