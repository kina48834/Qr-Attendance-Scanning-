import { useContext, useState, useCallback, useEffect, ReactNode, createContext } from 'react';
import type { User } from '@/types';
import { supabase } from '@/supabase/client';
import { fetchUserById } from '@/supabase/dataService';
import { authSignOut } from '@/supabase/authFlow';
import { isSupabaseAuthUserId } from '@/utils/supabaseAuthIds';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const stored = localStorage.getItem('campus-connect-user');
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => readStoredUser());

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session?.user) return;
      const parsed = readStoredUser();
      if (parsed?.id && !isSupabaseAuthUserId(parsed.id)) {
        await supabase.auth.signOut();
        return;
      }
      try {
        const profile = await fetchUserById(session.user.id);
        if (cancelled || !profile) return;
        const { password: _, ...rest } = profile;
        setUserState(rest as User);
        localStorage.setItem('campus-connect-user', JSON.stringify(rest));
      } catch {
        /* keep legacy session from localStorage */
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Defer clearing so Login can run setUser(admin) in the same submit handler after await signOut();
        // without this, we clear UUID localStorage before the legacy user is written → redirect to /login.
        window.setTimeout(() => {
          const parsed = readStoredUser();
          const id = parsed?.id;
          if (id && isSupabaseAuthUserId(id)) {
            setUserState(null);
            localStorage.removeItem('campus-connect-user');
          }
        }, 0);
        return;
      }
      if (!session?.user) return;
      const parsed = readStoredUser();
      if (parsed?.id && !isSupabaseAuthUserId(parsed.id)) {
        void supabase.auth.signOut();
        return;
      }
      try {
        const profile = await fetchUserById(session.user.id);
        if (!profile) return;
        const { password: _, ...rest } = profile;
        setUserState(rest as User);
        localStorage.setItem('campus-connect-user', JSON.stringify(rest));
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const setUser = useCallback((u: User | null) => {
    if (u) {
      const { password: _, ...sessionUser } = u;
      setUserState(sessionUser as User);
      localStorage.setItem('campus-connect-user', JSON.stringify(sessionUser));
    } else {
      setUserState(null);
      localStorage.removeItem('campus-connect-user');
    }
  }, []);

  const logout = useCallback(() => {
    void authSignOut().then(() => {
      setUserState(null);
      localStorage.removeItem('campus-connect-user');
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
