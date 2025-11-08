"use client";
import React from "react";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  useSensors,
  useSensor,
  MouseSensor,
  TouchSensor,
  DragStartEvent
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { BlockNode } from "./BlockNode";
import { BLOCK_DEFS } from "@/lib/blocks/definitions";
import { ContextMenu } from "./ContextMenu";
import { saveToLocal } from "@/lib/persistence/io";

export default function WorkspaceCanvas() {
  const {
    blocks,
    addInstanceFromType,
    moveBlock,
    setZoom,
    setOffset,
    zoom,
    offset,
    selectOnly,
    connectStack,
    setChild,
    deleteBlock,
    duplicateStack
  } = useWorkspaceStore();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor)
  );

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const dragStart = React.useRef<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    blockId: string;
  } | null>(null);

  // Pan handlers
  const panning = React.useRef<null | {
    x: number;
    y: number;
    startX: number;
    startY: number;
  }>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.role === "canvas") {
      panning.current = {
        x: offset.x,
        y: offset.y,
        startX: e.clientX,
        startY: e.clientY
      };
      selectOnly(null);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!panning.current) return;
    const dx = e.clientX - panning.current.startX;
    const dy = e.clientY - panning.current.startY;
    setOffset(panning.current.x + dx, panning.current.y + dy);
  };

  const onMouseUp = () => {
    panning.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(zoom + (e.deltaY > 0 ? -0.05 : 0.05));
    }
  };

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active?.data?.current as any;
    if (data?.blockId) {
      setDraggedId(data.blockId);
      const block = blocks[data.blockId];
      if (block) {
        dragStart.current = { x: block.x, y: block.y };
      }
    }
  };

  const onDragMove = (e: DragMoveEvent) => {
    const data = e.active?.data?.current as any;
    if (data?.blockId && dragStart.current && e.delta) {
      const block = blocks[data.blockId];
      if (block) {
        // Visual feedback during drag (handled by @dnd-kit transform)
      }
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    const data = e.active?.data?.current as any;

    // If from palette, create new instance
    if (data?.fromPalette) {
      const type = data.type as string;
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      // Get pointer position from the drag event
      const pointerEvent = e.activatorEvent as PointerEvent;
      const clientX = pointerEvent.clientX;
      const clientY = pointerEvent.clientY;

      // Transform to canvas coordinates
      const x = (clientX - canvasRect.left - offset.x) / zoom;
      const y = (clientY - canvasRect.top - offset.y) / zoom;

      addInstanceFromType(type, x, y);
    }
    // If dragging existing block
    else if (data?.blockId && dragStart.current && e.delta) {
      const dx = e.delta.x / zoom;
      const dy = e.delta.y / zoom;

      moveBlock(data.blockId, dx, dy);
    }

    setDraggedId(null);
    dragStart.current = null;
  };

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, blockId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      blockId
    });
  };

  // Autosave on changes
  React.useEffect(() => {
    const unsubscribe = useWorkspaceStore.subscribe(() => {
      saveToLocal();
    });
    return unsubscribe;
  }, []);

  // Keyboard controls
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const selection = Array.from(useWorkspaceStore.getState().selection);
      if (selection.length === 0) return;

      const selectedId = selection[0];

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteBlock(selectedId);
      }

      // Duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        duplicateStack(selectedId);
      }

      // Arrow keys to nudge
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 8 : 1;
        let dx = 0,
          dy = 0;
        if (e.key === "ArrowLeft") dx = -step;
        if (e.key === "ArrowRight") dx = step;
        if (e.key === "ArrowUp") dy = -step;
        if (e.key === "ArrowDown") dy = step;
        moveBlock(selectedId, dx, dy);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteBlock, duplicateStack, moveBlock]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      modifiers={[snapCenterToCursor]}
    >
      <div className="flex-1 relative overflow-hidden" onWheel={onWheel}>
        <div
          ref={canvasRef}
          data-role="canvas"
          data-canvas-root
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          className="absolute inset-0 bg-[length:16px_16px] bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)]"
          style={{ cursor: panning.current ? "grabbing" : "grab" }}
        >
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: "4000px",
              height: "4000px", // virtual large canvas
              position: "relative"
            }}
          >
            {Object.values(blocks).map(b => {
              const def = BLOCK_DEFS.find(d => d.type === b.type);
              if (!def) return null;
              return (
                <div
                  key={b.id}
                  onContextMenu={e => handleContextMenu(e, b.id)}
                >
                  <BlockNode inst={b} def={def} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <DragOverlay />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          blockId={contextMenu.blockId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </DndContext>
  );
}
