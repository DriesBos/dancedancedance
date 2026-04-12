'use client';

import { useStore } from '@/store/store';
import { t } from '@/lib/locale';
import ActionButton from './ActionButton';

const ScheduleActionButton = () => {
  const locale = useStore((state) => state.locale);

  return (
    <ActionButton
      copy={t('action.schedule', locale)}
      link="https://calendly.com/info-b9c/30min"
      linkType="url"
      className="cursorInteract"
      dropLeftPx={50}
      dropOnPage="about"
    />
  );
};

export default ScheduleActionButton;
