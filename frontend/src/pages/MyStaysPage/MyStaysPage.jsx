import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../../components/layout/Container/Container';
import Header from '../../components/layout/Header/Header';
import Footer from '../../components/layout/Footer/Footer';
import Button from '../../components/common/Button/Button';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import {
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  CheckCircleIcon,
  CloseIcon,
  SparklesIcon,
  CopyIcon,
  SearchIcon,
  HeadphonesIcon,
  ShieldCheckIcon,
} from '../../components/common/Icons';
import {
  getUserBookings,
  cancelBooking,
  subscribeToBookings,
} from '../../services/bookingService';
import { getActiveUserSession, clearActiveUserSession } from '../../data/authSession';
import './MyStaysPage.css';

// Date-based & status classification helpers
const getTodayStr = () => new Date().toISOString().split('T')[0];

const isCancelledStay = (b) => b?.status === 'Cancelled';

const isCompletedStay = (b) => {
  if (!b) return false;
  if (b.status === 'Completed') return true;
  if (b.status === 'Cancelled') return false;
  if (b.checkOut && b.checkOut < getTodayStr()) return true;
  return false;
};

const isUpcomingStay = (b) => {
  if (!b) return false;
  if (isCancelledStay(b)) return false;
  if (isCompletedStay(b)) return false;
  return true;
};

/**
 * ==============================================================================
 * MY STAYS & RESERVATIONS PAGE
 * Project: GrandStay - Multi-Hotel & Villa Booking Platform
 * ==============================================================================
 *
 * Professional guest reservation portal for reviewing confirmed hotel and villa
 * bookings, upcoming stays, vouchers, property check-in details, and cancellations.
 */
