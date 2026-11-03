import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './PropertyMap.css';

export default function PropertyMap({
  hotelName = 'GrandStay Property',
  locationName = 'Location',
  coordinates = { lat: 15.5186, lng: 73.7656 },
  starRating = 5,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const lat = coordinates?.lat ?? 15.5186;
  const lng = coordinates?.lng ?? 73.7656;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy any existing map instance on container
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 14,
      scrollWheelZoom: false, // Prevent accidental scrolling when browsing page
      zoomControl: false, // We render our own clean custom control buttons
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Custom branded HTML marker
    const markerHtml = `
      <div class="property-map__marker-pulse"></div>
      <div class="property-map__marker-pin">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#D49128" stroke="#07111E" stroke-width="1.8">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/>
        </svg>
      </div>
    `;

    const customIcon = L.divIcon({
      html: markerHtml,
      className: 'property-map__custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 36],
      popupAnchor: [0, -36],
    });

    const popupContent = `
      <div class="property-map__popup-card">
        <span class="property-map__popup-rating">${'★'.repeat(Math.min(5, Math.max(1, starRating)))} GrandStay</span>
        <strong class="property-map__popup-title">${hotelName}</strong>
        <p class="property-map__popup-loc">${locationName}</p>
        <div class="property-map__popup-coords">
          <span>Lat: ${lat.toFixed(4)}°N</span>
          <span>Lng: ${lng.toFixed(4)}°E</span>
        </div>
        <a 
          href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="property-map__popup-link"
        >
          Open in Full Maps &rarr;
        </a>
      </div>
    `;

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(popupContent, { maxWidth: 280, className: 'property-map__leaflet-popup' });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, hotelName, locationName, starRating]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    mapInstanceRef.current?.flyTo([lat, lng], 14, { duration: 1 });
  };

  return (
    <div className="property-map-wrapper">
      <div className="property-map-card">
        {/* Map Header Toolbar */}
        <div className="property-map-header">
          <div className="property-map-header__info">
            <span className="property-map-header__pin-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </span>
            <div>
              <strong className="property-map-header__title">{locationName}</strong>
              <span className="property-map-header__coords">
                Coordinates: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
              </span>
            </div>
          </div>

          <div className="property-map-header__controls" aria-label="Map controls">
            <button
              type="button"
              className="property-map-ctrl-btn"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="property-map-ctrl-btn"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom out"
            >
              &minus;
            </button>
            <button
              type="button"
              className="property-map-ctrl-btn property-map-ctrl-btn--recenter"
              onClick={handleRecenter}
              aria-label="Recenter on hotel"
              title="Recenter property"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
              <span>Recenter</span>
            </button>
          </div>
        </div>

        {/* Map Interactive Canvas */}
        <div
          ref={mapContainerRef}
          className="property-map-canvas"
          role="region"
          aria-label={`Interactive map showing location of ${hotelName}`}
        />
      </div>
    </div>
  );
}
