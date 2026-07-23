import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, AlertTriangle, Bell, TrendingUp, ShieldAlert, ArrowUpRight } from 'lucide-react';
import TopBar from '../components/TopBar';
import { CardSkeleton } from '../components/Skeleton';
import { SeverityBadge, StatusBadge } from '../components/Badge';
import { usersApi, incidentsApi, notificationsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const formatTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
  badgeClass: string;
}> = ({ icon: Icon, label, value, sub, accent, badgeClass }) => (
  <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all duration-300 hover:border-white/20">
    <div className={`absolute -right-7 -top-7 h-24 w-24 rounded-full blur-3xl opacity-25 ${accent}`} />
    <div className="relative z-10 flex h-full flex-col justify-between">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-400">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 ${badgeClass}`}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
          <ArrowUpRight size={14} className="text-zinc-500 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
        </div>
        {sub && <p className="mt-2 text-sm text-zinc-400">{sub}</p>}
      </div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ['users', 'pending'],
    queryFn: () => usersApi.getPending({ limit: 5 }).then((r) => r.data),
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  const { data: incidentsData, isLoading: loadingIncidents } = useQuery({
    queryKey: ['incidents', 'recent'],
    queryFn: () => incidentsApi.getAll({ limit: 5 }).then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: notificationsData, isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationsApi.getAll({ limit: 5 }).then((r) => r.data),
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  const { data: approvedData } = useQuery({
    queryKey: ['users', 'approved'],
    queryFn: () => usersApi.getApproved().then((r) => r.data),
    enabled: isAdmin,
  });

  const openIncidents = incidentsData?.incidents?.filter((i: any) => i.status === 'OPEN') || [];
  const criticalIncidents = openIncidents.filter((i: any) => i.severity === 'CRITICAL');

  return (
    <div className="min-h-screen bg-transparent pb-10 text-zinc-100">
      <TopBar
        title={isAdmin ? 'System Overview' : 'Incident Feed'}
        subtitle={isAdmin ? 'Real-time incident and access telemetry' : 'Live system incidents and alert updates'}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Stat Cards Grid — Only visible to ADMIN */}
        {isAdmin && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loadingPending ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              <>
                <StatCard
                  icon={Users}
                  label="Pending Users"
                  value={pendingData?.total ?? 0}
                  sub="Requires admin review"
                  accent="bg-amber-500"
                  badgeClass="bg-amber-500/10 text-amber-400"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Approved Members"
                  value={approvedData?.total ?? 0}
                  sub="Active system users"
                  accent="bg-emerald-500"
                  badgeClass="bg-emerald-500/10 text-emerald-400"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Active Incidents"
                  value={openIncidents.length}
                  sub="Currently open events"
                  accent="bg-rose-500"
                  badgeClass="bg-rose-500/10 text-rose-400"
                />
                <StatCard
                  icon={ShieldAlert}
                  label="Critical Priority"
                  value={criticalIncidents.length}
                  sub="Immediate action required"
                  accent="bg-orange-500"
                  badgeClass="bg-orange-500/10 text-orange-400"
                />
              </>
            )}
          </div>
        )}

        {/* Recent Data Sections */}
        <div className={`grid grid-cols-1 gap-6 ${isAdmin ? 'xl:grid-cols-2' : 'xl:grid-cols-1'}`}>
          {/* Recent Incidents Card */}
          <div className="flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1320]/85 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                  <AlertTriangle size={14} />
                </div>
                <h3 className="text-sm font-semibold text-white">Recent Incidents</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-400">
                {incidentsData?.incidents?.length || 0} total
              </span>
            </div>

            <div className="flex-1 divide-y divide-white/5 overflow-y-auto">
              {loadingIncidents ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/5" />
                  ))}
                </div>
              ) : incidentsData?.incidents?.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
                  <AlertTriangle size={30} className="mb-2 opacity-30" />
                  <p className="text-sm font-medium">No incidents reported</p>
                </div>
              ) : (
                incidentsData?.incidents?.slice(0, 5).map((incident: any) => (
                  <div key={incident._id} className="flex items-center justify-between px-6 py-3.5 transition-all hover:bg-white/[0.03]">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="truncate text-sm font-semibold text-zinc-200">{incident.title}</p>
                      <p className="mt-1 text-[12px] font-medium text-zinc-500">{formatTime(incident.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <SeverityBadge severity={incident.severity} />
                      <StatusBadge status={incident.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Notifications Card — Only visible to ADMIN */}
          {isAdmin && (
            <div className="flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1320]/85 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                    <Bell size={14} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Recent Notifications</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-400">
                  Telegram stream
                </span>
              </div>

              <div className="flex-1 divide-y divide-white/5 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="space-y-3 p-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded-2xl bg-white/5" />
                    ))}
                  </div>
                ) : notificationsData?.notifications?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
                    <Bell size={30} className="mb-2 opacity-30" />
                    <p className="text-sm font-medium">No notification logs recorded</p>
                  </div>
                ) : (
                  notificationsData?.notifications?.slice(0, 5).map((notif: any) => (
                    <div key={notif._id} className="flex items-center justify-between px-4 py-3.5 transition-all hover:bg-white/3 sm:px-6">
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="truncate text-sm font-semibold text-zinc-200">{notif.userId?.name || 'System Recipient'}</p>
                        <p className="mt-1 text-[12px] font-medium text-zinc-500">{notif.type?.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={notif.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
