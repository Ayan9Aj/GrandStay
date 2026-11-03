import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/common/Badge/Badge';
import Button from '../../components/common/Button/Button';
import Container from '../../components/layout/Container/Container';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Footer from '../../components/layout/Footer/Footer';
import Header from '../../components/layout/Header/Header';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import { clearActiveUserSession, getActiveUserSession } from '../../data/authSession';
import { getVillaById } from '../../services/villaService';
import { getDefaultRentalDates, getRentalNights } from '../../utils/rentalDates';
import DateRangePicker from '../../components/common/DateRangePicker/DateRangePicker';
import GuestRoomSelector from '../../components/common/GuestRoomSelector/GuestRoomSelector';
import { UsersIcon } from '../../components/common/Icons';
import './VillaDetailPage.css';

const formatMoney = (currency, amount) => `${currency || ''}${amount.toLocaleString('en-IN')}`;

export default function VillaDetailPage() {
  const { villaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const villa = getVillaById(villaId);
  const defaults = getDefaultRentalDates();
  const bookingState = location.state?.booking || {};
  const params = new URLSearchParams(location.search);
  const [checkIn, setCheckIn] = useState(bookingState.checkIn || params.get('checkIn') || defaults.checkIn);
  const [checkOut, setCheckOut] = useState(bookingState.checkOut || params.get('checkOut') || defaults.checkOut);
  const [guestCount, setGuestCount] = useState(String(bookingState.guests || params.get('guests') || Math.min(2, villa?.guestCapacity || 2)));
  const [imageErrors, setImageErrors] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const pendingBooking = useRef(false);
  const nights = getRentalNights(checkIn, checkOut);
  const subtotal = nights ? nights * (villa?.pricePerNight || 0) : null;
  const gallery = (Array.isArray(villa?.gallery) && villa.gallery.length ? villa.gallery : [villa?.image]).filter(Boolean);

  const openSignIn = () => { setAuthMode('signin'); setSignInOpen(true); };
  const openRegister = () => { setAuthMode('register'); setSignInOpen(true); };
  const signOut = () => { clearActiveUserSession(); setCurrentUser(null); };
  const continueToBooking = () => {
    navigate(`/villas/${villa.id}/booking?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${encodeURIComponent(guestCount)}`, {
      state: {
        booking: { villaId: villa.id, checkIn, checkOut, guests: Number(guestCount) },
        returnTo: `${location.pathname}${location.search}`,
      },
    });
  };
  const bookWholeProperty = () => {
    if (nights === null || Number(guestCount) < 1 || Number(guestCount) > villa.guestCapacity) return;
    if (!currentUser) {
      pendingBooking.current = true;
      openSignIn();
      return;
    }
    continueToBooking();
  };
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (pendingBooking.current) {
      pendingBooking.current = false;
      continueToBooking();
    }
  };

  if (!villa) {
    return (
      <div className="hotel-detail-page">
        <Header currentUser={currentUser} onOpenSignIn={openSignIn} onOpenRegister={openRegister} onSignOut={signOut} />
        <main className="hotel-detail-main"><Container size="lg">
          <nav className="hotel-detail-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/villas">Villas &amp; Bungalows</Link></nav>
          <EmptyState title="Private stay not found" description="This villa or bungalow is not in the current property catalog." actionText="Browse private stays" onAction={() => navigate('/villas')} />
        </Container></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="hotel-detail-page villa-detail-page">
      <Header currentUser={currentUser} onOpenSignIn={openSignIn} onOpenRegister={openRegister} onSignOut={signOut} />
      <main id="main-content" className="hotel-detail-main">
        <Container size="lg">
          <nav className="hotel-detail-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/villas">Villas &amp; Bungalows</Link><span aria-hidden="true">/</span><span aria-current="page">{villa.name}</span>
          </nav>
          <section className="hotel-detail-heading">
            <div>
              <Badge variant="accent" size="sm">{villa.rentalCategory}</Badge>
              <h1>{villa.name}</h1>
              <p className="hotel-detail-rating">{villa.rating} / 5 <span aria-label={`${villa.reviewCount} reviews`}>★</span> ({villa.reviewCount} reviews)</p>
              <p className="hotel-detail-location"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>{villa.location}</p>
            </div>
            <div className="hotel-detail-heading__actions"><Link className="hotel-detail-back-link" to="/villas">Back to private stays</Link></div>
          </section>

          <div className="property-detail-layout villa-detail-layout">
          <div className="property-detail-content">
          <section className="hotel-detail-section property-gallery-section" aria-label="Villa photo gallery">
            <div className="hotel-gallery__caption"><span className="hotel-detail-eyebrow">Your private stay</span><span className="hotel-detail-muted">Entire property rental</span></div>
            {gallery.length ? <div className={`hotel-gallery ${gallery.length === 1 ? 'hotel-gallery--single' : ''}`}>
              {gallery.slice(0, 3).map((image, index) => (
                <div className="hotel-gallery__item" key={`${image}-${index}`}>
                  {!imageErrors.includes(index) ? (
                    <img src={image} alt={`${villa.name} view ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} onError={() => setImageErrors((current) => [...current, index])} />
                  ) : <div className="hotel-gallery__fallback" role="img" aria-label={`Photo unavailable for ${villa.name}`}>Property photo unavailable</div>}
                </div>
              ))}
            </div> : <p className="hotel-detail-empty-note">No property photos are available.</p>}
          </section>

          <section className="hotel-detail-section hotel-overview" aria-labelledby="villa-overview-title">
            <div className="hotel-detail-section__heading"><div><span className="hotel-detail-eyebrow">About this private stay</span><h2 id="villa-overview-title">Property overview</h2></div><span className="hotel-detail-muted">{villa.destination}</span></div>
            <p>{villa.description}</p>
            <dl className="villa-facts">
              <div><dt>Rental type</dt><dd>{villa.rentalCategory}</dd></div>
              <div><dt>Guest capacity</dt><dd>Up to {villa.guestCapacity} guests</dd></div>
              <div><dt>Bedrooms</dt><dd>{villa.bedrooms}</dd></div>
              <div><dt>Bathrooms</dt><dd>{villa.bathrooms}</dd></div>
              <div><dt>Guest rating</dt><dd>{villa.rating} / 5 ({villa.reviewCount} reviews)</dd></div>
            </dl>
          </section>

          <section className="hotel-detail-section" aria-labelledby="villa-amenities-title">
            <div className="hotel-detail-section__heading"><div><span className="hotel-detail-eyebrow">Included with the whole home</span><h2 id="villa-amenities-title">Amenities</h2></div></div>
            <ul className="hotel-amenities" aria-label="Included amenities">{villa.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul>
          </section>
          <section className="hotel-detail-section villa-stay-details" aria-labelledby="villa-stay-title">
            <div className="hotel-detail-section__heading">
              <div>
                <span className="hotel-detail-eyebrow">Private whole-property stay</span>
                <h2 id="villa-stay-title">Your private rental</h2>
              </div>
            </div>
            <p className="villa-stay-description">The villa or bungalow is reserved as one private unit for your group. The estimate updates with your selected dates.</p>
            <div className="villa-stay-grid">
              <div className="villa-stay-tile">
                <div className="villa-stay-tile__icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div className="villa-stay-tile__content">
                  <span className="villa-stay-tile__label">Rental Category</span>
                  <strong className="villa-stay-tile__value">{villa.rentalCategory}</strong>
                </div>
              </div>

              <div className="villa-stay-tile">
                <div className="villa-stay-tile__icon" aria-hidden="true">
                  <UsersIcon size={22} />
                </div>
                <div className="villa-stay-tile__content">
                  <span className="villa-stay-tile__label">Guest Capacity</span>
                  <strong className="villa-stay-tile__value">Up to {villa.guestCapacity} guests</strong>
                </div>
              </div>

              <div className="villa-stay-tile">
                <div className="villa-stay-tile__icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
                  </svg>
                </div>
                <div className="villa-stay-tile__content">
                  <span className="villa-stay-tile__label">Bedrooms</span>
                  <strong className="villa-stay-tile__value">{villa.bedrooms} {villa.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</strong>
                </div>
              </div>

              <div className="villa-stay-tile">
                <div className="villa-stay-tile__icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-2.12 0 1.5 1.5 0 0 0 0 2.12L7 8M4 12h16a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-3a2 2 0 0 1 2-2zM6 12V5a2 2 0 0 1 2-2h3"/>
                  </svg>
                </div>
                <div className="villa-stay-tile__content">
                  <span className="villa-stay-tile__label">Bathrooms</span>
                  <strong className="villa-stay-tile__value">{villa.bathrooms} {villa.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</strong>
                </div>
              </div>
            </div>
          </section>
          </div>
          <aside className="property-booking-card" aria-labelledby="villa-booking-summary-title">
            <span className="hotel-detail-eyebrow">YOUR STAY</span>
            <h2 id="villa-booking-summary-title">Booking Summary</h2>

            <div className="property-booking-fields">
              <div className="property-booking-date-field">
                <label htmlFor="villa-detail-date-range">Travel dates</label>
                <DateRangePicker
                  id="villa-detail-date-range"
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
                  id="villa-detail-guests"
                  label="Guests"
                  subtitle={`Up to ${villa.guestCapacity} guests`}
                  value={Number(guestCount) || 1}
                  min={1}
                  max={villa.guestCapacity}
                  singularLabel="Guest"
                  pluralLabel="Guests"
                  onChange={(val) => setGuestCount(String(val))}
                />
              </div>
            </div>

            <div className="property-booking-selection">
              <span>{villa.rentalCategory}</span>
              <strong>{villa.name}</strong>
            </div>

            {nights === null && (
              <p className="villa-rental-panel__error" role="alert">
                Check-out must be later than check-in.
              </p>
            )}
            {Number(guestCount) > villa.guestCapacity && (
              <p className="villa-rental-panel__error" role="alert">
                This private stay accommodates up to {villa.guestCapacity} guests.
              </p>
            )}

            <dl className="property-booking-price">
              <div>
                <dt>Whole-property rate</dt>
                <dd>{formatMoney(villa.currency, villa.pricePerNight)} / night</dd>
              </div>
              <div>
                <dt>Rental duration</dt>
                <dd>{nights ? `${nights} ${nights === 1 ? 'night' : 'nights'}` : 'Choose valid dates'}</dd>
              </div>
              <div className="property-booking-price__total">
                <dt>Estimated rental total</dt>
                <dd>{subtotal === null ? 'Not calculated' : formatMoney(villa.currency, subtotal)}</dd>
              </div>
            </dl>

            <p className="property-booking-note">
              Taxes and fees are estimated and finalized at checkout. Availability is subject to confirmation.
            </p>

            <Button
              className="property-booking-submit"
              variant="primary"
              size="lg"
              onClick={bookWholeProperty}
              disabled={nights === null || Number(guestCount) < 1 || Number(guestCount) > villa.guestCapacity}
            >
              Book This Now
            </Button>
          </aside>
          </div>
        </Container>
      </main>
      <Footer />
      <SignInModal key={authMode} isOpen={isSignInOpen} onClose={() => setSignInOpen(false)} onLoginSuccess={handleLoginSuccess} initialMode={authMode} />
    </div>
  );
}
