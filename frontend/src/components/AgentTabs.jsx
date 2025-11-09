'use client';

import React from 'react';

export default function AgentTabs({
  tabs,
  activeTabId,
  onSwitch,
  onClose,
  onAdd,
  theme
}) {
  return (
    <div
      className="absolute z-20"
      style={{ top: 8, right: 8 }}
      aria-label="Agent Tabs"
    >
      <div className="flex items-center gap-2">
        {tabs.map((t) => {
          const isActive = t.id === activeTabId;
          return (
            <div
              key={t.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${theme.border.primary} cursor-pointer whitespace-nowrap ${
                isActive
                  ? `${theme.isDark ? 'bg-slate-700 text-white' : 'bg-slate-300 text-slate-900'}`
                  : `${theme.bg.secondary} ${theme.text.secondary} hover:${theme.text.primary}`
              }`}
              onClick={() => onSwitch(t.id)}
              title={t.agentId ? `Agent ${t.agentId}` : t.title}
            >
              <span className="text-xs font-semibold truncate max-w-[160px]">
                {t.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(t.id);
                }}
                className={`text-xs rounded px-1 ${
                  isActive ? 'hover:bg-blue-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title={
                  t.deployed && t.agentId ? `Close & delete ${t.agentId}` : 'Close tab'
                }
                aria-label={`Close tab ${t.title}`}
              >
                ×
              </button>
            </div>
          );
        })}
        <button
          onClick={onAdd}
          className={`ml-1 w-8 h-8 flex items-center justify-center rounded-md border ${theme.border.primary} ${theme.bg.secondary} ${theme.text.secondary} hover:${theme.text.primary} p-0`}
          title="New Canvas"
          aria-label="Add tab"
        >
          +
        </button>
      </div>
    </div>
  );
}


