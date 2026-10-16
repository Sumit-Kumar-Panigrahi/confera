import React, { useEffect } from 'react';
import { SignUp, SignIn, useUser } from '@clerk/react';
import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { VideoIcon, ShieldCheckIcon, ZapIcon, GlobeIcon } from 'lucide-react';

const Login = ({ mode = "login" }) => {
  const isRegister = mode === "register";
  const { isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract redirect url if user was trying to join a meeting or access another page
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard';

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate(redirectUrl, { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate, redirectUrl]);

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectUrl} replace />;
  }

  const loginParam = redirectUrl !== '/dashboard' ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : '';

  return (
    <div className="min-h-screen w-full bg-[#0c0f17] text-slate-100 flex flex-col justify-between items-center p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Ambient Relatable Brand Glows (matches Confera Dark Palette) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-10 size-[400px] bg-blue-600/8 blur-[130px] pointer-events-none" />

      {/* Top Confera Brand Header */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-[#11141d] rounded-[14px] flex items-center justify-center">
              <VideoIcon className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div className="text-left">
            <span className="text-xl font-black tracking-tight text-white flex items-center">
              CONFERA<span className="text-indigo-500 font-black">.</span>
            </span>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Video Workspace</p>
          </div>
        </Link>

        <Link 
          to="/" 
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-full border border-slate-800 hover:border-slate-700 bg-slate-900/60"
        >
          Return to Home
        </Link>
      </header>

      {/* Main Authentication Box */}
      <main className="w-full flex flex-col items-center justify-center py-6 z-10">
        <div className="w-full flex justify-center">
          {isRegister ? (
            <SignUp 
              routing="path" 
              path="/register" 
              signInUrl={`/login${loginParam}`}
              fallbackRedirectUrl={redirectUrl}
              forceRedirectUrl={redirectUrl}
            />
          ) : (
            <SignIn 
              routing="path" 
              path="/login" 
              signUpUrl={`/register${loginParam}`}
              fallbackRedirectUrl={redirectUrl}
              forceRedirectUrl={redirectUrl}
            />
          )}
        </div>
      </main>

      {/* Footer Trust Badges */}
      <footer className="w-full max-w-3xl flex flex-wrap items-center justify-center gap-6 py-4 text-[11px] text-slate-500 font-medium z-10 border-t border-slate-900">
        <div className="flex items-center gap-1.5">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-Bit Peer-to-Peer Encryption</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <ZapIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sub-45ms Low-Latency Cloud</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <GlobeIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Universal Browser WebRTC</span>
        </div>
      </footer>

    </div>
  );
};

export default Login;