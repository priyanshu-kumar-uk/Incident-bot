import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import TopBar from '../components/TopBar';
import { TableSkeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/Badge';
import { notificationsApi } from '../api/endpoints';
import type { Notification } from '../types';

const typeColors: Record<string, string> = {
  APPROVAL: 'text-blue-400',
  INCIDENT: 'text-amber-400',
  CRITICAL_INCIDENT: 'text-red-400',
};

const NotificationsPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationsApi.getAll({ page, limit: 20 }).then((r) => r.data),
    placeholderData: (prev) => prev,
    refetchInterval: 15000,
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div>
      <TopBar title="Notification History" subtitle={`${data?.total || 0} total notifications`} />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#16161f]">
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={6} cols={6} /></div>
          ) : data?.notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Bell size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <table className="min-w-[820px] w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Incident</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Channel</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Retries</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.notifications?.map((notif: Notification) => (
                  <tr key={notif._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{notif.userId?.name}</p>
                        <p className="text-xs text-zinc-500">{notif.userId?.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium ${typeColors[notif.type] || 'text-zinc-400'}`}>
                        {notif.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {notif.incidentId ? (
                        <p className="text-sm text-zinc-400 max-w-[150px] truncate">{notif.incidentId.title}</p>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-blue-400">📱 {notif.channel}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={notif.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm ${notif.retryCount > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {notif.retryCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-zinc-500">
                        {notif.sentAt ? new Date(notif.sentAt).toLocaleString() : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 disabled:opacity-30 transition-colors">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 disabled:opacity-30 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
