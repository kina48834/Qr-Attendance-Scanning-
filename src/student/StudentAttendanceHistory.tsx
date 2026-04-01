import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { format } from 'date-fns';
import { History } from 'lucide-react';

export function StudentAttendanceHistory() {
  const { user } = useAuth();
  const { attendance, events } = useData();
  const myAttendance = user
    ? attendance
        .filter((a) => a.userId === user.id)
        .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
    : [];

  return (
    <div className="space-y-6 max-w-2xl w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">History of attendance</h1>
        <p className="text-slate-600 mt-1">All events where your attendance was recorded via QR scan. New scans appear here immediately.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-900">Attendance history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Scanned at</th>
              </tr>
            </thead>
            <tbody>
              {myAttendance.map((a) => {
                const evt = events.find((e) => e.id === a.eventId);
                return (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{evt?.title ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{format(new Date(a.scannedAt), 'MMM d, yyyy HH:mm')}</td>
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
