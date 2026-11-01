import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge/Badge';
import Button from '../../components/common/Button/Button';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Input from '../../components/common/Input/Input';
import DateRangePicker from '../../components/common/DateRangePicker/DateRangePicker';
import Container from '../../components/layout/Container/Container';
import Footer from '../../components/layout/Footer/Footer';
import Header from '../../components/layout/Header/Header';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import { SAMPLE_TOURS } from '../../data/sampleTours';
import { clearActiveUserSession, getActiveUserSession } from '../../data/authSession';
import { getHotelById } from '../../services/hotelService';
import './BookingPage.css';

const isDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '')
  && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

const calculateNights = (checkIn, checkOut) => {
  if (!isDateOnly(checkIn) || !isDateOnly(checkOut)) return null;
  const difference = new Date(`${checkOut}T00:00:00Z`) - new Date(`${checkIn}T00:00:00Z`);
  return difference > 0 ? difference / 86400000 : null;
};

const safeInternalPath = (path, fallback) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : fallback;

const money = (currency, amount) =>
  `${currency || ''}${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const calculateTourAmount = (tour, guests) => {
  if (typeof tour.price !== 'number' || !Number.isFinite(tour.price) || tour.price < 0 || !tour.currency) return null;
  const pricingRule = String(tour.priceType || '').trim().toLowerCase();
  if (pricingRule === 'per person') return Number.isInteger(guests) && guests > 0 ? tour.price * guests : null;
  if (pricingRule === 'per booking') return tour.price;
  const groupMatch = pricingRule.match(/^per group\s*\(up to (\d+) guests?\)$/);
  if (groupMatch) {
    const groupCapacity = Number(groupMatch[1]);
    return Number.isInteger(guests) && guests > 0 && guests <= groupCapacity ? tour.price : null;
  }
  return null;
};

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const previousPath = useRef(null);
  const confirmationHeading = useRef(null);
  const booking = location.state?.booking;
  const hotel = booking?.hotelId ? getHotelById(booking.hotelId) : null;
  const selectedRoomIndex = hotel && Number.isInteger(booking?.roomIndex) && hotel.rooms?.[booking.roomIndex]
    ? booking.roomIndex
    : null;
  const room = selectedRoomIndex === null ? null : hotel.rooms[selectedRoomIndex];
  const returnTo = safeInternalPath(location.state?.returnTo, hotel ? `/hotels/${hotel.id}` : '/hotels');
  const browseTo = safeInternalPath(location.state?.browseTo, '/hotels');
  const [checkIn, setCheckIn] = useState(booking?.checkIn || '');
  const [checkOut, setCheckOut] = useState(booking?.checkOut || '');
  const [guestCount, setGuestCount] = useState(booking?.guests || '');
  const [guest, setGuest] = useState({ fullName: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setIsSignInOpen] = useState(() => !getActiveUserSession() && Boolean(booking?.hotelId));
  const [authMode, setAuthMode] = useState('signin');

  useLayoutEffect(() => {
    if (location.pathname === '/booking' && previousPath.current !== '/booking') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    previousPath.current = location.pathname;
  }, [location.pathname]);

  useLayoutEffect(() => {
    if (submitted) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      confirmationHeading.current?.focus({ preventScroll: true });
    }
  }, [submitted]);

  const selectedTours = (() => {
    if (!hotel || !Array.isArray(booking?.tourIds)) return [];
    return SAMPLE_TOURS.filter((tour) =>
      booking.tourIds.includes(tour.id)
      && tour.destination?.trim().toLowerCase() === hotel.destination?.trim().toLowerCase()
    );
  })();
  const nights = calculateNights(checkIn, checkOut);
  const hasNightlyRate = typeof room?.price === 'number' && Number.isFinite(room.price) && room.price >= 0;
  const roomSubtotal = nights !== null && hasNightlyRate ? room.price * nights : null;
  const maximumGuests = typeof room?.maxGuests === 'number' ? room.maxGuests : null;
  const parsedGuestCount = guestCount.trim() === '' ? Number.NaN : Number(guestCount);
  const isValidGuestCount = Number.isInteger(parsedGuestCount) && parsedGuestCount > 0;
  const capacityError = isValidGuestCount && maximumGuests !== null && parsedGuestCount > maximumGuests
    ? `This room accommodates up to ${maximumGuests} guests.`
    : '';
  const returnLabel = returnTo.startsWith('/hotels/') ? 'Back to hotel details' : 'Back to hotel browsing';
  const toursWithAmounts = selectedTours.map((tour) => ({
    ...tour,
    estimatedAmount: calculateTourAmount(tour, parsedGuestCount),
  }));
  const hasUnknownTourAmount = toursWithAmounts.some((tour) => tour.estimatedAmount === null);
  const tourCurrencies = new Set(selectedTours.map((tour) => tour.currency).filter(Boolean));
  const tourCurrencyMismatch = selectedTours.some((tour) => tour.currency !== hotel?.currency);
  const tourSubtotal = selectedTours.length === 0
    ? 0
    : hasUnknownTourAmount || tourCurrencies.size > 1 ? null : toursWithAmounts.reduce((sum, tour) => sum + tour.estimatedAmount, 0);
  const estimatedTotal = roomSubtotal !== null && tourSubtotal !== null && !tourCurrencyMismatch && isValidGuestCount && !capacityError
    ? roomSubtotal + tourSubtotal
    : null;

  const removeTour = (tourId) => {
    const tourIds = Array.isArray(booking.tourIds) ? booking.tourIds : [];
    const nextBooking = { ...booking, tourIds: tourIds.filter((id) => id !== tourId) };
    navigate('/booking', { replace: true, state: { ...location.state, booking: nextBooking } });
  };

  const selectRoom = (roomIndex) => {
    if (!hotel?.rooms?.[roomIndex]) return;
    const nextBooking = { ...booking, hotelId: hotel.id, roomIndex, checkIn, checkOut, guests: guestCount };
    setErrors((current) => ({ ...current, room: '', guestCount: '' }));
    navigate('/booking', { replace: true, state: { ...location.state, booking: nextBooking } });
  };

  const updateGuest = (event) => {
    const { name, value } = event.target;
    setGuest((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!room) nextErrors.room = 'Select a room before continuing.';
    if (!isDateOnly(checkIn)) nextErrors.checkIn = 'Choose a valid check-in date.';
    if (!isDateOnly(checkOut)) nextErrors.checkOut = 'Choose a valid check-out date.';
    else if (isDateOnly(checkIn) && calculateNights(checkIn, checkOut) === null) {
      nextErrors.checkOut = 'Check-out must be later than check-in.';
    }

    if (!isValidGuestCount) {
      nextErrors.guestCount = 'Enter a whole number of at least 1 guest.';
    } else if (maximumGuests !== null && parsedGuestCount > maximumGuests) {
      nextErrors.guestCount = `This room accommodates up to ${maximumGuests} guests.`;
    }

    if (!guest.fullName.trim()) nextErrors.fullName = 'Enter the lead guest’s full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(guest.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    const digits = guest.phone.replace(/\D/g, '');
    if (!/^[+()\d.\s-]+$/.test(guest.phone.trim()) || digits.length < 7 || digits.length > 15) {
      nextErrors.phone = 'Enter a phone number with 7 to 15 digits.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (room && validateForm()) setSubmitted(true);
  };

  const handleSignOut = () => {
    clearActiveUserSession();
    setCurrentUser(null);
    setIsSignInOpen(true);
  };

  return (
    <div className="booking-page">
      <Header
        currentUser={currentUser}
        onOpenSignIn={() => { setAuthMode('signin'); setIsSignInOpen(true); }}
        onOpenRegister={() => { setAuthMode('register'); setIsSignInOpen(true); }}
        onSignOut={handleSignOut}
      />
      <main id="main-content" className="booking-main">
        <Container size="lg">
          <nav className="booking-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span aria-hidden="true">/</span><Link to={browseTo}>Hotel browsing</Link><span aria-hidden="true">/</span><span aria-current="page">Booking &amp; checkout</span>
          </nav>

          {!currentUser && hotel ? (
            <section className="booking-auth-required" aria-labelledby="booking-auth-title">
              <h1 id="booking-auth-title">Sign in to continue</h1>
              <p>Your selected hotel and booking details are kept while you sign in or create an account.</p>
              <Button variant="accent" onClick={() => { setAuthMode('signin'); setIsSignInOpen(true); }}>Sign In or Register</Button>
            </section>
          ) : !hotel ? (
            <section className="booking-missing-context">
              <EmptyState
                title="Choose a hotel room first"
                description="Choose a property and room before continuing to checkout. No booking details have been entered."
                actionText="Browse hotels"
                onAction={() => navigate('/hotels')}
              />
            </section>
          ) : submitted ? (
            <section className="booking-confirmation" aria-labelledby="booking-confirmation-title" role="status">
              <Badge variant="accent" size="sm">Request summary</Badge>
              <h1 ref={confirmationHeading} tabIndex="-1" id="booking-confirmation-title">Checkout review complete</h1>
              <p>Your details were reviewed on this page. No reservation was created, no room was reserved, no booking or guest details were saved, and no payment was taken.</p>
              <p>Room availability has not been checked, and your stay is not confirmed.</p>
              <Link className="booking-return-link" to={returnTo} state={{ selectedTourIds: booking.tourIds || [], selectedRoomIndex: booking.roomIndex, from: browseTo }}>Return to hotel details</Link>
            </section>
          ) : (
            <>
              <header className="booking-heading">
                <div>
                  <span className="booking-eyebrow">Guest checkout</span>
                  <h1>Review Your Booking</h1>
                  <p>Review your stay and guest details. Submitting this page does not reserve a room or take payment.</p>
                </div>
                <Link className="booking-back-link" to={returnTo} state={{ selectedTourIds: booking.tourIds || [], selectedRoomIndex: booking.roomIndex, from: browseTo }}>{returnLabel}</Link>
              </header>

              <form className="booking-layout booking-review-layout" onSubmit={handleSubmit} noValidate>
                <section className="booking-card booking-guest-form booking-guest-panel" aria-labelledby="guest-details-title">
                  <div className="booking-card-heading"><div><span className="booking-eyebrow">Guest checkout</span><h2 id="guest-details-title">Guest details</h2></div></div>
                  <p className="booking-form-intro">Fields marked with * are required. Your details stay in this page’s memory and are not saved.</p>
                  <div className="booking-stay-inputs">
                    <div className="booking-date-field">
                      <label className="form-field__label" htmlFor="booking-date-range">Check-in / Check-out</label>
                      <DateRangePicker id="booking-date-range" dates={{ checkIn, checkOut }} onChange={(nextDates) => { setCheckIn(nextDates.checkIn); setCheckOut(nextDates.checkOut); setErrors((current) => ({ ...current, checkIn: '', checkOut: '' })); }} label="Travel dates" triggerClassName="date-range-picker-trigger" valueClassName="date-range-picker-trigger__value" ariaDescribedBy={(errors.checkIn || errors.checkOut) ? 'booking-date-range-error' : undefined} ariaInvalid={Boolean(errors.checkIn || errors.checkOut)} />
                      {(errors.checkIn || errors.checkOut) && <p id="booking-date-range-error" className="form-field__message form-field__message--error" role="alert">{errors.checkIn || errors.checkOut}</p>}
                    </div>
                    <Input label="Guests" id="booking-guests" name="guestCount" type="number" min="1" max={maximumGuests || undefined} step="1" value={guestCount} onChange={(event) => { setGuestCount(event.target.value); setErrors((current) => ({ ...current, guestCount: '' })); }} error={errors.guestCount || capacityError} helperText={maximumGuests ? `Room capacity: up to ${maximumGuests} guests.` : 'Enter the number of guests for this stay.'} required />
                  </div>
                  {nights !== null ? <p className="booking-night-count" role="status">{nights} {nights === 1 ? 'night' : 'nights'}</p> : <p className="booking-inline-note">{checkIn && checkOut && isDateOnly(checkIn) && isDateOnly(checkOut) ? 'Check-out must be later than check-in.' : 'Select valid dates with check-out after check-in to calculate the room subtotal.'}</p>}
                  <div className="booking-guest-fields">
                    <Input label="Full name" id="guest-full-name" name="fullName" autoComplete="name" value={guest.fullName} onChange={updateGuest} error={errors.fullName} required />
                    <Input label="Phone number" id="guest-phone" name="phone" type="tel" autoComplete="tel" value={guest.phone} onChange={updateGuest} error={errors.phone} required />
                    <Input label="Email address" id="guest-email" name="email" type="email" autoComplete="email" value={guest.email} onChange={updateGuest} error={errors.email} required />
                  </div>
                  {Object.values(errors).some(Boolean) && <p className="booking-form-error-summary" role="alert">Please correct the highlighted fields before continuing.</p>}
                </section>

                <div className="booking-side-column">
                  <aside className="booking-card booking-price-card booking-summary-card" aria-labelledby="price-breakdown-title">
                    <div className="booking-card-heading"><div><span className="booking-eyebrow">Your booking details</span><h2 id="price-breakdown-title">Booking summary</h2></div></div>
                    <div className="booking-property-summary">
                      {hotel.image && <img src={hotel.image} alt={`${hotel.name} property`} />}
                      <div><h3 className="booking-hotel-name">{hotel.name}</h3><p className="booking-hotel-location">{hotel.location}</p></div>
                    </div>
                    <dl className="booking-room-summary">
                      <div><dt>Check-in</dt><dd>{checkIn || 'Choose a date'}</dd></div>
                      <div><dt>Check-out</dt><dd>{checkOut || 'Choose a date'}</dd></div>
                      <div><dt>Room</dt><dd>{room?.type || 'Select a room below'}</dd></div>
                      <div><dt>Room quantity</dt><dd>1 room</dd></div>
                      <div><dt>Guests</dt><dd>{isValidGuestCount ? `${parsedGuestCount} ${parsedGuestCount === 1 ? 'guest' : 'guests'}` : 'Enter a guest count'}</dd></div>
                      <div><dt>Number of nights</dt><dd>{nights === null ? 'Choose valid dates' : nights}</dd></div>
                    </dl>
                    {room && hasNightlyRate ? (
                      <dl className="booking-price-lines">
                        <div><dt>Room rate</dt><dd>{money(hotel.currency, room.price)} / night</dd></div>
                        <div className="booking-price-subtotal"><dt>Room subtotal</dt><dd>{roomSubtotal === null ? 'Not calculated' : money(hotel.currency, roomSubtotal)}</dd></div>
                        {selectedTours.length > 0 && <div><dt>Sightseeing tour subtotal</dt><dd>{tourSubtotal === null ? 'To be confirmed' : money([...tourCurrencies][0], tourSubtotal)}</dd></div>}
                        <div><dt>Taxes and fees</dt><dd>Not calculated</dd></div>
                        <div className="booking-price-total"><dt>Estimated total before taxes/fees</dt><dd>{estimatedTotal === null ? 'To be confirmed' : money(hotel.currency, estimatedTotal)}</dd></div>
                      </dl>
                    ) : <p className="booking-inline-note">{room ? 'A room rate is not listed, so no subtotal or total is shown.' : 'Select a room below to see its rate and calculate an estimate.'}</p>}
                    <div className="booking-summary-tours">
                      <h3>Selected sightseeing tours</h3>
                      {selectedTours.length ? <ul className="booking-tour-list">{toursWithAmounts.map((tour) => <li key={tour.id}><div><strong>{tour.title}</strong><span>{typeof tour.price === 'number' ? money(tour.currency, tour.price) : 'Price not provided'} · {tour.priceType || 'pricing unit not provided'}</span><span>{tour.estimatedAmount === null ? 'Charge to be confirmed for this guest count' : `Estimated charge: ${money(tour.currency, tour.estimatedAmount)}`}</span></div><Button type="button" variant="text" size="sm" onClick={() => removeTour(tour.id)} aria-label={`Remove ${tour.title}`}>Remove</Button></li>)}</ul> : <p className="booking-inline-note">No tours selected. They are optional; you can continue without them.</p>}
                      {(hasUnknownTourAmount || tourCurrencies.size > 1 || tourCurrencyMismatch) && <p className="booking-price-disclaimer">At least one tour charge cannot be calculated reliably from its listed pricing rule, guest count, or currency. The tour subtotal or estimated total needs confirmation.</p>}
                    </div>
                    {hotel.policies && <details className="booking-property-policy"><summary>Property policy</summary><dl>{hotel.policies.checkIn && <div><dt>Check-in</dt><dd>{hotel.policies.checkIn}</dd></div>}{hotel.policies.checkOut && <div><dt>Check-out</dt><dd>{hotel.policies.checkOut}</dd></div>}{hotel.policies.cancellation && <div><dt>Cancellation</dt><dd>{hotel.policies.cancellation}</dd></div>}</dl></details>}
                    <p className="booking-price-disclaimer">Estimate only. Taxes, fees, discounts, availability, and payment are not included.</p>
                  </aside>
                  <section className="booking-card booking-room-selector" aria-labelledby="booking-room-selector-title">
                    <div className="booking-card-heading"><div><span className="booking-eyebrow">Room selection</span><h2 id="booking-room-selector-title">Choose Your Room</h2></div></div>
                    <p className="booking-room-selector__intro">Select one room at {hotel.name}. Room capacity must accommodate your guest count.</p>
                    {errors.room && <p className="booking-form-error-summary" role="alert">{errors.room}</p>}
                    {hotel.rooms?.length ? (
                      <div className="booking-room-options">
                        {hotel.rooms.map((roomOption, index) => {
                          const isSelected = selectedRoomIndex === index;
                          const roomExceedsCapacity = isSelected && isValidGuestCount
                            && typeof roomOption.maxGuests === 'number'
                            && parsedGuestCount > roomOption.maxGuests;
                          return (
                            <article className={`booking-room-option${isSelected ? ' is-selected' : ''}`} key={`${roomOption.type || 'room'}-${index}`}>
                              <div className="booking-room-option__details">
                                <h3>{roomOption.type || `Room ${index + 1}`}</h3>
                                <p>{roomOption.bed || roomOption.description || 'Room details not provided'}</p>
                                <div className="booking-room-option__facts">
                                  <span>{typeof roomOption.maxGuests === 'number' ? `Up to ${roomOption.maxGuests} guests` : 'Guest capacity not provided'}</span>
                                  <strong>{typeof roomOption.price === 'number' && Number.isFinite(roomOption.price) ? `${money(hotel.currency, roomOption.price)} / night` : 'Price not listed'}</strong>
                                </div>
                                {roomExceedsCapacity && <p className="booking-room-option__capacity-error" role="alert">Your guest count exceeds this room’s capacity of {roomOption.maxGuests}.</p>}
                              </div>
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                className="booking-light-blue-button booking-room-option__select"
                                aria-pressed={isSelected}
                                onClick={() => selectRoom(index)}
                              >
                                {isSelected ? 'Selected' : 'Select Room'}
                              </Button>
                            </article>
                          );
                        })}
                      </div>
                    ) : <p className="booking-inline-note">No room options are listed for this hotel.</p>}
                  </section>
                  <div className="booking-summary-action">
                    <Button type="submit" variant="primary" className="booking-light-blue-button" size="lg" fullWidth disabled={!room || !isValidGuestCount || Boolean(capacityError)}>
                      {room ? 'Review booking request' : 'Select a room to continue'}
                    </Button>
                    <p className="booking-submit-note">Submitting reviews your details only; no reservation or payment is made.</p>
                  </div>
                </div>
              </form>
            </>
          )}
        </Container>
      </main>
      <Footer />
      <SignInModal key={authMode} isOpen={isSignInOpen && !currentUser} onClose={() => setIsSignInOpen(false)} onLoginSuccess={setCurrentUser} initialMode={authMode} />
    </div>
  );
}
