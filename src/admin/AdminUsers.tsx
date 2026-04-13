import { Fragment, useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import type { UserRole, User as AppUser, AcademicTrack } from '@/types';
import type { AddUserPayload } from '@/context/DataContext';
import { AcademicEnrollmentFields } from '@/components/AcademicEnrollmentFields';
import {
  emptyAcademicEnrollment,
  userToAcademicEnrollment,
  validateAcademicEnrollment,
  formatAcademicDepartmentLine,
} from '@/constants/academicEnrollment';
import type { AcademicEnrollmentValue } from '@/constants/academicEnrollment';
import { formatUserAcademicLine } from '@/utils/academicProfileDisplay';
import { buildUserTrackSections } from '@/utils/academicEnrollmentOrdering';
import { User as UserIcon, Mail, Plus, Pencil, Trash2, Building2, Phone, IdCard } from 'lucide-react';
import { PageHeader, RoleBadge } from '@/components/PageHeader';
import { EventListSearchBar } from '@/components/EventListSearchBar';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'organiser', label: 'Organiser' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary';

function roleLabel(role: string) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'organiser') return 'Organiser';
  if (role === 'teacher') return 'Teacher';
  return 'Student';
}

function roleBadgeClass(role: UserRole) {
  if (role === 'administrator') return 'bg-violet-100 text-violet-800 ring-1 ring-violet-200/80';
  if (role === 'organiser') return 'bg-blue-100 text-blue-900 ring-1 ring-blue-200/80';
  if (role === 'teacher') return 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80';
  return 'bg-slate-100 text-slate-800 ring-1 ring-slate-200/80';
}

function approvalBadgeClass(status: string | undefined) {
  const s = status ?? 'approved';
  if (s === 'approved') return 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80';
  if (s === 'pending') return 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80';
  return 'bg-red-100 text-red-900 ring-1 ring-red-200/80';
}

function approvalLabel(status: string | undefined) {
  const s = status ?? 'approved';
  if (s === 'approved') return 'Approved';
  if (s === 'pending') return 'Pending';
  return 'Rejected';
}

function filterUsersBySearch(list: AppUser[], query: string): AppUser[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((u) => {
    if (u.name.toLowerCase().includes(q)) return true;
    if (u.email.toLowerCase().includes(q)) return true;
    if (roleLabel(u.role).toLowerCase().includes(q)) return true;
    if (u.role === 'teacher' || u.role === 'student') {
      const ap = u.approvalStatus ?? 'approved';
      if (approvalLabel(ap).toLowerCase().includes(q)) return true;
      if (ap.toLowerCase().includes(q)) return true;
      if (u.department?.toLowerCase().includes(q)) return true;
    }
    if (u.role === 'teacher') {
      if (u.employeeId?.toLowerCase().includes(q)) return true;
      if (u.phone?.toLowerCase().includes(q)) return true;
    }
    if (u.role === 'student') {
      if (formatUserAcademicLine(u)?.toLowerCase().includes(q)) return true;
    }
    return false;
  });
}

