import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch } from '@/utils/eventSearch';
import { format } from 'date-fns';
import { Calendar, ClipboardList, MapPin, User, ScanLine } from 'lucide-react';
import { PageHeader, RoleBadge } from '@/components/PageHeader';
import { eventStatusBadgeClass } from '@/utils/eventStatusStyles';

export function TeacherEvents() {
  const { user } = useAuth();
  const { events, getEventAttendance } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [events]
  );
  const visibleEvents = useMemo(() => filterEventsBySearch(sortedEvents, search), [sortedEvents, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="All events"
        description="Browse campus events, open attendance history, and scan students for events you own. You cannot edit or delete events — administrators and organisers handle that."
        badge={<RoleBadge>Teacher</RoleBadge>}
      />

      {sortedEvents.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <EventListSearchBar
            id="teacher-events-search"
            value={search}
            onChange={setSearch}
            size="compact"
            className="sm:max-w-sm"
          />
          <p className="text-xs text-slate-500 tabular-nums">
            {visibleEvents.length} of {sortedEvents.length} event{sortedEvents.length === 1 ? '' : 's'}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/95">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-[32%]">
                  Event
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-[30%]">
                  When &amp; where
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-[12%]">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-[22%] min-w-[10rem]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 align-top">
                    <p className="font-semibold text-slate-900 leading-snug">{evt.title}</p>
                    <p className="mt-1 text-slate-500 text-xs leading-relaxed line-clamp-2">{evt.description || '—'}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600">
                    <div className="space-y-1.5">
                      <p className="flex items-start gap-2 text-xs sm:text-sm">
                        <MapPin className="w-3.5 h-3.5 text-campus-primary shrink-0 mt-0.5" aria-hidden />
                        <span className="break-words">{evt.location}</span>
                      </p>
                      <p className="flex items-start gap-2 text-xs sm:text-sm">
                        <Calendar className="w-3.5 h-3.5 text-campus-primary shrink-0 mt-0.5" aria-hidden />
                        <span className="tabular-nums">{format(new Date(evt.startDate), 'MMM d, yyyy · HH:mm')}</span>
                      </p>
                      <p className="flex items-start gap-2 text-xs sm:text-sm">
                        <User className="w-3.5 h-3.5 text-campus-primary shrink-0 mt-0.5" aria-hidden />
                        <span className="break-words">{evt.organiserName}</span>
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className={eventStatusBadgeClass(evt.status)}>{evt.status}</span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {evt.organiserId === user?.id &&
                        (evt.status === 'published' || evt.status === 'completed') && (
                          <Link
                            to={`/teacher/scan-attendance?eventId=${evt.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-campus-primary px-2.5 py-1.5 text-xs font-medium text-white hover:bg-campus-secondary"
                            title="Scan student QR for this event"
                          >
                            <ScanLine className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden sm:inline">Scan</span>
                          </Link>
                        )}
                      <button
                        type="button"
                        onClick={() => navigate(`/teacher/events/${evt.id}/attendance`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-100/80"
                        title={`Attendance history (${getEventAttendance(evt.id).length})`}
                      >
                        <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Attendance</span>
                        <span className="sm:hidden">List</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sortedEvents.length === 0 && (
          <div className="p-14 text-center text-slate-500">
            <p className="font-medium text-slate-700">No events yet</p>
            <p className="text-sm mt-1 max-w-md mx-auto">
              When an administrator or organiser publishes an event, it will appear here so you can open the student roster.
            </p>
          </div>
        )}
        {sortedEvents.length > 0 && visibleEvents.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">No events match your search.</div>
        )}
      </div>
    </div>
  );
}
