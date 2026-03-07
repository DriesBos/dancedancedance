import { useEffect, useRef } from 'react';

type BirdsSceneProps = {
  backgroundColor: string;
  birdColor: string;
  className?: string;
  densityScale?: number;
  skyVariation?: string;
};

const SKY_VARIATION_NAMES = [
  'dawn',
  'noon',
  'sunset',
  'dusk',
  'evening',
  'predawn',
] as const;

type SkyVariationName = (typeof SKY_VARIATION_NAMES)[number];

type SkyPalette = {
  top: string;
  horizon: string;
  bottom: string;
  fog: string;
};

type RuntimeState = {
  THREE: any;
  scene: any;
  birdMaterial: any;
  skyTopUniform: any;
  skyHorizonUniform: any;
  skyBottomUniform: any;
  skyTopTarget: any;
  skyHorizonTarget: any;
  skyBottomTarget: any;
  fogTarget: any;
};

type AppearanceState = {
  backgroundColor: string;
  birdColor: string;
  skyVariation: string;
};

const SKY_PALETTES: Record<SkyVariationName, SkyPalette> = {
  dawn: {
    top: '#6A88C6',
    horizon: '#F5B38B',
    bottom: '#FFF1E5',
    fog: '#F6D9C1',
  },
  noon: {
    top: '#6EA6FF',
    horizon: '#B7D5FF',
    bottom: '#E6F2FF',
    fog: '#DCEBFF',
  },
  sunset: {
    top: '#3B4E8A',
    horizon: '#FF8A5B',
    bottom: '#FFC28B',
    fog: '#F8B286',
  },
  dusk: {
    top: '#1D2959',
    horizon: '#8E5CA5',
    bottom: '#F39D88',
    fog: '#9A7AA9',
  },
  evening: {
    top: '#101C43',
    horizon: '#2B3D74',
    bottom: '#6F6EA1',
    fog: '#3A477A',
  },
  predawn: {
    top: '#375189',
    horizon: '#6D79AF',
    bottom: '#BFC4DE',
    fog: '#6C79A8',
  },
};

