import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Inspired by https://github.com/meetar/heightmap-demos?tab=readme-ov-file and https://holdsworth.works/dan-holdsworth-blackout

type TerrainPalette = {
  low: string;
  mid: string;
  high: string;
  snow: string;
};

type TerrainSceneProps = {
  backgroundColor: string;
  palette: TerrainPalette;
  className?: string;
  densityScale?: number;
  profile?: TerrainProfile;
  drawBackground?: boolean;
  scrollProgressRef: MutableRefObject<number>;
  disableInputs?: boolean;
  resetSignal?: number;
  onDockedChange?: (docked: boolean) => void;
};

type TerrainProfile = 'standard' | 'hd';

type HeightMap = {
  width: number;
  height: number;
  data: Float32Array;
};

// Terrain tuning options.
// Start here when you want to art-direct mood/performance without touching logic.
export const TERRAIN_OPTIONS = {
  density: {
    // Global density multiplier clamp used for both map resolution and mesh segments.
    min: 0.25,
    max: 1.2,
  },
  heightMap: {
    // Base heightmap resolution before density scaling.
    mapSizeBase: 360,
    // Lower bound for heightmap resolution (keeps mobile GPU load predictable).
    mapSizeMin: 192,
    // Upper bound for heightmap resolution (caps CPU cost during generation).
    mapSizeMax: 512,
    // Domain warp frequency for the first noise layer.
    warpScale: 3,
    // Strength of domain warp; higher = more chaotic ridges.
    warpStrength: 0.2,
    // Number of ridge octaves blended into the terrain.
    ridgeOctaves: 7,
    // Horizontal ridge frequency.
    ridgeScaleX: 5.2,
    // Vertical ridge frequency.
    ridgeScaleY: 2.6,
    // Octave amplitude falloff for ridges.
    ridgeGain: 0.6,
    // Octave frequency growth for ridges.
    ridgeLacunarity: 1.9,
    // Frequency for additional high-frequency detail that makes mountains feel larger.
    detailScale: 16,
    // Number of octaves for high-frequency detail.
    detailOctaves: 4,
    // Strength of high-frequency terrain detail contribution.
    detailStrength: 0.12,
    // Frequency for long glacial carving streaks.
    glacierCarveScale: 12.5,
    // Strength of glacial carving streaks.
    glacierCarveStrength: 0.14,
    // Overall terrain sharpness (higher = steeper, more graphic silhouettes).
    baseHeightPower: 1.55,
    // Width compression for the valley silhouette shape.
    valleyWidth: 1.82,
    // Minimum valley floor contribution (keeps foreground from going flat).
    valleyFloor: 0.32,
    // Near depth falloff for generated height contribution.
    depthFadeMin: 0.03,
    // Far depth falloff for generated height contribution.
    depthFadeMax: 0.92,
  },
  hd: {
    // Local real-world SRTM heightmap source (from meetar/heightmap-demos).
    sourcePath: '/terrain/SRTM_US_scaled_1024.jpg',
    // Terrain plane width for the 2:1 SRTM aspect ratio used in the reference demo.
    meshWidth: 320,
    // Terrain plane depth for the 2:1 SRTM aspect ratio used in the reference demo.
    meshDepth: 160,
    // World offset of the HD terrain plane.
    meshPosition: [0, -22, -54] as [number, number, number],
    // Static camera position used for HD reference framing.
    cameraPosition: [0, 44, 150] as [number, number, number],
    // Static look target used for HD reference framing.
    lookTarget: [0, -10, -54] as [number, number, number],
    // Wider FOV for a more demo-like perspective.
    fov: 42,
    // Horizontal blend weight between real map and procedural map (0..1).
    realMapBlend: 0.98,
    // Extra detail power applied after blending to sharpen ridges.
    detailPower: 1.2,
    // Contrast multiplier applied to the blended height field.
    contrast: 1.42,
    // Morphological erosion strength inspired by adaptive/combo demos.
    erodeStrength: 0.009,
    // Morphological dilation strength inspired by adaptive/combo demos.
    dilateStrength: 0.014,
    // Number of erosion+dilation refinement passes.
    morphologyPasses: 2,
    // Box blur radius for smoothing high-frequency artifacts before refinement.
    blurRadius: 0,
    // Segment multiplier for HD mesh detail near the camera.
    meshSegmentBoost: 1.6,
    // Additional map-size multiplier when rendering HD variant.
    mapSizeBoost: 1.75,
    // Material roughness for glacial gloss.
    roughness: 0.27,
    // Material metalness (kept low to avoid metallic look).
    metalness: 0.02,
    // Thin ice-coat intensity for specular highlights.
    clearcoat: 1,
    // Roughness of the clearcoat layer.
    clearcoatRoughness: 0.11,
    // Relative reflectivity of the clearcoat layer.
    reflectivity: 0.88,
    // Extra point light intensity used to emphasize icy sheen.
    specularLightIntensity: 1.24,
    // Specular accent light position for glossy ice glints.
    specularLightPosition: [0, 72, 56] as [number, number, number],
    // Main directional light intensity in HD mode.
    keyLightIntensity: 0.82,
    // Fill directional light intensity in HD mode.
    fillLightIntensity: 0.1,
    // Additional high-frequency shading detail in HD mode.
    textureDetailBoost: 1.8,
    // Extra terrain elevation in HD mode to increase depth feel.
    elevationBoost: 1.36,
    // Toggle marker/cube visibility in HD reference mode.
    showMarker: false,
  },
  mesh: {
    // Terrain mesh width in world units.
    width: 220,
    // Terrain mesh depth in world units.
    depth: 320,
    // Vertical displacement scale in world units.
    elevation: 44,
    // Segment count baseline before density scaling.
    lodSegmentsBase: 320,
    // Minimum allowed segment count for the top LOD level.
    lodSegmentsMin: 112,
    // Maximum allowed segment count for the top LOD level.
    lodSegmentsMax: 420,
    // Relative segment multiplier per LOD level.
    lodLevelRatios: [1, 0.62, 0.36],
    // Camera distance thresholds where each LOD level takes over.
    lodDistanceThresholds: [0, 42, 110],
    // Constant world offset for terrain placement in view.
    position: [0, -15, -52] as [number, number, number],
    // Slow intrinsic terrain rotation speed for ambient motion.
    yawDriftSpeed: 0.045,
    // Slow intrinsic terrain rotation amplitude in radians.
    yawDriftAmplitude: 0.11,
  },
  marker: {
    // Width of the rectangular cube landmark.
    width: 3.4,
    // Height of the rectangular cube landmark.
    height: 4.5,
    // Depth of the rectangular cube landmark.
    depth: 0.95,
    // Hover distance above terrain surface.
    hoverHeight: 2.1,
    // Extra vertical clearance above the detected terrain peak.
    peakClearance: 0.1,
    // Vertical bob amplitude for subtle life.
    bobAmplitude: 0.26,
    // Vertical bob speed.
    bobSpeed: 0.34,
    // Search bounds (U) used to find a canyon-like placement region.
    searchUMin: 0.2,
    searchUMax: 0.8,
    // Search bounds (V) used to find a canyon-like placement region.
    searchVMin: 0.26,
    searchVMax: 0.78,
    // Number of samples per axis for canyon search.
    searchSamples: 52,
    // Preferred canyon depth (V) in the map.
    preferredDepthV: 0.56,
    // Neighborhood sampling distance for relief score.
    neighborDelta: 0.02,
  },
  shading: {
    // Height threshold where low tones transition to mid tones.
    lowBandEnd: 0.34,
    // Height threshold where mid tones transition to high tones.
    midBandEnd: 0.77,
    // Slope darkening power (higher = steeper faces darken faster).
    slopeShadowPower: 1.25,
    // Slope darkening strength.
    slopeShadowStrength: 0.74,
    // Silhouette steepness power for graphic mountain edges.
    silhouetteSlopePower: 1.55,
    // Silhouette darkening strength.
    silhouetteStrength: 0.52,
    // Height where icy highlights begin appearing.
    highlightHeightStart: 0.62,
    // Max slope eligible for highlights (flatter surfaces catch more ice light).
    highlightSlopeMax: 0.36,
    // Dot-product power for highlight directionality.
    highlightFacingPower: 1.1,
    // Highlight blend strength toward palette.snow.
    highlightStrength: 0.32,
    // Tonal contrast multiplier (1 = neutral, >1 = punchier silhouettes).
    contrast: 1.36,
    // Gamma curve for final tone shaping.
    gamma: 0.95,
    // Baked light direction used only for color shading.
    bakedLightDirection: [0.45, 0.8, 0.35] as [number, number, number],
    // Frequency for albedo-like micro detail modulation in shading.
    textureDetailScale: 40,
    // Strength of micro detail modulation in shading.
    textureDetailStrength: 0.24,
  },
  camera: {
    // Initial camera position.
    initialPosition: [0, 12.5, 98] as [number, number, number],
    // Base camera look target.
    lookTarget: [0, 2, -54] as [number, number, number],
    // Horizontal camera travel induced by page scroll.
    scrollTravelX: 0,
    // Vertical camera travel induced by page scroll.
    scrollTravelY: 0,
    // Mouse drag sensitivity for yaw.
    yawSensitivity: 0.0045,
    // Mouse drag sensitivity for pitch.
    pitchSensitivity: 0.0035,
    // Max yaw angle from center in radians.
    yawLimit: 0.95,
    // Max pitch angle from center in radians.
    pitchLimit: 0.45,
    // Smoothing for manual input response.
    manualResponse: 5.8,
    // Damping for camera X translation.
    positionDampingX: 2.4,
    // Damping for camera Y translation.
    positionDampingY: 2.6,
    // Damping for camera Z translation.
    positionDampingZ: 2.1,
    // Cinematic yaw oscillation speed (very slow look-around).
    cinematicYawSpeed: 0,
    // Cinematic yaw oscillation amplitude.
    cinematicYawAmplitude: 0,
    // Cinematic pitch oscillation speed.
    cinematicPitchSpeed: 0,
    // Cinematic pitch oscillation amplitude.
    cinematicPitchAmplitude: 0,
    // Cinematic drift speed for camera X.
    driftPosXSpeed: 0,
    // Cinematic drift amplitude for camera X.
    driftPosXAmplitude: 0,
    // Cinematic drift speed for camera Y.
    driftPosYSpeed: 0,
    // Cinematic drift amplitude for camera Y.
    driftPosYAmplitude: 0,
    // Cinematic drift speed for camera Z.
    driftPosZSpeed: 0,
    // Cinematic drift amplitude for camera Z.
    driftPosZAmplitude: 0,
    // Cinematic drift speed for focus X.
    driftFocusXSpeed: 0,
    // Cinematic drift amplitude for focus X.
    driftFocusXAmplitude: 0,
    // Cinematic drift speed for focus Y.
    driftFocusYSpeed: 0,
    // Cinematic drift amplitude for focus Y.
    driftFocusYAmplitude: 0,
    // Arrow-key translation speed in world units per second.
    keyboardMoveSpeed: 20,
    // Enable/disable user controls (mouse look + arrow movement).
    manualControlsEnabled: false,
    // Seconds used to ease camera from default framing toward the landmark.
    approachDurationSec: 9,
    // Blend strength toward landmark framing (0..1).
    approachBlend: 1,
    // Camera offset from landmark when approach is complete.
    approachCameraOffset: [0, 2.4, 6.2] as [number, number, number],
    // Additional vertical look offset applied at the landmark.
    approachFocusYOffset: 0.2,
  },
  scene: {
    // Camera field of view.
    fov: 34,
    // Camera near plane.
    near: 0.1,
    // Camera far plane.
    far: 260,
    // DPR clamp to keep rendering crisp but stable.
    dpr: [1, 1.35] as [number, number],
    // Fog near distance (depth cue).
    fogNear: 52,
    // Fog far distance (depth cue).
    fogFar: 220,
    // Ambient light intensity.
    ambientIntensity: 0.48,
    // Key light position.
    keyLightPosition: [22, 30, 20] as [number, number, number],
    // Key light intensity.
    keyLightIntensity: 1.08,
    // Fill light position.
    fillLightPosition: [-18, 14, -20] as [number, number, number],
    // Fill light intensity.
    fillLightIntensity: 0.38,
    // Specular accent light position for icy glints.
    specularLightPosition: [8, 16, -12] as [number, number, number],
  },
} as const;

