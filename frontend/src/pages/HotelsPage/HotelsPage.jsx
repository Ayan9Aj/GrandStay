import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import SelectDropdown from '../../components/common/SelectDropdown/SelectDropdown';
import Footer from '../../components/layout/Footer/Footer';
import Container from '../../components/layout/Container/Container';
import HotelCard from '../../components/common/HotelCard/HotelCard';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import HotelDetailsModal from '../../components/home/HotelDetailsModal/HotelDetailsModal';
import HotelFilterSidebar from '../../components/catalog/HotelFilterSidebar/HotelFilterSidebar';
import CatalogMap from '../../components/catalog/CatalogMap/CatalogMap';
import { FilterIcon, CloseIcon, CheckCircleIcon } from '../../components/common/Icons';
import {
  getHotels,
  getDestinations,
  getAllAmenities,
  getAllPropertyTypes,
} from '../../services/hotelService';
import { getActiveUserSession, clearActiveUserSession } from '../../data/authSession';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import './HotelsPage.css';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc',   label: 'Price: Low to High' },
  { value: 'price-desc',  label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

// Default (empty) filter state
const DEFAULT_FILTERS = {
  destination:             'All',
  landmark:                '',
  minPrice:                0,
  maxPrice:                99999,
  starRatings:             [],
  amenities:               [],
  propertyTypes:           [],
  popularFilters:          [],
  bookingConditions:       [],
  mealPlans:               [],
  maxCityCenterDistanceKm: 'any',
  maxLandmarkDistanceKm:   'any',
  accessibilityFeatures:   [],
  minRating:               0,
};

// Precompute static lists — these never change during a session
const DESTINATIONS    = getDestinations();
const AMENITIES_LIST  = getAllAmenities();
const PROP_TYPES_LIST = getAllPropertyTypes();
const PROPERTY_TYPE_OPTIONS = ['Hotel', 'Resort'].map((label) => ({
  label,
  values: PROP_TYPES_LIST.filter((type) => (
    label === 'Resort'
      ? /resort/i.test(type)
      : /^hotel$/i.test(type)
  )),
}));
const AMENITY_LABELS = [
  'Air-conditioned', 'Fitness', 'Wi-Fi', 'Smoking', 'Pet Friendly',
  'Indoor Swimming Pool', 'Outdoor Swimming Pool', 'Rooftop Swimming Pool',
  'Infinity pool', 'Restaurant', '24Hr Room Service', 'Conference Facility',
  'Lift / Elevator', 'Wedding Services Facility', 'Bar / Lounge',
  'Free Pick & Drop (Near By Bus/Railway Station)',
];
const AMENITY_FILTER_OPTIONS = AMENITY_LABELS.map((label) => {
  const labelKey = label.toLowerCase().replace(/[^a-z0-9]/g, '');
  const values = AMENITIES_LIST.filter((amenity) => {
    const amenityKey = amenity.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (label === 'Wi-Fi') return amenityKey.includes('wifi');
    return amenityKey === labelKey;
  });
  return { label, values };
});
const POPULAR_FILTER_OPTIONS = [
  { label: 'Couple Friendly', value: 'coupleFriendly', available: false },
  { label: 'Pay at Hotel', value: 'payAtHotel', available: false },
  {
    label: 'Free Cancellation Policy',
    value: 'freeCancellation',
    available: getHotels().some((hotel) => /free cancellation/i.test(hotel.policies?.cancellation || '')),
  },
  { label: 'Pure Veg Restaurant', value: 'pureVegRestaurant', available: false },
];

const dateToKey = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const isValidDateKey = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && dateToKey(date) === value;
};

const addDaysToDateKey = (value, days) => {
  const date = isValidDateKey(value) ? new Date(`${value}T12:00:00`) : new Date();
  date.setDate(date.getDate() + days);
  return dateToKey(date);
};

const getDefaultTravelDates = () => {
  const checkIn = new Date();
  checkIn.setHours(12, 0, 0, 0);
  checkIn.setDate(checkIn.getDate() + 1);
  const checkInKey = dateToKey(checkIn);
  return { checkIn: checkInKey, checkOut: addDaysToDateKey(checkInKey, 2) };
};

