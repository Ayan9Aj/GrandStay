import { useState, useMemo } from 'react';
import Container from '../../layout/Container/Container';
import HotelCard from '../../common/HotelCard/HotelCard';
import Badge from '../../common/Badge/Badge';
import Button from '../../common/Button/Button';
import EmptyState from '../../common/EmptyState/EmptyState';
import { SAMPLE_HOTELS } from '../../../data/sampleHotels';
import './FeaturedHotelsSection.css';

/**
 * ==============================================================================
 * FEATURED HOTELS SECTION
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 2: Homepage Implementation
 * ==============================================================================
 * 
 * Reuses the Stage 1 HotelCard component with realistic local sample data.
 * Supports destination filter tabs, sorting, empty states, and opening the
 * Hotel Details preview modal.
 */
export default function FeaturedHotelsSection({
  searchFilter,
  onResetSearchFilter,
  onViewHotelDetails,
  onQuickPreview,
  onFavoriteToggle
}) {
  const [selectedCity, setSelectedCity] = useState('All');
  const [sortBy, setSortBy] = useState('recommended');

  // Destination filter synced with parent search filter if active
  const effectiveCity = searchFilter?.destination
    ? searchFilter.destination
    : selectedCity;

  // Filter and sort hotels
  const filteredHotels = useMemo(() => {
    let result = [...SAMPLE_HOTELS];

    // Filter by destination
    if (effectiveCity !== 'All') {
      result = result.filter(
        (h) => h.destination?.toLowerCase() === effectiveCity.toLowerCase()
      );
    }

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [effectiveCity, sortBy]);

  const handleCityChange = (city) => {
    if (searchFilter && onResetSearchFilter) {
      onResetSearchFilter();
    }
    setSelectedCity(city);
  };

  return (
    <section className="featured-hotels-section" id="hotels">
      <Container size="lg">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-header__text">
            <span className="section-header__eyebrow">Handpicked Accommodations</span>
            <h2 className="section-header__title">Featured Luxury Resorts &amp; Hotels</h2>
            <p className="section-header__subtitle">
              Every property is curated for authentic architecture, exceptional hospitality, and breathtaking surroundings.
            </p>
          </div>

          {/* Active Search Filter Badge */}
          {searchFilter && (
            <div className="search-filter-active-pill">
              <span className="filter-pill-label">
                {searchFilter.destination === 'All' ? (
                  <>Showing: <strong>All Destinations</strong> ({filteredHotels.length} found)</>
                ) : (
                  <>Filtered by: <strong>{searchFilter.destination}</strong> ({filteredHotels.length} found)</>
                )}
                {searchFilter.checkIn && searchFilter.checkOut && (
                  <span className="filter-pill-dates"> • {searchFilter.checkIn} to {searchFilter.checkOut}</span>
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onResetSearchFilter}
              >
                Clear Filter
              </Button>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="hotels-filter-bar">
          {/* Destination Tabs */}
          <div className="hotels-filter-tabs">
            {['All', 'Goa', 'Jaipur', 'Udaipur', 'Manali', 'Kerala'].map((city) => (
              <button
                key={city}
                type="button"
                className={`hotel-tab-btn ${effectiveCity === city ? 'hotel-tab-btn--active' : ''}`}
                onClick={() => handleCityChange(city)}
              >
                {city === 'All' ? 'All Stays' : city}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="hotels-sort-box">
            <label htmlFor="sort-hotels" className="hotels-sort-label">Sort by:</label>
            <select
              id="sort-hotels"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="hotels-sort-select"
            >
              <option value="recommended">Recommended &amp; Featured</option>
              <option value="rating">Guest Rating (High to Low)</option>
              <option value="price-low">Price (Low to High)</option>
              <option value="price-high">Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Hotel Cards Grid or Empty State */}
        {filteredHotels.length > 0 ? (
          <div className="hotel-cards-grid">
            {filteredHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onBook={() => onViewHotelDetails && onViewHotelDetails(hotel)}
                onPreview={onQuickPreview}
                onFavoriteToggle={onFavoriteToggle}
              />
            ))}
          </div>
        ) : (
          <div className="hotels-empty-wrapper">
            <EmptyState
              title={`No Stays Found in ${effectiveCity}`}
              description="We couldn't find any sample hotels matching this specific destination in our demonstration catalog. Try selecting 'All Stays' to view all properties."
              actionText="View All Stays"
              onAction={() => handleCityChange('All')}
            />
          </div>
        )}

        {/* Academic Project Transparency Disclaimer */}
        <div className="hotels-academic-disclaimer">
          <Badge variant="neutral" size="sm">
            Mock Demonstration Notice
          </Badge>
          <span>
            Room rates, amenity lists, and guest review counts represent local demonstration data for project evaluation.
            Live availability will be integrated with the Django REST Framework API in future stages.
          </span>
        </div>
      </Container>
    </section>
  );
}