let hdHeightMapCache: HeightMap | null = null;
let hdHeightMapPromise: Promise<HeightMap> | null = null;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(min: number, max: number, value: number): number {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

function easeInOutCubic(value: number): number {
  const t = clamp(value, 0, 1);
  if (t < 0.5) {
    return 4 * t * t * t;
  }

  return 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function hash2(x: number, y: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

function valueNoise2d(x: number, y: number): number {
  const xFloor = Math.floor(x);
  const yFloor = Math.floor(y);
  const xFract = fract(x);
  const yFract = fract(y);

  const h00 = hash2(xFloor, yFloor);
  const h10 = hash2(xFloor + 1, yFloor);
  const h01 = hash2(xFloor, yFloor + 1);
  const h11 = hash2(xFloor + 1, yFloor + 1);

  const sx = xFract * xFract * (3 - 2 * xFract);
  const sy = yFract * yFract * (3 - 2 * yFract);
  const nx0 = lerp(h00, h10, sx);
  const nx1 = lerp(h01, h11, sx);

  return lerp(nx0, nx1, sy);
}

function fbm(x: number, y: number, octaves: number): number {
  let amplitude = 0.5;
  let frequency = 1;
  let value = 0;
  let normalizer = 0;

  for (let index = 0; index < octaves; index += 1) {
    value += valueNoise2d(x * frequency, y * frequency) * amplitude;
    normalizer += amplitude;
    amplitude *= 0.55;
    frequency *= 2.05;
  }

  if (normalizer <= 0) {
    return 0;
  }

  return value / normalizer;
}

function generateHeightMap(width: number, height: number): HeightMap {
  const data = new Float32Array(width * height);
  const options = TERRAIN_OPTIONS.heightMap;
  let minHeight = Number.POSITIVE_INFINITY;
  let maxHeight = Number.NEGATIVE_INFINITY;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / Math.max(1, width - 1);
      const v = y / Math.max(1, height - 1);

      const warpX =
        fbm(u * options.warpScale + 7.3, v * options.warpScale + 1.1, 3) - 0.5;
      const warpY =
        fbm(u * options.warpScale + 14.7, v * options.warpScale + 5.4, 3) - 0.5;
      const warpedU = u + warpX * options.warpStrength;
      const warpedV = v + warpY * options.warpStrength;

      let ridgeField = 0;
      let amplitude = 1;
      let frequency = 1;
      let normalization = 0;

      for (let octave = 0; octave < options.ridgeOctaves; octave += 1) {
        const n = valueNoise2d(
          warpedU * options.ridgeScaleX * frequency,
          warpedV * options.ridgeScaleY * frequency,
        );
        const ridge = 1 - Math.abs(n * 2 - 1);
        ridgeField += ridge * amplitude;
        normalization += amplitude;
        amplitude *= options.ridgeGain;
        frequency *= options.ridgeLacunarity;
      }

      let detailField = 0;
      let detailAmplitude = 1;
      let detailFrequency = 1;
      let detailNormalization = 0;

      for (let octave = 0; octave < options.detailOctaves; octave += 1) {
        const detailNoise = valueNoise2d(
          warpedU * options.detailScale * detailFrequency + 18.7,
          warpedV * options.detailScale * 0.74 * detailFrequency + 41.2,
        );
        detailField += detailNoise * detailAmplitude;
        detailNormalization += detailAmplitude;
        detailAmplitude *= 0.56;
        detailFrequency *= 2.1;
      }

      const detail =
        detailNormalization > 0 ? detailField / detailNormalization : 0;
      const glacialCarve =
        1 -
        Math.abs(
          valueNoise2d(
            warpedU * options.glacierCarveScale + 9.3,
            warpedV * options.glacierCarveScale * 0.38 + 27.1,
          ) *
            2 -
            1,
        );

      const base = normalization > 0 ? ridgeField / normalization : 0;
      const valley = smoothstep(
        0,
        0.9,
        1 - Math.abs(u - 0.5) * options.valleyWidth,
      );
      const depthFade = smoothstep(
        options.depthFadeMin,
        options.depthFadeMax,
        1 - v,
      );
      const detailMask = smoothstep(0.16, 0.96, base);
      const glacialMask = smoothstep(0.2, 0.92, base);
      const terrainHeight =
        Math.pow(base, options.baseHeightPower) *
          valley *
          (options.valleyFloor + depthFade * (1 - options.valleyFloor)) +
        detail * options.detailStrength * detailMask +
        glacialCarve * options.glacierCarveStrength * glacialMask;

      const cursor = y * width + x;
      data[cursor] = terrainHeight;
      minHeight = Math.min(minHeight, terrainHeight);
      maxHeight = Math.max(maxHeight, terrainHeight);
    }
  }

  const range = Math.max(0.0001, maxHeight - minHeight);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (data[index] - minHeight) / range;
  }

  return { width, height, data };
}

