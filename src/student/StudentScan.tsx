import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { QRScanner } from '@/components/QR/QRScanner';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch } from '@/utils/eventSearch';
import { normalizeQrValue, eventMatchesScannedValue } from '@/utils/attendanceQR';
import { format } from 'date-fns';
import { CheckCircle, XCircle, QrCode, ArrowLeft, Calendar } from 'lucide-react';

export function StudentScan() {
  const [searchParams] = useSearchParams();
  const eventIdFromUrl = searchParams.get('eventId');
  const { user } = useAuth();
  const { events, attendance, recordAttendance } = useData();
  const [eventListSearch, setEventListSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'invalid' | 'duplicate'; message: string } | null>(null);
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const lastProcessedRef = useRef<{ value: string; at: number } | null>(null);

  useEffect(() => {
    if (eventIdFromUrl) setScanning(true);
  }, [eventIdFromUrl]);

  /** Event QR pattern recognition: match by event.qrCodeData or canonical EVT-{eventId} so attendance is recorded reliably */
  const findEventByScannedValue = useCallback(
    (raw: string): (typeof events)[0] | undefined => {
      const n = normalizeQrValue(raw);
      if (!n) return undefined;
      for (const e of events) {
        if (eventMatchesScannedValue(n, e.id, e.qrCodeData)) return e;
      }
      return undefined;
    },
    [events]
  );

  const handleScan = useCallback(
    (decodedText: string) => {
      if (!user) return;
      const raw = normalizeQrValue(decodedText);
      if (!raw) return;
      setLastDetected(raw);
      const now = Date.now();
      const last = lastProcessedRef.current;
      if (last && last.value === raw && now - last.at < 2000) return;
      lastProcessedRef.current = { value: raw, at: now };

      // When opened for a specific event (e.g. from Events → "Scan event QR"), any QR scan records for that event
      const eventFromUrl = eventIdFromUrl ? events.find((e) => e.id === eventIdFromUrl) : null;
      const event = eventFromUrl ?? findEventByScannedValue(raw);

      if (!event) {
        setResult({
          type: 'invalid',
          message: `No event selected. Open an event from Events and tap "Scan event QR", or scan a venue event QR (EVT-...).`,
        });
        setTimeout(() => setResult(null), 5000);
        return;
      }
      if (event.status !== 'published' && event.status !== 'completed') {
        setResult({ type: 'invalid', message: 'This event is not open for attendance.' });
        setTimeout(() => setResult(null), 3000);
        return;
      }
      const alreadyScanned = attendance.some(
        (a) => a.eventId === event.id && a.userId === user.id
      );
      if (alreadyScanned) {
        setResult({ type: 'duplicate', message: 'You have already been marked present for this event.' });
        setTimeout(() => setResult(null), 3000);
        return;
      }
      recordAttendance({
        eventId: event.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        qrCodeData: raw,
      });
      setResult({ type: 'success', message: `Attendance recorded for "${event.title}". It appears in History of attendance.` });
      setScanning(false);
      setLastDetected(null);
      setTimeout(() => setResult(null), 5000);
    },
    [user, events, attendance, recordAttendance, findEventByScannedValue, eventIdFromUrl]
  );

  const allEventsForList = useMemo(
    () => [...events].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [events]
  );
  const visibleEventsForList = useMemo(
    () => filterEventsBySearch(allEventsForList, eventListSearch),
    [allEventsForList, eventListSearch]
  );
  const isStarted = (e: (typeof events)[0]) => e.status === 'published' || e.status === 'completed';
  const hasAttended = (eventId: string) => user && attendance.some((a) => a.eventId === eventId && a.userId === user.id);

  if (!scanning) {
    return (
      <div className="space-y-6 max-w-lg mx-auto w-full min-w-0">
        {result && (
          <div
            className={`rounded-xl p-4 flex items-center gap-3 ${
              result.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {result.type === 'success' ? (
              <CheckCircle className="w-6 h-6 shrink-0 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 shrink-0 text-amber-600" />
            )}
            <p className="font-medium">{result.message}</p>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scan QR for Attendance</h1>
          <p className="text-slate-600 mt-1">
            At the event, open the scanner and point your camera at the event QR. Pattern recognition records your attendance when the code is detected.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 space-y-3">
            <div>
              <h2 className="font-semibold text-slate-900">Events — joined or not</h2>
              <p className="text-sm text-slate-600 mt-1">List of events. If the event hasn&apos;t started, you cannot scan for QR attendance.</p>
            </div>
            {allEventsForList.length > 0 && (
              <EventListSearchBar
                id="student-scan-events-search"
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
                const attended = hasAttended(evt.id);
                return (
                  <li key={evt.id} className={`px-5 py-3 flex flex-wrap items-center justify-between gap-2 ${!started ? 'bg-amber-50/50' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{evt.title}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(evt.startDate), 'MMM d, yyyy HH:mm')}
                      </p>
                      {!started && (
                        <p className="text-xs text-amber-700 mt-1">Event hasn&apos;t started yet — you cannot scan for QR attendance.</p>
                      )}
                    </div>
                    {started ? (
                      attended ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Attended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 shrink-0">
                          Not yet
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 shrink-0">
                        Not started
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-campus-primary/10 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-campus-primary" />
          </div>
          <p className="text-slate-600 text-center">
            Tap <strong>Start scan</strong> to turn on the camera. Use <strong>Back</strong> anytime to exit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:flex-shrink-0">
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-campus-primary text-white rounded-xl font-medium hover:bg-campus-secondary transition-colors"
            >
              <QrCode className="w-5 h-5" />
              Start scan
            </button>
            <Link
              to="/student"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const eventFromUrl = eventIdFromUrl ? events.find((e) => e.id === eventIdFromUrl) : null;

  return (
    <div className="space-y-6 max-w-lg mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Scanning</h1>
          <p className="text-slate-600 text-sm mt-1">
            {eventFromUrl
              ? `Point your camera at the event QR for "${eventFromUrl.title}". Pattern recognition will record your attendance when detected.`
              : 'Point your camera at the event QR — pattern recognition records attendance when detected.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setScanning(false)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      <QRScanner onScan={handleScan} onError={(msg) => setResult({ type: 'invalid', message: msg })} />
      {lastDetected !== null && (
        <p className="text-center text-slate-500 text-sm mt-1">
          Last detected: <span className="font-mono text-slate-700">&quot;{lastDetected}&quot;</span>
        </p>
      )}

      {result && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 ${
            result.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {result.type === 'success' ? (
            <CheckCircle className="w-6 h-6 shrink-0 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 shrink-0 text-amber-600" />
          )}
          <p className="font-medium">{result.message}</p>
        </div>
      )}
    </div>
  );
}
