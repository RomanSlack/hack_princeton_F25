/**
 * Tooltip Component
 * Educational tooltips that appear on hover
 */
function Tooltip({ block, position = 'right' }) {
  const getTooltipContent = (blockType) => {
    const tooltips = {
      sense: {
        name: 'Sense (Perception)',
        explanation: 'Gathers data from the environment for the agent.',
        example: 'Drag this to detect nearby obstacles, enemies, or items.',
        icon: '👁️'
      },
      plan: {
        name: 'Plan (Reasoning)',
        explanation: 'Analyzes sensed data and decides what to do next.',
        example: 'Connect after Sense to calculate the best path or strategy.',
        icon: '🧠'
      },
      act: {
        name: 'Act (Execution)',
        explanation: 'Executes the planned action in the environment.',
        example: 'Use this to move, attack, or interact with objects.',
        icon: '⚡'
      },
      reflect: {
        name: 'Reflect (Learning)',
        explanation: 'Learns from outcomes and updates memory for future decisions.',
        example: 'Connect after Act to help your agent remember what worked.',
        icon: '💭'
      }
    };

    return tooltips[blockType] || tooltips.sense;
  };

  const content = getTooltipContent(block);

  const positionClasses = {
    right: 'left-full ml-2',
    left: 'right-full mr-2',
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2'
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-50 w-64 pointer-events-none`}>
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{content.icon}</span>
          <h4 className="font-bold text-sm">{content.name}</h4>
        </div>

        {/* Explanation */}
        <p className="text-xs text-gray-300 mb-2">
          {content.explanation}
        </p>

        {/* Example/Tip */}
        <div className="bg-indigo-900/40 rounded px-2 py-1 border-l-2 border-indigo-400">
          <p className="text-xs text-indigo-200">
            <span className="font-semibold">💡 Tip: </span>
            {content.example}
          </p>
        </div>

        {/* Arrow pointer */}
        <div
          className={`absolute w-3 h-3 bg-gray-900 border-gray-700 transform rotate-45 ${
            position === 'right' ? 'left-0 -ml-1.5 top-4 border-l border-b' :
            position === 'left' ? 'right-0 -mr-1.5 top-4 border-r border-t' :
            position === 'top' ? 'top-full -mt-1.5 left-4 border-b border-r' :
            'bottom-full -mb-1.5 left-4 border-t border-l'
          }`}
        />
      </div>
    </div>
  );
}

export default Tooltip;
