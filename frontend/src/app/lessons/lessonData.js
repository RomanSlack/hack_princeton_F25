// Shared lesson data - can be imported by both /lessons and /lessons/[id]
export const LESSONS = [
  // ========== LEVEL 1: FOUNDATIONS ==========
  {
    id: 1,
    title: 'Introduction to Agentic AI',
    focus: 'Core Concepts & Fundamentals',
    learningObjective: 'Understand what agentic AI is and how it differs from traditional AI',
    tool: 'Conceptual framework',
    description: 'Learn the fundamentals of agentic AI systems that can accomplish goals with limited supervision. Understand autonomy, goal-driven behavior, and how agentic AI extends generative AI capabilities.',
    prerequisites: [],
    difficulty: 'Beginner',
    estimatedTime: '20 min',
  },
  {
    id: 2,
    title: 'Perception',
    focus: 'Input & Environment Awareness',
    learningObjective: 'Learn how agents collect and interpret data from their environment',
    tool: 'Sensors, APIs, databases',
    description: 'Understanding how AI agents perceive their environment through sensors, APIs, databases, and user interactions. This is the foundation for all agentic operations.',
    prerequisites: [],
    difficulty: 'Beginner',
    estimatedTime: '15 min',
  },
  {
    id: 3,
    title: 'Simple Reflex Agents',
    focus: 'Basic Agent Architecture',
    learningObjective: 'Build your first simple reflex agent that responds to immediate conditions',
    tool: 'Condition-action rules',
    description: 'Learn the simplest form of AI agents that respond directly to current percepts without maintaining internal state or memory.',
    prerequisites: [1, 2],
    difficulty: 'Beginner',
    estimatedTime: '20 min',
  },
  // Add more lessons as needed - this is a simplified version
  // You can copy the full list from lessons/page.jsx
];

