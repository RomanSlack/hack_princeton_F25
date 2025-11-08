import { useState, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import Popup from './components/Popup';
import HintSystem from './components/HintSystem';
import InfoCard from './components/InfoCard';
import ChallengePanel from './components/ChallengePanel';

/**
 * EducationalScratchApp - Full Educational Experience
 * Interactive, hands-on learning for Agentic AI concepts
 */
function EducationalScratchApp() {
  // State management for nodes (blocks on canvas)
  const [nodes, setNodes] = useState([]);

  // State management for connections between nodes
  const [connections, setConnections] = useState([]);

  // State for editing popup
  const [editingNode, setEditingNode] = useState(null);

  // State for agent position in sandbox
  const [agentPos, setAgentPos] = useState({ x: 20, y: 50 });

  // State for obstacles in sandbox
  const [obstacles, setObstacles] = useState([
    { x: 40, y: 50, width: 10, height: 20 },
    { x: 65, y: 30, width: 10, height: 30 }
  ]);

  // State for goal position
  const [goalPos] = useState({ x: 85, y: 50 });

  // State for debug trail with enhanced educational messages
  const [debugTrail, setDebugTrail] = useState([
    {
      timestamp: Date.now(),
      type: 'info',
      message: 'Agent initialized. Ready to learn!',
      phase: 'start'
    }
  ]);

  // State for last action (for hint system)
  const [lastAction, setLastAction] = useState(null);

  // State for current challenge
  const [currentChallenge, setCurrentChallenge] = useState(null);

  // State for current lesson focus
  const [lessonFocus, setLessonFocus] = useState('perception');

  // Counter for generating unique IDs
  const nextIdRef = useRef(1);
  const getNextId = () => nextIdRef.current++;

  /**
   * Add enhanced debug message with educational context
   */
  const addDebugMessage = useCallback((type, message, phase = null) => {
    setDebugTrail(prev => [
      ...prev,
      { timestamp: Date.now(), type, message, phase }
    ].slice(-15)); // Keep last 15 messages
  }, []);

  /**
   * Handle dropping a new block from sidebar onto canvas
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
    addDebugMessage('info', `✅ ${blockData.label} block added to your agent`, 'build');

    // Provide contextual feedback
    if (blockData.label === 'SENSE' && nodes.length === 0) {
      addDebugMessage('success', 'Great start! SENSE helps your agent perceive the world', 'build');
    }
  }, [addDebugMessage, nodes.length]);

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
    addDebugMessage('info', 'Block removed from agent', 'build');
  }, [addDebugMessage]);

  /**
   * Handle creating a connection between blocks
   */
  const handleConnectionCreate = useCallback((fromId, toId) => {
    const connectionExists = connections.some(
      conn => (conn.from === fromId && conn.to === toId) ||
              (conn.from === toId && conn.to === fromId)
    );

    if (!connectionExists) {
      setConnections(prev => [...prev, { from: fromId, to: toId }]);
      addDebugMessage('success', 'Blocks connected! Your agent logic is taking shape', 'build');
    }
  }, [connections, addDebugMessage]);

  /**
   * Handle deleting a connection
   */
  const handleConnectionDelete = useCallback((from, to) => {
    setConnections(prevConnections =>
      prevConnections.filter(conn => !(conn.from === from && conn.to === to))
    );
  }, []);

  /**
   * Check if agent collides with obstacles
   */
  const checkCollision = useCallback((x, y) => {
    return obstacles.some(obs =>
      x >= obs.x && x <= obs.x + obs.width &&
      y >= obs.y && y <= obs.y + obs.height
    );
  }, [obstacles]);

  /**
   * Check if agent reached goal
   */
  const checkGoalReached = useCallback((x, y) => {
    const distance = Math.sqrt(
      Math.pow(x - goalPos.x, 2) + Math.pow(y - goalPos.y, 2)
    );
    return distance < 5;
  }, [goalPos]);

  /**
   * Run agent simulation with educational feedback
   */
  const runAgent = useCallback(() => {
    if (nodes.length === 0) {
      addDebugMessage('error', 'No blocks to execute. Start by dragging blocks from the left!', 'error');
      setLastAction({ type: 'error', message: 'no_blocks' });
      return;
    }

    addDebugMessage('info', '🚀 Starting agent execution...', 'start');
    setAgentPos({ x: 20, y: 50 }); // Reset position

    let currentX = 20;
    let currentY = 50;
    let hasReflected = false;

    // Execute blocks sequentially with educational commentary
    nodes.forEach((node, index) => {
      setTimeout(() => {
        const action = node.label;

        switch(action) {
          case 'SENSE':
            const obstacleAhead = checkCollision(currentX + 15, currentY);
            addDebugMessage(
              'sense',
              `👁️ SENSING: ${obstacleAhead ? 'Obstacle detected ahead!' : 'Path looks clear'}`,
              'sense'
            );
            addDebugMessage(
              'sense',
              `📊 Input: Environment data → Agent can see ${obstacleAhead ? 'blocked' : 'open'} path`,
              'sense'
            );
            break;

          case 'PLAN':
            const hasSense = nodes.some(n => n.label === 'SENSE');
            if (hasSense) {
              addDebugMessage(
                'plan',
                '🧠 PLANNING: Analyzing sensor data... Calculating best path around obstacles',
                'plan'
              );
              addDebugMessage(
                'plan',
                '💡 Decision Logic: Move forward cautiously, adjust if obstacle detected',
                'plan'
              );
            } else {
              addDebugMessage(
                'warning',
                '⚠️ PLANNING: No sensor data available. Planning without information!',
                'plan'
              );
            }
            break;

          case 'ACT':
            const willCollide = checkCollision(currentX + 20, currentY);

            if (willCollide) {
              addDebugMessage('error', '❌ ACTION: Collision! Agent hit an obstacle', 'act');
              addDebugMessage('error', '💥 No SENSE block = blind movement', 'act');
              setLastAction({ type: 'collision' });
            } else {
              currentX += 20;
              currentY += Math.random() * 10 - 5; // Slight variation
              setAgentPos({ x: currentX, y: currentY });

              addDebugMessage('act', '⚡ ACTION: Moving forward...', 'act');
              addDebugMessage('act', `📍 New position: (${currentX.toFixed(0)}, ${currentY.toFixed(0)})`, 'act');

              if (checkGoalReached(currentX, currentY)) {
                addDebugMessage('success', '🎯 Goal reached! Mission accomplished!', 'success');
                setLastAction({ type: 'success' });
              }
            }
            break;

          case 'REFLECT':
            hasReflected = true;
            const success = checkGoalReached(currentX, currentY);
            if (success) {
              addDebugMessage(
                'reflect',
                '💭 REFLECTING: Success! Storing this strategy in memory for future use',
                'reflect'
              );
              addDebugMessage(
                'reflect',
                '🎓 Learning: "Sense → Plan → Act" pattern works well',
                'reflect'
              );
            } else {
              addDebugMessage(
                'reflect',
                '💭 REFLECTING: Analyzing what went wrong... Learning from mistakes',
                'reflect'
              );
              addDebugMessage(
                'reflect',
                '📝 Memory Update: Need better obstacle detection next time',
                'reflect'
              );
            }
            break;

          default:
            addDebugMessage('info', `Executing: ${action}`, 'execute');
        }

        // Final summary
        if (index === nodes.length - 1) {
          setTimeout(() => {
            if (!hasReflected) {
              addDebugMessage(
                'info',
                '💡 Tip: Add a REFLECT block to help your agent learn and improve!',
                'tip'
              );
            }
          }, 500);
        }
      }, index * 1500); // Slower for educational clarity
    });
  }, [nodes, addDebugMessage, checkCollision, checkGoalReached]);

  /**
   * Export agent logic as JSON
   */
  const exportAgent = useCallback(() => {
    const data = {
      nodes: nodes.map(({ id, label, description, x, y, color }) => ({
        id,
        label,
        description,
        position: { x, y },
        category: color?.replace('category-', '')
      })),
      connections: connections.map(({ from, to }) => ({ from, to }))
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-agent.json';
    link.click();
    URL.revokeObjectURL(url);
    addDebugMessage('success', '💾 Agent logic exported successfully!', 'export');
  }, [nodes, connections, addDebugMessage]);

  /**
   * Handle challenge selection
   */
  const handleChallengeSelect = useCallback((challenge) => {
    setCurrentChallenge(challenge);
    addDebugMessage('info', `🎮 Challenge started: ${challenge.title}`, 'challenge');
    addDebugMessage('info', `💡 ${challenge.hint}`, 'challenge');

    // Reset agent position for new challenge
    setAgentPos({ x: 20, y: 50 });
  }, [addDebugMessage]);

  return (
    <div className="w-full h-screen flex bg-gray-50 relative">
      {/* Left Sidebar - Scratch-style */}
      <Sidebar onBlockDragStart={(block, category) => {
        console.log('Dragging:', block.label);
      }} />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative">
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

        {/* Hint System */}
        <HintSystem nodes={nodes} lastAction={lastAction} />
      </div>

      {/* Right Panel - Enhanced Sandbox & Debug Trail */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Sandbox Viewport with Obstacles */}
        <div className="h-1/2 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-700">Agent Sandbox</h3>
            {currentChallenge && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                {currentChallenge.title}
              </span>
            )}
          </div>
          <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-gray-300 overflow-hidden">
            {/* Agent representation */}
            <div
              className="absolute w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold transition-all duration-500 shadow-lg z-10"
              style={{
                left: `${agentPos.x}%`,
                top: `${agentPos.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              title="Your AI Agent"
            >
              AI
            </div>

            {/* Obstacles */}
            {obstacles.map((obs, idx) => (
              <div
                key={idx}
                className="absolute bg-red-400 opacity-70 rounded"
                style={{
                  left: `${obs.x}%`,
                  top: `${obs.y}%`,
                  width: `${obs.width}%`,
                  height: `${obs.height}%`
                }}
                title="Obstacle"
              />
            ))}

            {/* Goal marker */}
            <div
              className="absolute w-8 h-8 bg-green-500 rounded-full animate-pulse flex items-center justify-center text-white font-bold"
              style={{
                left: `${goalPos.x}%`,
                top: `${goalPos.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              title="Goal"
            >
              🎯
            </div>
          </div>
        </div>

        {/* Enhanced Debug Trail */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Debug Trail</h3>
          <p className="text-xs text-gray-500 mb-3">Watch how your agent thinks and acts</p>
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
                  entry.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                  'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-700 capitalize mb-1 flex items-center justify-between">
                  <span>{entry.type}</span>
                  <span className="text-gray-400 text-xs">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
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

      {/* Info Card */}
      <InfoCard lesson={lessonFocus} />

      {/* Challenge Panel */}
      <ChallengePanel
        onChallengeSelect={handleChallengeSelect}
        currentChallenge={currentChallenge}
      />
    </div>
  );
}

export default EducationalScratchApp;
