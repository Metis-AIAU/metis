/**
 * Username: 3–50 characters, alphanumeric + underscores + hyphens only.
 */
function isValidUsername(str) {
  if (typeof str !== 'string') return false;
  return /^[a-zA-Z0-9_-]{3,50}$/.test(str);
}

/**
 * Password: minimum 8 characters.
 */
function isValidPassword(str) {
  if (typeof str !== 'string') return false;
  return str.length >= 8;
}

module.exports = { isValidUsername, isValidPassword };
