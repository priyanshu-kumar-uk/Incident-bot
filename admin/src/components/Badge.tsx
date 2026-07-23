import React from 'react';

interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'critical' | 'info' | 'default' | 'purple';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

const variantClasses: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
  critical: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  default: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30',
};

const Badge: React.FC<BadgeProps> = ({ variant, children, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    LOW: { variant: 'success', label: '● LOW' },
    MEDIUM: { variant: 'warning', label: '● MEDIUM' },
    HIGH: { variant: 'danger', label: '● HIGH' },
    CRITICAL: { variant: 'critical', label: '🔥 CRITICAL' },
  };
  const config = map[severity] || { variant: 'default', label: severity };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { variant: BadgeProps['variant'] }> = {
    OPEN: { variant: 'danger' },
    CLOSED: { variant: 'success' },
    PENDING: { variant: 'warning' },
    APPROVED: { variant: 'success' },
    REJECTED: { variant: 'danger' },
    SENT: { variant: 'success' },
    FAILED: { variant: 'danger' },
  };
  const config = map[status] || { variant: 'default' };
  return <Badge variant={config.variant}>{status}</Badge>;
};

export default Badge;
