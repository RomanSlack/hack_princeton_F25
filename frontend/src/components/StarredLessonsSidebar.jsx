'use client'

import { useTheme } from '../contexts/ThemeContext';
import Link from 'next/link';

/**
 * StarredLessonsSidebar
 * Shows starred lessons in a table format with Status, Star, Lesson, Difficulty, Time
 */
export default function StarredLessonsSidebar({ starredLessons, lessons, progress, onProgressUpdate, onStarToggle, onClose }) {
  const theme = useTheme();
  
  // Get starred lessons data
  const starredLessonsData = lessons.filter(l => starredLessons.includes(l.id));
  
  if (starredLessonsData.length === 0) {
    return (
      <div className={`w-[600px] h-screen ${theme.bg.secondary} overflow-y-auto border-l ${theme.border.primary} flex-shrink-0 animate-slide-in-right`}>
        {/* Header */}
        <div className={`sticky top-0 ${theme.bg.secondary} border-b ${theme.border.primary} p-6 z-10`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Starred Lessons</h2>
            </div>
            <button
              onClick={onClose}
              className={`${theme.text.tertiary} hover:text-gray-900 dark:hover:text-white transition`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Empty State */}
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className={`text-center ${theme.text.tertiary}`}>
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className={`text-lg ${theme.text.secondary}`}>No starred lessons yet</p>
            <p className={`text-sm ${theme.text.tertiary} mt-2`}>Star lessons to see them here</p>
          </div>
        </div>
      </div>
    );
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    if (theme.isDark) {
      switch (difficulty) {
        case 'Beginner':
          return 'text-green-400 bg-green-900/30 border-green-700';
        case 'Intermediate':
          return 'text-orange-400 bg-orange-900/30 border-orange-700';
        case 'Advanced':
          return 'text-red-400 bg-red-900/30 border-red-700';
        default:
          return 'text-gray-400 bg-gray-800 border-gray-700';
      }
    } else {
      switch (difficulty) {
        case 'Beginner':
          return 'text-green-600 bg-green-50 border-green-200';
        case 'Intermediate':
          return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'Advanced':
          return 'text-red-600 bg-red-50 border-red-200';
        default:
          return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    }
  };

  // Get status icon
  const getStatusIcon = (lessonId) => {
    const status = progress[lessonId] || 'not-started';
    if (status === 'completed') {
      return (
        <svg className={`w-5 h-5 ${theme.isDark ? 'text-green-400' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <div className={`w-5 h-5 border-2 ${theme.border.secondary} rounded`}></div>
    );
  };

  return (
    <div className={`w-[600px] h-screen ${theme.bg.secondary} overflow-y-auto border-l ${theme.border.primary} flex-shrink-0 animate-slide-in-right`}>
      {/* Header */}
      <div className={`sticky top-0 ${theme.bg.secondary} border-b ${theme.border.primary} p-6 z-10`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Starred Lessons</h2>
          </div>
          <button
            onClick={onClose}
            className={`${theme.text.tertiary} hover:text-gray-900 dark:hover:text-white transition`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Lessons Table */}
        <div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme.border.primary}`}>
                  <th className={`text-left py-2 px-3 text-sm font-semibold ${theme.text.tertiary}`}>Status</th>
                  <th className={`text-left py-2 px-3 text-sm font-semibold ${theme.text.tertiary}`}>Star</th>
                  <th className={`text-left py-2 px-3 text-sm font-semibold ${theme.text.tertiary}`}>Lesson</th>
                  <th className={`text-left py-2 px-3 text-sm font-semibold ${theme.text.tertiary}`}>Difficulty</th>
                  <th className={`text-left py-2 px-3 text-sm font-semibold ${theme.text.tertiary}`}>Time</th>
                </tr>
              </thead>
              <tbody>
                {starredLessonsData.map((lesson) => {
                  const lessonStatus = progress[lesson.id] || 'not-started';
                  const isCompleted = lessonStatus === 'completed';
                  
                  return (
                    <tr
                      key={lesson.id}
                      className={`border-b ${theme.border.primary} hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary transition-colors ${isCompleted ? theme.components.completedLesson.bg : ''}`}
                    >
                      {/* Status */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => {
                            const newStatus = lessonStatus === 'completed' ? 'not-started' : 'completed';
                            onProgressUpdate(lesson.id, newStatus);
                          }}
                          className="flex items-center justify-center"
                        >
                          {getStatusIcon(lesson.id)}
                        </button>
                      </td>
                      
                      {/* Star */}
                      <td className="py-3 px-3">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onStarToggle) {
                              onStarToggle(lesson.id);
                            }
                          }}
                          className={`transition-colors ${
                            starredLessons.includes(lesson.id)
                              ? 'text-yellow-400 hover:text-yellow-500'
                              : 'text-gray-400 hover:text-yellow-400'
                          }`}
                          title={starredLessons.includes(lesson.id) ? 'Unstar lesson' : 'Star lesson'}
                        >
                          <svg 
                            className="w-5 h-5" 
                            fill={starredLessons.includes(lesson.id) ? 'currentColor' : 'none'} 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      </td>
                      
                      {/* Lesson Name */}
                      <td className="py-3 px-3">
                        <Link 
                          href={`/lessons/${lesson.id}`}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <div>
                            <div className={`font-medium text-sm ${theme.text.primary} hover:underline`}>
                              {lesson.title}
                            </div>
                            <div className={`text-xs ${theme.text.tertiary} mt-0.5`}>
                              {lesson.focus}
                            </div>
                          </div>
                        </Link>
                      </td>
                      
                      {/* Difficulty */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getDifficultyColor(lesson.difficulty)}`}
                        >
                          {lesson.difficulty}
                        </span>
                      </td>
                      
                      {/* Time */}
                      <td className={`py-3 px-3 text-sm ${theme.text.tertiary}`}>
                        {lesson.estimatedTime}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

