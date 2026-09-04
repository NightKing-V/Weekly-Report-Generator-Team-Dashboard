export interface WeekInfo {
  weekNumber: number;
  year: number;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string;   // YYYY-MM-DD (Sunday)
  weekLabel: string;     // e.g. "Week 36 (Aug 31 - Sep 06, 2026)"
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format a Date into YYYY-MM-DD using local time (avoids UTC timezone shift issues).
 */
export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date safely, handling YYYY-MM-DD strings without timezone offsets.
 */
export function parseLocalDate(input: Date | string): Date {
  if (input instanceof Date) {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate(), 12, 0, 0);
  }

  // Handle YYYY-MM-DD
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  const parsed = new Date(input);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
}

/**
 * Calculate the ISO-8601 week information where:
 * - Monday is day 1 (start of week)
 * - Sunday is day 7 (end of week)
 * - Week 1 is the week containing the first Thursday of the year.
 */
export function getIsoWeek(dateInput?: Date | string): WeekInfo {
  const date = dateInput ? parseLocalDate(dateInput) : new Date();
  date.setHours(12, 0, 0, 0);

  // Day of week: Sunday is 0, Monday is 1, ..., Saturday is 6
  const day = date.getDay();
  // Difference to Monday (Mon = 0 diff, Sun = -6 diff)
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Thursday determines ISO week number and ISO week-year
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);

  const firstJan = new Date(thursday.getFullYear(), 0, 1, 12, 0, 0);
  const dayDiff = Math.round((thursday.getTime() - firstJan.getTime()) / 86400000);
  const weekNumber = Math.floor((dayDiff + firstJan.getDay() + 5) / 7);
  const year = thursday.getFullYear();

  // Format dates for label: "MMM DD - MMM DD, YYYY"
  const monMonth = MONTH_NAMES[monday.getMonth()];
  const monDay = String(monday.getDate()).padStart(2, '0');
  const sunMonth = MONTH_NAMES[sunday.getMonth()];
  const sunDay = String(sunday.getDate()).padStart(2, '0');

  let dateRangeStr: string;
  if (monday.getFullYear() === sunday.getFullYear()) {
    if (monday.getMonth() === sunday.getMonth()) {
      dateRangeStr = `${monMonth} ${monDay} - ${sunDay}, ${monday.getFullYear()}`;
    } else {
      dateRangeStr = `${monMonth} ${monDay} - ${sunMonth} ${sunDay}, ${monday.getFullYear()}`;
    }
  } else {
    dateRangeStr = `${monMonth} ${monDay}, ${monday.getFullYear()} - ${sunMonth} ${sunDay}, ${sunday.getFullYear()}`;
  }

  const weekLabel = `Week ${weekNumber} (${dateRangeStr})`;

  return {
    weekNumber,
    year,
    weekStartDate: formatLocalDate(monday),
    weekEndDate: formatLocalDate(sunday),
    weekLabel,
  };
}

/**
 * Generate a list of recent consecutive Monday-to-Sunday weeks from the real calendar.
 * Returns `count` weeks ending at the current week + 1 upcoming week.
 */
export function getRecentWeeks(count = 12, referenceDate?: Date | string): WeekInfo[] {
  const currentWeek = getIsoWeek(referenceDate);
  const weeks: WeekInfo[] = [];

  // Start with 1 upcoming week (next week)
  const refMonday = parseLocalDate(currentWeek.weekStartDate);
  const startNextWeek = new Date(refMonday);
  startNextWeek.setDate(refMonday.getDate() + 7);

  for (let i = 0; i < count; i++) {
    const d = new Date(startNextWeek);
    d.setDate(startNextWeek.getDate() - i * 7);
    weeks.push(getIsoWeek(d));
  }

  return weeks;
}

/**
 * Get the adjacent week (e.g. delta = -1 for previous week, delta = +1 for next week).
 */
export function getAdjacentWeek(currentLabelOrDate: string | Date, deltaWeeks: number): WeekInfo {
  let baseDate: Date;
  if (typeof currentLabelOrDate === 'string') {
    const match = currentLabelOrDate.match(/\(([A-Za-z]{3})\s+(\d{1,2})/);
    const yearMatch = currentLabelOrDate.match(/(\d{4})\)/);
    if (match && yearMatch) {
      const monthIndex = MONTH_NAMES.indexOf(match[1]);
      const day = parseInt(match[2], 10);
      const year = parseInt(yearMatch[1], 10);
      if (monthIndex >= 0 && !isNaN(day) && !isNaN(year)) {
        baseDate = new Date(year, monthIndex, day, 12, 0, 0);
      } else {
        baseDate = parseLocalDate(currentLabelOrDate);
      }
    } else {
      baseDate = parseLocalDate(currentLabelOrDate);
    }
  } else {
    baseDate = new Date(currentLabelOrDate);
  }

  const nextDate = new Date(baseDate);
  nextDate.setDate(baseDate.getDate() + deltaWeeks * 7);
  return getIsoWeek(nextDate);
}

/**
 * Parse any date selected from an HTML5 datepicker into a Monday-to-Sunday WeekInfo.
 */
export function parseDateToWeek(dateInput: string | Date): WeekInfo {
  return getIsoWeek(dateInput);
}
