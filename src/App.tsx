import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type ReactNode, useEffect } from 'react';
import { useAuth, getDashboardRoute } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AIChatAssistant } from '@/components/AIChatAssistant';
import { LoadingScreen } from '@/components/ui';
import type { UserRole } from '@/types';

import { HomePage } from '@/pages/public/HomePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { HowItWorksPage } from '@/pages/public/HowItWorksPage';
import { SubmitComplaintPage } from '@/pages/public/SubmitComplaintPage';
import { TrackComplaintPage } from '@/pages/public/TrackComplaintPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';

import {
  CitizenDashboard,
  CitizenComplaints,
  CitizenNotifications,
  CitizenProfile,
  ComplaintDetails as CitizenComplaintDetails,
} from '@/pages/citizen/CitizenPages';

import {
  OfficerDashboard,
  OfficerComplaints,
  OfficerSLAMonitor,
  OfficerNotifications,
  OfficerProfile,
  OfficerComplaintDetails,
} from '@/pages/officer/OfficerPages';

import {
  AdminDashboard,
  AdminComplaints,
  AdminAnalytics,
  AdminHotspots,
  AdminForecast,
  AdminRootCause,
  AdminDepartments,
  AdminOfficers,
  AdminSLAMonitor,
  AdminNotifications,
  AdminProfile,
} from '@/pages/admin/AdminPages';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ProtectedRoute({ children, roles }: { children: ReactNode; roles: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen message="Authenticating..." />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Loading..." />;
  if (user) return <Navigate to={getDashboardRoute(user.role)} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/submit" element={<SubmitComplaintPage />} />
        <Route path="/track" element={<TrackComplaintPage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        {/* Citizen routes */}
        <Route path="/citizen" element={<ProtectedRoute roles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/citizen/submit" element={<ProtectedRoute roles={['citizen']}><SubmitComplaintPage /></ProtectedRoute>} />
        <Route path="/citizen/complaints" element={<ProtectedRoute roles={['citizen']}><CitizenComplaints /></ProtectedRoute>} />
        <Route path="/citizen/complaints/:id" element={<ProtectedRoute roles={['citizen']}><CitizenComplaintDetails /></ProtectedRoute>} />
        <Route path="/citizen/notifications" element={<ProtectedRoute roles={['citizen']}><CitizenNotifications /></ProtectedRoute>} />
        <Route path="/citizen/profile" element={<ProtectedRoute roles={['citizen']}><CitizenProfile /></ProtectedRoute>} />

        {/* Officer routes */}
        <Route path="/officer" element={<ProtectedRoute roles={['officer']}><OfficerDashboard /></ProtectedRoute>} />
        <Route path="/officer/complaints" element={<ProtectedRoute roles={['officer']}><OfficerComplaints /></ProtectedRoute>} />
        <Route path="/officer/complaints/:id" element={<ProtectedRoute roles={['officer']}><OfficerComplaintDetails /></ProtectedRoute>} />
        <Route path="/officer/sla" element={<ProtectedRoute roles={['officer']}><OfficerSLAMonitor /></ProtectedRoute>} />
        <Route path="/officer/notifications" element={<ProtectedRoute roles={['officer']}><OfficerNotifications /></ProtectedRoute>} />
        <Route path="/officer/profile" element={<ProtectedRoute roles={['officer']}><OfficerProfile /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/complaints" element={<ProtectedRoute roles={['admin']}><AdminComplaints /></ProtectedRoute>} />
        <Route path="/admin/complaints/:id" element={<ProtectedRoute roles={['admin']}><AdminComplaints /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/hotspots" element={<ProtectedRoute roles={['admin']}><AdminHotspots /></ProtectedRoute>} />
        <Route path="/admin/forecast" element={<ProtectedRoute roles={['admin']}><AdminForecast /></ProtectedRoute>} />
        <Route path="/admin/root-cause" element={<ProtectedRoute roles={['admin']}><AdminRootCause /></ProtectedRoute>} />
        <Route path="/admin/departments" element={<ProtectedRoute roles={['admin']}><AdminDepartments /></ProtectedRoute>} />
        <Route path="/admin/officers" element={<ProtectedRoute roles={['admin']}><AdminOfficers /></ProtectedRoute>} />
        <Route path="/admin/sla" element={<ProtectedRoute roles={['admin']}><AdminSLAMonitor /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin']}><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute roles={['admin']}><AdminProfile /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AIChatAssistant />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
