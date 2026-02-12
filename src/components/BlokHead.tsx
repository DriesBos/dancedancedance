'use client';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { useProjects } from '@/providers/projects-provider';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, use } from 'react';
import IconAbout from '@/components/Icons/IconAbout';
import IconClose from '@/components/Icons/IconClose';
import IconArrow from '@/components/Icons/IconArrow';
import IconArrowLong from '@/components/Icons/IconArrowLong';
import IconLinkOutside from '@/components/Icons/IconLinkOutside';
import Row from './Row';
import BlokSidePanels from './BlokSides';
import StoreSwitcher from './StoreSwitcher';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import IconCloud from './Icons/IconCloud';
import IconThoughts from './Icons/IconThoughts';

interface Props {
  blok?: any;
  float?: boolean;
  params?: any;
}

const BlokHead = ({ blok, float, params }: Props) => {
  const path = usePathname();
  const router = useRouter();
  const { projectSlugs, projects } = useProjects();
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
  const [externalLink, setExternalLink] = useState<
    { cached_url: string } | undefined
  >(undefined);

  console.log(blok, float, params, 'PROJECT PAGE');

  const clickNext = useCallback(() => {
    if (!projectSlugs || projectSlugs.length === 0) return;
    const nextPath = path;
    const currentSlug = nextPath.split('/')[2];
    const currentIndex = projectSlugs.indexOf(currentSlug);
    if (currentIndex !== -1 && currentIndex < projectSlugs.length - 1) {
      const nextSlug = `/projects/${projectSlugs[currentIndex + 1]}`;
      router.push(nextSlug);
    }
  }, [path, router, projectSlugs]);

  const checkNext = useCallback(() => {
    if (!projectSlugs || projectSlugs.length === 0) {
      setHasNext(false);
      return;
    }
    const checkNextPath = path;
    const currentSlug = checkNextPath.split('/')[2];
    const currentIndex = projectSlugs.indexOf(currentSlug);
    setCurrentProjectIndex(currentIndex);
    if (currentIndex === -1 || currentIndex >= projectSlugs.length - 1) {
      setHasNext(false);
    } else {
      setHasNext(true);
    }
  }, [path, projectSlugs]);

  const clickPrev = useCallback(() => {
    if (!projectSlugs || projectSlugs.length === 0) return;
    const prevPath = path;
    const currentSlug = prevPath.split('/')[2];
    const currentIndex = projectSlugs.indexOf(currentSlug);
    if (currentIndex > 0) {
      const prevSlug = `/projects/${projectSlugs[currentIndex - 1]}`;
      router.push(prevSlug);
    }
  }, [path, router, projectSlugs]);

  const checkPrev = useCallback(() => {
    if (!projectSlugs || projectSlugs.length === 0) {
      setHasPrev(false);
      return;
    }
    const checkPrevPath = path;
    const currentSlug = checkPrevPath.split('/')[2];
    const currentIndex = projectSlugs.indexOf(currentSlug);
    if (currentIndex <= 0) {
      setHasPrev(false);
    } else {
      setHasPrev(true);
    }
  }, [path, projectSlugs]);

  useEffect(() => {
    if (!projectSlugs || projectSlugs.length === 0) {
      setHasNext(false);
      setHasPrev(false);
      return;
    }

    const currentSlug = path.split('/')[2];
    const currentIndex = projectSlugs.indexOf(currentSlug);

    setCurrentProjectIndex(currentIndex);

    // Check next
    if (currentIndex === -1 || currentIndex >= projectSlugs.length - 1) {
      setHasNext(false);
    } else {
      setHasNext(true);
    }

    // Check prev
    if (currentIndex <= 0) {
      setHasPrev(false);
    } else {
      setHasPrev(true);
    }
  }, [path, projectSlugs]);

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

  // Set Header Blok Title and External Link
  useEffect(() => {
    let tempPathName = path.split('/')[1];
    switch (tempPathName) {
      case '':
        setPathName('home');
        setExternalLink(undefined);
        break;
      case 'about':
        setPathName('about');
        setExternalLink(undefined);
        break;
      case 'projects':
        setPathName('projects');
        let tempProjectName = path.split('/')[2];
        if (tempProjectName) {
          tempProjectName = tempProjectName
            .replace(/-/g, ' ')
            .split(' ')
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(' ');
          setProjectName(tempProjectName);

          // Fetch external link for current project
          if (projects && projects.length > 0) {
            const currentSlug = path.split('/')[2];
            const currentProject = projects.find((p) => p.slug === currentSlug);
            if (currentProject && currentProject.external_link) {
              setExternalLink(currentProject.external_link);
            } else {
              setExternalLink(undefined);
            }
          }
        }
        break;
    }
  }, [path, projects]);

  // Set Escape Key and Arrow Keys
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (e.key === 'Escape') {
        router.push('/');
        return;
      }

      if (pathName === 'projects' && projectSlugs && projectSlugs.length > 0) {
        const currentSlug = path.split('/')[2];
        const currentIndex = projectSlugs.indexOf(currentSlug);

        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          const prevSlug = `/projects/${projectSlugs[currentIndex - 1]}`;
          router.push(prevSlug);
        } else if (
          e.key === 'ArrowRight' &&
          currentIndex !== -1 &&
          currentIndex < projectSlugs.length - 1
        ) {
          const nextSlug = `/projects/${projectSlugs[currentIndex + 1]}`;
          router.push(nextSlug);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, pathName, path, projectSlugs]);

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
          {(pathName === 'home' ||
            pathName === 'about' ||
            pathName === 'projects') && (
            <Link href="/" className="cursorInteract">
              Dries Bos&nbsp;
            </Link>
          )}
          <Link href="/" className="cursorInteract">
            {(pathName === 'home' || pathName === 'about') && (
              <span className="cursorInteract">— Creative Developer</span>
            )}
          </Link>
          <Link href="/">
            {pathName === 'projects' && (
              <span className="cursorInteract ">& {projectName}</span>
            )}
          </Link>
        </div>

        <div className="column column-Icons">
          {pathName === 'home' && (
            <>
              <StoreSwitcher />
              <Link href="/about" className="icon cursorMagnetic">
                <IconAbout />
              </Link>
              {/* <Link href="/blurbs" className="icon cursorMagnetic">
                <IconThoughts />
              </Link> */}
            </>
          )}
          {pathName === 'about' && (
            <>
              {/* <div className="icon">
                <Link href="/about">
                  <IconMail />
                </Link>
              </div> */}
              <Link href="/" className="icon cursorMagnetic">
                <IconClose />
              </Link>
            </>
          )}
          {pathName === 'projects' && (
            <>
              {externalLink?.cached_url && (
                <a
                  href={externalLink.cached_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon cursorMagnetic"
                  data-external-link="true"
                >
                  <IconLinkOutside />
                </a>
              )}
              <div className="column-Icons_NextPrev">
                <div
                  onClick={clickPrev}
                  className={`${
                    hasPrev ? 'active' : 'disabled'
                  } icon icon-Wide icon-Rotate headerDesktop cursorMagnetic`}
                >
                  <IconArrowLong />
                </div>
                <div
                  onClick={clickPrev}
                  className={`${
                    hasPrev ? 'active' : 'disabled'
                  } icon icon-Rotate headerMobile cursorMagnetic`}
                >
                  <IconArrow />
                </div>
                <div className="projectNumber headerDesktop">
                  {currentProjectIndex + 1}/{projectSlugs.length}
                </div>
                <div
                  onClick={clickNext}
                  className={`${
                    hasNext ? 'active' : 'disabled'
                  } icon icon-Wide headerDesktop cursorMagnetic`}
                >
                  <IconArrowLong />
                </div>
                <div
                  onClick={clickNext}
                  className={`${
                    hasNext ? 'active' : 'disabled'
                  } icon headerMobile cursorMagnetic`}
                >
                  <IconArrow />
                </div>
              </div>
              <Link href="/" className="icon cursorMagnetic">
                <IconClose />
              </Link>
            </>
          )}
          {pathName === 'blurbs' && (
            <Link href="/" className="icon cursorMagnetic">
              <IconClose />
            </Link>
          )}
        </div>
      </Row>
    </div>
  );
};

export default BlokHead;
