import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, GraduationCap, Info, School, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
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
  landingAuthDetailsShell,
  landingAlertWarn,
  landingAlertError,
} from '@/components/auth/authClasses';
import { authSignOut } from '@/supabase/authFlow';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountRole, setAccountRole] = useState<'student' | 'teacher'>('student');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherDepartment, setTeacherDepartment] = useState('');
  const [teacherEmployeeId, setTeacherEmployeeId] = useState('');
  const [teacherOffice, setTeacherOffice] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const { registerPublic } = useData();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (accountRole === 'teacher') {
      if (!teacherPhone.trim() || !teacherDepartment.trim() || !teacherEmployeeId.trim()) {
        setError('Teachers must provide phone, department, and employee/staff ID.');
        return;
      }
    }
    try {
      const newUser = await registerPublic({
        email: email.trim(),
        name: name.trim(),
        role: accountRole,
        password,
        ...(accountRole === 'teacher' && {
          phone: teacherPhone.trim(),
          department: teacherDepartment.trim(),
          employeeId: teacherEmployeeId.trim(),
          ...(teacherOffice.trim() && { officeLocation: teacherOffice.trim() }),
        }),
      });
      if (newUser.role === 'teacher' && newUser.approvalStatus === 'pending') {
        await authSignOut();
        navigate('/login', {
          replace: true,
          state: { teacherRegisteredPending: true },
        });
        return;
      }
      const { password: _, ...sessionUser } = newUser;
      setUser({ ...sessionUser });
      if (newUser.role === 'teacher') navigate('/teacher', { replace: true });
      else navigate('/student', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    }
  };

  const roleTile =
    'relative flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-2 py-2 text-center text-sm font-semibold transition-all sm:py-2.5';

  return (
    <AuthPageLayout authMode="register" tall>
      <LandingAuthFormCard>
        <p className={landingAuthEyebrowClass}>Andres Soriano Colleges of Bislig</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">Create an account</h1>
        <p className="mt-1 text-xs text-white/65 sm:text-sm">Student or teacher — campus events &amp; QR attendance.</p>

        <details className={`${landingAuthDetailsShell} group mt-3`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.04]">
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-landing-sky" aria-hidden />
              Before you register
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/45 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="border-t border-white/10 px-3 pb-3 pt-2 text-[13px] leading-snug text-white/75">
            Valid email required. Teachers are reviewed before sign-in; students can start immediately.
          </div>
        </details>

        <form onSubmit={handleSubmit} className="relative z-[1] mt-4 space-y-4">
          {error && (
            <div className={landingAlertError}>
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-200" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <div>
            <span className={landingAuthLabelClass}>I am registering as</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <label
                className={`${roleTile} ${
                  accountRole === 'student'
                    ? 'border-landing-sky bg-landing-sky/15 text-white ring-1 ring-landing-sky/40'
                    : 'border-white/15 bg-white/[0.04] text-white/90 hover:border-white/25'
                }`}
              >
                <input
                  type="radio"
                  name="accountRole"
                  value="student"
                  checked={accountRole === 'student'}
                  onChange={() => setAccountRole('student')}
                  className="sr-only"
                />
                <GraduationCap
                  className={`h-4 w-4 shrink-0 ${accountRole === 'student' ? 'text-landing-sky' : 'text-white/45'}`}
                  aria-hidden
                />
                Student
              </label>
              <label
                className={`${roleTile} ${
                  accountRole === 'teacher'
                    ? 'border-landing-sky bg-landing-sky/15 text-white ring-1 ring-landing-sky/40'
                    : 'border-white/15 bg-white/[0.04] text-white/90 hover:border-white/25'
                }`}
              >
                <input
                  type="radio"
                  name="accountRole"
                  value="teacher"
                  checked={accountRole === 'teacher'}
                  onChange={() => setAccountRole('teacher')}
                  className="sr-only"
                />
                <School
                  className={`h-4 w-4 shrink-0 ${accountRole === 'teacher' ? 'text-landing-sky' : 'text-white/45'}`}
                  aria-hidden
                />
                Teacher
              </label>
            </div>
            <p className="mt-1.5 text-[11px] text-white/50">Teachers need admin approval before first sign-in.</p>
            {accountRole === 'teacher' && (
              <div className={`${landingAlertWarn} mt-2`}>
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200" aria-hidden />
                <span>
                  Account stays <strong>pending</strong> until approved in User Management.
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-white/10 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Your details</p>
            <div>
              <label htmlFor="register-name" className={landingAuthLabelClass}>
                Full name
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={landingAuthInputClass}
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="register-email" className={landingAuthLabelClass}>
                Email
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={landingAuthInputClass}
                placeholder="you@gmail.com"
                autoComplete="email"
              />
            </div>
          </div>

          {accountRole === 'teacher' && (
            <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.05] p-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-white">
                <School className="h-3.5 w-3.5 text-landing-sky" aria-hidden />
                Teacher / staff
              </p>
              <div>
                <label htmlFor="register-phone" className={landingAuthLabelClass}>
                  Phone
                </label>
                <input
                  id="register-phone"
                  type="tel"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  required={accountRole === 'teacher'}
                  className={landingAuthInputClass}
                  placeholder="Contact number"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label htmlFor="register-dept" className={landingAuthLabelClass}>
                  Department
                </label>
                <input
                  id="register-dept"
                  type="text"
                  value={teacherDepartment}
                  onChange={(e) => setTeacherDepartment(e.target.value)}
                  required={accountRole === 'teacher'}
                  className={landingAuthInputClass}
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div>
                <label htmlFor="register-empid" className={landingAuthLabelClass}>
                  Employee / staff ID
                </label>
                <input
                  id="register-empid"
                  type="text"
                  value={teacherEmployeeId}
                  onChange={(e) => setTeacherEmployeeId(e.target.value)}
                  required={accountRole === 'teacher'}
                  className={landingAuthInputClass}
                  placeholder="School-issued ID"
                />
              </div>
              <div>
                <label htmlFor="register-office" className={landingAuthLabelClass}>
                  Office / room <span className="font-normal text-white/45">(optional)</span>
                </label>
                <input
                  id="register-office"
                  type="text"
                  value={teacherOffice}
                  onChange={(e) => setTeacherOffice(e.target.value)}
                  className={landingAuthInputClass}
                  placeholder="Building and room"
                />
              </div>
            </div>
          )}

          <div className="space-y-3 border-t border-white/10 pt-3">
            <PasswordField
              theme="landing"
              label="Password"
              value={password}
              onChange={setPassword}
              required
              minLength={6}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              id="register-password"
            />
            <PasswordField
              theme="landing"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              id="register-confirm-password"
            />
          </div>

          <button type="submit" className={landingAuthPrimaryButtonClass}>
            <UserPlus className="h-4 w-4" aria-hidden />
            Create account
          </button>
        </form>

        <div className="relative z-[1] mt-4 space-y-2 text-center text-xs text-white/65 sm:text-sm">
          <p>
            Already have an account?{' '}
            <Link to="/login" className={landingAuthLinkClass}>
              Sign in
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
