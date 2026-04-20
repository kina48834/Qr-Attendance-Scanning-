import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppLayout, teacherNav } from '@/components/Layout/AppLayout';
import { TeacherDashboard } from './TeacherDashboard';
import { TeacherEvents } from './TeacherEvents';
import { TeacherAnalytics } from './TeacherAnalytics';
import { TeacherProfile } from './TeacherProfile';
import { TeacherEventAttendancePage } from '@/components/EventAttendanceRoster';
import { TeacherScanAttendance } from './TeacherScanAttendance';
import { effectiveUserApproval } from '@/utils/userApproval';

export function TeacherRoutes() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const teacherBlocked =
    isAuthenticated &&
    user?.role === 'teacher' &&
    effectiveUserApproval(user) !== 'approved';

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
        <Route path="events/new" element={<Navigate to="/teacher/events" replace />} />
        <Route path="events/edit/:eventId" element={<Navigate to="/teacher/events" replace />} />
        <Route path="events/:eventId/attendance" element={<TeacherEventAttendancePage />} />
        <Route path="scan-attendance" element={<TeacherScanAttendance />} />
        <Route path="users" element={<Navigate to="/teacher" replace />} />
        <Route path="profile" element={<TeacherProfile />} />
        <Route path="analytics" element={<TeacherAnalytics />} />
        <Route path="*" element={<Navigate to="/teacher" replace />} />
      </Routes>
    </AppLayout>
  );
}
