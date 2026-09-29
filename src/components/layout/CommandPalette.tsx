import React, { useState, useEffect } from 'react';
import { Search, GitBranch, Network, GitPullRequest, Terminal, Database, FileCode, ArrowRight, Sun, Moon, Contrast, HardDrive, Video } from 'lucide-react';
import { WorkspaceMode } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: WorkspaceMode) => void;
  onSelectBranch: (branchId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  onSelectBranch,
}) => {
  const [query, setQuery] = useState('');
  const { theme, toggleTheme, setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'theme-oled',
      title: 'Appearance: Switch to OLED True Black Theme (#000000)',
      subtitle: 'Pure pitch black for OLED panels & maximum contrast',
      icon: <Contrast size={16} className="text-[#ffffff]" />,
      action: () => {
        setTheme('oled');
        onClose();
      },
    },
    {
      id: 'theme-light',
      title: 'Appearance: Switch to PocketBase Light Theme',
      subtitle: 'Clean, high-legibility light theme for daytime and reviews',
      icon: <Sun size={16} className="text-[#d29922]" />,
      action: () => {
        setTheme('light');
        onClose();
      },
    },
    {
      id: 'theme-dark',
      title: 'Appearance: Switch to Dark Slate Cockpit',
      subtitle: 'High contrast dark slate for low-light developer workflows',
      icon: <Moon size={16} className="text-[#388bfd]" />,
      action: () => {
        setTheme('dark');
        onClose();
      },
    },
    {
      id: 'theme-toggle',
      title: 'Appearance: Cycle Theme (Dark → Light → OLED)',
      subtitle: `Currently active: ${
        theme === 'oled'
          ? 'OLED True Black'
          : theme === 'dark'
          ? 'Dark Cockpit'
          : 'PocketBase Light'
      }`,
      icon:
        theme === 'oled' ? (
          <Contrast size={16} className="text-[#ffffff]" />
        ) : theme === 'dark' ? (
          <Sun size={16} className="text-[#d29922]" />
        ) : (
          <Contrast size={16} className="text-[#388bfd]" />
        ),
      action: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: 'mode-branches',
      title: 'Switch to Virtual Branches (GitButler)',
      subtitle: 'View concurrent lanes & unassigned hunks',
      icon: <GitBranch size={16} className="text-[#388bfd]" />,
      action: () => {
        onSelectMode('branches');
        onClose();
      },
    },
    {
      id: 'mode-graph',
      title: 'Open Architecture Knowledge Graph',
      subtitle: 'Leiden clusters, PageRank centrality, blast radius',
      icon: <Network size={16} className="text-[#a371f7]" />,
      action: () => {
        onSelectMode('graph');
        onClose();
      },
    },
    {
      id: 'mode-diffs',
      title: 'Inspect 3-Way Diffs & PR Reviews',
      subtitle: 'Monaco diff host with multiplayer presence gutters',
      icon: <GitPullRequest size={16} className="text-[#3fb950]" />,
      action: () => {
        onSelectMode('diffs');
        onClose();
      },
    },
    {
      id: 'mode-ci',
      title: 'Stream Act CI Runner Live Logs',
      subtitle: 'Real-time terminal execution & ANSI logs',
      icon: <Terminal size={16} className="text-[#f85149]" />,
      action: () => {
        onSelectMode('ci');
        onClose();
      },
    },
    {
      id: 'mode-storage',
      title: 'Manage SeaweedFS S3 Distributed Storage & Artifacts',
      subtitle: 'Browse buckets, generate presigned URLs, and upload wasm blobs',
      icon: <HardDrive size={16} className="text-[#3fb950]" />,
      action: () => {
        onSelectMode('storage');
        onClose();
      },
    },
    {
      id: 'mode-collections',
      title: 'Explore SpacetimeDB Collections & Schemas',
      subtitle: 'PocketBase-style database table browser & API tester',
      icon: <Database size={16} className="text-[#d29922]" />,
      action: () => {
        onSelectMode('collections');
        onClose();
      },
    },
    {
      id: 'mode-meet',
      title: 'Join Live Zoom & Google Meet Huddle',
      subtitle: 'Collaborative video stream, screen sharing, and Slack huddle pen',
      icon: <Video size={16} className="text-[#58a6ff]" />,
      action: () => {
        onSelectMode('meet');
        onClose();
      },
    },
    {
      id: 'branch-1',
      title: 'Branch: refs/gitbutler/feat-auth-wasm',
      subtitle: '2 hunks · TokenStore::validate · Blast: Med (42%)',
      icon: <FileCode size={16} className="text-[#58a6ff]" />,
      action: () => {
        onSelectBranch('branch-1');
        onSelectMode('branches');
        onClose();
      },
    },
    {
      id: 'branch-3',
      title: 'Branch: refs/gitbutler/fix-cache-lock (AST Conflicted)',
      subtitle: 'Overlaps with feat-auth-wasm on TokenStore::validate',
      icon: <FileCode size={16} className="text-[#f85149]" />,
      action: () => {
        onSelectBranch('branch-3');
        onSelectMode('branches');
        onClose();
      },
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-xl bg-[#161b22] border border-[#30363d] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center px-4 py-3 border-b border-[#21262d] gap-2.5">
          <Search size={16} className="text-[#8b949e]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, branch, symbol, or collection..."
            className="w-full bg-transparent text-sm text-[#f0f6fc] placeholder-[#484f58] focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#8b949e]">No matching commands or symbols</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full text-left p-2.5 rounded-lg hover:bg-[#21262d] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-[#0d1117] border border-[#21262d]">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#f0f6fc]">{item.title}</div>
                    <div className="text-[11px] text-[#8b949e] font-mono">{item.subtitle}</div>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-[#484f58] group-hover:text-[#58a6ff] transition-colors"
                />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
