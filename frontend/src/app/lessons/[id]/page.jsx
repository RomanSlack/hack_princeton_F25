'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { Book } from 'lucide-react';

// Import lesson data from shared file
import { LESSONS } from '../../../data/lessons';

// Generate static params for all available lessons
export function generateStaticParams() {
  return LESSONS.map((lesson) => ({
    id: lesson.id.toString(),
  }));
}

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
    lessonBlurb: 'Agentic AI refers to AI systems that can accomplish goals with limited supervision. Unlike traditional AI that responds to prompts, agentic AI can autonomously plan, execute actions, and adapt to achieve objectives. These agents can perceive their environment, reason about situations, make decisions, and take actions—all while learning and improving over time.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID in the sidebar (e.g., "my_agent") - this gives your agent a name' },
      { text: 'Drag an', block: 'onStart', textAfter: 'block onto the canvas - this is where your agent begins' },
      { text: 'Connect it to an', block: 'agent', textAfter: 'block - this lets your agent think and make choices' },
      { text: 'Connect the agent to a', block: 'move', textAfter: 'block - this tells your agent what action to take' },
      { text: 'Click "Deploy Agent" to test your agent in the game preview' },
    ],
  },
  2: {
    // Perception - understanding environment awareness
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart', 'onAttacked'],
    allowedToolBlocks: ['move'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Perception is how agents gather information from their environment. In agentic AI, perception involves collecting data through sensors, APIs, databases, and user interactions. This environmental awareness forms the foundation for all decision-making. Agents must accurately perceive their surroundings to make informed choices and respond appropriately to changing conditions.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID to identify your agent' },
      { text: 'Drag an', block: 'onStart', textAfter: 'block onto the canvas - this represents your agent perceiving the game start' },
      { text: 'Connect it to an', block: 'agent', textAfter: 'block - this processes the perception' },
      { text: 'Connect your agent to a', block: 'move', textAfter: 'block - this shows how perception leads to action' },
      { text: 'Add an', block: 'onAttacked', textAfter: 'block connected to your agent to show different perceptions' },
      { text: 'Click "Deploy Agent" to see how perception triggers work in the game' },
    ],
  },
  3: {
    // Simple Reflex Agents - only action blocks
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart', 'onAttacked'],
    allowedToolBlocks: ['move'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Simple reflex agents are the most basic form of agentic AI. They respond directly to current percepts without maintaining internal state or memory. These agents use condition-action rules: if a certain condition is detected, they immediately execute a corresponding action. While limited, simple reflex agents are fast and effective for straightforward tasks where immediate responses are needed.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your reflex agent' },
      { text: 'Place an', block: 'onStart', textAfter: 'block - this is your agent\'s reflex trigger' },
      { text: 'Connect it to an', block: 'agent', textAfter: 'block - this processes the reflex condition' },
      { text: 'Connect your agent to a', block: 'move', textAfter: 'block - this is the immediate reflex action' },
      { text: 'Add an', block: 'onAttacked', textAfter: 'block connected to your agent to show another reflex condition' },
      { text: 'Deploy your agent to see simple reflex behavior in action' },
    ],
  },
  4: {
    // Reasoning - logical processing
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart', 'onAttacked'],
    allowedToolBlocks: ['move'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Reasoning is how agents process information to extract meaningful insights and make sense of their environment. Agents use natural language processing, pattern detection, and context understanding to interpret queries, analyze situations, and determine appropriate actions. Effective reasoning allows agents to go beyond simple pattern matching and make intelligent decisions based on complex information.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your reasoning agent' },
      { text: 'Drag an', block: 'onStart', textAfter: 'block onto the canvas' },
      { text: 'Connect it to an', block: 'agent', textAfter: 'block - this is where your agent reasons about the game state' },
      { text: 'Connect your agent to a', block: 'move', textAfter: 'block - this executes the reasoned decision' },
      { text: 'Double-click the agent block to configure its reasoning prompts' },
      { text: 'Configure your agent with a system prompt that helps it reason about game situations' },
      { text: 'Deploy your agent to see reasoning in action' },
    ],
  },
  5: {
    // Planning - task decomposition
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: ['plan', 'move'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Planning enables agents to break down complex goals into actionable steps. Agents develop strategies using decision trees, planning algorithms, and decomposition techniques to create execution plans. Effective planning allows agents to tackle multi-step problems by organizing actions in logical sequences, considering dependencies, and adapting when obstacles arise.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your planning agent' },
      { text: 'Place an', block: 'onStart', textAfter: 'block and connect it to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to a', block: 'plan', textAfter: 'block - this represents strategic planning' },
      { text: 'Connect the plan block to a', block: 'move', textAfter: 'block - this executes the planned action' },
      { text: 'Configure your agent\'s prompts to emphasize planning and strategy' },
      { text: 'Deploy to see how planning improves agent decision-making' },
    ],
  },
  6: {
    // Goal Setting & Decision-Making
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: ['move', 'collect', 'attack'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Goal setting and decision-making involve agents evaluating multiple possible actions and selecting optimal courses based on efficiency, accuracy, and predicted outcomes. Agents use probabilistic models, utility functions, and optimization techniques to weigh trade-offs and choose actions that best achieve their objectives. This process balances immediate rewards with long-term goals.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your decision-making agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to multiple tool blocks:', block: 'move', textAfter: ',', block: 'collect', textAfter: ', and', block: 'attack' },
      { text: 'Configure your agent with prompts that help it evaluate which action best achieves its goals' },
      { text: 'Deploy and observe how your agent chooses between different actions' },
    ],
  },
  7: {
    // Prompt Engineering - agent blocks with prompt editing
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: ['move'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Prompt engineering is the art and science of crafting effective prompts that guide agent behavior and reasoning. The structure, phrasing, and content of prompts significantly impact how agents interpret tasks, reason through problems, and generate responses. Masterful prompt engineering involves understanding how different prompt styles produce different outcomes and iteratively refining prompts to achieve desired results.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your prompt engineering experiment' },
      { text: 'Drag an', block: 'onStart', textAfter: 'block onto the canvas' },
      { text: 'Connect it to an', block: 'agent', textAfter: 'block - this is where you\'ll test different prompts' },
      { text: 'Connect your agent to a', block: 'move', textAfter: 'block to see how prompts affect actions' },
      { text: 'Double-click the agent block to open the configuration modal' },
      { text: 'Configure your agent with a system prompt (try descriptive, instructional, or role-based)' },
      { text: 'Configure your agent with a user prompt to see how phrasing affects reasoning' },
      { text: 'Deploy and test different prompt styles to observe how they change agent behavior' },
    ],
  },
  8: {
    // Memory & Reflection
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart', 'onAttacked'],
    allowedToolBlocks: ['move', 'plan'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Memory and reflection enable agents to maintain context across interactions and learn from past experiences. Agents store information about previous actions, outcomes, and environmental states, allowing them to make better decisions over time. Reflection involves agents analyzing their past performance, identifying patterns, and adjusting strategies based on what worked or didn\'t work previously.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your memory-enabled agent' },
      { text: 'Set up both', block: 'onStart', textAfter: 'and', block: 'onAttacked', textAfter: 'action blocks' },
      { text: 'Connect both to an', block: 'agent', textAfter: 'block - this agent will remember different situations' },
      { text: 'Add a', block: 'plan', textAfter: 'block connected to your agent to show strategic memory' },
      { text: 'Configure your agent\'s prompts to reference past experiences and learned patterns' },
      { text: 'Deploy to see how memory improves agent performance over time' },
    ],
  },
  9: {
    // Learning & Adaptation
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart', 'onAttacked'],
    allowedToolBlocks: ['move', 'attack', 'collect'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Learning and adaptation allow agents to improve through feedback and experience. Agents use reinforcement learning, self-supervised learning, and feedback loops to evaluate outcomes, identify successful strategies, and refine their behavior. This continuous improvement process enables agents to become more effective over time, adapting to new situations and optimizing their performance.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your learning agent' },
      { text: 'Create a multi-path agent with', block: 'onStart', textAfter: 'and', block: 'onAttacked', textAfter: 'blocks' },
      { text: 'Connect both to an', block: 'agent', textAfter: 'block that learns from experience' },
      { text: 'Add multiple tool blocks (', block: 'move', textAfter: ',', block: 'attack', textAfter: ',', block: 'collect', textAfter: ') to give your agent options' },
      { text: 'Configure prompts that encourage your agent to learn from successes and failures' },
      { text: 'Deploy and observe how your agent adapts its strategy over multiple game runs' },
    ],
  },
  10: {
    // Communication
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: ['plan', 'move'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Communication enables agents to exchange information, coordinate actions, and interact effectively with users and other agents. Agents use natural language interfaces, structured message protocols, and communication frameworks to share knowledge, request assistance, provide updates, and collaborate on tasks. Effective communication is essential for multi-agent systems and human-AI collaboration.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your communicative agent' },
      { text: 'Set up an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Add a', block: 'plan', textAfter: 'block to show how agents communicate their intentions' },
      { text: 'Connect to a', block: 'move', textAfter: 'block to execute communicated plans' },
      { text: 'Configure your agent\'s prompts to emphasize clear communication and coordination' },
      { text: 'Deploy to see how communication improves agent coordination' },
    ],
  },
  11: {
    // Tool Calling - agent + tool blocks
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null, // All tools allowed
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Tool calling allows agents to extend their capabilities beyond language model limitations by interacting with external systems. Agents can call APIs, search the web, query databases, manipulate files, and use specialized tools to accomplish tasks they couldn\'t handle with language alone. This integration transforms agents from conversational interfaces into powerful autonomous systems capable of real-world action.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your tool-calling agent' },
      { text: 'Place an', block: 'onStart', textAfter: 'block on the canvas' },
      { text: 'Connect it to an', block: 'agent', textAfter: 'block - this agent will call tools' },
      { text: 'Connect your agent to multiple tool blocks:', block: 'move', textAfter: ',', block: 'attack', textAfter: ',', block: 'collect', textAfter: ', and', block: 'plan' },
      { text: 'Configure your agent with prompts that help it intelligently choose which tools to use' },
      { text: 'Deploy to see your agent calling different tools based on the situation' },
    ],
  },
  12: {
    // Execution & Action
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart', 'onAttacked'],
    allowedToolBlocks: null, // All tools
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Execution and action involve agents translating decisions into concrete actions in real environments. Agents interact with external systems, APIs, databases, and physical devices to accomplish goals. Effective execution requires agents to handle errors, manage state transitions, verify action completion, and adapt when actions don\'t produce expected results.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your action-executing agent' },
      { text: 'Create action triggers with', block: 'onStart', textAfter: 'and', block: 'onAttacked', textAfter: 'blocks' },
      { text: 'Connect both to an', block: 'agent', textAfter: 'block that decides on actions' },
      { text: 'Connect your agent to multiple tool blocks to execute different actions' },
      { text: 'Configure your agent to verify action execution and handle failures' },
      { text: 'Deploy to see your agent executing actions in the game environment' },
    ],
  },
  13: {
    // Agent Orchestration
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Agent orchestration involves coordinating multiple agents in complex workflows. Orchestration systems manage agent lifecycles, track progress, coordinate data flow, handle failures, and ensure tasks are completed efficiently. Effective orchestration enables building sophisticated multi-agent systems where agents work together to accomplish complex objectives that no single agent could handle alone.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your orchestrated agent system' },
      { text: 'Create an', block: 'onStart', textAfter: 'block representing the orchestration entry point' },
      { text: 'Connect it to multiple', block: 'agent', textAfter: 'blocks - each agent handles a different task' },
      { text: 'Connect agents to appropriate tool blocks to show coordinated workflows' },
      { text: 'Create connections between agents and tools to enable sequential or parallel workflows' },
      { text: 'Deploy to see orchestrated multi-agent behavior' },
    ],
  },
  14: {
    // Multi-Agent Systems
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Multi-agent systems involve multiple agents working together, either in hierarchical structures with conductor models or in decentralized networks where agents collaborate as equals. These systems enable emergent behaviors, distributed problem-solving, and complex task completion through agent collaboration. Multi-agent systems can solve problems that require diverse expertise, parallel processing, or distributed coordination.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your multi-agent system' },
      { text: 'Create an', block: 'onStart', textAfter: 'block to trigger your multi-agent system' },
      { text: 'Create multiple', block: 'agent', textAfter: 'blocks representing different specialized agents' },
      { text: 'Connect agents to different tool blocks to show specialization' },
      { text: 'Create connections between agents to allow coordination' },
      { text: 'Configure each agent with prompts that enable collaboration' },
      { text: 'Deploy to observe how multiple agents work together' },
    ],
  },
  15: {
    // ReAct (Reasoning + Acting)
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'ReAct (Reasoning + Acting) is a pattern that combines reasoning and acting in iterative loops. Agents alternate between thinking through problems step-by-step and taking actions, allowing them to adapt their strategy based on what they observe. This iterative approach enables agents to handle complex, dynamic problems by continuously reasoning about the current state and adjusting their actions accordingly.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your ReAct agent' },
      { text: 'Set up an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Create a loop: connect your agent to tool blocks, then back to the agent' },
      { text: 'Add', block: 'plan', textAfter: 'and', block: 'move', textAfter: 'blocks and connect them to show reasoning and acting cycles' },
      { text: 'Configure your agent with prompts that enable reasoning, acting, observing, and repeating' },
      { text: 'Deploy to see the ReAct pattern in action' },
    ],
  },
  16: {
    // ReWOO (Reasoning Without Observation)
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: ['plan', 'move'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'ReWOO (Reasoning Without Observation) separates planning from execution to create more efficient agent systems. Agents first create a complete plan through reasoning, then execute the plan without continuous observation. This approach reduces computational overhead and enables more scalable systems by batching reasoning and execution phases.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your ReWOO agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to a', block: 'plan', textAfter: 'block first - this is the reasoning phase' },
      { text: 'Then connect plan to', block: 'move', textAfter: 'blocks - this is the execution phase' },
      { text: 'Configure your agent to plan completely before executing' },
      { text: 'Deploy to see efficient ReWOO pattern execution' },
    ],
  },
  17: {
    // Multi-Agent Collaboration
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Multi-agent collaboration focuses on emergent behaviors that arise when agents work together. Through shared protocols, coordination mechanisms, and collaborative strategies, multiple agents can solve complex problems that individual agents cannot. These systems demonstrate how simple agent behaviors can combine to create sophisticated collective intelligence.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your collaborative agent team' },
      { text: 'Create an', block: 'onStart', textAfter: 'block to trigger your collaborative system' },
      { text: 'Create multiple', block: 'agent', textAfter: 'blocks representing different team members' },
      { text: 'Connect agents to complementary tool blocks (e.g., one handles', block: 'plan', textAfter: ', another handles', block: 'attack', textAfter: ')' },
      { text: 'Create connections between agents to allow information sharing and coordination' },
      { text: 'Configure each agent with prompts that encourage collaboration' },
      { text: 'Deploy to observe emergent collaborative behaviors' },
    ],
  },
  18: {
    // Agent Communication Protocol (ACP)
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Agent Communication Protocol (ACP) provides standardized communication formats that enable different agents and systems to interoperate effectively. ACP ensures agents can exchange information reliably, regardless of their underlying implementation. This standardization is crucial for building large-scale, heterogeneous multi-agent systems where agents from different sources must work together.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your ACP-compliant agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block to initiate ACP communication' },
      { text: 'Create multiple', block: 'agent', textAfter: 'blocks that will communicate using ACP' },
      { text: 'Connect agents through tool blocks that represent communication channels' },
      { text: 'Use', block: 'plan', textAfter: 'blocks to show structured message planning' },
      { text: 'Configure agents with prompts that follow ACP message formats' },
      { text: 'Deploy to see standardized agent communication in action' },
    ],
  },
  19: {
    // Agent2Agent (A2A)
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Agent2Agent (A2A) protocol enables direct communication between agents through chat-like interfaces. A2A allows agents to have conversations, exchange information, negotiate, and coordinate actions in real-time. This protocol facilitates natural agent-to-agent interactions, enabling agents to work together more effectively through structured dialogue.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your A2A-enabled agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block to initiate A2A communication' },
      { text: 'Create two or more', block: 'agent', textAfter: 'blocks representing agents that will chat' },
      { text: 'Connect agents in a way that shows message passing between them' },
      { text: 'Use', block: 'plan', textAfter: 'blocks to represent message composition' },
      { text: 'Configure agents with prompts that enable natural A2A conversations' },
      { text: 'Deploy to see agents communicating directly with each other' },
    ],
  },
  20: {
    // Model Context Protocol (MCP)
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: ['plan'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Model Context Protocol (MCP) enables sharing context and information between agents and systems. MCP servers provide structured access to resources, tools, and knowledge bases, allowing agents to access rich contextual information. This protocol enhances agent capabilities by providing standardized ways to share and access contextual data.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your MCP-enabled agent' },
      { text: 'Set up an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to', block: 'plan', textAfter: 'blocks that represent context retrieval' },
      { text: 'Create connections that show how agents access shared context' },
      { text: 'Configure your agent with prompts that use MCP for context sharing' },
      { text: 'Deploy to see context-aware agent behavior' },
    ],
  },
  21: {
    // LangChain
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'LangChain is a popular framework for building agentic applications with LLMs. It provides abstractions for chains, agents, memory management, and tool integration. LangChain simplifies the process of building complex agent workflows by providing reusable components and patterns that handle common agentic AI tasks.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your LangChain-style agent' },
      { text: 'Create a chain:', block: 'onStart', textAfter: '→', block: 'agent', textAfter: '→ tool blocks' },
      { text: 'Build multiple connected agents to show LangChain\'s chain capabilities' },
      { text: 'Use various tool blocks to demonstrate tool integration' },
      { text: 'Configure agents with prompts that follow LangChain patterns' },
      { text: 'Deploy to see LangChain-style agent workflows' },
    ],
  },
  22: {
    // LangGraph
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'LangGraph enables building stateful agent workflows with cycles, conditional logic, and human-in-the-loop interactions. It models agent systems as state machines, allowing complex control flow, loops, and state management. LangGraph is ideal for building agents that need to maintain state across multiple interactions and handle complex decision trees.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your LangGraph agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block to initiate your stateful workflow' },
      { text: 'Create a stateful workflow with multiple', block: 'agent', textAfter: 'blocks' },
      { text: 'Create cycles: connect agents back to previous agents to show stateful loops' },
      { text: 'Add tool blocks and connect them to show state-based decisions' },
      { text: 'Configure agents with prompts that maintain and update state' },
      { text: 'Deploy to see stateful LangGraph-style workflows' },
    ],
  },
  23: {
    // AutoGen
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'AutoGen enables multi-agent conversations where agents can autonomously collaborate through dialogue. Agents in AutoGen systems can have extended conversations, debate solutions, ask clarifying questions, and reach consensus. This framework is powerful for complex problem-solving where multiple perspectives and iterative refinement are valuable.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your AutoGen agent system' },
      { text: 'Create an', block: 'onStart', textAfter: 'block to initiate the conversation' },
      { text: 'Create multiple', block: 'agent', textAfter: 'blocks representing conversational agents' },
      { text: 'Connect agents in a way that shows conversation flow' },
      { text: 'Use', block: 'plan', textAfter: 'blocks to represent conversation topics' },
      { text: 'Configure agents with prompts that enable natural multi-agent conversations' },
      { text: 'Deploy to see AutoGen-style agent conversations' },
    ],
  },
  24: {
    // crewAI
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'crewAI organizes agents into specialized teams with specific roles, enabling complex workflows where agents collaborate on tasks. Each agent has a defined role and expertise, and crews coordinate their work to accomplish objectives. This framework is ideal for scenarios requiring diverse expertise, like retail optimization, call analysis, or content creation.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your crewAI team' },
      { text: 'Create an', block: 'onStart', textAfter: 'block to initiate your crew workflow' },
      { text: 'Create multiple', block: 'agent', textAfter: 'blocks, each representing a specialized role' },
      { text: 'Connect each agent to role-appropriate tool blocks' },
      { text: 'Create connections between agents and tools to show crew coordination' },
      { text: 'Configure each agent with prompts that define their specific role' },
      { text: 'Deploy to see role-based crewAI team collaboration' },
    ],
  },
  25: {
    // MetaGPT
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'MetaGPT enables automated software development through coordinated agent teams. Agents take on different roles in the software development lifecycle, from product managers who create PRDs to engineers who write code. This framework demonstrates how agentic AI can automate complex, multi-step creative and technical processes.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your MetaGPT development team' },
      { text: 'Create an', block: 'onStart', textAfter: 'block to initiate the development workflow' },
      { text: 'Create multiple', block: 'agent', textAfter: 'blocks representing different development roles' },
      { text: 'Connect agents in a sequence showing the development workflow' },
      { text: 'Use', block: 'plan', textAfter: 'blocks to represent PRD creation and planning' },
      { text: 'Configure agents with prompts that match software development roles' },
      { text: 'Deploy to see MetaGPT-style development automation' },
    ],
  },
  26: {
    // ChatDev
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'ChatDev uses ChatChain to organize agents into collaborative development teams. Agents engage in structured conversations to plan, design, code, and test software. This framework emphasizes iterative collaboration, with agents discussing and refining their work through dialogue, resulting in higher-quality outputs.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your ChatDev team' },
      { text: 'Create an', block: 'onStart', textAfter: 'block to initiate the ChatDev workflow' },
      { text: 'Create multiple', block: 'agent', textAfter: 'blocks for your development team' },
      { text: 'Create ChatChain connections showing conversation flow between agents' },
      { text: 'Add', block: 'plan', textAfter: 'blocks and connect them to represent collaborative planning' },
      { text: 'Configure agents with prompts that enable structured development conversations' },
      { text: 'Deploy to see ChatDev-style collaborative development' },
    ],
  },
  27: {
    // Agentic RAG
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: ['plan'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Agentic RAG combines retrieval-augmented generation with agentic capabilities, enabling agents to actively search, retrieve, and use information from knowledge bases. Unlike traditional RAG, agentic RAG allows agents to decide what information to retrieve, when to retrieve it, and how to use it, making information access more intelligent and context-aware.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your agentic RAG system' },
      { text: 'Set up an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to', block: 'plan', textAfter: 'blocks representing retrieval planning' },
      { text: 'Create connections that show how agents decide what information to retrieve' },
      { text: 'Configure your agent with prompts that intelligently use retrieved information' },
      { text: 'Deploy to see agentic RAG in action' },
    ],
  },
  28: {
    // Agentic Chunking
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: ['plan'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Agentic chunking uses agents to intelligently break down documents based on semantic meaning rather than fixed sizes. Agents analyze document structure, identify logical boundaries, and create chunks that preserve context and meaning. This approach improves RAG performance by ensuring retrieved chunks are semantically coherent and contextually relevant.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your agentic chunking system' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to', block: 'plan', textAfter: 'blocks representing chunking strategies' },
      { text: 'Create connections that show semantic-based chunking decisions' },
      { text: 'Configure your agent with prompts that help it understand document structure and meaning' },
      { text: 'Deploy to see intelligent document chunking' },
    ],
  },
  29: {
    // Corrective RAG
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: ['plan'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Corrective RAG enables agents to identify when retrieval fails and automatically correct queries or search strategies. Agents evaluate retrieval results, detect when information is missing or incorrect, and refine their retrieval approach. This self-correcting capability significantly improves RAG reliability and accuracy.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your corrective RAG agent' },
      { text: 'Set up an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Create a feedback loop: agent →', block: 'plan', textAfter: '→ back to agent' },
      { text: 'Create connections that show error detection and correction' },
      { text: 'Configure your agent with prompts that evaluate and improve retrieval strategies' },
      { text: 'Deploy to see self-correcting RAG behavior' },
    ],
  },
  30: {
    // Human-in-the-Loop
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Human-in-the-Loop systems integrate human oversight into agent workflows, ensuring safety and quality in critical decisions. Agents can request human approval, incorporate human feedback, and escalate complex decisions. This hybrid approach combines AI autonomy with human judgment, enabling trustworthy agentic systems for high-stakes applications.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your human-in-the-loop agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block that makes decisions' },
      { text: 'Connect your agent to tool blocks to show actions that may need human approval' },
      { text: 'Use', block: 'plan', textAfter: 'blocks to represent approval workflows' },
      { text: 'Configure your agent to request human oversight for critical actions' },
      { text: 'Deploy to see human-AI collaboration in action' },
    ],
  },
  31: {
    // AI Agent Evaluation
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'AI Agent Evaluation involves systematically testing and measuring agent performance using accuracy metrics, reliability tests, and benchmarking frameworks. Effective evaluation helps identify agent strengths and weaknesses, guides improvements, and ensures agents meet quality standards. Evaluation is crucial for deploying trustworthy agentic systems.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your evaluable agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to multiple tool blocks to show diverse agent capabilities' },
      { text: 'Add multiple tool blocks and connections to create a testable system' },
      { text: 'Configure your agent with prompts that include clear success criteria' },
      { text: 'Deploy and evaluate your agent\'s performance across different scenarios' },
    ],
  },
  32: {
    // AI Agent Security
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'AI Agent Security involves protecting agentic systems from malicious use, unauthorized access, and adversarial attacks. Security measures include access controls, input validation, output filtering, threat detection, and secure communication protocols. Robust security is essential for deploying agentic AI in production environments.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your secure agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block with security considerations' },
      { text: 'Connect your agent to tool blocks to show secure actions' },
      { text: 'Use', block: 'plan', textAfter: 'blocks to represent security checks' },
      { text: 'Configure your agent with prompts that emphasize secure behavior' },
      { text: 'Deploy to see security-conscious agent behavior' },
    ],
  },
  33: {
    // AI Agent Ethics
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'AI Agent Ethics focuses on designing agentic systems that are fair, transparent, unbiased, and aligned with human values. Ethical agents consider the impact of their actions, mitigate bias, ensure fairness, and operate transparently. Building ethical agents is crucial for responsible AI deployment and maintaining public trust.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your ethical agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to tool blocks to show ethical actions' },
      { text: 'Add', block: 'plan', textAfter: 'blocks and connect them to represent ethical considerations' },
      { text: 'Configure your agent with prompts that emphasize fairness and transparency' },
      { text: 'Deploy to see ethical agent behavior in practice' },
    ],
  },
  34: {
    // Automation
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: null,
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Automation uses agentic AI to automate repetitive business processes, reducing manual work and improving efficiency. Agents can handle routine tasks like data entry, report generation, email processing, and workflow management. Automation agents free human workers to focus on higher-value, creative, and strategic work.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your automation agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to multiple tool blocks representing automated tasks' },
      { text: 'Create connections between multiple tool blocks to show repetitive task automation' },
      { text: 'Configure your agent with prompts that handle routine processes autonomously' },
      { text: 'Deploy to see automation in action' },
    ],
  },
  35: {
    // Customer Service
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Customer Service agents handle inquiries, provide support, answer questions, and escalate issues when needed. These agents use natural language understanding to interpret customer needs, access knowledge bases to provide accurate information, and maintain professional, helpful interactions. Effective customer service agents improve satisfaction while reducing support costs.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your customer service agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to', block: 'plan', textAfter: 'blocks representing response planning' },
      { text: 'Add multiple tool blocks and connections to show inquiry handling and escalation' },
      { text: 'Configure your agent with prompts that emphasize helpful, professional communication' },
      { text: 'Deploy to see customer service agent behavior' },
    ],
  },
  36: {
    // Finance & Trading
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Finance and Trading agents analyze market data, execute trades, manage portfolios, and make investment decisions autonomously. These agents process vast amounts of financial information, identify patterns, assess risk, and execute trades based on sophisticated algorithms. Financial agents operate in high-stakes environments requiring accuracy, speed, and risk management.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your trading agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to', block: 'plan', textAfter: 'blocks representing trading strategies' },
      { text: 'Add tool blocks and connections to show data analysis and decision-making' },
      { text: 'Configure your agent with prompts that emphasize risk assessment and strategic trading' },
      { text: 'Deploy to see financial agent decision-making' },
    ],
  },
  37: {
    // Healthcare
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: null,
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Healthcare agents monitor patient data, analyze symptoms, provide health information, and assist clinicians with decision support. These agents must operate with high accuracy, maintain patient privacy, and work within regulatory constraints. Healthcare agents can improve patient outcomes by providing 24/7 monitoring and timely alerts.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your healthcare agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to', block: 'plan', textAfter: 'blocks representing care planning' },
      { text: 'Add tool blocks and connections to show patient data analysis and alert generation' },
      { text: 'Configure your agent with prompts that emphasize accuracy and patient safety' },
      { text: 'Deploy to see healthcare agent monitoring capabilities' },
    ],
  },
  38: {
    // Cybersecurity
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onAttacked'],
    allowedToolBlocks: ['attack', 'plan'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Cybersecurity agents continuously monitor network traffic, detect anomalies, identify threats, and respond to security incidents autonomously. These agents analyze logs, detect patterns indicative of attacks, and take defensive actions. Security agents must operate 24/7, respond quickly to threats, and adapt to evolving attack patterns.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your security agent' },
      { text: 'Create an', block: 'onAttacked', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to', block: 'plan', textAfter: 'blocks representing threat response strategies' },
      { text: 'Add', block: 'attack', textAfter: 'blocks to show defensive actions' },
      { text: 'Configure your agent to detect threats and respond appropriately' },
      { text: 'Deploy to see cybersecurity agent threat detection and response' },
    ],
  },
  39: {
    // Supply Chain Management
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: ['onStart'],
    allowedToolBlocks: ['plan', 'collect', 'move'],
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: 'Supply Chain Management agents optimize logistics, manage inventory, process orders, and coordinate shipments autonomously. These agents analyze demand patterns, optimize routes, manage stock levels, and coordinate with suppliers and distributors. Supply chain agents improve efficiency, reduce costs, and ensure timely delivery of goods.',
    lessonGuidelines: [
      { text: 'Enter an Agent ID for your supply chain agent' },
      { text: 'Create an', block: 'onStart', textAfter: 'block connected to an', block: 'agent', textAfter: 'block' },
      { text: 'Connect your agent to', block: 'plan', textAfter: 'blocks representing logistics planning' },
      { text: 'Add', block: 'collect', textAfter: 'and', block: 'move', textAfter: 'blocks to show inventory and shipping operations' },
      { text: 'Configure your agent to optimize supply chain operations' },
      { text: 'Deploy to see supply chain optimization in action' },
    ],
  },
};

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const lessonId = parseInt(params.id);
  const lesson = LESSONS.find(l => l.id === lessonId);
  
  // Starred lessons state
  const [starredLessons, setStarredLessons] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('starredLessons');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const isStarred = starredLessons.includes(lessonId);
  
  const toggleStar = () => {
    const newStarred = isStarred
      ? starredLessons.filter(id => id !== lessonId)
      : [...starredLessons, lessonId];
    setStarredLessons(newStarred);
    if (typeof window !== 'undefined') {
      localStorage.setItem('starredLessons', JSON.stringify(newStarred));
    }
    toast.success(isStarred ? 'Lesson unstarred' : 'Lesson starred');
  };
  const config = LESSON_CONFIGS[lessonId] || {
    showBuilder: true,
    allowedBlocks: ['action', 'agent', 'tool'],
    allowedActionBlocks: null, // null means show all
    allowedToolBlocks: null, // null means show all
    showAgentBlock: true,
    showToolBlock: true,
    showConnections: true,
    lessonBlurb: lesson?.description || 'Learn about agentic AI concepts and build agents using the visual builder.',
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
          <LessonBuilder lesson={lesson} config={config} isStarred={isStarred} onToggleStar={toggleStar} />
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

// Backend URL - configurable via environment variable
// For local dev: http://localhost:8001
// For production: https://your-backend.run.app
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// Game client URL - configurable via environment variable
const GAME_CLIENT_URL = process.env.NEXT_PUBLIC_GAME_CLIENT_URL || 'http://localhost:3000';

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
function LessonBuilder({ lesson, config, isStarred, onToggleStar }) {
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
  const blockRefs = useRef({}); // Store refs to measure actual block dimensions

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
      if (guidelineText.includes('Agent ID') || guidelineText.includes('agent a name') || guidelineText.includes('Enter an Agent ID')) {
        isComplete = agentId.trim().length > 0;
      }
      // Check for connections FIRST (before checking block existence)
      // This ensures connection tasks require actual connections, not just block placement
      else if (guidelineText.includes('Connect')) {
        // Check if onStart is connected to agent
        if (blockId === 'agent' && (guidelineText.includes('onStart') || guidelineText.includes('Connect it to an') || guidelineText.includes('connected to an'))) {
          const onStartBlock = blocks.find(b => b.blockType === 'action' && b.action_type === 'onStart');
          const agentBlock = blocks.find(b => b.blockType === 'agent');
          isComplete = onStartBlock && agentBlock && connections.some(c => c.from === onStartBlock.id && c.to === agentBlock.id);
        }
        // Check if onAttacked is connected to agent
        else if (blockId === 'agent' && guidelineText.includes('onAttacked')) {
          const onAttackedBlock = blocks.find(b => b.blockType === 'action' && b.action_type === 'onAttacked');
          const agentBlock = blocks.find(b => b.blockType === 'agent');
          isComplete = onAttackedBlock && agentBlock && connections.some(c => c.from === onAttackedBlock.id && c.to === agentBlock.id);
        }
        // Check if agent is connected to a tool block
        else if ((blockId === 'move' || blockId === 'plan' || blockId === 'attack' || blockId === 'collect') && guidelineText.includes('agent')) {
          const agentBlock = blocks.find(b => b.blockType === 'agent');
          const toolBlock = blocks.find(b => {
            if (blockId === 'move') return b.blockType === 'tool' && b.tool_type === 'move';
            if (blockId === 'plan') return b.blockType === 'tool' && b.tool_type === 'plan';
            if (blockId === 'attack') return b.blockType === 'tool' && b.tool_type === 'attack';
            if (blockId === 'collect') return b.blockType === 'tool' && b.tool_type === 'collect';
            return false;
          });
          isComplete = agentBlock && toolBlock && connections.some(c => c.from === agentBlock.id && c.to === toolBlock.id);
        }
        // Check if plan is connected to move
        else if (blockId === 'move' && guidelineText.includes('plan')) {
          const planBlock = blocks.find(b => b.blockType === 'tool' && b.tool_type === 'plan');
          const moveBlock = blocks.find(b => b.blockType === 'tool' && b.tool_type === 'move');
          isComplete = planBlock && moveBlock && connections.some(c => c.from === planBlock.id && c.to === moveBlock.id);
        }
        // Generic connection check - agent connected to any tool
        else if (guidelineText.includes('Connect your agent to') || guidelineText.includes('Connect agents to')) {
          const agentBlock = blocks.find(b => b.blockType === 'agent');
          const hasToolConnection = agentBlock && connections.some(c => {
            const toBlock = blocks.find(b => b.id === c.to);
            return c.from === agentBlock.id && toBlock && toBlock.blockType === 'tool';
          });
          isComplete = hasToolConnection;
        }
        // Check for multiple agents
        else if (guidelineText.includes('multiple') && guidelineText.includes('agent')) {
          const agentBlocks = blocks.filter(b => b.blockType === 'agent');
          isComplete = agentBlocks.length >= 2;
        }
      }
      // Check for specific blocks placed (only if not a connection task)
      else if (blockId === 'onStart') {
        isComplete = blocks.some(b => b.blockType === 'action' && b.action_type === 'onStart');
      }
      else if (blockId === 'onAttacked') {
        isComplete = blocks.some(b => b.blockType === 'action' && b.action_type === 'onAttacked');
      }
      else if (blockId === 'agent' && !guidelineText.includes('Connect')) {
        isComplete = blocks.some(b => b.blockType === 'agent');
      }
      else if (blockId === 'move' && !guidelineText.includes('Connect')) {
        isComplete = blocks.some(b => b.blockType === 'tool' && b.tool_type === 'move');
      }
      else if (blockId === 'plan' && !guidelineText.includes('Connect')) {
        isComplete = blocks.some(b => b.blockType === 'tool' && b.tool_type === 'plan');
      }
      else if (blockId === 'attack' && !guidelineText.includes('Connect')) {
        isComplete = blocks.some(b => b.blockType === 'tool' && b.tool_type === 'attack');
      }
      else if (blockId === 'collect' && !guidelineText.includes('Connect')) {
        isComplete = blocks.some(b => b.blockType === 'tool' && b.tool_type === 'collect');
      }
      // Check for multiple blocks of a type
      else if (guidelineText.includes('multiple')) {
        if (blockId === 'agent' || guidelineText.includes('multiple') && guidelineText.includes('agent')) {
          isComplete = blocks.filter(b => b.blockType === 'agent').length >= 2;
        } else if (blockId === 'onStart') {
          isComplete = blocks.filter(b => b.blockType === 'action' && b.action_type === 'onStart').length >= 2;
        } else if (guidelineText.includes('tool blocks')) {
          // Check for multiple tool blocks
          const toolBlocks = blocks.filter(b => b.blockType === 'tool');
          isComplete = toolBlocks.length >= 2;
        }
      }
      // Check for agent configuration (has system_prompt and user_prompt)
      else if ((guidelineText.includes('Configure') && guidelineText.includes('agent')) || 
               guidelineText.includes('Configure your agent with')) {
        const agentBlock = blocks.find(b => b.blockType === 'agent');
        isComplete = agentBlock && agentBlock.system_prompt && agentBlock.user_prompt && 
                     agentBlock.system_prompt.trim().length > 0 && agentBlock.user_prompt.trim().length > 0;
      }
      // Check for double-click (agent configuration opened and saved)
      else if (guidelineText.includes('Double-click') || (guidelineText.includes('configure') && guidelineText.includes('prompt'))) {
        const agentBlock = blocks.find(b => b.blockType === 'agent');
        isComplete = agentBlock && agentBlock.system_prompt && agentBlock.user_prompt && 
                     agentBlock.system_prompt.trim().length > 0 && agentBlock.user_prompt.trim().length > 0;
      }
      // Check for "Add" tasks with blocks
      else if (guidelineText.includes('Add') && blockId) {
        if (blockId === 'plan' || blockId === 'move' || blockId === 'attack' || blockId === 'collect') {
          const toolType = blockId === 'plan' ? 'plan' : blockId === 'move' ? 'move' : blockId === 'attack' ? 'attack' : 'collect';
          isComplete = blocks.some(b => b.blockType === 'tool' && b.tool_type === toolType);
        }
      }
      // Check for "Create" tasks
      else if (guidelineText.includes('Create') && !guidelineText.includes('Connect')) {
        if (blockId === 'onStart') {
          isComplete = blocks.some(b => b.blockType === 'action' && b.action_type === 'onStart');
        } else if (blockId === 'agent') {
          isComplete = blocks.some(b => b.blockType === 'agent');
        } else if (guidelineText.includes('loop') || guidelineText.includes('cycle')) {
          // Check for loops - agent connected to tool, tool connected back to agent
          const agentBlock = blocks.find(b => b.blockType === 'agent');
          if (agentBlock) {
            const hasToolConnection = connections.some(c => c.from === agentBlock.id);
            const toolBlocks = blocks.filter(b => b.blockType === 'tool');
            const hasLoop = toolBlocks.some(tool => {
              const toolToAgent = connections.some(c => c.from === tool.id && c.to === agentBlock.id);
              const agentToTool = connections.some(c => c.from === agentBlock.id && c.to === tool.id);
              return toolToAgent && agentToTool;
            });
            isComplete = hasToolConnection && hasLoop;
          }
        } else if (guidelineText.includes('feedback loop')) {
          // Check for feedback loop: agent -> plan -> agent
          const agentBlock = blocks.find(b => b.blockType === 'agent');
          const planBlock = blocks.find(b => b.blockType === 'tool' && b.tool_type === 'plan');
          if (agentBlock && planBlock) {
            const agentToPlan = connections.some(c => c.from === agentBlock.id && c.to === planBlock.id);
            const planToAgent = connections.some(c => c.from === planBlock.id && c.to === agentBlock.id);
            isComplete = agentToPlan && planToAgent;
          }
        }
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
    // Arrowhead marker has refX="9", meaning it extends 9px from the path end
    // We need to place the connection point slightly outside the block so the arrowhead doesn't overlap
    // The arrowhead should point INTO the block (opposite direction of the edge)
    const borderWidth = 2; // 2px border
    const arrowheadOffset = 8; // Account for arrowhead marker size (refX="9")
    
    // For each edge, calculate the point where the arrow should connect
    // The path ends here (outside the block), and the arrowhead extends inward from this point
    // Top: point ABOVE block (y decreases), arrow points DOWN
    // Bottom: point BELOW block (y increases), arrow points UP
    // Left: point LEFT of block (x decreases), arrow points RIGHT
    // Right: point RIGHT of block (x increases), arrow points LEFT
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
  // The arrowhead marker attaches at refX=10, but the tip extends to x=12
  // So we need to extend the path endpoint by 2 units in the direction the arrow points
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

      // For lesson 1, register agents in zone 2 (left side only, before the gate)
      if (lesson.id === 1) {
        payload.register_in_game = true;
        payload.preferred_zone = "zone2";
        payload.zone2_left_only = true;
      }

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

      // For lesson 1, start auto-stepping if not already running
      if (lessonId === 1) {
        try {
          const autoStepResponse = await fetch(`${BACKEND_URL}/start-auto-stepping`, {
            method: 'POST',
          });
          if (autoStepResponse.ok) {
            console.log('Auto-stepping started');
            toast.success('Agent is now running in the game!');
          } else {
            const autoStepError = await autoStepResponse.json();
            // It's OK if auto-stepping is already running
            if (autoStepError.detail?.includes('already running')) {
              console.log('Auto-stepping already running');
            } else {
              console.warn('Failed to start auto-stepping:', autoStepError);
            }
          }
        } catch (error) {
          console.warn('Could not start auto-stepping:', error);
        }
      }

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
                <div className="flex items-center gap-3 mb-4">
                  <h2 className={`text-2xl font-bold ${theme.text.primary}`}>
                    {lesson.title}
                  </h2>
                  <button
                    onClick={onToggleStar}
                    className={`transition-colors ${
                      isStarred
                        ? 'text-yellow-400 hover:text-yellow-500'
                        : 'text-gray-400 hover:text-yellow-400'
                    }`}
                    title={isStarred ? 'Unstar this lesson' : 'Star this lesson'}
                  >
                    <svg 
                      className="w-6 h-6" 
                      fill={isStarred ? 'currentColor' : 'none'} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
                
                {/* Agentic AI Blurb */}
                {config.lessonBlurb && (
                  <div className={`mb-4 ${theme.bg.primary} rounded-lg p-4 border ${theme.border.secondary}`}>
                    <h3 className={`text-sm font-semibold uppercase tracking-wide ${theme.text.secondary} mb-2`}>
                      About {lesson.title}
                    </h3>
                    <p className={`text-base leading-relaxed ${theme.text.primary}`}>
                      {config.lessonBlurb}
                    </p>
                  </div>
                )}

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
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      theme.isDark ? 'bg-blue-600' : 'bg-blue-500'
                    }`}>
                      <Book className="w-5 h-5 text-white" />
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
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2.5 max-w-[75%] ${
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
                ))}
                {isTyping && (
                  <div className="flex justify-start">
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
                  href={GAME_CLIENT_URL}
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
                  src={GAME_CLIENT_URL}
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
            {blocks.map(block => (
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

