import React, { useState } from 'react';
import {
  GitPullRequest,
  Check,
  MessageSquare,
  Sparkles,
  GitMerge,
  SplitSquareVertical,
  Columns,
  Eye,
  Send,
  CheckCircle2,
  FileCode,
  Flame,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { PullRequest, ReviewComment, TeammatePresence } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';

interface MultiplayerDiffViewProps {
  pullRequests: PullRequest[];
  selectedPr: PullRequest;
  onSelectPr: (pr: PullRequest) => void;
  reviewComments: ReviewComment[];
  onAddComment: (line: number, text: string, suggestion?: string) => void;
  onResolveComment: (commentId: string) => void;
  teammates: TeammatePresence[];
  highlightLine?: number | null;
}

export const MultiplayerDiffView: React.FC<MultiplayerDiffViewProps> = ({
  pullRequests,
  selectedPr,
  onSelectPr,
  reviewComments,
  onAddComment,
  onResolveComment,
  teammates,
  highlightLine = null,
}) => {
  const { addToast } = useToast();
  const [diffMode, setDiffMode] = useState<'split' | '3way' | 'unified'>('3way');
  const [activeCommentLine, setActiveCommentLine] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [includeSuggestion, setIncludeSuggestion] = useState(false);
  const [resolvedHunkChoice, setResolvedHunkChoice] = useState<'ours' | 'theirs' | 'both'>('ours');

  // Sample code lines for Monaco-style diff host
  const baseLines = [
    'pub struct TokenStore {',
    '    cache: Arc<LruCache<String, Session>>,',
    '    sessions: HashMap<Uuid, Session>,',
    '}',
    '',
    'impl TokenStore {',
    '    pub fn new(capacity: usize) -> Self {',
    '        Self {',
    '            cache: Arc::new(LruCache::new(capacity)),',
    '            sessions: HashMap::new(),',
    '        }',
    '    }',
    '',
    '    pub fn validate(&self, bearer: &str) -> Result<Session, AuthError> {',
    '        if bearer.is_empty() { return Err(AuthError::Empty); }',
    '        let token = self.cache.get(bearer).ok_or(AuthError::NotFound)?;',
    '        Ok(token.clone())',
    '    }',
    '',
    '    pub fn revoke_session(&mut self, session_id: &Uuid) -> bool {',
    '        self.sessions.remove(session_id).is_some()',
    '    }',
    '}',
  ];

  const oursLines = [
    'pub struct TokenStore {',
    '    cache: Arc<AsyncLruCache<String, Session>>,',
    '    sessions: Arc<RwLock<HashMap<Uuid, Session>>>,',
    '}',
    '',
    'impl TokenStore {',
    '    pub fn new(capacity: usize) -> Self {',
    '        Self {',
    '            cache: Arc::new(AsyncLruCache::new(capacity)),',
    '            sessions: Arc::new(RwLock::new(HashMap::new())),',
    '        }',
    '    }',
    '',
    '    pub async fn validate_wasm(&self, bearer: &str, claims: &Claims) -> Result<Session, AuthError> {',
    '        let token = self.cache.get_or_fetch(bearer).await?;',
    '        if token.is_expired() {',
    '            telemetry::counter!("auth.expired_token").increment(1);',
    '            return Err(AuthError::Expired);',
    '        }',
    '        self.verify_signatures(token, claims).await',
    '    }',
    '',
    '    pub async fn revoke_session(&mut self, session_id: &Uuid) -> bool {',
    '        let removed = self.sessions.write().await.remove(session_id).is_some();',
    '        spacetimedb::broadcast_revocation(session_id).await;',
    '        removed',
    '    }',
    '}',
  ];

  const theirsLines = [
    'pub struct TokenStore {',
    '    fast_lru: NonBlockingLru<String, Session>,',
    '    sessions: HashMap<Uuid, Session>,',
    '}',
    '',
    'impl TokenStore {',
    '    pub fn new(capacity: usize) -> Self {',
    '        Self {',
    '            fast_lru: NonBlockingLru::with_capacity(capacity),',
    '            sessions: HashMap::new(),',
    '        }',
    '    }',
    '',
    '    pub fn validate(&self, bearer: &str) -> Result<Session, AuthError> {',
    '        let cache_key = self.fast_lru.get_or_insert_with(bearer, hash_bearer);',
    '        Ok(cache_key.clone())',
    '    }',
    '',
    '    pub fn revoke_session(&mut self, session_id: &Uuid) -> bool {',
    '        self.sessions.remove(session_id).is_some()',
    '    }',
    '}',
  ];

  // Dynamic live merged output based on resolution
  const resultLines = resolvedHunkChoice === 'ours' ? oursLines : theirsLines;

  const handlePostComment = (line: number) => {
    if (!newCommentText.trim()) return;
    const suggestion = includeSuggestion
      ? '+       if claims.encoded_len() > 65_536 { return Err(AuthError::PayloadTooLarge); }'
      : undefined;

    onAddComment(line, newCommentText.trim(), suggestion);
    setNewCommentText('');
    setIncludeSuggestion(false);
    setActiveCommentLine(null);
    addToast({
      type: 'success',
      title: 'Review Note Broadcast',
      description: `Thread synchronized to SpacetimeDB table 'review_threads'`,
    });
  };

  const handleApplySuggestion = (comment: ReviewComment) => {
    addToast({
      type: 'success',
      title: 'Suggestion Applied',
      description: `Wrote hunk patch directly into working branch: ${comment.suggestion}`,
    });
    onResolveComment(comment.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#07090e]">
      {/* PrHeaderBar: Displays PR metadata, target/source branches, approval statuses, Graphify Risk Rating */}
      <div className="border-b border-[#21262d] bg-[#0d1117] px-4 py-2 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 shrink-0 text-xs select-none">
        {/* Left: PR Selector & Graphify Risk Rating */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 shrink-0">
            <GitPullRequest size={15} className="text-[#3fb950] shrink-0" />
            <select
              value={selectedPr.id}
              onChange={(e) => {
                const found = pullRequests.find((p) => p.id === e.target.value);
                if (found) onSelectPr(found);
              }}
              className="h-8 bg-[#161b22] border border-[#30363d] rounded-md px-2.5 text-xs text-[#f0f6fc] font-medium focus:outline-none focus:border-[#388bfd] transition-colors cursor-pointer max-w-[260px] md:max-w-xs lg:max-w-sm truncate"
            >
              {pullRequests.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  #{pr.number}: {pr.title}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-[#30363d]/60 bg-[#161b22]/70 font-mono text-[11px] text-[#8b949e] shrink-0 whitespace-nowrap">
            <span className="text-[#58a6ff] font-semibold">{selectedPr.sourceBranch}</span>
            <span className="text-[#8b949e]">→</span>
            <span className="text-[#3fb950] font-semibold">{selectedPr.targetBranch}</span>
          </div>

          {/* Graphify Risk Rating Badge: Single-line, high-contrast, non-wrapping chip */}
          <div className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-[#30363d] bg-[#161b22] font-mono text-[11px] shrink-0 whitespace-nowrap select-none shadow-xs">
            <div className="flex items-center gap-1.5">
              <Flame
                size={13}
                className={
                  selectedPr.blastRadius === 'high'
                    ? 'text-[#f85149]'
                    : selectedPr.blastRadius === 'med'
                    ? 'text-[#d29922]'
                    : 'text-[#3fb950]'
                }
              />
              <span className="text-[#8b949e] font-sans">Graphify Risk:</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums tracking-wide flex items-center gap-1 ${
                selectedPr.blastRadius === 'high'
                  ? 'bg-[#da3633]/15 text-[#f85149] border border-[#da3633]/30'
                  : selectedPr.blastRadius === 'med'
                  ? 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
                  : 'bg-[#238636]/15 text-[#3fb950] border border-[#238636]/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  selectedPr.blastRadius === 'high'
                    ? 'bg-[#f85149] animate-pulse'
                    : selectedPr.blastRadius === 'med'
                    ? 'bg-[#d29922]'
                    : 'bg-[#3fb950]'
                }`}
              />
              {selectedPr.blastRadius.toUpperCase()} (
              {selectedPr.blastRadius === 'high'
                ? '78%'
                : selectedPr.blastRadius === 'med'
                ? '42%'
                : '18%'}
              )
            </span>
          </div>
        </div>

        {/* Center: Diff View Mode Toggle Segmented Control */}
        <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d] p-0.5 rounded-lg shrink-0">
          <button
            onClick={() => setDiffMode('3way')}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              diffMode === '3way'
                ? 'bg-[#21262d] text-[#f0f6fc] shadow-xs border border-[#30363d]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent hover:bg-[#21262d]/40'
            }`}
          >
            <GitMerge size={12} className={diffMode === '3way' ? 'text-[#58a6ff]' : ''} />
            <span>3-Way Merge Tool</span>
          </button>
          <button
            onClick={() => setDiffMode('split')}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              diffMode === 'split'
                ? 'bg-[#21262d] text-[#f0f6fc] shadow-xs border border-[#30363d]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] border border-transparent hover:bg-[#21262d]/40'
            }`}
          >
            <Columns size={12} className={diffMode === 'split' ? 'text-[#58a6ff]' : ''} />
            <span>Side-by-Side</span>
          </button>
        </div>

        {/* Right: Merge PR Action & Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#3fb950] bg-[#238636]/10 border border-[#238636]/30 px-2 py-1 rounded">
            <span>2 Approvals</span>
            <span>✓</span>
          </div>
          <Button
            size="sm"
            variant="primary"
            icon={<GitMerge size={13} />}
            onClick={() => {
              addToast({
                type: 'success',
                title: `PR #${selectedPr.number} Merged`,
                description: `Fast-forwarded refs/gitbutler/${selectedPr.sourceBranch} into main`,
              });
            }}
          >
            Merge Pull Request
          </Button>
        </div>
      </div>

      {/* Live typing indicator strip */}
      <div className="px-4 py-1.5 bg-[#161b22]/50 border-b border-[#21262d] flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
        <div className="flex items-center gap-2 text-[#58a6ff]">
          <FileCode size={13} />
          <span>crates/auth/src/token.rs</span>
          <span className="text-[#8b949e]">(+18 -12 lines)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
          <span>Elena Rostova is typing a review comment on line 44...</span>
        </div>
      </div>

      {/* Monaco Multiplayer Diff Editor Container */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#07090e]">
        {/* Split or 3-Way Diff Panels */}
        <div className="flex-1 overflow-y-auto font-mono text-xs">
          {diffMode === '3way' ? (
            /* 3-Way Merge Tool Layout with Interactive Result Pane */
            <div className="flex flex-col h-full divide-y divide-[#21262d]">
              {/* Top 3-Pane Row: Base / Ours / Theirs */}
              <div className="grid grid-cols-3 divide-x divide-[#21262d] min-h-[320px] max-h-[50%] overflow-y-auto">
                {/* Col 1: Base */}
                <div className="p-3 bg-[#07090e]">
                  <div className="pb-2 mb-2 border-b border-[#21262d] text-[#8b949e] text-[11px] font-semibold flex items-center justify-between">
                    <span>BASE (Ancestor a89c4d2)</span>
                  </div>
                  <div className="space-y-1">
                    {baseLines.map((line, idx) => (
                      <div key={idx} className="flex gap-2 text-[#8b949e]">
                        <span className="w-6 text-right text-[#484f58] select-none text-[10px]">
                          {idx + 1}
                        </span>
                        <pre className="truncate">{line}</pre>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 2: Ours (Virtual Branch) */}
                <div className="p-3 bg-[#0d1117]">
                  <div className="pb-2 mb-2 border-b border-[#21262d] text-[#3fb950] text-[11px] font-semibold flex items-center justify-between">
                    <span>OURS (feat-auth-wasm)</span>
                    <button
                      onClick={() => {
                        setResolvedHunkChoice('ours');
                        addToast({
                          type: 'info',
                          title: 'Resolution: Picked Ours',
                          description: 'Updated Result preview pane with Wasm validation routine',
                        });
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                        resolvedHunkChoice === 'ours'
                          ? 'bg-[#238636] text-white border-[#2ea043]'
                          : 'bg-[#161b22] text-[#3fb950] border-[#30363d] hover:bg-[#238636]/20'
                      }`}
                    >
                      {resolvedHunkChoice === 'ours' ? '✓ Accepted' : 'Pick Ours'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {oursLines.map((line, idx) => {
                      const isDiff = idx >= 13 && idx <= 20;
                      return (
                        <div
                          key={idx}
                          className={`flex gap-2 ${
                            isDiff ? 'bg-[#238636]/15 text-[#3fb950]' : 'text-[#f0f6fc]'
                          }`}
                        >
                          <span className="w-6 text-right text-[#484f58] select-none text-[10px]">
                            {idx + 1}
                          </span>
                          <pre className="truncate">{line}</pre>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Col 3: Theirs (fix-cache-lock) */}
                <div className="p-3 bg-[#07090e]">
                  <div className="pb-2 mb-2 border-b border-[#21262d] text-[#58a6ff] text-[11px] font-semibold flex items-center justify-between">
                    <span>THEIRS (fix-cache-lock)</span>
                    <button
                      onClick={() => {
                        setResolvedHunkChoice('theirs');
                        addToast({
                          type: 'info',
                          title: 'Resolution: Picked Theirs',
                          description: 'Updated Result preview pane with Non-blocking LRU fast path',
                        });
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                        resolvedHunkChoice === 'theirs'
                          ? 'bg-[#388bfd] text-white border-[#388bfd]'
                          : 'bg-[#161b22] text-[#58a6ff] border-[#30363d] hover:bg-[#388bfd]/20'
                      }`}
                    >
                      {resolvedHunkChoice === 'theirs' ? '✓ Accepted' : 'Pick Theirs'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {theirsLines.map((line, idx) => {
                      const isDiff = idx >= 13 && idx <= 17;
                      return (
                        <div
                          key={idx}
                          className={`flex gap-2 ${
                            isDiff ? 'bg-[#388bfd]/15 text-[#58a6ff]' : 'text-[#f0f6fc]'
                          }`}
                        >
                          <span className="w-6 text-right text-[#484f58] select-none text-[10px]">
                            {idx + 1}
                          </span>
                          <pre className="truncate">{line}</pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Interactive RESULT Pane */}
              <div className="flex-1 p-3 bg-[#161b22]/50 overflow-y-auto">
                <div className="pb-2 mb-2 border-b border-[#21262d] text-[#f0f6fc] text-[11px] font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#3fb950]" />
                    <span>MERGED RESULT PREVIEW</span>
                    <span className="text-[10px] text-[#8b949e]">
                      (Resolved using {resolvedHunkChoice.toUpperCase()})
                    </span>
                  </div>
                  <span className="text-[10px] text-[#3fb950] font-mono">No remaining conflicts</span>
                </div>

                <div className="space-y-1">
                  {resultLines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 text-[#f0f6fc]">
                      <span className="w-6 text-right text-[#484f58] select-none text-[10px]">
                        {idx + 1}
                      </span>
                      <pre className="truncate">{line}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Side-by-Side Unified Monaco View with Multiplayer Gutters & Inline Threads */
            <div className="divide-y divide-[#21262d]/40">
              {oursLines.map((line, idx) => {
                const lineNum = idx + 1;
                const isChanged = lineNum >= 14 && lineNum <= 22;
                const presenceOnLine = teammates.filter((t) => t.activeLine === lineNum);
                const commentsOnLine = reviewComments.filter((c) => c.line === lineNum);
                const isHighlight = highlightLine === lineNum;

                return (
                  <div key={lineNum} className="group flex flex-col">
                    <div
                      className={`flex items-start hover:bg-[#161b22]/80 transition-colors ${
                        isHighlight
                          ? 'bg-[#388bfd]/25 border-l-2 border-[#388bfd]'
                          : isChanged
                          ? 'bg-[#238636]/10 text-[#3fb950]'
                          : 'text-[#f0f6fc]'
                      }`}
                    >
                      {/* Line Number & Multiplayer Presence Gutter */}
                      <div
                        onClick={() =>
                          setActiveCommentLine(activeCommentLine === lineNum ? null : lineNum)
                        }
                        className="w-14 shrink-0 px-2 py-0.5 text-right text-[#484f58] group-hover:text-[#8b949e] select-none text-[11px] font-mono cursor-pointer relative flex items-center justify-end gap-1.5"
                      >
                        {/* Teammate cursor avatar pip */}
                        {presenceOnLine.map((t) => (
                          <span
                            key={t.id}
                            title={`${t.name} active here`}
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                        ))}
                        <span>{lineNum}</span>
                      </div>

                      {/* Gutter Add Thread Affordance */}
                      <button
                        onClick={() =>
                          setActiveCommentLine(activeCommentLine === lineNum ? null : lineNum)
                        }
                        title="Click to start SpacetimeDB review thread"
                        className="opacity-0 group-hover:opacity-100 text-[#8b949e] hover:text-[#58a6ff] px-1.5 py-0.5 text-[10px]"
                      >
                        +
                      </button>

                      {/* Code Line Content */}
                      <div className="flex-1 py-0.5 px-2 overflow-x-auto">
                        <pre>{line}</pre>
                      </div>
                    </div>

                    {/* Existing Review Comments on this line */}
                    {commentsOnLine.map((comment) => (
                      <div
                        key={comment.id}
                        className="ml-14 my-1.5 mr-6 p-3 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2 text-xs shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={comment.avatar}
                              alt={comment.author}
                              className="w-5 h-5 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="font-semibold text-[#f0f6fc]">{comment.author}</span>
                            <span className="text-[10px] text-[#8b949e] font-mono">
                              {comment.timestamp}
                            </span>
                          </div>
                          {comment.resolved ? (
                            <Badge variant="success" subtleBox>
                              Resolved
                            </Badge>
                          ) : (
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={<Check size={12} />}
                              onClick={() => onResolveComment(comment.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>

                        <p className="text-[#f0f6fc] leading-relaxed">{comment.text}</p>

                        {/* Code Suggestion Box */}
                        {comment.suggestion && (
                          <div className="rounded bg-[#07090e] border border-[#21262d] p-2 space-y-1.5">
                            <div className="text-[10px] text-[#8b949e] font-mono flex items-center justify-between">
                              <span>Suggested Code Change:</span>
                              {!comment.resolved && (
                                <button
                                  onClick={() => handleApplySuggestion(comment)}
                                  className="text-[#3fb950] hover:underline flex items-center gap-1 text-[11px]"
                                >
                                  <Sparkles size={11} />
                                  Apply Suggestion
                                </button>
                              )}
                            </div>
                            <pre className="text-[11px] font-mono text-[#3fb950]">
                              <code>{comment.suggestion}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* New Comment Thread Input Bubble */}
                    {activeCommentLine === lineNum && (
                      <div className="ml-14 my-2 mr-6 p-3 rounded-lg bg-[#161b22] border border-[#388bfd]/60 space-y-2.5 shadow-xl">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#f0f6fc]">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare size={13} className="text-[#388bfd]" />
                            Start Thread on Line {lineNum}
                          </span>
                          <button
                            onClick={() => setActiveCommentLine(null)}
                            className="text-[#8b949e] hover:text-[#f0f6fc] text-xs"
                          >
                            Cancel
                          </button>
                        </div>

                        <textarea
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Leave feedback or suggestion..."
                          rows={2}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#388bfd]"
                        />

                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-1.5 text-xs text-[#8b949e] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={includeSuggestion}
                              onChange={(e) => setIncludeSuggestion(e.target.checked)}
                              className="rounded border-[#30363d] bg-[#0d1117] text-[#388bfd]"
                            />
                            <span>Attach Code Suggestion</span>
                          </label>

                          <Button
                            size="xs"
                            variant="primary"
                            icon={<Send size={11} />}
                            onClick={() => handlePostComment(lineNum)}
                          >
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
