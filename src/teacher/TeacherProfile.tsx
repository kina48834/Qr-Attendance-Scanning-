import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { User, Mail, Calendar, Building2, Phone, IdCard } from 'lucide-react';
import { format } from 'date-fns';
import { formatUserAcademicLine } from '@/utils/academicProfileDisplay';

export function TeacherProfile() {
  const { user } = useAuth();
  const { attendance, events } = useData();
  const myAttendance = user ? attendance.filter((a) => a.userId === user.id) : [];
  const academicLine = user ? formatUserAcademicLine(user) : null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-slate-600">Your account and participation summary</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Account</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-slate-400" />
            <span className="text-slate-900">{user?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-slate-400" />
            <span className="text-slate-600">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-400" />
            <span className="text-slate-600">Teacher</span>
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
          {user?.phone && (
            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="h-5 w-5 text-slate-400" />
              <span>{user.phone}</span>
            </div>
          )}
          {user?.employeeId && (
            <div className="flex items-center gap-3 text-slate-600">
              <IdCard className="h-5 w-5 text-slate-400" />
              <span>Staff ID: {user.employeeId}</span>
            </div>
          )}
          {user?.officeLocation && (
            <p className="pl-8 text-sm text-slate-600">Office: {user.officeLocation}</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Participation</h2>
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-2xl font-bold text-slate-900">{myAttendance.length}</p>
          <p className="text-sm text-slate-600">Attendance records linked to your account (if any)</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Recent attendance</h2>
            <p className="mt-1 text-sm text-slate-600">
              See <Link to="/teacher/analytics" className="font-medium text-campus-primary hover:underline">Analytics</Link> for
              full reports.
            </p>
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
                .slice(0, 8)
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
          <div className="p-8 text-center text-slate-500">No attendance rows for your account yet.</div>
        )}
      </div>
    </div>
  );
}
