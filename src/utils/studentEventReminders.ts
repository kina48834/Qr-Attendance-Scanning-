import type { AttendanceRecord, Event } from '@/types';

/** Published events that have not ended and where the student has no attendance row. */
export function upcomingPublishedWithoutAttendance(
  events: Event[],
  attendance: AttendanceRecord[],
  userId: string,
  now: Date = new Date()
): Event[] {
  const attended = new Set(attendance.filter((a) => a.userId === userId).map((a) => a.eventId));
  return events
    .filter(
      (e) =>
        e.status === 'published' &&
        new Date(e.endDate).getTime() >= now.getTime() &&
        !attended.has(e.id)
    )
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

/** Past published/completed events where the student never recorded attendance (excludes cancelled/draft). */
export function missedPublishedWithoutAttendance(
  events: Event[],
  attendance: AttendanceRecord[],
  userId: string,
  now: Date = new Date()
): Event[] {
  const attended = new Set(attendance.filter((a) => a.userId === userId).map((a) => a.eventId));
  return events
    .filter(
      (e) =>
        (e.status === 'published' || e.status === 'completed') &&
        new Date(e.endDate).getTime() < now.getTime() &&
        !attended.has(e.id)
    )
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
}

/** Total reminders for sidebar badge: open published events without check-in + missed past events. */
export function studentReminderTotalCount(
  events: Event[],
  attendance: AttendanceRecord[],
  userId: string,
  now: Date = new Date()
): number {
  return (
    upcomingPublishedWithoutAttendance(events, attendance, userId, now).length +
    missedPublishedWithoutAttendance(events, attendance, userId, now).length
  );
}
