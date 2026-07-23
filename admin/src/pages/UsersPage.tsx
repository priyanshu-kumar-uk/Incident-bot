import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Search, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import TopBar from '../components/TopBar';
import { TableSkeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/Badge';
import ConfirmModal from '../components/ConfirmModal';
import { usersApi } from '../api/endpoints';
import type { User } from '../types';

interface UsersTableProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  title: string;
  showActions?: boolean;
}

const UsersTable: React.FC<UsersTableProps> = ({ status, title, showActions = false }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ type: 'approve' | 'reject'; user: User } | null>(null);
  const queryClient = useQueryClient();

  const fetchFn = status === 'PENDING' ? usersApi.getPending : status === 'APPROVED' ? usersApi.getApproved : usersApi.getRejected;

  const { data, isLoading } = useQuery({
    queryKey: ['users', status.toLowerCase(), search, page],
    queryFn: () => fetchFn({ search, page, limit: 15 }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => usersApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User approved successfully');
      setConfirm(null);
    },
    onError: () => toast.error('Failed to approve user'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => usersApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.error('User rejected');
      setConfirm(null);
    },
    onError: () => toast.error('Failed to reject user'),
  });

  const totalPages = Math.ceil((data?.total || 0) / 15);

  return (
    <div>
      <TopBar title={title} subtitle={`${data?.total || 0} total users`} />
      <div className="space-y-4 p-4 sm:p-6">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-white/8 bg-[#16161f] py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#16161f]">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : data?.users?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <UserCircle size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No {status.toLowerCase()} users found</p>
            </div>
          ) : (
            <table className="min-w-[760px] w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Telegram</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Joined</th>
                  {showActions && <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.users?.map((user: User) => {
                  const uid = (user._id || user.id)!;
                  return (
                  <tr key={uid} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=32`}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium text-zinc-200">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-zinc-400">{user.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {user.telegramConnected ? (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <Check size={12} /> Connected
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">Not connected</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-zinc-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    {showActions && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfirm({ type: 'approve', user })}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => setConfirm({ type: 'reject', user })}
                            className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Showing {((page - 1) * 15) + 1} - {Math.min(page * 15, data?.total || 0)} of {data?.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirm}
        title={confirm?.type === 'approve' ? 'Approve User' : 'Reject User'}
        description={
          confirm?.type === 'approve'
            ? `Approve access for ${confirm?.user?.name}? They will receive a Telegram notification.`
            : `Reject ${confirm?.user?.name}'s access request? This can be reversed later.`
        }
        confirmLabel={confirm?.type === 'approve' ? 'Approve' : 'Reject'}
        confirmVariant={confirm?.type === 'approve' ? 'success' : 'danger'}
        onConfirm={() => {
          if (!confirm) return;
          const uid = (confirm.user._id || confirm.user.id)!;
          if (confirm.type === 'approve') approveMutation.mutate(uid);
          else rejectMutation.mutate(uid);
        }}
        onCancel={() => setConfirm(null)}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
      />
    </div>
  );
};

export const PendingUsersPage = () => <UsersTable status="PENDING" title="Pending Users" showActions />;
export const ApprovedUsersPage = () => <UsersTable status="APPROVED" title="Approved Users" />;
export const RejectedUsersPage = () => <UsersTable status="REJECTED" title="Rejected Users" />;
