import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar, PublicFooter } from '@/components/PublicLayout';
import { Search, Clock, MapPin, Building2, User, Tag, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Complaint, ComplaintUpdate } from '@/types';
import { calculateSLAStatus, getPriorityColor, getStatusColor, getRiskColor, getRiskDot, formatDateTime } from '@/lib/utils';

export function TrackComplaintPage() {
  const [query, setQuery] = useState('');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);

    const { data, error: queryError } = await supabase
      .from('complaints')
      .select(`
        *,
        departments:department_id (*),
        profiles:user_id (*)
      `)
      .ilike('complaint_number', query.trim())
      .maybeSingle();

    if (queryError) {
      setError('Unable to search for complaint. Please try again.');
      setComplaint(null);
    } else if (data) {
      setComplaint(data as Complaint);
      const { data: updatesData } = await supabase
        .from('complaint_updates')
        .select('*, profiles:updated_by (*)')
        .eq('complaint_id', data.id)
        .order('created_at', { ascending: true });
      setUpdates((updatesData || []) as ComplaintUpdate[]);
    } else {
      setComplaint(null);
      setError('No complaint found with that ID. Please check and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PublicNavbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
            <Search className="w-4 h-4" /> Track Complaint
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Track Your Complaint</h1>
          <p className="text-slate-400">Enter your complaint ID to see real-time status and SLA countdown.</p>
        </div>

        <form onSubmit={handleSearch} className="glass-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. GRV-2026-10001"
                className="input-field pl-10"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 px-6">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Track
            </button>
          </div>
        </form>

        {error && (
          <div className="glass-card p-6 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-slate-400">{error}</p>
          </div>
        )}

        {complaint && <ComplaintDetails complaint={complaint} updates={updates} />}
      </div>
      <PublicFooter />
    </div>
  );
}

function ComplaintDetails({ complaint, updates }: { complaint: Complaint; updates: ComplaintUpdate[] }) {
  const [slaStatus, setSlaStatus] = useState(calculateSLAStatus(complaint));

  useEffect(() => {
    const interval = setInterval(() => {
      setSlaStatus(calculateSLAStatus(complaint));
    }, 1000);
    return () => clearInterval(interval);
  }, [complaint]);

  const timelineSteps = [
    'Submitted', 'AI Classified', 'Department Assigned', 'Officer Assigned',
    'In Progress', 'Resolved',
  ];
  const currentStepIndex = timelineSteps.indexOf(complaint.status);
  const completedSteps = currentStepIndex === -1 ? 0 : complaint.status === 'Resolved' ? timelineSteps.length : currentStepIndex;

  return (
    <div className="space-y-5">
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="text-xs text-slate-500 mb-1">Complaint ID</div>
            <div className="text-xl font-bold text-cyan-400">{complaint.complaint_number}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`badge ${getPriorityColor(complaint.priority)}`}>{complaint.priority} Priority</span>
            <span className={`badge ${getStatusColor(complaint.status)}`}>{complaint.status}</span>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-2">{complaint.title}</h2>
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">{complaint.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <InfoRow icon={<Tag className="w-4 h-4" />} label="Category" value={complaint.category} />
          <InfoRow icon={<Building2 className="w-4 h-4" />} label="Department" value={complaint.department} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={complaint.location || 'N/A'} />
          <InfoRow icon={<User className="w-4 h-4" />} label="Zone" value={complaint.zone} />
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" /> SLA Status
          </h3>
          <span className={`badge ${getRiskColor(slaStatus.risk)}`}>
            <span className={`w-2 h-2 rounded-full ${getRiskDot(slaStatus.risk)}`} />
            {slaStatus.isViolated ? 'VIOLATED' : slaStatus.risk} RISK
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">SLA Hours</div>
            <div className="text-lg font-semibold text-white">{complaint.sla_hours}h</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Time Remaining</div>
            <div className={`text-lg font-semibold font-mono ${slaStatus.isViolated ? 'text-red-400' : 'text-white'}`}>
              {slaStatus.remainingText}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Progress</div>
            <div className="text-lg font-semibold text-white">{Math.round(slaStatus.percentUsed)}%</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              slaStatus.isViolated ? 'bg-red-500' : slaStatus.risk === 'HIGH' ? 'bg-orange-500' : slaStatus.risk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(slaStatus.percentUsed, 100)}%` }}
          />
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-5">Complaint Timeline</h3>
        <div className="space-y-1">
          {timelineSteps.map((step, i) => {
            const isCompleted = i < completedSteps;
            const isCurrent = i === completedSteps;
            const isPending = i > completedSteps;
            const update = updates.find(u => u.status === step);
            return (
              <div key={step} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                    isCurrent ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 animate-pulse-glow' :
                    'bg-slate-800 border border-slate-700 text-slate-600'
                  }`}>
                    {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-500/30' : 'bg-slate-800'}`} />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className={`text-sm font-medium ${isPending ? 'text-slate-600' : 'text-slate-200'}`}>{step}</div>
                  {update && (
                    <>
                      <div className="text-xs text-slate-500 mt-0.5">{update.message}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{formatDateTime(update.created_at)}</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {complaint.ai_reason && (
        <div className="glass-card p-6 border-cyan-500/20">
          <h3 className="text-base font-semibold text-cyan-400 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" /></svg>
            AI Analysis
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">AI Confidence</div>
              <div className="text-sm font-semibold text-cyan-400">{complaint.ai_confidence.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Est. Resolution</div>
              <div className="text-sm font-semibold text-white">{complaint.estimated_resolution_hours}h</div>
            </div>
          </div>
          <p className="text-sm text-slate-400">{complaint.ai_reason}</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-500 flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-medium text-slate-200 truncate">{value}</div>
      </div>
    </div>
  );
}
