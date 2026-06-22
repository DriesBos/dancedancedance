'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/store';
import { useShallow } from 'zustand/react/shallow';
import { detectInitialLocale, persistLocale } from '@/lib/locale';

const LocaleInitializer = () => {
  const { locale, setLocale } = useStore(
    useShallow((state) => ({
      locale: state.locale,
      setLocale: state.setLocale,
    })),
  );

  useEffect(() => {
    const detected = detectInitialLocale();
    setLocale(detected);
  }, [setLocale]);

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  return null;
};

export default LocaleInitializer;
