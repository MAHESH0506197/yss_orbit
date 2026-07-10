import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Format a date string or Date object to IST (Asia/Kolkata)
 */
export function formatIST(dateStr: string | Date | number | null | undefined, formatStr: string = 'PP pp') {
  if (!dateStr) return '—';
  
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : (typeof dateStr === 'number' ? new Date(dateStr) : dateStr);
    return formatInTimeZone(date, 'Asia/Kolkata', formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(dateStr);
  }
}
