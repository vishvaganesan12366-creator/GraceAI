import { PublicNavbar, PublicFooter } from '@/components/PublicLayout';
import { Link } from 'react-router-dom';
import {
  FileText, Brain, Copy, Route, Clock, Shield, CheckCircle, Star,
  ArrowRight, ArrowDown, Activity, TrendingUp, BarChart3,
} from 'lucide-react';

export function HowItWorksPage() {
  const steps = [
    { icon: <FileText className="w-6 h-6" />, title: 'Complaint Submitted', desc: 'A citizen submits a grievance through the web platform with details, location, and optional evidence.', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { icon: <Brain className="w-6 h-6" />, title: 'AI Classification', desc: 'GRACE AI analyzes the complaint text and classifies it into a category with confidence score.', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { icon: <Copy className="w-6 h-6" />, title: 'Duplicate Detection', desc: 'The system compares against existing complaints to identify potential duplicates and merge cases.', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { icon: <Route className="w-6 h-6" />, title: 'Department Routing', desc: 'The complaint is automatically routed to the correct department based on AI classification.', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { icon: <Clock className="w-6 h-6" />, title: 'SLA Prediction', desc: 'The AI predicts resolution time and SLA violation risk, setting deadlines accordingly.', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { icon: <Shield className="w-6 h-6" />, title: 'Officer Assignment', desc: 'A zone officer is assigned and receives the complaint with priority and AI recommendations.', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { icon: <CheckCircle className="w-6 h-6" />, title: 'Resolution', desc: 'The officer investigates, updates status, and resolves the complaint within the SLA window.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { icon: <Star className="w-6 h-6" />, title: 'Citizen Feedback', desc: 'The citizen rates the resolution and provides feedback, closing the grievance loop.', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <PublicNavbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            Process Flow
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">How GRACE AI Works</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            From complaint submission to resolution — an intelligent, automated pipeline
            that ensures every grievance is handled efficiently.
          </p>
        </div>

        <div className="space-y-4 mb-16">
          {steps.map((step, i) => (
            <div key={i}>
              <div className="glass-card p-6 flex items-start gap-5">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 ${step.color}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-slate-500 font-mono">STEP {i + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-5 h-5 text-slate-700" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {[
            { icon: <Activity className="w-6 h-6" />, title: 'Real-Time Tracking', desc: 'Citizens can track their complaint status at every stage with live SLA countdown.' },
            { icon: <TrendingUp className="w-6 h-6" />, title: 'Predictive Analytics', desc: 'Admin dashboards show trends, hotspots, and forecasts for proactive governance.' },
            { icon: <BarChart3 className="w-6 h-6" />, title: 'Performance Metrics', desc: 'Departments are measured on SLA compliance, resolution time, and citizen satisfaction.' },
          ].map((item, i) => (
            <div key={i} className="glass-card p-6">
              <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center text-cyan-400 mb-4">
                {item.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/submit" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            Try It Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
