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

  const copy = locale === 'ja' ? 'English' : '日本語';
  const nextLocale = locale === 'ja' ? 'en' : 'ja';

  return (
    <ActionButton
      copy={copy}
      onClick={() => setLocale(nextLocale)}
      className="cursorInteract"
      dropLeftPx={80}
    />
  );
};

export default LocaleActionButton;
