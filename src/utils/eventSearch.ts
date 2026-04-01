import type { Event } from '@/types';

function searchTokens(query: string): string[] {
  const raw = query.trim().toLowerCase();
  if (!raw) return [];
  return raw.split(/\s+/).filter(Boolean);
}

/** Case-insensitive match on title, description, location, organiser, status; supports multiple space-separated terms. */
export function filterEventsBySearch(events: Event[], query: string): Event[] {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return events;
  return events.filter((e) => {
    const hay = [e.title, e.description, e.location, e.organiserName, e.status].join(' ').toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

/** Same token rules as event search, for plain text rows (e.g. attendance tables). */
export function textMatchesEventSearch(haystack: string, query: string): boolean {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;
  const h = haystack.toLowerCase();
  return tokens.every((t) => h.includes(t));
}
