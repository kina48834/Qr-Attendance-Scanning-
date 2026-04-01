import { supabase } from '@/supabase/client';

/** Stored in public.users.password when the real password is managed by Supabase Auth (not used for verification). */
export const SUPABASE_AUTH_PASSWORD_MARKER = 'supabase-auth';

export async function authSignUp(email: string, password: string, metadata: Record<string, unknown>) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: metadata },
  });
}

export async function authSignIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
}

export async function authSignOut() {
  return supabase.auth.signOut();
}