type AdminFormState = AddUserPayload & { id?: string; academic: AcademicEnrollmentValue };

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { users, addUser, updateUser, deleteUser } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState<AdminFormState>({
    email: '',
    name: '',
    role: 'student',
    password: '',
    phone: '',
    department: '',
    employeeId: '',
    officeLocation: '',
    academic: emptyAcademicEnrollment(),
  });

  const visibleUsers = useMemo(
    () => filterUsersBySearch([...users], search),
    [users, search]
  );

  const { studentTrackSections, staffUsers } = useMemo(() => {
    const students = visibleUsers.filter((u) => u.role === 'student');
    const staff = visibleUsers.filter((u) => u.role !== 'student');
    const roleRank = (r: UserRole) =>
      r === 'administrator' ? 0 : r === 'organiser' ? 1 : r === 'teacher' ? 2 : 3;
    staff.sort(
      (a, b) =>
        roleRank(a.role) - roleRank(b.role) ||
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    return {
      studentTrackSections: buildUserTrackSections(students),
      staffUsers: staff,
    };
  }, [visibleUsers]);

  const resetForm = () => {
    setForm({
      email: '',
      name: '',
      role: 'student',
      password: '',
      phone: '',
      department: '',
      employeeId: '',
      officeLocation: '',
      academic: emptyAcademicEnrollment(),
    });
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.password.trim()) {
      setError('Password is required.');
      return;
    }
    if (form.role === 'student' || form.role === 'teacher') {
      const ae = validateAcademicEnrollment(form.academic);
      if (ae) {
        setError(ae);
        return;
      }
    }
    if (form.role === 'teacher') {
      if (!form.phone?.trim() || !form.employeeId?.trim()) {
        setError('Teachers require phone and employee/staff ID.');
        return;
      }
    }
    try {
      addUser({
        email: form.email,
        name: form.name,
        role: form.role,
        password: form.password,
        phone: form.role === 'teacher' ? form.phone : undefined,
        employeeId: form.role === 'teacher' ? form.employeeId : undefined,
        officeLocation: form.role === 'teacher' ? form.officeLocation : undefined,
        ...(form.role === 'student' || form.role === 'teacher'
          ? {
              academicTrack: form.academic.track as AcademicTrack,
              academicYear: form.academic.year,
              academicProgram: form.academic.track === 'college' ? form.academic.program : null,
            }
          : {}),
      });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add user.');
    }
  };

  const handleEdit = (u: (typeof users)[number]) => {
    setEditingId(u.id);
    setForm({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      password: '',
      phone: u.phone ?? '',
      department: u.department ?? '',
      employeeId: u.employeeId ?? '',
      officeLocation: u.officeLocation ?? '',
      academic: userToAcademicEnrollment(u),
    });
    setError('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError('');
    if (form.role === 'student' || form.role === 'teacher') {
      const ae = validateAcademicEnrollment(form.academic);
      if (ae) {
        setError(ae);
        return;
      }
    }
    if (form.role === 'teacher') {
      if (!form.phone?.trim() || !form.employeeId?.trim()) {
        setError('Teachers require phone and employee/staff ID.');
        return;
      }
    }
    const updates: Partial<{
      name: string;
      email: string;
      role: UserRole;
      password: string;
      phone: string;
      department: string;
      academicTrack: AppUser['academicTrack'];
      academicYear: string;
      academicProgram: string | null;
      employeeId: string;
      officeLocation: string;
    }> = {
      name: form.name,
      email: form.email,
      role: form.role,
    };
    if (form.password.trim()) updates.password = form.password;
    if (form.role === 'teacher') {
      updates.phone = (form.phone ?? '').trim();
      updates.employeeId = (form.employeeId ?? '').trim();
      updates.officeLocation = (form.officeLocation ?? '').trim();
      updates.academicTrack = form.academic.track as AcademicTrack;
      updates.academicYear = form.academic.year;
      updates.academicProgram = form.academic.track === 'college' ? form.academic.program : null;
      updates.department = formatAcademicDepartmentLine(
        form.academic.track as AcademicTrack,
        form.academic.year,
        form.academic.track === 'college' ? form.academic.program : null
      );
    } else if (form.role === 'student') {
      updates.phone = '';
      updates.employeeId = '';
      updates.officeLocation = '';
      updates.academicTrack = form.academic.track as AcademicTrack;
      updates.academicYear = form.academic.year;
      updates.academicProgram = form.academic.track === 'college' ? form.academic.program : null;
      updates.department = formatAcademicDepartmentLine(
        form.academic.track as AcademicTrack,
        form.academic.year,
        form.academic.track === 'college' ? form.academic.program : null
      );
    } else {
      updates.phone = '';
      updates.department = '';
      updates.employeeId = '';
      updates.officeLocation = '';
    }
    try {
      updateUser(editingId, updates);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update user.');
    }
  };

  const patchUserApproval = (id: string, approvalStatus: 'approved' | 'rejected') => {
    setError('');
    const r = updateUser(id, { approvalStatus });
    if (r && typeof (r as Promise<void>).then === 'function') {
      (r as Promise<void>).catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not update approval.')
      );
    }
  };

  const handleDelete = (id: string, email: string) => {
    if (id === currentUser?.id) {
      setError('You cannot delete your own account.');
      return;
    }
    if (window.confirm(`Remove user "${email}"? They will no longer be able to sign in.`)) {
      deleteUser(id);
      resetForm();
    }
  };

  const formOpen = showForm || !!editingId;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="User management"
          description={
            <>Add organisers, teachers, admins, or students. Self-registered students and teachers appear as <strong>Pending</strong> until you approve them here.</>
          }
          badge={<RoleBadge>Admin</RoleBadge>}
        />
        {!formOpen && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 px-5 py-2.5 bg-campus-primary text-white rounded-xl font-semibold text-sm hover:bg-campus-secondary shadow-md shadow-blue-500/15 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add user
          </button>
        )}
      </div>

      {error && !formOpen && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {formOpen && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/50">
          <div className="mb-5 flex flex-col gap-1 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit user' : 'Add user'}</h2>
            <p className="text-sm text-slate-500">
              {editingId ? 'Update profile and role. Leave password blank to keep the current one.' : 'Create a new account with a role and password.'}
            </p>
          </div>
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
          <form onSubmit={editingId ? handleUpdate : handleAdd} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className={inputClass}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                disabled={!!editingId}
                className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-600`}
                placeholder="email@example.com"
              />
              {editingId && <p className="mt-1 text-xs text-slate-500">Email cannot be changed.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className={inputClass}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {(form.role === 'student' || form.role === 'teacher') && (
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-sm font-medium text-slate-800">Department</p>
                <AcademicEnrollmentFields
                  idPrefix="admin-user-academic"
                  variant="light"
                  value={form.academic}
                  onChange={(academic) => setForm((f) => ({ ...f, academic }))}
                />
              </div>
            )}
            {form.role === 'teacher' && (
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-sm font-medium text-slate-800">Teacher / staff profile</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className={inputClass}
                    placeholder="Contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee / staff ID</label>
                  <input
                    type="text"
                    value={form.employeeId ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                    className={inputClass}
                    placeholder="Staff ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Office / room (optional)</label>
                  <input
                    type="text"
                    value={form.officeLocation ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, officeLocation: e.target.value }))}
                    className={inputClass}
                    placeholder="Building and room"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password {editingId ? '(leave blank to keep current)' : ''}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required={!editingId}
                className={inputClass}
                placeholder={editingId ? '••••••••' : 'Set password'}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                className="rounded-xl bg-campus-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/15 hover:bg-campus-secondary"
              >
                {editingId ? 'Save changes' : 'Add user'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {users.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <EventListSearchBar
            id="admin-users-search"
            value={search}
            onChange={setSearch}
            size="compact"
            className="sm:max-w-sm"
            placeholder="Search by name, email, role, or teacher details…"
          />
          <p className="text-xs text-slate-500 tabular-nums">
            {visibleUsers.length} of {users.length} user{users.length === 1 ? '' : 's'}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/95">
                <th className="w-[3.25rem] px-2 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  #
                </th>
                <th className="w-[26%] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  User
                </th>
                <th className="w-[13%] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th className="w-[36%] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Profile &amp; staff
                </th>
                <th className="w-[18%] min-w-[8.5rem] px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentTrackSections.map((sec) => {
                const total = sec.subgroups.reduce((acc, g) => acc + g.items.length, 0);
                let numInTrack = 0;
                return (
                  <Fragment key={`stu-${sec.trackId}`}>
                    <tr className="bg-slate-200/90">
                      <td
                        colSpan={5}
                        className="px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-800"
                      >
                        Students — {sec.sectionTitle}
                        <span className="ml-2 font-normal normal-case text-slate-600 text-xs">
                          ({total} user{total === 1 ? '' : 's'} — #1–{total})
                        </span>
                      </td>
                    </tr>
                    {sec.subgroups.map((g) => (
                      <Fragment key={g.subgroupKey}>
                        <tr className="bg-slate-100/90">
                          <td
                            colSpan={5}
                            className="px-4 py-2 pl-8 text-xs font-semibold uppercase tracking-wide text-slate-600"
                          >
                            {g.label}
                            <span className="ml-2 font-normal normal-case text-slate-500">({g.items.length})</span>
                          </td>
                        </tr>
                        {g.items.map((u) => {
                          numInTrack += 1;
                          return (
                            <UserManagementRow
                              key={u.id}
                              u={u}
                              rowNum={numInTrack}
                              currentUserId={currentUser?.id}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              patchUserApproval={patchUserApproval}
                            />
                          );
                        })}
                      </Fragment>
                    ))}
                  </Fragment>
                );
              })}
              {staffUsers.length > 0 && (
                <>
                  <tr className="bg-slate-200/90">
                    <td
                      colSpan={5}
                      className="px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-800"
                    >
                      Staff — administrators, organisers &amp; teachers
                      <span className="ml-2 font-normal normal-case text-slate-600 text-xs">
                        ({staffUsers.length} — #1–{staffUsers.length})
                      </span>
                    </td>
                  </tr>
                  {staffUsers.map((u, idx) => (
                    <UserManagementRow
                      key={u.id}
                      u={u}
                      rowNum={idx + 1}
                      currentUserId={currentUser?.id}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      patchUserApproval={patchUserApproval}
                    />
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="p-14 text-center text-slate-500">
            <p className="font-medium text-slate-700">No users yet</p>
            <p className="mt-1 text-sm">Add users or run the database seed.</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-campus-primary px-4 py-2 text-sm font-semibold text-white hover:bg-campus-secondary"
            >
              Add user
            </button>
          </div>
        )}
        {users.length > 0 && visibleUsers.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-500">No users match your search.</div>
        )}
      </div>
    </div>
  );
}

type UserManagementRowProps = {
  u: AppUser;
  rowNum: number;
  currentUserId: string | undefined;
  onEdit: (u: AppUser) => void;
  onDelete: (id: string, email: string) => void;
  patchUserApproval: (id: string, status: 'approved' | 'rejected') => void;
};

function UserManagementRow({
  u,
  rowNum,
  currentUserId,
  onEdit,
  onDelete,
  patchUserApproval,
}: UserManagementRowProps) {
  return (
                <tr className="transition-colors hover:bg-slate-50/80">
                  <td className="px-2 py-4 align-top tabular-nums text-slate-500 font-medium">{rowNum}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <UserIcon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug text-slate-900">{u.name}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                          <span className="break-all">{u.email}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600">
                    {u.role === 'student' ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${approvalBadgeClass(u.approvalStatus)}`}>
                            {approvalLabel(u.approvalStatus)}
                          </span>
                          {u.approvalStatus === 'pending' && (
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => patchUserApproval(u.id, 'approved')}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => patchUserApproval(u.id, 'rejected')}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {u.approvalStatus === 'rejected' && (
                            <button
                              type="button"
                              onClick={() => patchUserApproval(u.id, 'approved')}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                        {formatUserAcademicLine(u) ? (
                          <p className="flex items-start gap-2 text-xs">
                            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-campus-primary" aria-hidden />
                            <span>{formatUserAcademicLine(u)}</span>
                          </p>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    ) : u.role === 'teacher' ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${approvalBadgeClass(u.approvalStatus)}`}>
                            {approvalLabel(u.approvalStatus)}
                          </span>
                          {u.approvalStatus === 'pending' && (
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => patchUserApproval(u.id, 'approved')}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => patchUserApproval(u.id, 'rejected')}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {u.approvalStatus === 'rejected' && (
                            <button
                              type="button"
                              onClick={() => patchUserApproval(u.id, 'approved')}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                        {(u.department || u.employeeId || u.phone || u.officeLocation) && (
                          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                            {u.department && (
                              <p className="flex items-start gap-2">
                                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-campus-primary" aria-hidden />
                                <span>{u.department}</span>
                              </p>
                            )}
                            {u.employeeId && (
                              <p className="flex items-start gap-2 text-slate-500">
                                <IdCard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-campus-primary" aria-hidden />
                                <span>ID: {u.employeeId}</span>
                              </p>
                            )}
                            {u.phone && (
                              <p className="flex items-start gap-2 text-slate-500">
                                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-campus-primary" aria-hidden />
                                <span>{u.phone}</span>
                              </p>
                            )}
                            {u.officeLocation && <p className="pl-5 text-slate-500">Office: {u.officeLocation}</p>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(u.id, u.email)}
                        disabled={u.id === currentUserId}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
  );
}
