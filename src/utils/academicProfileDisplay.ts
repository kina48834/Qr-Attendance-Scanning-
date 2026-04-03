import type { User } from '@/types';
import { formatAcademicDepartmentLine } from '@/constants/academicEnrollment';

/** Readable line for profile / lists when structured academic fields are set. */
export function formatUserAcademicLine(user: User): string | null {
  const t = user.academicTrack;
  if (!t || !user.academicYear) return null;
  return formatAcademicDepartmentLine(t, user.academicYear, user.academicProgram);
}
