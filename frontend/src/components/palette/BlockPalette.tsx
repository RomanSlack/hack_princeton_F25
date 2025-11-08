"use client";
import React from "react";
import { BLOCK_DEFS } from "@/lib/blocks/definitions";
import { BlockChip } from "./BlockChip";

export default function BlockPalette() {
  return (
    <aside className="w-[200px] border-r h-full flex flex-col bg-gray-50">
      <div className="p-4 border-b bg-white">
        <h2 className="font-bold text-lg">Blocks</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {BLOCK_DEFS.map(def => (
          <BlockChip key={def.type} def={def} />
        ))}
      </div>
    </aside>
  );
}
