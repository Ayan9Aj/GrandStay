/**
 * ==============================================================================
 * SAMPLE HOTEL DATA
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 3: Hotel Catalog & Filtering
 * ==============================================================================
 *
 * Mock dataset representing commercial luxury hotels and resorts across India.
 * Used for component rendering, search filtering, and detail modal previews.
 * Later, this will be connected to the Django REST Framework API.
 *
 * Stage 3 additions (additive only — no existing field values were changed):
 *   starRating    : integer (5 = Luxury 5-Star, 4 = Premium 4-Star)
 *   propertyType  : string label used by the Property Type filter
 */

export const SAMPLE_HOTELS = [
  {
    id: 'hotel-001',
    name: 'The Grand Azure Resort & Spa',
    destination: 'Goa',
    location: 'Candolim Beach, Goa',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 428,
    pricePerNight: 7499,
    currency: '₹',
    badge: 'Luxury Beachfront',
    starRating: 5,
    propertyType: 'Luxury Resort',
    amenities: ['Free WiFi', 'Infinity Pool', 'Free Breakfast', 'Ocean View', 'Spa'],
    description: 'An idyllic beachfront sanctuary featuring oceanfront cabanas, award-winning spa treatments, and signature coastal fine dining.',
    rooms: [
      { type: 'Deluxe Ocean View Room', maxGuests: 2, price: 7499, bed: '1 King Bed' },
      { type: 'Executive Beach Cabana', maxGuests: 3, price: 11999, bed: '1 King Bed + 1 Daybed' },
      { type: 'Presidential Sea Villa', maxGuests: 4, price: 18499, bed: '2 King Beds' }
    ],
    policies: {
      checkIn: '2:00 PM',
      checkOut: '11:00 AM',
      cancellation: 'Free cancellation up to 48 hours before check-in date'
    }
  },
  {
    id: 'hotel-002',
    name: 'Heritage Palace & Royal Suites',
    destination: 'Udaipur',
    location: 'Lake Pichola, Udaipur, Rajasthan',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 312,
    pricePerNight: 9999,
    currency: '₹',
    badge: 'Royal Heritage',
    starRating: 5,
    propertyType: 'Heritage Palace',
    amenities: ['Free WiFi', 'Royal Courtyard', 'Butler Service', 'Pool', 'High Tea'],
    description: 'Experience aristocratic Rajasthani royalty overlooking serene lake waters with authentic 18th-century palace architecture and royal hospitality.',
    rooms: [
      { type: 'Royal Heritage Suite', maxGuests: 2, price: 9999, bed: '1 Royal Canopy Bed' },
      { type: 'Lake View Maharaja Suite', maxGuests: 3, price: 15999, bed: '1 Emperor Bed + Balcony' },
      { type: 'Private Royal Pavilion', maxGuests: 4, price: 24999, bed: '2 Royal Suites + Private Plunge Pool' }
    ],
    policies: {
      checkIn: '2:00 PM',
      checkOut: '12:00 PM',
      cancellation: 'Free cancellation up to 72 hours before check-in date'
    }
  },
  {
    id: 'hotel-003',
    name: 'Pine Crest Alpine Retreat',
    destination: 'Manali',
    location: 'Old Manali, Himachal Pradesh',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewCount: 215,
    pricePerNight: 5299,
    currency: '₹',
    badge: 'Mountain View',
    starRating: 4,
    propertyType: 'Alpine Retreat',
    amenities: ['Free WiFi', 'Heated Rooms', 'Free Breakfast', 'Trekking Desk', 'Fireplace'],
    description: 'Nestled among towering cedar pines with breathtaking panoramic snow-capped Himalayan mountain vistas and warm wooden chalet architecture.',
    rooms: [
      { type: 'Cedar Wood Deluxe Chalet', maxGuests: 2, price: 5299, bed: '1 Queen Bed + Mountain Balcony' },
      { type: 'Alpine Family Suite', maxGuests: 4, price: 8799, bed: '2 Double Beds + Fireplace' }
    ],
    policies: {
      checkIn: '1:00 PM',
      checkOut: '11:00 AM',
      cancellation: 'Free cancellation up to 24 hours before check-in date'
    }
  },
  {
    id: 'hotel-004',
    name: 'The Pink City Haveli & Courtyard',
    destination: 'Jaipur',
    location: 'Civil Lines, Jaipur, Rajasthan',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 289,
    pricePerNight: 6199,
    currency: '₹',
    badge: 'Cultural Oasis',
    starRating: 4,
    propertyType: 'Boutique Haveli',
    amenities: ['Free WiFi', 'Courtyard Pool', 'Rooftop Dining', 'Folk Performances'],
    description: 'A restored boutique haveli blending timeless Rajput craftsmanship, arched corridors, handcrafted jharokhas, and authentic Rajasthani gastronomy.',
    rooms: [
      { type: 'Jaipur Premier Room', maxGuests: 2, price: 6199, bed: '1 King Bed' },
      { type: 'Haveli Courtyard Suite', maxGuests: 3, price: 9499, bed: '1 King Bed + Living Area' }
    ],
    policies: {
      checkIn: '2:00 PM',
      checkOut: '11:30 AM',
      cancellation: 'Free cancellation up to 48 hours before check-in date'
    }
  },
  {
    id: 'hotel-005',
    name: 'Kumarakom Backwater Sanctuary',
    destination: 'Kerala',
    location: 'Vembanad Lake, Kumarakom, Kerala',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 367,
    pricePerNight: 8299,
    currency: '₹',
    badge: 'Eco Luxury',
    starRating: 5,
    propertyType: 'Eco Sanctuary',
    amenities: ['Free WiFi', 'Ayurvedic Spa', 'Private Boat Jetty', 'Infinity Pool'],
    description: 'Set on the banks of emerald backwaters, offering heritage villas with open-to-sky shower gardens, traditional snake-boat cruises, and holistic wellness.',
    rooms: [
      { type: 'Heritage Lakeview Villa', maxGuests: 2, price: 8299, bed: '1 King Bed + Garden Patio' },
      { type: 'Meandering Pool Villa', maxGuests: 3, price: 13499, bed: '1 King Bed + Direct Pool Access' }
    ],
    policies: {
      checkIn: '2:00 PM',
      checkOut: '11:00 AM',
      cancellation: 'Free cancellation up to 72 hours before check-in date'
    }
  },
  {
    id: 'hotel-006',
    name: 'Sunset Palms Beach Resort',
    destination: 'Goa',
    location: 'Palolem Beach, South Goa',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    reviewCount: 198,
    pricePerNight: 4699,
    currency: '₹',
    badge: 'Beachfront Cottages',
    starRating: 4,
    propertyType: 'Beachfront Resort',
    amenities: ['Free WiFi', 'Beach Shack Bar', 'Yoga Pavilion', 'Kayaking'],
    description: 'Rustic luxury wooden cottages nestled directly on the soft white sands of South Goa, surrounded by coconut groves and gentle Arabian Sea breezes.',
    rooms: [
      { type: 'Beachside Wooden Cottage', maxGuests: 2, price: 4699, bed: '1 Queen Bed + Balcony Hammock' },
      { type: 'Family Palm Suite', maxGuests: 4, price: 7999, bed: '2 Queen Beds' }
    ],
    policies: {
      checkIn: '1:00 PM',
      checkOut: '11:00 AM',
      cancellation: 'Free cancellation up to 24 hours before check-in date'
    }
  }
];

