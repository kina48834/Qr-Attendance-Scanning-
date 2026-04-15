import { ChevronDown, ChevronRight } from 'lucide-react';

type Props = {
  /** When false, the section body is hidden (chevron points right). */
  expanded: boolean;
  onToggle: () => void;
  /** Screen reader / tooltip, e.g. "Junior high school section" */
  label: string;
  compact?: boolean;
};

/**
 * Chevron expand/collapse for long track or subgroup lists.
 * Use alongside `DepartmentSortToggle` (sort order), not as a replacement.
 */
export function SectionCollapseToggle({ expanded, onToggle, label, compact }: Props) {
  const iconClass = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const btnClass = compact
    ? 'inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300/90 bg-white p-1 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900'
    : 'inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300/90 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900';
  return (
    <button
      type="button"
      onClick={onToggle}
      className={btnClass}
      title={expanded ? `${label}: hide list` : `${label}: show list`}
      aria-expanded={expanded}
      aria-label={`${label}, ${expanded ? 'expanded' : 'collapsed'}. Toggle visibility.`}
    >
      {expanded ? (
        <ChevronDown className={iconClass} aria-hidden />
      ) : (
        <ChevronRight className={iconClass} aria-hidden />
      )}
    </button>
  );
}
