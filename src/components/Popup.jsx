import { useState, useEffect, useRef } from 'react';

/**
 * Popup Component
 * Modal dialog for editing node properties
 *
 * @param {Object} node - Node being edited
 * @param {Function} onSave - Callback to save changes
 * @param {Function} onDelete - Callback to delete node
 * @param {Function} onClose - Callback to close popup
 */
function Popup({ node, onSave, onDelete, onClose }) {
  const [label, setLabel] = useState(node.label);
  const [description, setDescription] = useState(node.description || '');
  const popupRef = useRef(null);

  /**
   * Handle save button click
   */
  const handleSave = () => {
    onSave(node.id, { label, description });
  };

  /**
   * Handle delete button click
   */
  const handleDelete = () => {
    if (window.confirm(`Delete "${node.label}" node?`)) {
      onDelete(node.id);
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  /**
   * Handle click outside popup to close
   */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Focus input on mount
  useEffect(() => {
    const input = popupRef.current?.querySelector('input');
    input?.focus();
    input?.select();
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        ref={popupRef}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Edit Block</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Label Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              placeholder="Enter block label..."
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition resize-none"
              placeholder="Enter block description..."
              rows={3}
            />
          </div>

          {/* Node Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>ID:</span>
              <span className="font-mono">{node.id}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Position:</span>
              <span className="font-mono">
                ({Math.round(node.x)}, {Math.round(node.y)})
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-4 pt-4 border-t text-xs text-gray-500 text-center">
          <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> to close •
          <kbd className="px-2 py-1 bg-gray-100 rounded ml-1">Ctrl+Enter</kbd> to save
        </div>
      </div>
    </div>
  );
}

export default Popup;
