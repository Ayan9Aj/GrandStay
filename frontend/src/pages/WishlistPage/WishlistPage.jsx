import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Container from '../../components/layout/Container/Container';
import Header from '../../components/layout/Header/Header';
import Footer from '../../components/layout/Footer/Footer';
import HotelCard from '../../components/common/HotelCard/HotelCard';
import Button from '../../components/common/Button/Button';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import {
  HeartIcon,
  CheckCircleIcon,
  CloseIcon,
  SparklesIcon,
} from '../../components/common/Icons';
import {
  getWishlistItems,
  removeWishlistItem,
  clearWishlist,
  subscribeToWishlist,
} from '../../services/wishlistService';
import { getActiveUserSession, clearActiveUserSession } from '../../data/authSession';
import { getDefaultRentalDates } from '../../utils/rentalDates';
import './WishlistPage.css';

/**
 * ==============================================================================
 * WISHLIST PAGE COMPONENT
 * Project: GrandStay - Multi-Hotel & Villa Booking Platform
 * ==============================================================================
 *
 * Dedicated Wishlist view showcasing saved luxury hotels, resorts, and private
 * villas. Enables category filtering, property inspection, direct booking,
 * individual removal, and batch clearing.
 */
export default function WishlistPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState(() => getWishlistItems());
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'hotels' | 'villas'
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Authentication states
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [pendingBooking, setPendingBooking] = useState(null);

  // Subscribe to external changes (e.g., changes made in other tabs or components)
  useEffect(() => {
    const unsubscribe = subscribeToWishlist(({ items: latestItems }) => {
      setItems(latestItems);
    });
    return unsubscribe;
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  const handleRemoveItem = (item) => {
    removeWishlistItem(item.id);
    showToast(`Removed "${item.name}" from your Wishlist`);
  };

  const handleClearAll = () => {
    clearWishlist();
    setShowClearConfirm(false);
    showToast('Your Wishlist has been cleared.');
  };

  // Direct Booking Handler
  const handleBookNow = (item) => {
    const isVilla =
      item.category === 'villa' ||
      item.rentalCategory ||
      item.bedrooms !== undefined ||
      item.propertyType === 'Villa' ||
      item.propertyType === 'Bungalow';

    if (isVilla) {
      const dates = getDefaultRentalDates();
      const guests = Math.min(2, item.guestCapacity || 4);
      const bookingUrl = `/villas/${item.id}/booking?checkIn=${encodeURIComponent(dates.checkIn)}&checkOut=${encodeURIComponent(dates.checkOut)}&guests=${guests}`;
      const bookingState = {
        booking: { villaId: item.id, ...dates, guests },
        returnTo: `${location.pathname}${location.search}`,
      };

      if (!currentUser) {
        setPendingBooking({ type: 'villa', url: bookingUrl, state: bookingState });
        setAuthMode('signin');
        setIsSignInOpen(true);
        return;
      }
      navigate(bookingUrl, { state: bookingState });
    } else {
      // Hotel booking
      const state = {
        booking: {
          hotelId: item.id,
          roomIndex: 0,
          checkIn: '',
          checkOut: '',
          guests: '2',
          tourIds: [],
        },
        returnTo: `${location.pathname}${location.search}`,
        browseTo: `${location.pathname}${location.search}`,
      };

      if (!currentUser) {
        setPendingBooking({ type: 'hotel', url: '/booking', state });
        setAuthMode('signin');
        setIsSignInOpen(true);
        return;
      }
      navigate('/booking', { state });
    }
  };

  const handleViewDetails = (item) => {
    const isVilla =
      item.category === 'villa' ||
      item.rentalCategory ||
      item.bedrooms !== undefined ||
      item.propertyType === 'Villa' ||
      item.propertyType === 'Bungalow';

    const path = isVilla ? `/villas/${item.id}` : `/hotels/${item.id}`;
    navigate(path, { state: { from: `${location.pathname}${location.search}` } });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (pendingBooking) {
      const { url, state } = pendingBooking;
      setPendingBooking(null);
      navigate(url, { state });
    }
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setIsSignInOpen(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setIsSignInOpen(true);
  };

  const handleSignOut = () => {
    clearActiveUserSession();
    setCurrentUser(null);
    showToast('Signed out of guest session.');
  };

  // Filter items according to active tab
  const hotelItems = items.filter(
    (item) =>
      item.category === 'hotel' ||
      (!item.rentalCategory && item.bedrooms === undefined && item.propertyType !== 'Villa' && item.propertyType !== 'Bungalow')
  );

  const villaItems = items.filter(
    (item) =>
      item.category === 'villa' ||
      item.rentalCategory ||
      item.bedrooms !== undefined ||
      item.propertyType === 'Villa' ||
      item.propertyType === 'Bungalow'
  );

  let filteredItems = items;
  if (activeTab === 'hotels') filteredItems = hotelItems;
  if (activeTab === 'villas') filteredItems = villaItems;

  return (
    <div className="wishlist-page">
      <Header
        currentUser={currentUser}
        onOpenSignIn={openSignIn}
        onOpenRegister={openRegister}
        onSignOut={handleSignOut}
      />

      <main id="main-content" className="wishlist-page__main">
        <Container size="lg">
          {/* Breadcrumb Navigation */}
          <nav className="wishlist-page__breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="wishlist-page__breadcrumb-separator" aria-hidden="true">›</span>
            <span className="wishlist-page__breadcrumb-current" aria-current="page">Wishlist</span>
          </nav>

          {/* Header Banner */}
          <header className="wishlist-page__header">
            <div className="wishlist-page__title-wrap">
              <span className="wishlist-page__eyebrow">
                <SparklesIcon size={14} />
                Saved Stays &amp; Properties
              </span>
              <h1 className="wishlist-page__title">My Wishlist</h1>
              <p className="wishlist-page__subtitle">
                Keep track of the premier hotels, luxury resorts, and private villas
                you love for quick comparison and future bookings.
              </p>
            </div>

            {items.length > 0 && (
              <div className="wishlist-page__header-actions">
                <span className="wishlist-page__count-badge">
                  <HeartIcon size={14} filled />
                  {items.length} {items.length === 1 ? 'Stay' : 'Stays'} Saved
                </span>
                <button
                  type="button"
                  className="wishlist-page__clear-btn"
                  onClick={() => setShowClearConfirm(true)}
                  aria-label="Clear all stays from wishlist"
                >
                  <CloseIcon size={14} />
                  Clear All
                </button>
              </div>
            )}
          </header>

          {/* Tabs Filter Bar (Only shown when there are items) */}
          {items.length > 0 && (
            <div className="wishlist-page__tabs-bar">
              <div className="wishlist-page__tabs" role="tablist" aria-label="Filter saved stays">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'all'}
                  className={`wishlist-page__tab ${activeTab === 'all' ? 'wishlist-page__tab--active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Saved Stays
                  <span className="wishlist-page__tab-count">{items.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'hotels'}
                  className={`wishlist-page__tab ${activeTab === 'hotels' ? 'wishlist-page__tab--active' : ''}`}
                  onClick={() => setActiveTab('hotels')}
                >
                  Hotels &amp; Resorts
                  <span className="wishlist-page__tab-count">{hotelItems.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'villas'}
                  className={`wishlist-page__tab ${activeTab === 'villas' ? 'wishlist-page__tab--active' : ''}`}
                  onClick={() => setActiveTab('villas')}
                >
                  Villas &amp; Bungalows
                  <span className="wishlist-page__tab-count">{villaItems.length}</span>
                </button>
              </div>
            </div>
          )}

          {/* Grid of Saved Properties */}
          {filteredItems.length > 0 ? (
            <section className="wishlist-page__grid" aria-label="Saved properties list">
              {filteredItems.map((item) => {
                const isVilla =
                  item.category === 'villa' ||
                  item.rentalCategory ||
                  item.bedrooms !== undefined ||
                  item.propertyType === 'Villa' ||
                  item.propertyType === 'Bungalow';

                return (
                  <HotelCard
                    key={item.id}
                    hotel={item}
                    layout="horizontal"
                    showPreview={false}
                    showDetails={true}
                    showBookNow={true}
                    pricePrefix={isVilla ? 'Whole property from' : 'From'}
                    pricePeriod={isVilla ? '/ night' : '/ per night'}
                    onBookNow={() => handleBookNow(item)}
                    onBook={() => handleViewDetails(item)}
                    onFavoriteToggle={() => handleRemoveItem(item)}
                  />
                );
              })}
            </section>
          ) : (
            /* Empty State */
            <section className="wishlist-page__empty" aria-label="Empty wishlist state">
              <div className="wishlist-page__empty-icon-wrap" aria-hidden="true">
                <HeartIcon size={38} filled />
              </div>
              <h2 className="wishlist-page__empty-title">
                {items.length === 0 ? 'Your Wishlist is Empty' : 'No properties in this category'}
              </h2>
              <p className="wishlist-page__empty-desc">
                {items.length === 0
                  ? 'Explore our hand-picked collection of luxury hotels, heritage palaces, and private villas. Tap the heart icon on any stay to save your favourites here.'
                  : `You don't have any ${activeTab === 'hotels' ? 'hotels or resorts' : 'villas or bungalows'} saved yet.`}
              </p>
              <div className="wishlist-page__empty-actions">
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
                  Browse Villas &amp; Bungalows
                </Button>
              </div>
            </section>
          )}
        </Container>
      </main>

      <Footer />

      {/* Confirmation Dialog for Clearing Wishlist */}
      {showClearConfirm && (
        <div
          className="wishlist-page__dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
          onClick={() => setShowClearConfirm(false)}
        >
          <div className="wishlist-page__dialog" onClick={(e) => e.stopPropagation()}>
            <h3 id="clear-dialog-title" className="wishlist-page__dialog-title">
              Clear All Saved Stays?
            </h3>
            <p className="wishlist-page__dialog-desc">
              Are you sure you want to remove all {items.length} properties from your Wishlist?
              This action cannot be undone.
            </p>
            <div className="wishlist-page__dialog-actions">
              <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleClearAll}>
                Yes, Clear All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="hotels-toast" role="status" aria-live="polite">
          <CheckCircleIcon size={18} className="hotels-toast__icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sign-in Modal for Guest Checkout Protection */}
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
