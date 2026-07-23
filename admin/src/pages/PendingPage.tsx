import React, { useEffect } from 'react';
import { Clock, Zap, XCircle } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const PendingPage: React.FC = () => {
  const { user, logout, refetchUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Polling every 5 seconds & WebSocket listeners for real-time status changes
  useEffect(() => {
    if (!user) return;

    // 1. Interval polling
    const interval = setInterval(() => {
      refetchUser();
    }, 5000);

    // 2. WebSocket live listeners
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
    });

    const handleUserUpdate = (data: any) => {
      const targetEmail = data.user?.email;
      const targetId = data.user?._id || data.user?.id;
      const myId = user._id || user.id;

      if (targetEmail === user.email || targetId === myId) {
        refetchUser();
      }
    };

    socket.on('user.approved', handleUserUpdate);
    socket.on('user.rejected', handleUserUpdate);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user, refetchUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If status is APPROVED, redirect to dashboard
  if (user?.status === 'APPROVED') {
    return <Navigate to="/dashboard" replace />;
  }

  const isRejected = user?.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-[#080b11] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none ${
          isRejected ? 'bg-rose-600/10' : 'bg-amber-600/10'
        }`}
      />

      <div className="relative max-w-md w-full text-center">
        <div className="rounded-3xl border border-white/10 bg-[#0f1420]/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl overflow-hidden">
          {/* Top highlight bar */}
          <div
            className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent ${
              isRejected ? 'via-rose-500/50' : 'via-amber-500/50'
            } to-transparent`}
          />

          {/* Status Icon */}
          <div className="flex justify-center mb-5">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ${
                isRejected
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-rose-500/10'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-amber-500/10'
              }`}
            >
              {isRejected ? (
                <XCircle size={32} className="text-rose-400" />
              ) : (
                <Clock size={32} className="text-amber-400 animate-pulse" />
              )}
            </div>
          </div>

          {/* Status Title & Message */}
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {isRejected ? 'Access Request Rejected' : 'Access Pending'}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
            {isRejected
              ? 'Your request for access to IncidentHub has been rejected by an administrator. Please contact your system admin or sign in with an authorized account.'
              : 'Your account has been created. An administrator needs to approve your access before you can enter IncidentHub.'}
          </p>

          {/* User Profile Info Badge */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-6 text-left">
            <div className="flex items-center gap-3">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff`
                }
                alt={user?.name}
                className="h-10 w-10 rounded-full object-cover border border-white/15 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                  isRejected
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {isRejected ? 'REJECTED' : 'PENDING'}
              </span>
            </div>
          </div>

          {!isRejected && (
            <div className="flex items-center gap-2 justify-center text-xs text-zinc-400 mb-6 bg-indigo-500/10 border border-indigo-500/20 py-2.5 px-4 rounded-xl">
              <Zap size={14} className="text-indigo-400 shrink-0" />
              <span>Checking status automatically in real-time...</span>
            </div>
          )}

          <button
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="w-full rounded-xl border border-zinc-700/60 bg-[#161c2c] hover:bg-[#1d253b] px-4 py-3 text-xs font-semibold text-white transition-all duration-200"
          >
            {isRejected ? 'Sign Out & Try Another Account' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingPage;
