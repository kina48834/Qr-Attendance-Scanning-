import { Fragment, useMemo, useCallback, type ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, ClipboardList, Mail, User } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { PageHeader, RoleBadge } from '@/components/PageHeader';
import { eventStatusBadgeClass } from '@/utils/eventStatusStyles';
import { AttendanceExportButtons } from '@/components/AttendanceExportButtons';
import { isAttendanceExportTrackScope, type AttendanceExportTrackScope } from '@/utils/academicEnrollmentOrdering';
import {
  buildAttendanceTrackSections,
  exportDisplayName,
  recordsForAttendanceTrackSection,
  resolveUserForAttendance,
} from '@/utils/attendanceEnrollmentGrouping';

type EventAttendanceRosterProps = {
  /** e.g. /teacher/events */
  eventsListPath: string;
  badge: ReactNode;
};

export function EventAttendanceRoster({ eventsListPath, badge }: EventAttendanceRosterProps) {
  const { eventId } = useParams<{ eventId: string }>();
  const { events, attendance, users } = useData();
  const event = events.find((e) => e.id === eventId);

  const rows = useMemo(() => {
    if (!eventId) return [];
    return [...attendance.filter((a) => a.eventId === eventId)].sort(
      (a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime()
    );
  }, [eventId, attendance]);

  const trackSections = useMemo(() => buildAttendanceTrackSections(rows, users), [rows, users]);

  const exportRecords = useMemo(() => {
    const out = [];
    for (const sec of trackSections) {
      out.push(...recordsForAttendanceTrackSection(sec, users));
    }
    return out;
  }, [trackSections, users]);

  const exportMeta = useMemo(() => {
    if (!event) return null;
    return {
      title: event.title,
      location: event.location,
      startDate: event.startDate,
      organiserName: event.organiserName,
    };
  }, [event]);

  const onPdf = useCallback(async () => {
    if (!exportMeta) return;
    const { exportSingleEventAttendancePdf } = await import('@/utils/attendanceExport');
    exportSingleEventAttendancePdf(exportMeta, exportRecords);
  }, [exportMeta, exportRecords]);

  const onExcel = useCallback(async () => {
    if (!exportMeta) return;
    const { exportSingleEventAttendanceXlsx } = await import('@/utils/attendanceExport');
    exportSingleEventAttendanceXlsx(exportMeta, exportRecords);
  }, [exportMeta, exportRecords]);

  const exportSingleTrack = useCallback(
    async (scope: AttendanceExportTrackScope, kind: 'pdf' | 'xlsx') => {
      if (!exportMeta) return;
      const sec = trackSections.find((s) => s.trackId === scope);
      if (!sec) return;
      const recs = recordsForAttendanceTrackSection(sec, users);
      if (recs.length === 0) return;
      const meta = { ...exportMeta, segmentScope: scope };
      if (kind === 'pdf') {
        const { exportSingleEventAttendancePdf } = await import('@/utils/attendanceExport');
        exportSingleEventAttendancePdf(meta, recs);
      } else {
        const { exportSingleEventAttendanceXlsx } = await import('@/utils/attendanceExport');
        exportSingleEventAttendanceXlsx(meta, recs);
      }
    },
    [exportMeta, trackSections, users]
  );

  if (!eventId) {
    return <Navigate to={eventsListPath} replace />;
  }
  if (!event) {
    return <Navigate to={eventsListPath} replace />;
  }

  return (
    <div className="space-y-5">
      <Link
        to={eventsListPath}
        className="inline-flex items-center gap-2 text-sm font-medium text-campus-primary hover:text-campus-secondary"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </Link>

      <div className="space-y-3">
        <PageHeader
          title={event.title}
          description="Numbered list of every student who scanned the event QR (all campus events, including those created by organisers)."
          badge={badge}
        />
        <div className="flex flex-wrap items-center gap-2 text-sm pl-3 sm:pl-4">
          <span className={eventStatusBadgeClass(event.status)}>{event.status}</span>
          <span className="text-slate-600">
            Organiser: <span className="font-medium text-slate-800">{event.organiserName}</span>
          </span>
          <span className="text-slate-500 tabular-nums">
            {format(new Date(event.startDate), 'MMM d, yyyy HH:mm')}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="h-5 w-5 shrink-0 text-campus-primary" aria-hidden />
            <div>
              <h2 className="font-semibold text-slate-900">Attendance roster</h2>
              <p className="text-sm text-slate-500">
                {rows.length} {rows.length === 1 ? 'student' : 'students'}
              </p>
            </div>
          </div>
          <AttendanceExportButtons
            disabled={rows.length === 0}
            onExportPdf={onPdf}
            onExportExcel={onExcel}
            exportLabel="Full roster (all levels)"
          />
        </div>
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No attendance recorded yet. Students appear here after they scan the event QR.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {trackSections.map((sec) => {
              const totalInTrack = sec.subgroups.reduce((acc, g) => acc + g.items.length, 0);
              let seqInTrack = 0;
              return (
                <Fragment key={sec.trackId}>
                  <div className="sticky top-0 z-[1] border-b border-slate-300 bg-slate-200/95 px-4 py-3 sm:px-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-800">{sec.sectionTitle}</p>
                        <p className="text-xs text-slate-600 tabular-nums mt-0.5">
                          {totalInTrack} student{totalInTrack === 1 ? '' : 's'} — numbered 1–{totalInTrack} in this level
                        </p>
                      </div>
                      {isAttendanceExportTrackScope(sec.trackId) && (
                        <AttendanceExportButtons
                          compact
                          disabled={totalInTrack === 0}
                          onExportPdf={() => {
                            const tid = sec.trackId;
                            if (!isAttendanceExportTrackScope(tid)) return;
                            void exportSingleTrack(tid, 'pdf');
                          }}
                          onExportExcel={() => {
                            const tid = sec.trackId;
                            if (!isAttendanceExportTrackScope(tid)) return;
                            void exportSingleTrack(tid, 'xlsx');
                          }}
                          exportLabel={`${sec.sectionTitle} only`}
                        />
                      )}
                    </div>
                  </div>
                  {sec.subgroups.map((g) => (
                    <Fragment key={g.subgroupKey}>
                      <div className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-100/95 px-4 py-2.5 sm:px-5 pl-6 sm:pl-8">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{g.label}</p>
                        <p className="text-xs text-slate-500 tabular-nums">{g.items.length} in this group</p>
                      </div>
                      <ol className="divide-y divide-slate-100">
                        {g.items.map((r) => {
                          seqInTrack += 1;
                          const rosterUser = resolveUserForAttendance(users, r);
                          const rosterName = exportDisplayName(rosterUser, r);
                          return (
                            <li
                              key={r.id}
                              className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-campus-light text-sm font-bold tabular-nums text-campus-primary">
                                {seqInTrack}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-2 font-semibold text-slate-900">
                                  <User className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                                  {rosterName !== '—' ? rosterName : 'Student'}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                                  {r.userEmail}
                                </p>
                              </div>
                              <div className="shrink-0 text-right text-xs tabular-nums text-slate-500">
                                <p>
                                  In {format(new Date(r.scannedAt), 'MMM d, yyyy · HH:mm')}
                                </p>
                                <p className="mt-0.5">
                                  Out{' '}
                                  {r.timeOutAt
                                    ? format(new Date(r.timeOutAt), 'MMM d, yyyy · HH:mm')
                                    : '—'}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </Fragment>
                  ))}
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function TeacherEventAttendancePage() {
  return (
    <EventAttendanceRoster eventsListPath="/teacher/events" badge={<RoleBadge>Teacher</RoleBadge>} />
  );
}

export function AdminEventAttendancePage() {
  return <EventAttendanceRoster eventsListPath="/admin/events" badge={<RoleBadge>Admin</RoleBadge>} />;
}
