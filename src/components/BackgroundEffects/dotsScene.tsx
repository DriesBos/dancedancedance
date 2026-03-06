import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type DotsSceneProps = {
  backgroundColor: string;
  dotColors: string[];
  dotSize: number;
  densityScale?: number;
  drawBackground?: boolean;
  className?: string;
  scrollProgressRef: MutableRefObject<number>;
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function DotsField({
  dotColors,
  dotSize,
  densityScale = 1,
}: {
  dotColors: string[];
  dotSize: number;
  densityScale?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
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
  const dotCount = useMemo(
    () => {
      const clampedDensityScale = clamp(densityScale, 0.05, 1.5);
      const minCount = Math.max(6, Math.round(90 * clampedDensityScale));
      const maxCount = Math.max(minCount, Math.round(270 * clampedDensityScale));
      const count = Math.round(
        viewport.width * viewport.height * 4.2 * clampedDensityScale,
      );
      return clamp(count, minCount, maxCount);
    },
    [densityScale, viewport.height, viewport.width],
  );
  const positions = useMemo(() => new Float32Array(dotCount * 3), [dotCount]);
  const colors = useMemo(() => new Float32Array(dotCount * 3), [dotCount]);

  const particles = useMemo<DotParticle[]>(() => {
    const spreadX = viewport.width * 0.56;
    const spreadY = viewport.height * 0.56;

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
  }, [dotCount, viewport.height, viewport.width]);

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
}: {
  scrollProgressRef: MutableRefObject<number>;
}) {
  const { camera } = useThree();
  const isTouchDeviceRef = useRef(false);

  useEffect(() => {
    isTouchDeviceRef.current =
      window.matchMedia('(hover: none), (pointer: coarse)').matches ||
      (navigator.maxTouchPoints ?? 0) > 0;
  }, []);

  useFrame((_, delta) => {
    if (isTouchDeviceRef.current) {
      camera.position.y = THREE.MathUtils.damp(camera.position.y, 0, 12, delta);
      camera.position.z = 28;
      return;
    }

    const progress = clamp(scrollProgressRef.current, 0, 1);
    const travelY = 3;
    const targetY = -progress * travelY;
    const smoothing = 9;

    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetY,
      smoothing,
      delta,
    );
    camera.position.z = 28;
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
}: DotsSceneProps) {
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
      <CameraRig scrollProgressRef={scrollProgressRef} />
      <DotsField
        dotColors={dotColors}
        dotSize={dotSize}
        densityScale={densityScale}
      />
    </Canvas>
  );
}
