import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Container from '../../components/layout/Container/Container';
import Footer from '../../components/layout/Footer/Footer';
import Header from '../../components/layout/Header/Header';
import HotelCard from '../../components/common/HotelCard/HotelCard';
import SelectDropdown from '../../components/common/SelectDropdown/SelectDropdown';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import { clearActiveUserSession, getActiveUserSession } from '../../data/authSession';
import { getTrendingHotels } from '../../services/hotelService';
import './TrendingHotelsPage.css';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

export default function TrendingHotelsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('recommended');
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const hotels = getTrendingHotels();
  const sortedHotels = [...hotels];

  if (sortBy === 'price-asc') sortedHotels.sort((hotelA, hotelB) => hotelA.pricePerNight - hotelB.pricePerNight);
  if (sortBy === 'price-desc') sortedHotels.sort((hotelA, hotelB) => hotelB.pricePerNight - hotelA.pricePerNight);
  if (sortBy === 'rating-desc') sortedHotels.sort((hotelA, hotelB) => hotelB.rating - hotelA.rating);

  const openSignIn = () => { setAuthMode('signin'); setSignInOpen(true); };
  const openRegister = () => { setAuthMode('register'); setSignInOpen(true); };
  const signOut = () => {
    clearActiveUserSession();
    setCurrentUser(null);
  };

  return (
    <div className="trending-hotels-page">
      <Header
        currentUser={currentUser}
        onOpenSignIn={openSignIn}
        onOpenRegister={openRegister}
        onSignOut={signOut}
      />

      <main id="main-content" className="trending-hotels-main">
        <Container size="lg">
          <h1 className="trending-hotels-title">Trending Hotels &amp; Resorts</h1>

          <div className="trending-hotels-sort-bar">
            <p className="trending-hotels-count"><strong>{sortedHotels.length}</strong> stays found</p>
            <div className="trending-hotels-sort-control">
              <label htmlFor="trending-hotels-sort">Sort by:</label>
              <SelectDropdown
                id="trending-hotels-sort"
                className="trending-hotels-sort-select"
                value={sortBy}
                options={SORT_OPTIONS}
                onChange={setSortBy}
                ariaLabel="Sort trending hotels"
              />
            </div>
          </div>

          <section className="trending-hotels-list" aria-label="Trending hotels and resorts">
            {sortedHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                layout="horizontal"
                showPreview={false}
                showDetails={false}
                pricePrefix="From"
                pricePeriod="/ per night"
                onBook={(selectedHotel) => navigate(`/hotels/${selectedHotel.id}`, {
                  state: { from: `${location.pathname}${location.search}` },
                })}
              />
            ))}
          </section>
        </Container>
      </main>

      <Footer />

      <SignInModal
        key={authMode}
        isOpen={isSignInOpen}
        onClose={() => setSignInOpen(false)}
        onLoginSuccess={setCurrentUser}
        initialMode={authMode}
      />
    </div>
  );
}
