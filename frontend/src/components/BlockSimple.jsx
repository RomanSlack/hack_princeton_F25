import { useState, useRef, useEffect } from 'react';
import Tooltip from './Tooltip';

/**
 * BlockSimple Component - Compatible with Canvas
 * Simplified draggable block for the agent builder with educational tooltips
 */
function BlockSimple({ node, onMove, onClick }) {
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const blockRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: node.x, y: node.y });
  const hoverTimeoutRef = useRef(null);

  /**
   * Handle mouse down - start drag
   */
  const handleMouseDown = (e) => {
    e.preventDefault();
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

    const constrainedX = Math.max(0, Math.min(newX, window.innerWidth - 150));
    const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - 100));

    onMove(node.id, constrainedX, constrainedY);
  };

  /**
   * Handle mouse up - end drag
   */
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  /**
   * Handle double click - open edit popup
   */
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(node);
    }
  };

  /**
   * Handle mouse enter - show tooltip after delay
   */
  const handleMouseEnter = () => {
    if (!isDragging) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 500); // Show after 500ms hover
    }
  };

  /**
   * Handle mouse leave - hide tooltip
   */
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setShowTooltip(false);
  };

  // Set up global mouse event listeners during drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      setShowTooltip(false); // Hide tooltip while dragging

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, node.x, node.y]);

  // Get block type for tooltip
  const getBlockType = () => {
    const label = node.label?.toLowerCase();
    if (label?.includes('sense')) return 'sense';
    if (label?.includes('plan')) return 'plan';
    if (label?.includes('act')) return 'act';
    if (label?.includes('reflect')) return 'reflect';
    return 'sense';
  };

  return (
    <div
      ref={blockRef}
      className={`
        block
        ${node.color || 'category-core'}
        ${isDragging ? 'dragging scale-105' : ''}
        ${showTooltip ? 'ring-2 ring-white ring-opacity-50' : ''}
        px-6 py-4 rounded-lg shadow-lg
        min-w-[120px] text-center
        transition-all duration-200
        relative
      `}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Block Label */}
      <div className="font-bold text-lg mb-1">
        {node.label}
      </div>

      {/* Block Description */}
      {node.description && (
        <div className="text-xs opacity-90 truncate max-w-[120px]">
          {node.description}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && !isDragging && (
        <Tooltip block={getBlockType()} position="right" />
      )}
    </div>
  );
}

export default BlockSimple;
