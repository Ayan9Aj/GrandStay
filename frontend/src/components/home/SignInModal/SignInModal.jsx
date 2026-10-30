import { useState, useEffect, useRef, useCallback } from 'react';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';
import Badge from '../../common/Badge/Badge';
import { CloseIcon, BuildingIcon, CheckCircleIcon, EyeIcon, EyeOffIcon } from '../../common/Icons';
import { registerPrototypeUser, loginPrototypeUser } from '../../../data/authSession';
import './SignInModal.css';

/**
 * ==============================================================================
 * SIGN IN & ACCOUNT PORTAL PROTOTYPE MODAL
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 2: Homepage Implementation
 * ==============================================================================
 * 
 * Provides an accessible login & registration dialog prototype.
 * Features:
 * - Full Name, Email, Password inputs with clear (x) buttons
 * - Password visibility eye toggle with 5-second auto-hide timer
 * - Prototype user registry with persistent session support
 * - Accessible close button optimized for mobile touch targets
 */
export default function SignInModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordTimerRef = useRef(null);

  const clearPasswordTimer = () => {
    if (passwordTimerRef.current) {
      clearTimeout(passwordTimerRef.current);
      passwordTimerRef.current = null;
    }
  };

  const handleTogglePassword = () => {
    if (showPassword) {
      clearPasswordTimer();
      setShowPassword(false);
    } else {
      setShowPassword(true);
      clearPasswordTimer();
      passwordTimerRef.current = setTimeout(() => {
        setShowPassword(false);
        passwordTimerRef.current = null;
      }, 5000);
    }
  };

  const handleClose = useCallback(() => {
    clearPasswordTimer();
    setShowPassword(false);
    onClose();
  }, [onClose]);

  const handleToggleMode = () => {
    clearPasswordTimer();
    setShowPassword(false);
    setIsRegister((prev) => !prev);
  };

  // Clear auto-hide timer on unmount
  useEffect(() => {
    return () => clearPasswordTimer();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    const userObj = isRegister
      ? registerPrototypeUser(fullName, email)
      : loginPrototypeUser(email);

    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess(userObj);
      }
      setSubmitted(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="signin-modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="signin-modal-title">
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="signin-modal__close-btn"
          onClick={handleClose}
          aria-label="Close authentication modal"
        >
          <CloseIcon size={20} />
        </button>

        {/* Modal Brand Header */}
        <div className="signin-modal__brand">
          <div className="signin-modal__logo-box">
            <BuildingIcon size={24} />
          </div>
          <Badge variant="accent" size="sm">
            Prototype Portal
          </Badge>
          <h2 id="signin-modal-title" className="signin-modal__title">
            {isRegister ? 'Create Your GrandStay Account' : 'Welcome Back to GrandStay'}
          </h2>
          <p className="signin-modal__subtitle">
            {isRegister
              ? 'Join to unlock exclusive member rates and manage stays.'
              : 'Sign in to access your hotel bookings and saved wishlists.'}
          </p>
        </div>

        {/* Form Body */}
        {submitted ? (
          <div className="signin-modal__success">
            <CheckCircleIcon size={36} className="signin-success-icon" />
            <h3>{isRegister ? 'Account Registered!' : 'Successfully Signed In!'}</h3>
            <p>Welcome back! Connecting session prototype...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="signin-modal__form">
            {isRegister && (
              <Input
                label="Full Name"
                id="reg-name"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                isClearable
                onClear={() => setFullName('')}
                clearAriaLabel="Clear full name field"
              />
            )}

            <Input
              label="Email Address"
              id="auth-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guest@example.com"
              required
              isClearable
              onClear={() => setEmail('')}
              clearAriaLabel="Clear email field"
            />

            <Input
              label="Password"
              id="auth-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              isClearable
              onClear={() => setPassword('')}
              clearAriaLabel="Clear password field"
              suffixAction={
                <button
                  type="button"
                  className="form-field__suffix-action-btn"
                  onClick={handleTogglePassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password for 5 seconds'}
                  title={showPassword ? 'Hide password' : 'Show password for 5 seconds'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              }
            />

            <div className="signin-modal__options">
              <label className="remember-me-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="forgot-pass-btn"
                onClick={() => alert('Password reset flow planned for Django backend integration stage.')}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
            >
              {isRegister ? 'Create Account' : 'Sign In to GrandStay'}
            </Button>

            {/* Toggle Sign In / Register */}
            <div className="signin-modal__toggle">
              <span>{isRegister ? 'Already have an account?' : "Don't have an account yet?"}</span>
              <button
                type="button"
                className="toggle-link-btn"
                onClick={handleToggleMode}
              >
                {isRegister ? 'Sign In' : 'Register Here'}
              </button>
            </div>
          </form>
        )}

        {/* Academic Project Disclaimer */}
        <div className="signin-modal__academic-note">
          <span>
            * <strong>Backend Architecture Preview:</strong> Real user authentication with hashed MySQL passwords and JWT tokens will be deployed when Django REST Framework is configured in later stages.
          </span>
        </div>
      </div>
    </div>
  );
}
