'use client';

import { createContext, useContext, ReactNode } from 'react';

interface ProjectData {
  slug: string;
  year: string;
  title: string;
}

interface ProjectsContextType {
  projectSlugs: string[];
  projects: ProjectData[];
}

const ProjectsContext = createContext<ProjectsContextType>({
  projectSlugs: [],
  projects: [],
});

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}

interface ProjectsProviderProps {
  children: ReactNode;
  projects: ProjectData[];
}

export function ProjectsProvider({
  children,
  projects,
}: ProjectsProviderProps) {
  const projectSlugs = projects.map((p) => p.slug);

  return (
    <ProjectsContext.Provider value={{ projectSlugs, projects }}>
      {children}
    </ProjectsContext.Provider>
  );
}