const resolveSkyVariation = (skyVariation?: string): SkyVariationName => {
  const normalized = (skyVariation ?? 'auto')
    .trim()
    .toLowerCase()
    .replace(/^['"]|['"]$/g, '');

  if (normalized === 'random') {
    const randomIndex = Math.floor(Math.random() * SKY_VARIATION_NAMES.length);
    return SKY_VARIATION_NAMES[randomIndex] ?? 'noon';
  }

  if (normalized === 'day') return 'noon';
  if (normalized === 'sunrise') return 'dawn';
  if (normalized === 'night') return 'evening';

  if (normalized !== 'auto') {
    const explicit = SKY_VARIATION_NAMES.find((name) => name === normalized);
    if (explicit) return explicit;
  }

  const hour = new Date().getHours();
  if (hour >= 4 && hour < 5) return 'predawn';
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 10) return 'dawn';
  if (hour >= 10 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 19) return 'sunset';
  if (hour >= 19 && hour < 21) return 'dusk';
  return 'evening';
};

const resolveSkyPalette = (
  skyVariation: string | undefined,
  fallbackColor: string,
): SkyPalette => {
  const selected = resolveSkyVariation(skyVariation);
  const palette = SKY_PALETTES[selected];
  return (
    palette ?? {
      top: fallbackColor,
      horizon: fallbackColor,
      bottom: fallbackColor,
      fog: fallbackColor,
    }
  );
};

const applyRuntimeAppearance = (
  runtime: RuntimeState,
  appearance: AppearanceState,
) => {
  const palette = resolveSkyPalette(
    appearance.skyVariation,
    appearance.backgroundColor,
  );
  const top = new runtime.THREE.Color(palette.top);
  const horizon = new runtime.THREE.Color(palette.horizon);
  const bottom = new runtime.THREE.Color(palette.bottom);

  runtime.skyTopTarget.set(top.r, top.g, top.b);
  runtime.skyHorizonTarget.set(horizon.r, horizon.g, horizon.b);
  runtime.skyBottomTarget.set(bottom.r, bottom.g, bottom.b);
  runtime.fogTarget.set(palette.fog);

  if (runtime.birdMaterial?.color?.set) {
    runtime.birdMaterial.color.set(appearance.birdColor);
  }
};

const BIRDS = 5000; // Max '8192'
const SPEED_LIMIT = 9.0;
const BOUNDS = 800;
const BOUNDS_HALF = BOUNDS / 2;
const SKY_PALETTE_FADE_SPEED = 2.4;

// Inspired by https://threejs.org/examples/webgpu_compute_birds.html
export default function BirdsScene({
  backgroundColor,
  birdColor,
  className,
  skyVariation = 'auto',
}: BirdsSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<RuntimeState | null>(null);
  const latestPropsRef = useRef({
    backgroundColor,
    birdColor,
    skyVariation,
  });
  latestPropsRef.current = {
    backgroundColor,
    birdColor,
    skyVariation,
  };

  useEffect(() => {
    let isDisposed = false;
    let cleanup = () => {};

    const init = async () => {
      const host = rootRef.current;
      if (!host) return;

      const THREE = await import('three/webgpu');
      const TSL = await import('three/tsl');
      if (isDisposed || !rootRef.current) return;

      const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
      if (!hasWebGPU) return;

      const {
        uniform,
        varying,
        vec4,
        vec3,
        add,
        sub,
        max,
        dot,
        sin,
        mat3,
        uint,
        negate,
        instancedArray,
        cameraProjectionMatrix,
        cameraViewMatrix,
        positionLocal,
        modelWorldMatrix,
        sqrt,
        float,
        Fn,
        If,
        cos,
        mix,
        clamp,
        Loop,
        Continue,
        normalize,
        instanceIndex,
        length,
        vertexIndex,
      } = TSL;

      class BirdGeometry extends THREE.BufferGeometry {
        constructor() {
          super();

          const points = 3 * 3;
          const vertices = new THREE.BufferAttribute(
            new Float32Array(points * 3),
            3,
          );

          this.setAttribute('position', vertices);

          let vertexCursor = 0;

          const vertsPush = (...args: number[]) => {
            for (let index = 0; index < args.length; index += 1) {
              vertices.array[vertexCursor] = args[index];
              vertexCursor += 1;
            }
          };

          const wingsSpan = 20;

          vertsPush(0, 0, -20, 0, -8, 10, 0, 0, 30);
          vertsPush(0, 0, -15, -wingsSpan, 0, 5, 0, 0, 15);
          vertsPush(0, 0, 15, wingsSpan, 0, 5, 0, 0, -15);

          this.scale(0.2, 0.2, 0.2);
        }
      }

      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        1,
        5000,
      );
      camera.position.z = 1000;

      const initialPalette = resolveSkyPalette(
        latestPropsRef.current.skyVariation,
        latestPropsRef.current.backgroundColor,
      );

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(initialPalette.fog, 700, 3000);

      const pointer = new THREE.Vector2();
      pointer.set(20, 20);
      const raycaster = new THREE.Raycaster();

      const toVec3 = (hex: string) => {
        const parsed = new THREE.Color(hex);
        return new THREE.Vector3(parsed.r, parsed.g, parsed.b);
      };

      const skyTopUniform = uniform(toVec3(initialPalette.top));
      const skyHorizonUniform = uniform(toVec3(initialPalette.horizon));
      const skyBottomUniform = uniform(toVec3(initialPalette.bottom));
      const skyTopTarget = toVec3(initialPalette.top);
      const skyHorizonTarget = toVec3(initialPalette.horizon);
      const skyBottomTarget = toVec3(initialPalette.bottom);
      const fogTarget = new THREE.Color(initialPalette.fog);

      const skyGeometry = new THREE.IcosahedronGeometry(1, 6);
      const skyMaterial = new THREE.MeshBasicNodeMaterial({
        // Blend bottom -> horizon -> top to create day-moment variations.
        colorNode: varying(
          vec4(
            mix(
              mix(
                skyBottomUniform,
                skyHorizonUniform,
                clamp(positionLocal.y.mul(0.95).add(0.45), 0.0, 1.0),
              ),
              skyTopUniform,
              clamp(positionLocal.y.mul(1.2).sub(0.1), 0.0, 1.0),
            ),
            1.0,
          ),
        ),
        side: THREE.BackSide,
      });

      const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
      skyMesh.rotation.z = 0.75;
      skyMesh.scale.setScalar(1200);
      scene.add(skyMesh);

      const renderer = new THREE.WebGPURenderer({
        antialias: true,
        forceWebGL: false,
        requiredLimits: {
          maxStorageBuffersInVertexStage: 3,
        },
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.NeutralToneMapping;
      host.appendChild(renderer.domElement);

      const positionArray = new Float32Array(BIRDS * 3);
      const velocityArray = new Float32Array(BIRDS * 3);
      const phaseArray = new Float32Array(BIRDS);

      for (let index = 0; index < BIRDS; index += 1) {
        const posX = Math.random() * BOUNDS - BOUNDS_HALF;
        const posY = Math.random() * BOUNDS - BOUNDS_HALF;
        const posZ = Math.random() * BOUNDS - BOUNDS_HALF;

        positionArray[index * 3] = posX;
        positionArray[index * 3 + 1] = posY;
        positionArray[index * 3 + 2] = posZ;

        const velX = Math.random() - 0.5;
        const velY = Math.random() - 0.5;
        const velZ = Math.random() - 0.5;

        velocityArray[index * 3] = velX * 10;
        velocityArray[index * 3 + 1] = velY * 10;
        velocityArray[index * 3 + 2] = velZ * 10;

        phaseArray[index] = 1;
      }

      const positionStorage: any = (
        instancedArray(positionArray, 'vec3') as any
      ).setName('positionStorage');
      const velocityStorage: any = (
        instancedArray(velocityArray, 'vec3') as any
      ).setName('velocityStorage');
      const phaseStorage: any = (
        instancedArray(phaseArray, 'float') as any
      ).setName('phaseStorage');

      positionStorage.setPBO(true);
      velocityStorage.setPBO(true);
      phaseStorage.setPBO(true);

      const effectController = {
        separation: uniform(15.0),
        alignment: uniform(20.0),
        cohesion: uniform(20.0),
        freedom: uniform(0.75),
        now: uniform(0.0),
        deltaTime: uniform(0.0),
        rayOrigin: uniform(new THREE.Vector3()),
        rayDirection: uniform(new THREE.Vector3()),
      };

      const birdGeometry = new BirdGeometry();
      const birdMaterial: any = new THREE.NodeMaterial();
      birdMaterial.color = new THREE.Color(latestPropsRef.current.birdColor);

      const birdVertexTSL = Fn(() => {
        const position = positionLocal.toVar();
        const newPhase = phaseStorage.element(instanceIndex).toVar();
        const newVelocity = normalize(
          velocityStorage.element(instanceIndex),
        ).toVar();

        If(vertexIndex.equal(4).or(vertexIndex.equal(7)), () => {
          position.y = sin(newPhase).mul(5.0);
        });

        const newPosition = modelWorldMatrix.mul(position);

        newVelocity.z.mulAssign(-1.0);
        const xz = length(newVelocity.xz);
        const xyz = float(1.0);
        const x = sqrt(newVelocity.y.mul(newVelocity.y).oneMinus());

        const cosry = newVelocity.x.div(xz).toVar();
        const sinry = newVelocity.z.div(xz).toVar();

        const cosrz = x.div(xyz);
        const sinrz = newVelocity.y.div(xyz).toVar();

        const maty = mat3(cosry, 0, negate(sinry), 0, 1, 0, sinry, 0, cosry);

        const matz = mat3(cosrz, sinrz, 0, negate(sinrz), cosrz, 0, 0, 0, 1);

        const finalVert = maty.mul(matz).mul(newPosition);
        finalVert.addAssign(positionStorage.element(instanceIndex));

        return cameraProjectionMatrix.mul(cameraViewMatrix).mul(finalVert);
      });

      birdMaterial.vertexNode = birdVertexTSL();
      birdMaterial.side = THREE.DoubleSide;

      const birdMesh = new THREE.InstancedMesh(
        birdGeometry,
        birdMaterial,
        BIRDS,
      );
      birdMesh.rotation.y = Math.PI / 2;
      birdMesh.matrixAutoUpdate = false;
      birdMesh.frustumCulled = false;
      birdMesh.updateMatrix();
      scene.add(birdMesh);

      const computeVelocity: any = (
        Fn(() => {
          const PI = float(3.141592653589793);
          const PI_2 = PI.mul(2.0);
          const limit = float(SPEED_LIMIT).toVar('limit');

          const {
            alignment,
            separation,
            cohesion,
            deltaTime,
            rayOrigin,
            rayDirection,
          } = effectController;

          const zoneRadius = separation.add(alignment).add(cohesion).toConst();
          const separationThresh = separation.div(zoneRadius).toConst();
          const alignmentThresh = separation
            .add(alignment)
            .div(zoneRadius)
            .toConst();
          const zoneRadiusSq = zoneRadius.mul(zoneRadius).toConst();

          const birdIndex = instanceIndex.toConst('birdIndex');
          const position = positionStorage.element(birdIndex).toVar();
          const velocity = velocityStorage.element(birdIndex).toVar();

          const directionToRay = rayOrigin.sub(position).toConst();
          const projectionLength = dot(directionToRay, rayDirection).toConst();
          const closestPoint = rayOrigin
            .sub(rayDirection.mul(projectionLength))
            .toConst();
          const directionToClosestPoint = closestPoint.sub(position).toConst();
          const distanceToClosestPoint = length(
            directionToClosestPoint,
          ).toConst();
          const distanceToClosestPointSq = distanceToClosestPoint
            .mul(distanceToClosestPoint)
            .toConst();

          const rayRadius = float(150.0).toConst();
          const rayRadiusSq = rayRadius.mul(rayRadius).toConst();

          If(distanceToClosestPointSq.lessThan(rayRadiusSq), () => {
            const velocityAdjust = distanceToClosestPointSq
              .div(rayRadiusSq)
              .sub(1.0)
              .mul(deltaTime)
              .mul(100.0);
            velocity.addAssign(
              normalize(directionToClosestPoint).mul(velocityAdjust),
            );
            limit.addAssign(5.0);
          });

          const dirToCenter = position.toVar();
          dirToCenter.y.mulAssign(2.5);
          velocity.subAssign(normalize(dirToCenter).mul(deltaTime).mul(5.0));

          Loop(
            { start: uint(0), end: uint(BIRDS), type: 'uint', condition: '<' },
            ({ i }: { i: any }) => {
              If(i.equal(birdIndex), () => {
                Continue();
              });

              const birdPosition = positionStorage.element(i);
              const dirToBird = birdPosition.sub(position);
              const distToBird = length(dirToBird);

              If(distToBird.lessThan(0.0001), () => {
                Continue();
              });

              const distToBirdSq = distToBird.mul(distToBird);

              If(distToBirdSq.greaterThan(zoneRadiusSq), () => {
                Continue();
              });

              const percent = distToBirdSq.div(zoneRadiusSq);

              If(percent.lessThan(separationThresh), () => {
                const velocityAdjust = separationThresh
                  .div(percent)
                  .sub(1.0)
                  .mul(deltaTime);
                velocity.subAssign(normalize(dirToBird).mul(velocityAdjust));
              })
                .ElseIf(percent.lessThan(alignmentThresh), () => {
                  const threshDelta = alignmentThresh.sub(separationThresh);
                  const adjustedPercent = percent
                    .sub(separationThresh)
                    .div(threshDelta);
                  const birdVelocity = velocityStorage.element(i);

                  const cosRange = cos(adjustedPercent.mul(PI_2));
                  const cosRangeAdjust = float(0.5)
                    .sub(cosRange.mul(0.5))
                    .add(0.5);
                  const velocityAdjust = cosRangeAdjust.mul(deltaTime);
                  velocity.addAssign(
                    normalize(birdVelocity).mul(velocityAdjust),
                  );
                })
                .Else(() => {
                  const threshDelta = alignmentThresh.oneMinus();
                  const adjustedPercent = threshDelta
                    .equal(0.0)
                    .select(1.0, percent.sub(alignmentThresh).div(threshDelta));

                  const cosRange = cos(adjustedPercent.mul(PI_2));
                  const adj1 = cosRange.mul(-0.5);
                  const adj2 = adj1.add(0.5);
                  const adj3 = float(0.5).sub(adj2);

                  const velocityAdjust = adj3.mul(deltaTime);
                  velocity.addAssign(normalize(dirToBird).mul(velocityAdjust));
                });
            },
          );

          If(length(velocity).greaterThan(limit), () => {
            velocity.assign(normalize(velocity).mul(limit));
          });

          velocityStorage.element(birdIndex).assign(velocity);
        })() as any
      )
        .compute(BIRDS)
        .setName('Birds Velocity');

      const computePosition: any = (
        Fn(() => {
          const { deltaTime } = effectController;
          positionStorage
            .element(instanceIndex)
            .addAssign(
              velocityStorage.element(instanceIndex).mul(deltaTime).mul(15.0),
            );

          const velocity = velocityStorage.element(instanceIndex);
          const phase = phaseStorage.element(instanceIndex);

          const modValue = phase
            .add(deltaTime)
            .add(length(velocity.xz).mul(deltaTime).mul(3.0))
            .add(max(velocity.y, 0.0).mul(deltaTime).mul(6.0));

          phaseStorage.element(instanceIndex).assign(modValue.mod(62.83));
        })() as any
      )
        .compute(BIRDS)
        .setName('Birds Position');

      const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!event.isPrimary) return;

        pointer.x = (event.clientX / window.innerWidth) * 2.0 - 1.0;
        pointer.y = 1.0 - (event.clientY / window.innerHeight) * 2.0;
      };

      window.addEventListener('resize', onWindowResize);
      window.addEventListener('pointermove', onPointerMove, { passive: true });

      let last = performance.now();

      const render = () => {
        const now = performance.now();
        let deltaTime = (now - last) / 1000;

        if (deltaTime > 1) deltaTime = 1;
        last = now;
        const fadeAlpha = Math.min(1, deltaTime * SKY_PALETTE_FADE_SPEED);

        skyTopUniform.value.lerp(skyTopTarget, fadeAlpha);
        skyHorizonUniform.value.lerp(skyHorizonTarget, fadeAlpha);
        skyBottomUniform.value.lerp(skyBottomTarget, fadeAlpha);
        scene.fog.color.lerp(fogTarget, fadeAlpha);

        raycaster.setFromCamera(pointer, camera);

        effectController.now.value = now;
        effectController.deltaTime.value = deltaTime;
        effectController.rayOrigin.value.copy(raycaster.ray.origin);
        effectController.rayDirection.value.copy(raycaster.ray.direction);

        renderer.compute(computeVelocity);
        renderer.compute(computePosition);
        renderer.render(scene, camera);

        pointer.y = 10;
      };

      renderer.setAnimationLoop(render);

      runtimeRef.current = {
        THREE,
        scene,
        birdMaterial,
        skyTopUniform,
        skyHorizonUniform,
        skyBottomUniform,
        skyTopTarget,
        skyHorizonTarget,
        skyBottomTarget,
        fogTarget,
      };
      applyRuntimeAppearance(runtimeRef.current, latestPropsRef.current);

      cleanup = () => {
        runtimeRef.current = null;
        window.removeEventListener('resize', onWindowResize);
        window.removeEventListener('pointermove', onPointerMove);
        renderer.setAnimationLoop(null);
        renderer.dispose();

        if (host.contains(renderer.domElement)) {
          host.removeChild(renderer.domElement);
        }
      };
    };

    init();

    return () => {
      isDisposed = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    applyRuntimeAppearance(runtime, {
      backgroundColor,
      birdColor,
      skyVariation,
    });
  }, [backgroundColor, birdColor, skyVariation]);

  return <div ref={rootRef} className={className} aria-hidden="true" />;
}
