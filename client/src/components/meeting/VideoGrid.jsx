import React from 'react';
import VideoTile from './VideoTile';

const VideoGrid = ({ 
  localStream, 
  localUser, 
  remoteUsers = [], 
  audioEnabled, 
  videoEnabled,
  isScreenSharing = false 
}) => {
  const totalParticipants = 1 + remoteUsers.length;

  // Screen Sharing Stage View
  if (isScreenSharing) {
    return (
      <div className="flex-1 w-full h-full flex flex-col p-3 sm:p-4 gap-3 overflow-hidden">
        {/* Main Stage (Shared Screen / Presenter) */}
        <div className="flex-1 w-full min-h-0 flex items-center justify-center">
          <div className="w-full h-full max-w-6xl max-h-full aspect-video">
            <VideoTile
              stream={localStream}
              name={`${localUser?.fullName || localUser?.name || "You"} (Screen Share)`}
              isLocal={true}
              audioEnabled={audioEnabled}
              videoEnabled={true}
              isScreenShare={true}
            />
          </div>
        </div>

        {/* Thumbnail Filmstrip */}
        <div className="h-28 sm:h-36 w-full flex items-center justify-center gap-3 overflow-x-auto pb-1 shrink-0">
          {/* Local User Mini Camera Tile */}
          <div className="h-full aspect-video shrink-0">
            <VideoTile
              stream={localStream}
              name={localUser?.fullName || localUser?.name || "You"}
              isLocal={true}
              audioEnabled={audioEnabled}
              videoEnabled={videoEnabled}
            />
          </div>

          {/* Remote Users Mini Tiles */}
          {remoteUsers.map((remote) => (
            <div key={remote.socketId} className="h-full aspect-video shrink-0">
              <VideoTile
                stream={remote.stream}
                name={remote.userName}
                isLocal={false}
                audioEnabled={remote.audioEnabled}
                videoEnabled={remote.videoEnabled}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Gallery View grid column sizing
  const getGridClass = () => {
    if (totalParticipants === 1) return "grid-cols-1 max-w-3xl max-h-[75vh]";
    if (totalParticipants === 2) return "grid-cols-1 md:grid-cols-2 max-w-5xl max-h-[78vh]";
    if (totalParticipants <= 4) return "grid-cols-1 sm:grid-cols-2 max-w-5xl max-h-[82vh]";
    if (totalParticipants <= 6) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl max-h-[85vh]";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-7xl max-h-[88vh]";
  };

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className={`w-full h-full grid gap-4 ${getGridClass()} aspect-video transition-all duration-300 items-center justify-center`}>
        {/* Local User Tile */}
        <VideoTile
          stream={localStream}
          name={localUser?.fullName || localUser?.name || "You"}
          isLocal={true}
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          isScreenShare={false}
        />

        {/* Remote Users Tiles */}
        {remoteUsers.map((remote) => (
          <VideoTile
            key={remote.socketId}
            stream={remote.stream}
            name={remote.userName}
            isLocal={false}
            audioEnabled={remote.audioEnabled}
            videoEnabled={remote.videoEnabled}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
