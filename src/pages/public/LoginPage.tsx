import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, LogIn, Eye, EyeOff, ArrowRight, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { role: 'Citizen', email: 'citizen@grace.ai', password: 'citizen123', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { role: 'Officer', email: 'officer@grace.ai', password: 'officer123', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { role: 'Admin', email: 'admin@grace.ai', password: 'admin123', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter email and password', 'warning');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Welcome back to GRACE AI', 'success');
      setTimeout(() => navigate('/citizen'), 100);
    }
  };

  const fillDemo = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-center items-center p-12 relative overflow-hidden bg-slate-900/30">
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute inset-0 radial-glow" />
          <div className="relative text-center max-w-md">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-white">GRACE AI</p>
                <p className="text-xs text-cyan-400">Smart Governance</p>
              </div>
            </Link>
            <h2 className="text-3xl font-bold text-white mb-4">Report. Track. Resolve.<br />Improve Governance.</h2>
            <p className="text-slate-400 mb-8">
              The AI-powered platform that transforms how citizens and governments
              collaborate on public grievance redressal.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {['12,548+ Complaints', '87.4% SLA Rate', '94.8% AI Accuracy'].map((stat, i) => (
                <div key={i} className="glass-card p-4 text-center">
                  <p className="text-sm font-semibold text-cyan-400">{stat}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 text-center">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">GRACE AI</span>
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-sm text-slate-400 mb-6">Access your GRACE AI dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-500">Demo Accounts</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              <div className="space-y-2">
                {demoAccounts.map(acc => (
                  <button
                    key={acc.email}
                    onClick={() => fillDemo(acc)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${acc.color}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-200">{acc.role}</div>
                      <div className="text-xs text-slate-500">{acc.email}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
