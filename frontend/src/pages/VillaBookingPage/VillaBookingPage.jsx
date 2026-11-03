import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Badge from '../../components/common/Badge/Badge';
import Button from '../../components/common/Button/Button';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Input from '../../components/common/Input/Input';
import DateRangePicker from '../../components/common/DateRangePicker/DateRangePicker';
import GuestRoomSelector from '../../components/common/GuestRoomSelector/GuestRoomSelector';
import SelectDropdown from '../../components/common/SelectDropdown/SelectDropdown';
import Container from '../../components/layout/Container/Container';
import Footer from '../../components/layout/Footer/Footer';
import Header from '../../components/layout/Header/Header';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import {
  StarIcon,
  MapPinIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';
import { SAMPLE_TOURS } from '../../data/sampleTours';
import { clearActiveUserSession, getActiveUserSession } from '../../data/authSession';
import { getVillaById } from '../../services/villaService';
import { getDefaultRentalDates, getRentalNights } from '../../utils/rentalDates';
import './VillaBookingPage.css';

const VILLA_ARRIVAL_OPTIONS = [
  { value: '12:00 - 14:00', label: '12:00 PM – 2:00 PM (Early arrival on request)' },
  { value: '14:00 - 16:00', label: '2:00 PM – 4:00 PM (Standard check-in)' },
  { value: '16:00 - 18:00', label: '4:00 PM – 6:00 PM (Late afternoon)' },
  { value: 'after_18:00', label: 'After 6:00 PM (Evening / Lockbox greeting)' },
];

const VILLA_HOUSEKEEPING_OPTIONS = [
  { value: 'daily', label: 'Daily Housekeeping Service' },
  { value: 'alternate_days', label: 'Alternate Days Service' },
  { value: 'privacy', label: 'On-Request Only (Maximum privacy)' },
];


// ── Helpers ──────────────────────────────────────────────────────────────────
const isDateOnly = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
  !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

const safeInternalPath = (path, fallback) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : fallback;

const money = (currency, amount) =>
  `${currency || '₹'}${typeof amount === 'number' && Number.isFinite(amount) ? amount.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}`;

const calculateTourAmount = (tour, totalGuests) => {
  if (typeof tour?.price !== 'number' || !Number.isFinite(tour.price) || tour.price < 0 || !tour.currency) return null;
  const pricingRule = String(tour.priceType || '').trim().toLowerCase();
  if (pricingRule === 'per person') return totalGuests > 0 ? tour.price * totalGuests : null;
  if (pricingRule === 'per booking') return tour.price;
  const groupMatch = pricingRule.match(/^per group\s*\(up to (\d+) guests?\)$/);
  if (groupMatch) {
    const groupCapacity = Number(groupMatch[1]);
    return totalGuests > 0 && totalGuests <= groupCapacity ? tour.price : null;
  }
  return tour.price;
};

const generateBookingReference = () => {
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GS-VILLA-${year}-${randomChars}`;
};

const getFormattedBookingTimestamp = () =>
  new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function VillaBookingPage() {
  const { villaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previousPath = useRef(null);
  const confirmationHeading = useRef(null);

  const villa = getVillaById(villaId);
  const bookingState = location.state?.booking || {};
  const defaults = getDefaultRentalDates();

  // Reconcile dates from state or URL query
  const initialCheckIn = bookingState.checkIn || searchParams.get('checkIn') || defaults.checkIn;
  const initialCheckOut = bookingState.checkOut || searchParams.get('checkOut') || defaults.checkOut;

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);

  // Reconcile guest count
  const initialGuests = Number(bookingState.guests || searchParams.get('guests')) || 2;
  const initialAdults = Math.max(1, Math.min(initialGuests, villa?.guestCapacity || 8));
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState([]);

  // Rate Plan: 'flexible' (Free cancellation up to 48h) vs 'non_refundable' (10% discount)
  const [ratePlan, setRatePlan] = useState('flexible');

  // Lead guest contact
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  const [guest, setGuest] = useState(() => {
    const active = getActiveUserSession();
    return {
      fullName: active?.name || '',
      email: active?.email || '',
      phone: active?.phone || '',
    };
  });

  // Villa Preferences & Special Requests
  const [specialRequests, setSpecialRequests] = useState({
    arrivalTime: '14:00 - 16:00',
    housekeepingSchedule: 'daily',
    airportTransfer: false,
    flightNumber: '',
    additionalNotes: '',
  });

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState('pay_at_hotel');
  const [cardDetails, setCardDetails] = useState({
    cardholderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Selected tours carried or chosen on this page
  const [selectedTourIds, setSelectedTourIds] = useState(() =>
    Array.isArray(bookingState?.tourIds) ? bookingState.tourIds : []
  );

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  // Dynamic child ages
  const handleChildrenCountChange = (count) => {
    const num = Math.max(0, Math.min(6, Number(count) || 0));
    setChildren(num);
    setChildAges((prev) => {
      const updated = [...prev];
      if (num > prev.length) {
        for (let i = prev.length; i < num; i++) {
          updated.push(7);
        }
      } else {
        updated.splice(num);
      }
      return updated;
    });
  };

  const updateChildAge = (index, age) => {
    setChildAges((prev) => {
      const copy = [...prev];
      copy[index] = Number(age);
      return copy;
    });
  };

  // Scroll restoration
  useLayoutEffect(() => {
    if (previousPath.current !== location.pathname) {
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

  // Navigation targets
  const returnTo = safeInternalPath(
    location.state?.returnTo,
    villa ? `/villas/${villa.id}` : '/villas'
  );
  const returnLabel = returnTo.includes('/villas/') && !returnTo.endsWith('/villas')
    ? 'Back to property details'
    : 'Back to private stays';

  // Calculations
  const nights = getRentalNights(checkIn, checkOut);
  const totalGuests = adults + children;
  const maxCapacity = villa?.guestCapacity || 8;
  const capacityError =
    totalGuests > maxCapacity
      ? `This private property accommodates up to ${maxCapacity} guests. Your selected party size is ${totalGuests} guests.`
      : '';

  // Whole-property rate calculation
  const baseRatePerNight = typeof villa?.pricePerNight === 'number' ? villa.pricePerNight : 0;
  const rateMultiplier = ratePlan === 'non_refundable' ? 0.9 : 1.0;
  const effectiveRatePerNight = Math.round(baseRatePerNight * rateMultiplier);
  const rateDiscountPerNight = baseRatePerNight - effectiveRatePerNight;
  const totalRateDiscount = nights !== null ? rateDiscountPerNight * nights : 0;
  const propertySubtotal = nights !== null && baseRatePerNight > 0 ? effectiveRatePerNight * nights : null;

  // Matching destination sightseeing tours
  const matchedTours = (() => {
    if (!villa) return [];
    const dest = (villa.destination || '').trim().toLowerCase();
    const loc = (villa.location || '').trim().toLowerCase();
    return SAMPLE_TOURS.filter((tour) => {
      const tourDest = (tour.destination || '').trim().toLowerCase();
      return (
        tourDest === dest ||
        loc.includes(tourDest) ||
        (tourDest === 'kerala' && (dest === 'alappuzha' || dest === 'munnar'))
      );
    });
  })();

  const selectedTours = matchedTours.filter((tour) => selectedTourIds.includes(tour.id));
  const toursWithAmounts = selectedTours.map((tour) => ({
    ...tour,
    estimatedAmount: calculateTourAmount(tour, totalGuests),
  }));

  const tourSubtotal =
    selectedTours.length === 0
      ? 0
      : toursWithAmounts.reduce((sum, tour) => sum + (tour.estimatedAmount || 0), 0);

  // Taxes and Fees
  const estimatedGstAmount = propertySubtotal !== null ? Math.round(propertySubtotal * 0.12) : 0;
  // Housekeeping & Sanitization Fee: ₹500 per night for the private home
  const housekeepingFee = nights !== null ? nights * 500 : 0;

  const estimatedTotal =
    propertySubtotal !== null
      ? propertySubtotal + (tourSubtotal || 0) + estimatedGstAmount + housekeepingFee
      : null;

  const toggleTour = (tourId) => {
    setSelectedTourIds((prev) =>
      prev.includes(tourId) ? prev.filter((id) => id !== tourId) : [...prev, tourId]
    );
  };

  const updateGuest = (event) => {
    const { name, value } = event.target;
    setGuest((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const updateSpecialRequests = (key, value) => {
    setSpecialRequests((prev) => ({ ...prev, [key]: value }));
  };

  // Form validation & submission
  const validateForm = () => {
    const newErrors = {};

    if (!isDateOnly(checkIn)) newErrors.checkIn = 'Please choose a valid check-in date.';
    if (!isDateOnly(checkOut)) newErrors.checkOut = 'Please choose a valid check-out date.';
    if (nights === null || nights <= 0) {
      newErrors.checkOut = 'Check-out date must be at least 1 night after check-in.';
    }

    if (!totalGuests || totalGuests < 1) {
      newErrors.guests = 'Please select at least 1 guest.';
    } else if (totalGuests > maxCapacity) {
      newErrors.guests = `Party size exceeds maximum property capacity of ${maxCapacity} guests.`;
    }

    if (!guest.fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!guest.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^[0-9+\s\-()]{7,15}$/.test(guest.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number.';
    }

    if (!guest.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.cardholderName.trim()) {
        newErrors.cardholderName = 'Cardholder name is required.';
      }
      const cleanNum = cardDetails.cardNumber.replace(/\s+/g, '');
      if (!cleanNum) {
        newErrors.cardNumber = 'Card number is required.';
      } else if (!/^\d{15,16}$/.test(cleanNum)) {
        newErrors.cardNumber = 'Please enter a valid 15 or 16 digit card number.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!currentUser) {
      setAuthMode('signin');
      setIsSignInOpen(true);
      return;
    }

    if (!validateForm()) return;

    const reservationData = {
      referenceNumber: generateBookingReference(),
      status: 'Reservation Confirmed',
      timestamp: getFormattedBookingTimestamp(),
      villa,
      checkIn,
      checkOut,
      nights,
      adults,
      children,
      childAges,
      totalGuests,
      ratePlan,
      leadGuest: { ...guest },
      specialRequests: { ...specialRequests },
      selectedTours: toursWithAmounts,
      priceBreakdown: {
        currency: villa.currency || '₹',
        baseRatePerNight,
        effectiveRatePerNight,
        rateDiscountPerNight,
        totalRateDiscount,
        propertySubtotal,
        tourSubtotal,
        estimatedGstAmount,
        housekeepingFee,
        estimatedTotal,
      },
      paymentMethod,
      cardDetails: paymentMethod === 'card' ? {
        cardholderName: cardDetails.cardholderName,
        cardNumber: cardDetails.cardNumber.replace(/\d(?=\d{4})/g, '•'),
        cardExpiry: cardDetails.cardExpiry,
      } : null,
      upiId: paymentMethod === 'upi' ? upiId : null,
      selectedBank: paymentMethod === 'netbanking' ? selectedBank : null,
    };

    setConfirmedReservation(reservationData);
    setSubmitted(true);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  const handleDownloadTextVoucher = () => {
    if (!confirmedReservation) return;
    const res = confirmedReservation;
    const content = `================================================================================
GRANDSTAY LUXURY PRIVATE RENTAL RESERVATION VOUCHER
================================================================================
Booking Reference : ${res.referenceNumber}
Status            : ${res.status}
Booking Date      : ${res.timestamp}

PROPERTY DETAILS:
Property Name     : ${res.villa.name}
Property Type     : Entire ${res.villa.propertyType} Rental (${res.villa.rentalCategory})
Location          : ${res.villa.location}
Accommodates      : Up to ${res.villa.guestCapacity} Guests (${res.villa.bedrooms} Bedrooms, ${res.villa.bathrooms} Bathrooms)
Standard Check-in : 2:00 PM
Standard Check-out: 11:00 AM

RESERVATION SCHEDULE:
Check-in Date     : ${res.checkIn}
Check-out Date    : ${res.checkOut}
Total Length      : ${res.nights} night(s)
Rate Plan         : ${res.ratePlan === 'non_refundable' ? 'Non-Refundable Rate (10% Discount applied)' : 'Flexible Rate (Free Cancellation up to 48h prior)'}

GUEST INFORMATION:
Lead Guest Name   : ${res.leadGuest.fullName}
Email Address     : ${res.leadGuest.email}
Phone Number      : ${res.leadGuest.phone}
Total Party       : ${res.totalGuests} Guests (${res.adults} Adults${res.children > 0 ? `, ${res.children} Children: ages ${res.childAges.join(', ')}` : ''})

CONCIERGE & ARRIVAL PREFERENCES:
Est. Arrival Time : ${res.specialRequests.arrivalTime}
Housekeeping      : ${res.specialRequests.housekeepingSchedule === 'daily' ? 'Daily housekeeping' : res.specialRequests.housekeepingSchedule === 'alternate_days' ? 'Alternate days' : 'On-request only for privacy'}
Airport Transfer  : ${res.specialRequests.airportTransfer ? `Requested (Details: ${res.specialRequests.flightNumber || 'To be shared'})` : 'None requested'}
Special Notes     : ${res.specialRequests.additionalNotes || 'None'}

PAYMENT METHOD:
Selected Method   : ${res.paymentMethod === 'pay_at_hotel' ? 'Pay at Property on Arrival' : res.paymentMethod === 'card' ? `Card Guarantee (${res.cardDetails?.cardNumber})` : res.paymentMethod === 'upi' ? `UPI (${res.upiId})` : `Net Banking (${res.selectedBank})`}

ITEMIZED PRICE BREAKDOWN (${res.priceBreakdown.currency}):
Property Rate     : ${money(res.priceBreakdown.currency, res.priceBreakdown.effectiveRatePerNight)} / night x ${res.nights} nights
Rental Subtotal   : ${money(res.priceBreakdown.currency, res.priceBreakdown.propertySubtotal)}
${res.ratePlan === 'non_refundable' ? `Rate Savings      : -${money(res.priceBreakdown.currency, res.priceBreakdown.totalRateDiscount)} (10% Non-refundable discount)\n` : ''}${res.selectedTours?.length ? `Sightseeing Tours : ${money(res.priceBreakdown.currency, res.priceBreakdown.tourSubtotal)}\n` : ''}Taxes (12% GST)   : ${money(res.priceBreakdown.currency, res.priceBreakdown.estimatedGstAmount)}
Housekeeping Fee  : ${money(res.priceBreakdown.currency, res.priceBreakdown.housekeepingFee)}
--------------------------------------------------------------------------------
TOTAL AMOUNT DUE  : ${money(res.priceBreakdown.currency, res.priceBreakdown.estimatedTotal)}
--------------------------------------------------------------------------------

HOUSE POLICIES & KEY HANDOVER:
• Concierge will contact you prior to arrival to coordinate key handover and property orientation.
• Government-issued photo ID required for all adult guests at check-in.
• Respectful quiet hours apply after 10:00 PM.
================================================================================
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GrandStay-Villa-Voucher-${res.referenceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSignOut = () => {
    clearActiveUserSession();
    setCurrentUser(null);
    setIsSignInOpen(true);
  };

  return (
    <div className="villa-booking-page">
      <Header
        currentUser={currentUser}
        onOpenSignIn={() => { setAuthMode('signin'); setIsSignInOpen(true); }}
        onOpenRegister={() => { setAuthMode('register'); setIsSignInOpen(true); }}
        onSignOut={handleSignOut}
      />

      <main id="main-content" className="villa-booking-main">
        <Container size="lg">
          <nav className="villa-booking-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/villas">Villas &amp; Bungalows</Link>
            <span aria-hidden="true">/</span>
            {villa && (
              <>
                <Link to={`/villas/${villa.id}`}>{villa.name}</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span aria-current="page">Booking Review &amp; Checkout</span>
          </nav>

          {!currentUser && villa ? (
            <section className="villa-booking-auth-required" aria-labelledby="villa-auth-title">
              <Badge variant="accent" size="sm">Guest Authentication</Badge>
              <h1 id="villa-auth-title">Sign in to complete your booking</h1>
              <p>Your selected property and dates are preserved while you log in or register a profile.</p>
              <Button variant="accent" onClick={() => { setAuthMode('signin'); setIsSignInOpen(true); }}>
                Sign In or Register
              </Button>
            </section>
          ) : !villa ? (
            <section className="villa-booking-missing-context">
              <EmptyState
                title="Private Stay Not Found"
                description="Please select a villa or bungalow from the catalog before reviewing your reservation."
                actionText="Browse Villas &amp; Bungalows"
                onAction={() => navigate('/villas')}
              />
            </section>
          ) : submitted && confirmedReservation ? (
            /* ── CONFIRMATION VIEW & PRINTABLE VOUCHER ── */
            <section className="villa-confirmation-container" role="status" aria-labelledby="villa-confirmation-title">
              <div className="villa-confirmation-header no-print">
                <div className="villa-confirmation-status-pill">
                  <CheckCircleIcon size={20} className="status-icon" />
                  <span>{confirmedReservation.status}</span>
                </div>
                <h1 ref={confirmationHeading} tabIndex="-1" id="villa-confirmation-title">
                  Your Booking Request is Confirmed!
                </h1>
                <p className="villa-confirmation-ref-line">
                  Reservation Reference: <strong>{confirmedReservation.referenceNumber}</strong>
                </p>

                <div className="villa-confirmation-actions">
                  <Button variant="primary" size="md" onClick={handlePrintVoucher} className="villa-print-btn">
                    🖨️ Print / Save Voucher as PDF
                  </Button>
                  <Button variant="outline" size="md" onClick={handleDownloadTextVoucher}>
                    📄 Download Voucher (Text)
                  </Button>
                  <Button variant="text" size="md" onClick={() => navigate('/villas')}>
                    Browse More Private Stays
                  </Button>
                </div>
              </div>

              {/* Printable Official Voucher Document */}
              <article className="villa-voucher">
                <header className="voucher-header">
                  <div className="voucher-brand">
                    <span className="voucher-logo-text">GrandStay</span>
                    <span className="voucher-sub">Luxury Villas &amp; Vacation Bungalows</span>
                  </div>
                  <div className="voucher-meta">
                    <div className="voucher-ref-badge">
                      <span>BOOKING REFERENCE</span>
                      <strong>{confirmedReservation.referenceNumber}</strong>
                    </div>
                    <span className="voucher-date">Issued: {confirmedReservation.timestamp}</span>
                  </div>
                </header>

                <div className="voucher-grid">
                  <div className="voucher-block">
                    <h3>Property Details</h3>
                    <div className="voucher-hotel-info">
                      <strong className="voucher-hotel-name">{confirmedReservation.villa.name}</strong>
                      <p className="voucher-hotel-address">{confirmedReservation.villa.location}</p>
                      <span className="voucher-property-type-tag">Entire {confirmedReservation.villa.propertyType} Rental</span>
                      <p className="voucher-small-note">
                        <strong>Bedrooms:</strong> {confirmedReservation.villa.bedrooms} · <strong>Bathrooms:</strong> {confirmedReservation.villa.bathrooms} · <strong>Capacity:</strong> Up to {confirmedReservation.villa.guestCapacity} guests
                      </p>
                    </div>
                  </div>

                  <div className="voucher-block">
                    <h3>Stay Schedule</h3>
                    <dl className="voucher-dl">
                      <div><dt>Check-in</dt><dd><strong>{confirmedReservation.checkIn}</strong></dd></div>
                      <div><dt>Check-out</dt><dd><strong>{confirmedReservation.checkOut}</strong></dd></div>
                      <div><dt>Total Length</dt><dd>{confirmedReservation.nights} {confirmedReservation.nights === 1 ? 'Night' : 'Nights'}</dd></div>
                      <div><dt>Rental Type</dt><dd>Whole Property Exclusive Use</dd></div>
                    </dl>
                  </div>
                </div>

                <div className="voucher-grid">
                  <div className="voucher-block">
                    <h3>Rate &amp; Policy</h3>
                    <span className="voucher-rate-pill">
                      {confirmedReservation.ratePlan === 'non_refundable'
                        ? 'Non-Refundable Rate (10% Discount applied)'
                        : 'Flexible Rate (Free Cancellation up to 48h prior)'}
                    </span>
                    <p className="voucher-amenities-note">
                      <strong>Included Amenities:</strong> {confirmedReservation.villa.amenities?.join(', ')}
                    </p>
                  </div>

                  <div className="voucher-block">
                    <h3>Lead Guest Details</h3>
                    <p><strong>{confirmedReservation.leadGuest.fullName}</strong></p>
                    <p className="voucher-contact-info">{confirmedReservation.leadGuest.email}</p>
                    <p className="voucher-contact-info">{confirmedReservation.leadGuest.phone}</p>
                    <p className="voucher-guests-breakdown">
                      {confirmedReservation.totalGuests} Guests ({confirmedReservation.adults} Adults
                      {confirmedReservation.children > 0 ? `, ${confirmedReservation.children} Children: ages ${confirmedReservation.childAges.join(', ')}` : ''})
                    </p>
                  </div>
                </div>

                <div className="voucher-block">
                  <h3>Arrival &amp; Concierge Preferences</h3>
                  <div className="voucher-requests-summary">
                    <div><strong>Estimated Arrival:</strong> {confirmedReservation.specialRequests.arrivalTime}</div>
                    <div><strong>Housekeeping Preference:</strong> {confirmedReservation.specialRequests.housekeepingSchedule === 'daily' ? 'Daily housekeeping' : confirmedReservation.specialRequests.housekeepingSchedule === 'alternate_days' ? 'Alternate days' : 'On-request only for privacy'}</div>
                    {confirmedReservation.specialRequests.airportTransfer && (
                      <div><strong>Airport/Station Shuttle:</strong> Requested {confirmedReservation.specialRequests.flightNumber ? `(${confirmedReservation.specialRequests.flightNumber})` : ''}</div>
                    )}
                    {confirmedReservation.specialRequests.additionalNotes && (
                      <div><strong>Special Notes:</strong> {confirmedReservation.specialRequests.additionalNotes}</div>
                    )}
                  </div>
                </div>

                <div className="voucher-block">
                  <h3>Payment Guarantee &amp; Receipt</h3>
                  <p className="voucher-payment-method">
                    <strong>Payment Method:</strong>{' '}
                    {confirmedReservation.paymentMethod === 'pay_at_hotel'
                      ? 'Pay at Property on Arrival'
                      : confirmedReservation.paymentMethod === 'card'
                      ? `Card Guarantee on File (${confirmedReservation.cardDetails?.cardNumber})`
                      : confirmedReservation.paymentMethod === 'upi'
                      ? `UPI Direct (${confirmedReservation.upiId})`
                      : `Net Banking (${confirmedReservation.selectedBank})`}
                  </p>

                  <table className="voucher-price-table">
                    <tbody>
                      <tr>
                        <td>Whole Property Rate ({confirmedReservation.villa.name} x {confirmedReservation.nights} nights)</td>
                        <td className="text-right">{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.propertySubtotal)}</td>
                      </tr>
                      {confirmedReservation.ratePlan === 'non_refundable' && (
                        <tr className="voucher-discount-row">
                          <td>Non-Refundable Rate Savings (10% Discount)</td>
                          <td className="text-right">-{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.totalRateDiscount)}</td>
                        </tr>
                      )}
                      {confirmedReservation.selectedTours?.length > 0 && (
                        <tr>
                          <td>Sightseeing Experience Add-ons ({confirmedReservation.selectedTours.length} packages)</td>
                          <td className="text-right">{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.tourSubtotal)}</td>
                        </tr>
                      )}
                      <tr>
                        <td>Estimated GST (12% Government Hospitality Tax)</td>
                        <td className="text-right">{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.estimatedGstAmount)}</td>
                      </tr>
                      <tr>
                        <td>Housekeeping &amp; Property Sanitization Fee</td>
                        <td className="text-right">{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.housekeepingFee)}</td>
                      </tr>
                      <tr className="voucher-total-row">
                        <td><strong>Total Estimated Payable Amount</strong></td>
                        <td className="text-right"><strong>{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.estimatedTotal)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <footer className="voucher-footer">
                  <h4>Villa Stay Policies &amp; Arrival Instructions</h4>
                  <ul>
                    <li>The property concierge will contact the lead guest 24–48 hours prior to arrival to confirm arrival time and key handover.</li>
                    <li>Government-issued photo identification is required for all adult guests during arrival registration.</li>
                    <li>Quiet hours are observed between 10:00 PM and 8:00 AM to respect surrounding residential tranquility.</li>
                    <li>For assistance with this reservation, please contact GrandStay Guest Support at support@grandstay.com.</li>
                  </ul>
                </footer>
              </article>
            </section>
          ) : (
            /* ── MAIN BOOKING REVIEW LAYOUT ── */
            <>
              <header className="villa-booking-heading">
                <div>
                  <span className="villa-booking-eyebrow">Private Property Reservation</span>
                  <h1>Complete Your Villa &amp; Bungalow Booking</h1>
                  <p>Review travel dates, configure your group, select stay preferences, and verify pricing before checkout.</p>
                </div>
                <Link className="villa-booking-back-link" to={returnTo}>
                  {returnLabel}
                </Link>
              </header>

              <form className="villa-booking-layout" onSubmit={handleSubmit} noValidate>
                {/* ── LEFT COLUMN: GUEST DETAILS & BOOKING CONFIGURATION ── */}
                <section className="villa-booking-card villa-guest-panel" aria-labelledby="villa-config-title">
                  <div className="villa-card-heading">
                    <div>
                      <span className="villa-card-eyebrow">Step 1 of 2</span>
                      <h2 id="villa-config-title">Stay &amp; Guest Details</h2>
                    </div>
                  </div>
                  <p className="villa-card-intro">
                    Provide the reservation dates and party details for this whole-property stay.
                  </p>

                  {/* Whole Property Rental Notice Banner */}
                  <div className="villa-whole-property-banner">
                    <div className="villa-banner-badge">Whole Property Booking</div>
                    <div className="villa-banner-content">
                      <strong>You are reserving the entire private residence.</strong>
                      <p>Your party will enjoy exclusive use of the full property, including all {villa.bedrooms} bedrooms, {villa.bathrooms} bathrooms, and private amenities.</p>
                    </div>
                  </div>

                  {/* Travel Dates Picker */}
                  <div className="villa-form-field">
                    <label className="form-field__label" htmlFor="villa-booking-date-range">
                      Check-in / Check-out Dates
                    </label>
                    <DateRangePicker
                      id="villa-booking-date-range"
                      dates={{ checkIn, checkOut }}
                      onChange={(nextDates) => {
                        setCheckIn(nextDates.checkIn);
                        setCheckOut(nextDates.checkOut);
                        setErrors((current) => ({ ...current, checkIn: '', checkOut: '' }));
                      }}
                      label="Travel dates"
                      triggerClassName="date-range-picker-trigger"
                      valueClassName="date-range-picker-trigger__value"
                      ariaDescribedBy={errors.checkIn || errors.checkOut ? 'villa-date-range-error' : undefined}
                      ariaInvalid={Boolean(errors.checkIn || errors.checkOut)}
                    />
                    {(errors.checkIn || errors.checkOut) && (
                      <p id="villa-date-range-error" className="form-field__message form-field__message--error" role="alert">
                        {errors.checkIn || errors.checkOut}
                      </p>
                    )}
                    {nights !== null ? (
                      <p className="villa-night-count" role="status">
                        ✓ {nights} {nights === 1 ? 'night' : 'nights'} selected ({checkIn} to {checkOut})
                      </p>
                    ) : (
                      <p className="villa-inline-note">Please select check-in and check-out dates.</p>
                    )}
                  </div>

                  {/* Whole-Property Guest Allocation */}
                  <div className="villa-section-subblock">
                    <h3 className="villa-subheading">Guests Allocation</h3>
                    <p className="villa-subheading-helper">
                      Specify adults and children for bedding, linen, and amenity preparation.
                    </p>

                    <GuestRoomSelector
                      mode="inline"
                      items={[
                        {
                          id: 'villa-adults',
                          label: 'Adults',
                          subtitle: 'Ages 18 or above',
                          value: adults,
                          min: 1,
                          max: maxCapacity,
                          singularLabel: 'Adult',
                          pluralLabel: 'Adults',
                          onChange: (val) => {
                            setAdults(val);
                            setErrors((c) => ({ ...c, guests: '' }));
                          },
                        },
                        {
                          id: 'villa-children',
                          label: 'Children',
                          subtitle: 'Ages 0 – 17',
                          value: children,
                          min: 0,
                          max: 6,
                          singularLabel: 'Child',
                          pluralLabel: 'Children',
                          onChange: (val) => {
                            handleChildrenCountChange(val);
                            setErrors((c) => ({ ...c, guests: '' }));
                          },
                        },
                      ]}
                    />

                    {/* Dynamic Child Ages Selector */}
                    {children > 0 && (
                      <div className="villa-child-ages-container">
                        <label className="form-field__label">
                          Age of Children at Check-in
                        </label>
                        <p className="villa-subheading-helper">Required to arrange rollaway beds and kid-safe amenities.</p>
                        <div className="villa-child-ages-grid">
                          {Array.from({ length: children }).map((_, idx) => (
                            <div key={idx} className="villa-child-age-field">
                              <label htmlFor={`villa-child-age-${idx}`}>Child {idx + 1} Age</label>
                              <select
                                id={`villa-child-age-${idx}`}
                                className="villa-select-field"
                                value={childAges[idx] ?? 7}
                                onChange={(e) => updateChildAge(idx, e.target.value)}
                              >
                                <option value={0}>Under 1 year (Infant)</option>
                                {Array.from({ length: 17 }).map((_, a) => (
                                  <option key={a + 1} value={a + 1}>
                                    {a + 1} {a + 1 === 1 ? 'year old' : 'years old'}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Capacity Alert */}
                    {capacityError && (
                      <div className="villa-capacity-alert" role="alert">
                        <strong>Property Capacity Exceeded:</strong> {capacityError}
                      </div>
                    )}
                    {errors.guests && (
                      <p className="form-field__message form-field__message--error" role="alert">
                        {errors.guests}
                      </p>
                    )}
                  </div>

                  {/* Lead Guest Contact Information */}
                  <div className="villa-section-subblock">
                    <h3 className="villa-subheading">Lead Guest Information</h3>
                    <p className="villa-subheading-helper">Primary contact for check-in orientation and reservation updates.</p>
                    <div className="villa-guest-fields">
                      <Input
                        label="Full name"
                        id="guest-full-name"
                        name="fullName"
                        autoComplete="name"
                        value={guest.fullName}
                        onChange={updateGuest}
                        error={errors.fullName}
                        required
                      />
                      <Input
                        label="Phone number"
                        id="guest-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={guest.phone}
                        onChange={updateGuest}
                        error={errors.phone}
                        required
                      />
                      <Input
                        label="Email address"
                        id="guest-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={guest.email}
                        onChange={updateGuest}
                        error={errors.email}
                        required
                      />
                    </div>
                  </div>

                  {/* Villa Preferences & Special Requests */}
                  <div className="villa-section-subblock">
                    <h3 className="villa-subheading">Stay Preferences &amp; Concierge Requests</h3>
                    <p className="villa-subheading-helper">Coordinate arrival timing, housekeeping schedule, and shuttle service.</p>

                    <div className="villa-preferences-grid">
                      <div className="villa-preference-item">
                        <label htmlFor="arrival-time">Estimated Arrival Time</label>
                        <SelectDropdown
                          id="arrival-time"
                          value={specialRequests.arrivalTime}
                          options={VILLA_ARRIVAL_OPTIONS}
                          onChange={(val) => updateSpecialRequests('arrivalTime', val)}
                          ariaLabel="Estimated Arrival Time"
                        />
                      </div>

                      <div className="villa-preference-item">
                        <label htmlFor="housekeeping-schedule">Housekeeping Preference</label>
                        <SelectDropdown
                          id="housekeeping-schedule"
                          value={specialRequests.housekeepingSchedule}
                          options={VILLA_HOUSEKEEPING_OPTIONS}
                          onChange={(val) => updateSpecialRequests('housekeepingSchedule', val)}
                          ariaLabel="Housekeeping Preference"
                        />
                      </div>

                      <div className="villa-preference-item villa-preference-full">
                        <label className="checkbox-label" htmlFor="airport-transfer">
                          <input
                            type="checkbox"
                            id="airport-transfer"
                            checked={specialRequests.airportTransfer}
                            onChange={(e) => updateSpecialRequests('airportTransfer', e.target.checked)}
                          />
                          <span>Request Private Airport or Railway Station Transfer (Concierge will confirm vehicle and rates)</span>
                        </label>
                        {specialRequests.airportTransfer && (
                          <div className="flight-number-input">
                            <Input
                              label="Flight / Train Number (Optional)"
                              id="flight-number"
                              name="flightNumber"
                              placeholder="e.g. 6E-204 from Mumbai or Shatabdi Exp"
                              value={specialRequests.flightNumber}
                              onChange={(e) => updateSpecialRequests('flightNumber', e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="villa-preference-item villa-preference-full">
                        <label htmlFor="additional-notes">Additional Notes or Dietary Requirements</label>
                        <textarea
                          id="additional-notes"
                          className="villa-textarea"
                          rows="3"
                          placeholder="e.g. Celebrating an anniversary, baby crib requested, extra towels, quiet stay..."
                          value={specialRequests.additionalNotes}
                          onChange={(e) => updateSpecialRequests('additionalNotes', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="villa-section-subblock">
                    <h3 className="villa-subheading">Payment Method Selection</h3>
                    <p className="villa-subheading-helper">Choose how you wish to guarantee or settle this reservation.</p>

                    <div className="payment-options-grid" role="radiogroup" aria-label="Payment Method Options">
                      {/* Option 1: Pay at Property */}
                      <label className={`payment-option-card ${paymentMethod === 'pay_at_hotel' ? 'is-selected' : ''}`}>
                        <div className="payment-option-header">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="pay_at_hotel"
                            checked={paymentMethod === 'pay_at_hotel'}
                            onChange={() => setPaymentMethod('pay_at_hotel')}
                          />
                          <div>
                            <strong>Pay at Property on Arrival</strong>
                            <span className="payment-badge">Recommended</span>
                          </div>
                        </div>
                        <p className="payment-option-desc">
                          No prepayment required today. Your card is not charged. Settle your reservation upon arrival via Cash, Card, or UPI.
                        </p>
                      </label>

                      {/* Option 2: Card Guarantee */}
                      <label className={`payment-option-card ${paymentMethod === 'card' ? 'is-selected' : ''}`}>
                        <div className="payment-option-header">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={paymentMethod === 'card'}
                            onChange={() => setPaymentMethod('card')}
                          />
                          <div>
                            <strong>Credit or Debit Card (Card Guarantee)</strong>
                          </div>
                        </div>
                        <p className="payment-option-desc">
                          Standard card guarantee procedure to secure your whole-property stay.
                        </p>
                        {paymentMethod === 'card' && (
                          <div className="mock-card-fields" onClick={(e) => e.stopPropagation()}>
                            <Input
                              label="Name on Card"
                              id="card-name"
                              value={cardDetails.cardholderName}
                              onChange={(e) => setCardDetails((p) => ({ ...p, cardholderName: e.target.value }))}
                              error={errors.cardholderName}
                              placeholder="e.g. Ayan Biswas"
                              required
                            />
                            <Input
                              label="Card Number"
                              id="card-number"
                              value={cardDetails.cardNumber}
                              onChange={(e) => setCardDetails((p) => ({ ...p, cardNumber: e.target.value }))}
                              error={errors.cardNumber}
                              placeholder="4111 •••• •••• 8888"
                              maxLength={19}
                              required
                            />
                            <div className="mock-card-row">
                              <Input
                                label="Expiry (MM/YY)"
                                id="card-expiry"
                                value={cardDetails.cardExpiry}
                                onChange={(e) => setCardDetails((p) => ({ ...p, cardExpiry: e.target.value }))}
                                placeholder="12/28"
                                maxLength={5}
                              />
                              <Input
                                label="CVV"
                                id="card-cvv"
                                value={cardDetails.cardCvv}
                                onChange={(e) => setCardDetails((p) => ({ ...p, cardCvv: e.target.value }))}
                                placeholder="•••"
                                maxLength={4}
                              />
                            </div>
                          </div>
                        )}
                      </label>

                      {/* Option 3: UPI */}
                      <label className={`payment-option-card ${paymentMethod === 'upi' ? 'is-selected' : ''}`}>
                        <div className="payment-option-header">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="upi"
                            checked={paymentMethod === 'upi'}
                            onChange={() => setPaymentMethod('upi')}
                          />
                          <div>
                            <strong>UPI / Instant Transfer (India)</strong>
                          </div>
                        </div>
                        <p className="payment-option-desc">
                          Direct payment collect request to your UPI App (Google Pay, PhonePe, Paytm).
                        </p>
                        {paymentMethod === 'upi' && (
                          <div className="mock-upi-field" onClick={(e) => e.stopPropagation()}>
                            <Input
                              label="Virtual Payment Address (UPI ID)"
                              id="upi-id"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="username@okhdfcbank"
                            />
                          </div>
                        )}
                      </label>

                      {/* Option 4: Net Banking */}
                      <label className={`payment-option-card ${paymentMethod === 'netbanking' ? 'is-selected' : ''}`}>
                        <div className="payment-option-header">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="netbanking"
                            checked={paymentMethod === 'netbanking'}
                            onChange={() => setPaymentMethod('netbanking')}
                          />
                          <div>
                            <strong>Net Banking / Online Wallet</strong>
                          </div>
                        </div>
                        <p className="payment-option-desc">
                          Instant payment via your bank's secure gateway.
                        </p>
                        {paymentMethod === 'netbanking' && (
                          <div className="mock-bank-select" onClick={(e) => e.stopPropagation()}>
                            <label htmlFor="bank-select">Select Bank:</label>
                            <select
                              id="bank-select"
                              className="villa-select-field"
                              value={selectedBank}
                              onChange={(e) => setSelectedBank(e.target.value)}
                            >
                              <option value="HDFC Bank">HDFC Bank</option>
                              <option value="State Bank of India">State Bank of India</option>
                              <option value="ICICI Bank">ICICI Bank</option>
                              <option value="Axis Bank">Axis Bank</option>
                              <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                            </select>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {Object.values(errors).some(Boolean) && (
                    <div className="villa-form-error-summary" role="alert">
                      Please correct the highlighted fields before submitting your reservation.
                    </div>
                  )}
                </section>

                {/* ── RIGHT COLUMN: SUMMARY, EXPERIENCES & PRICE BREAKDOWN ── */}
                <div className="villa-side-column">
                  {/* Property Summary Card */}
                  <aside className="villa-card villa-summary-card" aria-labelledby="stay-summary-title">
                    <div className="villa-card-heading">
                      <div>
                        <span className="villa-card-eyebrow">Reservation Summary</span>
                        <h2 id="stay-summary-title">Booking Details</h2>
                      </div>
                    </div>

                    <div className="villa-property-summary">
                      {villa.image && <img src={villa.image} alt={`${villa.name} property`} />}
                      <div>
                        <Badge variant="accent" size="sm">Entire {villa.propertyType} Rental</Badge>
                        <h3 className="villa-prop-name">{villa.name}</h3>
                        <p className="villa-prop-location">
                          <MapPinIcon size={14} /> {villa.location}
                        </p>
                        <div className="villa-prop-rating">
                          <StarIcon size={14} fill="var(--color-accent-600)" />
                          <span>{villa.rating || 4.8} ({villa.reviewCount || 50} reviews)</span>
                        </div>
                      </div>
                    </div>

                    <dl className="villa-stay-summary-dl">
                      <div><dt>Check-in</dt><dd>{checkIn || 'Select date'}</dd></div>
                      <div><dt>Check-out</dt><dd>{checkOut || 'Select date'}</dd></div>
                      <div><dt>Duration</dt><dd>{nights !== null ? `${nights} ${nights === 1 ? 'Night' : 'Nights'}` : 'Select dates'}</dd></div>
                      <div><dt>Property Type</dt><dd>Whole {villa.propertyType}</dd></div>
                      <div><dt>Accommodates</dt><dd>{villa.bedrooms} Bedrooms · {villa.bathrooms} Baths</dd></div>
                      <div><dt>Total Guests</dt><dd>{totalGuests} Guests ({adults} Adults{children > 0 ? `, ${children} Children` : ''})</dd></div>
                    </dl>

                    {/* Property Highlights */}
                    <div className="villa-amenities-highlight">
                      <strong>Included Private Amenities:</strong>
                      <div className="villa-amenities-tags">
                        {villa.amenities?.map((amenity) => (
                          <span key={amenity} className="villa-amenity-tag">✓ {amenity}</span>
                        ))}
                      </div>
                    </div>
                  </aside>

                  {/* Cancellation & Rate Policy */}
                  <section className="villa-card villa-policy-card">
                    <span className="rate-plan-title">Cancellation &amp; Rate Policy:</span>
                    <div className="rate-plan-options">
                      <button
                        type="button"
                        className={`rate-plan-btn ${ratePlan === 'flexible' ? 'is-active' : ''}`}
                        onClick={() => setRatePlan('flexible')}
                      >
                        <span className="rate-plan-name">Flexible Rate</span>
                        <span className="rate-plan-badge">Free Cancellation</span>
                        <small>Cancel free up to 48h before check-in</small>
                      </button>
                      <button
                        type="button"
                        className={`rate-plan-btn ${ratePlan === 'non_refundable' ? 'is-active' : ''}`}
                        onClick={() => setRatePlan('non_refundable')}
                      >
                        <span className="rate-plan-name">Non-Refundable</span>
                        <span className="rate-plan-discount">Save 10%</span>
                        <small>No refund if cancelled or modified</small>
                      </button>
                    </div>
                  </section>

                  {/* Optional Sightseeing Packages */}
                  {matchedTours.length > 0 && (
                    <section className="villa-card villa-tours-card" aria-labelledby="tours-title">
                      <div className="villa-card-heading">
                        <div>
                          <span className="villa-card-eyebrow">Enhance Your Stay</span>
                          <h2 id="tours-title">Sightseeing &amp; Experiences</h2>
                        </div>
                      </div>
                      <p className="villa-tours-intro">
                        Optional guided experiences tailored for your stay in {villa.destination}.
                      </p>

                      <div className="villa-tours-list">
                        {matchedTours.map((tour) => {
                          const isSelected = selectedTourIds.includes(tour.id);
                          const estAmount = calculateTourAmount(tour, totalGuests);
                          return (
                            <div key={tour.id} className={`villa-tour-item ${isSelected ? 'is-selected' : ''}`}>
                              <div className="villa-tour-item-info">
                                <strong>{tour.title}</strong>
                                <span className="villa-tour-meta">{tour.duration} · {tour.badge}</span>
                                <span className="villa-tour-price">
                                  {money(tour.currency, estAmount)} <small>({tour.priceType})</small>
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant={isSelected ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => toggleTour(tour.id)}
                              >
                                {isSelected ? '✓ Added' : '+ Add'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Itemized Price Breakdown */}
                  <section className="villa-card villa-price-breakdown-card" aria-labelledby="price-breakdown-title">
                    <div className="villa-card-heading">
                      <div>
                        <span className="villa-card-eyebrow">Price Summary</span>
                        <h2 id="price-breakdown-title">Itemized Charges</h2>
                      </div>
                    </div>

                    <table className="villa-price-table">
                      <tbody>
                        <tr>
                          <td>
                            Whole Property Rate
                            <br />
                            <small>{money(villa.currency, effectiveRatePerNight)} / night x {nights || 0} nights</small>
                          </td>
                          <td className="text-right">
                            {propertySubtotal !== null ? money(villa.currency, propertySubtotal) : '—'}
                          </td>
                        </tr>
                        {ratePlan === 'non_refundable' && (
                          <tr className="villa-discount-row">
                            <td>Non-Refundable Rate Savings (10% Discount)</td>
                            <td className="text-right">-{money(villa.currency, totalRateDiscount)}</td>
                          </tr>
                        )}
                        {selectedTours.length > 0 && (
                          <tr>
                            <td>
                              Sightseeing Experiences ({selectedTours.length} {selectedTours.length === 1 ? 'package' : 'packages'})
                            </td>
                            <td className="text-right">{money(villa.currency, tourSubtotal)}</td>
                          </tr>
                        )}
                        <tr>
                          <td>Estimated GST (12% Government Hospitality Tax)</td>
                          <td className="text-right">{money(villa.currency, estimatedGstAmount)}</td>
                        </tr>
                        <tr>
                          <td>Housekeeping &amp; Sanitization Fee</td>
                          <td className="text-right">{money(villa.currency, housekeepingFee)}</td>
                        </tr>
                        <tr className="villa-total-row">
                          <td><strong>Total Estimated Payable Amount</strong></td>
                          <td className="text-right">
                            <strong>{estimatedTotal !== null ? money(villa.currency, estimatedTotal) : '—'}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="villa-booking-cta-block">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={!nights || totalGuests < 1 || totalGuests > maxCapacity}
                      >
                        Complete Booking
                      </Button>
                      <p className="villa-cta-guarantee-note">
                        🔒 Free cancellation options available. Settle payment securely.
                      </p>
                    </div>
                  </section>
                </div>
              </form>
            </>
          )}
        </Container>
      </main>

      <Footer />

      <SignInModal
        key={authMode}
        isOpen={isSignInOpen && !currentUser}
        onClose={() => setIsSignInOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setGuest((prev) => ({
            fullName: prev.fullName || user?.name || '',
            email: prev.email || user?.email || '',
            phone: prev.phone || user?.phone || '',
          }));
        }}
        initialMode={authMode}
      />
    </div>
  );
}
