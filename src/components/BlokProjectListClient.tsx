'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import BlokProject from './BlokProject';

interface ProjectData {
  slug: string;
  year: string;
  title: string;
  category?: string[];
  external_link?: string;
}

interface BlokProjectListClientProps {
  data: ProjectData[];
}

const BlokProjectListClient = ({ data }: BlokProjectListClientProps) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;

    const projectItems = listRef.current.querySelectorAll('.blok-Project');

    // Calculate the hover distance (3.95rem * 0.5)
    const remValue = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    const hoverDistance = -(3.95 * 0.5 * remValue);

    projectItems.forEach((item, index) => {
      const element = item as HTMLElement;

      // Get the element's current z-index from CSS
      const currentZIndex = window.getComputedStyle(element).zIndex;
      const zIndexValue =
        currentZIndex !== 'auto' ? parseInt(currentZIndex) : index + 1;

      const handleMouseEnter = () => {
        gsap.to(element, {
          y: hoverDistance,
          duration: 0.15,
          ease: 'cubic-bezier(0.16, 1, 0.16, 1)',
          force3D: false, // Prevent transform3d which can affect stacking
          zIndex: zIndexValue, // Explicitly set z-index to maintain stacking order
        });
      };

      const handleMouseLeave = () => {
        gsap.to(element, {
          y: 0,
          duration: 0.5,
          ease: 'cubic-bezier(0, 0, 0.58, 1)',
          force3D: false,
          zIndex: zIndexValue,
        });
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, [data]);

  return (
    <div className="blok-ProjectList" ref={listRef}>
      {data.map((item, index) => (
        <BlokProject
          key={item.slug}
          slug={item.slug}
          year={item.year}
          title={item.title}
          category={item.category}
          external_link={item.external_link}
        />
      ))}
    </div>
  );
};

export default BlokProjectListClient;
