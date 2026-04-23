import { Mail, Shield, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ProfileAccountSettings } from '@/components/profile/ProfileAccountSettings';

export function AdminProfile() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-slate-600">Manage your administrator account details and password.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Account info</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-slate-400" />
            <span className="text-slate-900">{user?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-slate-400" />
            <span className="text-slate-600">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-slate-400" />
            <span className="text-slate-600">Administrator</span>
          </div>
        </div>
      </div>

      <ProfileAccountSettings roleLabel="Administrator" />
    </div>
  );
}
