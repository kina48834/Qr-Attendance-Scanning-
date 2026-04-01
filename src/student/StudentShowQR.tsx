import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { QRCodeDisplay } from '@/components/QR/QRCodeDisplay';
import { buildAttendanceQRValue } from '@/utils/attendanceQR';
import { ArrowLeft } from 'lucide-react';

export function StudentShowQR() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const { user } = useAuth();
  const { events } = useData();
  const event = eventId ? events.find((e) => e.id === eventId) : null;

  if (!user || !eventId || !event) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <p className="text-slate-600">Event not found or invalid.</p>
        <Link to="/student" className="text-campus-primary font-medium hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>
      </div>
    );
  }

  if (event.status !== 'published' && event.status !== 'completed') {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <p className="text-slate-600">You cannot scan for QR attendance until the organiser has started this event.</p>
        <Link to="/student" className="text-campus-primary font-medium hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>
      </div>
    );
  }

  const qrValue = buildAttendanceQRValue(user.id, event.id);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">QR for attendance</h1>
        <Link
          to="/student"
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>
      <p className="text-slate-600">
        Show this QR code to the camera at the venue. Pattern detection will record your attendance for this event.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-4">
        <p className="font-semibold text-slate-900 text-center">{event.title}</p>
        <QRCodeDisplay
          value={qrValue}
          size={260}
          className="border-0 p-0"
          caption="Hold this screen in front of the venue camera to scan"
        />
      </div>
    </div>
  );
}
