'use client';

import { useMemo, useState } from 'react';
import BlokProject from '../BlokProject';
import GrainyGradient from '../GrainyGradient';
import BlokSidePanels from '../BlokSidePanels';
import BlokFilter, {
  ProjectSortDirection,
  ProjectSortField,
} from '../BlokFilter';
import type { ProjectData } from './projectsData';
import Row from '../Row';

interface BlokProjectListClientProps {
  projects: ProjectData[];
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

export default function BlokProjectListClient({
  projects,
}: BlokProjectListClientProps) {
  const [sortField, setSortField] = useState<ProjectSortField>('year');
  const [sortDirection, setSortDirection] =
    useState<ProjectSortDirection>('desc');
  const [searchValue, setSearchValue] = useState('');

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

  return (
    <>
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <BlokFilter
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
      {hasNoSearchResults ? (
        <div className="blok blok-Project">
          <BlokSidePanels />
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
          />
        ))
      )}
    </>
  );
}
