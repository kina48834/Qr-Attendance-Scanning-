import { Fragment, useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  isAttendanceExportTrackScope,
  type AttendanceExportTrackScope,
} from '@/utils/academicEnrollmentOrdering';
import {
  buildAttendanceTrackSections,
  buildAttendanceTrackSectionsWithEvent,
  departmentLabelForExport,
  enrollmentLabelForAttendanceRow,
  exportDisplayName,
  multiEventRowsForAttendanceTrackSection,
  recordsForAttendanceTrackSection,
  resolveUserForAttendance,
} from '@/utils/attendanceEnrollmentGrouping';

export function OrganiserAttendance() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const { events, getEventAttendance, attendance: allAttendance, users } = useData();
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
      allMyAttendance.filter((a) => {
        const u = resolveUserForAttendance(users, a);
        const en = enrollmentLabelForAttendanceRow(u);
        const disp = exportDisplayName(u, a);
        return textMatchesEventSearch(
          [a.eventTitle, disp, a.userEmail, en].join(' '),
          eventSearch
        );
      }),
    [allMyAttendance, eventSearch, users]
  );

  const selectedTrackSections = useMemo(
    () => buildAttendanceTrackSections(attendance, users),
    [attendance, users]
  );

  const selectedExportRecords = useMemo(() => {
    const out = [];
    for (const sec of selectedTrackSections) {
      out.push(...recordsForAttendanceTrackSection(sec, users));
    }
    return out;
  }, [selectedTrackSections, users]);

  const allAttendanceTrackSections = useMemo(
    () => buildAttendanceTrackSectionsWithEvent(visibleAttendanceRows, users),
    [visibleAttendanceRows, users]
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

  const onSelectedTrackExport = useCallback(
    async (scope: AttendanceExportTrackScope, kind: 'pdf' | 'xlsx') => {
      if (!selectedExportMeta) return;
      const sec = selectedTrackSections.find((s) => s.trackId === scope);
      if (!sec) return;
      const recs = recordsForAttendanceTrackSection(sec, users);
      if (recs.length === 0) return;
      const meta = { ...selectedExportMeta, segmentScope: scope };
      if (kind === 'pdf') {
        const { exportSingleEventAttendancePdf } = await import('@/utils/attendanceExport');
        exportSingleEventAttendancePdf(meta, recs);
      } else {
        const { exportSingleEventAttendanceXlsx } = await import('@/utils/attendanceExport');
        exportSingleEventAttendanceXlsx(meta, recs);
      }
    },
    [selectedExportMeta, selectedTrackSections, users]
  );

  const onAllTrackExport = useCallback(
    async (scope: AttendanceExportTrackScope, kind: 'pdf' | 'xlsx') => {
      const sec = allAttendanceTrackSections.find((s) => s.trackId === scope);
      if (!sec) return;
      const trackRows = multiEventRowsForAttendanceTrackSection(sec, users);
      if (trackRows.length === 0) return;
      if (kind === 'pdf') {
        const { exportMultiEventAttendancePdf } = await import('@/utils/attendanceExport');
        exportMultiEventAttendancePdf(
          'All my events — attendance',
          'Filtered list (matches current search)',
          trackRows,
          { segmentScope: scope }
        );
      } else {
        const { exportMultiEventAttendanceXlsx } = await import('@/utils/attendanceExport');
        exportMultiEventAttendanceXlsx('All my events — attendance', trackRows, { segmentScope: scope });
      }
    },
    [allAttendanceTrackSections, users]
  );

  const multiExportRows = useMemo(() => {
    const out = [];
    for (const sec of allAttendanceTrackSections) {
      out.push(...multiEventRowsForAttendanceTrackSection(sec, users));
    }
    return out;
  }, [allAttendanceTrackSections, users]);

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
              exportLabel="Selected event (all levels)"
            />
          </div>
          {selectedEvent ? (
            <div className="max-h-96 overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[680px] text-sm">
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
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Time in
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Time out
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        No scans yet for this event.
                      </td>
                    </tr>
                  ) : (
                    selectedTrackSections.map((sec) => {
                      const total = sec.subgroups.reduce((acc, g) => acc + g.items.length, 0);
                      let seqInTrack = 0;
                      return (
                        <Fragment key={sec.trackId}>
                          <tr className="bg-slate-200/90">
                            <td colSpan={6} className="px-4 py-2.5 align-top">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm font-bold uppercase tracking-wide text-slate-800">
                                  {sec.sectionTitle}
                                  <span className="ml-2 font-normal normal-case text-slate-600 text-xs">
                                    ({total} student{total === 1 ? '' : 's'} — #1–{total})
                                  </span>
                                </div>
                                {isAttendanceExportTrackScope(sec.trackId) && (
                                  <AttendanceExportButtons
                                    compact
                                    disabled={total === 0}
                                    onExportPdf={() => {
                                      const tid = sec.trackId;
                                      if (!isAttendanceExportTrackScope(tid)) return;
                                      void onSelectedTrackExport(tid, 'pdf');
                                    }}
                                    onExportExcel={() => {
                                      const tid = sec.trackId;
                                      if (!isAttendanceExportTrackScope(tid)) return;
                                      void onSelectedTrackExport(tid, 'xlsx');
                                    }}
                                    exportLabel={`${sec.sectionTitle} only`}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                          {sec.subgroups.map((g) => (
                            <Fragment key={g.subgroupKey}>
                              <tr className="bg-slate-100/90">
                                <td
                                  colSpan={6}
                                  className="px-4 py-2 pl-6 text-xs font-semibold uppercase tracking-wide text-slate-600"
                                >
                                  {g.label}
                                  <span className="ml-2 font-normal normal-case text-slate-500">
                                    ({g.items.length})
                                  </span>
                                </td>
                              </tr>
                              {g.items.map((a) => {
                                seqInTrack += 1;
                                const rowUser = resolveUserForAttendance(users, a);
                                const rowName = exportDisplayName(rowUser, a);
                                return (
                                  <tr key={a.id} className="hover:bg-slate-50/80">
                                    <td className="px-4 py-3 tabular-nums text-slate-500">{seqInTrack}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                      {rowName !== '—' ? rowName : 'Student'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{a.userEmail}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                      {departmentLabelForExport(rowUser)}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-slate-600">
                                      {format(new Date(a.scannedAt), 'MMM d, yyyy HH:mm')}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-slate-600">
                                      {a.timeOutAt
                                        ? format(new Date(a.timeOutAt), 'MMM d, yyyy HH:mm')
                                        : '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          ))}
                        </Fragment>
                      );
                    })
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
            exportLabel="All levels (filtered table)"
          />
        </div>
        <div className="max-h-96 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[840px] text-sm">
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
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Time in
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Time out
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allMyAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No scanned attendance for your events yet.
                  </td>
                </tr>
              ) : visibleAttendanceRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No rows match your search.
                  </td>
                </tr>
              ) : (
                allAttendanceTrackSections.map((sec) => {
                  const total = sec.subgroups.reduce((acc, g) => acc + g.items.length, 0);
                  let seqInTrack = 0;
                  return (
                    <Fragment key={`all-${sec.trackId}`}>
                      <tr className="bg-slate-200/90">
                        <td colSpan={7} className="px-4 py-2.5 align-top">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-bold uppercase tracking-wide text-slate-800">
                              {sec.sectionTitle}
                              <span className="ml-2 font-normal normal-case text-slate-600 text-xs">
                                ({total} row{total === 1 ? '' : 's'} — #1–{total})
                              </span>
                            </div>
                            {isAttendanceExportTrackScope(sec.trackId) && (
                              <AttendanceExportButtons
                                compact
                                disabled={total === 0}
                                onExportPdf={() => {
                                  const tid = sec.trackId;
                                  if (!isAttendanceExportTrackScope(tid)) return;
                                  void onAllTrackExport(tid, 'pdf');
                                }}
                                onExportExcel={() => {
                                  const tid = sec.trackId;
                                  if (!isAttendanceExportTrackScope(tid)) return;
                                  void onAllTrackExport(tid, 'xlsx');
                                }}
                                exportLabel={`${sec.sectionTitle} only`}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                      {sec.subgroups.map((g) => (
                        <Fragment key={g.subgroupKey}>
                          <tr className="bg-slate-100/90">
                            <td
                              colSpan={7}
                              className="px-4 py-2 pl-6 text-xs font-semibold uppercase tracking-wide text-slate-600"
                            >
                              {g.label}
                              <span className="ml-2 font-normal normal-case text-slate-500">({g.items.length})</span>
                            </td>
                          </tr>
                          {g.items.map((a) => {
                            seqInTrack += 1;
                            const rowUser = resolveUserForAttendance(users, a);
                            const rowName = exportDisplayName(rowUser, a);
                            return (
                              <tr key={a.id} className="hover:bg-slate-50/80">
                                <td className="px-4 py-3 tabular-nums text-slate-500">{seqInTrack}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{a.eventTitle}</td>
                                <td className="px-4 py-3 font-medium text-slate-900">
                                  {rowName !== '—' ? rowName : 'Student'}
                                </td>
                                <td className="px-4 py-3 text-slate-600">{a.userEmail}</td>
                                <td className="px-4 py-3 text-sm text-slate-700">
                                  {departmentLabelForExport(rowUser)}
                                </td>
                                <td className="px-4 py-3 tabular-nums text-slate-600">
                                  {format(new Date(a.scannedAt), 'MMM d, yyyy HH:mm')}
                                </td>
                                <td className="px-4 py-3 tabular-nums text-slate-600">
                                  {a.timeOutAt
                                    ? format(new Date(a.timeOutAt), 'MMM d, yyyy HH:mm')
                                    : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
