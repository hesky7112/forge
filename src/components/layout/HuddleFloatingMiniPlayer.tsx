import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Radio,
  Users,
} from 'lucide-react';
import { MeetingParticipant, MeetingRoom } from '../../types';

interface HuddleFloatingMiniPlayerProps {
  room: MeetingRoom;
  activeSpeaker: MeetingParticipant;
  isAudioOn: boolean;
  isVideoOn: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onExpandCall: () => void;
  onLeaveCall: () => void;
  participantsCount: number;
}

export const HuddleFloatingMiniPlayer: React.FC<HuddleFloatingMiniPlayerProps> = ({
  room,
  activeSpeaker,
  isAudioOn,
  isVideoOn,
  onToggleAudio,
  onToggleVideo,
  onExpandCall,
  onLeaveCall,
  participantsCount,
}) => {
  return (
    <div className="fixed bottom-14 right-4 z-40 bg-[#0d1117] border border-[#388bfd]/60 rounded-2xl shadow-2xl p-3 w-80 font-mono text-xs animate-in slide-in-from-bottom-5 duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-ping" />
          <span className="font-semibold text-[#f0f6fc] truncate">{room.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
            <Users size={11} />
            {participantsCount}
          </span>
          <button
            onClick={onExpandCall}
            title="Expand Full Meeting"
            className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Active Speaker Card */}
      <div className="py-2.5 flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#388bfd] shrink-0">
          <img
            src={activeSpeaker.avatar}
            alt={activeSpeaker.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {activeSpeaker.isSpeaking && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#388bfd] ring-1 ring-[#0d1117]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white truncate text-xs">{activeSpeaker.name}</span>
            {activeSpeaker.isSpeaking && (
              <span className="text-[9px] text-[#58a6ff] bg-[#388bfd]/20 px-1 rounded font-bold">
                TALKING
              </span>
            )}
          </div>
          <div className="text-[10px] text-[#8b949e] truncate">{activeSpeaker.title}</div>
        </div>
      </div>

      {/* Mini Controls Bar */}
      <div className="pt-2.5 border-t border-[#21262d] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleAudio}
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
              isAudioOn
                ? 'bg-[#21262d] text-white hover:bg-[#30363d] border border-white/10'
                : 'bg-[#da3633]/15 text-[#f85149] hover:bg-[#da3633]/25 border border-[#da3633]/30'
            }`}
            title={isAudioOn ? 'Mute Mic' : 'Unmute Mic'}
          >
            {isAudioOn ? <Mic size={14} className="text-[#3fb950]" /> : <MicOff size={14} />}
          </button>

          <button
            onClick={onToggleVideo}
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
              isVideoOn
                ? 'bg-[#21262d] text-white hover:bg-[#30363d] border border-white/10'
                : 'bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
            title={isVideoOn ? 'Stop Video' : 'Start Video'}
          >
            {isVideoOn ? <Video size={14} className="text-[#3fb950]" /> : <VideoOff size={14} className="text-[#f85149]" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onExpandCall}
            className="h-8 px-2.5 rounded-lg bg-[#21262d]/50 hover:bg-[#21262d] text-xs text-[#58a6ff] hover:text-white font-medium border border-white/5 transition-all flex items-center gap-1"
          >
            <Maximize2 size={12} />
            <span>Expand</span>
          </button>
          <button
            onClick={onLeaveCall}
            className="h-8 px-2.5 rounded-lg bg-[#da3633] hover:bg-[#b62324] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            title="Leave Huddle"
          >
            <PhoneOff size={13} />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};
