import React, { useState } from 'react';
import {
  GitBranch,
  AlertTriangle,
  Plus,
  Send,
  Sparkles,
  Layers,
  ArrowRight,
  FileCode,
  CheckCircle2,
  Clock,
  Radio,
  Eye,
  Trash2,
} from 'lucide-react';
import { VirtualBranch, DiffHunk } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Drawer } from '../common/Drawer';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { useToast } from '../common/Toast';

interface VirtualBranchViewProps {
  branches: VirtualBranch[];
  hunks: DiffHunk[];
  onAssignHunk: (hunkId: string, branchId: string | null) => void;
  onCreateBranch: (name: string, description: string) => void;
  onPushBranch: (branchId: string) => void;
  onCommitBranch: (branchId: string, message: string) => void;
}

export const VirtualBranchView: React.FC<VirtualBranchViewProps> = ({
  branches,
  hunks,
  onAssignHunk,
  onCreateBranch,
  onPushBranch,
  onCommitBranch,
}) => {
  const { addToast } = useToast();
  const [selectedBlastBranch, setSelectedBlastBranch] = useState<VirtualBranch | null>(null);
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchDesc, setNewBranchDesc] = useState('');
  const [isConflictBannerDismissed, setIsConflictBannerDismissed] = useState(false);
  const [commitMessages, setCommitMessages] = useState<Record<string, string>>({
    'branch-1': 'feat(auth): add Wasm TokenStore validation and broadcast',
    'branch-2': 'storage(seaweed): generate presigned S3 URLs',
    'branch-3': 'fix(cache): non-blocking TokenStore LRU read access',
  });

  // Calculate unassigned hunks
  const unassignedHunks = hunks.filter((h) => h.assignedBranchId === null);

  // Check AST overlap conflicts across active lanes
  const conflictingBranches = branches.filter((b) => b.astConflictsWith && b.astConflictsWith.length > 0);

  const handleGenerateCommitMsg = (branch: VirtualBranch) => {
    const suggested = `refactor(${branch.name.replace('feat-', '').replace('fix-', '')}): sync virtual lane hunks and update references`;
    setCommitMessages((prev) => ({ ...prev, [branch.id]: suggested }));
    addToast({
      type: 'info',
      title: 'Commit Message Generated',
      description: 'AI analyzed staged diff AST symbols and drafted commit header',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    onCreateBranch(newBranchName.trim(), newBranchDesc.trim());
    setNewBranchName('');
    setNewBranchDesc('');
    setIsNewBranchModalOpen(false);
    addToast({
      type: 'success',
      title: 'Virtual Lane Created',
      description: `Targeting refs/gitbutler/${newBranchName}`,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#07090e]">
      {/* Top Pre-flight Conflict Warning Card (Spotify-style subtle notification) */}
      {conflictingBranches.length > 0 && !isConflictBannerDismissed && (
        <div className="mx-4 mt-3 mb-1 p-2.5 rounded-xl bg-[#d29922]/10 border border-[#d29922]/30 flex items-center justify-between text-xs text-[#f0f6fc] shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-6 h-6 rounded-full bg-[#d29922]/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={13} className="text-[#d29922]" />
            </div>
            <div className="truncate">
              <span className="font-semibold text-[#d29922] mr-2">Pre-flight AST Overlap:</span>
              <span className="text-[#8b949e]">
                Overlapping function symbol in{' '}
                <code className="text-[#58a6ff] bg-[#161b22] px-1.5 py-0.5 rounded font-mono">
                  TokenStore::validate
                </code>{' '}
                between <strong className="text-[#f0f6fc]">feat-auth-wasm</strong> and{' '}
                <strong className="text-[#f0f6fc]">fix-cache-lock</strong>.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="xs"
              variant="secondary"
              onClick={() => {
                const b = branches.find((x) => x.id === 'branch-3');
                if (b) setSelectedBlastBranch(b);
              }}
            >
              Analyze Overlap
            </Button>
            <button
              onClick={() => setIsConflictBannerDismissed(true)}
              className="text-[#8b949e] hover:text-[#f0f6fc] p-1 rounded-full hover:bg-[#161b22] transition-colors"
              title="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Dual-pane Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Area: Unassigned Staging Area */}
        <div className="w-80 border-r border-[#21262d] bg-[#0d1117] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#21262d] flex items-center justify-between bg-[#161b22]/50">
            <div>
              <div className="font-semibold text-xs text-[#f0f6fc] flex items-center gap-1.5">
                <Layers size={14} className="text-[#388bfd]" />
                Unassigned Staging Area
              </div>
              <div className="text-[11px] text-[#8b949e] mt-0.5">
                {unassignedHunks.length} hunks awaiting virtual branch lane
              </div>
            </div>
            <Button
              size="xs"
              variant="outline"
              icon={<Plus size={12} />}
              onClick={() => setIsNewBranchModalOpen(true)}
            >
              New Lane
            </Button>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const hunkId = e.dataTransfer.getData('text/plain');
              if (hunkId) {
                onAssignHunk(hunkId, null);
                addToast({
                  type: 'info',
                  title: 'Hunk Dropped to Staging',
                  description: 'Unassigned hunk returned to working tree staging',
                });
              }
            }}
            className="flex-1 overflow-y-auto p-3 space-y-3"
          >
            {unassignedHunks.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#21262d] rounded-lg">
                <CheckCircle2 size={24} className="text-[#3fb950] mb-2" />
                <div className="text-xs font-semibold text-[#f0f6fc]">All changes assigned</div>
                <div className="text-[11px] text-[#8b949e] mt-1">
                  Working-copy hunks are safely mapped to virtual branches.
                </div>
              </div>
            ) : (
              unassignedHunks.map((hunk) => (
                <div
                  key={hunk.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', hunk.id);
                  }}
                  className="rounded-lg bg-[#161b22] border border-[#30363d] overflow-hidden shadow-xs hover:border-[#388bfd]/50 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <div className="px-3 py-2 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between">
                    <span className="font-mono text-xs text-[#58a6ff] truncate max-w-[170px]" title={hunk.file}>
                      {hunk.file}
                    </span>
                    <Badge variant={hunk.status === 'added' ? 'success' : 'warning'} subtleBox>
                      {hunk.status}
                    </Badge>
                  </div>

                  {/* Diff Hunk snippet */}
                  <div className="p-2 bg-[#07090e] font-mono text-[11px] leading-tight overflow-x-auto max-h-36">
                    {hunk.content.slice(0, 4).map((line, idx) => (
                      <div
                        key={idx}
                        className={
                          line.startsWith('+')
                            ? 'text-[#3fb950] bg-[#238636]/10'
                            : line.startsWith('-')
                            ? 'text-[#f85149] bg-[#da3633]/10'
                            : 'text-[#8b949e]'
                        }
                      >
                        {line}
                      </div>
                    ))}
                    {hunk.content.length > 4 && (
                      <div className="text-[10px] text-[#484f58] italic pt-1">
                        + {hunk.content.length - 4} more lines...
                      </div>
                    )}
                  </div>

                  {/* Assign to branch action */}
                  <div className="p-2 bg-[#161b22] border-t border-[#21262d] flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e]">Assign to lane:</span>
                    <div className="flex gap-1">
                      {branches.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => onAssignHunk(hunk.id, b.id)}
                          title={`Assign to ${b.name}`}
                          className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#388bfd] hover:text-white text-[10px] font-mono text-[#f0f6fc] border border-[#30363d] transition-colors"
                        >
                          {b.name.replace('feat-', '').replace('fix-', '').slice(0, 7)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Canvas: Concurrent Virtual Branch Swimlanes */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e]">
          {/* Swimlane Header Bar */}
          <div className="px-4 py-2.5 border-b border-[#21262d] bg-[#0d1117] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                <GitBranch size={14} className="text-[#3fb950]" />
                Virtual Branch Swimlanes (GitButler engine)
              </span>
              <span className="text-xs text-[#8b949e]">· Concurrent working-tree states</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={14} />}
                onClick={() => setIsNewBranchModalOpen(true)}
              >
                Create Virtual Branch
              </Button>
            </div>
          </div>

          {/* Horizontal Swimlanes Container */}
          <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-start">
            {branches.map((branch) => {
              const branchHunks = hunks.filter((h) => branch.hunkIds.includes(h.id));
              const isConflicted = branch.astConflictsWith && branch.astConflictsWith.length > 0;

              return (
                <div
                  key={branch.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const hunkId = e.dataTransfer.getData('text/plain');
                    if (hunkId) {
                      onAssignHunk(hunkId, branch.id);
                      addToast({
                        type: 'success',
                        title: 'Hunk Dropped into Lane',
                        description: `Assigned hunk to ${branch.name}`,
                      });
                    }
                  }}
                  className={`w-96 rounded-xl border flex flex-col shrink-0 bg-[#0d1117] shadow-xl max-h-full transition-all ${
                    isConflicted
                      ? 'border-[#d29922]/70 shadow-[#d29922]/5'
                      : 'border-[#30363d] hover:border-[#388bfd]/50'
                  }`}
                >
                  {/* Branch Card Header */}
                  <div className="p-3.5 border-b border-[#21262d] bg-[#161b22] rounded-t-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch
                          size={15}
                          className={isConflicted ? 'text-[#d29922]' : 'text-[#388bfd]'}
                        />
                        <span className="font-semibold text-xs text-[#f0f6fc] truncate max-w-[190px]">
                          {branch.name}
                        </span>
                      </div>
                      <Badge
                        variant={
                          branch.status === 'pushed'
                            ? 'success'
                            : isConflicted
                            ? 'warning'
                            : branch.status === 'ready'
                            ? 'info'
                            : 'default'
                        }
                        subtleBox
                      >
                        {isConflicted ? 'AST Overlap' : branch.status}
                      </Badge>
                    </div>

                    <div className="text-[11px] font-mono text-[#8b949e] truncate" title={branch.ref}>
                      {branch.ref}
                    </div>

                    <p className="text-xs text-[#8b949e] line-clamp-2">{branch.description}</p>

                    {/* Metadata strip */}
                    <div className="flex items-center justify-between text-[10px] text-[#8b949e] pt-1 border-t border-[#21262d]">
                      <span>{branch.author}</span>
                      <span>·</span>
                      <span>{branch.updatedAt}</span>
                      <span>·</span>
                      <button
                        onClick={() => setSelectedBlastBranch(branch)}
                        className="hover:underline flex items-center gap-1 font-mono text-[#58a6ff]"
                      >
                        <Eye size={11} />
                        Blast: {branch.blastScore}%
                      </button>
                    </div>
                  </div>

                  {/* Branch Assigned Hunks List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[160px] max-h-[340px]">
                    {branchHunks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#484f58] border border-dashed border-[#21262d] rounded-lg">
                        No hunks assigned yet. Drag or assign hunks from the staging area.
                      </div>
                    ) : (
                      branchHunks.map((hunk) => (
                        <div
                          key={hunk.id}
                          className="rounded-lg bg-[#161b22] border border-[#21262d] overflow-hidden"
                        >
                          <div className="px-2.5 py-1.5 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1 text-[#58a6ff] font-mono truncate max-w-[210px]">
                              <FileCode size={12} />
                              <span className="truncate">{hunk.file}</span>
                            </div>
                            <button
                              onClick={() => onAssignHunk(hunk.id, null)}
                              title="Unassign hunk back to staging"
                              className="text-[#8b949e] hover:text-[#f85149] p-0.5 transition-colors"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="p-2 bg-[#07090e] font-mono text-[10px] leading-tight max-h-24 overflow-y-auto">
                            {hunk.content.slice(0, 3).map((l, i) => (
                              <div
                                key={i}
                                className={
                                  l.startsWith('+')
                                    ? 'text-[#3fb950]'
                                    : l.startsWith('-')
                                    ? 'text-[#f85149]'
                                    : 'text-[#8b949e]'
                                }
                              >
                                {l}
                              </div>
                            ))}
                          </div>

                          {/* AST Symbol Tag */}
                          {hunk.astSymbols.length > 0 && (
                            <div className="px-2 py-1 bg-[#161b22] border-t border-[#21262d] flex items-center gap-1.5 text-[10px] font-mono text-[#8b949e]">
                              <span className="text-[#388bfd]">AST:</span>
                              <span className="truncate">{hunk.astSymbols.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Branch Commit & Push Controls */}
                  <div className="p-3 bg-[#161b22] border-t border-[#21262d] rounded-b-xl space-y-2">
                    {/* Conventional Commit Quick Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono pb-0.5">
                      {['feat:', 'fix:', 'refactor:', 'perf:'].map((prefix) => (
                        <button
                          key={prefix}
                          type="button"
                          onClick={() => {
                            const cur = commitMessages[branch.id] || '';
                            const clean = cur.replace(/^(feat|fix|refactor|perf|chore):\s*/, '');
                            setCommitMessages((prev) => ({
                              ...prev,
                              [branch.id]: `${prefix} ${clean}`.trim(),
                            }));
                          }}
                          className="px-1.5 py-0.5 rounded bg-[#0d1117] hover:bg-[#21262d] text-[#8b949e] hover:text-[#58a6ff] border border-[#21262d] transition-colors shrink-0"
                        >
                          {prefix}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const tag = 'Co-authored-by: Elena Rostova <elena@forge.dev>';
                          const cur = commitMessages[branch.id] || '';
                          if (!cur.includes(tag)) {
                            setCommitMessages((prev) => ({
                              ...prev,
                              [branch.id]: `${cur}\n\n${tag}`.trim(),
                            }));
                            addToast({
                              type: 'info',
                              title: 'Co-Author Tag Added',
                              description: tag,
                            });
                          }
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#0d1117] hover:bg-[#21262d] text-[#8b949e] hover:text-[#3fb950] border border-[#21262d] transition-colors shrink-0 ml-auto"
                      >
                        + Co-author
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        value={commitMessages[branch.id] || ''}
                        onChange={(e) =>
                          setCommitMessages((prev) => ({ ...prev, [branch.id]: e.target.value }))
                        }
                        placeholder="Commit message (markdown, conventional prefixes)..."
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-2.5 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#388bfd]"
                      />
                      <button
                        onClick={() => handleGenerateCommitMsg(branch)}
                        title="AI generate commit message from AST changes"
                        className="absolute right-1.5 top-1.5 text-[#8b949e] hover:text-[#58a6ff] p-0.5"
                      >
                        <Sparkles size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="xs"
                        variant="secondary"
                        disabled={branchHunks.length === 0}
                        onClick={() => {
                          onCommitBranch(branch.id, commitMessages[branch.id] || 'Update branch');
                          addToast({
                            type: 'success',
                            title: 'Committed to Virtual Ref',
                            description: `Updated ${branch.ref} locally`,
                          });
                        }}
                      >
                        Commit
                      </Button>
                      <Button
                        size="xs"
                        variant="primary"
                        icon={<Send size={11} />}
                        onClick={() => onPushBranch(branch.id)}
                      >
                        Push (russh)
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Blast Radius Preview Drawer */}
      <Drawer
        isOpen={Boolean(selectedBlastBranch)}
        onClose={() => setSelectedBlastBranch(null)}
        title={`Blast-Radius: ${selectedBlastBranch?.name || ''}`}
        subtitle={selectedBlastBranch?.ref}
        width="lg"
      >
        {selectedBlastBranch && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#f0f6fc]">Predicted Impact Score</span>
                <Badge
                  variant={
                    selectedBlastBranch.blastRadius === 'high'
                      ? 'danger'
                      : selectedBlastBranch.blastRadius === 'med'
                      ? 'warning'
                      : 'success'
                  }
                  subtleBox
                >
                  {selectedBlastBranch.blastScore}% ({selectedBlastBranch.blastRadius} risk)
                </Badge>
              </div>
              <div className="w-full bg-[#161b22] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    selectedBlastBranch.blastRadius === 'high'
                      ? 'bg-[#f85149]'
                      : selectedBlastBranch.blastRadius === 'med'
                      ? 'bg-[#d29922]'
                      : 'bg-[#3fb950]'
                  }`}
                  style={{ width: `${selectedBlastBranch.blastScore}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#f0f6fc]">Impacted Architecture Symbols</h4>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] font-mono text-xs text-[#58a6ff] flex justify-between">
                  <span>TokenStore::validate</span>
                  <span className="text-[#d29922]">6 callers impacted</span>
                </div>
                <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] font-mono text-xs text-[#58a6ff] flex justify-between">
                  <span>api::v2::auth_login</span>
                  <span className="text-[#3fb950]">2 callers impacted</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-xs space-y-1">
              <div className="font-semibold text-[#f0f6fc]">Upstream Gateway Target</div>
              <div className="text-[#8b949e] font-mono text-[11px]">
                russh://git.forge.internal/engine → {selectedBlastBranch.upstreamBranch}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* New Virtual Branch Modal */}
      <Modal
        isOpen={isNewBranchModalOpen}
        onClose={() => setIsNewBranchModalOpen(false)}
        title="Create Concurrent Virtual Branch"
        description="Creates an isolated working-tree lane mapped to refs/gitbutler/*"
        maxWidth="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsNewBranchModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit}>
              Create Lane
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">Lane Identifier</label>
            <Input
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="e.g. feat-wasm-simd"
              required
            />
            <span className="text-[11px] font-mono text-[#8b949e] mt-1 block">
              Ref: refs/gitbutler/{newBranchName || '<name>'}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">Description</label>
            <textarea
              value={newBranchDesc}
              onChange={(e) => setNewBranchDesc(e.target.value)}
              placeholder="What changes does this virtual branch encapsulate?"
              rows={2}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md p-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#388bfd]"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
