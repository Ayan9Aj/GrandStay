import { useState } from 'react';
import { StarIcon, MapPinIcon, HeartIcon, WifiIcon, PoolIcon, CoffeeIcon } from '../Icons';
import Badge from '../Badge/Badge';
import Button from '../Button/Button';
import './HotelCard.css';

/**
 * ==============================================================================
 * REUSABLE HOTEL CARD COMPONENT
 * ==============================================================================
 * 
 * Commercial-grade hotel card presenting key booking information:
 * photos, ratings, badges, amenities, pricing, and reservation CTAs.
 * 
 * Props:
 * - hotel: Object containing:
 *   - id: string | number
 *   - name: string
 *   - location: string
 *   - image: string URL
 *   - rating: number (e.g. 4.8)
 *   - reviewCount: number
 *   - pricePerNight: number
 *   - currency: string (e.g. '₹' or '$')
 *   - badge: string (optional, e.g. 'Featured' | 'Luxury Collection')
 *   - amenities: string[] (e.g. ['Free WiFi', 'Pool', 'Breakfast'])
 * - onBook: Callback when "View Details" / "Book Now" is clicked
 * - onFavoriteToggle: Callback when favorite heart is clicked
 */
export default function HotelCard({
  hotel,
  onBook,
  onPreview,
  onFavoriteToggle,
  layout = 'vertical',
  showPreview = true,
  showDetails = true,
  pricePrefix = 'Rooms start from',
  pricePeriod = '/ night',
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!hotel) return null;

  const {
    name = 'Luxury Stay Resort',
    location = 'Tropical Haven',
    description = '',
    image,
    rating = 4.8,
    reviewCount = 120,
    pricePerNight = 4999,
    currency = '₹',
    badge = 'Featured',
    amenities = ['Free WiFi', 'Breakfast', 'Pool']
  } = hotel;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    if (onFavoriteToggle) {
      onFavoriteToggle(hotel, !isFavorite);
    }
  };

  const renderAmenityIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi')) return <WifiIcon size={13} />;
    if (lower.includes('pool')) return <PoolIcon size={13} />;
    if (lower.includes('breakfast') || lower.includes('coffee')) return <CoffeeIcon size={13} />;
    return null;
  };

  return (
    <article className={`hotel-card ${layout === 'horizontal' ? 'hotel-card--horizontal' : ''}`}>
      {/* Image Thumbnail Container */}
      <div className="hotel-card__image-container">
        {!imgError && image ? (
          <img
            src={image}
            alt={name}
            className="hotel-card__image"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="hotel-card__image-fallback">
            <span className="hotel-card__fallback-text">{name}</span>
          </div>
        )}

        {/* Top Badges */}
        {badge && (
          <div className="hotel-card__badge-wrapper">
            <Badge variant="accent" size="sm">
              {badge}
            </Badge>
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          type="button"
          className={`hotel-card__favorite-btn ${isFavorite ? 'hotel-card__favorite-btn--active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? `Remove ${name} from favorites` : `Save ${name} to favorites`}
        >
          <HeartIcon size={18} filled={isFavorite} />
        </button>
      </div>

      {/* Hotel Card Body Details */}
      <div className="hotel-card__content">
        <div className="hotel-card__header">
          <div className="hotel-card__location">
            <MapPinIcon size={14} className="hotel-card__pin-icon" />
            <span>{location}</span>
          </div>

          {layout !== 'horizontal' && (
            <div className="hotel-card__rating" title={`Rated ${rating} out of 5 stars`}>
              <StarIcon size={14} className="hotel-card__star-icon" fill="var(--color-accent-600)" />
              <span className="hotel-card__rating-score">{rating}</span>
              <span className="hotel-card__review-count">({reviewCount})</span>
            </div>
          )}
        </div>

        <h3 className="hotel-card__title" title={name}>
          {name}
        </h3>

        {layout === 'horizontal' && (
          <div className="hotel-card__rating" title={`Rated ${rating} out of 5 stars`}>
            <StarIcon size={14} className="hotel-card__star-icon" fill="var(--color-accent-600)" />
            <span className="hotel-card__rating-score">{rating}</span>
            <span className="hotel-card__review-count">({reviewCount})</span>
          </div>
        )}

        {layout === 'horizontal' && description && (
          <p className="hotel-card__description">{description}</p>
        )}

        {/* Amenity Pills */}
        {amenities && amenities.length > 0 && (
          <div className="hotel-card__amenities">
            {amenities.map((item) => (
              <span key={item} className="hotel-card__amenity-tag">
                {renderAmenityIcon(item)}
                <span>{item}</span>
              </span>
            ))}
          </div>
        )}

        {/* Bottom Pricing & CTA: retain the original homepage layout. */}
        {layout !== 'horizontal' && (
          <div className="hotel-card__footer">
          <div className="hotel-card__pricing">
            <span className="hotel-card__price-prefix">From</span>
            <div className="hotel-card__price-wrapper">
              <span className="hotel-card__currency">{currency}</span>
              <span className="hotel-card__price">{pricePerNight.toLocaleString()}</span>
              <span className="hotel-card__period">/ night</span>
            </div>
            <span className="hotel-card__tax-note">+ taxes &amp; fees</span>
          </div>

            <div className="hotel-card__actions">
              {showPreview && onPreview && (
                <Button variant="outline" size="sm" className="hotel-card__quick-preview-btn" onClick={() => onPreview(hotel)}>
                  Quick Preview
                </Button>
              )}
              {showDetails && (
                <Button
                  variant="primary"
                  size="sm"
                  className="hotel-card__view-details-btn"
                  onClick={() => onBook && onBook(hotel)}
                  ariaLabel={`View details for ${name}`}
                >
                  View Details
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {layout === 'horizontal' && (
        <div className="hotel-card__footer hotel-card__footer--horizontal">
          <div className="hotel-card__actions hotel-card__actions--horizontal">
            <Button variant="primary" size="sm" className="hotel-card__book-now-btn" onClick={() => onBook && onBook(hotel)}>
              Book Now
            </Button>
            {showPreview && onPreview && (
              <Button variant="outline" size="sm" className="hotel-card__quick-preview-btn" onClick={() => onPreview(hotel)}>
                Quick Preview
              </Button>
            )}
            {showDetails && (
              <Button
                variant="primary"
                size="sm"
                className="hotel-card__view-details-btn"
                onClick={() => onBook && onBook(hotel)}
                ariaLabel={`View details for ${name}`}
              >
                View Details
              </Button>
            )}
          </div>
          <div className="hotel-card__pricing">
            <span className="hotel-card__price-prefix">{pricePrefix}</span>
            <div className="hotel-card__price-wrapper">
              <span className="hotel-card__currency">{currency}</span>
              <span className="hotel-card__price">{pricePerNight.toLocaleString()}</span>
              <span className="hotel-card__period">{pricePeriod}</span>
            </div>
            <span className="hotel-card__tax-note">+ taxes &amp; fees</span>
          </div>
        </div>
      )}
    </article>
  );
}
