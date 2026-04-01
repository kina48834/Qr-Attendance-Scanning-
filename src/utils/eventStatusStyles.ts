import type { Event } from '@/types';

const base = 'inline-flex px-2.5 py-1 rounded-full text-xs font-medium ring-1';

export function eventStatusBadgeClass(status: Event['status']): string {
  switch (status) {
    case 'published':
      return `${base} bg-emerald-50 text-emerald-800 ring-emerald-200/90`;
    case 'draft':
      return `${base} bg-amber-50 text-amber-900 ring-amber-200/90`;
    case 'completed':
      return `${base} bg-slate-100 text-slate-700 ring-slate-200/90`;
    case 'cancelled':
      return `${base} bg-red-50 text-red-800 ring-red-200/90`;
    default:
      return `${base} bg-slate-100 text-slate-700 ring-slate-200/90`;
  }
}
