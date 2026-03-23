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
        <div className="column column-Left">
          <button
            type="button"
            className={`column column-Year cursorInteract desktop ${styles.sortButton}`}
            data-active={isSortActive('year')}
            data-inactive={!isSortActive('year')}
            onClick={() => onSortChange('year')}
          >
            year
          </button>
          <div className="column column-Title mobile">Selected work</div>
          <button
            type="button"
            className={`column column-Project cursorInteract desktop ${styles.sortButton}`}
            data-active={isSortActive('title')}
            data-inactive={!isSortActive('title')}
            onClick={() => onSortChange('title')}
          >
            selected work
          </button>
        </div>
        <div className="column column-Right">
          <button
            type="button"
            className={`column column-Category cursorInteract ${styles.sortButton}`}
            data-active={isSortActive('category')}
            data-inactive={!isSortActive('category')}
            onClick={() => onSortChange('category')}
          >
            type of work
          </button>
          <div className={`column column-Icons ${styles.iconWrapper}`}>
            <div className={`icon ${styles.icon}`}>
              <IconArrow />
            </div>
            <SearchInput value={searchValue} onChange={onSearchChange} />
          </div>
        </div>
      </Row>
    </div>
  );
}
