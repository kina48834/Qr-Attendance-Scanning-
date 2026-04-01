import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch } from '@/utils/eventSearch';
import { format } from 'date-fns';
import { Calendar, MapPin, User, AlertCircle } from 'lucide-react';
import { PageHeader, RoleBadge } from '@/components/PageHeader';

export function StudentEvents() {
  const { events } = useData();
  const [search, setSearch] = useState('');
  const allEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [events]
  );
  const visibleEvents = useMemo(() => filterEventsBySearch(allEvents, search), [allEvents, search]);
  const isStarted = (e: (typeof events)[0]) => e.status === 'published' || e.status === 'completed';

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageHeader
        title="Events"
        description="Browse campus events. Scan the event QR once it has started to record attendance."
        badge={<RoleBadge>Student</RoleBadge>}
      />

      {allEvents.length > 0 && (
        <EventListSearchBar id="student-events-search" value={search} onChange={setSearch} className="max-w-xl" />
      )}

      <div className="grid gap-4">
        {allEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-600">
            No events posted yet. Check back when organisers add events.
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-600">
            No events match your search. Try a different title, location, or organiser name.
          </div>
        ) : (
          visibleEvents.map((evt) => {
            const started = isStarted(evt);
            return (
              <div
                key={evt.id}
                className={`bg-white rounded-xl border shadow-sm p-5 flex flex-wrap items-center gap-4 ${started ? 'border-slate-200' : 'border-amber-200 bg-amber-50/30'}`}
              >
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-slate-900">{evt.title}</h2>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">{evt.description}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {evt.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(evt.startDate), 'MMM d, yyyy HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {evt.organiserName}
                    </span>
                  </div>
                  {!started && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Event hasn&apos;t started yet. You cannot scan for QR attendance.</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {started ? (
                    <Link
                      to={`/student/scan?eventId=${evt.id}`}
                      className="px-4 py-2 bg-campus-primary text-white rounded-lg font-medium hover:bg-campus-secondary"
                    >
                      Scan event QR
                    </Link>
                  ) : (
                    <span className="px-4 py-2 rounded-lg bg-slate-200 text-slate-500 font-medium cursor-not-allowed">
                      QR for attendance (event not started)
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
