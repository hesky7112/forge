import React, { useState, useEffect } from 'react';
import {
  WorkspaceMode,
  Repository,
  VirtualBranch,
  DiffHunk,
  TeammatePresence,
  ReviewComment,
  PullRequest,
  CiJob,
  ActivityEvent,
  ChatMessage,
  SeaweedBucket,
  SeaweedObject,
} from './types';
import {
  INITIAL_REPOSITORIES,
  INITIAL_BRANCHES,
  INITIAL_HUNKS,
  GRAPH_NODES,
  GRAPH_EDGES,
  TEAMMATE_PRESENCE,
  INITIAL_DIFF_THREADS,
  PULL_REQUESTS,
  CI_JOBS,
  LIVE_ACTIVITY,
  CHAT_MESSAGES,
  POCKETBASE_SCHEMAS,
  SEAWEED_BUCKETS,
  SEAWEED_OBJECTS,
  SEAWEED_TELEMETRY,
  MEETING_ROOMS,
  INITIAL_MEETING_PARTICIPANTS,
  INITIAL_IN_MEETING_CHATS,
} from './lib/mockData';
import { seaweedClient } from './lib/api';
import { ToastProvider, useToast } from './components/common/Toast';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Modal } from './components/common/Modal';
import { Button } from './components/common/Button';
import { IconRail } from './components/layout/IconRail';
import { TopBar } from './components/layout/TopBar';
import { BottomDock } from './components/layout/BottomDock';
import { RightDock } from './components/layout/RightDock';
import { CommandPalette } from './components/layout/CommandPalette';
import { SettingsModal } from './components/layout/SettingsModal';
import { BackendStatusModal } from './components/layout/BackendStatusModal';
import { HuddleFloatingMiniPlayer } from './components/layout/HuddleFloatingMiniPlayer';

import { VirtualBranchView } from './components/views/VirtualBranchView';
import { KnowledgeGraphView } from './components/views/KnowledgeGraphView';
import { MultiplayerDiffView } from './components/views/MultiplayerDiffView';
import { CiLogViewerView } from './components/views/CiLogViewerView';
import { SeaweedStorageView } from './components/views/SeaweedStorageView';
import { CollectionsView } from './components/views/CollectionsView';
import { MeetingRoomView } from './components/views/MeetingRoomView';

