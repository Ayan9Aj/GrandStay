import { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/common/Badge/Badge';
import Button from '../../components/common/Button/Button';
import Container from '../../components/layout/Container/Container';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Footer from '../../components/layout/Footer/Footer';
import Header from '../../components/layout/Header/Header';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import { getHotelById } from '../../services/hotelService';
import { SAMPLE_TOURS } from '../../data/sampleTours';
import { clearActiveUserSession, getActiveUserSession } from '../../data/authSession';
import DateRangePicker from '../../components/common/DateRangePicker/DateRangePicker';
import GuestRoomSelector from '../../components/common/GuestRoomSelector/GuestRoomSelector';
import PropertyMap from '../../components/common/PropertyMap/PropertyMap';
import RoomGalleryModal from '../../components/common/RoomGalleryModal/RoomGalleryModal';
import './HotelDetailPage.css';

const formatPrice = (currency, amount) =>
  `${currency || '₹'}${typeof amount === 'number' ? amount.toLocaleString('en-IN') : 'Not provided'}`;

const formatReviewDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function HotelDetailPage() {
  const { hotelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const hotel = getHotelById(hotelId);

  const [selectedTours, setSelectedTours] = useState(() =>
    Array.isArray(location.state?.selectedTourIds) ? location.state.selectedTourIds : []
  );
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(() =>
    Number.isInteger(location.state?.selectedRoomIndex) && hotel?.rooms?.[location.state.selectedRoomIndex]
      ? location.state.selectedRoomIndex
      : 0 // Default to first available room
  );
  const [imageErrors, setImageErrors] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const pendingCheckout = useRef(false);

  // Room Gallery Lightbox State
  const [activeGalleryRoom, setActiveGalleryRoom] = useState(null);

  // Review Filters State
  const [travelerTypeFilter, setTravelerTypeFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [sortFilter, setSortFilter] = useState('recent');
  const [helpfulVotes, setHelpfulVotes] = useState({});

  // FAQ Accordion State
  const [openFaqIndices, setOpenFaqIndices] = useState([0]); // First FAQ open by default

  const openSignIn = () => { setAuthMode('signin'); setIsSignInOpen(true); };
  const openRegister = () => { setAuthMode('register'); setIsSignInOpen(true); };

  const backTo = location.state?.from?.startsWith('/') ? location.state.from : '/hotels';
  const sourceParams = new URLSearchParams(location.search);
  if (location.state?.from) {
    const fromParams = new URL(location.state.from, window.location.origin).searchParams;
    ['checkIn', 'checkOut', 'guests'].forEach((key) => {
      if (!sourceParams.get(key)) sourceParams.set(key, fromParams.get(key) || '');
    });
  }
  const [checkIn, setCheckIn] = useState(sourceParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(sourceParams.get('checkOut') || '');
  const [guestCount, setGuestCount] = useState(sourceParams.get('guests') || '2');

  const gallery = useMemo(() => {
    return (Array.isArray(hotel?.gallery) && hotel.gallery.length ? hotel.gallery : [hotel?.image]).filter(Boolean);
  }, [hotel]);

  const matchingTours = useMemo(() => {
    if (!hotel?.destination) return [];
    return SAMPLE_TOURS.filter(
      (tour) => tour.destination?.trim().toLowerCase() === hotel.destination?.trim().toLowerCase()
    );
  }, [hotel]);

  const listedRoomPrices = useMemo(() => {
    return (hotel?.rooms || []).map((room) => room.price).filter((price) => Number.isFinite(price));
  }, [hotel]);

  const lowestRoomPrice = listedRoomPrices.length ? Math.min(...listedRoomPrices) : null;

  // Filtered & Sorted Reviews
  const filteredReviews = useMemo(() => {
    const rawReviews = Array.isArray(hotel?.reviews) ? [...hotel.reviews] : [];
    const now = new Date('2026-11-03T00:00:00Z');

    return rawReviews
      .filter((rev) => {
        // Traveler Type Filter
        if (travelerTypeFilter !== 'All') {
          if (travelerTypeFilter === 'Couples' && rev.travelerType !== 'Couples') return false;
          if (travelerTypeFilter === 'Families' && rev.travelerType !== 'Families') return false;
          if (travelerTypeFilter === 'Solo Travelers' && rev.travelerType !== 'Solo Travelers') return false;
          if (travelerTypeFilter === 'Business' && rev.travelerType !== 'Business') return false;
          if (travelerTypeFilter === 'Friends' && rev.travelerType !== 'Friends') return false;
        }

        // Star Rating Filter
        if (ratingFilter !== 'All') {
          const numRating = Number(ratingFilter);
          if (rev.rating < numRating) return false;
        }

        // Review Date Filter
        if (dateFilter !== 'All' && rev.date) {
          const revTime = new Date(rev.date).getTime();
          if (dateFilter === '3months') {
            const threeMonthsAgo = new Date(now).setMonth(now.getMonth() - 3);
            if (revTime < threeMonthsAgo) return false;
          } else if (dateFilter === '6months') {
            const sixMonthsAgo = new Date(now).setMonth(now.getMonth() - 6);
            if (revTime < sixMonthsAgo) return false;
          } else if (dateFilter === '12months') {
            const twelveMonthsAgo = new Date(now).setFullYear(now.getFullYear() - 1);
            if (revTime < twelveMonthsAgo) return false;
          } else if (dateFilter === '2026') {
            if (!rev.date.startsWith('2026')) return false;
          } else if (dateFilter === '2025') {
            if (!rev.date.startsWith('2025')) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortFilter === 'highest') return b.rating - a.rating;
        if (sortFilter === 'lowest') return a.rating - b.rating;
        // Default: most recent
        return new Date(b.date || 0) - new Date(a.date || 0);
      });
  }, [hotel, travelerTypeFilter, ratingFilter, dateFilter, sortFilter]);

  if (!hotel) {
    return (
      <div className="hotel-detail-page">
        <Header currentUser={currentUser} onSignOut={() => { clearActiveUserSession(); setCurrentUser(null); }} onOpenSignIn={openSignIn} onOpenRegister={openRegister} />
        <main className="hotel-detail-main">
          <Container size="lg">
            <nav className="hotel-detail-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link><span aria-hidden="true">/</span><Link to={backTo}>Hotel Catalog</Link>
            </nav>
            <EmptyState
              title="Hotel not found"
              description="This hotel ID does not match a property in the current catalog. Return to the catalog to choose a listed hotel."
              actionText="Back to Hotel Catalog"
              onAction={() => navigate(backTo)}
            />
          </Container>
        </main>
        <Footer />
        <SignInModal key={authMode} isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onLoginSuccess={setCurrentUser} initialMode={authMode} />
      </div>
    );
  }

  const toggleTour = (tourId) => {
    setSelectedTours((selected) =>
      selected.includes(tourId) ? selected.filter((id) => id !== tourId) : [...selected, tourId]
    );
  };

  const toggleFaq = (index) => {
    setOpenFaqIndices((current) =>
      current.includes(index) ? current.filter((i) => i !== index) : [...current, index]
    );
  };

  const handleVoteHelpful = (reviewId, initialCount = 0) => {
    setHelpfulVotes((prev) => {
      const isVoted = prev[reviewId]?.voted;
      return {
        ...prev,
        [reviewId]: {
          voted: !isVoted,
          count: isVoted ? (prev[reviewId]?.count || initialCount) - 1 : (prev[reviewId]?.count || initialCount) + 1,
        },
      };
    });
  };

  const continueToCheckout = () => {
    if (!Number.isInteger(selectedRoomIndex) || !hotel.rooms?.[selectedRoomIndex]) return;
    navigate('/booking', {
      state: {
        booking: {
          hotelId: hotel.id,
          roomIndex: selectedRoomIndex,
          checkIn,
          checkOut,
          guests: guestCount,
          tourIds: selectedTours,
        },
        returnTo: `${location.pathname}${location.search}`,
        browseTo: backTo,
      },
    });
  };

  const goToCheckout = () => {
    if (!currentUser) {
      pendingCheckout.current = true;
      openSignIn();
      return;
    }
    continueToCheckout();
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (pendingCheckout.current) {
      pendingCheckout.current = false;
      continueToCheckout();
    }
  };

  // Group nearby places by category
  const nearbyByCategory = (hotel.nearbyPlaces || []).reduce((acc, item) => {
    const cat = item.category || 'General Attractions';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="hotel-detail-page">
      <Header
        currentUser={currentUser}
        onOpenSignIn={openSignIn}
        onOpenRegister={openRegister}
        onSignOut={() => { clearActiveUserSession(); setCurrentUser(null); }}
      />

      <main id="main-content" className="hotel-detail-main">
        <Container size="lg">
          {/* Breadcrumb Navigation */}
          <nav className="hotel-detail-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span aria-hidden="true">/</span>
            <Link to={backTo}>Back to browsing</Link><span aria-hidden="true">/</span>
            <span aria-current="page">{hotel.name}</span>
          </nav>

          {/* Hotel Heading Banner */}
          <section className="hotel-detail-heading" aria-labelledby="hotel-detail-title">
            <div>
              <Badge variant="accent" size="sm">{hotel.badge || 'GrandStay Property'}</Badge>
              <h1 id="hotel-detail-title">{hotel.name}</h1>
              <p className="hotel-detail-rating">
                {hotel.rating} / 5 <span aria-label={`${hotel.reviewCount} reviews`}>★</span> ({hotel.reviewCount} reviews)
              </p>
              <p className="hotel-detail-location">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>
                {hotel.location}
              </p>
            </div>
            <div className="hotel-detail-heading__actions">
              <Link className="hotel-detail-back-link" to={backTo}>Back to results</Link>
            </div>
          </section>

          {/* 2-Column Split: Main Content + Sticky Booking Summary */}
          <div className="property-detail-layout">
            <div className="property-detail-content">

              {/* General Property Photo Gallery */}
              <section className="hotel-detail-section property-gallery-section" aria-label="Hotel photo gallery">
                <div className="hotel-gallery__caption">
                  <span className="hotel-detail-eyebrow">Discover the property</span>
                  <span className="hotel-detail-muted">{gallery.length} {gallery.length === 1 ? 'photo' : 'photos'}</span>
                </div>
                {gallery.length ? (
                  <div className={`hotel-gallery ${gallery.length === 1 ? 'hotel-gallery--single' : ''}`}>
                    {gallery.slice(0, 3).map((photo, index) => (
                      <div className="hotel-gallery__item" key={`${photo}-${index}`}>
                        {!imageErrors.includes(index) ? (
                          <img
                            src={photo}
                            alt={`${hotel.name} view ${index + 1}`}
                            loading={index === 0 ? 'eager' : 'lazy'}
                            onError={() => setImageErrors((current) => [...current, index])}
                          />
                        ) : (
                          <div className="hotel-gallery__fallback" role="img" aria-label={`Image unavailable for ${hotel.name}`}>
                            <span>Property photo unavailable</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="hotel-detail-empty-note">No property photos are available.</p>
                )}
              </section>

              {/* Property Overview */}
              <section className="hotel-detail-section hotel-overview" aria-labelledby="overview-title">
                <div className="hotel-detail-section__heading">
                  <div>
                    <span className="hotel-detail-eyebrow">About this stay</span>
                    <h2 id="overview-title">Property overview</h2>
                  </div>
                  <span className="hotel-detail-muted">{hotel.destination}</span>
                </div>
                <p>{hotel.description || 'No description is available.'}</p>
              </section>

              {/* Property-Wide Amenities */}
              <section className="hotel-detail-section" aria-labelledby="amenities-title">
                <div className="hotel-detail-section__heading">
                  <div>
                    <span className="hotel-detail-eyebrow">Included with your stay</span>
                    <h2 id="amenities-title">Property Amenities</h2>
                  </div>
                </div>
                <ul className="hotel-amenities" aria-label="Hotel amenities">
                  {(hotel.amenities || []).map((amenity) => (
                    <li key={amenity}>{amenity}</li>
                  ))}
                </ul>
              </section>

              {/* Phase 2: Room Comparison & Room-Specific Photo Galleries */}
              <section className="hotel-detail-section room-selection-section" aria-labelledby="rooms-title">
                <div className="hotel-detail-section__heading">
                  <div>
                    <span className="hotel-detail-eyebrow">Choose your room</span>
                    <h2 id="rooms-title">Available Rooms &amp; Suites</h2>
                  </div>
                  <span className="hotel-detail-muted">Select a room to update your stay total</span>
                </div>

                {hotel.rooms?.length ? (
                  <div className="room-cards-grid" role="region" aria-label="Room selection options">
                    {hotel.rooms.map((room, index) => {
                      const isSelected = selectedRoomIndex === index;
                      const roomImages = Array.isArray(room.gallery) && room.gallery.length ? room.gallery : [hotel.image];
                      const primaryImage = roomImages[0];

                      return (
                        <article
                          key={room.id || `${room.type}-${index}`}
                          className={`room-detail-card ${isSelected ? 'room-detail-card--selected' : ''}`}
                        >
                          {/* Room Card Photo Preview */}
                          <div className="room-detail-card__media">
                            <img
                              src={primaryImage}
                              alt={`${room.type} primary preview`}
                              loading="lazy"
                              className="room-detail-card__img"
                            />
                            <button
                              type="button"
                              className="room-detail-card__gallery-btn"
                              onClick={() => setActiveGalleryRoom(room)}
                              aria-label={`View all ${roomImages.length} photos of ${room.type}`}
                            >
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                              </svg>
                              <span>{roomImages.length} Photos</span>
                            </button>
                          </div>

                          {/* Room Content */}
                          <div className="room-detail-card__body">
                            <div className="room-detail-card__header">
                              <div>
                                <h3 className="room-detail-card__title">{room.type}</h3>
                                {room.view && <p className="room-detail-card__view">{room.view}</p>}
                              </div>
                              <div className="room-detail-card__price-wrap">
                                <span className="room-detail-card__price">
                                  {formatPrice(hotel.currency, room.price)}
                                </span>
                                <span className="room-detail-card__price-unit">/ night</span>
                              </div>
                            </div>

                            {/* Key Spec Strip */}
                            <div className="room-detail-card__specs">
                              {(room.sizeSqFt || room.sizeSqM) && (
                                <div className="room-spec-item">
                                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 3H3v18h18V3zM9 9h6v6H9V9z"/>
                                  </svg>
                                  <span>{room.sizeSqFt ? `${room.sizeSqFt} sq ft` : ''}{room.sizeSqM ? ` (${room.sizeSqM} m²)` : ''}</span>
                                </div>
                              )}
                              <div className="room-spec-item">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>
                                </svg>
                                <span>{room.bed || 'Bedding specified at check-in'}</span>
                              </div>
                              <div className="room-spec-item">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                                <span>Up to {room.maxGuests || 2} Guests</span>
                              </div>
                            </div>

                            {/* Room-Level Amenities */}
                            {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                              <div className="room-detail-card__amenities">
                                <strong>Room features:</strong>
                                <ul className="room-features-list">
                                  {room.amenities.map((amenity) => (
                                    <li key={amenity}>{amenity}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Card Footer: Cancellation Policy + Select Action */}
                            <div className="room-detail-card__footer">
                              <div className="room-detail-card__cancellation">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#059669" strokeWidth="2">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                                <span>{room.cancellationPolicy || 'Flexible cancellation available'}</span>
                              </div>

                              <div className="room-detail-card__actions">
                                <Button
                                  size="sm"
                                  variant={isSelected ? 'secondary' : 'outline'}
                                  aria-pressed={isSelected}
                                  onClick={() => setSelectedRoomIndex((curr) => (curr === index ? null : index))}
                                >
                                  {isSelected ? 'Selected Room ✓' : 'Select This Room'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="hotel-detail-empty-note">No room options are listed for this property.</p>
                )}
              </section>

              {/* Optional Sightseeing Tours */}
              <section className="hotel-detail-section" aria-labelledby="tours-title">
                <div className="hotel-detail-section__heading">
                  <div>
                    <span className="hotel-detail-eyebrow">Choose experiences separately</span>
                    <h2 id="tours-title">Optional Sightseeing Tours</h2>
                  </div>
                  <Badge variant="neutral" size="sm">Optional add-ons</Badge>
                </div>
                <p className="hotel-tour-intro">
                  Tours are optional and not included in room rates. Selection is preserved during checkout.
                </p>
                {matchingTours.length ? (
                  <div className="hotel-tour-list">
                    {matchingTours.map((tour) => {
                      const isSelected = selectedTours.includes(tour.id);
                      return (
                        <article className={`hotel-tour-card ${isSelected ? 'hotel-tour-card--selected' : ''}`} key={tour.id}>
                          <div className="hotel-tour-card__content">
                            <div className="hotel-tour-card__topline">
                              <Badge variant="accent" size="sm">{tour.badge || 'Tour package'}</Badge>
                              <span>{tour.duration || 'Flexible duration'}</span>
                            </div>
                            <h3>{tour.title}</h3>
                            <p className="hotel-tour-card__price">
                              {formatPrice(tour.currency, tour.price)}{' '}
                              <span>{tour.priceType || 'per booking'}</span>
                            </p>
                            {(tour.transport || tour.guide || tour.meals) && (
                              <ul className="hotel-tour-facts">
                                {tour.transport && <li><strong>Transport:</strong> {tour.transport}</li>}
                                {tour.guide && <li><strong>Guide:</strong> {tour.guide}</li>}
                                {tour.meals && <li><strong>Meals:</strong> {tour.meals}</li>}
                              </ul>
                            )}
                            {tour.highlights?.length > 0 && (
                              <p className="hotel-tour-highlights">
                                <strong>Highlights:</strong> {tour.highlights.join(' · ')}
                              </p>
                            )}
                          </div>
                          <Button
                            variant={isSelected ? 'secondary' : 'outline'}
                            size="sm"
                            aria-pressed={isSelected}
                            onClick={() => toggleTour(tour.id)}
                          >
                            {isSelected ? 'Remove Tour' : 'Select Optional Tour'}
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="hotel-detail-empty-note">
                    No sightseeing tours currently listed for {hotel.destination}. Browse rooms above to continue.
                  </p>
                )}
                {selectedTours.length > 0 && (
                  <p className="hotel-tour-selection" role="status">
                    {selectedTours.length} optional {selectedTours.length === 1 ? 'tour' : 'tours'} selected.
                  </p>
                )}
              </section>

              {/* Phase 2: Interactive Property Map & Location */}
              <section className="hotel-detail-section" aria-labelledby="map-section-title">
                <div className="hotel-detail-section__heading">
                  <div>
                    <span className="hotel-detail-eyebrow">Property Location</span>
                    <h2 id="map-section-title">Interactive Property Map</h2>
                  </div>
                  <span className="hotel-detail-muted">{hotel.location}</span>
                </div>

                <PropertyMap
                  hotelName={hotel.name}
                  locationName={hotel.location}
                  coordinates={hotel.coordinates}
                  starRating={hotel.starRating}
                />
              </section>

              {/* Phase 2: Nearby Places & Distances */}
              <section className="hotel-detail-section" aria-labelledby="nearby-section-title">
                <div className="hotel-detail-section__heading">
                  <div>
                    <span className="hotel-detail-eyebrow">Explore the surrounding area</span>
                    <h2 id="nearby-section-title">Nearby Places &amp; Distances</h2>
                  </div>
                </div>

                <div className="nearby-places-grid">
                  {Object.entries(nearbyByCategory).map(([category, items]) => (
                    <div key={category} className="nearby-category-card">
                      <h3 className="nearby-category-title">{category}</h3>
                      <ul className="nearby-places-list">
                        {items.map((place) => (
                          <li key={place.name} className="nearby-place-item">
                            <div className="nearby-place-info">
                              <span className="nearby-place-name">{place.name}</span>
                              {place.time && <span className="nearby-place-time">{place.time}</span>}
                            </div>
                            <span className="nearby-place-distance">{place.distance}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Phase 2: Reviews, Category Ratings, and Multi-Axis Filters */}
              <section className="hotel-detail-section reviews-section" aria-labelledby="reviews-section-title">
                <div className="hotel-detail-section__heading">
                  <div>
                    <span className="hotel-detail-eyebrow">Guest Impressions</span>
                    <h2 id="reviews-section-title">Guest Ratings &amp; Reviews</h2>
                  </div>
                  <span className="hotel-detail-muted">{hotel.reviewCount} total reviews</span>
                </div>

                {/* Rating Overview & Category Progress Bars */}
                {hotel.ratingCategories && (
                  <div className="rating-overview-card">
                    <div className="rating-overview-score-box">
                      <span className="rating-big-number">{hotel.rating}</span>
                      <span className="rating-out-of">out of 5</span>
                      <strong className="rating-adjective">Exceptional</strong>
                      <span className="rating-total-count">Based on {hotel.reviewCount} ratings</span>
                    </div>

                    <div className="rating-categories-bars">
                      {[
                        { label: 'Cleanliness', score: hotel.ratingCategories.cleanliness },
                        { label: 'Staff & Service', score: hotel.ratingCategories.staff },
                        { label: 'Room Comfort', score: hotel.ratingCategories.comfort },
                        { label: 'Facilities', score: hotel.ratingCategories.facilities },
                        { label: 'Value for Money', score: hotel.ratingCategories.value },
                        { label: 'Location', score: hotel.ratingCategories.location },
                      ].map((cat) => (
                        <div key={cat.label} className="rating-bar-row">
                          <span className="rating-bar-label">{cat.label}</span>
                          <div className="rating-bar-track" role="progressbar" aria-valuenow={cat.score} aria-valuemin="0" aria-valuemax="5">
                            <div className="rating-bar-fill" style={{ width: `${((cat.score || 4.5) / 5) * 100}%` }} />
                          </div>
                          <span className="rating-bar-num font-mono tabular-nums">{cat.score?.toFixed(1) || '4.8'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Multi-Axis Filters */}
                <div className="review-filters-bar" aria-label="Filter guest reviews">
                  {/* Traveler Type Segmented Tabs */}
                  <div className="review-filter-group">
                    <span className="review-filter-label">Traveler Type:</span>
                    <div className="review-tabs">
                      {['All', 'Couples', 'Families', 'Solo Travelers', 'Business', 'Friends'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`review-tab-btn ${travelerTypeFilter === type ? 'review-tab-btn--active' : ''}`}
                          onClick={() => setTravelerTypeFilter(type)}
                          aria-pressed={travelerTypeFilter === type}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dropdowns Row: Rating, Date, Sort */}
                  <div className="review-dropdowns-row">
                    <div className="review-select-wrap">
                      <label htmlFor="review-rating-filter">Rating:</label>
                      <select
                        id="review-rating-filter"
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                        className="review-select"
                      >
                        <option value="All">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                      </select>
                    </div>

                    <div className="review-select-wrap">
                      <label htmlFor="review-date-filter">Review Date:</label>
                      <select
                        id="review-date-filter"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="review-select"
                      >
                        <option value="All">All Time</option>
                        <option value="3months">Past 3 Months</option>
                        <option value="6months">Past 6 Months</option>
                        <option value="12months">Past 12 Months</option>
                        <option value="2026">Year 2026</option>
                        <option value="2025">Year 2025</option>
                      </select>
                    </div>

                    <div className="review-select-wrap">
                      <label htmlFor="review-sort-filter">Sort By:</label>
                      <select
                        id="review-sort-filter"
                        value={sortFilter}
                        onChange={(e) => setSortFilter(e.target.value)}
                        className="review-select"
                      >
                        <option value="recent">Most Recent</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Filtered Reviews List */}
                {filteredReviews.length ? (
                  <div className="reviews-list">
                    {filteredReviews.map((rev) => {
                      const voteData = helpfulVotes[rev.id] || { voted: false, count: rev.helpfulVotes || 0 };
                      return (
                        <article key={rev.id} className="review-card">
                          <header className="review-card__header">
                            <div className="review-card__author-info">
                              <div className="review-card__avatar">
                                {rev.author?.charAt(0) || 'G'}
                              </div>
                              <div>
                                <strong className="review-card__author-name">{rev.author}</strong>
                                <div className="review-card__meta">
                                  <span>{rev.travelerType}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{rev.roomStayed}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{formatReviewDate(rev.date)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="review-card__rating">
                              <span className="review-card__stars">{'★'.repeat(rev.rating)}</span>
                              <span className="review-card__rating-num">{rev.rating} / 5</span>
                            </div>
                          </header>

                          <h4 className="review-card__title">{rev.title}</h4>
                          <p className="review-card__text">{rev.comment}</p>

                          <footer className="review-card__footer">
                            <button
                              type="button"
                              className={`review-helpful-btn ${voteData.voted ? 'review-helpful-btn--voted' : ''}`}
                              onClick={() => handleVoteHelpful(rev.id, rev.helpfulVotes || 0)}
                              aria-label={`Mark review as helpful. Currently ${voteData.count} votes`}
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                              </svg>
                              <span>Helpful ({voteData.count})</span>
                            </button>
                          </footer>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="reviews-empty">
                    <p>No guest reviews match the selected filter criteria.</p>
                    <button
                      type="button"
                      className="reviews-reset-btn"
                      onClick={() => {
                        setTravelerTypeFilter('All');
                        setRatingFilter('All');
                        setDateFilter('All');
                        setSortFilter('recent');
                      }}
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </section>

              {/* Phase 2: Comprehensive Property Policies */}
              <section className="hotel-detail-section hotel-policies" aria-labelledby="policies-title">
                <div className="hotel-detail-section__heading">
                  <div>
                    <span className="hotel-detail-eyebrow">Before your stay</span>
                    <h2 id="policies-title">Property Policies &amp; Guidelines</h2>
                  </div>
                </div>

                <div className="policies-cards-grid">
                  <div className="policy-card">
                    <div className="policy-card__icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="policy-card__title">Check-in &amp; Check-out</h3>
                      <p className="policy-card__desc">
                        {hotel.policiesDetailed?.checkIn || hotel.policies?.checkIn || 'Check-in from 2:00 PM'}
                      </p>
                      <p className="policy-card__desc">
                        {hotel.policiesDetailed?.checkOut || hotel.policies?.checkOut || 'Check-out until 11:00 AM'}
                      </p>
                    </div>
                  </div>

                  <div className="policy-card">
                    <div className="policy-card__icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="policy-card__title">Age &amp; ID Requirements</h3>
                      <p className="policy-card__desc">
                        {hotel.policiesDetailed?.ageRestriction || 'Primary guest must be at least 18 years of age with a valid government ID.'}
                      </p>
                    </div>
                  </div>

                  <div className="policy-card">
                    <div className="policy-card__icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="policy-card__title">Children &amp; Extra Bedding</h3>
                      <p className="policy-card__desc">
                        {hotel.policiesDetailed?.extraBeds || 'Infant cribs provided complimentary. Rollaway beds available upon request.'}
                      </p>
                    </div>
                  </div>

                  <div className="policy-card">
                    <div className="policy-card__icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5a2 2 0 0 1-4 0c0-3 3-5 3-7a6 6 0 0 1 12 0c0 2-2 4-2 7a2 2 0 0 1-4 0c0-2 2-3 2-5a4 4 0 0 0-5-4z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="policy-card__title">Pet Policy</h3>
                      <p className="policy-card__desc">
                        {hotel.policiesDetailed?.petPolicy || 'Guide animals welcome. Contact front desk in advance for pet accommodations.'}
                      </p>
                    </div>
                  </div>

                  <div className="policy-card">
                    <div className="policy-card__icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="policy-card__title">Cancellation Policy</h3>
                      <p className="policy-card__desc">
                        {hotel.policiesDetailed?.cancellation || hotel.policies?.cancellation || 'Free cancellation up to 48 hours before arrival date.'}
                      </p>
                    </div>
                  </div>

                  <div className="policy-card">
                    <div className="policy-card__icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="policy-card__title">Payment &amp; Guarantees</h3>
                      <p className="policy-card__desc">
                        {hotel.policiesDetailed?.prepayment || 'Valid debit or credit card required to hold reservation. No upfront payment required.'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Phase 2: Property FAQ Section */}
              <section className="hotel-detail-section faq-section" aria-labelledby="faq-section-title">
                <div className="hotel-detail-section__heading">
                  <div>
                    <span className="hotel-detail-eyebrow">Got questions?</span>
                    <h2 id="faq-section-title">Frequently Asked Questions</h2>
                  </div>
                </div>

                <div className="faq-accordion" role="region" aria-label="Hotel FAQs">
                  {(hotel.faqs || []).map((faq, idx) => {
                    const isOpen = openFaqIndices.includes(idx);
                    return (
                      <div key={faq.q} className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
                        <button
                          type="button"
                          className="faq-question-btn"
                          onClick={() => toggleFaq(idx)}
                          aria-expanded={isOpen}
                        >
                          <span className="faq-question-text">{faq.q}</span>
                          <span className="faq-chevron" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="faq-answer-panel">
                            <p>{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

            </div>

            {/* Sticky Booking Summary Aside */}
            <aside className="property-booking-card" aria-labelledby="hotel-booking-title">
              <span className="hotel-detail-eyebrow">Your Stay</span>
              <h2 id="hotel-booking-title">Booking Summary</h2>

              <div className="property-booking-fields">
                <div className="property-booking-date-field">
                  <label htmlFor="hotel-detail-date-range">Travel dates</label>
                  <DateRangePicker
                    id="hotel-detail-date-range"
                    dates={{ checkIn, checkOut }}
                    onChange={(nextDates) => {
                      setCheckIn(nextDates.checkIn);
                      setCheckOut(nextDates.checkOut);
                    }}
                    label="Travel dates"
                    triggerClassName="date-range-picker-trigger"
                    valueClassName="date-range-picker-trigger__value"
                  />
                </div>

                <div className="property-booking-guest-field">
                  <GuestRoomSelector
                    mode="inline"
                    id="hotel-detail-guests"
                    label="Guests"
                    value={Number(guestCount) || 2}
                    min={1}
                    max={10}
                    singularLabel="Guest"
                    pluralLabel="Guests"
                    onChange={(val) => setGuestCount(String(val))}
                  />
                </div>
              </div>

              <div className="property-booking-selection">
                <span>Selected room</span>
                <strong>
                  {Number.isInteger(selectedRoomIndex) && hotel.rooms?.[selectedRoomIndex]
                    ? hotel.rooms[selectedRoomIndex].type
                    : 'Choose a room category'}
                </strong>
              </div>

              <dl className="property-booking-price">
                <div>
                  <dt>
                    {Number.isInteger(selectedRoomIndex) && hotel.rooms?.[selectedRoomIndex]
                      ? 'Room rate'
                      : 'Rooms start from'}
                  </dt>
                  <dd>
                    {Number.isInteger(selectedRoomIndex) && hotel.rooms?.[selectedRoomIndex]
                      ? formatPrice(hotel.currency, hotel.rooms[selectedRoomIndex].price)
                      : lowestRoomPrice === null
                      ? 'Not provided'
                      : formatPrice(hotel.currency, lowestRoomPrice)}
                  </dd>
                </div>
                <div>
                  <dt>Price basis</dt>
                  <dd>per night</dd>
                </div>
              </dl>

              {/* Clean customer copy with zero banned words (Correction 6) */}
              <p className="property-booking-note">
                Taxes and fees are estimated and finalized at checkout. Availability is subject to confirmation.
              </p>

              <Button
                className="property-booking-submit"
                variant="primary"
                size="lg"
                onClick={goToCheckout}
                disabled={!Number.isInteger(selectedRoomIndex) || !hotel.rooms?.[selectedRoomIndex]}
              >
                Book This Now
              </Button>

              {!Number.isInteger(selectedRoomIndex) && (
                <p className="property-booking-hint">Select a room above to proceed to checkout.</p>
              )}
            </aside>
          </div>
        </Container>
      </main>

      <Footer />

      {/* Reusable Room Photo Gallery Lightbox */}
      <RoomGalleryModal
        isOpen={Boolean(activeGalleryRoom)}
        onClose={() => setActiveGalleryRoom(null)}
        roomName={activeGalleryRoom?.type || 'Room Gallery'}
        hotelName={hotel.name}
        images={activeGalleryRoom?.gallery || []}
      />

      {/* Sign In / Register Modal */}
      <SignInModal
        key={authMode}
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
      />
    </div>
  );
}
