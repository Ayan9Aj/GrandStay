import { CloseIcon, FilterIcon } from '../../common/Icons';
import Button from '../../common/Button/Button';
import './HotelFilterSidebar.css';

/**
 * ==============================================================================
 * HOTEL FILTER SIDEBAR
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 3: Hotel Catalog & Filtering
 * ==============================================================================
 *
 * Renders the filter panel used by HotelsPage.
 *
 * On DESKTOP  → sticky left sidebar (280 px wide)
 * On MOBILE   → full-screen slide-in drawer, opened by a floating button
 *
 * Props:
 *   filters         : object  — current active filter state from HotelsPage
 *   onFilterChange  : fn(key, value) — called when any filter control changes
 *   onClearAll      : fn()  — resets all filters
 *   totalResults    : number — shown in the header ("12 stays found")
 *   isDrawerOpen    : bool  — controls mobile drawer visibility
 *   onCloseDrawer   : fn()  — closes the mobile drawer
 */
export default function HotelFilterSidebar({
  filters,
  onFilterChange,
  onClearAll,
  totalResults,
  isDrawerOpen,
  onCloseDrawer,
  destinations,
  amenitiesList,
  propertyTypesList,
}) {
  // Count how many filters are currently active (for the badge)
  const activeCount = [
    filters.destination && filters.destination !== 'All' ? 1 : 0,
    filters.minPrice > 0 ? 1 : 0,
    filters.maxPrice < 99999 ? 1 : 0,
    filters.starRatings.length,
    filters.amenities.length,
    filters.propertyTypes.length,
  ].reduce((a, b) => a + b, 0);

  // Handle star rating checkbox toggles
  const handleStarToggle = (star) => {
    const current = filters.starRatings;
    const updated = current.includes(star)
      ? current.filter((s) => s !== star)
      : [...current, star];
    onFilterChange('starRatings', updated);
  };

  // Handle amenity checkbox toggles
  const handleAmenityToggle = (amenity) => {
    const current = filters.amenities;
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    onFilterChange('amenities', updated);
  };

  // Handle property type checkbox toggles
  const handlePropertyTypeToggle = (type) => {
    const current = filters.propertyTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFilterChange('propertyTypes', updated);
  };

  // The panel content is the same for both desktop sidebar and mobile drawer
  const panelContent = (
    <div className="filter-panel">
      {/* Panel Header */}
      <div className="filter-panel__header">
        <div className="filter-panel__title-row">
          <FilterIcon size={16} />
          <h2 className="filter-panel__title">Filters</h2>
          {activeCount > 0 && (
            <span className="filter-panel__count-badge">{activeCount}</span>
          )}
        </div>
        <div className="filter-panel__header-actions">
          <span className="filter-panel__results-label">
            {totalResults} {totalResults === 1 ? 'stay' : 'stays'} found
          </span>
          {/* Close button — only visible on mobile */}
          <button
            type="button"
            className="filter-panel__close-btn"
            onClick={onCloseDrawer}
            aria-label="Close filters"
          >
            <CloseIcon size={20} />
          </button>
        </div>
      </div>

      {/* ── 1. Destination ───────────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Destination</h3>
        <select
          className="filter-select"
          value={filters.destination}
          onChange={(e) => onFilterChange('destination', e.target.value)}
          aria-label="Select destination"
        >
          <option value="All">All Destinations</option>
          {destinations.map((dest) => (
            <option key={dest} value={dest}>
              {dest}
            </option>
          ))}
        </select>
      </div>

      {/* ── 2. Price Range ───────────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Price per Night</h3>
        <div className="filter-price-row">
          <div className="filter-price-field">
            <span className="filter-price-prefix">₹</span>
            <input
              type="number"
              className="filter-price-input"
              placeholder="Min"
              min="0"
              value={filters.minPrice === 0 ? '' : filters.minPrice}
              onChange={(e) =>
                onFilterChange('minPrice', Number(e.target.value) || 0)
              }
              aria-label="Minimum price per night"
            />
          </div>
          <span className="filter-price-separator">to</span>
          <div className="filter-price-field">
            <span className="filter-price-prefix">₹</span>
            <input
              type="number"
              className="filter-price-input"
              placeholder="Max"
              min="0"
              value={filters.maxPrice >= 99999 ? '' : filters.maxPrice}
              onChange={(e) =>
                onFilterChange('maxPrice', Number(e.target.value) || 99999)
              }
              aria-label="Maximum price per night"
            />
          </div>
        </div>
        {/* Validation: show a hint if min > max */}
        {filters.minPrice > 0 &&
          filters.maxPrice < 99999 &&
          filters.minPrice > filters.maxPrice && (
            <p className="filter-price-error">Min must be less than Max</p>
          )}
      </div>

      {/* ── 3. Star Rating ───────────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Star Rating</h3>
        {[5, 4, 3].map((star) => (
          <label key={star} className="filter-checkbox-label">
            <input
              type="checkbox"
              className="filter-checkbox"
              checked={filters.starRatings.includes(star)}
              onChange={() => handleStarToggle(star)}
            />
            <span className="filter-checkbox-text">
              {'★'.repeat(star)}
              {'☆'.repeat(5 - star)}{' '}
              {star === 5 ? 'Luxury' : star === 4 ? 'Premium' : 'Comfort'}
            </span>
          </label>
        ))}
      </div>

      {/* ── 4. Amenities ─────────────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Amenities</h3>
        {amenitiesList.map((amenity) => (
          <label key={amenity} className="filter-checkbox-label">
            <input
              type="checkbox"
              className="filter-checkbox"
              checked={filters.amenities.includes(amenity)}
              onChange={() => handleAmenityToggle(amenity)}
            />
            <span className="filter-checkbox-text">{amenity}</span>
          </label>
        ))}
      </div>

      {/* ── 5. Property Type ─────────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Property Type</h3>
        {propertyTypesList.map((type) => (
          <label key={type} className="filter-checkbox-label">
            <input
              type="checkbox"
              className="filter-checkbox"
              checked={filters.propertyTypes.includes(type)}
              onChange={() => handlePropertyTypeToggle(type)}
            />
            <span className="filter-checkbox-text">{type}</span>
          </label>
        ))}
      </div>

      {/* ── Clear All Button ─────────────────────────────────────────── */}
      {activeCount > 0 && (
        <div className="filter-panel__clear">
          <Button variant="outline" size="sm" fullWidth onClick={onClearAll}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ────────────────────────────────────────── */}
      {/* Hidden on mobile via CSS. No drawer logic needed here. */}
      <aside className="filter-sidebar" aria-label="Hotel search filters">
        {panelContent}
      </aside>

      {/* ── MOBILE DRAWER ──────────────────────────────────────────── */}
      {/* Backdrop overlay — clicking it closes the drawer */}
      {isDrawerOpen && (
        <div
          className="filter-drawer-backdrop"
          onClick={onCloseDrawer}
          aria-hidden="true"
        />
      )}
      {/* Slide-in drawer panel */}
      <div
        className={`filter-drawer ${isDrawerOpen ? 'filter-drawer--open' : ''}`}
        aria-label="Hotel search filters"
        aria-modal="true"
        role="dialog"
      >
        {panelContent}
      </div>
    </>
  );
}
