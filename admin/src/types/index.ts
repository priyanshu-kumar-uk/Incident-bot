export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'ADMIN' | 'USER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  telegramConnected: boolean;
  telegramConnectedAt?: string;
  createdAt: string;
}

export interface Incident {
  _id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'CLOSED';
  createdBy: { name: string; email: string; avatar?: string };
  closedBy?: { name: string; email: string };
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: { name: string; email: string };
  incidentId?: { title: string; severity: string };
  type: 'APPROVAL' | 'INCIDENT' | 'CRITICAL_INCIDENT';
  channel: 'TELEGRAM';
  status: 'PENDING' | 'SENT' | 'FAILED';
  telegramMessageId?: string;
  retryCount: number;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actorId: { name: string; email: string; avatar?: string };
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
