import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import TopBar from '../components/TopBar';
import { TableSkeleton } from '../components/Skeleton';
import { auditLogsApi } from '../api/endpoints';
import type { AuditLog } from '../types';

const actionColors: Record<string, string> = {
  USER_APPROVED: 'text-emerald-400 bg-emerald-500/10',
  USER_REJECTED: 'text-red-400 bg-red-500/10',
  INCIDENT_CREATED: 'text-amber-400 bg-amber-500/10',
  INCIDENT_CLOSED: 'text-blue-400 bg-blue-500/10',
  TELEGRAM_CONNECTED: 'text-purple-400 bg-purple-500/10',
};

const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => auditLogsApi.getAll({ page, limit: 20 }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div>
      <TopBar title="Audit Logs" subtitle={`${data?.total || 0} total records`} />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#16161f]">
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={6} cols={5} /></div>
          ) : data?.logs?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <FileText size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No audit logs yet</p>
            </div>
          ) : (
            <table className="min-w-[780px] w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actor</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Entity</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Metadata</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.logs?.map((log: AuditLog) => (
                  <tr key={log._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={log.actorId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.actorId?.name || 'A')}&background=6366f1&color=fff&size=28`}
                          alt=""
                          className="h-7 w-7 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{log.actorId?.name}</p>
                          <p className="text-xs text-zinc-500">{log.actorId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-medium ${actionColors[log.action] || 'text-zinc-400 bg-zinc-500/10'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-zinc-400">{log.entityType}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {log.metadata ? (
                        <code className="text-xs text-zinc-500 bg-white/3 rounded px-2 py-1 max-w-[200px] block truncate">
                          {JSON.stringify(log.metadata)}
                        </code>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-zinc-500">
                        {new Date(log.createdAt).toLocaleString()}
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

export default AuditLogsPage;
