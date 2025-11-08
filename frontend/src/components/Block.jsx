import { useState, useRef, useEffect } from 'react';

/**
 * Block Component
 * Represents a draggable node on the canvas
 *
 * @param {Object} node - Node data { id, label, description, x, y }
 * @param {Function} onDrag - Callback when block is being dragged
 * @param {Function} onDragEnd - Callback when drag ends
 * @param {Function} onClick - Callback when block is clicked
 * @param {Boolean} isSelected - Whether this block is selected in connection mode
 * @param {Boolean} isConnectionMode - Whether the app is in connection mode
 */
function Block({ node, onDrag, onDragEnd, onClick, isSelected = false, isConnectionMode = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const blockRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: node.x, y: node.y });
  const clickStartTime = useRef(0);

  /**
   * Get block color based on label type
   */
  const getBlockColor = (label) => {
    const colors = {
      Start: 'bg-green-100 border-green-400 text-green-800',
      Attack: 'bg-red-100 border-red-400 text-red-800',
      Defend: 'bg-blue-100 border-blue-400 text-blue-800',
      Speak: 'bg-purple-100 border-purple-400 text-purple-800',
    };
    return colors[label] || 'bg-gray-100 border-gray-400 text-gray-800';
  };

  /**
   * Handle mouse down - start drag
   */
  const handleMouseDown = (e) => {
    // Prevent default to avoid text selection
    e.preventDefault();

    // In connection mode, clicking should not drag
    if (isConnectionMode) {
      clickStartTime.current = Date.now();
      return;
    }

    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: node.x, y: node.y };
  };

  /**
   * Handle mouse move - update position during drag
   */
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    const newX = initialPos.current.x + deltaX;
    const newY = initialPos.current.y + deltaY;

    // Constrain to canvas bounds (with some margin)
    const constrainedX = Math.max(0, Math.min(newX, window.innerWidth - 150));
    const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - 100));

    onDrag(node.id, constrainedX, constrainedY);
  };

  /**
   * Handle mouse up - end drag or handle connection mode click
   */
  const handleMouseUp = (e) => {
    // Handle connection mode click
    if (isConnectionMode) {
      e.stopPropagation();
      const clickDuration = Date.now() - clickStartTime.current;
      // Only trigger if it's a quick click (not a drag attempt)
      if (clickDuration < 200) {
        onClick(node);
      }
      return;
    }

    // Handle normal drag end
    if (isDragging) {
      setIsDragging(false);
      onDragEnd(node.id, node.x, node.y);
    }
  };

  /**
   * Handle double click - open edit popup
   * Only in normal mode (not connection mode)
   */
  const handleDoubleClick = (e) => {
    if (!isConnectionMode) {
      e.stopPropagation();
      onClick(node);
    }
  };

  // Set up global mouse event listeners during drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, node.x, node.y]);

  return (
    <div
      ref={blockRef}
      className={`
        block
        ${getBlockColor(node.label)}
        ${isDragging ? 'dragging' : ''}
        ${isSelected ? 'ring-4 ring-orange-400 ring-offset-2' : ''}
        ${isConnectionMode ? 'hover:ring-2 hover:ring-yellow-400' : ''}
        px-6 py-4 rounded-lg border-2 shadow-lg
        min-w-[120px] text-center
        transition-all duration-200
      `}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        cursor: isConnectionMode ? 'pointer' : (isDragging ? 'grabbing' : 'grab'),
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Block Label */}
      <div className="font-bold text-lg mb-1">
        {node.label}
      </div>

      {/* Block Description */}
      {node.description && (
        <div className="text-xs opacity-75 truncate max-w-[120px]">
          {node.description}
        </div>
      )}

      {/* Connection Point (visual indicator) */}
      <div
        className="connection-point"
        style={{
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        title="Drag near another block to connect"
      />
    </div>
  );
}

export default Block;
