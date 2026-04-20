import type { User } from '@/types';
import { formatAcademicDepartmentLine, SENIOR_HIGH_STRANDS } from '@/constants/academicEnrollment';

export type EnrollmentTrackId = 'junior_high' | 'senior_high' | 'college' | 'unspecified';

export const ENROLLMENT_TRACK_ORDER: EnrollmentTrackId[] = [
  'junior_high',
  'senior_high',
  'college',
  'unspecified',
];

export const ENROLLMENT_TRACK_SECTION_TITLES: Record<EnrollmentTrackId, string> = {
  junior_high: 'Junior high school',
  senior_high: 'Senior high school',
  college: 'College',
  unspecified: 'Enrollment not on file',
};

/** Single-/multi-event PDF & Excel: subtitle + filename tag when exporting one level only */
export const ATTENDANCE_EXPORT_SCOPE_LINE = {
  junior_high: 'Junior high school only',
  senior_high: 'Senior high school only',
  college: 'College only',
} as const;

export type AttendanceExportTrackScope = keyof typeof ATTENDANCE_EXPORT_SCOPE_LINE;

export const ATTENDANCE_EXPORT_FILE_TAG: Record<AttendanceExportTrackScope, string> = {
  junior_high: 'junior_high',
  senior_high: 'senior_high',
  college: 'college',
};

export function isAttendanceExportTrackScope(id: EnrollmentTrackId): id is AttendanceExportTrackScope {
  return id === 'junior_high' || id === 'senior_high' || id === 'college';
}

export function enrollmentTrackId(
  u: Pick<User, 'academicTrack' | 'academicYear'> | undefined
): EnrollmentTrackId {
  if (!u?.academicTrack || !u.academicYear?.trim()) return 'unspecified';
  const t = u.academicTrack;
  if (t === 'junior_high' || t === 'senior_high' || t === 'college') return t;
  return 'unspecified';
}

/**
 * Sort key for sub-groups: JH stored 1–4 (UI Grade 7–10), SH 11–12, college year 1–4 + program (for stable ordering).
 */
export function enrollmentSubgroupSortKey(
  u: Pick<User, 'academicTrack' | 'academicYear' | 'academicProgram'> | undefined
): string {
  const tid = enrollmentTrackId(u);
  if (tid === 'unspecified') return 'z_unspecified';
  const y = (u?.academicYear ?? '').trim();
  const prog = (u?.academicProgram ?? '').trim().toLowerCase();
  if (tid === 'junior_high') return `aa_jh_${y.padStart(4, '0')}_${prog}`;
  if (tid === 'senior_high') {
    const idx = SENIOR_HIGH_STRANDS.findIndex((s) => s.toLowerCase() === prog);
    const rank = idx >= 0 ? String(idx).padStart(4, '0') : `zzzz_${prog}`;
    return `bb_sh_${y.padStart(4, '0')}_${rank}`;
  }
  return `cc_co_${y.padStart(4, '0')}_${prog}`;
}

export function enrollmentSubgroupLabel(
  u: Pick<User, 'academicTrack' | 'academicYear' | 'academicProgram'> | undefined
): string {
  if (!u?.academicTrack || !u.academicYear?.trim()) return 'Enrollment not on file';
  return formatAcademicDepartmentLine(u.academicTrack, u.academicYear, u.academicProgram);
}

export function compareTrackIds(a: EnrollmentTrackId, b: EnrollmentTrackId): number {
  return ENROLLMENT_TRACK_ORDER.indexOf(a) - ENROLLMENT_TRACK_ORDER.indexOf(b);
}

/** Sort students (or any profile with academic_*) for rosters and admin lists. */
export function compareUsersBySchoolEnrollment(a: User, b: User): number {
  const ta = enrollmentTrackId(a);
  const tb = enrollmentTrackId(b);
  let cmp = compareTrackIds(ta, tb);
  if (cmp !== 0) return cmp;
  cmp = enrollmentSubgroupSortKey(a).localeCompare(enrollmentSubgroupSortKey(b));
  if (cmp !== 0) return cmp;
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

/** Ascending / descending for department subgroup rows and name order within a subgroup. */
export type EnrollmentSortDir = 'asc' | 'desc';

export function flipEnrollmentSortDir(d: EnrollmentSortDir): EnrollmentSortDir {
  return d === 'asc' ? 'desc' : 'asc';
}

/** Stable key for per-subgroup UI state (admin users, rosters). */
export function enrollmentSubgroupUiKey(trackId: string, subgroupKey: string): string {
  return `${trackId}::${subgroupKey}`;
}

export function sortSubgroupBucketsByKey<T>(
  subgroups: EnrollmentSubgroupBucket<T>[],
  dir: EnrollmentSortDir
): EnrollmentSubgroupBucket<T>[] {
  return [...subgroups].sort((a, b) =>
    dir === 'asc' ? a.subgroupKey.localeCompare(b.subgroupKey) : b.subgroupKey.localeCompare(a.subgroupKey)
  );
}

export function sortUsersByDisplayName(users: User[], dir: EnrollmentSortDir): User[] {
  return [...users].sort((a, b) => {
    const c = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    return dir === 'asc' ? c : -c;
  });
}

export type EnrollmentSubgroupBucket<T> = {
  subgroupKey: string;
  label: string;
  items: T[];
};

export type EnrollmentTrackSection<T> = {
  trackId: EnrollmentTrackId;
  sectionTitle: string;
  subgroups: EnrollmentSubgroupBucket<T>[];
};

function partitionIntoSubgroups<T>(
  items: T[],
  subgroupKey: (item: T) => string,
  label: (item: T) => string
): EnrollmentSubgroupBucket<T>[] {
  const map = new Map<string, { label: string; rows: T[] }>();
  for (const item of items) {
    const sk = subgroupKey(item);
    const lb = label(item);
    if (!map.has(sk)) map.set(sk, { label: lb, rows: [] });
    map.get(sk)!.rows.push(item);
  }
  return [...map.entries()]
    .sort(([ka], [kb]) => ka.localeCompare(kb))
    .map(([subgroupKey, v]) => ({ subgroupKey, label: v.label, items: v.rows }));
}

/** Group users (typically students) into junior high → senior high → college → unspecified with grade/year/program sub-headers. */
export function buildUserTrackSections(users: User[]): EnrollmentTrackSection<User>[] {
  const sorted = [...users].sort(compareUsersBySchoolEnrollment);
  const byTrack = new Map<EnrollmentTrackId, User[]>();
  for (const id of ENROLLMENT_TRACK_ORDER) byTrack.set(id, []);
  for (const u of sorted) {
    byTrack.get(enrollmentTrackId(u))!.push(u);
  }
  const sections: EnrollmentTrackSection<User>[] = [];
  for (const trackId of ENROLLMENT_TRACK_ORDER) {
    const list = byTrack.get(trackId)!;
    if (list.length === 0) continue;
    const subgroups = partitionIntoSubgroups(
      list,
      (u) => enrollmentSubgroupSortKey(u),
      (u) => enrollmentSubgroupLabel(u)
    );
    sections.push({
      trackId,
      sectionTitle: ENROLLMENT_TRACK_SECTION_TITLES[trackId],
      subgroups,
    });
  }
  return sections;
}
