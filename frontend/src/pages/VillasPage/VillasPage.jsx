import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Container from '../../components/layout/Container/Container';
import Footer from '../../components/layout/Footer/Footer';
import Header from '../../components/layout/Header/Header';
import HotelCard from '../../components/common/HotelCard/HotelCard';
import SelectDropdown from '../../components/common/SelectDropdown/SelectDropdown';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import HotelFilterSidebar from '../../components/catalog/HotelFilterSidebar/HotelFilterSidebar';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import { FilterIcon, CloseIcon, CheckCircleIcon } from '../../components/common/Icons';
import { clearActiveUserSession, getActiveUserSession } from '../../data/authSession';
import { getAllVillas } from '../../services/villaService';
import { getDefaultRentalDates, getRentalDatesFromSearch, getRentalNights } from '../../utils/rentalDates';
import './VillasPage.css';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

const VILLAS = getAllVillas();
const MAX_VILLA_PRICE = Math.ceil(Math.max(...VILLAS.map((villa) => villa.pricePerNight)) / 1000) * 1000;
const DEFAULT_FILTERS = {
  destination: 'All', minPrice: 0, maxPrice: MAX_VILLA_PRICE,
  starRatings: [], amenities: [], propertyTypes: [], popularFilters: [],
};
const DESTINATIONS = [...new Set(VILLAS.map((villa) => villa.destination))].sort();
const AMENITY_LABELS = [
  'Wi-Fi', 'Private pool', 'Kitchen', 'Air conditioning', 'Garden', 'Parking',
  'Family lounge', 'Lake-view terrace', 'Mountain views', 'Tea garden views',
];
const AMENITY_OPTIONS = AMENITY_LABELS.map((label) => ({
  label,
  values: [...new Set(VILLAS.flatMap((villa) => villa.amenities).filter((amenity) => amenity.toLowerCase() === label.toLowerCase()))],
}));
const PROPERTY_TYPE_OPTIONS = ['Villa', 'Bungalow'].map((label) => ({
  label,
  values: [...new Set(VILLAS.filter((villa) => villa.propertyType === label).map((villa) => villa.propertyType))],
}));
const hasPrivatePool = (villa) => villa.amenities.some((amenity) => /private pool/i.test(amenity));
const hasScenicView = (villa) => villa.amenities.some((amenity) => /view|scenic|mountain|lake|tea garden|river/i.test(amenity));
const getVillaStarFilterValue = (villa) => (villa.rating >= 4.8 ? 5 : 4);
const POPULAR_DEFINITIONS = [
  { label: 'Private Pool', value: 'privatePool', matches: hasPrivatePool },
  { label: 'Family Friendly', value: 'familyFriendly', matches: (villa) => villa.guestCapacity >= 6 },
  { label: 'Scenic Views', value: 'scenicViews', matches: hasScenicView },
  { label: 'Group Stays', value: 'groupStays', matches: (villa) => villa.guestCapacity >= 8 },
];
const POPULAR_FILTER_OPTIONS = POPULAR_DEFINITIONS.map((option) => ({
  label: option.label,
  value: option.value,
  available: VILLAS.some(option.matches),
}));

