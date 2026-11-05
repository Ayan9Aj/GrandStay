/**
 * ==============================================================================
 * BOOKING & RESERVATION SERVICE
 * Project: GrandStay - Multi-Hotel & Villa Booking Platform
 * ==============================================================================
 *
 * Manages confirmed reservations across the platform for both hotels & resorts
 * and private villas & bungalows.
 *
 * Capabilities:
 * - Persistent storage in localStorage ('grandstay_user_reservations')
 * - Real-time custom event broadcasting ('grandstay_reservations_updated')
 * - Realistic pre-seeded reservations for prototype evaluation
 * - Support for cancellation, voucher retrieval, and stay status progression
 */

const STORAGE_KEY = 'grandstay_user_reservations';
const RESERVATIONS_EVENT = 'grandstay_reservations_updated';

// Realistic sample reservations for prototype demo accounts (e.g. Ayan Biswas)
const SAMPLE_RESERVATIONS = [
  {
    id: 'res-hotel-101',
    referenceNumber: 'GS-2026-9284',
    type: 'hotel',
    status: 'Confirmed', // 'Confirmed' | 'Completed' | 'Cancelled'
    propertyId: 'hotel-001',
    propertyName: 'The Grand Azure Resort & Spa',
    propertyType: 'Luxury Beachfront Resort',
    location: 'Candolim Beach, Goa, India',
    destination: 'Goa',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviewCount: 428,
    checkIn: '2026-11-20',
    checkOut: '2026-11-23',
    checkInTime: '2:00 PM',
    checkOutTime: '11:00 AM',
    arrivalTime: '2:00 PM – 4:00 PM (Standard check-in)',
    leavingTime: '11:00 AM (Standard check-out)',
    nights: 3,
    roomName: 'Deluxe Ocean View Room',
    roomCount: 1,
    guests: '2 Adults',
    totalGuests: 2,
    leadGuest: {
      fullName: 'Ayan Biswas',
      email: 'ayan.biswas@example.com',
      phone: '+91 98300 12345',
    },
    inclusions: [
      'Daily International & Coastal Buffet Breakfast',
      'Exclusive Oceanfront Cabana Access',
      'Complimentary High-speed WiFi',
      'Welcome Cocktail & Sunset Beachfront Lounge',
      'Complimentary Valet Parking',
    ],
    selectedTours: [
      {
        id: 'tour-001',
        title: 'Sunset Catamaran Cruise with Coastal Appetizers',
        pricePerPerson: 1800,
        amount: 3600,
      },
    ],
    priceBreakdown: {
      currency: '₹',
      roomSubtotal: 22497,
      tourSubtotal: 3600,
      estimatedGstAmount: 2700,
      estimatedTotal: 28797,
    },
    paymentMethod: 'card',
    paymentSummary: 'Paid via Visa ending in •••• 4242',
    paymentStatus: 'Paid in Full',
    cancellationPolicy: 'Free cancellation until Nov 18, 2026 (48 hrs before check-in)',
    isFreeCancellationEligible: true,
    bookingTimestamp: '02 Nov 2026, 14:32 IST',
    bookedByEmail: 'ayan.biswas@example.com',
    specialRequests: 'High floor room preferred, quiet location facing the sea.',
  },
  {
    id: 'res-villa-102',
    referenceNumber: 'GS-2026-7819',
    type: 'villa',
    status: 'Confirmed',
    propertyId: 'villa-001',
    propertyName: 'Palm Cove Private Villa',
    propertyType: 'Entire Private Villa Rental',
    location: 'Candolim, North Goa, India',
    destination: 'Goa',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviewCount: 86,
    checkIn: '2026-12-10',
    checkOut: '2026-12-14',
    checkInTime: '3:00 PM',
    checkOutTime: '11:00 AM',
    arrivalTime: '3:00 PM – 6:00 PM (Host greeting)',
    leavingTime: '11:00 AM (Standard check-out)',
    nights: 4,
    roomName: 'Entire 4-Bedroom Luxury Residence',
    roomCount: 1,
    guests: '4 Guests (2 Adults, 2 Children)',
    totalGuests: 4,
    bedrooms: 4,
    bathrooms: 4,
    leadGuest: {
      fullName: 'Ayan Biswas',
      email: 'ayan.biswas@example.com',
      phone: '+91 98300 12345',
    },
    inclusions: [
      'Exclusive Access to Whole Private Property',
      'Private Swimming Pool & Sunken Loungers',
      'Dedicated Daily Housekeeping & Villa Host',
      'Chef Service on Request for Gourmet Dinners',
      'High-Speed Wi-Fi & Smart Entertainment Lounge',
    ],
    selectedTours: [],
    priceBreakdown: {
      currency: '₹',
      propertySubtotal: 47996,
      tourSubtotal: 0,
      housekeepingFee: 1500,
      estimatedGstAmount: 5939,
      estimatedTotal: 55435,
    },
    paymentMethod: 'upi',
    paymentSummary: 'Paid via UPI (ayan@okhdfcbank)',
    paymentStatus: 'Paid in Full',
    cancellationPolicy: 'Free cancellation until Dec 05, 2026 (5 days prior)',
    isFreeCancellationEligible: true,
    bookingTimestamp: '28 Oct 2026, 19:15 IST',
    bookedByEmail: 'ayan.biswas@example.com',
    specialRequests: 'Late arrival expected at 6:00 PM. Please arrange chilled welcome refreshments.',
  },
  {
    id: 'res-hotel-103',
    referenceNumber: 'GS-2026-4412',
    type: 'hotel',
    status: 'Completed',
    propertyId: 'hotel-002',
    propertyName: 'Heritage Palace & Royal Suites',
    propertyType: 'Royal Heritage Hotel',
    location: 'Lake Pichola, Udaipur, Rajasthan, India',
    destination: 'Udaipur',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    reviewCount: 312,
    checkIn: '2026-10-12',
    checkOut: '2026-10-15',
    checkInTime: '2:00 PM',
    checkOutTime: '12:00 PM',
    arrivalTime: '2:00 PM – 4:00 PM',
    leavingTime: '12:00 PM (Late check-out)',
    nights: 3,
    roomName: 'Royal Courtyard Suite with Lake View',
    roomCount: 1,
    guests: '2 Adults',
    totalGuests: 2,
    leadGuest: {
      fullName: 'Ayan Biswas',
      email: 'ayan.biswas@example.com',
      phone: '+91 98300 12345',
    },
    inclusions: [
      'Aristocratic Royal Courtyard Breakfast',
      'Private Heritage Boat Ride on Lake Pichola',
      'Daily Sunset High Tea & Classical Sitar Concert',
      '24-Hour Butler & Concierge Service',
    ],
    selectedTours: [],
    priceBreakdown: {
      currency: '₹',
      roomSubtotal: 29997,
      tourSubtotal: 0,
      estimatedGstAmount: 3599,
      estimatedTotal: 33596,
    },
    paymentMethod: 'card',
    paymentSummary: 'Settled via Mastercard ending in •••• 1099',
    paymentStatus: 'Completed & Invoiced',
    cancellationPolicy: 'Past stay — completed on 15 Oct 2026',
    isFreeCancellationEligible: false,
    bookingTimestamp: '15 Sep 2026, 11:20 IST',
    bookedByEmail: 'ayan.biswas@example.com',
    specialRequests: 'Flower arrangement in suite for anniversary.',
  },
  {
    id: 'res-hotel-104',
    referenceNumber: 'GS-2026-3108',
    type: 'hotel',
    status: 'Cancelled',
    propertyId: 'hotel-003',
    propertyName: 'Himalayan Pine Retreat & Spa',
    propertyType: 'Mountain Chalet & Resort',
    location: 'Old Manali, Himachal Pradesh, India',
    destination: 'Manali',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    reviewCount: 198,
    checkIn: '2026-11-28',
    checkOut: '2026-12-01',
    checkInTime: '1:00 PM',
    checkOutTime: '11:00 AM',
    arrivalTime: '1:00 PM – 3:00 PM (Standard check-in)',
    leavingTime: '11:00 AM (Standard check-out)',
    nights: 3,
    roomName: 'Cedar Mountain View Chalet',
    roomCount: 1,
    guests: '2 Adults',
    totalGuests: 2,
    leadGuest: {
      fullName: 'Ayan Biswas',
      email: 'ayan.biswas@example.com',
      phone: '+91 98300 12345',
    },
    inclusions: [
      'Daily Mountain Buffet Breakfast',
      'Heated Indoor Pool & Cedar Sauna',
      'Evening Fireplace Lounge & Hot Cocoa',
    ],
    selectedTours: [],
    priceBreakdown: {
      currency: '₹',
      roomSubtotal: 16497,
      tourSubtotal: 0,
      estimatedGstAmount: 1953,
      estimatedTotal: 18450,
    },
    paymentMethod: 'card',
    paymentSummary: 'Full refund processed to original card',
    paymentStatus: 'Refunded',
    cancellationPolicy: 'Cancelled on Oct 28, 2026 • Full refund credited',
    cancellationReason: 'Change of travel dates',
    cancellationTimestamp: '28 Oct 2026, 16:40 IST',
    isFreeCancellationEligible: false,
    bookingTimestamp: '10 Oct 2026, 12:15 IST',
    bookedByEmail: 'ayan.biswas@example.com',
    specialRequests: 'High floor chalet with direct pine forest view.',
  },
];