function normalizeHeightData(data: Float32Array): Float32Array {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < data.length; index += 1) {
    const value = data[index];
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  const range = Math.max(0.0001, max - min);
  const normalized = new Float32Array(data.length);

  for (let index = 0; index < data.length; index += 1) {
    normalized[index] = (data[index] - min) / range;
  }

  return normalized;
}

function sampleArrayHeight(
  data: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  const clampedX = clamp(x, 0, width - 1);
  const clampedY = clamp(y, 0, height - 1);
  return data[clampedY * width + clampedX];
}

function boxBlurHeightData(
  data: Float32Array,
  width: number,
  height: number,
  radius: number,
): Float32Array {
  if (radius <= 0) {
    return data.slice();
  }

  const blurred = new Float32Array(data.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      let count = 0;

      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          sum += sampleArrayHeight(data, width, height, x + offsetX, y + offsetY);
          count += 1;
        }
      }

      blurred[y * width + x] = sum / Math.max(1, count);
    }
  }

  return blurred;
}

function applyMorphologyPass(
  data: Float32Array,
  width: number,
  height: number,
  erodeStrength: number,
  dilateStrength: number,
): Float32Array {
  const eroded = new Float32Array(data.length);
  const offsets = [
    [-1, 0, 1],
    [1, 0, 1],
    [0, -1, 1],
    [0, 1, 1],
    [-1, -1, 1.41421356],
    [1, -1, 1.41421356],
    [-1, 1, 1.41421356],
    [1, 1, 1.41421356],
  ] as const;

  // Erode pass: pulls high spikes down based on neighbor minima.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const center = sampleArrayHeight(data, width, height, x, y);
      let minNeighbor = Number.POSITIVE_INFINITY;

      for (let index = 0; index < offsets.length; index += 1) {
        const [offsetX, offsetY, distance] = offsets[index];
        const neighbor = sampleArrayHeight(
          data,
          width,
          height,
          x + offsetX,
          y + offsetY,
        );
        minNeighbor = Math.min(minNeighbor, neighbor + erodeStrength * distance);
      }

      eroded[y * width + x] = Math.min(center, minNeighbor);
    }
  }

  const dilated = new Float32Array(data.length);

  // Dilate pass: pushes ridge influence back outward for crisper relief.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const center = sampleArrayHeight(eroded, width, height, x, y);
      let maxNeighbor = Number.NEGATIVE_INFINITY;

      for (let index = 0; index < offsets.length; index += 1) {
        const [offsetX, offsetY, distance] = offsets[index];
        const neighbor = sampleArrayHeight(
          eroded,
          width,
          height,
          x + offsetX,
          y + offsetY,
        );
        maxNeighbor = Math.max(maxNeighbor, neighbor - dilateStrength * distance);
      }

      dilated[y * width + x] = Math.max(center, maxNeighbor);
    }
  }

  return dilated;
}

function applyHeightContrast(data: Float32Array, contrast: number): Float32Array {
  const contrasted = new Float32Array(data.length);

  for (let index = 0; index < data.length; index += 1) {
    const value = (data[index] - 0.5) * contrast + 0.5;
    contrasted[index] = clamp(value, 0, 1);
  }

  return contrasted;
}

