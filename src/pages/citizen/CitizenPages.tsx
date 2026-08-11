import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ListChecks, Bell, User as UserIcon,
  FilePlus, Clock, CheckCircle, AlertTriangle, Search, ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Complaint, Notification, Feedback } from '@/types';
import { calculateSLAStatus, getPriorityColor, getStatusColor, timeAgo, formatDate } from '@/lib/utils';
import { LoadingSpinner, EmptyState } from '@/components/ui';

const navItems = [
  { label: 'Overview', path: '/citizen', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Submit Complaint', path: '/citizen/submit', icon: <FilePlus className="w-5 h-5" /> },
  { label: 'My Complaints', path: '/citizen/complaints', icon: <ListChecks className="w-5 h-5" /> },
  { label: 'Notifications', path: '/citizen/notifications', icon: <Bell className="w-5 h-5" /> },
  { label: 'Profile', path: '/citizen/profile', icon: <UserIcon className="w-5 h-5" /> },
];

export function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setComplaints((data || []) as Complaint[]);
      setLoading(false);
    })();
  }, [user]);

  if (!user) return null;

  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const pending = complaints.filter(c => ['Submitted', 'AI Classified', 'Department Assigned', 'Officer Assigned'].includes(c.status)).length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const escalated = complaints.filter(c => c.status === 'Escalated').length;

  return (
    <DashboardLayout navItems={navItems} title="Citizen Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Complaints" value={total} icon={<FileText className="w-5 h-5" />} color="text-cyan-400 bg-cyan-500/10" />
        <StatCard label="Pending" value={pending} icon={<Clock className="w-5 h-5" />} color="text-yellow-400 bg-yellow-500/10" />
        <StatCard label="In Progress" value={inProgress} icon={<AlertTriangle className="w-5 h-5" />} color="text-orange-400 bg-orange-500/10" />
        <StatCard label="Resolved" value={resolved} icon={<CheckCircle className="w-5 h-5" />} color="text-green-400 bg-green-500/10" />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : total === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No complaints yet"
          description="Submit your first complaint and let GRACE AI handle the rest."
          action={<Link to="/citizen/submit" className="btn-primary text-sm">Submit Complaint</Link>}
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-slate-800/50 flex items-center justify-between">
            <h3 className="font-semibold text-white">Recent Complaints</h3>
            <Link to="/citizen/complaints" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/50 text-xs text-slate-500">
                  <th className="text-left font-medium px-5 py-3">ID</th>
                  <th className="text-left font-medium px-5 py-3">Title</th>
                  <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Department</th>
                  <th className="text-left font-medium px-5 py-3">Priority</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 5).map(c => (
                  <tr key={c.id} className="border-b border-slate-800/30 hover:bg-slate-900/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/citizen/complaints/${c.id}`} className="text-xs font-mono text-cyan-400 hover:text-cyan-300">
                        {c.complaint_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Link to={`/citizen/complaints/${c.id}`} className="text-sm text-slate-200 hover:text-white">
                        {c.title.length > 30 ? c.title.substring(0, 30) + '...' : c.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400 hidden md:table-cell">{c.department}</td>
                    <td className="px-5 py-3"><span className={`badge ${getPriorityColor(c.priority)}`}>{c.priority}</span></td>
                    <td className="px-5 py-3"><span className={`badge ${getStatusColor(c.status)}`}>{c.status}</span></td>
                    <td className="px-5 py-3 text-xs text-slate-500 hidden sm:table-cell">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
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

export function CitizenComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setComplaints((data || []) as Complaint[]);
      setLoading(false);
    })();
  }, [user]);

  const filtered = complaints.filter(c => {
    const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.complaint_number.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout navItems={navItems} title="My Complaints">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or complaint ID..."
            className="input-field pl-10"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field sm:w-48">
          <option value="all">All Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="AI Classified">AI Classified</option>
          <option value="Department Assigned">Department Assigned</option>
          <option value="Officer Assigned">Officer Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Escalated">Escalated</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No complaints found"
          description={search ? "Try adjusting your search or filter." : "Submit your first complaint to get started."}
          action={!search && <Link to="/citizen/submit" className="btn-primary text-sm">Submit Complaint</Link>}
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/50 text-xs text-slate-500">
                  <th className="text-left font-medium px-5 py-3">ID</th>
                  <th className="text-left font-medium px-5 py-3">Title</th>
                  <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Department</th>
                  <th className="text-left font-medium px-5 py-3">Priority</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">SLA</th>
                  <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const sla = calculateSLAStatus(c);
                  return (
                    <tr key={c.id} className="border-b border-slate-800/30 hover:bg-slate-900/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/citizen/complaints/${c.id}`} className="text-xs font-mono text-cyan-400 hover:text-cyan-300">
                          {c.complaint_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <Link to={`/citizen/complaints/${c.id}`} className="text-sm text-slate-200 hover:text-white">
                          {c.title.length > 35 ? c.title.substring(0, 35) + '...' : c.title}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400 hidden md:table-cell">{c.department}</td>
                      <td className="px-5 py-3"><span className={`badge ${getPriorityColor(c.priority)}`}>{c.priority}</span></td>
                      <td className="px-5 py-3"><span className={`badge ${getStatusColor(c.status)}`}>{c.status}</span></td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className={`text-xs font-mono ${sla.isViolated ? 'text-red-400' : 'text-slate-400'}`}>{sla.remainingText}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 hidden sm:table-cell">{formatDate(c.created_at)}</td>
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

export function CitizenNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setNotifications((data || []) as Notification[]);
      setLoading(false);
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    })();
  }, [user]);

  return (
    <DashboardLayout navItems={navItems} title="Notifications">
      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description="You'll see updates about your complaints here." />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`glass-card p-4 flex items-start gap-3 ${!n.is_read ? 'border-cyan-500/20' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                n.type === 'success' ? 'bg-green-500/10 text-green-400' :
                n.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                'bg-cyan-500/10 text-cyan-400'
              }`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-200">{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export function CitizenProfile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <DashboardLayout navItems={navItems} title="My Profile">
      <div className="glass-card p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-cyan-400">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-sm text-slate-400">{user.email}</p>
            <span className="badge text-cyan-400 bg-cyan-500/10 border-cyan-500/20 mt-2 capitalize">{user.role}</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500">Full Name</label>
            <p className="text-sm text-slate-200 mt-1">{user.name}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500">Email</label>
            <p className="text-sm text-slate-200 mt-1">{user.email}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500">Phone</label>
            <p className="text-sm text-slate-200 mt-1">{user.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500">Location</label>
            <p className="text-sm text-slate-200 mt-1">{user.location || 'N/A'}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function ComplaintDetails() {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [resolved, setResolved] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const path = window.location.pathname;
  const complaintId = path.split('/').pop();

  useEffect(() => {
    if (!complaintId) return;
    (async () => {
      const { data: c } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', complaintId)
        .maybeSingle();
      setComplaint(c as Complaint);
      if (c) {
        const { data: u } = await supabase
          .from('complaint_updates')
          .select('*, profiles:updated_by (*)')
          .eq('complaint_id', c.id)
          .order('created_at', { ascending: true });
        setUpdates(u || []);
        const { data: f } = await supabase
          .from('feedback')
          .select('*')
          .eq('complaint_id', c.id)
          .maybeSingle();
        setFeedback(f as Feedback | null);
      }
      setLoading(false);
    })();
  }, [complaintId]);

  const submitFeedback = async () => {
    if (!complaint || !user || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from('feedback').insert({
      complaint_id: complaint.id,
      user_id: user.id,
      rating,
      resolved,
      comment,
    });
    if (!error) {
      setFeedback({ id: '', complaint_id: complaint.id, user_id: user.id, rating, resolved, comment, created_at: new Date().toISOString() });
    }
    setSubmitting(false);
  };

  if (loading) return <DashboardLayout navItems={navItems} title="Complaint Details"><LoadingSpinner /></DashboardLayout>;
  if (!complaint) return <DashboardLayout navItems={navItems} title="Complaint Details"><EmptyState icon={<FileText className="w-8 h-8" />} title="Complaint not found" description="This complaint may have been removed." /></DashboardLayout>;

  const sla = calculateSLAStatus(complaint);
  const timelineSteps = ['Submitted', 'AI Classified', 'Department Assigned', 'Officer Assigned', 'In Progress', 'Resolved'];
  const currentStepIndex = timelineSteps.indexOf(complaint.status);
  const completedSteps = complaint.status === 'Resolved' ? timelineSteps.length : currentStepIndex;

  return (
    <DashboardLayout navItems={navItems} title="Complaint Details">
      <div className="space-y-5">
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Complaint ID</div>
              <div className="text-xl font-bold text-cyan-400 font-mono">{complaint.complaint_number}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${getPriorityColor(complaint.priority)}`}>{complaint.priority}</span>
              <span className={`badge ${getStatusColor(complaint.status)}`}>{complaint.status}</span>
            </div>
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
          <h3 className="font-semibold text-white mb-4">SLA Status</h3>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div><div className="text-xs text-slate-500">SLA</div><div className="text-lg font-semibold text-white">{complaint.sla_hours}h</div></div>
            <div><div className="text-xs text-slate-500">Remaining</div><div className={`text-lg font-semibold font-mono ${sla.isViolated ? 'text-red-400' : 'text-white'}`}>{sla.remainingText}</div></div>
            <div><div className="text-xs text-slate-500">Progress</div><div className="text-lg font-semibold text-white">{Math.round(sla.percentUsed)}%</div></div>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full ${sla.isViolated ? 'bg-red-500' : sla.risk === 'HIGH' ? 'bg-orange-500' : sla.risk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(sla.percentUsed, 100)}%` }} />
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Timeline</h3>
          <div className="space-y-1">
            {timelineSteps.map((s, i) => {
              const isCompleted = i < completedSteps;
              const isCurrent = i === completedSteps;
              const update = updates.find(u => u.status === s);
              return (
                <div key={s} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? 'bg-green-500/20 border border-green-500/30 text-green-400' : isCurrent ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400' : 'bg-slate-800 border border-slate-700 text-slate-600'}`}>
                      {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                    </div>
                    {i < timelineSteps.length - 1 && <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-500/30' : 'bg-slate-800'}`} />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className={`text-sm font-medium ${isCurrent || isCompleted ? 'text-slate-200' : 'text-slate-600'}`}>{s}</div>
                    {update && <div className="text-xs text-slate-500 mt-0.5">{update.message} · {timeAgo(update.created_at)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {complaint.ai_reason && (
          <div className="glass-card p-6 border-cyan-500/20">
            <h3 className="font-semibold text-cyan-400 mb-2">AI Analysis</h3>
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div><span className="text-slate-500">Confidence:</span> <span className="text-cyan-400 font-semibold">{complaint.ai_confidence.toFixed(0)}%</span></div>
              <div><span className="text-slate-500">Est. Resolution:</span> <span className="text-white">{complaint.estimated_resolution_hours}h</span></div>
            </div>
            <p className="text-sm text-slate-400">{complaint.ai_reason}</p>
          </div>
        )}

        {complaint.status === 'Resolved' && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Citizen Feedback</h3>
            {feedback ? (
              <div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-2xl ${i < feedback.rating ? 'text-yellow-400' : 'text-slate-700'}`}>★</span>
                  ))}
                </div>
                <p className="text-sm text-slate-400">{feedback.comment || 'No additional comment provided.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">How satisfied are you?</label>
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        onMouseEnter={() => setHoverRating(i + 1)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(i + 1)}
                        className={`text-3xl transition-all ${(hoverRating || rating) > i ? 'text-yellow-400 scale-110' : 'text-slate-700 hover:text-slate-600'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Was your issue resolved?</label>
                  <div className="flex gap-3">
                    <button onClick={() => setResolved(true)} className={`px-4 py-2 rounded-lg text-sm font-medium ${resolved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>Yes</button>
                    <button onClick={() => setResolved(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${!resolved ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>No</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Additional Feedback</label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." rows={3} className="input-field resize-none" />
                </div>
                <button onClick={submitFeedback} disabled={submitting || rating === 0} className="btn-primary text-sm">
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
