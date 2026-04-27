'use client';

import { useStore } from '@/store/store';
import { useShallow } from 'zustand/react/shallow';
import ActionButton from './ActionButton';

const LocaleActionButton = () => {
  const { locale, setLocale } = useStore(
    useShallow((state) => ({
      locale: state.locale,
      setLocale: state.setLocale,
    })),
  );

  if (locale !== 'ja') return null;

  return (
    <ActionButton
      copy="English"
      onClick={() => setLocale('en')}
      className="cursorInteract"
      dropLeftPx={80}
    />
  );
};

export default LocaleActionButton;
