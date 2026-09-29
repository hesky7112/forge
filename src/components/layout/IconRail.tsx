import React from 'react';
import {
  GitBranch,
  Network,
  GitPullRequest,
  Terminal,
  Database,
  Settings,
  Flame,
  Radio,
  HardDrive,
  Server,
  Video,
} from 'lucide-react';
import { WorkspaceMode } from '../../types';

interface IconRailProps {
  activeMode: WorkspaceMode;
  onSelectMode: (mode: WorkspaceMode) => void;
  onOpenSettings: () => void;
  onOpenBackendStatus?: () => void;
  isOnline: boolean;
  unassignedHunksCount: number;
}

export const IconRail: React.FC<IconRailProps> = ({
  activeMode,
  onSelectMode,
  onOpenSettings,
  onOpenBackendStatus,
  isOnline,
  unassignedHunksCount,
}) => {
  const navItems: { id: WorkspaceMode; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'branches',
      label: 'Virtual Branches (Concurrent Lanes)',
      icon: <GitBranch size={17} />,
      badge: unassignedHunksCount > 0 ? unassignedHunksCount : undefined,
    },
    {
      id: 'graph',
      label: 'Architecture Knowledge Graph (Leiden Clusters)',
      icon: <Network size={17} />,
    },
    {
      id: 'diffs',
      label: 'Multiplayer Diffs & 3-Way Merge',
      icon: <GitPullRequest size={17} />,
    },
    {
      id: 'ci',
      label: 'Live CI Terminal Streamer (act runner)',
      icon: <Terminal size={17} />,
    },
    {
      id: 'storage',
      label: 'SeaweedFS S3 Storage & Artifacts',
      icon: <HardDrive size={17} />,
    },
    {
      id: 'collections',
      label: 'PocketBase Collections & Schemas',
      icon: <Database size={17} />,
    },
    {
      id: 'meet',
      label: 'Zoom & Meet Live Video Huddle',
      icon: <Video size={17} />,
      badge: 4,
    },
  ];

  return (
    <aside className="w-12 h-full bg-[#0d1117] rounded-xl border border-[#21262d] flex flex-col items-center py-2.5 justify-between shrink-0 select-none z-20 shadow-md">
      {/* Navigation Items */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {navItems.map((item) => {
          const isActive = activeMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectMode(item.id)}
              title={item.label}
              className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all group ${
                isActive
                  ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm ring-1 ring-white/5'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
              }`}
            >
              {item.icon}
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#d29922] text-[#07090e] font-mono text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {/* Active indicator pip */}
              {isActive && (
                <span className="absolute -left-1 top-2 bottom-2 w-0.5 bg-[#388bfd] rounded-r" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer controls: Backend status + Preferences */}
      <div className="flex flex-col items-center gap-2">
        {onOpenBackendStatus && (
          <button
            onClick={onOpenBackendStatus}
            title="Backend Services Status"
            className="w-8 h-8 rounded-lg text-[#3fb950] hover:bg-[#161b22] flex items-center justify-center transition-colors"
          >
            <Server size={15} />
          </button>
        )}

        <button
          onClick={onOpenSettings}
          title="Project Settings & Russh SSH Keys"
          className="w-8 h-8 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] flex items-center justify-center transition-colors"
        >
          <Settings size={15} />
        </button>
      </div>
    </aside>
  );
};
