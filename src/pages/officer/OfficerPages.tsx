import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, Clock, Bell, User as UserIcon,
  CheckCircle, AlertTriangle, Activity, Play, MessageSquare,
  ShieldAlert, Search, ChevronRight, XCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { Complaint, Officer, Notification } from '@/types';
import { calculateSLAStatus, getPriorityColor, getStatusColor, getRiskColor, getRiskDot, timeAgo, formatDate, formatDateTime } from '@/lib/utils';
import { LoadingSpinner, EmptyState, ConfirmDialog } from '@/components/ui';

const navItems = [
  { label: 'Overview', path: '/officer', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Assigned Complaints', path: '/officer/complaints', icon: <ListChecks className="w-5 h-5" /> },
  { label: 'SLA Monitor', path: '/officer/sla', icon: <Clock className="w-5 h-5" /> },
  { label: 'Notifications', path: '/officer/notifications', icon: <Bell className="w-5 h-5" /> },
  { label: 'Profile', path: '/officer/profile', icon: <UserIcon className="w-5 h-5" /> },
];

function useOfficerDept() {
  const { user } = useAuth();
  const [officer, setOfficer] = useState<Officer | null>(null);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('officers')
        .select('*, departments:department_id (*)')
        .eq('user_id', user.id)
        .maybeSingle();
      setOfficer(data as Officer | null);
    })();
  }, [user]);
  return officer;
}

