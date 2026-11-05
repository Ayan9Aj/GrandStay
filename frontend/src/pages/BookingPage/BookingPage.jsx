import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  UsersIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';
import { SAMPLE_TOURS } from '../../data/sampleTours';
import { clearActiveUserSession, getActiveUserSession } from '../../data/authSession';
import { getHotelById } from '../../services/hotelService';
import { addBooking } from '../../services/bookingService';
import './BookingPage.css';

const HOTEL_BED_OPTIONS = [
  { value: 'no_preference', label: 'No preference (Hotel assigns)' },
  { value: 'king', label: '1 Large King Bed' },
  { value: 'twin', label: '2 Twin / Single Beds' },
];

const HOTEL_ARRIVAL_OPTIONS = [
  { value: 'flexible', label: "I don't know yet" },
  { value: '12:00 - 14:00', label: '12:00 PM – 2:00 PM (Early check-in subject to availability)' },
  { value: '14:00 - 16:00', label: '2:00 PM – 4:00 PM (Standard check-in)' },
  { value: '16:00 - 18:00', label: '4:00 PM – 6:00 PM' },
  { value: '18:00 - 20:00', label: '6:00 PM – 8:00 PM' },
  { value: 'after_20:00', label: 'After 8:00 PM (Late arrival)' },
];

const HOTEL_SMOKING_OPTIONS = [
  { value: 'non_smoking', label: 'Non-Smoking Room (Recommended)' },
  { value: 'smoking', label: 'Smoking Room (Subject to hotel policy)' },
];

const CHILD_AGE_OPTIONS = [
  { value: '0', label: 'Under 1 year (Infant)' },
  ...Array.from({ length: 17 }).map((_, a) => ({
    value: String(a + 1),
    label: `${a + 1} ${a + 1 === 1 ? 'year old' : 'years old'}`,
  })),
];


// ── Date and Money helpers ────────────────────────────────────────────────────
const isDateOnly = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
  !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

const calculateNights = (checkIn, checkOut) => {
  if (!isDateOnly(checkIn) || !isDateOnly(checkOut)) return null;
  const difference = new Date(`${checkOut}T00:00:00Z`) - new Date(`${checkIn}T00:00:00Z`);
  return difference > 0 ? difference / 86400000 : null;
};

const formatIsoDate = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const getDefaultBookingDates = () => {
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + 1);
  const checkOutDate = new Date();
  checkOutDate.setDate(checkOutDate.getDate() + 3);
  return {
    checkIn: formatIsoDate(checkInDate),
    checkOut: formatIsoDate(checkOutDate),
  };
};

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
  return `GS-${year}-${randomChars}`;
};

