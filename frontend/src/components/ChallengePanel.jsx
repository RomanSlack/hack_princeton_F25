import { useState } from 'react';

/**
 * ChallengePanel Component
 * Interactive challenges and scenarios for students
 */
function ChallengePanel({ onChallengeSelect, currentChallenge }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const challenges = [
    {
      id: 'obstacle-avoidance',
      title: 'Obstacle Avoidance',
      difficulty: 'Beginner',
      icon: '🚧',
      description: 'Help your agent navigate around obstacles to reach the goal.',
      objectives: [
        'Add SENSE to detect obstacles',
        'Use PLAN to find a path',
        'Connect ACT to move',
        'Add REFLECT to learn'
      ],
      hint: 'Start by making your agent see! Drag a SENSE block first.'
    },
    {
      id: 'efficient-path',
      title: 'Find Efficient Path',
      difficulty: 'Intermediate',
      icon: '🎯',
      description: 'Make your agent find the shortest path to the goal.',
      objectives: [
        'Sense multiple possible paths',
        'Plan the shortest route',
        'Execute the movement',
        'Reflect on efficiency'
      ],
      hint: 'Planning is key! Your agent needs to think before moving.'
    },
    {
      id: 'learning-agent',
      title: 'Learning from Mistakes',
      difficulty: 'Intermediate',
      icon: '🧠',
      description: 'Build an agent that improves after failing.',
      objectives: [
        'Try to reach goal (will fail)',
        'Use REFLECT to analyze failure',
        'Adjust strategy in PLAN',
        'Succeed on retry'
      ],
      hint: 'Failure is part of learning! Add REFLECT to remember what didn\'t work.'
    },
    {
      id: 'freeform',
      title: 'Free Exploration',
      difficulty: 'Open',
      icon: '🎨',
      description: 'Experiment freely and create your own agent behavior!',
      objectives: [
        'Try different block combinations',
        'Observe what happens',
        'Build your intuition'
      ],
      hint: 'No rules! Play around and see what your agent can do.'
    }
  ];

  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-700 border-green-300',
    Intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Advanced: 'bg-red-100 text-red-700 border-red-300',
    Open: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  return (
    <div className="fixed left-4 bottom-4 z-40 max-w-sm">
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-all"
        >
          <span className="text-2xl">🎮</span>
          <span className="font-semibold">Challenges</span>
        </button>
      )}

      {isExpanded && (
        <div className="bg-white rounded-xl shadow-2xl border-2 border-indigo-200 overflow-hidden max-h-96 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <h3 className="font-bold text-lg">Learning Challenges</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="hover:bg-white/20 rounded p-1 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Challenges List */}
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {challenges.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => onChallengeSelect(challenge)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                  currentChallenge?.id === challenge.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-2xl flex-shrink-0">{challenge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-800 truncate">{challenge.title}</h4>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded border ${difficultyColors[challenge.difficulty]} mt-1`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">{challenge.description}</p>

                {/* Objectives */}
                <div className="text-xs text-gray-500">
                  <span className="font-semibold">Goals:</span>
                  <ul className="mt-1 space-y-0.5">
                    {challenge.objectives.slice(0, 2).map((obj, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <span className="text-indigo-600">•</span>
                        {obj}
                      </li>
                    ))}
                    {challenge.objectives.length > 2 && (
                      <li className="text-gray-400">+ {challenge.objectives.length - 2} more...</li>
                    )}
                  </ul>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChallengePanel;
