'use client';

import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';
import { isColorBurstTheme, LIGHT_THEME } from '@/lib/theme';
import { useStore } from '@/store/store';
import styles from './ColorBurstTypography.module.sass';

const COLORS = ['#85AF00', '#FFCC00', '#FB9CFD', '#A19BFF', '#FF4C00'] as const;
const ICON_COLORS = ['#85AF00', '#FFCC00', '#FB9CFD', '#A19BFF'] as const;
const LIGHT_ICON_COLORS = ['#85AF00', '#FB9CFD', '#A19BFF'] as const;
const REPLACEMENTS: Record<string, string> = {
  A: '4',
  B: '8',
  E: '3',
  L: '1',
  O: '0',
  S: '5',
  T: '7',
};
const CORE_RADIUS = 75;
const SATELLITE_DISTANCE = 150;
const CORE_ACTIVATION_CHANCE = 0.9;
const TEXT_HOLD_MAX_SECONDS = 0.45;
const LINGER_CHANCE = 0.35;
const LINGER_MIN_MS = 250;
const LINGER_MAX_MS = 700;
const MAX_LINGERING_CHARACTERS = 4;
const TIMED_BURST_MIN_MS = 30_000;
const TIMED_BURST_MAX_MS = 60_000;
const ICON_TARGETS = '.icon, .hasExternalIcon svg';
const COLOR_ONLY_TARGETS = `${ICON_TARGETS}, [data-color-burst-shape]`;
const PROJECT_NAV_TARGET = '.column-Icons_NextPrev';
const SURFACE_TARGETS = [
  '.blok-Head',
  '.blok-Footer',
  '.blok-Exp',
  '.blok-Intro',
  '.blok-Filter',
  '.blok-ProjectList .blok-Project',
  '[data-color-burst="true"]',
  '.column-Caption',
  '[data-color-burst-indicators]',
  '.icon',
  '.hasExternalIcon svg',
].join(', ');

const getBurstColor = (target: HTMLElement) => {
  const colors = target.matches(COLOR_ONLY_TARGETS)
    ? document.body.dataset.theme === LIGHT_THEME
      ? LIGHT_ICON_COLORS
      : ICON_COLORS
    : COLORS;

  return colors[Math.floor(Math.random() * colors.length)] ?? colors[0];
};

const restoreCharacterContent = (character: HTMLElement) => {
  const original = character.dataset.colorBurstOriginal;

  if (original !== undefined) {
    character.textContent = original;
    delete character.dataset.colorBurstOriginal;
  }
};

const restoreCharacter = (character: HTMLElement) => {
  restoreCharacterContent(character);
  delete character.dataset.colorBurstBaseColor;
  delete character.dataset.colorBurstBorder;
  character.style.removeProperty('color');
};