const getTravelDatesFromSearch = (searchParams) => {
  const defaults = getDefaultTravelDates();
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const checkIn = isValidDateKey(checkInParam) ? checkInParam : defaults.checkIn;
  const checkOut = isValidDateKey(checkOutParam) && checkOutParam > checkIn
    ? checkOutParam
    : addDaysToDateKey(checkIn, 1);
  return { checkIn, checkOut };
};

export default function HotelsPage() {
  // Read URL query params — Hero search populates these
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Build initial filters from URL params
  const initialDestination = searchParams.get('destination') || 'All';
  const initialLandmark = searchParams.get('landmark') || '';
  const queryPropertyTypes = searchParams.getAll('propertyType');
  const querySortBy = searchParams.get('sortBy');

  // ── Component state ──────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    destination: initialDestination,
    landmark: initialLandmark,
    propertyTypes: queryPropertyTypes,
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [sortBy, setSortBy] = useState(
    SORT_OPTIONS.some((option) => option.value === querySortBy) ? querySortBy : 'recommended'
  );
  const travelDates = getTravelDatesFromSearch(searchParams);
  const [selectedHotel, setSelectedHotel]       = useState(null);
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser]           = useState(() => getActiveUserSession());
  const [isSignInOpen, setSignInOpen]           = useState(false);
  const [authMode, setAuthMode]                 = useState('signin');
  const [pendingAuthAction, setPendingAuthAction] = useState(null);
  const [toastMessage, setToastMessage]         = useState(null);

  const queryCheckIn = searchParams.get('checkIn') || '';
  const queryCheckOut = searchParams.get('checkOut') || '';

  useEffect(() => {
    const resolvedDates = getTravelDatesFromSearch(searchParams);
    if (queryCheckIn !== resolvedDates.checkIn || queryCheckOut !== resolvedDates.checkOut) {
      const params = new URLSearchParams(searchParams);
      params.set('checkIn', resolvedDates.checkIn);
      params.set('checkOut', resolvedDates.checkOut);
      setSearchParams(params, { replace: true });
    }
  }, [queryCheckIn, queryCheckOut, searchParams, setSearchParams]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, []);

  // ── Sign-in / sign-out handlers ──────────────────────────────────────────
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    const name = typeof user === 'object' && user !== null ? user.name : user;
    showToast(`Welcome back, ${name}!`);
    if (pendingAuthAction?.type === 'hotel-details') {
      const { hotel } = pendingAuthAction;
      setPendingAuthAction(null);
      navigate(`/hotels/${hotel.id}`, { state: { from: `${location.pathname}${location.search}` } });
    } else if (pendingAuthAction?.type === 'hotel-booking') {
      const { state } = pendingAuthAction;
      setPendingAuthAction(null);
      navigate('/booking', { state });
    }
  };

  const handleSignOut = () => {
    clearActiveUserSession();
    setCurrentUser(null);
    showToast('Signed out of guest session.');
  };

  // ── Wishlist / booking ────────────────────────────────────────────────────
  const handleFavoriteToggle = (hotel, isFav) => {
    showToast(
      `${isFav ? 'Saved' : 'Removed'} "${hotel.name}" ${isFav ? 'to' : 'from'} your Wishlist`
    );
  };

  const handleHotelCardBook = (hotel) => {
    if (!currentUser) {
      setPendingAuthAction({ type: 'hotel-details', hotel });
      setAuthMode('signin');
      setSignInOpen(true);
      return;
    }
    navigate(`/hotels/${hotel.id}`, { state: { from: `${location.pathname}${location.search}` } });
  };

  const handleCatalogBookNow = (hotel) => {
    if (!hotel?.id) return;
    const browseTo = `${location.pathname}${location.search}`;
    const state = {
      booking: {
        hotelId: hotel.id,
        checkIn: searchParams.get('checkIn') || '',
        checkOut: searchParams.get('checkOut') || '',
        guests: searchParams.get('guests') || '',
        tourIds: [],
      },
      returnTo: browseTo,
      browseTo,
    };

    if (!currentUser) {
      setPendingAuthAction({ type: 'hotel-booking', state });
      setAuthMode('signin');
      setSignInOpen(true);
      return;
    }

    navigate('/booking', { state });
  };

  const handleBookNow = (hotel, room) => {
    setSelectedHotel(null);
    const roomIndex = hotel?.rooms?.indexOf(room) ?? -1;
    if (!hotel?.id || roomIndex < 0) {
      if (hotel?.id) handleHotelCardBook(hotel);
      return;
    }
    const state = {
        booking: {
          hotelId: hotel.id,
          roomIndex,
          checkIn: searchParams.get('checkIn') || '',
          checkOut: searchParams.get('checkOut') || '',
          guests: searchParams.get('guests') || '',
          tourIds: [],
        },
        returnTo: `${location.pathname}${location.search}`,
        browseTo: `${location.pathname}${location.search}`,
      };
    if (!currentUser) {
      setPendingAuthAction({ type: 'hotel-booking', state });
      setAuthMode('signin');
      setSignInOpen(true);
      return;
    }
    navigate('/booking', { state });
  };

  // Close modal on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (selectedHotel) setSelectedHotel(null);
        if (isFilterDrawerOpen) setFilterDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedHotel, isFilterDrawerOpen]);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePopularToggle = (value) => {
    const current = filters.popularFilters;
    const updated = current.includes(value)
      ? current.filter((filter) => filter !== value)
      : [...current, value];
    handleFilterChange('popularFilters', updated);
  };

  const handleTravelDateChange = useCallback((nextDates) => {
    if (!isValidDateKey(nextDates.checkIn) || !isValidDateKey(nextDates.checkOut)) return;
    if (nextDates.checkOut <= nextDates.checkIn) return;
    const params = new URLSearchParams(searchParams);
    params.set('checkIn', nextDates.checkIn);
    params.set('checkOut', nextDates.checkOut);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleClearAll = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  const removeFilterChip = (key, value) => {
    if (key === 'destination') {
      handleFilterChange('destination', 'All');
    } else if (key === 'landmark') {
      handleFilterChange('landmark', '');
    } else if (key === 'minPrice') {
      handleFilterChange('minPrice', 0);
    } else if (key === 'maxPrice') {
      handleFilterChange('maxPrice', 99999);
    } else if (key === 'maxCityCenterDistanceKm') {
      handleFilterChange('maxCityCenterDistanceKm', 'any');
    } else if (key === 'maxLandmarkDistanceKm') {
      handleFilterChange('maxLandmarkDistanceKm', 'any');
    } else if (key === 'minRating') {
      handleFilterChange('minRating', 0);
    } else if (Array.isArray(filters[key])) {
      handleFilterChange(
        key,
        filters[key].filter((v) => v !== value)
      );
    }
  };

  // Compute filtered + sorted results
  const filteredHotels = getHotels({ ...filters, sortBy });

  // ── Build active filter chips ─────────────────────────────────────────────
  const activeChips = [];
  if (filters.destination && filters.destination !== 'All') {
    activeChips.push({ label: `📍 ${filters.destination}`, key: 'destination', value: filters.destination });
  }
  if (filters.landmark) {
    activeChips.push({ label: `🏛️ ${filters.landmark}`, key: 'landmark', value: filters.landmark });
  }
  if (filters.minPrice > 0) {
    activeChips.push({ label: `Min ₹${filters.minPrice.toLocaleString()}`, key: 'minPrice', value: filters.minPrice });
  }
  if (filters.maxPrice < 99999) {
    activeChips.push({ label: `Max ₹${filters.maxPrice.toLocaleString()}`, key: 'maxPrice', value: filters.maxPrice });
  }
  if (filters.maxCityCenterDistanceKm && filters.maxCityCenterDistanceKm !== 'any' && filters.maxCityCenterDistanceKm !== Infinity) {
    activeChips.push({ label: `< ${filters.maxCityCenterDistanceKm}km to City Center`, key: 'maxCityCenterDistanceKm', value: filters.maxCityCenterDistanceKm });
  }
  if (filters.maxLandmarkDistanceKm && filters.maxLandmarkDistanceKm !== 'any' && filters.maxLandmarkDistanceKm !== Infinity) {
    activeChips.push({ label: `< ${filters.maxLandmarkDistanceKm}km to Landmark`, key: 'maxLandmarkDistanceKm', value: filters.maxLandmarkDistanceKm });
  }
  if (filters.minRating > 0) {
    activeChips.push({ label: `${filters.minRating}+ ★ Rating`, key: 'minRating', value: filters.minRating });
  }
  filters.starRatings.forEach((s) => {
    activeChips.push({ label: `${'★'.repeat(s)} ${s}-Star`, key: 'starRatings', value: s });
  });
  (filters.bookingConditions || []).forEach((bc) => {
    const labels = { freeCancellation: 'Free Cancellation', payAtHotel: 'Pay at Hotel' };
    activeChips.push({ label: labels[bc] || bc, key: 'bookingConditions', value: bc });
  });
  (filters.mealPlans || []).forEach((mp) => {
    const labels = { breakfastIncluded: 'Breakfast Included', halfBoard: 'Half Board', allInclusive: 'All-Inclusive' };
    activeChips.push({ label: labels[mp] || mp, key: 'mealPlans', value: mp });
  });
  (filters.accessibilityFeatures || []).forEach((acc) => {
    activeChips.push({ label: acc, key: 'accessibilityFeatures', value: acc });
  });
  filters.amenities.forEach((a) => {
    activeChips.push({ label: a, key: 'amenities', value: a });
  });
  filters.propertyTypes.forEach((t) => {
    activeChips.push({ label: t, key: 'propertyTypes', value: t });
  });
  filters.popularFilters.forEach((filter) => {
    const option = POPULAR_FILTER_OPTIONS.find((item) => item.value === filter);
    if (option) activeChips.push({ label: option.label, key: 'popularFilters', value: filter });
  });

  const activeFilterCount = activeChips.length;

  return (
    <div className="hotels-page-wrapper">
      {/* Navigation header */}
      <Header
        onOpenSignIn={() => { setAuthMode('signin'); setSignInOpen(true); }}
        onOpenRegister={() => { setAuthMode('register'); setSignInOpen(true); }}
        onBookStayClick={null}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      <main className="hotels-page-main">
        <Container size="lg">

          {/* ── Breadcrumb ──────────────────────────────────────────────── */}
          <nav className="hotels-breadcrumb" aria-label="Breadcrumb">
            <Link to="/" className="hotels-breadcrumb__link">Home</Link>
            <span className="hotels-breadcrumb__sep" aria-hidden="true">›</span>
            <span className="hotels-breadcrumb__current">Hotel Catalog</span>
          </nav>

          {/* ── Page Title ──────────────────────────────────────────────── */}
          <div className="hotels-page-title-row">
            <div>
              <h1 className="hotels-page-title">Hotels &amp; Resorts</h1>
              <p className="hotels-page-subtitle">
                Discover luxury stays across India&apos;s most stunning destinations
              </p>
            </div>
          </div>

          {/* ── Active Filter Chips ──────────────────────────────────────── */}
          {activeChips.length > 0 && (
            <div className="hotels-chips-row" aria-label="Active filters">
              {activeChips.map((chip, i) => (
                <button
                  key={`${chip.key}-${chip.value}-${i}`}
                  type="button"
                  className="hotels-chip"
                  onClick={() => removeFilterChip(chip.key, chip.value)}
                  aria-label={`Remove filter: ${chip.label}`}
                >
                  {chip.label}
                  <CloseIcon size={12} />
                </button>
              ))}
              <button
                type="button"
                className="hotels-chip hotels-chip--clear"
                onClick={handleClearAll}
              >
                Clear All
              </button>
            </div>
          )}

          {/* ── Sort & View bar ─────────────────────────────────────────── */}
          <div className="hotels-sort-bar">
            <p className="hotels-sort-bar__count">
              <strong>{filteredHotels.length}</strong>{' '}
              {filteredHotels.length === 1 ? 'stay' : 'stays'} found
            </p>
            <div className="hotels-sort-bar__right">
              {/* List / Map View Segmented Control */}
              <div className="hotels-view-toggle" role="group" aria-label="Catalog view mode">
                <button
                  type="button"
                  className={`hotels-view-btn ${viewMode === 'list' ? 'hotels-view-btn--active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  📄 List View
                </button>
                <button
                  type="button"
                  className={`hotels-view-btn ${viewMode === 'map' ? 'hotels-view-btn--active' : ''}`}
                  onClick={() => setViewMode('map')}
                >
                  🗺️ Map View
                </button>
              </div>

              <label htmlFor="sort-select" className="hotels-sort-label">Sort by:</label>
              <SelectDropdown
                id="sort-select"
                className="hotels-sort-select"
                value={sortBy}
                options={SORT_OPTIONS}
                onChange={setSortBy}
                ariaLabel="Sort hotels"
              />
            </div>
          </div>

          {/* ── Two-column layout: Sidebar + Results ─────────────────────── */}
          <div className="hotels-catalog-layout">
            {/* Filter Sidebar (desktop) / Drawer (mobile) */}
            <HotelFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAll}
              totalResults={filteredHotels.length}
              isDrawerOpen={isFilterDrawerOpen}
              onCloseDrawer={() => setFilterDrawerOpen(false)}
              destinations={DESTINATIONS}
              amenityFilterOptions={AMENITY_FILTER_OPTIONS}
              propertyTypeOptions={PROPERTY_TYPE_OPTIONS}
              popularFilterOptions={POPULAR_FILTER_OPTIONS}
              travelDates={travelDates}
              onTravelDateChange={handleTravelDateChange}
              popularFilters={filters.popularFilters}
              onPopularToggle={handlePopularToggle}
            />

            {/* Results Area */}
            <section className="hotels-results" aria-label="Hotel search results">
              {filteredHotels.length === 0 ? (
                <EmptyState
                  title="No Hotels Found"
                  description="Try adjusting your filters or clearing them to see all available stays."
                  onAction={handleClearAll}
                  actionLabel="Clear All Filters"
                />
              ) : viewMode === 'map' ? (
                <CatalogMap
                  hotels={filteredHotels}
                  onSelectHotel={handleHotelCardBook}
                />
              ) : (
                <div className="hotels-grid">
                  {filteredHotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      layout="horizontal"
                      showPreview={false}
                      onBook={handleHotelCardBook}
                      onBookNow={handleCatalogBookNow}
                      onPreview={(h) => setSelectedHotel(h)}
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

      {/* ── Mobile floating Filters button ──────────────────────────────── */}
      {/* Fixed at bottom, only visible on mobile via CSS */}
      <button
        type="button"
        className="hotels-filter-fab"
        onClick={() => setFilterDrawerOpen(true)}
        aria-label="Open filters"
      >
        <FilterIcon size={16} />
        Filters
        {activeFilterCount > 0 && (
          <span className="hotels-filter-fab__badge">{activeFilterCount}</span>
        )}
      </button>

      {/* Hotel Details Modal */}
      {selectedHotel && (
        <HotelDetailsModal
          hotel={selectedHotel}
          onClose={() => setSelectedHotel(null)}
          onBookNow={handleBookNow}
          onViewFullDetails={(hotel) => {
            setSelectedHotel(null);
            navigate(`/hotels/${hotel.id}`, { state: { from: `${location.pathname}${location.search}` } });
          }}
        />
      )}

      {/* Sign In Modal */}
      <SignInModal
        key={authMode}
        isOpen={isSignInOpen}
        onClose={() => setSignInOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
      />

      {/* Toast notification */}
      {toastMessage && (
        <div className="hotels-toast" role="status" aria-live="polite">
          <CheckCircleIcon size={18} className="hotels-toast__icon" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
