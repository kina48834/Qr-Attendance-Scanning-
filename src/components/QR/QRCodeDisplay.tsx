import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  eventTitle?: string;
  /** Optional caption below QR (default: for event QR). Use for attendance QR: "Hold this screen in front of the venue camera to scan" */
  caption?: string;
}

export function QRCodeDisplay({ value, size = 200, className = '', eventTitle, caption }: QRCodeDisplayProps) {
  return (
    <div className={`inline-flex flex-col items-center p-3 sm:p-4 bg-white rounded-xl border border-slate-200 max-w-full ${className}`}>
      {eventTitle && (
        <p className="text-sm font-medium text-slate-700 mb-2 text-center max-w-[200px] truncate w-full" title={eventTitle}>
          {eventTitle}
        </p>
      )}
      <QRCodeSVG value={value} size={size} level="M" includeMargin />
      <p className="text-xs text-slate-500 mt-2 text-center">
        {caption ?? 'Students scan this — pattern recognition records attendance'}
      </p>
    </div>
  );
}
