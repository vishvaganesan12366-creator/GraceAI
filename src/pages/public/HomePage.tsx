import { Link } from 'react-router-dom';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { PublicNavbar, PublicFooter } from '@/components/PublicLayout';
import {
  Shield, Brain, GitBranch, Copy, Clock, AlertTriangle, Activity,
  ArrowRight, FileText, Search, CheckCircle, Zap, TrendingUp,
  Cpu, Route, Users, BarChart3, MessageSquare, Star,
} from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <PublicNavbar />
      <HeroSection />
      <StatsSection />
      <AIIntelligenceSection />
      <HowItWorksSection />
      <PredictiveGovernanceSection />
      <TestimonialsSection />
      <CTASection />
      <PublicFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 radial-glow" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6 animate-fade-in">
            <SparkleIcon /> AI-Powered Grievance Redressal Platform
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 leading-[1.1] animate-slide-up">
            GRACE <span className="gradient-text">AI</span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-300 font-medium mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Smart Grievance Management Powered by AI
          </p>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Submit complaints, track their progress, and help authorities resolve public issues faster
            through intelligent classification, routing, SLA monitoring and predictive governance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/submit" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
              <FileText className="w-5 h-5" />
              Submit a Complaint
            </Link>
            <Link to="/track" className="btn-secondary flex items-center gap-2 text-base px-6 py-3">
              <Search className="w-5 h-5" />
              Track Complaint
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
      <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" opacity="0.6" />
    </svg>
  );
}

