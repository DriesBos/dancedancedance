'use client';

import { useStore } from '@/store/store';
import { t } from '@/lib/locale';
import ActionButton from './ActionButton';

const ProjectActionButton = () => {
  const locale = useStore((state) => state.locale);

  return (
    <ActionButton
      copy={t('action.start', locale)}
      link="hello@driesbos.com?subject=Let's Make Internet"
      linkType="email"
      className="cursorInteract"
      dropLeftPx={20}
      dropOnPage="projects"
    />
  );
};

export default ProjectActionButton;
