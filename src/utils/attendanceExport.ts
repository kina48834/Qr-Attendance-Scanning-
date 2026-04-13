import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ATTENDANCE_EXPORT_FILE_TAG,
  ATTENDANCE_EXPORT_SCOPE_LINE,
  type AttendanceExportTrackScope,
} from '@/utils/academicEnrollmentOrdering';

function safeFileSegment(text: string): string {
  return text.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_').slice(0, 72) || 'attendance';
}

function formatScanned(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy HH:mm');
  } catch {
    return iso;
  }
}

function formatTimeOut(iso: string | null | undefined): string {
  if (iso == null || iso === '') return '—';
  try {
    return format(new Date(iso), 'MMM d, yyyy HH:mm');
  } catch {
    return '—';
  }
}

export type EventAttendanceExportMeta = {
  title: string;
  location?: string;
  startDate?: string;
  organiserName?: string;
  /** When set, export is limited to one track (junior / senior / college); shown in file header and filename */
  segmentScope?: AttendanceExportTrackScope;
};

export type { AttendanceExportTrackScope };

export type AttendanceExportRecord = {
  /** Display name from profile when available (exports omit email). */
  userName: string;
  scannedAt: string;
  timeOutAt?: string | null;
  /** Department / enrollment line from registration (`users.department` + academic_*); includes year level in the text. */
  department?: string;
  /** When set (roster exports), # column restarts at 1 per junior / senior / college block */
  rosterIndexInLevel?: number;
};

/** Sorted by scan time for consistent exports */
export function sortAttendanceByScanned(records: AttendanceExportRecord[]): AttendanceExportRecord[] {
  return [...records].sort((a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime());
}

export function exportSingleEventAttendancePdf(meta: EventAttendanceExportMeta, records: AttendanceExportRecord[]) {
  const rows = records.some((r) => r.rosterIndexInLevel != null)
    ? [...records]
    : sortAttendanceByScanned(records);
  const doc = new jsPDF();
  const margin = 14;
  let y = 16;
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  doc.text('Campus Connect — attendance roster', margin, y);
  y += 9;
  doc.setFontSize(11);
  doc.text(meta.title, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const lines: string[] = [];
  if (meta.location) lines.push(`Location: ${meta.location}`);
  if (meta.startDate) {
    try {
      lines.push(`Date: ${format(new Date(meta.startDate), 'MMM d, yyyy HH:mm')}`);
    } catch {
      lines.push(`Date: ${meta.startDate}`);
    }
  }
  if (meta.organiserName) lines.push(`Organiser: ${meta.organiserName}`);
  if (meta.segmentScope) lines.push(`Scope: ${ATTENDANCE_EXPORT_SCOPE_LINE[meta.segmentScope]}`);
  lines.push(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`);
  lines.push(`Total: ${rows.length} student${rows.length === 1 ? '' : 's'}`);
  lines.forEach((line) => {
    doc.text(line, margin, y);
    y += 5;
  });

  autoTable(doc, {
    startY: y + 4,
    head: [['#', 'Name', 'Department', 'Time in', 'Time out']],
    body: rows.map((r, i) => [
      String(r.rosterIndexInLevel ?? i + 1),
      r.userName,
      r.department ?? '—',
      formatScanned(r.scannedAt),
      formatTimeOut(r.timeOutAt),
    ]),
    styles: { fontSize: 7.5, cellPadding: 2, halign: 'left', valign: 'middle' },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 42 },
      2: { cellWidth: 62 },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 28 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
    showHead: 'everyPage',
  });

  const scopeTag = meta.segmentScope ? `_${ATTENDANCE_EXPORT_FILE_TAG[meta.segmentScope]}` : '';
  doc.save(`attendance_${safeFileSegment(meta.title)}${scopeTag}.pdf`);
}

export function exportSingleEventAttendanceXlsx(meta: EventAttendanceExportMeta, records: AttendanceExportRecord[]) {
  const rows = records.some((r) => r.rosterIndexInLevel != null)
    ? [...records]
    : sortAttendanceByScanned(records);
  const header = [['Campus Connect — attendance roster'], [], ['Event', meta.title]];
  const metaRows: (string | number)[][] = [];
  if (meta.location) metaRows.push(['Location', meta.location]);
  if (meta.startDate) {
    try {
      metaRows.push(['Date', format(new Date(meta.startDate), 'MMM d, yyyy HH:mm')]);
    } catch {
      metaRows.push(['Date', meta.startDate]);
    }
  }
  if (meta.organiserName) metaRows.push(['Organiser', meta.organiserName]);
  if (meta.segmentScope) metaRows.push(['Scope', ATTENDANCE_EXPORT_SCOPE_LINE[meta.segmentScope]]);
  metaRows.push(['Generated', format(new Date(), 'MMM d, yyyy HH:mm')]);
  metaRows.push(['Total students', rows.length]);
  metaRows.push([]);
  const tableHead: (string | number)[][] = [['#', 'Name', 'Department', 'Time in', 'Time out']];
  const tableBody = rows.map((r, i) => [
    r.rosterIndexInLevel ?? i + 1,
    r.userName,
    r.department ?? '—',
    formatScanned(r.scannedAt),
    formatTimeOut(r.timeOutAt),
  ]);
  const aoa = [...header, ...metaRows, ...tableHead, ...tableBody];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  const sheetName = safeFileSegment(meta.title).slice(0, 31) || 'Attendance';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const scopeTag = meta.segmentScope ? `_${ATTENDANCE_EXPORT_FILE_TAG[meta.segmentScope]}` : '';
  XLSX.writeFile(wb, `attendance_${safeFileSegment(meta.title)}${scopeTag}.xlsx`);
}

export type MultiEventAttendanceRow = AttendanceExportRecord & {
  eventTitle: string;
};

function sortMultiEventRows(rows: MultiEventAttendanceRow[]): MultiEventAttendanceRow[] {
  const orderedByRoster =
    rows.length > 0 && rows.every((r) => r.rosterIndexInLevel != null);
  if (orderedByRoster) return [...rows];
  return [...rows].sort((a, b) => {
    const da = a.department ?? '';
    const db = b.department ?? '';
    if (da !== db) return da.localeCompare(db);
    return (
      a.eventTitle.localeCompare(b.eventTitle) || new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime()
    );
  });
}

export function exportMultiEventAttendancePdf(
  title: string,
  subtitle: string | undefined,
  rows: MultiEventAttendanceRow[],
  opts?: { segmentScope?: AttendanceExportTrackScope }
) {
  const sorted = sortMultiEventRows(rows);
  const doc = new jsPDF({ orientation: 'landscape' });
  const margin = 14;
  let y = 16;
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Campus Connect — ' + title, margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (subtitle) {
    doc.text(subtitle, margin, y);
    y += 5;
  }
  if (opts?.segmentScope) {
    doc.text(`Scope: ${ATTENDANCE_EXPORT_SCOPE_LINE[opts.segmentScope]}`, margin, y);
    y += 5;
  }
  doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')} · ${sorted.length} row(s)`, margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['#', 'Event', 'Name', 'Department', 'Time in', 'Time out']],
    body: sorted.map((r, i) => [
      String(r.rosterIndexInLevel ?? i + 1),
      r.eventTitle,
      r.userName,
      r.department ?? '—',
      formatScanned(r.scannedAt),
      formatTimeOut(r.timeOutAt),
    ]),
    styles: { fontSize: 7, cellPadding: 1.8, halign: 'left', valign: 'middle' },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
    showHead: 'everyPage',
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 36 },
      2: { cellWidth: 28 },
      3: { cellWidth: 52 },
      4: { halign: 'center', cellWidth: 26 },
      5: { halign: 'center', cellWidth: 26 },
    },
  });

  const scopeTag = opts?.segmentScope ? `_${ATTENDANCE_EXPORT_FILE_TAG[opts.segmentScope]}` : '';
  doc.save(`attendance_all_events_${format(new Date(), 'yyyy-MM-dd')}${scopeTag}.pdf`);
}

