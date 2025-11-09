'use client';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, use } from 'react';
import IconAbout from '@/components/Icons/IconAbout';
import IconClose from '@/components/Icons/IconClose';
import IconArrow from '@/components/Icons/IconArrow';
import IconArrowLong from '@/components/Icons/IconArrowLong';
import Row from './Row';
import gsap from 'gsap';
import BlokSidePanels from './BlokSides';
import StoreSwitcher from './StoreSwitcher';

const hyperLink = [
  'anatha-wallet',
  'hello-comrade',
  'fotomat',
  'van-hooff-architects',
  'close-my-eyes',
  'made-of-web',
  'ko',
  'cris-mannen',
  'jasper-rens-van-es',
  'leon',
  'ilovethatphoto',
  'de-fotohal',
];

interface Props {
  blok?: any;
  float?: boolean;
  params?: any;
}

const BlokHead = ({ blok, float, params }: Props) => {
  const path = usePathname();
  const router = useRouter();
  const space = useStore((state: any) => state.space);
  const index = useStore((state: any) => state.index);
  const setIndex = useStore((state: any) => state.setIndex);
  var topPanel = useStore((state) => state.topPanel);
  const setTopPanelTrue = useStore((state) => state.setTopPanelTrue);
  const setTopPanelFalse = useStore((state) => state.setTopPanelFalse);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [headerActive, setHeaderActive] = useState(true);

  const [pathName, setPathName] = useState('');
  const [projectName, setProjectName] = useState('');

  const clickNext = useCallback(() => {
    const nextPath = path;
    const currentSlug = nextPath.split('/')[2];
    const currentIndex = hyperLink.indexOf(currentSlug);
    if (currentIndex !== -1 && currentIndex < hyperLink.length - 1) {
      router.push(hyperLink[currentIndex + 1]);
    } else {
      return false;
    }
  }, [path, router]);

  const checkNext = useCallback(() => {
    const checkNextPath = path;
    const currentSlug = checkNextPath.split('/')[2];
    const currentIndex = hyperLink.indexOf(currentSlug);
    if (currentIndex === -1 || currentIndex >= hyperLink.length - 1) {
      setHasNext(false);
    } else {
      setHasNext(true);
    }
  }, [path]);

  const clickPrev = useCallback(() => {
    const prevPath = path;
    const currentSlug = prevPath.split('/')[2];
    const currentIndex = hyperLink.indexOf(currentSlug);
    if (currentIndex > 0) {
      router.push(hyperLink[currentIndex - 1]);
    } else {
      return false;
    }
  }, [path, router]);

  const checkPrev = useCallback(() => {
    const checkPrevPath = path;
    const currentSlug = checkPrevPath.split('/')[2];
    const currentIndex = hyperLink.indexOf(currentSlug);
    if (currentIndex <= 0) {
      setHasPrev(false);
    } else {
      setHasPrev(true);
    }
  }, [path]);

  useEffect(() => {
    checkNext();
    checkPrev();
  }, [path, checkNext, checkPrev]);

  // const handleTopPanel = useCallback((e: any) => {
  //   if (e.type === 'mouseenter') {
  //     gsap.to('.blok-Head', {
  //       yPercent: -100,
  //       ease: 'power1.inOut',
  //       duration: 0.33,
  //     });
  //     setTopPanelTrue(true);
  //   } else {
  //     gsap.to('.blok-Head', {
  //       yPercent: 0,
  //       ease: 'power1.inOut',
  //       duration: 0.33,
  //     });
  //     setTopPanelFalse(false);
  //   }
  // }, []);

  // useEffect(() => {
  //   const main = document.querySelector('main');
  //   const selection = main !== null;
  //   if (selection && space === '3D') {
  //     main.addEventListener('mouseleave', handleTopPanel);
  //     main.addEventListener('mouseenter', handleTopPanel);
  //     return () => {
  //       main.removeEventListener('mouseleave', handleTopPanel);
  //       main.removeEventListener('mouseenter', handleTopPanel);
  //     };
  //   }
  // }, [handleTopPanel, space]);

  // TopPanel to FALSE on 2D and PHONE
  // useEffect(() => {
  //   if (space === '2D' || space === 'MOBILE') {
  //     gsap.to('.blok-Head', {
  //       yPercent: 0,
  //       ease: 'power1.inOut',
  //       duration: 0.165,
  //     });
  //   }
  //   setTopPanelFalse(false);
  // }, [space, setTopPanelFalse]);

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

  // Set Escape Key and Arrow Keys
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (e.key === 'Escape') {
        router.push('/');
      }

      if (pathName === 'projects') {
        if (e.key === 'ArrowLeft') {
          clickPrev();
        } else if (e.key === 'ArrowRight') {
          clickNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, pathName, clickPrev, clickNext]);

  // Reveal on scroll up header pattern
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollStartY = window.scrollY;
    let isScrollingDown = false;

    const updateHeaderVisibility = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollThreshold = windowHeight * 0.1; // 10% of window height

      // Always show header at the top
      if (currentScrollY < scrollThreshold) {
        setHeaderActive(true);
        scrollStartY = currentScrollY;
        lastScrollY = currentScrollY;
        return;
      }

      // Detect direction change
      const scrollingDown = currentScrollY > lastScrollY;

      if (scrollingDown !== isScrollingDown) {
        // Direction changed, reset start point
        scrollStartY = lastScrollY;
        isScrollingDown = scrollingDown;
      }

      const scrollDistance = Math.abs(currentScrollY - scrollStartY);

      // Check if we've scrolled enough in the current direction
      if (isScrollingDown && scrollDistance > scrollThreshold) {
        setHeaderActive(false);
      } else if (!isScrollingDown && scrollDistance > scrollThreshold) {
        setHeaderActive(true);
      }

      lastScrollY = currentScrollY;
    };

    const handleScroll = () => {
      window.requestAnimationFrame(updateHeaderVisibility);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // function handlePickIndex() {
  //   if (index === 'TXT') {
  //     setIndex('IMG');
  //   } else {
  //     setIndex('TXT');
  //   }
  // }

  return (
    <div
      className={`blok blok-Head ${float ? 'float' : ''}`}
      data-active={headerActive}
    >
      <BlokSidePanels />
      <Row>
        <div className="column column-Title ellipsis">
          <Link href="/">Dries Bos&nbsp;</Link>
          <Link href="/">
            {(pathName === 'home' || pathName === 'about') && (
              <span>— Design & Code Partner</span>
            )}
          </Link>
          <Link href="/">
            {pathName === 'projects' && <span>& {projectName}</span>}
          </Link>
        </div>

        <div className="column column-Icons">
          {pathName === 'home' && (
            <>
              {/* <div className="icon" onClick={handlePickIndex}>
                {index === 'TXT' ? <IconText /> : <IconImage />}
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
              {/* <div className="icon">
                <Link href="/about">
                  <IconMail />
                </Link>
              </div> */}
              <div className="icon">
                <Link href="/">
                  <IconClose />
                </Link>
              </div>
            </>
          )}
          {pathName === 'projects' && (
            <>
              <div
                className={`${
                  hasPrev ? 'active' : 'disabled'
                } icon icon-Wide icon-Rotate desktop`}
              >
                <div onClick={clickPrev}>
                  <IconArrowLong />
                </div>
              </div>
              <div
                className={`${
                  hasPrev ? 'active' : 'disabled'
                } icon icon-Rotate mobile`}
              >
                <div onClick={clickPrev}>
                  <IconArrow />
                </div>
              </div>
              <div
                className={`${
                  hasNext ? 'active' : 'disabled'
                } icon icon-Wide desktop`}
              >
                <div onClick={clickNext}>
                  <IconArrowLong />
                </div>
              </div>
              <div className={`${hasNext ? 'active' : 'disabled'} icon mobile`}>
                <div onClick={clickNext}>
                  <IconArrow />
                </div>
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
