import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#080b11] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Stitch Design System - Multi-layered Ambient Light Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Main Card Container */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f1420]/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-2xl sm:p-8 md:p-10">
          {/* Subtle top border highlight gradient */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_0_35px_rgba(99,102,241,0.4)] mb-4 ring-1 ring-indigo-400/30">
              <Zap size={28} className="fill-white/20" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">IncidentHub</h1>
            <p className="text-xs font-medium text-zinc-400 mt-1">Enterprise Admin & Monitoring Platform</p>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0f1420] px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                Identity Authentication
              </span>
            </div>
          </div>

          {/* Google SSO Action Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3.5 rounded-xl border border-zinc-700/60 bg-[#161c2c] hover:bg-[#1d253b] hover:border-indigo-500/50 px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 shadow-lg shadow-black/30 group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="group-hover:text-white transition-colors">Continue with Google Workspace</span>
          </button>

          {/* Access Note */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-400">
            <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
            <span>Invite-only access • Admin verification required</span>
          </div>
        </div>

        {/* Footer Security Tagline */}
        <p className="text-center text-[11px] font-medium text-zinc-400 mt-5">
          Protected by OAuth 2.0 & Role-Based Access Control (RBAC)
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
