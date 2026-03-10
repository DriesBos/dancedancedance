'use client';

import BlokSidePanels from '@/components/BlokSidePanels';
import GrainyGradient from '@/components/GrainyGradient';
import IconArrow from '@/components/Icons/IconArrow';
import Row from '@/components/Row';
import SearchInput from '@/components/SearchInput';
import styles from './BlokFilter.module.sass';

export type ProjectSortField = 'year' | 'title' | 'category';
export type ProjectSortDirection = 'asc' | 'desc';

interface BlokFilterProps {
  sortField: ProjectSortField;
  sortDirection: ProjectSortDirection;
  onSortChange: (field: ProjectSortField) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function BlokFilter({
  sortField,
  sortDirection,
  onSortChange,
  searchValue,
  onSearchChange,
}: BlokFilterProps) {
  const isSortActive = (field: ProjectSortField) => sortField === field;
  const sortIndicator = (field: ProjectSortField) =>
    isSortActive(field) ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className={`blok blok-Filter blok-Animate ${styles.blokFilter}`}>
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <Row>
        <button
          type="button"
          className={`column column-Year cursorInteract desktop ${styles.sortButton}`}
          data-active={isSortActive('year')}
          data-inactive={!isSortActive('year')}
          onClick={() => onSortChange('year')}
        >
          year
        </button>
        <button
          type="button"
          className={`column column-Project cursorInteract ${styles.sortButton}`}
          data-active={isSortActive('title')}
          data-inactive={!isSortActive('title')}
          onClick={() => onSortChange('title')}
        >
          selected work
        </button>
        <button
          type="button"
          className={`column column-Category cursorInteract ${styles.sortButton}`}
          data-active={isSortActive('category')}
          data-inactive={!isSortActive('category')}
          onClick={() => onSortChange('category')}
        >
          category
        </button>
        <div className={`column column-Icons ${styles.iconWrapper}`}>
          <div className={`icon ${styles.icon}`}>
            <IconArrow />
          </div>
          <SearchInput value={searchValue} onChange={onSearchChange} />
        </div>
      </Row>
    </div>
  );
}
