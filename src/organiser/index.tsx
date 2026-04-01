import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppLayout, organiserNav } from '@/components/Layout/AppLayout';
import { OrganiserDashboard } from './OrganiserDashboard';
import { OrganiserEvents } from './OrganiserEvents';
import { OrganiserEventForm } from './OrganiserEventForm';
import { OrganiserAttendance } from './OrganiserAttendance';
import { OrganiserScanAttendance } from './OrganiserScanAttendance';
import { OrganiserAnalytics } from './OrganiserAnalytics';

export function OrganiserRoutes() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'organiser') {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout role="organiser" navItems={organiserNav}>
      <Routes>
        <Route index element={<OrganiserDashboard />} />
        <Route path="events" element={<OrganiserEvents />} />
        <Route path="events/new" element={<OrganiserEventForm />} />
        <Route path="events/edit/:eventId" element={<OrganiserEventForm />} />
        <Route path="attendance" element={<OrganiserAttendance />} />
        <Route path="scan-attendance" element={<OrganiserScanAttendance />} />
        <Route path="analytics" element={<OrganiserAnalytics />} />
        <Route path="*" element={<Navigate to="/organiser" replace />} />
      </Routes>
    </AppLayout>
  );
}
