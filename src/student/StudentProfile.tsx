import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { User, Mail, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatUserAcademicLine } from '@/utils/academicProfileDisplay';

export function StudentProfile() {
  const { user } = useAuth();
  const { attendance, events } = useData();
  const myAttendance = user ? attendance.filter((a) => a.userId === user.id) : [];
  const academicLine = user ? formatUserAcademicLine(user) : null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-600 mt-1">Your account and participation summary</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-slate-400" />
            <span className="text-slate-900">{user?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-400" />
            <span className="text-slate-600">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-slate-600">Student</span>
          </div>
          {academicLine && (
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-campus-primary" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Department</p>
                <p className="text-slate-800">{academicLine}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Participation</h2>
        <div className="p-4 rounded-lg bg-slate-50">
          <p className="text-2xl font-bold text-slate-900">{myAttendance.length}</p>
          <p className="text-sm text-slate-600">Attendance recorded (QR scan only after organiser has started the event)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">Scanned attendance history</h2>
            <p className="text-sm text-slate-600 mt-1">Recent attendance. See <Link to="/student/history" className="text-campus-primary font-medium hover:underline">History of attendance</Link> for full list.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Time in</th>
                <th className="px-5 py-3 font-medium">Time out</th>
              </tr>
            </thead>
            <tbody>
              {myAttendance
                .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
                .map((a) => {
                  const evt = events.find((e) => e.id === a.eventId);
                  return (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-900">{evt?.title ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600 tabular-nums">
                        {format(new Date(a.scannedAt), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-5 py-3 text-slate-600 tabular-nums">
                        {a.timeOutAt ? format(new Date(a.timeOutAt), 'MMM d, yyyy HH:mm') : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {myAttendance.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No scanned attendance yet. After an event starts, use <strong>My event QR</strong> so an organiser can scan you in.
          </div>
        )}
      </div>
    </div>
  );
}
