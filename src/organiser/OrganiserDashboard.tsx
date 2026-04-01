import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Calendar, CalendarCheck, Users } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader, RoleBadge } from '@/components/PageHeader';
import { StatCardLink, StatCardStatic } from '@/components/StatCard';
import { eventStatusBadgeClass } from '@/utils/eventStatusStyles';

export function OrganiserDashboard() {
  const { user } = useAuth();
  const { events, getEventAttendance } = useData();
  const myEvents = events.filter((e) => e.organiserId === user?.id);
  const active = myEvents.filter((e) => e.status === 'published').length;
  const completed = myEvents.filter((e) => e.status === 'completed').length;
  const recent = [...myEvents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organiser dashboard"
        description="Your events, attendance, and quick actions in one place."
        badge={<RoleBadge>Organiser</RoleBadge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCardLink
          to="/organiser/events"
          label="Total events"
          value={myEvents.length}
          icon={Calendar}
          iconClassName="bg-campus-primary"
        />
        <StatCardStatic label="Active (published)" value={active} icon={CalendarCheck} iconClassName="bg-emerald-600" />
        <StatCardStatic label="Completed" value={completed} icon={Users} iconClassName="bg-slate-600" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Your recent events</h2>
            <p className="text-sm text-slate-600">Quick access to event management</p>
          </div>
          <Link
            to="/organiser/events/new"
            className="inline-flex justify-center px-4 py-2.5 bg-campus-primary text-white rounded-xl text-sm font-medium hover:bg-campus-secondary shadow-sm transition-colors"
          >
            New event
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/90 text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Attendance</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((evt) => {
                const count = getEventAttendance(evt.id).length;
                return (
                  <tr key={evt.id} className="border-t border-slate-100 hover:bg-teal-50/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900">{evt.title}</td>
                    <td className="px-5 py-3 text-slate-600 tabular-nums">{format(new Date(evt.startDate), 'MMM d, yyyy')}</td>
                    <td className="px-5 py-3 text-slate-600">{count} scanned</td>
                    <td className="px-5 py-3">
                      <span className={eventStatusBadgeClass(evt.status)}>{evt.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100">
          <Link
            to="/organiser/events"
            className="text-sm font-medium text-campus-primary hover:text-campus-secondary transition-colors"
          >
            View all events →
          </Link>
        </div>
      </div>
    </div>
  );
}
