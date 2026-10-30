/**
 * ==============================================================================
 * PROTOTYPE AUTH & SESSION UTILITIES
 * Project: GrandStay - Multi-Hotel Booking Platform
 * ==============================================================================
 * 
 * Provides mock session persistence and user registry for the frontend prototype.
 * NOTE: Real server-side authentication with hashed passwords will be connected
 * to the Django REST Framework API in subsequent backend stages.
 */

const REGISTERED_USERS_KEY = 'grandstay_registered_users';
const CURRENT_USER_KEY = 'grandstay_current_user';

// Pre-seeded prototype demo accounts
const DEFAULT_DEMO_USERS = [
  { name: 'Ayan Biswas', email: 'ayan.biswas@example.com' },
  { name: 'Priya Sharma', email: 'priya@example.com' }
];

/**
 * Format an email address into a human-friendly fallback name
 * e.g., "ayan.biswas@example.com" -> "Ayan Biswas"
 * e.g., "alex_smith@domain.com" -> "Alex Smith"
 */
export function formatFallbackName(email) {
  if (!email || typeof email !== 'string') return 'Guest User';
  const prefix = email.split('@')[0] || 'Guest';
  // Replace dots, underscores, dashes with spaces and title-case each word
  return prefix
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Guest User';
}

/**
 * Get all registered prototype users
 */
export function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // LocalStorage error or unavailable
  }
  return [...DEFAULT_DEMO_USERS];
}

/**
 * Register a new user in the prototype registry and set active session
 */
export function registerPrototypeUser(fullName, email) {
  const cleanName = (fullName || '').trim() || formatFallbackName(email);
  const cleanEmail = (email || '').trim().toLowerCase();

  const users = getRegisteredUsers();
  const existingIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  const userObj = { name: cleanName, email: cleanEmail };

  if (existingIdx >= 0) {
    users[existingIdx] = userObj;
  } else {
    users.push(userObj);
  }

  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userObj));
  } catch {
    // LocalStorage error
  }

  return userObj;
}

/**
 * Sign in existing user: look up registered name or use formatted email fallback
 */
export function loginPrototypeUser(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const users = getRegisteredUsers();

  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
  const displayName = found?.name || formatFallbackName(email);

  const userObj = { name: displayName, email: cleanEmail };

  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userObj));
  } catch {
    // LocalStorage error
  }

  return userObj;
}

/**
 * Get the currently logged-in user session
 */
export function getActiveUserSession() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // LocalStorage error
  }
  return null;
}

/**
 * Clear the current user session (Sign Out)
 */
export function clearActiveUserSession() {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch {
    // LocalStorage error
  }
}
