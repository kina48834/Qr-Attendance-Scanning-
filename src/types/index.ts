export type UserRole = 'administrator' | 'organiser' | 'student' | 'teacher';

export type AcademicTrack = 'junior_high' | 'senior_high' | 'college';

export type TeacherApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface User {
  id: string;
  /** Numeric profile ID shown in the header (e.g. 482913) */
  publicId?: number;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  /** Self-registered students/teachers start as pending until approved by an administrator (Admin User Management) */
  approvalStatus?: TeacherApprovalStatus;
  /** Teacher / staff profile (optional for other roles) */
  phone?: string;
  department?: string;
  /** Junior high / senior high / college — registration & profile */
  academicTrack?: AcademicTrack;
  academicYear?: string;
  academicProgram?: string | null;
  employeeId?: string;
  officeLocation?: string;
  createdAt: string;
  /** Only stored in data layer; never in auth session */
  password?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  organiserId: string;
  organiserName: string;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  /** Event QR payload for pattern recognition; student scan matches this to record attendance (e.g. EVT-evt-1) */
  qrCodeData?: string;
  maxAttendees?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  /** QR check-in (time in) */
  scannedAt: string;
  /** Student-recorded checkout from History; omitted until set */
  timeOutAt?: string | null;
  qrCodeData: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  registeredAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeEvents: number;
  completedEvents: number;
  totalAttendanceRecords: number;
  eventsThisMonth: number;
}

export interface AnalyticsData {
  eventParticipation: { eventId: string; eventTitle: string; attended: number; registered: number }[];
  attendanceTrends: { date: string; count: number }[];
  userActivity: { role: string; count: number }[];
}
