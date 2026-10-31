import './Badge.css';

/**
 * ==============================================================================
 * REUSABLE BADGE / PILL COMPONENT
 * ==============================================================================
 * 
 * Used for hotel ratings, amenity tags, promo badges, and status labels.
 * 
 * Props:
 * - variant: 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'neutral' (default: 'primary')
 * - size: 'sm' | 'md' (default: 'md')
 * - icon: Optional icon element
 * - children: Badge text
 * - className: Custom class name
 */
export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  className = '',
  ...rest
}) {
  const classes = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {icon && <span className="badge__icon" aria-hidden="true">{icon}</span>}
      <span className="badge__label">{children}</span>
    </span>
  );
}