function loadHdHeightMapFromSource(path: string): Promise<HeightMap> {
  if (hdHeightMapCache) {
    return Promise.resolve(hdHeightMapCache);
  }

  if (hdHeightMapPromise) {
    return hdHeightMapPromise;
  }

  hdHeightMapPromise = new Promise<HeightMap>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = path;

    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        reject(new Error('Unable to read real heightmap: 2D context unavailable.'));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      const raw = new Float32Array(width * height);

      for (let index = 0; index < raw.length; index += 1) {
        const cursor = index * 4;
        // Source image is grayscale, but averaging keeps this robust for other maps.
        const grayscale =
          (pixels[cursor] + pixels[cursor + 1] + pixels[cursor + 2]) /
          (3 * 255);
        raw[index] = grayscale;
      }

      const hdOptions = TERRAIN_OPTIONS.hd;
      let processed = boxBlurHeightData(raw, width, height, hdOptions.blurRadius);

      for (let pass = 0; pass < hdOptions.morphologyPasses; pass += 1) {
        processed = applyMorphologyPass(
          processed,
          width,
          height,
          hdOptions.erodeStrength,
          hdOptions.dilateStrength,
        );
      }

      processed = normalizeHeightData(processed);
      processed = applyHeightContrast(processed, hdOptions.contrast);
      processed = normalizeHeightData(processed);

      const map: HeightMap = {
        width,
        height,
        data: processed,
      };

      hdHeightMapCache = map;
      resolve(map);
    };

    image.onerror = () => {
      reject(new Error(`Failed to load real heightmap: ${path}`));
    };
  })
    .catch((error) => {
      hdHeightMapPromise = null;
      throw error;
    })
    .then((map) => {
      hdHeightMapPromise = Promise.resolve(map);
      return map;
    });

  return hdHeightMapPromise;
}

function blendHeightMaps(realMap: HeightMap, proceduralMap: HeightMap): HeightMap {
  const hdOptions = TERRAIN_OPTIONS.hd;
  const blended = new Float32Array(realMap.width * realMap.height);

  for (let y = 0; y < realMap.height; y += 1) {
    for (let x = 0; x < realMap.width; x += 1) {
      const u = x / Math.max(1, realMap.width - 1);
      const v = y / Math.max(1, realMap.height - 1);
      const real = sampleHeight(realMap, u, v);
      const procedural = sampleHeight(proceduralMap, u, v);
      const mixed = lerp(procedural, real, hdOptions.realMapBlend);
      const sharpened = Math.pow(clamp(mixed, 0, 1), hdOptions.detailPower);
      blended[y * realMap.width + x] = sharpened;
    }
  }

  return {
    width: realMap.width,
    height: realMap.height,
    data: normalizeHeightData(blended),
  };
}

function sampleHeight(map: HeightMap, u: number, v: number): number {
  const x = clamp(u, 0, 1) * (map.width - 1);
  const y = clamp(v, 0, 1) * (map.height - 1);

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(map.width - 1, x0 + 1);
  const y1 = Math.min(map.height - 1, y0 + 1);

  const tx = x - x0;
  const ty = y - y0;

  const s00 = map.data[y0 * map.width + x0];
  const s10 = map.data[y0 * map.width + x1];
  const s01 = map.data[y1 * map.width + x0];
  const s11 = map.data[y1 * map.width + x1];

  return lerp(lerp(s00, s10, tx), lerp(s01, s11, tx), ty);
}

function terrainLocalYFromNormalizedHeight(
  normalizedHeight: number,
  elevation: number,
): number {
  return (Math.pow(normalizedHeight, 1.25) - 0.24) * elevation;
}

function resolveCanyonAnchor(map: HeightMap): {
  u: number;
  v: number;
  height: number;
} {
  const options = TERRAIN_OPTIONS.marker;
  const sampleCount = options.searchSamples;
  let bestU: number = 0.5;
  let bestV: number = options.preferredDepthV;
  let bestHeight: number = sampleHeight(map, bestU, bestV);
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let row = 0; row <= sampleCount; row += 1) {
    const v =
      options.searchVMin +
      ((options.searchVMax - options.searchVMin) * row) / sampleCount;

    for (let column = 0; column <= sampleCount; column += 1) {
      const u =
        options.searchUMin +
        ((options.searchUMax - options.searchUMin) * column) / sampleCount;

      const h = sampleHeight(map, u, v);
      const delta = options.neighborDelta;
      const hLeft = sampleHeight(map, u - delta, v);
      const hRight = sampleHeight(map, u + delta, v);
      const hUp = sampleHeight(map, u, v - delta);
      const hDown = sampleHeight(map, u, v + delta);
      const neighborAverage = (hLeft + hRight + hUp + hDown) / 4;
      const relief = Math.max(0, neighborAverage - h);
      const centerBias = 1 - Math.min(1, Math.abs(u - 0.5) * 2);
      const depthBias =
        1 - Math.min(1, Math.abs(v - options.preferredDepthV) * 3.2);
      const valleyBias = 1 - h;
      const score =
        relief * 1.7 + valleyBias * 0.45 + centerBias * 0.28 + depthBias * 0.32;

      if (score > bestScore) {
        bestScore = score;
        bestU = u;
        bestV = v;
        bestHeight = h;
      }
    }
  }

  return {
    u: bestU,
    v: bestV,
    height: bestHeight,
  };
}

