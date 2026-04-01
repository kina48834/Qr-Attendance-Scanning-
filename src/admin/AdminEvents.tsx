import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch } from '@/utils/eventSearch';
import { format } from 'date-fns';
import { Calendar, MapPin, User, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, RoleBadge } from '@/components/PageHeader';
import { eventStatusBadgeClass } from '@/utils/eventStatusStyles';

export function AdminEvents() {
  const { events, deleteEvent } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [events]
  );
  const visibleEvents = useMemo(() => filterEventsBySearch(sortedEvents, search), [sortedEvents, search]);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete event "${title}"? Attendance and registrations for this event will also be removed.`)) {
      deleteEvent(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="All events"
          description="Add, edit, and delete events. Assign organisers."
          badge={<RoleBadge>Admin</RoleBadge>}
        />
        <Link
          to="/admin/events/new"
          className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 bg-campus-primary text-white rounded-xl font-medium hover:bg-campus-secondary shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add event
        </Link>
      </div>

      {sortedEvents.length > 0 && (
        <EventListSearchBar id="admin-events-search" value={search} onChange={setSearch} className="max-w-xl" />
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Organiser</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleEvents.map((evt) => (
                <tr key={evt.id} className="border-t border-slate-100 hover:bg-teal-50/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{evt.title}</p>
                    <p className="text-sm text-slate-500 line-clamp-1">{evt.description}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {evt.location}
                  </td>
                  <td className="px-5 py-3 text-slate-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4 shrink-0" />
                    {format(new Date(evt.startDate), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-5 py-3 text-slate-600 flex items-center gap-1">
                    <User className="w-4 h-4 shrink-0" />
                    {evt.organiserName}
                  </td>
                  <td className="px-5 py-3">
                    <span className={eventStatusBadgeClass(evt.status)}>{evt.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/events/edit/${evt.id}`)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(evt.id, evt.title)}
                        className="p-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sortedEvents.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <p>No events yet.</p>
            <Link to="/admin/events/new" className="mt-2 inline-block text-campus-primary font-medium hover:underline">
              Add event
            </Link>
          </div>
        )}
        {sortedEvents.length > 0 && visibleEvents.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <p>No events match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
