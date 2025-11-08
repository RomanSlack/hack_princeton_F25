'use client'

import { useState, useCallback, useRef } from 'react';
import Block from '../components/Block';
import Connections from '../components/Connections';
import Popup from '../components/Popup';

/**
 * Main App Component
 * Manages the entire agent builder canvas with nodes, connections, and editing capabilities
 */
export default function Home() {
  // State management for nodes (blocks on canvas)
  const [nodes, setNodes] = useState([
    { id: 1, label: 'Start', description: 'Starting point', x: 100, y: 100 },
    { id: 2, label: 'Attack', description: 'Attack action', x: 300, y: 200 },
    { id: 3, label: 'Defend', description: 'Defense action', x: 500, y: 100 },
    { id: 4, label: 'Speak', description: 'Communication action', x: 300, y: 300 },
  ]);

  // State management for connections between nodes
  const [connections, setConnections] = useState([
    { from: 1, to: 2 },
    { from: 2, to: 4 },
  ]);

  // State for editing popup
  const [editingNode, setEditingNode] = useState(null);

  // State for connection mode
  const [connectionMode, setConnectionMode] = useState(false);
  const [selectedSourceNode, setSelectedSourceNode] = useState(null);
  const [tempConnectionPos, setTempConnectionPos] = useState(null);

  // Ref to track dragging state
  const draggedNodeRef = useRef(null);
  const canvasRef = useRef(null);

  // Counter for generating unique IDs
  const nextIdRef = useRef(5);

  /**
   * Handle node position update during drag
   */
  const handleNodeDrag = useCallback((id, x, y) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === id ? { ...node, x, y } : node
      )
    );
    draggedNodeRef.current = { id, x, y };
  }, []);

  /**
   * Handle node drag end - check for nearby nodes and create connections
   */
  const handleNodeDragEnd = useCallback((id, x, y) => {
    const draggedNode = nodes.find(n => n.id === id);
    if (!draggedNode) return;

    // Find nearby nodes (within 80px) to auto-connect
    const CONNECTION_THRESHOLD = 80;
    nodes.forEach(node => {
      if (node.id !== id) {
        const distance = Math.sqrt(
          Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)
        );

        if (distance < CONNECTION_THRESHOLD) {
          // Check if connection doesn't already exist
          const connectionExists = connections.some(
            conn => (conn.from === id && conn.to === node.id) ||
                    (conn.from === node.id && conn.to === id)
          );

          if (!connectionExists) {
            setConnections(prev => [...prev, { from: id, to: node.id }]);
          }
        }
      }
    });

    draggedNodeRef.current = null;
  }, [nodes, connections]);

  /**
   * Handle opening edit popup for a node
   */
  const handleNodeClick = useCallback((node) => {
    // If in connection mode, handle connection logic
    if (connectionMode) {
      if (!selectedSourceNode) {
        // First click - select source node
        setSelectedSourceNode(node);
      } else if (selectedSourceNode.id === node.id) {
        // Clicking same node - cancel
        setSelectedSourceNode(null);
        setTempConnectionPos(null);
      } else {
        // Second click - create connection
        const connectionExists = connections.some(
          conn => (conn.from === selectedSourceNode.id && conn.to === node.id) ||
                  (conn.from === node.id && conn.to === selectedSourceNode.id)
        );

        if (!connectionExists) {
          setConnections(prev => [...prev, { from: selectedSourceNode.id, to: node.id }]);
        }

        // Reset selection
        setSelectedSourceNode(null);
        setTempConnectionPos(null);
      }
    } else {
      // Normal mode - open edit popup
      setEditingNode(node);
    }
  }, [connectionMode, selectedSourceNode, connections]);

  /**
   * Handle saving edited node data
   */
  const handleNodeEdit = useCallback((id, updates) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === id ? { ...node, ...updates } : node
      )
    );
    setEditingNode(null);
  }, []);

  /**
   * Handle deleting a node and its connections
   */
  const handleNodeDelete = useCallback((id) => {
    setNodes(prevNodes => prevNodes.filter(node => node.id !== id));
    setConnections(prevConnections =>
      prevConnections.filter(conn => conn.from !== id && conn.to !== id)
    );
    setEditingNode(null);
  }, []);

  /**
   * Handle deleting a connection
   */
  const handleConnectionDelete = useCallback((from, to) => {
    setConnections(prevConnections =>
      prevConnections.filter(conn => !(conn.from === from && conn.to === to))
    );
  }, []);

  /**
   * Add a new node to the canvas
   */
  const addNode = useCallback((type) => {
    const newNode = {
      id: nextIdRef.current++,
      label: type,
      description: `${type} action`,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };
    setNodes(prev => [...prev, newNode]);
  }, []);

  /**
   * Export the current agent logic as JSON
   */
  const exportJSON = useCallback(() => {
    const data = {
      nodes: nodes.map(({ id, label, description, x, y }) => ({
        id,
        label,
        description,
        position: { x, y }
      })),
      connections: connections.map(({ from, to }) => ({ from, to }))
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agent-logic.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, connections]);

  /**
   * Clear the entire canvas
   */
  const clearCanvas = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setConnections([]);
    }
  }, []);

  /**
   * Toggle connection mode
   */
  const toggleConnectionMode = useCallback(() => {
    setConnectionMode(prev => !prev);
    setSelectedSourceNode(null);
    setTempConnectionPos(null);
  }, []);

  /**
   * Handle mouse move for temporary connection line
   */
  const handleCanvasMouseMove = useCallback((e) => {
    if (connectionMode && selectedSourceNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setTempConnectionPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, [connectionMode, selectedSourceNode]);

  /**
   * Handle canvas click to cancel connection mode
   */
  const handleCanvasClick = useCallback((e) => {
    if (connectionMode && e.target === canvasRef.current) {
      setSelectedSourceNode(null);
      setTempConnectionPos(null);
    }
  }, [connectionMode]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">GPT Agent Builder</h1>
          <div className="flex gap-2">
            <button
              onClick={() => addNode('Start')}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              + Start
            </button>
            <button
              onClick={() => addNode('Attack')}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              + Attack
            </button>
            <button
              onClick={() => addNode('Defend')}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              + Defend
            </button>
            <button
              onClick={() => addNode('Speak')}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              + Speak
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleConnectionMode}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              connectionMode
                ? 'bg-orange-500 text-white hover:bg-orange-600 ring-2 ring-orange-300'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {connectionMode ? 'Exit Connect Mode' : 'Connect Mode'}
          </button>
          <button
            onClick={exportJSON}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export JSON
          </button>
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Clear Canvas
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`canvas flex-1 relative ${connectionMode ? 'cursor-crosshair' : ''}`}
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
      >
        {/* Connection Mode Banner */}
        {connectionMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold">
                {selectedSourceNode
                  ? `Click target node to connect from "${selectedSourceNode.label}"`
                  : 'Click a node to start connecting'}
              </span>
            </div>
          </div>
        )}

        {/* SVG Layer for connections */}
        <Connections
          nodes={nodes}
          connections={connections}
          onConnectionDelete={handleConnectionDelete}
          tempConnection={
            connectionMode && selectedSourceNode && tempConnectionPos
              ? { sourceNode: selectedSourceNode, targetPos: tempConnectionPos }
              : null
          }
        />

        {/* Blocks Layer */}
        {nodes.map(node => (
          <Block
            key={node.id}
            node={node}
            onDrag={handleNodeDrag}
            onDragEnd={handleNodeDragEnd}
            onClick={handleNodeClick}
            isSelected={connectionMode && selectedSourceNode?.id === node.id}
            isConnectionMode={connectionMode}
          />
        ))}
      </div>

      {/* Edit Popup */}
      {editingNode && (
        <Popup
          node={editingNode}
          onSave={handleNodeEdit}
          onDelete={handleNodeDelete}
          onClose={() => setEditingNode(null)}
        />
      )}

      {/* Info Footer */}
      <div className="bg-white border-t px-6 py-2 text-sm text-gray-600">
        <span className="font-semibold">{nodes.length}</span> nodes,
        <span className="font-semibold ml-1">{connections.length}</span> connections
        <span className="ml-4 text-gray-500">
          {connectionMode
            ? '• Connection Mode: Click nodes to connect them'
            : '• Use Connect Mode for easy linking • Drag blocks near each other to auto-connect • Double-click to edit'}
        </span>
      </div>
    </div>
  );
}

