'use client';

import { useEffect, useRef, useState } from 'react';
import IconSearch from '@/components/Icons/IconSearch';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: SearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const preventNextFocusOpenRef = useRef(false);
  const isActive = isOpen || value.trim().length > 0;

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleToggle = () => {
    if (isOpen) {
      preventNextFocusOpenRef.current = true;
      onChange('');
      setIsOpen(false);
      inputRef.current?.blur();
      requestAnimationFrame(() => {
        preventNextFocusOpenRef.current = false;
      });
      return;
    }

    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    if (value.trim().length === 0) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      onChange('');
      setIsOpen(false);
    }
  };

  return (
    <div className="searchInput" data-active={isActive}>
      <input
        ref={inputRef}
        className="searchInput-Field"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (preventNextFocusOpenRef.current) return;
          setIsOpen(true);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search"
        aria-label="Search projects"
        tabIndex={isActive ? 0 : -1}
      />
      <button
        type="button"
        className="icon cursorMagnetic searchInput-Trigger"
        data-active
        onMouseDown={(event) => event.preventDefault()}
        onClick={handleToggle}
        aria-label="Search projects"
      >
        <IconSearch />
      </button>
    </div>
  );
}
