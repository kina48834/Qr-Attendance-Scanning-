import { Search } from 'lucide-react';

type EventListSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  /** compact = shorter field, good for admin/teacher list toolbars */
  size?: 'default' | 'compact';
};

const defaultPlaceholder = 'Search by title, location, organiser, or status…';

export function EventListSearchBar({
  value,
  onChange,
  id = 'event-list-search',
  placeholder = defaultPlaceholder,
  className = '',
  size = 'default',
}: EventListSearchBarProps) {
  const compact = size === 'compact';
  return (
    <div className={`relative w-full ${className}`}>
      <Search
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`}
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-campus-primary focus:outline-none focus:ring-2 focus:ring-campus-primary/25 ${
          compact ? 'py-2 text-sm max-w-md' : 'py-2.5 text-sm'
        }`}
        aria-label="Search events"
      />
    </div>
  );
}
