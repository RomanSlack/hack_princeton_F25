'use client';

import { useState, useRef } from 'react';

const BLOCK_TYPES = [
  { id: 'start', label: 'Start', color: '#10b981' },
  { id: 'attack', label: 'Attack', color: '#ef4444' },
  { id: 'defend', label: 'Defend', color: '#3b82f6' },
  { id: 'speak', label: 'Speak', color: '#a855f7' },
];

export default function SimpleBuilder() {
  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [draggingFromPalette, setDraggingFromPalette] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const blockIdCounter = useRef(0);

  // Start dragging from palette
  const handlePaletteMouseDown = (e, blockType) => {
    e.preventDefault();
    setDraggingFromPalette({
      type: blockType,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  // Start dragging a block
  const handleBlockMouseDown = (e, blockId) => {
    e.preventDefault();
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggedBlock({ id: blockId, offsetX, offsetY });
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    // Dragging existing block on canvas
    if (draggedBlock) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - draggedBlock.offsetX;
      const y = e.clientY - rect.top - draggedBlock.offsetY;

      setBlocks(blocks.map(block =>
        block.id === draggedBlock.id ? { ...block, x, y } : block
      ));
    }

    // Dragging from palette
    if (draggingFromPalette) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }

    // Connection line preview
    if (connectingFrom) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Stop dragging / Drop block
  const handleMouseUp = (e) => {
    // Drop block from palette
    if (draggingFromPalette && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 60; // Center the block
      const y = e.clientY - rect.top - 20;

      const newBlock = {
        id: `block-${blockIdCounter.current++}`,
        type: draggingFromPalette.type.id,
        label: draggingFromPalette.type.label,
        color: draggingFromPalette.type.color,
        x: Math.max(0, x),
        y: Math.max(0, y),
      };
      setBlocks([...blocks, newBlock]);
    }

    setDraggedBlock(null);
    setDraggingFromPalette(null);
  };

  // Start connection mode
  const handleBlockRightClick = (e, blockId) => {
    e.preventDefault();
    if (connectingFrom === blockId) {
      setConnectingFrom(null);
    } else {
      setConnectingFrom(blockId);
    }
  };

  // Create connection
  const handleBlockClick = (blockId) => {
    if (connectingFrom && connectingFrom !== blockId) {
      const newConnection = {
        id: `conn-${Date.now()}`,
        from: connectingFrom,
        to: blockId,
      };
      setConnections([...connections, newConnection]);
      setConnectingFrom(null);
    }
  };

  // Delete connection
  const handleConnectionClick = (connId) => {
    setConnections(connections.filter(c => c.id !== connId));
  };

  // Delete block
  const handleBlockDelete = (blockId) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
    setConnections(connections.filter(c => c.from !== blockId && c.to !== blockId));
  };

  // Export JSON
  const handleExport = () => {
    const data = { blocks, connections };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('Copied to clipboard!');
  };

  // Get block center position
  const getBlockCenter = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return { x: 0, y: 0 };
    return { x: block.x + 60, y: block.y + 20 };
  };

  return (
    <div className="flex h-screen" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Left Palette */}
      <div className="w-48 bg-gray-100 border-r p-4">
        <h2 className="font-bold mb-4">Blocks</h2>
        <div className="space-y-2">
          {BLOCK_TYPES.map(blockType => (
            <div
              key={blockType.id}
              onMouseDown={(e) => handlePaletteMouseDown(e, blockType)}
              className="w-full text-white font-medium py-2 px-4 rounded shadow cursor-grab hover:opacity-80 active:cursor-grabbing select-none"
              style={{ backgroundColor: blockType.color }}
            >
              {blockType.label}
            </div>
          ))}
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <p className="font-bold mb-2">Controls:</p>
          <ul className="space-y-1">
            <li>• Drag block to canvas</li>
            <li>• Drag to move</li>
            <li>• Right-click to connect</li>
            <li>• Double-click to delete</li>
          </ul>
        </div>

        <button
          onClick={handleExport}
          className="w-full mt-4 bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
        >
          Export JSON
        </button>
      </div>

      {/* Dragging preview from palette */}
      {draggingFromPalette && (
        <div
          className="fixed pointer-events-none z-50 rounded-lg shadow-lg text-white font-medium"
          style={{
            left: mousePos.x - 60,
            top: mousePos.y - 20,
            backgroundColor: draggingFromPalette.type.color,
            padding: '12px 24px',
            opacity: 0.8,
          }}
        >
          {draggingFromPalette.type.label}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative bg-gray-50 overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {/* Existing connections */}
          {connections.map(conn => {
            const from = getBlockCenter(conn.from);
            const to = getBlockCenter(conn.to);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;

            return (
              <g key={conn.id}>
                <path
                  d={`M ${from.x} ${from.y} Q ${midX} ${from.y} ${midX} ${midY} T ${to.x} ${to.y}`}
                  stroke="#666"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r="8"
                  fill="red"
                  className="cursor-pointer pointer-events-auto"
                  onClick={() => handleConnectionClick(conn.id)}
                />
              </g>
            );
          })}

          {/* Preview connection line */}
          {connectingFrom && (
            <line
              x1={getBlockCenter(connectingFrom).x}
              y1={getBlockCenter(connectingFrom).y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#666"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}

          {/* Arrowhead marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#666" />
            </marker>
          </defs>
        </svg>

        {/* Blocks */}
        {blocks.map(block => (
          <div
            key={block.id}
            onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
            onClick={() => handleBlockClick(block.id)}
            onContextMenu={(e) => handleBlockRightClick(e, block.id)}
            onDoubleClick={() => handleBlockDelete(block.id)}
            className="absolute rounded-lg shadow-lg text-white font-medium cursor-move select-none"
            style={{
              left: block.x,
              top: block.y,
              backgroundColor: block.color,
              padding: '12px 24px',
              zIndex: 10,
              border: connectingFrom === block.id ? '3px solid yellow' : 'none',
            }}
          >
            {block.label}
          </div>
        ))}

        {/* Instructions overlay */}
        {blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-400 text-center">
              <p className="text-2xl font-bold mb-2">Click blocks on the left to add them</p>
              <p>Then drag to move and right-click to connect</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
