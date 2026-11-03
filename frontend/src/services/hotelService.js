/**
 * ==============================================================================
 * HOTEL SERVICE — DATA ACCESS LAYER
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 3: Hotel Catalog & Filtering
 * ==============================================================================
 *
 * PURPOSE:
 *   This file is the single place where hotel data is fetched and filtered.
 *   All other components (HotelsPage, FeaturedHotelsSection, etc.) should
 *   import from here — never directly from sampleHotels.js.
 *
 * WHY A SEPARATE SERVICE FILE?
 *   Right now we use static JS sample data. In Stage 5 (Django REST backend),
 *   you simply replace the body of each function below with a `fetch()` call
 *   to the API. The rest of the frontend code stays the same!
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * FUTURE DJANGO REST API MAPPING (Stage 5 migration guide):
 *
 *   getHotels(filters)          →  GET /api/hotels/
 *                                    ?destination=Goa
 *                                    &min_price=3000&max_price=8000
 *                                    &star_rating=5,4
 *                                    &amenities=Spa,Pool
 *                                    &property_type=Luxury+Resort
 *                                    &ordering=price   (or -price, -rating)
 *
 *   getHotelById(id)            →  GET /api/hotels/{id}/
 *
 *   getPriceRange()             →  GET /api/hotels/price-range/
 *                                    Returns { min, max }
 *
 *   getAllAmenities()           →  GET /api/amenities/
 *   getAllPropertyTypes()       →  GET /api/property-types/
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { SAMPLE_HOTELS } from '../data/sampleHotels';
import { TRENDING_HOTELS } from '../data/trendingHotels';

// ─── Helper: Normalise destination string for comparison ───────────────────
const normDest = (s) => (s || '').trim().toLowerCase();

// ─── Helper: Compute minimum room price for a hotel (future use) ───────────
// Kept as a reference for when we migrate to live Django pricing data.
// eslint-disable-next-line no-unused-vars
const _getMinRoomPrice = (hotel) =>
  Math.min(...hotel.rooms.map((r) => r.price));

// ─────────────────────────────────────────────────────────────────────────────
// getPriceRange()
// Returns the lowest and highest room prices across all hotels.
//
// Django equivalent: GET /api/hotels/price-range/  →  { min: 4699, max: 18499 }
// ─────────────────────────────────────────────────────────────────────────────
export function getPriceRange() {
  const allPrices = SAMPLE_HOTELS.flatMap((h) => h.rooms.map((r) => r.price));
  return {
    min: Math.min(...allPrices),
    max: Math.max(...allPrices),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getAllAmenities()
// Returns a sorted list of unique amenity strings found across all hotels.
//
// Django equivalent: GET /api/amenities/  →  [{ id, name }, ...]
// ─────────────────────────────────────────────────────────────────────────────
export function getAllAmenities() {
  const set = new Set();
  SAMPLE_HOTELS.forEach((h) => h.amenities.forEach((a) => set.add(a)));
  return [...set].sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// getAllPropertyTypes()
// Returns a sorted list of unique propertyType strings from the dataset.
//
// Django equivalent: GET /api/property-types/  →  [{ id, name }, ...]
// ─────────────────────────────────────────────────────────────────────────────
export function getAllPropertyTypes() {
  const set = new Set(SAMPLE_HOTELS.map((h) => h.propertyType));
  return [...set].sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// getDestinations()
// Returns a sorted list of unique destination city names.
//
// Django equivalent: GET /api/destinations/  →  [{ id, name }, ...]
// ─────────────────────────────────────────────────────────────────────────────
export function getDestinations() {
  const set = new Set(SAMPLE_HOTELS.map((h) => h.destination));
  return [...set].sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// getHotels(filters)
//
// Main filtering + sorting function. Accepts an optional `filters` object:
//   {
//     destination   : string  — city name; '' or 'All' = show all
//     minPrice      : number  — minimum pricePerNight (inclusive)
//     maxPrice      : number  — maximum pricePerNight (inclusive)
//     starRatings   : number[] — e.g. [5, 4] — empty array = show all
//     amenities     : string[] — hotel must have ALL listed amenities
//     propertyTypes : string[] — empty = show all
//     sortBy        : string  — 'recommended' | 'price-asc' | 'price-desc' | 'rating-desc'
//   }
//
// Returns a filtered and sorted array of hotel objects.
//
// Django equivalent:
//   GET /api/hotels/?destination=Goa&min_price=3000&star_rating=5,4&ordering=-rating
// ─────────────────────────────────────────────────────────────────────────────
export function getHotels(filters = {}) {
  const {
    destination = '',
    minPrice = 0,
    maxPrice = Infinity,
    starRatings = [],
    amenities = [],
    propertyTypes = [],
    popularFilters = [],
    maxCityCenterDistanceKm = Infinity,
    landmark = '',
    maxLandmarkDistanceKm = Infinity,
    mealPlans = [],
    bookingConditions = {},
    accessibilityFeatures = [],
    minRating = 0,
    sortBy = 'recommended',
  } = filters;

  let results = [...SAMPLE_HOTELS];

  // 1. Filter by destination
  if (destination && destination !== 'All') {
    const target = normDest(destination);
    results = results.filter(
      (h) =>
        normDest(h.destination) === target ||
        normDest(h.location).includes(target)
    );
  }

  // 2. Filter by price range
  if (minPrice > 0) {
    results = results.filter((h) => h.pricePerNight >= minPrice);
  }
  if (maxPrice < Infinity) {
    results = results.filter((h) => h.pricePerNight <= maxPrice);
  }

  // 3. Filter by star rating
  if (starRatings.length > 0) {
    results = results.filter((h) => starRatings.includes(h.starRating));
  }

  // 4. Filter by amenities — hotel must have ALL selected amenities
  if (amenities.length > 0) {
    results = results.filter((h) =>
      amenities.every((a) => h.amenities.includes(a))
    );
  }

  // 5. Filter by property type
  if (propertyTypes.length > 0) {
    results = results.filter((h) => propertyTypes.includes(h.propertyType));
  }

  // 6. Filter by popularFilters & bookingConditions
  const hasFreeCancellationFilter = Array.isArray(bookingConditions)
    ? bookingConditions.includes('freeCancellation')
    : (bookingConditions?.freeCancellation || popularFilters.includes('freeCancellation'));
  const hasPayAtHotelFilter = Array.isArray(bookingConditions)
    ? bookingConditions.includes('payAtHotel')
    : (bookingConditions?.payAtHotel || popularFilters.includes('payAtHotel'));

  if (hasFreeCancellationFilter) {
    results = results.filter((h) => h.bookingConditions?.freeCancellation || /free cancellation/i.test(h.policies?.cancellation || ''));
  }
  if (hasPayAtHotelFilter) {
    results = results.filter((h) => h.bookingConditions?.payAtHotel);
  }

  // 7. Distance from city center ('any' or Infinity means no limit)
  if (maxCityCenterDistanceKm && maxCityCenterDistanceKm !== 'any' && maxCityCenterDistanceKm !== Infinity) {
    const limit = Number(maxCityCenterDistanceKm);
    if (!Number.isNaN(limit)) {
      results = results.filter(
        (h) => (h.distanceFromCityCenterKm ?? 0) <= limit
      );
    }
  }

  // 8. Distance from landmark ('any' or Infinity means no limit)
  if (landmark && maxLandmarkDistanceKm && maxLandmarkDistanceKm !== 'any' && maxLandmarkDistanceKm !== Infinity) {
    const limit = Number(maxLandmarkDistanceKm);
    if (!Number.isNaN(limit)) {
      const targetLm = normDest(landmark);
      results = results.filter((h) => {
        const lmObj = h.nearbyLandmarks?.find((lm) => normDest(lm.name).includes(targetLm) || targetLm.includes(normDest(lm.name)));
        return lmObj ? lmObj.distanceKm <= limit : true;
      });
    }
  }

  // 9. Meal plans
  if (mealPlans.length > 0) {
    results = results.filter((h) =>
      mealPlans.every((mp) => h.mealPlans?.includes(mp))
    );
  }

  // 10. Accessibility features
  if (accessibilityFeatures.length > 0) {
    results = results.filter((h) =>
      accessibilityFeatures.every((af) => h.accessibilityFeatures?.includes(af))
    );
  }

  // 11. Minimum rating score
  if (minRating > 0) {
    results = results.filter((h) => (h.rating ?? 0) >= minRating);
  }

  // 12. Sort results
  switch (sortBy) {
    case 'price-asc':
      results.sort((a, b) => a.pricePerNight - b.pricePerNight);
      break;
    case 'price-desc':
      results.sort((a, b) => b.pricePerNight - a.pricePerNight);
      break;
    case 'rating-desc':
      results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
      break;
    case 'recommended':
    default:
      break;
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// getHotelById(id)
// Returns a single hotel object matching the given id, or null if not found.
//
// Django equivalent: GET /api/hotels/{id}/
// ─────────────────────────────────────────────────────────────────────────────
export function getHotelById(id) {
  return TRENDING_HOTELS.find((h) => h.id === id) || null;
}

export function getTrendingHotels() {
  return [...TRENDING_HOTELS];
}