export function OfficerDashboard() {
  const { user } = useAuth();
  const officer = useOfficerDept();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!officer) return;
    (async () => {
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('department_id', officer.department_id)
        .order('created_at', { ascending: false });
      setComplaints((data || []) as Complaint[]);
      setLoading(false);
    })();
  }, [officer]);

  if (!user) return null;

  const assigned = complaints.length;
  const dueToday = complaints.filter(c => {
    const sla = calculateSLAStatus(c);
    return !sla.isViolated && c.status !== 'Resolved' && sla.remainingMs < 24 * 60 * 60 * 1000;
  }).length;
  const slaAtRisk = complaints.filter(c => {
    const sla = calculateSLAStatus(c);
    return sla.risk === 'HIGH' && c.status !== 'Resolved';
  }).length;
  const escalated = complaints.filter(c => c.status === 'Escalated').length;

  return (
    <DashboardLayout navItems={navItems} title="Officer Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Assigned Complaints" value={assigned} icon={<ListChecks className="w-5 h-5" />} color="text-cyan-400 bg-cyan-500/10" />
        <StatCard label="Due Today" value={dueToday} icon={<Clock className="w-5 h-5" />} color="text-orange-400 bg-orange-500/10" />
        <StatCard label="SLA At Risk" value={slaAtRisk} icon={<AlertTriangle className="w-5 h-5" />} color="text-red-400 bg-red-500/10" />
        <StatCard label="Escalated" value={escalated} icon={<ShieldAlert className="w-5 h-5" />} color="text-red-400 bg-red-500/10" />
      </div>

      {officer && (
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Department: <span className="text-white font-medium">{officer.departments?.name || 'N/A'}</span></div>
              <div className="text-xs text-slate-500">Zone: {officer.zone} · Status: {officer.status}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : complaints.length === 0 ? (
        <EmptyState icon={<ListChecks className="w-8 h-8" />} title="No complaints assigned" description="Complaints routed to your department will appear here." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-slate-800/50 flex items-center justify-between">
            <h3 className="font-semibold text-white">Active Complaints</h3>
            <Link to="/officer/complaints" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/50 text-xs text-slate-500">
                  <th className="text-left font-medium px-5 py-3">ID</th>
                  <th className="text-left font-medium px-5 py-3">Title</th>
                  <th className="text-left font-medium px-5 py-3">Priority</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">SLA</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 6).map(c => {
                  const sla = calculateSLAStatus(c);
                  return (
                    <tr key={c.id} className="border-b border-slate-800/30 hover:bg-slate-900/30">
                      <td className="px-5 py-3"><Link to={`/officer/complaints/${c.id}`} className="text-xs font-mono text-cyan-400">{c.complaint_number}</Link></td>
                      <td className="px-5 py-3"><Link to={`/officer/complaints/${c.id}`} className="text-sm text-slate-200 hover:text-white">{c.title.length > 35 ? c.title.substring(0, 35) + '...' : c.title}</Link></td>
                      <td className="px-5 py-3"><span className={`badge ${getPriorityColor(c.priority)}`}>{c.priority}</span></td>
                      <td className="px-5 py-3"><span className={`badge ${getStatusColor(c.status)}`}>{c.status}</span></td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className={`badge ${getRiskColor(sla.risk)}`}><span className={`w-1.5 h-1.5 rounded-full ${getRiskDot(sla.risk)}`} />{sla.remainingText}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass-card p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export function OfficerComplaints() {
  const officer = useOfficerDept();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionComplaint, setActionComplaint] = useState<Complaint | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [responseMsg, setResponseMsg] = useState('');

  const loadComplaints = async () => {
    if (!officer) return;
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('department_id', officer.department_id)
      .order('created_at', { ascending: false });
    setComplaints((data || []) as Complaint[]);
    setLoading(false);
  };

  useEffect(() => { if (officer) loadComplaints(); }, [officer]);

  const filtered = complaints.filter(c => {
    const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.complaint_number.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAction = (complaint: Complaint, action: string) => {
    setActionComplaint(complaint);
    setActionType(action);
    setResponseMsg('');
  };

  const confirmAction = async () => {
    if (!actionComplaint || !user) return;
    let newStatus = actionType;
    let message = '';
    switch (actionType) {
      case 'In Progress': message = responseMsg || 'Officer started investigation'; break;
      case 'Requesting Information': message = responseMsg || 'Officer requested additional information'; break;
      case 'Resolved': message = responseMsg || 'Complaint resolved by officer'; break;
      case 'Escalated': message = responseMsg || 'Complaint escalated by officer'; break;
      default: message = responseMsg || 'Status updated';
    }

    const { error } = await supabase.from('complaints').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', actionComplaint.id);
    if (error) { showToast('Failed to update complaint', 'error'); return; }

    await supabase.from('complaint_updates').insert({
      complaint_id: actionComplaint.id,
      updated_by: user.id,
      status: newStatus,
      message,
    });

    await supabase.from('notifications').insert({
      user_id: actionComplaint.user_id,
      complaint_id: actionComplaint.id,
      message: `Your complaint ${actionComplaint.complaint_number} status updated to: ${newStatus}.`,
      type: newStatus === 'Resolved' ? 'success' : 'info',
    });

    showToast(`Complaint marked as ${newStatus}`, 'success');
    setActionComplaint(null);
    loadComplaints();
  };

  return (
    <DashboardLayout navItems={navItems} title="Assigned Complaints">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaints..." className="input-field pl-10" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field sm:w-48">
          <option value="all">All Statuses</option>
          <option value="AI Classified">AI Classified</option>
          <option value="Department Assigned">Department Assigned</option>
          <option value="Officer Assigned">Officer Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Requesting Information">Requesting Information</option>
          <option value="Resolved">Resolved</option>
          <option value="Escalated">Escalated</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={<ListChecks className="w-8 h-8" />} title="No complaints found" description="No complaints match your search." />
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const sla = calculateSLAStatus(c);
            return (
              <div key={c.id} className="glass-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/officer/complaints/${c.id}`} className="text-xs font-mono text-cyan-400">{c.complaint_number}</Link>
                      <span className={`badge ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                      <span className={`badge ${getStatusColor(c.status)}`}>{c.status}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{c.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`badge ${getRiskColor(sla.risk)}`}><span className={`w-1.5 h-1.5 rounded-full ${getRiskDot(sla.risk)}`} />{sla.remainingText}</span>
                    <span className="text-xs text-slate-500">{c.category}</span>
                  </div>
                </div>
                {c.status !== 'Resolved' && c.status !== 'Closed' && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800/50">
                    {c.status === 'AI Classified' || c.status === 'Department Assigned' || c.status === 'Officer Assigned' ? (
                      <button onClick={() => handleAction(c, 'In Progress')} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><Play className="w-3.5 h-3.5" /> Start Investigation</button>
                    ) : null}
                    {c.status === 'In Progress' && (
                      <>
                        <button onClick={() => handleAction(c, 'Requesting Information')} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Request Info</button>
                        <button onClick={() => handleAction(c, 'Resolved')} className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Resolve</button>
                      </>
                    )}
                    {c.status === 'Requesting Information' && (
                      <button onClick={() => handleAction(c, 'In Progress')} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><Play className="w-3.5 h-3.5" /> Resume</button>
                    )}
                    {c.status !== 'Escalated' && (
                      <button onClick={() => handleAction(c, 'Escalated')} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Escalate</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!actionComplaint}
        title={`Mark as ${actionType}?`}
        message={actionType === 'Escalated' ? 'This will flag the complaint as escalated. The citizen will be notified.' : `Update complaint ${actionComplaint?.complaint_number} status to ${actionType}?`}
        onConfirm={confirmAction}
        onCancel={() => setActionComplaint(null)}
        confirmLabel={`Confirm ${actionType}`}
        danger={actionType === 'Escalated'}
      />
    </DashboardLayout>
  );
}

export function OfficerSLAMonitor() {
  const officer = useOfficerDept();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!officer) return;
    (async () => {
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('department_id', officer.department_id)
        .neq('status', 'Resolved')
        .neq('status', 'Closed')
        .order('created_at', { ascending: true });
      setComplaints((data || []) as Complaint[]);
      setLoading(false);
    })();
  }, [officer]);

  const sorted = [...complaints].sort((a, b) => {
    const slaA = calculateSLAStatus(a);
    const slaB = calculateSLAStatus(b);
    return slaA.remainingMs - slaB.remainingMs;
  });

  return (
    <DashboardLayout navItems={navItems} title="SLA Monitor">
      {loading ? <LoadingSpinner /> : sorted.length === 0 ? (
        <EmptyState icon={<Clock className="w-8 h-8" />} title="No active SLA monitors" description="All complaints in your department are resolved." />
      ) : (
        <div className="space-y-3">
          {sorted.map(c => {
            const sla = calculateSLAStatus(c);
            return (
              <div key={c.id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Link to={`/officer/complaints/${c.id}`} className="text-xs font-mono text-cyan-400">{c.complaint_number}</Link>
                    <span className="text-sm text-slate-200">{c.title.length > 40 ? c.title.substring(0, 40) + '...' : c.title}</span>
                  </div>
                  <span className={`badge ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div><div className="text-xs text-slate-500">SLA Hours</div><div className="text-sm font-semibold text-white">{c.sla_hours}h</div></div>
                  <div><div className="text-xs text-slate-500">Remaining</div><div className={`text-sm font-mono font-semibold ${sla.isViolated ? 'text-red-400' : 'text-white'}`}>{sla.remainingText}</div></div>
                  <div><div className="text-xs text-slate-500">Status</div><div className="text-sm text-slate-200">{c.status}</div></div>
                  <div><div className="text-xs text-slate-500">Risk</div><div><span className={`badge ${getRiskColor(sla.risk)}`}><span className={`w-1.5 h-1.5 rounded-full ${getRiskDot(sla.risk)}`} />{sla.isViolated ? 'VIOLATED' : sla.risk}</span></div></div>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full ${sla.isViolated ? 'bg-red-500' : sla.risk === 'HIGH' ? 'bg-orange-500' : sla.risk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(sla.percentUsed, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export function OfficerNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setNotifications((data || []) as Notification[]);
      setLoading(false);
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    })();
  }, [user]);

  return (
    <DashboardLayout navItems={navItems} title="Notifications">
      {loading ? <LoadingSpinner /> : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description="SLA alerts and complaint updates will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className="glass-card p-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.type === 'success' ? 'bg-green-500/10 text-green-400' : n.type === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1"><p className="text-sm text-slate-200">{n.message}</p><p className="text-xs text-slate-500 mt-1">{timeAgo(n.created_at)}</p></div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export function OfficerProfile() {
  const { user } = useAuth();
  const officer = useOfficerDept();
  if (!user) return null;
  return (
    <DashboardLayout navItems={navItems} title="My Profile">
      <div className="glass-card p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-400">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-sm text-slate-400">{user.email}</p>
            <span className="badge text-blue-400 bg-blue-500/10 border-blue-500/20 mt-2">Officer</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-xs text-slate-500">Department</label><p className="text-sm text-slate-200 mt-1">{officer?.departments?.name || 'N/A'}</p></div>
          <div><label className="text-xs text-slate-500">Zone</label><p className="text-sm text-slate-200 mt-1">{officer?.zone || 'N/A'}</p></div>
          <div><label className="text-xs text-slate-500">Phone</label><p className="text-sm text-slate-200 mt-1">{user.phone || 'N/A'}</p></div>
          <div><label className="text-xs text-slate-500">Status</label><p className="text-sm text-slate-200 mt-1 capitalize">{officer?.status || 'N/A'}</p></div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function OfficerComplaintDetails() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseMsg, setResponseMsg] = useState('');
  const [showAction, setShowAction] = useState('');
  const path = window.location.pathname;
  const complaintId = path.split('/').pop();

  useEffect(() => {
    if (!complaintId) return;
    (async () => {
      const { data: c } = await supabase.from('complaints').select('*').eq('id', complaintId).maybeSingle();
      setComplaint(c as Complaint);
      if (c) {
        const { data: u } = await supabase.from('complaint_updates').select('*, profiles:updated_by (*)').eq('complaint_id', c.id).order('created_at', { ascending: true });
        setUpdates(u || []);
      }
      setLoading(false);
    })();
  }, [complaintId]);

  const updateStatus = async (newStatus: string) => {
    if (!complaint || !user) return;
    const message = responseMsg || `Officer updated status to ${newStatus}`;
    const { error } = await supabase.from('complaints').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', complaint.id);
    if (error) { showToast('Failed to update', 'error'); return; }
    await supabase.from('complaint_updates').insert({ complaint_id: complaint.id, updated_by: user.id, status: newStatus, message });
    await supabase.from('notifications').insert({ user_id: complaint.user_id, complaint_id: complaint.id, message: `Your complaint ${complaint.complaint_number} status updated to: ${newStatus}.`, type: newStatus === 'Resolved' ? 'success' : 'info' });
    showToast(`Complaint marked as ${newStatus}`, 'success');
    setShowAction('');
    setResponseMsg('');
    setComplaint({ ...complaint, status: newStatus as any });
    const { data: u } = await supabase.from('complaint_updates').select('*, profiles:updated_by (*)').eq('complaint_id', complaint.id).order('created_at', { ascending: true });
    setUpdates(u || []);
  };

  if (loading) return <DashboardLayout navItems={navItems} title="Complaint Details"><LoadingSpinner /></DashboardLayout>;
  if (!complaint) return <DashboardLayout navItems={navItems} title="Complaint Details"><EmptyState icon={<XCircle className="w-8 h-8" />} title="Not found" description="Complaint not found." /></DashboardLayout>;

  const sla = calculateSLAStatus(complaint);

  return (
    <DashboardLayout navItems={navItems} title="Complaint Details">
      <div className="space-y-5">
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div><div className="text-xs text-slate-500 mb-1">Complaint ID</div><div className="text-xl font-bold text-cyan-400 font-mono">{complaint.complaint_number}</div></div>
            <div className="flex flex-wrap gap-2"><span className={`badge ${getPriorityColor(complaint.priority)}`}>{complaint.priority}</span><span className={`badge ${getStatusColor(complaint.status)}`}>{complaint.status}</span></div>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">{complaint.title}</h2>
          <p className="text-sm text-slate-400 mb-4">{complaint.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Category:</span> <span className="text-slate-200">{complaint.category}</span></div>
            <div><span className="text-slate-500">Department:</span> <span className="text-slate-200">{complaint.department}</span></div>
            <div><span className="text-slate-500">Location:</span> <span className="text-slate-200">{complaint.location || 'N/A'}</span></div>
            <div><span className="text-slate-500">Zone:</span> <span className="text-slate-200">{complaint.zone}</span></div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-white">SLA Status</h3><span className={`badge ${getRiskColor(sla.risk)}`}><span className={`w-1.5 h-1.5 rounded-full ${getRiskDot(sla.risk)}`} />{sla.isViolated ? 'VIOLATED' : sla.risk}</span></div>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div><div className="text-xs text-slate-500">SLA</div><div className="text-lg font-semibold text-white">{complaint.sla_hours}h</div></div>
            <div><div className="text-xs text-slate-500">Remaining</div><div className={`text-lg font-semibold font-mono ${sla.isViolated ? 'text-red-400' : 'text-white'}`}>{sla.remainingText}</div></div>
            <div><div className="text-xs text-slate-500">Progress</div><div className="text-lg font-semibold text-white">{Math.round(sla.percentUsed)}%</div></div>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className={`h-full ${sla.isViolated ? 'bg-red-500' : sla.risk === 'HIGH' ? 'bg-orange-500' : sla.risk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(sla.percentUsed, 100)}%` }} /></div>
        </div>

        {complaint.ai_reason && (
          <div className="glass-card p-6 border-cyan-500/20">
            <h3 className="font-semibold text-cyan-400 mb-2">AI Analysis & Recommendation</h3>
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div><span className="text-slate-500">Confidence:</span> <span className="text-cyan-400 font-semibold">{complaint.ai_confidence.toFixed(0)}%</span></div>
              <div><span className="text-slate-500">Est. Resolution:</span> <span className="text-white">{complaint.estimated_resolution_hours}h</span></div>
            </div>
            <p className="text-sm text-slate-400">{complaint.ai_reason}</p>
          </div>
        )}

        {complaint.status !== 'Resolved' && complaint.status !== 'Closed' && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Officer Actions</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {(complaint.status === 'AI Classified' || complaint.status === 'Department Assigned' || complaint.status === 'Officer Assigned') && (
                <button onClick={() => setShowAction('In Progress')} className="btn-secondary text-sm flex items-center gap-2"><Play className="w-4 h-4" /> Start Investigation</button>
              )}
              {complaint.status === 'In Progress' && (
                <>
                  <button onClick={() => setShowAction('Requesting Information')} className="btn-secondary text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Request Info</button>
                  <button onClick={() => setShowAction('Resolved')} className="text-sm px-4 py-2.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Resolve</button>
                </>
              )}
              <button onClick={() => setShowAction('Escalated')} className="text-sm px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Escalate</button>
            </div>
            {showAction && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Updating to: <span className="text-cyan-400 font-medium">{showAction}</span></span>
                  <button onClick={() => { setShowAction(''); setResponseMsg(''); }} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
                </div>
                <textarea value={responseMsg} onChange={e => setResponseMsg(e.target.value)} placeholder="Add a response message (optional)..." rows={3} className="input-field resize-none text-sm" />
                <button onClick={() => updateStatus(showAction)} className="btn-primary text-sm">Confirm Update</button>
              </div>
            )}
          </div>
        )}

        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Update History</h3>
          <div className="space-y-3">
            {updates.map(u => (
              <div key={u.id} className="flex items-start gap-3 pb-3 border-b border-slate-800/30 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-400 flex-shrink-0">{u.status.charAt(0)}</div>
                <div className="flex-1">
                  <div className="text-sm text-slate-200">{u.message}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{formatDateTime(u.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
