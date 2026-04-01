import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch } from '@/utils/eventSearch';
import { format } from 'date-fns';
import { Calendar, MapPin, Edit2, Trash2, QrCode, Users, Play, Undo2 } from 'lucide-react';
import { PageHeader, RoleBadge } from '@/components/PageHeader';
import { eventStatusBadgeClass } from '@/utils/eventStatusStyles';

export function OrganiserEvents() {
  const { user } = useAuth();
  const { events, deleteEvent, updateEvent, getEventAttendance } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const myEvents = useMemo(
    () =>
      [...events]
        .filter((e) => e.organiserId === user?.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [events, user?.id]
  );
  const visibleEvents = useMemo(() => filterEventsBySearch(myEvents, search), [myEvents, search]);

  const handleStartEvent = (id: string) => {
    updateEvent(id, { status: 'published' });
  };

  const handleUndoEventStart = (id: string) => {
    updateEvent(id, { status: 'draft' });
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete event "${title}"?`)) {
      deleteEvent(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="My events"
          description={
            <>
              Create, edit, and manage your events. Use <strong>Start event</strong> to open for attendance; use{' '}
              <strong>Undo event start</strong> to set back to draft.
            </>
          }
          badge={<RoleBadge>Organiser</RoleBadge>}
        />
        <Link
          to="/organiser/events/new"
          className="inline-flex shrink-0 items-center justify-center px-4 py-2.5 bg-campus-primary text-white rounded-xl font-medium hover:bg-campus-secondary shadow-sm transition-colors"
        >
          New event
        </Link>
      </div>

      {myEvents.length > 0 && (
        <EventListSearchBar id="organiser-events-search" value={search} onChange={setSearch} className="max-w-xl" />
      )}

      <div className="grid gap-4">
        {myEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-12 text-center text-slate-600">
            <p>No events yet. Create your first event to get started.</p>
            <Link to="/organiser/events/new" className="mt-4 inline-block text-campus-primary font-medium hover:underline">
              Create event
            </Link>
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-12 text-center text-slate-600">
            No events match your search. Clear the filter or try another keyword.
          </div>
        ) : (
          visibleEvents.map((evt) => {
            const attendanceCount = getEventAttendance(evt.id).length;
            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 flex flex-wrap items-center gap-4 hover:shadow-card-hover transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-slate-900">{evt.title}</h2>
                  <p className="text-sm text-slate-500 line-clamp-1">{evt.description}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {evt.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(evt.startDate), 'MMM d, yyyy HH:mm')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-campus-primary/10 text-campus-dark font-medium">
                      {attendanceCount} student{attendanceCount !== 1 ? 's' : ''} scanned
                    </span>
                  </div>
                  <span className={`mt-2 ${eventStatusBadgeClass(evt.status)}`}>{evt.status}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {evt.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => handleStartEvent(evt.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                    >
                      <Play className="w-4 h-4" />
                      Start event
                    </button>
                  )}
                  {evt.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => handleUndoEventStart(evt.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500 text-amber-700 bg-amber-50 font-medium hover:bg-amber-100"
                    >
                      <Undo2 className="w-4 h-4" />
                      Undo event start
                    </button>
                  )}
                  <Link
                    to={`/organiser/attendance?eventId=${evt.id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-campus-primary text-campus-primary bg-campus-primary/5 font-medium hover:bg-campus-primary/10"
                  >
                    <Users className="w-4 h-4" />
                    See attendance list
                  </Link>
                  <Link
                    to={`/organiser/attendance?eventId=${evt.id}`}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                    title="View QR / Attendance"
                  >
                    <QrCode className="w-5 h-5 text-slate-600" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate(`/organiser/events/edit/${evt.id}`)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(evt.id, evt.title)}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
