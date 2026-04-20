import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch } from '@/utils/eventSearch';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, QrCode } from 'lucide-react';

export function StudentScan() {
  const { events } = useData();
  const [eventListSearch, setEventListSearch] = useState('');

  const allEventsForList = useMemo(
    () => [...events].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [events]
  );
  const visibleEventsForList = useMemo(
    () => filterEventsBySearch(allEventsForList, eventListSearch),
    [allEventsForList, eventListSearch]
  );
  const isStarted = (e: (typeof events)[0]) => e.status === 'published' || e.status === 'completed';

  return (
    <div className="mx-auto w-full max-w-lg min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My event QR</h1>
        <p className="mt-1 text-slate-600">
          Each event has its own QR tied to <strong>your account</strong>. Open it when the event has started, then
          show it or save the image for the organiser to scan. <strong>First scan</strong> records time in;{' '}
          <strong>second scan</strong> records time out.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Your events</h2>
            <p className="mt-1 text-sm text-slate-600">
              Tap <strong>My QR</strong> for an event to view, download, or screenshot your code.
            </p>
          </div>
          {allEventsForList.length > 0 && (
            <EventListSearchBar
              id="student-myqr-events-search"
              value={eventListSearch}
              onChange={setEventListSearch}
            />
          )}
        </div>
        <ul className="divide-y divide-slate-100">
          {allEventsForList.length === 0 ? (
            <li className="px-5 py-8 text-center text-slate-500">No events yet.</li>
          ) : visibleEventsForList.length === 0 ? (
            <li className="px-5 py-8 text-center text-slate-500">No events match your search.</li>
          ) : (
            visibleEventsForList.map((evt) => {
              const started = isStarted(evt);
              return (
                <li
                  key={evt.id}
                  className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 ${!started ? 'bg-amber-50/50' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{evt.title}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(evt.startDate), 'MMM d, yyyy HH:mm')}
                    </p>
                    {!started && (
                      <p className="mt-1 text-xs text-amber-800">Event hasn&apos;t started — QR opens when it does.</p>
                    )}
                  </div>
                  {started ? (
                    <Link
                      to={`/student/show-qr?eventId=${evt.id}`}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-campus-primary px-4 py-2 text-sm font-semibold text-white hover:bg-campus-secondary"
                    >
                      <QrCode className="h-4 w-4" />
                      My QR
                    </Link>
                  ) : (
                    <span className="shrink-0 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500">
                      Not started
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>

      <Link
        to="/student"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>
    </div>
  );
}
