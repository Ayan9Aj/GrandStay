import grandStayLogo from '../../../assets/brand/Grand Stay Luxury Hotel Logo.png';
import './Logo.css';

/**
 * ==============================================================================
 * LOGO COMPONENT
 * Project: GrandStay - Multi-Hotel Booking Platform
 * ==============================================================================
 *
 * Renders the GrandStay luxury brand logo consistently across the platform.
 *
 * Props:
 * - variant: 'icon' | 'badge' | 'full'
 *     - 'icon': Compact emblem badge (40px) designed for navbar brand and mobile headers.
 *     - 'badge': Medium square brand badge (52px) for modals and dark section blocks.
 *     - 'full': Prominent brand card (88px) displaying full emblem and wordmark for footers / portals.
 * - size: 'sm' | 'md' | 'lg' | custom number (width/height in px)
 * - showWordmark: boolean (default true) - whether to display the accompanying text.
 *                 Set to false when used in the navbar if you want the logo image only,
 *                 or true to pair with the styled typography.
 * - alt: string - accessibility label (default: "Grand Stay hotel logo")
 * - className: string - optional additional CSS classes
 */
export default function Logo({
  variant = 'icon',
  size,
  showWordmark = true,
  alt = 'Grand Stay hotel logo',
  className = ''
}) {
  // Resolve explicit pixel dimensions if requested or use variant standard sizes
  const resolvedSize = typeof size === 'number' ? size : null;

  return (
    <div
      className={`grandstay-brand grandstay-brand--${variant} ${className}`.trim()}
      style={resolvedSize ? { '--brand-custom-size': `${resolvedSize}px` } : undefined}
    >
      <div className="grandstay-brand__image-wrapper">
        <img
          src={grandStayLogo}
          alt={alt}
          width={resolvedSize || 1254}
          height={resolvedSize || 1254}
          className="grandstay-brand__img"
          loading="eager"
        />
      </div>

      {showWordmark && (
        <div className="grandstay-brand__text">
          <span className="grandstay-brand__title">GrandStay</span>
          <span className="grandstay-brand__tagline">Hotels &amp; Resorts</span>
        </div>
      )}
    </div>
  );
}
