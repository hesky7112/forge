import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Hand,
  Smile,
  Share2,
  Maximize2,
  Minimize2,
  Pin,
  Sparkles,
  Volume2,
  VolumeX,
  MessageSquare,
  Users,
  Edit3,
  PenTool,
  Check,
  Copy,
  Radio,
  Plus,
  Play,
  Pause,
  Circle,
  MoreVertical,
  ChevronDown,
  LayoutGrid,
  Square,
  Send,
  Code,
  ShieldCheck,
  FileCode,
  Flame,
  Settings,
  Sliders,
  ZoomIn,
  ZoomOut,
  MousePointer,
  HelpCircle,
  BarChart2,
  Subtitles,
  Download,
  Lock,
  Unlock,
  AlertCircle,
  RefreshCw,
  Layers,
  FileText,
  StickyNote,
} from 'lucide-react';
import {
  MeetingParticipant,
  MeetingRoom,
  InMeetingChatMessage,
  MeetingPoll,
  MeetingCaption,
  AudioVideoSettings,
} from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { useToast } from '../common/Toast';
import { INITIAL_MEETING_POLLS, INITIAL_MEETING_CAPTIONS } from '../../lib/mockData';

interface MeetingRoomViewProps {
  rooms: MeetingRoom[];
  initialParticipants: MeetingParticipant[];
  initialChats: InMeetingChatMessage[];
  onLeaveCall?: () => void;
  onNavigateToBranch?: (branch: string) => void;
}

