import { useRef, useState } from 'react';
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
import './HotelDetailPage.css';

const formatPrice = (currency, amount) =>
  `${currency || ''}${typeof amount === 'number' ? amount.toLocaleString('en-IN') : 'Not provided'}`;

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
      : null
  );
  const [imageErrors, setImageErrors] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const pendingCheckout = useRef(false);
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

  const gallery = (Array.isArray(hotel.gallery) && hotel.gallery.length ? hotel.gallery : [hotel.image])
    .filter(Boolean);
  const matchingTours = SAMPLE_TOURS.filter(
    (tour) => tour.destination?.trim().toLowerCase() === hotel.destination?.trim().toLowerCase()
  );
  const listedRoomPrices = (hotel.rooms || []).map((room) => room.price).filter((price) => Number.isFinite(price));
  const lowestRoomPrice = listedRoomPrices.length ? Math.min(...listedRoomPrices) : null;
  const toggleTour = (tourId) => {
    setSelectedTours((selected) => selected.includes(tourId)
      ? selected.filter((id) => id !== tourId)
      : [...selected, tourId]);
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
          <nav className="hotel-detail-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link><span aria-hidden="true">/</span><Link to={backTo}>Back to browsing</Link><span aria-hidden="true">/</span><span aria-current="page">{hotel.name}</span>
          </nav>

          <section className="hotel-detail-heading" aria-labelledby="hotel-detail-title">
            <div>
              <Badge variant="accent" size="sm">{hotel.badge || 'GrandStay property'}</Badge>
              <h1 id="hotel-detail-title">{hotel.name}</h1>
              <p className="hotel-detail-rating">{hotel.rating} / 5 <span aria-label={`${hotel.reviewCount} reviews`}>★</span> ({hotel.reviewCount} reviews)</p>
              <p className="hotel-detail-location"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>{hotel.location}</p>
            </div>
            <div className="hotel-detail-heading__actions">
              <Link className="hotel-detail-back-link" to={backTo}>Back to results</Link>
            </div>
          </section>

          <div className="property-detail-layout">
          <div className="property-detail-content">
          <section className="hotel-detail-section property-gallery-section" aria-label="Hotel photo gallery">
            <div className="hotel-gallery__caption"><span className="hotel-detail-eyebrow">Discover the property</span><span className="hotel-detail-muted">{gallery.length} {gallery.length === 1 ? 'photo' : 'photos'}</span></div>
            {gallery.length ? (
              <div className={`hotel-gallery ${gallery.length === 1 ? 'hotel-gallery--single' : ''}`}>
                {gallery.slice(0, 3).map((photo, index) => (
                  <div className="hotel-gallery__item" key={`${photo}-${index}`}>
                    {!imageErrors.includes(index) ? <img src={photo} alt={`${hotel.name} property view ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} onError={() => setImageErrors((current) => [...current, index])} /> : <div className="hotel-gallery__fallback" role="img" aria-label={`Image unavailable for ${hotel.name}`}><span>Property photo unavailable</span></div>}
                  </div>
                ))}
              </div>
            ) : <p className="hotel-detail-empty-note">No property photos are available.</p>}
          </section>

          <section className="hotel-detail-section hotel-overview" aria-labelledby="overview-title">
            <div className="hotel-detail-section__heading">
              <div><span className="hotel-detail-eyebrow">About this stay</span><h2 id="overview-title">Property overview</h2></div>
              <span className="hotel-detail-muted">{hotel.destination}</span>
            </div>
            <p>{hotel.description || 'No description is available.'}</p>
          </section>

          <section className="hotel-detail-section" aria-labelledby="amenities-title">
            <div className="hotel-detail-section__heading"><div><span className="hotel-detail-eyebrow">Included with your stay</span><h2 id="amenities-title">Amenities</h2></div></div>
            <ul className="hotel-amenities" aria-label="Hotel amenities">{(hotel.amenities || []).map((amenity) => <li key={amenity}>{amenity}</li>)}</ul>
          </section>

          <section className="hotel-detail-section" aria-labelledby="rooms-title">
            <div className="hotel-detail-section__heading">
              <div><span className="hotel-detail-eyebrow">Choose your room</span><h2 id="rooms-title">Select Rooms</h2></div>
              <span className="hotel-detail-muted">Availability has not been confirmed</span>
            </div>
            {hotel.rooms?.length ? (
              <div className="room-table-scroll" role="region" aria-label="Room comparison table" tabIndex="0">
                <table className="room-comparison-table">
                  <caption>Room details and listed nightly prices for {hotel.name}</caption>
                  <thead><tr><th scope="col">Room</th><th scope="col">Price</th><th scope="col">Guest capacity</th><th scope="col">Bed / features</th><th scope="col">Next step</th></tr></thead>
                  <tbody>{hotel.rooms.map((room, index) => (
                    <tr key={`${room.type || 'room'}-${index}`} className={selectedRoomIndex === index ? 'room-comparison-row--selected' : ''}>
                      <th scope="row">{room.type || 'Not provided'}</th>
                      <td>{formatPrice(hotel.currency, room.price)}{typeof room.price === 'number' && <span className="room-price-unit"> / night</span>}</td>
                      <td>{typeof room.maxGuests === 'number' ? `Up to ${room.maxGuests} guests` : 'Not provided'}</td>
                      <td>{room.bed || 'Not provided'}{room.amenities?.length ? <span className="room-feature-list">{room.amenities.join(', ')}</span> : null}</td>
                      <td><Button size="sm" variant={selectedRoomIndex === index ? 'secondary' : 'outline'} aria-pressed={selectedRoomIndex === index} aria-label={selectedRoomIndex === index ? `Deselect ${room.type || 'selected room'}` : `Select ${room.type || 'room'}`} onClick={() => setSelectedRoomIndex((current) => current === index ? null : index)}>{selectedRoomIndex === index ? 'Deselect Room' : 'Select Room'}</Button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="hotel-detail-empty-note">No room options are listed for this property.</p>}
          </section>

          <section className="hotel-detail-section" aria-labelledby="tours-title">
            <div className="hotel-detail-section__heading">
              <div><span className="hotel-detail-eyebrow">Choose experiences separately</span><h2 id="tours-title">Optional sightseeing tours</h2></div>
              <Badge variant="neutral" size="sm">Optional add-ons</Badge>
            </div>
            <p className="hotel-tour-intro">Tours are optional and are not included in the room price. Selection is only a local page preview; it does not create a booking.</p>
            {matchingTours.length ? (
              <div className="hotel-tour-list">
                {matchingTours.map((tour) => {
                  const isSelected = selectedTours.includes(tour.id);
                  return (
                    <article className={`hotel-tour-card ${isSelected ? 'hotel-tour-card--selected' : ''}`} key={tour.id}>
                      <div className="hotel-tour-card__content">
                        <div className="hotel-tour-card__topline"><Badge variant="accent" size="sm">{tour.badge || 'Tour package'}</Badge><span>{tour.duration || 'Duration not provided'}</span></div>
                        <h3>{tour.title}</h3>
                        <p className="hotel-tour-card__price">{formatPrice(tour.currency, tour.price)} <span>{tour.priceType ? tour.priceType : 'pricing unit not provided'}</span></p>
                        {(tour.transport || tour.guide || tour.meals) && <ul className="hotel-tour-facts">{tour.transport && <li><strong>Transport:</strong> {tour.transport}</li>}{tour.guide && <li><strong>Guide:</strong> {tour.guide}</li>}{tour.meals && <li><strong>Meals:</strong> {tour.meals}</li>}</ul>}
                        {tour.highlights?.length > 0 && <p className="hotel-tour-highlights"><strong>Highlights:</strong> {tour.highlights.join(' · ')}</p>}
                      </div>
                      <Button
                        variant={isSelected ? 'secondary' : 'outline'}
                        size="sm"
                        aria-pressed={isSelected}
                        onClick={() => toggleTour(tour.id)}
                      >{isSelected ? 'Remove tour' : 'Select optional tour'}</Button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="hotel-detail-empty-note">No sightseeing tours are listed for {hotel.destination}. Browse the hotel’s room details without an add-on.</p>
            )}
            {selectedTours.length > 0 && <p className="hotel-tour-selection" role="status">{selectedTours.length} optional {selectedTours.length === 1 ? 'tour' : 'tours'} selected for this page preview. Prices are shown individually; no combined total is calculated.</p>}
            {!Number.isInteger(selectedRoomIndex) && <p className="hotel-detail-empty-note">Select a room above to continue. You can choose tours before or after selecting a room.</p>}
          </section>

          <section className="hotel-detail-section hotel-policies" aria-labelledby="policies-title">
            <div className="hotel-detail-section__heading"><div><span className="hotel-detail-eyebrow">Before your stay</span><h2 id="policies-title">Property policies</h2></div></div>
            <dl><div><dt>Check-in</dt><dd>{hotel.policies?.checkIn || 'Not provided'}</dd></div><div><dt>Check-out</dt><dd>{hotel.policies?.checkOut || 'Not provided'}</dd></div><div><dt>Cancellation</dt><dd>{hotel.policies?.cancellation || 'Not provided'}</dd></div></dl>
          </section>
          </div>
          <aside className="property-booking-card" aria-labelledby="hotel-booking-title">
            <span className="hotel-detail-eyebrow">Your stay</span><h2 id="hotel-booking-title">Booking summary</h2>
            <div className="property-booking-fields">
              <div className="property-booking-date-field">
                <label htmlFor="hotel-detail-date-range">Travel dates</label>
                <DateRangePicker id="hotel-detail-date-range" dates={{ checkIn, checkOut }} onChange={(nextDates) => { setCheckIn(nextDates.checkIn); setCheckOut(nextDates.checkOut); }} label="Travel dates" triggerClassName="date-range-picker-trigger" valueClassName="date-range-picker-trigger__value" />
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
            <div className="property-booking-selection"><span>Selected room</span><strong>{Number.isInteger(selectedRoomIndex) && hotel.rooms?.[selectedRoomIndex] ? hotel.rooms[selectedRoomIndex].type : 'Choose a room below'}</strong></div>
            <dl className="property-booking-price">
              <div><dt>{Number.isInteger(selectedRoomIndex) && hotel.rooms?.[selectedRoomIndex] ? 'Room rate' : 'Rooms start from'}</dt><dd>{Number.isInteger(selectedRoomIndex) && hotel.rooms?.[selectedRoomIndex] ? formatPrice(hotel.currency, hotel.rooms[selectedRoomIndex].price) : lowestRoomPrice === null ? 'Not provided' : formatPrice(hotel.currency, lowestRoomPrice)}</dd></div>
              <div><dt>Price basis</dt><dd>per night</dd></div>
            </dl>
            <p className="property-booking-note">Taxes and fees are not calculated in this demo. Availability is not confirmed.</p>
            <Button className="property-booking-submit" variant="primary" size="lg" onClick={goToCheckout} disabled={!Number.isInteger(selectedRoomIndex) || !hotel.rooms?.[selectedRoomIndex]}>Book This Now</Button>
            {!Number.isInteger(selectedRoomIndex) && <p className="property-booking-hint">Select a room to continue.</p>}
          </aside>
          </div>
        </Container>
      </main>
      <Footer />
      <SignInModal key={authMode} isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onLoginSuccess={handleLoginSuccess} initialMode={authMode} />
    </div>
  );
}
