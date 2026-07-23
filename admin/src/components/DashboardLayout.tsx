import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useSocket } from '../hooks/useSocket';

const DashboardLayout: React.FC = () => {
  useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_20%),#04070d]">
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#0a0f1a]/90 text-white shadow-lg shadow-black/20 backdrop-blur md:hidden"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      <Sidebar isMobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
