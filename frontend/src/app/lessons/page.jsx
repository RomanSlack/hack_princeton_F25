'use client'

import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import NeetCodeRoadmap from '../../components/NeetCodeRoadmap';
import ComponentDetailSidebar from '../../components/ComponentDetailSidebar';
import StarredLessonsSidebar from '../../components/StarredLessonsSidebar';
import { LESSONS } from '../../data/lessons';

// Component definitions - Group lessons into roadmap components
const COMPONENTS = [
  {
    id: 'foundations',
    name: 'Foundations',
    lessonIds: [1, 2, 3],
    dependencies: [],
  },
  {
    id: 'core-components',
    name: 'Core Components',
    lessonIds: [4, 5, 6, 7],
    dependencies: ['foundations'],
  },
  {
    id: 'advanced-components',
    name: 'Advanced Components',
    lessonIds: [8, 9, 10, 11],
    dependencies: ['core-components'],
  },
  {
    id: 'execution-orchestration',
    name: 'Execution & Orchestration',
    lessonIds: [12, 13, 14],
    dependencies: ['advanced-components'],
  },
  {
    id: 'advanced-architectures',
    name: 'Advanced Architectures',
    lessonIds: [15, 16, 17],
    dependencies: ['execution-orchestration'],
  },
  {
    id: 'protocols',
    name: 'Protocols',
    lessonIds: [18, 19, 20],
    dependencies: ['execution-orchestration'],
  },
  {
    id: 'frameworks',
    name: 'Frameworks',
    lessonIds: [21, 22, 23, 24, 25, 26],
    dependencies: ['execution-orchestration'],
  },
  {
    id: 'specialized-topics',
    name: 'Specialized Topics',
    lessonIds: [27, 28, 29, 30, 31, 32, 33],
    dependencies: ['frameworks', 'execution-orchestration'],
  },
];

// Progress tracking (in a real app, this would come from a backend/state management)
const getInitialProgress = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lessonProgress');
    return saved ? JSON.parse(saved) : {};
  }
  return {};
};

// Starred lessons tracking
const getInitialStarredLessons = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('starredLessons');
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

export default function LessonsPage() {
  const theme = useTheme();
  const [progress, setProgress] = useState(getInitialProgress);
  const [starredLessons, setStarredLessons] = useState(getInitialStarredLessons);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isStarredSidebarOpen, setIsStarredSidebarOpen] = useState(false);

  // Save progress to localStorage
  const updateProgress = (lessonId, status) => {
    const newProgress = { ...progress, [lessonId]: status };
    setProgress(newProgress);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lessonProgress', JSON.stringify(newProgress));
    }
  };

  // Toggle star for a lesson
  const toggleStar = (lessonId) => {
    const newStarred = starredLessons.includes(lessonId)
      ? starredLessons.filter(id => id !== lessonId)
      : [...starredLessons, lessonId];
    setStarredLessons(newStarred);
    if (typeof window !== 'undefined') {
      localStorage.setItem('starredLessons', JSON.stringify(newStarred));
    }
  };

  // Open sidebar with selected component
  const handleComponentSelect = (component) => {
    setSelectedComponent(component);
    setIsSidebarOpen(true);
    setIsStarredSidebarOpen(false); // Close starred sidebar if open
  };

  // Smoothly close sidebar, then clear content after transition
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setTimeout(() => setSelectedComponent(null), 300); // match CSS duration
  };

  // Open starred sidebar
  const handleStarredClick = () => {
    setIsStarredSidebarOpen(true);
    setIsSidebarOpen(false); // Close component sidebar if open
    setSelectedComponent(null);
  };

  // Close starred sidebar
  const handleCloseStarredSidebar = () => {
    setIsStarredSidebarOpen(false);
  };

  return (
    <div className={`min-h-screen ${theme.bg.primary} flex flex-row`}>
      {/* Main Content - Roadmap */}
      <div className="flex-1 relative">
        <div className={`h-screen ${theme.bg.primary} overflow-hidden`}>
          <NeetCodeRoadmap
            components={COMPONENTS}
            lessons={LESSONS}
            progress={progress}
            onComponentSelect={handleComponentSelect}
            onStarredClick={handleStarredClick}
            starredCount={starredLessons.length}
          />
        </div>
      </div>

      {/* Right Sidebar - Component or Starred Lessons */}
      <div
        className="h-screen transition-[width] duration-300 ease-out overflow-hidden"
        style={{ width: (isSidebarOpen || isStarredSidebarOpen) ? '600px' : '0px' }}
      >
        <div
          className="h-full"
          style={{
            transform: (isSidebarOpen || isStarredSidebarOpen) ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 300ms ease-out',
            width: '600px',
          }}
        >
          {isStarredSidebarOpen ? (
            <StarredLessonsSidebar
              starredLessons={starredLessons}
              lessons={LESSONS}
              progress={progress}
              onProgressUpdate={updateProgress}
              onStarToggle={toggleStar}
              onClose={handleCloseStarredSidebar}
            />
          ) : (
            <ComponentDetailSidebar
              component={selectedComponent}
              lessons={LESSONS}
              progress={progress}
              onProgressUpdate={updateProgress}
              onClose={handleCloseSidebar}
              starredLessons={starredLessons}
              onStarToggle={toggleStar}
            />
          )}
        </div>
      </div>
    </div>
  );
}
