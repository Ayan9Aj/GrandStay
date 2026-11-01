import { useMemo } from 'react';
import Container from '../../layout/Container/Container';
import HotelCard from '../../common/HotelCard/HotelCard';
import Button from '../../common/Button/Button';
import EmptyState from '../../common/EmptyState/EmptyState';
import { SAMPLE_HOTELS } from '../../../data/sampleHotels';
import './FeaturedHotelsSection.css';

export default function FeaturedHotelsSection({
  searchFilter,
  onResetSearchFilter,
  onBrowseAll,
  onViewHotelDetails,
  onQuickPreview,
  onFavoriteToggle,
}) {
  const effectiveCity = searchFilter?.destination || 'All';
  const filteredHotels = useMemo(() => {
    if (effectiveCity === 'All') return [...SAMPLE_HOTELS];
    return SAMPLE_HOTELS.filter((hotel) => hotel.destination?.toLowerCase() === effectiveCity.toLowerCase());
  }, [effectiveCity]);

  return (
    <section className="featured-hotels-section" id="hotels">
      <Container size="lg">
        <div className="section-header">
          <div className="section-header__text">
            <span className="section-header__eyebrow">Handpicked Accommodations</span>
            <h2 className="section-header__title">Featured Luxury Resorts &amp; Hotels</h2>
          </div>
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
              <Button variant="outline" size="sm" onClick={onResetSearchFilter}>Clear Filter</Button>
            </div>
          )}
        </div>

        <div className="hotels-browse-row">
          <Button variant="outline" onClick={onBrowseAll}>Browse All Hotel Stays</Button>
        </div>

        {filteredHotels.length > 0 ? (
          <div className="hotel-cards-grid">
            {filteredHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                showBookNow
                showPreview={false}
                onBookNow={(selectedHotel) => onViewHotelDetails?.(selectedHotel)}
                onBook={(selectedHotel) => onViewHotelDetails?.(selectedHotel)}
                onPreview={onQuickPreview}
                onFavoriteToggle={onFavoriteToggle}
              />
            ))}
          </div>
        ) : (
          <div className="hotels-empty-wrapper">
            <EmptyState
              title={`No Stays Found in ${effectiveCity}`}
              description="We couldn't find any stays in this destination. Try clearing the active search filter to browse available properties."
              actionText="View All Stays"
              onAction={onResetSearchFilter}
            />
          </div>
        )}
      </Container>
    </section>
  );
}
