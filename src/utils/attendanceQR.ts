/** QR code format for student attendance: ATTEND:userId:eventId */
export const ATTEND_QR_PREFIX = 'ATTEND:';

/** Event QR prefix for pattern detection (e.g. EVT-8F2C...) */
export const EVENT_QR_PREFIX = 'EVT-';

/**
 * Normalize QR decoded text for reliable matching: trim, remove BOM, newlines, collapse spaces.
 * Use this for both displayed event codes and scanned values so they align.
 */
export function normalizeQrValue(s: string): string {
  return (s || '')
    .replace(/\uFEFF/g, '')
    .replace(/\r\n|\r|\n/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildAttendanceQRValue(userId: string, eventId: string): string {
  return `${ATTEND_QR_PREFIX}${userId}:${eventId}`;
}

export function parseAttendanceQR(decoded: string): { userId: string; eventId: string } | null {
  const raw = normalizeQrValue(decoded);
  if (!raw.startsWith(ATTEND_QR_PREFIX)) return null;
  const rest = raw.slice(ATTEND_QR_PREFIX.length);
  const colon = rest.indexOf(':');
  if (colon === -1) return null;
  const userId = rest.slice(0, colon);
  const eventId = rest.slice(colon + 1);
  return userId && eventId ? { userId, eventId } : null;
}

/**
 * Random event QR payload generated at event creation time.
 * Example: EVT-5E8A9C7F1D4B...
 */
export function generateEventQrCodeData(): string {
  const g = globalThis.crypto as Crypto | undefined;
  const token =
    g && typeof g.randomUUID === 'function'
      ? g.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  return `${EVENT_QR_PREFIX}${token.toUpperCase()}`;
}

/**
 * Get the event QR payload to encode in the event QR code.
 * Uses stored random qrCodeData; falls back to legacy EVT-{eventId} if missing.
 */
export function getEventQrCodeData(eventId: string, existingQrCodeData?: string): string {
  if (existingQrCodeData && normalizeQrValue(existingQrCodeData)) return normalizeQrValue(existingQrCodeData);
  return eventId.startsWith('evt-') ? `EVT-${eventId}` : `EVT-evt-${eventId}`;
}

/**
 * Check if a normalized scanned value matches an event (by qrCodeData or canonical EVT-{id}).
 * Use this for reliable attendance pattern detection when the QR is displayed via getEventQrCodeData.
 */
export function eventMatchesScannedValue(
  scannedNormalized: string,
  eventId: string,
  eventQrCodeData?: string
): boolean {
  if (!scannedNormalized) return false;
  const canonical = getEventQrCodeData(eventId, eventQrCodeData);
  if (canonical === scannedNormalized) return true;
  if (eventId === scannedNormalized) return true;
  if (scannedNormalized.startsWith('EVT-') && (eventId === scannedNormalized.slice(4) || `EVT-${eventId}` === scannedNormalized)) return true;
  return false;
}
