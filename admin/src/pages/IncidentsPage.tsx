import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import TopBar from '../components/TopBar';
import { TableSkeleton } from '../components/Skeleton';
import { SeverityBadge, StatusBadge } from '../components/Badge';
import ConfirmModal from '../components/ConfirmModal';
import { incidentsApi } from '../api/endpoints';
import type { Incident } from '../types';
import { useAuth } from '../context/AuthContext';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const CreateIncidentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', severity: 'MEDIUM' });

  const mutation = useMutation({
    mutationFn: () => incidentsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident created successfully');
      onClose();
    },
    onError: () => toast.error('Failed to create incident'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#16161f] p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold text-white mb-5">Create New Incident</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Database connection failure"
              className="w-full rounded-lg border border-white/8 bg-[#111118] px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the incident in detail..."
              rows={4}
              className="w-full rounded-lg border border-white/8 bg-[#111118] px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Severity *</label>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITIES.map((sev) => (
                <button
                  key={sev}
                  onClick={() => setForm(f => ({ ...f, severity: sev }))}
                  className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                    form.severity === sev
                      ? sev === 'CRITICAL'
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : sev === 'HIGH'
                        ? 'border-red-500 bg-red-500/15 text-red-400'
                        : sev === 'MEDIUM'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                        : 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                      : 'border-white/8 text-zinc-500 hover:border-white/15'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.title || !form.description || mutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Creating...' : 'Create Incident'}
          </button>
        </div>
      </div>
    </div>
  );
};

const IncidentsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState<Incident | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', search, statusFilter, page],
    queryFn: () =>
      incidentsApi.getAll({ search, status: statusFilter || undefined, page, limit: 15 }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => incidentsApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident closed successfully');
      setCloseConfirm(null);
    },
    onError: () => toast.error('Failed to close incident'),
  });

  const totalPages = Math.ceil((data?.total || 0) / 15);

  return (
    <div>
      <TopBar title="Incidents" subtitle={`${data?.total || 0} total incidents`} />
      <div className="space-y-4 p-4 sm:p-6">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full min-w-[200px] max-w-sm sm:flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-white/8 bg-[#16161f] py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-white/8 bg-[#16161f] px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-indigo-500/50 transition-all"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 sm:ml-auto"
            >
              <Plus size={15} />
              Create Incident
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#16161f]">
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={5} cols={5} /></div>
          ) : data?.incidents?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <AlertTriangle size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No incidents found</p>
            </div>
          ) : (
            <table className="min-w-[780px] w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Incident</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Severity</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Created By</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.incidents?.map((incident: Incident) => (
                  <tr key={incident._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{incident.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 max-w-[250px] truncate">{incident.description}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={incident.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={incident.createdBy?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(incident.createdBy?.name || 'A')}&background=6366f1&color=fff&size=24`}
                          alt=""
                          className="h-6 w-6 rounded-full"
                        />
                        <span className="text-sm text-zinc-400">{incident.createdBy?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-zinc-500">
                        {new Date(incident.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isAdmin && incident.status === 'OPEN' ? (
                        <button
                          onClick={() => setCloseConfirm(incident)}
                          className="flex items-center gap-1.5 rounded-lg bg-zinc-500/10 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <X size={12} /> Close
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Page {page} of {totalPages} · {data?.total} total
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 disabled:opacity-30 transition-colors">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 disabled:opacity-30 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateIncidentModal onClose={() => setShowCreate(false)} />}

      <ConfirmModal
        isOpen={!!closeConfirm}
        title="Close Incident"
        description={`Close incident "${closeConfirm?.title}"? This action will mark it as resolved.`}
        confirmLabel="Close Incident"
        confirmVariant="warning"
        onConfirm={() => closeConfirm && closeMutation.mutate(closeConfirm._id)}
        onCancel={() => setCloseConfirm(null)}
        isLoading={closeMutation.isPending}
      />
    </div>
  );
};

export default IncidentsPage;
