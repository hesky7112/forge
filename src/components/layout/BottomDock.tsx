import React from 'react';
import {
  GitBranch,
  Send,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  HardDrive,
  Users,
  Server,
  Terminal,
  Layers,
} from 'lucide-react';
import { VirtualBranch, DiffHunk } from '../../types';

interface BottomDockProps {
  activeBranch?: VirtualBranch;
  unassignedHunksCount: number;
  hasConflict?: boolean;
  onCommitBranch?: (branchId: string, message: string) => void;
  onPushBranch?: (branchId: string) => void;
  onOpenBackendStatus: () => void;
  onSelectMode: (mode: any) => void;
  isOnline: boolean;
  teammatesCount: number;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeBranch,
  unassignedHunksCount,
  hasConflict,
  onCommitBranch,
  onPushBranch,
  onOpenBackendStatus,
  onSelectMode,
  isOnline,
  teammatesCount,
}) => {
  return (
    <footer className="h-10 px-4 bg-[#0d1117] border-t border-[#21262d] flex items-center justify-between gap-4 text-xs font-mono select-none z-20 shrink-0">
      {/* Left: "Now Staging" Track Info (Spotify-style track info) */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 truncate">
          <div className="w-5 h-5 rounded-md bg-[#388bfd]/20 border border-[#388bfd]/40 flex items-center justify-center text-[#58a6ff] shrink-0">
            <GitBranch size={12} />
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-[#8b949e] text-[11px]">Lane:</span>
            <span className="font-semibold text-[#f0f6fc] text-xs truncate">
              {activeBranch ? activeBranch.name : 'main (clean)'}
            </span>
          </div>
        </div>

        <span className="text-[#30363d] hidden sm:inline">|</span>

        {/* Hunk counter */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#8b949e]">
          <span className="text-[#f0f6fc] font-semibold">{unassignedHunksCount}</span>
          <span>unassigned hunks</span>
        </div>

        {/* Conflict indicator */}
        {hasConflict && (
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-[#d29922] bg-[#d29922]/10 px-2 py-0.5 rounded-full border border-[#d29922]/30">
            <AlertTriangle size={11} className="animate-pulse" />
            <span>AST Overlap detected</span>
          </div>
        )}
      </div>

      {/* Center: Quick Transport Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {activeBranch && onCommitBranch && (
          <button
            onClick={() => onCommitBranch(activeBranch.id, `feat: staged changes for ${activeBranch.name}`)}
            className="h-7 flex items-center gap-1.5 px-3 rounded-full bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-[11px] font-medium transition-colors border border-[#30363d]"
          >
            <CheckCircle2 size={12} className="text-[#3fb950]" />
            <span className="hidden sm:inline">Commit</span>
          </button>
        )}

        {activeBranch && onPushBranch && (
          <button
            onClick={() => onPushBranch(activeBranch.id)}
            className="h-7 flex items-center gap-1.5 px-3 rounded-full bg-[#1f6feb] hover:bg-[#388bfd] text-white text-[11px] font-semibold transition-colors shadow-xs"
          >
            <Send size={11} />
            <span>Push SSH</span>
          </button>
        )}

        <button
          onClick={() => onSelectMode('ci')}
          className="h-7 flex items-center gap-1.5 px-2.5 rounded-full bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] text-[11px] transition-colors border border-[#21262d]"
          title="Jump to CI Runner"
        >
          <Terminal size={11} className="text-[#a371f7]" />
          <span className="hidden md:inline">CI Matrix</span>
        </button>
      </div>

      {/* Right: Telemetry Indicators + Backend Status */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Real-time stats */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] text-[#8b949e]">
          <span className="flex items-center gap-1" title="SpacetimeDB WebSocket Latency">
            <Wifi size={11} className={isOnline ? 'text-[#3fb950]' : 'text-[#f85149]'} />
            <span>6ms</span>
          </span>
          <span className="flex items-center gap-1" title="SeaweedFS S3 Throughput">
            <HardDrive size={11} className="text-[#388bfd]" />
            <span>42 MB/s</span>
          </span>
          <span className="flex items-center gap-1" title="Active Teammates in Repo">
            <Users size={11} className="text-[#d29922]" />
            <span>{teammatesCount} peers</span>
          </span>
        </div>

        {/* Backend Microservices Cluster Status Button */}
        <button
          onClick={onOpenBackendStatus}
          className="h-7 flex items-center gap-1.5 px-2.5 rounded-full bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[11px] text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
          title="Open Backend Services Architecture"
        >
          <Server size={12} className="text-[#3fb950]" />
          <span className="hidden sm:inline font-semibold">Backend 5/5</span>
        </button>
      </div>
    </footer>
  );
};
