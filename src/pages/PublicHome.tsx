import { Link } from 'react-router-dom';
import { Calendar, QrCode, Users, BarChart3, LogIn } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export function PublicHome() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <BrandLogo variant="dark" size="md" to="/" className="min-w-0" />
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2 border border-campus-primary text-campus-primary rounded-lg font-medium hover:bg-campus-primary/10 transition-colors"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-campus-primary text-white rounded-lg font-medium hover:bg-campus-secondary transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            School Event Management
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Campus Connect brings events, attendance, and analytics into one place. Create events, track attendance with QR codes, and see participation at a glance.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-campus-primary text-white rounded-xl font-medium hover:bg-campus-secondary transition-colors text-lg"
          >
            <LogIn className="w-5 h-5" />
            Get started — Sign in
          </Link>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-campus-primary/10 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5 text-campus-primary" />
            </div>
            <h2 className="font-semibold text-slate-900 mb-2">Event Management</h2>
            <p className="text-sm text-slate-600">
              Create, publish, and manage school events. Students can browse and register in one place.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-campus-primary/10 flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5 text-campus-primary" />
            </div>
            <h2 className="font-semibold text-slate-900 mb-2">QR Attendance</h2>
            <p className="text-sm text-slate-600">
              One QR per event. Students scan with the app camera and attendance is recorded automatically.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-campus-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-campus-primary" />
            </div>
            <h2 className="font-semibold text-slate-900 mb-2">Analytics & Reports</h2>
            <p className="text-sm text-slate-600">
              View participation rates, attendance trends, and user activity by role.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-campus-primary" />
            Roles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-slate-50">
              <span className="font-medium text-slate-900">Administrator</span>
              <p className="text-slate-600 mt-1">Monitor users, events, and attendance across the system. Full oversight and analytics.</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <span className="font-medium text-slate-900">Organiser</span>
              <p className="text-slate-600 mt-1">Create and run events, display QR codes, and view real-time attendance.</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <span className="font-medium text-slate-900">Teacher</span>
              <p className="text-slate-600 mt-1">Create and manage events, track student attendance, and view analytics for your classes.</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <span className="font-medium text-slate-900">Student</span>
              <p className="text-slate-600 mt-1">Browse events, register, and scan QR to record attendance.</p>
            </div>
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link
            to="/login"
            className="text-campus-primary font-medium hover:underline"
          >
            Sign in to your account →
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200 mt-16 py-8 text-sm text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center">
          <BrandLogo variant="dark" size="xs" showTitle={false} to="/" />
          <p className="max-w-md leading-relaxed">
            Web-based school event management — events, QR attendance, and analytics in one place.
          </p>
        </div>
      </footer>
    </div>
  );
}
