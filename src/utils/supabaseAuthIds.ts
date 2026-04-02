/** True when `id` is a standard UUID shape (Supabase Auth users). Demo ids like admin-1 never match. */
export function isSupabaseAuthUserId(id: string): boolean {
  if (!id || id.length < 32) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
