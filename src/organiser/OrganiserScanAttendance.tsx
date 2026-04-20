import { ScanStudentAttendancePage } from '@/components/ScanStudentAttendancePage';

export function OrganiserScanAttendance() {
  return (
    <ScanStudentAttendancePage
      backPath="/organiser/attendance"
      scanBasePath="/organiser/scan-attendance"
      backLabel="Attendance"
    />
  );
}
