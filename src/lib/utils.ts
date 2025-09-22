/**
 * Safely converts a date string or Date object to a formatted date string
 * @param date - Date object or date string
 * @returns Formatted date string
 */
export function formatEmailDate(date: Date | string): string {
  try {
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString();
    } else if (date instanceof Date) {
      return date.toLocaleDateString();
    } else {
      return 'Unknown date';
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Safely converts a date string or Date object to a formatted date and time string
 * @param date - Date object or date string
 * @returns Formatted date and time string
 */
export function formatEmailDateTime(date: Date | string): string {
  try {
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      return dateObj.toLocaleString();
    } else if (date instanceof Date) {
      return date.toLocaleString();
    } else {
      return 'Unknown date';
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}
