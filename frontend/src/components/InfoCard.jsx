import { useState } from 'react';

/**
 * InfoCard Component
 * Expandable lesson content cards
 */
function InfoCard({ lesson }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const lessonContent = {
    perception: {
      title: 'Perception (Sense)',
      icon: '👁️',
      color: 'blue',
      bullets: [
        'Agents gather data through sensors, APIs, or user input',
        'Like human senses - vision, hearing, touch for digital systems',
        'Examples: cameras for vision, microphones for audio, databases for information'
      ],
      diagram: '📊 Environment → Sensors → Agent',
      example: 'A self-driving car uses cameras to see the road, radar to detect distance, and GPS for location.'
    },
    planning: {
      title: 'Reasoning & Planning',
      icon: '🧠',
      color: 'yellow',
      bullets: [
        'Agents analyze sensed data to understand the situation',
        'Break down goals into actionable steps',
        'Use algorithms like decision trees or neural networks'
      ],
      diagram: '🔍 Analyze → 🎯 Set Goal → 📋 Create Plan',
      example: 'A chess AI analyzes the board, predicts opponent moves, and plans its strategy.'
    },
    action: {
      title: 'Action & Tool Use',
      icon: '⚡',
      color: 'green',
      bullets: [
        'Agents execute their plans through actions',
        'Can use external tools and APIs to extend capabilities',
        'Actions affect the environment and produce observable results'
      ],
      diagram: '⚙️ Execute → 🌍 Environment Changes → 📈 Results',
      example: 'A chatbot uses search APIs to find information, then responds to your question.'
    },
    reflection: {
      title: 'Memory & Reflection',
      icon: '💭',
      color: 'purple',
      bullets: [
        'Agents store experiences and outcomes in memory',
        'Learn from success and failure to improve',
        'Update strategies based on past performance'
      ],
      diagram: '💾 Store Experience → 📊 Analyze → 🎓 Learn → ⬆️ Improve',
      example: 'A game AI remembers which strategies won, and uses them more often in future games.'
    }
  };

  const content = lessonContent[lesson] || lessonContent.perception;

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
    green: 'bg-green-500 hover:bg-green-600 border-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600 border-purple-600'
  };

  const expandedColorClasses = {
    blue: 'bg-blue-50 border-blue-500',
    yellow: 'bg-yellow-50 border-yellow-500',
    green: 'bg-green-50 border-green-500',
    purple: 'bg-purple-50 border-purple-500'
  };

  return (
    <div className="fixed right-4 top-20 z-40 max-w-sm">
      {/* Collapsed state - floating button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`${colorClasses[content.color]} text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105`}
          title="Learn about this concept"
        >
          <span className="text-2xl">{content.icon}</span>
          <span className="font-semibold">Learn More</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {/* Expanded state - full card */}
      {isExpanded && (
        <div className={`${expandedColorClasses[content.color]} border-l-4 rounded-lg shadow-2xl p-5 animate-slide-in-right`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{content.icon}</span>
              <h3 className="font-bold text-xl text-gray-800">{content.title}</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Key Points */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Key Concepts:</h4>
            <ul className="space-y-2">
              {content.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-600 font-bold flex-shrink-0">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Diagram */}
          <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
            <h4 className="font-semibold text-xs text-gray-600 mb-1">Flow:</h4>
            <p className="text-sm font-mono text-gray-800">{content.diagram}</p>
          </div>

          {/* Example */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3">
            <h4 className="font-semibold text-xs text-indigo-700 mb-1">Real-World Example:</h4>
            <p className="text-xs text-gray-700">{content.example}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default InfoCard;
