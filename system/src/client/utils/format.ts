/**
 * Format a time string from HH:MM to a 12-hour format with AM/PM.
 * @param {string} time - Time in HH:MM format.
 * @returns {string} Formatted time string in 12-hour format with AM/PM.
 */
export const formatTime = (time: string): string => {
  if (!time) return "";

  try {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

    return `${displayHour}:${minutes} ${period}`;
  } catch (error) {
    console.error("Error formatting time:", error);
    return time;
  }
};

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

/**
 * Format a due date for display
 * @param {string} dueDate - The due date string in ISO format.
 * @returns {string} Formatted due date string.
 */
export const formatDueDate = (dueDate: string): string => {
  if (!dueDate) return "";

  try {
    const date = new Date(dueDate);

    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${formattedDate} at ${formattedTime}`;
  } catch (error) {
    console.error(`Error formatting due date: ${error}`);
    return dueDate;
  }
};
