'use client';

import { useState, useRef } from 'react';

// Backend port - update if your backend runs on a different port
const BACKEND_URL = 'http://localhost:8001';

// Available models
const MODELS = [
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
];

// Block type definitions matching backend expectations
const BLOCK_CATEGORIES = {
  action: {
    label: 'Entry Points',
    color: '#10b981',
    blocks: [
      { id: 'onStart', label: 'On Start', action_type: 'onStart' },
      { id: 'onAttacked', label: 'On Attacked', action_type: 'onAttacked' },
    ]
  },
  agent: {
    label: 'Agent (LLM)',
    color: '#f59e0b',
    blocks: [
      { id: 'agent', label: 'Agent Decision', needsConfig: true },
    ]
  },
  tool: {
    label: 'Actions',
    color: '#3b82f6',
    blocks: [
      { id: 'move', label: 'Move', tool_type: 'move', parameters: { x: 'number', y: 'number' } },
      { id: 'attack', label: 'Attack', tool_type: 'attack', parameters: { target_player_id: 'string' } },
      { id: 'collect', label: 'Collect', tool_type: 'collect', parameters: {} },
      { id: 'plan', label: 'Plan', tool_type: 'plan', parameters: { plan: 'string' } },
    ]
  }
};

export default function SimpleBuilder() {
  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [draggingFromPalette, setDraggingFromPalette] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [configModalBlock, setConfigModalBlock] = useState(null);
  const [agentId, setAgentId] = useState('');
  const [deploying, setDeploying] = useState(false);

  const canvasRef = useRef(null);
  const blockIdCounter = useRef(0);

  // Start dragging from palette
  const handlePaletteMouseDown = (e, blockDef, category) => {
    e.preventDefault();
    setDraggingFromPalette({
      blockDef,
      category,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  // Start dragging a block
  const handleBlockMouseDown = (e, blockId) => {
    e.preventDefault();
    e.stopPropagation();
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
      const x = e.clientX - rect.left - 60;
      const y = e.clientY - rect.top - 20;

      const blockId = `block-${blockIdCounter.current++}`;
      const { blockDef, category } = draggingFromPalette;

      const newBlock = {
        id: blockId,
        blockType: category,
        definitionId: blockDef.id,
        label: blockDef.label,
        color: BLOCK_CATEGORIES[category].color,
        x: Math.max(0, x),
        y: Math.max(0, y),
      };

      // Add category-specific data
      if (category === 'action') {
        newBlock.action_type = blockDef.action_type;
      } else if (category === 'agent') {
        newBlock.model = MODELS[0].value;
        newBlock.system_prompt = 'You are a game AI agent.';
        newBlock.user_prompt = 'Choose your best action.';
        newBlock.tool_connections = [];
      } else if (category === 'tool') {
        newBlock.tool_type = blockDef.tool_type;
        newBlock.parameters = blockDef.parameters;
      }

      setBlocks([...blocks, newBlock]);

      // Show config modal for agent blocks
      if (blockDef.needsConfig) {
        setConfigModalBlock(newBlock);
      }
    }

    setDraggedBlock(null);
    setDraggingFromPalette(null);
  };

  // Start connection mode
  const handleBlockRightClick = (e, blockId) => {
    e.preventDefault();
    e.stopPropagation();
    if (connectingFrom === blockId) {
      setConnectingFrom(null);
    } else {
      setConnectingFrom(blockId);
    }
  };

  // Create connection
  const handleBlockClick = (e, blockId) => {
    e.stopPropagation();
    if (connectingFrom && connectingFrom !== blockId) {
      const fromBlock = blocks.find(b => b.id === connectingFrom);
      const toBlock = blocks.find(b => b.id === blockId);

      // Validate connection based on block types
      if (fromBlock.blockType === 'agent' && toBlock.blockType === 'tool') {
        // Agent can connect to multiple tools
        const newConnection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom,
          to: blockId,
        };
        setConnections([...connections, newConnection]);
      } else if ((fromBlock.blockType === 'action' || fromBlock.blockType === 'tool') && toBlock.blockType === 'agent') {
        // Action/Tool can only connect to one agent
        // Remove existing connections from this block
        setConnections(connections.filter(c => c.from !== connectingFrom));
        const newConnection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom,
          to: blockId,
        };
        setConnections([...connections, newConnection]);
      } else {
        alert('Invalid connection! Actions/Tools connect to Agents. Agents connect to Tools.');
      }

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

  // Open config for existing block
  const handleBlockDoubleClick = (e, blockId) => {
    e.stopPropagation();
    const block = blocks.find(b => b.id === blockId);
    if (block && block.blockType === 'agent') {
      setConfigModalBlock(block);
    } else {
      handleBlockDelete(blockId);
    }
  };

  // Save agent config
  const handleSaveAgentConfig = (config) => {
    setBlocks(blocks.map(b =>
      b.id === configModalBlock.id
        ? { ...b, ...config }
        : b
    ));
    setConfigModalBlock(null);
  };

  // Deploy agent to backend
  const handleDeploy = async () => {
    if (!agentId.trim()) {
      alert('Please enter an Agent ID!');
      return;
    }

    // Validate at least one onStart block
    const hasOnStart = blocks.some(b => b.blockType === 'action' && b.action_type === 'onStart');
    if (!hasOnStart) {
      alert('You must have at least one "On Start" block!');
      return;
    }

    setDeploying(true);

    try {
      // Build backend-compatible format
      const backendBlocks = blocks.map(block => {
        const baseBlock = {
          id: block.id,
          type: block.blockType,
        };

        if (block.blockType === 'action') {
          return {
            ...baseBlock,
            action_type: block.action_type,
            next: connections.find(c => c.from === block.id)?.to || null,
          };
        } else if (block.blockType === 'agent') {
          return {
            ...baseBlock,
            model: block.model,
            system_prompt: block.system_prompt,
            user_prompt: block.user_prompt,
            tool_connections: connections
              .filter(c => c.from === block.id)
              .map(c => {
                const toolBlock = blocks.find(b => b.id === c.to);
                return {
                  tool_id: c.to,
                  tool_name: toolBlock?.tool_type || '',
                };
              }),
          };
        } else if (block.blockType === 'tool') {
          return {
            ...baseBlock,
            tool_type: block.tool_type,
            parameters: block.parameters,
            next: connections.find(c => c.from === block.id)?.to || null,
          };
        }
      });

      const payload = {
        agent_id: agentId.trim(),
        blocks: backendBlocks,
      };

      console.log('Deploying:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${BACKEND_URL}/add-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to deploy agent');
      }

      const result = await response.json();
      alert(`Agent "${result.agent_id}" deployed successfully!\nCurrent node: ${result.current_node}`);
    } catch (error) {
      console.error('Deployment error:', error);
      alert(`Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
    }
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
      <div className="w-64 bg-gray-100 border-r p-4 overflow-y-auto">
        <h2 className="font-bold mb-4 text-xl">Block Builder</h2>

        {/* Agent ID input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Agent ID</label>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="e.g., bot_001"
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </div>

        {/* Block categories */}
        {Object.entries(BLOCK_CATEGORIES).map(([categoryKey, category]) => (
          <div key={categoryKey} className="mb-4">
            <h3 className="text-sm font-bold mb-2 text-gray-700">{category.label}</h3>
            <div className="space-y-2">
              {category.blocks.map(blockDef => (
                <div
                  key={blockDef.id}
                  onMouseDown={(e) => handlePaletteMouseDown(e, blockDef, categoryKey)}
                  className="w-full text-white text-sm font-medium py-2 px-3 rounded shadow cursor-grab hover:opacity-80 active:cursor-grabbing select-none"
                  style={{ backgroundColor: category.color }}
                >
                  {blockDef.label}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 text-xs text-gray-600">
          <p className="font-bold mb-2">Controls:</p>
          <ul className="space-y-1">
            <li>• Drag block to canvas</li>
            <li>• Drag to reposition</li>
            <li>• Right-click to connect</li>
            <li>• Double-click to configure/delete</li>
          </ul>
        </div>

        <button
          onClick={handleDeploy}
          disabled={deploying}
          className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 font-medium"
        >
          {deploying ? 'Deploying...' : 'Deploy Agent'}
        </button>
      </div>

      {/* Dragging preview from palette */}
      {draggingFromPalette && (
        <div
          className="fixed pointer-events-none z-50 rounded-lg shadow-lg text-white font-medium text-sm"
          style={{
            left: mousePos.x - 60,
            top: mousePos.y - 20,
            backgroundColor: BLOCK_CATEGORIES[draggingFromPalette.category].color,
            padding: '8px 16px',
            opacity: 0.8,
          }}
        >
          {draggingFromPalette.blockDef.label}
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
        onClick={() => setConnectingFrom(null)}
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
                  className="cursor-pointer pointer-events-auto hover:fill-red-700"
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
            onClick={(e) => handleBlockClick(e, block.id)}
            onContextMenu={(e) => handleBlockRightClick(e, block.id)}
            onDoubleClick={(e) => handleBlockDoubleClick(e, block.id)}
            className="absolute rounded-lg shadow-lg text-white text-sm font-medium cursor-move select-none hover:shadow-xl transition-shadow"
            style={{
              left: block.x,
              top: block.y,
              backgroundColor: block.color,
              padding: '8px 16px',
              zIndex: 10,
              border: connectingFrom === block.id ? '3px solid yellow' : '2px solid rgba(0,0,0,0.2)',
            }}
          >
            <div>{block.label}</div>
            {block.blockType === 'agent' && (
              <div className="text-xs opacity-75 mt-1">
                {block.model.split('/')[1]}
              </div>
            )}
          </div>
        ))}

        {/* Instructions overlay */}
        {blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-400 text-center">
              <p className="text-2xl font-bold mb-2">Drag blocks from the left panel</p>
              <p className="text-lg">Right-click to connect blocks</p>
              <p className="text-sm mt-4">Action/Tool → Agent → Tool</p>
            </div>
          </div>
        )}
      </div>

      {/* Agent Configuration Modal */}
      {configModalBlock && (
        <AgentConfigModal
          block={configModalBlock}
          onSave={handleSaveAgentConfig}
          onClose={() => setConfigModalBlock(null)}
        />
      )}
    </div>
  );
}

// Agent Configuration Modal Component
function AgentConfigModal({ block, onSave, onClose }) {
  const [model, setModel] = useState(block.model || MODELS[0].value);
  const [systemPrompt, setSystemPrompt] = useState(block.system_prompt || '');
  const [userPrompt, setUserPrompt] = useState(block.user_prompt || '');

  const handleSave = () => {
    if (!systemPrompt.trim() || !userPrompt.trim()) {
      alert('Please fill in both prompts!');
      return;
    }
    onSave({ model, system_prompt: systemPrompt, user_prompt: userPrompt });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Configure Agent Block</h2>

        <div className="space-y-4">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g., You are a tactical battle royale AI agent..."
              className="w-full px-3 py-2 border rounded h-24 resize-none"
            />
          </div>

          {/* User Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2">User Prompt</label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., Analyze the game state and choose your best action..."
              className="w-full px-3 py-2 border rounded h-24 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
