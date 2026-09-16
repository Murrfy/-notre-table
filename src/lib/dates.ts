export function localIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Expo Localization uses Calendar.Weekday where Sunday=1 ... Saturday=7.
 * JavaScript Date#getDay uses Sunday=0 ... Saturday=6.
 */
export function startOfWeek(date = new Date(), firstWeekday = 2): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const desiredJsDay = ((firstWeekday - 1) % 7 + 7) % 7;
  const delta = (d.getDay() - desiredJsDay + 7) % 7;
  d.setDate(d.getDate() - delta);
  return d;
}

// Compatibility helper for parts of the app or migrations that explicitly need ISO Monday.
export function mondayOf(date = new Date()): Date { return startOfWeek(date, 2); }

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function currentWeekStart(firstWeekday = 2): string {
  return localIsoDate(startOfWeek(new Date(), firstWeekday));
}
