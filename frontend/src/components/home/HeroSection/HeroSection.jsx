import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Container from '../../layout/Container/Container';
import Button from '../../common/Button/Button';
import { SearchIcon, MapPinIcon, CalendarIcon, AlertCircleIcon, CompassIcon } from '../../common/Icons';
import DateRangePicker from '../../common/DateRangePicker/DateRangePicker';
import GuestRoomSelector from '../../common/GuestRoomSelector/GuestRoomSelector';
import heroBackground from '../../../assets/brand/donald-teel-CFyJZMDyJJY-unsplash.jpg';
import './HeroSection.css';

import { DESTINATION_SUGGESTIONS } from '../../../data/sampleDestinations';

const MAX_ROOMS = 10;

const ALL_OPTION = { id: 'all', name: 'All Destinations (India)', category: 'Cities', type: 'city', parentCity: 'All', subtitle: 'All locations' };
const SUGGESTION_POOL = [
  ALL_OPTION,
  ...DESTINATION_SUGGESTIONS
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
  const matches = SUGGESTION_POOL.filter((item) =>
    item.name.toLowerCase().includes(normalizedQuery) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(normalizedQuery)) ||
    item.parentCity.toLowerCase().includes(normalizedQuery)
  );

  const categories = ['Cities', 'Regions', 'Landmarks', 'Airports & Transit'];
  const groupedMatches = categories.reduce((acc, cat) => {
    const items = matches.filter((m) => m.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

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

      <label className="hero-destination-panel__search-label" htmlFor="hero-destination-search">Search destinations, landmarks or airports</label>
      <input
        ref={searchRef}
        id="hero-destination-search"
        className="hero-destination-panel__search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search cities, landmarks, airports..."
        autoComplete="off"
      />
      <div className="hero-destination-panel__results" role="listbox" aria-label="Available destinations">
        {Object.keys(groupedMatches).length ? (
          Object.entries(groupedMatches).map(([category, items]) => (
            <div key={category} className="hero-destination-panel__group">
              <span className="hero-destination-panel__group-header">{category}</span>
              {items.map((item) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={selected === item.parentCity || selected === item.name}
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="hero-destination-panel__option-btn"
                >
                  <MapPinIcon size={16} />
                  <div className="hero-destination-panel__option-text">
                    <strong>{item.name}</strong>
                    {item.subtitle && <small>{item.subtitle}</small>}
                  </div>
                </button>
              ))}
            </div>
          ))
        ) : (
          <p className="hero-destination-panel__empty">No matching destinations in the current catalog.</p>
        )}
      </div>
    </div>
  );
}

export default function HeroSection({ onSearch, selectedDestination = 'All' }) {
  const [searchType, setSearchType] = useState('hotel');
  const [dates, setDates] = useState(() => getDefaultDates());
  const [destination, setDestination] = useState(selectedDestination || 'All');
  const [selectedLandmark, setSelectedLandmark] = useState('');
  const [displayLabel, setDisplayLabel] = useState(selectedDestination || 'All');
  const [prevPropDestination, setPrevPropDestination] = useState(selectedDestination);
  const [rooms, setRooms] = useState(1);
  const [dateError, setDateError] = useState('');
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [nearbyMessage, setNearbyMessage] = useState(false);
  const destinationPanelRef = useRef(null);
  const destinationTriggerRef = useRef(null);
  const destinationSearchRef = useRef(null);
  const [destinationPosition, setDestinationPosition] = useState({ top: 12, left: 12, width: 320 });

  if (selectedDestination !== prevPropDestination) {
    setPrevPropDestination(selectedDestination);
    setDestination(selectedDestination || 'All');
    setDisplayLabel(selectedDestination || 'All');
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

  const openDestinationPicker = (event) => {
    destinationTriggerRef.current = event.currentTarget;
    setDestinationQuery('');
    setNearbyMessage(false);
    setDestinationOpen(true);
  };

  const selectDestinationItem = (item) => {
    // Resolve landmark or airport to parentCity while keeping landmark parameter
    if (item.type === 'landmark' || item.type === 'airport') {
      setDestination(item.parentCity);
      setSelectedLandmark(item.name);
      setDisplayLabel(`${item.name} (${item.parentCity})`);
    } else {
      setDestination(item.parentCity);
      setSelectedLandmark('');
      setDisplayLabel(item.name);
    }
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
    onSearch?.({
      searchType,
      destination,
      landmark: selectedLandmark,
      checkIn: dates.checkIn,
      checkOut: dates.checkOut,
      guests: String(rooms)
    });
  };

  const destinationPanel = destinationOpen && createPortal(
    <div style={{ position: 'fixed', top: destinationPosition.top, left: destinationPosition.left, width: destinationPosition.width, zIndex: 600 }}>
      <DestinationPanel
        panelRef={destinationPanelRef}
        searchRef={destinationSearchRef}
        query={destinationQuery}
        selected={destination}
        onQueryChange={setDestinationQuery}
        onSelect={selectDestinationItem}
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
                      {displayLabel}
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

                <div className="hero-search-form__item">
                  <label className="form-field__label" htmlFor="hero-guests">Guests &amp; Rooms</label>
                  <GuestRoomSelector
                    id="hero-guests"
                    value={rooms}
                    min={1}
                    max={MAX_ROOMS}
                    onChange={setRooms}
                    singularLabel="Room"
                    pluralLabel="Rooms"
                  />
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
