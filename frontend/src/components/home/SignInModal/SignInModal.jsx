import { useState, useEffect, useRef, useCallback } from 'react';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';
import { CloseIcon, CheckCircleIcon, EyeIcon, EyeOffIcon } from '../../common/Icons';
import Logo from '../../common/Logo/Logo';
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
export default function SignInModal({ isOpen, onClose, onLoginSuccess, initialMode = 'signin' }) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
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
      <div className={`signin-modal ${isRegister ? 'signin-modal--register' : ''}`} onClick={(e) => e.stopPropagation()}>
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
        <div className={`signin-modal__brand ${isRegister ? 'signin-modal__brand--register' : ''}`}>
          {!isRegister && (
            <div className="signin-modal__logo-box">
              <Logo variant="badge" showWordmark={false} alt="GrandStay official brand emblem" />
            </div>
          )}
          <h2 id="signin-modal-title" className="signin-modal__title">
            {isRegister ? 'Create Account' : 'Welcome Back to GrandStay'}
          </h2>
          {!isRegister && <p className="signin-modal__subtitle">Welcome back. Sign in to continue to your account.</p>}
        </div>

        {/* Form Body */}
        {submitted ? (
          <div className="signin-modal__success">
            <CheckCircleIcon size={36} className="signin-success-icon" />
            <h3>{isRegister ? 'Account Registered!' : 'Successfully Signed In!'}</h3>
            <p>Your account is saved on this device.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="signin-modal__form">
            {isRegister && (
              <Input
                label="Name"
                id="reg-name"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Name"
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
              placeholder={isRegister ? 'Email' : 'guest@example.com'}
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
              placeholder={isRegister ? 'Password' : '••••••••'}
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

            {!isRegister && (
              <div className="signin-modal__options">
                <label className="remember-me-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="forgot-pass-btn"
                  onClick={() => alert('Password reset is not available yet.')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
            >
              {isRegister ? <>Sign Up <span aria-hidden="true">↗</span></> : 'Sign In to GrandStay'}
            </Button>

            {isRegister && (
              <div className="signin-modal__alternative-signup">
                <div className="signin-modal__divider" aria-hidden="true"><span>or</span></div>
                <button type="button" className="signin-modal__social-button" disabled>
                  <span className="signin-modal__social-mark" aria-hidden="true">G</span>
                  Continue with Google
                </button>
              </div>
            )}

            {/* Toggle Sign In / Register */}
            <div className="signin-modal__toggle">
              <span>{isRegister ? 'Already have an account?' : "Don't have an account yet?"}</span>
              <button
                type="button"
                className="toggle-link-btn"
                onClick={handleToggleMode}
              >
                {isRegister ? 'Login' : 'Register Here'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
