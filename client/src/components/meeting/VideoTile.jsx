import React, { useEffect, useRef } from 'react';
import { MicOffIcon, UserIcon, VideoOffIcon, MonitorUpIcon } from 'lucide-react';

const VideoTile = ({ 
  stream, 
  name, 
  isLocal = false, 
  audioEnabled = true, 
  videoEnabled = true,
  isScreenShare = false,
  isSpeaking = false
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const displayName = name || (isLocal ? "You" : "Participant");
  const initial = displayName.replace('(You)', '').trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className={`relative w-full h-full min-h-[220px] bg-slate-900 rounded-3xl overflow-hidden border transition-all duration-300 flex items-center justify-center group shadow-md ${
      isSpeaking ? 'border-primary ring-4 ring-primary/30 shadow-primary/20' : 'border-slate-800'
    }`}>

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          videoEnabled ? "opacity-100" : "opacity-0 pointer-events-none absolute"
        } ${isLocal && !isScreenShare ? "-scale-x-100" : ""}`}
      />

      {/* Camera Off Placeholder */}
      {!videoEnabled && (
        <div className="flex flex-col items-center justify-center space-y-3 z-10 p-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-0.5 shadow-xl shadow-primary/20 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold uppercase tracking-wider">
              {initial || <UserIcon className="w-8 h-8 text-primary-light" />}
            </div>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60 flex items-center gap-1.5 shadow-sm">
            <VideoOffIcon className="w-3.5 h-3.5 text-rose-400" />
            Camera Off
          </span>
        </div>
      )}

      {/* Bottom Info Bar Overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs font-medium text-white shadow-lg">
          {isScreenShare && <MonitorUpIcon className="w-3.5 h-3.5 text-emerald-400" />}
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            {displayName}
          </span>
          {!audioEnabled && (
            <span className="p-1 rounded-md bg-rose-500/25 text-rose-300 border border-rose-500/40" title="Muted">
              <MicOffIcon className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Live Audio indicator when active */}
        {audioEnabled && (
          <div className="hidden group-hover:flex items-center gap-0.5 bg-slate-900/80 px-2 py-1.5 rounded-lg border border-white/10">
            <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-pulse delay-75" />
            <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
          </div>
        )}
      </div>

    </div>
  );
};

export default VideoTile;
