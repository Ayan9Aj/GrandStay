/**
 * ==============================================================================
 * WISHLIST STORAGE SERVICE
 * Project: GrandStay - Multi-Hotel & Villa Booking Platform
 * ==============================================================================
 *
 * Provides persistent local storage for hotels, villas, and bungalows added
 * to the user's Wishlist.
 *
 * Supports:
 * - Adding and removing items (by item object or ID)
 * - Checking if an item is in the wishlist
 * - Custom DOM event dispatching ('grandstay_wishlist_updated') so components
 *   (e.g., Header badge, HotelCard hearts) stay immediately in sync across the app
 * - Retrieval of full saved items with their metadata (type, property details, dates)
 */

const STORAGE_KEY = 'grandstay_wishlist_items';
const WISHLIST_EVENT = 'grandstay_wishlist_updated';

/**
 * Safely reads the wishlist array from localStorage.
 * @returns {Array<Object>} List of saved property items
 */
export function getWishlistItems() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read GrandStay wishlist from localStorage:', err);
    return [];
  }
}

/**
 * Checks whether a given property ID is currently in the wishlist.
 * @param {string} id Property ID (hotel or villa)
 * @returns {boolean}
 */
export function isItemInWishlist(id) {
  if (!id) return false;
  const items = getWishlistItems();
  return items.some((item) => String(item.id) === String(id));
}

/**
 * Returns the total count of saved wishlist items.
 * @returns {number}
 */
export function getWishlistCount() {
  return getWishlistItems().length;
}

/**
 * Toggles an item in the wishlist.
 * If present, removes it; if absent, adds it.
 *
 * @param {Object} item Hotel or Villa object
 * @returns {boolean} true if now saved, false if now removed
 */
export function toggleWishlistItem(item) {
  if (!item || !item.id) return false;
  const items = getWishlistItems();
  const index = items.findIndex((i) => String(i.id) === String(item.id));
  let isSaved = false;

  let nextItems;
  if (index >= 0) {
    // Remove item
    nextItems = items.filter((i) => String(i.id) !== String(item.id));
    isSaved = false;
  } else {
    // Add item with normalized fields so Wishlist Page can render uniform cards
    const propertyType = item.propertyType || (item.bedrooms ? 'Villa' : 'Hotel');
    const isVilla = Boolean(
      item.bedrooms ||
      item.guestCapacity ||
      propertyType === 'Villa' ||
      propertyType === 'Bungalow' ||
      item.rentalCategory
    );

    const normalizedItem = {
      ...item,
      id: item.id,
      name: item.name,
      location: item.location || item.destination,
      destination: item.destination,
      image: item.image,
      gallery: item.gallery || [item.image],
      rating: item.rating ?? 4.8,
      reviewCount: item.reviewCount ?? 120,
      pricePerNight: item.pricePerNight ?? 4999,
      currency: item.currency || '₹',
      propertyType,
      category: isVilla ? 'villa' : 'hotel',
      rentalCategory: item.rentalCategory || (isVilla ? `Entire ${propertyType} Rental` : undefined),
      amenities: item.amenities || [],
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      guestCapacity: item.guestCapacity,
      addedAt: new Date().toISOString(),
    };

    nextItems = [normalizedItem, ...items];
    isSaved = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  } catch (err) {
    console.error('Failed to save GrandStay wishlist to localStorage:', err);
  }

  // Notify all listeners
  notifyWishlistChange(nextItems);
  return isSaved;
}

/**
 * Removes a specific property ID from the wishlist.
 * @param {string} id
 */
export function removeWishlistItem(id) {
  if (!id) return;
  const items = getWishlistItems();
  const nextItems = items.filter((i) => String(i.id) !== String(id));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  } catch (err) {
    console.error('Failed to update wishlist in localStorage:', err);
  }
  notifyWishlistChange(nextItems);
}

/**
 * Clears the entire wishlist.
 */
export function clearWishlist() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear wishlist:', err);
  }
  notifyWishlistChange([]);
}

/**
 * Dispatches a custom event window-wide.
 * @param {Array<Object>} items
 */
function notifyWishlistChange(items) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(WISHLIST_EVENT, {
        detail: {
          items,
          count: items.length,
        },
      })
    );
  }
}

/**
 * Subscribes to wishlist changes.
 * @param {Function} callback Receives { items, count }
 * @returns {Function} Unsubscribe function
 */
export function subscribeToWishlist(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => {
    callback(e.detail);
  };
  window.addEventListener(WISHLIST_EVENT, handler);
  return () => window.removeEventListener(WISHLIST_EVENT, handler);
}
