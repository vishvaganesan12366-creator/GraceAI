import { PublicNavbar, PublicFooter } from '@/components/PublicLayout';
import { Link } from 'react-router-dom';
import { Target, Eye, Heart, Shield, Brain, Users, TrendingUp, ArrowRight } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <PublicNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            About GRACE AI
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Grievance Redressal &<br /><span className="gradient-text">Citizen Empowerment</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            An intelligent grievance management platform that uses AI to classify complaints,
            route them to the correct department, detect duplicates, predict SLA violations
            and provide predictive governance insights.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {[
            { icon: <Target className="w-6 h-6 text-cyan-400" />, title: 'Our Mission', desc: 'Transform public grievance redressal with AI-driven automation, ensuring every citizen voice is heard and resolved efficiently.' },
            { icon: <Eye className="w-6 h-6 text-blue-400" />, title: 'Our Vision', desc: 'A future where governance is proactive, transparent, and data-driven — preventing issues before they become crises.' },
            { icon: <Heart className="w-6 h-6 text-rose-400" />, title: 'Our Values', desc: 'Transparency, efficiency, citizen-first approach, and continuous improvement through technology and data.' },
          ].map((item, i) => (
            <div key={i} className="glass-card p-6">
              <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">The Problem We Solve</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Manual complaint classification causes delays and misrouting',
              'Duplicate complaints waste department resources',
              'No visibility into SLA compliance or resolution timelines',
              'Limited analytics for identifying recurring issues',
              'Poor transparency for citizens tracking their complaints',
              'Reactive governance instead of proactive prevention',
            ].map((problem, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-red-400">✕</span>
                </div>
                <p className="text-sm text-slate-400">{problem}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Our Solution</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: <Brain className="w-5 h-5" />, text: 'AI automatically classifies complaints with 94%+ accuracy' },
              { icon: <Shield className="w-5 h-5" />, text: 'Smart routing assigns complaints to the correct department' },
              { icon: <Users className="w-5 h-5" />, text: 'Duplicate detection prevents redundant work across departments' },
              { icon: <TrendingUp className="w-5 h-5" />, text: 'SLA prediction identifies at-risk complaints before violation' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  {item.icon}
                </div>
                <p className="text-sm text-slate-300 pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to="/how-it-works" className="btn-primary inline-flex items-center gap-2">
            See How It Works
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
