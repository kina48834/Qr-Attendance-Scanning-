import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppLayout, teacherNav } from '@/components/Layout/AppLayout';
import { TeacherDashboard } from './TeacherDashboard';
import { TeacherEvents } from './TeacherEvents';
import { TeacherEventForm } from './TeacherEventForm';
import { TeacherUsers } from './TeacherUsers';
import { TeacherAnalytics } from './TeacherAnalytics';
import { TeacherEventAttendancePage } from '@/components/EventAttendanceRoster';

export function TeacherRoutes() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const teacherBlocked =
    isAuthenticated &&
    user?.role === 'teacher' &&
    (user.approvalStatus ?? 'approved') !== 'approved';

  useEffect(() => {
    if (!teacherBlocked || !user) return;
    const notice = user.approvalStatus === 'rejected' ? 'rejected' : 'pending';
    logout();
    navigate('/login', { replace: true, state: { teacherAccountNotice: notice } });
  }, [teacherBlocked, user, logout, navigate]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'teacher') {
    return <Navigate to="/" replace />;
  }
  if (teacherBlocked) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-600 text-sm">
        Redirecting to sign in…
      </div>
    );
  }

  return (
    <AppLayout role="teacher" navItems={teacherNav}>
      <Routes>
        <Route index element={<TeacherDashboard />} />
        <Route path="events" element={<TeacherEvents />} />
        <Route path="events/new" element={<TeacherEventForm />} />
        <Route path="events/edit/:eventId" element={<TeacherEventForm />} />
        <Route path="events/:eventId/attendance" element={<TeacherEventAttendancePage />} />
        <Route path="users" element={<TeacherUsers />} />
        <Route path="analytics" element={<TeacherAnalytics />} />
        <Route path="*" element={<Navigate to="/teacher" replace />} />
      </Routes>
    </AppLayout>
  );
}
