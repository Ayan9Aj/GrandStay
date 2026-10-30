import { useState } from 'react';
import Container from '../../layout/Container/Container';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import Badge from '../../common/Badge/Badge';
import { SearchIcon, MapPinIcon, CalendarIcon, UsersIcon, AlertCircleIcon } from '../../common/Icons';
import './HeroSection.css';

const TODAY_STR = new Date().toISOString().split('T')[0];

// Helper to compute pure default dates outside component render
const getDefaultDates = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 3);
  return {
    checkIn: tomorrow.toISOString().split('T')[0],
    checkOut: dayAfter.toISOString().split('T')[0]
  };
};

/**
 * ==============================================================================
 * HERO SECTION & HOTEL SEARCH FORM
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 2: Homepage Implementation
 * ==============================================================================
 * 
 * Features:
 * - Visually captivating hospitality background and hero typography
 * - Working hotel search form with destination, check-in, check-out, and guests
 * - Real validation ensuring check-out date is later than check-in date
 * - One-click popular destination shortcut pills
 */
export default function HeroSection({
  onSearch,
  selectedDestination = 'All'
}) {
  const [dates, setDates] = useState(() => getDefaultDates());
  const [destination, setDestination] = useState(selectedDestination || 'All');
  const [prevPropDestination, setPrevPropDestination] = useState(selectedDestination);
  const [guests, setGuests] = useState('2');
  const [dateError, setDateError] = useState('');

  // Sync internal destination when parent prop changes (e.g. from Destination card click or reset)
  if (selectedDestination !== prevPropDestination) {
    setPrevPropDestination(selectedDestination);
    setDestination(selectedDestination || 'All');
  }

  const handleDateChange = (field, value) => {
    const updated = { ...dates, [field]: value };
    setDates(updated);

    if (updated.checkIn && updated.checkOut) {
      const checkInDate = new Date(updated.checkIn);
      const checkOutDate = new Date(updated.checkOut);

      if (checkOutDate <= checkInDate) {
        setDateError('Check-out date must be after check-in date.');
      } else {
        setDateError('');
      }
    }
  };

  const handleCitySelect = (city) => {
    // Only update local search criteria - DO NOT trigger page navigation or scroll
    setDestination(city);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!dates.checkIn || !dates.checkOut) {
      setDateError('Please select both check-in and check-out dates.');
      return;
    }

    const checkInDate = new Date(dates.checkIn);
    const checkOutDate = new Date(dates.checkOut);

    if (checkOutDate <= checkInDate) {
      setDateError('Check-out date must be after check-in date.');
      return;
    }

    setDateError('');
    if (onSearch) {
      onSearch({
        destination,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guests
      });
    }
  };

  return (
    <section className="hero-section" id="hero">
      {/* Background with subtle dark overlay for contrast */}
      <div className="hero-section__backdrop" />

      <Container size="lg">
        <div className="hero-section__content">
          {/* Hero Header */}
          <div className="hero-section__badge-row">
            <Badge variant="accent" size="md">
              Luxury Stays &amp; Sightseeing Add-ons
            </Badge>
            <span className="hero-section__academic-pill">BCA Capstone Project Demo</span>
          </div>

          <h1 className="hero-section__title">
            Discover Exceptional Stays &amp; Unforgettable Journeys
          </h1>
          <p className="hero-section__subtitle">
            Compare handpicked luxury resorts, heritage havelis, and seaside villas across India.
            Customize your reservation with optional guided sightseeing excursions.
          </p>

          {/* Search Form Card */}
          <div className="hero-search-card">
            <form onSubmit={handleSubmit} className="hero-search-form" noValidate>
              <div className="hero-search-form__grid">
                {/* Destination Field */}
                <div className="hero-search-form__item">
                  <Input
                    label="Destination / City"
                    id="hero-destination"
                    name="destination"
                    type="select"
                    value={destination}
                    onChange={(e) => handleCitySelect(e.target.value)}
                    icon={<MapPinIcon size={16} />}
                    options={[
                      { value: 'All', label: 'All Destinations (India)' },
                      { value: 'Goa', label: 'Goa (Beaches & Coastal)' },
                      { value: 'Jaipur', label: 'Jaipur (Heritage & Forts)' },
                      { value: 'Udaipur', label: 'Udaipur (Palaces & Lakes)' },
                      { value: 'Manali', label: 'Manali (Himalayan Retreat)' },
                      { value: 'Kerala', label: 'Kerala (Backwaters & Hills)' }
                    ]}
                    required
                  />
                </div>

                {/* Check-In Date */}
                <div className="hero-search-form__item">
                  <Input
                    label="Check-in Date"
                    id="hero-checkin"
                    name="checkIn"
                    type="date"
                    value={dates.checkIn}
                    onChange={(e) => handleDateChange('checkIn', e.target.value)}
                    min={TODAY_STR}
                    icon={<CalendarIcon size={16} />}
                    required
                  />
                </div>

                {/* Check-Out Date */}
                <div className="hero-search-form__item">
                  <Input
                    label="Check-out Date"
                    id="hero-checkout"
                    name="checkOut"
                    type="date"
                    value={dates.checkOut}
                    onChange={(e) => handleDateChange('checkOut', e.target.value)}
                    min={dates.checkIn || TODAY_STR}
                    icon={<CalendarIcon size={16} />}
                    required
                  />
                </div>

                {/* Number of Guests */}
                <div className="hero-search-form__item">
                  <Input
                    label="Guests & Rooms"
                    id="hero-guests"
                    name="guests"
                    type="select"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    icon={<UsersIcon size={16} />}
                    options={[
                      { value: '1', label: '1 Guest (1 Room)' },
                      { value: '2', label: '2 Guests (1 Room)' },
                      { value: '3', label: '3 Guests (1 Room)' },
                      { value: '4', label: '4+ Guests (2 Rooms / Suite)' }
                    ]}
                    required
                  />
                </div>
              </div>

              {/* Date Validation Alert */}
              {dateError && (
                <div className="hero-search-form__error" role="alert">
                  <AlertCircleIcon size={16} />
                  <span>{dateError}</span>
                </div>
              )}

              {/* Form Action & Quick Links */}
              <div className="hero-search-form__bottom">
                {/* Destination Quick Filters */}
                <div className="hero-search-quick">
                  <span className="hero-search-quick__label">Popular:</span>
                  {['Goa', 'Udaipur', 'Jaipur', 'Manali', 'Kerala'].map((city) => (
                    <button
                      key={city}
                      type="button"
                      className={`hero-search-quick__pill ${destination === city ? 'active' : ''}`}
                      onClick={() => handleCitySelect(city)}
                    >
                      {city}
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  icon={<SearchIcon size={18} />}
                  className="hero-search-form__submit"
                >
                  Search Accommodations
                </Button>
              </div>
            </form>
          </div>

          {/* Academic Transparency Note */}
          <p className="hero-section__demo-note">
            * Demonstration mode: Search results filter pre-configured sample hotel listings stored locally.
          </p>
        </div>
      </Container>
    </section>
  );
}
