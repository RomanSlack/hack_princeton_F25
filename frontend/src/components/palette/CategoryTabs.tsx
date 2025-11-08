"use client";
import React from "react";
import { BLOCK_DEFS } from "@/lib/blocks/definitions";
import type { BlockCategory } from "@/lib/blocks/types";

const CATS: BlockCategory[] = [
  "Motion",
  "Looks",
  "Events",
  "Control",
  "Sensing",
  "Operators",
  "Variables",
  "MyBlocks"
];

export function CategoryTabs({
  value,
  onChange
}: {
  value: BlockCategory | "All";
  onChange: (v: BlockCategory | "All") => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap p-2">
      {(["All", ...CATS] as const).map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-2 py-1 rounded text-sm border ${
            value === cat ? "bg-black text-white" : "bg-white"
          }`}
          aria-pressed={value === cat}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
