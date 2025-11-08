import { useMemo } from 'react';

/**
 * ConnectionLayer Component
 * SVG layer that renders all curved arrows between connected blocks
 * Scratch-style smooth bezier curves
 *
 * @param {Array} nodes - All blocks on canvas
 * @param {Array} connections - All connections { from, to }
 * @param {Function} onConnectionDelete - Called when user clicks to delete a connection
 */
function ConnectionLayer({ nodes, connections, onConnectionDelete }) {
  /**
   * Calculate curved path for a connection
   * Uses bezier curves for smooth Scratch-style arrows
   */
  const calculateCurvedPath = (fromNode, toNode) => {
    // Block dimensions (approximate center)
    const BLOCK_WIDTH = 80;
    const BLOCK_HEIGHT = 32;

    // Calculate center points
    const fromX = fromNode.x + BLOCK_WIDTH / 2;
    const fromY = fromNode.y + BLOCK_HEIGHT / 2;
    const toX = toNode.x + BLOCK_WIDTH / 2;
    const toY = toNode.y + BLOCK_HEIGHT / 2;

    // Calculate control points for bezier curve
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Create smooth curve based on distance
    const curvature = Math.min(distance * 0.3, 100);

    // Control points for bezier curve
    const cp1x = fromX + curvature;
    const cp1y = fromY;
    const cp2x = toX - curvature;
    const cp2y = toY;

    // SVG path string
    const path = `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;

    // Calculate arrow head position and angle
    const angle = Math.atan2(toY - cp2y, toX - cp2x);
    const arrowSize = 10;

    // Arrow head points
    const arrowPoints = [
      [toX, toY],
      [
        toX - arrowSize * Math.cos(angle - Math.PI / 6),
        toY - arrowSize * Math.sin(angle - Math.PI / 6)
      ],
      [
        toX - arrowSize * Math.cos(angle + Math.PI / 6),
        toY - arrowSize * Math.sin(angle + Math.PI / 6)
      ]
    ];

    return {
      path,
      arrowPoints,
      midX: (fromX + toX) / 2,
      midY: (fromY + toY) / 2
    };
  };

  /**
   * Memoize arrow calculations
   */
  const arrows = useMemo(() => {
    return connections.map(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);

      if (!fromNode || !toNode) return null;

      return {
        connection: conn,
        ...calculateCurvedPath(fromNode, toNode),
        color: fromNode.color === 'category-combat' ? '#FF6680' :
               fromNode.color === 'category-exploration' ? '#59C059' :
               fromNode.color === 'category-communication' ? '#9966FF' :
               fromNode.color === 'category-utility' ? '#FFAB19' :
               '#4C97FF' // default behavior color
      };
    }).filter(Boolean);
  }, [nodes, connections]);

  /**
   * Handle click on connection to delete it
   */
  const handleConnectionClick = (connection, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this connection?')) {
      onConnectionDelete(connection.from, connection.to);
    }
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <defs>
        {/* Define arrow markers for each color */}
        {['#4C97FF', '#FF6680', '#59C059', '#9966FF', '#FFAB19'].map((color, idx) => (
          <marker
            key={`arrow-${idx}`}
            id={`arrowhead-${idx}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3, 0 6"
              fill={color}
            />
          </marker>
        ))}
      </defs>

      {/* Render all connections */}
      {arrows.map((arrow, index) => (
        <g key={`${arrow.connection.from}-${arrow.connection.to}`}>
          {/* Main curved path */}
          <path
            d={arrow.path}
            className="connection-arrow"
            stroke={arrow.color}
            markerEnd={`url(#arrowhead-${['#4C97FF', '#FF6680', '#59C059', '#9966FF', '#FFAB19'].indexOf(arrow.color)})`}
          />

          {/* Arrow head polygon */}
          <polygon
            points={arrow.arrowPoints.map(p => p.join(',')).join(' ')}
            className="connection-arrow-head"
            style={{ color: arrow.color }}
          />

          {/* Invisible wider path for easier clicking */}
          <path
            d={arrow.path}
            stroke="transparent"
            strokeWidth="20"
            fill="none"
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
            onClick={(e) => handleConnectionClick(arrow.connection, e)}
          />

          {/* Delete button at midpoint (appears on hover) */}
          <g
            transform={`translate(${arrow.midX}, ${arrow.midY})`}
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
            onClick={(e) => handleConnectionClick(arrow.connection, e)}
            className="opacity-0 hover:opacity-100 transition-opacity"
          >
            <circle
              r="12"
              fill="white"
              stroke="#ef4444"
              strokeWidth="2"
            />
            <line
              x1="-5"
              y1="-5"
              x2="5"
              y2="5"
              stroke="#ef4444"
              strokeWidth="2"
            />
            <line
              x1="5"
              y1="-5"
              x2="-5"
              y2="5"
              stroke="#ef4444"
              strokeWidth="2"
            />
          </g>
        </g>
      ))}
    </svg>
  );
}

export default ConnectionLayer;