const getFormattedBookingTimestamp = () =>
  new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const previousPath = useRef(null);
  const confirmationHeading = useRef(null);

  const booking = location.state?.booking || {};
  const hotel = booking?.hotelId ? getHotelById(booking.hotelId) : null;

  // Selected room index defaults to state or first room (0)
  const initialRoomIndex =
    hotel && Number.isInteger(booking?.roomIndex) && hotel.rooms?.[booking.roomIndex]
      ? booking.roomIndex
      : hotel?.rooms?.length
      ? 0
      : null;

  const [selectedRoomIndex, setSelectedRoomIndex] = useState(initialRoomIndex);
  const room = selectedRoomIndex === null || !hotel?.rooms?.[selectedRoomIndex] ? null : hotel.rooms[selectedRoomIndex];

  // Dates
  const [checkIn, setCheckIn] = useState(() => {
    if (isDateOnly(booking?.checkIn)) return booking.checkIn;
    return getDefaultBookingDates().checkIn;
  });
  const [checkOut, setCheckOut] = useState(() => {
    if (isDateOnly(booking?.checkOut)) return booking.checkOut;
    return getDefaultBookingDates().checkOut;
  });

  // Rate Option: 'flexible' (Free cancellation) vs 'non_refundable' (10% discount)
  const [ratePlan, setRatePlan] = useState('flexible');

  // Multi-room support (1 to 4 rooms)
  const [roomCount, setRoomCount] = useState(() => {
    const parsed = Number(booking?.roomCount);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 4 ? parsed : 1;
  });

  // Adult & Child guest allocation
  const initialAdults = () => {
    const parsed = Number(booking?.adults || booking?.guests);
    return Number.isInteger(parsed) && parsed >= 1 ? Math.min(parsed, 10) : 2;
  };
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(() => {
    const parsed = Number(booking?.children);
    return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, 6) : 0;
  });
  const [childAges, setChildAges] = useState(() => (Array.isArray(booking?.childAges) ? booking.childAges : []));

  // Multi-room guest name assignments
  const [roomGuests, setRoomGuests] = useState(() => [
    { roomNum: 1, guestName: '', isLead: true },
    { roomNum: 2, guestName: '', isLead: false },
    { roomNum: 3, guestName: '', isLead: false },
    { roomNum: 4, guestName: '', isLead: false },
  ]);

  // Authentication
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setIsSignInOpen] = useState(() => !getActiveUserSession() && Boolean(booking?.hotelId));
  const [authMode, setAuthMode] = useState('signin');

  // Lead guest contact initialized directly from current session if present
  const [guest, setGuest] = useState(() => {
    const session = getActiveUserSession();
    return {
      fullName: session?.name || '',
      email: session?.email || '',
      phone: '',
    };
  });

  // Special requests
  const [specialRequests, setSpecialRequests] = useState({
    bedPreference: 'no_preference',
    arrivalTime: 'flexible',
    smokingPreference: 'non_smoking',
    airportTransfer: false,
    flightNumber: '',
    additionalNotes: '',
  });

  // Payment method selection UI (Pay at hotel, Card, UPI, Netbanking)
  const [paymentMethod, setPaymentMethod] = useState('pay_at_hotel');
  const [cardDetails, setCardDetails] = useState({
    cardholderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Selected tours carried from previous steps
  const [selectedTourIds, setSelectedTourIds] = useState(() =>
    Array.isArray(booking?.tourIds) ? booking.tourIds : []
  );

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  // Adjust child ages array when children count changes
  const handleChildrenCountChange = (count) => {
    const num = Math.max(0, Math.min(6, Number(count) || 0));
    setChildren(num);
    setChildAges((prev) => {
      const updated = [...prev];
      if (num > prev.length) {
        for (let i = prev.length; i < num; i++) {
          updated.push(7); // default 7 years
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

  const updateRoomGuestName = (index, name) => {
    setRoomGuests((prev) => {
      const copy = [...prev];
      if (copy[index]) copy[index].guestName = name;
      return copy;
    });
  };

  // Scroll restoration
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

  // Navigation targets
  const returnTo = safeInternalPath(location.state?.returnTo, hotel ? `/hotels/${hotel.id}` : '/hotels');
  const browseTo = safeInternalPath(location.state?.browseTo, '/hotels');
  const returnLabel = returnTo.startsWith('/hotels/') ? 'Back to property details' : 'Back to hotel browsing';

  // Calculations
  const nights = calculateNights(checkIn, checkOut);
  const totalGuests = adults + children;
  const maxRoomCapacity = typeof room?.maxGuests === 'number' ? room.maxGuests : 2;
  const totalCapacity = maxRoomCapacity * roomCount;
  const capacityError =
    totalGuests > totalCapacity
      ? `Selected room accommodates up to ${maxRoomCapacity} guests each (${totalCapacity} total for ${roomCount} ${roomCount === 1 ? 'room' : 'rooms'}). You have ${totalGuests} guests.`
      : '';

  // Room Pricing
  const baseRatePerNight = typeof room?.price === 'number' && Number.isFinite(room.price) ? room.price : 0;
  // Non-refundable discount = 10%
  const rateMultiplier = ratePlan === 'non_refundable' ? 0.9 : 1.0;
  const effectiveRatePerNight = Math.round(baseRatePerNight * rateMultiplier);
  const rateDiscountPerNight = baseRatePerNight - effectiveRatePerNight;
  const totalRateDiscount = nights !== null ? rateDiscountPerNight * nights * roomCount : 0;
  const roomSubtotal = nights !== null && baseRatePerNight > 0 ? effectiveRatePerNight * nights * roomCount : null;

  // Selected Tours
  const selectedTours = (() => {
    if (!hotel || !Array.isArray(selectedTourIds)) return [];
    return SAMPLE_TOURS.filter(
      (tour) =>
        selectedTourIds.includes(tour.id) &&
        tour.destination?.trim().toLowerCase() === hotel.destination?.trim().toLowerCase()
    );
  })();

  const toursWithAmounts = selectedTours.map((tour) => ({
    ...tour,
    estimatedAmount: calculateTourAmount(tour, totalGuests),
  }));

  const tourSubtotal =
    selectedTours.length === 0
      ? 0
      : toursWithAmounts.reduce((sum, tour) => sum + (tour.estimatedAmount || 0), 0);

  // Taxes and Fees (Item 4: Clearly label estimated demo charges)
  // GST 12% standard on hospitality
  const estimatedGstAmount = roomSubtotal !== null ? Math.round(roomSubtotal * 0.12) : 0;
  // Resort & Service Fee: ₹250 per room per night
  const estimatedResortFee = nights !== null ? roomCount * nights * 250 : 0;

  const estimatedTotal =
    roomSubtotal !== null
      ? roomSubtotal + (tourSubtotal || 0) + estimatedGstAmount + estimatedResortFee
      : null;

  const removeTour = (tourId) => {
    setSelectedTourIds((prev) => prev.filter((id) => id !== tourId));
  };

  const selectRoom = (index) => {
    if (!hotel?.rooms?.[index]) return;
    setSelectedRoomIndex(index);
    setErrors((prev) => ({ ...prev, room: '', capacity: '' }));
  };

  const updateGuest = (event) => {
    const { name, value } = event.target;
    setGuest((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const updateSpecialRequests = (field, value) => {
    setSpecialRequests((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!room) nextErrors.room = 'Please select a room category before proceeding.';
    if (!isDateOnly(checkIn)) nextErrors.checkIn = 'Choose a valid check-in date.';
    if (!isDateOnly(checkOut)) nextErrors.checkOut = 'Choose a valid check-out date.';
    else if (isDateOnly(checkIn) && calculateNights(checkIn, checkOut) === null) {
      nextErrors.checkOut = 'Check-out date must be after check-in date.';
    }

    if (totalGuests < 1) {
      nextErrors.guests = 'Please allocate at least 1 adult guest.';
    } else if (totalGuests > totalCapacity) {
      nextErrors.capacity = capacityError;
    }

    if (!guest.fullName.trim()) nextErrors.fullName = 'Lead guest full name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(guest.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    const digits = guest.phone.replace(/\D/g, '');
    if (!/^[+()\d.\s-]+$/.test(guest.phone.trim()) || digits.length < 7 || digits.length > 15) {
      nextErrors.phone = 'Please enter a valid phone number (7-15 digits).';
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.cardholderName.trim()) nextErrors.cardholderName = 'Name on card is required.';
      if (cardDetails.cardNumber.replace(/\s/g, '').length < 15) {
        nextErrors.cardNumber = 'Enter a valid 15-16 digit card number.';
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.includes('@')) nextErrors.upiId = 'Enter a valid UPI ID (e.g. name@bank).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateForm()) {
      const reservationData = {
        referenceNumber: generateBookingReference(),
        hotel,
        room,
        selectedRoomIndex,
        roomCount,
        checkIn,
        checkOut,
        nights,
        adults,
        children,
        childAges,
        totalGuests,
        leadGuest: { ...guest },
        roomGuests: roomGuests.slice(0, roomCount),
        ratePlan,
        specialRequests: { ...specialRequests },
        paymentMethod,
        cardDetails: paymentMethod === 'card' ? { ...cardDetails, cardNumber: `•••• •••• •••• ${cardDetails.cardNumber.slice(-4) || '8888'}` } : null,
        upiId: paymentMethod === 'upi' ? upiId : null,
        selectedBank: paymentMethod === 'netbanking' ? selectedBank : null,
        selectedTours: toursWithAmounts,
        priceBreakdown: {
          baseRatePerNight,
          effectiveRatePerNight,
          rateDiscountPerNight,
          totalRateDiscount,
          roomSubtotal,
          tourSubtotal,
          estimatedGstAmount,
          estimatedResortFee,
          estimatedTotal,
          currency: hotel.currency || '₹',
        },
        timestamp: getFormattedBookingTimestamp(),
        status: 'Confirmed',
      };
      addBooking(reservationData);
      setConfirmedReservation(reservationData);
      setSubmitted(true);
    }
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  const handleDownloadTextVoucher = () => {
    if (!confirmedReservation) return;
    const res = confirmedReservation;
    const content = `
================================================================================
GRANDSTAY LUXURY HOTEL & RESORT BOOKINGS
OFFICIAL RESERVATION CONFIRMATION VOUCHER
================================================================================
Booking Reference : ${res.referenceNumber}
Status            : ${res.status}
Booking Date      : ${res.timestamp}

PROPERTY INFORMATION:
Hotel Name        : ${res.hotel.name}
Location          : ${res.hotel.location}
Property Type     : ${res.hotel.propertyType || 'Luxury Hotel'}
Official Check-in : ${res.hotel.policies?.checkIn || '2:00 PM'}
Official Check-out: ${res.hotel.policies?.checkOut || '11:00 AM'}

RESERVATION SCHEDULE:
Check-in Date     : ${res.checkIn}
Check-out Date    : ${res.checkOut}
Duration          : ${res.nights} night(s)
Number of Rooms   : ${res.roomCount} room(s)
Room Type         : ${res.room.type} (${res.room.bed || 'King Bed'})
Rate Plan         : ${res.ratePlan === 'non_refundable' ? 'Non-Refundable (10% Discount)' : 'Flexible Rate (Free Cancellation)'}

GUEST DETAILS:
Lead Guest Name   : ${res.leadGuest.fullName}
Email Address     : ${res.leadGuest.email}
Phone Number      : ${res.leadGuest.phone}
Total Party       : ${res.totalGuests} Guests (${res.adults} Adults, ${res.children} Children)
${res.children > 0 ? `Child Ages        : ${res.childAges.join(', ')} years old\n` : ''}
${res.roomCount > 1 ? `Room Allocations  : ${res.roomGuests.map((rg, idx) => `Room ${idx + 1}: ${rg.guestName || (idx === 0 ? res.leadGuest.fullName : 'Additional Guest')}`).join(' | ')}\n` : ''}
SPECIAL REQUESTS:
Bed Preference    : ${res.specialRequests.bedPreference}
Est. Arrival Time : ${res.specialRequests.arrivalTime}
Smoking Pref.     : ${res.specialRequests.smokingPreference}
Airport Transfer  : ${res.specialRequests.airportTransfer ? `Requested (Flight: ${res.specialRequests.flightNumber || 'To be shared'})` : 'None requested'}
Additional Notes  : ${res.specialRequests.additionalNotes || 'None'}

PAYMENT METHOD:
Selected Method   : ${res.paymentMethod === 'pay_at_hotel' ? 'Pay at Hotel Front Desk on Arrival' : res.paymentMethod === 'card' ? `Card Guarantee (${res.cardDetails?.cardNumber})` : res.paymentMethod === 'upi' ? `UPI (${res.upiId})` : `Net Banking (${res.selectedBank})`}

ITEMIZED PRICE BREAKDOWN (${res.priceBreakdown.currency}):
Room Rate         : ${money(res.priceBreakdown.currency, res.priceBreakdown.effectiveRatePerNight)} / night x ${res.nights} nights x ${res.roomCount} room(s)
Room Subtotal     : ${money(res.priceBreakdown.currency, res.priceBreakdown.roomSubtotal)}
${res.ratePlan === 'non_refundable' ? `Rate Savings      : -${money(res.priceBreakdown.currency, res.priceBreakdown.totalRateDiscount)} (10% Non-refundable discount)\n` : ''}${res.selectedTours?.length ? `Sightseeing Tours : ${money(res.priceBreakdown.currency, res.priceBreakdown.tourSubtotal)}\n` : ''}Taxes (12% GST)   : ${money(res.priceBreakdown.currency, res.priceBreakdown.estimatedGstAmount)}
Resort & Service  : ${money(res.priceBreakdown.currency, res.priceBreakdown.estimatedResortFee)}
--------------------------------------------------------------------------------
TOTAL AMOUNT DUE  : ${money(res.priceBreakdown.currency, res.priceBreakdown.estimatedTotal)}
--------------------------------------------------------------------------------
================================================================================
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GrandStay-Voucher-${res.referenceNumber}.txt`;
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
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to={browseTo}>Hotels &amp; Resorts</Link>
            <span aria-hidden="true">/</span>
            {hotel && (
              <>
                <Link to={`/hotels/${hotel.id}`}>{hotel.name}</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span aria-current="page">Booking Review &amp; Checkout</span>
          </nav>

          {!currentUser && hotel ? (
            <section className="booking-auth-required" aria-labelledby="booking-auth-title">
              <Badge variant="accent" size="sm">Prototype Authentication</Badge>
              <h1 id="booking-auth-title">Sign in to continue your booking</h1>
              <p>Your selected hotel and travel dates are preserved while you log in or register a guest profile.</p>
              <Button variant="accent" onClick={() => { setAuthMode('signin'); setIsSignInOpen(true); }}>
                Sign In or Register
              </Button>
            </section>
          ) : !hotel ? (
            <section className="booking-missing-context">
              <EmptyState
                title="No Hotel Selected"
                description="Please select an accommodation from the hotel catalog before opening the checkout review."
                actionText="Browse Hotels"
                onAction={() => navigate('/hotels')}
              />
            </section>
          ) : submitted && confirmedReservation ? (
            /* ── ITEM 9 & 10: CONFIRMATION VIEW & PRINTABLE VOUCHER ── */
            <section className="booking-confirmation-container" role="status" aria-labelledby="booking-confirmation-title">
              <div className="booking-confirmation-header no-print">
                <div className="booking-confirmation-status-pill">
                  <CheckCircleIcon size={20} className="status-icon" />
                  <span>{confirmedReservation.status}</span>
                </div>
                <h1 ref={confirmationHeading} tabIndex="-1" id="booking-confirmation-title">
                  Your Booking Request is Confirmed!
                </h1>
                <p className="booking-confirmation-ref-line">
                  Reservation Reference: <strong>{confirmedReservation.referenceNumber}</strong>
                </p>

                <div className="booking-confirmation-actions">
                  <Button variant="primary" size="md" onClick={handlePrintVoucher} className="booking-print-btn">
                    🖨️ Print / Save Voucher as PDF
                  </Button>
                  <Button variant="accent" size="md" onClick={() => navigate('/my-stays')}>
                    📋 View in My Stays
                  </Button>
                  <Button variant="outline" size="md" onClick={handleDownloadTextVoucher}>
                    📄 Download Voucher (Text)
                  </Button>
                  <Button variant="text" size="md" onClick={() => navigate('/hotels')}>
                    Browse More Hotels
                  </Button>
                </div>
              </div>

              {/* Printable Official Voucher Document */}
              <article className="booking-voucher">
                <header className="voucher-header">
                  <div className="voucher-brand">
                    <span className="voucher-logo-text">GrandStay</span>
                    <span className="voucher-sub">Luxury Hotel &amp; Resort Reservations</span>
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
                    <h3>Accommodation Details</h3>
                    <div className="voucher-hotel-info">
                      <strong className="voucher-hotel-name">{confirmedReservation.hotel.name}</strong>
                      <p className="voucher-hotel-address">{confirmedReservation.hotel.location}</p>
                      <p className="voucher-small-note">
                        <strong>Check-in:</strong> {confirmedReservation.hotel.policies?.checkIn || '2:00 PM'} · <strong>Check-out:</strong> {confirmedReservation.hotel.policies?.checkOut || '11:00 AM'}
                      </p>
                    </div>
                  </div>

                  <div className="voucher-block">
                    <h3>Stay Schedule</h3>
                    <dl className="voucher-dl">
                      <div><dt>Check-in</dt><dd><strong>{confirmedReservation.checkIn}</strong></dd></div>
                      <div><dt>Check-out</dt><dd><strong>{confirmedReservation.checkOut}</strong></dd></div>
                      <div><dt>Total Length</dt><dd>{confirmedReservation.nights} {confirmedReservation.nights === 1 ? 'Night' : 'Nights'}</dd></div>
                      <div><dt>Rooms Booked</dt><dd>{confirmedReservation.roomCount} {confirmedReservation.roomCount === 1 ? 'Room' : 'Rooms'}</dd></div>
                    </dl>
                  </div>
                </div>

                <div className="voucher-grid">
                  <div className="voucher-block">
                    <h3>Room &amp; Rate Category</h3>
                    <p className="voucher-room-name"><strong>{confirmedReservation.room.type}</strong></p>
                    <p className="voucher-room-bed">{confirmedReservation.room.bed || 'King Bed'}</p>
                    <span className="voucher-rate-pill">
                      {confirmedReservation.ratePlan === 'non_refundable'
                        ? 'Non-Refundable Rate (10% Discount applied)'
                        : 'Flexible Rate (Free Cancellation up to 48h prior)'}
                    </span>
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
                    {confirmedReservation.roomCount > 1 && (
                      <div className="voucher-room-allocations">
                        <small><strong>Room Allocation:</strong></small>
                        <ul>
                          {confirmedReservation.roomGuests.map((rg, idx) => (
                            <li key={idx}>Room {idx + 1}: {rg.guestName || (idx === 0 ? confirmedReservation.leadGuest.fullName : 'Additional Guest')}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Requests summary */}
                <div className="voucher-block voucher-full-width">
                  <h3>Guest Preferences &amp; Special Requests</h3>
                  <div className="voucher-preferences-list">
                    <span><strong>Bed:</strong> {confirmedReservation.specialRequests.bedPreference === 'king' ? '1 King Bed' : confirmedReservation.specialRequests.bedPreference === 'twin' ? '2 Twin Beds' : 'No Preference'}</span>
                    <span><strong>Est. Arrival:</strong> {confirmedReservation.specialRequests.arrivalTime}</span>
                    <span><strong>Smoking:</strong> {confirmedReservation.specialRequests.smokingPreference === 'non_smoking' ? 'Non-smoking Room' : 'Smoking Room'}</span>
                    <span><strong>Airport Shuttle:</strong> {confirmedReservation.specialRequests.airportTransfer ? `Yes (Flight: ${confirmedReservation.specialRequests.flightNumber || 'Pending'})` : 'No'}</span>
                    {confirmedReservation.specialRequests.additionalNotes && (
                      <span className="voucher-notes"><strong>Notes:</strong> {confirmedReservation.specialRequests.additionalNotes}</span>
                    )}
                  </div>
                </div>

                {/* Payment & Price Receipt */}
                <div className="voucher-receipt-block voucher-full-width">
                  <h3>Payment Guarantee &amp; Final Price Receipt</h3>
                  <p className="voucher-payment-method">
                    <strong>Payment Mode: </strong>
                    {confirmedReservation.paymentMethod === 'pay_at_hotel'
                      ? 'Pay at Hotel Front Desk on Arrival'
                      : confirmedReservation.paymentMethod === 'card'
                      ? `Card Guarantee on File (${confirmedReservation.cardDetails?.cardNumber})`
                      : confirmedReservation.paymentMethod === 'upi'
                      ? `UPI Direct (${confirmedReservation.upiId})`
                      : `Net Banking (${confirmedReservation.selectedBank})`}
                  </p>

                  <table className="voucher-price-table">
                    <tbody>
                      <tr>
                        <td>Room Rate ({confirmedReservation.room.type} x {confirmedReservation.nights} nights x {confirmedReservation.roomCount} rooms)</td>
                        <td className="text-right">{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.roomSubtotal)}</td>
                      </tr>
                      {confirmedReservation.ratePlan === 'non_refundable' && (
                        <tr className="voucher-discount-row">
                          <td>Non-Refundable Rate Savings (10% Discount)</td>
                          <td className="text-right">-{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.totalRateDiscount)}</td>
                        </tr>
                      )}
                      {confirmedReservation.selectedTours?.length > 0 && (
                        <tr>
                          <td>Sightseeing Tour Add-ons ({confirmedReservation.selectedTours.length} packages)</td>
                          <td className="text-right">{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.tourSubtotal)}</td>
                        </tr>
                      )}
                      <tr>
                        <td>Estimated GST (12% Government Hospitality Tax)</td>
                        <td className="text-right">{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.estimatedGstAmount)}</td>
                      </tr>
                      <tr>
                        <td>Estimated Resort, Housekeeping &amp; Service Fee</td>
                        <td className="text-right">{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.estimatedResortFee)}</td>
                      </tr>
                      <tr className="voucher-total-row">
                        <td><strong>Total Estimated Payable Amount</strong></td>
                        <td className="text-right"><strong>{money(confirmedReservation.priceBreakdown.currency, confirmedReservation.priceBreakdown.estimatedTotal)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          ) : (
            /* ── ITEM 2 & 3: MAIN BOOKING REVIEW LAYOUT (LEFT: GUEST/STAY, RIGHT: SUMMARY & ROOM SELECTION) ── */
            <>
              <header className="booking-heading">
                <div>
                  <span className="booking-eyebrow">Hotel Reservation Review</span>
                  <h1>Complete Your Hotel Booking</h1>
                  <p>Review dates, configure rooms &amp; guests, select special preferences, and verify pricing before checkout.</p>
                </div>
                <Link className="booking-back-link" to={returnTo} state={{ selectedTourIds, selectedRoomIndex, from: browseTo }}>
                  {returnLabel}
                </Link>
              </header>

              <form className="booking-layout booking-review-layout" onSubmit={handleSubmit} noValidate>
                {/* ── LEFT COLUMN: GUEST DETAILS & BOOKING CONFIGURATION ── */}
                <section className="booking-card booking-guest-form booking-guest-panel" aria-labelledby="booking-config-title">
                  <div className="booking-card-heading">
                    <div>
                      <span className="booking-eyebrow">Step 1 of 2</span>
                      <h2 id="booking-config-title">Stay &amp; Guest Details</h2>
                    </div>
                  </div>
                  <p className="booking-form-intro">
                    Provide the reservation dates, number of rooms, and party details.
                  </p>

                  {/* Travel Dates Picker */}
                  <div className="booking-date-field">
                    <label className="form-field__label" htmlFor="booking-date-range">
                      Check-in / Check-out Dates
                    </label>
                    <DateRangePicker
                      id="booking-date-range"
                      dates={{ checkIn, checkOut }}
                      onChange={(nextDates) => {
                        setCheckIn(nextDates.checkIn);
                        setCheckOut(nextDates.checkOut);
                        setErrors((current) => ({ ...current, checkIn: '', checkOut: '' }));
                      }}
                      label="Travel dates"
                      triggerClassName="date-range-picker-trigger"
                      valueClassName="date-range-picker-trigger__value"
                      ariaDescribedBy={errors.checkIn || errors.checkOut ? 'booking-date-range-error' : undefined}
                      ariaInvalid={Boolean(errors.checkIn || errors.checkOut)}
                    />
                    {(errors.checkIn || errors.checkOut) && (
                      <p id="booking-date-range-error" className="form-field__message form-field__message--error" role="alert">
                        {errors.checkIn || errors.checkOut}
                      </p>
                    )}
                    {nights !== null ? (
                      <p className="booking-night-count" role="status">
                        ✓ {nights} {nights === 1 ? 'night' : 'nights'} selected ({checkIn} to {checkOut})
                      </p>
                    ) : (
                      <p className="booking-inline-note">Please select check-in and check-out dates.</p>
                    )}
                  </div>

                  {/* ── ITEM 6: MULTI-ROOM BOOKING SUPPORT ── */}
                  <div className="booking-section-subblock">
                    <h3 className="booking-subheading">Room Quantity</h3>
                    <p className="booking-subheading-helper">Book multiple rooms under the same reservation reference.</p>
                    <GuestRoomSelector
                      mode="inline"
                      id="booking-room-count"
                      label="Number of Rooms"
                      value={roomCount}
                      min={1}
                      max={4}
                      singularLabel="Room"
                      pluralLabel="Rooms"
                      onChange={(newCount) => setRoomCount(newCount)}
                    />
                    <p className="booking-stepper-note">
                      Capacity: {totalCapacity} guests total with current room selection.
                    </p>
                  </div>

                  {/* ── ITEM 7: ADULT AND CHILD ALLOCATION & VALIDATION ── */}
                  <div className="booking-section-subblock">
                    <h3 className="booking-subheading">Guests Allocation</h3>
                    <p className="booking-subheading-helper">Specify adults, children, and child ages to ensure appropriate bedding and amenities.</p>
                    
                    <GuestRoomSelector
                      mode="inline"
                      items={[
                        {
                          id: 'booking-adults',
                          label: 'Adults',
                          subtitle: '(Age 18+)',
                          value: adults,
                          min: 1,
                          max: 10,
                          singularLabel: 'Adult',
                          pluralLabel: 'Adults',
                          onChange: (newVal) => {
                            setAdults(newVal);
                            setErrors((prev) => ({ ...prev, capacity: '' }));
                          },
                        },
                        {
                          id: 'booking-children',
                          label: 'Children',
                          subtitle: '(Ages 0 - 17)',
                          value: children,
                          min: 0,
                          max: 6,
                          singularLabel: 'Child',
                          pluralLabel: 'Children',
                          onChange: (newVal) => {
                            handleChildrenCountChange(newVal);
                            setErrors((prev) => ({ ...prev, capacity: '' }));
                          },
                        },
                      ]}
                    />

                    {/* Dynamic Child Age Pickers */}
                    {children > 0 && (
                      <div className="child-ages-container">
                        <span className="child-ages-label">Age of each child at check-in:</span>
                        <div className="child-ages-grid">
                          {Array.from({ length: children }).map((_, idx) => (
                            <div key={idx} className="child-age-item">
                              <label htmlFor={`child-age-${idx}`}>Child {idx + 1} Age</label>
                              <SelectDropdown
                                id={`child-age-${idx}`}
                                value={String(childAges[idx] ?? 7)}
                                options={CHILD_AGE_OPTIONS}
                                onChange={(val) => updateChildAge(idx, Number(val))}
                                ariaLabel={`Child ${idx + 1} Age`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Room Capacity Validation Alert */}
                    {capacityError && (
                      <div className="booking-capacity-alert" role="alert">
                        <strong>Room Capacity Exceeded:</strong> {capacityError}
                        <span>Please increase room count or select a higher-capacity suite in the summary panel on the right.</span>
                      </div>
                    )}
                  </div>

                  {/* Multi-Room Guest Names (Item 6) */}
                  {roomCount > 1 && (
                    <div className="booking-section-subblock">
                      <h3 className="booking-subheading">Room Guest Assignments</h3>
                      <p className="booking-subheading-helper">Assign primary occupants to each of your {roomCount} rooms.</p>
                      <div className="multi-room-assignments-grid">
                        {Array.from({ length: roomCount }).map((_, idx) => (
                          <div key={idx} className="room-assignment-card">
                            <span className="room-num-badge">Room {idx + 1}</span>
                            {idx === 0 ? (
                              <p className="lead-guest-indicator">Lead guest: <strong>{guest.fullName || 'Enter name below'}</strong></p>
                            ) : (
                              <Input
                                label={`Guest for Room ${idx + 1}`}
                                id={`room-guest-${idx + 1}`}
                                name={`roomGuest${idx + 1}`}
                                placeholder="Full name of room occupant"
                                value={roomGuests[idx]?.guestName || ''}
                                onChange={(e) => updateRoomGuestName(idx, e.target.value)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lead Guest Contact Information */}
                  <div className="booking-section-subblock">
                    <h3 className="booking-subheading">Lead Guest Information</h3>
                    <div className="booking-guest-fields">
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

                  {/* ── ITEM 8: SPECIAL REQUESTS ── */}
                  <div className="booking-section-subblock booking-special-requests-block">
                    <div className="booking-card-heading">
                      <div>
                        <h3 className="booking-subheading">Special Requests &amp; Preferences</h3>
                        <p className="booking-subheading-helper">Tailor your stay with optional bed setups, estimated arrival, and shuttle needs.</p>
                      </div>
                    </div>

                    <div className="special-requests-grid">
                      <div className="special-request-item">
                        <label htmlFor="bed-preference">Bed Preference</label>
                        <SelectDropdown
                          id="bed-preference"
                          value={specialRequests.bedPreference}
                          options={HOTEL_BED_OPTIONS}
                          onChange={(val) => updateSpecialRequests('bedPreference', val)}
                          ariaLabel="Bed Preference"
                        />
                      </div>

                      <div className="special-request-item">
                        <label htmlFor="arrival-time">Estimated Arrival Time</label>
                        <SelectDropdown
                          id="arrival-time"
                          value={specialRequests.arrivalTime}
                          options={HOTEL_ARRIVAL_OPTIONS}
                          onChange={(val) => updateSpecialRequests('arrivalTime', val)}
                          ariaLabel="Estimated Arrival Time"
                        />
                      </div>

                      <div className="special-request-item">
                        <label htmlFor="smoking-preference">Room Smoking Policy</label>
                        <SelectDropdown
                          id="smoking-preference"
                          value={specialRequests.smokingPreference}
                          options={HOTEL_SMOKING_OPTIONS}
                          onChange={(val) => updateSpecialRequests('smokingPreference', val)}
                          ariaLabel="Room Smoking Policy"
                        />
                      </div>

                      <div className="special-request-item special-request-full">
                        <label className="checkbox-label" htmlFor="airport-transfer">
                          <input
                            type="checkbox"
                            id="airport-transfer"
                            checked={specialRequests.airportTransfer}
                            onChange={(e) => updateSpecialRequests('airportTransfer', e.target.checked)}
                          />
                          <span>Request Airport / Railway Shuttle Service (Concierge will contact you regarding schedules and applicable fees)</span>
                        </label>
                        {specialRequests.airportTransfer && (
                          <div className="flight-number-input">
                            <Input
                              label="Flight / Train Number (Optional)"
                              id="flight-number"
                              name="flightNumber"
                              placeholder="e.g. 6E-204 from Mumbai"
                              value={specialRequests.flightNumber}
                              onChange={(e) => updateSpecialRequests('flightNumber', e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="special-request-item special-request-full">
                        <label htmlFor="additional-notes">Additional Notes or Dietary Requirements</label>
                        <textarea
                          id="additional-notes"
                          className="booking-textarea"
                          rows="3"
                          placeholder="e.g. Quiet room preferred, celebrating an anniversary, feather-free pillows, wheelchair access..."
                          value={specialRequests.additionalNotes}
                          onChange={(e) => updateSpecialRequests('additionalNotes', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="special-requests-disclaimer">
                      ℹ️ <strong>Please note:</strong> Special requests are subject to hotel availability upon check-in and cannot be guaranteed in advance. Additional fees may apply for certain requests (e.g. airport transfers or extra rollaway beds).
                    </div>
                  </div>

                  {/* ── ITEM 11: PAYMENT METHOD SELECTION UI ── */}
                  <div className="booking-section-subblock booking-payment-block">
                    <div className="booking-card-heading">
                      <div>
                        <h3 className="booking-subheading">Payment Method Selection</h3>
                        <p className="booking-subheading-helper">Choose how you wish to guarantee or settle this reservation.</p>
                      </div>
                    </div>

                    <div className="payment-options-grid" role="radiogroup" aria-label="Payment Method Options">
                      {/* Option 1: Pay at Hotel */}
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
                            <strong>Pay at Hotel Front Desk</strong>
                            <span className="payment-badge">Recommended</span>
                          </div>
                        </div>
                        <p className="payment-option-desc">
                          No prepayment required today. Your card is not charged. You will settle the bill directly at the hotel upon arrival via Cash, Card, or UPI.
                        </p>
                      </label>

                      {/* Option 2: Credit / Debit Card Guarantee */}
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
                          Standard hotel card guarantee procedure.
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
                              error={errors.upiId}
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
                              className="booking-select-field"
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
                    <div className="booking-form-error-summary" role="alert">
                      Please correct the highlighted fields before submitting your reservation review.
                    </div>
                  )}
                </section>

                {/* ── RIGHT COLUMN: SUMMARY, ROOM SELECTION, & PRICE BREAKDOWN ── */}
                <div className="booking-side-column">
                  {/* Summary Card */}
                  <aside className="booking-card booking-price-card booking-summary-card" aria-labelledby="stay-summary-title">
                    <div className="booking-card-heading">
                      <div>
                        <span className="booking-eyebrow">Reservation Summary</span>
                        <h2 id="stay-summary-title">Booking Details</h2>
                      </div>
                    </div>

                    <div className="booking-property-summary">
                      {hotel.image && <img src={hotel.image} alt={`${hotel.name} property`} />}
                      <div>
                        <h3 className="booking-hotel-name">{hotel.name}</h3>
                        <p className="booking-hotel-location">
                          <MapPinIcon size={14} /> {hotel.location}
                        </p>
                        <div className="booking-hotel-rating">
                          <StarIcon size={14} fill="var(--color-accent-600)" />
                          <span>{hotel.rating || 4.8} ({hotel.reviewCount || 100}+ reviews)</span>
                        </div>
                      </div>
                    </div>

                    <dl className="booking-room-summary">
                      <div><dt>Check-in</dt><dd>{checkIn || 'Select date'}</dd></div>
                      <div><dt>Check-out</dt><dd>{checkOut || 'Select date'}</dd></div>
                      <div><dt>Duration</dt><dd>{nights !== null ? `${nights} ${nights === 1 ? 'Night' : 'Nights'}` : 'Select dates'}</dd></div>
                      <div><dt>Room Type</dt><dd>{room?.type || 'Select room below'}</dd></div>
                      <div><dt>Rooms Booked</dt><dd>{roomCount} {roomCount === 1 ? 'Room' : 'Rooms'}</dd></div>
                      <div><dt>Total Guests</dt><dd>{totalGuests} Guests ({adults} Adults{children > 0 ? `, ${children} Children` : ''})</dd></div>
                    </dl>
                  </aside>

                  {/* ── ITEM 2 & 5: ROOM SELECTION AREA (IN RIGHT COLUMN, BELOW SUMMARY) ── */}
                  <section className="booking-card booking-room-selector" aria-labelledby="room-selection-title">
                    <div className="booking-card-heading">
                      <div>
                        <span className="booking-eyebrow">Choose Your Room</span>
                        <h2 id="room-selection-title">Select Room Category</h2>
                      </div>
                    </div>
                    <p className="booking-room-selector__intro">
                      Switch room category for your stay. Pricing updates dynamically in the breakdown below.
                    </p>

                    {/* ITEM 5: Refundable vs Non-Refundable Rate Selector */}
                    <div className="rate-plan-toggle-box">
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
                    </div>

                    {errors.room && <p className="booking-form-error-summary" role="alert">{errors.room}</p>}

                    {hotel.rooms?.length ? (
                      <div className="booking-room-options">
                        {hotel.rooms.map((roomOption, index) => {
                          const isSelected = selectedRoomIndex === index;
                          const roomCapacity = typeof roomOption.maxGuests === 'number' ? roomOption.maxGuests : 2;
                          const totalAvailableCapacity = roomCapacity * roomCount;
                          const exceedsCap = totalGuests > totalAvailableCapacity;
                          const effectiveRoomPrice = ratePlan === 'non_refundable' ? Math.round(roomOption.price * 0.9) : roomOption.price;

                          return (
                            <article
                              className={`booking-room-option ${isSelected ? 'is-selected' : ''}`}
                              key={`${roomOption.type || 'room'}-${index}`}
                            >
                              <div className="booking-room-option__details">
                                <div className="booking-room-title-row">
                                  <h3>{roomOption.type || `Room ${index + 1}`}</h3>
                                  {isSelected && <Badge variant="accent" size="sm">Current Choice</Badge>}
                                </div>
                                <p className="room-bed-info">{roomOption.bed || 'Comfortable Luxury Bedding'}</p>
                                
                                <div className="booking-room-option__facts">
                                  <span className="room-cap-tag">
                                    <UsersIcon size={14} /> Up to {roomCapacity} guests / room
                                  </span>
                                  <strong className="room-price-tag">
                                    {money(hotel.currency, effectiveRoomPrice)} <small>/ night</small>
                                  </strong>
                                </div>

                                {isSelected && exceedsCap && (
                                  <p className="booking-room-option__capacity-error" role="alert">
                                    ⚠️ {totalGuests} guests exceed capacity for {roomCount} of this room.
                                  </p>
                                )}
                              </div>

                              <Button
                                type="button"
                                variant={isSelected ? 'accent' : 'outline'}
                                size="sm"
                                className="booking-room-option__select"
                                aria-pressed={isSelected}
                                onClick={() => selectRoom(index)}
                              >
                                {isSelected ? 'Selected' : 'Select Room'}
                              </Button>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="booking-inline-note">No rooms listed for this hotel.</p>
                    )}
                  </section>

                  {/* ── ITEM 4: DETAILED PRICE BREAKDOWN ── */}
                  <aside className="booking-card booking-price-card" aria-labelledby="detailed-price-title">
                    <div className="booking-card-heading">
                      <div>
                        <span className="booking-eyebrow">Itemized Cost</span>
                        <h2 id="detailed-price-title">Detailed Price Breakdown</h2>
                      </div>
                    </div>

                    {room ? (
                      <dl className="booking-price-lines">
                        <div>
                          <dt>Room Base Rate</dt>
                          <dd>{money(hotel.currency, baseRatePerNight)} / night</dd>
                        </div>
                        <div>
                          <dt>Stay Duration</dt>
                          <dd>{nights !== null ? `${nights} nights` : 'Dates pending'}</dd>
                        </div>
                        <div>
                          <dt>Room Quantity</dt>
                          <dd>{roomCount} {roomCount === 1 ? 'room' : 'rooms'}</dd>
                        </div>

                        {ratePlan === 'non_refundable' && (
                          <div className="booking-price-discount-line">
                            <dt>Non-Refundable Rate Savings (-10%)</dt>
                            <dd className="discount-val">-{money(hotel.currency, totalRateDiscount)}</dd>
                          </div>
                        )}

                        <div className="booking-price-subtotal">
                          <dt>Room Subtotal ({ratePlan === 'non_refundable' ? 'Discounted' : 'Flexible'})</dt>
                          <dd>{roomSubtotal !== null ? money(hotel.currency, roomSubtotal) : 'Pending dates'}</dd>
                        </div>

                        {/* Optional Tours */}
                        {selectedTours.length > 0 && (
                          <div className="booking-price-tour-line">
                            <dt>Optional Tours ({selectedTours.length})</dt>
                            <dd>{money(hotel.currency, tourSubtotal)}</dd>
                          </div>
                        )}

                        {/* Item 4: Explicitly labeled demo charges */}
                        <div>
                          <dt>Estimated GST (12%)</dt>
                          <dd>{money(hotel.currency, estimatedGstAmount)}</dd>
                        </div>

                        <div>
                          <dt>Estimated Resort &amp; Service Fee</dt>
                          <dd>{money(hotel.currency, estimatedResortFee)}</dd>
                        </div>

                        <div className="booking-price-total">
                          <dt>Estimated Final Total (Incl. Taxes)</dt>
                          <dd>{estimatedTotal !== null ? money(hotel.currency, estimatedTotal) : 'Calculating...'}</dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="booking-inline-note">Please select a room to view the itemized price breakdown.</p>
                    )}

                    {/* Selected tours list with remove buttons */}
                    {selectedTours.length > 0 && (
                      <div className="booking-summary-tours">
                        <h3>Selected Sightseeing Packages</h3>
                        <ul className="booking-tour-list">
                          {toursWithAmounts.map((tour) => (
                            <li key={tour.id}>
                              <div>
                                <strong>{tour.title}</strong>
                                <span>{money(tour.currency, tour.price)} · {tour.priceType}</span>
                                <span>Estimated: {money(tour.currency, tour.estimatedAmount)}</span>
                              </div>
                              <Button
                                type="button"
                                variant="text"
                                size="sm"
                                onClick={() => removeTour(tour.id)}
                                aria-label={`Remove ${tour.title}`}
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </aside>

                  {/* Submit CTA */}
                  <div className="booking-summary-action">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={!room || Boolean(capacityError) || nights === null}
                      className="booking-submit-btn"
                    >
                      {room ? 'Complete Booking' : 'Select a room category to continue'}
                    </Button>
                  </div>
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
            ...prev,
            fullName: prev.fullName || user?.name || '',
            email: prev.email || user?.email || '',
          }));
        }}
        initialMode={authMode}
      />
    </div>
  );
}