export const formatArrivalTime = (val) => {
  if (!val) return '2:00 PM – 4:00 PM (Standard check-in)';
  if (val === '12:00 - 14:00') return '12:00 PM – 2:00 PM (Early arrival)';
  if (val === '14:00 - 16:00') return '2:00 PM – 4:00 PM (Standard check-in)';
  if (val === '16:00 - 18:00') return '4:00 PM – 6:00 PM (Late afternoon)';
  if (val === '18:00 - 20:00') return '6:00 PM – 8:00 PM (Evening arrival)';
  if (val === 'after_18:00') return 'After 6:00 PM (Evening arrival)';
  if (val === 'after_20:00') return 'After 8:00 PM (Late arrival)';
  if (val === 'flexible') return 'Flexible / Standard (2:00 PM)';
  return val;
};

export const normalizeReservation = (b) => {
  const status = (b.status === 'Reservation Confirmed' || !b.status) ? 'Confirmed' : b.status;
  return {
    ...b,
    status,
    arrivalTime: b.arrivalTime || (b.specialRequests?.arrivalTime ? formatArrivalTime(b.specialRequests.arrivalTime) : (b.checkInTime ? `From ${b.checkInTime}` : '2:00 PM – 4:00 PM (Standard check-in)')),
    leavingTime: b.leavingTime || (b.checkOutTime ? `Until ${b.checkOutTime}` : '11:00 AM (Standard check-out)'),
  };
};

