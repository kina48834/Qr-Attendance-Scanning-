import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo } from '@/components/BrandLogo';
import { PasswordField } from '@/components/PasswordField';
import { teacherSignInBlockMessage } from '@/utils/userApproval';
import { authSignIn, authSignOut, SUPABASE_AUTH_PASSWORD_MARKER } from '@/supabase/authFlow';
import { fetchUserById, fetchUserByEmailForLegacyLogin } from '@/supabase/dataService';

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

    const { data: signData, error: signErr } = await authSignIn(email.trim(), password);
    if (!signErr && signData.user) {
      const profile = await fetchUserById(signData.user.id);
      if (!profile) {
        setError('Your account has no profile in the database. Contact an administrator.');
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
      if (profile.role === 'administrator') navigate('/admin', { replace: true });
      else if (profile.role === 'organiser') navigate('/organiser', { replace: true });
      else if (profile.role === 'teacher') navigate('/teacher', { replace: true });
      else navigate('/student', { replace: true });
      return;
    }

    let user: Awaited<ReturnType<typeof fetchUserByEmailForLegacyLogin>>;
    try {
      user = await fetchUserByEmailForLegacyLogin(email);
    } catch {
      setError(signErr?.message ?? 'Could not reach the database. Check your connection and Supabase settings.');
      return;
    }
    if (!user) {
      setError(signErr?.message ?? 'No account found with this email.');
      return;
    }
    if (user.password === SUPABASE_AUTH_PASSWORD_MARKER) {
      setError(
        signErr?.message ??
          'This email is registered with Supabase Auth. Use the password you chose at registration (not the demo table passwords).'
      );
      return;
    }
    if (user.password !== password) {
      setError('Incorrect password.');
      return;
    }
    const block = teacherSignInBlockMessage(user);
    if (block) {
      setError(block);
      return;
    }
    const { password: _, ...sessionUser } = user;
    setUser({ ...sessionUser });
    if (user.role === 'administrator') navigate('/admin', { replace: true });
    else if (user.role === 'organiser') navigate('/organiser', { replace: true });
    else if (user.role === 'teacher') navigate('/teacher', { replace: true });
    else navigate('/student', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-campus-dark to-campus-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-8 gap-3">
          <BrandLogo layout="column" size="xl" variant="dark" to="/" />
          <p className="text-slate-600 text-sm sm:text-base">School Event Management System</p>
        </div>
        <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-sm text-slate-700">
          <p className="font-medium text-slate-800 mb-2">Signing in</p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 leading-relaxed">
            <li>
              <span className="font-medium text-slate-700">Students</span> — use the email and password from{' '}
              <Link to="/register" className="text-campus-primary font-medium hover:underline">registration</Link>
              . After sign-in you can browse events and scan QR codes for attendance.
            </li>
            <li>
              <span className="font-medium text-slate-700">Teachers</span> — same email and password as when you registered.
              New teacher accounts need an administrator to approve them in User Management before you can sign in here.
            </li>
          </ul>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {teacherPendingNotice && (
            <div className="px-3 py-2 rounded-lg bg-teal-50 text-teal-900 text-sm border border-teal-200">
              Registration received. Your teacher account is pending approval. An administrator will review it in User Management—you can sign in after it is approved.
            </div>
          )}
          {teacherAccountNotice === 'pending' && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 text-amber-900 text-sm border border-amber-200">
              You cannot use the teacher area until your account is approved. Please wait for an administrator or sign in with an approved account.
            </div>
          )}
          {teacherAccountNotice === 'rejected' && (
            <div className="px-3 py-2 rounded-lg bg-red-50 text-red-800 text-sm border border-red-200">
              Your teacher registration was not approved. Contact administration if you need help.
            </div>
          )}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
              placeholder="you@gmail.com"
            />
          </div>
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            id="login-password"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-campus-primary text-white font-medium rounded-lg hover:bg-campus-secondary transition-colors"
          >
            Sign in
          </button>
        </form>
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Demo seed accounts (login)</p>
          <p className="text-xs text-slate-600 mb-2 leading-relaxed">
            These exist in the database table <code className="text-slate-800">public.users</code> (Table Editor). They are not created in Authentication unless you add them there; sign-in still works using the passwords below.
          </p>
          <ul className="text-sm text-slate-700 space-y-1.5">
            <li><strong>Admin:</strong> admin@gmail.com / admin123</li>
            <li><strong>Organiser:</strong> organiser@gmail.com / organiser123</li>
            <li><strong>Teacher:</strong> teacher@gmail.com / teacher123</li>
            <li><strong>Student:</strong> student@gmail.com / student123</li>
          </ul>
        </div>
        <p className="text-center mt-4 text-sm text-slate-600">
          New student or teacher?{' '}
          <Link to="/register" className="text-campus-primary font-medium hover:underline">Create an account</Link>
        </p>
        <p className="text-center mt-2">
          <Link to="/" className="text-sm text-campus-primary hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
