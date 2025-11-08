import { useState, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import Popup from './components/Popup';

/**
 * Main App Component - Scratch.io Style Agent Builder
 * Manages state for nodes (blocks), connections, and UI interactions
 *
 * State structure:
 * {
 *   nodes: [{ id, label, x, y, color, description }],
 *   connections: [{ from, to }]
 * }
 */
function ScratchApp() {
  // State management for nodes (blocks on canvas)
  const [nodes, setNodes] = useState([]);

  // State management for connections between nodes
  const [connections, setConnections] = useState([]);

  // State for editing popup
  const [editingNode, setEditingNode] = useState(null);

  // State for agent position in sandbox
  const [agentPos, setAgentPos] = useState({ x: 50, y: 50 });

  // State for debug trail
  const [debugTrail, setDebugTrail] = useState([
    { timestamp: Date.now(), type: 'info', message: 'Agent initialized. Waiting for instructions...' }
  ]);

  // Counter for generating unique IDs
  const nextIdRef = useRef(1);
  const getNextId = () => nextIdRef.current++;

  /**
   * Add debug message to trail
   */
  const addDebugMessage = useCallback((type, message) => {
    setDebugTrail(prev => [
      ...prev,
      { timestamp: Date.now(), type, message }
    ].slice(-10)); // Keep last 10 messages
  }, []);

  /**
   * Handle dropping a new block from sidebar onto canvas
   * Creates a new node at the drop position
   */
  const handleDropBlock = useCallback((blockData) => {
    const newNode = {
      id: getNextId(),
      label: blockData.label,
      description: blockData.description,
      color: blockData.color,
      x: blockData.x,
      y: blockData.y,
    };

    setNodes(prev => [...prev, newNode]);
    addDebugMessage('info', `Block added: ${blockData.label}`);
  }, [addDebugMessage]);

  /**
   * Handle block movement within canvas
   */
  const handleBlockMove = useCallback((blockId, x, y) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === blockId ? { ...node, x, y } : node
      )
    );
  }, []);

  /**
   * Handle block click to open edit popup
   */
  const handleBlockClick = useCallback((node) => {
    setEditingNode(node);
  }, []);

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
   * Handle creating a connection between blocks
   * Called when blocks are dragged close together
   */
  const handleConnectionCreate = useCallback((fromId, toId) => {
    // Check if connection doesn't already exist
    const connectionExists = connections.some(
      conn => (conn.from === fromId && conn.to === toId) ||
              (conn.from === toId && conn.to === fromId)
    );

    if (!connectionExists) {
      setConnections(prev => [...prev, { from: fromId, to: toId }]);
    }
  }, [connections]);

  /**
   * Handle deleting a connection
   */
  const handleConnectionDelete = useCallback((from, to) => {
    setConnections(prevConnections =>
      prevConnections.filter(conn => !(conn.from === from && conn.to === to))
    );
  }, []);

  /**
   * Export agent logic as JSON
   * Downloads a JSON file with nodes and connections
   */
  const exportAgent = useCallback(() => {
    const data = {
      nodes: nodes.map(({ id, label, description, x, y, color }) => ({
        id,
        label,
        description,
        position: { x, y },
        category: color.replace('category-', '')
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
    addDebugMessage('success', 'Agent logic exported successfully');
  }, [nodes, connections, addDebugMessage]);

  /**
   * Run agent simulation
   */
  const runAgent = useCallback(() => {
    if (nodes.length === 0) {
      addDebugMessage('error', 'No blocks to execute. Add blocks first!');
      return;
    }

    addDebugMessage('info', 'Starting agent simulation...');

    // Simple simulation: move agent and execute blocks
    nodes.forEach((node, index) => {
      setTimeout(() => {
        const action = node.label;

        // Simulate agent action based on block type
        switch(action) {
          case 'SENSE':
            addDebugMessage('sense', 'What AI saw: Environment has obstacles, goal visible ahead');
            setAgentPos(prev => ({ x: prev.x + 10, y: prev.y }));
            break;
          case 'PLAN':
            addDebugMessage('plan', 'Why it acted: Calculated optimal path around obstacles');
            break;
          case 'ACT':
            addDebugMessage('act', 'Action taken: Moving forward to reach goal');
            setAgentPos(prev => ({ x: prev.x + 20, y: prev.y + 10 }));
            break;
          case 'REFLECT':
            addDebugMessage('reflect', 'What it learned: Path was efficient, strategy worked');
            break;
          default:
            addDebugMessage('info', `Executing: ${action}`);
        }
      }, index * 1000);
    });
  }, [nodes, addDebugMessage]);

  return (
    <div className="w-full h-screen flex bg-gray-50">
      {/* Left Sidebar - Scratch-style */}
      <Sidebar onBlockDragStart={(block, category) => {
        // Optional: Add visual feedback when drag starts
        console.log('Dragging:', block.label);
      }} />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        <Canvas
          nodes={nodes}
          connections={connections}
          onDropBlock={handleDropBlock}
          onBlockMove={handleBlockMove}
          onBlockClick={handleBlockClick}
          onConnectionCreate={handleConnectionCreate}
          onConnectionDelete={handleConnectionDelete}
        />

        {/* Control Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={runAgent}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-lg flex items-center gap-2"
            title="Run agent simulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run Agent
          </button>
          <button
            onClick={exportAgent}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg flex items-center gap-2"
            title="Export agent logic as JSON"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Right Panel - Sandbox & Debug Trail */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Sandbox Viewport */}
        <div className="h-1/2 border-b border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Agent Sandbox</h3>
          <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-gray-300 overflow-hidden">
            {/* Agent representation */}
            <div
              className="absolute w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold transition-all duration-500 shadow-lg"
              style={{
                left: `${agentPos.x}%`,
                top: `${agentPos.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              AI
            </div>

            {/* Goal marker */}
            <div
              className="absolute w-6 h-6 bg-green-500 rounded-full animate-pulse"
              style={{ right: '10%', top: '50%', transform: 'translate(0, -50%)' }}
            />
          </div>
        </div>

        {/* Debug Trail */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Debug Trail</h3>
          <div className="space-y-2">
            {debugTrail.map((entry, idx) => (
              <div
                key={idx}
                className={`text-xs p-2 rounded border-l-4 ${
                  entry.type === 'sense' ? 'bg-blue-50 border-blue-500' :
                  entry.type === 'plan' ? 'bg-yellow-50 border-yellow-500' :
                  entry.type === 'act' ? 'bg-green-50 border-green-500' :
                  entry.type === 'reflect' ? 'bg-purple-50 border-purple-500' :
                  entry.type === 'error' ? 'bg-red-50 border-red-500' :
                  entry.type === 'success' ? 'bg-emerald-50 border-emerald-500' :
                  'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-700 capitalize mb-1">{entry.type}</div>
                <div className="text-gray-600">{entry.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Popup Modal */}
      {editingNode && (
        <Popup
          node={editingNode}
          onSave={handleNodeEdit}
          onDelete={handleNodeDelete}
          onClose={() => setEditingNode(null)}
        />
      )}
    </div>
  );
}

export default ScratchApp;
