import { useEffect, useRef, useState, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Camera-based QR scanner. Decoded text is passed to onScan; pattern recognition
 * (event EVT-* or attendance ATTEND:*) is handled by the parent via attendanceQR utils.
 */
interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  className?: string;
  /** Hint shown below the scanner (default: event QR). Use for organiser: "Point camera at student's attendance QR code" */
  hint?: string;
}

const DEFAULT_HINT =
  'Point camera at the event QR — pattern recognition records attendance when the code is detected';

export function QRScanner({ onScan, onError, className = '', hint = DEFAULT_HINT }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useId().replace(/:/g, '-') || 'qr-scanner';
  const scannerContainerId = `qr-scanner-${containerId}`;
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied' | 'error'>('idle');
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    const startScanner = () => {
      const container = document.getElementById(scannerContainerId);
      if (!container || cancelled) return;

      const html5Qr = new Html5Qrcode(scannerContainerId, false);
      const config = {
        fps: 15,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1,
        disableFlip: false,
      };
      // Camera decodes QR pattern → onScan(decodedText); parent applies normalizeQrValue + event/attendance matching

      html5Qr
        .start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (!cancelled && decodedText?.trim()) onScanRef.current(decodedText);
          },
          () => {}
        )
        .then(() => {
          if (!cancelled) {
            scannerRef.current = html5Qr;
            setPermission('granted');
          } else if (html5Qr.isScanning) {
            html5Qr.stop().catch(() => {});
          }
        })
        .catch((err: Error) => {
          if (!cancelled) {
            setPermission('error');
            onErrorRef.current?.(err.message ?? 'Could not start camera.');
          }
        });
    };

    const t = window.setTimeout(startScanner, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [scannerContainerId]);

  if (permission === 'denied' || permission === 'error') {
    return (
      <div className={`rounded-xl bg-slate-200 p-8 text-center ${className}`}>
        <p className="text-red-600 font-medium">Camera not available</p>
        <p className="text-sm text-slate-600 mt-1">
          {permission === 'denied' ? 'Please allow camera access to scan QR codes.' : 'Could not start camera.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-[280px] mx-auto min-w-0 overflow-x-auto ${className}`}>
      <div
        id={scannerContainerId}
        className="rounded-xl overflow-hidden bg-black shrink-0"
        style={{ width: 280, height: 320 }}
      />
      <p className="text-center text-slate-600 text-sm mt-2 px-1">{hint}</p>
    </div>
  );
}
