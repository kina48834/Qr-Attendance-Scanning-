import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type {
  Event,
  AttendanceRecord,
  User,
  UserRole,
  AcademicTrack,
  EventRegistration,
  DashboardStats,
  AnalyticsData,
} from '@/types';
import {
  ensureSupabaseReady,
  fetchAttendance,
  fetchEvents,
  fetchRegistrations,
  fetchUsers,
  insertAttendance,
  insertEvent,
  insertRegistration,
  insertUser,
  patchEvent,
  patchUser,
  removeEvent,
  removeUser,
} from '@/supabase/dataService';
import { authSignUp, authSignOut, normalizeAuthEmail, SUPABASE_AUTH_PASSWORD_MARKER } from '@/supabase/authFlow';

export interface AddUserPayload {
  email: string;
  name: string;
  role: UserRole;
  password: string;
  phone?: string;
  department?: string;
  academicTrack?: AcademicTrack;
  academicYear?: string;
  academicProgram?: string | null;
  employeeId?: string;
  officeLocation?: string;
}

export type PublicRegisterPayload = {
  email: string;
  name: string;
  password: string;
  role: 'student' | 'teacher';
  academicTrack: AcademicTrack;
  academicYear: string;
  academicProgram?: string | null;
  phone?: string;
  employeeId?: string;
  officeLocation?: string;
};

