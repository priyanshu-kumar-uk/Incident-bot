import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback: React.FC = () => {
  const { refetchUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Cookie is set by backend on redirect
    refetchUser();
    navigate('/dashboard', { replace: true });
  }, [refetchUser, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Authenticating with Cookie...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
