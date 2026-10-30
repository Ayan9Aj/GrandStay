import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../Container/Container';
import Button from '../../common/Button/Button';
import { BuildingIcon } from '../../common/Icons';
import './Header.css';


/**
 * ==============================================================================
 * HEADER / NAVBAR COMPONENT
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 2: Homepage Implementation
 * ==============================================================================
 * 
 * Commercial header with branding, working navigation links to page sections,
 * prototype sign-in modal trigger, and mobile menu support.
 */
export default function Header({ onOpenSignIn, onBookStayClick, currentUser, onSignOut }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const displayName = typeof currentUser === 'object' && currentUser !== null
    ? currentUser.name
    : currentUser;

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (sectionId === 'hotels') {
      // Navigate to the Hotel Catalog page (Stage 3 route)
      navigate('/hotels');
    } else {
      // Smooth-scroll to homepage sections (Destinations, Tours, Offers, Hero)
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        // If not on homepage, navigate to homepage section
        navigate(`/#${sectionId}`);
        setTimeout(() => {
          const target = document.getElementById(sectionId);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };


  return (
    <header className="site-header">
      <Container size="lg">
        <div className="site-header__inner">
          {/* Brand Logo — clicking navigates to homepage (/) */}
          <Link
            to="/"
            className="site-header__brand"
          >

            <div className="site-header__logo-icon">
              <BuildingIcon size={22} />
            </div>
            <div className="site-header__brand-text">
              <span className="site-header__brand-title">GrandStay</span>
              <span className="site-header__brand-tagline">Hotels &amp; Resorts</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="site-header__nav" aria-label="Main Navigation">
            <ul className="site-header__menu">
              <li>
                <button
                  type="button"
                  className="site-header__link-btn"
                  onClick={() => handleNavClick('hotels')}
                >
                  Hotels &amp; Resorts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="site-header__link-btn"
                  onClick={() => handleNavClick('destinations')}
                >
                  Destinations
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="site-header__link-btn"
                  onClick={() => handleNavClick('tours')}
                >
                  Tour Packages
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="site-header__link-btn"
                  onClick={() => handleNavClick('offers')}
                >
                  Deals &amp; Offers
                </button>
              </li>
            </ul>
          </nav>

          {/* Header Action Buttons */}
          <div className="site-header__actions">
            {currentUser ? (
              <div className="site-header__user-pill">
                <span className="user-greeting">Hi, {displayName}</span>
                <Button variant="text" size="sm" onClick={onSignOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="text"
                size="sm"
                className="site-header__login-btn"
                onClick={onOpenSignIn}
              >
                Sign In
              </Button>
            )}

            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                if (onBookStayClick) onBookStayClick();
                else handleNavClick('hero');
              }}
            >
              Book a Stay
            </Button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="site-header__mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
              <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
              <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="site-header__mobile-nav">
            <ul className="site-header__mobile-menu">
              <li>
                <button
                  type="button"
                  className="site-header__mobile-link-btn"
                  onClick={() => handleNavClick('hotels')}
                >
                  Hotels &amp; Resorts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="site-header__mobile-link-btn"
                  onClick={() => handleNavClick('destinations')}
                >
                  Destinations
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="site-header__mobile-link-btn"
                  onClick={() => handleNavClick('tours')}
                >
                  Tour Packages
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="site-header__mobile-link-btn"
                  onClick={() => handleNavClick('offers')}
                >
                  Deals &amp; Offers
                </button>
              </li>
              <li className="site-header__mobile-actions">
                {currentUser ? (
                  <Button variant="outline" size="sm" fullWidth onClick={onSignOut}>
                    Sign Out ({displayName})
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenSignIn) onOpenSignIn();
                    }}
                  >
                    Sign In
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    handleNavClick('hero');
                  }}
                >
                  Book a Stay
                </Button>
              </li>
            </ul>
          </div>
        )}
      </Container>
    </header>
  );
}
