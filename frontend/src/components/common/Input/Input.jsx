import { CloseIcon } from '../Icons';
import './Input.css';

/**
 * ==============================================================================
 * REUSABLE FORM INPUT / SELECT COMPONENT
 * ==============================================================================
 * 
 * Accessible form field supporting standard text, email, dates, numbers,
 * select dropdowns, prefix icons, suffix actions (e.g. password eye),
 * clear buttons (x), and real-time error states.
 * 
 * Props:
 * - label: Text label shown above input
 * - id: Unique ID linking label to input for accessibility
 * - name: Field name
 * - type: 'text' | 'email' | 'number' | 'date' | 'select' | 'password' (default: 'text')
 * - value: Controlled input value
 * - onChange: Change event handler
 * - placeholder: Placeholder text
 * - error: Error message string (turns border red and announces issue)
 * - helperText: Informational helper text below input
 * - required: Boolean
 * - disabled: Boolean
 * - icon: Optional prefix icon element
 * - options: Array of { value, label } for type='select'
 * - className: Additional container CSS class
 * - isClearable: Boolean - shows subtle clear button when field has text
 * - onClear: Optional custom clear handler (defaults to onChange with empty string)
 * - clearAriaLabel: Accessible description for clear button
 * - suffixAction: Optional suffix action element (e.g. password toggle eye)
 */
export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon = null,
  options = [],
  className = '',
  isClearable = false,
  onClear = null,
  clearAriaLabel = '',
  suffixAction = null,
  ...rest
}) {
  const inputId = id || name;
  const isSelect = type === 'select';
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const showClearButton = !isSelect && !disabled && isClearable && hasValue;

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  const hasSuffixControls = showClearButton || Boolean(suffixAction);
  const hasDoubleSuffix = showClearButton && Boolean(suffixAction);

  const containerClasses = [
    'form-field',
    error ? 'form-field--error' : '',
    disabled ? 'form-field--disabled' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const controlClasses = [
    'form-field__control',
    icon ? 'form-field__control--with-icon' : '',
    hasDoubleSuffix
      ? 'form-field__control--with-double-suffix'
      : hasSuffixControls
      ? 'form-field__control--with-suffix'
      : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="form-field__label">
          {label}
          {required && <span className="form-field__required" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="form-field__input-wrapper">
        {icon && (
          <span className="form-field__icon" aria-hidden="true">
            {icon}
          </span>
        )}

        {isSelect ? (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={controlClasses}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={controlClasses}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
            {...rest}
          />
        )}

        {hasSuffixControls && (
          <div className="form-field__suffix-actions">
            {showClearButton && (
              <button
                type="button"
                className="form-field__clear-btn"
                onClick={handleClear}
                aria-label={clearAriaLabel || `Clear ${label || name || 'input'}`}
                title={clearAriaLabel || `Clear ${label || name || 'input'}`}
                tabIndex={0}
              >
                <CloseIcon size={14} />
              </button>
            )}
            {suffixAction}
          </div>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="form-field__message form-field__message--error" role="alert">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${inputId}-help`} className="form-field__message form-field__message--helper">
          {helperText}
        </p>
      )}
    </div>
  );
}
