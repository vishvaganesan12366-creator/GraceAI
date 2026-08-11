import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicNavbar } from '@/components/PublicLayout';
import {
  FileText, Upload, Brain, CheckCircle, ArrowRight, ArrowLeft,
  Tag, Building2, Clock, AlertTriangle, Shield, Loader2, MapPin,
  Copy, TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { analyzeComplaintText, calculateSimilarity } from '@/lib/ai-service';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { generateComplaintNumber } from '@/lib/utils';
import type { AIAnalysisResult, Complaint } from '@/types';

const CATEGORIES = [
  'Road Infrastructure', 'Water Supply', 'Electricity', 'Sanitation',
  'Public Safety', 'Transport', 'Healthcare', 'Education', 'Other',
];

const STEPS = ['Complaint Details', 'Evidence', 'AI Analysis', 'Confirmation'];

export function SubmitComplaintPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', location: '', district: '', area: '',
  });
  const [evidence, setEvidence] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<{ complaint: Complaint; similarity: number } | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const runAIAnalysis = async (text: string) => {
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 1500));
    const result = analyzeComplaintText(text);
    setAiResult(result);

    const { data: existingComplaints } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (existingComplaints && existingComplaints.length > 0) {
      let bestMatch: { complaint: Complaint; similarity: number } | null = null;
      for (const c of existingComplaints as Complaint[]) {
        const sim = calculateSimilarity(text, c.title + ' ' + c.description);
        if (sim > 70 && (!bestMatch || sim > bestMatch.similarity)) {
          bestMatch = { complaint: c, similarity: sim };
        }
      }
      setDuplicateMatch(bestMatch);
    }
    setAnalyzing(false);
  };

  const handleNextFromDetails = () => {
    if (!form.title || !form.description) {
      showToast('Please fill in title and description', 'warning');
      return;
    }
    setStep(1);
  };

  const handleNextFromEvidence = async () => {
    setStep(2);
    if (!aiResult) {
      await runAIAnalysis(form.description);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast('Please sign in to submit a complaint', 'warning');
      navigate('/login');
      return;
    }
    if (!aiResult) return;

    setLoading(true);
    const complaintNumber = generateComplaintNumber();

    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .ilike('name', aiResult.department)
      .maybeSingle();

    const slaDeadline = new Date(Date.now() + aiResult.slaHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('complaints')
      .insert({
        complaint_number: complaintNumber,
        user_id: user.id,
        title: form.title,
        description: form.description,
        category: aiResult.category,
        department_id: dept?.id || null,
        department: aiResult.department,
        location: form.location || null,
        district: form.district || null,
        area: form.area || null,
        zone: 'Zone A',
        priority: aiResult.priority,
        status: 'AI Classified',
        sla_hours: aiResult.slaHours,
        sla_deadline: slaDeadline,
        ai_confidence: aiResult.confidence,
        duplicate_probability: aiResult.duplicateProbability,
        estimated_resolution_hours: aiResult.estimatedResolutionHours,
        sla_risk: aiResult.slaRisk,
        ai_reason: aiResult.reason,
        evidence_urls: evidence,
      })
      .select()
      .single();

    if (error) {
      showToast('Failed to submit complaint: ' + error.message, 'error');
      setLoading(false);
      return;
    }

    if (data) {
      await supabase.from('complaint_updates').insert({
        complaint_id: data.id,
        updated_by: user.id,
        status: 'Submitted',
        message: 'Complaint submitted by citizen',
      });
      await supabase.from('complaint_updates').insert({
        complaint_id: data.id,
        updated_by: user.id,
        status: 'AI Classified',
        message: `GRACE AI classified this as ${aiResult.category} with ${aiResult.confidence.toFixed(0)}% confidence`,
      });
      await supabase.from('complaint_updates').insert({
        complaint_id: data.id,
        updated_by: user.id,
        status: 'Department Assigned',
        message: `Routed to ${aiResult.department}`,
      });

      await supabase.from('notifications').insert({
        user_id: user.id,
        complaint_id: data.id,
        message: `Your complaint ${complaintNumber} has been submitted and classified by AI.`,
        type: 'info',
      });

      const submitted = data as Complaint;
      setSubmittedComplaint(submitted);
      setStep(3);
      showToast('Complaint submitted successfully!', 'success');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PublicNavbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Submit a Complaint</h1>
          <p className="text-slate-400">GRACE AI will analyze your complaint and route it to the right department.</p>
        </div>

        <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  i < step ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                  i === step ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 animate-pulse-glow' :
                  'bg-slate-800 border border-slate-700 text-slate-600'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${i === step ? 'text-cyan-400' : 'text-slate-600'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-500/30' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Complaint Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleFormChange('title', e.target.value)}
                  placeholder="Brief summary of your complaint"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Complaint Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => handleFormChange('description', e.target.value)}
                  placeholder="Describe your complaint in detail. The more specific you are, the better GRACE AI can analyze it."
                  rows={5}
                  className="input-field resize-none"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Tip: Include location details, duration, and impact for better AI analysis.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Category (optional - AI will auto-detect)</label>
                <select
                  value={form.category}
                  onChange={e => handleFormChange('category', e.target.value)}
                  className="input-field"
                >
                  <option value="">Let AI decide</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
                  <input type="text" value={form.location} onChange={e => handleFormChange('location', e.target.value)} placeholder="Street/Area" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">District</label>
                  <input type="text" value={form.district} onChange={e => handleFormChange('district', e.target.value)} placeholder="District" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Area / Zone</label>
                  <input type="text" value={form.area} onChange={e => handleFormChange('area', e.target.value)} placeholder="Zone" className="input-field" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={handleNextFromDetails} className="btn-primary flex items-center gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Upload Evidence</h3>
                <p className="text-sm text-slate-400 mb-4">Add photos, documents, or videos to support your complaint (optional).</p>
              </div>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-10 text-center">
                <Upload className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-1">Drag and drop files here, or click to browse</p>
                <p className="text-xs text-slate-600">Supports: JPG, PNG, PDF, MP4 (max 10MB)</p>
                <button
                  onClick={() => {
                    const fileName = `evidence-${Date.now()}.jpg`;
                    setEvidence(prev => [...prev, fileName]);
                    showToast('Evidence file added (demo)', 'success');
                  }}
                  className="btn-secondary mt-4 text-sm"
                >
                  Choose File
                </button>
              </div>
              {evidence.length > 0 && (
                <div className="space-y-2">
                  {evidence.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <span className="text-sm text-slate-300 flex-1">{file}</span>
                      <button
                        onClick={() => setEvidence(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleNextFromEvidence} className="btn-primary flex items-center gap-2">
                  Analyze with AI <Brain className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-800" />
                    <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin absolute inset-0" />
                    <Brain className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mt-6 mb-1">GRACE AI is analyzing your complaint...</h3>
                  <p className="text-sm text-slate-500">Classifying category, detecting duplicates, predicting SLA</p>
                </div>
              ) : aiResult ? (
                <>
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
                      <Brain className="w-4 h-4" /> GRACE AI ANALYSIS
                    </div>
                  </div>

                  {duplicateMatch && (
                    <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-amber-300 mb-1">Potential Duplicate Complaint Detected</div>
                          <div className="text-xs text-slate-400 mb-2">
                            Similarity: <span className="font-bold text-amber-400">{duplicateMatch.similarity}%</span>
                            {' · '}Existing: <span className="font-mono text-amber-300">{duplicateMatch.complaint.complaint_number}</span>
                            {' · '}Status: {duplicateMatch.complaint.status}
                          </div>
                          <div className="flex gap-2">
                            <Link to="/track" className="text-xs text-cyan-400 hover:text-cyan-300">View Existing →</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <AIField icon={<Tag className="w-4 h-4" />} label="Category" value={aiResult.category} />
                    <AIField icon={<Building2 className="w-4 h-4" />} label="Department" value={aiResult.department} />
                    <AIField icon={<Shield className="w-4 h-4" />} label="Priority" value={aiResult.priority} highlight />
                    <AIField icon={<TrendingUp className="w-4 h-4" />} label="AI Confidence" value={`${aiResult.confidence.toFixed(0)}%`} highlight />
                    <AIField icon={<Copy className="w-4 h-4" />} label="Duplicate Probability" value={`${aiResult.duplicateProbability}%`} />
                    <AIField icon={<Clock className="w-4 h-4" />} label="Est. Resolution" value={`${aiResult.estimatedResolutionHours} Hours`} />
                    <AIField icon={<Clock className="w-4 h-4" />} label="SLA" value={`${aiResult.slaHours} Hours`} />
                    <AIField icon={<AlertTriangle className="w-4 h-4" />} label="SLA Risk" value={aiResult.slaRisk} highlight />
                  </div>

                  <div className="rounded-xl p-4 bg-slate-950/50 border border-slate-800">
                    <div className="text-xs text-cyan-400 mb-1">AI Reasoning</div>
                    <p className="text-sm text-slate-300">{aiResult.reason}</p>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      {loading ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {step === 3 && submittedComplaint && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Complaint Registered Successfully!</h2>
              <p className="text-slate-400 mb-6">Your complaint has been submitted and is being processed.</p>

              <div className="glass-card p-6 max-w-md mx-auto mb-6">
                <div className="text-xs text-slate-500 mb-1">Your Complaint ID</div>
                <div className="text-2xl font-bold text-cyan-400 font-mono mb-4">{submittedComplaint.complaint_number}</div>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div>
                    <div className="text-xs text-slate-500">Category</div>
                    <div className="text-sm font-medium text-slate-200">{submittedComplaint.category}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Department</div>
                    <div className="text-sm font-medium text-slate-200">{submittedComplaint.department}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Priority</div>
                    <div className="text-sm font-medium text-slate-200">{submittedComplaint.priority}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Est. Resolution</div>
                    <div className="text-sm font-medium text-slate-200">{submittedComplaint.estimated_resolution_hours}h</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/track" className="btn-secondary flex items-center gap-2 justify-center">
                  <MapPin className="w-4 h-4" /> Track This Complaint
                </Link>
                {user && (
                  <Link to="/citizen" className="btn-primary flex items-center gap-2 justify-center">
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {!user && step < 3 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              You'll need to <Link to="/login" className="text-cyan-400 hover:text-cyan-300">sign in</Link> to submit your complaint.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AIField({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-slate-950/50 border-slate-800'}`}>
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        {icon} {label}
      </div>
      <div className={`text-sm font-semibold ${highlight ? 'text-cyan-400' : 'text-slate-200'}`}>{value}</div>
    </div>
  );
}
