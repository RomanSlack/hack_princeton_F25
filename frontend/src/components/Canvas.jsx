import { useRef, useCallback } from 'react';
import BlockSimple from './BlockSimple';
import ConnectionLayer from './ConnectionLayer';

/**
 * Canvas Component
 * Main workspace area with dark grid background (Scratch-style)
 * Handles drag-and-drop from sidebar and manages block placement
 *
 * @param {Array} nodes - All blocks on the canvas
 * @param {Array} connections - All connections between blocks
 * @param {Function} onDropBlock - Called when a new block is dropped from sidebar
 * @param {Function} onBlockMove - Called when a block is moved
 * @param {Function} onBlockClick - Called when a block is clicked
 * @param {Function} onConnectionCreate - Called when blocks snap together
 * @param {Function} onConnectionDelete - Called when a connection is deleted
 */
function Canvas({
  nodes,
  connections,
  onDropBlock,
  onBlockMove,
  onBlockClick,
  onConnectionCreate,
  onConnectionDelete
}) {
  const canvasRef = useRef(null);
  const dragOverNodeRef = useRef(null);

  /**
   * Handle drag over canvas - allow drop
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  /**
   * Handle drop on canvas
   * Creates a new block at the drop position
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();

    // Get block data from drag event
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    const blockData = JSON.parse(data);

    // Calculate drop position relative to canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 40; // Center the block
    const y = e.clientY - rect.top - 20;

    // Create new block
    onDropBlock({
      ...blockData,
      x,
      y
    });
  }, [onDropBlock]);

  /**
   * Handle block movement within canvas
   * Checks for nearby blocks to create snap connections
   */
  const handleBlockMove = useCallback((blockId, x, y) => {
    // Update block position
    onBlockMove(blockId, x, y);

    // Check for nearby blocks to snap-connect
    const SNAP_DISTANCE = 60; // Snap threshold in pixels
    const movedBlock = nodes.find(n => n.id === blockId);

    if (!movedBlock) return;

    // Find nearby blocks
    nodes.forEach(node => {
      if (node.id !== blockId) {
        const distance = Math.sqrt(
          Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)
        );

        // If blocks are close enough, create connection
        if (distance < SNAP_DISTANCE) {
          // Check if connection doesn't already exist
          const connectionExists = connections.some(
            conn => (conn.from === blockId && conn.to === node.id) ||
                    (conn.from === node.id && conn.to === blockId)
          );

          if (!connectionExists && onConnectionCreate) {
            onConnectionCreate(blockId, node.id);
          }
        }
      }
    });
  }, [nodes, connections, onBlockMove, onConnectionCreate]);

  return (
    <div
      ref={canvasRef}
      className="canvas flex-1"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Connection Layer - renders all arrows */}
      <ConnectionLayer
        nodes={nodes}
        connections={connections}
        onConnectionDelete={onConnectionDelete}
      />

      {/* Render all blocks */}
      {nodes.map(node => (
        <BlockSimple
          key={node.id}
          node={node}
          onMove={handleBlockMove}
          onClick={onBlockClick}
        />
      ))}

      {/* Empty state message */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-semibold">Drag blocks here to start building</p>
            <p className="text-sm mt-2">Create your agent logic by connecting blocks</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Canvas;
