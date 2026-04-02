import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { QRCodeDisplay } from '@/components/QR/QRCodeDisplay';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch, textMatchesEventSearch } from '@/utils/eventSearch';
import { getEventQrCodeData } from '@/utils/attendanceQR';
import { format } from 'date-fns';
import { Users, QrCode } from 'lucide-react';
import { PageHeader, RoleBadge } from '@/components/PageHeader';
import { AttendanceExportButtons } from '@/components/AttendanceExportButtons';

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

  const selectedExportRecords = useMemo(
    () => attendance.map((a) => ({ userName: a.userName, userEmail: a.userEmail, scannedAt: a.scannedAt })),
    [attendance]
  );

  const selectedExportMeta = useMemo(() => {
    if (!selectedEvent) return null;
    return {
      title: selectedEvent.title,
      location: selectedEvent.location,
      startDate: selectedEvent.startDate,
      organiserName: selectedEvent.organiserName,
    };
  }, [selectedEvent]);

  const onSelectedPdf = useCallback(async () => {
    if (!selectedExportMeta) return;
    const { exportSingleEventAttendancePdf } = await import('@/utils/attendanceExport');
    exportSingleEventAttendancePdf(selectedExportMeta, selectedExportRecords);
  }, [selectedExportMeta, selectedExportRecords]);

  const onSelectedExcel = useCallback(async () => {
    if (!selectedExportMeta) return;
    const { exportSingleEventAttendanceXlsx } = await import('@/utils/attendanceExport');
    exportSingleEventAttendanceXlsx(selectedExportMeta, selectedExportRecords);
  }, [selectedExportMeta, selectedExportRecords]);

  const multiExportRows = useMemo(
    () =>
      visibleAttendanceRows.map((a) => ({
        eventTitle: a.eventTitle,
        userName: a.userName,
        userEmail: a.userEmail,
        scannedAt: a.scannedAt,
      })),
    [visibleAttendanceRows]
  );

  const onAllPdf = useCallback(async () => {
    const { exportMultiEventAttendancePdf } = await import('@/utils/attendanceExport');
    exportMultiEventAttendancePdf(
      'All my events — attendance',
      'Filtered list (matches current search)',
      multiExportRows
    );
  }, [multiExportRows]);

  const onAllExcel = useCallback(async () => {
    const { exportMultiEventAttendanceXlsx } = await import('@/utils/attendanceExport');
    exportMultiEventAttendanceXlsx('All my events — attendance', multiExportRows);
  }, [multiExportRows]);

  useEffect(() => {
    if (eventId && selectableEvents.some((e) => e.id === eventId)) setSelectedEventId(eventId);
    else if (!selectedEventId && selectableEvents.length > 0) setSelectedEventId(selectableEvents[0].id);
  }, [eventId, selectableEvents, selectedEventId]);

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Attendance"
          description="Event QR for students, scan student QR codes, and view lists. Export rosters as PDF or Excel."
          badge={<RoleBadge>Organiser</RoleBadge>}
        />
        <Link
          to="/organiser/scan-attendance"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-campus-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/15 transition-colors hover:bg-campus-secondary"
        >
          <QrCode className="h-4 w-4" aria-hidden />
          Scan student QR codes
        </Link>
      </div>

      {selectableEvents.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <EventListSearchBar
            id="organiser-attendance-events-search"
            value={eventSearch}
            onChange={setEventSearch}
            size="compact"
            className="sm:max-w-sm"
            placeholder="Filter events and attendance rows…"
          />
          <p className="text-xs text-slate-500 tabular-nums">
            {visibleAttendanceRows.length} of {allMyAttendance.length} attendance row
            {allMyAttendance.length === 1 ? '' : 's'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <h2 className="font-semibold text-slate-900">Event QR code</h2>
          <p className="mt-1 text-sm text-slate-600">
            Students scan this event QR (Scan QR) to record attendance.
          </p>
          <div className="mt-4 flex flex-col items-center">
            {selectedEvent ? (
              <>
                <QRCodeDisplay
                  value={getEventQrCodeData(selectedEvent.id, selectedEvent.qrCodeData)}
                  size={220}
                  eventTitle={selectedEvent.title}
                />
                <p className="mt-2 font-mono text-xs text-slate-500">
                  Event code: {getEventQrCodeData(selectedEvent.id, selectedEvent.qrCodeData)}
                </p>
                <p className="mt-0.5 text-center text-xs text-slate-500">
                  Students scan this QR on the Scan QR page to record attendance.
                </p>
              </>
            ) : (
              <div className="py-8 text-slate-500">Select an event to show its QR code.</div>
            )}
          </div>
          <div className="mt-4">
            <label htmlFor="organiser-attendance-event-select" className="mb-2 block text-sm font-medium text-slate-700">
              Select event
            </label>
            <select
              id="organiser-attendance-event-select"
              value={selectedEventId ?? ''}
              onChange={(e) => setSelectedEventId(e.target.value || null)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-campus-primary focus:ring-2 focus:ring-campus-primary"
            >
              <option value="">Choose event…</option>
              {filteredSelectableEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} — {format(new Date(e.startDate), 'MMM d')}
                </option>
              ))}
            </select>
            {selectableEvents.length > 0 && filteredSelectableEvents.length === 0 && (
              <p className="mt-2 text-sm text-amber-700">
                No events match your search. Clear the filter to see all your events.
              </p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-5 w-5 shrink-0 text-campus-primary" aria-hidden />
              <div>
                <h2 className="font-semibold text-slate-900">Attendance list</h2>
                {selectedEvent ? (
                  <p className="text-sm text-slate-500">
                    {attendance.length} scan{attendance.length === 1 ? '' : 's'} — {selectedEvent.title}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Select an event</p>
                )}
              </div>
            </div>
            <AttendanceExportButtons
              disabled={!selectedEvent || attendance.length === 0}
              onExportPdf={onSelectedPdf}
              onExportExcel={onSelectedExcel}
              exportLabel="Selected event"
            />
          </div>
          {selectedEvent ? (
            <div className="max-h-96 overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[400px] text-sm">
                <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Scanned at
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                        No scans yet for this event.
                      </td>
                    </tr>
                  ) : (
                    attendance.map((a, i) => (
                      <tr key={a.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 tabular-nums text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{a.userName}</td>
                        <td className="px-4 py-3 text-slate-600">{a.userEmail}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">
                          {format(new Date(a.scannedAt), 'MMM d, yyyy HH:mm')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">Select an event to view attendance.</div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-semibold text-slate-900">All attendance (by event)</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Every student who scanned for your events — respects the search filter above
            </p>
          </div>
          <AttendanceExportButtons
            disabled={visibleAttendanceRows.length === 0}
            onExportPdf={onAllPdf}
            onExportExcel={onAllExcel}
            exportLabel="Filtered table"
          />
        </div>
        <div className="max-h-96 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[400px] text-sm">
            <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Scanned at
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allMyAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No scanned attendance for your events yet.
                  </td>
                </tr>
              ) : visibleAttendanceRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No rows match your search.
                  </td>
                </tr>
              ) : (
                visibleAttendanceRows.map((a, i) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 tabular-nums text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.eventTitle}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{a.userName}</td>
                    <td className="px-4 py-3 text-slate-600">{a.userEmail}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {format(new Date(a.scannedAt), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
