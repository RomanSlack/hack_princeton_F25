'use client'

import { useMemo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * NeetCodeRoadmap Component (Pure React)
 * Renders components in a simple responsive grid with progress bars
 */
export default function NeetCodeRoadmap({ components, lessons, progress, onComponentSelect }) {
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
      <div className="max-w-7xl mx-auto w-full">
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
