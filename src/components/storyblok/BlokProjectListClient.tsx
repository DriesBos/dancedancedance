'use client';

import type { CSSProperties, HTMLAttributes } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlokProject from '../BlokProject';
import GrainyGradient from '../GrainyGradient';
import BlokSidePanels from '../BlokSidePanels';
import BlokFilter, {
  ProjectSortDirection,
  ProjectSortField,
} from '../BlokFilter';
import type { ProjectData } from './projectsData';
import Row from '../Row';
import type { Locale } from '@/lib/locale';
import styles from './BlokProjectListClient.module.sass';
import ThumbnailWrapper, {
  type ThumbnailWrapperEvent,
} from './ThumbnailWrapper';

interface BlokProjectListClientProps {
  projects: ProjectData[];
  editableProps?: HTMLAttributes<HTMLDivElement>;
  locale: Locale;
}

type ActiveProjectOverlay = {
  project: ProjectData;
  rect: {
    top: number;
    left: number;
    width: number;
  };
};

const getTimeValue = (value?: string) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getCategoryValue = (categories?: string[]) =>
  categories?.join(', ').toLocaleLowerCase() || '';

const getSearchableText = (project: ProjectData) =>
  `${project.title || ''} ${project.year || ''} ${(project.category || []).join(' ')}`.toLocaleLowerCase();

const getProjectOverlayRect = (element: HTMLDivElement) => {
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
  };
};

