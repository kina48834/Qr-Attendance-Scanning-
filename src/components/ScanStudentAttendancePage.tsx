import { useState, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { QRScanner } from '@/components/QR/QRScanner';
import { parseAttendanceQR, normalizeQrValue } from '@/utils/attendanceQR';
import { formatUserAcademicLine } from '@/utils/academicProfileDisplay';
import { format } from 'date-fns';
import { CheckCircle, XCircle, ArrowLeft, User } from 'lucide-react';

const SCAN_DEBOUNCE_MS = 2000;

type Props = {
  /** e.g. /organiser/attendance or /teacher/events */
  backPath: string;
  /** Full path to this scan page (for event picker links). */
  scanBasePath: string;
  backLabel?: string;
};

export function ScanStudentAttendancePage({ backPath, backLabel = 'Back', scanBasePath }: Props) {
  const { user } = useAuth();
  const { events, users, attendance, recordAttendance, recordCheckoutScan } = useData();
  const [searchParams] = useSearchParams();
  const eventIdFromUrl = searchParams.get('eventId');

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'invalid'; message: string } | null>(null);
  const [lastScannedUserId, setLastScannedUserId] = useState<string | null>(null);
  const lastProcessedRef = useRef<{ value: string; at: number } | null>(null);

  const myEventIds = useMemo(
    () => new Set(events.filter((e) => e.organiserId === user?.id).map((e) => e.id)),
    [events, user?.id]
  );

  const mySelectableEvents = useMemo(
    () =>
      [...events]
        .filter((e) => e.organiserId === user?.id && (e.status === 'published' || e.status === 'completed'))
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [events, user?.id]
  );

  const selectedEventFromUrl = eventIdFromUrl ? events.find((e) => e.id === eventIdFromUrl) : null;
  const backHref = eventIdFromUrl ? `${backPath}?eventId=${encodeURIComponent(eventIdFromUrl)}` : backPath;

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (!user) return;
      const raw = normalizeQrValue(decodedText);
      if (!raw) return;
      const now = Date.now();
      const last = lastProcessedRef.current;
      if (last && last.value === raw && now - last.at < SCAN_DEBOUNCE_MS) return;
      lastProcessedRef.current = { value: raw, at: now };

      const parsed = parseAttendanceQR(decodedText);
      if (!parsed) {
        setResult({ type: 'invalid', message: 'Not a valid student attendance QR (expected ATTEND:…).' });
        setTimeout(() => setResult(null), 4000);
        return;
      }
      const { userId: studentUserId, eventId: qrEventId } = parsed;

      if (eventIdFromUrl && qrEventId !== eventIdFromUrl) {
        setResult({
          type: 'invalid',
          message: 'This QR is for a different event. Open Scan for this event from the correct event, or pick the matching event below.',
        });
        setTimeout(() => setResult(null), 5000);
        return;
      }

      const event = events.find((e) => e.id === qrEventId);
      const attendee = users.find((u) => u.id === studentUserId);
      setLastScannedUserId(studentUserId);
      if (!event) {
        setResult({ type: 'invalid', message: 'Event not found.' });
        setTimeout(() => setResult(null), 3000);
        return;
      }
      if (!myEventIds.has(qrEventId)) {
        setResult({ type: 'invalid', message: 'This event is not one of yours.' });
        setTimeout(() => setResult(null), 3000);
        return;
      }
      if (event.status !== 'published' && event.status !== 'completed') {
        setResult({ type: 'invalid', message: 'Event is not open for attendance.' });
        setTimeout(() => setResult(null), 3000);
        return;
      }

      const existing = attendance.find((a) => a.eventId === qrEventId && a.userId === studentUserId);

      try {
        if (existing) {
          if (existing.timeOutAt) {
            setResult({
              type: 'invalid',
              message: 'This student already checked out (time out recorded).',
            });
            setTimeout(() => setResult(null), 4000);
            return;
          }
          await recordCheckoutScan(qrEventId, studentUserId, user.id);
          const userName = attendee?.name ?? 'Student';
          setResult({
            type: 'success',
            message: `${userName} — time out recorded for "${event.title}".`,
          });
        } else {
          const userName = attendee?.name ?? 'Unknown';
          const userEmail = attendee?.email ?? '';
          await recordAttendance({
            eventId: qrEventId,
            userId: studentUserId,
            userName,
            userEmail,
            qrCodeData: raw,
          });
          setResult({
            type: 'success',
            message: `${userName} — time in recorded for "${event.title}".`,
          });
        }
      } catch (e) {
        setResult({
          type: 'invalid',
          message: e instanceof Error ? e.message : 'Could not record attendance.',
        });
      }
      setTimeout(() => setResult(null), 5000);
    },
    [events, users, attendance, recordAttendance, recordCheckoutScan, myEventIds, user, eventIdFromUrl]
  );

  const lastScannedUser = lastScannedUserId ? users.find((u) => u.id === lastScannedUserId) : null;
  const lastScannedAcademicLine = lastScannedUser ? formatUserAcademicLine(lastScannedUser) : null;

  if (!scanning) {
    return (
      <div className="mx-auto w-full max-w-lg min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Scan student QR</h1>
            <p className="mt-1 text-slate-600">
              Students show their <strong>personal event QR</strong> from the app. First scan records{' '}
              <strong>time in</strong>; scanning the same code again records <strong>time out</strong>.
            </p>
            {selectedEventFromUrl && (
              <p className="mt-2 rounded-lg border border-campus-primary/25 bg-campus-primary/5 px-3 py-2 text-sm text-slate-800">
                <span className="font-semibold text-campus-primary">Selected event:</span>{' '}
                {selectedEventFromUrl.title}{' '}
                <span className="tabular-nums text-slate-500">
                  ({format(new Date(selectedEventFromUrl.startDate), 'MMM d, yyyy HH:mm')})
                </span>
              </p>
            )}
          </div>
          <Link
            to={backHref}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>

        {!eventIdFromUrl && mySelectableEvents.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Choose an event first</h2>
            <p className="mt-1 text-xs text-slate-600">
              Open <strong>Scan for this event</strong> from your events or attendance page so scans match the right
              event.
            </p>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
              {mySelectableEvents.map((e) => (
                <li key={e.id}>
                  <Link
                    to={`${scanBasePath}?eventId=${encodeURIComponent(e.id)}`}
                    className="block rounded-lg border border-slate-200 px-3 py-2 font-medium text-campus-primary hover:bg-slate-50"
                  >
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-center text-slate-600">
            {eventIdFromUrl
              ? 'Start the camera, then scan a student’s on-screen QR for this event.'
              : 'Select an event above (or from My Events → Scan for this event), then start scanning.'}
          </p>
          <button
            type="button"
            disabled={!eventIdFromUrl}
            onClick={() => setScanning(true)}
            className="rounded-xl bg-campus-primary px-6 py-3 font-medium text-white hover:bg-campus-secondary disabled:cursor-not-allowed disabled:opacity-45"
          >
            Start scanning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Scanning</h1>
          <p className="text-slate-600 mt-1 text-sm">
            {selectedEventFromUrl ? (
              <>
                Event: <span className="font-medium text-slate-800">{selectedEventFromUrl.title}</span>
              </>
            ) : (
              'Point the camera at the student’s attendance QR.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScanning(false)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
      <QRScanner
        onScan={(text) => void handleScan(text)}
        onError={(msg) => setResult({ type: 'invalid', message: msg })}
        hint="Student personal QR (ATTEND:…) — first scan = time in, second = time out"
      />
      {result && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 ${
            result.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {result.type === 'success' ? (
            <CheckCircle className="h-6 w-6 shrink-0 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 shrink-0 text-amber-600" />
          )}
          <p className="font-medium">{result.message}</p>
        </div>
      )}
      {lastScannedUser && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-900">Scanned student profile</p>
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {lastScannedUser.avatar ? (
                <img
                  src={lastScannedUser.avatar}
                  alt={`${lastScannedUser.name} profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-semibold text-slate-900">{lastScannedUser.name}</p>
              <p className="break-all text-slate-600">{lastScannedUser.email}</p>
              {lastScannedAcademicLine && <p className="text-slate-600">{lastScannedAcademicLine}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