export default function VillasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    destination: DESTINATIONS.includes(searchParams.get('destination'))
      ? searchParams.get('destination')
      : 'All',
  }));
  const [sortBy, setSortBy] = useState('recommended');
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [pendingVilla, setPendingVilla] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const travelDates = getRentalDatesFromSearch(searchParams);
  const nights = getRentalNights(travelDates.checkIn, travelDates.checkOut) || 1;

  const handleFavoriteToggle = (villa, isFav) => {
    setToastMessage(
      `${isFav ? 'Saved' : 'Removed'} "${villa.name}" ${isFav ? 'to' : 'from'} your Wishlist`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const queryCheckIn = searchParams.get('checkIn') || '';
  const queryCheckOut = searchParams.get('checkOut') || '';
  useEffect(() => {
    const resolved = getRentalDatesFromSearch(searchParams);
    if (queryCheckIn !== resolved.checkIn || queryCheckOut !== resolved.checkOut) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('checkIn', resolved.checkIn);
      nextParams.set('checkOut', resolved.checkOut);
      setSearchParams(nextParams, { replace: true });
    }
  }, [queryCheckIn, queryCheckOut, searchParams, setSearchParams]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);
  const handlePopularToggle = useCallback((value) => {
    setFilters((current) => ({
      ...current,
      popularFilters: current.popularFilters.includes(value)
        ? current.popularFilters.filter((item) => item !== value)
        : [...current.popularFilters, value],
    }));
  }, []);
  const handleTravelDateChange = useCallback((nextDates) => {
    if (!getRentalNights(nextDates.checkIn, nextDates.checkOut)) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('checkIn', nextDates.checkIn);
    nextParams.set('checkOut', nextDates.checkOut);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);
  const handleClearAll = useCallback(() => setFilters({ ...DEFAULT_FILTERS }), []);

  const filteredVillas = useMemo(() => {
    const filtered = VILLAS.filter((villa) => (
      (filters.destination === 'All' || villa.destination === filters.destination)
      && villa.pricePerNight >= filters.minPrice
      && villa.pricePerNight <= filters.maxPrice
      && (!filters.starRatings.length || filters.starRatings.includes(getVillaStarFilterValue(villa)))
      && filters.amenities.every((amenity) => villa.amenities.includes(amenity))
      && (!filters.propertyTypes.length || filters.propertyTypes.includes(villa.propertyType))
      && filters.popularFilters.every((value) => POPULAR_DEFINITIONS.find((option) => option.value === value)?.matches(villa))
    ));
    if (sortBy === 'price-asc') filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
    if (sortBy === 'price-desc') filtered.sort((a, b) => b.pricePerNight - a.pricePerNight);
    if (sortBy === 'rating-desc') filtered.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    return filtered;
  }, [filters, sortBy]);

  const activeChips = [
    ...(filters.destination !== 'All' ? [{ key: 'destination', value: filters.destination, label: `📍 ${filters.destination}` }] : []),
    ...(filters.minPrice > 0 ? [{ key: 'minPrice', value: filters.minPrice, label: `Min ₹${filters.minPrice.toLocaleString()}` }] : []),
    ...(filters.maxPrice < MAX_VILLA_PRICE ? [{ key: 'maxPrice', value: filters.maxPrice, label: `Max ₹${filters.maxPrice.toLocaleString()}` }] : []),
    ...filters.starRatings.map((star) => ({ key: 'starRatings', value: star, label: `${star} Star${star === 1 ? '' : 's'}` })),
    ...filters.amenities.map((amenity) => ({ key: 'amenities', value: amenity, label: amenity })),
    ...filters.propertyTypes.map((type) => ({ key: 'propertyTypes', value: type, label: type })),
    ...filters.popularFilters.map((value) => {
      const option = POPULAR_FILTER_OPTIONS.find((item) => item.value === value);
      return { key: 'popularFilters', value, label: option?.label || value };
    }),
  ];
  const removeFilterChip = (key, value) => {
    if (key === 'destination') handleFilterChange(key, 'All');
    else if (key === 'minPrice') handleFilterChange(key, 0);
    else if (key === 'maxPrice') handleFilterChange(key, MAX_VILLA_PRICE);
    else handleFilterChange(key, filters[key].filter((item) => item !== value));
  };

  const continueBooking = (villa) => {
    const dates = travelDates.checkIn && travelDates.checkOut ? travelDates : getDefaultRentalDates();
    navigate(`/villas/${villa.id}/booking${location.search}`, {
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
  const openVillaPreview = (villa) => window.open(`/villas/${encodeURIComponent(villa.id)}${location.search}`, '_blank', 'noopener,noreferrer');

  return (
    <div className="villas-page">
      <Header currentUser={currentUser} onOpenSignIn={openSignIn} onOpenRegister={openRegister} onSignOut={signOut} />
      <main id="main-content" className="villas-page__main">
        <Container size="lg">
          <header className="villas-page__heading">
            <span>Private whole-property stays</span>
            <h1>Villas &amp; Bungalows</h1>
            <p>Choose a private home with room for your group to relax together.</p>
          </header>
          {activeChips.length > 0 && (
            <div className="villas-page__chips" aria-label="Active villa filters">
              {activeChips.map((chip) => (
                <button key={`${chip.key}-${chip.value}`} type="button" className="hotels-chip" onClick={() => removeFilterChip(chip.key, chip.value)} aria-label={`Remove filter: ${chip.label}`}>
                  {chip.label}<CloseIcon size={12} />
                </button>
              ))}
              <button type="button" className="hotels-chip hotels-chip--clear" onClick={handleClearAll}>Clear All</button>
            </div>
          )}
          <div className="villas-page__sort-bar">
            <p><strong>{filteredVillas.length}</strong> private {filteredVillas.length === 1 ? 'stay' : 'stays'}</p>
            <div><label htmlFor="villas-sort">Sort by:</label><SelectDropdown id="villas-sort" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} ariaLabel="Sort villas and bungalows" /></div>
          </div>
          <div className="villas-page__catalog-layout">
            <HotelFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAll}
              totalResults={filteredVillas.length}
              isDrawerOpen={isFilterDrawerOpen}
              onCloseDrawer={() => setFilterDrawerOpen(false)}
              destinations={DESTINATIONS}
              amenityFilterOptions={AMENITY_OPTIONS}
              propertyTypeOptions={PROPERTY_TYPE_OPTIONS}
              popularFilterOptions={POPULAR_FILTER_OPTIONS}
              travelDates={travelDates}
              onTravelDateChange={handleTravelDateChange}
              popularFilters={filters.popularFilters}
              onPopularToggle={handlePopularToggle}
              catalogName="Villa"
              maxPriceLimit={MAX_VILLA_PRICE}
              currencySymbol="₹"
              budgetTitle="Your Budget Per Night"
            />
            <section className="villas-page__results" aria-label="Villa and bungalow search results">
              {filteredVillas.length === 0 ? (
                <EmptyState title="No Private Stays Found" description="Try adjusting your filters or clearing them to see all villas and bungalows." onAction={handleClearAll} actionLabel="Clear All Filters" />
              ) : (
                <div className="villas-page__grid">
                  {filteredVillas.map((villa) => (
                    <HotelCard
                      key={villa.id}
                      layout="horizontal"
                      hotel={{ ...villa, currency: '₹' }}
                      pricePrefix="Whole property from"
                      verticalPricePrefix="Whole property from"
                      pricePeriod="/ night"
                      priceSummary={`Stay total · ${nights} ${nights === 1 ? 'night' : 'nights'}: ₹${(villa.pricePerNight * nights).toLocaleString()}`}
                      showBookNow
                      showPreview={false}
                      onBookNow={bookVilla}
                      onBook={(selected) => navigate(`/villas/${selected.id}${location.search}`, { state: { from: `${location.pathname}${location.search}`, booking: { villaId: selected.id, ...travelDates, guests: Math.min(2, selected.guestCapacity) } } })}
                      onPreview={openVillaPreview}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </Container>
      </main>
      <Footer />
      <button type="button" className="hotels-filter-fab" onClick={() => setFilterDrawerOpen(true)} aria-label="Open villa filters">
        <FilterIcon size={16} />Filters{activeChips.length > 0 && <span className="hotels-filter-fab__badge">{activeChips.length}</span>}
      </button>
      <SignInModal key={authMode} isOpen={isSignInOpen} onClose={() => setSignInOpen(false)} onLoginSuccess={handleLoginSuccess} initialMode={authMode} />
      {toastMessage && (
        <div className="hotels-toast" role="status" aria-live="polite">
          <CheckCircleIcon size={18} className="hotels-toast__icon" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