const canUseHoverThumbnails = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export default function BlokProjectListClient({
  projects,
  editableProps,
  locale,
}: BlokProjectListClientProps) {
  const [sortField, setSortField] = useState<ProjectSortField>('year');
  const [sortDirection, setSortDirection] =
    useState<ProjectSortDirection>('desc');
  const [searchValue, setSearchValue] = useState('');
  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(
    null,
  );
  const [hoverEvent, setHoverEvent] = useState<ThumbnailWrapperEvent | null>(
    null,
  );
  const [leaveEvent, setLeaveEvent] = useState<ThumbnailWrapperEvent | null>(
    null,
  );
  const [activeProjectOverlay, setActiveProjectOverlay] =
    useState<ActiveProjectOverlay | null>(null);
  const thumbnailEventIdRef = useRef(0);
  const activeProjectElementRef = useRef<HTMLDivElement | null>(null);
  const activeProjectElementSlugRef = useRef<string | null>(null);

  const handleSortChange = (field: ProjectSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection(field === 'year' ? 'desc' : 'asc');
  };

  const visibleProjects = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLocaleLowerCase();
    const filtered = normalizedSearch
      ? projects.filter((project) =>
          getSearchableText(project).includes(normalizedSearch),
        )
      : projects;

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'year') {
        comparison = getTimeValue(a.year) - getTimeValue(b.year);
      } else if (sortField === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '', undefined, {
          sensitivity: 'base',
        });
      } else {
        comparison = getCategoryValue(a.category).localeCompare(
          getCategoryValue(b.category),
          undefined,
          { sensitivity: 'base' },
        );
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [projects, searchValue, sortDirection, sortField]);
  const isSearching = searchValue.trim().length > 0;
  const hasNoSearchResults = isSearching && visibleProjects.length === 0;

  const createThumbnailEvent = useCallback((projectSlug: string) => {
    const id = thumbnailEventIdRef.current + 1;
    thumbnailEventIdRef.current = id;
    return { projectSlug, id };
  }, []);

  const showProjectThumbnail = useCallback((project: ProjectData, element: HTMLDivElement) => {
    if (!canUseHoverThumbnails()) return;

    activeProjectElementRef.current = element;
    activeProjectElementSlugRef.current = project.slug;
    setActiveProjectSlug(project.slug);
    setActiveProjectOverlay({
      project,
      rect: getProjectOverlayRect(element),
    });
    setHoverEvent(createThumbnailEvent(project.slug));
  }, [createThumbnailEvent]);

  const clearActiveProject = useCallback((projectSlug: string) => {
    if (activeProjectElementSlugRef.current === projectSlug) {
      activeProjectElementRef.current = null;
      activeProjectElementSlugRef.current = null;
    }
    setActiveProjectSlug((slug) => (slug === projectSlug ? null : slug));
    setActiveProjectOverlay((overlay) =>
      overlay?.project.slug === projectSlug ? null : overlay,
    );
    setLeaveEvent(createThumbnailEvent(projectSlug));
  }, [createThumbnailEvent]);

  const activeProjectOverlaySlug = activeProjectOverlay?.project.slug ?? null;

  useEffect(() => {
    if (!activeProjectOverlaySlug) return;

    let animationFrame = 0;

    const updateOverlayPosition = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        const element = activeProjectElementRef.current;
        if (!element) return;

        setActiveProjectOverlay((overlay) =>
          overlay
            ? { ...overlay, rect: getProjectOverlayRect(element) }
            : overlay,
        );
      });
    };

    window.addEventListener('scroll', updateOverlayPosition, { passive: true });
    window.addEventListener('resize', updateOverlayPosition);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', updateOverlayPosition);
      window.removeEventListener('resize', updateOverlayPosition);
    };
  }, [activeProjectOverlaySlug]);

  const activeProjectOverlayStyle: CSSProperties | undefined =
    activeProjectOverlay
      ? {
          top: activeProjectOverlay.rect.top,
          left: activeProjectOverlay.rect.left,
          width: activeProjectOverlay.rect.width,
        }
      : undefined;

  const renderActiveProjectOverlay = (isBlendLayer = false) =>
    activeProjectOverlay && (
      <div className={styles.activeProjectLayer} aria-hidden="true" inert>
        <div
          className={`${styles.activeProjectRow} ${
            isBlendLayer ? styles.activeProjectRowBlend : ''
          }`}
          style={activeProjectOverlayStyle}
        >
          <BlokProject
            slug={activeProjectOverlay.project.slug}
            year={activeProjectOverlay.project.year}
            title={activeProjectOverlay.project.title}
            category={activeProjectOverlay.project.category}
            external_link={activeProjectOverlay.project.external_link}
            thumbnail={activeProjectOverlay.project.thumbnail}
            disableCursorPreview
          />
        </div>
      </div>
    );

  return (
    <>
      <BlokFilter
        sortField={sortField}
        onSortChange={handleSortChange}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        locale={locale}
      />
      <ThumbnailWrapper
        projects={visibleProjects}
        hoverEvent={hoverEvent}
        leaveEvent={leaveEvent}
        blendChildren={renderActiveProjectOverlay(true)}
      >
        {renderActiveProjectOverlay()}
      </ThumbnailWrapper>
      <div
        className={`blok blok-Animate blok-ProjectList ${styles.projectList}`}
        {...editableProps}
      >
        <GrainyGradient variant="blok" />
        <BlokSidePanels />
        {hasNoSearchResults ? (
          <div className="blok blok-Project">
            <GrainyGradient variant="blok" />
            <Row>
              <GrainyGradient variant="blok" className="grainyInRow" />
              <div className="column column-Year"></div>
              <div className="column column-Project">No work found..</div>
              <div className="column column-Category"></div>
              <div className="column column-Icons"></div>
            </Row>
          </div>
        ) : (
          visibleProjects.map((item, index) => (
            <BlokProject
              key={item.slug}
              slug={item.slug}
              year={item.year}
              title={item.title}
              category={item.category}
              external_link={item.external_link}
              thumbnail={item.thumbnail}
              stackIndex={index}
              isHoverActive={activeProjectSlug === item.slug}
              disableCursorPreview
              hideProjectCopy={activeProjectSlug === item.slug}
              onProjectHover={(element) => showProjectThumbnail(item, element)}
              onProjectLeave={() => clearActiveProject(item.slug)}
            />
          ))
        )}
      </div>
    </>
  );
}
