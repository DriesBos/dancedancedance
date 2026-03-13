'use client';

import type { CSSProperties } from 'react';
import styles from './CypherRings.module.sass';

const SVG_SIZE = 1200;
const CENTER = SVG_SIZE / 2;
const LABEL_POOL = [
  '0.421',
  '6.36',
  'A-17',
  'SYNC',
  'Q-73',
  'R-08',
  'GRID',
  '72%',
  '0.73',
  'P-11',
  'C-12',
  '9.421',
];

type Accent = 'primary' | 'secondary' | 'tertiary';
type RotationDirection = 'clockwise' | 'counter';

type RingDefinition = {
  key: string;
  radius: number;
  width: number;
  opacity: number;
  accent: Accent;
  slotCount: number;
  minSpan: number;
  maxSpan: number;
  minGap: number;
  maxGap: number;
  tickCount: number;
  majorEvery: number;
  majorTickLength: number;
  minorTickLength: number;
  labelCount: number;
  durationSeconds: number;
  direction: RotationDirection;
  rotationOffset: number;
  seed: number;
  trackOpacity: number;
  dashPattern?: string;
};

type RingSegment = {
  key: string;
  d: string;
  accent: Accent;
  className: string;
};

type RingTick = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  accent: Accent;
  className: string;
};

type RingLabel = {
  key: string;
  x: number;
  y: number;
  rotation: number;
  text: string;
  accent: Accent;
};

type RingModel = {
  key: string;
  radius: number;
  width: number;
  opacity: number;
  accent: Accent;
  durationSeconds: number;
  direction: RotationDirection;
  rotationOffset: number;
  trackOpacity: number;
  dashPattern?: string;
  segments: RingSegment[];
  ticks: RingTick[];
  labels: RingLabel[];
};

const RING_DEFINITIONS: RingDefinition[] = [
  {
    key: 'outer-shell',
    radius: 546,
    width: 1.8,
    opacity: 0.8,
    accent: 'primary',
    slotCount: 132,
    minSpan: 3,
    maxSpan: 11,
    minGap: 2,
    maxGap: 8,
    tickCount: 168,
    majorEvery: 8,
    majorTickLength: 28,
    minorTickLength: 12,
    labelCount: 5,
    durationSeconds: 96,
    direction: 'counter',
    rotationOffset: -12,
    seed: 101,
    trackOpacity: 0.2,
    dashPattern: '6 12',
  },
  {
    key: 'outer-data',
    radius: 504,
    width: 1.5,
    opacity: 0.74,
    accent: 'primary',
    slotCount: 108,
    minSpan: 3,
    maxSpan: 8,
    minGap: 2,
    maxGap: 6,
    tickCount: 144,
    majorEvery: 6,
    majorTickLength: 20,
    minorTickLength: 10,
    labelCount: 4,
    durationSeconds: 84,
    direction: 'clockwise',
    rotationOffset: 8,
    seed: 211,
    trackOpacity: 0.16,
  },
  {
    key: 'bridge-ring',
    radius: 410,
    width: 2,
    opacity: 0.84,
    accent: 'secondary',
    slotCount: 84,
    minSpan: 4,
    maxSpan: 10,
    minGap: 2,
    maxGap: 5,
    tickCount: 108,
    majorEvery: 6,
    majorTickLength: 16,
    minorTickLength: 8,
    labelCount: 4,
    durationSeconds: 72,
    direction: 'counter',
    rotationOffset: -18,
    seed: 307,
    trackOpacity: 0.14,
  },
  {
    key: 'mid-amber',
    radius: 360,
    width: 2.15,
    opacity: 0.82,
    accent: 'secondary',
    slotCount: 72,
    minSpan: 4,
    maxSpan: 9,
    minGap: 2,
    maxGap: 4,
    tickCount: 96,
    majorEvery: 8,
    majorTickLength: 14,
    minorTickLength: 8,
    labelCount: 5,
    durationSeconds: 66,
    direction: 'clockwise',
    rotationOffset: 10,
    seed: 401,
    trackOpacity: 0.16,
  },
  {
    key: 'gold-grid',
    radius: 286,
    width: 1.7,
    opacity: 0.78,
    accent: 'tertiary',
    slotCount: 64,
    minSpan: 4,
    maxSpan: 8,
    minGap: 2,
    maxGap: 4,
    tickCount: 92,
    majorEvery: 4,
    majorTickLength: 18,
    minorTickLength: 10,
    labelCount: 4,
    durationSeconds: 58,
    direction: 'counter',
    rotationOffset: 6,
    seed: 503,
    trackOpacity: 0.12,
  },
  {
    key: 'inner-array',
    radius: 238,
    width: 1.45,
    opacity: 0.78,
    accent: 'tertiary',
    slotCount: 56,
    minSpan: 4,
    maxSpan: 7,
    minGap: 2,
    maxGap: 4,
    tickCount: 72,
    majorEvery: 6,
    majorTickLength: 14,
    minorTickLength: 7,
    labelCount: 4,
    durationSeconds: 46,
    direction: 'clockwise',
    rotationOffset: -14,
    seed: 601,
    trackOpacity: 0.12,
    dashPattern: '3 10',
  },
  {
    key: 'inner-core',
    radius: 188,
    width: 1.5,
    opacity: 0.8,
    accent: 'tertiary',
    slotCount: 42,
    minSpan: 3,
    maxSpan: 6,
    minGap: 1,
    maxGap: 3,
    tickCount: 48,
    majorEvery: 4,
    majorTickLength: 11,
    minorTickLength: 6,
    labelCount: 2,
    durationSeconds: 34,
    direction: 'counter',
    rotationOffset: 0,
    seed: 701,
    trackOpacity: 0.18,
  },
];

