/** Mirrors `public.users.academic_*` and registration/profile UI. */

import type { AcademicTrack } from '@/types';

export const ACADEMIC_TRACK_OPTIONS: { value: AcademicTrack; label: string }[] = [
  { value: 'junior_high', label: 'Junior high school' },
  { value: 'senior_high', label: 'Senior high school' },
  { value: 'college', label: 'College' },
];

export const JUNIOR_HIGH_YEAR_OPTIONS = [
  { value: '1', label: 'Grade 7' },
  { value: '2', label: 'Grade 8' },
  { value: '3', label: 'Grade 9' },
  { value: '4', label: 'Grade 10' },
] as const;

export const SENIOR_HIGH_YEAR_OPTIONS = [
  { value: '11', label: 'Grade 11' },
  { value: '12', label: 'Grade 12' },
] as const;

export const COLLEGE_YEAR_OPTIONS = [
  { value: '1', label: '1st — First year' },
  { value: '2', label: '2nd — Second year' },
  { value: '3', label: '3rd — Third year' },
  { value: '4', label: '4th — Fourth year' },
] as const;

export const COLLEGE_PROGRAMS = [
  'BS Computer Science',
  'BS Information Technology',
  'BS Tourism',
  'BS Nursing',
  'BS Computer Engineering',
  'BS Education',
  'BS Business Administration',
  'BS Hospitality Management',
  'BS Accountancy',
] as const;

export type AcademicEnrollmentValue = {
  track: AcademicTrack | '';
  year: string;
  program: string;
};

export const emptyAcademicEnrollment = (): AcademicEnrollmentValue => ({
  track: '',
  year: '',
  program: '',
});

export function formatAcademicDepartmentLine(
  track: AcademicTrack,
  year: string,
  program: string | null | undefined
): string {
  if (track === 'junior_high') {
    const y = JUNIOR_HIGH_YEAR_OPTIONS.find((o) => o.value === year);
    return `Junior high — ${y?.label ?? `Year ${year}`}`;
  }
  if (track === 'senior_high') {
    const y = SENIOR_HIGH_YEAR_OPTIONS.find((o) => o.value === year);
    return `Senior high — ${y?.label ?? `Grade ${year}`}`;
  }
  const y = COLLEGE_YEAR_OPTIONS.find((o) => o.value === year);
  const prog = (program ?? '').trim() || 'Program';
  return `College — ${prog} — ${y?.label ?? `Year ${year}`}`;
}

export function validateAcademicEnrollment(v: AcademicEnrollmentValue): string | null {
  if (!v.track) return 'Select a school level (junior high, senior high, or college).';
  if (!v.year) return 'Select a year or grade level.';
  if (v.track === 'junior_high' && !JUNIOR_HIGH_YEAR_OPTIONS.some((o) => o.value === v.year)) {
    return 'Choose a valid junior high grade (Grade 7–10).';
  }
  if (v.track === 'senior_high' && !SENIOR_HIGH_YEAR_OPTIONS.some((o) => o.value === v.year)) {
    return 'Choose Grade 11 or Grade 12.';
  }
  if (v.track === 'college') {
    if (!COLLEGE_YEAR_OPTIONS.some((o) => o.value === v.year)) return 'Choose a valid college year.';
    if (!v.program.trim()) return 'Select a college program.';
    if (!(COLLEGE_PROGRAMS as readonly string[]).includes(v.program.trim())) {
      return 'Select a program from the list.';
    }
  }
  return null;
}

export function userToAcademicEnrollment(u: {
  academicTrack?: AcademicTrack;
  academicYear?: string;
  academicProgram?: string | null;
}): AcademicEnrollmentValue {
  return {
    track: u.academicTrack ?? '',
    year: u.academicYear ?? '',
    program: u.academicProgram ?? '',
  };
}

/** Grade / year label only (PDF/Excel “Year level” column); not the full department line. */
export function formatAcademicYearLevelLabel(user: {
  academicTrack?: AcademicTrack;
  academicYear?: string;
}): string {
  const t = user.academicTrack;
  const y = user.academicYear?.trim();
  if (!t || !y) return '—';
  if (t === 'junior_high') {
    const opt = JUNIOR_HIGH_YEAR_OPTIONS.find((o) => o.value === y);
    return opt?.label ?? y;
  }
  if (t === 'senior_high') {
    const opt = SENIOR_HIGH_YEAR_OPTIONS.find((o) => o.value === y);
    return opt?.label ?? `Grade ${y}`;
  }
  if (t === 'college') {
    const opt = COLLEGE_YEAR_OPTIONS.find((o) => o.value === y);
    return opt?.label ?? y;
  }
  return '—';
}
