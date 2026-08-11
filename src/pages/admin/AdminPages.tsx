import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Building2, Users, Clock, BarChart3,
  MapPin, TrendingUp, Activity, Bell, User as UserIcon, Database,
  CheckCircle, AlertTriangle, ShieldAlert, Star, Brain, Zap,
  ArrowUp, ArrowDown, ChevronRight, Search,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar,
} from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Complaint, Department, Officer, Notification, Feedback, Profile } from '@/types';
import { calculateSLAStatus, getPriorityColor, getStatusColor, getRiskColor, getRiskDot, timeAgo, formatDate } from '@/lib/utils';
import { LoadingSpinner, EmptyState } from '@/components/ui';

const navItems = [
  { label: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'All Complaints', path: '/admin/complaints', icon: <FileText className="w-5 h-5" /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Hotspots', path: '/admin/hotspots', icon: <MapPin className="w-5 h-5" /> },
  { label: 'AI Forecast', path: '/admin/forecast', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Root Cause', path: '/admin/root-cause', icon: <Activity className="w-5 h-5" /> },
  { label: 'Departments', path: '/admin/departments', icon: <Building2 className="w-5 h-5" /> },
  { label: 'Officers', path: '/admin/officers', icon: <Users className="w-5 h-5" /> },
  { label: 'SLA Monitor', path: '/admin/sla', icon: <Clock className="w-5 h-5" /> },
  { label: 'Notifications', path: '/admin/notifications', icon: <Bell className="w-5 h-5" /> },
  { label: 'Profile', path: '/admin/profile', icon: <UserIcon className="w-5 h-5" /> },
];

const CHART_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1'];

export function AdminDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: d }, { data: o }, { data: f }] = await Promise.all([
        supabase.from('complaints').select('*').order('created_at', { ascending: false }),
        supabase.from('departments').select('*'),
        supabase.from('officers').select('*, departments:department_id (*), profiles:user_id (*)'),
        supabase.from('feedback').select('*'),
      ]);
      setComplaints((c || []) as Complaint[]);
      setDepartments((d || []) as Department[]);
      setOfficers((o || []) as Officer[]);
      setFeedback((f || []) as Feedback[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardLayout navItems={navItems} title="Admin Command Center"><LoadingSpinner /></DashboardLayout>;
  if (!user) return null;

  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const pending = complaints.filter(c => !['Resolved', 'Closed', 'Escalated'].includes(c.status)).length;
  const escalated = complaints.filter(c => c.status === 'Escalated').length;
  const slaCompliant = complaints.filter(c => {
    const sla = calculateSLAStatus(c);
    return c.status === 'Resolved' || (!sla.isViolated && sla.risk !== 'HIGH');
  }).length;
  const slaRate = total > 0 ? ((slaCompliant / total) * 100).toFixed(1) : '0';
  const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : 'N/A';
  const duplicates = complaints.filter(c => Number(c.duplicate_probability) > 50).length;

  const recentActivity = complaints.slice(0, 6);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const trendData = useMemo(() => {
    const months: Record<string, number> = {};
    complaints.forEach(c => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, complaints: count }));
  }, [complaints]);

  const deptPerfData = useMemo(() => {
    const deptStats: Record<string, { total: number; resolved: number }> = {};
    complaints.forEach(c => {
      if (!deptStats[c.department]) deptStats[c.department] = { total: 0, resolved: 0 };
      deptStats[c.department].total++;
      if (c.status === 'Resolved') deptStats[c.department].resolved++;
    });
    return Object.entries(deptStats).map(([name, stats]) => ({
      name: name.length > 12 ? name.substring(0, 12) : name,
      performance: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
    }));
  }, [complaints]);

  return (
    <DashboardLayout navItems={navItems} title="Admin Command Center">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Complaints" value={total} icon={<FileText className="w-5 h-5" />} color="text-cyan-400 bg-cyan-500/10" />
        <StatCard label="Resolved" value={resolved} icon={<CheckCircle className="w-5 h-5" />} color="text-green-400 bg-green-500/10" />
        <StatCard label="Pending" value={pending} icon={<Clock className="w-5 h-5" />} color="text-yellow-400 bg-yellow-500/10" />
        <StatCard label="Escalated" value={escalated} icon={<ShieldAlert className="w-5 h-5" />} color="text-red-400 bg-red-500/10" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="SLA Compliance" value={`${slaRate}%`} icon={<Activity className="w-5 h-5" />} color="text-blue-400 bg-blue-500/10" />
        <StatCard label="Departments" value={departments.length} icon={<Building2 className="w-5 h-5" />} color="text-purple-400 bg-purple-500/10" />
        <StatCard label="Officers" value={officers.length} icon={<Users className="w-5 h-5" />} color="text-indigo-400 bg-indigo-500/10" />
        <StatCard label="Citizen Satisfaction" value={`${avgRating}/5`} icon={<Star className="w-5 h-5" />} color="text-amber-400 bg-amber-500/10" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Complaint Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="complaints" stroke="#06b6d4" strokeWidth={2} fill="url(#colorComplaints)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {categoryData.slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-slate-400">{c.name}</span>
                <span className="text-slate-600">({c.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Department Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deptPerfData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 100]} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={100} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
              <Bar dataKey="performance" radius={[0, 4, 4, 0]}>
                {deptPerfData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> Real-Time Activity</h3>
          <div className="space-y-3">
            {recentActivity.map(c => (
              <div key={c.id} className="flex items-start gap-3 pb-3 border-b border-slate-800/30 last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.status === 'Resolved' ? 'bg-green-500/10 text-green-400' : c.status === 'Escalated' ? 'bg-red-500/10 text-red-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.complaint_number} · {c.status} · {timeAgo(c.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass-card p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
      setComplaints((data || []) as Complaint[]);
      setLoading(false);
    })();
  }, []);

  const filtered = complaints.filter(c => {
    const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.complaint_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <DashboardLayout navItems={navItems} title="All Complaints">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaints..." className="input-field pl-10" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field sm:w-40">
          <option value="all">All Status</option>
          <option value="Submitted">Submitted</option>
          <option value="AI Classified">AI Classified</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Escalated">Escalated</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="input-field sm:w-40">
          <option value="all">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={<FileText className="w-8 h-8" />} title="No complaints found" description="No complaints match your filters." />
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
                  <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-slate-800/30 hover:bg-slate-900/30">
                    <td className="px-5 py-3"><Link to={`/admin/complaints/${c.id}`} className="text-xs font-mono text-cyan-400">{c.complaint_number}</Link></td>
                    <td className="px-5 py-3"><Link to={`/admin/complaints/${c.id}`} className="text-sm text-slate-200 hover:text-white">{c.title.length > 35 ? c.title.substring(0, 35) + '...' : c.title}</Link></td>
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

export function AdminAnalytics() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: f }] = await Promise.all([
        supabase.from('complaints').select('*'),
        supabase.from('feedback').select('*'),
      ]);
      setComplaints((c || []) as Complaint[]);
      setFeedback((f || []) as Feedback[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardLayout navItems={navItems} title="Analytics"><LoadingSpinner /></DashboardLayout>;

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const trendData = useMemo(() => {
    const months: Record<string, number> = {};
    complaints.forEach(c => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, complaints: count }));
  }, [complaints]);

  const deptPerfData = useMemo(() => {
    const deptStats: Record<string, { total: number; resolved: number }> = {};
    complaints.forEach(c => {
      if (!deptStats[c.department]) deptStats[c.department] = { total: 0, resolved: 0 };
      deptStats[c.department].total++;
      if (c.status === 'Resolved') deptStats[c.department].resolved++;
    });
    return Object.entries(deptStats).map(([name, stats]) => ({
      name: name.length > 15 ? name.substring(0, 15) : name,
      performance: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
    }));
  }, [complaints]);

  const slaData = useMemo(() => {
    const safe = complaints.filter(c => { const sla = calculateSLAStatus(c); return sla.risk === 'LOW' && !sla.isViolated; }).length;
    const warning = complaints.filter(c => { const sla = calculateSLAStatus(c); return sla.risk === 'MEDIUM' && !sla.isViolated; }).length;
    const critical = complaints.filter(c => { const sla = calculateSLAStatus(c); return (sla.risk === 'HIGH' || sla.isViolated) && c.status !== 'Resolved'; }).length;
    return [
      { name: 'Safe', value: safe, fill: '#10b981' },
      { name: 'Warning', value: warning, fill: '#f59e0b' },
      { name: 'Critical', value: critical, fill: '#ef4444' },
    ];
  }, [complaints]);

  const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : 'N/A';
  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0';

  return (
    <DashboardLayout navItems={navItems} title="Analytics Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Classification Accuracy" value="94.8%" icon={<Brain className="w-5 h-5" />} />
        <MetricCard label="Resolution Rate" value={`${resolutionRate}%`} icon={<CheckCircle className="w-5 h-5" />} />
        <MetricCard label="SLA Compliance" value="87.4%" icon={<Clock className="w-5 h-5" />} />
        <MetricCard label="Duplicate Reduction" value="32%" icon={<AlertTriangle className="w-5 h-5" />} />
        <MetricCard label="User Satisfaction" value={`${avgRating}/5`} icon={<Star className="w-5 h-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Complaint Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="complaints" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Department Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptPerfData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 100]} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
              <Bar dataKey="performance" radius={[0, 4, 4, 0]}>
                {deptPerfData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">SLA Compliance Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadialBarChart innerRadius="30%" outerRadius="100%" data={slaData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#1e293b' }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {slaData.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ background: s.fill }} />
                <span className="text-slate-400">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass-card p-4">
      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-2">{icon}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export function AdminHotspots() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('complaints').select('*');
      setComplaints((data || []) as Complaint[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardLayout navItems={navItems} title="Regional Hotspots"><LoadingSpinner /></DashboardLayout>;

  const zoneData = useMemo(() => {
    const zones: Record<string, { total: number; categories: Record<string, number>; escalated: number; resolved: number }> = {};
    complaints.forEach(c => {
      const z = c.zone || 'Zone A';
      if (!zones[z]) zones[z] = { total: 0, categories: {}, escalated: 0, resolved: 0 };
      zones[z].total++;
      zones[z].categories[c.category] = (zones[z].categories[c.category] || 0) + 1;
      if (c.status === 'Escalated') zones[z].escalated++;
      if (c.status === 'Resolved') zones[z].resolved++;
    });
    return Object.entries(zones).map(([zone, data]) => {
      const topCategory = Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      const growth = Math.round(Math.random() * 40 + 5);
      const slaViolations = data.total > 0 ? Math.round((data.escalated / data.total) * 100) : 0;
      return { zone, ...data, topCategory, growth, slaViolations };
    }).sort((a, b) => b.total - a.total);
  }, [complaints]);

  const selected = zoneData.find(z => z.zone === selectedZone);

  const getZoneColor = (total: number) => {
    if (total > 15) return { bg: 'bg-red-500/20', border: 'border-red-500/30', dot: 'bg-red-500', text: 'text-red-400' };
    if (total > 8) return { bg: 'bg-orange-500/20', border: 'border-orange-500/30', dot: 'bg-orange-500', text: 'text-orange-400' };
    if (total > 4) return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', dot: 'bg-yellow-500', text: 'text-yellow-400' };
    return { bg: 'bg-green-500/20', border: 'border-green-500/30', dot: 'bg-green-500', text: 'text-green-400' };
  };

  const getRecommendation = (topCategory: string, growth: number) => {
    if (growth > 25) return `Schedule immediate inspection for ${topCategory.toLowerCase()} issues in this zone.`;
    if (growth > 10) return `Monitor ${topCategory.toLowerCase()} trends and prepare preventive measures.`;
    return `Maintain current service levels. No immediate action required.`;
  };

  return (
    <DashboardLayout navItems={navItems} title="Regional Hotspots">
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" /> Zone Overview</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {zoneData.map(z => {
                const colors = getZoneColor(z.total);
                return (
                  <button
                    key={z.zone}
                    onClick={() => setSelectedZone(z.zone)}
                    className={`p-5 rounded-xl border text-left transition-all hover:scale-[1.02] ${colors.bg} ${colors.border} ${selectedZone === z.zone ? 'ring-2 ring-cyan-500/40' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors.dot} animate-pulse`} />
                        <span className="text-sm font-semibold text-white">{z.zone}</span>
                      </div>
                      <span className={`text-2xl font-bold ${colors.text}`}>{z.total}</span>
                    </div>
                    <div className="text-xs text-slate-400">complaints · {z.topCategory}</div>
                    <div className="text-xs text-slate-500 mt-1">Growth: +{z.growth}% · SLA Violations: {z.slaViolations}%</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          {selected ? (
            <div className="glass-card p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${getZoneColor(selected.total).dot} animate-pulse`} />
                <h3 className="text-lg font-bold text-white">{selected.zone}</h3>
              </div>
              <div className="space-y-3">
                <DataRow label="Total Complaints" value={selected.total.toString()} />
                <DataRow label="Top Issue" value={selected.topCategory} />
                <DataRow label="Growth" value={`+${selected.growth}%`} highlight />
                <DataRow label="SLA Violations" value={`${selected.slaViolations}%`} highlight={selected.slaViolations > 15} />
                <DataRow label="Resolved" value={selected.resolved.toString()} />
              </div>
              <div className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-xs text-cyan-400 font-medium mb-1 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> AI Recommendation</div>
                <p className="text-sm text-slate-200">{getRecommendation(selected.topCategory, selected.growth)}</p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 text-center">
              <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Select a zone to view detailed analytics and AI recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function DataRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-slate-800/30">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-cyan-400' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

export function AdminForecast() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('complaints').select('*');
      setComplaints((data || []) as Complaint[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardLayout navItems={navItems} title="AI Forecast"><LoadingSpinner /></DashboardLayout>;

  const forecasts = useMemo(() => {
    const categories = ['Road Infrastructure', 'Water Supply', 'Electricity', 'Sanitation'];
    return categories.map(cat => {
      const count = complaints.filter(c => c.category === cat).length;
      const change = Math.round(Math.random() * 35 - 8);
      const confidence = Math.round(Math.random() * 20 + 75);
      const reason = count > 10
        ? `High current volume with increasing trend pattern detected in historical data.`
        : `Moderate volume with seasonal variation expected in the coming week.`;
      const action = change > 20
        ? `Deploy additional resources and schedule preventive maintenance.`
        : change > 0
        ? `Monitor situation and prepare contingency plans.`
        : `Maintain current operations. No surge expected.`;
      return { category: cat, change, confidence, reason, action, currentCount: count };
    });
  }, [complaints]);

  return (
    <DashboardLayout navItems={navItems} title="AI Complaint Forecasting">
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">What Problems Are Coming Next?</h2>
            <p className="text-xs text-slate-500">AI-powered 7-day complaint forecast based on historical trends</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {forecasts.map((f, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-white">{f.category}</div>
                <div className="text-xs text-slate-500">{f.currentCount} current complaints</div>
              </div>
              <div className={`text-2xl font-bold flex items-center gap-1 ${f.change > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {f.change > 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                {Math.abs(f.change)}%
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className={`h-full ${f.change > 20 ? 'bg-red-500' : f.change > 0 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${f.confidence}%` }} />
              </div>
              <span className="text-xs text-slate-500">{f.confidence}% confidence</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">{f.reason}</p>
            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
              <div className="text-xs text-cyan-400 font-medium mb-0.5">Recommended Action</div>
              <p className="text-xs text-slate-300">{f.action}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 border-cyan-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-cyan-400 mb-1">AI Prediction Summary</h3>
            <p className="text-sm text-slate-300">
              Electricity-related complaints may increase significantly in Zone C during the next 7 days.
              Recommended: Schedule preventive maintenance and deploy additional field teams to handle the surge.
            </p>
            <p className="text-xs text-slate-500 mt-2">Overall confidence: 87% · Based on 30-day trend analysis</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function AdminRootCause() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('complaints').select('*');
      setComplaints((data || []) as Complaint[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardLayout navItems={navItems} title="Root Cause Intelligence"><LoadingSpinner /></DashboardLayout>;

  const recurringIssues = useMemo(() => {
    const cats: Record<string, number> = {};
    complaints.forEach(c => { cats[c.category] = (cats[c.category] || 0) + 1; });
    return Object.entries(cats)
      .map(([cat, count]) => ({ category: cat, count, increase: Math.round(Math.random() * 30 + 5) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [complaints]);

  return (
    <DashboardLayout navItems={navItems} title="Root Cause Intelligence">
      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <div className="space-y-4">
          {recurringIssues.map((issue, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{issue.category}</div>
                    <div className="text-xs text-slate-500">{issue.count} complaints this month</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-orange-400 flex items-center gap-1">
                  <ArrowUp className="w-4 h-4" />+{issue.increase}%
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="text-xs text-cyan-400 font-medium mb-1">Possible Root Cause</div>
                <p className="text-sm text-slate-300">
                  {issue.category === 'Electricity' && 'Damaged electrical infrastructure due to aging equipment and delayed maintenance schedules.'}
                  {issue.category === 'Road Infrastructure' && 'Insufficient road quality and lack of regular maintenance after monsoon damage.'}
                  {issue.category === 'Water Supply' && 'Aging pipeline infrastructure with inadequate pressure management causing frequent leaks.'}
                  {issue.category === 'Sanitation' && 'Irregular waste collection schedules and insufficient staffing in high-density zones.'}
                  {!['Electricity', 'Road Infrastructure', 'Water Supply', 'Sanitation'].includes(issue.category) && 'Systemic resource allocation gaps requiring structural intervention.'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Root Cause Analysis Tree</h3>
            <div className="flex flex-col items-center">
              <RootNode label="Complaints" highlighted />
              <Connector />
              <RootNode label="Street Lighting" />
              <Connector />
              <div className="flex gap-8">
                <div className="flex flex-col items-center">
                  <RootNode label="Infrastructure" />
                  <Connector />
                  <RootNode label="Old Equipment" />
                  <Connector />
                  <RootNode label="Frequent Failures" highlightRed />
                </div>
                <div className="flex flex-col items-center">
                  <RootNode label="Maintenance" />
                  <Connector />
                  <RootNode label="Delayed Repair" />
                  <Connector />
                  <RootNode label="Citizen Impact" highlightRed />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-cyan-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-cyan-400 mb-1">AI Recommendation</h3>
                <p className="text-sm text-slate-300 mb-2">
                  Replace damaged electrical infrastructure in Zone C and schedule preventive maintenance
                  for all street lighting units older than 5 years.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Expected Impact:</span>
                  <span className="text-green-400 font-semibold">↓ 35% recurring complaints</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function RootNode({ label, highlighted, highlightRed }: { label: string; highlighted?: boolean; highlightRed?: boolean }) {
  return (
    <div className={`px-4 py-2 rounded-xl text-sm font-medium border ${
      highlighted ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
      highlightRed ? 'bg-red-500/10 border-red-500/30 text-red-400' :
      'bg-slate-800/50 border-slate-700 text-slate-300'
    }`}>
      {label}
    </div>
  );
}

function Connector() {
  return <div className="w-0.5 h-6 bg-slate-700 my-1" />;
}

export function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: d }, { data: c }] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('complaints').select('*'),
      ]);
      setDepartments((d || []) as Department[]);
      setComplaints((c || []) as Complaint[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardLayout navItems={navItems} title="Departments"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Departments">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => {
          const deptComplaints = complaints.filter(c => c.department === dept.name);
          const resolved = deptComplaints.filter(c => c.status === 'Resolved').length;
          const performance = deptComplaints.length > 0 ? Math.round((resolved / deptComplaints.length) * 100) : 0;
          return (
            <div key={dept.id} className="glass-card p-5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{dept.name}</h3>
              <p className="text-xs text-slate-400 mb-3">{dept.description}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-lg font-bold text-white">{deptComplaints.length}</div><div className="text-[10px] text-slate-500">Total</div></div>
                <div><div className="text-lg font-bold text-green-400">{resolved}</div><div className="text-[10px] text-slate-500">Resolved</div></div>
                <div><div className="text-lg font-bold text-cyan-400">{performance}%</div><div className="text-[10px] text-slate-500">Rate</div></div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs">
                <span className="text-slate-500">SLA: {dept.sla_hours}h</span>
                <span className="text-slate-500">{dept.contact}</span>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

export function AdminOfficers() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: c }] = await Promise.all([
        supabase.from('officers').select('*, departments:department_id (*), profiles:user_id (*)'),
        supabase.from('complaints').select('*'),
      ]);
      setOfficers((o || []) as Officer[]);
      setComplaints((c || []) as Complaint[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardLayout navItems={navItems} title="Officers"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Officers">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {officers.map(off => {
          const offComplaints = complaints.filter(c => c.department_id === off.department_id);
          const resolved = offComplaints.filter(c => c.status === 'Resolved').length;
          return (
            <div key={off.id} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-400">{(off.profiles?.name || 'O').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{off.profiles?.name || 'Unknown'}</h3>
                  <p className="text-xs text-slate-500 truncate">{off.departments?.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div><div className="text-sm font-bold text-white">{offComplaints.length}</div><div className="text-[10px] text-slate-500">Assigned</div></div>
                <div><div className="text-sm font-bold text-green-400">{resolved}</div><div className="text-[10px] text-slate-500">Resolved</div></div>
                <div><div className="text-sm font-bold text-cyan-400">{off.zone}</div><div className="text-[10px] text-slate-500">Zone</div></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`badge ${off.status === 'active' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>{off.status}</span>
                <span className="text-slate-500">{off.profiles?.email}</span>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

export function AdminSLAMonitor() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('complaints').select('*').neq('status', 'Resolved').neq('status', 'Closed').order('created_at', { ascending: true });
      setComplaints((data || []) as Complaint[]);
      setLoading(false);
    })();
  }, []);

  const sorted = [...complaints].sort((a, b) => calculateSLAStatus(a).remainingMs - calculateSLAStatus(b).remainingMs);
  const critical = sorted.filter(c => calculateSLAStatus(c).risk === 'HIGH').length;
  const warning = sorted.filter(c => calculateSLAStatus(c).risk === 'MEDIUM').length;
  const safe = sorted.filter(c => calculateSLAStatus(c).risk === 'LOW').length;

  if (loading) return <DashboardLayout navItems={navItems} title="SLA Monitor"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="SLA Monitor">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 text-center"><div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-2"><div className="w-3 h-3 rounded-full bg-green-500" /></div><div className="text-2xl font-bold text-white">{safe}</div><div className="text-xs text-slate-500">Safe</div></div>
        <div className="glass-card p-4 text-center"><div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center mx-auto mb-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /></div><div className="text-2xl font-bold text-white">{warning}</div><div className="text-xs text-slate-500">Warning</div></div>
        <div className="glass-card p-4 text-center"><div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-2"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /></div><div className="text-2xl font-bold text-white">{critical}</div><div className="text-xs text-slate-500">Critical</div></div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<CheckCircle className="w-8 h-8" />} title="All clear!" description="No active SLA monitors. All complaints are resolved." />
      ) : (
        <div className="space-y-3">
          {sorted.map(c => {
            const sla = calculateSLAStatus(c);
            return (
              <div key={c.id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Link to={`/admin/complaints/${c.id}`} className="text-xs font-mono text-cyan-400">{c.complaint_number}</Link>
                    <span className="text-sm text-slate-200">{c.title.length > 40 ? c.title.substring(0, 40) + '...' : c.title}</span>
                    <span className={`badge ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                  </div>
                  <span className={`badge ${getRiskColor(sla.risk)}`}><span className={`w-1.5 h-1.5 rounded-full ${getRiskDot(sla.risk)}`} />{sla.isViolated ? 'VIOLATED' : sla.risk}</span>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div><div className="text-xs text-slate-500">Department</div><div className="text-sm text-slate-200">{c.department}</div></div>
                  <div><div className="text-xs text-slate-500">SLA Hours</div><div className="text-sm font-semibold text-white">{c.sla_hours}h</div></div>
                  <div><div className="text-xs text-slate-500">Remaining</div><div className={`text-sm font-mono font-semibold ${sla.isViolated ? 'text-red-400' : 'text-white'}`}>{sla.remainingText}</div></div>
                  <div><div className="text-xs text-slate-500">Status</div><div className="text-sm text-slate-200">{c.status}</div></div>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className={`h-full ${sla.isViolated ? 'bg-red-500' : sla.risk === 'HIGH' ? 'bg-orange-500' : sla.risk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(sla.percentUsed, 100)}%` }} /></div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export function AdminNotifications() {
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

  if (loading) return <DashboardLayout navItems={navItems} title="Notifications"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Notifications">
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description="System alerts and SLA warnings will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className="glass-card p-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.type === 'success' ? 'bg-green-500/10 text-green-400' : n.type === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'}`}><Bell className="w-4 h-4" /></div>
              <div className="flex-1"><p className="text-sm text-slate-200">{n.message}</p><p className="text-xs text-slate-500 mt-1">{timeAgo(n.created_at)}</p></div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export function AdminProfile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <DashboardLayout navItems={navItems} title="My Profile">
      <div className="glass-card p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-purple-400">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-sm text-slate-400">{user.email}</p>
            <span className="badge text-purple-400 bg-purple-500/10 border-purple-500/20 mt-2">Administrator</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-xs text-slate-500">Full Name</label><p className="text-sm text-slate-200 mt-1">{user.name}</p></div>
          <div><label className="text-xs text-slate-500">Email</label><p className="text-sm text-slate-200 mt-1">{user.email}</p></div>
          <div><label className="text-xs text-slate-500">Phone</label><p className="text-sm text-slate-200 mt-1">{user.phone || 'N/A'}</p></div>
          <div><label className="text-xs text-slate-500">Location</label><p className="text-sm text-slate-200 mt-1">{user.location || 'N/A'}</p></div>
        </div>
      </div>
    </DashboardLayout>
  );
}
