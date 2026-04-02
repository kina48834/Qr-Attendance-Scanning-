import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppLayout, adminNav } from '@/components/Layout/AppLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminEvents } from './AdminEvents';
import { AdminEventForm } from './AdminEventForm';
import { AdminUsers } from './AdminUsers';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminEventAttendancePage } from '@/components/EventAttendanceRoster';

export function AdminRoutes() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'administrator') {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout role="administrator" navItems={adminNav}>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="events/new" element={<AdminEventForm />} />
        <Route path="events/edit/:eventId" element={<AdminEventForm />} />
        <Route path="events/:eventId/attendance" element={<AdminEventAttendancePage />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AppLayout>
  );
}
