import { ArrowDown, ArrowUp } from 'lucide-react';
import type { EnrollmentSortDir } from '@/utils/academicEnrollmentOrdering';

type Props = {
  direction: EnrollmentSortDir;
  onToggle: () => void;
  /** e.g. "Departments in this track" or "Names in this group" */
  label: string;
  compact?: boolean;
};

/**
 * Tap to flip ascending/descending order for department subgroups or names within a subgroup.
 */
export function DepartmentSortToggle({ direction, onToggle, label, compact }: Props) {
  const isAsc = direction === 'asc';
  const iconClass = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const btnClass = compact
    ? 'inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300/90 bg-white p-1 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900'
    : 'inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300/90 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900';
  return (
    <button
      type="button"
      onClick={onToggle}
      className={btnClass}
      title={`${label}: ${isAsc ? 'A→Z / low→high (click for reverse)' : 'Z→A / high→low (click for reverse)'}`}
      aria-label={`${label}, currently ${isAsc ? 'ascending' : 'descending'}. Toggle sort.`}
    >
      {isAsc ? <ArrowDown className={iconClass} aria-hidden /> : <ArrowUp className={iconClass} aria-hidden />}
    </button>
  );
}
