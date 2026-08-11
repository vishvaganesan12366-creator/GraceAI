import { Link, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, FileText, Search, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardRoute } from '@/contexts/AuthContext';

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const links = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Submit Complaint', path: '/submit' },
    { label: 'Track Complaint', path: '/track' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white leading-tight">GRACE AI</span>
              <span className="text-[10px] text-cyan-400 leading-tight">Smart Governance</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link to={getDashboardRoute(user.role)} className="btn-secondary text-sm flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="btn-ghost text-sm flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/track" className="btn-ghost text-sm flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Track
                </Link>
                <Link to="/submit" className="btn-secondary text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Submit
                </Link>
                <Link to="/login" className="btn-primary text-sm flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-800/50 space-y-1">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-800/50">
              {user ? (
                <>
                  <Link
                    to={getDashboardRoute(user.role)}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-cyan-400 hover:bg-slate-800/50"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-cyan-400 hover:bg-slate-800/50"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export function PublicFooter() {
  const footerLinks = [
    {
      title: 'Platform',
      links: [
        { label: 'Home', path: '/' },
        { label: 'About', path: '/about' },
        { label: 'How It Works', path: '/how-it-works' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'Submit Complaint', path: '/submit' },
        { label: 'Track Complaint', path: '/track' },
        { label: 'Citizen Dashboard', path: '/citizen' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Login', path: '/login' },
        { label: 'Register', path: '/register' },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-800/50 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white">GRACE AI</p>
                <p className="text-[10px] text-cyan-400">Smart Governance</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Grievance Redressal & Citizen Empowerment Platform powered by AI.
            </p>
            <p className="text-xs text-slate-600 mt-3">Report. Track. Resolve. Improve Governance.</p>
          </div>

          {footerLinks.map(section => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} GRACE AI. Built for Smart Governance.
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer">Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
