import type { User } from '@/types';

/** How sign-in / routing should treat a teacher account. */
export function effectiveTeacherApproval(u: Pick<User, 'role' | 'approvalStatus'>): 'approved' | 'pending' | 'rejected' {
  if (u.role !== 'teacher') return 'approved';
  return u.approvalStatus ?? 'approved';
}

export function teacherSignInBlockMessage(u: Pick<User, 'role' | 'approvalStatus'>): string | null {
  if (u.role !== 'teacher') return null;
  const s = effectiveTeacherApproval(u);
  if (s === 'pending') {
    return 'Your teacher account is pending administrator approval. You can sign in once it has been approved in User Management.';
  }
  if (s === 'rejected') {
    return 'Your teacher registration was not approved. Please contact administration if you need help.';
  }
  return null;
}
