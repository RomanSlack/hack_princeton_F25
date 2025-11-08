"use client";
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BlockDefinition, BlockInstance } from "@/lib/blocks/types";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

export function BlockNode({
  inst,
  def
}: {
  inst: BlockInstance;
  def: BlockDefinition;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: inst.id,
    data: { blockId: inst.id }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onMouseDown={e => {
        e.stopPropagation();
        useWorkspaceStore.getState().selectOnly(inst.id);
      }}
      className="absolute rounded-lg shadow-lg text-white text-base font-medium cursor-move"
      style={{
        left: inst.x,
        top: inst.y,
        transform: CSS.Transform.toString(transform),
        background: def.color,
        opacity: isDragging ? 0.7 : 1,
        padding: "12px 24px",
        minWidth: 120
      }}
    >
      {def.label}
    </div>
  );
}
