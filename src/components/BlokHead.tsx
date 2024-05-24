'use client';
import { usePathname } from 'next/navigation';
import link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import IconAbout from '@/components/Icons/IconAbout';
import IconImage from '@/components/Icons/IconImage';
import IconText from '@/components/Icons/IconText';
import IconMail from '@/components/Icons/IconMail';
import IconClose from '@/components/Icons/IconClose';
import IconArrowLong from '@/components/Icons/IconArrowLong';

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
        <div className="icon">
          <Link href="/about">
            <IconAbout />
          </Link>
        </div>
        <div className="icon icon-Wide">
          <Link href="/about">
            <IconArrowLong />
          </Link>
        </div>
        <div className="icon icon-Wide">
          <Link href="/about">
            <IconArrowLong />
          </Link>
        </div>
        <div className="icon">
          <Link href="/about">
            <IconClose />
          </Link>
        </div>
        <div className="icon">
          <Link href="/about">
            <IconMail />
          </Link>
        </div>
        <div className="icon">
          <Link href="/about">
            <IconText />
          </Link>
        </div>
        <div className="icon">
          <Link href="/about">
            <IconImage />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlokHead;
