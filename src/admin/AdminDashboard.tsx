import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Users, Calendar, CalendarCheck, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader, RoleBadge } from '@/components/PageHeader';
import { StatCardLink } from '@/components/StatCard';
import { eventStatusBadgeClass } from '@/utils/eventStatusStyles';

export function AdminDashboard() {
  const { getStats, events } = useData();
  const stats = getStats();
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Administrator dashboard"
        description="System-wide overview — users, events, attendance, and analytics."
        badge={<RoleBadge>Admin</RoleBadge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardLink
          to="/admin/users"
          label="Total users"
          value={stats.totalUsers}
          icon={Users}
          iconClassName="bg-blue-500"
        />
        <StatCardLink
          to="/admin/events"
          label="Active events"
          value={stats.activeEvents}
          icon={Calendar}
          iconClassName="bg-campus-primary"
        />
        <StatCardLink
          to="/admin/events"
          label="Completed events"
          value={stats.completedEvents}
          icon={CalendarCheck}
          iconClassName="bg-emerald-600"
        />
        <StatCardLink
          to="/admin/analytics"
          label="Attendance records"
          value={stats.totalAttendanceRecords}
          icon={ClipboardList}
          iconClassName="bg-amber-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
          <h2 className="font-semibold text-slate-900">Recent events</h2>
          <p className="text-sm text-slate-600">Latest updates across the system</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/90 text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Organiser</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((evt) => (
                <tr key={evt.id} className="border-t border-slate-100 hover:bg-blue-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{evt.title}</td>
                  <td className="px-5 py-3 text-slate-600">{evt.organiserName}</td>
                  <td className="px-5 py-3">
                    <span className={eventStatusBadgeClass(evt.status)}>{evt.status}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 tabular-nums">{format(new Date(evt.updatedAt), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100">
          <Link
            to="/admin/events"
            className="text-sm font-medium text-campus-primary hover:text-campus-secondary transition-colors"
          >
            View all events →
          </Link>
        </div>
      </div>
    </div>
  );
}