export const MeetingRoomView: React.FC<MeetingRoomViewProps> = ({
  rooms,
  initialParticipants,
  initialChats,
  onLeaveCall,
  onNavigateToBranch,
}) => {
  const { addToast } = useToast();

  // Active room state
  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0].id);
  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  // Participants & in-meeting chat state
  const [participants, setParticipants] = useState<MeetingParticipant[]>(initialParticipants);
  const [chats, setChats] = useState<InMeetingChatMessage[]>(initialChats);
  const [polls, setPolls] = useState<MeetingPoll[]>(INITIAL_MEETING_POLLS);
  const [captions, setCaptions] = useState<MeetingCaption[]>(INITIAL_MEETING_CAPTIONS);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);

  // Chat inputs
  const [chatInput, setChatInput] = useState('');
  const [codeSnippetInput, setCodeSnippetInput] = useState('');
  const [showCodeSnippetBox, setShowCodeSnippetBox] = useState(false);

  // Local user stream controls (Google Meet / Zoom style)
  const [isLocalAudioOn, setIsLocalAudioOn] = useState(true);
  const [isLocalVideoOn, setIsLocalVideoOn] = useState(false);
  const [isLocalScreenSharing, setIsLocalScreenSharing] = useState(false);
  const [isLocalHandRaised, setIsLocalHandRaised] = useState(false);
  const [localAudioLevel, setLocalAudioLevel] = useState(55);

  // Screen share options
  const [screenShareSource, setScreenShareSource] = useState<'display' | 'code-trace' | 'knowledge-graph' | 'whiteboard'>('code-trace');
  const [isScreenAudioShared, setIsScreenAudioShared] = useState(true);
  const [screenZoomLevel, setScreenZoomLevel] = useState<100 | 125 | 150>(100);
  const screenShareVideoRef = useRef<HTMLVideoElement | null>(null);
  const [screenDisplayStream, setScreenDisplayStream] = useState<MediaStream | null>(null);

  // Layout mode: 'gallery' | 'speaker' | 'screenshare' | 'whiteboard'
  const [layoutMode, setLayoutMode] = useState<'gallery' | 'speaker' | 'screenshare' | 'whiteboard'>('screenshare');
  const [spotlightParticipantId, setSpotlightParticipantId] = useState<string>(initialParticipants[1].id);

  // Side Drawer tab: 'none' | 'chat' | 'people' | 'polls' | 'transcript' | 'notes'
  const [activeSideDrawer, setActiveSideDrawer] = useState<'none' | 'chat' | 'people' | 'polls' | 'transcript' | 'notes'>('chat');

  // Floating Reactions state
  const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Screen share live annotation drawing state (Slack Huddles)
  const [annotationTool, setAnnotationTool] = useState<'none' | 'pen' | 'laser' | 'highlighter'>('pen');
  const [annotationColor, setAnnotationColor] = useState('#388bfd');
  const annotationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);

  // Whiteboard sticky notes state
  const [whiteboardNotes, setWhiteboardNotes] = useState<{ id: string; x: number; y: number; text: string; color: string }[]>([
    { id: 'wn-1', x: 80, y: 60, text: 'Wasm Buffer: 64MB hard limit prevents OOM in V8 runtime', color: '#fef08a' },
    { id: 'wn-2', x: 380, y: 120, text: 'TokenStore::validate ast overlap with fix-cache-lock resolved via read guard drop', color: '#bbf7d0' },
  ]);

  // Audio / Video Device Settings state (Google Meet / Zoom)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);
  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [allowAttendeeScreenShare, setAllowAttendeeScreenShare] = useState(true);

  const [deviceSettings, setDeviceSettings] = useState<AudioVideoSettings>({
    microphoneId: 'default-mic',
    speakerId: 'default-speaker',
    cameraId: 'facetime-hd',
    noiseSuppression: true,
    virtualBackground: 'none',
  });

  // New Huddle & New Poll Modals
  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomTopic, setNewRoomTopic] = useState('');

  const [isNewPollModalOpen, setIsNewPollModalOpen] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  // Meeting notes scratchpad state
  const [meetingNotes, setMeetingNotes] = useState<string>(
    `# Huddle Action Items: feat-auth-wasm
- [x] Verified Wasm memory boundary at 64MB buffer limit
- [x] Identified TokenStore::validate AST overlap with fix-cache-lock
- [ ] Sarah Chen to push SeaweedFS artifact bucket credentials
- [ ] Austin Vance to trigger act runner CI matrix for release candidate`
  );

  // Local real WebRTC video stream reference
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Call timer simulation
  const [callDuration, setCallDuration] = useState(915); // seconds
  const [isRecording, setIsRecording] = useState(activeRoom.isRecording);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle Camera with real WebRTC getUserMedia support
  const handleToggleVideo = async () => {
    if (isLocalVideoOn) {
      if (mediaStream) {
        mediaStream.getVideoTracks().forEach((track) => track.stop());
        setMediaStream(null);
      }
      setIsLocalVideoOn(false);
      setParticipants((prev) =>
        prev.map((p) => (p.id === 'user-austin' ? { ...p, isVideoOn: false } : p))
      );
      addToast({ type: 'info', title: 'Camera Turned Off', description: 'Showing animated avatar' });
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setMediaStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setIsLocalVideoOn(true);
          setParticipants((prev) =>
            prev.map((p) => (p.id === 'user-austin' ? { ...p, isVideoOn: true } : p))
          );
          addToast({ type: 'success', title: 'Camera Connected', description: 'Live video stream broadcasted' });
        } else {
          throw new Error('No mediaDevices');
        }
      } catch (err) {
        // Fallback to simulated high-res video card
        setIsLocalVideoOn(true);
        setParticipants((prev) =>
          prev.map((p) => (p.id === 'user-austin' ? { ...p, isVideoOn: true } : p))
        );
        addToast({
          type: 'info',
          title: 'HD Video Mode Active',
          description: 'Streaming high-resolution collaborative portrait',
        });
      }
    }
  };

  // Toggle Mic
  const handleToggleAudio = () => {
    const nextState = !isLocalAudioOn;
    setIsLocalAudioOn(nextState);
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === 'user-austin' ? { ...p, isAudioOn: nextState, audioLevel: nextState ? 60 : 0 } : p
      )
    );
    addToast({
      type: nextState ? 'success' : 'warning',
      title: nextState ? 'Microphone Unmuted' : 'Microphone Muted',
      description: nextState ? 'Audio streaming active' : 'Sound input muted',
    });
  };

  // Native & Virtual Screen Share Handler
  const handleToggleScreenShare = async (sourceOverride?: 'display' | 'code-trace' | 'knowledge-graph' | 'whiteboard') => {
    if (isLocalScreenSharing && !sourceOverride) {
      if (screenDisplayStream) {
        screenDisplayStream.getTracks().forEach((t) => t.stop());
        setScreenDisplayStream(null);
      }
      setIsLocalScreenSharing(false);
      setLayoutMode('gallery');
      setParticipants((prev) =>
        prev.map((p) => (p.id === 'user-austin' ? { ...p, isScreenSharing: false } : p))
      );
      addToast({ type: 'info', title: 'Screen Share Ended', description: 'Returned to Gallery View' });
    } else {
      const targetSource = sourceOverride || screenShareSource;
      setScreenShareSource(targetSource);

      if (targetSource === 'display') {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            setScreenDisplayStream(stream);
            if (screenShareVideoRef.current) {
              screenShareVideoRef.current.srcObject = stream;
            }
            setIsLocalScreenSharing(true);
            setLayoutMode('screenshare');
            setSpotlightParticipantId('user-austin');
            stream.getVideoTracks()[0].onended = () => {
              setIsLocalScreenSharing(false);
              setLayoutMode('gallery');
            };
            addToast({ type: 'success', title: 'Screen Sharing Active', description: 'Displaying desktop screen' });
          } else {
            throw new Error('No getDisplayMedia');
          }
        } catch {
          // Fallback to app window sharing
          setScreenShareSource('code-trace');
          setIsLocalScreenSharing(true);
          setLayoutMode('screenshare');
          setSpotlightParticipantId('user-austin');
          addToast({
            type: 'success',
            title: 'Application Window Shared',
            description: 'Broadcasting code diff & AST graph to attendees',
          });
        }
      } else {
        setIsLocalScreenSharing(true);
        setLayoutMode(targetSource === 'whiteboard' ? 'whiteboard' : 'screenshare');
        setSpotlightParticipantId('user-austin');
        addToast({
          type: 'success',
          title: `Sharing: ${targetSource === 'whiteboard' ? 'Collaborative Whiteboard' : targetSource}`,
          description: 'Broadcasting interactive viewport to call',
        });
      }
    }
  };

  // Toggle Raise Hand
  const handleToggleHandRaise = () => {
    const next = !isLocalHandRaised;
    setIsLocalHandRaised(next);
    setParticipants((prev) =>
      prev.map((p) => (p.id === 'user-austin' ? { ...p, isHandRaised: next } : p))
    );
    addToast({
      type: 'info',
      title: next ? 'Hand Raised' : 'Hand Lowered',
      description: next ? 'Speakers notified you have a question' : 'Hand indicator cleared',
    });
  };

  // Trigger Reaction Emoji Burst
  const triggerReaction = (emoji: string) => {
    const id = `react-${Date.now()}-${Math.random()}`;
    const x = Math.floor(Math.random() * 60) + 20;
    setReactions((prev) => [...prev, { id, emoji, x }]);
    setShowReactionPicker(false);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
  };

  // Send In-Meeting Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !codeSnippetInput.trim()) return;

    const newChat: InMeetingChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'Austin Vance',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
      text: chatInput.trim(),
      codeSnippet: codeSnippetInput.trim() || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: '#388bfd',
    };

    setChats((prev) => [...prev, newChat]);
    setChatInput('');
    setCodeSnippetInput('');
    setShowCodeSnippetBox(false);
  };

  // Vote on a Poll
  const handleVotePoll = (pollId: string, optionId: string) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          userVotedOptionId: optionId,
          totalVotes: p.userVotedOptionId ? p.totalVotes : p.totalVotes + 1,
          options: p.options.map((opt) =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          ),
        };
      })
    );
    addToast({ type: 'success', title: 'Vote Recorded', description: 'Live poll results updated' });
  };

  // Create New Poll Submit
  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim()) return;
    const validOptions = newPollOptions.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) return;

    const newPoll: MeetingPoll = {
      id: `poll-${Date.now()}`,
      question: newPollQuestion.trim(),
      options: validOptions.map((opt, i) => ({ id: `opt-${Date.now()}-${i}`, text: opt.trim(), votes: 0 })),
      totalVotes: 0,
    };

    setPolls((prev) => [newPoll, ...prev]);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
    setIsNewPollModalOpen(false);
    setActiveSideDrawer('polls');
    addToast({ type: 'success', title: 'Poll Launched', description: 'Attendees can now cast votes' });
  };

  // Mute All Host Control
  const handleMuteAll = () => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === 'user-austin' ? p : { ...p, isAudioOn: false, isSpeaking: false }))
    );
    addToast({
      type: 'warning',
      title: 'Muted All Attendees',
      description: 'Host muted all microphones in the room',
    });
  };

  // Recording toggle
  const handleToggleRecording = () => {
    const next = !isRecording;
    setIsRecording(next);
    addToast({
      type: next ? 'success' : 'info',
      title: next ? 'Cloud Recording Started' : 'Recording Stopped',
      description: next
        ? 'Recording video & audio chunks to SeaweedFS S3'
        : 'Session recording saved to s3://forge-ci-artifacts/recordings/',
    });
  };

  // Copy Meeting Link
  const handleCopyInviteLink = () => {
    const link = `https://forge.internal/meet/${activeRoom.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    addToast({
      type: 'success',
      title: 'Meeting Link Copied',
      description: link,
    });
  };

  // Screen Annotation Canvas Handlers (Slack Huddles pen & laser)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (annotationTool === 'none' || annotationTool === 'laser') return;
    setIsDrawing(true);
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = annotationTool === 'highlighter' ? `${annotationColor}80` : annotationColor;
    ctx.lineWidth = annotationTool === 'highlighter' ? 12 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (annotationTool === 'laser') {
      setLaserPos({ x, y });
    }

    if (!isDrawing || annotationTool === 'none' || annotationTool === 'laser') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearAnnotationCanvas = () => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Download annotated snapshot
  const downloadAnnotationScreenshot = () => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `meeting_annotations_${activeRoom.id}.png`;
    link.href = dataUrl;
    link.click();
    addToast({ type: 'success', title: 'Snapshot Saved', description: 'Downloaded annotated frame' });
  };

  const activeSpeaker = participants.find((p) => p.id === spotlightParticipantId) || participants[1];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#07090e] select-none overflow-hidden relative font-sans">
      {/* 1. Meeting Top Bar (Zoom / Google Meet Executive Cockpit - 52px) */}
      <div className="h-13 px-4 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between gap-4 shrink-0 z-20">
        {/* Left: Active Huddle Channel & Security / Branch Link */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1 p-1 bg-[#161b22] rounded-xl border border-[#30363d]/60 shadow-xs">
            {rooms.map((r) => {
              const isActive = r.id === activeRoomId;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRoomId(r.id)}
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 truncate max-w-[170px] ${
                    isActive
                      ? 'bg-[#21262d] text-[#f0f6fc] font-semibold shadow-xs border border-white/10'
                      : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-[#3fb950]' : 'bg-[#484f58]'}`} />
                  <span className="truncate">{r.name}</span>
                </button>
              );
            })}
            <button
              onClick={() => setIsNewRoomModalOpen(true)}
              className="h-8 w-8 text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d] rounded-lg transition-colors flex items-center justify-center shrink-0"
              title="Create New Huddle"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs text-[#8b949e] font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161b22] border border-[#21262d] text-[#3fb950]" title="End-to-End Encrypted via WebRTC DTLS/SRTP">
              <ShieldCheck size={13} />
              <span className="text-[11px] font-semibold">E2EE</span>
            </div>
            {isMeetingLocked && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d29922]/10 border border-[#d29922]/30 text-[#d29922] text-[11px]">
                <Lock size={12} />
                Locked
              </span>
            )}
            {activeRoom.branchContext && onNavigateToBranch && (
              <button
                onClick={() => onNavigateToBranch(activeRoom.branchContext)}
                className="h-7 px-2.5 rounded-full bg-[#161b22] border border-[#21262d] text-[11px] text-[#58a6ff] hover:border-[#388bfd]/50 hover:bg-[#388bfd]/10 flex items-center gap-1.5 transition-colors"
                title="Jump to code context branch"
              >
                <FileCode size={12} />
                <span>{activeRoom.branchContext}</span>
              </button>
            )}
          </div>
        </div>

        {/* Center: Live Recording & Duration Tag */}
        <div className="flex items-center">
          <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-xl h-8 overflow-hidden shadow-xs divide-x divide-[#30363d]">
            <button
              onClick={handleToggleRecording}
              className={`flex items-center gap-1.5 px-3 h-full text-xs font-mono transition-colors ${
                isRecording
                  ? 'bg-[#da3633]/15 text-[#f85149]'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
              }`}
              title={isRecording ? 'Click to pause cloud recording' : 'Click to start cloud recording'}
            >
              <Circle size={8} className={isRecording ? 'fill-[#f85149] animate-pulse text-[#f85149]' : 'text-[#8b949e]'} />
              <span className="font-semibold text-[11px]">{isRecording ? 'REC' : 'Record'}</span>
            </button>

            <div className="text-xs font-mono tabular-nums text-[#f0f6fc] px-3 h-full flex items-center">
              {formatTimer(callDuration)}
            </div>
          </div>
        </div>

        {/* Right: Layout Switcher & Invite Link */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Layout Mode Toggles */}
          <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-xl p-0.5 h-8 gap-0.5">
            <button
              onClick={() => setLayoutMode('gallery')}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                layoutMode === 'gallery' ? 'bg-[#21262d] text-white shadow-xs' : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/40'
              }`}
              title="Gallery Grid View"
            >
              <LayoutGrid size={13} />
              <span className="hidden lg:inline text-[11px]">Grid</span>
            </button>
            <button
              onClick={() => setLayoutMode('speaker')}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                layoutMode === 'speaker' ? 'bg-[#21262d] text-white shadow-xs' : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/40'
              }`}
              title="Speaker Spotlight View"
            >
              <Square size={13} />
              <span className="hidden lg:inline text-[11px]">Speaker</span>
            </button>
            <button
              onClick={() => {
                setLayoutMode('screenshare');
                if (!isLocalScreenSharing) handleToggleScreenShare('code-trace');
              }}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                layoutMode === 'screenshare' ? 'bg-[#21262d] text-white shadow-xs' : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/40'
              }`}
              title="Screen Share Presentation"
            >
              <Monitor size={13} />
              <span className="hidden lg:inline text-[11px]">Share</span>
            </button>
            <button
              onClick={() => setLayoutMode('whiteboard')}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                layoutMode === 'whiteboard' ? 'bg-[#21262d] text-white shadow-xs' : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/40'
              }`}
              title="Collaborative Whiteboard"
            >
              <Edit3 size={13} />
              <span className="hidden lg:inline text-[11px]">Board</span>
            </button>
          </div>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyInviteLink}
            className={`h-8 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
              copiedLink
                ? 'bg-[#238636]/20 border-[#238636] text-[#3fb950]'
                : 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-[#f0f6fc]'
            }`}
          >
            {copiedLink ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Video Viewport & Presenter Controls */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <div className="flex-1 flex flex-col p-3 overflow-hidden relative">
          {/* Reaction Emoji Bursts */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-16 text-3xl animate-bounce duration-1000 transform transition-all"
                style={{
                  left: `${r.x}%`,
                  animation: 'floatUp 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
              >
                {r.emoji}
              </div>
            ))}
          </div>

          {/* PRESENTER BANNER & SCREEN SHARING TOOLBAR (Zoom / Slack Huddle Style) */}
          {(layoutMode === 'screenshare' || isLocalScreenSharing) && (
            <div className="mb-2 px-3.5 py-1.5 bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] rounded-xl flex items-center justify-between text-xs font-mono shadow-md z-20 gap-3">
              {/* Left: Status & Source Selector */}
              <div className="flex items-center gap-3 truncate">
                <div className="flex items-center gap-2 text-[#388bfd] font-semibold shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#388bfd] animate-pulse" />
                  <span className="text-xs">{isLocalScreenSharing ? 'You are sharing your screen' : "Elena Rostova's Screen"}</span>
                </div>

                <div className="hidden md:flex items-center gap-1.5 text-xs text-[#8b949e]">
                  <span>Source:</span>
                  <select
                    value={screenShareSource}
                    onChange={(e) => handleToggleScreenShare(e.target.value as any)}
                    className="h-8 bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#388bfd] transition-colors"
                  >
                    <option value="code-trace">Window: TokenStore AST Trace</option>
                    <option value="knowledge-graph">Window: Leiden Architecture Graph</option>
                    <option value="display">Entire Desktop Display (getDisplayMedia)</option>
                    <option value="whiteboard">Collaborative Whiteboard</option>
                  </select>
                </div>

                {/* System Audio Indicator */}
                <button
                  onClick={() => setIsScreenAudioShared(!isScreenAudioShared)}
                  className={`h-8 flex items-center gap-1.5 text-xs px-2.5 rounded-lg border transition-all ${
                    isScreenAudioShared
                      ? 'bg-[#3fb950]/15 border-[#3fb950]/40 text-[#3fb950]'
                      : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-white'
                  }`}
                  title="Toggle Screen Audio"
                >
                  <Volume2 size={13} />
                  <span>{isScreenAudioShared ? 'Audio: On' : 'Audio: Off'}</span>
                </button>
              </div>

              {/* Center & Right: Annotation & Zoom Tools & Stop Share */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Annotation Tools */}
                <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d] h-8">
                  <button
                    onClick={() => setAnnotationTool(annotationTool === 'pen' ? 'none' : 'pen')}
                    className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
                      annotationTool === 'pen' ? 'bg-[#388bfd] text-white shadow-xs' : 'text-[#8b949e] hover:text-white'
                    }`}
                    title="Pen Annotation"
                  >
                    <PenTool size={12} />
                  </button>
                  <button
                    onClick={() => setAnnotationTool(annotationTool === 'laser' ? 'none' : 'laser')}
                    className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
                      annotationTool === 'laser' ? 'bg-[#da3633] text-white shadow-xs' : 'text-[#8b949e] hover:text-white'
                    }`}
                    title="Laser Pointer"
                  >
                    <MousePointer size={12} />
                  </button>

                  {/* Annotation colors */}
                  {annotationTool !== 'none' && (
                    <div className="flex items-center gap-1.5 px-1.5 border-l border-[#30363d]">
                      {['#388bfd', '#3fb950', '#d29922', '#f85149'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setAnnotationColor(c)}
                          className="w-3.5 h-3.5 rounded-full transition-transform hover:scale-125"
                          style={{
                            backgroundColor: c,
                            outline: annotationColor === c ? '2px solid white' : 'none',
                          }}
                        />
                      ))}
                      <button
                        onClick={clearAnnotationCanvas}
                        className="h-5 px-1.5 rounded text-[10px] text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                        title="Clear drawings"
                      >
                        Clear
                      </button>
                      <button
                        onClick={downloadAnnotationScreenshot}
                        className="h-5 w-5 rounded flex items-center justify-center text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                        title="Save screenshot"
                      >
                        <Download size={11} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Zoom Level */}
                <div className="hidden sm:flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] h-8 text-[11px] text-[#8b949e] font-mono">
                  <button
                    onClick={() => setScreenZoomLevel(100)}
                    className={`h-6 px-2 rounded transition-colors ${screenZoomLevel === 100 ? 'bg-[#21262d] text-[#388bfd] font-bold' : 'hover:text-white'}`}
                  >
                    100%
                  </button>
                  <button
                    onClick={() => setScreenZoomLevel(125)}
                    className={`h-6 px-2 rounded transition-colors ${screenZoomLevel === 125 ? 'bg-[#21262d] text-[#388bfd] font-bold' : 'hover:text-white'}`}
                  >
                    125%
                  </button>
                  <button
                    onClick={() => setScreenZoomLevel(150)}
                    className={`h-6 px-2 rounded transition-colors ${screenZoomLevel === 150 ? 'bg-[#21262d] text-[#388bfd] font-bold' : 'hover:text-white'}`}
                  >
                    150%
                  </button>
                </div>

                {/* Stop Screen Share Button */}
                {isLocalScreenSharing && (
                  <button
                    onClick={() => handleToggleScreenShare()}
                    className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#da3633] hover:bg-[#b62324] text-white text-xs font-semibold transition-all shadow-md active:scale-95"
                  >
                    <MonitorOff size={13} />
                    <span>Stop Share</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 1: GALLERY VIEW */}
          {layoutMode === 'gallery' && (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 min-h-0">
              {participants.map((participant) => {
                const isLocalUser = participant.id === 'user-austin';
                return (
                  <div
                    key={participant.id}
                    onClick={() => {
                      setSpotlightParticipantId(participant.id);
                      setLayoutMode('speaker');
                    }}
                    className={`relative rounded-xl overflow-hidden bg-[#0d1117] border flex flex-col items-center justify-center transition-all cursor-pointer group shadow-lg ${
                      participant.isSpeaking
                        ? 'border-[#388bfd] ring-2 ring-[#388bfd]/30'
                        : 'border-[#21262d] hover:border-[#30363d]'
                    }`}
                  >
                    {participant.isVideoOn ? (
                      isLocalUser && mediaStream ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
                      ) : (
                        <div className="w-full h-full relative">
                          <img
                            src={participant.avatar}
                            alt={participant.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover filter brightness-95"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div
                          className="w-20 h-20 rounded-full overflow-hidden ring-4 border-2 border-transparent transition-all group-hover:scale-105"
                          style={{ borderColor: participant.color }}
                        >
                          <img
                            src={participant.avatar}
                            alt={participant.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-center font-mono">
                          <div className="text-xs font-semibold text-[#f0f6fc]">{participant.name}</div>
                          <div className="text-[10px] text-[#8b949e]">{participant.title}</div>
                        </div>
                      </div>
                    )}

                    {participant.isSpeaking && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-[#388bfd]/50">
                        <div className="w-1.5 h-3 bg-[#388bfd] rounded-full animate-pulse" />
                        <div className="w-1.5 h-4 bg-[#388bfd] rounded-full animate-pulse delay-75" />
                        <div className="w-1.5 h-2 bg-[#388bfd] rounded-full animate-pulse delay-150" />
                        <span className="text-[10px] font-mono text-[#58a6ff] ml-1">Speaking</span>
                      </div>
                    )}

                    {participant.isHandRaised && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#d29922] text-[#07090e] px-2 py-0.5 rounded-full text-xs font-bold animate-bounce shadow-md">
                        <Hand size={12} />
                        <span>Raised Hand</span>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-mono border border-white/10">
                        <span className="text-white font-medium">{participant.name}</span>
                        {participant.role === 'host' && (
                          <span className="text-[9px] bg-[#388bfd]/30 text-[#58a6ff] px-1 rounded font-semibold">
                            HOST
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                        {participant.isAudioOn ? (
                          <Mic size={13} className="text-[#3fb950]" />
                        ) : (
                          <MicOff size={13} className="text-[#f85149]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: SPEAKER SPOTLIGHT VIEW */}
          {layoutMode === 'speaker' && (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 rounded-xl bg-[#0d1117] border border-[#388bfd]/50 relative overflow-hidden flex items-center justify-center shadow-2xl">
                {activeSpeaker.isVideoOn ? (
                  <img
                    src={activeSpeaker.avatar}
                    alt={activeSpeaker.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-[#388bfd]">
                      <img
                        src={activeSpeaker.avatar}
                        alt={activeSpeaker.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center font-mono">
                      <h3 className="text-base font-bold text-white">{activeSpeaker.name}</h3>
                      <p className="text-xs text-[#8b949e]">{activeSpeaker.title}</p>
                    </div>
                  </div>
                )}

                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-[#388bfd] animate-ping" />
                  <span className="text-xs font-semibold text-white">{activeSpeaker.name} (Spotlight)</span>
                </div>
              </div>

              {/* Bottom Filmstrip */}
              <div className="h-28 flex items-center gap-3 overflow-x-auto pb-1 shrink-0">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSpotlightParticipantId(p.id)}
                    className={`h-full w-44 rounded-lg bg-[#0d1117] border flex flex-col items-center justify-center p-2 relative shrink-0 cursor-pointer transition-all ${
                      p.id === spotlightParticipantId
                        ? 'border-[#388bfd] ring-2 ring-[#388bfd]/40'
                        : 'border-[#21262d] hover:border-[#30363d]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden mb-1">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-white truncate max-w-[120px]">{p.name}</span>
                    <span className="text-[10px] text-[#8b949e]">{p.isAudioOn ? 'Mic On' : 'Muted'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: SCREEN SHARE PRESENTATION STAGE */}
          {layoutMode === 'screenshare' && (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 rounded-xl bg-[#0d1117] border border-[#388bfd] relative overflow-hidden flex flex-col shadow-2xl">
                {/* Interactive Annotation Canvas Overlay */}
                <canvas
                  ref={annotationCanvasRef}
                  width={1100}
                  height={600}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className={`absolute inset-0 w-full h-full z-20 ${
                    annotationTool === 'pen' || annotationTool === 'highlighter'
                      ? 'cursor-crosshair'
                      : annotationTool === 'laser'
                      ? 'cursor-none'
                      : 'pointer-events-none'
                  }`}
                />

                {/* Laser Pointer Dot */}
                {annotationTool === 'laser' && laserPos && (
                  <div
                    className="absolute w-3 h-3 rounded-full bg-[#da3633] ring-4 ring-[#da3633]/40 shadow-lg pointer-events-none z-30 transition-all duration-75"
                    style={{ left: laserPos.x - 6, top: laserPos.y - 6 }}
                  />
                )}

                {/* Screen Share Content Switcher */}
                {screenShareSource === 'display' ? (
                  <video
                    ref={screenShareVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : screenShareSource === 'knowledge-graph' ? (
                  <div className="flex-1 bg-[#05070a] p-6 flex flex-col items-center justify-center font-mono text-xs text-[#8b949e] relative">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 rounded-full bg-[#a371f7]/20 border border-[#a371f7]/40 flex items-center justify-center mx-auto text-[#d2a8ff]">
                        <Layers size={32} />
                      </div>
                      <h4 className="text-sm font-semibold text-white">Sharing Leiden Architectural Network</h4>
                      <p className="text-xs text-[#8b949e]">Streaming PageRank graph & AST blast radius topology</p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex-1 bg-[#05070a] p-4 font-mono text-xs overflow-auto relative transition-transform duration-200"
                    style={{ transform: `scale(${screenZoomLevel / 100})`, transformOrigin: 'top left' }}
                  >
                    <pre className="text-[#f0f6fc] leading-relaxed relative z-10">
                      <code>{`// TokenStore verification implementation (feat-auth-wasm)
pub struct TokenStore {
    inner: Arc<RwLock<HashMap<String, Claims>>>,
    pub wasm_validator: WasmRuntime,
}

impl TokenStore {
    pub async fn validate(&self, bearer: &str) -> Result<Claims, AuthError> {
        let span = tracing::info_span!("token_validate", token_id = bearer);
        let _enter = span.enter();

        // Check cache lock without holding write lock
        let guard = self.inner.read().await;
        if let Some(claims) = guard.get(bearer) {
            return Ok(claims.clone());
        }
        drop(guard); // <-- RESOLVES CONFLICT: Read lock dropped before wasm eval!

        // Invoke WebAssembly engine with 64MB isolated sandbox
        let result = self.wasm_validator.eval_claims(bearer).await?;
        Ok(result)
    }
}`}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 4: COLLABORATIVE WHITEBOARD */}
          {layoutMode === 'whiteboard' && (
            <div className="flex-1 rounded-xl bg-[#161b22] border border-[#30363d] relative overflow-hidden flex flex-col shadow-2xl p-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
                <div className="flex items-center gap-2">
                  <Edit3 size={15} className="text-[#388bfd]" />
                  <span className="font-semibold text-sm text-white">Infinite Architecture Whiteboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newNote = {
                        id: `wn-${Date.now()}`,
                        x: Math.floor(Math.random() * 300) + 50,
                        y: Math.floor(Math.random() * 200) + 50,
                        text: 'New architecture note...',
                        color: '#fef08a',
                      };
                      setWhiteboardNotes((prev) => [...prev, newNote]);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#21262d] text-white hover:bg-[#30363d] text-xs border border-[#30363d]"
                  >
                    <StickyNote size={13} className="text-[#d29922]" />
                    <span>+ Sticky Note</span>
                  </button>
                </div>
              </div>

              {/* Whiteboard Canvas Area */}
              <div className="flex-1 relative overflow-auto bg-[#0d1117] rounded-lg mt-2 p-4">
                {whiteboardNotes.map((note) => (
                  <div
                    key={note.id}
                    className="absolute p-3 rounded-lg shadow-xl text-black font-sans text-xs w-60 border border-black/10 cursor-move"
                    style={{ left: note.x, top: note.y, backgroundColor: note.color }}
                  >
                    <textarea
                      defaultValue={note.text}
                      rows={3}
                      className="w-full bg-transparent resize-none focus:outline-none text-xs text-neutral-900 leading-snug font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE CLOSED CAPTIONS OVERLAY (Google Meet Subtitles) */}
          {showCaptions && captions.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl bg-black/85 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs font-mono text-center shadow-2xl z-30 animate-in fade-in duration-200">
              <span className="text-[#58a6ff] font-semibold">{captions[captions.length - 1].speaker}: </span>
              <span className="text-white">"{captions[captions.length - 1].text}"</span>
            </div>
          )}
        </div>

        {/* 3. Collaborative Side Drawers (Chat, People, Polls, Notes) */}
        {activeSideDrawer !== 'none' && (
          <aside className="w-80 h-full border-l border-[#21262d] bg-[#0d1117] flex flex-col shrink-0 text-xs font-mono z-20 shadow-2xl">
            {/* Drawer Tabs */}
            <div className="flex items-center justify-between border-b border-[#21262d] p-2 bg-[#161b22] gap-1.5 shrink-0">
              <div className="flex items-center gap-1 p-0.5 bg-[#0d1117] rounded-lg border border-[#30363d]/60 flex-1 overflow-x-auto">
                <button
                  onClick={() => setActiveSideDrawer('chat')}
                  className={`flex-1 min-w-[55px] py-1.5 px-2 rounded-md text-xs transition-all text-center ${
                    activeSideDrawer === 'chat'
                      ? 'bg-[#21262d] text-white shadow-xs font-semibold'
                      : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  Chat ({chats.length})
                </button>
                <button
                  onClick={() => setActiveSideDrawer('people')}
                  className={`flex-1 min-w-[55px] py-1.5 px-2 rounded-md text-xs transition-all text-center ${
                    activeSideDrawer === 'people'
                      ? 'bg-[#21262d] text-white shadow-xs font-semibold'
                      : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  People ({participants.length})
                </button>
                <button
                  onClick={() => setActiveSideDrawer('polls')}
                  className={`flex-1 min-w-[50px] py-1.5 px-2 rounded-md text-xs transition-all text-center ${
                    activeSideDrawer === 'polls'
                      ? 'bg-[#21262d] text-white shadow-xs font-semibold'
                      : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  Polls ({polls.length})
                </button>
                <button
                  onClick={() => setActiveSideDrawer('notes')}
                  className={`flex-1 min-w-[50px] py-1.5 px-2 rounded-md text-xs transition-all text-center ${
                    activeSideDrawer === 'notes'
                      ? 'bg-[#21262d] text-white shadow-xs font-semibold'
                      : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  Notes
                </button>
              </div>

              <button
                onClick={() => setActiveSideDrawer('none')}
                className="w-7 h-7 flex items-center justify-center text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors shrink-0"
                title="Close Drawer"
              >
                ✕
              </button>
            </div>

            {/* TAB: Chat */}
            {activeSideDrawer === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chats.map((c) => (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                        <span className="font-semibold text-[#f0f6fc]">{c.sender}</span>
                        <span>{c.timestamp}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#161b22] border border-[#21262d] text-xs text-[#f0f6fc] leading-normal">
                        {c.text}
                        {c.codeSnippet && (
                          <pre className="mt-1.5 p-1.5 rounded bg-[#07090e] border border-[#30363d] text-[10px] text-[#3fb950] overflow-x-auto">
                            <code>{c.codeSnippet}</code>
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-[#21262d] space-y-2 bg-[#161b22]/40">
                  {showCodeSnippetBox && (
                    <textarea
                      value={codeSnippetInput}
                      onChange={(e) => setCodeSnippetInput(e.target.value)}
                      placeholder="Paste code snippet..."
                      rows={2}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded p-1.5 text-[11px] text-[#3fb950] focus:outline-none"
                    />
                  )}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCodeSnippetBox(!showCodeSnippetBox)}
                      className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${
                        showCodeSnippetBox
                          ? 'bg-[#388bfd]/20 border-[#388bfd] text-[#58a6ff]'
                          : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-white'
                      }`}
                      title="Attach code block"
                    >
                      <Code size={14} />
                    </button>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Message room..."
                      className="h-8 flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-[#388bfd] transition-colors"
                    />
                    <button
                      type="submit"
                      className="h-8 w-8 rounded-lg bg-[#388bfd] hover:bg-[#1f6feb] text-white flex items-center justify-center transition-colors shrink-0 shadow-xs"
                      title="Send message"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: People & Host Controls */}
            {activeSideDrawer === 'people' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
                  <span className="text-[10px] uppercase text-[#8b949e] tracking-wider font-semibold">
                    Participants ({participants.length})
                  </span>
                  <button
                    onClick={handleMuteAll}
                    className="h-6 px-2 rounded bg-[#da3633]/15 hover:bg-[#da3633]/25 border border-[#da3633]/30 text-[10px] font-semibold text-[#f85149] transition-colors flex items-center gap-1"
                  >
                    <VolumeX size={11} />
                    <span>Mute All</span>
                  </button>
                </div>

                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                        <img src={p.avatar} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-[#f0f6fc] text-xs truncate">{p.name}</div>
                        <div className="text-[10px] text-[#8b949e] truncate">{p.title}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.isHandRaised && <Hand size={13} className="text-[#d29922]" />}
                      {p.isAudioOn ? <Mic size={13} className="text-[#3fb950]" /> : <MicOff size={13} className="text-[#f85149]" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Polls & Voting (Zoom Feature) */}
            {activeSideDrawer === 'polls' && (
              <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
                  <span className="text-[10px] uppercase text-[#8b949e] tracking-wider">Active Polls</span>
                  <button
                    onClick={() => setIsNewPollModalOpen(true)}
                    className="text-[10px] text-[#58a6ff] hover:underline flex items-center gap-1"
                  >
                    <Plus size={11} />
                    New Poll
                  </button>
                </div>

                {polls.map((poll) => (
                  <div key={poll.id} className="p-3 rounded-lg bg-[#161b22] border border-[#21262d] space-y-2.5">
                    <div className="font-semibold text-xs text-white">{poll.question}</div>
                    <div className="space-y-1.5">
                      {poll.options.map((opt) => {
                        const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                        const hasVotedThis = poll.userVotedOptionId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleVotePoll(poll.id, opt.id)}
                            className={`w-full text-left p-2 rounded border transition-all relative overflow-hidden ${
                              hasVotedThis
                                ? 'border-[#388bfd] bg-[#388bfd]/10'
                                : 'border-[#30363d] hover:bg-[#21262d]'
                            }`}
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-[#388bfd]/20 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative z-10 flex items-center justify-between text-xs">
                              <span className="text-[#f0f6fc]">{opt.text}</span>
                              <span className="font-mono text-[#8b949e]">{pct}% ({opt.votes})</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-[#8b949e] text-right">
                      Total: {poll.totalVotes} votes cast
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Scratchpad Notes */}
            {activeSideDrawer === 'notes' && (
              <div className="flex-1 flex flex-col p-3 space-y-2">
                <div className="text-[10px] uppercase text-[#8b949e] tracking-wider">
                  Real-time Collaborative Scratchpad
                </div>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  className="flex-1 w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 text-xs text-[#f0f6fc] leading-relaxed resize-none focus:outline-none focus:border-[#388bfd]"
                  placeholder="Type shared meeting notes here..."
                />
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 4. Bottom Call Control Dock (Executive Zoom / Google Meet Style - 72px) */}
      <div className="h-[72px] px-4 md:px-6 bg-[#0d1117] border-t border-[#21262d] flex items-center justify-between gap-3 shrink-0 z-30 select-none overflow-x-auto">
        {/* Left: Room Context info & Telemetry */}
        <div className="flex items-center gap-3 text-xs font-mono shrink-0 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3fb950]" />
            </span>
            <span className="font-bold text-[#f0f6fc] text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[200px] lg:max-w-xs">
              {activeRoom.name}
            </span>
          </div>
          <span className="hidden 2xl:inline text-[#30363d]">|</span>
          <span className="hidden 2xl:inline text-[#8b949e] truncate max-w-[180px]">{activeRoom.topic}</span>
          <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] text-[#8b949e] bg-[#161b22] px-2.5 py-1 rounded-full border border-[#21262d] shrink-0 whitespace-nowrap">
            <Users size={12} className="text-[#58a6ff] shrink-0" />
            <span className="font-semibold text-[#f0f6fc]">{participants.length}</span>
            <span>online</span>
          </span>
        </div>

        {/* Center: The Core Executive Floating Island */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#161b22]/95 backdrop-blur-xl border border-[#30363d]/80 rounded-2xl shadow-xl shrink-0">
          {/* AV Controls: Mic & Camera */}
          <button
            onClick={handleToggleAudio}
            className={`h-10 px-3.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              isLocalAudioOn
                ? 'bg-[#21262d] hover:bg-[#30363d] text-white border border-white/10 shadow-xs'
                : 'bg-[#da3633]/15 hover:bg-[#da3633]/25 text-[#f85149] border border-[#da3633]/30 shadow-xs'
            }`}
            title={isLocalAudioOn ? 'Mute Microphone (Cmd+D)' : 'Unmute Microphone (Cmd+D)'}
          >
            {isLocalAudioOn ? (
              <>
                <Mic size={15} className="text-[#3fb950] shrink-0" />
                <span className="hidden sm:inline">Mute</span>
              </>
            ) : (
              <>
                <MicOff size={15} className="text-[#f85149] shrink-0" />
                <span className="hidden sm:inline">Unmute</span>
              </>
            )}
          </button>

          <button
            onClick={handleToggleVideo}
            className={`h-10 px-3.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              isLocalVideoOn
                ? 'bg-[#21262d] hover:bg-[#30363d] text-white border border-white/10 shadow-xs'
                : 'bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] shadow-xs'
            }`}
            title={isLocalVideoOn ? 'Stop Video (Cmd+E)' : 'Start Video (Cmd+E)'}
          >
            {isLocalVideoOn ? (
              <>
                <Video size={15} className="text-[#3fb950] shrink-0" />
                <span className="hidden sm:inline">Stop Video</span>
              </>
            ) : (
              <>
                <VideoOff size={15} className="text-[#f85149] shrink-0" />
                <span className="hidden sm:inline">Start Video</span>
              </>
            )}
          </button>

          <div className="h-5 w-px bg-[#30363d]/60 mx-0.5 shrink-0" />

          {/* Screen Share & Whiteboard */}
          <button
            onClick={() => handleToggleScreenShare()}
            className={`h-10 px-3.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              isLocalScreenSharing
                ? 'bg-[#388bfd] text-white border border-[#388bfd] shadow-sm'
                : 'bg-[#21262d]/60 hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d]/60'
            }`}
            title="Screen Share Options"
          >
            <Monitor size={15} className={isLocalScreenSharing ? 'text-white shrink-0' : 'text-[#58a6ff] shrink-0'} />
            <span className="hidden md:inline">{isLocalScreenSharing ? 'Sharing' : 'Share'}</span>
          </button>

          <button
            onClick={() => setLayoutMode(layoutMode === 'whiteboard' ? 'screenshare' : 'whiteboard')}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 ${
              layoutMode === 'whiteboard'
                ? 'bg-[#388bfd]/20 text-[#58a6ff] border border-[#388bfd]'
                : 'bg-[#21262d]/60 hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d]/60'
            }`}
            title="Collaborative Architecture Whiteboard"
          >
            <Edit3 size={15} />
          </button>

          <div className="h-5 w-px bg-[#30363d]/60 mx-0.5 shrink-0" />

          {/* Reactions, Hand, Captions */}
          <button
            onClick={handleToggleHandRaise}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 ${
              isLocalHandRaised
                ? 'bg-[#d29922]/20 text-[#d29922] border border-[#d29922] shadow-sm ring-1 ring-[#d29922]/30'
                : 'bg-[#21262d]/60 hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d]/60'
            }`}
            title={isLocalHandRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            <Hand size={15} className={isLocalHandRaised ? 'animate-bounce text-[#d29922]' : ''} />
          </button>

          <div className="relative shrink-0">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                showReactionPicker
                  ? 'bg-[#21262d] text-white border border-[#388bfd]'
                  : 'bg-[#21262d]/60 hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d]/60'
              }`}
              title="Emoji Reactions"
            >
              <Smile size={15} />
            </button>
            {showReactionPicker && (
              <div className="absolute bottom-13 left-1/2 -translate-x-1/2 bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                {['🚀', '🔥', '👏', '❤️', '💡', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => triggerReaction(emoji)}
                    className="w-9 h-9 rounded-xl hover:bg-[#21262d] flex items-center justify-center text-lg transition-transform hover:scale-125 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 ${
              showCaptions
                ? 'bg-[#388bfd]/20 text-[#58a6ff] border border-[#388bfd] shadow-xs ring-1 ring-[#388bfd]/30'
                : 'bg-[#21262d]/60 hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d]/60'
            }`}
            title="Toggle Live Speech Subtitles (CC)"
          >
            <Subtitles size={15} />
          </button>

          <div className="h-5 w-px bg-[#30363d]/60 mx-0.5 shrink-0" />

          {/* Settings & Host Controls */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#21262d]/60 hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d]/60 transition-all active:scale-95 shrink-0"
            title="Audio & Video Settings (Camera, Mic, Virtual Backgrounds)"
          >
            <Settings size={15} />
          </button>

          <button
            onClick={() => setIsHostControlsOpen(true)}
            className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#21262d]/60 hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d]/60 transition-all active:scale-95 shrink-0"
            title="Host Security & Controls (Mute All, Lock Meeting)"
          >
            <ShieldCheck size={15} className="text-[#58a6ff]" />
          </button>

          <div className="h-5 w-px bg-[#30363d]/60 mx-0.5 shrink-0" />

          {/* Leave Call */}
          <button
            onClick={onLeaveCall}
            className="h-10 px-4 rounded-xl bg-[#da3633] hover:bg-[#b62324] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-red-900/30 transition-all active:scale-95 shrink-0 ml-0.5"
            title="Leave Huddle"
          >
            <PhoneOff size={14} />
            <span>Leave</span>
          </button>
        </div>

        {/* Right: Drawer Triggers & View Utilities */}
        <div className="flex items-center gap-1 p-1 bg-[#161b22] border border-[#30363d]/80 rounded-xl shrink-0">
          <button
            onClick={() => setActiveSideDrawer(activeSideDrawer === 'chat' ? 'none' : 'chat')}
            className={`h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all shrink-0 ${
              activeSideDrawer === 'chat'
                ? 'bg-[#21262d] text-white border border-white/10 shadow-xs'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/50'
            }`}
            title="In-Meeting Chat"
          >
            <MessageSquare size={14} />
            <span className="hidden xl:inline">Chat</span>
            {chats.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#388bfd] text-white font-semibold">
                {chats.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSideDrawer(activeSideDrawer === 'people' ? 'none' : 'people')}
            className={`h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all shrink-0 ${
              activeSideDrawer === 'people'
                ? 'bg-[#21262d] text-white border border-white/10 shadow-xs'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/50'
            }`}
            title="Participants List"
          >
            <Users size={14} />
            <span className="hidden xl:inline">People</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#21262d] text-[#8b949e]">
              {participants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSideDrawer(activeSideDrawer === 'polls' ? 'none' : 'polls')}
            className={`h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all shrink-0 ${
              activeSideDrawer === 'polls'
                ? 'bg-[#21262d] text-white border border-white/10 shadow-xs'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/50'
            }`}
            title="Polls & Voting"
          >
            <BarChart2 size={14} />
            <span className="hidden xl:inline">Polls</span>
          </button>

          <button
            onClick={() => setActiveSideDrawer(activeSideDrawer === 'notes' ? 'none' : 'notes')}
            className={`h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all shrink-0 ${
              activeSideDrawer === 'notes'
                ? 'bg-[#21262d] text-white border border-white/10 shadow-xs'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/50'
            }`}
            title="Shared Notes"
          >
            <FileText size={14} />
            <span className="hidden xl:inline">Notes</span>
          </button>

          <div className="h-4 w-px bg-[#30363d] mx-0.5 shrink-0" />

          <button
            onClick={toggleFullscreen}
            className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all shrink-0 ${
              isFullscreen
                ? 'bg-[#21262d] text-white'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]/50'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* MODAL 1: Audio & Video Device Settings (Google Meet / Zoom) */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Audio & Video Settings"
        description="Configure hardware inputs, noise suppression, and virtual backgrounds"
        maxWidth="md"
        footer={
          <Button variant="primary" onClick={() => setIsSettingsModalOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-4 font-mono text-xs">
          {/* Microphone */}
          <div>
            <label className="text-xs font-semibold text-white block mb-1">Microphone Input</label>
            <select
              value={deviceSettings.microphoneId}
              onChange={(e) => setDeviceSettings({ ...deviceSettings, microphoneId: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-white"
            >
              <option value="default-mic">Default - MacBook Pro Internal Microphone</option>
              <option value="usb-mic">Shure MV7 / USB Audio Interface (Studio 48kHz)</option>
              <option value="airpods">AirPods Pro (Bluetooth Hands-Free)</option>
            </select>

            {/* Live audio level meter */}
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] text-[#8b949e]">Input Level:</span>
              <div className="flex-1 bg-[#161b22] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#3fb950] h-full transition-all duration-75"
                  style={{ width: `${isLocalAudioOn ? localAudioLevel : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Speaker */}
          <div>
            <label className="text-xs font-semibold text-white block mb-1">Audio Output / Speakers</label>
            <div className="flex gap-2">
              <select
                value={deviceSettings.speakerId}
                onChange={(e) => setDeviceSettings({ ...deviceSettings, speakerId: e.target.value })}
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded p-2 text-white"
              >
                <option value="default-speaker">Default - MacBook Pro Speakers</option>
                <option value="headphones">External Studio Headphones (3.5mm)</option>
              </select>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => {
                  try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    osc.frequency.setValueAtTime(440, ctx.currentTime);
                    osc.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.2);
                  } catch {}
                  addToast({ type: 'info', title: 'Playing Test Chime', description: 'Speaker output verified' });
                }}
              >
                Test Sound
              </Button>
            </div>
          </div>

          {/* Camera */}
          <div>
            <label className="text-xs font-semibold text-white block mb-1">Camera Device</label>
            <select
              value={deviceSettings.cameraId}
              onChange={(e) => setDeviceSettings({ ...deviceSettings, cameraId: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-white"
            >
              <option value="facetime-hd">FaceTime HD Camera (1080p Built-in)</option>
              <option value="obs-cam">OBS Virtual Camera (Screen Compositor)</option>
            </select>
          </div>

          {/* AI Noise Suppression */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
            <div>
              <div className="font-semibold text-white text-xs">AI Noise Suppression</div>
              <div className="text-[10px] text-[#8b949e]">Filters out mechanical keyboard clicks & background fan noise</div>
            </div>
            <button
              onClick={() => setDeviceSettings({ ...deviceSettings, noiseSuppression: !deviceSettings.noiseSuppression })}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                deviceSettings.noiseSuppression ? 'bg-[#388bfd]' : 'bg-[#30363d]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  deviceSettings.noiseSuppression ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Virtual Backgrounds */}
          <div>
            <label className="text-xs font-semibold text-white block mb-1">Virtual Background / Blur</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'None' },
                { id: 'blur-light', label: 'Slight Blur' },
                { id: 'blur-deep', label: 'Deep Blur' },
                { id: 'office', label: 'Modern Office' },
                { id: 'server-room', label: 'Server Room' },
                { id: 'slate', label: 'Minimal Studio' },
              ].map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setDeviceSettings({ ...deviceSettings, virtualBackground: bg.id as any })}
                  className={`p-2 rounded text-[11px] font-mono border text-center transition-colors ${
                    deviceSettings.virtualBackground === bg.id
                      ? 'border-[#388bfd] bg-[#388bfd]/20 text-[#58a6ff] font-bold'
                      : 'border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Create New Poll Modal */}
      <Modal
        isOpen={isNewPollModalOpen}
        onClose={() => setIsNewPollModalOpen(false)}
        title="Launch Instant Huddle Poll"
        description="Collect instant votes from attendees in real-time"
        maxWidth="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsNewPollModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePollSubmit}>
              Launch Poll
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePollSubmit} className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-xs font-semibold text-white block mb-1">Poll Question</label>
            <Input
              value={newPollQuestion}
              onChange={(e) => setNewPollQuestion(e.target.value)}
              placeholder="e.g. Ready to cut release candidate v1.4?"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white block">Poll Options</label>
            {newPollOptions.map((opt, i) => (
              <Input
                key={i}
                value={opt}
                onChange={(e) => {
                  const updated = [...newPollOptions];
                  updated[i] = e.target.value;
                  setNewPollOptions(updated);
                }}
                placeholder={`Option ${i + 1}`}
                required
              />
            ))}
            <button
              type="button"
              onClick={() => setNewPollOptions([...newPollOptions, ''])}
              className="text-[11px] text-[#58a6ff] hover:underline flex items-center gap-1"
            >
              + Add another option
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: New Room Modal */}
      <Modal
        isOpen={isNewRoomModalOpen}
        onClose={() => setIsNewRoomModalOpen(false)}
        title="Start New Collaboration Huddle"
        description="Launch an instant Google Meet / Slack-style audio/video room"
        maxWidth="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsNewRoomModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!newRoomName.trim()) return;
                setIsNewRoomModalOpen(false);
                addToast({
                  type: 'success',
                  title: 'Huddle Launched',
                  description: `Started ${newRoomName.trim()}`,
                });
              }}
            >
              Start Huddle
            </Button>
          </>
        }
      >
        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
              Room / Huddle Name
            </label>
            <Input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="e.g. #wasm-performance-deepdive"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
              Discussion Topic
            </label>
            <Input
              value={newRoomTopic}
              onChange={(e) => setNewRoomTopic(e.target.value)}
              placeholder="e.g. Investigating AST lock contention before commit"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Host Security & Controls */}
      <Modal
        isOpen={isHostControlsOpen}
        onClose={() => setIsHostControlsOpen(false)}
        title="Host Security & Room Controls"
        description="Manage room access permissions, attendee capabilities, and host moderation"
        maxWidth="md"
        footer={
          <Button variant="primary" onClick={() => setIsHostControlsOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-4 font-mono text-xs">
          {/* Lock Meeting Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
            <div className="space-y-0.5">
              <div className="font-semibold text-white flex items-center gap-2">
                <Lock size={13} className="text-[#d29922]" />
                <span>Lock Meeting Room</span>
              </div>
              <div className="text-[10px] text-[#8b949e]">
                No new participants can join this huddle while locked
              </div>
            </div>
            <button
              onClick={() => {
                const next = !isMeetingLocked;
                setIsMeetingLocked(next);
                addToast({
                  type: next ? 'warning' : 'info',
                  title: next ? 'Meeting Locked' : 'Meeting Unlocked',
                  description: next ? 'New joins blocked' : 'Room open for collaborators',
                });
              }}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                isMeetingLocked ? 'bg-[#d29922]' : 'bg-[#30363d]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  isMeetingLocked ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Attendee Screen Share Permission */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
            <div className="space-y-0.5">
              <div className="font-semibold text-white flex items-center gap-2">
                <Monitor size={13} className="text-[#388bfd]" />
                <span>Allow Attendee Screen Share</span>
              </div>
              <div className="text-[10px] text-[#8b949e]">
                Permit non-host participants to present screens
              </div>
            </div>
            <button
              onClick={() => {
                setAllowAttendeeScreenShare(!allowAttendeeScreenShare);
                addToast({
                  type: 'info',
                  title: 'Screen Share Permission Updated',
                  description: allowAttendeeScreenShare ? 'Attendees restricted' : 'Attendees allowed',
                });
              }}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                allowAttendeeScreenShare ? 'bg-[#388bfd]' : 'bg-[#30363d]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  allowAttendeeScreenShare ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Quick Host Actions */}
          <div className="pt-2 border-t border-[#21262d] flex items-center justify-between gap-3">
            <button
              onClick={() => {
                handleMuteAll();
                setIsHostControlsOpen(false);
              }}
              className="h-8 flex-1 px-3 rounded-lg bg-[#da3633]/15 hover:bg-[#da3633]/25 border border-[#da3633]/40 text-[#f85149] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <VolumeX size={13} />
              <span>Mute All Attendees</span>
            </button>

            <button
              onClick={() => {
                setIsHostControlsOpen(false);
                if (onLeaveCall) onLeaveCall();
              }}
              className="h-8 flex-1 px-3 rounded-lg bg-[#da3633] hover:bg-[#b62324] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <PhoneOff size={13} />
              <span>End Room For All</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
