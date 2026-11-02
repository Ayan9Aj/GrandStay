import { useEffect, useRef, useState } from 'react';
import { UsersIcon } from '../Icons';
import './GuestRoomSelector.css';

/**
 * GuestRoomSelector
 * 
 * Reusable guest and room selector following the design from the Homepage search box:
 * - Green-tinted trigger badge with UsersIcon and chevron
 * - Circular 36x36px stepper controls ([-] with soft red hover, [+] with soft green hover)
 * - Supports both popover mode (for search headers and compact bars) and inline mode (for booking forms)
 */
export default function GuestRoomSelector({
  mode = 'popover', // 'popover' | 'inline'
  id,
  label,
  value = 1,
  min = 1,
  max = 10,
  onChange,
  singularLabel = 'Room',
  pluralLabel = 'Rooms',
  subtitle,
  items, // optional array for composite items: [{ id, label, subtitle, value, min, max, onChange, singularLabel, pluralLabel }]
  icon = <UsersIcon size={16} aria-hidden="true" />,
  triggerLabel,
  className = '',
  disabled = false,
  ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close popover on click outside or Escape
  useEffect(() => {
    if (mode !== 'popover' || !isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, isOpen]);

  // Compute trigger text
  const getTriggerText = () => {
    if (triggerLabel) return triggerLabel;
    if (items && items.length > 0) {
      return items
        .map((it) => {
          const count = it.value ?? 1;
          const labelText = count === 1 ? (it.singularLabel || it.label) : (it.pluralLabel || `${it.label}s`);
          return `${count} ${labelText}`;
        })
        .join(', ');
    }
    const count = value ?? 1;
    const labelText = count === 1 ? singularLabel : pluralLabel;
    return `${count} ${labelText}`;
  };

  const renderStepper = (item) => {
    const itemVal = item.value ?? 1;
    const itemMin = item.min ?? 1;
    const itemMax = item.max ?? 10;
    const itemLabel = itemVal === 1 ? (item.singularLabel || item.label) : (item.pluralLabel || `${item.label}s`);
    const isMinusDisabled = disabled || itemVal <= itemMin;
    const isPlusDisabled = disabled || itemVal >= itemMax;

    return (
      <div key={item.id || item.label} className="guest-room-stepper-row">
        <div className="guest-room-stepper-row__label-group">
          <span className="guest-room-stepper-row__name">
            {item.label}
            {item.subtitle && <small className="guest-room-stepper-row__sub">{item.subtitle}</small>}
          </span>
          <span className="guest-room-stepper-row__summary">
            {itemVal} {itemLabel}
          </span>
        </div>

        <div className="guest-room-stepper-row__controls">
          <button
            type="button"
            className="guest-room-stepper__step guest-room-stepper__step--minus"
            onClick={() => item.onChange?.(Math.max(itemMin, itemVal - 1))}
            disabled={isMinusDisabled}
            aria-label={`Decrease ${item.label}`}
          >
            −
          </button>
          <output className="guest-room-stepper__output" aria-live="polite" aria-label={`Selected ${item.label}`}>
            {itemVal}
          </output>
          <button
            type="button"
            className="guest-room-stepper__step guest-room-stepper__step--plus"
            onClick={() => item.onChange?.(Math.min(itemMax, itemVal + 1))}
            disabled={isPlusDisabled}
            aria-label={`Increase ${item.label}`}
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const normalizedItems = items && items.length > 0
    ? items
    : [{ id: id || 'item', label: label || singularLabel, subtitle, value, min, max, onChange, singularLabel, pluralLabel }];

  // ── INLINE MODE (Directly inside booking forms) ──────────────────────────────
  if (mode === 'inline') {
    return (
      <div className={`guest-room-selector guest-room-selector--inline ${className}`} ref={containerRef}>
        {normalizedItems.map((item) => renderStepper(item))}
      </div>
    );
  }

  // ── POPOVER MODE (Trigger button + floating popover) ────────────────────────
  const triggerId = id || 'guest-room-trigger';
  const popupId = `${triggerId}-popup`;

  return (
    <div className={`guest-room-selector guest-room-selector--popover ${className}`} ref={containerRef}>
      <button
        type="button"
        id={triggerId}
        className="guest-room-selector__trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popupId}
        aria-label={ariaLabel || `${getTriggerText()}. Change selection`}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {icon}
        <span className="guest-room-selector__trigger-text">{getTriggerText()}</span>
        <span className="guest-room-selector__chevron" aria-hidden="true">⌄</span>
      </button>

      {isOpen && (
        <div id={popupId} className="guest-room-selector__popup" role="dialog" aria-label={label || 'Guest and room selector'}>
          {normalizedItems.map((item) => renderStepper(item))}
        </div>
      )}
    </div>
  );
}
