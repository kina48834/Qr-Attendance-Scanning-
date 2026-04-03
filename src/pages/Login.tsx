import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Info, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PasswordField } from '@/components/PasswordField';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { LandingAuthFormCard } from '@/components/auth/LandingAuthFormCard';
import {
  landingAuthPrimaryButtonClass,
  landingAuthInputClass,
  landingAuthLabelClass,
  landingAuthEyebrowClass,
  landingAuthLinkClass,
  landingAuthMutedLinkClass,
  landingAlertInfo,
  landingAlertWarn,
  landingAlertError,
} from '@/components/auth/authClasses';
import { teacherSignInBlockMessage } from '@/utils/userApproval';
import { authSignIn, authSignOut, SUPABASE_AUTH_PASSWORD_MARKER } from '@/supabase/authFlow';
import { fetchUserById, fetchUserByEmailForLegacyLogin } from '@/supabase/dataService';
import type { User } from '@/types';

function navigateAfterLogin(role: User['role'], navigate: ReturnType<typeof useNavigate>) {
  if (role === 'administrator') navigate('/admin', { replace: true });
  else if (role === 'organiser') navigate('/organiser', { replace: true });
  else if (role === 'teacher') navigate('/teacher', { replace: true });
  else navigate('/student', { replace: true });
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locState = location.state as {
    teacherRegisteredPending?: boolean;
    teacherAccountNotice?: 'pending' | 'rejected';
  } | null;
  const teacherPendingNotice = locState?.teacherRegisteredPending;
  const teacherAccountNotice = locState?.teacherAccountNotice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailTrim = email.trim();
    const passwordTrimmed = password.trim();

    let tableUser: Awaited<ReturnType<typeof fetchUserByEmailForLegacyLogin>>;
    try {
      tableUser = await fetchUserByEmailForLegacyLogin(emailTrim);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        `Cannot read accounts from the database (${msg}). Confirm VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, run supabase/sql (RLS + seed), and redeploy.`
      );
      return;
    }

    if (
      tableUser &&
      tableUser.password !== SUPABASE_AUTH_PASSWORD_MARKER &&
      tableUser.password === passwordTrimmed
    ) {
      const block = teacherSignInBlockMessage(tableUser);
      if (block) {
        setError(block);
        return;
      }
      try {
        await authSignOut();
      } catch {
        /* ignore */
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
      const { password: _, ...sessionUser } = tableUser;
      setUser({ ...sessionUser });
      navigateAfterLogin(tableUser.role, navigate);
      return;
    }

    const { data: signData, error: signErr } = await authSignIn(emailTrim, passwordTrimmed);
    if (!signErr && signData.user) {
      const profile = await fetchUserById(signData.user.id);
      if (!profile) {
        setError(
          'No profile row in public.users for this Auth account (id must match). Ask an admin to run the SQL seed or fix your profile.'
        );
        await authSignOut();
        return;
      }
      const block = teacherSignInBlockMessage(profile);
      if (block) {
        setError(block);
        await authSignOut();
        return;
      }
      const { password: _, ...sessionUser } = profile;
      setUser({ ...sessionUser });
      navigateAfterLogin(profile.role, navigate);
      return;
    }

    if (tableUser?.password === SUPABASE_AUTH_PASSWORD_MARKER) {
      setError(
        signErr?.message ??
          'This email uses Supabase Auth. Sign in with the password you chose at registration.'
      );
      return;
    }
    if (tableUser) {
      setError('Incorrect password.');
      return;
    }
    setError(signErr?.message ?? 'No account found with this email.');
  };

  return (
    <AuthPageLayout authMode="login">
      <LandingAuthFormCard>
        <p className={landingAuthEyebrowClass}>Andres Soriano Colleges of Bislig</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">Sign in</h1>
        <p className="mt-1 text-xs text-white/65 sm:text-sm">Campus Connect — events, QR attendance, and analytics.</p>

        <form onSubmit={handleSubmit} className="relative z-[1] mt-5 space-y-3">
          {teacherPendingNotice && (
            <div className={landingAlertInfo}>
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-200" aria-hidden />
              <span>Teacher registration pending — sign in after approval.</span>
            </div>
          )}
          {teacherAccountNotice === 'pending' && (
            <div className={landingAlertWarn}>
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200" aria-hidden />
              <span>Teacher area locked until your account is approved.</span>
            </div>
          )}
          {teacherAccountNotice === 'rejected' && (
            <div className={landingAlertError}>
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-200" aria-hidden />
              <span>Teacher registration was not approved. Contact administration.</span>
            </div>
          )}
          {error && (
            <div className={landingAlertError}>
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-200" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="login-email" className={landingAuthLabelClass}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={landingAuthInputClass}
              placeholder="you@gmail.com"
              autoComplete="email"
            />
          </div>
          <PasswordField
            theme="landing"
            label="Password"
            value={password}
            onChange={setPassword}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            id="login-password"
          />
          <button type="submit" className={landingAuthPrimaryButtonClass}>
            <LogIn className="h-4 w-4" aria-hidden />
            Sign in
          </button>
        </form>

        <div className="relative z-[1] mt-5 space-y-2 text-center text-xs text-white/65 sm:text-sm">
          <p>
            New here?{' '}
            <Link to="/register" className={landingAuthLinkClass}>
              Create an account
            </Link>
            <span className="mx-1 text-white/25">·</span>
            <Link to="/about" className={landingAuthLinkClass}>
              About
            </Link>
          </p>
          <Link to="/" className={`inline-flex items-center gap-1 text-xs ${landingAuthMutedLinkClass}`}>
            ← Back to home
          </Link>
        </div>
      </LandingAuthFormCard>
    </AuthPageLayout>
  );
}
