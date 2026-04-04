/** `YYYY-MM-DDTHH:mm` for `<input type="datetime-local" />` in the browser local timezone. */
export function toDatetimeLocalString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function maxDatetimeLocal(a: string, b: string): string {
  return a >= b ? a : b;
}

/** True when the event has already ended (DB + forms can allow past dates on edit). */
export function eventIsFullyPast(endIso: string): boolean {
  return new Date(endIso).getTime() < Date.now();
}

export type EventPastDateMode = 'strict' | 'historicalEdit';

/**
 * @param slackMs — tolerate small clock skew (default 60s)
 */
export function validateEventNotInPast(
  startLocal: string,
  endLocal: string,
  mode: EventPastDateMode,
  slackMs = 60_000
): string | null {
  if (mode === 'historicalEdit') return null;
  const now = Date.now();
  const startMs = new Date(startLocal).getTime();
  const endMs = new Date(endLocal).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return 'Enter valid start and end date/times.';
  }
  if (startMs < now - slackMs) return 'Start cannot be in the past.';
  if (endMs < now - slackMs) return 'End cannot be in the past.';
  return null;
}
