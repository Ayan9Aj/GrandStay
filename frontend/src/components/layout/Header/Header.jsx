import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Button from '../../common/Button/Button';
import Logo from '../../common/Logo/Logo';
import { ChevronDownIcon, HeartIcon, SearchIcon, UsersIcon } from '../../common/Icons';
import { getWishlistCount, subscribeToWishlist } from '../../../services/wishlistService';
import './Header.css';

const LANGUAGE_STORAGE_KEY = 'grandstay_language_preference';
const LANGUAGE_GROUPS = [
  {
    label: 'Popular Languages',
    languages: [
      { id: 'en-US', name: 'English (US)', nativeName: 'English (United States)', code: 'ENG', headerLabel: 'English' },
      { id: 'en-GB', name: 'English (UK)', nativeName: 'English (United Kingdom)', code: 'ENG', headerLabel: 'English (UK)' },
      { id: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', code: 'HIN', headerLabel: 'Hindi' },
      { id: 'es-ES', name: 'Spanish', nativeName: 'Español', code: 'ESP', headerLabel: 'Spanish' },
      { id: 'fr-FR', name: 'French', nativeName: 'Français', code: 'FRA', headerLabel: 'French' },
      { id: 'de-DE', name: 'German', nativeName: 'Deutsch', code: 'DEU', headerLabel: 'German' },
      { id: 'ar', name: 'Arabic', nativeName: 'العربية', code: 'ARA', headerLabel: 'Arabic' },
      { id: 'ja-JP', name: 'Japanese', nativeName: '日本語', code: 'JPN', headerLabel: 'Japanese' },
    ],
  },
  {
    label: 'Other Languages',
    languages: [
      { id: 'zh-CN', name: 'Mandarin Chinese', nativeName: '中文', code: 'ZHO', headerLabel: 'Mandarin' },
      { id: 'ru-RU', name: 'Russian', nativeName: 'Русский', code: 'RUS', headerLabel: 'Russian' },
      { id: 'pt-PT', name: 'Portuguese', nativeName: 'Português', code: 'POR', headerLabel: 'Portuguese' },
      { id: 'it-IT', name: 'Italian', nativeName: 'Italiano', code: 'ITA', headerLabel: 'Italian' },
      { id: 'ko-KR', name: 'Korean', nativeName: '한국어', code: 'KOR', headerLabel: 'Korean' },
      { id: 'bn-BD', name: 'Bengali', nativeName: 'বাংলা', code: 'BEN', headerLabel: 'Bengali' },
      { id: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', code: 'NLD', headerLabel: 'Dutch' },
      { id: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', code: 'TUR', headerLabel: 'Turkish' },
      { id: 'th-TH', name: 'Thai', nativeName: 'ไทย', code: 'THA', headerLabel: 'Thai' },
      { id: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', code: 'VIE', headerLabel: 'Vietnamese' },
      { id: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', code: 'IND', headerLabel: 'Indonesian' },
      { id: 'sv-SE', name: 'Swedish', nativeName: 'Svenska', code: 'SWE', headerLabel: 'Swedish' },
    ],
  },
];
const ALL_LANGUAGES = LANGUAGE_GROUPS.flatMap((group) => group.languages);

const getInitialLanguage = () => {
  try {
    const savedId = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return ALL_LANGUAGES.find((language) => language.id === savedId) || ALL_LANGUAGES[0];
  } catch {
    return ALL_LANGUAGES[0];
  }
};

function LanguageSelector({ selectedLanguage, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 12, left: 12 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const inputId = useId();
  const dropdownId = useId();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredGroups = LANGUAGE_GROUPS.map((group) => ({
    ...group,
    languages: group.languages.filter((language) => (
      `${language.name} ${language.nativeName} ${language.code} ${language.id}`
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    )),
  })).filter((group) => group.languages.length);

  useEffect(() => {
    if (!isOpen) return undefined;
    const positionDropdown = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;
      const width = Math.min(340, window.innerWidth - 24);
      const height = Math.min(420, window.innerHeight - 24);
      const left = Math.min(Math.max(12, trigger.right - width), window.innerWidth - width - 12);
      const below = trigger.bottom + 8;
      const top = below + height <= window.innerHeight ? below : Math.max(12, trigger.top - height - 8);
      setPosition({ top, left });
    };
    const onPointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    positionDropdown();
    searchRef.current?.focus();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', positionDropdown);
      window.removeEventListener('scroll', positionDropdown, true);
    };
  }, [isOpen]);

  const toggleDropdown = (event) => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    triggerRef.current = event.currentTarget;
    setQuery('');
    setIsOpen(true);
  };

  const selectLanguage = (language) => {
    onSelect(language);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const dropdown = isOpen && createPortal(
    <div
      id={dropdownId}
      ref={dropdownRef}
      className="site-header__language-dropdown"
      role="dialog"
      aria-label="Choose a language"
      style={{ top: position.top, left: position.left }}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <label className="site-header__language-search" htmlFor={inputId}>
        <SearchIcon size={18} />
        <input
          ref={searchRef}
          id={inputId}
          type="search"
          aria-label="Search Language"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Language"
          autoComplete="off"
        />
      </label>
      <div className="site-header__language-list">
        {filteredGroups.length ? filteredGroups.map((group) => (
          <section className="site-header__language-group" key={group.label}>
            <h2>{group.label}</h2>
            {group.languages.map((language) => (
              <button
                key={language.id}
                type="button"
                className={`site-header__language-option ${selectedLanguage.id === language.id ? 'is-selected' : ''}`}
                aria-current={selectedLanguage.id === language.id ? 'true' : undefined}
                onClick={() => selectLanguage(language)}
              >
                <span>{language.name}{!language.name.startsWith('English') && ` (${language.nativeName})`}</span>
                <strong>{language.code}</strong>
              </button>
            ))}
          </section>
        )) : (
          <p className="site-header__language-empty" role="status">No languages match your search.</p>
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="site-header__utility site-header__utility--language"
        aria-label={`Language: ${selectedLanguage.name}`}
        aria-haspopup="dialog"
        aria-controls={dropdownId}
        aria-expanded={isOpen}
        onClick={toggleDropdown}
      >
        <span className="site-header__utility-copy">
          <small>Language</small>
          <strong>{selectedLanguage.headerLabel} <ChevronDownIcon size={14} /></strong>
        </span>
      </button>
      {dropdown}
    </>
  );
}

export default function Header({ currentUser, onOpenSignIn, onOpenRegister, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(getInitialLanguage);
  const [wishlistCount, setWishlistCount] = useState(() => getWishlistCount());
  const navigate = useNavigate();
  const location = useLocation();
  const menuButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
  const displayName = typeof currentUser === 'object' && currentUser !== null
    ? currentUser.name
    : currentUser;

  useEffect(() => {
    const unsubscribe = subscribeToWishlist(({ count }) => {
      setWishlistCount(count);
    });
    return unsubscribe;
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  const openWishlist = () => {
    if (menuOpen) closeMenu();
    navigate('/wishlist');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

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

  useLayoutEffect(() => {
    if (location.pathname !== '/' || location.hash) return undefined;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return undefined;
  }, [location.pathname, location.hash]);

  const handleHomeClick = (event) => {
    setMenuOpen(false);
    if (location.pathname === '/' && !location.hash) {
      event.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

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
    const mobileQuery = window.matchMedia('(max-width: 900px)');
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

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language.id);
    } catch {
      // Keep the selection for the current page even if browser storage is unavailable.
    }
  };

  const openSignIn = () => {
    closeMenu();
    onOpenSignIn?.();
  };

  const openRegister = () => {
    closeMenu();
    onOpenRegister?.();
  };

  const openVillas = () => {
    if (menuOpen) closeMenu();
    navigate('/villas');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };
  const openTrendingHotels = () => handleMenuRoute('/trending-hotels');
  const openTrendingVillas = () => handleMenuRoute('/trending-villas');

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__left">
          <Link to="/" className="site-header__brand" aria-label="GrandStay home" onClick={() => menuOpen && closeMenu()}>
            <Logo variant="icon" size={44} showWordmark={false} alt="GrandStay logo" />
          </Link>
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
            <button type="button" className="site-header__link-btn" onClick={() => goToHomeSection('offers')}>Deals &amp; Offers</button>
            <button type="button" className="site-header__link-btn" onClick={() => goToHomeSection('tours')}>Tours &amp; Camping Packages</button>
          </nav>
        </div>

        <div className="site-header__right">
          <div className="site-header__utilities">
            <button
              type="button"
              className="site-header__utility site-header__utility--wishlist"
              aria-label={`Wishlist, ${wishlistCount} saved stay${wishlistCount === 1 ? '' : 's'}`}
              onClick={openWishlist}
            >
              <span className="site-header__wishlist-icon-wrap">
                <HeartIcon size={20} />
                {wishlistCount > 0 && (
                  <span className="site-header__wishlist-badge" aria-hidden="true">
                    {wishlistCount}
                  </span>
                )}
              </span>
              <span className="site-header__utility-copy">
                <strong>Wishlist</strong>
                <small>{wishlistCount > 0 ? `${wishlistCount} saved` : 'Save favourites'}</small>
              </span>
            </button>
            <div className="site-header__account-actions">
              {currentUser ? (
                <div className="site-header__signed-in-action">
                  <span className="site-header__avatar" aria-hidden="true"><UsersIcon size={18} /></span>
                  <span className="site-header__signed-in-copy">
                    <span>Signed in</span>
                    <strong title={displayName}>{displayName}</strong>
                  </span>
                  <Button variant="text" size="sm" onClick={onSignOut}>Sign Out</Button>
                </div>
              ) : (
                <button type="button" className="site-header__utility site-header__utility--account" onClick={openSignIn} aria-label="Login or Create Account">
                  <span className="site-header__avatar" aria-hidden="true"><UsersIcon size={18} /></span>
                  <span className="site-header__utility-copy">
                    <span>Login or</span>
                    <strong>Create Account</strong>
                  </span>
                </button>
              )}
            </div>
            <LanguageSelector selectedLanguage={selectedLanguage} onSelect={handleLanguageSelect} />
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

          <div className="site-header__menu-utilities" aria-label="Guest services">
            <LanguageSelector selectedLanguage={selectedLanguage} onSelect={handleLanguageSelect} />
          </div>

          <ul className="site-header__panel-list">
            <li><Link to="/" onClick={handleHomeClick}>Home</Link></li>
            <li><button type="button" onClick={openTrendingHotels}>Trending Hotels &amp; Resorts</button></li>
            <li><button type="button" onClick={openTrendingVillas}>Trending Villas &amp; Bungalows</button></li>
            <li><button type="button" onClick={() => handleMenuRoute('/my-stays')}>My Stays</button></li>
            <li><button type="button" onClick={() => handleMenuRoute('/history', { requiresAuth: true })}>History</button></li>
            <li><button type="button" onClick={() => handleMenuRoute('/settings')}>Settings</button></li>
            <li><button type="button" onClick={() => handleMenuRoute('/about')}>About</button></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
