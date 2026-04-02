import { supabase } from '@/supabase/client';

/** Stored in public.users.password when the real password is managed by Supabase Auth (not used for verification). */
export const SUPABASE_AUTH_PASSWORD_MARKER = 'supabase-auth';

/** Supabase Auth treats emails case-insensitively; keep DB rows aligned. */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function authSignUp(email: string, password: string, metadata: Record<string, unknown>) {
  const normalized = normalizeAuthEmail(email);
  return supabase.auth.signUp({
    email: normalized,
    password,
    options: {
      data: metadata,
      emailRedirectTo:
        typeof window !== 'undefined' && window.location?.origin
          ? `${window.location.origin}/login`
          : undefined,
    },
  });
}

export async function authSignIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: normalizeAuthEmail(email),
    password,
  });
}

export async function authSignOut() {
  return supabase.auth.signOut();
}
