import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { BrandLogo } from '@/components/BrandLogo';
import { PasswordField } from '@/components/PasswordField';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-campus-dark to-campus-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-8 gap-3">
          <BrandLogo layout="column" size="xl" variant="dark" to="/" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create an account</h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Register as a student or teacher to use the campus event system.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">I am registering as</span>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  accountRole === 'student'
                    ? 'border-campus-primary bg-teal-50 text-campus-primary'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
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
                Student
              </label>
              <label
                className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  accountRole === 'teacher'
                    ? 'border-campus-primary bg-teal-50 text-campus-primary'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
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
                Teacher
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Students browse events and scan QR for attendance. Teachers manage events and analytics for their classes.
            </p>
            {accountRole === 'teacher' && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 mt-2">
                Teacher accounts require administrator approval. You will not be able to sign in until your account is approved in User Management.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
              placeholder="Your name"
            />
          </div>
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
          {accountRole === 'teacher' && (
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-800">Teacher / staff details</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  required={accountRole === 'teacher'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
                  placeholder="Contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={teacherDepartment}
                  onChange={(e) => setTeacherDepartment(e.target.value)}
                  required={accountRole === 'teacher'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee / staff ID</label>
                <input
                  type="text"
                  value={teacherEmployeeId}
                  onChange={(e) => setTeacherEmployeeId(e.target.value)}
                  required={accountRole === 'teacher'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
                  placeholder="School-issued ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Office / room (optional)</label>
                <input
                  type="text"
                  value={teacherOffice}
                  onChange={(e) => setTeacherOffice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
                  placeholder="Building and room"
                />
              </div>
            </div>
          )}
          <PasswordField
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
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            placeholder="••••••••"
            autoComplete="new-password"
            id="register-confirm-password"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-campus-primary text-white font-medium rounded-lg hover:bg-campus-secondary transition-colors"
          >
            Register
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-campus-primary font-medium hover:underline">Sign in</Link>
        </p>
        <p className="text-center mt-2">
          <Link to="/" className="text-sm text-campus-primary hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
