import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';

const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })));
const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })));
const AdminRoutes = lazy(() => import('@/admin').then((m) => ({ default: m.AdminRoutes })));
const OrganiserRoutes = lazy(() => import('@/organiser').then((m) => ({ default: m.OrganiserRoutes })));
const StudentRoutes = lazy(() => import('@/student').then((m) => ({ default: m.StudentRoutes })));
const TeacherRoutes = lazy(() => import('@/teacher').then((m) => ({ default: m.TeacherRoutes })));

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
      <div className="text-sm font-medium">Loading...</div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Suspense fallback={<RouteLoader />}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Home />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="/organiser/*" element={<OrganiserRoutes />} />
              <Route path="/student/*" element={<StudentRoutes />} />
              <Route path="/teacher/*" element={<TeacherRoutes />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </Suspense>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
