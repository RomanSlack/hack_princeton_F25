'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

// Import lesson data from shared file
import { LESSONS } from '../../../data/lessons';

// Lesson-specific builder configurations
const LESSON_CONFIGS = {
  1: {
    // Introduction - limited blocks for first lesson
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'], // Only On Start
    allowedToolBlocks: ['move'], // Only Move
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonGuidelines: [
      { text: 'Enter an Agent ID in the sidebar (e.g., "my_agent") - this gives your agent a name' },
      { text: 'Drag an', block: 'onStart', textAfter: 'block onto the canvas - this is where your agent begins' },
      { text: 'Connect it to an', block: 'agent', textAfter: 'block - this lets your agent think and make choices' },
      { text: 'Connect the agent to a', block: 'move', textAfter: 'block - this tells your agent what action to take' },
      { text: 'Click "Deploy Agent" to test your agent in the game preview' },
    ],
  },
  3: {
    // Simple Reflex Agents - only action blocks
    showBuilder: true,
    allowedBlocks: ['action'],
    showAgentBlock: false,
    showToolBlock: false,
    showConnections: false,
  },
  7: {
    // Prompt Engineering - agent blocks with prompt editing
    showBuilder: true,
    allowedBlocks: ['agent'],
    showAgentBlock: true,
    showToolBlock: false,
    showConnections: false,
  },
  11: {
    // Tool Calling - agent + tool blocks
    showBuilder: true,
    allowedBlocks: ['agent', 'tool'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
  },
  // Add more lesson configs as needed
};

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const lessonId = parseInt(params.id);
  const lesson = LESSONS.find(l => l.id === lessonId);
  const config = LESSON_CONFIGS[lessonId] || {
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: null, // null means show all
    allowedToolBlocks: null, // null means show all
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonGuidelines: [
      { text: 'Review the lesson content and understand the core concepts' },
      { text: 'Use the builder on the right to create your agent following the lesson guidelines' },
      { text: 'Test your agent in the game preview and iterate on your design' },
      { text: 'Ask discer below if you need help or have questions' },
    ],
  };

  if (!lesson) {
    return (
      <div className={`min-h-screen ${theme.bg.primary} flex items-center justify-center`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold ${theme.text.primary} mb-4`}>Lesson not found</h1>
          <Link href="/lessons" className={`text-blue-600 hover:underline`}>
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${config.showBuilder ? 'h-[calc(100vh-4rem)] flex flex-col overflow-hidden' : 'min-h-screen'} ${theme.bg.primary}`}>
      {/* Lesson Content */}
      {config.showBuilder ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <LessonBuilder lesson={lesson} config={config} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-6">
          <div className={`${theme.bg.secondary} rounded-lg p-8 ${theme.border.primary} border`}>
            <h2 className={`text-xl font-bold ${theme.text.primary} mb-4`}>
              {lesson.learningObjective}
            </h2>
            <p className={theme.text.secondary}>
              This lesson focuses on conceptual understanding. The interactive builder will be available in later lessons.
            </p>
          </div>
        </div>
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

// Full Builder Component for Lessons
function LessonBuilder({ lesson, config }) {
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
  const [configModalBlock, setConfigModalBlock] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [pendingAgentBlock, setPendingAgentBlock] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [leftPanelView, setLeftPanelView] = useState('instructions'); // 'game' or 'instructions'
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHeight, setChatHeight] = useState(300); // Default height in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [lessonProgress, setLessonProgress] = useState({}); // Track completion of each guideline
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const canvasRef = useRef(null);

  const blockIdCounter = useRef(0);

  // Initialize chat messages with welcome message
  useEffect(() => {
    if (lesson) {
      const welcomeMessages = [
        {
          id: 1,
          sender: 'teacher',
          name: 'discer',
          avatar: '🤖',
          message: `Hi! I'm discer, I can help you if you have trouble! Do you need a hint?`,
          timestamp: 'Just now',
        },
      ];
      setChatMessages(welcomeMessages);
    }
  }, [lesson]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Function to check and update progress
  const checkProgress = (currentProgress = {}) => {
    if (!config.lessonGuidelines) return {};

    const progress = { ...currentProgress };
    
    config.lessonGuidelines.forEach((guideline, index) => {
      const guidelineText = typeof guideline === 'string' ? guideline : guideline.text;
      const blockId = typeof guideline === 'object' && guideline.block ? guideline.block : null;
      
      // Skip deploy check - it's handled separately when deploy succeeds
      if (guidelineText.includes('Deploy') || guidelineText.includes('deploy')) {
        // Keep existing progress state for deploy
        return;
      }
      
      let isComplete = false;
      
      // Check agent ID entered
      if (guidelineText.includes('Agent ID') || guidelineText.includes('agent a name')) {
        isComplete = agentId.trim().length > 0;
      }
      // Check for connections FIRST (before checking block existence)
      // This ensures connection tasks require actual connections, not just block placement
      else if (guidelineText.includes('Connect')) {
        if (blockId === 'agent' && (guidelineText.includes('onStart') || guidelineText.includes('Connect it to an'))) {
          // Check if onStart is connected to agent block
          // Must have: onStart block exists AND agent block exists AND there's a connection from onStart to agent
          const onStartBlock = blocks.find(b => b.blockType === 'action' && b.action_type === 'onStart');
          const agentBlock = blocks.find(b => b.blockType === 'agent');
          isComplete = onStartBlock && agentBlock && connections.some(c => c.from === onStartBlock.id && c.to === agentBlock.id);
        } else if (blockId === 'move' && guidelineText.includes('agent')) {
          // Check if agent is connected to move
          const agentBlock = blocks.find(b => b.blockType === 'agent');
          const moveBlock = blocks.find(b => b.blockType === 'tool' && b.tool_type === 'move');
          isComplete = agentBlock && moveBlock && connections.some(c => c.from === agentBlock.id && c.to === moveBlock.id);
        }
      }
      // Check for specific blocks placed (only if not a connection task)
      else if (blockId === 'onStart') {
        isComplete = blocks.some(b => b.blockType === 'action' && b.action_type === 'onStart');
      }
      else if (blockId === 'agent' && !guidelineText.includes('Connect')) {
        // Only check block existence if it's not a connection task
        isComplete = blocks.some(b => b.blockType === 'agent');
      }
      else if (blockId === 'move' && !guidelineText.includes('Connect')) {
        // Only check block existence if it's not a connection task
        isComplete = blocks.some(b => b.blockType === 'tool' && b.tool_type === 'move');
      }
      
      progress[index] = isComplete;
    });
    
    return progress;
  };

  // Update progress whenever relevant state changes
  useEffect(() => {
    if (!isClient) return;
    
    // Get current progress from state to preserve deploy status
    setLessonProgress(prevProgress => {
      const newProgress = checkProgress(prevProgress);
      
      // Save to localStorage
      try {
        localStorage.setItem(`lesson-${lesson.id}-progress`, JSON.stringify(newProgress));
      } catch (error) {
        console.error('Error saving progress:', error);
      }
      
      return newProgress;
    });
  }, [blocks, connections, agentId, isClient, lesson.id]);

  // Load from localStorage only on client side after mount
  useEffect(() => {
    setIsClient(true);
    try {
      const savedBlocks = localStorage.getItem(`lesson-${lesson.id}-blocks`);
      const savedConnections = localStorage.getItem(`lesson-${lesson.id}-connections`);
      const savedAgentId = localStorage.getItem(`lesson-${lesson.id}-agentId`);
      const savedBlockCounter = localStorage.getItem(`lesson-${lesson.id}-blockCounter`);
      const savedProgress = localStorage.getItem(`lesson-${lesson.id}-progress`);

      if (savedBlocks) setBlocks(JSON.parse(savedBlocks));
      if (savedConnections) setConnections(JSON.parse(savedConnections));
      if (savedAgentId) setAgentId(savedAgentId);
      if (savedBlockCounter) blockIdCounter.current = parseInt(savedBlockCounter, 10);
      if (savedProgress) setLessonProgress(JSON.parse(savedProgress));
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, [lesson.id]);

  // Save to localStorage whenever state changes (only on client)
  useEffect(() => {
    if (!isClient) return; // Don't save on initial mount

    try {
      localStorage.setItem(`lesson-${lesson.id}-blocks`, JSON.stringify(blocks));
      localStorage.setItem(`lesson-${lesson.id}-blockCounter`, blockIdCounter.current.toString());
    } catch (error) {
      console.error('Error saving blocks:', error);
    }
  }, [blocks, isClient, lesson.id]);

  useEffect(() => {
    if (!isClient) return;

    try {
      localStorage.setItem(`lesson-${lesson.id}-connections`, JSON.stringify(connections));
    } catch (error) {
      console.error('Error saving connections:', error);
    }
  }, [connections, isClient, lesson.id]);

  useEffect(() => {
    if (!isClient) return;

    try {
      localStorage.setItem(`lesson-${lesson.id}-agentId`, agentId);
    } catch (error) {
      console.error('Error saving agentId:', error);
    }
  }, [agentId, isClient, lesson.id]);

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
        localStorage.removeItem(`lesson-${lesson.id}-blocks`);
        localStorage.removeItem(`lesson-${lesson.id}-connections`);
        localStorage.removeItem(`lesson-${lesson.id}-agentId`);
        localStorage.removeItem(`lesson-${lesson.id}-blockCounter`);
        localStorage.removeItem(`lesson-${lesson.id}-progress`);
        setAgentId('');
        setLessonProgress({});
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

  // Handle chat resize
  const handleChatResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    // Handle chat resizing
    if (isResizing && chatContainerRef.current) {
      const containerRect = chatContainerRef.current.getBoundingClientRect();
      const parentRect = chatContainerRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        const newHeight = parentRect.bottom - e.clientY;
        // Constrain height between 200px and 80% of parent height
        const minHeight = 200;
        const maxHeight = parentRect.height * 0.8;
        const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        setChatHeight(constrainedHeight);
      }
      return;
    }

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
    // Stop resizing
    if (isResizing) {
      setIsResizing(false);
      return;
    }

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

  // Get block center position (accounting for pan offset and zoom)
  const getBlockCenter = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return { x: 0, y: 0 };
    return { 
      x: (block.x + 60) * zoom + panOffset.x, 
      y: (block.y + 20) * zoom + panOffset.y 
    };
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
      
      // Mark deploy task as complete
      if (config.lessonGuidelines) {
        const deployIndex = config.lessonGuidelines.findIndex(g => {
          const text = typeof g === 'string' ? g : g.text;
          return text.includes('Deploy') || text.includes('deploy');
        });
        if (deployIndex !== -1) {
          setLessonProgress(prev => ({
            ...prev,
            [deployIndex]: true
          }));
        }
      }
    } catch (error) {
      console.error('Deployment error:', error);
      toast.error(`Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      name: 'You',
      avatar: '👤',
      message: userInput.trim(),
      timestamp: 'Just now',
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageText = userInput.trim();
    setUserInput('');
    setIsTyping(true);

    try {
      // Prepare lesson guidelines for context
      const lessonGuidelines = config.lessonGuidelines?.map(g => {
        if (typeof g === 'string') return g;
        return g.text + (g.textAfter ? ' ' + g.textAfter : '');
      }) || [];

      // Call the chat API
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          lesson_title: lesson.title,
          lesson_guidelines: lessonGuidelines,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from chat');
      }

      const data = await response.json();
      
      const teacherResponse = {
        id: Date.now() + 1,
        sender: 'teacher',
        name: 'discer',
        avatar: '🤖',
        message: data.response,
        timestamp: 'Just now',
      };
      setChatMessages(prev => [...prev, teacherResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse = {
        id: Date.now() + 1,
        sender: 'teacher',
        name: 'discer',
        avatar: '🤖',
        message: 'Sorry, I encountered an error. Please try again later.',
        timestamp: 'Just now',
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className={`flex h-full overflow-hidden ${theme.bg.primary}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Left Column - Toggleable Game Preview/Instructions & Deploy Button (2/5 width) */}
      <div className={`w-2/5 flex flex-col ${theme.bg.secondary} ${theme.border.primary} border-r shadow-lg h-full overflow-hidden`}>
        {/* Toggle Tabs */}
        <div className={`flex border-b ${theme.border.primary} flex-shrink-0`}>
          <button
            onClick={() => setLeftPanelView('instructions')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              leftPanelView === 'instructions'
                ? `${theme.bg.primary} ${theme.text.primary} border-b-2 border-blue-600`
                : `${theme.bg.hover} ${theme.text.secondary} hover:${theme.bg.primary}`
            }`}
          >
            Instructions
          </button>
          <button
            onClick={() => setLeftPanelView('game')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              leftPanelView === 'game'
                ? `${theme.bg.primary} ${theme.text.primary} border-b-2 border-blue-600`
                : `${theme.bg.hover} ${theme.text.secondary} hover:${theme.bg.primary}`
            }`}
          >
            Game Preview
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3 flex flex-col min-h-0 overflow-hidden">
          {leftPanelView === 'instructions' ? (
            /* Instructions View with Lesson Plan and Chat Helper */
            <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${theme.bg.secondary}`}>
              {/* Lesson Plan & Goals Section */}
              <div className={`flex-1 overflow-y-auto px-4 py-4 min-h-0`}>
                <h2 className={`text-2xl font-bold ${theme.text.primary} mb-4`}>
                  {lesson.title}
                </h2>
                
                {/* Agentic AI Blurb */}
                <div className={`mb-4 ${theme.bg.primary} rounded-lg p-4 border ${theme.border.secondary}`}>
                  <h3 className={`text-sm font-semibold uppercase tracking-wide ${theme.text.secondary} mb-2`}>
                    About Agentic AI
                  </h3>
                  <p className={`text-base leading-relaxed ${theme.text.primary}`}>
                    Agentic AI refers to AI systems that can accomplish goals with limited supervision. Unlike traditional AI that responds to prompts, agentic AI can autonomously plan, execute actions, and adapt to achieve objectives. These agents can perceive their environment, reason about situations, make decisions, and take actions—all while learning and improving over time.
                  </p>
                </div>

                {/* Lesson Plan / What to Do */}
                <div className={`mb-4 ${theme.bg.primary} rounded-lg p-4 border-2 ${theme.isDark ? 'border-blue-500' : 'border-blue-400'} shadow-md`}>
                  <h3 className={`text-base font-bold uppercase tracking-wide ${theme.text.primary} mb-3`}>
                    Your Task
                  </h3>
                  <p className={`text-xs ${theme.text.secondary} mb-4`}>
                    Follow these steps to complete this lesson:
                  </p>
                  <div className="space-y-3">
                    {config.lessonGuidelines?.map((guideline, index) => {
                      const guidelineText = typeof guideline === 'string' ? guideline : guideline.text;
                      const blockId = typeof guideline === 'object' && guideline.block ? guideline.block : null;
                      const textAfter = typeof guideline === 'object' && guideline.textAfter ? guideline.textAfter : null;
                      
                      // Find block definition
                      let blockDef = null;
                      let blockCategory = null;
                      if (blockId) {
                        for (const [catKey, category] of Object.entries(BLOCK_CATEGORIES)) {
                          const found = category.blocks.find(b => b.id === blockId);
                          if (found) {
                            blockDef = found;
                            blockCategory = catKey;
                            break;
                          }
                        }
                      }
                      
                      const isComplete = lessonProgress[index] || false;
                      
                      return (
                        <div key={index} className={`flex items-start gap-3 p-2 rounded-md hover:bg-opacity-50 transition-colors ${
                          isComplete ? (theme.isDark ? 'bg-green-900 bg-opacity-30' : 'bg-green-50') : ''
                        }`} style={!isComplete ? (theme.isDark ? { backgroundColor: 'rgba(59, 130, 246, 0.1)' } : { backgroundColor: 'rgba(59, 130, 246, 0.05)' }) : {}}>
                          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                            isComplete 
                              ? (theme.isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white')
                              : (theme.isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          }`}>
                            {isComplete ? '✓' : index + 1}
                          </div>
                          <div className={`text-sm leading-relaxed ${theme.text.primary} flex-1 font-medium flex items-center gap-2 flex-wrap`}>
                            <span>{guidelineText}</span>
                            {blockDef && blockCategory && (
                              <>
                                <span
                                  className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium text-white shadow-sm"
                                  style={{ backgroundColor: BLOCK_CATEGORIES[blockCategory].color }}
                                >
                                  {blockDef.label}
                                </span>
                                {textAfter && <span>{textAfter}</span>}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Chat Helper Section - Fixed at bottom */}
              <div 
                ref={chatContainerRef}
                className={`flex-shrink-0 flex flex-col border-t ${theme.border.primary} ${theme.bg.secondary}`}
                style={isChatOpen ? { height: `${chatHeight}px` } : {}}
              >
                {/* Drag Handle - Only show when chat is open */}
                {isChatOpen && (
                  <div
                    onMouseDown={handleChatResizeStart}
                    className={`h-2 cursor-ns-resize flex items-center justify-center hover:bg-opacity-50 ${theme.bg.hover} transition-colors flex-shrink-0`}
                  >
                    <div className={`w-12 h-1 rounded-full ${theme.isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                  </div>
                )}
                
                {/* Chat Header / Toggle Button */}
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`px-4 py-3 border-b ${theme.border.primary} flex items-center justify-between hover:${theme.bg.hover} transition-colors flex-shrink-0`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                      theme.isDark ? 'bg-blue-600' : 'bg-blue-500'
                    }`}>
                      🤖
                    </div>
                    <div className="text-left">
                      <h3 className={`text-sm font-semibold ${theme.text.primary}`}>
                        Ask discer for help
                      </h3>
                      <p className={`text-xs ${theme.text.tertiary}`}>
                        {isChatOpen ? 'Click to minimize' : 'Click to open chat'}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 ${theme.text.secondary} transition-transform ${isChatOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                
                {/* Chat Messages - Only show when open */}
                {isChatOpen && (
                  <>
                    <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 ${theme.bg.secondary} min-h-0`}>
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'teacher' && (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl ${
                        theme.isDark ? 'bg-blue-600' : 'bg-blue-500'
                      }`}>
                        {msg.avatar}
                      </div>
                    )}
                    <div className={`flex flex-col max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${theme.text.primary}`}>{msg.name}</span>
                        <span className={`text-xs ${theme.text.tertiary}`}>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2.5 ${
                          msg.sender === 'user'
                            ? theme.isDark 
                              ? 'bg-dark-bg-tertiary' 
                              : 'bg-blue-100'
                            : theme.isDark
                              ? 'bg-dark-bg-tertiary'
                              : 'bg-slate-100'
                        } ${theme.text.primary}`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                    {msg.sender === 'user' && (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                        theme.isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {msg.avatar}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl ${
                      theme.isDark ? 'bg-blue-600' : 'bg-blue-500'
                    }`}>
                      🤖
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${theme.text.primary}`}>discer</span>
                        <span className={`text-xs ${theme.text.tertiary}`}>Typing...</span>
                      </div>
                      <div className={`rounded-lg px-4 py-2.5 ${
                        theme.isDark ? 'bg-dark-bg-tertiary' : 'bg-slate-100'
                      }`}>
                        <div className="flex gap-1">
                          <div className={`w-2 h-2 rounded-full animate-bounce ${theme.isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0ms' }}></div>
                          <div className={`w-2 h-2 rounded-full animate-bounce ${theme.isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '150ms' }}></div>
                          <div className={`w-2 h-2 rounded-full animate-bounce ${theme.isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                    <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={`border-t ${theme.border.primary} p-3 ${theme.bg.secondary} flex-shrink-0`}>
                <div className="flex gap-2 items-end">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything"
                    className={`flex-1 ${theme.components.input.bg} ${theme.components.input.text} ${theme.isDark ? 'placeholder-gray-400' : 'placeholder-gray-500'} rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.components.input.border} border`}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isTyping}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      theme.isDark
                        ? 'bg-dark-bg-tertiary hover:bg-dark-bg-tertiary/80 disabled:bg-dark-bg-tertiary/50 disabled:opacity-50'
                        : 'bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:opacity-50'
                    }`}
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
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Game Preview View */
            <>
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
            </>
          )}
        </div>

        {/* Bottom - Deploy Button (only show in game view) */}
        {leftPanelView === 'game' && (
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
        )}
      </div>

      {/* Right Side - Builder Area (3/5 width) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Builder Container */}
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
            {Object.entries(BLOCK_CATEGORIES).map(([categoryKey, category]) => {
              // Filter blocks based on lesson config
              let filteredBlocks = category.blocks;
              
              if (categoryKey === 'action' && config.allowedActionBlocks) {
                filteredBlocks = category.blocks.filter(block => 
                  config.allowedActionBlocks.includes(block.id)
                );
              } else if (categoryKey === 'tool' && config.allowedToolBlocks) {
                filteredBlocks = category.blocks.filter(block => 
                  config.allowedToolBlocks.includes(block.id)
                );
              }
              
              // Skip category if no blocks are allowed or if category is not in allowedBlocks
              if (filteredBlocks.length === 0 || !config.allowedBlocks?.includes(categoryKey)) {
                return null;
              }
              
              // Hide agent block if not allowed
              if (categoryKey === 'agent' && !config.showAgentBlock) {
                return null;
              }
              
              // Hide tool block category if not allowed
              if (categoryKey === 'tool' && !config.showToolBlock) {
                return null;
              }
              
              return (
                <div key={categoryKey} className="mb-4">
                  <h3 className={`text-sm font-bold mb-1 ${theme.text.secondary}`}>{category.label}</h3>
                  <div className="space-y-2">
                    {filteredBlocks.map(blockDef => (
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
              );
            })}

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
            onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu when panning
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
                  x2={mousePos.x * zoom + panOffset.x}
                  y2={mousePos.y * zoom + panOffset.y}
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
                onClick={(e) => handleBlockClick(e, block.id)}
                onContextMenu={(e) => handleBlockRightClick(e, block.id)}
                onDoubleClick={(e) => handleBlockDoubleClick(e, block.id)}
                className="absolute rounded-lg shadow-lg text-white text-sm font-medium cursor-move select-none hover:shadow-xl transition-shadow"
                style={{
                  left: block.x * zoom + panOffset.x,
                  top: block.y * zoom + panOffset.y,
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0',
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
    </div>
  );
}

// Agent Configuration Modal Component
function AgentConfigModal({ block, onSave, onDelete, onClose }) {
  const [model, setModel] = useState(block.model || MODELS[0].value);
  const [systemPrompt, setSystemPrompt] = useState(block.system_prompt || '');
  const [userPrompt, setUserPrompt] = useState(block.user_prompt || '');
  const [openTooltip, setOpenTooltip] = useState(null); // 'model', 'systemPrompt', 'userPrompt', or null
  const theme = useTheme();

  const tooltipRefs = {
    model: useRef(null),
    systemPrompt: useRef(null),
    userPrompt: useRef(null),
  };

  const tooltipInfo = {
    model: 'A model is the AI language model that powers your agent. Different models have different capabilities, speeds, and costs. Faster models respond quicker but may be less capable, while premium models are more powerful but slower.',
    systemPrompt: 'The system prompt defines your agent\'s role, personality, and behavior. It sets the context and rules for how the agent should act. This is like giving your agent a job description and personality.',
    userPrompt: 'The user prompt is the specific instruction or question you give to your agent. This is what the agent will process and respond to based on the current situation or task.',
  };

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
          <div className="mb-1 relative">
            <div className="flex items-center gap-2">
              <label className={`text-sm font-bold ${theme.text.secondary}`}>Model</label>
              <div className="relative" ref={tooltipRefs.model}>
                <button
                  type="button"
                  onMouseEnter={() => setOpenTooltip('model')}
                  onMouseLeave={() => setOpenTooltip(null)}
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${theme.isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} transition-colors`}
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </button>
                {openTooltip === 'model' && (
                  <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-lg shadow-lg z-50 border" style={{
                    backgroundColor: theme.isDark ? '#1f2937' : '#ffffff',
                    borderColor: theme.isDark ? '#374151' : '#d1d5db',
                    color: theme.isDark ? '#ffffff' : '#111827',
                  }}>
                    <div className="absolute left-4 -top-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent" style={{
                      borderBottomColor: theme.isDark ? '#1f2937' : '#ffffff',
                    }}></div>
                    <p className="text-xs leading-relaxed">{tooltipInfo.model}</p>
                  </div>
                )}
              </div>
            </div>
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
          <div className="mb-1 relative">
            <div className="flex items-center gap-2">
              <label className={`text-sm font-bold ${theme.text.secondary}`}>System Prompt</label>
              <div className="relative" ref={tooltipRefs.systemPrompt}>
                <button
                  type="button"
                  onMouseEnter={() => setOpenTooltip('systemPrompt')}
                  onMouseLeave={() => setOpenTooltip(null)}
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${theme.isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} transition-colors`}
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </button>
                {openTooltip === 'systemPrompt' && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 rounded-lg shadow-lg z-50 border" style={{
                    backgroundColor: theme.isDark ? '#1f2937' : '#ffffff',
                    borderColor: theme.isDark ? '#374151' : '#d1d5db',
                    color: theme.isDark ? '#ffffff' : '#111827',
                  }}>
                    <p className="text-xs leading-relaxed">{tooltipInfo.systemPrompt}</p>
                    <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{
                      borderTopColor: theme.isDark ? '#1f2937' : '#ffffff',
                    }}></div>
                  </div>
                )}
              </div>
            </div>
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
          <div className="mb-1 relative">
            <div className="flex items-center gap-2">
              <label className={`text-sm font-bold ${theme.text.secondary}`}>User Prompt</label>
              <div className="relative" ref={tooltipRefs.userPrompt}>
                <button
                  type="button"
                  onMouseEnter={() => setOpenTooltip('userPrompt')}
                  onMouseLeave={() => setOpenTooltip(null)}
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${theme.isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} transition-colors`}
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </button>
                {openTooltip === 'userPrompt' && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 rounded-lg shadow-lg z-50 border" style={{
                    backgroundColor: theme.isDark ? '#1f2937' : '#ffffff',
                    borderColor: theme.isDark ? '#374151' : '#d1d5db',
                    color: theme.isDark ? '#ffffff' : '#111827',
                  }}>
                    <p className="text-xs leading-relaxed">{tooltipInfo.userPrompt}</p>
                    <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style={{
                      borderTopColor: theme.isDark ? '#1f2937' : '#ffffff',
                    }}></div>
                  </div>
                )}
              </div>
            </div>
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

