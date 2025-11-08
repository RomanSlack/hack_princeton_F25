"use client";
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BlockDefinition } from "@/lib/blocks/types";

export function BlockChip({ def }: { def: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${def.type}`,
    data: { fromPalette: true, type: def.type }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="rounded-md px-3 py-2 text-sm text-white mb-2 cursor-grab select-none"
      style={{
        background: def.color,
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.6 : 1
      }}
      role="button"
      tabIndex={0}
      title={def.label}
    >
      {def.label}
    </div>
  );
}
