import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge/Badge';
import Button from '../../components/common/Button/Button';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Input from '../../components/common/Input/Input';
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
  const room = hotel && Number.isInteger(booking?.roomIndex) ? hotel.rooms?.[booking.roomIndex] : null;
  const returnTo = safeInternalPath(location.state?.returnTo, hotel ? `/hotels/${hotel.id}` : '/hotels');
  const browseTo = safeInternalPath(location.state?.browseTo, '/hotels');
  const [checkIn, setCheckIn] = useState(booking?.checkIn || '');
  const [checkOut, setCheckOut] = useState(booking?.checkOut || '');
  const [guestCount, setGuestCount] = useState(booking?.guests || '');
  const [extraGuestEnabled, setExtraGuestEnabled] = useState(false);
  const [guest, setGuest] = useState({ fullName: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setIsSignInOpen] = useState(false);
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
  const extraGuestsRequested = isValidGuestCount && maximumGuests !== null
    ? Math.max(0, parsedGuestCount - maximumGuests)
    : 0;
  const capacityError = !extraGuestEnabled && isValidGuestCount && extraGuestsRequested > 0
    ? `This room’s standard capacity is ${maximumGuests}. Reduce the guest count or request extra guest accommodation.`
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
  const estimatedTotal = roomSubtotal !== null && tourSubtotal !== null && !tourCurrencyMismatch ? roomSubtotal + tourSubtotal : null;

  const removeTour = (tourId) => {
    const tourIds = Array.isArray(booking.tourIds) ? booking.tourIds : [];
    const nextBooking = { ...booking, tourIds: tourIds.filter((id) => id !== tourId) };
    navigate('/booking', { replace: true, state: { ...location.state, booking: nextBooking } });
  };

  const updateGuest = (event) => {
    const { name, value } = event.target;
    setGuest((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!isDateOnly(checkIn)) nextErrors.checkIn = 'Choose a valid check-in date.';
    if (!isDateOnly(checkOut)) nextErrors.checkOut = 'Choose a valid check-out date.';
    else if (isDateOnly(checkIn) && calculateNights(checkIn, checkOut) === null) {
      nextErrors.checkOut = 'Check-out must be later than check-in.';
    }

    if (!isValidGuestCount) {
      nextErrors.guestCount = 'Enter a whole number of at least 1 guest.';
    } else if (!extraGuestEnabled && maximumGuests !== null && parsedGuestCount > maximumGuests) {
      nextErrors.guestCount = `This room’s standard capacity is ${maximumGuests} guests. Reduce the guest count or request extra guest accommodation.`;
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
    if (validateForm()) setSubmitted(true);
  };

  return (
    <div className="booking-page">
      <Header
        currentUser={currentUser}
        onOpenSignIn={() => { setAuthMode('signin'); setIsSignInOpen(true); }}
        onOpenRegister={() => { setAuthMode('register'); setIsSignInOpen(true); }}
        onSignOut={() => { clearActiveUserSession(); setCurrentUser(null); }}
      />
      <main id="main-content" className="booking-main">
        <Container size="lg">
          <nav className="booking-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span aria-hidden="true">/</span><Link to={browseTo}>Hotel browsing</Link><span aria-hidden="true">/</span><span aria-current="page">Booking &amp; checkout</span>
          </nav>

          {!hotel || !room ? (
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
              {extraGuestsRequested > 0 ? (
                <>
                  <Badge variant="neutral" size="sm">Approval required</Badge>
                  <h1 ref={confirmationHeading} tabIndex="-1" id="booking-confirmation-title">Extra guest request prepared for review</h1>
                  <p>Your request includes {extraGuestsRequested} guest{extraGuestsRequested === 1 ? '' : 's'} above the room’s standard capacity. Hotel approval is required, and additional charges may apply.</p>
                  <p>Your request has not been sent to the hotel. The additional guests are not approved, no room was reserved, no booking record was saved, and no payment was taken.</p>
                </>
              ) : (
                <>
                  <h1 ref={confirmationHeading} tabIndex="-1" id="booking-confirmation-title">Checkout review complete</h1>
                  <p>Your details were reviewed on this page. No reservation was created, no room was reserved, no booking or guest details were saved, and no payment was taken.</p>
                </>
              )}
              <p>Room availability has not been checked, and your stay is not confirmed.</p>
              <Link className="booking-return-link" to={returnTo} state={{ selectedTourIds: booking.tourIds || [], selectedRoomIndex: booking.roomIndex, from: browseTo }}>Return to hotel details</Link>
            </section>
          ) : (
            <>
              <header className="booking-heading">
                <div>
                  <span className="booking-eyebrow">Guest checkout</span>
                  <h1>Review your stay</h1>
                  <p>Review your stay and guest details. Submitting this page does not reserve a room or take payment.</p>
                </div>
                <Link className="booking-back-link" to={returnTo} state={{ selectedTourIds: booking.tourIds || [], selectedRoomIndex: booking.roomIndex, from: browseTo }}>{returnLabel}</Link>
              </header>

              <div className="booking-layout">
                <section className="booking-card booking-stay-card" aria-labelledby="stay-summary-title">
                  <div className="booking-card-heading">
                    <div><span className="booking-eyebrow">Your selection</span><h2 id="stay-summary-title">Stay summary</h2></div>
                    <Badge variant="neutral" size="sm">Stay details</Badge>
                  </div>
                  <h3 className="booking-hotel-name">{hotel.name}</h3>
                  <p className="booking-hotel-location">{hotel.location}</p>
                  <dl className="booking-room-summary">
                    <div><dt>Room</dt><dd>{room.type || 'Room name not provided'}</dd></div>
                    <div><dt>Room capacity</dt><dd>{maximumGuests ? `Up to ${maximumGuests} guests` : 'Not provided'}</dd></div>
                    <div><dt>Check-in</dt><dd>{checkIn || 'Choose a date below'}</dd></div>
                    <div><dt>Check-out</dt><dd>{checkOut || 'Choose a date below'}</dd></div>
                    <div><dt>Guests</dt><dd>{isValidGuestCount ? `${parsedGuestCount} ${parsedGuestCount === 1 ? 'guest' : 'guests'}` : 'Enter a guest count below'}</dd></div>
                  </dl>

                  <div className="booking-stay-inputs">
                    <Input label="Check-in" id="booking-check-in" name="checkIn" type="date" value={checkIn} onChange={(event) => { setCheckIn(event.target.value); setErrors((current) => ({ ...current, checkIn: '', checkOut: '' })); }} error={errors.checkIn} required />
                    <Input label="Check-out" id="booking-check-out" name="checkOut" type="date" value={checkOut} onChange={(event) => { setCheckOut(event.target.value); setErrors((current) => ({ ...current, checkOut: '' })); }} error={errors.checkOut} required />
                    <Input
                      label="Guests"
                      id="booking-guests"
                      name="guestCount"
                      type="number"
                      min="1"
                      max={!extraGuestEnabled ? maximumGuests || undefined : undefined}
                      step="1"
                      value={guestCount}
                      onChange={(event) => { setGuestCount(event.target.value); setErrors((current) => ({ ...current, guestCount: '' })); }}
                      error={errors.guestCount || capacityError}
                      helperText={maximumGuests ? `Room standard capacity: up to ${maximumGuests} guests.` : 'Enter the number of guests for this stay.'}
                      required
                    />
                    <section className="extra-guest-option" aria-labelledby="extra-guest-title">
                      <h3 id="extra-guest-title">Extra Guest Accommodation</h3>
                      <p>The room’s listed capacity is its standard guest capacity. Extra guests are requests only and require hotel approval.</p>
                      <label className="extra-guest-toggle">
                        <input
                          type="checkbox"
                          checked={extraGuestEnabled}
                          onChange={(event) => {
                            setExtraGuestEnabled(event.target.checked);
                            setErrors((current) => ({ ...current, guestCount: '' }));
                          }}
                        />
                        <span>Request extra guest accommodation</span>
                      </label>
                      <dl className="extra-guest-counts">
                        <div><dt>Standard room capacity</dt><dd>{maximumGuests !== null ? `Up to ${maximumGuests} guests` : 'Not listed'}</dd></div>
                        <div><dt>Current guest count</dt><dd>{isValidGuestCount ? parsedGuestCount : 'Enter a valid whole number'}</dd></div>
                        <div><dt>Extra guests requested</dt><dd>{maximumGuests !== null && isValidGuestCount ? extraGuestsRequested : 'Cannot calculate'}</dd></div>
                      </dl>
                      {extraGuestEnabled && extraGuestsRequested > 0 ? (
                        <p className="extra-guest-status" role="status"><strong>Approval required.</strong> The hotel must approve {extraGuestsRequested} extra guest{extraGuestsRequested === 1 ? '' : 's'}; additional charges may apply.</p>
                      ) : extraGuestEnabled ? (
                        <p className="extra-guest-status" role="status">The current guest count is within the room’s standard capacity.</p>
                      ) : (
                        <p className="extra-guest-warning">If extra guests are requested, hotel approval is required and additional charges may apply.</p>
                      )}
                    </section>
                  </div>
                  {nights !== null ? <p className="booking-night-count" role="status">{nights} {nights === 1 ? 'night' : 'nights'}</p> : <p className="booking-inline-note">{checkIn && checkOut && isDateOnly(checkIn) && isDateOnly(checkOut) ? 'Check-out must be later than check-in.' : 'Select valid dates with check-out after check-in to calculate the room subtotal.'}</p>}

                </section>

                <aside className="booking-side-column">
                  <section className="booking-card booking-price-card" aria-labelledby="price-breakdown-title">
                    <span className="booking-eyebrow">Transparent estimate</span>
                    <h2 id="price-breakdown-title">Price breakdown</h2>
                    {hasNightlyRate ? (
                      <dl className="booking-price-lines">
                        <div><dt>Room rate</dt><dd>{money(hotel.currency, room.price)} / night</dd></div>
                        <div><dt>Number of nights</dt><dd>{nights === null ? 'Select valid dates' : nights}</dd></div>
                        <div className="booking-price-subtotal"><dt>Room subtotal</dt><dd>{roomSubtotal === null ? 'Not calculated' : money(hotel.currency, roomSubtotal)}</dd></div>
                        {selectedTours.length > 0 && <div><dt>Sightseeing tour subtotal</dt><dd>{tourSubtotal === null ? 'To be confirmed' : money([...tourCurrencies][0], tourSubtotal)}</dd></div>}
                        {extraGuestsRequested > 0 && extraGuestEnabled && <div className="extra-guest-price-line"><dt>Extra guest charge</dt><dd>To be confirmed by the hotel</dd></div>}
                        <div className="booking-price-total"><dt>Estimated total</dt><dd>{estimatedTotal === null ? 'To be confirmed' : money(hotel.currency, estimatedTotal)}</dd></div>
                      </dl>
                    ) : <p className="booking-inline-note">A room rate is not listed, so no subtotal or total is shown.</p>}
                    <div className="booking-tour-summary">
                      <div className="booking-card-heading"><div><span className="booking-eyebrow">Optional</span><h3>Selected sightseeing tours</h3></div></div>
                      {selectedTours.length ? (
                        <ul className="booking-tour-list">
                          {toursWithAmounts.map((tour) => (
                            <li key={tour.id}>
                              <div>
                                <strong>{tour.title}</strong>
                                <span>{typeof tour.price === 'number' ? money(tour.currency, tour.price) : 'Price not provided'} · {tour.priceType || 'pricing unit not provided'}</span>
                                <span>{tour.estimatedAmount === null ? 'Charge to be confirmed for this guest count' : `Estimated charge: ${money(tour.currency, tour.estimatedAmount)}`}</span>
                              </div>
                              <Button variant="text" size="sm" onClick={() => removeTour(tour.id)} aria-label={`Remove ${tour.title}`}>Remove</Button>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="booking-inline-note">No tours selected. They are optional; you can continue without them.</p>}
                      {(hasUnknownTourAmount || tourCurrencies.size > 1 || tourCurrencyMismatch) && <p className="booking-price-disclaimer">At least one tour charge cannot be calculated reliably from its listed pricing rule, guest count, or currency. The tour subtotal or estimated total needs confirmation.</p>}
                    </div>
                    {extraGuestsRequested > 0 && extraGuestEnabled && <p className="booking-price-disclaimer">Any estimated total excludes additional charges the hotel may apply if it approves extra guests.</p>}
                    <p className="booking-price-disclaimer">Estimate only. No taxes, fees, discounts, tour charges, availability checks, or payment are included.</p>
                  </section>

                  <form className="booking-card booking-guest-form" onSubmit={handleSubmit} noValidate>
                    <div className="booking-card-heading"><div><span className="booking-eyebrow">No account required</span><h2>Lead guest details</h2></div></div>
                    <p className="booking-form-intro">Fields marked with * are required. Your details stay in this page’s memory and are not saved.</p>
                    <Input label="Full name" id="guest-full-name" name="fullName" autoComplete="name" value={guest.fullName} onChange={updateGuest} error={errors.fullName} required />
                    <Input label="Email address" id="guest-email" name="email" type="email" autoComplete="email" value={guest.email} onChange={updateGuest} error={errors.email} required />
                    <Input label="Phone number" id="guest-phone" name="phone" type="tel" autoComplete="tel" value={guest.phone} onChange={updateGuest} error={errors.phone} required />
                    {Object.values(errors).some(Boolean) && <p className="booking-form-error-summary" role="alert">Please correct the highlighted fields before continuing.</p>}
                    <Button type="submit" variant="accent" size="lg" fullWidth>Review booking request</Button>
                    <p className="booking-submit-note">This review does not create a reservation or request payment.</p>
                  </form>
                </aside>
              </div>
            </>
          )}
        </Container>
      </main>
      <Footer />
      <SignInModal key={authMode} isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onLoginSuccess={setCurrentUser} initialMode={authMode} />
    </div>
  );
}
