import type { AttendanceRecord, Event, EventRegistration, User } from '@/types';
import { getEventQrCodeData } from '@/utils/attendanceQR';
import { supabase } from '@/supabase/client';
import { formatAcademicDepartmentLine, validateAcademicEnrollment } from '@/constants/academicEnrollment';
import type { AcademicEnrollmentValue } from '@/constants/academicEnrollment';

type UserRow = {
  id: string;
  public_id: number | null;
  email: string;
  name: string;
  role: User['role'];
  avatar: string | null;
  approval_status: User['approvalStatus'] | null;
  phone: string | null;
  department: string | null;
  academic_track: string | null;
  academic_year: string | null;
  academic_program: string | null;
  employee_id: string | null;
  office_location: string | null;
  created_at: string;
  password: string | null;
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  start_date: string;
  end_date: string;
  organiser_id: string;
  organiser_name: string;
  status: Event['status'];
  qr_code_data: string | null;
  max_attendees: number | null;
  created_at: string;
  updated_at: string;
};

type AttendanceRow = {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  scanned_at: string;
  qr_code_data: string;
};

type RegistrationRow = {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    ...(row.public_id != null ? { publicId: row.public_id } : {}),
    email: row.email,
    name: row.name,
    role: row.role,
    ...(row.avatar ? { avatar: row.avatar } : {}),
    ...(row.approval_status ? { approvalStatus: row.approval_status } : {}),
    ...(row.phone ? { phone: row.phone } : {}),
    ...(row.department ? { department: row.department } : {}),
    ...(row.academic_track ? { academicTrack: row.academic_track as User['academicTrack'] } : {}),
    ...(row.academic_year ? { academicYear: row.academic_year } : {}),
    ...(row.academic_program ? { academicProgram: row.academic_program } : {}),
    ...(row.employee_id ? { employeeId: row.employee_id } : {}),
    ...(row.office_location ? { officeLocation: row.office_location } : {}),
    createdAt: row.created_at,
    ...(row.password ? { password: row.password } : {}),
  };
}

function departmentFromAcademicOrLegacy(
  academic: Pick<AcademicEnrollmentValue, 'track' | 'year' | 'program'> | undefined,
  legacyDepartment: string | undefined
): { department: string | null; track: string | null; year: string | null; program: string | null } {
  if (academic?.track && academic.year) {
    const err = validateAcademicEnrollment({
      track: academic.track,
      year: academic.year,
      program: academic.program ?? '',
    });
    if (err) {
      return {
        department: legacyDepartment?.trim() || null,
        track: null,
        year: null,
        program: null,
      };
    }
    const line = formatAcademicDepartmentLine(academic.track, academic.year, academic.program || null);
    return {
      department: line,
      track: academic.track,
      year: academic.year,
      program: academic.track === 'college' ? (academic.program || '').trim() || null : null,
    };
  }
  return {
    department: legacyDepartment?.trim() || null,
    track: null,
    year: null,
    program: null,
  };
}

function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    organiserId: row.organiser_id,
    organiserName: row.organiser_name,
    status: row.status,
    ...(row.qr_code_data ? { qrCodeData: row.qr_code_data } : {}),
    ...(row.max_attendees != null ? { maxAttendees: row.max_attendees } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAttendance(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    scannedAt: row.scanned_at,
    qrCodeData: row.qr_code_data,
  };
}

function toRegistration(row: RegistrationRow): EventRegistration {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    registeredAt: row.registered_at,
  };
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Verifies Supabase connectivity and that expected tables are reachable. Demo data lives only in Postgres — run `supabase/sql/06_seed.sql` (or `00_all_in_one.sql`) in the SQL Editor. */
export async function ensureSupabaseReady(): Promise<void> {
  const { error: usersErr } = await supabase.from('users').select('id').limit(1);
  if (usersErr) throw usersErr;
  const { error: eventsErr } = await supabase.from('events').select('id').limit(1);
  if (eventsErr) throw eventsErr;
  const { error: attErr } = await supabase.from('attendance').select('id').limit(1);
  if (attErr) throw attErr;
  const { error: regErr } = await supabase.from('event_registrations').select('id').limit(1);
  if (regErr) throw regErr;
}

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data as UserRow[]).map(toUser);
}

export async function fetchEvents(): Promise<Event[]> {
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data as EventRow[]).map(toEvent);
}

/** Published events that have not ended yet, for the public landing page (anon Supabase client). */
export async function fetchPublicUpcomingEvents(limit = 8): Promise<Event[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('end_date', now)
    .order('start_date', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data as EventRow[]).map(toEvent);
}

export async function fetchAttendance(): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase.from('attendance').select('*').order('scanned_at', { ascending: true });
  if (error) throw error;
  return (data as AttendanceRow[]).map(toAttendance);
}

export async function fetchRegistrations(): Promise<EventRegistration[]> {
  const { data, error } = await supabase.from('event_registrations').select('*').order('registered_at', { ascending: true });
  if (error) throw error;
  return (data as RegistrationRow[]).map(toRegistration);
}

export async function fetchUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toUser(data as UserRow);
}