export function exportMultiEventAttendanceXlsx(
  title: string,
  rows: MultiEventAttendanceRow[],
  opts?: { segmentScope?: AttendanceExportTrackScope }
) {
  const sorted = sortMultiEventRows(rows);
  const headMeta: (string | number)[][] = [
    ['Campus Connect — ' + title],
    ['Generated', format(new Date(), 'MMM d, yyyy HH:mm')],
  ];
  if (opts?.segmentScope) headMeta.push(['Scope', ATTENDANCE_EXPORT_SCOPE_LINE[opts.segmentScope]]);
  headMeta.push(['Total rows', sorted.length], []);
  const aoa: (string | number)[][] = [
    ...headMeta,
    ['#', 'Event', 'Name', 'Department', 'Time in', 'Time out'],
    ...sorted.map((r, i) => [
      r.rosterIndexInLevel ?? i + 1,
      r.eventTitle,
      r.userName,
      r.department ?? '—',
      formatScanned(r.scannedAt),
      formatTimeOut(r.timeOutAt),
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  const sheet = opts?.segmentScope ? ATTENDANCE_EXPORT_FILE_TAG[opts.segmentScope].slice(0, 31) : 'All attendance';
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  const scopeTag = opts?.segmentScope ? `_${ATTENDANCE_EXPORT_FILE_TAG[opts.segmentScope]}` : '';
  XLSX.writeFile(wb, `attendance_all_events_${format(new Date(), 'yyyy-MM-dd')}${scopeTag}.xlsx`);
}
