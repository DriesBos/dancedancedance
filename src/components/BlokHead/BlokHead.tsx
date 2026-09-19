import GrainyGradient from '@/components/GrainyGradient/GrainyGradient';
import BlokSidePanels from '@/components/BlokSidePanels/BlokSidePanels';
import BlokHeadBehavior from './BlokHeadBehavior';
import BlokHeadRouteContentContainer from './BlokHeadRouteContentContainer';
import styles from './BlokHead.module.sass';

interface Props {
  projects: Array<{
    slug: string;
    external_link?: { cached_url: string };
  }>;
}

// Server component: the frame is static markup. BlokHeadBehavior finds it by
// class, so nothing here needs a ref or the client bundle.
const BlokHead = ({ projects }: Props) => (
  <div
    className={`${styles.blokHeadFrame} blok blok-Head blok-AnimateHead`}
    data-active="true"
  >
    <div className={styles.blokHead}>
      <GrainyGradient variant="blok" />
      <BlokHeadBehavior />
      <BlokSidePanels />
      <BlokHeadRouteContentContainer projects={projects} />
    </div>
  </div>
);

export default BlokHead;
