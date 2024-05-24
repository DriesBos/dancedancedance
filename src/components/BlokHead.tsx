'use client';
import { usePathname } from 'next/navigation';
import link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  blok?: any;
  float?: boolean;
  params?: any;
}

const BlokHead = ({ blok, float, params }: Props) => {
  const router = usePathname();

  const [showProject, setShowProject] = useState(false);

  useEffect(() => {
    if (router.split('/')[1] === 'projects') {
      setShowProject(true);
    } else {
      setShowProject(false);
    }
  }, [router, showProject]);

  let projectName = '';

  function stateProjectName() {
    if (showProject) {
      projectName = router.split('/')[2];
      projectName = projectName
        .replace(/-/g, ' ')
        .split(' ')
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ');
    } else {
      projectName = 'NONE';
    }
  }

  stateProjectName();

  return (
    <div className={`blok blok-Head ${float ? 'float' : ''}`}>
      <div className="column">
        <Link href="/">Dries Bos&nbsp;</Link>
        <Link href="/projects/anatha-wallet">
          {!showProject && <span>— Design, Code & Interaction</span>}
        </Link>
        <Link href="/projects/anatha-wallet">
          {showProject && <span>& {projectName}</span>}
        </Link>
      </div>
      <div className="column column-Icons">
        <Link href="/about">about</Link>
      </div>
    </div>
  );
};

export default BlokHead;
