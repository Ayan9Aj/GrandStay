import { CloseIcon, FilterIcon } from '../../common/Icons';
import Button from '../../common/Button/Button';
import SelectDropdown from '../../common/SelectDropdown/SelectDropdown';
import DateRangePicker from '../../common/DateRangePicker/DateRangePicker';
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
function CircularControl({ label, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`filter-circular-option ${isSelected ? 'filter-circular-option--selected' : ''}`}
      onClick={onSelect}
    >
      <span className="filter-circular-indicator" aria-hidden="true">
        {isSelected && (
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className="filter-circular-text">{label}</span>
    </button>
  );
}

export default function HotelFilterSidebar({
  filters,
  onFilterChange,
  onClearAll,
  totalResults,
  isDrawerOpen,
  onCloseDrawer,
  destinations,
  amenityFilterOptions,
  propertyTypeOptions,
  _popularFilterOptions,
  travelDates,
  onTravelDateChange,
  _popularFilters,
  _onPopularToggle,
  catalogName = 'Hotel',
  maxPriceLimit = 99999,
  currencySymbol = '₹',
  budgetTitle = 'Your Budget Per Night',
  starRatingOptions = [5, 4, 3, 2, 1],
}) {
  // Count how many filters are currently active (for the badge)
  const activeCount = [
    filters.destination && filters.destination !== 'All' ? 1 : 0,
    filters.landmark ? 1 : 0,
    filters.minPrice > 0 ? 1 : 0,
    filters.maxPrice < maxPriceLimit ? 1 : 0,
    filters.maxCityCenterDistanceKm && filters.maxCityCenterDistanceKm !== 'any' && filters.maxCityCenterDistanceKm !== Infinity ? 1 : 0,
    filters.maxLandmarkDistanceKm && filters.maxLandmarkDistanceKm !== 'any' && filters.maxLandmarkDistanceKm !== Infinity ? 1 : 0,
    filters.minRating > 0 ? 1 : 0,
    filters.starRatings.length,
    (filters.bookingConditions || []).length,
    (filters.mealPlans || []).length,
    (filters.accessibilityFeatures || []).length,
    filters.amenities.length,
    filters.propertyTypes.length,
    filters.popularFilters.length,
  ].reduce((a, b) => a + b, 0);

  // Handle star rating checkbox toggles
  const handleStarToggle = (star) => {
    const current = filters.starRatings;
    const updated = current.includes(star)
      ? current.filter((s) => s !== star)
      : [...current, star];
    onFilterChange('starRatings', updated);
  };

  const toggleFilterValues = (key, values) => {
    if (!values.length) return;
    const current = filters[key];
    const anySelected = values.some((value) => current.includes(value));
    const updated = anySelected
      ? current.filter((value) => !values.includes(value))
      : [...new Set([...current, ...values])];
    onFilterChange(key, updated);
  };

  const handleAmenityToggle = (values) => toggleFilterValues('amenities', values);
  const handlePropertyTypeToggle = (values) => toggleFilterValues('propertyTypes', values);

  const toggleArrayFilter = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(key, updated);
  };

  // The panel content is the same for both desktop sidebar and mobile drawer
  const panelContent = (
    <div className="filter-panel">
      <section className="filter-travel-dates" aria-label="Travel dates">
        <div className="filter-travel-dates__header">
          <h2>TRAVEL DATES</h2>
        </div>
        <div className="filter-travel-dates__body">
          <DateRangePicker
            dates={travelDates}
            onChange={onTravelDateChange}
            label="Travel dates"
            triggerClassName="filter-travel-dates__trigger"
            valueClassName="filter-travel-dates__value"
          />
        </div>
      </section>

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
        <SelectDropdown
          id="filter-destination"
          className="filter-select"
          value={filters.destination}
          onChange={(value) => onFilterChange('destination', value)}
          ariaLabel="Select destination"
          options={[
            { value: 'All', label: 'All Destinations' },
            ...destinations.map((dest) => ({ value: dest, label: dest }))
          ]}
        />
      </div>

      {/* ── 2. Booking Conditions ────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Booking Conditions</h3>
        {[
          { label: 'Free Cancellation', value: 'freeCancellation' },
          { label: 'Pay at Hotel', value: 'payAtHotel' },
        ].map((bc) => {
          const isSelected = (filters.bookingConditions || []).includes(bc.value);
          return (
            <CircularControl
              key={bc.value}
              label={bc.label}
              isSelected={isSelected}
              onSelect={() => toggleArrayFilter('bookingConditions', bc.value)}
            />
          );
        })}
      </div>

      {/* ── 3. Distance from City Center ───────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Distance from City Center</h3>
        {[
          { label: 'Any distance', value: 'any' },
          { label: 'Less than 2 km', value: 2 },
          { label: 'Less than 5 km', value: 5 },
          { label: 'Less than 10 km', value: 10 },
        ].map((opt) => {
          const currentVal = filters.maxCityCenterDistanceKm ?? 'any';
          const isSelected = String(currentVal) === String(opt.value);
          return (
            <CircularControl
              key={opt.label}
              label={opt.label}
              isSelected={isSelected}
              onSelect={() => onFilterChange('maxCityCenterDistanceKm', opt.value)}
            />
          );
        })}
      </div>

      {/* ── 4. Distance from Landmark (if active) ───────────────────── */}
      {filters.landmark && (
        <div className="filter-section">
          <h3 className="filter-section__title">Distance from {filters.landmark}</h3>
          {[
            { label: 'Any distance', value: 'any' },
            { label: 'Within 2 km', value: 2 },
            { label: 'Within 5 km', value: 5 },
            { label: 'Within 15 km', value: 15 },
          ].map((opt) => {
            const currentVal = filters.maxLandmarkDistanceKm ?? 'any';
            const isSelected = String(currentVal) === String(opt.value);
            return (
              <CircularControl
                key={opt.label}
                label={opt.label}
                isSelected={isSelected}
                onSelect={() => onFilterChange('maxLandmarkDistanceKm', opt.value)}
              />
            );
          })}
        </div>
      )}

      {/* ── 5. Meal Plans ────────────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Meal Plans</h3>
        {[
          { label: 'Breakfast Included', value: 'breakfastIncluded' },
          { label: 'Half Board (Breakfast + Dinner)', value: 'halfBoard' },
          { label: 'All-Inclusive', value: 'allInclusive' },
        ].map((mp) => {
          const isSelected = (filters.mealPlans || []).includes(mp.value);
          return (
            <CircularControl
              key={mp.value}
              label={mp.label}
              isSelected={isSelected}
              onSelect={() => toggleArrayFilter('mealPlans', mp.value)}
            />
          );
        })}
      </div>

      {/* ── 6. Accessibility Features ────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Accessibility Features</h3>
        {[
          'Wheelchair Accessible',
          'Accessible Bathrooms',
          'Roll-in Shower',
          'Step-free Entrance',
        ].map((acc) => {
          const isSelected = (filters.accessibilityFeatures || []).includes(acc);
          return (
            <CircularControl
              key={acc}
              label={acc}
              isSelected={isSelected}
              onSelect={() => toggleArrayFilter('accessibilityFeatures', acc)}
            />
          );
        })}
      </div>

      {/* ── 7. Minimum Guest Rating ─────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Guest Review Rating</h3>
        {[
          { label: 'Any Rating', value: 0 },
          { label: '4.5+ ★ Exceptional', value: 4.5 },
          { label: '4.0+ ★ Very Good', value: 4.0 },
          { label: '3.5+ ★ Good', value: 3.5 },
        ].map((rate) => {
          const currentVal = filters.minRating ?? 0;
          const isSelected = Number(currentVal) === Number(rate.value);
          return (
            <CircularControl
              key={rate.label}
              label={rate.label}
              isSelected={isSelected}
              onSelect={() => onFilterChange('minRating', rate.value)}
            />
          );
        })}
      </div>

      {/* ── 8. Price Range ───────────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">{budgetTitle}</h3>
        <div className="filter-price-row">
          <div className="filter-price-field">
            <span className="filter-price-prefix">{currencySymbol}</span>
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
            <span className="filter-price-prefix">{currencySymbol}</span>
            <input
              type="number"
              className="filter-price-input"
              placeholder="Max"
              min="0"
              value={filters.maxPrice >= maxPriceLimit ? '' : filters.maxPrice}
              onChange={(e) =>
                onFilterChange('maxPrice', Number(e.target.value) || maxPriceLimit)
              }
              aria-label="Maximum price per night"
            />
          </div>
        </div>
        {filters.minPrice > 0 &&
          filters.maxPrice < maxPriceLimit &&
          filters.minPrice > filters.maxPrice && (
            <p className="filter-price-error">Min must be less than Max</p>
          )}
      </div>

      {/* ── 9. Star Rating ───────────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Star Rating</h3>
        {starRatingOptions.map((star) => (
          <label key={star} className="filter-checkbox-label">
            <input
              type="checkbox"
              className="filter-checkbox"
              checked={filters.starRatings.includes(star)}
              onChange={() => handleStarToggle(star)}
            />
            <span className="filter-checkbox-text">
              {star} {star === 1 ? 'Star' : 'Stars'}
            </span>
          </label>
        ))}
      </div>

      {/* ── 10. Property Type ─────────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Property Type</h3>
        {propertyTypeOptions.map((option) => (
          <label key={option.label} className={`filter-checkbox-label ${option.values.length ? '' : 'filter-checkbox-label--unavailable'}`} title={option.values.length ? undefined : 'Not listed for the current hotel data'}>
            <input
              type="checkbox"
              className="filter-checkbox"
              checked={option.values.some((value) => filters.propertyTypes.includes(value))}
              disabled={!option.values.length}
              onChange={() => handlePropertyTypeToggle(option.values)}
            />
            <span className="filter-checkbox-text">{option.label}</span>
          </label>
        ))}
        {propertyTypeOptions.some((option) => !option.values.length) && (
          <p className="filter-section__note">Some property types are unavailable for these listings.</p>
        )}
      </div>

      {/* ── 11. Amenities ─────────────────────────────────────────────── */}
      <div className="filter-section">
        <h3 className="filter-section__title">Amenities</h3>
        {amenityFilterOptions.map((option) => (
          <label key={option.label} className={`filter-checkbox-label ${option.values.length ? '' : 'filter-checkbox-label--unavailable'}`} title={option.values.length ? undefined : 'Not listed for the current hotel data'}>
            <input
              type="checkbox"
              className="filter-checkbox"
              checked={option.values.some((value) => filters.amenities.includes(value))}
              disabled={!option.values.length}
              onChange={() => handleAmenityToggle(option.values)}
            />
            <span className="filter-checkbox-text">{option.label}</span>
          </label>
        ))}
        {amenityFilterOptions.some((option) => !option.values.length) && (
          <p className="filter-section__note">Some amenities are unavailable for these listings.</p>
        )}
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
      <aside className="filter-sidebar" aria-label={`${catalogName} search filters`}>
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
        aria-label={`${catalogName} search filters`}
        aria-modal="true"
        role="dialog"
      >
        {panelContent}
      </div>
    </>
  );
}
