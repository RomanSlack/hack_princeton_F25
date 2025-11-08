import { useState } from 'react';

/**
 * Sidebar Component
 * Scratch.io-style left sidebar with collapsible categories
 * Each category contains draggable blocks that can be added to the canvas
 *
 * @param {Function} onBlockDragStart - Called when user starts dragging a block from sidebar
 */
function Sidebar({ onBlockDragStart }) {
  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState({
    core: true,
  });

  // Define block categories - Agentic AI core components
  const categories = [
    {
      id: 'core',
      name: 'Agent Components',
      color: 'category-core',
      blocks: [
        { id: 'sense', label: 'SENSE', description: 'Perceive and gather data from environment' },
        { id: 'plan', label: 'PLAN', description: 'Break down goals into actionable steps' },
        { id: 'act', label: 'ACT', description: 'Execute actions in the environment' },
        { id: 'reflect', label: 'REFLECT', description: 'Learn from outcomes and improve' },
      ]
    }
  ];

  /**
   * Toggle category expansion
   */
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  /**
   * Handle drag start from sidebar
   * Creates a new block that will be placed on canvas
   */
  const handleDragStart = (e, block, category) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      blockType: block.id,
      label: block.label,
      description: block.description,
      category: category.id,
      color: category.color
    }));

    // Call parent handler if provided
    if (onBlockDragStart) {
      onBlockDragStart(block, category);
    }
  };

  return (
    <div className="w-64 h-screen bg-white shadow-md flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">Agent Blocks</h2>
      </div>

      {/* Blocks List - Simple vertical rows */}
      <div className="flex-1 overflow-y-auto">
        {categories.map(category => (
          <div key={category.id} className="border-b border-gray-100">
            {/* Category Header */}
            <div
              className="px-6 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700 text-sm">{category.name}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 text-gray-500 ${
                    expandedCategories[category.id] ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            {/* Category Blocks - Simple rows */}
            {expandedCategories[category.id] && (
              <div className="bg-white">
                {category.blocks.map(block => (
                  <div
                    key={block.id}
                    className="px-6 py-3 border-b border-gray-50 cursor-move hover:bg-blue-50 transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(e, block, category)}
                    title={block.description}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{block.label}</span>
                      <span className="text-xs text-gray-400">⋮⋮</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
