import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { format } from 'date-fns';
import { History, LogOut } from 'lucide-react';

function formatTs(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'MMM d, yyyy HH:mm');
  } catch {
    return '—';
  }
}

export function StudentAttendanceHistory() {
  const { user } = useAuth();
  const { attendance, events, recordAttendanceTimeOut } = useData();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const myAttendance = user
    ? attendance
        .filter((a) => a.userId === user.id)
        .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
    : [];

  const handleTimeOut = async (attendanceId: string) => {
    if (!user) return;
    setError('');
    setBusyId(attendanceId);
    try {
      await recordAttendanceTimeOut(attendanceId, user.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record time out.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">History of attendance</h1>
        <p className="text-slate-600 mt-1">
          QR scan records <strong>time in</strong>. Use <strong>Time out</strong> when you leave so your checkout time is
          stored and visible to organisers, teachers, and admins.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-900">Attendance history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Time in</th>
                <th className="px-5 py-3 font-medium">Time out</th>
                <th className="px-5 py-3 font-medium w-[1%] whitespace-nowrap"> </th>
              </tr>
            </thead>
            <tbody>
              {myAttendance.map((a) => {
                const evt = events.find((e) => e.id === a.eventId);
                const hasOut = Boolean(a.timeOutAt);
                return (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{evt?.title ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600 tabular-nums">{formatTs(a.scannedAt)}</td>
                    <td className="px-5 py-3 text-slate-600 tabular-nums">{formatTs(a.timeOutAt)}</td>
                    <td className="px-5 py-3">
                      {hasOut ? (
                        <span className="text-xs font-medium text-emerald-700">Recorded</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === a.id}
                          onClick={() => void handleTimeOut(a.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                        >
                          <LogOut className="h-3.5 w-3.5" aria-hidden />
                          {busyId === a.id ? 'Saving…' : 'Time out'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {myAttendance.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No attendance recorded yet. Use QR for attendance at an event after the organiser has started it.
          </div>
        )}
      </div>
    </div>
  );
}