/**
 * Safely retrieves all stored reservations, initializing from prototype seeds if empty.
 * @returns {Array<Object>} List of reservation objects
 */
export function getAllBookings() {
  if (typeof window === 'undefined') return SAMPLE_RESERVATIONS.map(normalizeReservation);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_RESERVATIONS));
      return SAMPLE_RESERVATIONS.map(normalizeReservation);
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeReservation) : SAMPLE_RESERVATIONS.map(normalizeReservation);
  } catch (err) {
    console.error('Failed to read bookings from localStorage:', err);
    return SAMPLE_RESERVATIONS.map(normalizeReservation);
  }
}

/**
 * Returns reservations for a specific user, or all reservations if user matches prototype demo.
 * @param {string} [userEmail]
 * @returns {Array<Object>}
 */
export function getUserBookings(userEmail) {
  const all = getAllBookings();
  if (!userEmail) return all;
  const cleanEmail = userEmail.trim().toLowerCase();

  // If user is the default demo account, show all seed stays plus their own
  const matched = all.filter((booking) => {
    if (!booking.bookedByEmail) return true;
    return booking.bookedByEmail.toLowerCase() === cleanEmail;
  });

  return matched.length > 0 ? matched : all;
}

/**
 * Adds a new booking to storage.
 * @param {Object} rawData Booking data from hotel or villa checkout
 * @returns {Object} The normalized reservation object
 */
