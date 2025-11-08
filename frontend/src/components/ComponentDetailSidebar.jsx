'use client'

import { useState } from 'react';

/**
 * ComponentDetailSidebar
 * Shows detailed information about a selected component including prerequisites and lessons
 */
export default function ComponentDetailSidebar({ component, lessons, progress, onProgressUpdate, onClose }) {
  if (!component) {
    return (
      <div className="w-[600px] h-screen bg-[#1e1e1e] text-white overflow-y-auto border-l border-[#3e3e42] flex-shrink-0 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-lg">Select a component to view lessons</p>
        </div>
      </div>
    );
  }

  // Get lessons in this component
  const componentLessons = lessons.filter(l => component.lessonIds.includes(l.id));
  
  // Calculate progress
  const completedCount = componentLessons.filter(l => progress[l.id] === 'completed').length;
  const totalCount = componentLessons.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
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
  };

  // Get status icon
  const getStatusIcon = (lessonId) => {
    const status = progress[lessonId] || 'not-started';
    if (status === 'completed') {
      return (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
    );
  };

  // Get prerequisites for this component
  // Removed: prerequisites section per request

  return (
    <div className="w-[600px] h-screen bg-[#1e1e1e] text-white overflow-y-auto border-l border-[#3e3e42] flex-shrink-0 animate-slide-in-right">
      {/* Header */}
      <div className="sticky top-0 bg-[#252526] border-b border-[#3e3e42] p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{component.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm font-semibold text-white">
              {completedCount} / {totalCount}
            </span>
          </div>
          <div className="w-full bg-[#3e3e42] rounded-full h-3 border border-[#4a4a4f] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-in-out ${
                progressPercentage === 100
                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                  : 'bg-gradient-to-r from-blue-400 to-blue-500'
              }`}
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Lessons Table */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Lessons</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#3e3e42]">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-400">Status</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-400">Star</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-400">Lesson</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-400">Difficulty</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {componentLessons.map((lesson, index) => {
                  const lessonStatus = progress[lesson.id] || 'not-started';
                  const isCompleted = lessonStatus === 'completed';
                  
                  return (
                    <tr
                      key={lesson.id}
                      className={`border-b border-[#3e3e42] hover:bg-[#2d2d30] transition-colors ${isCompleted ? 'bg-[#1e3a1e]/30' : ''}`}
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
                        <button className="text-gray-400 hover:text-yellow-400 transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      </td>
                      
                      {/* Lesson Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium text-sm">{lesson.title}</div>
                          </div>
                        </div>
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
                      <td className="py-3 px-3 text-sm text-gray-400">
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

