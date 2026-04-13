import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppLayout, studentNav } from '@/components/Layout/AppLayout';
import { StudentEvents } from './StudentEvents';
import { StudentScan } from './StudentScan';
import { StudentShowQR } from './StudentShowQR';
import { StudentProfile } from './StudentProfile';
import { StudentAttendanceHistory } from './StudentAttendanceHistory';
import { StudentNotifications } from './StudentNotifications';
import { effectiveUserApproval } from '@/utils/userApproval';

export function StudentRoutes() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const studentBlocked =
    isAuthenticated && user?.role === 'student' && effectiveUserApproval(user) !== 'approved';

  useEffect(() => {
    if (!studentBlocked || !user) return;
    const notice = user.approvalStatus === 'rejected' ? 'rejected' : 'pending';
    logout();
    navigate('/login', { replace: true, state: { studentAccountNotice: notice } });
  }, [studentBlocked, user, logout, navigate]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'student') {
    return <Navigate to="/" replace />;
  }
  if (studentBlocked) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-600 text-sm">
        Redirecting to sign in…
      </div>
    );
  }

  return (
    <AppLayout role="student" navItems={studentNav}>
      <Routes>
        <Route index element={<StudentEvents />} />
        <Route path="scan" element={<StudentScan />} />
        <Route path="show-qr" element={<StudentShowQR />} />
        <Route path="history" element={<StudentAttendanceHistory />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </AppLayout>
  );
}
