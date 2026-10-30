import Container from '../../layout/Container/Container';
import Badge from '../../common/Badge/Badge';
import { SAMPLE_DESTINATIONS } from '../../../data/sampleDestinations';
import { MapPinIcon, ArrowRightIcon } from '../../common/Icons';
import './DestinationsSection.css';

/**
 * ==============================================================================
 * POPULAR DESTINATIONS COMPONENT
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 2: Homepage Implementation
 * ==============================================================================
 * 
 * Showcases top Indian travel destinations (Goa, Jaipur, Udaipur, Manali, Kerala).
 * Clicking any destination card sets the search destination, filters the hotels,
 * and scrolls down to the hotel listings!
 */
export default function DestinationsSection({ onSelectDestination, activeDestination }) {
  return (
    <section className="destinations-section" id="destinations">
      <Container size="lg">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-header__text">
            <span className="section-header__eyebrow">Explore India</span>
            <h2 className="section-header__title">Trending Luxury Destinations</h2>
            <p className="section-header__subtitle">
              From sun-soaked Arabian beaches to royal Rajasthani palaces and mist-veiled mountain valleys.
            </p>
          </div>
          <span className="destinations-count-badge">
            <Badge variant="primary" size="md">
              {SAMPLE_DESTINATIONS.length} Featured Cities
            </Badge>
          </span>
        </div>

        {/* Destinations Grid */}
        <div className="destinations-grid">
          {SAMPLE_DESTINATIONS.map((dest) => {
            const isSelected = activeDestination === dest.name;

            return (
              <div
                key={dest.id}
                className={`destination-card ${isSelected ? 'destination-card--selected' : ''}`}
                onClick={() => onSelectDestination && onSelectDestination(dest.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onSelectDestination) onSelectDestination(dest.name);
                  }
                }}
                aria-label={`Explore hotels in ${dest.name}, starting from ₹${dest.startingPrice.toLocaleString()}`}
              >
                {/* Background Image */}
                <div className="destination-card__image-box">
                  <img
                    src={dest.image}
                    alt={`Scenic view of ${dest.name}, ${dest.state}`}
                    className="destination-card__image"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="destination-card__overlay" />
                </div>

                {/* Card Content Over Image */}
                <div className="destination-card__content">
                  <div className="destination-card__top">
                    <span className="destination-card__count">
                      {dest.hotelCount} Properties
                    </span>
                    {isSelected && (
                      <Badge variant="accent" size="sm">
                        Active Filter
                      </Badge>
                    )}
                  </div>

                  <div className="destination-card__bottom">
                    <div className="destination-card__location">
                      <MapPinIcon size={14} className="destination-card__pin" />
                      <span>{dest.state}</span>
                    </div>

                    <h3 className="destination-card__name">{dest.name}</h3>
                    <p className="destination-card__tagline">{dest.tagline}</p>

                    <div className="destination-card__footer">
                      <div className="destination-card__price">
                        <span className="dest-from">From</span>
                        <span className="dest-amount">₹{dest.startingPrice.toLocaleString()}</span>
                        <span className="dest-unit">/ night</span>
                      </div>

                      <span className="destination-card__action">
                        <span>Explore Stays</span>
                        <ArrowRightIcon size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
