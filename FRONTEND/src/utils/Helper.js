/**
 * Format a salary range for display.
 * @param {number} min
 * @param {number} max
 * @param {string} [currency="KSh"] - Currency symbol/prefix
 * @returns {string}
 */
export const formatSalary = (min, max, currency = "KSh") => {
  if (!min && !max) return "Not specified";
  if (min && max) return `${currency} ${min.toLocaleString()} – ${currency} ${max.toLocaleString()}`;
  if (min) return `From ${currency} ${min.toLocaleString()}`;
  return `Up to ${currency} ${max.toLocaleString()}`;
};

/**
 * Format a date to a human-readable relative string.
 * @param {string|Date} date
 * @returns {string}
 */
export const timeAgo = (date) => {
  const now = new Date();
  const then = new Date(date);
  
  // Normalize both dates to UTC to avoid timezone issues
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const thenUtc = Date.UTC(then.getUTCFullYear(), then.getUTCMonth(), then.getUTCDate());
  
  const diffMs = nowUtc - thenUtc;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Format a date to a localized string.
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Get Tailwind color classes for an application status badge.
 * @param {string} status
 * @returns {{ bg: string, text: string }}
 */
export const getStatusStyle = (status) => {
  switch (status) {
    case "Accepted":
      return { bg: "bg-green-100", text: "text-green-700" };
    case "Rejected":
      return { bg: "bg-red-100", text: "text-red-700" };
    case "In Review":
      return { bg: "bg-yellow-100", text: "text-yellow-700" };
    case "Applied":
    default:
      return { bg: "bg-blue-100", text: "text-blue-700" };
  }
};

/**
 * Get Tailwind color classes for a job type badge.
 * @param {string} type
 * @returns {string}
 */
export const getJobTypeStyle = (type) => {
  switch (type) {
    case "Remote":
      return "bg-emerald-100 text-emerald-700";
    case "Full-Time":
      return "bg-blue-100 text-blue-700";
    case "Part-Time":
      return "bg-purple-100 text-purple-700";
    case "Contract":
      return "bg-orange-100 text-orange-700";
    case "Internship":
      return "bg-pink-100 text-pink-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

/**
 * Truncate a string to a given length and append ellipsis.
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
export const truncate = (str, length = 120) => {
  if (!str) return "";
  return str.length > length ? str.substring(0, length) + "..." : str;
};

/**
 * Get user initials from a name string.
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name = "") => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("");
};