interface DataContextType {
  events: Event[];
  attendance: AttendanceRecord[];
  users: User[];
  registrations: EventRegistration[];
  loading?: boolean;
  error?: string;
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => void | Promise<void>;
  deleteEvent: (id: string) => void | Promise<void>;
  addUser: (payload: AddUserPayload) => User | Promise<User>;
  /** Sign-up page only: student or teacher. */
  registerPublic: (payload: PublicRegisterPayload) => User | Promise<User>;
  updateUser: (
    id: string,
    updates: Partial<
      Pick<
        User,
        | 'name'
        | 'email'
        | 'role'
        | 'password'
        | 'phone'
        | 'department'
        | 'academicTrack'
        | 'academicYear'
        | 'academicProgram'
        | 'employeeId'
        | 'officeLocation'
        | 'approvalStatus'
      >
    >
  ) => void | Promise<void>;
  deleteUser: (id: string) => void | Promise<void>;
  recordAttendance: (record: Omit<AttendanceRecord, 'id' | 'scannedAt'>) => void | Promise<void>;
  registerForEvent: (eventId: string, userId: string) => void | Promise<void>;
  getStats: () => DashboardStats;
  getAnalytics: () => AnalyticsData;
  getEventAttendance: (eventId: string) => AttendanceRecord[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSupabaseReady();
        const [u, e, a, r] = await Promise.all([
          fetchUsers(),
          fetchEvents(),
          fetchAttendance(),
          fetchRegistrations(),
        ]);
        if (cancelled) return;
        setUsers(u);
        setEvents(e);
        setAttendance(a);
        setRegistrations(r);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load Supabase data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addEvent = useCallback(
    async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await insertEvent(event);
      setEvents((prev) => [...prev, created]);
    },
    []
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<Event>) => {
      const updated = await patchEvent(id, updates);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    },
    []
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      await removeEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setAttendance((prev) => prev.filter((a) => a.eventId !== id));
      setRegistrations((prev) => prev.filter((r) => r.eventId !== id));
    },
    []
  );

  const addUser = useCallback(
    async (payload: AddUserPayload): Promise<User> => {
      if (users.some((u) => u.email.toLowerCase() === normalizeAuthEmail(payload.email))) {
        throw new Error('A user with this email already exists.');
      }
      const newUser = await insertUser({
        ...payload,
        email: normalizeAuthEmail(payload.email),
        ...(payload.role === 'teacher' && { approvalStatus: 'approved' as const }),
      });
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    },
    [users]
  );

  const registerPublic = useCallback(
    async (payload: PublicRegisterPayload): Promise<User> => {
      if (payload.role !== 'student' && payload.role !== 'teacher') {
        throw new Error('Invalid registration role.');
      }
      const emailNorm = normalizeAuthEmail(payload.email);
      if (users.some((u) => u.email.toLowerCase() === emailNorm)) {
        throw new Error('A user with this email already exists.');
      }
      const passwordTrimmed = payload.password.trim();
      const { data: authData, error: authError } = await authSignUp(emailNorm, passwordTrimmed, {
        name: payload.name.trim(),
        role: payload.role,
        academic_track: payload.academicTrack,
        academic_year: payload.academicYear,
        academic_program: payload.academicProgram ?? '',
        ...(payload.role === 'teacher' && {
          phone: payload.phone?.trim() ?? '',
          employee_id: payload.employeeId?.trim() ?? '',
          office_location: payload.officeLocation?.trim() ?? '',
        }),
      });
      if (authError) throw new Error(authError.message);
      const uid = authData.user?.id;
      if (!uid) {
        throw new Error(
          'Supabase did not return a new user id. In Dashboard → Authentication → Providers → Email: turn off "Confirm email" for local testing, or confirm your inbox and then sign in. Also ensure this email is not already registered under Authentication → Users.'
        );
      }
      let newUser: User;
      try {
        newUser = await insertUser(
          {
            email: emailNorm,
            name: payload.name.trim(),
            role: payload.role,
            password: SUPABASE_AUTH_PASSWORD_MARKER,
            academicTrack: payload.academicTrack,
            academicYear: payload.academicYear,
            academicProgram: payload.academicProgram ?? null,
            ...(payload.role === 'teacher'
              ? {
                  phone: payload.phone,
                  employeeId: payload.employeeId,
                  officeLocation: payload.officeLocation,
                  approvalStatus: 'pending' as const,
                }
              : {}),
          },
          { id: uid }
        );
      } catch (e) {
        await authSignOut();
        throw e;
      }
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    },
    [users]
  );

  const updateUser = useCallback(
    (
      id: string,
      updates: Partial<
        Pick<
          User,
          | 'name'
          | 'email'
          | 'role'
          | 'password'
          | 'phone'
          | 'department'
          | 'employeeId'
          | 'officeLocation'
          | 'approvalStatus'
        >
      >
    ) => {
      return patchUser(id, updates).then((updated) => {
        setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      });
    },
    []
  );

  const deleteUser = useCallback(
    async (id: string) => {
      await removeUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    },
    []
  );

  const recordAttendance = useCallback(
    async (record: Omit<AttendanceRecord, 'id' | 'scannedAt'>) => {
      const created = await insertAttendance(record);
      setAttendance((prev) => [...prev, created]);
    },
    []
  );

  const registerForEvent = useCallback(
    async (eventId: string, userId: string) => {
      if (registrations.some((r) => r.eventId === eventId && r.userId === userId)) return;
      const created = await insertRegistration(eventId, userId);
      if (created) setRegistrations((prev) => [...prev, created]);
    },
    [registrations]
  );

  const getEventAttendance = useCallback(
    (eventId: string) => attendance.filter((a) => a.eventId === eventId),
    [attendance]
  );

  const getStats = useCallback((): DashboardStats => {
    const now = new Date();
    const thisMonth = events.filter((e) => {
      const d = new Date(e.startDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return {
      totalUsers: users.length,
      activeEvents: events.filter((e) => e.status === 'published').length,
      completedEvents: events.filter((e) => e.status === 'completed').length,
      totalAttendanceRecords: attendance.length,
      eventsThisMonth: thisMonth,
    };
  }, [events, users.length, attendance.length]);

  const getAnalytics = useCallback((): AnalyticsData => {
    const eventParticipation = events.map((e) => {
      const attended = attendance.filter((a) => a.eventId === e.id).length;
      const registered = registrations.filter((r) => r.eventId === e.id).length;
      return { eventId: e.id, eventTitle: e.title, attended, registered };
    });
    const byDate: Record<string, number> = {};
    attendance.forEach((a) => {
      const d = a.scannedAt.slice(0, 10);
      byDate[d] = (byDate[d] ?? 0) + 1;
    });
    const attendanceTrends = Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const userActivity = [
      { role: 'Administrator', count: users.filter((u) => u.role === 'administrator').length },
      { role: 'Organiser', count: users.filter((u) => u.role === 'organiser').length },
      { role: 'Teacher', count: users.filter((u) => u.role === 'teacher').length },
      { role: 'Student', count: users.filter((u) => u.role === 'student').length },
    ];
    return { eventParticipation, attendanceTrends, userActivity };
  }, [events, attendance, registrations, users]);

  return (
    <DataContext.Provider
      value={{
        events,
        attendance,
        users,
        registrations,
        ...(loading !== undefined && { loading }),
        ...(error !== undefined && { error }),
        addEvent,
        updateEvent,
        deleteEvent,
        addUser,
        registerPublic,
        updateUser,
        deleteUser,
        recordAttendance,
        registerForEvent,
        getStats,
        getAnalytics,
        getEventAttendance,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (ctx === undefined) throw new Error('useData must be used within DataProvider');
  return ctx;
}
