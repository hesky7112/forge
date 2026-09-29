import React, { useState } from 'react';
import {
  ChevronDown,
  Search,
  Wifi,
  WifiOff,
  GitBranch,
  SidebarClose,
  SidebarOpen,
  FolderGit2,
  Sun,
  Moon,
  Contrast,
  ChevronLeft,
  ChevronRight,
  Flame,
  HelpCircle,
  AlertTriangle,
  Network,
  GitPullRequest,
  Terminal,
  HardDrive,
  Database,
  Server,
  User,
  Video,
} from 'lucide-react';
import { Repository, WorkspaceMode, TeammatePresence } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface TopBarProps {
  repositories: Repository[];
  currentRepo: Repository;
  onSelectRepo: (repo: Repository) => void;
  activeMode: WorkspaceMode;
  onSelectMode: (mode: WorkspaceMode) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  teammates: TeammatePresence[];
  onOpenCommandPalette: () => void;
  isRightDockOpen: boolean;
  onToggleRightDock: () => void;
  onOpenShortcutsHelp?: () => void;
  onOpenBackendStatus?: () => void;
  activeBranchName?: string;
  unassignedHunksCount?: number;
  hasConflict?: boolean;
  onInspectConflict?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  repositories,
  currentRepo,
  onSelectRepo,
  activeMode,
  onSelectMode,
  isOnline,
  onToggleOnline,
  teammates,
  onOpenCommandPalette,
  isRightDockOpen,
  onToggleRightDock,
  onOpenShortcutsHelp,
  onOpenBackendStatus,
  activeBranchName = 'feat-auth-wasm',
  unassignedHunksCount = 2,
  hasConflict = true,
  onInspectConflict,
}) => {
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navigationTabs: {
    id: WorkspaceMode;
    label: string;
    icon: React.ReactNode;
    count?: number | string;
    indicator?: 'warning' | 'info';
  }[] = [
    {
      id: 'branches',
      label: 'Branches',
      icon: <GitBranch size={13} />,
      count: unassignedHunksCount > 0 ? unassignedHunksCount : undefined,
    },
    {
      id: 'graph',
      label: 'Graph',
      icon: <Network size={13} />,
    },
    {
      id: 'diffs',
      label: 'Diffs & PRs',
      icon: <GitPullRequest size={13} />,
      count: 3,
    },
    {
      id: 'ci',
      label: 'CI/CD',
      icon: <Terminal size={13} />,
      indicator: 'warning',
    },
    {
      id: 'storage',
      label: 'SeaweedFS',
      icon: <HardDrive size={13} />,
      count: 4,
    },
    {
      id: 'collections',
      label: 'PocketBase',
      icon: <Database size={13} />,
      count: 5,
    },
    {
      id: 'meet',
      label: 'Huddle',
      icon: <Video size={13} />,
      count: 'Live',
    },
  ];

  return (
    <header className="h-14 px-3 bg-[#000000] border-b border-[#21262d] flex items-center justify-between gap-3 shrink-0 select-none z-30 transition-colors">
      {/* 1. Left Zone: Navigation Chevrons + Brand + Repository Switcher */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* History navigation buttons (< >) - Spotify style */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectMode('branches')}
            title="Back to Branches (1)"
            className="w-8 h-8 rounded-full bg-[#121212] hover:bg-[#282828] text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors border border-white/5"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onSelectMode('diffs')}
            title="Forward to PRs (3)"
            className="w-8 h-8 rounded-full bg-[#121212] hover:bg-[#282828] text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors border border-white/5"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Brand Lockup */}
        <div
          onClick={() => onSelectMode('branches')}
          className="flex items-center gap-2 px-1 cursor-pointer group"
          title="Forge Studio Cockpit"
        >
          <div className="w-7 h-7 rounded-lg bg-[#388bfd]/20 border border-[#388bfd]/40 flex items-center justify-center text-[#58a6ff] group-hover:scale-105 transition-transform">
            <Flame size={15} className="animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm tracking-tight text-[#f0f6fc]">Forge</span>
            <span className="text-[10px] font-mono text-[#8b949e] px-1 py-0.2 rounded bg-[#161b22] border border-[#21262d]">
              v1.4
            </span>
          </div>
        </div>

        <span className="text-[#30363d] hidden sm:inline">/</span>

        {/* Repository Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121212] hover:bg-[#282828] border border-[#30363d]/60 text-[#f0f6fc] text-xs font-mono transition-all hover:border-[#388bfd]/60 shadow-xs"
          >
            <FolderGit2 size={13} className="text-[#388bfd]" />
            <span className="max-w-[130px] truncate font-semibold">{currentRepo.name}</span>
            <ChevronDown size={12} className="text-[#8b949e]" />
          </button>

          {repoDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-xl bg-[#161b22] border border-[#30363d] shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-mono text-[#8b949e] border-b border-[#21262d] uppercase tracking-wider">
                Workspaces & Repositories
              </div>
              {repositories.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => {
                    onSelectRepo(repo);
                    setRepoDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between font-mono text-xs hover:bg-[#21262d] transition-colors ${
                    repo.id === currentRepo.id
                      ? 'text-[#388bfd] font-semibold bg-[#21262d]/50'
                      : 'text-[#f0f6fc]'
                  }`}
                >
                  <span className="truncate">{repo.name}</span>
                  <span className="text-[10px] text-[#8b949e] bg-[#0d1117] px-1.5 py-0.5 rounded">
                    {repo.defaultBranch}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Center Zone: Spotify Filter Pills & Quick Search */}
      <div className="flex-1 flex items-center justify-center max-w-2xl px-2">
        {/* Navigation Tabs styled as Spotify's signature high-contrast pill filters */}
        <div className="flex items-center gap-1 p-1 bg-[#121212] rounded-full border border-white/5 shadow-inner overflow-x-auto max-w-full">
          {navigationTabs.map((tab) => {
            const isActive = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectMode(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#f0f6fc] text-[#07090e] font-semibold shadow-md transform scale-[1.02]'
                    : 'text-[#b3b3b3] hover:text-white hover:bg-[#282828]'
                }`}
              >
                <span className={isActive ? 'text-[#07090e]' : 'text-[#8b949e]'}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-[#07090e] text-[#f0f6fc]' : 'bg-[#282828] text-[#8b949e]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.indicator === 'warning' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d29922] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Right Zone: Conflict Alert + Search Button + Sync Pill + Collaborators + Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* AST Conflict Warning Pill */}
        {hasConflict && (
          <button
            onClick={onInspectConflict}
            title="1 AST Overlap detected: TokenStore::validate"
            className="hidden lg:flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-[#d29922]/15 hover:bg-[#d29922]/25 border border-[#d29922]/40 text-[#d29922] text-[11px] font-mono transition-colors"
          >
            <AlertTriangle size={12} className="shrink-0 animate-pulse" />
            <span className="truncate max-w-[120px]">AST Conflict</span>
          </button>
        )}

        {/* Global Search Pill (⌘K) */}
        <button
          onClick={onOpenCommandPalette}
          title="Search anything (Cmd+K)"
          className="h-8 px-2.5 rounded-full bg-[#121212] hover:bg-[#282828] border border-white/5 text-xs text-[#8b949e] hover:text-[#f0f6fc] flex items-center gap-2 transition-all shadow-xs"
        >
          <Search size={13} className="text-[#8b949e]" />
          <kbd className="text-[10px] font-mono text-[#8b949e] bg-[#000000] px-1.5 py-0.5 rounded-full border border-white/10">
            ⌘K
          </kbd>
        </button>

        {/* SpacetimeDB Real-time Sync Status Pill */}
        <button
          onClick={onToggleOnline}
          title={isOnline ? 'SpacetimeDB Connected (Sub-50ms WebSocket active)' : 'SpacetimeDB Offline (Click to connect)'}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-full border text-[11px] font-mono transition-colors shadow-xs ${
            isOnline
              ? 'border-[#238636]/40 bg-[#238636]/10 text-[#3fb950]'
              : 'border-[#da3633]/40 bg-[#da3633]/10 text-[#f85149]'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950] opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-[#3fb950]' : 'bg-[#f85149]'
              }`}
            />
          </span>
          <span className="hidden xl:inline font-semibold">{isOnline ? 'Sync' : 'Offline'}</span>
        </button>

        {/* Collaborator Presence Stack */}
        <div
          className="hidden md:flex items-center -space-x-1.5 pl-0.5"
          title={`${teammates.length} collaborators in workspace`}
        >
          {teammates.map((user) => (
            <div
              key={user.id}
              title={`${user.name} viewing ${user.activeFile}:${user.activeLine}`}
              className="relative w-6 h-6 rounded-full ring-2 ring-[#000000] overflow-hidden hover:scale-110 transition-transform"
              style={{ borderColor: user.color }}
            >
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span
                className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ring-1 ring-[#000000]"
                style={{ backgroundColor: user.color }}
              />
            </div>
          ))}
        </div>

        <div className="h-4 w-px bg-[#21262d] mx-0.5 hidden sm:block" />

        {/* Backend Microservices Cluster Status Button */}
        {onOpenBackendStatus && (
          <button
            onClick={onOpenBackendStatus}
            title="Backend Services & Health Check"
            className="w-8 h-8 rounded-full border border-white/5 bg-[#121212] hover:bg-[#282828] text-[#8b949e] hover:text-[#f0f6fc] flex items-center justify-center transition-colors"
          >
            <Server size={14} className="text-[#3fb950]" />
          </button>
        )}

        {/* Theme Toggle Button (Sun / Moon / OLED) */}
        <button
          onClick={toggleTheme}
          title={
            theme === 'dark'
              ? 'Current: Dark Slate Cockpit · Click to switch to Light Theme'
              : theme === 'light'
              ? 'Current: PocketBase Light · Click to switch to OLED Black'
              : 'Current: OLED True Black (#000000) · Click to switch to Dark Cockpit'
          }
          className="w-8 h-8 rounded-full border border-white/5 bg-[#121212] hover:bg-[#282828] text-[#8b949e] hover:text-[#f0f6fc] flex items-center justify-center transition-colors relative"
        >
          {theme === 'dark' ? (
            <Moon size={14} className="text-[#388bfd]" />
          ) : theme === 'light' ? (
            <Sun size={14} className="text-[#d29922]" />
          ) : (
            <Contrast size={14} className="text-[#ffffff]" />
          )}
          {theme === 'oled' && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#ffffff] ring-1 ring-black" />
          )}
        </button>

        {/* Keyboard Shortcuts Help */}
        {onOpenShortcutsHelp && (
          <button
            onClick={onOpenShortcutsHelp}
            title="Keyboard Shortcuts (?)"
            className="w-8 h-8 rounded-full border border-white/5 bg-[#121212] hover:bg-[#282828] text-[#8b949e] hover:text-[#f0f6fc] flex items-center justify-center transition-colors"
          >
            <HelpCircle size={14} />
          </button>
        )}

        {/* Right Dock Toggle Button */}
        <button
          onClick={onToggleRightDock}
          title={isRightDockOpen ? 'Collapse Activity Stream' : 'Expand Activity Stream'}
          className={`w-8 h-8 rounded-full border transition-colors flex items-center justify-center ${
            isRightDockOpen
              ? 'bg-[#282828] text-white border-white/20 shadow-xs'
              : 'bg-[#121212] text-[#8b949e] hover:text-white border-white/5 hover:bg-[#282828]'
          }`}
        >
          {isRightDockOpen ? <SidebarClose size={14} /> : <SidebarOpen size={14} />}
        </button>

        {/* User Profile Pill Avatar */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 hover:ring-[#388bfd] transition-all flex items-center justify-center bg-[#282828]"
            title="Austin Vance (Lead Architect)"
          >
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces"
              alt="Austin Vance"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-[#161b22] border border-[#30363d] shadow-2xl p-2 z-50 text-xs font-mono animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1.5 border-b border-[#21262d]">
                <div className="font-semibold text-[#f0f6fc]">Austin Vance</div>
                <div className="text-[10px] text-[#8b949e]">austin@forge.internal</div>
              </div>
              <div className="py-1">
                <div className="px-2 py-1 text-[10px] text-[#3fb950] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                  Active on feat-auth-wasm
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
