'use client';

import { useEffect, useState } from 'react';

export default function TitleSwitcher() {
  const [originalTitle, setOriginalTitle] = useState<string>('');

  useEffect(() => {
    // Store the original title when component mounts
    setOriginalTitle(document.title);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the tab
        document.title = 'I MISS YOU ❤';
      } else {
        // User returned to the tab
        document.title = originalTitle;
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [originalTitle]);

  // Update originalTitle whenever the document title changes
  useEffect(() => {
    if (!document.hidden) {
      const observer = new MutationObserver(() => {
        if (!document.hidden) {
          setOriginalTitle(document.title);
        }
      });

      observer.observe(document.querySelector('title')!, {
        childList: true,
        characterData: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return null;
}
