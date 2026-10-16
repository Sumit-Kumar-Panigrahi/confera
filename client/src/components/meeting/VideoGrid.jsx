import React from 'react';
import VideoTile from './VideoTile';
import { CopyIcon, UsersIcon, CheckIcon } from 'lucide-react';

const VideoGrid = ({ 
  localStream, 
  localUser, 
  remoteUsers = [], 
  audioEnabled, 
  videoEnabled,
  isScreenSharing = false,
  isHost = false,
  meetingHostId = null,
  pinnedSocketId = null,
  onPinSocketId = null,
  onCopyInvite = null,
  copiedInvite = false,
  meetingId = ''
}) => {
  const localName = localUser?.fullName || localUser?.name || "You";
  const isLocalHost = Boolean(isHost || (meetingHostId && localUser?.id && meetingHostId.toString() === localUser.id.toString()));

  // Consolidate all participants
  const localParticipant = {
    socketId: 'local',
    name: `${localName} (You)`,
    stream: localStream,
    isLocal: true,
    audioEnabled,
    videoEnabled,
    isHost: isLocalHost,
    isScreenShare: isScreenSharing
  };

  const remoteParticipants = remoteUsers.map((u) => ({
    socketId: u.socketId,
    name: u.userName || 'Participant',
    stream: u.stream,
    isLocal: false,
    audioEnabled: u.audioEnabled ?? true,
    videoEnabled: u.videoEnabled ?? true,
    isHost: Boolean(u.isHost || (meetingHostId && u.userId && meetingHostId.toString() === u.userId.toString())),
    isScreenShare: Boolean(u.isScreenShare)
  }));

  const allParticipants = [localParticipant, ...remoteParticipants];
  const totalCount = allParticipants.length;

  // Check if someone is pinned or screen sharing
  const screenSharer = allParticipants.find(p => p.isScreenShare);
  const pinnedUser = pinnedSocketId 
    ? allParticipants.find(p => p.socketId === pinnedSocketId) 
    : screenSharer;

  // 1. PINNED OR SCREEN SHARING VIEW
  if (pinnedUser) {
    const filmstripParticipants = allParticipants.filter(p => p.socketId !== pinnedUser.socketId);

    return (
      <div className="flex-1 w-full h-full flex flex-col lg:flex-row p-2 sm:p-4 gap-2 sm:gap-3 min-h-0 overflow-hidden">
        {/* Main Stage (Pinned Speaker or Screen Share) */}
        <div className="flex-1 w-full h-full min-h-0 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full max-w-7xl max-h-full aspect-video flex items-center justify-center">
            <VideoTile
              stream={pinnedUser.stream}
              name={pinnedUser.name}
              isLocal={pinnedUser.isLocal}
              audioEnabled={pinnedUser.audioEnabled}
              videoEnabled={pinnedUser.videoEnabled}
              isScreenShare={pinnedUser.isScreenShare}
              isHost={pinnedUser.isHost}
              isPinned={true}
              onPin={() => onPinSocketId && onPinSocketId(null)}
            />
          </div>
        </div>

        {/* Filmstrip of other attendees */}
        {filmstripParticipants.length > 0 && (
          <div className="lg:w-64 xl:w-72 h-32 lg:h-full flex lg:flex-col gap-2 sm:gap-2.5 overflow-x-auto lg:overflow-y-auto shrink-0 pb-1 lg:pb-0">
            {filmstripParticipants.map((p) => (
              <div key={p.socketId} className="h-full lg:h-44 aspect-video shrink-0">
                <VideoTile
                  stream={p.stream}
                  name={p.name}
                  isLocal={p.isLocal}
                  audioEnabled={p.audioEnabled}
                  videoEnabled={p.videoEnabled}
                  isScreenShare={p.isScreenShare}
                  isHost={p.isHost}
                  isPinned={false}
                  onPin={() => onPinSocketId && onPinSocketId(p.socketId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. SOLO VIEW (Only local user in room)
  if (totalCount === 1) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden relative">
        <div className="w-full max-w-3xl h-[65vh] sm:h-[72vh] flex items-center justify-center">
          <VideoTile
            stream={localParticipant.stream}
            name={localParticipant.name}
            isLocal={true}
            audioEnabled={localParticipant.audioEnabled}
            videoEnabled={localParticipant.videoEnabled}
            isScreenShare={false}
            isHost={localParticipant.isHost}
          />
        </div>

        {/* Floating Invite Card */}
        {onCopyInvite && (
          <div className="mt-4 flex items-center gap-3 bg-[#0d1222]/90 backdrop-blur-xl border border-slate-700/80 px-4 sm:px-5 py-2.5 rounded-2xl shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="size-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UsersIcon className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white">You're the only one here</p>
              <p className="text-[11px] text-slate-400">Share conference link to let others join</p>
            </div>
            <button
              onClick={onCopyInvite}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              {copiedInvite ? <CheckIcon className="w-3.5 h-3.5 text-emerald-300" /> : <CopyIcon className="w-3.5 h-3.5" />}
              <span>{copiedInvite ? "Link Copied!" : "Copy Meeting Link"}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. TWO PARTICIPANTS (1 on 1 Split Gallery)
  if (totalCount === 2) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        <div className="w-full h-full max-w-6xl max-h-[82vh] grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center">
          {allParticipants.map((p) => (
            <div key={p.socketId} className="w-full h-full aspect-video flex items-center justify-center">
              <VideoTile
                stream={p.stream}
                name={p.name}
                isLocal={p.isLocal}
                audioEnabled={p.audioEnabled}
                videoEnabled={p.videoEnabled}
                isScreenShare={p.isScreenShare}
                isHost={p.isHost}
                isPinned={false}
                onPin={() => onPinSocketId && onPinSocketId(p.socketId)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. MULTI PARTICIPANTS GRID (3+)
  const getGridClass = () => {
    if (totalCount <= 4) return "grid-cols-1 sm:grid-cols-2 max-w-5xl max-h-[82vh]";
    if (totalCount <= 6) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl max-h-[85vh]";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-7xl max-h-[88vh]";
  };

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className={`w-full h-full grid gap-3 sm:gap-4 ${getGridClass()} aspect-video transition-all duration-300 items-center justify-center`}>
        {allParticipants.map((p) => (
          <div key={p.socketId} className="w-full h-full min-h-[180px] flex items-center justify-center">
            <VideoTile
              stream={p.stream}
              name={p.name}
              isLocal={p.isLocal}
              audioEnabled={p.audioEnabled}
              videoEnabled={p.videoEnabled}
              isScreenShare={p.isScreenShare}
              isHost={p.isHost}
              isPinned={false}
              onPin={() => onPinSocketId && onPinSocketId(p.socketId)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
