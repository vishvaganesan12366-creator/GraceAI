import type { Complaint, ComplaintPriority, ComplaintStatus, SLARisk } from '@/types';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export interface SLAStatus {
  remainingMs: number;
  remainingText: string;
  isViolated: boolean;
  risk: SLARisk;
  percentUsed: number;
}

export function calculateSLAStatus(complaint: Pick<Complaint, 'sla_deadline' | 'sla_hours' | 'created_at' | 'status'>): SLAStatus {
  if (complaint.status === 'Resolved' || complaint.status === 'Closed') {
    return { remainingMs: 0, remainingText: 'Resolved', isViolated: false, risk: 'LOW', percentUsed: 100 };
  }

  if (!complaint.sla_deadline) {
    return { remainingMs: 0, remainingText: 'N/A', isViolated: false, risk: 'LOW', percentUsed: 0 };
  }

  const deadline = new Date(complaint.sla_deadline).getTime();
  const created = new Date(complaint.created_at).getTime();
  const now = Date.now();
  const remainingMs = deadline - now;
  const totalMs = deadline - created;
  const percentUsed = totalMs > 0 ? Math.min(((now - created) / totalMs) * 100, 100) : 100;
  const isViolated = remainingMs < 0;

  if (isViolated) {
    const overMs = Math.abs(remainingMs);
    const overHours = Math.floor(overMs / (1000 * 60 * 60));
    const overMins = Math.floor((overMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      remainingMs,
      remainingText: `Overdue by ${overHours}h ${overMins}m`,
      isViolated: true,
      risk: 'HIGH',
      percentUsed,
    };
  }

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const remainingText = `${hours}h ${minutes}m ${seconds}s`;

  let risk: SLARisk = 'LOW';
  if (percentUsed >= 80) risk = 'HIGH';
  else if (percentUsed >= 50) risk = 'MEDIUM';

  return { remainingMs, remainingText, isViolated, risk, percentUsed };
}

export function getPriorityColor(priority: ComplaintPriority): string {
  switch (priority) {
    case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'LOW': return 'text-green-400 bg-green-500/10 border-green-500/20';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
}

export function getStatusColor(status: ComplaintStatus): string {
  switch (status) {
    case 'Submitted': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'AI Classified': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    case 'Department Assigned': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    case 'Officer Assigned': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    case 'In Progress': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'Requesting Information': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'Resolved': return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'Escalated': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'Closed': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
}

export function getRiskColor(risk: SLARisk): string {
  switch (risk) {
    case 'HIGH': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'LOW': return 'text-green-400 bg-green-500/10 border-green-500/20';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
}

export function getRiskDot(risk: SLARisk): string {
  switch (risk) {
    case 'HIGH': return 'bg-red-500';
    case 'MEDIUM': return 'bg-yellow-500';
    case 'LOW': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

export function generateComplaintNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 89999);
  return `GRV-${year}-${random}`;
}

export function shortenText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + '...';
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
