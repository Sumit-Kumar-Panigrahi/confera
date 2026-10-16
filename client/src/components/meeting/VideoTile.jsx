import React, { useEffect, useRef, useState } from 'react';
import { 
  MicOffIcon, 
  UserIcon, 
  VideoOffIcon, 
  MonitorUpIcon, 
  PinIcon, 
  CrownIcon,
  Maximize2Icon,
  Volume2Icon
} from 'lucide-react';

const VideoTile = ({ 
  stream, 
  name, 
  isLocal = false, 
  audioEnabled = true, 
  videoEnabled = true,
  isScreenShare = false,
  isHost = false,
  isSpeaking = false,
  isPinned = false,
  onPin
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStreamTracks, setHasStreamTracks] = useState(false);

  // Check if stream has active video track
  const checkVideoTrack = () => {
    if (!stream) return false;
    const tracks = stream.getVideoTracks();
    return tracks.length > 0 && tracks.some(t => t.readyState === 'live' && t.enabled);
  };

  const hasLiveVideo = Boolean(videoEnabled && checkVideoTrack());

  // Attach and play stream whenever stream changes or videoEnabled changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // React bug workaround: explicitly set DOM muted property
    video.muted = isLocal;

    if (stream) {
      video.srcObject = stream;
      setHasStreamTracks(stream.getVideoTracks().length > 0);

      const playVideo = () => {
        video.play().catch((err) => {
          // Autoplay policy: if unmuted autoplay is blocked for remote video, mute and retry
          if (!isLocal && err.name === 'NotAllowedError') {
            console.warn("Autoplay blocked, attempting muted play:", err);
            video.muted = true;
            video.play().catch((e) => console.warn("Muted play failed:", e));
          }
        });
      };

      video.onloadedmetadata = () => {
        playVideo();
      };

      // In case metadata is already loaded
      playVideo();

      // Listen to track unmute events (WebRTC first packet arrival)
      const tracks = stream.getTracks();
      const handleUnmute = () => {
        setHasStreamTracks(true);
        playVideo();
      };

      tracks.forEach((t) => {
        t.addEventListener('unmute', handleUnmute);
      });

      return () => {
        tracks.forEach((t) => {
          t.removeEventListener('unmute', handleUnmute);
        });
      };
    } else {
      video.srcObject = null;
      setHasStreamTracks(false);
    }
  }, [stream, isLocal]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  const displayName = name || (isLocal ? "You" : "Participant");
  const initial = displayName.replace('(You)', '').trim().charAt(0).toUpperCase() || 'U';

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full min-h-[180px] bg-[#0c101c] rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-300 flex items-center justify-center group shadow-xl select-none ${
        isSpeaking 
          ? 'border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-emerald-500/20' 
          : isPinned 
            ? 'border-indigo-500/80 ring-2 ring-indigo-500/30' 
            : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Video element - muted for local, active for remote */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          hasLiveVideo ? "opacity-100" : "opacity-0 pointer-events-none absolute"
        } ${isLocal && !isScreenShare ? "-scale-x-100" : ""}`}
      />

      {/* Camera Off Placeholder (Rendered whenever camera is off OR stream has no video) */}
      {!hasLiveVideo && (
        <div className="flex flex-col items-center justify-center space-y-3 z-10 p-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 p-0.5 shadow-xl shadow-indigo-600/25 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#0d1222] flex items-center justify-center text-white text-xl sm:text-2xl font-black uppercase tracking-wider">
              {initial || <UserIcon className="w-7 h-7 text-indigo-400" />}
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700/80 flex items-center gap-1.5 shadow-sm">
            <VideoOffIcon className="w-3 h-3 text-rose-400" />
            {isScreenShare ? "Screen share paused" : "Camera off"}
          </span>
        </div>
      )}

      {/* Top Action Hover Icons (Pin, Fullscreen) */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-30">
        {onPin && (
          <button
            onClick={onPin}
            className={`p-1.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
              isPinned 
                ? 'bg-indigo-600 text-white border-indigo-400' 
                : 'bg-black/60 text-slate-300 hover:text-white border-white/10 hover:bg-black/80'
            }`}
            title={isPinned ? "Unpin video" : "Pin video to stage"}
          >
            <PinIcon className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
          title="Fullscreen"
        >
          <Maximize2Icon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Name & Status Overlay Bar */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
        
        {/* Name pill */}
        <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-xl border border-white/10 text-xs font-semibold text-white shadow-lg">
          {isScreenShare && (
            <MonitorUpIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span className="truncate max-w-[120px] sm:max-w-[180px]">
            {displayName}
          </span>
          {isHost && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold shrink-0">
              <CrownIcon className="w-2.5 h-2.5 text-amber-400" /> Host
            </span>
          )}
        </div>

        {/* Right audio icon indicator */}
        <div className="flex items-center gap-1">
          {audioEnabled ? (
            <div className="bg-black/70 backdrop-blur-md p-1.5 rounded-lg border border-white/10 text-emerald-400 flex items-center">
              <Volume2Icon className="w-3 h-3" />
            </div>
          ) : (
            <div className="bg-rose-600/90 backdrop-blur-md p-1.5 rounded-lg border border-rose-500/40 text-white flex items-center" title="Microphone Muted">
              <MicOffIcon className="w-3 h-3" />
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default VideoTile;
