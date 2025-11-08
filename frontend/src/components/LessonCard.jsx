'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * LessonCard Component
 * Displays a single lesson with progress tracking
 */
export default function LessonCard({ lesson, progress, onProgressUpdate, allLessons }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  // Check if prerequisites are met
  const prerequisitesMet = lesson.prerequisites.every(prereqId => {
    const prereqProgress = allLessons.find(l => l.id === prereqId)?.id;
    return prereqProgress && (progress[prereqId] === 'completed');
  });

  // Get progress badge color
  const getProgressColor = () => {
    switch (progress) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = () => {
    switch (lesson.difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-700';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'Advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleProgressChange = (newStatus) => {
    onProgressUpdate(lesson.id, newStatus);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
        prerequisitesMet ? 'border-gray-200' : 'border-orange-200 opacity-75'
      }`}
    >
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{lesson.title}</h3>
              {!prerequisitesMet && lesson.prerequisites.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  Prerequisites Required
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-indigo-600 mb-1">{lesson.focus}</p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getDifficultyColor()}`}>
            {lesson.difficulty}
          </span>
        </div>

        {/* Learning Objective */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{lesson.learningObjective}</p>

        {/* Tool Badge */}
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs text-gray-500">Tool: {lesson.tool}</span>
        </div>

        {/* Progress Status */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getProgressColor()} mb-4`}>
          {progress === 'completed' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-xs font-semibold capitalize">
            {progress === 'completed' ? 'Completed' : 'Not Started'}
          </span>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-down">
            <p className="text-sm text-gray-700 mb-3">{lesson.description}</p>
            
            {/* Prerequisites */}
            {lesson.prerequisites.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">Prerequisites:</p>
                <div className="flex flex-wrap gap-1">
                  {lesson.prerequisites.map(prereqId => {
                    const prereq = allLessons.find(l => l.id === prereqId);
                    const prereqProgress = progress[prereqId];
                    return (
                      <span
                        key={prereqId}
                        className={`text-xs px-2 py-1 rounded ${
                          prereqProgress === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {prereq?.title || `Lesson ${prereqId}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Estimated Time */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Estimated: {lesson.estimatedTime}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            {isExpanded ? 'Show Less' : 'Learn More'}
          </button>
          {prerequisitesMet && (
            <div className="flex gap-1">
              <button
                onClick={() => router.push('/builder')}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                title="Open Agent Builder"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Try It
              </button>
              {progress !== 'completed' && (
                <button
                  onClick={() => handleProgressChange('completed')}
                  className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Mark Complete
                </button>
              )}
              {progress !== 'not-started' && (
                <button
                  onClick={() => handleProgressChange('not-started')}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

