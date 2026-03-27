
import Row from '@/components/Row';
import GrainyGradient from '@/components/GrainyGradient';
import BlokSidePanels from '@/components/BlokSidePanels';
import Link from 'next/link';

const BlokError = () => {
  return (
    <div className="page page-General page-Error">
      <section className="blok blok-Animate" aria-labelledby="not-found-title">
        <GrainyGradient variant="blok" />
        <BlokSidePanels />
        <Row>
          <div className="column column-Error">
            <span>404 — page not found</span>
            <br />
            <Link href="/" className="cursorInteract linkHyperAnimation">
              take me home
            </Link>
          </div>
        </Row>
      </section>
    </div>
  );
};

export default BlokError;
