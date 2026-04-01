import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import { supabase } from '@/supabase/client';
import { fetchUserById } from '@/supabase/dataService';
import { authSignOut } from '@/supabase/authFlow';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const stored = localStorage.getItem('campus-connect-user');
    return stored ? (JSON.parse(stored) as User) : null;
  });

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session?.user) return;
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
      if (event === 'SIGNED_OUT' || !session?.user) {
        if (event === 'SIGNED_OUT') {
          setUserState(null);
          localStorage.removeItem('campus-connect-user');
        }
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