const ColorBurstTypography = () => {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    const source = document.querySelector<HTMLElement>('main');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    if (!source || !finePointer.matches || !isColorBurstTheme(theme)) return;

    const activeCharacters = new Set<HTMLElement>();
    const timedCharacters = new Set<HTMLElement>();
    const stableWeights = new WeakMap<HTMLElement, number>();
    const lingerTimeouts = new Map<HTMLElement, number>();
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let activeSurface: HTMLElement | null = null;
    let timedBurstTimeout = 0;

    const getStableWeight = (character: HTMLElement) => {
      const existingWeight = stableWeights.get(character);

      if (existingWeight !== undefined) return existingWeight;

      const weight = Math.random();
      stableWeights.set(character, weight);
      return weight;
    };

    const clearLinger = (character: HTMLElement) => {
      const timeout = lingerTimeouts.get(character);

      if (timeout === undefined) return;
      window.clearTimeout(timeout);
      lingerTimeouts.delete(character);
      activeCharacters.delete(character);
    };

    const finishDeactivation = (character: HTMLElement) => {
      const baseColor = character.dataset.colorBurstBaseColor;

      activeCharacters.delete(character);
      restoreCharacterContent(character);
      delete character.dataset.colorBurstBorder;

      if (!baseColor) {
        restoreCharacter(character);
        return;
      }

      gsap.to(character, {
        color: baseColor,
        duration: 0.3,
        ease: 'power3.out',
        overwrite: true,
        onComplete: () => {
          if (activeCharacters.has(character)) return;
          delete character.dataset.colorBurstBaseColor;
          character.style.removeProperty('color');
        },
      });
    };

    const deactivateCharacter = (character: HTMLElement) => {
      if (lingerTimeouts.has(character)) return;

      const canLinger =
        !character.matches(COLOR_ONLY_TARGETS) &&
        lingerTimeouts.size < MAX_LINGERING_CHARACTERS &&
        Math.random() < LINGER_CHANCE;

      if (!canLinger) {
        finishDeactivation(character);
        return;
      }

      gsap.killTweensOf(character);
      const delay =
        LINGER_MIN_MS +
        getStableWeight(character) * (LINGER_MAX_MS - LINGER_MIN_MS);
      const timeout = window.setTimeout(() => {
        lingerTimeouts.delete(character);
        finishDeactivation(character);
      }, delay);

      lingerTimeouts.set(character, timeout);
    };

    const activateCharacter = (character: HTMLElement, distance: number) => {
      if (activeCharacters.has(character)) return;

      gsap.killTweensOf(character);
      restoreCharacter(character);
      const isColorOnly = character.matches(COLOR_ONLY_TARGETS);
      const original = character.textContent ?? '';
      const color = getBurstColor(character);
      const replacement = REPLACEMENTS[original.toUpperCase()];
      const holdDuration = isColorOnly
        ? 0
        : Math.random() * TEXT_HOLD_MAX_SECONDS;

      timedCharacters.delete(character);
      activeCharacters.add(character);
      if (!isColorOnly) character.dataset.colorBurstOriginal = original;
      if (!isColorOnly && Math.random() < 0.1) {
        character.dataset.colorBurstBorder = 'true';
      }
      character.dataset.colorBurstBaseColor ??= getComputedStyle(character).color;

      gsap.to(character, {
        color,
        duration: 0.3,
        delay: Math.floor(distance / 18) * 0.03,
        ease: 'power3.out',
        repeat: 1,
        repeatDelay: holdDuration,
        yoyo: true,
        overwrite: true,
        onStart: () => {
          if (replacement && Math.random() < 0.5) {
            character.textContent = replacement;
          }
        },
        onComplete: () => {
          activeCharacters.delete(character);
          restoreCharacter(character);
        },
      });
    };

    const restoreAll = () => {
      const characters = new Set([...activeCharacters, ...timedCharacters]);

      lingerTimeouts.forEach((timeout) => window.clearTimeout(timeout));
      lingerTimeouts.clear();
      gsap.killTweensOf([...characters]);
      characters.forEach(restoreCharacter);
      activeCharacters.clear();
      timedCharacters.clear();
    };

    const burstTimedCharacters = () => {
      const characters = [
        ...source.querySelectorAll<HTMLElement>(
          `[data-color-burst-timed] .${styles.character}`,
        ),
      ].filter((character) => !activeCharacters.has(character));

      characters.forEach((character, index) => {
        const original = character.textContent ?? '';
        const replacement = REPLACEMENTS[original.toUpperCase()];

        timedCharacters.add(character);
        character.dataset.colorBurstOriginal = original;
        if (Math.random() < 0.1) character.dataset.colorBurstBorder = 'true';
        gsap.to(character, {
          color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0],
          duration: 0.6,
          delay: index * 0.03,
          ease: 'power3.out',
          repeat: 1,
          yoyo: true,
          overwrite: true,
          onStart: () => {
            if (replacement && Math.random() < 0.5) {
              character.textContent = replacement;
            }
          },
          onComplete: () => {
            timedCharacters.delete(character);
            if (!activeCharacters.has(character)) restoreCharacter(character);
          },
        });
      });
    };

    const scheduleTimedBurst = () => {
      timedBurstTimeout = window.setTimeout(
        () => {
          burstTimedCharacters();
          scheduleTimedBurst();
        },
        TIMED_BURST_MIN_MS +
          Math.random() * (TIMED_BURST_MAX_MS - TIMED_BURST_MIN_MS),
      );
    };

    const getSatelliteCharacters = (
      anchor: HTMLElement,
      characters: HTMLElement[],
      distances: Map<HTMLElement, number>,
    ) => {
      const flow = anchor.closest<HTMLElement>('p') ?? activeSurface;

      if (!flow) return [];

      const flowBounds = flow.getBoundingClientRect();
      const flowCharacters = characters.filter((character) => {
        if (!flow.contains(character)) return false;

        const bounds = character.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;

        return (
          centerX >= flowBounds.left &&
          centerX <= flowBounds.right &&
          centerY >= flowBounds.top &&
          centerY <= flowBounds.bottom
        );
      });
      const anchorIndex = flowCharacters.indexOf(anchor);

      if (anchorIndex < 0) return [];

      const count = getStableWeight(anchor) < 0.5 ? 2 : 3;
      const candidates = flowCharacters
        .map((character, index) => ({
          character,
          index,
          offset: Math.abs(index - anchorIndex),
          distance: distances.get(character) ?? 0,
        }))
        .filter(
          ({ distance, offset }) =>
            offset >= 8 && distance >= SATELLITE_DISTANCE && distance <= 450,
        )
        .sort(
          (a, b) =>
            getStableWeight(a.character) - getStableWeight(b.character),
        );
      const satellites: typeof candidates = [];

      for (const candidate of candidates) {
        if (satellites.some(({ index }) => Math.abs(index - candidate.index) < 3)) {
          continue;
        }

        satellites.push(candidate);
        if (satellites.length === count) break;
      }

      return satellites.map(({ character }) => character);
    };

    const updateProximity = () => {
      frame = 0;
      const nearbyCharacters = new Set<HTMLElement>();
      const characterDistances = new Map<HTMLElement, number>();
      const textCharacters: HTMLElement[] = [];
      let nearestTextCharacter: HTMLElement | null = null;
      let nearestTextDistance = Number.POSITIVE_INFINITY;
      const surfaceCharacters = activeSurface
        ? [
            ...(activeSurface.matches(COLOR_ONLY_TARGETS) ? [activeSurface] : []),
            ...activeSurface.querySelectorAll<HTMLElement>(
              `.${styles.character}, ${COLOR_ONLY_TARGETS}`,
            ),
          ]
        : [];

      surfaceCharacters.forEach((character) => {
        if (
          !character.matches(COLOR_ONLY_TARGETS) &&
          getComputedStyle(character).visibility === 'hidden'
        ) {
          return;
        }

        const bounds = character.getBoundingClientRect();
        const distance = Math.hypot(
          bounds.left + bounds.width / 2 - pointerX,
          bounds.top + bounds.height / 2 - pointerY,
        );
        const isColorOnly = character.matches(COLOR_ONLY_TARGETS);

        characterDistances.set(character, distance);

        if (!isColorOnly && distance < nearestTextDistance) {
          textCharacters.push(character);
          nearestTextCharacter = character;
          nearestTextDistance = distance;
        } else if (!isColorOnly) {
          textCharacters.push(character);
        }

        if (distance > CORE_RADIUS) return;

        const activationChance =
          isColorOnly ? 1 : CORE_ACTIVATION_CHANCE;

        if (getStableWeight(character) > activationChance) return;

        nearbyCharacters.add(character);
        clearLinger(character);
        activateCharacter(character, distance);
      });

      if (nearestTextCharacter && nearestTextDistance <= CORE_RADIUS) {
        nearbyCharacters.add(nearestTextCharacter);
        clearLinger(nearestTextCharacter);
        activateCharacter(nearestTextCharacter, nearestTextDistance);

        getSatelliteCharacters(
          nearestTextCharacter,
          textCharacters,
          characterDistances,
        ).forEach((character) => {
          nearbyCharacters.add(character);
          clearLinger(character);
          activateCharacter(character, CORE_RADIUS);
        });
      }

      activeCharacters.forEach((character) => {
        if (!nearbyCharacters.has(character)) deactivateCharacter(character);
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      activeSurface =
        event.target instanceof Element
          ? (event.target.closest<HTMLElement>(PROJECT_NAV_TARGET) ??
            event.target.closest<HTMLElement>(SURFACE_TARGETS))
          : null;
      if (!frame) frame = window.requestAnimationFrame(updateProximity);
    };

    const handlePointerLeave = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      activeSurface = null;
      restoreAll();
    };

    scheduleTimedBurst();

    source.addEventListener('pointermove', handlePointerMove);
    source.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      source.removeEventListener('pointermove', handlePointerMove);
      source.removeEventListener('pointerleave', handlePointerLeave);
      window.clearTimeout(timedBurstTimeout);
      if (frame) window.cancelAnimationFrame(frame);
      restoreAll();
    };
  }, [theme]);

  return null;
};

export default ColorBurstTypography;
