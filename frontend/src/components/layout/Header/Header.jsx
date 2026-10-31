import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../common/Button/Button';
import Logo from '../../common/Logo/Logo';
import { getAllPropertyTypes } from '../../../services/hotelService';
import './Header.css';

const getVillaPropertyTypes = () => getAllPropertyTypes()
  .filter((type) => /villa|bungalow/i.test(type));

export default function Header({ currentUser, onOpenSignIn, onOpenRegister, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
  const displayName = typeof currentUser === 'object' && currentUser !== null
    ? currentUser.name
    : currentUser;

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  const navigateToCatalog = (options = {}) => {
    const params = new URLSearchParams(location.search);
    params.delete('propertyType');
    params.delete('sortBy');
    if (options.propertyTypes?.length) {
      options.propertyTypes.forEach((type) => params.append('propertyType', type));
    } else if (options.villasOnly) {
      // An unmatched filter intentionally produces the catalog's existing empty state.
      params.append('propertyType', 'Villas & Bungalows');
    }
    if (options.sortBy) params.set('sortBy', options.sortBy);
    const query = params.toString();
    if (menuOpen) closeMenu();
    navigate(`/hotels${query ? `?${query}` : ''}`);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const scrollToHomeSection = useCallback((sectionId) => {
    const target = document.getElementById(sectionId);
    if (!target) return;
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
    const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  const goToHomeSection = (sectionId) => {
    closeMenu();
    if (location.pathname === '/') {
      scrollToHomeSection(sectionId);
      return;
    }
    navigate(`/#${sectionId}`);
  };

  useLayoutEffect(() => {
    if (location.pathname !== '/' || !location.hash) return undefined;
    const sectionId = decodeURIComponent(location.hash.slice(1));
    const frameId = window.requestAnimationFrame(() => scrollToHomeSection(sectionId));
    return () => window.cancelAnimationFrame(frameId);
  }, [location.pathname, location.hash, scrollToHomeSection]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    menuPanelRef.current?.querySelector('button, a')?.focus();

    const onPointerDown = (event) => {
      if (!menuPanelRef.current?.contains(event.target) && !menuButtonRef.current?.contains(event.target)) {
        closeMenu();
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const body = document.body;
    const originalOverflow = body.style.overflow;
    const mobileQuery = window.matchMedia('(max-width: 860px)');
    const updateScrollLock = () => {
      body.style.overflow = mobileQuery.matches ? 'hidden' : originalOverflow;
    };
    updateScrollLock();
    mobileQuery.addEventListener('change', updateScrollLock);
    return () => {
      mobileQuery.removeEventListener('change', updateScrollLock);
      body.style.overflow = originalOverflow;
    };
  }, [menuOpen]);

  const handleMenuRoute = (path, { requiresAuth = false } = {}) => {
    closeMenu();
    if (requiresAuth && !currentUser) {
      onOpenSignIn?.();
      return;
    }
    navigate(path);
  };

  const handleSignOut = () => {
    closeMenu();
    onSignOut?.();
  };

  const openSignIn = () => {
    closeMenu();
    onOpenSignIn?.();
  };

  const openRegister = () => {
    closeMenu();
    onOpenRegister?.();
  };

  const villaTypes = getVillaPropertyTypes();
  const openVillas = () => navigateToCatalog({ propertyTypes: villaTypes, villasOnly: villaTypes.length === 0 });
  const openTrendingHotels = () => handleMenuRoute('/trending-hotels');
  const openTrendingVillas = () => navigateToCatalog({ propertyTypes: villaTypes, villasOnly: villaTypes.length === 0, sortBy: 'rating-desc' });

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__left">
          <button
            ref={menuButtonRef}
            type="button"
            className="site-header__menu-toggle"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="site-navigation-panel"
            onClick={() => menuOpen ? closeMenu() : setMenuOpen(true)}
          >
            <span className={`site-header__hamburger ${menuOpen ? 'is-open' : ''}`} aria-hidden="true"><span /><span /><span /></span>
          </button>
          <nav className="site-header__nav site-header__nav--left" aria-label="Hotel categories">
            <button type="button" className="site-header__link-btn" onClick={() => navigateToCatalog()}>Hotels &amp; Resorts</button>
            <button type="button" className="site-header__link-btn" onClick={openVillas}>Villas &amp; Bungalows</button>
          </nav>
        </div>

        <Link to="/" className="site-header__brand" aria-label="GrandStay home" onClick={() => menuOpen && closeMenu()}>
          <Logo variant="icon" size={62} showWordmark={false} alt="GrandStay logo" />
        </Link>

        <div className="site-header__right">
          <nav className="site-header__nav site-header__nav--right" aria-label="Experiences">
            <button type="button" className="site-header__link-btn" onClick={() => goToHomeSection('offers')}>Deals &amp; Offers</button>
            <button type="button" className="site-header__link-btn" onClick={() => goToHomeSection('tours')}>Tours &amp; Camping Packages</button>
          </nav>
          <div className="site-header__account-actions">
            {currentUser ? (
              <>
                <span className="site-header__greeting" title={displayName}>Hi, {displayName}</span>
                <Button variant="text" size="sm" onClick={onSignOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <Button variant="text" size="sm" onClick={openSignIn}>Sign In</Button>
                <Button variant="outline" size="sm" onClick={openRegister}>Register</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav id="site-navigation-panel" ref={menuPanelRef} className="site-header__menu-panel" aria-label="Main menu">
          <div className="site-header__account">
            {currentUser ? (
              <>
                <span className="site-header__greeting">Hi, {displayName}</span>
                <Button variant="text" size="sm" onClick={handleSignOut}>Sign Out</Button>
              </>
            ) : (
              <div className="site-header__mobile-account-actions">
                <Button variant="text" size="sm" onClick={openSignIn}>Sign In</Button>
                <Button variant="outline" size="sm" onClick={openRegister}>Register</Button>
              </div>
            )}
          </div>

          <div className="site-header__mobile-links" aria-label="Browse categories">
            <button type="button" onClick={() => { closeMenu(); navigateToCatalog(); }}>Hotels &amp; Resorts</button>
            <button type="button" onClick={() => { closeMenu(); openVillas(); }}>Villas &amp; Bungalows</button>
            <button type="button" onClick={() => goToHomeSection('offers')}>Deals &amp; Offers</button>
            <button type="button" onClick={() => goToHomeSection('tours')}>Tours &amp; Camping Packages</button>
          </div>

          <ul className="site-header__panel-list">
            <li><button type="button" onClick={() => handleMenuRoute('/')}>Home</button></li>
            <li><button type="button" onClick={openTrendingHotels}>Trending Hotels &amp; Resorts</button></li>
            <li><button type="button" onClick={openTrendingVillas}>Trending Villas &amp; Bungalows</button></li>
            <li><button type="button" onClick={() => handleMenuRoute('/my-stays', { requiresAuth: true })}>My Stays</button></li>
            <li><button type="button" onClick={() => handleMenuRoute('/history', { requiresAuth: true })}>History</button></li>
            <li><button type="button" onClick={() => handleMenuRoute('/settings')}>Settings</button></li>
            <li><button type="button" onClick={() => handleMenuRoute('/about')}>About</button></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
