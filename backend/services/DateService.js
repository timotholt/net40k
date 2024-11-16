class DateService {
  /**
   * Get the current timestamp
   * @returns {Object} Object with Date and timestamp
   */
  static now() {
    const date = new Date();
    return {
      date: date,
      timestamp: date.getTime()
    };
  }

  /**
   * Convert a timestamp to a consistent, readable string format
   * @param {Date} [date] - Date to convert (defaults to current time)
   * @returns {string} Formatted date string
   */
  static toReadableString(date = new Date()) {
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + ' UTC';
  }

  /**
   * Parse a date string or timestamp into a Date object
   * @param {string|number|Date} input - Date to parse
   * @returns {Date} Parsed Date object
   */
  static parse(input) {
    if (input instanceof Date) return input;
    if (typeof input === 'number') return new Date(input);
    if (typeof input === 'string') return new Date(input);
    return new Date(); // Default to current time if invalid input
  }

  /**
   * Get the difference between two dates in various units
   * @param {Date} date1 
   * @param {Date} date2 
   * @returns {Object} Difference in various time units
   */
  static difference(date1, date2 = new Date()) {
    const diffMs = Math.abs(date1.getTime() - date2.getTime());
    return {
      milliseconds: diffMs,
      seconds: Math.floor(diffMs / 1000),
      minutes: Math.floor(diffMs / (1000 * 60)),
      hours: Math.floor(diffMs / (1000 * 60 * 60)),
      days: Math.floor(diffMs / (1000 * 60 * 60 * 24))
    };
  }
}

export default DateService;
