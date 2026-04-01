import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { QRScanner } from '@/components/QR/QRScanner';
import { parseAttendanceQR, normalizeQrValue } from '@/utils/attendanceQR';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const SCAN_DEBOUNCE_MS = 2000;

export function OrganiserScanAttendance() {
  const { user } = useAuth();
  const { events, users, attendance, recordAttendance } = useData();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'invalid'; message: string } | null>(null);
  const lastProcessedRef = useRef<{ value: string; at: number } | null>(null);

  const myEventIds = new Set(events.filter((e) => e.organiserId === user?.id).map((e) => e.id));

  const handleScan = useCallback(
    (decodedText: string) => {
      const raw = normalizeQrValue(decodedText);
      if (!raw) return;
      const now = Date.now();
      const last = lastProcessedRef.current;
      if (last && last.value === raw && now - last.at < SCAN_DEBOUNCE_MS) return;
      lastProcessedRef.current = { value: raw, at: now };

      const parsed = parseAttendanceQR(decodedText);
      if (!parsed) {
        setResult({ type: 'invalid', message: 'Not a valid attendance QR code.' });
        setTimeout(() => setResult(null), 3000);
        return;
      }
      const { userId, eventId } = parsed;
      const event = events.find((e) => e.id === eventId);
      if (!event) {
        setResult({ type: 'invalid', message: 'Event not found.' });
        setTimeout(() => setResult(null), 3000);
        return;
      }
      if (!myEventIds.has(eventId)) {
        setResult({ type: 'invalid', message: 'This event is not one of yours.' });
        setTimeout(() => setResult(null), 3000);
        return;
      }
      if (event.status !== 'published' && event.status !== 'completed') {
        setResult({ type: 'invalid', message: 'Event is not open for attendance.' });
        setTimeout(() => setResult(null), 3000);
        return;
      }
      const alreadyScanned = attendance.some((a) => a.eventId === eventId && a.userId === userId);
      if (alreadyScanned) {
        setResult({ type: 'invalid', message: 'Already marked present.' });
        setTimeout(() => setResult(null), 3000);
        return;
      }
      const attendee = users.find((u) => u.id === userId);
      const userName = attendee?.name ?? 'Unknown';
      const userEmail = attendee?.email ?? '';
      recordAttendance({
        eventId,
        userId,
        userName,
        userEmail,
        qrCodeData: normalizeQrValue(decodedText),
      });
      setResult({ type: 'success', message: `${userName} — attendance recorded for "${event.title}".` });
      setTimeout(() => setResult(null), 4000);
    },
    [events, users, attendance, recordAttendance, myEventIds]
  );

  if (!scanning) {
    return (
      <div className="space-y-6 max-w-lg mx-auto w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Scan student QR codes</h1>
            <p className="text-slate-600 mt-1">
              Use the venue camera to scan students’ attendance QR codes. Start the scanner when ready.
            </p>
          </div>
          <Link
            to="/organiser/attendance"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-4">
          <p className="text-slate-600 text-center">
            Students show their QR for this event on their phone. Point the camera at their screen to detect the pattern and record attendance.
          </p>
          <button
            type="button"
            onClick={() => setScanning(true)}
            className="px-6 py-3 bg-campus-primary text-white rounded-xl font-medium hover:bg-campus-secondary"
          >
            Start scanning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Scanning</h1>
          <p className="text-slate-600 text-sm mt-1">Point camera at student’s attendance QR code</p>
        </div>
        <button
          type="button"
          onClick={() => setScanning(false)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <QRScanner
        onScan={handleScan}
        onError={(msg) => setResult({ type: 'invalid', message: msg })}
        hint="Point camera at the student's attendance QR code to record attendance"
      />
      {result && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 ${
            result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
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
