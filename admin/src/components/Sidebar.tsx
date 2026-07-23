import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Bell,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { telegramApi } from '../api/endpoints';
import { toast } from 'sonner';

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users/pending', icon: Users, label: 'Pending Users', adminOnly: true },
  { to: '/users/approved', icon: UserCheck, label: 'Approved Users', adminOnly: true },
  { to: '/users/rejected', icon: UserX, label: 'Rejected Users', adminOnly: true },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/audit-logs', icon: FileText, label: 'Audit Logs', adminOnly: true },
];

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [connectingTelegram, setConnectingTelegram] = useState(false);
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConnectTelegram = async () => {
    if (user?.telegramConnected) return;
    try {
      setConnectingTelegram(true);
      const res = await telegramApi.getConnectLink();
      if (res.data?.link) {
        window.open(res.data.link, '_blank');
        toast.info('Telegram link opened! Send /start to connect.');
      } else if (res.data?.error) {
        toast.error(res.data.error);
      }
    } catch {
      toast.error('Failed to generate Telegram connect link.');
    } finally {
      setConnectingTelegram(false);
    }
  };

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const isTelegramLinked = !!user?.telegramConnected;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-white/10 bg-[#0a0f1a]/95 backdrop-blur-xl transition-all duration-300 ease-in-out select-none ${
          collapsed ? 'w-20' : 'w-[82vw] sm:w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:static md:w-64`}
      >
      {/* Brand Logo Header */}
      <div className={`flex items-center gap-3 border-b border-white/10 px-3 py-4 transition-all duration-300 ease-in-out ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-600/90 shadow-[0_0_25px_rgba(99,102,241,0.35)]">
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden transition-all duration-300">
            <p className="truncate text-sm font-semibold tracking-tight text-white">IncidentHub</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-400">
              {isAdmin ? 'Admin Console' : 'User Portal'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3 sm:px-3">
        {filteredNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl border px-2.5 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out ${
                collapsed ? 'justify-center px-2' : ''
              } ${
                isActive
                  ? 'border-indigo-500/35 bg-indigo-600/20 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.12)]'
                  : 'border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/5 hover:text-zinc-200'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Telegram Connection CTA */}
      <div className="border-t border-white/10 px-2 py-3 sm:px-3">
        <button
          onClick={handleConnectTelegram}
          disabled={connectingTelegram || isTelegramLinked}
          className={`flex w-full items-center gap-2 rounded-2xl border px-2.5 py-2.5 text-xs font-semibold transition-all duration-300 ease-in-out ${
            collapsed ? 'justify-center px-2' : ''
          } ${
            isTelegramLinked
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 cursor-not-allowed opacity-90'
              : 'border-indigo-500/30 bg-indigo-600/15 text-indigo-200 hover:bg-indigo-600/25 active:scale-[0.98]'
          }`}
          title={isTelegramLinked ? 'Telegram Account Linked' : 'Connect Telegram Bot'}
        >
          {isTelegramLinked ? (
            <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
          ) : (
            <Send size={15} className="shrink-0 text-indigo-300" />
          )}
          {!collapsed && (
            <span className="truncate whitespace-nowrap">
              {isTelegramLinked ? 'Telegram Linked' : 'Connect Telegram'}
            </span>
          )}
        </button>
      </div>

      {/* User Profile & Logout */}
      <div className="border-t border-white/10 p-2 sm:p-3">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2.5 transition-all duration-300">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
              alt={user.name}
              className="h-8 w-8 shrink-0 rounded-full border border-indigo-500/30 object-cover"
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-zinc-200">{user.name}</p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-400">
                {user.role === 'ADMIN' ? 'ADMIN' : `${user.role} • ${user.status}`}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-2 rounded-2xl px-2.5 py-2 text-sm font-medium text-zinc-400 transition-all duration-300 hover:bg-rose-500/10 hover:text-rose-300 ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="whitespace-nowrap truncate">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle Handle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-[#0a0f1a] text-zinc-400 shadow-md transition-all duration-200 hover:scale-110 hover:text-white md:flex"
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
    </>
  );
};

export default Sidebar;
