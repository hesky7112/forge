import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  className = '',
  size = 'sm',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 p-0.5 bg-[#0d1117] rounded-lg border border-[#21262d] ${className}`}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1 font-medium transition-all select-none rounded-md whitespace-nowrap ${
              size === 'sm' ? 'text-xs h-7' : 'text-sm h-8'
            } ${
              isActive
                ? 'bg-[#21262d] text-[#f0f6fc] shadow-xs border border-[#30363d]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-[#30363d] text-[#f0f6fc]' : 'bg-[#161b22] text-[#8b949e]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
