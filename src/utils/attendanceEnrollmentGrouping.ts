import type { AttendanceRecord, User } from '@/types';
import type { AttendanceExportRecord, MultiEventAttendanceRow } from '@/utils/attendanceExport';
import { formatAcademicYearLevelLabel } from '@/constants/academicEnrollment';
import type { EnrollmentSortDir } from '@/utils/academicEnrollmentOrdering';
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

/** PDF/Excel exports: profile name only; never show email as the display name. */
export function exportDisplayName(u: User | undefined, record: AttendanceRecord): string {
  const fromProfile = u?.name?.trim();
  if (fromProfile) return fromProfile;
  const snap = record.userName?.trim() ?? '';
  if (!snap) return '—';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(snap)) return '—';
  return snap;
}

export function sortAttendanceRecordsByDisplayName(
  records: AttendanceRecord[],
  users: User[],
  dir: EnrollmentSortDir
): AttendanceRecord[] {
  return [...records].sort((a, b) => {
    const ua = resolveUserForAttendance(users, a);
    const ub = resolveUserForAttendance(users, b);
    const na = exportDisplayName(ua, a);
    const nb = exportDisplayName(ub, b);
    const c = na.localeCompare(nb, undefined, { sensitivity: 'base' });
    return dir === 'asc' ? c : -c;
  });
}

export function sortAttendanceWithEventByDisplayName(
  rows: AttendanceRecordWithEvent[],
  users: User[],
  dir: EnrollmentSortDir
): AttendanceRecordWithEvent[] {
  return [...rows].sort((a, b) => {
    const ua = resolveUserForAttendance(users, a);
    const ub = resolveUserForAttendance(users, b);
    const na = exportDisplayName(ua, a);
    const nb = exportDisplayName(ub, b);
    let cmp = na.localeCompare(nb, undefined, { sensitivity: 'base' });
    if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
    cmp = a.eventTitle.localeCompare(b.eventTitle, undefined, { sensitivity: 'base' });
    return dir === 'asc' ? cmp : -cmp;
  });
}

/** Roster / PDF “Department” column: same as registration enrollment line. */
export function departmentLabelForExport(u: User | undefined): string {
  if (!u?.academicTrack) return 'Department not on file';
  const full = formatUserAcademicLine(u);
  if (full) return full;
  return 'Department not on file';
}

/** Export column for JH section / SH strand / college program. */
export function sectionOrStrandForExport(u: User | undefined): string {
  const raw = (u?.academicProgram ?? '').trim();
  return raw || 'Not set';
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
      const u = resolveUserForAttendance(users, r as AttendanceRecord);
      out.push({
        userName: exportDisplayName(u, r as AttendanceRecord),
        scannedAt: r.scannedAt,
        timeOutAt: r.timeOutAt,
        department: departmentLabelForExport(u),
        yearLevel: formatAcademicYearLevelLabel(u ?? {}),
        sectionOrStrand: sectionOrStrandForExport(u),
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
      const u = resolveUserForAttendance(users, r);
      out.push({
        eventTitle: r.eventTitle,
        userName: exportDisplayName(u, r),
        scannedAt: r.scannedAt,
        timeOutAt: r.timeOutAt,
        department: departmentLabelForExport(u),
        yearLevel: formatAcademicYearLevelLabel(u ?? {}),
        sectionOrStrand: sectionOrStrandForExport(u),
        rosterIndexInLevel: n,
      });
    }
  }
  return out;
}

export type CollegeProgramSectionGroup<T extends AttendanceRecord> = {
  programKey: string;
  programLabel: string;
  items: T[];
};

/** Group one college section into export buckets by program (all college years under each program). */
export function collegeProgramGroupsForAttendanceSection<T extends AttendanceRecord>(
  section: EnrollmentTrackSection<T>,
  users: User[]
): CollegeProgramSectionGroup<T>[] {
  if (section.trackId !== 'college') return [];
  const byProgram = new Map<string, CollegeProgramSectionGroup<T>>();
  for (const sg of section.subgroups) {
    for (const row of sg.items) {
      const u = resolveUserForAttendance(users, row as AttendanceRecord);
      const raw = (u?.academicProgram ?? '').trim();
      const label = raw || 'Program not on file';
      const key = label.toLowerCase();
      if (!byProgram.has(key)) byProgram.set(key, { programKey: key, programLabel: label, items: [] });
      byProgram.get(key)!.items.push(row);
    }
  }
  return [...byProgram.values()].sort((a, b) => a.programLabel.localeCompare(b.programLabel));
}

/** Export rows for an arbitrary attendance row subset (index restarts at 1). */
export function recordsForAttendanceRows<T extends AttendanceRecord>(
  rows: T[],
  users: User[]
): AttendanceExportRecord[] {
  return rows.map((r, i) => {
    const u = resolveUserForAttendance(users, r as AttendanceRecord);
    return {
      userName: exportDisplayName(u, r as AttendanceRecord),
      scannedAt: r.scannedAt,
      timeOutAt: r.timeOutAt,
      department: departmentLabelForExport(u),
      yearLevel: formatAcademicYearLevelLabel(u ?? {}),
      sectionOrStrand: sectionOrStrandForExport(u),
      rosterIndexInLevel: i + 1,
    };
  });
}

/** Multi-event export rows for an arbitrary attendance row subset (index restarts at 1). */
export function multiEventRowsForAttendanceRows(
  rows: AttendanceRecordWithEvent[],
  users: User[]
): MultiEventAttendanceRow[] {
  return rows.map((r, i) => {
    const u = resolveUserForAttendance(users, r);
    return {
      eventTitle: r.eventTitle,
      userName: exportDisplayName(u, r),
      scannedAt: r.scannedAt,
      timeOutAt: r.timeOutAt,
      department: departmentLabelForExport(u),
      yearLevel: formatAcademicYearLevelLabel(u ?? {}),
      sectionOrStrand: sectionOrStrandForExport(u),
      rosterIndexInLevel: i + 1,
    };
  });
}
