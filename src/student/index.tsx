import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppLayout, studentNav } from '@/components/Layout/AppLayout';
import { StudentEvents } from './StudentEvents';
import { StudentScan } from './StudentScan';
import { StudentShowQR } from './StudentShowQR';
import { StudentProfile } from './StudentProfile';
import { StudentAttendanceHistory } from './StudentAttendanceHistory';

export function StudentRoutes() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'student') {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout role="student" navItems={studentNav}>
      <Routes>
        <Route index element={<StudentEvents />} />
        <Route path="scan" element={<StudentScan />} />
        <Route path="show-qr" element={<StudentShowQR />} />
        <Route path="history" element={<StudentAttendanceHistory />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </AppLayout>
  );
}
