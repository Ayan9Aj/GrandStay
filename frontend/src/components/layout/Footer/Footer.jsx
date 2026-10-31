import Container from '../Container/Container';
import Logo from '../../common/Logo/Logo';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * ==============================================================================
 * FOOTER COMPONENT
 * ==============================================================================
 * 
 * Provides a concise brand summary and site navigation.
 */
export default function Footer() {

  return (
    <footer className="site-footer">
      <Container size="lg">
        <div className="site-footer__grid">
          {/* Brand Column */}
          <div className="site-footer__brand-col">
            <div className="site-footer__brand">
              <Logo variant="full" className="grandstay-brand--inverse" showWordmark={true} />
            </div>
            <p className="site-footer__brand-desc">
              Explore luxury resorts, heritage stays, and seaside villas. Compare room options and discover optional local experiences.
            </p>
          </div>

          {/* Quick Links */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">Quick Explore</h4>
            <ul className="site-footer__links">
              <li><a href="#hotels">Browse Hotels</a></li>
              <li><a href="#destinations">Popular Destinations</a></li>
              <li><a href="#tours">Sightseeing Packages</a></li>
              <li><a href="#offers">Seasonal Promotions</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="site-footer__bottom">
          <p>&copy; {CURRENT_YEAR} GrandStay Hotel Booking Platform</p>
          <div className="site-footer__bottom-links">
            <a href="#privacy">Privacy Policy</a>
            <span>&bull;</span>
            <a href="#terms">Terms of Service</a>
            <span>&bull;</span>
            <a href="#support">Support</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
