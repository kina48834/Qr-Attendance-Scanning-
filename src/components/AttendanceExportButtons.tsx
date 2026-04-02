import { FileDown, FileSpreadsheet } from 'lucide-react';

type AttendanceExportButtonsProps = {
  disabled?: boolean;
  onExportPdf: () => void;
  onExportExcel: () => void;
  /** Screen-reader label prefix, e.g. "This event" */
  exportLabel?: string;
};

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm';

export function AttendanceExportButtons({
  disabled,
  onExportPdf,
  onExportExcel,
  exportLabel = 'Attendance',
}: AttendanceExportButtonsProps) {
  const label = `${exportLabel} — export`;
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        disabled={disabled}
        onClick={onExportPdf}
        className={`${btnBase} border-campus-primary/35 bg-campus-light/50 text-campus-primary hover:bg-campus-light disabled:pointer-events-none disabled:opacity-40`}
      >
        <FileDown className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
        PDF
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onExportExcel}
        className={`${btnBase} border-emerald-200/90 bg-white text-emerald-800 hover:bg-emerald-50 disabled:pointer-events-none disabled:opacity-40`}
      >
        <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
        Excel
      </button>
    </div>
  );
}
