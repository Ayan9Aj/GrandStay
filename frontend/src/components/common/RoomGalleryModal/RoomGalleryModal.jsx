import { useEffect, useState } from 'react';
import './RoomGalleryModal.css';

function RoomGalleryContent({
  onClose,
  roomName,
  hotelName,
  images,
  initialIndex,
}) {
  const validImages = Array.isArray(images) && images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = useState(() =>
    Number.isInteger(initialIndex) && initialIndex >= 0 && initialIndex < validImages.length ? initialIndex : 0
  );
  const [failedIndices, setFailedIndices] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (validImages.length ? (prev + 1) % validImages.length : 0));
      }
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (validImages.length ? (prev - 1 + validImages.length) % validImages.length : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [validImages.length, onClose]);

  const currentImage = validImages[activeIndex];
  const isFailed = failedIndices.includes(activeIndex);

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (validImages.length ? (prev - 1 + validImages.length) % validImages.length : 0));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (validImages.length ? (prev + 1) % validImages.length : 0));
  };

  const handleImageError = () => {
    setFailedIndices((prev) => (prev.includes(activeIndex) ? prev : [...prev, activeIndex]));
  };

  return (
    <div
      className="room-gallery-modal__backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${roomName} photo gallery`}
    >
      <div className="room-gallery-modal__container" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <header className="room-gallery-modal__header">
          <div className="room-gallery-modal__title-wrap">
            <span className="room-gallery-modal__eyebrow">Room Photo Gallery · {hotelName}</span>
            <h2 className="room-gallery-modal__title">{roomName}</h2>
          </div>
          <div className="room-gallery-modal__actions">
            <span className="room-gallery-modal__counter" aria-live="polite">
              {validImages.length ? `${activeIndex + 1} / ${validImages.length}` : '0 / 0'}
            </span>
            <button
              type="button"
              className="room-gallery-modal__close-btn"
              onClick={onClose}
              aria-label="Close photo gallery"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Stage */}
        <div className="room-gallery-modal__stage">
          {validImages.length > 1 && (
            <button
              type="button"
              className="room-gallery-modal__nav-btn room-gallery-modal__nav-btn--prev"
              onClick={handlePrev}
              aria-label="Previous room photo"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <div className="room-gallery-modal__viewport">
            {validImages.length === 0 ? (
              <div className="room-gallery-modal__fallback">
                <p>No photos are currently available for this room category.</p>
              </div>
            ) : isFailed ? (
              <div className="room-gallery-modal__fallback">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p>Photo temporarily unavailable</p>
                <span>{roomName}</span>
              </div>
            ) : (
              <img
                src={currentImage}
                alt={`${roomName} view ${activeIndex + 1}`}
                className="room-gallery-modal__image"
                onError={handleImageError}
              />
            )}
          </div>

          {validImages.length > 1 && (
            <button
              type="button"
              className="room-gallery-modal__nav-btn room-gallery-modal__nav-btn--next"
              onClick={handleNext}
              aria-label="Next room photo"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnail Filmstrip */}
        {validImages.length > 1 && (
          <footer className="room-gallery-modal__filmstrip" aria-label="Room photo thumbnails">
            {validImages.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                className={`room-gallery-modal__thumb ${idx === activeIndex ? 'room-gallery-modal__thumb--active' : ''}`}
                onClick={() => setActiveIndex(idx)}
                aria-label={`View photo ${idx + 1} of ${validImages.length}`}
                aria-current={idx === activeIndex ? 'true' : 'false'}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} loading="lazy" />
              </button>
            ))}
          </footer>
        )}
      </div>
    </div>
  );
}

export default function RoomGalleryModal(props) {
  if (!props.isOpen) return null;
  return <RoomGalleryContent {...props} />;
}
