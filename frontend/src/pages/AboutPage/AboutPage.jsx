import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../../components/layout/Container/Container';
import Header from '../../components/layout/Header/Header';
import Footer from '../../components/layout/Footer/Footer';
import Button from '../../components/common/Button/Button';
import SignInModal from '../../components/home/SignInModal/SignInModal';
import {
  ShieldCheckIcon,
  BuildingIcon,
  CompassIcon,
  CheckCircleIcon,
  HeadphonesIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  HeartIcon,
  CreditCardIcon,
} from '../../components/common/Icons';
import { getActiveUserSession, clearActiveUserSession } from '../../data/authSession';
import './AboutPage.css';

/**
 * ==============================================================================
 * ABOUT PAGE COMPONENT
 * Project: GrandStay - Multi-Hotel & Villa Booking Platform
 * ==============================================================================
 *
 * Professional brand overview page showcasing GrandStay's hospitality vision,
 * curated property portfolio, guest promises, technical architecture, and FAQs.
 */
export default function AboutPage() {
  const navigate = useNavigate();

  // Active user session
  const [currentUser, setCurrentUser] = useState(() => getActiveUserSession());
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  // FAQ accordion active item
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const handleSignOut = () => {
    clearActiveUserSession();
    setCurrentUser(null);
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setIsSignInOpen(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setIsSignInOpen(true);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsSignInOpen(false);
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? -1 : index));
  };

  const faqs = [
    {
      q: 'What makes GrandStay unique compared to conventional booking platforms?',
      a: 'GrandStay is a meticulously curated luxury reservation ecosystem. Unlike mass aggregators, every hotel, heritage palace, beachfront resort, and private villa in our portfolio undergoes a rigorous 50-point verification check to guarantee world-class amenities, authentic imagery, and flawless guest services.',
    },
    {
      q: 'How do hotel room bookings differ from villa whole-property rentals?',
      a: 'Hotel bookings allow room quantity selection (e.g., Deluxe Ocean View Room) with per-room guest capacity rules. Villa & bungalow bookings reserve the entire private residence exclusively for your group, giving you sole access to private pools, manicured gardens, sunken loungers, and dedicated host services.',
    },
    {
      q: 'Are rates, taxes, and cancellation policies completely transparent?',
      a: 'Yes. GrandStay enforces absolute pricing transparency. Every booking review displays an itemized financial breakdown including base tariffs, applicable GST, resort fees, and tour add-ons. Cancellation policies are explicitly stated before checkout and tracked in your My Stays account portal.',
    },
    {
      q: 'Can I add local sightseeing tours and experiences to my stay?',
      a: 'Absolutely. We offer handpicked destination experiences—such as sunset catamaran cruises in Goa, royal heritage boat rides on Udaipur lake, and heated 4x4 mountain safaris in Manali—that can be seamlessly appended to your reservation.',
    },
    {
      q: 'How do I access my official booking voucher or reach the VIP Concierge desk?',
      a: 'Once booked, your reservation appears instantly in your "My Stays" portal. From there, you can view and download official PDF/Text vouchers, inspect check-in arrival times, or connect directly with our 24/7 VIP Concierge team.',
    },
  ];

  return (
    <div className="about-page">
      <Header
        currentUser={currentUser}
        onOpenSignIn={openSignIn}
        onOpenRegister={openRegister}
        onSignOut={handleSignOut}
      />

      <main id="main-content" className="about-page__main">
        <Container size="lg">
          {/* Breadcrumb Navigation */}
          <nav className="about-page__breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="about-page__breadcrumb-separator" aria-hidden="true">›</span>
            <span className="about-page__breadcrumb-current" aria-current="page">About GrandStay</span>
          </nav>

          {/* Hero Banner */}
          <section className="about-hero">
            <div className="about-hero__content">
              <h1 className="about-hero__title">
                Curating Extraordinary Stays Across India
              </h1>
              <p className="about-hero__subtitle">
                GrandStay connects discerning travelers with handpicked luxury resorts, royal heritage palaces,
                and exclusive private villas. Enjoy transparent pricing, tailored local experiences, and 24/7 VIP concierge care.
              </p>

              <div className="about-hero__cta-group">
                <Button
                  className="about-light-blue-btn"
                  onClick={() => {
                    navigate('/hotels');
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                >
                  Explore Hotels &amp; Resorts
                  <ArrowRightIcon size={16} style={{ marginLeft: '6px' }} />
                </Button>
                <Button
                  className="about-light-blue-btn"
                  onClick={() => {
                    navigate('/villas');
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                >
                  Discover Private Villas
                </Button>
              </div>
            </div>

            {/* Quick Impact Stats */}
            <div className="about-hero__stats">
              <div className="about-stat-card">
                <span className="about-stat-card__number">150+</span>
                <span className="about-stat-card__label">Verified Luxury Stays</span>
              </div>
              <div className="about-stat-card">
                <span className="about-stat-card__number">98.4%</span>
                <span className="about-stat-card__label">Guest Satisfaction</span>
              </div>
              <div className="about-stat-card">
                <span className="about-stat-card__number">5</span>
                <span className="about-stat-card__label">Premier Destinations</span>
              </div>
              <div className="about-stat-card">
                <span className="about-stat-card__number">24 / 7</span>
                <span className="about-stat-card__label">Dedicated VIP Desk</span>
              </div>
            </div>
          </section>

          {/* Brand Story Section */}
          <section className="about-story">
            <div className="about-story__grid">
              <div className="about-story__image-wrap">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
                  alt="GrandStay luxury resort pool and courtyard"
                  className="about-story__image"
                />
                <div className="about-story__badge">
                  <ShieldCheckIcon size={20} />
                  <span>100% Verified Quality Standards</span>
                </div>
              </div>

              <div className="about-story__text">
                <span className="about-section-eyebrow">OUR PHILOSOPHY</span>
                <h2 className="about-section-title">Where Refined Elegance Meets Effortless Booking</h2>
                <p className="about-story__paragraph">
                  Founded with a vision to redefine how travelers experience India’s rich hospitality landscape,
                  GrandStay bridges the gap between legendary architectural sanctuaries and modern digital luxury.
                </p>
                <p className="about-story__paragraph">
                  Whether you seek an oceanfront cabana along Candolim Beach, a heritage palace overlooking Udaipur’s Lake Pichola,
                  or an exclusive private villa with a dedicated chef, GrandStay ensures every reservation is backed by verified details,
                  transparent billing, and uncompromised comfort.
                </p>

                <div className="about-story__highlights">
                  <div className="about-story__highlight-item">
                    <CheckCircleIcon size={18} className="about-story__check" />
                    <div>
                      <strong>Hand-Selected Quality:</strong> Every property passes our rigorous 50-point hospitality audit.
                    </div>
                  </div>
                  <div className="about-story__highlight-item">
                    <CheckCircleIcon size={18} className="about-story__check" />
                    <div>
                      <strong>Dual Booking Models:</strong> Distinct, customized reservation flows for hotel rooms and whole villas.
                    </div>
                  </div>
                  <div className="about-story__highlight-item">
                    <CheckCircleIcon size={18} className="about-story__check" />
                    <div>
                      <strong>Seamless Guest Hub:</strong> Manage upcoming stays, copy booking references, and print official vouchers.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pillars of Distinction Grid */}
          <section className="about-pillars">
            <div className="about-pillars__header">
              <span className="about-section-eyebrow">THE GRANDSTAY PROMISE</span>
              <h2 className="about-section-title">Six Pillars of Hospitality Excellence</h2>
              <p className="about-section-desc">
                We believe booking a luxury escape should be as serene and rewarding as the getaway itself.
              </p>
            </div>

            <div className="about-pillars__grid">
              <div className="about-pillar-card">
                <div className="about-pillar-card__icon">
                  <BuildingIcon size={22} />
                </div>
                <h3 className="about-pillar-card__title">Curated Accommodations</h3>
                <p className="about-pillar-card__desc">
                  From 5-star oceanfront resorts to royal heritage suites, we select properties that embody character, warmth, and architectural mastery.
                </p>
              </div>

              <div className="about-pillar-card">
                <div className="about-pillar-card__icon">
                  <HeartIcon size={22} />
                </div>
                <h3 className="about-pillar-card__title">Whole-Villa Rentals</h3>
                <p className="about-pillar-card__desc">
                  Enjoy exclusive access to private residences with private swimming pools, manicured lawns, and personal villa host greetings.
                </p>
              </div>

              <div className="about-pillar-card">
                <div className="about-pillar-card__icon">
                  <CreditCardIcon size={22} />
                </div>
                <h3 className="about-pillar-card__title">Transparent Billing</h3>
                <p className="about-pillar-card__desc">
                  Zero surprise fees. Detailed itemized estimates showing base tariffs, GST, resort fees, and instant flexible payment choices.
                </p>
              </div>

              <div className="about-pillar-card">
                <div className="about-pillar-card__icon">
                  <CompassIcon size={22} />
                </div>
                <h3 className="about-pillar-card__title">Tailored Local Add-ons</h3>
                <p className="about-pillar-card__desc">
                  Enhance your stay with optional catamaran sunset cruises, royal boat tours, and mountain safaris attached directly to your booking.
                </p>
              </div>

              <div className="about-pillar-card">
                <div className="about-pillar-card__icon">
                  <ShieldCheckIcon size={22} />
                </div>
                <h3 className="about-pillar-card__title">Guaranteed Confirmation</h3>
                <p className="about-pillar-card__desc">
                  Instant reference generation, official downloadable vouchers, and real-time status synchronization across your guest profile.
                </p>
              </div>

              <div className="about-pillar-card">
                <div className="about-pillar-card__icon">
                  <HeadphonesIcon size={22} />
                </div>
                <h3 className="about-pillar-card__title">24/7 VIP Concierge</h3>
                <p className="about-pillar-card__desc">
                  Round-the-clock assistance for airport transfer coordination, dietary preferences, celebratory setups, and stay modifications.
                </p>
              </div>
            </div>
          </section>

          {/* Featured Destinations Showcase */}
          <section className="about-destinations">
            <div className="about-destinations__header">
              <span className="about-section-eyebrow">DESTINATION SANCTUARIES</span>
              <h2 className="about-section-title">Explore India's Premier Regions</h2>
              <p className="about-section-desc">
                Handcrafted getaways in India's most iconic coastal, heritage, and alpine destinations.
              </p>
            </div>

            <div className="about-destinations__grid">
              <div
                className="about-dest-card"
                onClick={() => {
                  navigate('/hotels?destination=Goa');
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80"
                  alt="Goa Beachfront"
                  className="about-dest-card__bg"
                />
                <div className="about-dest-card__overlay">
                  <span className="about-dest-card__tag">Beachfront &amp; Nightlife</span>
                  <h3 className="about-dest-card__name">Goa</h3>
                  <p className="about-dest-card__info">Beach resorts, oceanfront cabanas &amp; private villas</p>
                </div>
              </div>

              <div
                className="about-dest-card"
                onClick={() => {
                  navigate('/hotels?destination=Udaipur');
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"
                  alt="Udaipur Lake Palace"
                  className="about-dest-card__bg"
                />
                <div className="about-dest-card__overlay">
                  <span className="about-dest-card__tag">Royal Lake Splendor</span>
                  <h3 className="about-dest-card__name">Udaipur</h3>
                  <p className="about-dest-card__info">Lakefront palaces &amp; regal courtyard suites</p>
                </div>
              </div>

              <div
                className="about-dest-card"
                onClick={() => {
                  navigate('/hotels?destination=Manali');
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80"
                  alt="Manali Alpine Chalet"
                  className="about-dest-card__bg"
                />
                <div className="about-dest-card__overlay">
                  <span className="about-dest-card__tag">Alpine Mountain Sanctuary</span>
                  <h3 className="about-dest-card__name">Manali</h3>
                  <p className="about-dest-card__info">Pine forest chalets &amp; heated spa retreats</p>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive FAQ Section */}
          <section className="about-faq">
            <div className="about-faq__header">
              <span className="about-section-eyebrow">FREQUENTLY ASKED QUESTIONS</span>
              <h2 className="about-section-title">Everything You Need to Know</h2>
              <p className="about-section-desc">
                Clear answers to common questions about GrandStay, property verification, and bookings.
              </p>
            </div>

            <div className="about-faq__list">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className={`about-faq-item ${isOpen ? 'about-faq-item--open' : ''}`}>
                    <button
                      type="button"
                      className="about-faq-item__question"
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDownIcon
                        size={18}
                        className={`about-faq-item__arrow ${isOpen ? 'about-faq-item__arrow--rotated' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="about-faq-item__answer">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bottom CTA Banner */}
          <section className="about-cta-banner">
            <div className="about-cta-banner__inner">
              <h2 className="about-cta-banner__title">
                Ready to Experience GrandStay Luxury?
              </h2>
              <p className="about-cta-banner__desc">
                Browse our handpicked portfolio of oceanfront resorts, private villas, and royal palace suites.
              </p>
              <div className="about-cta-banner__buttons">
                <Button
                  className="about-light-blue-btn"
                  size="lg"
                  onClick={() => {
                    navigate('/hotels');
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                >
                  Explore All Hotels &amp; Resorts
                </Button>
                <Button
                  className="about-light-blue-btn"
                  size="lg"
                  onClick={() => {
                    navigate('/villas');
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                >
                  Discover Private Villas
                </Button>
              </div>
            </div>
          </section>
        </Container>
      </main>

      <Footer />

      {/* Sign-in / Registration Modal */}
      <SignInModal
        key={authMode}
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
      />
    </div>
  );
}
