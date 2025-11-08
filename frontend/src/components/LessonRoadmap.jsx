'use client'

import { useMemo } from 'react';

/**
 * LessonRoadmap Component
 * Visual roadmap showing lesson dependencies and prerequisites
 */
export default function LessonRoadmap({ lessons, progress, onProgressUpdate }) {
  // Organize lessons by level (based on prerequisites)
  const organizedLessons = useMemo(() => {
    const levels = [];
    const processed = new Set();
    const remaining = [...lessons];

    // Level 0: Lessons with no prerequisites
    let currentLevel = remaining.filter(lesson => lesson.prerequisites.length === 0);
    levels.push(currentLevel);
    currentLevel.forEach(lesson => {
      processed.add(lesson.id);
      remaining.splice(remaining.findIndex(l => l.id === lesson.id), 1);
    });

    // Subsequent levels: Lessons whose prerequisites are all processed
    while (remaining.length > 0) {
      const nextLevel = remaining.filter(lesson =>
        lesson.prerequisites.every(prereqId => processed.has(prereqId))
      );

      if (nextLevel.length === 0) {
        // Handle circular dependencies or remaining lessons
        levels.push([...remaining]);
        break;
      }

      levels.push(nextLevel);
      nextLevel.forEach(lesson => {
        processed.add(lesson.id);
        remaining.splice(remaining.findIndex(l => l.id === lesson.id), 1);
      });
    }

    return levels;
  }, [lessons]);

  // Get progress color for a lesson
  const getProgressColor = (lessonId) => {
    const status = progress[lessonId] || 'not-started';
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-600';
      case 'in-progress':
        return 'bg-blue-500 border-blue-600';
      default:
        return 'bg-gray-300 border-gray-400';
    }
  };

  // Check if prerequisites are met
  const prerequisitesMet = (lesson) => {
    return lesson.prerequisites.every(prereqId => {
      const prereqProgress = progress[prereqId];
      return prereqProgress === 'completed' || prereqProgress === 'in-progress';
    });
  };

  // Draw connection line between lessons
  const drawConnection = (fromLesson, toLesson, fromX, fromY, toX, toY) => {
    const midX = (fromX + toX) / 2;
    return (
      <path
        key={`${fromLesson.id}-${toLesson.id}`}
        d={`M ${fromX} ${fromY} Q ${midX} ${fromY} ${midX} ${(fromY + toY) / 2} T ${toX} ${toY}`}
        stroke={progress[fromLesson.id] === 'completed' ? '#10b981' : '#9ca3af'}
        strokeWidth="2"
        fill="none"
        strokeDasharray={progress[fromLesson.id] === 'completed' ? '0' : '5,5'}
        opacity={prerequisitesMet(toLesson) ? 1 : 0.3}
      />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 overflow-x-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Roadmap</h2>
      
      <div className="relative min-h-[600px]">
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          {/* Draw connections */}
          {lessons.map(lesson =>
            lesson.prerequisites.map(prereqId => {
              const fromLesson = lessons.find(l => l.id === prereqId);
              if (!fromLesson) return null;

              const fromLevel = organizedLessons.findIndex(level => level.some(l => l.id === fromLesson.id));
              const toLevel = organizedLessons.findIndex(level => level.some(l => l.id === lesson.id));

              if (fromLevel === -1 || toLevel === -1) return null;

              const fromIndex = organizedLessons[fromLevel].findIndex(l => l.id === fromLesson.id);
              const toIndex = organizedLessons[toLevel].findIndex(l => l.id === lesson.id);

              const fromX = 120 + fromLevel * 250;
              const fromY = 100 + fromIndex * 140;
              const toX = 120 + toLevel * 250;
              const toY = 100 + toIndex * 140;

              return drawConnection(fromLesson, lesson, fromX, fromY, toX, toY);
            })
          )}
        </svg>

        {/* Render lessons by level */}
        <div className="relative" style={{ zIndex: 1 }}>
          {organizedLessons.map((level, levelIndex) => (
            <div
              key={levelIndex}
              className="inline-block align-top mr-8"
              style={{ width: '220px' }}
            >
              <div className="text-center mb-4">
                <span className="text-sm font-semibold text-gray-500">Level {levelIndex + 1}</span>
              </div>
              {level.map((lesson, lessonIndex) => {
                const canStart = prerequisitesMet(lesson);
                const lessonProgress = progress[lesson.id] || 'not-started';

                return (
                  <div
                    key={lesson.id}
                    className={`mb-4 p-4 rounded-lg border-2 ${getProgressColor(lesson.id)} ${
                      !canStart ? 'opacity-50' : ''
                    } transition-all hover:scale-105`}
                  >
                    <div className="text-white">
                      <h3 className="font-bold text-sm mb-1">{lesson.title}</h3>
                      <p className="text-xs opacity-90 mb-2">{lesson.focus}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize">
                          {lessonProgress === 'not-started'
                            ? 'Not Started'
                            : lessonProgress.replace('-', ' ')}
                        </span>
                        {canStart && (
                          <button
                            onClick={() => {
                              const newStatus =
                                lessonProgress === 'not-started'
                                  ? 'in-progress'
                                  : lessonProgress === 'in-progress'
                                  ? 'completed'
                                  : 'not-started';
                              onProgressUpdate(lesson.id, newStatus);
                            }}
                            className="px-2 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition"
                          >
                            {lessonProgress === 'not-started'
                              ? 'Start'
                              : lessonProgress === 'in-progress'
                              ? 'Complete'
                              : 'Reset'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span>Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500"></div>
            <span>Prerequisite Met</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-gray-400 border-dashed border"></div>
            <span>Prerequisite Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

