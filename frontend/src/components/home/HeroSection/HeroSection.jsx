import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Container from '../../layout/Container/Container';
import Button from '../../common/Button/Button';
import { SearchIcon, MapPinIcon, CalendarIcon, UsersIcon, AlertCircleIcon, CompassIcon } from '../../common/Icons';
import DateRangePicker from '../../common/DateRangePicker/DateRangePicker';
import { getDestinations } from '../../../services/hotelService';
import heroBackground from '../../../assets/brand/donald-teel-CFyJZMDyJJY-unsplash.jpg';
import './HeroSection.css';

const MAX_ROOMS = 10;
const DESTINATIONS = getDestinations();
const DESTINATION_OPTIONS = [
  { value: 'All', label: 'All Destinations (India)' },
  ...DESTINATIONS.map((city) => ({ value: city, label: city }))
];
const getDefaultDates = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const checkIn = new Date(today);
  checkIn.setDate(checkIn.getDate() + 1);
  const checkOut = new Date(today);
  checkOut.setDate(checkOut.getDate() + 3);
  const toKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { checkIn: toKey(checkIn), checkOut: toKey(checkOut) };
};

function DestinationPanel({ panelRef, searchRef, query, selected, onQueryChange, onSelect, onNearMe, nearbyMessage }) {
  const normalizedQuery = query.trim().toLowerCase();
  const matches = DESTINATION_OPTIONS.filter((option) => option.label.toLowerCase().includes(normalizedQuery));

  return (
    <div id="hero-destination-panel" ref={panelRef} className="hero-destination-panel" role="dialog" aria-label="Choose a destination">
      <button type="button" className="hero-destination-panel__nearby" onClick={onNearMe}>
        <CompassIcon size={20} />
        <span className="hero-destination-panel__nearby-copy">
          <strong>Near me</strong>
          <small>Properties around your current location</small>
        </span>
      </button>
      {nearbyMessage && <p className="hero-destination-panel__message" role="status">Nearby property search is coming soon.</p>}

      <label className="hero-destination-panel__search-label" htmlFor="hero-destination-search">Search destinations</label>
      <input
        ref={searchRef}
        id="hero-destination-search"
        className="hero-destination-panel__search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search cities"
        autoComplete="off"
      />
      <div className="hero-destination-panel__results" role="listbox" aria-label="Available destinations">
        {matches.length ? matches.map((option) => (
          <button type="button" role="option" aria-selected={selected === option.value} key={option.value} onClick={() => onSelect(option.value)}>
            <MapPinIcon size={16} />
            <span>{option.label}</span>
          </button>
        )) : <p className="hero-destination-panel__empty">No matching destinations in the current catalog.</p>}
      </div>
    </div>
  );
}

