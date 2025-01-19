'use client';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import IconAbout from '@/components/Icons/IconAbout';
import IconMail from '@/components/Icons/IconMail';
import IconClose from '@/components/Icons/IconClose';
import IconArrowLong from '@/components/Icons/IconArrowLong';
import Row from './Row';
import gsap from 'gsap';
import StoreSwitcher from '@/components/StoreSwitcher';
import BlokSidePanels from './BlokSides';

interface Props {
  blok?: any;
  float?: boolean;
  params?: any;
}

const BlokHead = ({ blok, float, params }: Props) => {
  const path = usePathname();
  const router = useRouter();
  const space = useStore((state: any) => state.space);
  var topPanel = useStore((state) => state.topPanel);
  const setTopPanelTrue = useStore((state) => state.setTopPanelTrue);
  const setTopPanelFalse = useStore((state) => state.setTopPanelFalse);

  const [pathName, setPathName] = useState('');
  const [projectName, setProjectName] = useState('');

  const handleTopPanel = useCallback((e: any) => {
    if (e.type === 'mouseenter') {
      gsap.to('.blok-Head', {
        yPercent: -100,
        ease: 'power1.inOut',
        duration: 0.33,
      });
      setTopPanelTrue(true);
    } else {
      gsap.to('.blok-Head', {
        yPercent: 0,
        ease: 'power1.inOut',
        duration: 0.33,
      });
      setTopPanelFalse(false);
    }
  }, []);

  useEffect(() => {
    const main = document.querySelector('main');
    const selection = main !== null;
    if (selection && space === '3D') {
      main.addEventListener('mouseleave', handleTopPanel);
      main.addEventListener('mouseenter', handleTopPanel);
      return () => {
        main.removeEventListener('mouseleave', handleTopPanel);
        main.removeEventListener('mouseenter', handleTopPanel);
      };
    }
  }, [handleTopPanel, space]);

  // TopPanel to FALSE on 2D and PHONE
  useEffect(() => {
    if (space === '2D' || space === 'PHONE') {
      gsap.to('.blok-Head', {
        yPercent: 0,
        ease: 'power1.inOut',
        duration: 0.165,
      });
    }
    setTopPanelFalse(false);
  }, [space, setTopPanelFalse]);

  // Set Header Blok Title
  useEffect(() => {
    let tempPathName = path.split('/')[1];
    switch (tempPathName) {
      case '':
        setPathName('home');
        break;
      case 'about':
        setPathName('about');
        break;
      case 'projects':
        setPathName('projects');
        let tempProjectName = path.split('/')[2];
        tempProjectName = tempProjectName
          .replace(/-/g, ' ')
          .split(' ')
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(' ');
        setProjectName(tempProjectName);
        break;
    }
  }, [path]);

  // Set Escape Key
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (e.key === 'Escape') {
        router.push('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  return (
    <div className={`blok blok-Head ${float ? 'float' : ''}`}>
      <BlokSidePanels />
      <Row>
        <div className="column column-Title">
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
              {/* <div className="icon">
              <Link href="/about">
                <IconText />
              </Link>
            </div>
            <div className="icon">
              <Link href="/about">
                <IconImage />
              </Link>
            </div> */}
              <StoreSwitcher />
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
      </Row>
    </div>
  );
};

export default BlokHead;