export default function MyStaysPage() {
  const navigate = useNavigate();

  // Active user session
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  // Bookings state
  const [bookings, setBookings] = useState(() => getUserBookings(currentUser?.email));
  const [activeTab, setActiveTab] = useState('upcoming'); // 'all' | 'upcoming' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedVoucherStay, setSelectedVoucherStay] = useState(null);
  const [selectedConciergeStay, setSelectedConciergeStay] = useState(null);
  const [selectedCancelStay, setSelectedCancelStay] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of travel plans');

  // Feedback toast
  const [toastMessage, setToastMessage] = useState(null);

  // Subscribe to real-time reservation changes
  useEffect(() => {
    const unsubscribe = subscribeToBookings(() => {
      setBookings(getUserBookings(currentUser?.email));
    });
    return unsubscribe;
  }, [currentUser?.email]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  const handleCopyReference = (ref) => {
    navigator.clipboard?.writeText(ref);
    showToast(`Booking Reference "${ref}" copied to clipboard.`);
  };

  const handleConfirmCancel = () => {
    if (!selectedCancelStay) return;
    const ref = selectedCancelStay.referenceNumber;
    cancelBooking(ref, cancelReason);
    setSelectedCancelStay(null);
    showToast(`Reservation ${ref} has been cancelled.`);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  const handleDownloadTextVoucher = (res) => {
    if (!res) return;
    const content = `
================================================================================
GRANDSTAY LUXURY RESERVATION VOUCHER
================================================================================
Reference Number  : ${res.referenceNumber}
Status            : ${res.status}
Booking Date      : ${res.bookingTimestamp}

PROPERTY DETAILS:
Property Name     : ${res.propertyName}
Type              : ${res.propertyType}
Location          : ${res.location}
Guest Name        : ${res.leadGuest?.fullName || 'Valued Guest'}
Contact Email     : ${res.leadGuest?.email || 'N/A'}
Contact Phone     : ${res.leadGuest?.phone || 'N/A'}

STAY INFORMATION:
Check-in Date     : ${res.checkIn} (From ${res.checkInTime})
Check-out Date    : ${res.checkOut} (Until ${res.checkOutTime})
Duration          : ${res.nights} Night(s)
Accommodation     : ${res.roomName}
Guests            : ${res.guests}

INCLUSIONS:
${res.inclusions.map((inc) => ` • ${inc}`).join('\n')}

FINANCIAL BREAKDOWN:
Total Amount      : ${res.priceBreakdown?.currency || '₹'}${(res.priceBreakdown?.estimatedTotal || 0).toLocaleString('en-IN')}
Payment Status    : ${res.paymentStatus} (${res.paymentSummary})

CANCELLATION POLICY:
${res.cancellationPolicy}
================================================================================
Thank you for booking with GrandStay. 24/7 Concierge: concierge@grandstay.luxury
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GrandStay-Voucher-${res.referenceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Voucher for ${res.referenceNumber} downloaded.`);
  };

  const handleSignOut = () => {
    clearActiveUserSession();
    setCurrentUser(null);
    showToast('Signed out of guest session.');
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setIsSignInOpen(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setIsSignInOpen(true);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsSignInOpen(false);
    setBookings(getUserBookings(user?.email));
  };

  // Counts
  const upcomingCount = bookings.filter(isUpcomingStay).length;
  const completedCount = bookings.filter(isCompletedStay).length;
  const cancelledCount = bookings.filter(isCancelledStay).length;

  // Filtered list
  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (activeTab === 'upcoming') {
      list = list.filter(isUpcomingStay);
    } else if (activeTab === 'completed') {
      list = list.filter(isCompletedStay);
    } else if (activeTab === 'cancelled') {
      list = list.filter(isCancelledStay);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.propertyName?.toLowerCase().includes(q) ||
          b.location?.toLowerCase().includes(q) ||
          b.referenceNumber?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, activeTab, searchQuery]);

  const displayName = typeof currentUser === 'object' && currentUser !== null
    ? currentUser.name
    : currentUser || 'Ayan Biswas';

  return (
    <div className="my-stays-page">
      <Header
        currentUser={currentUser}
        onOpenSignIn={openSignIn}
        onOpenRegister={openRegister}
        onSignOut={handleSignOut}
      />

      <main id="main-content" className="my-stays-page__main">
        <Container size="lg">
          {/* Breadcrumb */}
          <nav className="my-stays-page__breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="my-stays-page__breadcrumb-separator" aria-hidden="true">›</span>
            <span className="my-stays-page__breadcrumb-current" aria-current="page">My Stays</span>
          </nav>

          {/* Hero Banner */}
          <section className="my-stays-hero" aria-labelledby="my-stays-title">
            <div className="my-stays-hero__top">
              <div>
                <span className="my-stays-hero__eyebrow">
                  <SparklesIcon size={14} />
                  Guest Reservation Hub • GrandStay Privilege
                </span>
                <h1 id="my-stays-title" className="my-stays-hero__title">
                  My Stays &amp; Reservations
                </h1>
                <p className="my-stays-hero__subtitle">
                  Manage your upcoming luxury getaways, access confirmed booking vouchers,
                  inspect property specifications, and track your travel history.
                </p>
              </div>
            </div>

            {/* Quick Stats Ribbon */}
            <div className="my-stays-stats">
              <div className="my-stays-stat-item">
                <span className="my-stays-stat-num">{bookings.length}</span>
                <span className="my-stays-stat-label">Total Reservations</span>
              </div>
              <div className="my-stays-stat-item">
                <span className="my-stays-stat-num">{upcomingCount}</span>
                <span className="my-stays-stat-label">Upcoming Stays</span>
              </div>
              <div className="my-stays-stat-item">
                <span className="my-stays-stat-num">{completedCount}</span>
                <span className="my-stays-stat-label">Completed Stays</span>
              </div>
              <div className="my-stays-stat-item">
                <span className="my-stays-stat-num">24 / 7</span>
                <span className="my-stays-stat-label">VIP Concierge</span>
              </div>
            </div>
          </section>

          {/* Filter Tabs & Search Bar */}
          <section className="my-stays-controls" aria-label="Reservation filters">
            <div className="my-stays-tabs" role="tablist" aria-label="Filter stays by status">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'upcoming'}
                className={`my-stays-tab ${activeTab === 'upcoming' ? 'my-stays-tab--active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming Stays
                <span className="my-stays-tab-count">{upcomingCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`my-stays-tab ${activeTab === 'all' ? 'my-stays-tab--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Stays
                <span className="my-stays-tab-count">{bookings.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'completed'}
                className={`my-stays-tab ${activeTab === 'completed' ? 'my-stays-tab--active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                Completed
                <span className="my-stays-tab-count">{completedCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'cancelled'}
                className={`my-stays-tab ${activeTab === 'cancelled' ? 'my-stays-tab--active' : ''}`}
                onClick={() => setActiveTab('cancelled')}
              >
                Cancelled
                <span className="my-stays-tab-count">{cancelledCount}</span>
              </button>
            </div>

            <div className="my-stays-search">
              <SearchIcon size={16} />
              <input
                type="search"
                placeholder="Search by hotel, villa or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search bookings by hotel name or reference number"
              />
            </div>
          </section>

          {/* List of Stays */}
          {filteredBookings.length > 0 ? (
            <section className="my-stays-list" aria-label="Bookings list">
              {filteredBookings.map((stay) => {
                const isUpcoming = isUpcomingStay(stay);
                const isCompleted = isCompletedStay(stay);
                const isCancelled = isCancelledStay(stay);
                const isVilla = stay.type === 'villa';

                return (
                  <article key={stay.id} className="stay-card">
                    {/* Stay Card Header */}
                    <div className="stay-card__header">
                      <div className="stay-card__thumbnail-wrap">
                        <img
                          src={stay.image}
                          alt={stay.propertyName}
                          className="stay-card__thumbnail"
                          loading="lazy"
                        />
                        <span className="stay-card__type-badge">{stay.propertyType}</span>
                      </div>

                      <div className="stay-card__primary-info">
                        <div className="stay-card__title-row">
                          <h2 className="stay-card__title">{stay.propertyName}</h2>
                          <div className="stay-card__rating">
                            <StarIcon size={14} fill="currentColor" />
                            <span>{stay.rating}</span>
                            <span className="stay-card__detail-sub">({stay.reviewCount} reviews)</span>
                          </div>
                        </div>

                        <div className="stay-card__location">
                          <MapPinIcon size={15} />
                          <span>{stay.location}</span>
                        </div>

                        <div className="stay-card__detail-sub" style={{ marginTop: '4px' }}>
                          Booked by <strong>{stay.leadGuest?.fullName || displayName}</strong> • Reference:
                          <button
                            type="button"
                            className="stay-ref-chip"
                            onClick={() => handleCopyReference(stay.referenceNumber)}
                            title="Click to copy booking reference"
                          >
                            <span>{stay.referenceNumber}</span>
                            <CopyIcon size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="stay-card__status-wrap">
                        {isUpcoming && (
                          <span className="stay-status-badge stay-status-badge--confirmed">
                            <CheckCircleIcon size={14} />
                            Confirmed &amp; Guaranteed
                          </span>
                        )}
                        {isCompleted && (
                          <span className="stay-status-badge stay-status-badge--completed">
                            ✓ Stay Completed
                          </span>
                        )}
                        {isCancelled && (
                          <span className="stay-status-badge stay-status-badge--cancelled">
                            ✕ Cancelled
                          </span>
                        )}
                        <span className="stay-card__detail-sub">
                          {stay.bookingTimestamp}
                        </span>
                      </div>
                    </div>

                    {/* Stay Specs Grid */}
                    <div className="stay-card__details">
                      <div className="stay-card__detail-block">
                        <span className="stay-card__detail-label">
                          <CalendarIcon size={13} /> Check-In &amp; Arrival
                        </span>
                        <span className="stay-card__detail-val">{stay.checkIn}</span>
                        <span className="stay-card__detail-time-highlight">
                          🕒 Arrival: {stay.arrivalTime || `From ${stay.checkInTime}`}
                        </span>
                      </div>

                      <div className="stay-card__detail-block">
                        <span className="stay-card__detail-label">
                          <CalendarIcon size={13} /> Check-Out &amp; Leaving
                        </span>
                        <span className="stay-card__detail-val">{stay.checkOut}</span>
                        <span className="stay-card__detail-time-highlight">
                          🚪 Leaving: {stay.leavingTime || `Until ${stay.checkOutTime}`}
                        </span>
                      </div>

                      <div className="stay-card__detail-block">
                        <span className="stay-card__detail-label">Duration &amp; Party</span>
                        <span className="stay-card__detail-val">
                          {stay.nights} {stay.nights === 1 ? 'Night' : 'Nights'} • {stay.guests}
                        </span>
                        <span className="stay-card__detail-sub">{stay.roomName}</span>
                      </div>

                      <div className="stay-card__detail-block">
                        <span className="stay-card__detail-label">Financial Total</span>
                        <span className="stay-card__detail-val">
                          {stay.priceBreakdown?.currency || '₹'}
                          {(stay.priceBreakdown?.estimatedTotal || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="stay-card__detail-sub">
                          {stay.paymentStatus} ({stay.paymentMethod?.toUpperCase()})
                        </span>
                      </div>
                    </div>

                    {/* Inclusions & Tour Add-ons */}
                    {((stay.inclusions && stay.inclusions.length > 0) || (stay.selectedTours && stay.selectedTours.length > 0)) && (
                      <div className="stay-card__inclusions">
                        {stay.inclusions?.slice(0, 3).map((inc, i) => (
                          <span key={i} className="stay-card__inclusion-tag">
                            ✓ {inc}
                          </span>
                        ))}
                        {stay.selectedTours?.map((tour) => (
                          <span key={tour.id} className="stay-card__tour-tag">
                            🧭 Tour Add-on: {tour.title}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Policy Notice Bar */}
                    <div className={`stay-card__policy-bar ${isUpcoming && stay.isFreeCancellationEligible ? 'stay-card__policy-bar--eligible' : ''} ${isCancelled ? 'stay-card__policy-bar--cancelled' : ''}`}>
                      <ShieldCheckIcon size={15} />
                      <div>
                        <span>{stay.cancellationPolicy}</span>
                        {isCancelled && stay.cancellationReason && (
                          <div style={{ marginTop: '4px', fontSize: '12px', color: '#991b1b' }}>
                            <strong>Cancellation Reason:</strong> {stay.cancellationReason} {stay.cancellationTimestamp ? `(${stay.cancellationTimestamp})` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="stay-card__footer">
                      <div className="stay-card__actions-left">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedVoucherStay(stay)}
                        >
                          📄 View Official Voucher
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(isVilla ? `/villas/${stay.propertyId}` : `/hotels/${stay.propertyId}`)}
                        >
                          View Property
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedConciergeStay(stay)}
                        >
                          <HeadphonesIcon size={14} />
                          Concierge Assistance
                        </Button>
                      </div>

                      <div className="stay-card__actions-right">
                        {isUpcoming && (
                          <button
                            type="button"
                            className="stay-cancel-btn"
                            onClick={() => setSelectedCancelStay(stay)}
                          >
                            Cancel Stay
                          </button>
                        )}
                        {isCompleted && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Past stay completed</span>
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => navigate(isVilla ? `/villas/${stay.propertyId}` : `/hotels/${stay.propertyId}`)}
                            >
                              Book Again
                            </Button>
                          </div>
                        )}
                        {isCancelled && (
                          <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                            Reservation Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            /* Empty State */
            <section className="my-stays-empty" aria-label="No stays found">
              <div className="my-stays-empty__icon-wrap" aria-hidden="true">
                <CalendarIcon size={34} />
              </div>
              <h2 className="my-stays-empty__title">
                {bookings.length === 0 ? 'No Stays Booked Yet' : 'No Stays Found'}
              </h2>
              <p className="my-stays-empty__desc">
                {bookings.length === 0
                  ? 'Plan your next extraordinary escape across India’s premier luxury hotels and private beachfront residences.'
                  : `There are currently no stays matching the "${activeTab}" filter${searchQuery ? ` and query "${searchQuery}"` : ''}.`}
              </p>
              <div className="my-stays-empty__actions">
                <Button
                  variant="primary"
                  onClick={() => {
                    navigate('/hotels');
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                >
                  Explore Hotels &amp; Resorts
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate('/villas');
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                >
                  Discover Private Villas
                </Button>
              </div>
            </section>
          )}
        </Container>
      </main>

      <Footer />

      {/* Official Voucher Modal */}
      {selectedVoucherStay && (
        <div
          className="my-stays-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voucher-dialog-title"
          onClick={() => setSelectedVoucherStay(null)}
        >
          <div className="my-stays-dialog my-stays-dialog--wide" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="my-stays-dialog__close"
              onClick={() => setSelectedVoucherStay(null)}
              aria-label="Close voucher dialog"
            >
              <CloseIcon size={18} />
            </button>

            <div className="my-stays-dialog__header">
              <span className="my-stays-hero__eyebrow" style={{ color: '#0369a1' }}>
                <ShieldCheckIcon size={14} /> Official Reservation Confirmation
              </span>
              <h2 id="voucher-dialog-title" className="my-stays-dialog__title">
                {selectedVoucherStay.propertyName}
              </h2>
              <p className="my-stays-dialog__desc">
                Reference Code: <strong>{selectedVoucherStay.referenceNumber}</strong> • Status: <strong>{selectedVoucherStay.status}</strong>
              </p>
            </div>

            <div className="voucher-modal-card">
              <div className="voucher-modal-row">
                <span className="voucher-modal-label">Guest Name</span>
                <span className="voucher-modal-val">{selectedVoucherStay.leadGuest?.fullName || displayName}</span>
              </div>
              <div className="voucher-modal-row">
                <span className="voucher-modal-label">Check-In &amp; Arrival</span>
                <span className="voucher-modal-val">{selectedVoucherStay.checkIn} ({selectedVoucherStay.arrivalTime || `From ${selectedVoucherStay.checkInTime}`})</span>
              </div>
              <div className="voucher-modal-row">
                <span className="voucher-modal-label">Check-Out &amp; Leaving</span>
                <span className="voucher-modal-val">{selectedVoucherStay.checkOut} ({selectedVoucherStay.leavingTime || `Until ${selectedVoucherStay.checkOutTime}`})</span>
              </div>
              <div className="voucher-modal-row">
                <span className="voucher-modal-label">Duration &amp; Guests</span>
                <span className="voucher-modal-val">{selectedVoucherStay.nights} Nights • {selectedVoucherStay.guests}</span>
              </div>
              <div className="voucher-modal-row">
                <span className="voucher-modal-label">Accommodation</span>
                <span className="voucher-modal-val">{selectedVoucherStay.roomName}</span>
              </div>
              <div className="voucher-modal-row">
                <span className="voucher-modal-label">Payment Summary</span>
                <span className="voucher-modal-val">{selectedVoucherStay.paymentSummary}</span>
              </div>
              <div className="voucher-modal-row">
                <span className="voucher-modal-label">Total Amount</span>
                <span className="voucher-modal-val voucher-modal-total">
                  {selectedVoucherStay.priceBreakdown?.currency || '₹'}
                  {(selectedVoucherStay.priceBreakdown?.estimatedTotal || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button variant="outline" size="sm" onClick={() => handleDownloadTextVoucher(selectedVoucherStay)}>
                📄 Download Text
              </Button>
              <Button variant="primary" size="sm" onClick={handlePrintVoucher}>
                🖨️ Print / Save PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Concierge Modal */}
      {selectedConciergeStay && (
        <div
          className="my-stays-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="concierge-dialog-title"
          onClick={() => setSelectedConciergeStay(null)}
        >
          <div className="my-stays-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="my-stays-dialog__close"
              onClick={() => setSelectedConciergeStay(null)}
              aria-label="Close concierge dialog"
            >
              <CloseIcon size={18} />
            </button>

            <div className="my-stays-dialog__header">
              <span className="my-stays-hero__eyebrow" style={{ color: '#0369a1' }}>
                <HeadphonesIcon size={14} /> VIP Concierge &amp; Host Support
              </span>
              <h2 id="concierge-dialog-title" className="my-stays-dialog__title">
                {selectedConciergeStay.propertyName}
              </h2>
              <p className="my-stays-dialog__desc">
                Direct hotel &amp; villa hospitality desk for booking {selectedConciergeStay.referenceNumber}.
              </p>
            </div>

            <div className="concierge-box">
              <div className="concierge-contact-item">
                <div className="concierge-icon-circle"><HeadphonesIcon size={18} /></div>
                <div>
                  <strong>Front Desk / Concierge Desk</strong>
                  <div style={{ color: '#0284c7', fontWeight: 600 }}>+91 1800 200 4726 / +91 832 248 9000</div>
                  <small style={{ color: '#64748b' }}>Available 24 hours, 7 days a week</small>
                </div>
              </div>

              <div className="concierge-contact-item">
                <div className="concierge-icon-circle">📍</div>
                <div>
                  <strong>Property Location</strong>
                  <div style={{ color: '#334155' }}>{selectedConciergeStay.location}</div>
                  <small style={{ color: '#64748b' }}>Airport transfers can be arranged with 24h prior notice.</small>
                </div>
              </div>

              <div className="concierge-contact-item">
                <div className="concierge-icon-circle">✉️</div>
                <div>
                  <strong>Email Hospitality Desk</strong>
                  <div style={{ color: '#0284c7', fontWeight: 600 }}>concierge@grandstay.luxury</div>
                  <small style={{ color: '#64748b' }}>Response guaranteed within 2 hours</small>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" size="sm" onClick={() => setSelectedConciergeStay(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Stay Confirmation Modal */}
      {selectedCancelStay && (
        <div
          className="my-stays-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          onClick={() => setSelectedCancelStay(null)}
        >
          <div className="my-stays-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="my-stays-dialog__close"
              onClick={() => setSelectedCancelStay(null)}
              aria-label="Close cancellation dialog"
            >
              <CloseIcon size={18} />
            </button>

            <div className="my-stays-dialog__header">
              <span className="my-stays-hero__eyebrow" style={{ color: '#dc2626' }}>
                ⚠️ Cancellation Request
              </span>
              <h2 id="cancel-dialog-title" className="my-stays-dialog__title">
                Cancel Your Stay?
              </h2>
              <p className="my-stays-dialog__desc">
                Are you sure you wish to cancel your stay at <strong>{selectedCancelStay.propertyName}</strong> (Ref: {selectedCancelStay.referenceNumber})?
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="cancel-reason" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                Please select a reason for cancellation:
              </label>
              <select
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '14px',
                  color: '#0f172a',
                }}
              >
                <option value="Change of travel plans">Change of travel plans</option>
                <option value="Booked wrong dates or room">Booked wrong dates or room</option>
                <option value="Emergency or unforeseen circumstance">Emergency or unforeseen circumstance</option>
                <option value="Found an alternative accommodation">Found an alternative accommodation</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedCancelStay(null)}>
                Keep Reservation
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmCancel} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="hotels-toast" role="status" aria-live="polite">
          <CheckCircleIcon size={18} className="hotels-toast__icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sign-in Modal */}
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
