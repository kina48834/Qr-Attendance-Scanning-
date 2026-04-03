import type { AttendanceRecord, User } from '@/types';
import { formatUserAcademicLine } from '@/utils/academicProfileDisplay';

export type AttendanceEnrollmentGroup = {
  sortKey: string;
  label: string;
  rows: AttendanceRecord[];
};

export function resolveUserForAttendance(users: User[], record: AttendanceRecord): User | undefined {
  const byId = users.find((u) => u.id === record.userId);
  if (byId) return byId;
  const e = record.userEmail.trim().toLowerCase();
  if (!e) return undefined;
  return users.find((u) => u.email.trim().toLowerCase() === e);
}

/** Stable ordering: junior high → senior high → college (by year/program) → not on file. */
export function enrollmentSortKeyForUser(u: User | undefined): string {
  if (!u?.academicTrack || !u.academicYear) {
    return 'zz_not_on_file';
  }
  const t = u.academicTrack;
  const y = u.academicYear;
  if (t === 'junior_high') return `aa_jh_${y.padStart(4, '0')}`;
  if (t === 'senior_high') return `bb_sh_${y.padStart(4, '0')}`;
  const prog = (u.academicProgram ?? '').trim().toLowerCase();
  return `cc_co_${y.padStart(4, '0')}_${prog}`;
}

export function enrollmentLabelForAttendanceRow(u: User | undefined): string {
  if (!u) return 'Enrollment not on file';
  const line = formatUserAcademicLine(u);
  return line ?? 'Enrollment not on file';
}

export function groupAttendanceRecordsByEnrollment(
  records: AttendanceRecord[],
  users: User[]
): AttendanceEnrollmentGroup[] {
  const sorted = [...records].sort(
    (a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime()
  );
  const bucket = new Map<string, { label: string; rows: AttendanceRecord[] }>();
  for (const r of sorted) {
    const u = resolveUserForAttendance(users, r);
    const sk = enrollmentSortKeyForUser(u);
    const label = enrollmentLabelForAttendanceRow(u);
    if (!bucket.has(sk)) bucket.set(sk, { label, rows: [] });
    bucket.get(sk)!.rows.push(r);
  }
  return [...bucket.entries()]
    .sort(([ka], [kb]) => ka.localeCompare(kb))
    .map(([sortKey, v]) => ({ sortKey, label: v.label, rows: v.rows }));
}
