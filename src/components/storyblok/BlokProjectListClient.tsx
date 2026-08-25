'use client';

import type { HTMLAttributes } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import BlokProject from '../BlokProject';
import BlokFilter, {
  ProjectSortDirection,
  ProjectSortField,
} from '../BlokFilter';
import type { ProjectData } from '@/lib/fetch-projects';
import GrainyGradient from '@/components/GrainyGradient';
import BlokSidePanels from '@/components/BlokSidePanels';
import styles from './BlokProjectListClient.module.sass';
import ThumbnailWrapper, {
  type ThumbnailWrapperEvent,
} from './ThumbnailWrapper';

interface BlokProjectListClientProps {
  projects: ProjectData[];
  editableProps?: HTMLAttributes<HTMLDivElement>;
}

const getTimeValue = (value?: string) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getCategoryValue = (categories?: string[]) =>
  categories?.join(', ').toLocaleLowerCase() || '';

const getSearchableText = (project: ProjectData) =>
  `${project.title || ''} ${project.year || ''} ${(project.category || []).join(' ')}`.toLocaleLowerCase();

const canUseHoverThumbnails = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export default function BlokProjectListClient({
  projects,
  editableProps,
}: BlokProjectListClientProps) {
  const [sortField, setSortField] = useState<ProjectSortField>('year');
  const [sortDirection, setSortDirection] =
    useState<ProjectSortDirection>('desc');
  const [searchValue, setSearchValue] = useState('');
  const [hoverEvent, setHoverEvent] = useState<ThumbnailWrapperEvent | null>(
    null,
  );
  const [leaveEvent, setLeaveEvent] = useState<ThumbnailWrapperEvent | null>(
    null,
  );
  const thumbnailEventIdRef = useRef(0);

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

  const showProjectThumbnail = useCallback((project: ProjectData) => {
    if (!canUseHoverThumbnails()) return;

    setHoverEvent(createThumbnailEvent(project.slug));
  }, [createThumbnailEvent]);

  const clearActiveProject = useCallback((projectSlug: string) => {
    setLeaveEvent(createThumbnailEvent(projectSlug));
  }, [createThumbnailEvent]);

  return (
    <>
      <BlokFilter
        sortField={sortField}
        onSortChange={handleSortChange}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
      <ThumbnailWrapper
        projects={visibleProjects}
        hoverEvent={hoverEvent}
        leaveEvent={leaveEvent}
      />
      <div
        className={`blok blok-Animate blok-ProjectList ${styles.projectList}`}
        {...editableProps}
      >
        <GrainyGradient variant="blok" />
        <BlokSidePanels />
        {hasNoSearchResults ? (
          <BlokProject title="No work found.." />
        ) : (
          visibleProjects.map((item) => (
            <BlokProject
              key={item.slug}
              slug={item.slug}
              year={item.year}
              title={item.title}
              category={item.category}
              external_link={item.external_link}
              onProjectHover={() => showProjectThumbnail(item)}
              onProjectLeave={() => clearActiveProject(item.slug)}
            />
          ))
        )}
      </div>
    </>
  );
}
