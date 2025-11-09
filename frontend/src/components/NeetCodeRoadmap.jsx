'use client'

import { useMemo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * NeetCodeRoadmap Component (Pure React)
 * Renders components in a simple responsive grid with progress bars
 */
export default function NeetCodeRoadmap({ components, lessons, progress, onComponentSelect, onStarredClick, starredCount = 0 }) {
  const theme = useTheme();
  // Chunk to rows of 3 (grid)
  const organizedComponents = useMemo(() => {
    const perRow = 2;
    const rows = [];
    for (let i = 0; i < components.length; i += perRow) {
      rows.push(components.slice(i, i + perRow));
    }
    return rows;
  }, [components]);

  // Calculate per-component progress
  const getComponentProgress = useCallback((component) => {
    const componentLessons = lessons.filter(l => component.lessonIds.includes(l.id));
    if (componentLessons.length === 0) return 0;
    const completed = componentLessons.filter(l => progress[l.id] === 'completed').length;
    return (completed / componentLessons.length) * 100;
  }, [lessons, progress]);

  return (
    <div className={`w-full h-full ${theme.bg.primary} p-6 overflow-auto flex items-center`}>
      <div className="max-w-4xl mx-auto w-full">
        {/* Starred Button */}
        {onStarredClick && (
          <div className="mb-6 flex justify-start relative">
            <button
              onClick={onStarredClick}
              className={`${theme.components.card.bg} rounded-xl border-2 p-2 ${theme.text.primary} transition-all hover:scale-105 flex items-center justify-center ${theme.components.card.border} absolute`}
              style={{ left: '13px', bottom: '5px' }}
            >
              <div className={`font-bold text-sm ${theme.text.primary} flex items-center gap-2`}>
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Starred
              </div>
            </button>
          </div>
        )}
        
        {organizedComponents.map((row, rowIdx) => (
          <div key={rowIdx} className="flex flex-wrap justify-center gap-8 mb-10">
            {row.map((component) => {
              const progressPercent = Math.round(getComponentProgress(component));
              return (
                <button
                  key={component.id}
                  onClick={() => onComponentSelect(component)}
                  className={`${theme.components.card.bg} rounded-xl border-2 px-8 py-6 ${theme.text.primary} transition-all hover:scale-105 flex flex-col items-center justify-center ${theme.components.card.border} text-center`}
                  style={{
                    width: '420px',
                    height: '100px',
                  }}
                >
                  <div className={`font-bold text-lg ${theme.text.primary} mb-3`}>
                    {component.name}
                  </div>
                  <div className={`w-full ${theme.components.progressBar.bg} rounded-full h-4 border ${theme.components.progressBar.border} overflow-hidden relative`}>
                    <div
                      className={`h-full transition-all duration-500 ease-in-out ${
                        progressPercent === 100
                          ? 'bg-gradient-to-r from-green-400 to-green-500'
                          : 'bg-gradient-to-r from-blue-400 to-blue-500'
                      }`}
                      style={{ width: `${progressPercent}%`, transition: 'width 500ms ease-in-out' }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
