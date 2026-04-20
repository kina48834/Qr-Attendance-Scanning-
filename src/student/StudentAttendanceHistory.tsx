import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { format } from 'date-fns';
import { History } from 'lucide-react';

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
  const { attendance, events } = useData();

  const myAttendance = user
    ? attendance
        .filter((a) => a.userId === user.id)
        .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
    : [];

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">History of attendance</h1>
        <p className="mt-1 text-slate-600">
          <strong>Time in</strong> is recorded when an organiser scans your personal event QR the first time.{' '}
          <strong>Time out</strong> is recorded when they scan the same QR again. You can view times here after each
          scan.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <History className="h-5 w-5 text-slate-600" />
          <h2 className="font-semibold text-slate-900">Attendance history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Time in</th>
                <th className="px-5 py-3 font-medium">Time out</th>
              </tr>
            </thead>
            <tbody>
              {myAttendance.map((a) => {
                const evt = events.find((e) => e.id === a.eventId);
                return (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{evt?.title ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600 tabular-nums">{formatTs(a.scannedAt)}</td>
                    <td className="px-5 py-3 text-slate-600 tabular-nums">{formatTs(a.timeOutAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {myAttendance.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No attendance recorded yet. After an event starts, open <strong>My event QR</strong> and check in with the
            organiser.
          </div>
        )}
      </div>
    </div>
  );
}
