import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { QRCodeDisplay } from '@/components/QR/QRCodeDisplay';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch, textMatchesEventSearch } from '@/utils/eventSearch';
import { getEventQrCodeData } from '@/utils/attendanceQR';
import { format } from 'date-fns';
import { Users } from 'lucide-react';

export function OrganiserAttendance() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const { events, getEventAttendance, attendance: allAttendance } = useData();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventId);
  const [eventSearch, setEventSearch] = useState('');

  const selectableEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          e.organiserId === user?.id && (e.status === 'published' || e.status === 'completed')
      ),
    [events, user?.id]
  );
  const filteredSelectableEvents = useMemo(() => {
    const filtered = filterEventsBySearch(selectableEvents, eventSearch);
    if (!selectedEventId || filtered.some((e) => e.id === selectedEventId)) return filtered;
    const current = selectableEvents.find((e) => e.id === selectedEventId);
    return current ? [current, ...filtered] : filtered;
  }, [selectableEvents, eventSearch, selectedEventId]);
  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const attendance = selectedEventId ? getEventAttendance(selectedEventId) : [];
  const allMyAttendance = useMemo(() => {
    return allAttendance
      .filter((a) =>
        events.some((e) => e.id === a.eventId && e.organiserId === user?.id)
      )
      .map((a) => ({ ...a, eventTitle: events.find((e) => e.id === a.eventId)?.title ?? '—' }))
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }, [allAttendance, events, user?.id]);
  const visibleAttendanceRows = useMemo(
    () =>
      allMyAttendance.filter((a) =>
        textMatchesEventSearch([a.eventTitle, a.userName, a.userEmail].join(' '), eventSearch)
      ),
    [allMyAttendance, eventSearch]
  );

  useEffect(() => {
    if (eventId && selectableEvents.some((e) => e.id === eventId)) setSelectedEventId(eventId);
    else if (!selectedEventId && selectableEvents.length > 0) setSelectedEventId(selectableEvents[0].id);
  }, [eventId, selectableEvents, selectedEventId]);

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-slate-600 mt-1">Event QR for students, scan student QR codes, and view list</p>
        </div>
        <Link
          to="/organiser/scan-attendance"
          className="px-4 py-2.5 bg-campus-primary text-white rounded-lg font-medium hover:bg-campus-secondary shrink-0 w-full sm:w-auto text-center"
        >
          Scan student QR codes
        </Link>
      </div>

      {selectableEvents.length > 0 && (
        <EventListSearchBar
          id="organiser-attendance-events-search"
          value={eventSearch}
          onChange={setEventSearch}
          className="max-w-xl"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-3">Event QR Code</h2>
          <p className="text-sm text-slate-600 mb-4">
            Students scan this event QR (Scan QR) to record attendance.
          </p>
          <div className="flex flex-col items-center">
            {selectedEvent ? (
              <>
                <QRCodeDisplay
                  value={getEventQrCodeData(selectedEvent.id, selectedEvent.qrCodeData)}
                  size={220}
                  eventTitle={selectedEvent.title}
                />
                <p className="mt-2 text-xs text-slate-500 font-mono">Event code: {getEventQrCodeData(selectedEvent.id, selectedEvent.qrCodeData)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Students scan this QR on the Scan QR page to record attendance.</p>
              </>
            ) : (
              <div className="text-slate-500 py-8">Select an event to show its QR code.</div>
            )}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select event</label>
            <select
              value={selectedEventId ?? ''}
              onChange={(e) => setSelectedEventId(e.target.value || null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
            >
              <option value="">Choose event...</option>
              {filteredSelectableEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} — {format(new Date(e.startDate), 'MMM d')}
                </option>
              ))}
            </select>
            {selectableEvents.length > 0 && filteredSelectableEvents.length === 0 && (
              <p className="text-sm text-amber-700 mt-2">No events match your search. Clear the filter to see all your events.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Attendance list</h2>
          </div>
          {selectedEvent ? (
            <>
              <div className="px-5 py-2 bg-slate-50 text-sm text-slate-600">
                {attendance.length} scan(s) for &quot;{selectedEvent.title}&quot;
              </div>
              <div className="max-h-96 overflow-x-auto overflow-y-auto">
                <table className="w-full min-w-[400px]">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-sm text-slate-600 border-b border-slate-200">
                      <th className="px-5 py-3 font-medium">Event</th>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Scanned at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a) => (
                      <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-3 text-slate-700 font-medium">{selectedEvent.title}</td>
                        <td className="px-5 py-3 font-medium text-slate-900">{a.userName}</td>
                        <td className="px-5 py-3 text-slate-600">{a.userEmail}</td>
                        <td className="px-5 py-3 text-slate-600">{format(new Date(a.scannedAt), 'MMM d, yyyy HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">Select an event to view attendance.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">All attendance (by event name)</h2>
          <p className="text-sm text-slate-600 mt-1">Every student who scanned for your events, with event name</p>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full min-w-[400px]">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-sm text-slate-600 border-b border-slate-200">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Scanned at</th>
              </tr>
            </thead>
            <tbody>
              {visibleAttendanceRows.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-700 font-medium">{a.eventTitle}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{a.userName}</td>
                  <td className="px-5 py-3 text-slate-600">{a.userEmail}</td>
                  <td className="px-5 py-3 text-slate-600">{format(new Date(a.scannedAt), 'MMM d, yyyy HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {allMyAttendance.length === 0 && (
          <div className="p-8 text-center text-slate-500">No scanned attendance for your events yet.</div>
        )}
        {allMyAttendance.length > 0 && visibleAttendanceRows.length === 0 && (
          <div className="p-8 text-center text-slate-500">No rows match your search.</div>
        )}
      </div>
    </div>
  );
}
