'use client';

import { useState, useRef } from 'react';

const BLOCK_TYPES = [
  { id: 'start', label: 'Start', color: '#10b981', description: 'Entry point for agent' },
  { id: 'sense', label: 'Sense', color: '#3b82f6', description: 'Perceive environment' },
  { id: 'plan', label: 'Plan', color: '#f59e0b', description: 'Make decisions' },
  { id: 'act', label: 'Act', color: '#ef4444', description: 'Execute actions' },
  { id: 'reflect', label: 'Reflect', color: '#a855f7', description: 'Learn from results' },
];

const INSTRUCTIONS = [
  {
    title: 'Welcome',
    content: 'Build an AI agent to play the battle royale game! Drag blocks from the sidebar to create your agent\'s behavior.',
  },
  {
    title: 'Sense',
    content: 'Use SENSE blocks to detect enemies, obstacles, and items in the game environment.',
  },
  {
    title: 'Plan',
    content: 'PLAN blocks help your agent make strategic decisions based on what it senses.',
  },
  {
    title: 'Act',
    content: 'ACT blocks execute actions like moving, shooting, and picking up items.',
  },
  {
    title: 'Reflect',
    content: 'REFLECT blocks help your agent learn from successes and failures to improve over time.',
  },
  {
    title: 'Run & Test',
    content: 'Click the RUN button to deploy your agent into the game and watch it play!',
  },
];