function Workspace() {
  const { addToast } = useToast();
  const { toggleTheme } = useTheme();

  const [activeMode, setActiveMode] = useState<WorkspaceMode>('branches');
  const [repositories] = useState<Repository[]>(INITIAL_REPOSITORIES);
  const [currentRepo, setCurrentRepo] = useState<Repository>(INITIAL_REPOSITORIES[0]);
  const [virtualBranches, setVirtualBranches] = useState<VirtualBranch[]>(INITIAL_BRANCHES);
  const [hunks, setHunks] = useState<DiffHunk[]>(INITIAL_HUNKS);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [teammates] = useState<TeammatePresence[]>(TEAMMATE_PRESENCE);
  const [activity, setActivity] = useState<ActivityEvent[]>(LIVE_ACTIVITY);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>(PULL_REQUESTS);
  const [selectedPr, setSelectedPr] = useState<PullRequest>(PULL_REQUESTS[0]);
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>(INITIAL_DIFF_THREADS);
  const [ciJobs] = useState<CiJob[]>(CI_JOBS);

  // SeaweedFS storage state
  const [seaweedBuckets, setSeaweedBuckets] = useState<SeaweedBucket[]>(SEAWEED_BUCKETS);
  const [seaweedObjects, setSeaweedObjects] = useState<SeaweedObject[]>(SEAWEED_OBJECTS);

  // Cross-view state & modals
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [isRightDockOpen, setIsRightDockOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState<boolean>(false);
  const [isBackendStatusOpen, setIsBackendStatusOpen] = useState<boolean>(false);

  // Live Video Meetings & Huddle State (Zoom / Google Meet / Slack)
  const [meetingRooms] = useState(MEETING_ROOMS);
  const [meetingParticipants, setMeetingParticipants] = useState(INITIAL_MEETING_PARTICIPANTS);
  const [meetingChats, setMeetingChats] = useState(INITIAL_IN_MEETING_CHATS);
  const [isHuddleActive, setIsHuddleActive] = useState<boolean>(true);
  const [isLocalHuddleAudioOn, setIsLocalHuddleAudioOn] = useState<boolean>(true);
  const [isLocalHuddleVideoOn, setIsLocalHuddleVideoOn] = useState<boolean>(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsRightDockOpen((prev) => !prev);
      } else if (!isInput && e.key === '?') {
        setIsShortcutsHelpOpen((prev) => !prev);
      } else if (!isInput && e.key === '1') {
        setActiveMode('branches');
      } else if (!isInput && e.key === '2') {
        setActiveMode('graph');
      } else if (!isInput && e.key === '3') {
        setActiveMode('diffs');
      } else if (!isInput && e.key === '4') {
        setActiveMode('ci');
      } else if (!isInput && e.key === '5') {
        setActiveMode('storage');
      } else if (!isInput && e.key === '6') {
        setActiveMode('collections');
      } else if (!isInput && e.key === '7') {
        setActiveMode('meet');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hunk assignment handler (Mode A)
  const handleAssignHunk = (hunkId: string, branchId: string | null) => {
    setHunks((prev) =>
      prev.map((h) => (h.id === hunkId ? { ...h, assignedBranchId: branchId } : h))
    );

    setVirtualBranches((prev) =>
      prev.map((b) => {
        if (b.id === branchId) {
          return {
            ...b,
            hunkIds: b.hunkIds.includes(hunkId) ? b.hunkIds : [...b.hunkIds, hunkId],
          };
        } else {
          return {
            ...b,
            hunkIds: b.hunkIds.filter((id) => id !== hunkId),
          };
        }
      })
    );

    const targetBranch = virtualBranches.find((b) => b.id === branchId);
    addToast({
      type: 'info',
      title: branchId ? `Hunk Staged to ${targetBranch?.name}` : 'Hunk Returned to Unassigned',
      description: 'Working copy virtual tree updated without git stash',
    });
  };

  // Branch creation
  const handleCreateBranch = (name: string, description: string) => {
    const newBranch: VirtualBranch = {
      id: `vb-${Date.now()}`,
      ref: `refs/gitbutler/${name}`,
      name,
      description,
      baseCommit: 'origin/main (7c81d2f)',
      upstreamBranch: `origin/${name}`,
      author: 'Austin Vance',
      updatedAt: 'Just now',
      status: 'active',
      hunkIds: [],
      blastRadius: 'low',
      blastScore: 12,
    };
    setVirtualBranches((prev) => [...prev, newBranch]);
    addToast({
      type: 'success',
      title: `Virtual Branch '${name}' Created`,
      description: 'Ready to receive hunk drag & drop assignments',
    });
  };

  // Branch push via SSH
  const handlePushBranch = (branchId: string) => {
    const branch = virtualBranches.find((b) => b.id === branchId);
    if (!branch) return;

    setVirtualBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, status: 'pushed' } : b))
    );

    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        user: 'Austin Vance',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        action: 'pushed ref to upstream SSH',
        target: branch.name,
        time: 'Just now',
        type: 'push',
      },
      ...prev,
    ]);

    addToast({
      type: 'success',
      title: 'Pushed via russh Gateway',
      description: `Dispatched git-receive-pack for ${branch.ref} over ed25519 tunnel`,
    });
  };

  // Branch commit
  const handleCommitBranch = (branchId: string, message: string) => {
    const branch = virtualBranches.find((b) => b.id === branchId);
    if (!branch) return;

    setVirtualBranches((prev) =>
      prev.map((b) =>
        b.id === branchId ? { ...b, hunkIds: [], status: 'ready', updatedAt: 'Just now' } : b
      )
    );

    setHunks((prev) => prev.filter((h) => !branch.hunkIds.includes(h.id)));

    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        user: 'Austin Vance',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        action: 'committed hunks',
        target: branch.name,
        time: 'Just now',
        type: 'commit',
      },
      ...prev,
    ]);

    addToast({
      type: 'success',
      title: `Committed to ${branch.name}`,
      description: `"${message}"`,
    });
  };

  // Review comment handlers (Mode C)
  const handleAddComment = (line: number, text: string, suggestion?: string) => {
    const newComment: ReviewComment = {
      id: `comm-${Date.now()}`,
      line,
      author: 'Austin Vance',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
      color: '#58a6ff',
      timestamp: 'Just now',
      text,
      suggestion,
      resolved: false,
    };
    setReviewComments((prev) => [...prev, newComment]);

    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        user: 'Austin Vance',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        action: `added review thread on line ${line}`,
        target: 'token.rs',
        time: 'Just now',
        type: 'review',
      },
      ...prev,
    ]);

    addToast({
      type: 'info',
      title: 'Review Note Dispatched',
      description: 'Broadcasted to SpacetimeDB WebSocket room in <50ms',
    });
  };

  const handleResolveComment = (id: string) => {
    setReviewComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
    addToast({
      type: 'success',
      title: 'Comment Status Toggled',
      description: 'Thread resolution state synced to peers',
    });
  };

  // Chat message send (Right Dock)
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      user: 'Austin Vance',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  // Jump to source line
  const handleJumpToLine = (file: string, line: number) => {
    setHighlightLine(line);
    setActiveMode('diffs');
    addToast({
      type: 'info',
      title: 'Navigating to Symbol Definition',
      description: `Opening ${file} at line ${line}`,
    });
  };

  // SeaweedFS storage handlers
  const handleUploadObject = (bucket: string, name: string, size: number, type: string) => {
    const newObj: SeaweedObject = {
      key: name,
      name: name.split('/').pop() || name,
      bucket,
      sizeBytes: size,
      sizeFormatted: (size / 1024).toFixed(1) + ' KB',
      contentType: type,
      lastModified: 'Just now',
      etag: `"${Math.random().toString(36).substring(2, 10)}"`,
      storageClass: 'STANDARD',
      presignedUrl: seaweedClient.generatePresignedUrl(bucket, name, 3600),
    };
    setSeaweedObjects((prev) => [newObj, ...prev]);
    setSeaweedBuckets((prev) =>
      prev.map((b) =>
        b.name === bucket
          ? { ...b, objectsCount: b.objectsCount + 1, totalSizeBytes: b.totalSizeBytes + size }
          : b
      )
    );
  };

  const handleDeleteObject = (key: string) => {
    setSeaweedObjects((prev) => prev.filter((o) => o.key !== key));
    addToast({
      type: 'info',
      title: 'Object Purged from SeaweedFS',
      description: `Volume chunk released for key '${key}'`,
    });
  };

  const handleCreateBucket = (name: string, description: string, replication: string) => {
    const newBucket: SeaweedBucket = {
      name,
      description,
      objectsCount: 0,
      totalSizeBytes: 0,
      createdAt: new Date().toISOString().split('T')[0],
      replication,
    };
    setSeaweedBuckets((prev) => [...prev, newBucket]);
  };

  // Initial collection records
  const initialCollectionData = {
    'col-branches': virtualBranches.map((b) => ({
      id: b.id,
      name: b.name,
      ref: b.ref,
      status: b.status,
      hunksCount: b.hunkIds.length,
      blastScore: b.blastScore,
      created: '2026-09-29 02:10:00',
      updated: '2026-09-29 07:15:00',
    })),
    'col-prs': pullRequests.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      author: pr.author,
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch,
      status: pr.status,
      created: pr.createdAt,
      updated: '2026-09-29 07:20:00',
    })),
    'col-ci': ciJobs.map((j) => ({
      id: j.id,
      workflowName: j.workflowName,
      branch: j.branch,
      status: j.status,
      duration: j.duration,
      startedAt: j.startedAt,
      created: '2026-09-29 07:22:00',
      updated: '2026-09-29 07:25:00',
    })),
  };

  const unassignedHunks = hunks.filter((h) => h.assignedBranchId === null);
  const hasConflict = virtualBranches.some(
    (b) => b.astConflictsWith && b.astConflictsWith.length > 0
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#000000] text-[#f0f6fc] font-sans">
      {/* 1. Spotify Top Navigation Header (56px) */}
      <TopBar
        repositories={repositories}
        currentRepo={currentRepo}
        onSelectRepo={setCurrentRepo}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        isOnline={isOnline}
        onToggleOnline={() => {
          setIsOnline(!isOnline);
          addToast({
            type: isOnline ? 'warning' : 'success',
            title: isOnline ? 'SpacetimeDB Disconnected' : 'SpacetimeDB Connected',
            description: isOnline
              ? 'Running in offline cached mode'
              : 'Reconnected to wss://spacetimedb.forge.internal/v1 (4ms ping)',
          });
        }}
        teammates={teammates}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isRightDockOpen={isRightDockOpen}
        onToggleRightDock={() => setIsRightDockOpen(!isRightDockOpen)}
        onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
        onOpenBackendStatus={() => setIsBackendStatusOpen(true)}
        activeBranchName={virtualBranches[0]?.name}
        unassignedHunksCount={unassignedHunks.length}
        hasConflict={hasConflict}
        onInspectConflict={() => {
          setActiveMode('branches');
          addToast({
            type: 'warning',
            title: 'Inspecting AST Overlap',
            description: 'Conflict in TokenStore::validate between feat-auth-wasm and fix-cache-lock',
          });
        }}
      />

      {/* 2. Floating Spotify Panels Layout Grid (px-2 pb-2 gap-2) */}
      <div className="flex-1 flex min-h-0 px-2 pb-2 gap-2 overflow-hidden">
        {/* Left Icon Rail Navigation Card */}
        <IconRail
          activeMode={activeMode}
          onSelectMode={setActiveMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenBackendStatus={() => setIsBackendStatusOpen(true)}
          isOnline={isOnline}
          unassignedHunksCount={unassignedHunks.length}
        />

        {/* Main Stage Viewport Card (Spotify-Style Rounded Shell with Ambient Mood Glow) */}
        <main className="flex-1 h-full min-w-0 bg-[#0d1117] rounded-xl border border-[#21262d] overflow-hidden flex flex-col shadow-2xl relative">
          {/* Subtle Spotify Ambient Mood Glow Header */}
          <div
            className={`absolute top-0 left-0 right-0 h-44 pointer-events-none z-0 transition-opacity duration-500 opacity-60 ${
              activeMode === 'branches'
                ? 'bg-gradient-to-b from-[#16273e]/50 via-transparent to-transparent'
                : activeMode === 'graph'
                ? 'bg-gradient-to-b from-[#25183e]/50 via-transparent to-transparent'
                : activeMode === 'diffs'
                ? 'bg-gradient-to-b from-[#381a24]/50 via-transparent to-transparent'
                : activeMode === 'ci'
                ? 'bg-gradient-to-b from-[#133124]/50 via-transparent to-transparent'
                : activeMode === 'storage'
                ? 'bg-gradient-to-b from-[#0f342d]/50 via-transparent to-transparent'
                : activeMode === 'meet'
                ? 'bg-gradient-to-b from-[#241a45]/50 via-transparent to-transparent'
                : 'bg-gradient-to-b from-[#16273e]/50 via-transparent to-transparent'
            }`}
          />

          {/* View Container */}
          <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeMode === 'branches' && (
              <VirtualBranchView
                branches={virtualBranches}
                hunks={hunks}
                onAssignHunk={handleAssignHunk}
                onCreateBranch={handleCreateBranch}
                onPushBranch={handlePushBranch}
                onCommitBranch={handleCommitBranch}
              />
            )}

            {activeMode === 'graph' && (
              <KnowledgeGraphView
                nodes={GRAPH_NODES}
                edges={GRAPH_EDGES}
                onNavigateToSource={handleJumpToLine}
              />
            )}

            {activeMode === 'diffs' && (
              <MultiplayerDiffView
                pullRequests={pullRequests}
                selectedPr={selectedPr}
                onSelectPr={setSelectedPr}
                reviewComments={reviewComments}
                onAddComment={handleAddComment}
                onResolveComment={handleResolveComment}
                teammates={teammates}
                highlightLine={highlightLine}
              />
            )}

            {activeMode === 'ci' && <CiLogViewerView ciJobs={ciJobs} />}

            {activeMode === 'storage' && (
              <SeaweedStorageView
                buckets={seaweedBuckets}
                objects={seaweedObjects}
                telemetry={SEAWEED_TELEMETRY}
                onUploadObject={handleUploadObject}
                onDeleteObject={handleDeleteObject}
                onCreateBucket={handleCreateBucket}
              />
            )}

            {activeMode === 'collections' && (
              <CollectionsView
                schemas={POCKETBASE_SCHEMAS}
                initialData={initialCollectionData}
              />
            )}

            {activeMode === 'meet' && (
              <MeetingRoomView
                rooms={meetingRooms}
                initialParticipants={meetingParticipants}
                initialChats={meetingChats}
                onLeaveCall={() => {
                  setIsHuddleActive(false);
                  setActiveMode('branches');
                  addToast({
                    type: 'info',
                    title: 'Disconnected from Huddle',
                    description: 'Call ended for your session',
                  });
                }}
                onNavigateToBranch={(branchName) => {
                  setActiveMode('branches');
                }}
              />
            )}
          </div>
        </main>

        {/* Collapsible Right Dock (SpacetimeDB Stream, Line Presence, Chat) */}
        <RightDock
          isOpen={isRightDockOpen}
          activity={activity}
          teammates={teammates}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          onJumpToLine={handleJumpToLine}
        />
      </div>

      {/* Floating Slack-Style Huddle Mini Player (PiP) when in another view during call */}
      {isHuddleActive && activeMode !== 'meet' && (
        <HuddleFloatingMiniPlayer
          room={meetingRooms[0]}
          activeSpeaker={meetingParticipants[1]}
          isAudioOn={isLocalHuddleAudioOn}
          isVideoOn={isLocalHuddleVideoOn}
          onToggleAudio={() => setIsLocalHuddleAudioOn(!isLocalHuddleAudioOn)}
          onToggleVideo={() => setIsLocalHuddleVideoOn(!isLocalHuddleVideoOn)}
          onExpandCall={() => setActiveMode('meet')}
          onLeaveCall={() => {
            setIsHuddleActive(false);
            addToast({
              type: 'info',
              title: 'Left Huddle',
              description: 'Call ended for your session',
            });
          }}
          participantsCount={meetingParticipants.length}
        />
      )}

      {/* 3. Spotify Bottom Telemetry & Transport Player Bar */}
      <BottomDock
        activeBranch={virtualBranches[0]}
        unassignedHunksCount={unassignedHunks.length}
        hasConflict={hasConflict}
        onCommitBranch={handleCommitBranch}
        onPushBranch={handlePushBranch}
        onOpenBackendStatus={() => setIsBackendStatusOpen(true)}
        onSelectMode={setActiveMode}
        isOnline={isOnline}
        teammatesCount={teammates.length}
      />

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectMode={setActiveMode}
        onSelectBranch={(branchId) => {
          setActiveMode('branches');
        }}
      />

      {/* Settings Dialog */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Backend Architecture & Status Dialog */}
      <BackendStatusModal
        isOpen={isBackendStatusOpen}
        onClose={() => setIsBackendStatusOpen(false)}
      />

      {/* Keyboard Shortcuts Help Dialog (?) */}
      <Modal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
        title="Forge Studio Keyboard Shortcuts"
        description="Keyboard-first navigation and developer workflow commands"
        maxWidth="md"
        footer={
          <Button variant="ghost" onClick={() => setIsShortcutsHelpOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3 font-mono text-xs">
          <div className="divide-y divide-[#21262d]">
            <div className="py-2 flex justify-between items-center">
              <span className="text-[#f0f6fc]">Global Command Palette</span>
              <kbd className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-[#58a6ff]">
                ⌘K / Ctrl+K
              </kbd>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-[#f0f6fc]">Toggle Right Activity Dock</span>
              <kbd className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-[#58a6ff]">
                ⌘B / Ctrl+B
              </kbd>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-[#f0f6fc]">View 1: Virtual Branches</span>
              <kbd className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-[#8b949e]">
                1
              </kbd>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-[#f0f6fc]">View 2: Code Knowledge Graph</span>
              <kbd className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-[#8b949e]">
                2
              </kbd>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-[#f0f6fc]">View 3: PRs & Multiplayer Diffs</span>
              <kbd className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-[#8b949e]">
                3
              </kbd>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-[#f0f6fc]">View 4: CI/CD Terminal Streamer</span>
              <kbd className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-[#8b949e]">
                4
              </kbd>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-[#f0f6fc]">View 5: SeaweedFS S3 Storage</span>
              <kbd className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-[#8b949e]">
                5
              </kbd>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-[#f0f6fc]">View 6: PocketBase Collections</span>
              <kbd className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-[#8b949e]">
                6
              </kbd>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-[#f0f6fc]">View 7: Zoom & Meet Live Video Huddle</span>
              <kbd className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-[#8b949e]">
                7
              </kbd>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-[#f0f6fc]">Show this shortcuts cheatsheet</span>
              <kbd className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-[#8b949e]">
                ?
              </kbd>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Workspace />
      </ToastProvider>
    </ThemeProvider>
  );
}
