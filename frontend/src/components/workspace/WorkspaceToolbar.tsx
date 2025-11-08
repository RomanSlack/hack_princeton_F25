"use client";
import React from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { saveToLocal, loadFromLocal } from "@/lib/persistence/io";

export function WorkspaceToolbar() {
  const { exportJSON } = useWorkspaceStore();

  return (
    <div className="h-12 border-b flex items-center gap-2 px-4 bg-white">
      <button
        className="px-3 py-1.5 border rounded hover:bg-gray-50"
        onClick={() => {
          const data = exportJSON();
          navigator.clipboard.writeText(JSON.stringify(data, null, 2));
          alert("JSON copied to clipboard!");
        }}
      >
        Export JSON
      </button>
    </div>
  );
}
