'use client';

import { useEffect, useRef } from 'react';

export default function TitleSwitcher() {
  const originalTitleRef = useRef('');

  useEffect(() => {
    // Store the original title when component mounts
    originalTitleRef.current = document.title;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the tab
        document.title = 'Hire this guy';
      } else {
        // User returned to the tab
        document.title = originalTitleRef.current;
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Update originalTitle whenever the document title changes
  useEffect(() => {
    if (document.hidden) return;
    if (typeof MutationObserver === 'undefined') return;

    const titleElement = document.querySelector('title');
    if (!titleElement) return;

    const observer = new MutationObserver(() => {
      if (!document.hidden) {
        originalTitleRef.current = document.title;
      }
    });

    observer.observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
