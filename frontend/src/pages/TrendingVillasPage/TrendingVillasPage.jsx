import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Container from '../../components/layout/Container/Container';
import Footer from '../../components/layout/Footer/Footer';
import Header from '../../components/layout/Header/Header';
import HotelCard from '../../components/common/HotelCard/HotelCard';
import SelectDropdown from '../../components/common/SelectDropdown/SelectDropdown';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import { clearActiveUserSession, getActiveUserSession } from '../../data/authSession';
import { getTrendingVillas } from '../../services/villaService';
import { getDefaultRentalDates } from '../../utils/rentalDates';
import '../TrendingHotelsPage/TrendingHotelsPage.css';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

export default function TrendingVillasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('recommended');
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [pendingVilla, setPendingVilla] = useState(null);
  const villas = getTrendingVillas();
  const sortedVillas = [...villas];
  if (sortBy === 'price-asc') sortedVillas.sort((a, b) => a.pricePerNight - b.pricePerNight);
  if (sortBy === 'price-desc') sortedVillas.sort((a, b) => b.pricePerNight - a.pricePerNight);
  if (sortBy === 'rating-desc') sortedVillas.sort((a, b) => b.rating - a.rating);

  const continueBooking = (villa) => {
    const dates = getDefaultRentalDates();
    navigate(`/villas/${villa.id}/booking`, {
      state: { booking: { villaId: villa.id, ...dates, guests: Math.min(2, villa.guestCapacity) }, returnTo: `${location.pathname}${location.search}` },
    });
  };
  const bookVilla = (villa) => {
    if (currentUser) return continueBooking(villa);
    setPendingVilla(villa);
    setAuthMode('signin');
    setSignInOpen(true);
  };
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (pendingVilla) {
      const villa = pendingVilla;
      setPendingVilla(null);
      continueBooking(villa);
    }
  };
  const openSignIn = () => { setAuthMode('signin'); setSignInOpen(true); };
  const openRegister = () => { setAuthMode('register'); setSignInOpen(true); };
  const signOut = () => { clearActiveUserSession(); setCurrentUser(null); };

  return (
    <div className="trending-hotels-page">
      <Header currentUser={currentUser} onOpenSignIn={openSignIn} onOpenRegister={openRegister} onSignOut={signOut} />
      <main id="main-content" className="trending-hotels-main">
        <Container size="lg">
          <h1 className="trending-hotels-title">Trending Villas &amp; Bungalows</h1>
          <div className="trending-hotels-sort-bar">
            <p className="trending-hotels-count"><strong>{sortedVillas.length}</strong> private stays found</p>
            <div className="trending-hotels-sort-control">
              <label htmlFor="trending-villas-sort">Sort by:</label>
              <SelectDropdown id="trending-villas-sort" className="trending-hotels-sort-select" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} ariaLabel="Sort trending villas and bungalows" />
            </div>
          </div>
          <section className="trending-hotels-list" aria-label="Trending villas and bungalows">
            {sortedVillas.map((villa) => (
              <HotelCard
                key={villa.id}
                hotel={villa}
                layout="horizontal"
                showPreview={false}
                showDetails={false}
                pricePrefix="Whole property from"
                pricePeriod="/ night"
                onBook={bookVilla}
              />
            ))}
          </section>
        </Container>
      </main>
      <Footer />
      <SignInModal key={authMode} isOpen={isSignInOpen} onClose={() => setSignInOpen(false)} onLoginSuccess={handleLoginSuccess} initialMode={authMode} />
    </div>
  );
}
