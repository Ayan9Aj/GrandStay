import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import Footer from '../../components/layout/Footer/Footer';
import HeroSection from '../../components/home/HeroSection/HeroSection';
import DestinationsSection from '../../components/home/DestinationsSection/DestinationsSection';
import FeaturedHotelsSection from '../../components/home/FeaturedHotelsSection/FeaturedHotelsSection';
import ToursSection from '../../components/home/ToursSection/ToursSection';
import OffersSection from '../../components/home/OffersSection/OffersSection';
import TrustSection from '../../components/home/TrustSection/TrustSection';
import HotelDetailsModal from '../../components/home/HotelDetailsModal/HotelDetailsModal';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import { CheckCircleIcon } from '../../components/common/Icons';
import { getActiveUserSession, clearActiveUserSession } from '../../data/authSession';
import './HomePage.css';


/**
 * ==============================================================================
 * HOMEPAGE COMPONENT
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 2: Homepage Implementation
 * ==============================================================================
 * 
 * Assembles all customer-facing homepage sections:
 * 1. Global Navigation with smooth section anchor jumping
 * 2. Hero Search Section with date & destination validation
 * 3. Popular Indian Destinations with interactive search filtering
 * 4. Featured Luxury Hotels with full details modal preview
 * 5. Optional Sightseeing Tour Packages preview
 * 6. Deals, Coupons & Special Offers
 * 7. Platform Trust & Hospitality Highlight Pillars
 * 8. Comprehensive Academic Footer
 */
export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Search and filter state (kept for homepage FeaturedHotels section compatibility)
  const [searchFilter, setSearchFilter] = useState(null);
  const [activeDestination, setActiveDestination] = useState('All');

  // Modal states
  const [selectedHotelForDetails, setSelectedHotelForDetails] = useState(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());

  // Global toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Handle search form submission — navigates to /hotels with query params
  const handleSearch = (formData) => {
    const params = new URLSearchParams({
      destination: formData.destination || 'All',
      checkIn:     formData.checkIn    || '',
      checkOut:    formData.checkOut   || '',
      guests:      formData.guests     || '2',
    });
    // Navigate to the Hotel Catalog page (Stage 3)
    navigate(`/hotels?${params.toString()}`);
  };

  // 2. Handle clicking a destination card — navigates to /hotels?destination=...
  const handleDestinationSelect = (destinationName) => {
    setActiveDestination(destinationName);
    setSearchFilter({
      destination: destinationName,
      checkIn: '',
      checkOut: '',
      guests: '2'
    });

    showToast(`Showing accommodations in ${destinationName}`);

    navigate(`/hotels?destination=${encodeURIComponent(destinationName)}`);
  };

  // 3. Clear active search filter (for the Featured Hotels section on the homepage)
  const handleResetSearch = () => {
    setSearchFilter(null);
    setActiveDestination('All');
    showToast('Showing all featured hotels across India');
  };


  // 4. Start guest checkout from the hotel preview modal
  const handleBookNow = (hotel, room) => {
    setSelectedHotelForDetails(null);
    const roomIndex = hotel?.rooms?.indexOf(room) ?? -1;
    if (!hotel?.id || roomIndex < 0) {
      if (hotel?.id) navigate(`/hotels/${hotel.id}`, { state: { from: `${location.pathname}${location.search}${location.hash}` } });
      return;
    }
    const params = new URLSearchParams(location.search);
    navigate('/booking', {
      state: {
        booking: { hotelId: hotel.id, roomIndex, checkIn: params.get('checkIn') || '', checkOut: params.get('checkOut') || '', guests: params.get('guests') || '', tourIds: [] },
        returnTo: `${location.pathname}${location.search}${location.hash}`,
        browseTo: '/hotels',
      },
    });
  };

  // 5. Wishlist toggle
  const handleFavoriteToggle = (hotel, isFav) => {
    showToast(
      `${isFav ? 'Saved' : 'Removed'} "${hotel.name}" ${isFav ? 'to' : 'from'} your Wishlist`
    );
  };

  // 6. Offer code copied
  const handleCopyOffer = (code) => {
    showToast(`Coupon code "${code}" copied to clipboard!`);
  };

  // 7. Sign in prototype
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    const greetingName = typeof user === 'object' && user !== null ? user.name : user;
    showToast(`Welcome to GrandStay, ${greetingName}!`);
  };

  const handleSignOut = () => {
    clearActiveUserSession();
    setCurrentUser(null);
    showToast('Signed out of guest session.');
  };

  return (
    <div className="homepage-wrapper">
      {/* 1. Global Navigation Header */}
      <Header
        onOpenSignIn={() => setIsSignInOpen(true)}
        onBookStayClick={() => {
          const heroEl = document.getElementById('hero');
          if (heroEl) heroEl.scrollIntoView({ behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      <main id="main-content">
        {/* 2. Hero Section with Search Form */}
        <HeroSection
          onSearch={handleSearch}
          selectedDestination={activeDestination}
        />

        {/* 3. Popular Indian Destinations */}
        <DestinationsSection
          onSelectDestination={handleDestinationSelect}
          activeDestination={activeDestination}
        />

        {/* 4. Featured Hotels & Resorts */}
        <FeaturedHotelsSection
          searchFilter={searchFilter}
          onResetSearchFilter={handleResetSearch}
          onViewHotelDetails={(hotel) => navigate(`/hotels/${hotel.id}`, { state: { from: `${location.pathname}${location.search}` } })}
          onQuickPreview={(hotel) => setSelectedHotelForDetails(hotel)}
          onFavoriteToggle={handleFavoriteToggle}
        />

        {/* 5. Optional Sightseeing Tour Packages Preview */}
        <ToursSection
          onSelectTour={(tour) => {
            showToast(`Previewing optional tour add-on: "${tour.title}"`);
          }}
        />

        {/* 6. Deals & Offers */}
        <OffersSection onCopyOffer={handleCopyOffer} />

        {/* 7. Platform Trust & Service Highlights */}
        <TrustSection />
      </main>

      {/* 8. Global Footer */}
      <Footer />

      {/* Hotel Details Preview Modal */}
      {selectedHotelForDetails && (
        <HotelDetailsModal
          hotel={selectedHotelForDetails}
          onClose={() => setSelectedHotelForDetails(null)}
          onBookNow={handleBookNow}
          onViewFullDetails={(hotel) => {
            setSelectedHotelForDetails(null);
            navigate(`/hotels/${hotel.id}`, { state: { from: `${location.pathname}${location.search}` } });
          }}
        />
      )}

      {/* Sign In & Account Portal Prototype Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Feedback Toast Notification */}
      {toastMessage && (
        <div className="homepage-toast" role="status" aria-live="polite">
          <CheckCircleIcon size={18} className="homepage-toast__icon" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
