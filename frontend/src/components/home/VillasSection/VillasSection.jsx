import Container from '../../layout/Container/Container';
import HotelCard from '../../common/HotelCard/HotelCard';
import Button from '../../common/Button/Button';
import { getAllVillas } from '../../../services/villaService';
import './VillasSection.css';

export default function VillasSection({ onViewDetails, onBookNow, onBrowseAll, onFavoriteToggle }) {
  const villas = getAllVillas().slice(0, 6);

  return (
    <section className="villas-section" id="villas" aria-labelledby="villas-section-title">
      <Container size="lg">
        <header className="villas-section__header">
          <div>
            <span className="villas-section__eyebrow">Private stays for every gathering</span>
            <h2 id="villas-section-title">Villas &amp; Bungalows</h2>
            <p>Book a whole private home, with space to settle in together.</p>
          </div>
          <Button variant="outline" onClick={onBrowseAll}>Browse all private stays</Button>
        </header>
        <div className="villas-section__grid">
          {villas.map((villa) => (
            <HotelCard
              key={villa.id}
              hotel={villa}
              pricePrefix="Whole property from"
              verticalPricePrefix="Whole property from"
              pricePeriod="/ night"
              showBookNow
              showPreview={false}
              onBookNow={onBookNow}
              onBook={onViewDetails}
              onFavoriteToggle={onFavoriteToggle}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
