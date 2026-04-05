import type { AttendanceRecord, User } from '@/types';
import type { AttendanceExportRecord, MultiEventAttendanceRow } from '@/utils/attendanceExport';
import { formatUserAcademicLine } from '@/utils/academicProfileDisplay';
import {
  compareTrackIds,
  ENROLLMENT_TRACK_SECTION_TITLES,
  enrollmentSubgroupLabel,
  enrollmentSubgroupSortKey,
  enrollmentTrackId,
  ENROLLMENT_TRACK_ORDER,
  type EnrollmentTrackId,
  type EnrollmentTrackSection,
} from '@/utils/academicEnrollmentOrdering';

export type { EnrollmentTrackId, EnrollmentTrackSection };

export type AttendanceTrackSection = EnrollmentTrackSection<AttendanceRecord>;

export type AttendanceRecordWithEvent = AttendanceRecord & { eventTitle: string };

export function resolveUserForAttendance(users: User[], record: AttendanceRecord): User | undefined {
  const byId = users.find((u) => u.id === record.userId);
  if (byId) return byId;
  const e = record.userEmail.trim().toLowerCase();
  if (!e) return undefined;
  return users.find((u) => u.email.trim().toLowerCase() === e);
}

export function enrollmentLabelForAttendanceRow(u: User | undefined): string {
  if (!u) return 'Enrollment not on file';
  const line = formatUserAcademicLine(u);
  return line ?? 'Enrollment not on file';
}

/**
 * Junior high (stored years 1–4, UI Grade 7–10) → senior high (11–12) → college (years 1–4 by program) → not on file;
 * each track has year/program sub-groups. Row order within subgroup: scan time.
 */
export function buildAttendanceTrackSections(
  records: AttendanceRecord[],
  users: User[]
): AttendanceTrackSection[] {
  const resolve = (r: AttendanceRecord) => resolveUserForAttendance(users, r);
  const sorted = [...records].sort((a, b) => {
    const ua = resolve(a);
    const ub = resolve(b);
    let cmp = compareTrackIds(enrollmentTrackId(ua), enrollmentTrackId(ub));
    if (cmp !== 0) return cmp;
    cmp = enrollmentSubgroupSortKey(ua).localeCompare(enrollmentSubgroupSortKey(ub));
    if (cmp !== 0) return cmp;
    return new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime();
  });

  const byTrack = new Map<EnrollmentTrackId, AttendanceRecord[]>();
  for (const id of ENROLLMENT_TRACK_ORDER) byTrack.set(id, []);
  for (const r of sorted) {
    byTrack.get(enrollmentTrackId(resolve(r)))!.push(r);
  }

  const sections: AttendanceTrackSection[] = [];
  for (const trackId of ENROLLMENT_TRACK_ORDER) {
    const list = byTrack.get(trackId)!;
    if (list.length === 0) continue;

    const subMap = new Map<string, { label: string; rows: AttendanceRecord[] }>();
    for (const r of list) {
      const u = resolve(r);
      const sk = enrollmentSubgroupSortKey(u);
      const label = enrollmentSubgroupLabel(u);
      if (!subMap.has(sk)) subMap.set(sk, { label, rows: [] });
      subMap.get(sk)!.rows.push(r);
    }
    const subgroups = [...subMap.entries()]
      .sort(([ka], [kb]) => ka.localeCompare(kb))
      .map(([subgroupKey, v]) => ({ subgroupKey, label: v.label, items: v.rows }));

    sections.push({
      trackId,
      sectionTitle: ENROLLMENT_TRACK_SECTION_TITLES[trackId],
      subgroups,
    });
  }
  return sections;
}

/** Same as buildAttendanceTrackSections but rows carry `eventTitle` (organiser “all attendance” table). */
export function buildAttendanceTrackSectionsWithEvent(
  rows: AttendanceRecordWithEvent[],
  users: User[]
): EnrollmentTrackSection<AttendanceRecordWithEvent>[] {
  const resolve = (r: AttendanceRecord) => resolveUserForAttendance(users, r);
  const sorted = [...rows].sort((a, b) => {
    const ua = resolve(a);
    const ub = resolve(b);
    let cmp = compareTrackIds(enrollmentTrackId(ua), enrollmentTrackId(ub));
    if (cmp !== 0) return cmp;
    cmp = enrollmentSubgroupSortKey(ua).localeCompare(enrollmentSubgroupSortKey(ub));
    if (cmp !== 0) return cmp;
    cmp = a.eventTitle.localeCompare(b.eventTitle);
    if (cmp !== 0) return cmp;
    return new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime();
  });

  const byTrack = new Map<EnrollmentTrackId, AttendanceRecordWithEvent[]>();
  for (const id of ENROLLMENT_TRACK_ORDER) byTrack.set(id, []);
  for (const r of sorted) {
    byTrack.get(enrollmentTrackId(resolve(r)))!.push(r);
  }

  const sections: EnrollmentTrackSection<AttendanceRecordWithEvent>[] = [];
  for (const trackId of ENROLLMENT_TRACK_ORDER) {
    const list = byTrack.get(trackId)!;
    if (list.length === 0) continue;

    const subMap = new Map<string, { label: string; rows: AttendanceRecordWithEvent[] }>();
    for (const r of list) {
      const u = resolve(r);
      const sk = enrollmentSubgroupSortKey(u);
      const label = enrollmentSubgroupLabel(u);
      if (!subMap.has(sk)) subMap.set(sk, { label, rows: [] });
      subMap.get(sk)!.rows.push(r);
    }
    const subgroups = [...subMap.entries()]
      .sort(([ka], [kb]) => ka.localeCompare(kb))
      .map(([subgroupKey, v]) => ({ subgroupKey, label: v.label, items: v.rows }));

    sections.push({
      trackId,
      sectionTitle: ENROLLMENT_TRACK_SECTION_TITLES[trackId],
      subgroups,
    });
  }
  return sections;
}

/** Rows for PDF/Excel for one track section (# restarts at 1 within that level). */
export function recordsForAttendanceTrackSection<T extends AttendanceRecord>(
  section: EnrollmentTrackSection<T>,
  users: User[]
): AttendanceExportRecord[] {
  const out: AttendanceExportRecord[] = [];
  let n = 0;
  for (const sg of section.subgroups) {
    for (const r of sg.items) {
      n += 1;
      out.push({
        userName: r.userName,
        userEmail: r.userEmail,
        scannedAt: r.scannedAt,
        enrollment: enrollmentLabelForAttendanceRow(resolveUserForAttendance(users, r as AttendanceRecord)),
        rosterIndexInLevel: n,
      });
    }
  }
  return out;
}

/** Organiser “all events” table: one track’s rows including event title. */
export function multiEventRowsForAttendanceTrackSection(
  section: EnrollmentTrackSection<AttendanceRecordWithEvent>,
  users: User[]
): MultiEventAttendanceRow[] {
  const out: MultiEventAttendanceRow[] = [];
  let n = 0;
  for (const sg of section.subgroups) {
    for (const r of sg.items) {
      n += 1;
      out.push({
        eventTitle: r.eventTitle,
        userName: r.userName,
        userEmail: r.userEmail,
        scannedAt: r.scannedAt,
        enrollment: enrollmentLabelForAttendanceRow(resolveUserForAttendance(users, r)),
        rosterIndexInLevel: n,
      });
    }
  }
  return out;
}
