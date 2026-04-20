import { useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { QRCodeDisplay } from '@/components/QR/QRCodeDisplay';
import { buildAttendanceQRValue } from '@/utils/attendanceQR';
import { ArrowLeft, Download } from 'lucide-react';

function safeFileName(s: string): string {
  return s.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_').slice(0, 80) || 'event';
}

export function StudentShowQR() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const { user } = useAuth();
  const { events } = useData();
  const event = eventId ? events.find((e) => e.id === eventId) : null;

  const downloadPng = useCallback(() => {
    const root = wrapRef.current;
    const svg = root?.querySelector('svg');
    if (!svg || !event) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    const w = svg.getAttribute('width') ? parseInt(svg.getAttribute('width')!, 10) : 260;
    const h = svg.getAttribute('height') ? parseInt(svg.getAttribute('height')!, 10) : 260;
    const pad = 24;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w + pad * 2;
      canvas.height = h + pad * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, pad, pad);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `my_qr_${safeFileName(event.title)}_${event.id}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, [event]);

  if (!user || !eventId || !event) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-slate-600">Event not found or invalid.</p>
        <Link to="/student" className="inline-flex items-center gap-1 font-medium text-campus-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
      </div>
    );
  }

  if (event.status !== 'published' && event.status !== 'completed') {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-slate-600">This event hasn&apos;t started yet. Your QR will be available once it is published.</p>
        <Link to="/student" className="inline-flex items-center gap-1 font-medium text-campus-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
      </div>
    );
  }

  const qrValue = buildAttendanceQRValue(user.id, event.id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">My QR for this event</h1>
        <Link
          to="/student"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
      <p className="text-slate-600">
        Show this code to the <strong>organiser</strong> (or event owner) so they can scan it in their app. First scan =
        time in; second scan = time out. You can download the image or take a screenshot.
      </p>
      <div ref={wrapRef} className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-center font-semibold text-slate-900">{event.title}</p>
        <QRCodeDisplay
          value={qrValue}
          size={260}
          className="border-0 p-0"
          caption="Personal attendance code for this event only"
        />
        <p className="max-w-full break-all text-center font-mono text-[11px] text-slate-500">{qrValue}</p>
        <button
          type="button"
          onClick={() => downloadPng()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Download as PNG
        </button>
      </div>
    </div>
  );
}
