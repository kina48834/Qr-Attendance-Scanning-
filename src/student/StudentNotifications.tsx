import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Bell, Calendar, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { PageHeader, RoleBadge } from '@/components/PageHeader';
import {
  upcomingPublishedWithoutAttendance,
  missedPublishedWithoutAttendance,
} from '@/utils/studentEventReminders';

export function StudentNotifications() {
  const { user } = useAuth();
  const { events, attendance, loading } = useData();

  const { upcoming, missed } = useMemo(() => {
    const uid = user?.id ?? '';
    if (!uid) return { upcoming: [], missed: [] };
    return {
      upcoming: upcomingPublishedWithoutAttendance(events, attendance, uid),
      missed: missedPublishedWithoutAttendance(events, attendance, uid),
    };
  }, [events, attendance, user?.id]);

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageHeader
        title="Reminders"
        description="Published events you have not checked into yet, and past events where attendance was not recorded."
        badge={<RoleBadge>Student</RoleBadge>}
      />

      {loading && (
        <p className="text-sm text-slate-500">Loading events…</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-sky-50/80 px-4 py-3">
          <Bell className="h-5 w-5 text-campus-primary shrink-0" aria-hidden />
          <h2 className="font-semibold text-slate-900">Upcoming — no attendance yet</h2>
          <span className="ml-auto rounded-full bg-campus-primary/15 px-2 py-0.5 text-xs font-semibold text-campus-primary tabular-nums">
            {upcoming.length}
          </span>
        </div>
        <div className="p-4 space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-600">
              No open published events missing your attendance. When organisers publish events, they will appear here until you check in with your personal event QR.
            </p>
          ) : (
            upcoming.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{evt.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {evt.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {format(new Date(evt.startDate), 'MMM d, yyyy HH:mm')} –{' '}
                      {format(new Date(evt.endDate), 'HH:mm')}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/student/show-qr?eventId=${evt.id}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-campus-primary px-4 py-2 text-sm font-semibold text-white hover:bg-campus-secondary"
                >
                  My QR
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-amber-50/80 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" aria-hidden />
          <h2 className="font-semibold text-slate-900">Missed — event ended without attendance</h2>
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 tabular-nums">
            {missed.length}
          </span>
        </div>
        <div className="p-4 space-y-3">
          {missed.length === 0 ? (
            <p className="text-sm text-slate-600">
              You have no past published or completed events without a check-in. Great job staying on top of attendance.
            </p>
          ) : (
            missed.map((evt) => (
              <div
                key={evt.id}
                className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4"
              >
                <h3 className="font-semibold text-slate-900">{evt.title}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Ended {format(new Date(evt.endDate), 'MMM d, yyyy HH:mm')} · {evt.location}
                </p>
                <p className="mt-2 text-xs text-amber-900/90">
                  No attendance was recorded for your account. Contact your organiser if this is a mistake.
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <p className="text-center text-sm">
        <Link to="/student" className="font-semibold text-campus-primary hover:underline">
          ← Back to all events
        </Link>
      </p>
    </div>
  );
}