function colorByHeight(
  height: number,
  slope: number,
  lightFacing: number,
  textureDetail: number,
  profile: TerrainProfile,
  palette: {
    low: THREE.Color;
    mid: THREE.Color;
    high: THREE.Color;
    snow: THREE.Color;
  },
): THREE.Color {
  if (profile === 'hd') {
    // Heightmap-demos style: mostly monochrome elevation tone + hard slope contrast.
    const toneFromHeight = Math.pow(clamp(height, 0, 1), 0.84);
    const slopeShadow = 1 - Math.pow(clamp(slope, 0, 1), 1.35) * 0.86;
    const facing = clamp(lightFacing * 0.5 + 0.5, 0, 1);
    const micro = (textureDetail - 0.5) * 0.28;

    let tone =
      toneFromHeight * 0.74 +
      slopeShadow * 0.2 +
      Math.pow(facing, 1.8) * 0.12 +
      micro;
    tone = clamp((tone - 0.5) * 1.58 + 0.5, 0, 1);
    return new THREE.Color(tone, tone, tone);
  }

  const shade = new THREE.Color();
  const options = TERRAIN_OPTIONS.shading;

  if (height < options.lowBandEnd) {
    const t = smoothstep(0, options.lowBandEnd, height);
    shade.copy(palette.low).lerp(palette.mid, t);
  } else if (height < options.midBandEnd) {
    const t = smoothstep(options.lowBandEnd, options.midBandEnd, height);
    shade.copy(palette.mid).lerp(palette.high, t);
  } else {
    const t = smoothstep(options.midBandEnd, 1, height);
    shade.copy(palette.high).lerp(palette.snow, t);
  }

  // Darken steep faces to push stronger mountain silhouettes.
  const shadow =
    1 - Math.pow(slope, options.slopeShadowPower) * options.slopeShadowStrength;
  shade.multiplyScalar(clamp(shadow, 0.15, 1));

  // Extra silhouette push on very steep edges.
  const silhouette =
    Math.pow(slope, options.silhouetteSlopePower) * options.silhouetteStrength;
  shade.lerp(palette.low, clamp(silhouette, 0, 1));

  // Cold icy highlights from the existing snow tone only (no new colors).
  const heightMask = smoothstep(options.highlightHeightStart, 1, height);
  const slopeMask = 1 - smoothstep(0, options.highlightSlopeMax, slope);
  const facingMask = Math.pow(
    clamp(lightFacing, 0, 1),
    options.highlightFacingPower,
  );
  const icyBlend =
    heightMask * slopeMask * facingMask * options.highlightStrength;
  shade.lerp(palette.snow, clamp(icyBlend, 0, 1));

  // Global contrast curve for a more dramatic black/white read.
  shade.r = clamp((shade.r - 0.5) * options.contrast + 0.5, 0, 1);
  shade.g = clamp((shade.g - 0.5) * options.contrast + 0.5, 0, 1);
  shade.b = clamp((shade.b - 0.5) * options.contrast + 0.5, 0, 1);

  // Slight gamma pull to keep highlights crisp while preserving deep blacks.
  shade.r = Math.pow(shade.r, options.gamma);
  shade.g = Math.pow(shade.g, options.gamma);
  shade.b = Math.pow(shade.b, options.gamma);

  const detailAmount = (textureDetail - 0.5) * options.textureDetailStrength;
  shade.r = clamp(shade.r + detailAmount, 0, 1);
  shade.g = clamp(shade.g + detailAmount, 0, 1);
  shade.b = clamp(shade.b + detailAmount, 0, 1);

  return shade;
}

function buildTerrainGeometry(
  segments: number,
  map: HeightMap,
  profile: TerrainProfile,
  meshWidth: number,
  meshDepth: number,
  palette: {
    low: THREE.Color;
    mid: THREE.Color;
    high: THREE.Color;
    snow: THREE.Color;
  },
): THREE.PlaneGeometry {
  const options = TERRAIN_OPTIONS.mesh;
  const shading = TERRAIN_OPTIONS.shading;
  const hdOptions = TERRAIN_OPTIONS.hd;
  const elevationScale =
    profile === 'hd' ? options.elevation * hdOptions.elevationBoost : options.elevation;
  const textureDetailScale =
    profile === 'hd'
      ? shading.textureDetailScale * hdOptions.textureDetailBoost
      : shading.textureDetailScale;

  const geometry = new THREE.PlaneGeometry(
    meshWidth,
    meshDepth,
    segments,
    segments,
  );
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    const u = x / meshWidth + 0.5;
    const v = z / meshDepth + 0.5;
    const h = sampleHeight(map, u, v);

    positions.setY(index, (Math.pow(h, 1.25) - 0.24) * elevationScale);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  const normals = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const colors = new Float32Array(positions.count * 3);
  const bakedLight = new THREE.Vector3(
    ...shading.bakedLightDirection,
  ).normalize();
  const normal = new THREE.Vector3();

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    const u = x / meshWidth + 0.5;
    const v = z / meshDepth + 0.5;
    const h = sampleHeight(map, u, v);

    normal
      .set(normals.getX(index), normals.getY(index), normals.getZ(index))
      .normalize();
    const slope = 1 - clamp(normal.y, 0, 1);
    const lightFacing = normal.dot(bakedLight);
    const textureDetail = fbm(
      u * textureDetailScale + h * 2.6,
      v * textureDetailScale * 0.72 + h * 1.8,
      3,
    );
    const shade = colorByHeight(
      h,
      slope,
      lightFacing,
      textureDetail,
      profile,
      palette,
    );

    const cursor = index * 3;
    colors[cursor] = shade.r;
    colors[cursor + 1] = shade.g;
    colors[cursor + 2] = shade.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();

  return geometry;
}

