import { useEffect, useState } from 'react';

/**
 * HintSystem Component
 * Dynamic hints that appear based on agent performance
 */
function HintSystem({ nodes, lastAction, onClose }) {
  const [currentHint, setCurrentHint] = useState(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Generate hints based on block configuration and actions
    const generateHint = () => {
      const hasBlock = (type) => nodes.some(n => n.label === type);

      // Success hints
      if (lastAction?.type === 'success') {
        if (hasBlock('SENSE') && hasBlock('ACT')) {
          return {
            type: 'success',
            icon: '🎉',
            title: 'Great Job!',
            message: 'Your agent sensed the environment before acting. This is the foundation of intelligent behavior!'
          };
        }
        if (hasBlock('PLAN') && hasBlock('ACT')) {
          return {
            type: 'success',
            icon: '✨',
            title: 'Excellent Planning!',
            message: 'Your agent planned before acting. Smart agents think before they move!'
          };
        }
        if (hasBlock('REFLECT')) {
          return {
            type: 'success',
            icon: '🌟',
            title: 'Learning Enabled!',
            message: 'Your agent can now learn from its actions. This makes it smarter over time!'
          };
        }
      }

      // Failure/guidance hints
      if (lastAction?.type === 'collision') {
        if (!hasBlock('SENSE')) {
          return {
            type: 'error',
            icon: '⚠️',
            title: 'Agent is Blind!',
            message: "Your agent can't see obstacles. Add a SENSE block before ACT to detect objects.",
            suggestion: 'Try: SENSE → ACT'
          };
        }
      }

      // Missing block hints
      if (nodes.length === 0) {
        return {
          type: 'info',
          icon: '👋',
          title: 'Get Started',
          message: 'Drag blocks from the left to build your agent. Start with SENSE to help your agent see!'
        };
      }

      if (hasBlock('ACT') && !hasBlock('SENSE')) {
        return {
          type: 'warning',
          icon: '🤔',
          title: 'Acting Blindly',
          message: 'Your agent acts without sensing. Add a SENSE block to gather information first.',
          suggestion: 'Recommended order: SENSE → PLAN → ACT → REFLECT'
        };
      }

      if (hasBlock('SENSE') && hasBlock('ACT') && !hasBlock('PLAN')) {
        return {
          type: 'info',
          icon: '💡',
          title: 'Add Planning',
          message: 'Your agent senses and acts, but doesn\'t plan. Add a PLAN block to make better decisions.',
          suggestion: 'Try: SENSE → PLAN → ACT'
        };
      }

      if (hasBlock('ACT') && !hasBlock('REFLECT')) {
        return {
          type: 'info',
          icon: '🎯',
          title: 'Enable Learning',
          message: 'Add a REFLECT block to help your agent learn from experience and improve over time.',
          suggestion: 'Complete the cycle: SENSE → PLAN → ACT → REFLECT'
        };
      }

      return null;
    };

    const hint = generateHint();
    if (hint) {
      setCurrentHint(hint);
      setShowHint(true);
    }
  }, [nodes, lastAction]);

  if (!showHint || !currentHint) return null;

  const typeStyles = {
    success: 'bg-green-50 border-green-500 text-green-900',
    error: 'bg-red-50 border-red-500 text-red-900',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
    info: 'bg-blue-50 border-blue-500 text-blue-900'
  };

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className={`${typeStyles[currentHint.type]} border-l-4 rounded-lg shadow-xl p-4 max-w-md`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">{currentHint.icon}</span>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{currentHint.title}</h3>
            <p className="text-sm mb-2">{currentHint.message}</p>
            {currentHint.suggestion && (
              <div className="bg-white/50 rounded px-3 py-2 text-xs font-mono mt-2">
                {currentHint.suggestion}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setShowHint(false);
              if (onClose) onClose();
            }}
            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default HintSystem;