export default function AgentGameBuilder() {
  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [draggingFromPalette, setDraggingFromPalette] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentInstruction, setCurrentInstruction] = useState(0);
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
    if (draggedBlock) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - draggedBlock.offsetX;
      const y = e.clientY - rect.top - draggedBlock.offsetY;

      setBlocks(blocks.map(block =>
        block.id === draggedBlock.id ? { ...block, x, y } : block
      ));
    }

    if (draggingFromPalette) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }

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
    if (draggingFromPalette && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 60;
      const y = e.clientY - rect.top - 20;

      const newBlock = {
        id: `block-${blockIdCounter.current++}`,
        type: draggingFromPalette.type.id,
        label: draggingFromPalette.type.label,
        color: draggingFromPalette.type.color,
        description: draggingFromPalette.type.description,
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

  // Get block center position
  const getBlockCenter = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return { x: 0, y: 0 };
    return { x: block.x + 60, y: block.y + 20 };
  };

  // Run agent
  const handleRun = () => {
    if (blocks.length === 0) {
      alert('Add some blocks first!');
      return;
    }
    console.log('Running agent with blocks:', blocks);
    console.log('Connections:', connections);
    alert('Agent deployed! (Integration with game coming soon)');
  };

  // Navigate instructions
  const nextInstruction = () => {
    setCurrentInstruction((prev) => (prev + 1) % INSTRUCTIONS.length);
  };

  const prevInstruction = () => {
    setCurrentInstruction((prev) => (prev - 1 + INSTRUCTIONS.length) % INSTRUCTIONS.length);
  };

  return (
    <div
      className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Left Column - Game Preview & Run Button (2/5 width) */}
      <div className="w-2/5 flex flex-col bg-white border-r border-slate-200 shadow-lg overflow-hidden">
        {/* Top Half - Game Iframe */}
        <div className="flex-1 p-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Game Preview</h3>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 transition"
              title="Open in new tab"
            >
              ↗
            </a>
          </div>
          <div className="flex-1 relative bg-slate-900 rounded-lg border-2 border-slate-300 overflow-hidden shadow-inner min-h-0">
            <iframe
              src="http://localhost:3000"
              className="w-full h-full border-0"
              title="Game Environment"
              allow="fullscreen"
            />
          </div>
        </div>

        {/* Bottom Half - Run Button */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={handleRun}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">RUN AGENT</span>
          </button>

          <div className="mt-2 text-xs text-slate-500 text-center">
            <p className="font-semibold">Blocks: {blocks.length} | Connections: {connections.length}</p>
          </div>
        </div>
      </div>

      {/* Right Side - Instructions & Builder Area (3/5 width) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top - Instructions Section */}
        <div className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
          <div className="px-6 py-2.5 flex items-center justify-between gap-3">
            <button
              onClick={prevInstruction}
              className="p-1.5 rounded-full hover:bg-slate-100 transition flex-shrink-0"
              title="Previous"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 text-center min-w-0">
              <h2 className="text-base font-bold text-slate-800">
                {INSTRUCTIONS[currentInstruction].title}
              </h2>
              <p className="text-sm text-slate-600">
                {INSTRUCTIONS[currentInstruction].content}
              </p>
            </div>

            <button
              onClick={nextInstruction}
              className="p-1.5 rounded-full hover:bg-slate-100 transition flex-shrink-0"
              title="Next"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 pb-2">
            {INSTRUCTIONS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentInstruction(idx)}
                className={`w-2 h-2 rounded-full transition ${
                  idx === currentInstruction ? 'bg-blue-600 w-5' : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom - Builder Container */}
        <div className="flex-1 flex relative min-h-0 overflow-hidden">
          {/* Sidebar - Blocks Palette */}
          <div className="w-44 bg-white border-r border-slate-200 shadow-md p-3 overflow-y-auto flex-shrink-0">
            <h2 className="font-bold text-slate-800 mb-3 uppercase text-xs tracking-wide">Agent Blocks</h2>
            <div className="space-y-2">
              {BLOCK_TYPES.map(blockType => (
                <div
                  key={blockType.id}
                  onMouseDown={(e) => handlePaletteMouseDown(e, blockType)}
                  className="w-full text-white font-semibold py-2 px-3 rounded-lg shadow-md cursor-grab hover:shadow-lg active:cursor-grabbing select-none transition-all transform hover:scale-105 text-sm"
                  style={{ backgroundColor: blockType.color }}
                  title={blockType.description}
                >
                  {blockType.label}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
              <p className="font-bold mb-2 uppercase tracking-wide">How to Use</p>
              <ul className="space-y-1 leading-relaxed">
                <li>• Drag to canvas</li>
                <li>• Right-click to connect</li>
                <li>• Double-click to delete</li>
                <li>• Click Run when ready</li>
              </ul>
            </div>
          </div>

          {/* Dragging preview from palette */}
          {draggingFromPalette && (
            <div
              className="fixed pointer-events-none z-50 rounded-lg shadow-xl text-white font-semibold"
              style={{
                left: mousePos.x - 60,
                top: mousePos.y - 20,
                backgroundColor: draggingFromPalette.type.color,
                padding: '12px 24px',
                opacity: 0.9,
              }}
            >
              {draggingFromPalette.type.label}
            </div>
          )}

          {/* Canvas - Node Workspace */}
          <div
            ref={canvasRef}
            className="flex-1 relative bg-slate-50 overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px'
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
                      stroke="#475569"
                      strokeWidth="3"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                    />
                    <circle
                      cx={midX}
                      cy={midY}
                      r="10"
                      fill="#ef4444"
                      className="cursor-pointer pointer-events-auto hover:r-12 transition"
                      onClick={() => handleConnectionClick(conn.id)}
                      title="Click to delete connection"
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
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="8,4"
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
                  <polygon points="0 0, 10 3, 0 6" fill="#475569" />
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
                className="absolute rounded-lg shadow-lg text-white font-semibold cursor-move select-none transition-transform hover:scale-105"
                style={{
                  left: block.x,
                  top: block.y,
                  backgroundColor: block.color,
                  padding: '12px 28px',
                  zIndex: 10,
                  border: connectingFrom === block.id ? '4px solid #fbbf24' : '2px solid rgba(255,255,255,0.3)',
                }}
                title={block.description}
              >
                {block.label}
              </div>
            ))}

            {/* Empty state instructions */}
            {blocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-slate-400 text-center px-8">
                  <svg className="w-24 h-24 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-2xl font-bold mb-2">Start Building Your Agent</p>
                  <p className="text-lg">Drag blocks from the left sidebar onto this canvas</p>
                  <p className="text-sm mt-2">Right-click blocks to create connections</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
