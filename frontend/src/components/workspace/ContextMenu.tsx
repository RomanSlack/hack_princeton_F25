"use client";
import React from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

interface ContextMenuProps {
  x: number;
  y: number;
  blockId: string;
  onClose: () => void;
}

export function ContextMenu({ x, y, blockId, onClose }: ContextMenuProps) {
  const { duplicateStack, deleteBlock } = useWorkspaceStore();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleDuplicate = () => {
    duplicateStack(blockId);
    onClose();
  };

  const handleDelete = () => {
    deleteBlock(blockId);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border rounded-md shadow-lg py-1 z-50"
      style={{ left: x, top: y }}
    >
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
        onClick={handleDuplicate}
      >
        Duplicate (⌘D)
      </button>
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
        onClick={handleDelete}
      >
        Delete (Del)
      </button>
    </div>
  );
}
