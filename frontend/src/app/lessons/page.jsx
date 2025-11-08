'use client'

import { useState, useMemo } from 'react';
import LessonCard from '../../components/LessonCard';
import LessonRoadmap from '../../components/LessonRoadmap';
import SearchBar from '../../components/SearchBar';

// Lesson data structure
const LESSONS = [
  {
    id: 1,
    title: 'Perception',
    focus: 'Input & Environment Awareness',
    learningObjective: 'Learn how agents "see" the world via sensors or context',
    tool: 'Observation tool',
    description: 'Understanding how AI agents perceive and interpret their environment through various input mechanisms.',
    prerequisites: [],
    difficulty: 'Beginner',
    estimatedTime: '15 min',
  },
  {
    id: 2,
    title: 'Reasoning & Planning',
    focus: 'Task decomposition',
    learningObjective: 'Understand how agents plan steps from goals',
    tool: 'Next-step planner',
    description: 'Learn how agents break down complex goals into actionable steps and create execution plans.',
    prerequisites: [1],
    difficulty: 'Intermediate',
    estimatedTime: '25 min',
  },
  {
    id: 3,
    title: 'Tool Use',
    focus: 'External API calls',
    learningObjective: 'Learn how agents extend themselves via tools',
    tool: 'Python backend API tools',
    description: 'Explore how agents interact with external systems and APIs to extend their capabilities.',
    prerequisites: [1, 2],
    difficulty: 'Intermediate',
    estimatedTime: '30 min',
  },
  {
    id: 4,
    title: 'Memory & Reflection',
    focus: 'Context updates',
    learningObjective: 'Grasp how memory helps agents improve',
    tool: 'State tracking system',
    description: 'Understand how agents maintain and update their internal state and learn from past experiences.',
    prerequisites: [2],
    difficulty: 'Intermediate',
    estimatedTime: '20 min',
  },
  {
    id: 5,
    title: 'Multi-Agent Coordination',
    focus: 'Collaboration',
    learningObjective: 'Observe emergent behavior from multiple agents',
    tool: 'Shared world state',
    description: 'Discover how multiple agents can work together and create emergent behaviors through coordination.',
    prerequisites: [2, 3],
    difficulty: 'Advanced',
    estimatedTime: '40 min',
  },
  {
    id: 6,
    title: 'Prompt Engineering',
    focus: 'Command Design',
    learningObjective: 'See how phrasing affects reasoning',
    tool: 'Prompt block editing',
    description: 'Master the art of crafting effective prompts that guide agent behavior and reasoning.',
    prerequisites: [1],
    difficulty: 'Beginner',
    estimatedTime: '20 min',
  },
  {
    id: 7,
    title: 'Failure & Debugging',
    focus: 'Feedback loops',
    learningObjective: 'Learn how agents recover and self-correct',
    tool: 'Result-based scoring',
    description: 'Explore how agents handle failures, debug issues, and implement self-correction mechanisms.',
    prerequisites: [2, 4],
    difficulty: 'Advanced',
    estimatedTime: '35 min',
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

export default function LessonsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [progress, setProgress] = useState(getInitialProgress);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'roadmap'

  // Save progress to localStorage
  const updateProgress = (lessonId, status) => {
    const newProgress = { ...progress, [lessonId]: status };
    setProgress(newProgress);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lessonProgress', JSON.stringify(newProgress));
    }
  };

  // Filter lessons based on search and section
  const filteredLessons = useMemo(() => {
    let filtered = LESSONS;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        lesson =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.focus.toLowerCase().includes(query) ||
          lesson.learningObjective.toLowerCase().includes(query) ||
          lesson.tool.toLowerCase().includes(query) ||
          lesson.description.toLowerCase().includes(query)
      );
    }

    // Filter by section
    if (selectedSection !== 'all') {
      filtered = filtered.filter(lesson => {
        const status = progress[lesson.id] || 'not-started';
        return status === selectedSection;
      });
    }

    return filtered;
  }, [searchQuery, selectedSection, progress]);

  // Get progress statistics
  const stats = useMemo(() => {
    const total = LESSONS.length;
    const completed = Object.values(progress).filter(s => s === 'completed').length;
    const inProgress = Object.values(progress).filter(s => s === 'in-progress').length;
    const notStarted = total - completed - inProgress;

    return { total, completed, inProgress, notStarted };
  }, [progress]);

  // Get sections for filtering
  const sections = [
    { id: 'all', label: 'All Lessons', count: LESSONS.length },
    { id: 'not-started', label: 'Not Started', count: stats.notStarted },
    { id: 'in-progress', label: 'In Progress', count: stats.inProgress },
    { id: 'completed', label: 'Completed', count: stats.completed },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Agentic AI Lessons</h1>
              <p className="mt-2 text-lg text-gray-600">
                Master the principles of agentic AI through interactive lessons
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'roadmap' : 'grid')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                {viewMode === 'grid' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Roadmap View
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Grid View
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          {/* Progress Stats */}
          <div className="mt-4 flex gap-4">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedSection === section.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {section.label} ({section.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'roadmap' ? (
          <LessonRoadmap lessons={LESSONS} progress={progress} onProgressUpdate={updateProgress} />
        ) : (
          <>
            {filteredLessons.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No lessons found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map(lesson => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    progress={progress[lesson.id] || 'not-started'}
                    onProgressUpdate={updateProgress}
                    allLessons={LESSONS}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

