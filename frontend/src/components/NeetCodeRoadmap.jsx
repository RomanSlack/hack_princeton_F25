'use client'

import { useState, useMemo, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, Background, Handle, Position } from '@xyflow/react';

/**
 * NeetCodeRoadmap Component
 * NeetCode-style hierarchical roadmap visualization using React Flow
 */
export default function NeetCodeRoadmap({ components, lessons, progress, onComponentSelect }) {
  // Organize components by level based on dependencies
  const organizedComponents = useMemo(() => {
    const levels = [];
    const processed = new Set();
    const remaining = [...components];

    // Level 0: Components with no dependencies
    let currentLevel = remaining.filter(comp => 
      comp.dependencies.length === 0 || 
      comp.dependencies.every(depId => 
        !components.some(c => c.id === depId)
      )
    );
    levels.push(currentLevel);
    currentLevel.forEach(comp => {
      processed.add(comp.id);
      remaining.splice(remaining.findIndex(c => c.id === comp.id), 1);
    });

    // Subsequent levels: Components whose dependencies are all processed
    while (remaining.length > 0) {
      const nextLevel = remaining.filter(comp =>
        comp.dependencies.every(depId => processed.has(depId))
      );

      if (nextLevel.length === 0) {
        // Handle circular dependencies or remaining components
        levels.push([...remaining]);
        break;
      }

      levels.push(nextLevel);
      nextLevel.forEach(comp => {
        processed.add(comp.id);
        remaining.splice(remaining.findIndex(c => c.id === comp.id), 1);
      });
    }

    return levels;
  }, [components]);

  // Calculate component progress
  const getComponentProgress = (component) => {
    const componentLessons = lessons.filter(l => component.lessonIds.includes(l.id));
    if (componentLessons.length === 0) return 0;
    const completed = componentLessons.filter(l => progress[l.id] === 'completed').length;
    return (completed / componentLessons.length) * 100;
  };

  // Check if component prerequisites are met
  const prerequisitesMet = (component) => {
    return component.dependencies.every(depId => {
      const depComponent = components.find(c => c.id === depId);
      if (!depComponent) return true;
      const depProgress = getComponentProgress(depComponent);
      return depProgress === 100;
    });
  };

  // Convert components to React Flow nodes
  const nodes = useMemo(() => {
    const NODE_WIDTH = 450;
    const NODE_HEIGHT = 100;
    const HORIZONTAL_SPACING = 500; // Spacing between components in the same level (increased for more padding)
    const VERTICAL_SPACING = 200; // Spacing between levels (top to bottom)
    const START_X = 200; // Center starting point
    const START_Y = 100;

    return components.map(component => {
      const levelIndex = organizedComponents.findIndex(level => 
        level.some(c => c.id === component.id)
      );
      const level = organizedComponents[levelIndex] || [];
      const componentIndex = level.findIndex(c => c.id === component.id);
      const levelSize = level.length;

      // Y position increases with level (top to bottom)
      const y = START_Y + levelIndex * VERTICAL_SPACING;
      
      // X position: center the group, then space components evenly horizontally
      const totalWidth = (levelSize - 1) * HORIZONTAL_SPACING;
      const centerX = START_X + (levelSize > 1 ? totalWidth / 2 : 0);
      const x = centerX + (componentIndex - (levelSize - 1) / 2) * HORIZONTAL_SPACING;

      const progressPercent = getComponentProgress(component);
      const canProceed = prerequisitesMet(component);

      return {
        id: component.id,
        type: 'componentNode',
        position: { x, y },
        data: {
          label: component.name,
          progress: progressPercent,
          canProceed,
          component,
        },
        style: {
          opacity: canProceed ? 1 : 0.5,
        },
      };
    });
  }, [components, organizedComponents, lessons, progress]);

  // Convert dependencies to React Flow edges
  const edges = useMemo(() => {
    const edgeList = [];
    components.forEach(component => {
      component.dependencies.forEach(depId => {
        const depComponent = components.find(c => c.id === depId);
        if (depComponent) {
          const depProgress = getComponentProgress(depComponent);
          const isCompleted = depProgress === 100;
          const canProceed = prerequisitesMet(component);

          // Use bezier edges to avoid overlapping - React Flow automatically routes them
          edgeList.push({
            id: `${depId}-${component.id}`,
            source: depId,
            target: component.id,
            type: 'bezier',
            animated: isCompleted && canProceed,
            style: {
              stroke: isCompleted ? '#10b981' : canProceed ? '#ffffff' : '#9ca3af',
              strokeWidth: isCompleted ? 5 : 4,
              strokeDasharray: isCompleted ? '0' : '0',
              opacity: canProceed ? 1 : 0.4,
            },
            markerEnd: {
              type: 'arrowclosed',
              color: isCompleted ? '#10b981' : canProceed ? '#ffffff' : '#9ca3af',
              width: isCompleted ? 24 : 20,
              height: isCompleted ? 24 : 20,
            },
          });
        }
      });
    });
    return edgeList;
  }, [components, lessons, progress]);

  // Handle node changes
  const onNodesChange = useCallback(
    (changes) => {
      // We don't allow dragging, so we can ignore most changes
      // But we need to handle this to prevent errors
    },
    []
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes) => {
      // Edges are read-only, so we can ignore changes
    },
    []
  );

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    onComponentSelect(node.data.component);
  }, [onComponentSelect]);

  // Custom node component
  const ComponentNode = ({ data, selected }) => {
    const { label, progress, canProceed } = data;
    const progressPercent = Math.round(progress);

    return (
      <div
        className={`bg-white rounded-xl border-2 px-8 py-6 text-gray-900 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl flex flex-col justify-center ${
          selected ? 'border-yellow-400 shadow-2xl shadow-yellow-400/50 ring-4 ring-yellow-400/30' : 'border-gray-300 shadow-lg'
        } ${!canProceed ? 'opacity-60' : ''}`}
        style={{ 
          width: '450px', 
          height: '90px',
          boxShadow: selected ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Input handle (top side) */}
        <Handle
          type="target"
          position={Position.Top}
          style={{ 
            background: '#ffffff', 
            width: '12px', 
            height: '12px',
            border: '2px solid #1e1e1e',
            borderRadius: '50%'
          }}
        />
        
        {/* Component Name */}
        <div className="font-bold text-lg text-center text-gray-900 mb-3">
          {label}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 border border-gray-300 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progressPercent === 100
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : progressPercent > 0
                ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                : 'bg-transparent'
            }`}
            style={{
              width: `${progressPercent}%`,
              minWidth: progressPercent > 0 ? '6px' : '0px',
            }}
          />
        </div>
        
        {/* Output handle (bottom side) */}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ 
            background: '#ffffff', 
            width: '12px', 
            height: '12px',
            border: '2px solid #1e1e1e',
            borderRadius: '50%'
          }}
        />
      </div>
    );
  };

  const nodeTypes = {
    componentNode: ComponentNode,
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.4,
          maxZoom: 1.0,
          minZoom: 0.4,
          includeHiddenNodes: false,
        }}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
      >
        <Background 
          color="#2d2d30" 
          gap={24}
          size={1}
          variant="dots"
        />
      </ReactFlow>
    </div>
  );
}
