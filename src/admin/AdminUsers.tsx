import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import type { AddUserPayload } from '@/context/DataContext';
import { User, Mail, Plus, Pencil, Trash2 } from 'lucide-react';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'organiser', label: 'Organiser' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

function roleLabel(role: string) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'organiser') return 'Organiser';
  if (role === 'teacher') return 'Teacher';
  return 'Student';
}

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { users, addUser, updateUser, deleteUser } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState<AddUserPayload & { id?: string }>({
    email: '',
    name: '',
    role: 'student',
    password: '',
    phone: '',
    department: '',
    employeeId: '',
    officeLocation: '',
  });

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
    if (form.role === 'teacher') {
      if (!form.phone?.trim() || !form.department?.trim() || !form.employeeId?.trim()) {
        setError('Teachers require phone, department, and employee/staff ID.');
        return;
      }
    }
    try {
      addUser({
        email: form.email,
        name: form.name,
        role: form.role,
        password: form.password,
        phone: form.phone,
        department: form.department,
        employeeId: form.employeeId,
        officeLocation: form.officeLocation,
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
    });
    setError('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError('');
    if (form.role === 'teacher') {
      if (!form.phone?.trim() || !form.department?.trim() || !form.employeeId?.trim()) {
        setError('Teachers require phone, department, and employee/staff ID.');
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
      updates.department = (form.department ?? '').trim();
      updates.employeeId = (form.employeeId ?? '').trim();
      updates.officeLocation = (form.officeLocation ?? '').trim();
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

  const patchTeacherApproval = (id: string, approvalStatus: 'approved' | 'rejected') => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">
            Add organisers, teachers, admins, or students. Self-registered teachers appear as <strong>Pending</strong> until you approve them here.
          </p>
        </div>
        {!showForm && !editingId && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-campus-primary text-white rounded-lg font-medium hover:bg-campus-secondary"
          >
            <Plus className="w-4 h-4" />
            Add user
          </button>
        )}
      </div>

      {(showForm || editingId) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">{editingId ? 'Edit user' : 'Add user'}</h2>
          {error && <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
          <form onSubmit={editingId ? handleUpdate : handleAdd} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary disabled:bg-slate-100"
                placeholder="email@example.com"
              />
              {editingId && <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {form.role === 'teacher' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-800">Teacher / staff profile</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
                    placeholder="Contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
                    placeholder="Department"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee / staff ID</label>
                  <input
                    type="text"
                    value={form.employeeId ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
                    placeholder="Staff ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Office / room (optional)</label>
                  <input
                    type="text"
                    value={form.officeLocation ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, officeLocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
                placeholder={editingId ? '••••••••' : 'Set password'}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-campus-primary text-white rounded-lg font-medium hover:bg-campus-secondary">
                {editingId ? 'Save changes' : 'Add user'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium min-w-[10rem]">Staff details</th>
                <th className="px-5 py-3 font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{u.name}</span>
                  </td>
                  <td className="px-5 py-3 flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {u.email}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'administrator'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'organiser'
                            ? 'bg-campus-primary/20 text-campus-dark'
                            : u.role === 'teacher'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm align-top">
                    {u.role === 'teacher' ? (
                      <div className="space-y-2">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            (u.approvalStatus ?? 'approved') === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : u.approvalStatus === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {(u.approvalStatus ?? 'approved') === 'approved'
                            ? 'Approved'
                            : u.approvalStatus === 'pending'
                              ? 'Pending'
                              : 'Rejected'}
                        </span>
                        {u.approvalStatus === 'pending' && (
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => patchTeacherApproval(u.id, 'approved')}
                              className="text-xs px-2 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => patchTeacherApproval(u.id, 'rejected')}
                              className="text-xs px-2 py-1 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {u.approvalStatus === 'rejected' && (
                          <div>
                            <button
                              type="button"
                              onClick={() => patchTeacherApproval(u.id, 'approved')}
                              className="text-xs px-2 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {u.role === 'teacher' && (u.department || u.employeeId || u.phone) ? (
                      <div className="space-y-0.5">
                        {u.department && <div>{u.department}</div>}
                        {u.employeeId && <div className="text-xs text-slate-500">ID: {u.employeeId}</div>}
                        {u.phone && <div className="text-xs text-slate-500">{u.phone}</div>}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(u)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id, u.email)}
                        disabled={u.id === currentUser?.id}
                        className="p-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 disabled:opacity-50 disabled:pointer-events-none"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
