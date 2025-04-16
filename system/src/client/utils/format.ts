/**
 * Format days from abbreviated to full names.
 * @param {string} days - Days in abbreviated format (e.g., "M,W,F").
 * @returns {string} Days in full name format (e.g., "Monday, Wednesday, Friday").
 */
export const formatDays = (days: string): string => {
  const dayMap: Record<string, string> = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    Th: "Thursday",
    F: "Friday",
  };

  return days
    .split(",")
    .map((day) => dayMap[day] || day)
    .join(", ");
};

/**
 * Format date to a readable string.
 * @param {string} dateString - Date in ISO format.
 * @returns {string} Formatted date string.
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};
