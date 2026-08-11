import { type ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Menu, X, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

export function DashboardLayout({
  children,
  navItems,
  title,
}: {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const basePath = `/${location.pathname.split('/')[1]}`;

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-800/50">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">GRACE AI</p>
            <p className="text-[10px] text-cyan-400 leading-tight">{roleLabel} Panel</p>
          </div>
        </Link>
      </div>

      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <span className="text-sm font-semibold text-cyan-400">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800/50">
        <button onClick={handleSignOut} className="sidebar-link w-full text-red-400/80 hover:text-red-400 hover:bg-red-500/5">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-slate-800/50 bg-slate-900/30 backdrop-blur-xl fixed inset-y-0 left-0">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-slate-900 border-r border-slate-800 animate-slide-in-right">
            <button
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-500 hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-white">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`${basePath}/notifications`}
                className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <Bell className="w-5 h-5" />
                <NotificationBadge userId={user.id} currentPath={location.pathname} />
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NotificationBadge({ userId, currentPath }: { userId: string; currentPath: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (currentPath.endsWith('/notifications')) return;
    let active = true;
    (async () => {
      const { count: c } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (active) setCount(c || 0);
    })();
    return () => { active = false; };
  }, [userId, currentPath]);

  if (count === 0 || currentPath.endsWith('/notifications')) return null;

  return (
    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
}
