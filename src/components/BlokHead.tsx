'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
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
  const path = usePathname();

  const [pathName, setPathName] = useState(path.split('/')[1]);

  let handlePathName = () => {
    switch (pathName) {
      case 'about':
        console.log('This is the about page');
        setPathName('about');
        break;
      case 'projects':
        console.log('This is the projects page');
        setPathName('projects');
        break;
      default:
        console.log('This is the home page');
        setPathName('home');
    }
  };

  if (pathName.length <= 0) {
    handlePathName();
    console.log(path);
  }
  let [projectName, setProjectName] = useState('Project Name');

  function stateProjectName() {
    if (pathName === 'projects') {
      projectName = path.split('/')[2];
      projectName = projectName
        .replace(/-/g, ' ')
        .split(' ')
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ');
    } else {
      setProjectName('');
    }
  }

  if (projectName === 'Project Name') {
    stateProjectName();
  }

  return (
    <div className={`blok blok-Head ${float ? 'float' : ''}`}>
      <div className="column">
        <Link href="/">Dries Bos&nbsp;</Link>
        <Link href="/projects/anatha-wallet">
          {pathName === 'home' && <span>— Design, Code & Interaction</span>}
          {pathName === 'about' && <span>— Design, Code & Interaction</span>}
        </Link>
        <Link href="/projects/anatha-wallet">
          {pathName === 'projects' && <span>& {projectName}</span>}
        </Link>
      </div>

      <div className="column column-Icons">
        {pathName === 'home' && (
          <>
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
            <div className="icon">
              <Link href="/about">
                <IconAbout />
              </Link>
            </div>
          </>
        )}
        {pathName === 'about' && (
          <>
            <div className="icon">
              <Link href="/about">
                <IconMail />
              </Link>
            </div>
            <div className="icon">
              <Link href="/">
                <IconClose />
              </Link>
            </div>
          </>
        )}
        {pathName === 'projects' && (
          <>
            <div className="icon icon-Wide icon-Rotate">
              <Link href="/">
                <IconArrowLong />
              </Link>
            </div>
            <div className="icon icon-Wide">
              <Link href="/">
                <IconArrowLong />
              </Link>
            </div>
            <div className="icon">
              <Link href="/">
                <IconClose />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BlokHead;
