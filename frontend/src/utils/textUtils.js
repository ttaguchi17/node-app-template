/**
 * Truncates an email address to a maximum length while preserving domain
 * Example: "verylongemailaddress@gmail.com" -> "verylo...@gmail.com"
 * 
 * @param {string} email - The email address to truncate
 * @param {number} maxLength - Maximum length (default: 25)
 * @returns {string} Truncated email
 */
export function truncateEmail(email, maxLength = 25) {
  if (!email || email.length <= maxLength) return email;
  
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    // Not a valid email format, just truncate normally
    return email.substring(0, maxLength - 3) + '...';
  }
  
  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex);
  
  // If domain itself is too long, just truncate the whole thing
  if (domain.length >= maxLength - 6) {
    return email.substring(0, maxLength - 3) + '...';
  }
  
  // Calculate how much space we have for the local part
  const availableLength = maxLength - domain.length - 3; // 3 for "..."
  
  if (availableLength <= 0) {
    return email.substring(0, maxLength - 3) + '...';
  }
  
  return localPart.substring(0, availableLength) + '...' + domain;
}

/**
 * Truncates text to a maximum length
 * 
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length (default: 30)
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 30) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