const FILL_SECTORS = [
  { key: 'sector-1', innerRadius: 250, outerRadius: 470, start: 12, end: 88, accent: 'secondary' as Accent, opacity: 0.08 },
  { key: 'sector-2', innerRadius: 272, outerRadius: 432, start: 196, end: 260, accent: 'secondary' as Accent, opacity: 0.06 },
  { key: 'sector-3', innerRadius: 170, outerRadius: 318, start: 294, end: 356, accent: 'tertiary' as Accent, opacity: 0.06 },
];

const GUIDE_RINGS = [
  { key: 'guide-a', radius: 558, accent: 'primary' as Accent, width: 2.2, opacity: 0.28, dashPattern: undefined },
  { key: 'guide-b', radius: 456, accent: 'primary' as Accent, width: 1.6, opacity: 0.18, dashPattern: undefined },
  { key: 'guide-c', radius: 334, accent: 'secondary' as Accent, width: 1.2, opacity: 0.14, dashPattern: '2 12' },
  { key: 'guide-d', radius: 214, accent: 'tertiary' as Accent, width: 1.2, opacity: 0.18, dashPattern: undefined },
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const createSeededRandom = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const polarToCartesian = (radius: number, angleDeg: number) => {
  const radians = ((angleDeg - 90) * Math.PI) / 180;

  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
};

const describeArc = (radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(radius, endAngle);
  const end = polarToCartesian(radius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${radius.toFixed(
    3,
  )} ${radius.toFixed(3)} 0 ${largeArcFlag} 0 ${end.x.toFixed(
    3,
  )} ${end.y.toFixed(3)}`;
};

const describeAnnularSector = (
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const outerStart = polarToCartesian(outerRadius, startAngle);
  const outerEnd = polarToCartesian(outerRadius, endAngle);
  const innerStart = polarToCartesian(innerRadius, endAngle);
  const innerEnd = polarToCartesian(innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)}`,
    `A ${outerRadius.toFixed(3)} ${outerRadius.toFixed(3)} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(3)} ${outerEnd.y.toFixed(3)}`,
    `L ${innerStart.x.toFixed(3)} ${innerStart.y.toFixed(3)}`,
    `A ${innerRadius.toFixed(3)} ${innerRadius.toFixed(3)} 0 ${largeArcFlag} 0 ${innerEnd.x.toFixed(3)} ${innerEnd.y.toFixed(3)}`,
    'Z',
  ].join(' ');
};

const buildRingModel = (definition: RingDefinition): RingModel => {
  const random = createSeededRandom(definition.seed);
  const slotAngle = 360 / definition.slotCount;
  const segments: RingSegment[] = [];
  const ticks: RingTick[] = [];
  const labels: RingLabel[] = [];

  let cursor = 0;
  while (cursor < definition.slotCount) {
    const span =
      definition.minSpan +
      Math.floor(
        random() * (definition.maxSpan - definition.minSpan + 1),
      );
    const gap =
      definition.minGap +
      Math.floor(random() * (definition.maxGap - definition.minGap + 1));
    const startTrim = 0.14 + random() * 0.22;
    const endTrim = 0.14 + random() * 0.24;
    const startAngle =
      definition.rotationOffset + (cursor + startTrim) * slotAngle;
    const endAngle =
      definition.rotationOffset +
      clamp(cursor + span - endTrim, cursor + 0.5, definition.slotCount) *
        slotAngle;
    const emphasis = random() > 0.58 ? styles.segmentStrong : styles.segmentSoft;
    const accent =
      definition.accent === 'primary' && random() > 0.84
        ? 'secondary'
        : definition.accent;

    if (endAngle - startAngle > slotAngle * 0.5) {
      segments.push({
        key: `${definition.key}-segment-${cursor}`,
        d: describeArc(definition.radius, startAngle, endAngle),
        accent,
        className: emphasis,
      });
    }

    cursor += span + gap;
  }

  for (let index = 0; index < definition.tickCount; index += 1) {
    const angle = definition.rotationOffset + index * (360 / definition.tickCount);
    const isMajor = index % definition.majorEvery === 0;
    const outerRadius = definition.radius + definition.width * 2.2;
    const innerRadius =
      outerRadius -
      (isMajor ? definition.majorTickLength : definition.minorTickLength);
    const outerPoint = polarToCartesian(outerRadius, angle);
    const innerPoint = polarToCartesian(innerRadius, angle);

    ticks.push({
      key: `${definition.key}-tick-${index}`,
      x1: outerPoint.x,
      y1: outerPoint.y,
      x2: innerPoint.x,
      y2: innerPoint.y,
      accent: definition.accent,
      className: isMajor ? styles.tickMajor : styles.tickMinor,
    });
  }

  if (segments.length > 0) {
    for (let index = 0; index < definition.labelCount; index += 1) {
      const segmentIndex = Math.floor(
        ((index + 0.5) / definition.labelCount) * segments.length,
      );
      const labelText = LABEL_POOL[(definition.seed + index) % LABEL_POOL.length];

      const angle =
        definition.rotationOffset +
        ((segmentIndex + 1) / Math.max(segments.length, 1)) * 360;
      const position = polarToCartesian(
        definition.radius + 24 + (index % 2) * 10,
        angle,
      );

      labels.push({
        key: `${definition.key}-label-${index}`,
        x: position.x,
        y: position.y,
        rotation: angle,
        text: labelText,
        accent: definition.accent,
      });
    }
  }

  return {
    key: definition.key,
    radius: definition.radius,
    width: definition.width,
    opacity: definition.opacity,
    accent: definition.accent,
    durationSeconds: definition.durationSeconds,
    direction: definition.direction,
    rotationOffset: definition.rotationOffset,
    trackOpacity: definition.trackOpacity,
    dashPattern: definition.dashPattern,
    segments,
    ticks,
    labels,
  };
};

const RINGS = RING_DEFINITIONS.map(buildRingModel);

const getAccentClassName = (accent: Accent) => {
  switch (accent) {
    case 'secondary':
      return styles.accentSecondary;
    case 'tertiary':
      return styles.accentTertiary;
    case 'primary':
    default:
      return styles.accentPrimary;
  }
};

const getRingStyle = (ring: RingModel): CSSProperties =>
  ({
    '--cypher-rotation-duration': `${ring.durationSeconds}s`,
    '--cypher-rotation-angle': `${ring.rotationOffset}deg`,
    opacity: ring.opacity,
  }) as CSSProperties;

export default function CypherRings() {
  return (
    <div className={styles.root} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        role="presentation"
      >
        <defs>
          <radialGradient id="cypher-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="55%" stopColor="#000000" />
            <stop offset="76%" stopColor="#120B04" />
            <stop offset="100%" stopColor="#020607" />
          </radialGradient>
          <radialGradient id="cypher-haze" cx="50%" cy="48%" r="62%">
            <stop offset="0%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="58%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.82)" />
          </radialGradient>
        </defs>

        <rect width={SVG_SIZE} height={SVG_SIZE} fill="#020607" />

        <g className={styles.staticLayer}>
          {FILL_SECTORS.map((sector) => (
            <path
              key={sector.key}
              d={describeAnnularSector(
                sector.innerRadius,
                sector.outerRadius,
                sector.start,
                sector.end,
              )}
              className={`${styles.fillSector} ${getAccentClassName(sector.accent)}`}
              style={{ opacity: sector.opacity }}
            />
          ))}

          {GUIDE_RINGS.map((ring) => (
            <circle
              key={ring.key}
              cx={CENTER}
              cy={CENTER}
              r={ring.radius}
              className={`${styles.guideRing} ${getAccentClassName(ring.accent)}`}
              strokeWidth={ring.width}
              strokeDasharray={ring.dashPattern}
              style={{ opacity: ring.opacity }}
            />
          ))}

          <line
            className={`${styles.axisLine} ${styles.accentPrimary}`}
            x1="0"
            y1={CENTER}
            x2="248"
            y2={CENTER}
          />
          <line
            className={`${styles.axisLine} ${styles.accentPrimary}`}
            x1={SVG_SIZE - 248}
            y1={CENTER}
            x2={SVG_SIZE}
            y2={CENTER}
          />
          <circle className={styles.coreVoid} cx={CENTER} cy={CENTER} r="124" />
          <circle className={`${styles.coreHalo} ${styles.accentTertiary}`} cx={CENTER} cy={CENTER} r="166" />
          <circle className={`${styles.coreHalo} ${styles.accentSecondary}`} cx={CENTER} cy={CENTER} r="346" />
        </g>

        {RINGS.map((ring) => (
          <g
            key={ring.key}
            className={`${styles.ring} ${
              ring.direction === 'clockwise'
                ? styles.rotateClockwise
                : styles.rotateCounter
            }`}
            style={getRingStyle(ring)}
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={ring.radius}
              className={`${styles.track} ${getAccentClassName(ring.accent)}`}
              strokeWidth={ring.width}
              strokeDasharray={ring.dashPattern}
              style={{ opacity: ring.trackOpacity }}
            />

            {ring.ticks.map((tick) => (
              <line
                key={tick.key}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                className={`${styles.tick} ${tick.className} ${getAccentClassName(
                  tick.accent,
                )}`}
              />
            ))}

            {ring.segments.map((segment) => (
              <path
                key={segment.key}
                d={segment.d}
                className={`${styles.segment} ${segment.className} ${getAccentClassName(
                  segment.accent,
                )}`}
                strokeWidth={ring.width}
              />
            ))}

            {ring.labels.map((label) => (
              <text
                key={label.key}
                x={label.x}
                y={label.y}
                className={`${styles.label} ${getAccentClassName(label.accent)}`}
                transform={`rotate(${label.rotation} ${label.x} ${label.y})`}
              >
                {label.text}
              </text>
            ))}
          </g>
        ))}

        <circle
          cx={CENTER}
          cy={CENTER}
          r="174"
          fill="url(#cypher-core-glow)"
          className={styles.innerMask}
        />
        <rect width={SVG_SIZE} height={SVG_SIZE} fill="url(#cypher-haze)" />
      </svg>
    </div>
  );
}
