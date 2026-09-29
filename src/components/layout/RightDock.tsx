import React, { useState } from 'react';
import { Activity, Users, MessageSquare, Send, CheckCircle2, GitCommit, GitPullRequest, ArrowUpRight } from 'lucide-react';
import { ActivityEvent, TeammatePresence, ChatMessage } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface RightDockProps {
  isOpen: boolean;
  activity: ActivityEvent[];
  teammates: TeammatePresence[];
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onJumpToLine: (file: string, line: number) => void;
}

export const RightDock: React.FC<RightDockProps> = ({
  isOpen,
  activity,
  teammates,
  chatMessages,
  onSendMessage,
  onJumpToLine,
}) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'presence' | 'chat'>('activity');
  const [chatInput, setChatInput] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <aside className="w-80 h-full min-h-0 bg-[#0d1117] rounded-xl border border-[#21262d] flex flex-col shrink-0 text-xs z-10 overflow-hidden shadow-xl">
      {/* Dock Header Tabs */}
      <div className="flex items-center justify-between border-b border-[#21262d] px-2 py-1.5 bg-[#161b22]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'activity'
                ? 'bg-[#21262d] text-[#f0f6fc] font-medium'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Activity size={13} className="text-[#388bfd]" />
            <span>Live Stream</span>
          </button>
          <button
            onClick={() => setActiveTab('presence')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'presence'
                ? 'bg-[#21262d] text-[#f0f6fc] font-medium'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Users size={13} className="text-[#3fb950]" />
            <span>Presence ({teammates.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'chat'
                ? 'bg-[#21262d] text-[#f0f6fc] font-medium'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <MessageSquare size={13} className="text-[#a371f7]" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Tab 1: Live Activity Stream */}
        {activeTab === 'activity' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#8b949e] font-mono px-1">
              <span>SpacetimeDB Push Feed</span>
              <span className="text-[#3fb950]">● active</span>
            </div>
            {activity.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d] hover:border-[#30363d] transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={ev.avatar}
                      alt={ev.user}
                      className="w-4 h-4 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-semibold text-[#f0f6fc]">{ev.user}</span>
                  </div>
                  <span className="text-[10px] text-[#8b949e] font-mono">{ev.time}</span>
                </div>
                <div className="text-[11px] text-[#8b949e]">
                  <span>{ev.action} </span>
                  <span className="font-mono text-[#58a6ff] bg-[#0d1117] px-1 py-0.5 rounded">
                    {ev.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Teammate Line Presence */}
        {activeTab === 'presence' && (
          <div className="space-y-2.5">
            <div className="text-[11px] text-[#8b949e] font-mono px-1">
              Multiplayer Cursor Gutters
            </div>
            {teammates.map((mate) => (
              <div
                key={mate.id}
                onClick={() => onJumpToLine(mate.activeFile, mate.activeLine)}
                className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d] hover:border-[#388bfd]/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={mate.avatar}
                        alt={mate.name}
                        className="w-5 h-5 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: mate.color }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-[#f0f6fc]">{mate.name}</div>
                      <div className="text-[10px] text-[#8b949e] font-mono">{mate.branch}</div>
                    </div>
                  </div>
                  <ArrowUpRight size={13} className="text-[#8b949e] group-hover:text-[#58a6ff]" />
                </div>
                <div className="mt-2 text-[11px] font-mono text-[#58a6ff] bg-[#0d1117] px-2 py-1 rounded flex items-center justify-between">
                  <span className="truncate max-w-[180px]">{mate.activeFile}</span>
                  <span className="text-[#8b949e]">:{mate.activeLine}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Branch Chat Room */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full justify-between space-y-3">
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-170px)] pr-1">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={msg.avatar}
                        alt={msg.user}
                        className="w-4 h-4 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-semibold text-[#f0f6fc] text-[11px]">{msg.user}</span>
                    </div>
                    <span className="text-[10px] text-[#8b949e] font-mono">{msg.time}</span>
                  </div>
                  <div className="p-2 rounded bg-[#161b22] text-[#f0f6fc] text-xs leading-relaxed border border-[#21262d]">
                    {msg.text}
                    {msg.codeSnippet && (
                      <pre className="mt-1.5 p-1.5 rounded bg-[#0d1117] text-[11px] font-mono text-[#58a6ff] border border-[#21262d] overflow-x-auto">
                        <code>{msg.codeSnippet}</code>
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="pt-2 border-t border-[#21262d] flex gap-1.5">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message branch room..."
                className="flex-1 bg-[#161b22] border border-[#30363d] rounded-md px-2.5 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#388bfd]"
              />
              <Button type="submit" variant="primary" size="sm" icon={<Send size={12} />}>
                Send
              </Button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
};