function StatsSection() {
  const stats = [
    { label: 'Complaints Registered', value: 12548, suffix: '+' },
    { label: 'Complaints Resolved', value: 9842 },
    { label: 'SLA Compliance', value: 87.4, suffix: '%', decimals: 1 },
    { label: 'Active Departments', value: 32 },
  ];
  return (
    <section className="relative border-y border-slate-800/50 bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">
                <AnimatedCounter value={stat.value} suffix={stat.suffix || ''} decimals={stat.decimals || 0} />
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIIntelligenceSection() {
  const features = [
    {
      icon: <Brain className="w-6 h-6 text-cyan-400" />,
      title: 'AI Complaint Classification',
      description: 'Automatically categorizes complaints using NLP analysis with 96% accuracy.',
      example: '"Street light near my house has not been working for 5 days."',
      result: 'Category: Electricity\nConfidence: 96%',
    },
    {
      icon: <GitBranch className="w-6 h-6 text-blue-400" />,
      title: 'Smart Department Routing',
      description: 'Routes complaints to the correct department and zone officer instantly.',
      example: 'Electricity Complaint',
      result: '→ Electrical Department\n→ Zone 4 Officer',
    },
    {
      icon: <Copy className="w-6 h-6 text-amber-400" />,
      title: 'Duplicate Detection',
      description: 'Identifies similar complaints to prevent redundant work and merge cases.',
      example: '"Street light not working near Kattur bus stop."',
      result: 'Similarity: 91%\nExisting: GRV-2026-00821',
    },
    {
      icon: <Clock className="w-6 h-6 text-green-400" />,
      title: 'SLA Prediction',
      description: 'Predicts resolution time and SLA violation risk before assignment.',
      example: 'Expected Resolution: 18 Hours',
      result: 'SLA: 24 Hours\nRisk: LOW',
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-orange-400" />,
      title: 'Priority Detection',
      description: 'Assesses urgency based on impact, affected citizens, and severity.',
      example: 'Multiple citizens affected',
      result: 'Priority: HIGH\nAuto-escalation enabled',
    },
    {
      icon: <Activity className="w-6 h-6 text-purple-400" />,
      title: 'Root Cause Intelligence',
      description: 'Identifies recurring patterns and underlying causes of repeated complaints.',
      example: 'Street Lighting: 342 complaints this month',
      result: 'Increase: +27%\nRoot Cause: Damaged infrastructure',
    },
  ];
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
            <Cpu className="w-3.5 h-3.5" /> AI ENGINE
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">AI That Understands Your Complaint</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Six intelligent capabilities working together to transform how grievances are managed.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="glass-card-hover p-6 group">
              <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">{f.description}</p>
              <div className="space-y-2">
                <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                  <p className="text-xs text-slate-500 mb-1">Example Input</p>
                  <p className="text-sm text-slate-300">{f.example}</p>
                </div>
                <div className="bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/10">
                  <p className="text-xs text-cyan-500 mb-1">AI Output</p>
                  <p className="text-sm text-slate-200 whitespace-pre-line">{f.result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { icon: <FileText className="w-5 h-5" />, label: 'Submit', desc: 'Citizen files complaint' },
    { icon: <Brain className="w-5 h-5" />, label: 'AI Analysis', desc: 'Auto-classification' },
    { icon: <Copy className="w-5 h-5" />, label: 'Duplicate Check', desc: 'Similarity detection' },
    { icon: <Route className="w-5 h-5" />, label: 'Department Routing', desc: 'Smart assignment' },
    { icon: <Clock className="w-5 h-5" />, label: 'SLA Prediction', desc: 'Timeline estimation' },
    { icon: <Shield className="w-5 h-5" />, label: 'Officer Action', desc: 'Investigation begins' },
    { icon: <CheckCircle className="w-5 h-5" />, label: 'Resolution', desc: 'Issue resolved' },
    { icon: <Star className="w-5 h-5" />, label: 'Feedback', desc: 'Citizen rates service' },
  ];
  return (
    <section className="py-20 border-y border-slate-800/50 bg-slate-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">How GRACE AI Works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            From submission to resolution — a fully automated intelligent pipeline.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="glass-card p-5 text-center h-full">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto mb-3">
                  {step.icon}
                </div>
                <div className="text-xs text-slate-500 mb-1">Step {i + 1}</div>
                <div className="text-sm font-semibold text-white mb-1">{step.label}</div>
                <div className="text-xs text-slate-500">{step.desc}</div>
              </div>
              {i < steps.length - 1 && i % 4 !== 3 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 text-slate-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PredictiveGovernanceSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <TrendingUp className="w-3.5 h-3.5" /> PREDICTIVE GOVERNANCE
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Don't Just React.<br /><span className="gradient-text">Predict and Prevent.</span>
            </h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              GRACE AI goes beyond complaint management. It analyzes trends, identifies regional hotspots,
              forecasts future problems, and recommends proactive actions to prevent issues before they escalate.
            </p>
            <div className="space-y-3">
              {[
                { icon: <Activity className="w-5 h-5" />, title: 'Regional Hotspot Detection', desc: 'Identify areas with unusual complaint patterns' },
                { icon: <TrendingUp className="w-5 h-5" />, title: 'Future Complaint Forecasting', desc: 'Predict which issues will surge next week' },
                { icon: <Zap className="w-5 h-5" />, title: 'Root Cause Analysis', desc: 'Find underlying causes of recurring problems' },
                { icon: <BarChart3 className="w-5 h-5" />, title: 'Policy Impact Analysis', desc: 'Measure effectiveness of interventions' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-900/50 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">AI Forecast - Next 7 Days</span>
                </div>
                <span className="badge text-cyan-400 bg-cyan-500/10 border-cyan-500/20">Live</span>
              </div>
              {[
                { label: 'Road complaints', change: '+21%', up: true },
                { label: 'Water complaints', change: '+14%', up: true },
                { label: 'Electricity issues', change: '+32%', up: true },
                { label: 'Sanitation', change: '-8%', up: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                  <span className="text-sm text-slate-300">{item.label}</span>
                  <span className={`text-sm font-bold flex items-center gap-1 ${item.up ? 'text-orange-400' : 'text-green-400'}`}>
                    {item.up ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                    {item.change}
                  </span>
                </div>
              ))}
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <p className="text-sm text-orange-300 font-medium">
                  Prediction: Electricity-related complaints may increase significantly in Zone C.
                </p>
                <p className="text-xs text-slate-500 mt-1">Confidence: 87% - Recommended: Schedule preventive maintenance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: 'Priya Sharma', role: 'Citizen, Tiruchirappalli', text: 'I submitted a pothole complaint and it was routed to the right department automatically. Resolved in 18 hours!', rating: 5 },
    { name: 'Rajesh Kumar', role: 'Municipal Officer', text: 'The SLA monitor and AI priority tags help me focus on the most urgent complaints first. Game changer.', rating: 5 },
    { name: 'Dr. Lakshmi Iyer', role: 'Public Health Dept', text: 'The root cause analysis revealed a stagnant water pattern we had missed. We fixed the drainage and dengue cases dropped.', rating: 4 },
  ];
  return (
    <section className="py-20 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">What People Say</h2>
          <p className="text-slate-400">Real stories from citizens and officials using GRACE AI.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card p-6">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className={`w-4 h-4 ${s < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                ))}
              </div>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 radial-glow" />
          <div className="relative">
            <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3">Ready to Transform Governance?</h2>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              Join thousands of citizens and officials making their communities better with GRACE AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="btn-primary flex items-center gap-2 px-6 py-3">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/track" className="btn-secondary flex items-center gap-2 px-6 py-3">
                <Search className="w-5 h-5" />
                Track a Complaint
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
