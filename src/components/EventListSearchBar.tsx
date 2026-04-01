import { Search } from 'lucide-react';

type EventListSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
};

const defaultPlaceholder = 'Search by title, location, organiser, or status…';

export function EventListSearchBar({
  value,
  onChange,
  id = 'event-list-search',
  placeholder = defaultPlaceholder,
  className = '',
}: EventListSearchBarProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-campus-primary focus:outline-none focus:ring-2 focus:ring-campus-primary"
        aria-label="Search events"
      />
    </div>
  );
}
