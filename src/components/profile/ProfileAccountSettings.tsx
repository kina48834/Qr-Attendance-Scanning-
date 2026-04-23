import { useEffect, useMemo, useState } from 'react';
import { Camera, Lock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { PasswordField } from '@/components/PasswordField';
import { supabase } from '@/supabase/client';
import { SUPABASE_AUTH_PASSWORD_MARKER } from '@/supabase/authFlow';
import { isSupabaseAuthUserId } from '@/utils/supabaseAuthIds';

type Props = {
  roleLabel: string;
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function ProfileAccountSettings({ roleLabel }: Props) {
  const { user, setUser } = useAuth();
  const { updateUser } = useData();
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(user?.avatar ?? null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setDisplayName(user?.name ?? '');
    setAvatarDataUrl(user?.avatar ?? null);
  }, [user?.name, user?.avatar]);

  const canSaveProfile = useMemo(() => {
    if (!user) return false;
    return displayName.trim() !== user.name || (avatarDataUrl ?? '') !== (user.avatar ?? '');
  }, [displayName, avatarDataUrl, user]);

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  const handleAvatarFile = (file: File | undefined) => {
    if (!file) return;
    clearAlerts();
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is too large. Use a file up to 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        setError('Could not read that image file.');
        return;
      }
      setAvatarDataUrl(result);
    };
    reader.onerror = () => setError('Could not read that image file.');
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!user) return;
    clearAlerts();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateUser(user.id, {
        name: trimmedName,
        avatar: avatarDataUrl || '',
      });
      setUser({
        ...user,
        name: trimmedName,
        ...(avatarDataUrl ? { avatar: avatarDataUrl } : { avatar: undefined }),
      });
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!user) return;
    clearAlerts();
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      if (isSupabaseAuthUserId(user.id)) {
        const { error: authErr } = await supabase.auth.updateUser({ password: newPassword });
        if (authErr) throw authErr;
        await updateUser(user.id, { password: SUPABASE_AUTH_PASSWORD_MARKER });
      } else {
        await updateUser(user.id, { password: newPassword });
      }
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Profile photo and account</h2>
        <div className="grid gap-5 sm:grid-cols-[auto,1fr] sm:items-start">
          <div className="mx-auto sm:mx-0">
            <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt={`${displayName || roleLabel} profile`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <User className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-campus-primary focus:ring-2 focus:ring-campus-primary"
                placeholder="Your full name"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Camera className="h-4 w-4" />
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                />
              </label>
              {avatarDataUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarDataUrl(null)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Remove image
                </button>
              )}
              <span className="text-xs text-slate-500">JPG/PNG/WebP up to 2MB.</span>
            </div>
            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={!canSaveProfile || savingProfile}
              className="rounded-lg bg-campus-primary px-4 py-2 text-sm font-semibold text-white hover:bg-campus-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
          <Lock className="h-4 w-4 text-campus-primary" />
          Change password
        </h2>
        <div className="space-y-3">
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            id="profile-new-password"
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            placeholder="Re-enter password"
            id="profile-confirm-password"
          />
          <button
            type="button"
            onClick={() => void savePassword()}
            disabled={savingPassword || !newPassword || !confirmPassword}
            className="rounded-lg bg-campus-primary px-4 py-2 text-sm font-semibold text-white hover:bg-campus-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingPassword ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </div>
    </div>
  );
}