export function addBooking(rawData) {
  const all = getAllBookings();

  const isVilla = Boolean(
    rawData.villa ||
    rawData.type === 'villa' ||
    rawData.propertyType === 'Villa' ||
    rawData.rentalCategory
  );

  const property = rawData.hotel || rawData.villa || {};
  const ref = rawData.referenceNumber || `GS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newReservation = {
    id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    referenceNumber: ref,
    type: isVilla ? 'villa' : 'hotel',
    status: rawData.status || 'Confirmed',
    propertyId: property.id || rawData.propertyId || 'prop-custom',
    propertyName: property.name || rawData.propertyName || 'GrandStay Luxury Stay',
    propertyType: property.propertyType || (isVilla ? 'Entire Private Residence' : 'Luxury Hotel'),
    location: property.location || property.destination || rawData.location || 'India',
    destination: property.destination || rawData.destination || 'India',
    image: property.image || (Array.isArray(property.gallery) ? property.gallery[0] : null) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    rating: property.rating ?? 4.9,
    reviewCount: property.reviewCount ?? 150,
    checkIn: rawData.checkIn || '2026-11-20',
    checkOut: rawData.checkOut || '2026-11-23',
    checkInTime: property.checkInTime || '2:00 PM',
    checkOutTime: property.checkOutTime || '11:00 AM',
    arrivalTime: formatArrivalTime(rawData.specialRequests?.arrivalTime) || '2:00 PM – 4:00 PM (Standard check-in)',
    leavingTime: property.checkOutTime ? `Until ${property.checkOutTime}` : '11:00 AM (Standard check-out)',
    nights: rawData.nights || 1,
    roomName: rawData.room?.name || property.roomTypes?.[rawData.selectedRoomIndex || 0]?.name || (isVilla ? `Entire ${property.bedrooms || 4}-Bedroom Residence` : 'Deluxe Room'),
    roomCount: rawData.roomCount || 1,
    guests: rawData.totalGuests ? `${rawData.totalGuests} Guests` : `${rawData.adults || 2} Adults`,
    totalGuests: rawData.totalGuests || (rawData.adults || 2) + (rawData.children || 0),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    leadGuest: rawData.leadGuest || {
      fullName: 'Valued Guest',
      email: rawData.bookedByEmail || 'guest@example.com',
      phone: '+91 98000 00000',
    },
    inclusions: property.amenities || [
      'High-speed WiFi',
      'Daily Housekeeping',
      'Breakfast Inclusions (as per plan)',
      '24/7 Concierge Support',
    ],
    selectedTours: rawData.selectedTours || [],
    priceBreakdown: rawData.priceBreakdown || {
      currency: property.currency || '₹',
      estimatedTotal: property.pricePerNight ? property.pricePerNight * (rawData.nights || 1) : 4999,
    },
    paymentMethod: rawData.paymentMethod || 'card',
    paymentSummary: rawData.paymentMethod === 'card'
      ? `Paid via Card (${rawData.cardDetails?.cardNumber || '•••• 8888'})`
      : rawData.paymentMethod === 'upi'
      ? `Paid via UPI (${rawData.upiId || 'verified'})`
      : 'Pay at Hotel on Arrival',
    paymentStatus: rawData.paymentMethod === 'pay_at_hotel' ? 'Pay upon Arrival' : 'Paid in Full',
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
    isFreeCancellationEligible: true,
    bookingTimestamp: rawData.timestamp || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    bookedByEmail: rawData.leadGuest?.email || rawData.bookedByEmail || 'ayan.biswas@example.com',
    specialRequests: typeof rawData.specialRequests === 'object'
      ? Object.entries(rawData.specialRequests).filter(([, v]) => Boolean(v)).map(([k]) => k).join(', ')
      : (rawData.specialRequests || 'None specified'),
  };

  const updated = [newReservation, ...all];
  saveAndBroadcast(updated);
  return newReservation;
}

/**
 * Cancels a reservation by reference number.
 * @param {string} referenceNumber
 * @param {string} [reason]
 * @returns {boolean} true if cancelled
 */
export function cancelBooking(referenceNumber, reason = 'Cancelled by guest') {
  const all = getAllBookings();
  const index = all.findIndex((b) => b.referenceNumber === referenceNumber);
  if (index === -1) return false;

  const current = all[index];
  const updatedItem = {
    ...current,
    status: 'Cancelled',
    cancellationReason: reason,
    cancellationTimestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    isFreeCancellationEligible: false,
  };

  all[index] = updatedItem;
  saveAndBroadcast([...all]);
  return true;
}

/**
 * Finds a booking by its unique reference number.
 * @param {string} referenceNumber
 * @returns {Object|null}
 */
export function getBookingByReference(referenceNumber) {
  const all = getAllBookings();
  return all.find((b) => b.referenceNumber === referenceNumber) || null;
}

/**
 * Saves bookings to localStorage and notifies all components.
 * @param {Array<Object>} bookings
 */
function saveAndBroadcast(bookings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('Failed to save reservations to localStorage:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(RESERVATIONS_EVENT, {
        detail: {
          bookings,
          count: bookings.length,
        },
      })
    );
  }
}

/**
 * Subscribes to booking updates.
 * @param {Function} callback
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToBookings(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => {
    callback(e.detail);
  };
  window.addEventListener(RESERVATIONS_EVENT, handler);
  return () => window.removeEventListener(RESERVATIONS_EVENT, handler);
}