export const DESIGN_TOKENS_INFO = {
  colors: [
    { name: 'Primary 900', var: '--color-primary-900', hex: '#07111e', role: 'Darkest navy, footer & deep contrast' },
    { name: 'Primary 800', var: '--color-primary-800', hex: '#0c1a2e', role: 'Main brand navy, headings & hero elements' },
    { name: 'Primary 600', var: '--color-primary-600', hex: '#1d3557', role: 'Interactive brand links & icons' },
    { name: 'Accent 600', var: '--color-accent-600', hex: '#d49128', role: 'Warm gold hospitality accent & buttons' },
    { name: 'Accent 500', var: '--color-accent-500', hex: '#e8a838', role: 'Bright amber, focus rings & star ratings' },
    { name: 'Background Subtle', var: '--color-bg-page', hex: '#f8fafc', role: 'Calm slate-gray canvas background' },
    { name: 'Surface White', var: '--color-bg-surface', hex: '#ffffff', role: 'Pure white card & modal surfaces' },
    { name: 'Success Emerald', var: '--color-success', hex: '#059669', role: 'Availability & confirmed status' },
    { name: 'Danger Rose', var: '--color-danger', hex: '#dc2626', role: 'Validation errors & alerts' }
  ],
  typography: [
    { label: 'Display Heading (4xl)', sample: 'Find Your Next Luxurious Stay', size: '2.25rem (36px)', weight: '700 Bold' },
    { label: 'Section Title (3xl)', sample: 'Featured Luxury Resorts', size: '1.875rem (30px)', weight: '700 Bold' },
    { label: 'Card Title (xl)', sample: 'The Grand Azure Resort & Spa', size: '1.25rem (20px)', weight: '600 Semibold' },
    { label: 'Body Text (base)', sample: 'Discover luxury stays, compare room rates, and book unforgettable trips.', size: '1rem (16px)', weight: '400 Regular' },
    { label: 'Caption / Muted (sm)', sample: 'Starting from ₹4,999 / night + taxes', size: '0.875rem (14px)', weight: '500 Medium' }
  ]
};
