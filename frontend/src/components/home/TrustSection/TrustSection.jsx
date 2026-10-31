import Container from '../../layout/Container/Container';
import {
  ShieldCheckIcon,
  CreditCardIcon,
  HeadphonesIcon,
  SparklesIcon
} from '../../common/Icons';
import './TrustSection.css';

/**
 * ==============================================================================
 * TRUST & SERVICE HIGHLIGHTS SECTION
 * Project: GrandStay - Multi-Hotel Booking Platform
 * Stage 2: Homepage Implementation
 * ==============================================================================
 * 
 * Highlights browsing, comparison, and trip-planning features.
 */
export default function TrustSection() {
  const highlights = [
    {
      icon: <ShieldCheckIcon size={26} />,
      title: 'Stays for Every Trip',
      description: 'Explore resorts, heritage stays, and coastal escapes across India.'
    },
    {
      icon: <CreditCardIcon size={26} />,
      title: 'Compare Room Options',
      description: 'Review listed room options, rates, and amenities before choosing a stay.'
    },
    {
      icon: <HeadphonesIcon size={26} />,
      title: 'Plan Your Stay',
      description: 'Choose your destination and dates, then compare properties that suit your trip.'
    },
    {
      icon: <SparklesIcon size={26} />,
      title: 'Local Experiences',
      description: 'Explore sightseeing options and select optional tours for eligible stays.'
    }
  ];

  return (
    <section className="trust-section">
      <Container size="lg">
        {/* Section Header */}
        <div className="trust-section__header">
          <span className="trust-section__eyebrow">The GrandStay Promise</span>
          <h2 className="trust-section__title">Hospitality Built on Confidence &amp; Ease</h2>
        </div>

        {/* 4 Pillars Grid */}
        <div className="trust-grid">
          {highlights.map((item, index) => (
            <div key={index} className="trust-card">
              <div className="trust-card__icon-box" aria-hidden="true">
                {item.icon}
              </div>
              <h3 className="trust-card__title">{item.title}</h3>
              <p className="trust-card__description">{item.description}</p>
            </div>
          ))}
        </div>

      </Container>
    </section>
  );
}
