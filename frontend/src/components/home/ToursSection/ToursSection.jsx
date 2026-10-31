import { useState } from 'react';
import Container from '../../layout/Container/Container';
import Badge from '../../common/Badge/Badge';
import Button from '../../common/Button/Button';
import { SAMPLE_TOURS } from '../../../data/sampleTours';
import {
  ClockIcon,
  CarIcon,
  UsersIcon,
  CoffeeIcon,
  MapPinIcon,
  CheckCircleIcon
} from '../../common/Icons';
import './ToursSection.css';

/**
 * ==============================================================================
 * SIGHTSEEING TOUR PACKAGES PREVIEW SECTION
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 2: Homepage Implementation
 * ==============================================================================
 * 
 * Introduces optional sightseeing excursions that guests can combine with
 * their hotel bookings.
 * 
 * Tours are optional additions to a hotel stay.
 */
export default function ToursSection({ onSelectTour }) {
  const [selectedTourForPreview, setSelectedTourForPreview] = useState(null);

  return (
    <section className="tours-section" id="tours">
      <Container size="lg">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-header__text">
            <h2 className="section-header__title">Sightseeing Add-ons</h2>
            <p className="section-header__subtitle">
              Explore local experiences and choose any tours you would like to add during checkout.
            </p>
          </div>
          <div className="tours-badge-container">
            <Badge variant="info" size="md">
              Add-ons
            </Badge>
          </div>
        </div>

        {/* Tours Grid */}
        <div className="tours-grid">
          {SAMPLE_TOURS.map((tour) => (
            <article key={tour.id} className="tour-card">
              {/* Image Thumbnail */}
              <div className="tour-card__image-box">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="tour-card__image"
                  loading="lazy"
                />
                <div className="tour-card__badge-wrapper">
                  <Badge variant="accent" size="sm">
                    {tour.badge}
                  </Badge>
                </div>
                <div className="tour-card__location-badge">
                  <MapPinIcon size={12} />
                  <span>{tour.destination}</span>
                </div>
              </div>

              {/* Card Details */}
              <div className="tour-card__body">
                <div className="tour-card__meta">
                  <span className="tour-card__meta-item">
                    <ClockIcon size={14} className="tour-icon" />
                    <span>{tour.duration}</span>
                  </span>
                </div>

                <h3 className="tour-card__title" title={tour.title}>
                  {tour.title}
                </h3>

                {/* Key Inclusions Pills */}
                <div className="tour-card__inclusions">
                  <div className="inclusion-pill" title={tour.transport}>
                    <CarIcon size={13} />
                    <span>{tour.transport.split('(')[0].trim()}</span>
                  </div>
                  <div className="inclusion-pill" title={tour.guide}>
                    <UsersIcon size={13} />
                    <span>{tour.guide.split('(')[0].trim()}</span>
                  </div>
                  {tour.meals && (
                    <div className="inclusion-pill" title={tour.meals}>
                      <CoffeeIcon size={13} />
                      <span>Meal Included</span>
                    </div>
                  )}
                </div>

                {/* Short Itinerary Highlight */}
                <ul className="tour-card__itinerary">
                  {tour.itinerary.slice(0, 2).map((item, i) => (
                    <li key={i}>
                      <CheckCircleIcon size={13} className="itinerary-check" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Card Footer: Pricing & Action */}
                <div className="tour-card__footer">
                  <div className="tour-card__pricing">
                    <span className="tour-price-prefix">From</span>
                    <div className="tour-price-val">
                      <span className="tour-currency">{tour.currency}</span>
                      <span className="tour-number">{tour.price.toLocaleString()}</span>
                    </div>
                    <span className="tour-pricing-type">{tour.priceType}</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="tour-card__preview-btn"
                    onClick={() => {
                      setSelectedTourForPreview(tour);
                      if (onSelectTour) onSelectTour(tour);
                    }}
                  >
                    Preview Tour
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Selected Tour Modal / Details Drawer (if open) */}
        {selectedTourForPreview && (
          <div className="tour-modal-backdrop" onClick={() => setSelectedTourForPreview(null)}>
            <div className="tour-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="tour-modal__header">
                <div>
                  <Badge variant="accent" size="sm">
                    Optional Hotel Add-on
                  </Badge>
                  <h3 className="tour-modal__title">{selectedTourForPreview.title}</h3>
                  <p className="tour-modal__destination">
                    <MapPinIcon size={14} /> {selectedTourForPreview.destination} &bull; {selectedTourForPreview.duration}
                  </p>
                </div>
                <button
                  type="button"
                  className="tour-modal__close-btn"
                  onClick={() => setSelectedTourForPreview(null)}
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              <div className="tour-modal__content">
                <div className="tour-modal__section">
                  <h4 className="tour-modal__subheading">Included Services:</h4>
                  <ul className="tour-modal__list">
                    <li><strong>Transport:</strong> {selectedTourForPreview.transport}</li>
                    <li><strong>Guide:</strong> {selectedTourForPreview.guide}</li>
                    <li><strong>Food &amp; Beverage:</strong> {selectedTourForPreview.meals}</li>
                  </ul>
                </div>

                <div className="tour-modal__section">
                  <h4 className="tour-modal__subheading">Planned Itinerary:</h4>
                  <ol className="tour-modal__steps">
                    {selectedTourForPreview.itinerary.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="tour-modal__price-summary">
                  <div>
                    <span className="summary-label">Estimated Add-on Price:</span>
                    <div className="summary-price">
                      {selectedTourForPreview.currency}{selectedTourForPreview.price.toLocaleString()}
                      <span className="summary-unit"> / {selectedTourForPreview.priceType}</span>
                    </div>
                  </div>
                  <Button variant="accent" size="md" onClick={() => setSelectedTourForPreview(null)}>
                    Got it (Optional Add-on)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
