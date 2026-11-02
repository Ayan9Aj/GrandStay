import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Badge from '../../components/common/Badge/Badge';
import Button from '../../components/common/Button/Button';
import DateRangePicker from '../../components/common/DateRangePicker/DateRangePicker';
import GuestRoomSelector from '../../components/common/GuestRoomSelector/GuestRoomSelector';
import Container from '../../components/layout/Container/Container';
import Footer from '../../components/layout/Footer/Footer';
import Header from '../../components/layout/Header/Header';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import { clearActiveUserSession, getActiveUserSession } from '../../data/authSession';
import { getVillaById } from '../../services/villaService';
import { getDefaultRentalDates, getRentalNights } from '../../utils/rentalDates';
import './VillaBookingPage.css';

const formatMoney = (currency, amount) => `${currency || ''}${amount.toLocaleString('en-IN')}`;

export default function VillaBookingPage() {
  const { villaId } = useParams();
  const location = useLocation();
  const villa = getVillaById(villaId);
  const booking = location.state?.booking || {};
  const defaults = getDefaultRentalDates();
  const [checkIn, setCheckIn] = useState(booking.checkIn || defaults.checkIn);
  const [checkOut, setCheckOut] = useState(booking.checkOut || defaults.checkOut);
  const [guestCount, setGuestCount] = useState(String(booking.guests || Math.min(2, villa?.guestCapacity || 2)));
  const [guest, setGuest] = useState({ fullName: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setSignInOpen] = useState(() => !getActiveUserSession());
  const [authMode, setAuthMode] = useState('signin');
  const headingRef = useRef(null);
  const nights = getRentalNights(checkIn, checkOut);
  const guestNumber = Number(guestCount);
  const hasValidGuests = Number.isInteger(guestNumber) && guestNumber >= 1 && guestNumber <= (villa?.guestCapacity || 0);
  const subtotal = nights && villa ? nights * villa.pricePerNight : null;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [villaId]);

  useLayoutEffect(() => {
    if (submitted) headingRef.current?.focus({ preventScroll: true });
  }, [submitted]);

  const openSignIn = () => { setAuthMode('signin'); setSignInOpen(true); };
  const openRegister = () => { setAuthMode('register'); setSignInOpen(true); };
  const signOut = () => { clearActiveUserSession(); setCurrentUser(null); setSignInOpen(true); };
  const updateGuest = (event) => setGuest((current) => ({ ...current, [event.target.name]: event.target.value }));

  if (!villa) {
    return (
      <div className="villa-booking-page">
        <Header currentUser={currentUser} onOpenSignIn={openSignIn} onOpenRegister={openRegister} onSignOut={signOut} />
        <main className="villa-booking-main"><Container size="lg"><h1>Private stay unavailable</h1><p>This property is not in the current demo catalog.</p><Link to="/villas">Browse villas and bungalows</Link></Container></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="villa-booking-page">
      <Header currentUser={currentUser} onOpenSignIn={openSignIn} onOpenRegister={openRegister} onSignOut={signOut} />
      <main id="main-content" className="villa-booking-main">
        <Container size="lg">
          <nav className="villa-booking-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to={`/villas/${villa.id}`} state={{ booking }}>Property details</Link><span aria-hidden="true">/</span><span aria-current="page">Booking review</span></nav>
          {!currentUser ? (
            <section className="villa-booking-auth-gate" aria-labelledby="villa-auth-title">
              <Badge variant="neutral" size="sm">Demo account required</Badge>
              <h1 id="villa-auth-title">Sign in to continue</h1>
              <p>Your selected property and rental dates are kept while you sign in or create an account.</p>
              <Button variant="accent" onClick={openSignIn}>Sign In or Register</Button>
            </section>
          ) : submitted ? (
            <section className="villa-booking-confirmation" role="status" aria-labelledby="villa-confirmation-title">
              <Badge variant="accent" size="sm">Request summary</Badge>
              <h1 ref={headingRef} tabIndex="-1" id="villa-confirmation-title">Rental request review complete</h1>
              <p>Your review for {villa.name} is complete. No reservation was created, no property was reserved, no booking details were saved, and no payment was taken.</p>
              <Link to={`/villas/${villa.id}`} state={{ booking: { villaId: villa.id, checkIn, checkOut, guests: guestCount } }}>Return to property details</Link>
            </section>
          ) : (
            <>
              <header className="villa-booking-heading">
                <div><span>Whole-property rental</span><h1>Review Your Booking</h1><p>This frontend demo does not check availability or process reservations or payments.</p></div>
                <Link to={`/villas/${villa.id}`} state={{ booking: { villaId: villa.id, checkIn, checkOut, guests: guestCount } }}>Back to property details</Link>
              </header>
              <form className="villa-booking-layout villa-booking-review-layout" onSubmit={(event) => { event.preventDefault(); if (currentUser && nights && hasValidGuests) setSubmitted(true); }}>
                <section className="villa-booking-card" aria-labelledby="villa-booking-details-title">
                  <span className="villa-booking-eyebrow">Your selection</span>
                  <h2 id="villa-booking-details-title">Guest details</h2>
                  <p className="villa-booking-form-intro">Enter the lead guest information for this whole-property rental.</p>
                  <div className="villa-booking-inputs">
                    <div className="villa-booking-date-field">
                      <label htmlFor="villa-booking-date-range">Check-in / Check-out</label>
                      <DateRangePicker id="villa-booking-date-range" dates={{ checkIn, checkOut }} onChange={(nextDates) => { setCheckIn(nextDates.checkIn); setCheckOut(nextDates.checkOut); }} label="Travel dates" triggerClassName="date-range-picker-trigger" valueClassName="date-range-picker-trigger__value" />
                    </div>
                    <div className="villa-booking-guest-field">
                      <GuestRoomSelector
                        mode="inline"
                        id="villa-booking-guests"
                        label="Guests"
                        value={Number(guestCount) || 1}
                        min={1}
                        max={villa.guestCapacity || 10}
                        singularLabel="Guest"
                        pluralLabel="Guests"
                        onChange={(val) => setGuestCount(String(val))}
                      />
                    </div>
                  </div>
                  {nights === null && <p className="villa-booking-error" role="alert">Check-out must be after check-in.</p>}
                  {!hasValidGuests && <p className="villa-booking-error" role="alert">Choose between 1 and {villa.guestCapacity} guests for this property.</p>}
                  <div className="villa-booking-guest-fields">
                    <label>Lead guest name<input name="fullName" autoComplete="name" required value={guest.fullName} onChange={updateGuest} /></label>
                    <label>Email address<input name="email" type="email" autoComplete="email" required value={guest.email} onChange={updateGuest} /></label>
                    <label>Phone number<input name="phone" type="tel" autoComplete="tel" required value={guest.phone} onChange={updateGuest} /></label>
                  </div>
                </section>
                <aside className="villa-booking-card villa-booking-summary" aria-labelledby="villa-summary-title">
                  <span className="villa-booking-eyebrow">Your booking details</span><h2 id="villa-summary-title">Booking summary</h2>
                  <div className="villa-booking-property-summary">
                    {villa.image && <img src={villa.image} alt={`${villa.name} property`} />}
                    <div><h3>{villa.name}</h3><p>{villa.location}</p><span>Whole {villa.propertyType.toLowerCase()} rental</span></div>
                  </div>
                  <dl className="villa-booking-stay-summary">
                    <div><dt>Check-in</dt><dd>{checkIn}</dd></div>
                    <div><dt>Check-out</dt><dd>{checkOut}</dd></div>
                    <div><dt>Guests</dt><dd>{guestNumber} {guestNumber === 1 ? 'guest' : 'guests'}</dd></div>
                    <div><dt>Number of nights</dt><dd>{nights || 'Choose valid dates'}</dd></div>
                  </dl>
                  <dl>
                    <div><dt>Whole-property rate</dt><dd>{formatMoney(villa.currency, villa.pricePerNight)} / night</dd></div>
                    <div className="villa-booking-summary__total"><dt>Estimated rental total</dt><dd>{subtotal === null ? 'Not calculated' : formatMoney(villa.currency, subtotal)}</dd></div>
                  </dl>
                  <dl className="villa-booking-charge-note"><div><dt>Taxes and fees</dt><dd>Not calculated</dd></div></dl>
                  <p>This estimate does not confirm availability or reserve the property.</p>
                </aside>
                <div className="villa-booking-action"><Button type="submit" variant="primary" size="lg" fullWidth disabled={!nights || !hasValidGuests}>Book This Now</Button><p>This demo does not create a reservation or process payment.</p></div>
              </form>
            </>
          )}
        </Container>
      </main>
      <Footer />
      <SignInModal key={authMode} isOpen={isSignInOpen && !currentUser} onClose={() => setSignInOpen(false)} onLoginSuccess={setCurrentUser} initialMode={authMode} />
    </div>
  );
}
