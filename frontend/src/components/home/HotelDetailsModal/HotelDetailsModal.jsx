import { useEffect, useState } from 'react';
import Badge from '../../common/Badge/Badge';
import Button from '../../common/Button/Button';
import {
  StarIcon,
  MapPinIcon,
  CloseIcon,
  WifiIcon,
  PoolIcon,
  CoffeeIcon,
  CheckCircleIcon,
  UsersIcon
} from '../../common/Icons';
import './HotelDetailsModal.css';

/**
 * ==============================================================================
 * HOTEL DETAILS PREVIEW MODAL
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 2: Homepage Implementation
 * ==============================================================================
 * 
 * Provides a comprehensive preview of the selected hotel:
 * - Photography & badges
 * - Star rating breakdown & location
 * - Full description & amenities
 * - Available room categories with transparent pricing
 * - Hotel policies (check-in, check-out, cancellation)
 */
export default function HotelDetailsModal({
  hotel,
  onClose,
  onBookNow,
  onViewFullDetails
}) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!hotel) return null;

  const selectedRoomIndex = selectedRoom?.hotelId === hotel.id ? selectedRoom.index : null;

  const renderAmenityIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi')) return <WifiIcon size={14} />;
    if (lower.includes('pool')) return <PoolIcon size={14} />;
    if (lower.includes('breakfast') || lower.includes('coffee')) return <CoffeeIcon size={14} />;
    return <CheckCircleIcon size={14} />;
  };

  return (
    <div className="hotel-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-hotel-title">
      <div className="hotel-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header with Close Button */}
        <button
          type="button"
          className="hotel-modal__close-btn"
          onClick={onClose}
          aria-label="Close hotel details preview"
        >
          <CloseIcon size={20} />
        </button>

        {/* Hero Image */}
        <div className="hotel-modal__hero">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="hotel-modal__image"
          />
          <div className="hotel-modal__hero-badge">
            <Badge variant="accent" size="md">
              {hotel.badge || 'Luxury Collection'}
            </Badge>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="hotel-modal__body">
          <div className="hotel-modal__header-info">
            <div className="hotel-modal__rating-row">
              <span className="hotel-modal__rating-pill">
                <StarIcon size={15} fill="var(--color-accent-600)" />
                <strong>{hotel.rating}</strong>
                <span className="rating-count">({hotel.reviewCount} verified reviews)</span>
              </span>
              <span className="hotel-modal__destination-tag">
                {hotel.destination}
              </span>
            </div>

            <h2 id="modal-hotel-title" className="hotel-modal__title">{hotel.name}</h2>
            <p className="hotel-modal__location">
              <MapPinIcon size={16} /> {hotel.location}
            </p>
          </div>

          {/* Overview */}
          <div className="hotel-modal__section">
            <h3 className="hotel-modal__section-title">Property Overview</h3>
            <p className="hotel-modal__desc">{hotel.description}</p>
          </div>

          {/* Amenities Grid */}
          <div className="hotel-modal__section">
            <h3 className="hotel-modal__section-title">Featured Amenities</h3>
            <div className="hotel-modal__amenities-grid">
              {hotel.amenities?.map((amenity) => (
                <div key={amenity} className="hotel-modal__amenity-item">
                  <span className="amenity-icon">{renderAmenityIcon(amenity)}</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hotel-modal__section">
            <h3 className="hotel-modal__section-title">Room Categories</h3>
            <div className="hotel-modal__rooms-list">
              {hotel.rooms?.map((room, idx) => (
                <div key={idx} className="room-card-preview">
                  <div className="room-card-preview__info">
                    <h4 className="room-card-preview__title">{room.type}</h4>
                    <div className="room-card-preview__meta">
                      <span><UsersIcon size={14} /> Up to {room.maxGuests} Guests</span>
                      <span>&bull; {room.bed}</span>
                    </div>
                  </div>
                  <div className="room-card-preview__price-action">
                    <div className="room-card-preview__price">
                      <span className="room-curr">{hotel.currency}</span>
                      <strong className="room-amt">{room.price.toLocaleString()}</strong>
                      <span className="room-per"> / night</span>
                    </div>
                    <Button
                      variant={selectedRoomIndex === idx ? 'secondary' : 'outline'}
                      size="sm"
                      aria-pressed={selectedRoomIndex === idx}
                      onClick={() => setSelectedRoom({ hotelId: hotel.id, index: idx })}
                    >
                      {selectedRoomIndex === idx ? 'Selected' : 'Select this room'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Policies and reservation status */}
          <div className="hotel-modal__section">
            <h3 className="hotel-modal__section-title">Check-in &amp; Cancellation Policies</h3>
            <ul className="hotel-modal__policies">
              <li><strong>Check-in:</strong> {hotel.policies?.checkIn || '2:00 PM'}</li>
              <li><strong>Check-out:</strong> {hotel.policies?.checkOut || '11:00 AM'}</li>
              <li><strong>Cancellation:</strong> {hotel.policies?.cancellation || 'Free cancellation up to 48 hours before check-in'}</li>
            </ul>

            <div className="hotel-modal__availability-note">
              Choose a room to review it at checkout. This does not reserve the room or process payment.
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="hotel-modal__footer">
          <div className="hotel-modal__footer-price">
            {Number.isInteger(selectedRoomIndex) && hotel.rooms?.[selectedRoomIndex] ? (
              <>
                <span className="footer-price-label">Selected room · {hotel.rooms[selectedRoomIndex].type}</span>
                <div className="footer-price-val"><span>{hotel.currency}</span><strong>{typeof hotel.rooms[selectedRoomIndex].price === 'number' ? hotel.rooms[selectedRoomIndex].price.toLocaleString() : 'Price unavailable'}</strong><span> / night · {typeof hotel.rooms[selectedRoomIndex].maxGuests === 'number' ? `up to ${hotel.rooms[selectedRoomIndex].maxGuests} guests` : 'capacity not listed'}</span></div>
              </>
            ) : <span className="footer-price-label">Select a room above to continue</span>}
          </div>

          <div className="hotel-modal__footer-actions">
            <Button variant="outline" size="md" onClick={onClose}>
              Close Preview
            </Button>
            <Button variant="text" size="md" onClick={() => onViewFullDetails?.(hotel)}>
              View Full Details
            </Button>
            <Button
              variant="accent"
              size="md"
              disabled={!Number.isInteger(selectedRoomIndex) || !hotel.rooms?.[selectedRoomIndex]}
              onClick={() => onBookNow && onBookNow(hotel, hotel.rooms[selectedRoomIndex])}
            >
              Continue with selected room
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
