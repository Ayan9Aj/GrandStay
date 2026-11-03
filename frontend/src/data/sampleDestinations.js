/**
 * ==============================================================================
 * POPULAR DESTINATIONS DATA
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 2: Homepage Implementation
 * ==============================================================================
 * 
 * Indian destinations showcased on the homepage: Goa, Jaipur, Udaipur, Manali, Kerala.
 * Clicking any destination card populates the search query and filters hotels.
 */

export const SAMPLE_DESTINATIONS = [
  {
    id: 'dest-goa',
    name: 'Goa',
    state: 'Goa',
    tagline: 'Sun-drenched beaches, Portuguese heritage & coastal nightlife',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    hotelCount: 24,
    startingPrice: 3499,
    highlights: ['Beaches', 'Water Sports', 'Sunset Cruises']
  },
  {
    id: 'dest-jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    tagline: 'The vibrant Pink City of majestic forts, royal havelis & bazaars',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
    hotelCount: 18,
    startingPrice: 4299,
    highlights: ['Amber Fort', 'Hawa Mahal', 'Handicraft Bazaars']
  },
  {
    id: 'dest-udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    tagline: 'The romantic City of Lakes with floating royal palaces & sunset vistas',
    image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
    hotelCount: 15,
    startingPrice: 5999,
    highlights: ['Lake Pichola', 'City Palace', 'Heritage Haveli']
  },
  {
    id: 'dest-manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    tagline: 'Snow-clad Himalayan peaks, whispering pine forests & adventure trails',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    hotelCount: 16,
    startingPrice: 2999,
    highlights: ['Solang Valley', 'Rohtang Pass', 'Apple Orchards']
  },
  {
    id: 'dest-kerala',
    name: 'Kerala',
    state: 'Kerala',
    tagline: 'God’s Own Country with serene backwaters, tea gardens & Ayurvedic retreats',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    hotelCount: 20,
    startingPrice: 4499,
    highlights: ['Houseboats', 'Tea Plantations', 'Ayurveda Spa']
  }
];

export const DESTINATION_SUGGESTIONS = [
  // Cities
  { id: 'city-goa', name: 'Goa', category: 'Cities', type: 'city', parentCity: 'Goa', subtitle: 'State in India' },
  { id: 'city-jaipur', name: 'Jaipur', category: 'Cities', type: 'city', parentCity: 'Jaipur', subtitle: 'Rajasthan' },
  { id: 'city-udaipur', name: 'Udaipur', category: 'Cities', type: 'city', parentCity: 'Udaipur', subtitle: 'Rajasthan' },
  { id: 'city-manali', name: 'Manali', category: 'Cities', type: 'city', parentCity: 'Manali', subtitle: 'Himachal Pradesh' },
  { id: 'city-kerala', name: 'Kerala', category: 'Cities', type: 'city', parentCity: 'Kerala', subtitle: 'State in India' },

  // Regions
  { id: 'reg-north-goa', name: 'North Goa', category: 'Regions', type: 'region', parentCity: 'Goa', subtitle: 'Goa' },
  { id: 'reg-south-goa', name: 'South Goa', category: 'Regions', type: 'region', parentCity: 'Goa', subtitle: 'Goa' },
  { id: 'reg-kullu-valley', name: 'Kullu Valley', category: 'Regions', type: 'region', parentCity: 'Manali', subtitle: 'Himachal Pradesh' },
  { id: 'reg-malabar', name: 'Malabar Coast', category: 'Regions', type: 'region', parentCity: 'Kerala', subtitle: 'Kerala' },

  // Landmarks
  { id: 'lm-calangute', name: 'Calangute Beach', category: 'Landmarks', type: 'landmark', parentCity: 'Goa', subtitle: 'North Goa' },
  { id: 'lm-baga', name: 'Baga Beach', category: 'Landmarks', type: 'landmark', parentCity: 'Goa', subtitle: 'North Goa' },
  { id: 'lm-amber-fort', name: 'Amber Fort', category: 'Landmarks', type: 'landmark', parentCity: 'Jaipur', subtitle: 'Jaipur' },
  { id: 'lm-hawa-mahal', name: 'Hawa Mahal', category: 'Landmarks', type: 'landmark', parentCity: 'Jaipur', subtitle: 'Jaipur' },
  { id: 'lm-city-palace-udr', name: 'City Palace Udaipur', category: 'Landmarks', type: 'landmark', parentCity: 'Udaipur', subtitle: 'Lake Pichola' },
  { id: 'lm-solang-valley', name: 'Solang Valley', category: 'Landmarks', type: 'landmark', parentCity: 'Manali', subtitle: 'Manali' },
  { id: 'lm-vembanad', name: 'Vembanad Lake', category: 'Landmarks', type: 'landmark', parentCity: 'Kerala', subtitle: 'Kumarakom' },

  // Airports & Transit
  { id: 'ap-goi', name: 'Goa Dabolim International Airport (GOI)', category: 'Airports & Transit', type: 'airport', parentCity: 'Goa', subtitle: 'Goa' },
  { id: 'ap-gox', name: 'Manohar International Airport, Mopa (GOX)', category: 'Airports & Transit', type: 'airport', parentCity: 'Goa', subtitle: 'North Goa' },
  { id: 'ap-jai', name: 'Jaipur International Airport (JAI)', category: 'Airports & Transit', type: 'airport', parentCity: 'Jaipur', subtitle: 'Jaipur' },
  { id: 'ap-udr', name: 'Maharana Pratap Airport Udaipur (UDR)', category: 'Airports & Transit', type: 'airport', parentCity: 'Udaipur', subtitle: 'Udaipur' },
  { id: 'ap-cok', name: 'Cochin International Airport (COK)', category: 'Airports & Transit', type: 'airport', parentCity: 'Kerala', subtitle: 'Cochin / Kumarakom' },
];