export default function HeroSection({ onSearch, selectedDestination = 'All' }) {
  const [searchType, setSearchType] = useState('hotel');
  const [dates, setDates] = useState(() => getDefaultDates());
  const [destination, setDestination] = useState(selectedDestination || 'All');
  const [prevPropDestination, setPrevPropDestination] = useState(selectedDestination);
  const [rooms, setRooms] = useState(1);
  const [dateError, setDateError] = useState('');
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [nearbyMessage, setNearbyMessage] = useState(false);
  const roomsRef = useRef(null);
  const destinationPanelRef = useRef(null);
  const destinationTriggerRef = useRef(null);
  const destinationSearchRef = useRef(null);
  const [destinationPosition, setDestinationPosition] = useState({ top: 12, left: 12, width: 320 });

  if (selectedDestination !== prevPropDestination) {
    setPrevPropDestination(selectedDestination);
    setDestination(selectedDestination || 'All');
  }

  useEffect(() => {
    if (!destinationOpen) return undefined;
    const placePanel = () => {
      const anchor = destinationTriggerRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const width = Math.min(Math.max(anchor.width, 320), window.innerWidth - 24);
      const left = Math.min(Math.max(12, anchor.left), window.innerWidth - width - 12);
      const preferredTop = anchor.bottom + 8;
      const top = preferredTop + 360 <= window.innerHeight
        ? preferredTop
        : Math.max(12, anchor.top - 368);
      setDestinationPosition({ top, left, width });
    };
    const onPointerDown = (event) => {
      if (!destinationPanelRef.current?.contains(event.target) && !destinationTriggerRef.current?.contains(event.target)) {
        setDestinationOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDestinationOpen(false);
        destinationTriggerRef.current?.focus();
      }
    };
    placePanel();
    destinationSearchRef.current?.focus();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', placePanel);
    window.addEventListener('scroll', placePanel, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', placePanel);
      window.removeEventListener('scroll', placePanel, true);
    };
  }, [destinationOpen]);

  useEffect(() => {
    if (!roomsOpen) return undefined;
    const onPointerDown = (event) => {
      if (!roomsRef.current?.contains(event.target)) setRoomsOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setRoomsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [roomsOpen]);

  const handleCitySelect = (city) => setDestination(city);

  const openDestinationPicker = (event) => {
    setRoomsOpen(false);
    destinationTriggerRef.current = event.currentTarget;
    setDestinationQuery('');
    setNearbyMessage(false);
    setDestinationOpen(true);
  };

  const selectDestination = (city) => {
    handleCitySelect(city);
    setDestinationOpen(false);
    setDestinationQuery('');
    setNearbyMessage(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!dates.checkIn || !dates.checkOut) {
      setDateError('Please select both check-in and check-out dates.');
      return;
    }
    if (dates.checkOut <= dates.checkIn) {
      setDateError('Check-out date must be after check-in date.');
      return;
    }
    setDateError('');
    onSearch?.({ searchType, destination, checkIn: dates.checkIn, checkOut: dates.checkOut, guests: String(rooms) });
  };

  const destinationPanel = destinationOpen && createPortal(
    <div style={{ position: 'fixed', top: destinationPosition.top, left: destinationPosition.left, width: destinationPosition.width, zIndex: 600 }}>
      <DestinationPanel
        panelRef={destinationPanelRef}
        searchRef={destinationSearchRef}
        query={destinationQuery}
        selected={destination}
        onQueryChange={setDestinationQuery}
        onSelect={selectDestination}
        onNearMe={() => setNearbyMessage(true)}
        nearbyMessage={nearbyMessage}
      />
    </div>,
    document.body
  );

  return (
    <section className="hero-section" id="hero">
      <div className="hero-section__backdrop" aria-hidden="true">
        <img src={heroBackground} alt="" />
      </div>

      <Container size="lg">
        <div className="hero-section__content">
          <h1 className="hero-section__title">Discover Exceptional Stays &amp; Unforgettable Journeys</h1>
          <p className="hero-section__subtitle">
            Compare handpicked luxury resorts, heritage havelis, and seaside villas across India.
            Customize your reservation with optional guided sightseeing excursions.
          </p>

          <div className="hero-search-card">
            <form onSubmit={handleSubmit} className="hero-search-form" noValidate>
              <div className="hero-search-form__grid">
                <div className="hero-search-form__item hero-stay-type">
                  <div className="hero-stay-type__options" role="group" aria-label="Stay type">
                    <button
                      type="button"
                      className={`hero-stay-type__option ${searchType === 'hotel' ? 'is-selected' : ''}`}
                      aria-pressed={searchType === 'hotel'}
                      onClick={() => setSearchType('hotel')}
                    >
                      Hotels &amp; Resorts
                    </button>
                    <button
                      type="button"
                      className={`hero-stay-type__option ${searchType === 'villa' ? 'is-selected' : ''}`}
                      aria-pressed={searchType === 'villa'}
                      onClick={() => setSearchType('villa')}
                    >
                      Villas &amp; Bungalows
                    </button>
                  </div>
                </div>

                <div className="hero-search-form__item hero-destination-field">
                  <label className="form-field__label" htmlFor="hero-destination">Destination / City</label>
                  <div className="form-field__input-wrapper">
                    <span className="form-field__icon" aria-hidden="true"><MapPinIcon size={16} /></span>
                    <button
                      ref={destinationTriggerRef}
                      type="button"
                      id="hero-destination"
                      name="destination"
                      className="form-field__control form-field__control--with-icon hero-destination-field__trigger"
                      aria-haspopup="dialog"
                      aria-controls="hero-destination-panel"
                      aria-expanded={destinationOpen}
                      onClick={openDestinationPicker}
                    >
                      {DESTINATION_OPTIONS.find((option) => option.value === destination)?.label || destination}
                    </button>
                  </div>
                </div>

                <div className="hero-search-form__item hero-search-date-range">
                  <label className="form-field__label" htmlFor="hero-date-range">Check-in / Check-out</label>
                  <div className="form-field__input-wrapper">
                    <span className="form-field__icon" aria-hidden="true"><CalendarIcon size={16} /></span>
                    <DateRangePicker
                      dates={dates}
                      onChange={(nextDates) => { setDates(nextDates); setDateError(''); }}
                      id="hero-date-range"
                      label="Check-in / Check-out"
                      triggerClassName="form-field__control form-field__control--with-icon hero-search-date-range__trigger"
                      valueClassName="hero-search-date-range__value"
                      showIcon={false}
                    />
                  </div>
                  <input type="hidden" name="checkIn" value={dates.checkIn} />
                  <input type="hidden" name="checkOut" value={dates.checkOut} />
                </div>

                <div className="hero-search-form__item" ref={roomsRef}>
                  <label className="form-field__label" htmlFor="hero-guests">Guests &amp; Rooms</label>
                  <div className="hero-room-selector">
                    <button
                      type="button"
                      id="hero-guests"
                      name="guests"
                      className="hero-room-selector__trigger"
                      aria-haspopup="dialog"
                      aria-expanded={roomsOpen}
                      aria-controls="hero-room-selector-popup"
                      aria-label={`${rooms} ${rooms === 1 ? 'room' : 'rooms'}. Change rooms`}
                      onClick={() => setRoomsOpen((current) => !current)}
                    >
                      <UsersIcon size={16} aria-hidden="true" />
                      <span>{rooms} {rooms === 1 ? 'Room' : 'Rooms'}</span>
                      <span className="hero-room-selector__chevron" aria-hidden="true">⌄</span>
                    </button>
                    {roomsOpen && (
                      <div id="hero-room-selector-popup" className="hero-room-selector__popup" role="dialog" aria-label="Choose number of rooms">
                        <span className="hero-room-selector__count">{rooms} {rooms === 1 ? 'Room' : 'Rooms'}</span>
                        <div className="hero-room-selector__controls">
                          <button
                            type="button"
                            className="hero-room-selector__step hero-room-selector__step--minus"
                            onClick={() => setRooms((current) => Math.max(1, current - 1))}
                            disabled={rooms <= 1}
                            aria-label="Decrease rooms"
                          >−</button>
                          <output aria-live="polite" aria-label="Selected rooms">{rooms}</output>
                          <button
                            type="button"
                            className="hero-room-selector__step hero-room-selector__step--plus"
                            onClick={() => setRooms((current) => Math.min(MAX_ROOMS, current + 1))}
                            disabled={rooms >= MAX_ROOMS}
                            aria-label="Increase rooms"
                          >+</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hero-search-form__submit-wrap">
                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    icon={<SearchIcon size={18} />}
                    className="hero-search-form__submit"
                  >
                    Search
                  </Button>
                </div>
              </div>

              {dateError && (
                <div className="hero-search-form__error" role="alert">
                  <AlertCircleIcon size={16} />
                  <span>{dateError}</span>
                </div>
              )}

              <input type="hidden" name="destination" value={destination} />
            </form>
          </div>
        </div>
      </Container>
      {destinationPanel}
    </section>
  );
}
