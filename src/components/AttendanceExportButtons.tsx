import { FileDown, FileSpreadsheet } from 'lucide-react';

type AttendanceExportButtonsProps = {
  disabled?: boolean;
  onExportPdf: () => void;
  onExportExcel: () => void;
  /** Screen-reader label prefix, e.g. "This event" */
  exportLabel?: string;
  /** Tighter buttons for section headers / tables */
  compact?: boolean;
};

export function AttendanceExportButtons({
  disabled,
  onExportPdf,
  onExportExcel,
  exportLabel = 'Attendance',
  compact,
}: AttendanceExportButtonsProps) {
  const btnBase = compact
    ? 'inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors sm:px-2.5 sm:py-1.5 sm:text-xs'
    : 'inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm';
  const label = `${exportLabel} — export`;
  return (
    <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-2'}`} role="group" aria-label={label}>
      <button
        type="button"
        disabled={disabled}
        onClick={onExportPdf}
        className={`${btnBase} border-campus-primary/35 bg-campus-light/50 text-campus-primary hover:bg-campus-light disabled:pointer-events-none disabled:opacity-40`}
      >
        <FileDown className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'} shrink-0`} aria-hidden />
        PDF
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onExportExcel}
        className={`${btnBase} border-emerald-200/90 bg-white text-emerald-800 hover:bg-emerald-50 disabled:pointer-events-none disabled:opacity-40`}
      >
        <FileSpreadsheet className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'} shrink-0`} aria-hidden />
        Excel
      </button>
    </div>
  );
}
