'use client';

import type { MouseEvent, ReactNode } from 'react';

type Props = {
  className?: string;
  children: ReactNode;
};

const ScrollToTopLink = ({ className, children }: Props) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  return (
    <a
      href="#page-top"
      onClick={handleClick}
      className={className}
      aria-label="Scroll to top"
    >
      {children}
    </a>
  );
};

export default ScrollToTopLink;
