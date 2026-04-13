import type { User } from '@/types';

type ApprovalCheckedRole = 'student' | 'teacher';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export function roleUsesApproval(role: User['role']): role is ApprovalCheckedRole {
  return role === 'student' || role === 'teacher';
}

/** How sign-in / routing should treat student and teacher accounts. */
export function effectiveUserApproval(u: Pick<User, 'role' | 'approvalStatus'>): ApprovalStatus {
  if (!roleUsesApproval(u.role)) return 'approved';
  return u.approvalStatus ?? 'approved';
}

export function approvalSignInBlockMessage(u: Pick<User, 'role' | 'approvalStatus'>): string | null {
  if (!roleUsesApproval(u.role)) return null;
  const s = effectiveUserApproval(u);
  if (s === 'pending') {
    return u.role === 'teacher'
      ? 'Your teacher account is pending administrator approval. You can sign in once an administrator has approved it in Admin → Users.'
      : 'Your student account is pending administrator approval. You can sign in once an administrator has approved it in Admin → Users.';
  }
  if (s === 'rejected') {
    return u.role === 'teacher'
      ? 'Your teacher registration was not approved. Please contact administration if you need help.'
      : 'Your student registration was not approved. Please contact administration if you need help.';
  }
  return null;
}