function TerrainField({
  palette,
  densityScale = 1,
  profile = 'standard',
  anchorRef,
}: {
  palette: TerrainPalette;
  densityScale?: number;
  profile?: TerrainProfile;
  anchorRef: MutableRefObject<THREE.Vector3 | null>;
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  const markerWorldRef = useRef(new THREE.Vector3());
  const markerLookTargetRef = useRef(new THREE.Vector3());
  const [realHeightMap, setRealHeightMap] = useState<HeightMap | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (profile !== 'hd') {
      setRealHeightMap(null);
      return () => {
        isCancelled = true;
      };
    }

    loadHdHeightMapFromSource(TERRAIN_OPTIONS.hd.sourcePath)
      .then((map) => {
        if (isCancelled) return;
        setRealHeightMap(map);
      })
      .catch((error) => {
        if (isCancelled) return;
        // Non-fatal: the scene can always fall back to procedural terrain.
        console.warn(error);
        setRealHeightMap(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [profile]);

  const resources = useMemo(() => {
    const density = TERRAIN_OPTIONS.density;
    const meshOptions = TERRAIN_OPTIONS.mesh;
    const heightMapOptions = TERRAIN_OPTIONS.heightMap;
    const markerOptions = TERRAIN_OPTIONS.marker;
    const hdOptions = TERRAIN_OPTIONS.hd;
    const isHd = profile === 'hd';
    const meshWidth = isHd ? hdOptions.meshWidth : meshOptions.width;
    const meshDepth = isHd ? hdOptions.meshDepth : meshOptions.depth;
    const meshPosition = isHd ? hdOptions.meshPosition : meshOptions.position;
    const hasMarker = !isHd || hdOptions.showMarker;

    const clampedDensity = clamp(densityScale, density.min, density.max);
    const mapMax = isHd
      ? Math.round(heightMapOptions.mapSizeMax * hdOptions.mapSizeBoost)
      : heightMapOptions.mapSizeMax;
    const mapSize = clamp(
      Math.round(
        heightMapOptions.mapSizeBase *
          clampedDensity *
          (isHd ? hdOptions.mapSizeBoost : 1),
      ),
      heightMapOptions.mapSizeMin,
      mapMax,
    );
    const proceduralMap =
      isHd && realHeightMap
        ? generateHeightMap(realHeightMap.width, realHeightMap.height)
        : generateHeightMap(mapSize, mapSize);
    const map =
      isHd && realHeightMap
        ? blendHeightMaps(realHeightMap, proceduralMap)
        : proceduralMap;
    const terrainElevation =
      meshOptions.elevation * (isHd ? hdOptions.elevationBoost : 1);

    const paletteColors = {
      low: new THREE.Color(palette.low),
      mid: new THREE.Color(palette.mid),
      high: new THREE.Color(palette.high),
      snow: new THREE.Color(palette.snow),
    };

    const topSegments = clamp(
      Math.round(
        meshOptions.lodSegmentsBase *
          clampedDensity *
          (isHd ? hdOptions.meshSegmentBoost : 1),
      ),
      meshOptions.lodSegmentsMin,
      isHd
        ? Math.round(meshOptions.lodSegmentsMax * hdOptions.meshSegmentBoost)
        : meshOptions.lodSegmentsMax,
    );
    const levels = meshOptions.lodLevelRatios.map((ratio) =>
      Math.max(24, Math.round(topSegments * ratio)),
    );
    const canyonAnchor = resolveCanyonAnchor(map);
    const terrainYFromHeight = terrainLocalYFromNormalizedHeight(
      canyonAnchor.height,
      terrainElevation,
    );
    let peakNormalizedHeight = 0;
    for (let index = 0; index < map.data.length; index += 1) {
      peakNormalizedHeight = Math.max(peakNormalizedHeight, map.data[index]);
    }
    const peakLocalY = terrainLocalYFromNormalizedHeight(
      peakNormalizedHeight,
      terrainElevation,
    );
    const anchorLocalPosition = new THREE.Vector3(
      (canyonAnchor.u - 0.5) * meshWidth,
      Math.max(
        terrainYFromHeight + markerOptions.hoverHeight,
        peakLocalY + markerOptions.peakClearance,
      ),
      (canyonAnchor.v - 0.5) * meshDepth,
    );

    const lod = new THREE.LOD();
    const material = isHd
      ? new THREE.MeshPhysicalMaterial({
          vertexColors: true,
          roughness: hdOptions.roughness,
          metalness: hdOptions.metalness,
          clearcoat: hdOptions.clearcoat,
          clearcoatRoughness: hdOptions.clearcoatRoughness,
          reflectivity: hdOptions.reflectivity,
          dithering: true,
          toneMapped: true,
        })
      : new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.94,
          metalness: 0.01,
          dithering: true,
          toneMapped: true,
        });

    const geometries: THREE.PlaneGeometry[] = [];

    levels.forEach((segments, index) => {
      const geometry = buildTerrainGeometry(
        segments,
        map,
        profile,
        meshWidth,
        meshDepth,
        paletteColors,
      );
      geometries.push(geometry);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = true;
      lod.addLevel(mesh, meshOptions.lodDistanceThresholds[index] ?? 0);
    });

    return {
      lod,
      material,
      geometries,
      anchorLocalPosition,
      meshPosition,
      hasMarker,
    };
  }, [
    densityScale,
    palette.high,
    palette.low,
    palette.mid,
    palette.snow,
    profile,
    realHeightMap,
  ]);

  useEffect(() => {
    anchorRef.current = null;
    return () => {
      resources.material.dispose();
      resources.geometries.forEach((geometry) => geometry.dispose());
      anchorRef.current = null;
    };
  }, [anchorRef, resources]);

  useFrame((state) => {
    const meshOptions = TERRAIN_OPTIONS.mesh;
    const markerOptions = TERRAIN_OPTIONS.marker;
    const isHd = profile === 'hd';

    resources.lod.update(camera);

    if (groupRef.current && !isHd) {
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * meshOptions.yawDriftSpeed) *
        meshOptions.yawDriftAmplitude;
    }

    if (resources.hasMarker && markerRef.current) {
      markerRef.current.position.y =
        resources.anchorLocalPosition.y +
        Math.sin(state.clock.elapsedTime * markerOptions.bobSpeed) *
          markerOptions.bobAmplitude;
      markerRef.current.getWorldPosition(markerWorldRef.current);
      markerLookTargetRef.current.set(
        camera.position.x,
        markerWorldRef.current.y,
        camera.position.z,
      );
      markerRef.current.lookAt(markerLookTargetRef.current);
      if (anchorRef.current) {
        anchorRef.current.copy(markerWorldRef.current);
      } else {
        anchorRef.current = markerWorldRef.current.clone();
      }
    } else {
      anchorRef.current = null;
    }
  });

  return (
    <group ref={groupRef} position={resources.meshPosition}>
      <primitive object={resources.lod} />
      {resources.hasMarker && (
        <mesh ref={markerRef} position={resources.anchorLocalPosition}>
          <boxGeometry
            args={[
              TERRAIN_OPTIONS.marker.width,
              TERRAIN_OPTIONS.marker.height,
              TERRAIN_OPTIONS.marker.depth,
            ]}
          />
          <meshStandardMaterial
            color={palette.low}
            roughness={0.22}
            metalness={0.02}
            emissive={palette.high}
            emissiveIntensity={0.12}
          />
        </mesh>
      )}
    </group>
  );
}

