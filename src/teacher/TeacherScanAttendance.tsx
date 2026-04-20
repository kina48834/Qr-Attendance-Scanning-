import { ScanStudentAttendancePage } from '@/components/ScanStudentAttendancePage';

export function TeacherScanAttendance() {
  return (
    <ScanStudentAttendancePage
      backPath="/teacher/events"
      scanBasePath="/teacher/scan-attendance"
      backLabel="Events"
    />
  );
}
