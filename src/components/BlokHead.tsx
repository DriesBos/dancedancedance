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
import BlokSidePanels from './BlokSides';
import StoreSwitcher from './StoreSwitcher';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const hyperLink = [
  'mmerch',
  'minka-haus',
  'anatha-wallet',
  'hello-comrade',
  'fotomat',
  'van-hooff-architects',
  'close-my-eyes',
  'made-of-web',
  'ko',
  'cris-mannen',
  'jasper-rens-van-es',
  'jakob-johanna',
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
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [hasScrollBorder, setHasScrollBorder] = useState(false);

  const [pathName, setPathName] = useState('');
  const [projectName, setProjectName] = useState('');

  const clickNext = useCallback(() => {
    const nextPath = path;
    const currentSlug = nextPath.split('/')[2];
    const currentIndex = hyperLink.indexOf(currentSlug);
    if (currentIndex !== -1 && currentIndex < hyperLink.length - 1) {
      const nextSlug = `/projects/${hyperLink[currentIndex + 1]}`;
      router.push(nextSlug);
    } else {
      return false;
    }
  }, [path, router]);

  const checkNext = useCallback(() => {
    const checkNextPath = path;
    const currentSlug = checkNextPath.split('/')[2];
    const currentIndex = hyperLink.indexOf(currentSlug);
    setCurrentProjectIndex(currentIndex);
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
      const prevSlug = `/projects/${hyperLink[currentIndex - 1]}`;
      router.push(prevSlug);
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

    // Prefetch adjacent routes for instant navigation
    if (pathName === 'projects') {
      const currentSlug = path.split('/')[2];
      const currentIndex = hyperLink.indexOf(currentSlug);

      // Prefetch next route
      if (currentIndex !== -1 && currentIndex < hyperLink.length - 1) {
        router.prefetch(`/projects/${hyperLink[currentIndex + 1]}`);
      }

      // Prefetch previous route
      if (currentIndex > 0) {
        router.prefetch(`/projects/${hyperLink[currentIndex - 1]}`);
      }
    }
  }, [path, checkNext, checkPrev, pathName, router]);

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
  useGSAP(() => {
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    let isEnabled = mediaQuery.matches;

    let lastScrollY = window.scrollY;
    let scrollStartY = window.scrollY;
    let isScrollingDown = false;

    const updateHeaderVisibility = () => {
      if (!isEnabled) return; // Skip if not in landscape

      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollThreshold = windowHeight * 0.1; // 10% of window height

      // Always show header at the top
      if (currentScrollY < scrollThreshold) {
        gsap.to('.blok-Head', {
          y: 0,
          duration: 0.33,
          ease: 'power1.inOut',
        });
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
        // Hide header - move up
        gsap.to('.blok-Head', {
          y: -100,
          duration: 0.33,
          ease: 'power1.out',
        });
      } else if (!isScrollingDown && scrollDistance > scrollThreshold) {
        // Show header - move to normal position
        gsap.to('.blok-Head', {
          y: 0,
          duration: 0.33,
          ease: 'power1.out',
        });
      }

      lastScrollY = currentScrollY;
    };

    const handleScroll = () => {
      window.requestAnimationFrame(updateHeaderVisibility);
    };

    const handleOrientationChange = (e: MediaQueryListEvent) => {
      isEnabled = e.matches;

      // Reset header position when switching to portrait
      if (!isEnabled) {
        gsap.set('.blok-Head', { y: 0 });
      }
    };

    // Listen for orientation changes
    mediaQuery.addEventListener('change', handleOrientationChange);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      mediaQuery.removeEventListener('change', handleOrientationChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll border state
  useEffect(() => {
    const handleScrollBorder = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const threshold = viewportHeight * 0.2; // 20% of viewport height

      if (scrollY > threshold) {
        setHasScrollBorder(true);
      } else {
        setHasScrollBorder(false);
      }
    };

    // Check initial state
    handleScrollBorder();

    window.addEventListener('scroll', handleScrollBorder, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollBorder);
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
      className={`blok blok-Head blok-AnimateHead`}
      data-scrollborder={hasScrollBorder}
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
              <StoreSwitcher />
              <Link href="/about" className="icon">
                <IconAbout />
              </Link>
            </>
          )}
          {pathName === 'about' && (
            <>
              {/* <div className="icon">
                <Link href="/about">
                  <IconMail />
                </Link>
              </div> */}
              <Link href="/" className="icon">
                <IconClose />
              </Link>
            </>
          )}
          {pathName === 'projects' && (
            <>
              <div
                onClick={clickPrev}
                className={`${
                  hasPrev ? 'active' : 'disabled'
                } icon icon-Wide icon-Rotate desktop`}
              >
                <IconArrowLong />
              </div>
              <div
                onClick={clickPrev}
                className={`${
                  hasPrev ? 'active' : 'disabled'
                } icon icon-Rotate mobile`}
              >
                <IconArrow />
              </div>
              <div className="projectNumbe">
                {currentProjectIndex + 1}/{hyperLink.length}
              </div>
              <div
                onClick={clickNext}
                className={`${
                  hasNext ? 'active' : 'disabled'
                } icon icon-Wide desktop`}
              >
                <IconArrowLong />
              </div>
              <div
                onClick={clickNext}
                className={`${hasNext ? 'active' : 'disabled'} icon mobile`}
              >
                <IconArrow />
              </div>
              <Link href="/" className="icon">
                <IconClose />
              </Link>
            </>
          )}
        </div>
      </Row>
    </div>
  );
};

export default BlokHead;
