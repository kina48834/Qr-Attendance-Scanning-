import { useState, useMemo, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { BrandLogo } from '@/components/BrandLogo';
import { studentReminderTotalCount } from '@/utils/studentEventReminders';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  LogOut,
  Menu,
  QrCode,
  User,
  History,
  Bell,
  X,
} from 'lucide-react';

const STUDENT_REMINDERS_PATH = '/student/notifications';

interface AppLayoutProps {
  children: ReactNode;
  role: 'administrator' | 'organiser' | 'student' | 'teacher';
  navItems: { to: string; label: string; icon: ReactNode }[];
}

function roleLabel(role?: string): string {
  if (role === 'administrator') return 'Administrator';
  if (role === 'organiser') return 'Organiser';
  if (role === 'teacher') return 'Teacher';
  if (role === 'student') return 'Student';
  return 'User';
}

/** Active nav item: exact match, or prefix match when no more specific sibling route matches. */
function navItemIsActive(pathname: string, to: string, allTos: string[]): boolean {
  if (pathname === to) return true;
  if (!pathname.startsWith(`${to}/`)) return false;
  return !allTos.some(
    (other) =>
      other !== to &&
      other.startsWith(`${to}/`) &&
      (pathname === other || pathname.startsWith(`${other}/`))
  );
}

export function AppLayout({ children, navItems, role }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { events, attendance } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const studentReminderBadge = useMemo(() => {
    if (role !== 'student' || !user?.id) return 0;
    return studentReminderTotalCount(events, attendance, user.id);
  }, [role, user?.id, events, attendance]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/25 to-slate-100 text-slate-900 flex">
      {/* Mobile menu backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity md:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileMenu}
      />

      {/* Sidebar: drawer on mobile, fixed sidebar on md+ */}
      <aside
        className={`bg-campus-dark text-white flex flex-col fixed h-full z-30 transition-all duration-300
          w-64 md:w-56
          ${sidebarOpen ? 'md:w-56' : 'md:w-20'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-3 sm:p-4 flex items-center justify-between gap-2 border-b border-campus-primary shrink-0">
          <BrandLogo
            variant="light"
            size={sidebarOpen || mobileMenuOpen ? 'md' : 'sm'}
            showTitle={sidebarOpen || mobileMenuOpen}
            to="/"
            onClick={closeMobileMenu}
            className={
              sidebarOpen || mobileMenuOpen
                ? 'min-w-0 flex-1 overflow-hidden'
                : 'min-w-0 md:flex-1 md:justify-center overflow-hidden'
            }
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:block p-2 rounded hover:bg-campus-primary"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="md:hidden p-2 rounded hover:bg-campus-primary"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {(() => {
            const navPaths = navItems.map((n) => n.to);
            return navItems.map(({ to, label, icon }) => {
              const isActive = navItemIsActive(location.pathname, to, navPaths);
              const showReminderBadge =
                to === STUDENT_REMINDERS_PATH && studentReminderBadge > 0;
              const badgeText =
                studentReminderBadge > 99 ? '99+' : String(studentReminderBadge);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMobileMenu}
                  title={
                    showReminderBadge
                      ? `${studentReminderBadge} reminder${studentReminderBadge === 1 ? '' : 's'}`
                      : undefined
                  }
                  aria-label={
                    showReminderBadge
                      ? `${label}, ${studentReminderBadge} item${studentReminderBadge === 1 ? '' : 's'}`
                      : undefined
                  }
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] ${
                    isActive ? 'bg-campus-primary text-white' : 'hover:bg-campus-primary/70'
                  }`}
                >
                  <span className="relative flex shrink-0 items-center justify-center">
                    {icon}
                    {showReminderBadge && (
                      <span
                        className={`absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums shadow-md ring-2 ${
                          isActive ? 'ring-campus-primary' : 'ring-campus-dark'
                        }`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </span>
                  {(sidebarOpen || mobileMenuOpen) && <span className="min-w-0 flex-1 truncate">{label}</span>}
                </Link>
              );
            });
          })()}
        </nav>
        <div className="p-2 border-t border-campus-primary shrink-0">
          <div className={`px-3 py-2 flex items-center gap-3 rounded-xl bg-campus-primary/15 ${!sidebarOpen && !mobileMenuOpen ? 'justify-center' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-campus-primary/30 ring-2 ring-white/20">
              {user?.avatar ? (
                <img src={user.avatar} alt={`${user.name} profile`} className="h-full w-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            {(sidebarOpen || mobileMenuOpen) && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-campus-light">{roleLabel(user?.role)}</p>
                {user?.publicId !== undefined && (
                  <p className="text-[11px] text-campus-light/85 tabular-nums">User ID: {user.publicId}</p>
                )}
                <p className="truncate text-xs text-campus-light/80">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-campus-primary/70 transition-colors min-h-[44px]"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(sidebarOpen || mobileMenuOpen) && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Mobile top bar with menu button */}
        <header className="md:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-700 shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <BrandLogo variant="dark" size="sm" to="/" className="min-w-0 flex-1" />
        </header>
        <main
          className={`flex-1 p-4 sm:p-6 transition-all duration-300 min-w-0 ${
            sidebarOpen ? 'md:ml-56' : 'md:ml-20'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/admin/events', label: 'Events', icon: <Calendar className="w-5 h-5" /> },
  { to: '/admin/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
  { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { to: '/admin/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
];

export const organiserNav = [
  { to: '/organiser', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/organiser/events', label: 'My Events', icon: <Calendar className="w-5 h-5" /> },
  { to: '/organiser/events/new', label: 'New Event', icon: <Calendar className="w-5 h-5" /> },
  { to: '/organiser/attendance', label: 'Attendance', icon: <QrCode className="w-5 h-5" /> },
  { to: '/organiser/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { to: '/organiser/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
];

export const studentNav = [
  { to: '/student', label: 'Events', icon: <Calendar className="w-5 h-5" /> },
  { to: '/student/notifications', label: 'Reminders', icon: <Bell className="w-5 h-5" /> },
  { to: '/student/scan', label: 'My event QR', icon: <QrCode className="w-5 h-5" /> },
  { to: '/student/history', label: 'History of attendance', icon: <History className="w-5 h-5" /> },
  { to: '/student/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
];

export const teacherNav = [
  { to: '/teacher', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/teacher/events', label: 'Events', icon: <Calendar className="w-5 h-5" /> },
  { to: '/teacher/scan-attendance', label: 'Scan students', icon: <QrCode className="w-5 h-5" /> },
  { to: '/teacher/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { to: '/teacher/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
];

