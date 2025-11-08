import { useMemo } from 'react';

/**
 * Connections Component
 * Renders SVG arrows between connected nodes
 *
 * @param {Array} nodes - Array of all nodes
 * @param {Array} connections - Array of connections { from, to }
 * @param {Function} onConnectionDelete - Callback to delete a connection
 * @param {Object} tempConnection - Temporary connection being drawn { sourceNode, targetPos }
 */
function Connections({ nodes, connections, onConnectionDelete, tempConnection = null }) {
  /**
   * Calculate arrow path and position for a connection
   */
  const calculateArrow = (fromNode, toNode) => {
    // Calculate center points of blocks
    const BLOCK_WIDTH = 120;
    const BLOCK_HEIGHT = 80;

    const fromX = fromNode.x + BLOCK_WIDTH / 2;
    const fromY = fromNode.y + BLOCK_HEIGHT / 2;
    const toX = toNode.x + BLOCK_WIDTH / 2;
    const toY = toNode.y + BLOCK_HEIGHT / 2;

    // Calculate angle for arrow direction
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Offset start and end points to edge of blocks
    const startX = fromX + Math.cos(angle) * (BLOCK_WIDTH / 2);
    const startY = fromY + Math.sin(angle) * (BLOCK_HEIGHT / 2);
    const endX = toX - Math.cos(angle) * (BLOCK_WIDTH / 2);
    const endY = toY - Math.sin(angle) * (BLOCK_HEIGHT / 2);

    // Create curved path for better visuals
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Calculate control points for bezier curve
    const dx = endX - startX;
    const dy = endY - startY;
    const curvature = 0.2;

    const controlX1 = startX + dx * curvature;
    const controlY1 = startY + dy * curvature;
    const controlX2 = endX - dx * curvature;
    const controlY2 = endY - dy * curvature;

    // SVG path for curved line
    const path = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

    // Calculate arrowhead points
    const arrowSize = 10;
    const arrowAngle = Math.PI / 6; // 30 degrees

    const arrowPoint1X = endX - arrowSize * Math.cos(angle - arrowAngle);
    const arrowPoint1Y = endY - arrowSize * Math.sin(angle - arrowAngle);
    const arrowPoint2X = endX - arrowSize * Math.cos(angle + arrowAngle);
    const arrowPoint2Y = endY - arrowSize * Math.sin(angle + arrowAngle);

    const arrowPath = `M ${endX} ${endY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`;

    return {
      path,
      arrowPath,
      midX,
      midY,
      startX,
      startY,
      endX,
      endY,
    };
  };

  /**
   * Memoize arrow calculations to avoid unnecessary recalculations
   */
  const arrows = useMemo(() => {
    return connections.map(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);

      if (!fromNode || !toNode) return null;

      return {
        connection: conn,
        ...calculateArrow(fromNode, toNode),
      };
    }).filter(Boolean);
  }, [nodes, connections]);

  /**
   * Handle connection click for deletion
   */
  const handleConnectionClick = (connection, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this connection?')) {
      onConnectionDelete(connection.from, connection.to);
    }
  };

  /**
   * Calculate temporary connection line
   */
  const tempConnectionPath = useMemo(() => {
    if (!tempConnection) return null;

    const BLOCK_WIDTH = 120;
    const BLOCK_HEIGHT = 80;

    const fromX = tempConnection.sourceNode.x + BLOCK_WIDTH / 2;
    const fromY = tempConnection.sourceNode.y + BLOCK_HEIGHT / 2;
    const toX = tempConnection.targetPos.x;
    const toY = tempConnection.targetPos.y;

    // Simple straight line for temp connection
    return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  }, [tempConnection]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <defs>
        {/* Define arrowhead marker */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3, 0 6"
            fill="#3b82f6"
          />
        </marker>
        {/* Define temp arrowhead marker */}
        <marker
          id="arrowhead-temp"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3, 0 6"
            fill="#f97316"
          />
        </marker>
      </defs>

      {/* Render temporary connection */}
      {tempConnectionPath && (
        <path
          d={tempConnectionPath}
          stroke="#f97316"
          strokeWidth="3"
          strokeDasharray="5,5"
          fill="none"
          markerEnd="url(#arrowhead-temp)"
          className="animate-pulse"
        />
      )}

      {/* Render all connections */}
      {arrows.map((arrow, index) => (
        <g key={`${arrow.connection.from}-${arrow.connection.to}`}>
          {/* Main arrow path */}
          <path
            d={arrow.path}
            className="arrow"
            markerEnd="url(#arrowhead)"
          />

          {/* Arrowhead */}
          <path
            d={arrow.arrowPath}
            className="arrow-head"
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

          {/* Delete button at midpoint */}
          <g
            transform={`translate(${arrow.midX}, ${arrow.midY})`}
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
            onClick={(e) => handleConnectionClick(arrow.connection, e)}
            className="opacity-0 hover:opacity-100 transition-opacity"
          >
            <circle
              r="10"
              fill="white"
              stroke="#ef4444"
              strokeWidth="2"
            />
            <line
              x1="-4"
              y1="-4"
              x2="4"
              y2="4"
              stroke="#ef4444"
              strokeWidth="2"
            />
            <line
              x1="4"
              y1="-4"
              x2="-4"
              y2="4"
              stroke="#ef4444"
              strokeWidth="2"
            />
          </g>
        </g>
      ))}
    </svg>
  );
}

export default Connections;
