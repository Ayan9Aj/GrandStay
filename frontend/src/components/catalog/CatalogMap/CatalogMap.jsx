import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CatalogMap.css';

export default function CatalogMap({ hotels = [], onSelectHotel }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [15.5186, 73.7656],
      zoom: 12,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    if (!hotels || hotels.length === 0) return;

    const bounds = L.latLngBounds([]);

    hotels.forEach((hotel) => {
      const lat = hotel.coordinates?.lat ?? 15.5186;
      const lng = hotel.coordinates?.lng ?? 73.7656;
      bounds.extend([lat, lng]);

      const formattedPrice = `${hotel.currency || '₹'}${hotel.pricePerNight?.toLocaleString() || ''}`;

      const markerHtml = `
        <div class="catalog-map__price-pin">
          <span class="catalog-map__price-text">${formattedPrice}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'catalog-map__custom-marker-wrapper',
        iconSize: [76, 32],
        iconAnchor: [38, 16],
        popupAnchor: [0, -18],
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'catalog-map__popup-card';
      popupContent.innerHTML = `
        <div class="catalog-map__popup-thumb">
          <img src="${hotel.image}" alt="${hotel.name}" />
        </div>
        <div class="catalog-map__popup-body">
          <div class="catalog-map__popup-rating">
            ★ ${hotel.rating} <span class="catalog-map__popup-reviews">(${hotel.reviewCount})</span>
          </div>
          <h4 class="catalog-map__popup-title">${hotel.name}</h4>
          <p class="catalog-map__popup-loc">📍 ${hotel.location}</p>
          <div class="catalog-map__popup-footer">
            <span class="catalog-map__popup-price">${formattedPrice} <small>/ night</small></span>
            <button type="button" class="catalog-map__popup-btn" id="popup-btn-${hotel.id}">View Details</button>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(popupContent, { maxWidth: 260, className: 'catalog-map__leaflet-popup' });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${hotel.id}`);
        if (btn && onSelectHotel) {
          btn.onclick = () => onSelectHotel(hotel);
        }
      });

      markersRef.current[hotel.id] = marker;
    });

    if (hotels.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [hotels, onSelectHotel]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (!hotels.length || !mapInstanceRef.current) return;
    const bounds = L.latLngBounds(hotels.map((h) => [h.coordinates?.lat ?? 15.5186, h.coordinates?.lng ?? 73.7656]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  };

  return (
    <div className="catalog-map-wrapper">
      <div className="catalog-map-header">
        <div className="catalog-map-header__left">
          <span className="catalog-map-header__title">
            Interactive Map View — Showing {hotels.length} {hotels.length === 1 ? 'property' : 'properties'}
          </span>
          <span className="catalog-map-header__sample-tag">
            Sample coordinates for orientation reference
          </span>
        </div>
        <div className="catalog-map-header__controls">
          <button type="button" className="catalog-map-ctrl-btn" onClick={handleZoomIn} title="Zoom In">+</button>
          <button type="button" className="catalog-map-ctrl-btn" onClick={handleZoomOut} title="Zoom Out">&minus;</button>
          <button type="button" className="catalog-map-ctrl-btn catalog-map-ctrl-btn--recenter" onClick={handleRecenter} title="Recenter properties">
            Recenter
          </button>
        </div>
      </div>
      <div ref={mapContainerRef} className="catalog-map-canvas" role="region" aria-label="Interactive map of hotel search results" />
    </div>
  );
}