/** Escape %, _, \\ for PostgREST ilike (case-insensitive email match). */
function escapeIlikeExact(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** Legacy table-password login: load profile by email (indexed eq first, then ilike for mixed-case rows). */
export async function fetchUserByEmailForLegacyLogin(emailInput: string): Promise<User | null> {
  const trimmed = emailInput.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  const { data: byLower, error: errLower } = await supabase
    .from('users')
    .select('*')
    .eq('email', lower)
    .maybeSingle();
  if (errLower) throw errLower;
  if (byLower) return toUser(byLower as UserRow);

  if (trimmed !== lower) {
    const { data: byExact, error: errExact } = await supabase
      .from('users')
      .select('*')
      .eq('email', trimmed)
      .maybeSingle();
    if (errExact) throw errExact;
    if (byExact) return toUser(byExact as UserRow);
  }

  const { data: byIlike, error: errIlike } = await supabase
    .from('users')
    .select('*')
    .ilike('email', escapeIlikeExact(trimmed))
    .maybeSingle();
  if (errIlike) throw errIlike;
  if (byIlike) return toUser(byIlike as UserRow);
  return null;
}

export async function insertUser(
  payload: {
    email: string;
    name: string;
    role: User['role'];
    password: string;
    phone?: string;
    department?: string;
    academicTrack?: User['academicTrack'];
    academicYear?: string;
    academicProgram?: string | null;
    employeeId?: string;
    officeLocation?: string;
    approvalStatus?: User['approvalStatus'];
  },
  options?: { id?: string }
): Promise<User> {
  const academic =
    payload.academicTrack && payload.academicYear
      ? {
          track: payload.academicTrack,
          year: payload.academicYear,
          program: payload.academicProgram ?? '',
        }
      : undefined;
  const derived = departmentFromAcademicOrLegacy(academic, payload.department);
  const row = {
    id: options?.id ?? makeId('user'),
    email: payload.email.trim().toLowerCase(),
    name: payload.name.trim(),
    role: payload.role,
    password: payload.password,
    approval_status: payload.approvalStatus ?? null,
    phone: payload.phone?.trim() || null,
    department: derived.department,
    academic_track: derived.track,
    academic_year: derived.year,
    academic_program: derived.program,
    employee_id: payload.employeeId?.trim() || null,
    office_location: payload.officeLocation?.trim() || null,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('users').insert(row).select('*').single();
  if (error) throw error;
  return toUser(data as UserRow);
}

export async function patchUser(id: string, updates: Partial<User>): Promise<User> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.password !== undefined) payload.password = updates.password;
  if (updates.phone !== undefined) payload.phone = updates.phone || null;
  if (updates.department !== undefined) payload.department = updates.department || null;
  if (updates.academicTrack !== undefined) payload.academic_track = updates.academicTrack || null;
  if (updates.academicYear !== undefined) payload.academic_year = updates.academicYear || null;
  if (updates.academicProgram !== undefined) payload.academic_program = updates.academicProgram ?? null;
  if (updates.employeeId !== undefined) payload.employee_id = updates.employeeId || null;
  if (updates.officeLocation !== undefined) payload.office_location = updates.officeLocation || null;
  if (updates.approvalStatus !== undefined) payload.approval_status = updates.approvalStatus || null;
  if (updates.avatar !== undefined) payload.avatar = updates.avatar || null;

  const { data, error } = await supabase.from('users').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return toUser(data as UserRow);
}

export async function removeUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

export async function insertEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
  const id = makeId('evt');
  const now = new Date().toISOString();
  const row = {
    id,
    title: event.title,
    description: event.description,
    location: event.location,
    start_date: event.startDate,
    end_date: event.endDate,
    organiser_id: event.organiserId,
    organiser_name: event.organiserName,
    status: event.status,
    qr_code_data: getEventQrCodeData(id, event.qrCodeData),
    max_attendees: event.maxAttendees ?? null,
    created_at: now,
    updated_at: now,
  };
  const { data, error } = await supabase.from('events').insert(row).select('*').single();
  if (error) throw error;
  return toEvent(data as EventRow);
}

export async function patchEvent(id: string, updates: Partial<Event>): Promise<Event> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.endDate !== undefined) payload.end_date = updates.endDate;
  if (updates.organiserId !== undefined) payload.organiser_id = updates.organiserId;
  if (updates.organiserName !== undefined) payload.organiser_name = updates.organiserName;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.qrCodeData !== undefined) payload.qr_code_data = updates.qrCodeData;
  if (updates.maxAttendees !== undefined) payload.max_attendees = updates.maxAttendees ?? null;
  const { data, error } = await supabase.from('events').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return toEvent(data as EventRow);
}

export async function removeEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function insertAttendance(record: Omit<AttendanceRecord, 'id' | 'scannedAt'>): Promise<AttendanceRecord> {
  const row = {
    id: makeId('att'),
    event_id: record.eventId,
    user_id: record.userId,
    user_name: record.userName,
    user_email: record.userEmail,
    qr_code_data: record.qrCodeData,
    scanned_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('attendance').insert(row).select('*').single();
  if (error) throw error;
  return toAttendance(data as AttendanceRow);
}

export async function insertRegistration(eventId: string, userId: string): Promise<EventRegistration | null> {
  const row = {
    id: makeId('reg'),
    event_id: eventId,
    user_id: userId,
    registered_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('event_registrations')
    .upsert(row, { onConflict: 'event_id,user_id', ignoreDuplicates: true })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toRegistration(data as RegistrationRow);
}
