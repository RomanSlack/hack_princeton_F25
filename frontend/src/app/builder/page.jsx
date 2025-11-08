'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';

// Backend port - update if your backend runs on a different port
const BACKEND_URL = 'http://localhost:8001';

// Available models (sorted by speed/cost, fastest first)
const MODELS = [
  // Fast & cheap mini models
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
  { value: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku (Fast)' },
  { value: 'google/gemini-flash-1.5', label: 'Gemini 1.5 Flash (Fast)' },
  { value: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B (Fast)' },

  // Mid-tier models
  { value: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'google/gemini-pro-1.5', label: 'Gemini 1.5 Pro' },
  { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },

  // Premium models (slower but more capable)
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'xai/grok-4', label: 'Grok 4' },
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
      { id: 'search', label: 'Search Web', tool_type: 'search', parameters: { query: 'string' } },
    ]
  }
};

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
  const theme = useTheme();
  const [isClient, setIsClient] = useState(false);

  // Initialize state - always start with empty on server
  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [agentId, setAgentId] = useState('');

  const [draggedBlock, setDraggedBlock] = useState(null);
  const [draggingFromPalette, setDraggingFromPalette] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentInstruction, setCurrentInstruction] = useState(0);
  const [configModalBlock, setConfigModalBlock] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [pendingAgentBlock, setPendingAgentBlock] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, connectionId }
  const canvasRef = useRef(null);
  const blockRefs = useRef({}); // Store refs to measure actual block dimensions

  const blockIdCounter = useRef(0);

  // State for tracking current executing nodes and last executed tools
  // Format: { agentId: { currentNode: "block-id", lastTool: "tool-id" } }
  const [currentNodes, setCurrentNodes] = useState({});
  const prevCurrentNodes = useRef({});

  // State for tracking active transition animations
  const [animatingTransitions, setAnimatingTransitions] = useState([]);

  // Load from localStorage only on client side after mount
  useEffect(() => {
    setIsClient(true);
    try {
      const savedBlocks = localStorage.getItem('agent-builder-blocks');
      const savedConnections = localStorage.getItem('agent-builder-connections');
      const savedAgentId = localStorage.getItem('agent-builder-agentId');
      const savedBlockCounter = localStorage.getItem('agent-builder-blockCounter');

      if (savedBlocks) setBlocks(JSON.parse(savedBlocks));
      if (savedConnections) setConnections(JSON.parse(savedConnections));
      if (savedAgentId) setAgentId(savedAgentId);
      if (savedBlockCounter) blockIdCounter.current = parseInt(savedBlockCounter, 10);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever state changes (only on client)
  useEffect(() => {
    if (!isClient) return; // Don't save on initial mount

    try {
      localStorage.setItem('agent-builder-blocks', JSON.stringify(blocks));
      localStorage.setItem('agent-builder-blockCounter', blockIdCounter.current.toString());
    } catch (error) {
      console.error('Error saving blocks:', error);
    }
  }, [blocks, isClient]);

  useEffect(() => {
    if (!isClient) return;

    try {
      localStorage.setItem('agent-builder-connections', JSON.stringify(connections));
    } catch (error) {
      console.error('Error saving connections:', error);
    }
  }, [connections, isClient]);

  useEffect(() => {
    if (!isClient) return;

    try {
      localStorage.setItem('agent-builder-agentId', agentId);
    } catch (error) {
      console.error('Error saving agentId:', error);
    }
  }, [agentId, isClient]);

  // Poll backend for current node states
  useEffect(() => {
    if (!isClient) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/agents-state`);
        if (response.ok) {
          const data = await response.json();

          if (data.agents) {
            // Detect transitions and create animations BEFORE updating state
            const newTransitions = [];

            Object.entries(data.agents).forEach(([agentId, state]) => {
              const prevData = prevCurrentNodes.current[agentId];
              const prevNode = prevData?.currentNode;
              const newNode = state.current_node;
              const toolBlock = state.last_executed_tool_block;
              const lastAgentBlock = state.last_agent_block;

              // Check if we should animate
              // We animate when the current node changed from what we tracked before
              const nodeChanged = prevNode !== newNode;

              // Only animate if:
              // 1. The node changed from what we had before
              // 2. We have complete path information
              if (nodeChanged && lastAgentBlock && toolBlock && newNode) {
                console.log(`🎬 Animation: ${lastAgentBlock} → ${toolBlock} → ${newNode}`);

                // Multi-step animation: last agent → tool → current agent
                // First animation: previous agent block → tool block
                newTransitions.push({
                  id: `transition-${Date.now()}-${agentId}-1`,
                  agentId,
                  fromBlockId: lastAgentBlock,
                  toBlockId: toolBlock,
                  startTime: Date.now(),
                  delay: 0 // Start immediately
                });

                // Second animation: tool block → current agent block
                newTransitions.push({
                  id: `transition-${Date.now()}-${agentId}-2`,
                  agentId,
                  fromBlockId: toolBlock,
                  toBlockId: newNode,
                  startTime: Date.now(),
                  delay: 500 // Start after first animation fills (500ms)
                });
              } else if (nodeChanged && prevNode && newNode) {
                console.log(`🎬 Animation: ${prevNode} → ${newNode}`);

                // Single-step animation: direct connection (no tool block info)
                newTransitions.push({
                  id: `transition-${Date.now()}-${agentId}`,
                  agentId,
                  fromBlockId: prevNode,
                  toBlockId: newNode,
                  startTime: Date.now(),
                  delay: 0
                });
              }
            });

            // Add new transitions to state
            if (newTransitions.length > 0) {
              setAnimatingTransitions(prev => [...prev, ...newTransitions]);
            }

            // Update current nodes state for next poll
            const newCurrentNodes = {};
            Object.entries(data.agents).forEach(([agentId, state]) => {
              newCurrentNodes[agentId] = {
                currentNode: state.current_node,
                lastTool: state.last_executed_tool_block,
                lastAgentBlock: state.last_agent_block
              };
            });

            setCurrentNodes(newCurrentNodes);
            prevCurrentNodes.current = newCurrentNodes;
          }
        }
      } catch (error) {
        // Silently fail - backend might not be available
        console.debug('Failed to fetch agent states:', error);
      }
    }, 1000); // Poll every second

    return () => clearInterval(pollInterval);
  }, [isClient]);

  // Cleanup completed transition animations
  useEffect(() => {
    if (animatingTransitions.length === 0) return;

    const SINGLE_ANIMATION_DURATION = 1500; // milliseconds per animation step
    const now = Date.now();

    // Check if any animations have completed
    // Each animation completes at: startTime + delay + duration
    const hasCompletedAnimations = animatingTransitions.some(
      transition => now - transition.startTime >= transition.delay + SINGLE_ANIMATION_DURATION
    );

    if (hasCompletedAnimations) {
      // Remove completed animations
      const timeout = setTimeout(() => {
        setAnimatingTransitions(prev =>
          prev.filter(transition => {
            const elapsed = Date.now() - transition.startTime;
            const completionTime = transition.delay + SINGLE_ANIMATION_DURATION;
            return elapsed < completionTime;
          })
        );
      }, SINGLE_ANIMATION_DURATION);

      return () => clearTimeout(timeout);
    }
  }, [animatingTransitions]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2)); // Max zoom 2x
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5)); // Min zoom 0.5x
  };

  // Clear all blocks with confirmation
  const handleClearAll = () => {
    if (blocks.length === 0 && connections.length === 0) {
      return; // Nothing to clear
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear all blocks and connections?\n\nThis will remove ${blocks.length} block(s) and ${connections.length} connection(s). This action cannot be undone.`
    );

    if (confirmed) {
      setBlocks([]);
      setConnections([]);
      setConnectingFrom(null);
      setPendingAgentBlock(null);
      // Reset zoom and pan to defaults
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });

      // Clear localStorage
      try {
        localStorage.removeItem('agent-builder-blocks');
        localStorage.removeItem('agent-builder-connections');
        localStorage.removeItem('agent-builder-agentId');
        localStorage.removeItem('agent-builder-blockCounter');
        setAgentId('');
        blockIdCounter.current = 0;
        toast.success('Canvas cleared and localStorage reset!');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  };

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
    e.stopPropagation(); // Prevent canvas panning when clicking on block
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    // Calculate offset relative to canvas, accounting for pan and zoom
    const offsetX = (e.clientX - canvasRect.left - panOffset.x) / zoom - block.x;
    const offsetY = (e.clientY - canvasRect.top - panOffset.y) / zoom - block.y;

    setDraggedBlock({ id: blockId, offsetX, offsetY });
  };

  // Start panning canvas (middle mouse button or drag on empty canvas)
  const handleCanvasMouseDown = (e) => {
    // Only start panning if:
    // 1. Middle mouse button (button === 1)
    // 2. Left mouse button on empty canvas (not on a block - blocks stop propagation)
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    // Handle canvas panning
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggedBlock) {
      const rect = canvasRef.current.getBoundingClientRect();
      // Calculate new block position relative to canvas (accounting for zoom and pan)
      let x = (e.clientX - rect.left - panOffset.x) / zoom - draggedBlock.offsetX;
      let y = (e.clientY - rect.top - panOffset.y) / zoom - draggedBlock.offsetY;

      // Constrain x to be at least 0 (don't allow negative x values which would cross into sidebar)
      x = Math.max(0, x);
      y = Math.max(0, y);

      setBlocks(blocks.map(block =>
        block.id === draggedBlock.id ? { ...block, x, y } : block
      ));

      // Check if mouse is near trash zone (bottom middle)
      const trashX = rect.width / 2;
      const trashY = rect.height - 60;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const distance = Math.sqrt(Math.pow(mouseX - trashX, 2) + Math.pow(mouseY - trashY, 2));
      
      // Show trash if within 200px, highlight if within 80px
      setShowTrash(distance < 200);
      setIsOverTrash(distance < 80);
    } else {
      setShowTrash(false);
      setIsOverTrash(false);
    }

    if (draggingFromPalette) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }

    if (connectingFrom) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left - panOffset.x) / zoom,
        y: (e.clientY - rect.top - panOffset.y) / zoom,
      });
    }
  };

  // Stop dragging / Drop block
  const handleMouseUp = (e) => {
    // Stop panning
    if (isPanning) {
      setIsPanning(false);
      // Don't return here, continue to handle block drop if needed
    }

    // Delete block if dropped over trash
    if (draggedBlock && isOverTrash) {
      handleBlockDelete(draggedBlock.id);
      setDraggedBlock(null);
      setIsOverTrash(false);
      return;
    }

    // Drop block from palette
    if (draggingFromPalette && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      // Account for pan offset and zoom when dropping blocks
      const x = (e.clientX - rect.left - panOffset.x) / zoom - 60;
      const y = (e.clientY - rect.top - panOffset.y) / zoom - 20;

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
        setBlocks([...blocks, newBlock]);
      } else if (category === 'agent') {
        newBlock.model = MODELS[0].value;
        newBlock.system_prompt = 'You are a game AI agent.';
        newBlock.user_prompt = 'Choose your best action.';
        newBlock.tool_connections = [];
        // Don't add agent block to canvas yet, store as pending
        setPendingAgentBlock(newBlock);
        setConfigModalBlock(newBlock);
      } else if (category === 'tool') {
        newBlock.tool_type = blockDef.tool_type;
        newBlock.parameters = blockDef.parameters;
        setBlocks([...blocks, newBlock]);
      }
    }

    setDraggedBlock(null);
    setDraggingFromPalette(null);
    setShowTrash(false);
    setIsOverTrash(false);
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
        toast.error('Invalid connection! Actions/Tools connect to Agents. Agents connect to Tools.');
      }

      setConnectingFrom(null);
    }
  };

  // Delete connection
  const handleConnectionClick = (connId) => {
    setConnections(connections.filter(c => c.id !== connId));
  };

  // Handle right-click on connection dot to show context menu
  const handleConnectionRightClick = (e, connId, midX, midY) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: midX,
      y: midY,
      connectionId: connId,
    });
  };

  // Delete connection from context menu
  const handleDeleteConnection = (connId) => {
    setConnections(connections.filter(c => c.id !== connId));
    setContextMenu(null);
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
    if (pendingAgentBlock) {
      // This is a new agent block, add it to canvas with config
      setBlocks([...blocks, { ...pendingAgentBlock, ...config }]);
      setPendingAgentBlock(null);
    } else {
      // This is an existing agent block, update its config
      setBlocks(blocks.map(b =>
        b.id === configModalBlock.id
          ? { ...b, ...config }
          : b
      ));
    }
    setConfigModalBlock(null);
  };

  // Get actual block dimensions from DOM element
  const getBlockDimensions = (blockId) => {
    const blockElement = blockRefs.current[blockId];
    if (blockElement) {
      const rect = blockElement.getBoundingClientRect();
      // Return actual rendered dimensions (already includes zoom via transform)
      return {
        width: rect.width,
        height: rect.height,
      };
    }
    // Fallback to estimated dimensions (accounting for zoom)
    return { width: 140 * zoom, height: 50 * zoom };
  };

  // Get block connection point on edge (closest to target) and return edge info
  const getBlockConnectionPoint = (blockId, targetBlockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return { x: 0, y: 0, edge: null };
    
    // Get actual block position and dimensions
    const blockX = block.x * zoom + panOffset.x;
    const blockY = block.y * zoom + panOffset.y;
    const blockDims = getBlockDimensions(blockId);
    const blockWidth = blockDims.width;
    const blockHeight = blockDims.height;
    
    // Calculate block center
    const centerX = blockX + blockWidth / 2;
    const centerY = blockY + blockHeight / 2;
    
    // If no target, return center (for preview line)
    if (!targetBlockId) {
      return { x: centerX, y: centerY, edge: null };
    }
    
    // Get target block center
    const targetBlock = blocks.find(b => b.id === targetBlockId);
    if (!targetBlock) return { x: centerX, y: centerY, edge: null };
    
    const targetDims = getBlockDimensions(targetBlockId);
    const targetX = targetBlock.x * zoom + panOffset.x;
    const targetY = targetBlock.y * zoom + panOffset.y;
    const targetWidth = targetDims.width;
    const targetHeight = targetDims.height;
    const targetCenterX = targetX + targetWidth / 2;
    const targetCenterY = targetY + targetHeight / 2;
    
    // Calculate 4 edge connection points (on the actual edge, accounting for border and arrowhead)
    const borderWidth = 2; // 2px border
    const arrowheadOffset = 8; // Account for arrowhead marker size
    
    const topPoint = { x: centerX, y: blockY - arrowheadOffset, edge: 'top' };
    const bottomPoint = { x: centerX, y: blockY + blockHeight + arrowheadOffset, edge: 'bottom' };
    const leftPoint = { x: blockX - arrowheadOffset, y: centerY, edge: 'left' };
    const rightPoint = { x: blockX + blockWidth + arrowheadOffset, y: centerY, edge: 'right' };
    
    // Calculate distances to target center
    const distances = {
      top: Math.sqrt(Math.pow(topPoint.x - targetCenterX, 2) + Math.pow(topPoint.y - targetCenterY, 2)),
      bottom: Math.sqrt(Math.pow(bottomPoint.x - targetCenterX, 2) + Math.pow(bottomPoint.y - targetCenterY, 2)),
      left: Math.sqrt(Math.pow(leftPoint.x - targetCenterX, 2) + Math.pow(leftPoint.y - targetCenterY, 2)),
      right: Math.sqrt(Math.pow(rightPoint.x - targetCenterX, 2) + Math.pow(rightPoint.y - targetCenterY, 2)),
    };
    
    // Find closest edge point
    const closestEdge = Object.entries(distances).reduce((a, b) => a[1] < b[1] ? a : b)[0];
    
    switch (closestEdge) {
      case 'top': return topPoint;
      case 'bottom': return bottomPoint;
      case 'left': return leftPoint;
      case 'right': return rightPoint;
      default: return { x: centerX, y: centerY, edge: null };
    }
  };

  // Get arrowhead orientation based on edge
  const getArrowheadOrientation = (edge) => {
    switch (edge) {
      case 'top': return 90; // Point down (90 degrees)
      case 'bottom': return 270; // Point up (270 degrees)
      case 'left': return 0; // Point right (0 degrees)
      case 'right': return 180; // Point left (180 degrees)
      default: return 'auto';
    }
  };

  // Extend connection point to account for arrowhead tip
  const extendToArrowheadTip = (point, edge) => {
    const tipExtension = 2; // Distance from refX (10) to tip (12)
    
    switch (edge) {
      case 'top': // Arrow points down
        return { ...point, y: point.y + tipExtension };
      case 'bottom': // Arrow points up
        return { ...point, y: point.y - tipExtension };
      case 'left': // Arrow points right
        return { ...point, x: point.x + tipExtension };
      case 'right': // Arrow points left
        return { ...point, x: point.x - tipExtension };
      default:
        return point;
    }
  };

  // Get block center position (for backward compatibility with preview line)
  const getBlockCenter = (blockId) => {
    return getBlockConnectionPoint(blockId, null);
  };

  // Deploy agent to backend
  const handleDeploy = async () => {
    if (!agentId.trim()) {
      toast.error('Please enter an Agent ID!');
      return;
    }

    // Validate at least one onStart block
    const hasOnStart = blocks.some(b => b.blockType === 'action' && b.action_type === 'onStart');
    if (!hasOnStart) {
      toast.error('You must have at least one "On Start" block!');
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
      toast.success(`Agent "${result.agent_id}" deployed successfully! Current node: ${result.current_node}`);
    } catch (error) {
      console.error('Deployment error:', error);
      toast.error(`Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
    }
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
      className={`flex h-[calc(100vh-4rem)] overflow-hidden ${theme.bg.primary}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Global animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      {/* Left Column - Game Preview & Run Button (2/5 width) */}
      <div className={`w-2/5 flex flex-col ${theme.bg.secondary} ${theme.border.primary} border-r shadow-lg h-full overflow-hidden`}>
        {/* Top - Game Iframe */}
        <div className="flex-1 p-3 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
            <h3 className={`text-xs font-bold ${theme.text.primary} uppercase tracking-wide`}>Game Preview</h3>
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
          <div className={`flex-1 relative bg-slate-900 dark:bg-slate-950 rounded-lg border-2 ${theme.border.secondary} overflow-hidden shadow-inner min-h-0`}>
            <iframe
              src="http://localhost:3000"
              className="w-full h-full border-0"
              title="Game Environment"
              allow="fullscreen"
            />
          </div>
        </div>

        {/* Bottom - Deploy Button */}
        <div className={`p-3 border-t ${theme.border.primary} flex-shrink-0`}>
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{deploying ? 'DEPLOYING...' : 'DEPLOY AGENT'}</span>
          </button>

          <div className={`mt-2 text-xs ${theme.text.tertiary} text-center`}>
            <p className="font-semibold">Blocks: {blocks.length} | Connections: {connections.length}</p>
          </div>
        </div>
      </div>

      {/* Right Side - Instructions & Builder Area (3/5 width) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Top - Instructions Section */}
        <div className={`${theme.bg.secondary} border-b ${theme.border.primary} shadow-sm flex-shrink-0 overflow-hidden`}>
          <div className="px-6 py-2.5 flex items-center justify-between gap-3">
            <button
              onClick={prevInstruction}
              className={`p-1.5 rounded-full ${theme.bg.hover} transition flex-shrink-0`}
              title="Previous"
            >
              <svg className={`w-5 h-5 ${theme.text.secondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 text-center min-w-0">
              <h2 className={`text-base font-bold ${theme.text.primary}`}>
                {INSTRUCTIONS[currentInstruction].title}
              </h2>
              <p className={`text-sm ${theme.text.secondary}`}>
                {INSTRUCTIONS[currentInstruction].content}
              </p>
            </div>

            <button
              onClick={nextInstruction}
              className={`p-1.5 rounded-full ${theme.bg.hover} transition flex-shrink-0`}
              title="Next"
            >
              <svg className={`w-5 h-5 ${theme.text.secondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className={`w-64 ${theme.bg.secondary} border-r ${theme.border.primary} shadow-md p-4 flex-shrink-0 overflow-y-auto`}>
            <h2 className={`font-bold ${theme.text.primary} mb-4 text-xl`}>Block Builder</h2>
            <div className="mb-1">
              <label className={`text-sm font-bold ${theme.text.secondary}`}>Agent ID</label>
            </div>
            
            {/* Agent ID input */}
            <div className="mb-4">
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="e.g., bot_001"
                className={`w-full px-3 py-2 ${theme.components.input.border} border rounded text-sm ${theme.components.input.bg} ${theme.components.input.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                style={theme.isDark ? { 
                  backgroundColor: '#3a3a3a', 
                  color: '#ffffff',
                  borderColor: '#404040'
                } : {}}
              />
            </div>

            {/* Block categories */}
            {Object.entries(BLOCK_CATEGORIES).map(([categoryKey, category]) => (
              <div key={categoryKey} className="mb-4">
                <h3 className={`text-sm font-bold mb-1 ${theme.text.secondary}`}>{category.label}</h3>
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

            <div className={`mt-6 text-xs ${theme.text.tertiary}`}>
              <p className="font-bold mb-2">Controls:</p>
              <ul className="space-y-1">
                <li>• Drag block to canvas</li>
                <li>• Drag to reposition</li>
                <li>• Right-click to connect</li>
                <li>• Double-click to configure/delete</li>
              </ul>
            </div>

            {/* Clear All Button */}
            <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
              <button
                onClick={handleClearAll}
                disabled={blocks.length === 0 && connections.length === 0}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  blocks.length === 0 && connections.length === 0
                    ? 'bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-95'
                }`}
                title={blocks.length === 0 && connections.length === 0 ? 'No blocks to clear' : 'Clear all blocks and connections'}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    />
                  </svg>
                  <span>Clear All Blocks</span>
                </div>
              </button>
            </div>
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

          {/* Canvas - Node Workspace */}
          <div
            ref={canvasRef}
            className={`flex-1 relative ${theme.bg.canvas} overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              backgroundImage: theme.isDark 
                ? 'radial-gradient(circle, #404040 1px, transparent 1px)'
                : 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
            }}
            onMouseDown={handleCanvasMouseDown}
            onContextMenu={(e) => {
              // Close context menu if clicking outside
              if (contextMenu) {
                setContextMenu(null);
              }
              e.preventDefault(); // Prevent right-click menu when panning
            }}
            onClick={() => {
              // Close context menu when clicking on canvas
              if (contextMenu) {
                setContextMenu(null);
              }
            }}
          >
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {/* Existing connections */}
              {connections.map(conn => {
                const from = getBlockConnectionPoint(conn.from, conn.to);
                const to = getBlockConnectionPoint(conn.to, conn.from);
                // Extend the endpoint to the arrowhead tip
                const toExtended = extendToArrowheadTip(to, to.edge);
                const midX = (from.x + toExtended.x) / 2;
                const midY = (from.y + toExtended.y) / 2;
                const arrowOrientation = getArrowheadOrientation(to.edge);
                const markerId = `arrowhead-${arrowOrientation}`;

                // Determine curve shape based on connection edge
                // For top/bottom connections, flip curve to be vertical-first
                const isVerticalConnection = to.edge === 'top' || to.edge === 'bottom';
                let pathD;
                
                if (isVerticalConnection) {
                  // Vertical-first curve: curve vertically first, then horizontally
                  pathD = `M ${from.x} ${from.y} Q ${from.x} ${midY} ${midX} ${midY} T ${toExtended.x} ${toExtended.y}`;
                } else {
                  // Horizontal-first curve: curve horizontally first, then vertically
                  pathD = `M ${from.x} ${from.y} Q ${midX} ${from.y} ${midX} ${midY} T ${toExtended.x} ${toExtended.y}`;
                }

                return (
                  <g key={conn.id}>
                    <path
                      d={pathD}
                      stroke="#475569"
                      strokeWidth="3"
                      fill="none"
                      markerEnd={`url(#${markerId})`}
                    />
                    <circle
                      cx={midX}
                      cy={midY}
                      r="10"
                      fill="#ef4444"
                      className="cursor-pointer pointer-events-auto hover:r-12 transition"
                      onClick={() => handleConnectionClick(conn.id)}
                      onContextMenu={(e) => handleConnectionRightClick(e, conn.id, midX, midY)}
                      title="Right-click to delete connection"
                    />
                  </g>
                );
              })}

              {/* Preview connection line */}
              {connectingFrom && (
                <line
                  x1={getBlockCenter(connectingFrom).x}
                  y1={getBlockCenter(connectingFrom).y}
                  x2={mousePos.x * zoom + panOffset.x}
                  y2={mousePos.y * zoom + panOffset.y}
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                />
              )}

              {/* Animated transition particles */}
              {animatingTransitions.map(transition => {
                // Find the connection between from and to blocks
                const connection = connections.find(
                  conn => conn.from === transition.fromBlockId && conn.to === transition.toBlockId
                );

                if (!connection) {
                  console.warn(`⚠️ No connection found for transition: ${transition.fromBlockId} → ${transition.toBlockId}`);
                  return null; // Skip if no connection exists
                }

                // Use edge-based connection points (same as arrows)
                const from = getBlockConnectionPoint(transition.fromBlockId, transition.toBlockId);
                const to = getBlockConnectionPoint(transition.toBlockId, transition.fromBlockId);
                const toExtended = extendToArrowheadTip(to, to.edge);

                // Extend the path into the blocks based on edge direction
                const extendDistance = 40; // Pixels to extend into the block
                let fromExtended = { ...from };
                let toExtendedIntoBlock = { ...toExtended };

                // Extend start point INTO source block (opposite direction of edge)
                switch (from.edge) {
                  case 'right': fromExtended.x -= extendDistance; break;  // Go left into block
                  case 'left': fromExtended.x += extendDistance; break;   // Go right into block
                  case 'bottom': fromExtended.y -= extendDistance; break; // Go up into block
                  case 'top': fromExtended.y += extendDistance; break;    // Go down into block
                }

                // Extend end point INTO destination block (into block interior)
                switch (to.edge) {
                  case 'right': toExtendedIntoBlock.x -= extendDistance; break;  // Go left into block
                  case 'left': toExtendedIntoBlock.x += extendDistance; break;   // Go right into block
                  case 'bottom': toExtendedIntoBlock.y -= extendDistance; break; // Go up into block
                  case 'top': toExtendedIntoBlock.y += extendDistance; break;    // Go down into block
                }

                const midX = (from.x + toExtended.x) / 2;
                const midY = (from.y + toExtended.y) / 2;

                // Determine curve shape based on connection edge (same logic as connections)
                const isVerticalConnection = to.edge === 'top' || to.edge === 'bottom';
                let pathD;

                if (isVerticalConnection) {
                  // Vertical-first curve with extensions
                  pathD = `M ${fromExtended.x} ${fromExtended.y} L ${from.x} ${from.y} Q ${from.x} ${midY} ${midX} ${midY} T ${toExtended.x} ${toExtended.y} L ${toExtendedIntoBlock.x} ${toExtendedIntoBlock.y}`;
                } else {
                  // Horizontal-first curve with extensions
                  pathD = `M ${fromExtended.x} ${fromExtended.y} L ${from.x} ${from.y} Q ${midX} ${from.y} ${midX} ${midY} T ${toExtended.x} ${toExtended.y} L ${toExtendedIntoBlock.x} ${toExtendedIntoBlock.y}`;
                }

                // Calculate animation duration - longer with 3 phases: fill, hold, fade
                const duration = '1.5s'; // 1500ms total

                // Create keyframes for flowing highlight effect
                const flowKeyframe = `flow-${transition.id}`;
                const fadeKeyframe = `fade-${transition.id}`;

                // Get the arrow path without extensions (just the visible connection)
                const arrowPathD = isVerticalConnection
                  ? `M ${from.x} ${from.y} Q ${from.x} ${midY} ${midX} ${midY} T ${toExtended.x} ${toExtended.y}`
                  : `M ${from.x} ${from.y} Q ${midX} ${from.y} ${midX} ${midY} T ${toExtended.x} ${toExtended.y}`;

                // Estimate path length for animation (rough calculation)
                const dx = toExtended.x - from.x;
                const dy = toExtended.y - from.y;
                const estimatedLength = Math.sqrt(dx * dx + dy * dy) * 1.5; // 1.5x for curve

                return (
                  <g key={transition.id}>
                    <style>
                      {`
                        @keyframes ${flowKeyframe} {
                          0% {
                            stroke-dashoffset: ${estimatedLength};
                          }
                          33% {
                            stroke-dashoffset: 0;
                          }
                          66% {
                            stroke-dashoffset: 0;
                          }
                          100% {
                            stroke-dashoffset: -${estimatedLength};
                          }
                        }
                        @keyframes ${fadeKeyframe} {
                          0% {
                            opacity: 0;
                          }
                          5% {
                            opacity: 1;
                          }
                          66% {
                            opacity: 1;
                          }
                          100% {
                            opacity: 1;
                          }
                        }
                      `}
                    </style>

                    {/* Flowing highlighted arrow path */}
                    <path
                      d={arrowPathD}
                      stroke="#3b82f6"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${estimatedLength} ${estimatedLength}`}
                      style={{
                        filter: 'drop-shadow(0 0 8px #3b82f6)',
                        animation: `${flowKeyframe} ${duration} ease-out ${transition.delay}ms forwards, ${fadeKeyframe} ${duration} ease-in-out ${transition.delay}ms forwards`,
                        strokeDashoffset: estimatedLength,
                        opacity: 0
                      }}
                    />
                  </g>
                );
              })}

              {/* Animated transition particles */}
              {animatingTransitions.map(transition => {
                // Find the connection between from and to blocks
                const connection = connections.find(
                  conn => conn.from === transition.fromBlockId && conn.to === transition.toBlockId
                );

                if (!connection) {
                  console.warn(`⚠️ No connection found for transition: ${transition.fromBlockId} → ${transition.toBlockId}`);
                  return null; // Skip if no connection exists
                }

                // Use edge-based connection points (same as arrows)
                const from = getBlockConnectionPoint(transition.fromBlockId, transition.toBlockId);
                const to = getBlockConnectionPoint(transition.toBlockId, transition.fromBlockId);
                const toExtended = extendToArrowheadTip(to, to.edge);

                // Extend the path into the blocks based on edge direction
                const extendDistance = 40; // Pixels to extend into the block
                let fromExtended = { ...from };
                let toExtendedIntoBlock = { ...toExtended };

                // Extend start point INTO source block (opposite direction of edge)
                switch (from.edge) {
                  case 'right': fromExtended.x -= extendDistance; break;  // Go left into block
                  case 'left': fromExtended.x += extendDistance; break;   // Go right into block
                  case 'bottom': fromExtended.y -= extendDistance; break; // Go up into block
                  case 'top': fromExtended.y += extendDistance; break;    // Go down into block
                }

                // Extend end point INTO destination block (into block interior)
                switch (to.edge) {
                  case 'right': toExtendedIntoBlock.x -= extendDistance; break;  // Go left into block
                  case 'left': toExtendedIntoBlock.x += extendDistance; break;   // Go right into block
                  case 'bottom': toExtendedIntoBlock.y -= extendDistance; break; // Go up into block
                  case 'top': toExtendedIntoBlock.y += extendDistance; break;    // Go down into block
                }

                const midX = (from.x + toExtended.x) / 2;
                const midY = (from.y + toExtended.y) / 2;

                // Determine curve shape based on connection edge (same logic as connections)
                const isVerticalConnection = to.edge === 'top' || to.edge === 'bottom';
                let pathD;

                if (isVerticalConnection) {
                  // Vertical-first curve with extensions
                  pathD = `M ${fromExtended.x} ${fromExtended.y} L ${from.x} ${from.y} Q ${from.x} ${midY} ${midX} ${midY} T ${toExtended.x} ${toExtended.y} L ${toExtendedIntoBlock.x} ${toExtendedIntoBlock.y}`;
                } else {
                  // Horizontal-first curve with extensions
                  pathD = `M ${fromExtended.x} ${fromExtended.y} L ${from.x} ${from.y} Q ${midX} ${from.y} ${midX} ${midY} T ${toExtended.x} ${toExtended.y} L ${toExtendedIntoBlock.x} ${toExtendedIntoBlock.y}`;
                }

                // Calculate animation duration - longer with 3 phases: fill, hold, fade
                const duration = '1.5s'; // 1500ms total

                // Create keyframes for flowing highlight effect
                const flowKeyframe = `flow-${transition.id}`;
                const fadeKeyframe = `fade-${transition.id}`;

                // Get the arrow path without extensions (just the visible connection)
                const arrowPathD = isVerticalConnection
                  ? `M ${from.x} ${from.y} Q ${from.x} ${midY} ${midX} ${midY} T ${toExtended.x} ${toExtended.y}`
                  : `M ${from.x} ${from.y} Q ${midX} ${from.y} ${midX} ${midY} T ${toExtended.x} ${toExtended.y}`;

                // Estimate path length for animation (rough calculation)
                const dx = toExtended.x - from.x;
                const dy = toExtended.y - from.y;
                const estimatedLength = Math.sqrt(dx * dx + dy * dy) * 1.5; // 1.5x for curve

                return (
                  <g key={transition.id}>
                    <style>
                      {`
                        @keyframes ${flowKeyframe} {
                          0% {
                            stroke-dashoffset: ${estimatedLength};
                          }
                          33% {
                            stroke-dashoffset: 0;
                          }
                          66% {
                            stroke-dashoffset: 0;
                          }
                          100% {
                            stroke-dashoffset: -${estimatedLength};
                          }
                        }
                        @keyframes ${fadeKeyframe} {
                          0% {
                            opacity: 0;
                          }
                          5% {
                            opacity: 1;
                          }
                          66% {
                            opacity: 1;
                          }
                          100% {
                            opacity: 1;
                          }
                        }
                      `}
                    </style>

                    {/* Flowing highlighted arrow path */}
                    <path
                      d={arrowPathD}
                      stroke="#3b82f6"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${estimatedLength} ${estimatedLength}`}
                      style={{
                        filter: 'drop-shadow(0 0 8px #3b82f6)',
                        animation: `${flowKeyframe} ${duration} ease-out ${transition.delay}ms forwards, ${fadeKeyframe} ${duration} ease-in-out ${transition.delay}ms forwards`,
                        strokeDashoffset: estimatedLength,
                        opacity: 0
                      }}
                    />
                  </g>
                );
              })}

              {/* Context menu for connection deletion */}
              {contextMenu && (
                <foreignObject
                  x={contextMenu.x - 60}
                  y={contextMenu.y - 30}
                  width="120"
                  height="60"
                  className="pointer-events-auto"
                >
                  <div className={`${theme.bg.secondary} ${theme.border.primary} border rounded-lg shadow-lg p-2`}>
                    <button
                      onClick={() => handleDeleteConnection(contextMenu.connectionId)}
                      className={`w-full px-3 py-2 text-sm rounded hover:bg-opacity-80 transition-colors ${
                        theme.isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      Delete Connection
                    </button>
                  </div>
                </foreignObject>
              )}

              {/* Arrowhead markers for different orientations */}
              <defs>
                {/* Arrowhead pointing right (0 degrees) - for left edge connections */}
                <marker
                  id="arrowhead-0"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="0"
                  markerUnits="userSpaceOnUse"
                >
                  <polygon points="0 0, 12 6, 0 12" fill="#475569" />
                </marker>
                {/* Arrowhead pointing down (90 degrees) - for top edge connections */}
                <marker
                  id="arrowhead-90"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="90"
                  markerUnits="userSpaceOnUse"
                >
                  <polygon points="0 0, 12 6, 0 12" fill="#475569" />
                </marker>
                {/* Arrowhead pointing left (180 degrees) - for right edge connections */}
                <marker
                  id="arrowhead-180"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="180"
                  markerUnits="userSpaceOnUse"
                >
                  <polygon points="0 0, 12 6, 0 12" fill="#475569" />
                </marker>
                {/* Arrowhead pointing up (270 degrees) - for bottom edge connections */}
                <marker
                  id="arrowhead-270"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="270"
                  markerUnits="userSpaceOnUse"
                >
                  <polygon points="0 0, 12 6, 0 12" fill="#475569" />
                </marker>
              </defs>
            </svg>

            {/* Blocks */}
            {blocks.map(block => {
              // Check if this block is currently executing for THIS agent (matching agentId)
              const isExecuting = agentId && currentNodes[agentId]?.currentNode === block.id;

              // Colors based on theme - darker yellow for light mode for better contrast
              const highlightColor = theme.isDark ? '#ffff00' : '#d97706'; // Bright yellow for dark, amber-600 for light
              const glowColor = theme.isDark ? 'rgba(255, 255, 0, 0.9)' : 'rgba(217, 119, 6, 0.8)';

              return (
                <div
                  key={block.id}
                  ref={(el) => {
                    if (el) blockRefs.current[block.id] = el;
                    else delete blockRefs.current[block.id];
                  }}
                  onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
                  onClick={(e) => handleBlockClick(e, block.id)}
                  onContextMenu={(e) => handleBlockRightClick(e, block.id)}
                  onDoubleClick={(e) => handleBlockDoubleClick(e, block.id)}
                  className={`absolute rounded-lg shadow-lg text-white text-sm font-medium cursor-move select-none hover:shadow-xl ${isExecuting ? 'active-executing-node' : ''}`}
                  style={{
                    left: block.x * zoom + panOffset.x,
                    top: block.y * zoom + panOffset.y,
                    transform: `scale(${zoom})`,
                    transformOrigin: '0 0',
                    backgroundColor: block.color,
                    padding: '8px 16px',
                    zIndex: isExecuting ? 20 : 10,
                    border: connectingFrom === block.id ? '3px solid yellow' : isExecuting ? `3px solid ${highlightColor}` : '3px solid rgba(0,0,0,0.2)',
                    boxShadow: isExecuting ? `0 0 25px 8px ${glowColor}` : 'none',
                    transition: 'border 300ms ease-in-out, box-shadow 300ms ease-in-out',
                  }}
                >
                  {isExecuting && (
                    <div
                      className="absolute -left-6 top-1/2 -translate-y-1/2 text-lg animate-pulse"
                      style={{
                        color: highlightColor,
                        animation: 'fadeIn 300ms ease-in-out'
                      }}
                    >
                      ▶
                    </div>
                  )}
                  <div>{block.label}</div>
                  {block.blockType === 'agent' && (
                    <div className="text-xs opacity-75 mt-1">
                      {block.model.split('/')[1]}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state instructions */}
            {blocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`${theme.text.tertiary} text-center px-8`}>
                  <svg className="w-24 h-24 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className={`text-2xl font-bold mb-2 ${theme.text.primary}`}>Start Building Your Agent</p>
                  <p className={`text-lg ${theme.text.secondary}`}>Drag blocks from the left sidebar onto this canvas</p>
                  <p className={`text-sm mt-2 ${theme.text.tertiary}`}>Right-click blocks to create connections</p>
                </div>
              </div>
            )}

            {/* Trash Zone - appears when dragging a block near bottom middle */}
            {showTrash && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 transition-all duration-200 pointer-events-none"
                style={{ 
                  bottom: '60px',
                  transform: `translateX(-50%) scale(${isOverTrash ? 1.2 : 1})`,
                  opacity: showTrash ? 1 : 0,
                }}
              >
                <div 
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isOverTrash 
                      ? 'bg-red-600 shadow-2xl' 
                      : 'bg-red-500 shadow-lg'
                  }`}
                >
                  <svg 
                    className="w-8 h-8 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Zoom Controls - Bottom Right */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-50">
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 2}
                className={`w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-all ${
                  zoom >= 2
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : `${theme.bg.secondary} ${theme.border.primary} border hover:bg-opacity-80 cursor-pointer`
                }`}
                title="Zoom In"
              >
                <svg 
                  className={`w-5 h-5 ${theme.text.primary}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                  />
                </svg>
              </button>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className={`w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-all ${
                  zoom <= 0.5
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : `${theme.bg.secondary} ${theme.border.primary} border hover:bg-opacity-80 cursor-pointer`
                }`}
                title="Zoom Out"
              >
                <svg 
                  className={`w-5 h-5 ${theme.text.primary}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M20 12H4" 
                  />
                </svg>
              </button>
              <div className={`w-10 h-8 rounded-lg shadow-lg flex items-center justify-center ${theme.bg.secondary} ${theme.border.primary} border`}>
                <span className={`text-xs font-semibold ${theme.text.primary}`}>
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Configuration Modal */}
      {configModalBlock && (
        <AgentConfigModal
          block={configModalBlock}
          onSave={handleSaveAgentConfig}
          onDelete={(blockId) => {
            setBlocks(blocks.filter(b => b.id !== blockId));
            setPendingAgentBlock(null);
            setConfigModalBlock(null);
          }}
          onClose={() => {
            setPendingAgentBlock(null);
            setConfigModalBlock(null);
          }}
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme.isDark ? '#1f2937' : '#ffffff',
            color: theme.isDark ? '#ffffff' : '#111827',
            border: `2px solid ${theme.isDark ? '#374151' : '#d1d5db'}`,
            borderRadius: '8px',
            padding: '16px 20px',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: theme.isDark 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          },
          success: {
            style: {
              background: theme.isDark ? '#064e3b' : '#d1fae5',
              color: theme.isDark ? '#ffffff' : '#065f46',
              border: `2px solid ${theme.isDark ? '#10b981' : '#10b981'}`,
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            style: {
              background: theme.isDark ? '#7f1d1d' : '#fee2e2',
              color: theme.isDark ? '#ffffff' : '#991b1b',
              border: `2px solid ${theme.isDark ? '#ef4444' : '#ef4444'}`,
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  );
}

// Agent Configuration Modal Component
function AgentConfigModal({ block, onSave, onDelete, onClose }) {
  const [model, setModel] = useState(block.model || MODELS[0].value);
  const [systemPrompt, setSystemPrompt] = useState(block.system_prompt || '');
  const [userPrompt, setUserPrompt] = useState(block.user_prompt || '');

  const handleSave = () => {
    if (!systemPrompt.trim() || !userPrompt.trim()) {
      toast.error('Please fill in both prompts!');
      return;
    }
    onSave({ model, system_prompt: systemPrompt, user_prompt: userPrompt });
  };

  const handleDelete = () => {
    onDelete(block.id);
  };

  const theme = useTheme();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={`${theme.bg.modal} ${theme.text.primary} rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-xl`} 
        style={theme.isDark ? { backgroundColor: '#2d2d2d' } : { backgroundColor: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`text-xl font-bold mb-4 ${theme.text.primary}`}>Configure Agent Block</h2>

        <div className="space-y-4">
          {/* Model Selection */}
          <div className="mb-1">
            <label className={`text-sm font-bold ${theme.text.secondary}`}>Model</label>
          </div>
          <div className="mb-4">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`w-full px-3 py-2 ${theme.components.input.border} border rounded text-sm ${theme.components.input.bg} ${theme.components.input.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              style={theme.isDark ? { backgroundColor: '#3a3a3a', color: '#ffffff' } : {}}
            >
              {MODELS.map(m => (
                <option 
                  key={m.value} 
                  value={m.value}
                  style={theme.isDark ? { backgroundColor: '#3a3a3a', color: '#ffffff' } : {}}
                >
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* System Prompt */}
          <div className="mb-1">
            <label className={`text-sm font-bold ${theme.text.secondary}`}>System Prompt</label>
          </div>
          <div className="mb-4">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g., You are a tactical battle royale AI agent..."
              className={`w-full px-3 py-2 ${theme.components.input.border} border rounded text-sm h-24 resize-none ${theme.components.input.bg} ${theme.components.input.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              style={theme.isDark ? { 
                backgroundColor: '#3a3a3a', 
                color: '#ffffff',
                borderColor: '#404040'
              } : {}}
            />
          </div>

          {/* User Prompt */}
          <div className="mb-1">
            <label className={`text-sm font-bold ${theme.text.secondary}`}>User Prompt</label>
          </div>
          <div className="mb-4">
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., Analyze the game state and choose your best action..."
              className={`w-full px-3 py-2 ${theme.components.input.border} border rounded text-sm h-24 resize-none ${theme.components.input.bg} ${theme.components.input.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              style={theme.isDark ? { 
                backgroundColor: '#3a3a3a', 
                color: '#ffffff',
                borderColor: '#404040'
              } : {}}
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 ${theme.border.primary} border rounded ${theme.bg.hover} transition-colors ${theme.text.primary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