function TerrainCameraRig({
  scrollProgressRef,
  disableInputs = false,
  resetSignal = 0,
  profile = 'standard',
  anchorRef,
  onDockedChange,
}: {
  scrollProgressRef: MutableRefObject<number>;
  disableInputs?: boolean;
  resetSignal?: number;
  profile?: TerrainProfile;
  anchorRef: MutableRefObject<THREE.Vector3 | null>;
  onDockedChange?: (docked: boolean) => void;
}) {
  const { camera, gl } = useThree();
  const cameraOptions = TERRAIN_OPTIONS.camera;
  const lookStateRef = useRef({
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
  });

  const baseLookTargetRef = useRef(
    new THREE.Vector3(...cameraOptions.lookTarget),
  );
  const focusRef = useRef(new THREE.Vector3(...cameraOptions.lookTarget));
  const baseOffsetRef = useRef(new THREE.Vector3());
  const rotatedOffsetRef = useRef(new THREE.Vector3());
  const rotatedPositionRef = useRef(new THREE.Vector3());
  const translatedFocusRef = useRef(new THREE.Vector3());
  const translatedPositionRef = useRef(new THREE.Vector3());
  const canyonFocusRef = useRef(new THREE.Vector3());
  const canyonPositionRef = useRef(new THREE.Vector3());
  const blendedFocusRef = useRef(new THREE.Vector3());
  const blendedPositionRef = useRef(new THREE.Vector3());
  const approachOffsetRef = useRef(new THREE.Vector3());
  const yawRotationRef = useRef(new THREE.Quaternion());
  const pitchRotationRef = useRef(new THREE.Quaternion());
  const rightAxisRef = useRef(new THREE.Vector3(1, 0, 0));
  const flatForwardRef = useRef(new THREE.Vector3(0, 0, -1));
  const flatRightRef = useRef(new THREE.Vector3(1, 0, 0));
  const movementOffsetRef = useRef(new THREE.Vector3());
  const upAxisRef = useRef(new THREE.Vector3(0, 1, 0));
  const movementKeysRef = useRef({
    left: false,
    right: false,
    forward: false,
    back: false,
  });
  const approachStartTimeRef = useRef<number | null>(null);
  const hasDockedRef = useRef(false);
  const lockedCameraPositionRef = useRef(new THREE.Vector3());
  const lockedFocusRef = useRef(new THREE.Vector3());
  const hdCameraPositionRef = useRef(
    new THREE.Vector3(...TERRAIN_OPTIONS.hd.cameraPosition),
  );
  const hdLookTargetRef = useRef(
    new THREE.Vector3(...TERRAIN_OPTIONS.hd.lookTarget),
  );
  const manualControlsEnabled =
    profile !== 'hd' && cameraOptions.manualControlsEnabled && !disableInputs;

  useEffect(() => {
    lookStateRef.current = {
      yaw: 0,
      pitch: 0,
      targetYaw: 0,
      targetPitch: 0,
    };
    hasDockedRef.current = false;
    approachStartTimeRef.current = null;
    onDockedChange?.(false);

    const baseLookTarget = baseLookTargetRef.current;
    movementOffsetRef.current.set(0, 0, 0);
    movementKeysRef.current = {
      left: false,
      right: false,
      forward: false,
      back: false,
    };
    if (profile === 'hd') {
      camera.position.copy(hdCameraPositionRef.current);
      camera.lookAt(hdLookTargetRef.current);
      return;
    }

    camera.position.set(...cameraOptions.initialPosition);
    camera.lookAt(baseLookTarget);
  }, [camera, cameraOptions, onDockedChange, profile, resetSignal]);

  useEffect(() => {
    if (!manualControlsEnabled) {
      lookStateRef.current = {
        yaw: 0,
        pitch: 0,
        targetYaw: 0,
        targetPitch: 0,
      };
      return;
    }

    const canvas = gl.domElement;
    let isDragging = false;
    let activePointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const endDrag = () => {
      isDragging = false;
      activePointerId = null;
      canvas.style.cursor = 'grab';
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (hasDockedRef.current) return;
      isDragging = true;
      activePointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || event.pointerId !== activePointerId) return;

      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      const current = lookStateRef.current;
      current.targetYaw = clamp(
        current.targetYaw - deltaX * cameraOptions.yawSensitivity,
        -cameraOptions.yawLimit,
        cameraOptions.yawLimit,
      );
      current.targetPitch = clamp(
        current.targetPitch - deltaY * cameraOptions.pitchSensitivity,
        -cameraOptions.pitchLimit,
        cameraOptions.pitchLimit,
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return;
      endDrag();
    };

    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, {
      passive: true,
    });
    window.addEventListener('blur', endDrag);

    return () => {
      endDrag();
      canvas.style.cursor = '';
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', endDrag);
    };
  }, [cameraOptions, gl, manualControlsEnabled]);

  useEffect(() => {
    if (!manualControlsEnabled) {
      movementKeysRef.current = {
        left: false,
        right: false,
        forward: false,
        back: false,
      };
      return;
    }

    const isTextEditingElement = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName;
      return (
        target.isContentEditable ||
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT'
      );
    };

    const setKeyState = (key: string, isPressed: boolean) => {
      const keys = movementKeysRef.current;
      if (key === 'ArrowLeft') keys.left = isPressed;
      if (key === 'ArrowRight') keys.right = isPressed;
      if (key === 'ArrowUp') keys.forward = isPressed;
      if (key === 'ArrowDown') keys.back = isPressed;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (hasDockedRef.current) return;
      if (isTextEditingElement(event.target)) return;
      if (
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowRight' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'ArrowDown'
      ) {
        return;
      }

      event.preventDefault();
      setKeyState(event.key, true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowRight' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'ArrowDown'
      ) {
        return;
      }

      event.preventDefault();
      setKeyState(event.key, false);
    };

    const handleBlur = () => {
      movementKeysRef.current = {
        left: false,
        right: false,
        forward: false,
        back: false,
      };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [manualControlsEnabled]);

  useFrame((state, delta) => {
    if (profile === 'hd') {
      camera.position.copy(hdCameraPositionRef.current);
      camera.lookAt(hdLookTargetRef.current);
      return;
    }

    if (hasDockedRef.current) {
      camera.position.copy(lockedCameraPositionRef.current);
      camera.lookAt(lockedFocusRef.current);
      return;
    }

    const travel = disableInputs ? 0 : clamp(scrollProgressRef.current, 0, 1);
    const elapsed = state.clock.elapsedTime;
    const lookState = lookStateRef.current;

    const baseLookTarget = baseLookTargetRef.current;
    const focus = focusRef.current;
    const baseOffset = baseOffsetRef.current;
    const rotatedOffset = rotatedOffsetRef.current;
    const rotatedPosition = rotatedPositionRef.current;
    const translatedFocus = translatedFocusRef.current;
    const translatedPosition = translatedPositionRef.current;
    const canyonFocus = canyonFocusRef.current;
    const canyonPosition = canyonPositionRef.current;
    const blendedFocus = blendedFocusRef.current;
    const blendedPosition = blendedPositionRef.current;
    const approachOffset = approachOffsetRef.current;
    const yawRotation = yawRotationRef.current;
    const pitchRotation = pitchRotationRef.current;
    const rightAxis = rightAxisRef.current;
    const flatForward = flatForwardRef.current;
    const flatRight = flatRightRef.current;
    const movementOffset = movementOffsetRef.current;
    const movementKeys = movementKeysRef.current;
    const anchor = anchorRef.current;

    if (approachStartTimeRef.current === null) {
      approachStartTimeRef.current = elapsed;
    }
    const approachElapsed = elapsed - (approachStartTimeRef.current ?? elapsed);
    const approachProgress = easeInOutCubic(
      approachElapsed / Math.max(0.001, cameraOptions.approachDurationSec),
    );
    const approachBlend = anchor
      ? approachProgress * cameraOptions.approachBlend
      : 0;

    const targetX =
      cameraOptions.initialPosition[0] +
      Math.sin(elapsed * cameraOptions.driftPosXSpeed) *
        cameraOptions.driftPosXAmplitude +
      travel * cameraOptions.scrollTravelX;
    const targetY =
      cameraOptions.initialPosition[1] +
      Math.sin(elapsed * cameraOptions.driftPosYSpeed + 1.3) *
        cameraOptions.driftPosYAmplitude -
      travel * cameraOptions.scrollTravelY;
    const targetZ =
      cameraOptions.initialPosition[2] +
      Math.cos(elapsed * cameraOptions.driftPosZSpeed + 0.7) *
        cameraOptions.driftPosZAmplitude;

    focus.set(
      baseLookTarget.x +
        Math.sin(elapsed * cameraOptions.driftFocusXSpeed + 0.2) *
          cameraOptions.driftFocusXAmplitude,
      baseLookTarget.y +
        Math.sin(elapsed * cameraOptions.driftFocusYSpeed + 1.1) *
          cameraOptions.driftFocusYAmplitude,
      baseLookTarget.z,
    );

    if (anchor) {
      canyonFocus
        .copy(anchor)
        .setY(anchor.y + cameraOptions.approachFocusYOffset);
      approachOffset.set(
        cameraOptions.approachCameraOffset[0],
        cameraOptions.approachCameraOffset[1],
        cameraOptions.approachCameraOffset[2],
      );
      canyonPosition.copy(canyonFocus).add(approachOffset);

      blendedFocus.copy(focus).lerp(canyonFocus, approachBlend);
      blendedPosition
        .set(targetX, targetY, targetZ)
        .lerp(canyonPosition, approachBlend);
    } else {
      blendedFocus.copy(focus);
      blendedPosition.set(targetX, targetY, targetZ);
    }

    baseOffset.set(
      blendedPosition.x - blendedFocus.x,
      blendedPosition.y - blendedFocus.y,
      blendedPosition.z - blendedFocus.z,
    );

    lookState.yaw = THREE.MathUtils.damp(
      lookState.yaw,
      lookState.targetYaw,
      cameraOptions.manualResponse,
      delta,
    );
    lookState.pitch = THREE.MathUtils.damp(
      lookState.pitch,
      lookState.targetPitch,
      cameraOptions.manualResponse,
      delta,
    );

    const cinematicYaw =
      Math.sin(elapsed * cameraOptions.cinematicYawSpeed) *
      cameraOptions.cinematicYawAmplitude;
    const cinematicPitch =
      Math.sin(elapsed * cameraOptions.cinematicPitchSpeed + 0.9) *
      cameraOptions.cinematicPitchAmplitude;

    yawRotation.setFromAxisAngle(
      upAxisRef.current,
      lookState.yaw + cinematicYaw,
    );
    rightAxis.set(1, 0, 0).applyQuaternion(yawRotation);
    pitchRotation.setFromAxisAngle(rightAxis, lookState.pitch + cinematicPitch);

    rotatedOffset
      .copy(baseOffset)
      .applyQuaternion(yawRotation)
      .applyQuaternion(pitchRotation);
    rotatedPosition.copy(blendedFocus).add(rotatedOffset);

    if (manualControlsEnabled) {
      flatForward.copy(blendedFocus).sub(rotatedPosition).setY(0);
      if (flatForward.lengthSq() < 1e-4) {
        flatForward.set(0, 0, -1);
      } else {
        flatForward.normalize();
      }

      flatRight.crossVectors(flatForward, upAxisRef.current).normalize();

      const moveStep = cameraOptions.keyboardMoveSpeed * delta;
      if (movementKeys.forward) {
        movementOffset.addScaledVector(flatForward, moveStep);
      }
      if (movementKeys.back) {
        movementOffset.addScaledVector(flatForward, -moveStep);
      }
      if (movementKeys.left) {
        movementOffset.addScaledVector(flatRight, -moveStep);
      }
      if (movementKeys.right) {
        movementOffset.addScaledVector(flatRight, moveStep);
      }
    }

    translatedPosition.copy(rotatedPosition).add(movementOffset);
    translatedFocus.copy(blendedFocus).add(movementOffset);

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      translatedPosition.x,
      cameraOptions.positionDampingX,
      delta,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      translatedPosition.y,
      cameraOptions.positionDampingY,
      delta,
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      translatedPosition.z,
      cameraOptions.positionDampingZ,
      delta,
    );
    camera.lookAt(translatedFocus);

    if (
      !hasDockedRef.current &&
      anchor &&
      approachProgress >= 0.98 &&
      camera.position.distanceTo(translatedPosition) <= 0.42
    ) {
      hasDockedRef.current = true;
      lockedCameraPositionRef.current.copy(camera.position);
      lockedFocusRef.current.copy(translatedFocus);
      onDockedChange?.(true);
    }
  });

  return null;
}

export default function TerrainScene({
  backgroundColor,
  palette,
  className,
  densityScale = 1,
  profile = 'standard',
  drawBackground = true,
  scrollProgressRef,
  disableInputs = false,
  resetSignal = 0,
  onDockedChange,
}: TerrainSceneProps) {
  const sceneOptions = TERRAIN_OPTIONS.scene;
  const hdOptions = TERRAIN_OPTIONS.hd;
  const isHd = profile === 'hd';
  const anchorRef = useRef<THREE.Vector3 | null>(null);
  const keyLightColor = isHd ? '#ffffff' : palette.high;
  const fillLightColor = isHd ? '#ffffff' : palette.low;
  const ambientIntensity = isHd ? 0.12 : sceneOptions.ambientIntensity;
  const keyLightIntensity = isHd
    ? hdOptions.keyLightIntensity
    : sceneOptions.keyLightIntensity;
  const fillLightIntensity = isHd
    ? hdOptions.fillLightIntensity
    : sceneOptions.fillLightIntensity;

  return (
    <Canvas
      className={className}
      camera={{
        fov: isHd ? hdOptions.fov : sceneOptions.fov,
        near: sceneOptions.near,
        far: sceneOptions.far,
        position: isHd
          ? hdOptions.cameraPosition
          : TERRAIN_OPTIONS.camera.initialPosition,
      }}
      dpr={sceneOptions.dpr}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      frameloop="always"
    >
      {drawBackground && <color attach="background" args={[backgroundColor]} />}
      {!isHd && (
        <fog
          attach="fog"
          args={[backgroundColor, sceneOptions.fogNear, sceneOptions.fogFar]}
        />
      )}

      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={sceneOptions.keyLightPosition}
        intensity={keyLightIntensity}
        color={keyLightColor}
      />
      <directionalLight
        position={sceneOptions.fillLightPosition}
        intensity={fillLightIntensity}
        color={fillLightColor}
      />
      {isHd && (
        <pointLight
          position={hdOptions.specularLightPosition}
          intensity={hdOptions.specularLightIntensity}
          color="#ffffff"
        />
      )}

      <TerrainField
        palette={palette}
        densityScale={densityScale}
        profile={profile}
        anchorRef={anchorRef}
      />
      <TerrainCameraRig
        scrollProgressRef={scrollProgressRef}
        disableInputs={disableInputs}
        resetSignal={resetSignal}
        profile={profile}
        anchorRef={anchorRef}
        onDockedChange={onDockedChange}
      />
    </Canvas>
  );
}
